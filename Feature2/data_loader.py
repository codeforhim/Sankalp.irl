import pandas as pd
import numpy as np
try:
    from .data_models import FEATURE_COLS, TREATMENT_COLS, OUTCOME_COL, ID_COL, TIME_COL
    from .semi_synth import add_semi_synthetic_outcome
except ImportError:
    from data_models import FEATURE_COLS, TREATMENT_COLS, OUTCOME_COL, ID_COL, TIME_COL
    from semi_synth import add_semi_synthetic_outcome

def load_data(file_path):
    """
    Loads the household panel data and preprocesses it.
    Adds semi-synthetic outcome if not already present.
    """
    try:
        df = pd.read_csv(file_path)
        
        # Add semi-synthetic outcome if not already present
        if 'outcome_synth' not in df.columns:
            print("[INFO] Generating semi-synthetic outcome with treatment signal...")
            df = add_semi_synthetic_outcome(df)
            print(f"[INFO] outcome_synth created: {df['outcome_synth'].sum()}/{len(df)} positive")
        
        # Ensure required columns exist
        required_cols = [ID_COL, TIME_COL, OUTCOME_COL] + FEATURE_COLS + TREATMENT_COLS
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")

        # Fill NaNs if any (simple strategy for now)
        df.fillna(0, inplace=True)
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def split_features_target(df):
    """
    Splits the dataframe into X (features), T (treatments), Y (outcome).
    """
    X = df[FEATURE_COLS]
    T = df[TREATMENT_COLS]
    Y = df[OUTCOME_COL]
    ids = df[[ID_COL, TIME_COL]]
    return ids, X, T, Y
