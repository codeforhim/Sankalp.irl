import React, { useState, useEffect } from 'react';
import { Map, Image as ImageIcon, Camera, CheckCircle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import CivicHeatmap from '../components/CivicHeatmap';

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
                            <div className="bg-green-50 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-green-600">{stats.verified}</p>
                                <p className="text-[10px] uppercase">Verified</p>
                            </div>
                            <div className="bg-green-50 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-green-600">{stats.resolved}</p>
                                <p className="text-[10px] uppercase">Resolved</p>
                            </div>
                            <div className="bg-yellow-50 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-yellow-600">{stats.in_progress}</p>
                                <p className="text-[10px] uppercase">Active</p>
                            </div>
                            <div className="bg-red-50 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-red-600">{stats.needs_redo}</p>
                                <p className="text-[10px] uppercase">Redo</p>
                            </div>
                            <div className="bg-blue-50 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold text-blue-600">{stats.flagged}</p>
                                <p className="text-[10px] uppercase">Flagged</p>
                            </div>
                            <div className="bg-gray-50 border rounded-lg p-2 text-center">
                                <p className="text-lg font-bold">{stats.reported}</p>
                                <p className="text-[10px] uppercase">New</p>
                            </div>
                        </div>
                    )}

                    <button onClick={generateSummary} className="text-xs flex items-center justify-center">
                        <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Regenerate
                    </button>
                </>
            ) : (
                <button
                    onClick={generateSummary}
                    className="px-4 py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Summary
                </button>
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
        setFile(e.target.files[0]);
        setVerificationResult(null);
    };

    const handleVerifySubmit = async () => {
        if (!file || !selectedComplaint) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('after_image', file);

        try {
            const res = await api.post(
                `/complaints/${selectedComplaint.id}/verify-resolution`,
                formData
            );

            setVerificationResult(res.data);

            setComplaints(prev =>
                prev.map(c =>
                    c.id === selectedComplaint.id
                        ? { ...c, status: res.data.new_status }
                        : c
                )
            );
        } catch (err) {
            setVerificationResult({ error: "Verification failed" });
        } finally {
            setUploading(false);
        }
    };

    const activeComplaints = complaints.filter(c => c.status !== 'verified');

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">

            {/* Header */}
            <div className="flex justify-between bg-white p-4 rounded-xl border">
                <div>
                    <h1 className="text-xl font-bold">Ward Dashboard</h1>
                    <p>Ward {user?.ward_id}</p>
                </div>
                <div>{activeComplaints.length} Pending</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Complaints */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl border space-y-3">
                    {activeComplaints.map(c => (
                        <div
                            key={c.id}
                            onClick={() => setSelectedComplaint(c)}
                            className="p-3 border rounded cursor-pointer"
                        >
                            <p>{c.issue_type}</p>
                            <p className="text-xs">{c.status}</p>
                        </div>
                    ))}
                </div>

                {/* AI Summary + Heatmap */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-4">
                    
                    <WardSummaryCard wardId={user?.ward_id} />

                    <div className="h-60">
                        {user?.ward_id && (
                            <CivicHeatmap
                                targetType="ward"
                                targetId={user.ward_id}
                                showPolygons={true}
                            />
                        )}
                    </div>
                </div>

                {/* Verification */}
                <div className="lg:col-span-3 bg-white p-4 rounded-xl border">

                    {!selectedComplaint ? (
                        <p>Select complaint</p>
                    ) : (
                        <div className="flex gap-4">

                            <div className="flex-1">
                                {selectedComplaint.image_url ? (
                                    <img src={selectedComplaint.image_url} alt="before" />
                                ) : (
                                    <ImageIcon />
                                )}
                            </div>

                            <div className="flex-1">
                                <input type="file" onChange={handleFileChange} />
                            </div>

                            <div className="flex-1">
                                <button
                                    onClick={handleVerifySubmit}
                                    disabled={!file || uploading}
                                    className="bg-blue-600 text-white px-4 py-2"
                                >
                                    Verify
                                </button>

                                {verificationResult && (
                                    <p>{JSON.stringify(verificationResult)}</p>
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