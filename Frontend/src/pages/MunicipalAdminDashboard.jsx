import React from 'react';
import { TrendingUp, Users, Activity, DollarSign, Award } from 'lucide-react';

const MunicipalAdminDashboard = () => {
    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">

            {/* Header and KPI summary */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Municipal Decision Intelligence</h1>
                    <p className="text-slate-400 text-sm mt-1">City-wide overview & predictive analytics</p>
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
                        <TrendingUp className="w-8 h-8 text-emerald-400 mr-3 p-1.5 bg-emerald-500/10 rounded-lg" />
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Resolution Rate</span>
                            <span className="text-xl font-bold text-white">82%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Ward Performance Leaderboard */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-amber-400" />
                        Ward Performance Leaderboard
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div className="flex items-center">
                                <span className="w-8 h-8 flex items-center justify-center font-bold text-sm bg-slate-800 text-slate-300 rounded-full mr-3">1</span>
                                <div>
                                    <p className="font-semibold text-slate-200">Ward 12 (Central)</p>
                                    <p className="text-xs text-slate-500">Speed: 4.2h • Sentiment: 88%</p>
                                </div>
                            </div>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">Excellent</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <div className="flex items-center">
                                <span className="w-8 h-8 flex items-center justify-center font-bold text-sm bg-slate-800 text-slate-300 rounded-full mr-3">2</span>
                                <div>
                                    <p className="font-semibold text-slate-200">Ward 5 (North)</p>
                                    <p className="text-xs text-slate-500">Speed: 6.5h • Sentiment: 79%</p>
                                </div>
                            </div>
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold">Good</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                            <div className="flex items-center">
                                <span className="w-8 h-8 flex items-center justify-center font-bold text-sm bg-slate-800/50 border border-rose-500/20 text-rose-400 rounded-full mr-3">14</span>
                                <div>
                                    <p className="font-semibold text-slate-200">Ward 8 (East)</p>
                                    <p className="text-xs text-slate-500">Speed: 48h • Sentiment: 42%</p>
                                </div>
                            </div>
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-bold">Needs Attention</span>
                        </div>
                    </div>
                </div>

                {/* Misinformation / Trust Graph Placeholder */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 flex flex-col">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-fuchsia-400" />
                        Public Trust & Misinformation Map
                    </h2>
                    <div className="bg-slate-950/50 flex-1 rounded-xl flex flex-col items-center justify-center text-slate-500 min-h-[200px] border border-white/5 p-4">
                        <p className="font-medium text-sm text-center mb-3">Graph Neural Network Integration</p>
                        <div className="text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-full mb-3 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
                            Alert: "Water Contamination" rumor detected in Ward 8
                        </div>
                        <button className="mt-2 text-sm bg-fuchsia-600/20 border border-fuchsia-500/30 text-fuchsia-300 px-4 py-2 rounded-lg hover:bg-fuchsia-600/30 transition">Generate Official Rebuttal (LLM)</button>
                    </div>
                </div>

                {/* Welfare Allocation Simulator */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4">Welfare Allocation Simulator</h2>
                    <p className="text-sm text-slate-400 mb-6 font-medium">Simulate the impact of budget allocation based on historical civic issue resolution data.</p>

                    <div className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Select Ward</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition">
                                <option>Ward 8 (East) - High Recurrence Rate</option>
                                <option>Ward 5 (North)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Allocate Budget (₹ Lakhs)</label>
                            <input type="range" className="w-full accent-indigo-500" min="10" max="500" defaultValue="150" />
                            <div className="text-right text-xs text-indigo-400 font-bold mt-2">₹ 150 Lakhs</div>
                        </div>
                        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 mt-2">
                            Run Causal Simulation
                        </button>
                        <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 mt-4">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Predicted Impact</span>
                            <p className="text-sm text-indigo-200 mt-2 leading-relaxed">Allocating ₹150L to Ward 8 sanitation will reduce recurrence by 45% and boost local trust score by +12 pts in 3 months.</p>
                        </div>
                    </div>
                </div>

                {/* Budget Utilization Dashboard */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-4 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-emerald-400" />
                        Budget Utilization
                    </h2>
                    <div className="space-y-8 mt-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-slate-300">Road Infrastructure</span>
                                <span className="text-slate-500 font-medium">₹45Cr / ₹60Cr <span className="text-indigo-400">(75%)</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-slate-300">Sanitation & Waste</span>
                                <span className="text-slate-500 font-medium">₹80Cr / ₹120Cr <span className="text-amber-400">(66%)</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-2.5 rounded-full" style={{ width: '66%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-slate-300">Civic Tech & AI</span>
                                <span className="text-slate-500 font-medium">₹2Cr / ₹10Cr <span className="text-rose-400">(20%)</span></span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-rose-600 to-rose-400 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MunicipalAdminDashboard;
