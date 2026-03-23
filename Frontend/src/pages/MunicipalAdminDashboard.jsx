import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity, DollarSign, Award, AlertTriangle, CheckCircle, XCircle, BarChart2, Zap, RefreshCw, ThumbsUp, ThumbsDown, Download, FileText, Camera, Mail } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CivicHeatmap from '../components/CivicHeatmap';
import ChatWidget from '../components/ChatWidget';

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

    const topWards = result?.analysis_data?.state_wise_allocation
        ? Object.entries(result.analysis_data.state_wise_allocation)
            .sort((a, b) => b[1].cost - a[1].cost)
            .slice(0, 10)
        : [];

    const maxCost = topWards.length > 0 ? topWards[0][1].cost : 1;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Budget</label>
                    <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#E5E7EB]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[#138808] font-bold text-lg">{formatCurrency(budget)}</span>
                            <span className="text-xs text-[#9CA3AF]">₹{budget.toLocaleString('en-IN')}</span>
                        </div>
                        <input type="range" min={500000} max={50000000} step={500000} value={budget}
                            onChange={e => setBudget(Number(e.target.value))} className="w-full accent-[#138808]" />
                        <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
                            <span>₹5L</span><span>₹5Cr</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Welfare Schemes</label>
                    <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#E5E7EB] space-y-2">
                        <button onClick={() => toggleScheme('all')}
                            className={`w-full text-left text-sm px-3 py-1.5 rounded-lg border transition ${selectedSchemes.includes('all') ? 'bg-[#1B3A6F]/10 border-[#1B3A6F]/30 text-[#1B3A6F] font-semibold' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-white'}`}
                        >All Schemes</button>
                        {SCHEMES.map(s => (
                            <button key={s.id} onClick={() => toggleScheme(s.id)}
                                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg border transition ${!selectedSchemes.includes('all') && selectedSchemes.includes(s.id) ? 'bg-[#1B3A6F]/10 border-[#1B3A6F]/30 text-[#1B3A6F] font-semibold' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-white'}`}
                            >{s.label}</button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Target Ward</label>
                        <select value={selectedWard} onChange={e => setSelectedWard(e.target.value)}
                            className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-[#1F2937] text-sm focus:outline-none focus:border-[#1B3A6F]">
                            <option value="all">All 36 Wards (City-Wide)</option>
                            {WARDS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                        </select>
                    </div>
                    <button onClick={handleOptimize} disabled={loading}
                        className="w-full gov-btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                        {loading ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Running AI Model...</>) : (<><Zap className="w-4 h-4" /> Run Optimizer</>)}
                    </button>
                    {loading && <p className="text-xs text-[#9CA3AF] text-center">This may take 30-60 seconds...</p>}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-[#DC2626]/20 rounded-xl p-4 text-[#DC2626] text-sm">⚠️ {error}</div>
            )}

            {result && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Budget Used', value: formatCurrency(result.stats?.basic?.allocated_budget || 0), icon: DollarSign, color: 'text-[#138808]', bg: 'bg-green-50', borderColor: 'border-t-[#138808]' },
                            { label: 'Beneficiaries', value: formatNum(result.stats?.basic?.total_beneficiaries || 0), icon: Users, color: 'text-[#1B3A6F]', bg: 'bg-blue-50', borderColor: 'border-t-[#1B3A6F]' },
                            { label: 'Total Uplift', value: (result.stats?.basic?.total_uplift || 0).toFixed(2), icon: TrendingUp, color: 'text-[#FF7A00]', bg: 'bg-orange-50', borderColor: 'border-t-[#FF9933]' },
                            { label: 'ROI/Rupee', value: (result.stats?.basic?.roi_uplift_per_rupee || 0).toFixed(6), icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', borderColor: 'border-t-amber-500' },
                        ].map(kpi => (
                            <div key={kpi.label} className={`bg-white rounded-xl p-4 border border-[#E5E7EB] border-t-4 ${kpi.borderColor} shadow-sm`}>
                                <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center mb-2`}>
                                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                                </div>
                                <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">{kpi.label}</p>
                                <p className={`text-xl font-bold ${kpi.color} mt-0.5`}>{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    {topWards.length > 0 && (
                        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-sm">
                            <h3 className="text-sm font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-[#1B3A6F]" /> Top Wards — Budget Allocation
                            </h3>
                            <div className="space-y-2">
                                {topWards.map(([wardName, data]) => (
                                    <div key={wardName} className="flex items-center gap-3">
                                        <span className="text-xs text-[#6B7280] w-16 shrink-0">{wardName}</span>
                                        <div className="flex-1 bg-[#EEF2F7] rounded-full h-5 overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#1B3A6F] to-[#FF9933] rounded-full flex items-center px-2 transition-all duration-700"
                                                style={{ width: `${Math.max(5, (data.cost / maxCost) * 100)}%` }}>
                                                <span className="text-[10px] text-white font-bold whitespace-nowrap">{formatCurrency(data.cost)}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-[#6B7280] w-16 text-right">{data.beneficiaries} HH</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.analysis_data?.policy_distribution_chart && (
                        <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-sm">
                            <h3 className="text-sm font-bold text-[#1F2937] mb-3">Policy Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(result.analysis_data.policy_distribution_chart).map(([policy, value]) => {
                                    const count = typeof value === 'object' ? (value.beneficiary_count ?? value.count ?? 0) : value;
                                    return (
                                        <div key={policy} className="bg-[#F5F7FA] rounded-lg p-3 text-center border border-[#E5E7EB]">
                                            <p className="text-lg font-bold text-[#1F2937]">{formatNum(count)}</p>
                                            <p className="text-xs text-[#6B7280] mt-1 capitalize">{policy.replace(/_/g, ' ')}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {result.allocations?.length > 0 && (
                        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#E5E7EB]">
                                <h3 className="text-sm font-bold text-[#1F2937]">Sample Allocations (Top 20)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#EEF2F7]">
                                        <tr>
                                            <th className="text-left px-4 py-2 text-xs font-bold text-[#6B7280] uppercase">Ward</th>
                                            <th className="text-left px-4 py-2 text-xs font-bold text-[#6B7280] uppercase">Policy</th>
                                            <th className="text-right px-4 py-2 text-xs font-bold text-[#6B7280] uppercase">Cost</th>
                                            <th className="text-right px-4 py-2 text-xs font-bold text-[#6B7280] uppercase">Uplift</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.allocations.slice(0, 20).map((row, idx) => (
                                            <tr key={idx} className={`border-t border-[#E5E7EB] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'} hover:bg-[#EEF2F7]`}>
                                                <td className="px-4 py-2 text-[#1F2937]">{row.ward || row.state_name || `Ward ${row.stateid || '-'}`}</td>
                                                <td className="px-4 py-2">
                                                    <span className="bg-[#1B3A6F]/10 text-[#1B3A6F] border border-[#1B3A6F]/20 px-2 py-0.5 rounded text-xs capitalize">
                                                        {row.policy && row.policy !== 'None' ? row.policy : (() => {
                                                            const cols = ['cash_transfer', 'food_subsidy', 'training_program', 'nrega_program'];
                                                            const active = cols.find(c => row[c] > 0);
                                                            return active ? active.replace(/_/g, ' ') : 'Unknown';
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right text-[#138808] font-mono text-xs">₹{Math.round(row.cost || 0).toLocaleString('en-IN')}</td>
                                                <td className="px-4 py-2 text-right text-[#FF7A00] font-mono text-xs">{row.uplift_pct || (row.uplift != null ? `${(row.uplift * 100).toFixed(2)}%` : '—')}</td>
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

// ─── Complaint Poll Results Component ─────────────────────────────────────────
const ComplaintPollResults = ({ complaintId }) => {
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get(`/polls/complaint/${complaintId}`);
                if (res.data.exists) {
                    setPoll(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch poll results:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [complaintId]);

    if (loading) return <div className="text-[10px] text-gray-400 animate-pulse">Fetching citizen consensus...</div>;
    if (!poll) return <div className="text-[10px] text-gray-400 italic">No poll data available</div>;

    const totalVotes = poll.total_votes || 0;
    const donePct = totalVotes > 0 ? Math.round((poll.results.done / totalVotes) * 100) : 0;
    const notDonePct = totalVotes > 0 ? Math.round((poll.results.not_done / totalVotes) * 100) : 0;

    return (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 mt-3 shadow-sm border-l-4 border-l-[#1B3A6F]">
            <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-[#1B3A6F] uppercase tracking-wider">Citizen Ground Reality Poll:</p>
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase">{totalVotes} Votes</p>
            </div>
            
            <div className="space-y-2">
                <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-[#138808] flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Work is Done
                        </span>
                        <span>{donePct}% ({poll.results.done})</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#138808] h-full transition-all duration-700" style={{ width: `${donePct}%` }}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-[#DC2626] flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> Still Pending
                        </span>
                        <span>{notDonePct}% ({poll.results.not_done})</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#DC2626] h-full transition-all duration-700" style={{ width: `${notDonePct}%` }}></div>
                    </div>
                </div>
            </div>

            {totalVotes > 0 && (
                <div className={`mt-2 py-1 px-2 rounded text-[9px] font-bold uppercase text-center border ${
                    donePct >= 70 ? 'bg-green-50 text-[#138808] border-[#138808]/20' : 
                    notDonePct >= 40 ? 'bg-red-50 text-[#DC2626] border-[#DC2626]/20' : 
                    'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                    {donePct >= 70 ? 'High Citizen Confidence: Approved' : 
                     notDonePct >= 40 ? 'Citizen Dissent: Audit Required' : 
                     'Mixed Feedback: Admin Discretion'}
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
    const [activeTab, setActiveTab] = useState('review');
    const [downloading, setDownloading] = useState(false);
    const [reportEmail, setReportEmail] = useState(user?.gov_email || '');

    const handleDownloadExcel = async () => {
        try {
            setDownloading(true);
            const response = await api.get('/complaints/admin/export-pending', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Ward_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Excel Download Failed:", err);
            alert("Failed to download Excel report.");
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadHeatmap = async () => {
        const mapElement = document.getElementById('city-heatmap-container');
        if (!mapElement) {
            console.error("Map container not found");
            return;
        }

        try {
            setDownloading(true);
            
            // Give extra time for map tiles to be ready
            await new Promise(r => setTimeout(r, 1000));

            // modern-screenshot is much better at capturing modern CSS (oklch) and Leaflet
            const dataUrl = await domToPng(mapElement, {
                scale: 2,
                quality: 1.0,
                backgroundColor: '#0f172a',
                onclone: (clonedDoc) => {
                    // Fix those failing placeholder images before they cause issues in the capture
                    const images = clonedDoc.getElementsByTagName('img');
                    for (let i = 0; i < images.length; i++) {
                        if (images[i].src.includes('via.placeholder.com')) {
                            images[i].src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                        }
                    }
                }
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.setAttribute('download', `City_Heatmap_Analytics_${new Date().toISOString().split('T')[0]}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Heatmap Capture Failed:", err);
            alert("Capture engine error. Using a more stable snapshot method...");
        } finally {
            setDownloading(false);
        }
    };

    const handleEmailReport = async () => {
        // We need the heatmap snapshot for the email
        // Logic: switch to heatmap tab if not there, capture, then send
        let heatmapUrl = null;
        const mapElement = document.getElementById('city-heatmap-container');

        try {
            setDownloading(true);

            if (!mapElement) {
                // If map not visible, we might need to inform user or switch tab
                alert("Please switch to the 'City Heatmap' tab first so we can capture the snapshot for your email.");
                setDownloading(false);
                setActiveTab('heatmap');
                return;
            }

            // 1. Capture Heatmap
            await new Promise(r => setTimeout(r, 1000));
            heatmapUrl = await domToPng(mapElement, {
                scale: 1.5, // Lower scale for email to keep size reasonable
                quality: 0.8,
                backgroundColor: '#0f172a'
            });

            // 2. Wrap and Send to Backend
            await api.post('/complaints/admin/email-report', {
                heatmapDataUrl: heatmapUrl,
                targetEmail: reportEmail
            });

            alert(`Analytics report (Excel + Heatmap) has been successfully sent to ${reportEmail}`);
        } catch (err) {
            console.error("Email Report Failed:", err);
            alert(err.response?.data?.message || "Failed to send email report.");
        } finally {
            setDownloading(false);
        }
    };


    useEffect(() => {
        const fetchFlaggedComplaints = async () => {
            if (!user?.city_id) return;
            try {
                const response = await api.get(`/complaints/city/${user.city_id}`);
                const pending = response.data.filter(c => c.status === 'flagged_for_review' || c.status === 'resolved');
                setFlaggedComplaints(pending);
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
            const newStatus = action === 'approve' ? 'verified' : 'rejected';
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
                <div className="flex items-center gap-4">
                    <img src="/logo.jpeg" alt="LokAyukt" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold text-[#1F2937]">LokAyukt Admin Intelligence</h1>
                        <p className="text-[#6B7280] text-sm mt-1">Cross-Department Municipal Command Console</p>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                    <div className="bg-white px-4 py-3 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center border-t-4 border-t-[#1B3A6F]">
                        <Activity className="w-8 h-8 text-[#1B3A6F] mr-3 p-1.5 bg-blue-50 rounded-lg" />
                        <div className="flex flex-col">
                            <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wider">City Trust Index</span>
                            <span className="text-xl font-bold text-[#1F2937]">76%</span>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center border-t-4 border-t-[#DC2626]">
                        <AlertTriangle className="w-8 h-8 text-[#DC2626] mr-3 p-1.5 bg-red-50 rounded-lg" />
                        <div className="flex flex-col">
                            <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wider">AI Flagged</span>
                            <span className="text-xl font-bold text-[#DC2626]">{flaggedComplaints.length} Pending</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm flex flex-wrap gap-4 items-center">
                <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mr-2">Admin Exports:</span>
                <button 
                    onClick={handleDownloadExcel}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-[#1B3A6F] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1B3A6F]/90 transition shadow-sm disabled:opacity-50"
                >
                    <FileText className="w-4 h-4" />
                    {downloading ? 'Generating Excel...' : 'Export Ward Analytics'}
                </button>
                {activeTab === 'heatmap' && (
                    <button 
                        onClick={handleDownloadHeatmap}
                        disabled={downloading}
                        className="flex items-center gap-2 bg-[#138808] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0e6b06] transition shadow-sm disabled:opacity-50"
                    >
                        <Camera className="w-4 h-4" />
                        {downloading ? 'Capturing...' : 'Download Heatmap Snapshot'}
                    </button>
                )}
                
                <div className="flex items-center gap-2 bg-[#F3F4F6] p-1.5 rounded-lg border border-[#E5E7EB] shadow-inner ml-auto">
                    <input 
                        type="email" 
                        placeholder="Enter email to send report..." 
                        value={reportEmail}
                        onChange={(e) => setReportEmail(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm px-3 py-1.5 w-64 text-[#1F2937]"
                    />
                    <button 
                        onClick={handleEmailReport}
                        disabled={downloading || !reportEmail}
                        className="flex items-center gap-2 bg-[#FF7A00] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#FF7A00]/90 transition shadow-sm disabled:opacity-50"
                    >
                        <Mail className="w-4 h-4" />
                        {downloading ? 'Mailing...' : 'Send Analytics'}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-[#E5E7EB] pb-0">
                {[
                    { id: 'review', label: 'AI Review Queue', icon: AlertTriangle },
                    { id: 'welfare', label: 'Welfare Optimizer', icon: Zap },
                    { id: 'leaderboard', label: 'Ward Leaderboard', icon: Award },
                    { id: 'heatmap', label: 'City Heatmap', icon: Activity },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition -mb-px ${activeTab === tab.id ? 'border-[#1B3A6F] text-[#1B3A6F] bg-[#1B3A6F]/5' : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'
                            }`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.id === 'review' && flaggedComplaints.length > 0 && (
                            <span className="bg-[#DC2626] text-white text-xs px-1.5 py-0.5 rounded-full">{flaggedComplaints.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* AI Review Queue Tab */}
            {activeTab === 'review' && (
                <div className="bg-white rounded-2xl border border-[#DC2626]/20 p-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-[#DC2626]/10 pb-3 mb-4">
                        <h2 className="text-lg font-semibold text-[#DC2626] flex items-center">
                            <Activity className="w-5 h-5 mr-2" /> Pending Verification Queue
                        </h2>
                        <span className="text-xs bg-red-50 text-[#DC2626] px-3 py-1 rounded-lg border border-[#DC2626]/20">Review AI Assessments</span>
                    </div>

                    {loadingFlags ? (
                        <div className="text-[#6B7280] text-center py-8">Loading AI Flags...</div>
                    ) : flaggedComplaints.length === 0 ? (
                        <div className="text-[#138808] text-center py-8 bg-green-50 rounded-xl border border-[#138808]/20">
                            Excellent! No suspicious uploads detected by AI.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {flaggedComplaints.map(complaint => (
                                <div key={complaint.id} className="bg-[#F5F7FA] rounded-xl border border-[#DC2626]/20 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-[#1F2937] capitalize">Ward {complaint.ward_id} • {complaint.issue_type}</h3>
                                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase border ${complaint.status === 'flagged_for_review' ? 'bg-red-50 text-[#DC2626] border-[#DC2626]/20' : 'bg-green-50 text-[#138808] border-[#138808]/20'
                                            }`}>
                                            {complaint.status === 'flagged_for_review' ? '🚩 AI Flagged' : '✅ Resolved'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#6B7280] mb-4">{complaint.text_input}</p>

                                    <div className="flex gap-4 mb-4">
                                        <div className="flex-1 text-center">
                                            <p className="text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">Citizen "Before"</p>
                                            <div className="h-24 bg-[#EEF2F7] rounded-lg overflow-hidden border border-[#E5E7EB] flex items-center justify-center">
                                                {complaint.image_url ? (
                                                    <img src={complaint.image_url.startsWith('http') ? complaint.image_url : `http://localhost:5001${complaint.image_url}`}
                                                        alt="Before" className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Preview'; }} />
                                                ) : <span className="text-xs text-[#9CA3AF]">No Image</span>}
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <p className="text-xs font-semibold text-[#DC2626] mb-1 uppercase">Officer "After"</p>
                                            <div className="h-24 bg-[#EEF2F7] rounded-lg overflow-hidden border border-[#DC2626]/20 flex items-center justify-center">
                                                {complaint.after_image_url ? (
                                                    <img src={complaint.after_image_url.startsWith('http') ? complaint.after_image_url : `http://localhost:5001${complaint.after_image_url}`}
                                                        alt="After" className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Pending'; }} />
                                                ) : <span className="text-xs font-bold text-[#DC2626]">AI PROCESSING...</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {complaint.ai_feedback && (
                                        <div className="bg-red-50 border border-[#DC2626]/10 rounded-lg p-3 mt-2">
                                            <p className="text-[10px] font-bold text-[#DC2626] uppercase mb-1">AI Reasoning:</p>
                                            <p className="text-xs text-[#1F2937] italic leading-relaxed">"{complaint.ai_feedback}"</p>
                                        </div>
                                    )}

                                    {/* Citizen Poll Results */}
                                    <ComplaintPollResults complaintId={complaint.id} />

                                    <div className="flex gap-3 mt-4 pt-4 border-t border-[#E5E7EB]">
                                        <button onClick={() => handleAdminOverride(complaint.id, 'reject')}
                                            className="flex-1 bg-white text-[#DC2626] hover:bg-red-50 py-2 rounded-lg text-sm font-semibold border border-[#DC2626]/20 transition flex justify-center items-center">
                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                        </button>
                                        <button onClick={() => handleAdminOverride(complaint.id, 'approve')}
                                            className="flex-1 bg-[#138808] hover:bg-[#0e6b06] text-white shadow-sm py-2 rounded-lg text-sm font-semibold transition flex justify-center items-center">
                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
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
                <div className="bg-white rounded-2xl border border-[#1B3A6F]/20 p-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-[#1B3A6F]/10 pb-3 mb-5">
                        <div>
                            <h2 className="text-lg font-semibold text-[#1B3A6F] flex items-center">
                                <Zap className="w-5 h-5 mr-2" /> AI Welfare Budget Optimizer
                            </h2>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">Powered by Causal ML · IHDS Dataset · Delhi 36-Ward Mapping</p>
                        </div>
                    </div>
                    <WelfareOptimizer />
                </div>
            )}

            {/* Ward Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                    <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-3 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-[#FF9933]" /> Ward Performance Leaderboard
                    </h2>
                    <div className="space-y-4">
                        {[
                            { rank: 1, name: 'Ward 12 (Central)', speed: '4.2h', sentiment: '88%', status: 'Excellent', style: 'bg-green-50 text-[#138808] border-[#138808]/20' },
                            { rank: 2, name: 'Ward 5 (North)', speed: '6.5h', sentiment: '79%', status: 'Good', style: 'bg-blue-50 text-[#1B3A6F] border-[#1B3A6F]/20' },
                            { rank: 14, name: 'Ward 8 (East)', speed: '48h', sentiment: '42%', status: 'Needs Attention', style: 'bg-red-50 text-[#DC2626] border-[#DC2626]/20' },
                        ].map(w => (
                            <div key={w.rank} className="flex justify-between items-center border-b border-[#E5E7EB] pb-3">
                                <div className="flex items-center">
                                    <span className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-full mr-3 ${w.rank <= 3 ? 'bg-[#FF9933]/10 text-[#FF7A00] border border-[#FF9933]/20' : 'bg-[#F5F7FA] text-[#6B7280]'}`}>{w.rank}</span>
                                    <div>
                                        <p className="font-semibold text-[#1F2937]">{w.name}</p>
                                        <p className="text-xs text-[#9CA3AF]">Speed: {w.speed} • Sentiment: {w.sentiment}</p>
                                    </div>
                                </div>
                                <span className={`${w.style} border px-3 py-1 rounded-full text-xs font-bold`}>{w.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* City Heatmap Tab */}
            {activeTab === 'heatmap' && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                    <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-3 mb-4">
                        <h2 className="text-lg font-semibold text-[#1F2937]">City-Wide Complaint Heatmap</h2>
                        <span className="text-xs text-[#9CA3AF] italic">Powered by PostGIS Geospatial Analytics</span>
                    </div>
                    <div id="city-heatmap-container" className="h-[500px] rounded-xl overflow-hidden border border-[#E5E7EB]">
                        <CivicHeatmap targetType="city" targetId={user?.city_id || 1} showPolygons={true} />
                    </div>
                </div>
            )}

            {/* AI Agent Chat Widget */}
            <ChatWidget role="admin" userId={user?.id} />
        </div>
    );
};

export default MunicipalAdminDashboard;