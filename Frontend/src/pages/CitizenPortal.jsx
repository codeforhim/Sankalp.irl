import React from 'react';
import { Camera, Mic, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const CitizenPortal = () => {
    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

            {/* Header and Trust Score */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-white/5 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-white">Citizen Reporting Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">Report civic issues instantly securely</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                    <span className="text-indigo-400 font-semibold mr-2">Your Trust Score:</span>
                    <span className="text-xl font-bold text-indigo-300">85/100</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Smart Issue Reporting */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Smart Issue Reporting</h2>

                    <div className="flex justify-end gap-2 mb-2">
                        <button className="text-sm px-3 py-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition">English</button>
                        <button className="text-sm px-3 py-1 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition">हिंदी</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition">
                            <Camera className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition" />
                            <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-300 transition">Upload Photo/Video</span>
                        </button>
                        <button className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl hover:border-rose-500 hover:bg-rose-500/5 transition">
                            <Mic className="w-8 h-8 text-slate-500 group-hover:text-rose-400 mb-2 transition" />
                            <span className="text-sm font-medium text-slate-400 group-hover:text-rose-300 transition">Record Voice</span>
                        </button>
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]"
                            placeholder="Or type your complaint here... AI will automatically categorize it."
                        ></textarea>
                    </div>

                    <div className="flex items-center text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Location auto-detected: Ward 5, Hospital Road</span>
                    </div>

                    <button className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">
                        Submit Report
                    </button>
                </div>

                {/* Live Status & Transparency */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Status */}
                    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Live Status</h2>
                        <div className="space-y-5">
                            <div className="flex items-start">
                                <div className="bg-emerald-500/20 p-2 rounded-lg mr-3 mt-0.5">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-200">Pothole near Park</p>
                                    <p className="text-xs text-slate-500 mt-1">Status: <span className="text-emerald-400">Resolved</span> • 2 hrs ago</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-amber-500/20 p-2 rounded-lg mr-3 mt-0.5">
                                    <AlertCircle className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-200">Garbage Dump</p>
                                    <p className="text-xs text-slate-500 mt-1">Status: <span className="text-amber-400">Assigned</span> • ETA: 4 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Public Map Placeholder */}
                    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Ward Transparency Map</h2>
                        <div className="bg-slate-800/50 border border-slate-700 w-full h-48 rounded-xl flex flex-col items-center justify-center text-slate-500 font-medium">
                            <MapPin className="w-8 h-8 opacity-50 mb-2" />
                            <span className="text-sm">Mapbox / Leaflet Integration</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CitizenPortal;
