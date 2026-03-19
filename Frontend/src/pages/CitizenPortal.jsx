import React, { useState, useEffect } from 'react';
import { Camera, Mic, MapPin, AlertCircle, CheckCircle, Upload, Megaphone } from 'lucide-react';
import api from '../utils/api';

const CitizenPortal = () => {
    const [complaintText, setComplaintText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [aiCategory, setAiCategory] = useState('');
    const [recentComplaints, setRecentComplaints] = useState([]);

    const fetchComplaints = async () => {
        try {
            const [compRes, notifRes] = await Promise.all([
                api.get('/complaints/my'),
                api.get('/communication/my-notifications').catch(() => ({ data: { notifications: [] } })),
            ]);
            // Merge notifications into complaints
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

    useEffect(() => {
        fetchComplaints();
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
        if (!complaintText && !audioFile && !imageFile) return alert("Please provide some input (text, audio, or image).");

        setLoading(true);
        const formData = new FormData();
        if (complaintText) formData.append('text_input', complaintText);
        if (imageFile) formData.append('image', imageFile);
        if (audioFile) formData.append('audio', audioFile);

        // Mock location for demo purposes (Delhi Central)
        formData.append('latitude', 28.6139);
        formData.append('longitude', 77.2090);

        try {
            const res = await api.post('/complaints/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(true);
            setAiCategory(`${res.data.complaint.issue_type} -> Assigned to: ${res.data.department || 'Default Department'}`);
            setComplaintText('');
            setImageFile(null);
            setAudioFile(null);

            // Refresh complaint list to show the newly submitted one
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

            {/* Header and Trust Score */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-white/5 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-white">Citizen Reporting Portal</h1>
                    <p className="text-slate-400 text-sm mt-1">Report civic issues instantly and securely</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                    <span className="text-indigo-400 font-semibold mr-2">Your Trust Score:</span>
                    <span className="text-xl font-bold text-indigo-300">85/100</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Smart Issue Reporting */}
                <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5 lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Smart Issue Reporting</h2>

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg flex flex-col items-start space-y-2">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Report successfully submitted!</span>
                            </div>
                            <div className="pl-7 text-sm">
                                Issue categorized as: <span className="font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">{aiCategory}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <label className={`group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition cursor-pointer ${imageFile ? 'border-emerald-500 bg-emerald-500/5 overflow-hidden p-0' : 'border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5'}`}>
                            {imageFile ? (
                                <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover rounded-xl" style={{ maxHeight: '120px' }} />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
                                    <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-300 transition text-center">
                                        Upload Photo
                                    </span>
                                </>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <label className={`group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition cursor-pointer ${audioFile ? 'border-amber-500 bg-amber-500/5' : 'border-slate-700 hover:border-rose-500 hover:bg-rose-500/5'}`}>
                            <Mic className={`w-8 h-8 mb-2 transition ${audioFile ? 'text-amber-400' : 'text-slate-500 group-hover:text-rose-400'}`} />
                            <span className={`text-sm font-medium transition text-center ${audioFile ? 'text-amber-300' : 'text-slate-400 group-hover:text-rose-300'}`}>
                                {audioFile ? audioFile.name : 'Upload Voice Note'}
                            </span>
                            <input type="file" className="hidden" accept="audio/*" onChange={handleAudioChange} />
                        </label>
                    </div>

                    <div className="relative">
                        <textarea
                            value={complaintText}
                            onChange={(e) => setComplaintText(e.target.value)}
                            className="w-full mt-2 p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]"
                            placeholder="Describe the issue... AI will automatically categorize it (e.g., 'Water leakage', 'Streetlight off')"
                        ></textarea>
                    </div>

                    <div className="flex items-center text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Location auto-detected: Ward 1 (Delhi Central)</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-semibold py-3.5 rounded-xl transition shadow-lg ${loading ? 'bg-indigo-900/50 text-indigo-200 cursor-not-allowed border border-indigo-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'}`}
                    >
                        {loading ? 'Analyzing issue with AI...' : 'Submit Report'}
                    </button>
                </form>

                {/* Live Status & Transparency */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Live Track Status</h2>
                        <div className="space-y-5">
                            {recentComplaints.map(complaint => (
                                <div key={complaint.id} className="flex items-start">
                                    <div className={`p-2 rounded-lg mr-3 mt-0.5 ${complaint.status === 'resolved' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                                        {complaint.status === 'resolved' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-200">{complaint.text_input.substring(0, 30)}...</p>
                                        <p className="text-xs text-slate-500 mt-1">Status: <span className={complaint.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'}>{complaint.status.toUpperCase()}</span></p>
                                        {complaint.ai_notification && (
                                            <div className="mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                                                <p className="text-xs text-indigo-300 leading-relaxed">
                                                    🤖 {complaint.ai_notification}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2 mb-4">Ward Transparency Map</h2>
                        <div className="bg-slate-800/50 border border-slate-700 w-full h-48 rounded-xl flex flex-col items-center justify-center text-slate-500 font-medium overflow-hidden">
                            <MapPin className="w-8 h-8 opacity-50 mb-2" />
                            <span className="text-sm">Ward 1 Heatmap Data</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CitizenPortal;
