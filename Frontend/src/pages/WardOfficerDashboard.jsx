import React, { useState, useEffect } from 'react';
import { Map, Image as ImageIcon, Camera, CheckCircle, AlertCircle, Sparkles, RefreshCw, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CivicHeatmap from '../components/CivicHeatmap';
import ChatWidget from '../components/ChatWidget';

const WardFeedback = ({ wardId }) => {
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!wardId) return;
        const fetchFeedback = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/communication/ward/${wardId}/feedback`);
                setFeedback(res.data.feedback || []);
            } catch (err) {
                console.error('Failed to load feedback:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, [wardId]);

    if (loading) return <div className="text-sm text-gray-500">Loading feedback...</div>;
    if (feedback.length === 0) return <div className="text-sm text-gray-500">No citizen feedback received for this ward yet.</div>;

    return (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {feedback.map(f => (
                <div key={f.id} className="p-3 bg-gray-50 border rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                            {f.issue_type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {new Date(f.created_at).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-800 my-1">{f.comment}</p>
                    <p className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2 mt-2">
                        Update: "{f.update_message}"
                    </p>
                </div>
            ))}
        </div>
    );
};

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
                    <div className="bg-[#1B3A6F]/5 border border-[#1B3A6F]/15 rounded-xl p-4">
                        <p className="text-sm text-[#1B3A6F] leading-relaxed">🤖 {summary}</p>
                    </div>
                    {stats && (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <div className="bg-green-50 border border-[#138808]/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-[#138808]">{stats.verified}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase">Verified</p>
                            </div>
                            <div className="bg-green-50/50 border border-[#138808]/10 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-[#138808]">{stats.resolved}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase">Resolved</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-400/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-amber-600">{stats.in_progress}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase">Active</p>
                            </div>
                            <div className="bg-red-50 border border-[#DC2626]/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-[#DC2626]">{stats.needs_redo}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase">Redo</p>
                            </div>
                            <div className="bg-blue-50 border border-[#1B3A6F]/20 rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-[#1B3A6F]">{stats.flagged}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase">Flagged</p>
                            </div>
                            <div className="bg-gray-50 border border-[#E5E7EB] rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-[#6B7280]">{stats.reported}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase">New</p>
                            </div>
                        </div>
                    )}
                    <button onClick={generateSummary} disabled={loading}
                        className="flex items-center justify-center space-x-2 text-xs text-[#6B7280] hover:text-[#1B3A6F] transition mt-1">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                    </button>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center min-h-[180px]">
                    <button onClick={generateSummary} disabled={loading}
                        className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition shadow-sm ${loading ? 'bg-[#1B3A6F]/30 text-white cursor-wait' : 'gov-btn-secondary'}`}>
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
        if (score >= 80) return <span className="text-[#DC2626] font-bold ml-2 text-xs bg-red-50 px-2 py-0.5 rounded-full border border-[#DC2626]/20">🔴 {score} Critical</span>;
        if (score >= 60) return <span className="text-orange-600 font-bold ml-2 text-xs bg-orange-50 px-2 py-0.5 rounded-full border border-orange-400/20">🟠 {score} High</span>;
        if (score >= 40) return <span className="text-amber-600 font-bold ml-2 text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-400/20">🟡 {score} Medium</span>;
        return <span className="text-[#138808] font-bold ml-2 text-xs bg-green-50 px-2 py-0.5 rounded-full border border-[#138808]/20">🟢 {score} Low</span>;
    };

    useEffect(() => {
        const fetchComplaints = async () => {
            if (!user?.ward_id) return;
            try {
                const res = await api.get(`/complaints/ward/${user.ward_id}`);
                setComplaints(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, [user]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setVerificationResult(null);
        }
    };

    const handleVerifySubmit = async () => {
        if (!file || !selectedComplaint) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('after_image', file);

        try {
            const res = await api.post(`/complaints/${selectedComplaint.id}/verify-resolution`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setVerificationResult(res.data);
            setComplaints(prev => prev.map(c =>
                c.id === selectedComplaint.id ? { ...c, status: res.data.new_status } : c
            ));
        } catch (err) {
            console.error("Verification failed:", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to connect to AI Verification Service.";
            setVerificationResult({ error: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    const activeComplaints = complaints.filter(c => c.status !== 'verified');

    if (loading) return <div className="text-[#6B7280] text-center mt-20">Loading Dashboard...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F2937]">Ward Officer Command Center</h1>
                    <p className="text-[#6B7280] text-sm mt-1">Ward {user?.ward_id || 'X'} • Operational Dashboard</p>
                </div>
                <div className="bg-[#FF9933]/10 text-[#FF7A00] px-4 py-2 rounded-xl font-semibold border border-[#FF9933]/20 shadow-sm">
                    {activeComplaints.filter(c => c.status !== 'resolved').length} Tasks Pending
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* AI Prioritized Queue */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                    <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-2 mb-4">Assigned Tasks Queue</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {activeComplaints.length === 0 ? (
                            <div className="text-[#9CA3AF] text-center py-10">No pending tasks! Outstanding work.</div>
                        ) : (
                            activeComplaints.map(complaint => (
                                <div key={complaint.id}
                                    onClick={() => { setSelectedComplaint(complaint); setFile(null); setVerificationResult(null); }}
                                    className={`p-5 rounded-xl flex justify-between items-start transition cursor-pointer border ${selectedComplaint?.id === complaint.id ? 'border-[#1B3A6F] bg-[#1B3A6F]/5' : 'border-[#E5E7EB] bg-[#F5F7FA] hover:bg-[#EEF2F7]'}`}>
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            {complaint.status === 'in_progress' ? (
                                                complaint.ai_feedback && complaint.ai_feedback.startsWith('REJECTED') ? (
                                                    <span className="bg-red-50 text-[#DC2626] border border-[#DC2626]/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase whitespace-nowrap">Proof Rejected</span>
                                                ) : (
                                                    <span className="bg-amber-50 text-amber-600 border border-amber-400/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase whitespace-nowrap">In Progress</span>
                                                )
                                            ) : complaint.status === 'rejected' ? (
                                                <span className="bg-red-50 text-[#DC2626] border border-[#DC2626]/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Rejected</span>
                                            ) : complaint.status === 'flagged_for_review' ? (
                                                <span className="bg-blue-50 text-[#1B3A6F] border border-[#1B3A6F]/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Awaiting Review</span>
                                            ) : complaint.status === 'resolved' ? (
                                                <span className="bg-green-50 text-[#138808] border border-[#138808]/20 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Resolved</span>
                                            ) : (
                                                <span className="bg-gray-100 text-[#6B7280] border border-[#E5E7EB] text-xs px-2.5 py-1 rounded-full font-bold uppercase">{complaint.status}</span>
                                            )}
                                            <h3 className="font-semibold text-[#1F2937] capitalize">{complaint.issue_type}</h3>
                                            {getPriorityBadge(complaint.priority_score)}
                                        </div>
                                        <p className="text-sm text-[#6B7280] mt-2">{complaint.text_input}</p>
                                    </div>
                                    <div className="text-right text-xs text-[#9CA3AF]">{new Date(complaint.created_at).toLocaleDateString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* AI Ward Summary + Heatmap */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col space-y-4">
                    <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-2 mb-2">AI Ward Summary</h2>
                    <WardSummaryCard wardId={user?.ward_id} />
                    
                    {user?.ward_id && (
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-[#1F2937] mb-2">Ward Heatmap</h3>
                            <div className="h-60 rounded-xl overflow-hidden border border-[#E5E7EB]">
                                <CivicHeatmap targetType="ward" targetId={user.ward_id} showPolygons={true} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Evidence Verification */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                    <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-3 mb-6">Evidence Verification (AI Matching)</h2>

                    {!selectedComplaint ? (
                        <div className="text-center text-[#9CA3AF] py-10 border border-dashed border-[#E5E7EB] rounded-xl">
                            Select a task from the queue to upload proof of resolution.
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Before Image */}
                            <div className="flex-1 bg-[#F5F7FA] p-6 rounded-xl border border-[#E5E7EB] text-center flex flex-col items-center justify-center">
                                <p className="text-xs font-semibold text-[#9CA3AF] mb-3 tracking-wider uppercase">Citizen Submitted Evidence</p>
                                <div className="h-40 w-full bg-[#EEF2F7] rounded-lg overflow-hidden border border-[#E5E7EB] flex items-center justify-center">
                                    {selectedComplaint.image_url ? (
                                        <img src={selectedComplaint.image_url.startsWith('http') ? selectedComplaint.image_url : `http://localhost:5001${selectedComplaint.image_url}`}
                                            alt="Before" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-[#9CA3AF]">
                                            <ImageIcon className="w-8 h-8 mb-2" />
                                            <span className="text-xs">No image provided</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* After Image Upload */}
                            <label className={`flex-1 group cursor-pointer border-2 border-dashed rounded-2xl transition flex flex-col items-center justify-center p-6 text-center ${file ? 'border-[#138808]/50 bg-green-50' : 'border-[#E5E7EB] hover:border-[#1B3A6F]/50 hover:bg-[#1B3A6F]/5'}`}>
                                <p className="text-xs font-semibold text-[#9CA3AF] mb-3 tracking-wider uppercase">Officer Submitted Proof</p>
                                {file ? (
                                    <div className="text-[#138808] flex flex-col items-center">
                                        <CheckCircle className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-semibold">{file.name} ready to submit</span>
                                    </div>
                                ) : (
                                    <div className="text-[#1B3A6F] flex flex-col items-center">
                                        <Camera className="w-10 h-10 mb-2" />
                                        <span className="text-xs font-medium">Click to upload completion evidence</span>
                                    </div>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>

                            {/* Verification Status */}
                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                {(verificationResult || selectedComplaint.ai_feedback) && (
                                    <div className={`p-4 rounded-xl text-sm border ${
                                        (verificationResult?.new_status || selectedComplaint.status) === 'resolved' ? 'bg-green-50 border-[#138808]/20 text-[#138808]' :
                                        (selectedComplaint.status === 'in_progress' && selectedComplaint.ai_feedback?.startsWith('REJECTED')) ? 'bg-red-50 border-[#DC2626]/20 text-[#DC2626]' :
                                        'bg-blue-50 border-[#1B3A6F]/20 text-[#1B3A6F]'
                                    }`}>
                                        <p className="font-bold mb-2">
                                            {(verificationResult?.new_status || selectedComplaint.status) === 'resolved' ? '✅ Status: Resolved' :
                                                (selectedComplaint.status === 'in_progress' && selectedComplaint.ai_feedback?.startsWith('REJECTED')) ? '❌ Status: Proof Rejected' :
                                                '⚠️ Status: Awaiting Review'}
                                        </p>
                                        <div className="bg-[#F5F7FA] p-3 rounded border border-[#E5E7EB] font-mono text-xs leading-relaxed text-[#1F2937]">
                                            {verificationResult?.ai_analysis?.message || selectedComplaint.ai_feedback || "No feedback from AI yet."}
                                        </div>
                                    </div>
                                )}

                                {((selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'verified') ||
                                    (selectedComplaint.ai_feedback?.includes('REJECTED'))) && (
                                    <button onClick={handleVerifySubmit} disabled={!file || uploading}
                                        className={`font-semibold py-3 rounded-xl transition shadow-sm ${file && !uploading ? 'gov-btn-primary' : 'bg-[#EEF2F7] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]'}`}>
                                        {uploading ? 'AI is Analyzing...' : 'Submit to AI for Verification'}
                                    </button>
                                )}

                                {selectedComplaint.status === 'resolved' && !selectedComplaint.ai_feedback?.includes('REJECTED') && (
                                    <div className="bg-green-50 text-[#138808] p-4 rounded-xl border border-[#138808]/20 text-center font-bold">
                                        Resolution submitted! Awaiting Admin verification. ⏳
                                    </div>
                                )}

                                {selectedComplaint.status === 'verified' && (
                                    <div className="bg-green-50 text-[#138808] p-4 rounded-xl border border-[#138808]/20 text-center font-bold">
                                        This task is completed and verified. 🎖️
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                </div>

                {/* Citizen Feedback Insights */}
                <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                        Citizen Feedback Insights
                    </h2>
                    <WardFeedback wardId={user?.ward_id} />
                </div>

            </div>

            {/* AI Agent Chat Widget */}
            <ChatWidget role="ward_officer" userId={user?.id} extraContext={{ ward_id: user?.ward_id }} />
        </div>
    );
};

export default WardOfficerDashboard;