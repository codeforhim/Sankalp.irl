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
            case 'resolved': return { bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', text: 'text-emerald-400', icon: <CheckCircle className="w-4 h-4" />, label: 'Resolved' };
            case 'in_progress': return { bg: 'bg-amber-500/15', border: 'border-amber-500/25', text: 'text-amber-400', icon: <Clock className="w-4 h-4" />, label: 'In Progress' };
            case 'flagged_for_review': return { bg: 'bg-blue-500/15', border: 'border-blue-500/25', text: 'text-blue-400', icon: <AlertTriangle className="w-4 h-4" />, label: 'Under Review' };
            default: return { bg: 'bg-slate-500/15', border: 'border-slate-500/25', text: 'text-slate-400', icon: <Clock className="w-4 h-4" />, label: status || 'Reported' };
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-sm p-5 rounded-xl border border-white/5">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-500/20 rounded-lg">
                        <Megaphone className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Public Transparency Feed</h1>
                        <p className="text-slate-400 text-sm">AI-generated municipal updates • Powered by Llama</p>
                    </div>
                </div>
                <button
                    onClick={fetchFeed}
                    disabled={loading}
                    className="flex items-center space-x-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition border border-white/5"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Feed */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading public updates...</div>
            ) : updates.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-white/5">
                    <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No public updates yet. Updates appear when complaint statuses change.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {updates.map((update) => {
                        const style = getStatusStyle(update.status);
                        return (
                            <div
                                key={update.id}
                                className={`${style.bg} ${style.border} border rounded-xl p-4 flex items-start space-x-4 transition hover:scale-[1.005]`}
                            >
                                <div className={`mt-0.5 p-2 rounded-lg ${style.bg}`}>
                                    {style.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${style.border} border`}>
                                            {style.label}
                                        </span>
                                        {update.issue_type && (
                                            <span className="text-xs text-slate-500 capitalize">{update.issue_type}</span>
                                        )}
                                        {update.ward_id && (
                                            <span className="text-xs text-slate-600">• Ward {update.ward_id}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-200 leading-relaxed">{update.message}</p>
                                    <p className="text-xs text-slate-600 mt-2">
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
