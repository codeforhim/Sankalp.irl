"""
Data Models and Constraints for Welfare Allocation
Defines the schema, valid interventions, and causal constraints (mutable vs immutable).
"""

# Column definitions based on ihds_panel_rich_real.csv
ID_COL = 'id'
TIME_COL = 'time'
# Use semi-synthetic outcome with strong treatment signal
OUTCOME_COL = 'outcome_synth'

# Features
FEATURE_COLS = [
    'income',
    'income_volatility',
    'household_size',
    'urban',
    'cost_index',
    'health_index',
    'education_index',
    'months_since_treatment',
    'cash_transfer_flag',
    'food_subsidy_flag',
    'nrega_amount'
]

# Immutable features (Cannot be changed by policy) - Mahajan et al. Constraints
IMMUTABLE_FEATURES = [
    'id',
    'time',
    'income_volatility', # Hard to change directly
    'household_size',
    'urban',
    'cost_index', # Macro factor
    'months_since_treatment'
]

# Mutable features (Can be changed/targeted, but maybe not directly? usually strictly the treatments are what we change)
# In this specific problem, we "intervene" by setting Treatment variables.
# We generally do NOT change 'income' directly unless the treatment IS 'outcome'.
# Actually, 'cash_transfer' increases 'income'?
# For Causal ML, we treat "Treatments" as the levers.

TREATMENT_COLS = [
    'cash_transfer',
    'food_subsidy',
    'training_program',
    'nrega_program'
]

# Valid levels for interventions (Discretized for optimization/HTE)
# Derived from data inspection:
# cash: 0, 500, 1000, 1500
# food: 0, 300, 600
# training: 0, 1
# nrega: 0, 1
VALID_TREATMENT_LEVELS = {
    'cash_transfer': [0, 300, 500, 700, 1000],
    'food_subsidy': [0, 200, 300, 450, 600],
    'training_program': [0, 1],
    'nrega_program': [0, 1]
}

# Costs per unit of treatment (Simple linear map for now, or read from data columns cost_*)
# The CSV has 'cost_cash', 'cost_food', 'cost_training'.
# We can use those for the budget calculation.
