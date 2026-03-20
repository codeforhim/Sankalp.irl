import React, { useState, useEffect } from 'react';
import { Camera, Mic, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LocationPickerModal from '../components/LocationPickerModal';
import CivicHeatmap from '../components/CivicHeatmap';

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

        if (!complaintText && !audioFile && !imageFile) {
            return alert("Please provide some input (text, audio, or image).");
        }

        setLoading(true);

        const formData = new FormData();
        if (complaintText) formData.append('text_input', complaintText);
        if (imageFile) formData.append('image', imageFile);
        if (audioFile) formData.append('audio', audioFile);

        // ✅ Real location (fixed)
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

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-[#1F2937]">Citizen Reporting Portal</h1>
                    <p className="text-[#6B7280] text-sm mt-1">
                        Report civic issues instantly and securely
                    </p>
                </div>

                <div className="mt-4 md:mt-0 flex items-center bg-[#138808]/10 px-4 py-2 rounded-full border border-[#138808]/20">
                    <span className="text-[#138808] font-semibold mr-2">
                        Citizen Credibility Index:
                    </span>
                    <span className="text-xl font-bold text-[#138808]">85/100</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Reporting Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-5 lg:col-span-2 space-y-4"
                >
                    <h2 className="text-lg font-semibold text-[#1F2937] border-b pb-2">
                        Smart Issue Reporting
                    </h2>

                    {success && (
                        <div className="bg-green-50 border border-[#138808]/20 text-[#138808] p-4 rounded-lg">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <span className="font-semibold">Report submitted!</span>
                            </div>
                            <p className="text-sm mt-2">
                                Issue categorized as:
                                <span className="ml-1 font-bold">{aiCategory}</span>
                            </p>
                        </div>
                    )}

                    {/* Uploads */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer">
                            {imageFile ? (
                                <img
                                    src={URL.createObjectURL(imageFile)}
                                    alt="Preview"
                                    className="h-24 object-cover rounded"
                                />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8 mb-2 text-gray-400" />
                                    <span>Upload Photo</span>
                                </>
                            )}
                            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                        </label>

                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer">
                            <Mic className="w-8 h-8 mb-2 text-gray-400" />
                            <span>{audioFile ? audioFile.name : 'Upload Voice'}</span>
                            <input type="file" hidden accept="audio/*" onChange={handleAudioChange} />
                        </label>
                    </div>

                    {/* Text */}
                    <textarea
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        className="w-full p-4 border rounded-xl"
                        placeholder="Describe the issue..."
                    />

                    {/* Location */}
                    <div
                        className="flex justify-between items-center p-3 border rounded-lg cursor-pointer"
                        onClick={() => setShowLocationModal(true)}
                    >
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>
                                {user?.ward_id
                                    ? `Ward ${user.ward_id}`
                                    : 'Set your location'}
                            </span>
                        </div>
                        <span className="text-xs underline">Edit</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl"
                    >
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>

                {/* Sidebar */}
                <div className="space-y-6">

                    {/* Complaints */}
                    <div className="bg-white p-5 rounded-xl border">
                        <h2 className="font-semibold mb-4">Live Status</h2>

                        {recentComplaints.map(c => (
                            <div key={c.id} className="flex items-start mb-4">
                                <div className="mr-3">
                                    {c.status === 'resolved'
                                        ? <CheckCircle className="text-green-500" />
                                        : <AlertCircle className="text-yellow-500" />
                                    }
                                </div>

                                <div>
                                    <p className="text-sm">{c.text_input?.slice(0, 30)}</p>
                                    <p className="text-xs">{c.status}</p>

                                    {c.ai_notification && (
                                        <p className="text-xs mt-1">🤖 {c.ai_notification}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Heatmap */}
                    <div className="bg-white p-5 rounded-xl border">
                        <h2 className="font-semibold mb-4">Ward Map</h2>

                        {user?.ward_id ? (
                            <CivicHeatmap
                                targetType="ward"
                                targetId={user.ward_id}
                                showPolygons={true}
                            />
                        ) : (
                            <p className="text-sm text-gray-400">
                                Set location to view map
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CitizenPortal;