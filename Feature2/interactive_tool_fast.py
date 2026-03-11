"""
Fast Interactive Welfare Allocation Tool

Trains model once, then allows rapid interactive queries
"""

import sys
import os
import pandas as pd
import numpy as np
import pickle
import time
import traceback  # keep traceback

# Ensure local imports work
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from Feature2.data_loader import load_data, split_features_target
from Feature2.causal_models import CausalModel
from Feature2.counterfactual_engine import CounterfactualGenerator
from Feature2.policy_optimizer import PolicyOptimizer
from Feature2.state_mapper import get_state_name, analyze_state_coverage, analyze_state_wise_metrics

# Global state - trained model & data
_model = None
_df = None
_model_trained = False


def train_model_once():
    """Train the model once at startup"""
    global _model, _df, _model_trained

    if _model_trained:
        return

    print("=" * 60)
    print("INITIALIZING MODEL (One-time setup)")
    print("=" * 60)

    # Load Data
    print("\n[1/3] Loading dataset...")
    data_path = os.path.join(os.path.dirname(__file__), 'ihds_panel_rich_real.csv')

    _df = load_data(data_path)
    if _df is None:
        print("ERROR: Failed to load data")
        sys.exit(1)

    print(f"[OK] Loaded {len(_df)} rows from ihds_panel_rich_real.csv")

    # Train Model (this is the slow part)
    print("\n[2/3] Training Causal Model (S-Learner)...")
    ids, X, T, Y = split_features_target(_df)

    _model = CausalModel()
    _model.train(X, T, Y)
    print(f"[OK] Model trained with {len(X)} samples")

    _model_trained = True

    print("\n" + "=" * 60)
    print("[READY] MODEL READY - Ready for fast interactive queries!")
    print("=" * 60)


def get_allocation_config():
    """Get user configuration"""
    print("\n" + "=" * 60)
    print("WELFARE ALLOCATION CONFIGURATION")
    print("=" * 60)

    # 1. Budget
    while True:
        try:
            budget_str = input("\nEnter Total Budget (e.g., 5000000): ")
            budget = float(budget_str)
            if budget > 0:
                break
            print("[ERROR] Budget must be positive.")
        except ValueError:
            print("[ERROR] Invalid number.")

    # 2. Duration
    while True:
        try:
            dur_str = input("Enter Duration in Months (e.g., 6): ")
            duration = int(dur_str)
            if duration > 0:
                break
            print("[ERROR] Duration must be at least 1 month.")
        except ValueError:
            print("[ERROR] Invalid number.")

    # 3. Policies
    print("\n📋 Available Policies:")
    print(" [1] Cash Transfer")
    print(" [2] Food Subsidy")
    print(" [3] Training Program")
    print(" [4] NREGA")

    print("\nEnter policy numbers separated by commas (e.g., '1,2,4')")
    policy_map = {
        '1': 'cash_transfer',
        '2': 'food_subsidy',
        '3': 'training_program',
        '4': 'nrega_program'
    }

    while True:
        sel_str = input("Selection: ")
        parts = [p.strip() for p in sel_str.split(',')]
        selected_policies = []
        for p in parts:
            if p in policy_map:
                selected_policies.append(policy_map[p])
        if selected_policies:
            break
        print("[ERROR] Please select at least one valid policy.")

    print(f"\n✓ Configuration: Budget=₹{budget:,.0f}, Duration={duration}mo, Policies={selected_policies}")
    return budget, duration, selected_policies


def run_allocation(budget, duration, policies):
    """Run allocation with configured parameters"""
    print("\n" + "=" * 60)
    print("OPTIMIZING ALLOCATION")
    print("=" * 60)

    start_time = time.time()

    # Configure Generator
    generator = CounterfactualGenerator(_model, allowed_policies=policies, duration=duration)

    # Organize Optimization
    print("\n[3/3] Running optimization...")
    optimizer = PolicyOptimizer(budget=budget)

    allocations = optimizer.optimize_allocation(_df, generator)

    elapsed = time.time() - start_time
    print(f"[OK] Optimization complete in {elapsed:.2f}s")

    # Output
    if allocations.empty:
        print("\n[WARNING] No meaningful allocations found within budget/policies.")
        return False

    print("\n" + "=" * 60)
    print("[SUCCESS] ALLOCATION PLAN GENERATED")
    print("=" * 60)

    total_cost = allocations['cost'].sum()
    total_uplift = allocations['uplift'].sum()
    count = len(allocations)

    print(f"\nBudget Allocated: Rs {total_cost:,.0f} / Rs {budget:,.0f}")
    print(f"Beneficiaries: {count}")
    print(f"Total Uplift: {total_uplift:.2f}")

    # Improved ROI display
    if total_cost > 0:
        roi = total_uplift / total_cost
    else:
        roi = 0.0

    # Raw ratio with more decimals
    print(f"ROI: {roi:.8f} uplift per rupee")

    # Percentage uplift per rupee
    print(f"ROI: {roi * 100:.6f}% uplift per rupee")

    # Optional: percentage uplift per ₹1,00,000 spent
    roi_per_lakh = (total_uplift * 100) / (total_cost / 100000) if total_cost > 0 else 0.0
    print(f"ROI: {roi_per_lakh:.2f}% uplift per ₹1,00,000 spent")

    # Analyze state coverage
    coverage_info = analyze_state_coverage(allocations)
    print(f"\nState Coverage: {coverage_info['covered_states']}/{coverage_info['total_states']} states")
    print(f"Coverage Percentage: {coverage_info['coverage_percentage']}%")

    # Save with timestamp to avoid PermissionError if file is open
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"user_allocation_plan_{timestamp}.csv"
    out_path = os.path.join(os.path.dirname(__file__), filename)

    # Include state information in output
    cols = ['id', 'stateid'] + policies + ['uplift', 'cost']
    final_table = allocations[cols].copy()
    
    # Add state name
    final_table['state_name'] = final_table['stateid'].apply(get_state_name)

    # 1. Format Uplift as Percentage
    final_table['uplift_pct'] = (final_table['uplift'] * 100).round(2).astype(str) + '%'

    # 2. Generate Descriptive Comment
    def generate_comment(row):
        parts = []
        for p in policies:
            val = row[p]
            if val > 0:
                label = p.replace('_', ' ').title()
                parts.append(f"{label} ({val})")
        policy_desc = " + ".join(parts) if parts else "No policy"
        pct = row['uplift_pct']
        state = row['state_name']
        return f"Uplifted {pct} in {state} due to {policy_desc} for {duration} months."

    final_table['Comment'] = final_table.apply(generate_comment, axis=1)

    # Reorder columns - place state info prominently
    output_cols = ['id', 'stateid', 'state_name', 'uplift_pct', 'cost', 'Comment'] + policies
    final_table = final_table[output_cols]

    try:
        final_table.to_csv(out_path, index=False)
        print(f"\n[SUCCESS] CSV Saved: {filename}")
        print(f" Location: {out_path}")
        print(f" Rows: {len(final_table)} households allocated")
        print(" Columns: ID | Uplift % | Cost | Comment | Policies")
        return True
    except PermissionError:
        print(f"\n[ERROR] Cannot write to {out_path}")
        print(" Is the file open in Excel? Close it and try again.")
        print("\nPrinting first 5 rows instead:")
        print(final_table.head())
        return False


def main():
    print("\n")
    print("=" * 60)
    print(" INTERACTIVE WELFARE ALLOCATION TOOL (FAST MODE) ".center(60))
    print("=" * 60)

    # One-time model training
    train_model_once()

    # Interactive loop
    while True:
        try:
            # Get configuration
            budget, duration, policies = get_allocation_config()

            # Run allocation
            success = run_allocation(budget, duration, policies)

            # Ask if user wants to continue
            print("\n" + "=" * 60)
            cont = input("Run another allocation? (y/n): ").strip().lower()
            if cont != 'y':
                print("\n[SUCCESS] Thank you for using the Welfare Allocation Tool!")
                break
            print("\n")
        except KeyboardInterrupt:
            print("\n\n✋ Interrupted by user.")
            break
        except Exception as e:
            print(f"\n[ERROR] {e}")
            traceback.print_exc()
            print("Please try again.")


if __name__ == "__main__":
    main()

# now i have to make this more inclined to my research project and work on mathematical algorithmic implementation of longBet from paper3
