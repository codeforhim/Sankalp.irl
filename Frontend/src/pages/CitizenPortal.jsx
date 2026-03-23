import React, { useState, useEffect } from 'react';
import { Camera, Mic, MapPin, AlertCircle, CheckCircle, ThumbsUp, ThumbsDown, Award } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LocationPickerModal from '../components/LocationPickerModal';
import CivicHeatmap from '../components/CivicHeatmap';
import ChatWidget from '../components/ChatWidget';

const CitizenPortal = () => {
    const { user } = useAuth();
    const [complaintText, setComplaintText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [aiCategory, setAiCategory] = useState('');
    const [recentComplaints, setRecentComplaints] = useState([]);

    const [showLocationModal, setShowLocationModal] = useState(false);
    const [activePolls, setActivePolls] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [credibilityScore, setCredibilityScore] = useState(50);

    // Enforce location picker
    useEffect(() => {
        if (user && !user.ward_id) {
            setShowLocationModal(true);
        }
    }, [user]);

    const fetchComplaints = async () => {
        try {
            const [compRes, notifRes] = await Promise.all([
                api.get('/complaints/my'),
                api.get('/communication/my-notifications').catch(() => ({ data: { notifications: [] } })),
            ]);

            const notifications = notifRes.data.notifications || [];
            const notifMap = {};

            notifications.forEach(n => {
                if (!notifMap[n.complaint_id]) notifMap[n.complaint_id] = n.message;
            });

            const merged = compRes.data.map(c => ({
                ...c,
                ai_notification: notifMap[c.id] || null,
            }));

            setRecentComplaints(merged);
        } catch (error) {
            console.error("Error fetching complaints:", error);
        }
    };

    const fetchPollsAndLeaderboard = async () => {
        try {
            const [pollsRes, leaderRes] = await Promise.all([
                api.get('/polls/active'),
                api.get('/polls/leaderboard')
            ]);
            setActivePolls(pollsRes.data);
            setLeaderboard(leaderRes.data);
            
            // Also update credibility score from the leaderboard if user is there, 
            // or we could fetch user profile directly. For now, try to find user in leaderboard:
            const userInLeaderboard = leaderRes.data.find(u => u.id === user?.id);
            if (userInLeaderboard) {
                 setCredibilityScore(userInLeaderboard.credibility_score);
            }
        } catch (error) {
            console.error("Error fetching polls and leaderboard:", error);
        }
    };

    const handleVote = async (pollId, vote) => {
        try {
            await api.post(`/polls/${pollId}/vote`, { vote });
            // Remove poll from active view
            setActivePolls(prev => prev.filter(p => p.id !== pollId));
        } catch (err) {
            console.error("Failed to vote:", err);
            alert("Failed to submit vote. Please try again.");
        }
    };

    useEffect(() => {
        fetchComplaints();
        fetchPollsAndLeaderboard();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAudioChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!complaintText && !audioFile && !imageFile) {
            return alert("Please provide some input (text, audio, or image).");
        }

        setLoading(true);

        const formData = new FormData();
        if (complaintText) formData.append('text_input', complaintText);
        if (imageFile) formData.append('image', imageFile);
        if (audioFile) formData.append('audio', audioFile);

        formData.append('latitude', user?.latitude || 28.6139);
        formData.append('longitude', user?.longitude || 77.2090);

        if (user?.ward_id) {
            formData.append('ward_id', user.ward_id);
        }

        try {
            const res = await api.post('/complaints/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess(true);
            setAiCategory(
                `${res.data.complaint.issue_type} -> Assigned to: ${res.data.department || 'Default Department'}`
            );

            setComplaintText('');
            setImageFile(null);
            setAudioFile(null);

            fetchComplaints();

            setTimeout(() => {
                setSuccess(false);
                setAiCategory('');
            }, 8000);

        } catch (err) {
            console.error("Submission failed:", err);
            alert("Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

            {/* Location Modal */}
            {showLocationModal && (
                <LocationPickerModal
                    onClose={() => setShowLocationModal(false)}
                    forceOpen={!user?.ward_id}
                />
            )}

            {/* Header and Trust Score */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F2937]">Citizen Reporting Portal</h1>
                    <p className="text-[#6B7280] text-sm mt-1">Report civic issues instantly and securely</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center bg-[#138808]/10 px-4 py-2 rounded-full border border-[#138808]/20">
                    <span className="text-[#138808] font-semibold mr-2">Citizen Credibility Index:</span>
                    <span className="text-xl font-bold text-[#138808]">{credibilityScore}/100</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Active Verification Polls */}
                    {activePolls.length > 0 && (
                        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 animate-pulse-slow">
                            <h2 className="text-lg font-semibold text-amber-600 border-b border-amber-100 pb-2 mb-4 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                Ground Truth Verification (Action Required)
                            </h2>
                            <p className="text-sm text-[#6B7280] mb-4">
                                Ward officers claimed the following issues are resolved. Help verify the ground reality to boost your credibility score.
                            </p>
                            <div className="space-y-4">
                                {activePolls.map(poll => (
                                    <div key={poll.id} className="bg-[#F5F7FA] rounded-xl border border-[#E5E7EB] p-4">
                                        <h3 className="font-bold text-[#1F2937] mb-2">{poll.text_input || poll.issue_type}</h3>
                                        <div className="flex gap-4 mb-4">
                                            <div className="flex-1 text-center">
                                                <p className="text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">Before</p>
                                                <div className="h-24 bg-[#EEF2F7] rounded-lg overflow-hidden border border-[#E5E7EB]">
                                                {poll.before_image_url ? (
                                                    <img src={poll.before_image_url.startsWith('http') ? poll.before_image_url : `http://localhost:5001${poll.before_image_url}`} alt="Before" className="w-full h-full object-cover" />
                                                ) : <span className="text-xs flex items-center justify-center h-full text-gray-500">No Image</span>}
                                                </div>
                                            </div>
                                            <div className="flex-1 text-center">
                                                <p className="text-xs font-semibold text-[#138808] mb-1 uppercase">After (Claimed)</p>
                                                <div className="h-24 bg-[#EEF2F7] rounded-lg overflow-hidden border border-[#138808]/30">
                                                {poll.after_image_url ? (
                                                    <img src={poll.after_image_url.startsWith('http') ? poll.after_image_url : `http://localhost:5001${poll.after_image_url}`} alt="After" className="w-full h-full object-cover" />
                                                ) : <span className="text-xs flex items-center justify-center h-full text-gray-500">No Image</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-center font-medium mb-3">Is the work actually done on the ground?</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleVote(poll.id, 'done')} className="flex-1 py-2 bg-[#138808]/10 text-[#138808] border border-[#138808]/20 hover:bg-[#138808]/20 rounded-lg flex items-center justify-center font-bold text-sm transition">
                                                <ThumbsUp className="w-4 h-4 mr-2" /> Yes, Verified
                                            </button>
                                            <button onClick={() => handleVote(poll.id, 'not_done')} className="flex-1 py-2 bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 hover:bg-[#DC2626]/20 rounded-lg flex items-center justify-center font-bold text-sm transition">
                                                <ThumbsDown className="w-4 h-4 mr-2" /> No, Fake Update
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Smart Issue Reporting */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 space-y-4">
                    <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-2">Smart Issue Reporting</h2>

                    {success && (
                        <div className="bg-green-50 border border-[#138808]/20 text-[#138808] p-4 rounded-lg flex flex-col items-start space-y-2">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Report successfully submitted!</span>
                            </div>
                            <div className="pl-7 text-sm">
                                Issue categorized as: <span className="font-bold text-[#138808] bg-green-100 px-2 py-0.5 rounded">{aiCategory}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <label className={`group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition cursor-pointer ${imageFile ? 'border-[#138808] bg-green-50 overflow-hidden p-0' : 'border-[#E5E7EB] hover:border-[#1B3A6F] hover:bg-[#1B3A6F]/5'}`}>
                            {imageFile ? (
                                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover rounded-xl" style={{ maxHeight: '120px' }} />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-2 text-[#9CA3AF] group-hover:text-[#1B3A6F] transition" />
                                    <span className="text-sm font-medium text-[#6B7280] group-hover:text-[#1B3A6F] transition text-center">Upload Photo</span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <label className={`group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition cursor-pointer ${audioFile ? 'border-amber-500 bg-amber-50' : 'border-[#E5E7EB] hover:border-[#FF7A00] hover:bg-[#FF9933]/5'}`}>
                            <Mic className={`w-8 h-8 mb-2 transition ${audioFile ? 'text-amber-500' : 'text-[#9CA3AF] group-hover:text-[#FF7A00]'}`} />
                            <span className={`text-sm font-medium transition text-center ${audioFile ? 'text-amber-600' : 'text-[#6B7280] group-hover:text-[#FF7A00]'}`}>
                                {audioFile ? audioFile.name : 'Upload Voice Note'}
                            </span>
                            <input type="file" className="hidden" accept="audio/*" onChange={handleAudioChange} />
                        </label>
                    </div>

                    <div className="relative">
                        <textarea
                            value={complaintText}
                            onChange={(e) => setComplaintText(e.target.value)}
                            className="w-full mt-2 p-4 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1B3A6F]/50 min-h-[120px]"
                            placeholder="Describe the issue... AI will automatically categorize it (e.g., 'Water leakage', 'Streetlight off')"
                        ></textarea>
                    </div>

                    {/* Location Picker */}
                    <div
                        className="flex justify-between items-center text-sm text-[#138808] bg-green-50 border border-[#138808]/20 p-3 rounded-lg cursor-pointer hover:bg-green-100 transition"
                        onClick={() => setShowLocationModal(true)}
                    >
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{user?.ward_id ? `Ward ${user.ward_id} — Location Set` : 'Set your location'}</span>
                        </div>
                        <span className="text-xs underline font-semibold">Edit</span>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-semibold py-3.5 rounded-xl transition shadow-sm ${loading ? 'bg-[#FF9933]/50 text-white cursor-not-allowed border border-[#FF9933]/30' : 'gov-btn-primary'}`}
                    >
                        {loading ? 'Analyzing issue with AI...' : 'Submit Report'}
                    </button>
                </form>
            </div>

                {/* Live Status & Transparency */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                        <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-2 mb-4">Live Track Status</h2>
                        <div className="space-y-5">
                            {recentComplaints.map(complaint => (
                                <div key={complaint.id} className="flex items-start">
                                    <div className={`p-2 rounded-lg mr-3 mt-0.5 ${complaint.status === 'resolved' ? 'bg-green-100' : 'bg-amber-100'}`}>
                                        {complaint.status === 'resolved' ? <CheckCircle className="w-5 h-5 text-[#138808]" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[#1F2937]">{complaint.text_input?.substring(0, 30)}...</p>
                                        <p className="text-xs text-[#9CA3AF] mt-1">Status: <span className={complaint.status === 'resolved' ? 'text-[#138808]' : 'text-amber-500'}>{complaint.status?.toUpperCase()}</span></p>
                                        {complaint.ai_notification && (
                                            <div className="mt-2 bg-[#1B3A6F]/5 border border-[#1B3A6F]/10 rounded-lg px-3 py-2">
                                                <p className="text-xs text-[#1B3A6F] leading-relaxed">🤖 {complaint.ai_notification}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                        <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-2 mb-4">Ward Transparency Map</h2>
                        {user?.ward_id ? (
                            <div className="h-48 rounded-xl overflow-hidden border border-[#E5E7EB]">
                                <CivicHeatmap targetType="ward" targetId={user.ward_id} showPolygons={true} />
                            </div>
                        ) : (
                            <div className="bg-[#EEF2F7] border border-[#E5E7EB] w-full h-48 rounded-xl flex flex-col items-center justify-center text-[#9CA3AF] font-medium">
                                <MapPin className="w-8 h-8 opacity-50 mb-2" />
                                <span className="text-sm">Set location to view heatmap</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Leaderboard */}
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5">
                        <h2 className="text-lg font-semibold text-[#1F2937] border-b border-[#E5E7EB] pb-2 mb-4 flex items-center">
                            <Award className="w-5 h-5 mr-2 text-[#FF9933]" /> Top Trusted Citizens
                        </h2>
                        <div className="space-y-3">
                            {leaderboard.map((u, index) => (
                                <div key={u.id} className={`flex items-center justify-between p-2 rounded-lg ${u.id === user?.id ? 'bg-[#1B3A6F]/5 border border-[#1B3A6F]/20' : ''}`}>
                                    <div className="flex items-center">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${index < 3 ? 'bg-[#FF9933] text-white' : 'bg-gray-100 text-gray-500'}`}>{index + 1}</span>
                                        <span className={`text-sm ${u.id === user?.id ? 'font-bold text-[#1B3A6F]' : 'font-medium text-[#1F2937]'}`}>
                                            {u.id === user?.id ? 'You' : u.email.split('@')[0]}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-[#138808]">{u.credibility_score}/100</span>
                                    </div>
                                </div>
                            ))}
                            {leaderboard.length === 0 && <p className="text-xs text-gray-500 text-center">No scores yet</p>}
                        </div>
                    </div>
                </div>

            </div>

            {/* AI Agent Chat Widget */}
            <ChatWidget role="citizen" userId={user?.id} />
        </div>
    );
};

export default CitizenPortal;