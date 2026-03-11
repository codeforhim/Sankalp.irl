import pandas as pd
import numpy as np
import sys

from collections import defaultdict

try:
    from .data_models import FEATURE_COLS, TREATMENT_COLS, ID_COL
    from .causal_models import safe_proba_positive
except ImportError:
    from data_models import FEATURE_COLS, TREATMENT_COLS, ID_COL
    from causal_models import safe_proba_positive


class PolicyOptimizer:
    def __init__(self, budget, penalty_strength=0.01):
        self.budget = budget
        self.penalty_strength = penalty_strength
        self.policy_usage = defaultdict(int)  # (policy, amount) → count

    def compute_adjusted_roi(self, row):
        """
        Non-linear ROI: favour larger uplifts more strongly.
        Currently not used for sorting (we sort by uplift directly),
        but kept if you want to revert to ROI-based sorting later.
        """
        key = (row['policy'], row['amount'])
        penalty = self.penalty_strength * self.policy_usage[key]
        roi_raw = (row['uplift'] ** 2) / row['cost']
        return roi_raw - penalty

    def optimize_allocation(self, households_df, generator, allowed_actions=None):
        """
        Global optimization for budget allocation.
        Greedy: allocate to highest-uplift households first until budget is exhausted.
        Preserves state information (stateid) in results.
        """
        print("Generating candidates for all households...", file=sys.stderr)

        X = households_df[FEATURE_COLS].reset_index(drop=True)
        unique_row_ids = X.index
        original_ids = households_df[ID_COL].values
        
        # Preserve state IDs from original dataset
        state_ids = households_df['stateid'].values if 'stateid' in households_df.columns else np.zeros(len(households_df))

        combos = pd.DataFrame(generator.combinations)
        n_rows = len(X)
        n_combos = len(combos)

        X_repeated = X.loc[X.index.repeat(n_combos)].reset_index(drop=True)
        Row_indices = unique_row_ids.repeat(n_combos)
        Real_ids_repeated = np.repeat(original_ids, n_combos)
        State_ids_repeated = np.repeat(state_ids, n_combos)

        Combos_tiled = pd.concat([combos] * n_rows, ignore_index=True)

        input_data = pd.concat([X_repeated, Combos_tiled], axis=1)
        input_data = input_data[generator.causal_model.feature_names]

        # Safe probability for class 1
        preds = safe_proba_positive(generator.causal_model.model, input_data)

        results = Combos_tiled.copy()
        results['row_idx'] = Row_indices
        results['id'] = Real_ids_repeated
        results['stateid'] = State_ids_repeated
        results['model_pred_prob'] = preds

        duration = getattr(generator, 'duration', 1)

        if allowed_actions is not None:
            mask_allowed = pd.Series(True, index=results.index)
            for col in TREATMENT_COLS:
                if col not in allowed_actions:
                    mask_allowed &= (results[col] == 0)
            results = results[mask_allowed].copy()

        # Cost function (including NREGA)
        results['cost'] = (
            (results['cash_transfer'] + results['food_subsidy']) * duration
            + (results['training_program'] > 0) * 2000
            + (results['nrega_program'] > 0) * 1500
        )

        # Baseline (all treatments == 0)
        mask_baseline = (results[TREATMENT_COLS] == 0).all(axis=1)
        baselines = results[mask_baseline].set_index('row_idx')['model_pred_prob']
        results['baseline_prob'] = results['row_idx'].map(baselines)
        results['uplift'] = results['model_pred_prob'] - results['baseline_prob']

        # Debug: see actual uplift range
        print(
            "DEBUG uplift stats: min =",
            results['uplift'].min(),
            "max =",
            results['uplift'].max(),
            file=sys.stderr,
        )

        # Very small minimum uplift threshold (e.g., 0.0001 = 0.01 percentage point)
        MIN_UPLIFT = 0.0001
        filtered = results[(results['cost'] > 0) & (results['uplift'] >= MIN_UPLIFT)].copy()

        # If still empty, fall back to any positive uplift with cost>0
        if filtered.empty:
            filtered = results[(results['cost'] > 0) & (results['uplift'] > 0)].copy()
            if filtered.empty:
                # Truly no positive uplift anywhere
                return pd.DataFrame()

        candidates = filtered.copy()

        # POLICY + AMOUNT identifiers
        candidates['policy'] = candidates.apply(
            lambda r: (
                'cash_transfer' if r['cash_transfer'] > 0 else
                'food_subsidy' if r['food_subsidy'] > 0 else
                'training_program' if r['training_program'] > 0 else
                'nrega_program'
            ),
            axis=1
        )

        candidates['amount'] = candidates[
            ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program']
        ].max(axis=1)

        # Sort strictly by uplift: highest uplift first
        candidates.sort_values('uplift', ascending=False, inplace=True)

        current_spend = 0
        covered_households = set()
        final_allocations = []

        # Greedy: allocate to highest-uplift households until budget is exhausted
        for _, row in candidates.iterrows():
            if current_spend + row['cost'] > self.budget:
                continue

            hid = row['id']
            if hid in covered_households:
                continue

            final_allocations.append(row)
            covered_households.add(hid)
            current_spend += row['cost']

            # Optional: update usage memory
            key = (row['policy'], row['amount'])
            self.policy_usage[key] += 1

        return pd.DataFrame(final_allocations)
