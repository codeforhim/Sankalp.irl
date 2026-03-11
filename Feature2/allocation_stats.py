"""
Statistics and analysis calculation for welfare allocation results
"""

import pandas as pd
import numpy as np
from collections import defaultdict

try:
    from .state_mapper import get_state_name, analyze_state_coverage, analyze_state_wise_metrics
except ImportError:
    from state_mapper import get_state_name, analyze_state_coverage, analyze_state_wise_metrics


class AllocationStatsCalculator:
    """Calculate comprehensive statistics for allocation results"""
    
    def __init__(self, allocations_df, budget, duration, policies, policy_columns):
        """
        Args:
            allocations_df: DataFrame with allocation results
            budget: Total budget provided
            duration: Duration in months
            policies: List of active policies
            policy_columns: Dict mapping policy names to column names
        """
        self.allocations = allocations_df
        self.budget = budget
        self.duration = duration
        self.policies = policies
        self.policy_columns = policy_columns
        
    def calculate_all_stats(self):
        """Calculate all statistics and return comprehensive report"""
        
        if self.allocations.empty:
            return self._empty_stats()
        
        stats = {}
        
        # Basic metrics
        stats['basic'] = self._calculate_basic_metrics()
        
        # State coverage
        stats['state_coverage'] = analyze_state_coverage(self.allocations)
        
        # State-wise metrics
        stats['state_wise'] = analyze_state_wise_metrics(self.allocations)
        
        # Policy distribution
        stats['policy_distribution'] = self._calculate_policy_distribution()
        
        # Policy effectiveness
        stats['policy_effectiveness'] = self._calculate_policy_effectiveness()
        
        # Budget analysis
        stats['budget_analysis'] = self._calculate_budget_analysis()
        
        # Uplift analysis
        stats['uplift_analysis'] = self._calculate_uplift_analysis()
        
        return stats
    
    def _calculate_basic_metrics(self):
        """Calculate basic allocation metrics"""
        total_cost = self.allocations['cost'].sum()
        total_uplift = self.allocations['uplift'].sum()
        num_beneficiaries = len(self.allocations)
        
        roi = (total_uplift / total_cost) if total_cost > 0 else 0.0
        roi_per_lakh = (total_uplift * 100) / (total_cost / 100000) if total_cost > 0 else 0.0
        per_capita = total_cost / num_beneficiaries if num_beneficiaries > 0 else 0.0
        
        return {
            'total_budget': round(self.budget, 2),
            'allocated_budget': round(total_cost, 2),
            'budget_remaining': round(self.budget - total_cost, 2),
            'budget_utilization_pct': round((total_cost / self.budget) * 100, 2) if self.budget > 0 else 0.0,
            'total_beneficiaries': int(num_beneficiaries),
            'total_uplift': round(total_uplift, 6),
            'average_uplift_per_beneficiary': round(total_uplift / num_beneficiaries, 6) if num_beneficiaries > 0 else 0.0,
            'roi_uplift_per_rupee': round(roi, 8),
            'roi_percentage_per_rupee': round(roi * 100, 6),
            'roi_per_lakh': round(roi_per_lakh, 2),
            'per_capita_cost': round(per_capita, 2),
            'duration_months': int(self.duration)
        }
    
    def _calculate_policy_distribution(self):
        """Calculate how many beneficiaries each policy reached"""
        distribution = {}
        
        for policy_name, column_name in self.policy_columns.items():
            if column_name in self.allocations.columns:
                count = (self.allocations[column_name] > 0).sum()
                total_amount = self.allocations[self.allocations[column_name] > 0][column_name].sum()
                avg_amount = self.allocations[self.allocations[column_name] > 0][column_name].mean() if count > 0 else 0
                
                distribution[policy_name] = {
                    'beneficiary_count': int(count),
                    'percentage_of_total': round((count / len(self.allocations)) * 100, 2),
                    'total_amount_allocated': round(total_amount, 2),
                    'average_amount_per_beneficiary': round(avg_amount, 2)
                }
        
        return distribution
    
    def _calculate_policy_effectiveness(self):
        """Calculate ROI and uplift for each policy"""
        effectiveness = {}
        
        for policy_name, column_name in self.policy_columns.items():
            if column_name in self.allocations.columns:
                policy_beneficiaries = self.allocations[self.allocations[column_name] > 0]
                
                if len(policy_beneficiaries) > 0:
                    policy_cost = policy_beneficiaries['cost'].sum()
                    policy_uplift = policy_beneficiaries['uplift'].sum()
                    
                    roi = (policy_uplift / policy_cost) if policy_cost > 0 else 0.0
                    
                    effectiveness[policy_name] = {
                        'beneficiaries': int(len(policy_beneficiaries)),
                        'total_cost': round(policy_cost, 2),
                        'total_uplift': round(policy_uplift, 6),
                        'average_uplift': round(policy_uplift / len(policy_beneficiaries), 6),
                        'roi_per_rupee': round(roi, 8),
                        'effectiveness_score': round(roi * 100, 4)  # Higher is better
                    }
        
        return effectiveness
    
    def _calculate_budget_analysis(self):
        """Analyze budget distribution"""
        allocations_by_state = self.allocations.groupby('stateid').agg({
            'cost': 'sum',
            'id': 'count'
        }).rename(columns={'cost': 'total_cost', 'id': 'beneficiaries'})
        
        budget_by_state = {}
        for state_id, row in allocations_by_state.iterrows():
            state_name = get_state_name(state_id)
            budget_by_state[state_name] = {
                'state_id': int(state_id),
                'allocated_budget': round(row['total_cost'], 2),
                'beneficiaries': int(row['beneficiaries']),
                'per_capita_budget': round(row['total_cost'] / row['beneficiaries'], 2),
                'percentage_of_total_budget': round((row['total_cost'] / self.allocations['cost'].sum()) * 100, 2)
            }
        
        # Sort by allocated budget (descending)
        budget_by_state = dict(sorted(
            budget_by_state.items(), 
            key=lambda x: x[1]['allocated_budget'], 
            reverse=True
        ))
        
        return budget_by_state
    
    def _calculate_uplift_analysis(self):
        """Analyze uplift distribution"""
        uplift_values = self.allocations['uplift'].values
        
        return {
            'minimum_uplift': round(uplift_values.min(), 6),
            'maximum_uplift': round(uplift_values.max(), 6),
            'mean_uplift': round(uplift_values.mean(), 6),
            'median_uplift': round(np.median(uplift_values), 6),
            'std_uplift': round(uplift_values.std(), 6),
            'q25_uplift': round(np.percentile(uplift_values, 25), 6),
            'q75_uplift': round(np.percentile(uplift_values, 75), 6),
            'total_uplift': round(uplift_values.sum(), 6),
            'distribution_bins': self._create_uplift_distribution_bins(uplift_values)
        }
    
    def _create_uplift_distribution_bins(self, uplift_values, num_bins=10):
        """Create histogram-like bins for uplift distribution"""
        if len(uplift_values) == 0:
            return []
        
        counts, bins = np.histogram(uplift_values, bins=num_bins)
        
        distribution = []
        for i in range(len(counts)):
            bin_start = round(bins[i], 4)
            bin_end = round(bins[i+1], 4)
            distribution.append({
                'range': f"{bin_start}-{bin_end}",
                'count': int(counts[i]),
                'percentage': round((counts[i] / len(uplift_values)) * 100, 2)
            })
        
        return distribution
    
    def _empty_stats(self):
        """Return empty stats structure"""
        return {
            'basic': {
                'total_budget': self.budget,
                'allocated_budget': 0,
                'budget_remaining': self.budget,
                'budget_utilization_pct': 0.0,
                'total_beneficiaries': 0,
                'total_uplift': 0.0,
                'average_uplift_per_beneficiary': 0.0,
                'roi_uplift_per_rupee': 0.0,
                'roi_percentage_per_rupee': 0.0,
                'roi_per_lakh': 0.0,
                'per_capita_cost': 0.0,
                'duration_months': int(self.duration)
            },
            'state_coverage': {
                'total_states': 36,
                'covered_states': 0,
                'uncovered_states': [],
                'coverage_percentage': 0.0,
                'state_beneficiary_counts': {}
            },
            'state_wise': {},
            'policy_distribution': {},
            'policy_effectiveness': {},
            'budget_analysis': {},
            'uplift_analysis': {
                'minimum_uplift': 0.0,
                'maximum_uplift': 0.0,
                'mean_uplift': 0.0,
                'median_uplift': 0.0,
                'std_uplift': 0.0,
                'q25_uplift': 0.0,
                'q75_uplift': 0.0,
                'total_uplift': 0.0,
                'distribution_bins': []
            }
        }


def generate_comment(row, duration, policies):
    """Generate a descriptive comment for the allocation"""
    parts = []
    for p in policies:
        if p in row and row[p] > 0:
            label = p.replace('_', ' ').title()
            parts.append(f"{label} ({row[p]})")
    
    policy_desc = " + ".join(parts) if parts else "No policy"
    pct = row['uplift_pct'] if 'uplift_pct' in row else f"{(row['uplift'] * 100):.2f}%"
    state = row['state_name'] if 'state_name' in row else get_state_name(row['stateid'])
    
    return f"Uplifted {pct} in {state} due to {policy_desc} for {duration} months."


def get_sample_allocations(allocations_df, sample_size=35):
    """
    Get a representative sample of allocations for display
    
    Args:
        allocations_df: Full allocation results
        sample_size: Number of rows to return
    
    Returns:
        DataFrame with sample allocations, sorted by uplift (descending)
    """
    if len(allocations_df) <= sample_size:
        return allocations_df.sort_values('uplift', ascending=False).reset_index(drop=True)
    
    # Return top 'sample_size' by uplift
    return allocations_df.nlargest(sample_size, 'uplift').reset_index(drop=True)


def format_allocation_for_api(allocations_df, duration=1, policies=None):
    """
    Format allocation results for API response
    
    Args:
        allocations_df: Allocation results
        duration: Duration in months
        policies: List of policy columns to include
    
    Returns:
        List of dicts ready for JSON serialization
    """
    if allocations_df.empty:
        return []
    
    if policies is None:
        policies = ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program']
        
    result = []
    
    for _, row in allocations_df.iterrows():
        # Ensure uplift_pct is calculated for comment
        uplift_pct = f"{(row['uplift'] * 100):.2f}%"
        state_name = get_state_name(int(row['stateid'])) if 'stateid' in row else "Unknown"
        
        # Prepare row-like dict for comment generator
        row_for_comment = row.to_dict()
        row_for_comment['uplift_pct'] = uplift_pct
        row_for_comment['state_name'] = state_name
        
        comment = generate_comment(row_for_comment, duration, policies)
        
        allocation = {
            'id': str(row['id']) if 'id' in row else None,
            'stateid': int(row['stateid']) if 'stateid' in row else None,
            'state_name': state_name,
            'uplift_pct': uplift_pct,
            'cost': round(row['cost'], 2) if 'cost' in row else None,
            'Comment': comment
        }
        
        # Add policy amounts (ensuring all canonical policies are present, even if 0)
        for policy in policies:
            val = row[policy] if policy in row else 0
            allocation[policy] = round(val, 2) if val > 0 else 0
        
        result.append(allocation)
    
    return result
