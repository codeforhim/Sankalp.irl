import pandas as pd
import itertools
from .data_models import VALID_TREATMENT_LEVELS, TREATMENT_COLS


class CounterfactualGenerator:
    def __init__(self, causal_model, allowed_policies=None, duration=1):
        """
        allowed_policies: list of strings, e.g. ['cash_transfer', 'food_subsidy']
        duration: int, multiplier for cost (months)
        """
        self.causal_model = causal_model
        self.duration = duration

        # Filter Logic
        all_keys = list(VALID_TREATMENT_LEVELS.keys())
        if allowed_policies is not None:
            for p in allowed_policies:
                if p not in all_keys:
                    raise ValueError(f"Unknown policy: {p}")
            self.active_policies = allowed_policies
        else:
            self.active_policies = all_keys

        # Construct combinations
        keys = all_keys
        values = []
        for k in keys:
            if k in self.active_policies:
                values.append(VALID_TREATMENT_LEVELS[k])
            else:
                values.append([0])

        self.combinations = [dict(zip(keys, v)) for v in itertools.product(*values)]
        self.baseline_combo = {k: 0 for k in keys}

    def _estimate_cost(self, combo):
        """
        Estimates cost of a specific treatment combination.
        Adjusted for Duration.
        """
        monthly_cost = 0
        monthly_cost += combo.get('cash_transfer', 0)
        monthly_cost += combo.get('food_subsidy', 0)

        total_cost = monthly_cost * self.duration

        if combo.get('training_program', 0) > 0:
            total_cost += 2000  # one-time fixed cost

        return total_cost

    def generate_candidates_for_household(self, household_row):
        """
        Generates all feasible counterfactuals for a single household.
        Returns DataFrame with treatment combos, uplift, cost, and predicted prob.
        """

        n_combos = len(self.combinations)

        if isinstance(household_row, pd.Series):
            household_df = household_row.to_frame().T
        else:
            household_df = household_row

        # 🔑 Step 2: read past intervention history
        months_since = household_df['months_since_treatment'].iloc[0]
        diminishing_factor = 1 / (1 + months_since)

        # Replicate X
        X_repeated = pd.concat([household_df] * n_combos, ignore_index=True)

        # Treatment combinations
        T_matrix = pd.DataFrame(self.combinations)
        T_matrix = T_matrix[TREATMENT_COLS]

        input_data = pd.concat(
            [X_repeated.reset_index(drop=True), T_matrix.reset_index(drop=True)],
            axis=1
        )

        # Align columns
        input_data = input_data[self.causal_model.feature_names]

        # Predict probabilities
        probs = self.causal_model.model.predict_proba(input_data)[:, 1]

        results = T_matrix.copy()
        results['model_pred_prob'] = probs

        # Cost
        results['cost'] = results.apply(lambda r: self._estimate_cost(r), axis=1)

        # Baseline probability
        mask_baseline = (results[TREATMENT_COLS] == 0).all(axis=1)

        if mask_baseline.any():
            baseline_prob = results.loc[mask_baseline, 'model_pred_prob'].values[0]
            results['baseline_prob'] = baseline_prob
            results['uplift'] = results['model_pred_prob'] - baseline_prob
        else:
            results['uplift'] = 0

        # Remove baseline
        results = results[~mask_baseline].copy()

        # 🔥 STEP 2 — DIMINISHING RETURNS APPLIED HERE
        results['uplift'] = results['uplift'] * diminishing_factor

        return results
