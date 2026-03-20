import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, ShieldQuestion, ShieldX, Clock, ExternalLink } from 'lucide-react';
import api from '../utils/api';

const NewsVerification = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manualQuery, setManualQuery] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [manualResult, setManualResult] = useState(null);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/news');
            setNews(res.data);
        } catch (err) {
            console.error("Failed to fetch news:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        if (!manualQuery.trim()) return;

        setVerifying(true);
        setManualResult(null);
        try {
            const isUrl = manualQuery.startsWith('http');
            const payload = isUrl ? { url: manualQuery } : { text: manualQuery };
            
            const res = await api.post('/news/verify', payload);
            setManualResult(res.data.verification);
            
            fetchNews();
        } catch (err) {
            console.error("Manual verification failed", err);
            alert("Verification failed. Please try again later.");
        } finally {
            setVerifying(false);
        }
    };

    const VerificationBadge = ({ verdict, confidence }) => {
        let style = 'bg-gray-100 text-[#6B7280] border-[#E5E7EB]';
        let icon = <ShieldQuestion className="w-4 h-4 mr-1.5" />;
        
        if (verdict === 'Verified') {
            style = 'bg-green-50 text-[#138808] border-[#138808]/30';
            icon = <CheckCircle className="w-4 h-4 mr-1.5" />;
        } else if (verdict === 'Misleading') {
            style = 'bg-amber-50 text-amber-600 border-amber-400/30';
            icon = <ShieldAlert className="w-4 h-4 mr-1.5" />;
        } else if (verdict === 'Fake') {
            style = 'bg-red-50 text-[#DC2626] border-[#DC2626]/30';
            icon = <ShieldX className="w-4 h-4 mr-1.5" />;
        }

        return (
            <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase flex items-center ${style}`}>
                {icon}
                {verdict} • {Math.round(confidence * 100)}% Match
            </div>
        );
    };

    const NewsCard = ({ item }) => (
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB] shadow-sm space-y-3 hover:shadow-md hover:-translate-y-0.5 transition">
            <div className="flex justify-between items-start">
                <VerificationBadge verdict={item.verdict} confidence={item.confidence} />
                <span className="text-xs text-[#9CA3AF] flex items-center bg-[#F5F7FA] px-2 py-1 rounded">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
            
            <h3 className="text-[#1F2937] font-bold leading-tight pt-1">
                {item.title}
            </h3>
            
            <p className="text-sm text-[#6B7280] line-clamp-2">
                {item.description}
            </p>

            {item.explanation && (
                <div className="bg-[#EEF2F7] border border-[#E5E7EB] rounded-lg p-3 text-sm text-[#1B3A6F] italic">
                    <span className="font-semibold text-[#9CA3AF] not-italic mr-1 text-xs uppercase">AI REASONING:</span> 
                    {item.explanation}
                </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-[#1B3A6F]">{item.source}</span>
                    <span className="text-[10px] text-[#138808] font-bold bg-green-50 border border-[#138808]/20 px-1.5 py-0.5 rounded">Verified by Sankalp AI</span>
                </div>
                {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6B7280] hover:text-[#1B3A6F] flex items-center gap-1 transition">
                        Read Source <ExternalLink className="w-3 h-3" />
                    </a>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm mb-8 border-t-4 border-t-[#1B3A6F]">
                <div>
                    <h1 className="text-3xl font-black text-[#1F2937] tracking-tight">Verified Public News Portal</h1>
                    <p className="text-[#6B7280] mt-1.5 font-medium">Official AI-powered fact verification system</p>
                </div>
                <div className="mt-4 md:mt-0 px-4 py-2 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl text-[#DC2626] font-semibold text-sm flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2" />
                    Fighting Misinformation
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Validation Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm sticky top-24">
                        <h2 className="text-lg font-bold text-[#1F2937] flex items-center mb-1">
                            Verify Any News
                        </h2>
                        <p className="text-xs text-[#6B7280] mb-5">Paste a URL or news snippet below to check its credibility.</p>
                        
                        <form onSubmit={handleVerifySubmit} className="space-y-4">
                            <textarea
                                value={manualQuery}
                                onChange={(e) => setManualQuery(e.target.value)}
                                placeholder="E.g., https://timesofindia.com/article... or 'Scientists discover new cure...'"
                                className="w-full h-32 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl p-4 text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1B3A6F] focus:ring-1 focus:ring-[#1B3A6F] transition resize-none"
                            ></textarea>
                            
                            <button
                                type="submit"
                                disabled={verifying || !manualQuery.trim()}
                                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center transition shadow-sm ${verifying || !manualQuery.trim() ? 'bg-[#1B3A6F]/30 text-white cursor-not-allowed' : 'gov-btn-secondary'}`}
                            >
                                {verifying ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Analyzing Sources...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5 mr-2" />
                                        Verify News Fact
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Recent Verification Result */}
                        {manualResult && (
                            <div className="mt-6 pt-6 border-t border-[#E5E7EB] animate-fadeIn">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Verification Result</h3>
                                <NewsCard item={manualResult} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Feed List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold text-[#1F2937] flex items-center">
                            Live News Feed 
                            <span className="flex h-2 w-2 ml-3">
                              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#DC2626] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DC2626]"></span>
                            </span>
                        </h2>
                        <span className="text-xs text-[#6B7280] font-medium bg-[#EEF2F7] px-3 py-1 rounded-full border border-[#E5E7EB]">Auto-updates every 15m</span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="h-48 bg-[#EEF2F7] animate-pulse rounded-xl border border-[#E5E7EB]"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {news.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-[#9CA3AF]">
                                    No news items have been processed yet.
                                </div>
                            ) : (
                                news.map(item => (
                                    <NewsCard key={item.id} item={item} />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsVerification;
