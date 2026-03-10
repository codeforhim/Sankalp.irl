import React from 'react';
import { Map, Clock, Image as ImageIcon, Send, Camera } from 'lucide-react';

const WardOfficerDashboard = () => {
    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Ward Officer Command Center</h1>
                    <p className="text-slate-400 text-sm mt-1">Ward 5 • Operational Dashboard</p>
                </div>
                <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-xl font-semibold border border-rose-500/20 shadow-sm">
                    3 Critical Pending
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* AI Prioritized Queue */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">AI Prioritized Queue</h2>
                    <div className="space-y-4">
                        {/* High Priority Item */}
                        <div className="border border-rose-500/20 bg-rose-500/5 p-5 rounded-xl flex justify-between items-start transition hover:bg-rose-500/10">
                            <div>
                                <div className="flex items-center space-x-3">
                                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-full font-bold">🔴 HIGH</span>
                                    <h3 className="font-semibold text-slate-200">Hospital Road Pothole</h3>
                                </div>
                                <p className="text-sm text-slate-400 mt-2">Urgency: 95/100 • Impact: Very High • Trust: 90/100</p>
                                <div className="mt-4 flex space-x-3">
                                    <button className="text-xs font-medium bg-slate-800 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-lg hover:bg-indigo-500/10 transition">Assign Contractor</button>
                                    <button className="text-xs font-medium bg-indigo-600/90 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">Verify & Close</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    SLA: 12 hrs
                                </div>
                            </div>
                        </div>

                        {/* Medium Priority Item */}
                        <div className="border border-amber-500/20 bg-amber-500/5 p-5 rounded-xl flex justify-between items-start transition hover:bg-amber-500/10">
                            <div>
                                <div className="flex items-center space-x-3">
                                    <span className="bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs px-2.5 py-1 rounded-full font-bold">🟡 MEDIUM</span>
                                    <h3 className="font-semibold text-slate-200">Garbage Accumulation</h3>
                                </div>
                                <p className="text-sm text-slate-400 mt-2">Urgency: 60/100 • Impact: Moderate</p>
                                <div className="mt-4 flex space-x-3">
                                    <button className="text-xs font-medium bg-slate-800 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-lg hover:bg-indigo-500/10 transition">Assign Worker</button>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg shadow-sm">
                                    <Clock className="w-4 h-4 mr-1.5" />
                                    SLA: 24 hrs
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Smart Map Dashboard */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 flex flex-col">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Spatial Intelligence</h2>
                    <div className="bg-slate-950/50 flex-1 rounded-xl flex items-center justify-center text-slate-500 min-h-[250px] font-medium border border-white/5">
                        <div className="text-center">
                            <Map className="w-8 h-8 mx-auto mb-3 text-slate-600" />
                            Cluster Map Integration
                        </div>
                    </div>
                </div>

                {/* Evidence Verification */}
                <div className="lg:col-span-3 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-6">Evidence Verification (AI Matching)</h2>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-slate-950/50 p-6 rounded-xl border border-dashed border-slate-700 text-center">
                            <p className="font-medium text-sm text-slate-300 mb-3">Before Photo</p>
                            <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                            <p className="text-xs text-slate-500">Citizen Uploaded (Timestamped)</p>
                        </div>

                        <div className="flex items-center justify-center">
                            <Send className="w-6 h-6 text-slate-600 hidden md:block" />
                        </div>

                        <div className="flex-1 bg-slate-950/50 p-6 rounded-xl border border-dashed border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer text-center transition">
                            <p className="font-medium text-sm text-slate-300 mb-3">After Photo</p>
                            <Camera className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
                            <p className="text-xs text-indigo-400 font-medium">Upload completion evidence</p>
                        </div>

                        <div className="flex-1 flex flex-col justify-center space-y-4">
                            <div className="bg-emerald-500/10 animate-pulse text-emerald-400 p-4 rounded-xl text-sm text-center border border-emerald-500/20">
                                Waiting for post-repair upload...
                            </div>
                            <button disabled className="bg-slate-800 text-slate-500 font-semibold py-3 rounded-xl cursor-not-allowed border border-white/5">
                                AI Verify Match
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WardOfficerDashboard;
