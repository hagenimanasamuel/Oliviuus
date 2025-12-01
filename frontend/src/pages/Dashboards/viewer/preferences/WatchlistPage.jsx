// src/pages/Dashboards/viewer/WatchlistPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Film, Loader2 } from 'lucide-react';
import api from '../../../../api/axios';
import userPreferencesApi from '../../../../api/userPreferencesApi';
import ContentCard from '../../../../components/layout/dashboard/viewer/content/ContentCard';
import { useContentDetail } from '../../../../hooks/useContentDetail';

const WatchlistPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { openDetailModal } = useContentDetail();

    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWatchlist = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/viewer/watchlist');

            if (response.data.success) {
                setWatchlist(response.data.data);
            } else {
                setWatchlist([]);
            }
        } catch (err) {
            console.error('Error fetching watchlist:', err);

            if (err.response?.status === 404) {
                setError(t('watchlist.errors.endpointNotFound'));
            } else if (err.response?.status === 401) {
                setError(t('watchlist.errors.unauthorized'));
            } else {
                setError(t('watchlist.errors.unableToLoad'));
            }

            setWatchlist([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    const handlePlayContent = useCallback((content) => {
        navigate('/watch', { state: { content } });
    }, [navigate]);

    const handleAddToLibrary = useCallback(async (content, e) => {
        e?.stopPropagation();
        console.log('Added to library:', content.title);
    }, []);

    const handleMoreInfo = useCallback((content, cardRect) => {
        openDetailModal(content, cardRect);
    }, [openDetailModal]);

    // Responsive Loading Skeleton
    const WatchlistSkeleton = () => (
        <div className="min-h-screen bg-gray-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>

                {/* Responsive Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {[...Array(12)].map((_, index) => (
                        <div
                            key={index}
                            className="w-full aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <WatchlistSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Film className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">
                        {t('watchlist.errors.unableToLoadTitle')}
                    </h3>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={fetchWatchlist}
                        className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                    >
                        {t('watchlist.errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                        {t('watchlist.title')}
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">
                        {t('watchlist.itemCount', {
                            count: watchlist.length,
                            items: watchlist.length
                        })}
                    </p>
                </div>

                {/* Watchlist Content */}
                {watchlist.length === 0 ? (
                    <div className="text-center py-16 sm:py-24">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" />
                        </div>
                        <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3">
                            {t('watchlist.emptyState.title')}
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                            {t('watchlist.emptyState.message')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Horizontal Scroll */}
                        <div className="block sm:hidden">
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
                                {watchlist.map((item) => (
                                    <div key={item.content.id} className="flex-shrink-0 w-32">
                                        <ContentCard
                                            content={item.content}
                                            size="small"
                                            onPlay={handlePlayContent}
                                            onAddToList={handleAddToLibrary}
                                            onMoreInfo={handleMoreInfo}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tablet: 3-4 columns */}
                        <div className="hidden sm:block lg:hidden">
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                                {watchlist.map((item) => (
                                    <ContentCard
                                        key={item.content.id}
                                        content={item.content}
                                        size="medium"
                                        onPlay={handlePlayContent}
                                        onAddToList={handleAddToLibrary}
                                        onMoreInfo={handleMoreInfo}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Desktop: 5-6 columns */}
                        <div className="hidden lg:block">
                            <div className="grid grid-cols-5 xl:grid-cols-6 gap-6">
                                {watchlist.map((item) => (
                                    <ContentCard
                                        key={item.content.id}
                                        content={item.content}
                                        size="medium"
                                        onPlay={handlePlayContent}
                                        onAddToList={handleAddToLibrary}
                                        onMoreInfo={handleMoreInfo}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default WatchlistPage;