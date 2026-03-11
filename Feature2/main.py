import sys
import os
import pandas as pd
import numpy as np
import argparse
import json

# Ensure local imports work
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from Feature2.data_loader import load_data, split_features_target
from Feature2.causal_models import CausalModel
from Feature2.counterfactual_engine import CounterfactualGenerator
from Feature2.policy_optimizer import PolicyOptimizer
from Feature2.allocation_stats import AllocationStatsCalculator, get_sample_allocations, format_allocation_for_api
from Feature2.state_mapper import get_state_name, analyze_state_coverage

def main():
    parser = argparse.ArgumentParser(description='Welfare Allocation Optimizer')
    parser.add_argument('--budget', type=float, default=2000000, help='Total welfare budget')
    parser.add_argument('--schemes', type=str, default="all", help='Comma-separated list of allowed schemes')
    parser.add_argument('--duration', type=int, default=1, help='Duration in months')
    args = parser.parse_args()

    # Log to stderr so stdout stays clean for JSON
    print(f"=== Feature 2: Welfare Allocation Optimizer Pipeline ===", file=sys.stderr)
    
    # 1. Load Data
    data_path = os.path.join(os.path.dirname(__file__), 'ihds_panel_rich_real.csv')
    print(f"Loading data from {data_path}...", file=sys.stderr)
    df = load_data(data_path)
    if df is None:
        print(json.dumps({"error": "Failed to load data"}), file=sys.stdout)
        return

    print(f"Data Loaded. Shape: {df.shape}", file=sys.stderr)
    
    # 2. Prepare Data
    ids, X, T, Y = split_features_target(df)
    
    # 3. Train Causal Model
    print("\nTraining Causal S-Learner Model...", file=sys.stderr)
    model = CausalModel()
    model.train(X, T, Y)
    
    # 4. Generate Counterfactuals & Optimize
    BUDGET = args.budget
    SCHEMES_ARG = args.schemes
    print(f"\nRunning Optimization with Budget: {BUDGET} | Schemes: {SCHEMES_ARG}", file=sys.stderr)
    
    # Check if we need to filter policies
    # The PolicyOptimizer might need to know which columns are allowed.
    # If the user sends "Food Subsidy,Skill Training", we map that to column names.
    # Mappings based on UI strings vs CSV columns:
    # "Food Subsidy" -> "food_subsidy"
    # "Skill Training" -> "training_program"
    # "Cash Transfer" -> "cash_transfer"
    
    allowed_treatments = None
    if SCHEMES_ARG and SCHEMES_ARG.lower() != "all":
        import re
        input_schemes = [s.strip().lower() for s in SCHEMES_ARG.split(',')]
        # Map to internal column names used by Policy Optimizer actions
        # Assuming PolicyOptimizer checks for 'cash_transfer', 'food_subsidy', 'training_program', 'nrega_program'
        # We might need to subclass or modify PolicyOptimizer if it doesn't support restriction.
        # For now, let's assume we can filter the *output* of the generator or pass a restriction.
        
        # Simple mapping heuristic
        all_possible = ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program']
        allowed_treatments = []
        
        for scheme in input_schemes:
            if scheme in all_possible:
                allowed_treatments.append(scheme)
            elif "cash" in scheme: allowed_treatments.append("cash_transfer")
            elif "food" in scheme: allowed_treatments.append("food_subsidy")
            elif "skill" in scheme or "training" in scheme: allowed_treatments.append("training_program")
            elif "nrega" in scheme or "public works" in scheme: allowed_treatments.append("nrega_program")
            
        print(f"Allowed Treatments filtered to: {allowed_treatments}", file=sys.stderr)

    # Note: If PolicyOptimizer doesn't natively support exclusions, we might need to hack it
    # by zeroing out the effects of excluded treatments in the generator or similar.
    # For this Sprint, we will proceed assuming PolicyOptimizer logic considers all passed to it,
    # or we filter the candidates.
    
    # Better approach: Pass valid schemes to the Optimizer directly if supported,
    # or zero-out costs/uplifts for disabled schemes in the dataframe before optimization?
    # Actually, the easiest way without changing teammates code too much is to 
    # strictly filter the 'allocations' output to only include allowed schemes, 
    # OR (better) tell the optimizer to ignore others.
    
    # Since I cannot easily change PolicyOptimizer interactively without seeing it,
    # I will modify the `optimize_allocation` call if possible, or filter results.
    # However, filtering results AFTER calculation might use budget on forbidden things.
    # It is cleaner to pass it.
    
    generator = CounterfactualGenerator(model, duration=args.duration)
    # Pass allowed_treatments to PolicyOptimizer
    optimizer = PolicyOptimizer(budget=BUDGET) 
    
    # Run optimization with strict filtering at source
    allocations = optimizer.optimize_allocation(df, generator, allowed_actions=allowed_treatments)
    
    try:
        
        # 5. Calculate Comprehensive Statistics
        print("\n=== Calculating Statistics ===", file=sys.stderr)
        
        policy_columns = {
            'Cash Transfer': 'cash_transfer',
            'Food Subsidy': 'food_subsidy',
            'Training Program': 'training_program',
            'NREGA': 'nrega_program'
        }
        
        stats_calc = AllocationStatsCalculator(
            allocations_df=allocations,
            budget=BUDGET,
            duration=getattr(generator, 'duration', 1),
            policies=allowed_treatments or ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program'],
            policy_columns=policy_columns
        )
        
        all_stats = stats_calc.calculate_all_stats()
        
        # Get sample allocations (top 35 by uplift)
        sample_allocations = get_sample_allocations(allocations, sample_size=35)
        
        # Format for API (sample and full)
        formatted_sample = format_allocation_for_api(
            sample_allocations, 
            duration=getattr(generator, 'duration', 1),
            policies=allowed_treatments or ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program']
        )

        formatted_full = format_allocation_for_api(
            allocations, 
            duration=getattr(generator, 'duration', 1),
            policies=allowed_treatments or ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program']
        )
        
        # 6. Build Response JSON
        print("=== Building Response ===", file=sys.stderr)
        
        result_json = {
            "success": not allocations.empty,
            "stats": all_stats,
            "constraints": {
                "active_policies": allowed_treatments or ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program'],
                "duration_months": getattr(generator, 'duration', 1),
                "budget": BUDGET
            },
            "allocations": formatted_sample,
            "full_allocations": formatted_full,
            "allocation_plan": {
                "total_rows": len(allocations),
                "sample_size": len(formatted_sample),
                "data": formatted_sample
            }
        }
        
        # Add analysis data for charts
        if not allocations.empty:
            # State-wise aggregation
            state_agg = allocations.groupby('stateid').agg({
                'cost': 'sum',
                'uplift': 'sum',
                'id': 'count'
            }).rename(columns={'id': 'beneficiaries'})
            
            state_analysis_data = {}
            for state_id, row in state_agg.iterrows():
                state_name = get_state_name(state_id)
                state_analysis_data[state_name] = {
                    'beneficiaries': int(row['beneficiaries']),
                    'cost': round(row['cost'], 2),
                    'uplift': round(row['uplift'], 4)
                }
            
            # Policy effectiveness data for charts
            policy_chart_data = {}
            for policy_name, column_name in policy_columns.items():
                if column_name in allocations.columns:
                    policy_mask = allocations[column_name] > 0
                    policy_chart_data[policy_name] = int(policy_mask.sum())
            
            result_json["analysis_data"] = {
                "state_wise_allocation": state_analysis_data,
                "policy_distribution_chart": policy_chart_data,
                "uplift_distribution": all_stats.get('uplift_analysis', {}).get('distribution_bins', [])
            }
        else:
            result_json["analysis_data"] = {
                "state_wise_allocation": {},
                "policy_distribution_chart": {},
                "uplift_distribution": []
            }
        
        # Print to stderr for debugging
        print(f"Total Cost: {all_stats['basic']['allocated_budget']}", file=sys.stderr)
        print(f"Total Beneficiaries: {all_stats['basic']['total_beneficiaries']}", file=sys.stderr)
        print(f"ROI per Rupee: {all_stats['basic']['roi_uplift_per_rupee']}", file=sys.stderr)
        
        # FINAL OUTPUT: Print the JSON to stdout for the backend to read
        print(json.dumps(result_json, default=str), file=sys.stdout)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stdout)
        # Log full error to stderr
        import traceback
        traceback.print_exc(file=sys.stderr)

if __name__ == "__main__":
    main()
