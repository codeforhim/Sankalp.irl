import React, { useState, useEffect } from 'react';
import { Megaphone, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const PublicFeed = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const res = await api.get('/communication/public-feed?limit=30');
            setUpdates(res.data.updates || []);
        } catch (err) {
            console.error('Failed to load public feed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFeed(); }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'resolved': return { bg: 'bg-green-50', border: 'border-[#138808]/20', text: 'text-[#138808]', icon: <CheckCircle className="w-4 h-4" />, label: 'Resolved' };
            case 'in_progress': return { bg: 'bg-amber-50', border: 'border-amber-400/20', text: 'text-amber-600', icon: <Clock className="w-4 h-4" />, label: 'In Progress' };
            case 'flagged_for_review': return { bg: 'bg-blue-50', border: 'border-[#1B3A6F]/20', text: 'text-[#1B3A6F]', icon: <AlertTriangle className="w-4 h-4" />, label: 'Under Review' };
            default: return { bg: 'bg-gray-50', border: 'border-[#E5E7EB]', text: 'text-[#6B7280]', icon: <Clock className="w-4 h-4" />, label: status || 'Reported' };
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-[#1B3A6F]/10 rounded-lg">
                        <Megaphone className="w-6 h-6 text-[#1B3A6F]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#1F2937]">Public Transparency Feed</h1>
                        <p className="text-[#9CA3AF] text-sm">AI-generated municipal updates • Powered by Sankalp AI</p>
                    </div>
                </div>
                <button
                    onClick={fetchFeed}
                    disabled={loading}
                    className="flex items-center space-x-2 text-sm bg-[#EEF2F7] hover:bg-[#E5E7EB] text-[#6B7280] px-4 py-2 rounded-lg transition border border-[#E5E7EB]"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Feed — Timeline style */}
            {loading ? (
                <div className="text-center py-20 text-[#9CA3AF]">Loading public updates...</div>
            ) : updates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
                    <Megaphone className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                    <p className="text-[#9CA3AF] text-sm">No public updates yet. Updates appear when complaint statuses change.</p>
                </div>
            ) : (
                <div className="relative pl-6 border-l-2 border-[#1B3A6F]/20 space-y-4">
                    {updates.map((update) => {
                        const style = getStatusStyle(update.status);
                        return (
                            <div
                                key={update.id}
                                className={`bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-start space-x-4 shadow-sm transition hover:-translate-y-0.5 relative`}
                            >
                                {/* Timeline dot */}
                                <div className="absolute -left-[33px] top-5 w-3 h-3 rounded-full bg-[#1B3A6F] border-2 border-white"></div>
                                <div className={`mt-0.5 p-2 rounded-lg ${style.bg}`}>
                                    {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${style.border} border`}>
                                            {style.label}
                                        </span>
                                        {update.issue_type && (
                                            <span className="text-xs text-[#9CA3AF] capitalize">{update.issue_type}</span>
                                        )}
                                        {update.ward_id && (
                                            <span className="text-xs text-[#9CA3AF]">• Ward {update.ward_id}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#1F2937] leading-relaxed">{update.message}</p>
                                    <p className="text-xs text-[#9CA3AF] mt-2">
                                        {new Date(update.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PublicFeed;
