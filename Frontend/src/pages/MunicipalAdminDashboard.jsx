import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Users, Activity, DollarSign, Award, AlertTriangle, CheckCircle, XCircle, BarChart2, Zap, RefreshCw, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ─── Welfare Optimizer Component ─────────────────────────────────────────────
const WelfareOptimizer = () => {
    const [budget, setBudget] = useState(2000000);
    const [selectedSchemes, setSelectedSchemes] = useState(['all']);
    const [selectedWard, setSelectedWard] = useState('all');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const SCHEMES = [
        { id: 'cash_transfer', label: 'Cash Transfer' },
        { id: 'food_subsidy', label: 'Food Subsidy' },
        { id: 'training_program', label: 'Skill Training' },
        { id: 'nrega_program', label: 'NREGA' },
    ];

    const WARDS = Array.from({ length: 36 }, (_, i) => ({ value: i + 1, label: `Ward ${i + 1}` }));

    const toggleScheme = (schemeId) => {
        if (schemeId === 'all') {
            setSelectedSchemes(['all']);
            return;
        }
        setSelectedSchemes(prev => {
            const withoutAll = prev.filter(s => s !== 'all');
            if (withoutAll.includes(schemeId)) {
                const next = withoutAll.filter(s => s !== schemeId);
                return next.length === 0 ? ['all'] : next;
            } else {
                return [...withoutAll, schemeId];
            }
        });
    };

    const handleOptimize = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const payload = {
                budget,
                schemes: selectedSchemes.includes('all') ? 'all' : selectedSchemes.join(','),
                wardNumber: selectedWard === 'all' ? null : parseInt(selectedWard),
            };
            const res = await api.post('/welfare/optimize', payload);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Optimization failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (n) => `₹${(n / 100000).toFixed(1)}L`;
    const formatNum = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));

    // Get top wards from results for the bar chart
    const topWards = result?.analysis_data?.state_wise_allocation
        ? Object.entries(result.analysis_data.state_wise_allocation)
            .sort((a, b) => b[1].cost - a[1].cost)
            .slice(0, 10)
        : [];

    const maxCost = topWards.length > 0 ? topWards[0][1].cost : 1;

    return (
        <div className="space-y-5">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Budget */}
                <div className="md:col-span-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Budget</label>
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-emerald-400 font-bold text-lg">{formatCurrency(budget)}</span>
                            <span className="text-xs text-slate-500">₹{budget.toLocaleString('en-IN')}</span>
                        </div>
                        <input
                            type="range"
                            min={500000}
                            max={50000000}
                            step={500000}
                            value={budget}
                            onChange={e => setBudget(Number(e.target.value))}
                            className="w-full accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs text-slate-600 mt-1">
                            <span>₹5L</span><span>₹5Cr</span>
                        </div>
                    </div>
                </div>

                {/* Schemes */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Welfare Schemes</label>
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-white/5 space-y-2">
                        <button
                            onClick={() => toggleScheme('all')}
                            className={`w-full text-left text-sm px-3 py-1.5 rounded-lg border transition ${selectedSchemes.includes('all') ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-white/5 text-slate-400 hover:bg-slate-700'}`}
                        >All Schemes</button>
                        {SCHEMES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => toggleScheme(s.id)}
                                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg border transition ${!selectedSchemes.includes('all') && selectedSchemes.includes(s.id) ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-white/5 text-slate-400 hover:bg-slate-700'}`}
                            >{s.label}</button>
                        ))}
                    </div>
                </div>

                {/* Ward & Run */}
                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Ward</label>
                        <select
                            value={selectedWard}
                            onChange={e => setSelectedWard(e.target.value)}
                            className="w-full bg-slate-800/60 border border-white/5 rounded-xl px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">All 36 Wards (City-Wide)</option>
                            {WARDS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleOptimize}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Running AI Model...</>
                        ) : (
                            <><Zap className="w-4 h-4" /> Run Optimizer</>
                        )}
                    </button>
                    {loading && (
                        <p className="text-xs text-slate-500 text-center">This may take 30-60 seconds for the causal ML model to run...</p>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4 animate-fadeIn">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Total Budget Used', value: formatCurrency(result.stats?.basic?.allocated_budget || 0), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { label: 'Beneficiaries', value: formatNum(result.stats?.basic?.total_beneficiaries || 0), icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                            { label: 'Total Uplift', value: (result.stats?.basic?.total_uplift || 0).toFixed(2), icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                            { label: 'ROI per Rupee', value: (result.stats?.basic?.roi_uplift_per_rupee || 0).toFixed(6), icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        ].map(kpi => (
                            <div key={kpi.label} className="bg-slate-800/40 rounded-xl p-4 border border-white/5">
                                <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center mb-2`}>
                                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                                </div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                                <p className={`text-xl font-bold ${kpi.color} mt-0.5`}>{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Ward-wise Budget Bar Chart */}
                    {topWards.length > 0 && (
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-indigo-400" />
                                Top Wards — Budget Allocation
                            </h3>
                            <div className="space-y-2">
                                {topWards.map(([wardName, data]) => (
                                    <div key={wardName} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 w-16 shrink-0">{wardName}</span>
                                        <div className="flex-1 bg-slate-700/50 rounded-full h-5 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center px-2 transition-all duration-700"
                                                style={{ width: `${Math.max(5, (data.cost / maxCost) * 100)}%` }}
                                            >
                                                <span className="text-[10px] text-white font-bold whitespace-nowrap">{formatCurrency(data.cost)}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 w-16 text-right">{data.beneficiaries} HH</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Policy Distribution */}
                    {result.analysis_data?.policy_distribution_chart && (
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-white/5">
                            <h3 className="text-sm font-bold text-slate-200 mb-3">Policy Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(result.analysis_data.policy_distribution_chart).map(([policy, value]) => {
                                    // value can be a number OR an object with beneficiary_count
                                    const count = typeof value === 'object' ? (value.beneficiary_count ?? value.count ?? 0) : value;
                                    return (
                                        <div key={policy} className="bg-slate-700/30 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-white">{formatNum(count)}</p>
                                            <p className="text-xs text-slate-400 mt-1 capitalize">{policy.replace(/_/g, ' ')}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Allocation Table */}
                    {result.allocations?.length > 0 && (
                        <div className="bg-slate-800/40 rounded-xl border border-white/5 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5">
                                <h3 className="text-sm font-bold text-slate-200">Sample Beneficiary Allocations (Top 20)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-700/30">
                                        <tr>
                                            <th className="text-left px-4 py-2 text-xs font-bold text-slate-400 uppercase">Ward</th>
                                            <th className="text-left px-4 py-2 text-xs font-bold text-slate-400 uppercase">Policy</th>
                                            <th className="text-right px-4 py-2 text-xs font-bold text-slate-400 uppercase">Cost</th>
                                            <th className="text-right px-4 py-2 text-xs font-bold text-slate-400 uppercase">Uplift</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.allocations.slice(0, 20).map((row, idx) => (
                                            <tr key={idx} className="border-t border-white/5 hover:bg-white/2">
                                                <td className="px-4 py-2 text-slate-300">
                                                    {row.ward || row.state_name || `Ward ${row.stateid || '-'}`}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-xs capitalize">
                                                        {row.policy && row.policy !== 'None' ? row.policy : (() => {
                                                            // Fallback: find which policy column is > 0
                                                            const cols = ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program'];
                                                            const active = cols.find(c => row[c] > 0);
                                                            return active ? active.replace(/_/g, ' ') : 'Unknown';
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right text-emerald-400 font-mono text-xs">
                                                    ₹{Math.round(row.cost || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-4 py-2 text-right text-purple-400 font-mono text-xs">
                                                    {row.uplift_pct || (row.uplift != null ? `${(row.uplift * 100).toFixed(2)}%` : '—')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const MunicipalAdminDashboard = () => {
    const { user } = useAuth();
    const [flaggedComplaints, setFlaggedComplaints] = useState([]);
    const [loadingFlags, setLoadingFlags] = useState(true);
    const [activeTab, setActiveTab] = useState('review'); // 'review' | 'welfare'

    useEffect(() => {
        const fetchFlaggedComplaints = async () => {
            if (!user?.city_id) return;
            try {
                const response = await api.get(`/complaints/city/${user.city_id}`);
                const flagged = response.data.filter(c => c.status === 'flagged_for_review');
                setFlaggedComplaints(flagged);
            } catch (err) {
                console.error("Failed to fetch flagged complaints:", err);
            } finally {
                setLoadingFlags(false);
            }
        };
        fetchFlaggedComplaints();
    }, [user]);

    const handleAdminOverride = async (complaintId, action) => {
        try {
            const newStatus = action === 'approve' ? 'resolved' : 'rejected';
            await api.patch(`/complaints/status/${complaintId}`, { status: newStatus });
            setFlaggedComplaints(prev => prev.filter(c => c.id !== complaintId));
        } catch (err) {
            console.error("Failed to override complaint status:", err.response?.data || err.message);
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Municipal Decision Intelligence</h1>
                    <p className="text-slate-400 text-sm mt-1">City-wide overview, AI analytics & welfare allocation</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                    <div className="bg-slate-900/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5 flex items-center">
                        <Activity className="w-8 h-8 text-indigo-400 mr-3 p-1.5 bg-indigo-500/10 rounded-lg" />
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">City Trust Index</span>
                            <span className="text-xl font-bold text-white">76%</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/5 flex items-center">
                        <AlertTriangle className="w-8 h-8 text-rose-400 mr-3 p-1.5 bg-rose-500/10 rounded-lg" />
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Flagged</span>
                            <span className="text-xl font-bold text-rose-400">{flaggedComplaints.length} Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-white/10 pb-0">
                {[
                    { id: 'review', label: 'AI Review Queue', icon: AlertTriangle },
                    { id: 'welfare', label: 'Welfare Optimizer (Feature 2)', icon: Zap },
                    { id: 'leaderboard', label: 'Ward Leaderboard', icon: Award },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition -mb-px ${
                            activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.id === 'review' && flaggedComplaints.length > 0 && (
                            <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">{flaggedComplaints.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* AI Review Queue Tab */}
            {activeTab === 'review' && (
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-rose-500/20 p-5 shadow-lg shadow-rose-500/5">
                    <div className="flex justify-between items-center border-b border-rose-500/20 pb-3 mb-4">
                        <h2 className="text-lg font-semibold text-rose-400 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            AI Flagged Verification Queue
                        </h2>
                        <span className="text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-lg">Requires Admin Decision</span>
                    </div>

                    {loadingFlags ? (
                        <div className="text-slate-400 text-center py-8">Loading AI Flags...</div>
                    ) : flaggedComplaints.length === 0 ? (
                        <div className="text-emerald-400 text-center py-8 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                            Excellent! No suspicious Ward Officer uploads detected by AI.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {flaggedComplaints.map(complaint => (
                                <div key={complaint.id} className="bg-slate-950/50 rounded-xl border border-rose-500/30 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-slate-200 capitalize">Ward {complaint.ward_id} • {complaint.issue_type}</h3>
                                        <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded font-bold uppercase border border-rose-500/30">AI Rejected</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">{complaint.text_input}</p>

                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-1 text-center">
                                            <p className="text-xs font-semibold text-slate-500 mb-1 tracking-wider uppercase">Citizen "Before"</p>
                                            <div className="h-24 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                                                {complaint.image_url ? (
                                                    <img
                                                        src={complaint.image_url.startsWith('http') ? complaint.image_url : `http://localhost:5001${complaint.image_url}`}
                                                        alt="Before"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Preview'; }}
                                                    />
                                                ) : <span className="text-xs text-slate-500">No Image</span>}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-xs font-semibold text-rose-400 mb-1 tracking-wider uppercase">Officer "After"</p>
                                            <div className="h-24 bg-slate-800 rounded-lg overflow-hidden border border-rose-500/30 flex items-center justify-center relative">
                                                {complaint.after_image_url ? (
                                                    <img
                                                        src={complaint.after_image_url.startsWith('http') ? complaint.after_image_url : `http://localhost:5001${complaint.after_image_url}`}
                                                        alt="After"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Pending+AI'; }}
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-rose-500 text-center px-1">AI PROCESSING...</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {complaint.ai_feedback && (
                                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 mt-2">
                                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-1">AI Reasoning Assessment:</p>
                                            <p className="text-xs text-slate-300 italic font-medium leading-relaxed">"{complaint.ai_feedback}"</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => handleAdminOverride(complaint.id, 'reject')}
                                            className="flex-1 bg-slate-800 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 py-2 rounded-lg text-sm font-semibold border border-rose-500/20 transition flex justify-center items-center"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" /> Reject Proof
                                        </button>
                                        <button
                                            onClick={() => handleAdminOverride(complaint.id, 'approve')}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 py-2 rounded-lg text-sm font-semibold transition flex justify-center items-center"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Override & Approve
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Welfare Optimizer Tab */}
            {activeTab === 'welfare' && (
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 p-5 shadow-lg shadow-indigo-500/5">
                    <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3 mb-5">
                        <div>
                            <h2 className="text-lg font-semibold text-indigo-300 flex items-center">
                                <Zap className="w-5 h-5 mr-2" />
                                AI Welfare Budget Optimizer
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Powered by Causal ML · IHDS Dataset · Delhi 36-Ward Mapping</p>
                        </div>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30">Feature 2 Active</span>
                    </div>
                    <WelfareOptimizer />
                </div>
            )}

            {/* Ward Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-amber-400" />
                        Ward Performance Leaderboard
                    </h2>
                    <div className="space-y-4">
                        {[
                            { rank: 1, name: 'Ward 12 (Central)', speed: '4.2h', sentiment: '88%', status: 'Excellent', color: 'emerald' },
                            { rank: 2, name: 'Ward 5 (North)', speed: '6.5h', sentiment: '79%', status: 'Good', color: 'indigo' },
                            { rank: 14, name: 'Ward 8 (East)', speed: '48h', sentiment: '42%', status: 'Needs Attention', color: 'rose' },
                        ].map(w => (
                            <div key={w.rank} className="flex justify-between items-center border-b border-white/5 pb-3">
                                <div className="flex items-center">
                                    <span className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${w.color === 'rose' ? 'bg-slate-800/50 border border-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'} rounded-full mr-3`}>{w.rank}</span>
                                    <div>
                                        <p className="font-semibold text-slate-200">{w.name}</p>
                                        <p className="text-xs text-slate-500">Speed: {w.speed} • Sentiment: {w.sentiment}</p>
                                    </div>
                                </div>
                                <span className={`bg-${w.color}-500/10 text-${w.color}-400 border border-${w.color}-500/20 px-3 py-1 rounded-full text-xs font-bold`}>{w.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalAdminDashboard;
