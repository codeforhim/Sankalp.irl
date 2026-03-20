import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, CheckCircle, Clock, AlertTriangle, RefreshCw, ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LanguageToggle from '../components/LanguageToggle';

const getStatusStyle = (status, t) => {
    switch (status) {
        case 'resolved': return { bg: 'bg-green-50', border: 'border-[#138808]/20', text: 'text-[#138808]', icon: <CheckCircle className="w-4 h-4" />, label: t('status_resolved') };
        case 'in_progress': return { bg: 'bg-amber-50', border: 'border-amber-400/20', text: 'text-amber-600', icon: <Clock className="w-4 h-4" />, label: t('status_in_progress') };
        case 'flagged_for_review': return { bg: 'bg-blue-50', border: 'border-[#1B3A6F]/20', text: 'text-[#1B3A6F]', icon: <AlertTriangle className="w-4 h-4" />, label: t('status_under_review') };
        default: return { bg: 'bg-gray-50', border: 'border-[#E5E7EB]', text: 'text-[#6B7280]', icon: <Clock className="w-4 h-4" />, label: status || t('status_reported') };
    }
};

const UpdateCard = ({ update }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [likes, setLikes] = useState(parseInt(update.likes_count) || 0);
    const [dislikes, setDislikes] = useState(parseInt(update.dislikes_count) || 0);
    const [userReaction, setUserReaction] = useState(update.user_reaction || null);
    
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentsCount, setCommentsCount] = useState(parseInt(update.comments_count) || 0);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const style = getStatusStyle(update.status, t);

    const handleReaction = async (type) => {
        if (!user) return alert(t('login_to_react'));
        
        try {
            await api.post(`/communication/updates/${update.id}/react`, { reaction_type: type });
            
            // Optimistic update
            if (userReaction === type) {
                // Remove reaction
                if (type === 'like') setLikes(l => Math.max(0, l - 1));
                if (type === 'dislike') setDislikes(d => Math.max(0, d - 1));
                setUserReaction(null);
            } else {
                // Change or add reaction
                if (type === 'like') {
                    setLikes(l => l + 1);
                    if (userReaction === 'dislike') setDislikes(d => Math.max(0, d - 1));
                }
                if (type === 'dislike') {
                    setDislikes(d => d + 1);
                    if (userReaction === 'like') setLikes(l => Math.max(0, l - 1));
                }
                setUserReaction(type);
            }
        } catch (err) {
            console.error("Failed to post reaction", err);
        }
    };

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            try {
                const res = await api.get(`/communication/updates/${update.id}/feedback`);
                setComments(res.data.feedback || []);
            } catch (err) {
                console.error("Failed to load comments", err);
            } finally {
                setLoadingComments(false);
            }
        }
        setShowComments(!showComments);
    };

    const handlePostComment = async () => {
        if (!user) return alert(t('login_to_feedback'));
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const res = await api.post(`/communication/updates/${update.id}/feedback`, { comment: newComment });
            // add to top
            setComments([{ ...res.data.feedback, user_name: user.email.split('@')[0].substring(0,3) + '***' }, ...comments]);
            setNewComment('');
            setCommentsCount(c => c + 1);
        } catch (err) {
            console.error("Failed to post comment", err);
            alert(t('feedback_failed'));
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <div className={`bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-start space-x-4 shadow-sm transition hover:-translate-y-0.5 relative`}>
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
                        <span className="text-xs text-[#9CA3AF]">• {t('ward')} {update.ward_id}</span>
                    )}
                </div>
                
                <p className="text-sm text-[#1F2937] leading-relaxed">{update.message}</p>
                
                <p className="text-xs text-[#9CA3AF] mt-2 mb-3">
                    {new Date(update.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>

                {/* Interactions Bar */}
                <div className="flex items-center space-x-4 border-t border-gray-100 pt-3">
                    <button 
                        onClick={() => handleReaction('like')}
                        className={`flex items-center space-x-1.5 text-xs font-medium transition ${userReaction === 'like' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                        <span>{likes}</span>
                    </button>
                    
                    <button 
                        onClick={() => handleReaction('dislike')}
                        className={`flex items-center space-x-1.5 text-xs font-medium transition ${userReaction === 'dislike' ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                    >
                        <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                        <span>{dislikes}</span>
                    </button>

                    <button 
                        onClick={toggleComments}
                        className="flex items-center space-x-1.5 text-xs font-medium text-gray-500 hover:text-[#1B3A6F] transition ml-auto"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>{commentsCount} {commentsCount === 1 ? t('comment') : t('comments')}</span>
                    </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                        
                        {/* Add Comment Input */}
                        <div className="flex space-x-2">
                            <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={user ? t('add_feedback_placeholder') : t('login_feedback_placeholder')}
                                disabled={!user || submittingComment}
                                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
                                onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(); }}
                            />
                            <button 
                                onClick={handlePostComment}
                                disabled={!user || !newComment.trim() || submittingComment}
                                className="bg-[#1B3A6F] text-white px-3 py-2 rounded-lg disabled:opacity-50 transition"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Comments List */}
                        {loadingComments ? (
                            <p className="text-xs text-center text-gray-400 py-2">{t('loading_feedback')}</p>
                        ) : comments.length === 0 ? (
                            <p className="text-xs text-center text-gray-400 py-2">{t('no_feedback')}</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {comments.map(c => (
                                    <div key={c.id} className="bg-white p-2.5 rounded border border-gray-100 shadow-sm flex flex-col">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="text-xs font-semibold text-gray-700">{c.user_name}</span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{c.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const PublicFeed = () => {
    const { t } = useTranslation();
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

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-[#1B3A6F]/10 rounded-lg">
                        <Megaphone className="w-6 h-6 text-[#1B3A6F]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#1F2937]">{t('public_feed')}</h1>
                        <p className="text-[#9CA3AF] text-sm">{t('public_feed_subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <LanguageToggle />
                    <button
                        onClick={fetchFeed}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 text-sm bg-[#EEF2F7] hover:bg-[#E5E7EB] text-[#6B7280] px-4 py-2 rounded-lg transition border border-[#E5E7EB]"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>{t('refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Feed — Timeline style */}
            {loading ? (
                <div className="text-center py-20 text-[#9CA3AF]">{t('loading_updates')}</div>
            ) : updates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
                    <Megaphone className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                    <p className="text-[#9CA3AF] text-sm">{t('no_updates')}</p>
                </div>
            ) : (
                <div className="relative pl-6 border-l-2 border-[#1B3A6F]/20 space-y-4">
                    {updates.map((update) => (
                        <UpdateCard key={update.id} update={update} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublicFeed;
