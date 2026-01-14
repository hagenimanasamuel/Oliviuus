// src/pages/Dashboards/viewer/WatchHistoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Play, Calendar, Eye, Film, Loader2 } from 'lucide-react';
import api from '../../../api/axios';
import { useContentDetail } from '../../../hooks/useContentDetail';

const WatchHistoryPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { openDetailModal } = useContentDetail();

    const [watchHistory, setWatchHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWatchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/viewer/watch-history', {
                params: {
                    limit: 100
                }
            });

            if (response.data.success) {
                setWatchHistory(response.data.data.history || []);
            } else {
                setWatchHistory([]);
            }
        } catch (err) {
            console.error('Error fetching watch history:', err);

            if (err.response?.status === 401) {
                setError(t('watchHistory.errors.unauthorized'));
            } else if (err.response?.status === 404) {
                setError(t('watchHistory.errors.endpointNotFound'));
            } else {
                setError(t('watchHistory.errors.unableToLoad'));
            }

            setWatchHistory([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchWatchHistory();
    }, [fetchWatchHistory]);

    const handleContentClick = useCallback((content) => {
        // Navigate to title detail page - simple /title/id format
        navigate(`/title/${content.content_id || content.id}`);
    }, [navigate]);

    const handlePlayContent = useCallback(async (historyItem, e) => {
        e?.stopPropagation();
        
        try {
            // Navigate directly to watch page with content ID
            navigate(`/watch/${historyItem.content_id}`, {
                state: {
                    resumeTime: Math.floor(historyItem.watch_duration_seconds || 0),
                    content: historyItem
                }
            });
        } catch (err) {
            console.error('Error playing content:', err);
            // Fallback to basic navigation
            navigate('/watch', { state: { content: historyItem } });
        }
    }, [navigate]);

    const handleImageClick = useCallback((historyItem, e) => {
        e.stopPropagation();
        openDetailModal(historyItem, null);
    }, [openDetailModal]);

    const formatWatchDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return t('watchHistory.today');
        } else if (diffDays === 1) {
            return t('watchHistory.yesterday');
        } else if (diffDays < 7) {
            return t('watchHistory.daysAgo', { days: diffDays });
        } else {
            return date.toLocaleDateString(undefined, { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    };

    const getCompletionPercentage = (historyItem) => {
        if (!historyItem.duration_minutes) return 0;
        const totalSeconds = historyItem.duration_minutes * 60;
        const watchedSeconds = historyItem.watch_duration_seconds || 0;
        return Math.min(Math.round((watchedSeconds / totalSeconds) * 100), 100);
    };

    const getWatchButtonText = (historyItem) => {
        const completion = getCompletionPercentage(historyItem);
        if (completion > 10) {
            return t('watchHistory.continueWatching');
        } else if (completion > 0) {
            return t('watchHistory.startWatching');
        }
        return t('watchHistory.watchNow');
    };

    // Group history by date
    const groupedHistory = watchHistory.reduce((groups, item) => {
        const date = new Date(item.created_at).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {});

    // Loading Skeleton - Enhanced for all devices
    const WatchHistorySkeleton = () => (
        <div className="min-h-screen bg-gray-900 pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header Skeleton */}
                <div className="mb-6 sm:mb-8">
                    <div className="h-7 sm:h-8 bg-gray-700 rounded w-48 sm:w-64 mb-3 sm:mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-32 sm:w-48 animate-pulse"></div>
                </div>

                {/* History Items Skeleton - Responsive */}
                <div className="space-y-3 sm:space-y-4">
                    {[...Array(6)].map((_, index) => (
                        <div key={index} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800 rounded-lg animate-pulse">
                            {/* Image Skeleton */}
                            <div className="w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 bg-gray-700 rounded flex-shrink-0"></div>
                            
                            {/* Content Skeleton */}
                            <div className="flex-1 space-y-2 sm:space-y-3">
                                <div className="h-4 sm:h-5 bg-gray-700 rounded w-3/4 sm:w-2/3"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2 sm:w-1/3"></div>
                                <div className="h-2 bg-gray-700 rounded w-full"></div>
                                <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                                
                                {/* Progress Bar Skeleton */}
                                <div className="pt-2">
                                    <div className="h-2 bg-gray-700 rounded-full w-full"></div>
                                </div>
                            </div>
                            
                            {/* Button Skeleton */}
                            <div className="w-24 sm:w-28 h-10 bg-gray-700 rounded-lg flex-shrink-0"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <WatchHistorySkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 pt-16 sm:pt-20 flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                    </div>
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                        {t('watchHistory.errors.unableToLoadTitle')}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">{error}</p>
                    <button
                        onClick={fetchWatchHistory}
                        className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                        {t('watchHistory.errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-lg sm:rounded-xl">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                            {t('watchHistory.title')}
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base">
                        {t('watchHistory.itemCount', {
                            count: watchHistory.length,
                            items: watchHistory.length
                        })}
                    </p>
                </div>

                {/* Watch History Content */}
                {watchHistory.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 lg:py-24">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <Clock className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-500" />
                        </div>
                        <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3">
                            {t('watchHistory.emptyState.title')}
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto px-4">
                            {t('watchHistory.emptyState.message')}
                        </p>
                        <button
                            onClick={() => navigate('/browse')}
                            className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                        >
                            {t('watchHistory.emptyState.browseContent')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Grouped History */}
                        {Object.entries(groupedHistory).map(([date, items]) => (
                            <div key={date} className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-700 pb-2">
                                    {formatWatchDate(date)}
                                </h3>
                                
                                <div className="grid gap-3 sm:gap-4">
                                    {items.map((historyItem) => (
                                        <div
                                            key={historyItem.id}
                                            className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-800 rounded-lg transition-all hover:bg-gray-750 cursor-pointer group"
                                            onClick={() => handleContentClick(historyItem)}
                                        >
                                            {/* Content Image with Subtle Zoom */}
                                            <div 
                                                className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 relative overflow-hidden rounded-lg"
                                                onClick={(e) => handleImageClick(historyItem, e)}
                                            >
                                                {historyItem.thumbnail_url ? (
                                                    <img
                                                        src={historyItem.thumbnail_url}
                                                        alt={historyItem.title}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg flex items-center justify-center group-hover:from-gray-600 group-hover:to-gray-500 transition-all duration-300">
                                                        <Film className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Details */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3 gap-1 sm:gap-0">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 
                                                                className="text-white font-semibold text-base sm:text-lg lg:text-xl cursor-pointer hover:text-[#BC8BBC] transition-colors line-clamp-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleContentClick(historyItem);
                                                                }}
                                                            >
                                                                {historyItem.title}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {formatWatchDate(historyItem.created_at)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {formatDuration(historyItem.watch_duration_seconds)}
                                                                </span>
                                                                {historyItem.percentage_watched > 0 && (
                                                                    <span className="text-[#BC8BBC] font-medium">
                                                                        {Math.round(historyItem.percentage_watched)}% {t('watchHistory.completed')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Watch Button - Desktop */}
                                                        <div className="hidden sm:flex">
                                                            <button
                                                                onClick={(e) => handlePlayContent(historyItem, e)}
                                                                className="flex items-center gap-2 bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-4 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 min-w-28 justify-center cursor-pointer"
                                                            >
                                                                <Play className="w-4 h-4" fill="currentColor" />
                                                                {getWatchButtonText(historyItem)}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {historyItem.duration_minutes && (
                                                        <div className="mt-2 sm:mt-3">
                                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                                <span>
                                                                    {t('watchHistory.progress')}: {getCompletionPercentage(historyItem)}%
                                                                </span>
                                                                <span>
                                                                    {formatDuration(historyItem.watch_duration_seconds)} / {historyItem.duration_minutes}m
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 h-full rounded-full transition-all duration-500"
                                                                    style={{ width: `${getCompletionPercentage(historyItem)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Device Info */}
                                                    {historyItem.device_type && (
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            {t('watchHistory.watchedOn')}: <span className="capitalize">{historyItem.device_type}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Watch Button - Mobile */}
                                                <div className="flex sm:hidden mt-3">
                                                    <button
                                                        onClick={(e) => handlePlayContent(historyItem, e)}
                                                        className="flex items-center gap-2 bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-4 py-2 rounded-lg font-semibold transition-colors w-full justify-center text-sm cursor-pointer"
                                                    >
                                                        <Play className="w-4 h-4" fill="currentColor" />
                                                        {getWatchButtonText(historyItem)}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile Bottom Padding */}
            <div className="h-4 sm:h-8"></div>
        </div>
    );
};

export default WatchHistoryPage;