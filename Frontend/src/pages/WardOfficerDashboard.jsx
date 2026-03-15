import React, { useState, useEffect } from 'react';
import { Map, Clock, Image as ImageIcon, Send, Camera, CheckCircle, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const WardSummaryCard = ({ wardId }) => {
    const [summary, setSummary] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateSummary = async () => {
        if (!wardId) return;
        setLoading(true);
        try {
            const res = await api.post(`/communication/ward-summary/${wardId}`);
            setSummary(res.data.summary);
            setStats(res.data.stats);
        } catch (err) {
            console.error('Ward summary error:', err);
            setSummary('Unable to generate summary at this time.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 space-y-3">
            {summary ? (
                <>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                        <p className="text-sm text-indigo-200 leading-relaxed">🤖 {summary}</p>
                    </div>
                    {stats && (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-emerald-400">{stats.verified}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Verified</p>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-emerald-300">{stats.resolved}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Resolved</p>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-amber-400">{stats.in_progress}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Active</p>
                            </div>
                            <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-rose-400">{stats.needs_redo}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Redo</p>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-blue-400">{stats.flagged}</p>
                                <p className="text-[10px] text-slate-500 uppercase">Flagged</p>
                            </div>
                            <div className="bg-slate-500/10 border border-slate-500/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-slate-300">{stats.reported}</p>
                                <p className="text-[10px] text-slate-500 uppercase">New</p>
                            </div>
                        </div>
                    )}
                    <button onClick={generateSummary} disabled={loading} className="flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-indigo-400 transition mt-1">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                    </button>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center min-h-[180px]">
                    <button
                        onClick={generateSummary}
                        disabled={loading}
                        className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg ${loading ? 'bg-indigo-900/50 text-indigo-300 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
                    >
                        <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                        <span>{loading ? 'Generating with Llama AI...' : 'Generate AI Summary'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const WardOfficerDashboard = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    const getPriorityBadge = (score) => {
        if (score === null || score === undefined) return null;
        if (score >= 80) return <span className="text-rose-400 font-bold ml-2 text-xs bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">🔴 {score} Critical</span>;
        if (score >= 60) return <span className="text-orange-400 font-bold ml-2 text-xs bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">🟠 {score} High</span>;
        if (score >= 40) return <span className="text-amber-400 font-bold ml-2 text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">🟡 {score} Medium</span>;
        return <span className="text-emerald-400 font-bold ml-2 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">🟢 {score} Low</span>;
    };

    useEffect(() => {
        const fetchComplaints = async () => {
            if (!user?.ward_id) return;
            try {
                const response = await api.get(`/complaints/ward/${user.ward_id}`);
                setComplaints(response.data);
            } catch (err) {
                console.error("Failed to fetch complaints:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, [user]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setVerificationResult(null); // reset previous results
        }
    };

    const handleVerifySubmit = async () => {
        if (!selectedComplaint || !file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('after_image', file);

        try {
            const response = await api.post(`/complaints/${selectedComplaint.id}/verify-resolution`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setVerificationResult(response.data);

            // Remove from queue or update status locally
            setComplaints(prev => prev.map(c =>
                c.id === selectedComplaint.id ? { ...c, status: response.data.new_status } : c
            ));

        } catch (err) {
            console.error("Verification failed:", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to connect to AI Verification Service.";
            setVerificationResult({ error: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    const activeComplaints = complaints.filter(c => c.status !== 'verified'); // Show resolved too!

    if (loading) return <div className="text-white text-center mt-20">Loading Dashboard...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Ward Officer Command Center</h1>
                    <p className="text-slate-400 text-sm mt-1">Ward {user?.ward_id || 'X'} • Operational Dashboard</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl font-semibold border border-indigo-500/20 shadow-sm">
                    {activeComplaints.filter(c => c.status !== 'resolved').length} Tasks Pending
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* AI Prioritized Queue */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Assigned Tasks Queue</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">

                        {activeComplaints.length === 0 ? (
                            <div className="text-slate-500 text-center py-10">No pending tasks! Outstanding work.</div>
                        ) : (
                            activeComplaints.map(complaint => (
                                <div
                                    key={complaint.id}
                                    onClick={() => {
                                        setSelectedComplaint(complaint);
                                        setFile(null);
                                        setVerificationResult(null);
                                    }}
                                    className={`p-5 rounded-xl flex justify-between items-start transition cursor-pointer border ${selectedComplaint?.id === complaint.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50'}`}
                                >
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            {complaint.status === 'in_progress' ? (
                                                complaint.ai_feedback && complaint.ai_feedback.startsWith('REJECTED') ? (
                                                    <span className="bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase whitespace-nowrap">Proof Rejected</span>
                                                ) : (
                                                    <span className="bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase whitespace-nowrap">In Progress</span>
                                                )
                                            ) : complaint.status === 'rejected' ? (
                                                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Rejected</span>
                                            ) : complaint.status === 'flagged_for_review' ? (
                                                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Awaiting Review</span>
                                            ) : complaint.status === 'resolved' ? (
                                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Resolved</span>
                                            ) : (
                                                <span className="bg-slate-500/20 text-slate-400 border border-slate-500/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">{complaint.status}</span>
                                            )}
                                            <h3 className="font-semibold text-slate-200 capitalize">{complaint.issue_type}</h3>
                                            {getPriorityBadge(complaint.priority_score)}
                                        </div>
                                        <p className="text-sm text-slate-400 mt-2">{complaint.text_input}</p>
                                    </div>
                                    <div className="text-right text-xs text-slate-500">
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}

                    </div>
                </div>

                {/* AI Ward Activity Summary */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 flex flex-col">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">AI Ward Summary</h2>
                    <WardSummaryCard wardId={user?.ward_id} />
                </div>

                {/* Evidence Verification (Feature 3) */}
                <div className="lg:col-span-3 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-3 mb-6">Evidence Verification (AI Matching)</h2>

                    {!selectedComplaint ? (
                        <div className="text-center text-slate-500 py-10 border border-dashed border-slate-700 rounded-xl">
                            Select a task from the queue to upload proof of resolution.
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6">

                            {/* Before Image */}
                            <div className="flex-1 bg-slate-950/50 p-6 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center">
                                <p className="text-xs font-semibold text-slate-500 mb-3 tracking-wider uppercase">Citizen Proof (Before)</p>
                                <div className="h-40 w-full bg-slate-800 rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
                                    {selectedComplaint.image_url ? (
                                        <img
                                            src={selectedComplaint.image_url.startsWith('http') ? selectedComplaint.image_url : `http://localhost:5001${selectedComplaint.image_url}`}
                                            alt="Before"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-600">
                                            <ImageIcon className="w-8 h-8 mb-2" />
                                            <span className="text-xs">No image provided</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dropzone for After Image */}
                            <label className={`flex-1 group cursor-pointer border-2 border-dashed rounded-2xl transition flex flex-col items-center justify-center p-6 text-center ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}>
                                {file ? (
                                    <div className="text-emerald-400 flex flex-col items-center">
                                        <CheckCircle className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-semibold">{file.name} ready to submit</span>
                                    </div>
                                ) : (
                                    <div className="text-indigo-400 flex flex-col items-center">
                                        <Camera className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-medium">Click to upload completion evidence</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>

                            {/* Verification Status / Action */}
                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                {/* Persistent Feedback Display */}
                                {(verificationResult || selectedComplaint.ai_feedback) && (
                                    <div className={`p-4 rounded-xl text-sm border ${(verificationResult?.new_status || selectedComplaint.status) === 'resolved'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : (selectedComplaint.status === 'in_progress' && selectedComplaint.ai_feedback?.startsWith('REJECTED'))
                                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        }`}>
                                        <p className="font-bold mb-2">
                                            {(verificationResult?.new_status || selectedComplaint.status) === 'resolved' ? '✅ Status: Resolved' :
                                                (selectedComplaint.status === 'in_progress' && selectedComplaint.ai_feedback?.startsWith('REJECTED')) ? '❌ Status: Proof Rejected by Admin' :
                                                    '⚠️ Status: Awaiting Review'}
                                        </p>
                                        <div className="bg-black/20 p-3 rounded border border-white/5 font-mono text-xs leading-relaxed">
                                            {verificationResult?.ai_analysis?.message || selectedComplaint.ai_feedback || "No feedback from AI yet."}
                                        </div>
                                    </div>
                                )}

                                {((selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'verified') || 
                                  (selectedComplaint.ai_feedback?.includes('REJECTED'))) && (
                                    <button
                                        onClick={handleVerifySubmit}
                                        disabled={!file || uploading}
                                        className={`font-semibold py-3 rounded-xl transition shadow-lg ${file && !uploading ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'}`}
                                    >
                                        {uploading ? 'AI is Analyzing...' : 'Submit to AI for Verification'}
                                    </button>
                                )}

                                {selectedComplaint.status === 'resolved' && !selectedComplaint.ai_feedback?.includes('REJECTED') && (
                                    <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-xl border border-emerald-500/30 text-center font-bold">
                                        Resolution submitted! Awaiting Admin verification. ⏳
                                    </div>
                                )}

                                {selectedComplaint.status === 'verified' && (
                                    <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-xl border border-emerald-500/30 text-center font-bold">
                                        This task is completed and verified. 🎖️
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default WardOfficerDashboard;
