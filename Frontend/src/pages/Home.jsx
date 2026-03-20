import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, User, Briefcase, BarChart3, ArrowRight } from 'lucide-react';

const Home = () => {
    return (
        <div className="flex-1 bg-[#F5F7FA] relative overflow-hidden">

            {/* Subtle decorative gradient (muted, non-neon) */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#1B3A6F]/5 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">

                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto space-y-6">
                    <div className="inline-flex items-center space-x-2 bg-[#1B3A6F]/10 border border-[#1B3A6F]/20 px-4 py-2 rounded-full text-[#1B3A6F] font-medium text-sm">
                        <ShieldCheck className="w-4 h-4" />
                        <span>AI for Local Leadership & Public Trust</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-[#1F2937] tracking-tight leading-tight">
                        Governance Reimagined with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#FF7A00]">Sankalp</span>
                    </h1>
                    <p className="text-xl text-[#6B7280] leading-relaxed font-light">
                        An intelligent decision-support system to empower local leaders, resolve citizen issues faster, and rebuild public trust using AI-driven insights.
                    </p>
                </div>

                {/* Dashboard Cards Section */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Citizen Reporter Card */}
                    <div className="group gov-card p-8 border-t-4 border-t-[#1B3A6F] relative overflow-hidden">
                        <div className="w-14 h-14 bg-[#1B3A6F]/10 text-[#1B3A6F] rounded-2xl flex items-center justify-center mb-6">
                            <User className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-3">Citizen Reporter</h3>
                        <p className="text-[#6B7280] mb-8 font-medium leading-relaxed">
                            Report issues instantly with voice, image, or text. Track resolution progress and build your public trust score.
                        </p>
                        <Link to="/citizen" className="inline-flex items-center font-bold text-[#1B3A6F] group-hover:text-[#FF7A00] transition">
                            Open Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Ward Officer Card */}
                    <div className="group gov-card p-8 border-t-4 border-t-[#FF9933] relative overflow-hidden">
                        <div className="w-14 h-14 bg-[#FF9933]/10 text-[#FF7A00] rounded-2xl flex items-center justify-center mb-6">
                            <Briefcase className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-3">Ward Officer</h3>
                        <p className="text-[#6B7280] mb-8 font-medium leading-relaxed">
                            Operational control center. View AI-prioritized queues, geographic hotspots, and verify completion evidence.
                        </p>
                        <Link to="/ward-officer" className="inline-flex items-center font-bold text-[#FF7A00] group-hover:text-[#1B3A6F] transition">
                            Open Dashboard <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Admin Command Center Card */}
                    <div className="group gov-card p-8 border-t-4 border-t-[#138808] relative overflow-hidden">
                        <div className="w-14 h-14 bg-[#138808]/10 text-[#138808] rounded-2xl flex items-center justify-center mb-6">
                            <BarChart3 className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1F2937] mb-3">Municipal Admin</h3>
                        <p className="text-[#6B7280] mb-8 font-medium leading-relaxed">
                            City-wide decision intelligence. Monitor trust metrics, ward leaderboards, and run causal ML welfare simulations.
                        </p>
                        <Link to="/admin" className="inline-flex items-center font-bold text-[#138808] group-hover:text-[#1B3A6F] transition">
                            Open Command Center <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Home;
