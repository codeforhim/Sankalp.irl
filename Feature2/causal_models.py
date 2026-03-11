import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier

try:
    from .data_models import FEATURE_COLS, TREATMENT_COLS, OUTCOME_COL
except ImportError:
    from data_models import FEATURE_COLS, TREATMENT_COLS, OUTCOME_COL


def safe_proba_positive(model, input_data):
    """
    Returns P(Y=1) for binary classifiers, robust to degenerate 1-class cases.
    If predict_proba has shape (n, 1), we infer whether that column behaves
    like class 1 or class 0 by its mean.
    """
    proba = model.predict_proba(input_data)
    if proba.shape[1] == 1:
        # Single column: treat as all-ones or all-zeros depending on mean.
        return np.ones(len(input_data)) if proba[:, 0].mean() > 0.5 else np.zeros(len(input_data))
    else:
        return proba[:, 1]


class CausalModel:
    def __init__(self):
        self.model = None
        self.feature_names = None

    def train(self, X, T, Y):
        """
        Trains an S-Learner (Single Learner) to estimate outcomes conditional on X and T.

        X: DataFrame of Covariates
        T: DataFrame of Treatments
        Y: Series of Outcome
        """
        # Combine X and T for S-Learner
        train_data = pd.concat([X, T], axis=1)
        self.feature_names = train_data.columns.tolist()

        # Using RandomForestClassifier as a robust fallback for LightGBM
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            n_jobs=-1,
            random_state=42
        )

        self.model.fit(train_data, Y)
        print("Causal Model (S-Learner - RandomForest) trained.")

    def predict_baseline(self, X):
        """
        Predicts p(Y=1) assuming NO treatments (T=0).
        """
        if self.model is None:
            raise ValueError("Model not trained")

        # Create T=0 dataframe with all treatment columns (including nrega_program)
        T_zero = pd.DataFrame(0, index=X.index, columns=TREATMENT_COLS)
        input_data = pd.concat([X, T_zero], axis=1)

        # Ensure column order matches training
        input_data = input_data[self.feature_names]

        return safe_proba_positive(self.model, input_data)

    def predict_uplift(self, X, treatment_name, treatment_value):
        """
        Estimates the Causal Uplift (HTE) of a specific intervention vs Baseline (T=0).

        HTE = P(Y=1 | X, T=treatment_value) - P(Y=1 | X, T=0)
        """
        if self.model is None:
            raise ValueError("Model not trained")

        # Baseline (T=0)
        p_baseline = self.predict_baseline(X)

        # Intervention (T_k = val, others = 0)
        T_intervention = pd.DataFrame(0, index=X.index, columns=TREATMENT_COLS)
        T_intervention[treatment_name] = treatment_value

        input_data = pd.concat([X, T_intervention], axis=1)
        input_data = input_data[self.feature_names]

        p_treated = safe_proba_positive(self.model, input_data)

        return p_treated - p_baseline

    def get_feature_importance(self):
        return dict(zip(self.feature_names, self.model.feature_importances_))
