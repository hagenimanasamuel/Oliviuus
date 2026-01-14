// src/pages/Dashboards/viewer/BrowsePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axios';
import ContentCard from '../../../components/layout/dashboard/viewer/content/ContentCard.jsx';
import { useContentDetail } from '../../../hooks/useContentDetail';

const BrowsePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { openDetailModal } = useContentDetail();

    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/viewer/content', {
                params: {
                    limit: 200
                }
            });

            if (response.data.success) {
                setContent(response.data.data.contents || []);
            } else {
                setContent([]);
            }
        } catch (err) {
            console.error('Error fetching content:', err);
            setError(t('browse.errors.unableToLoad'));
            setContent([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

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

    // Loading Skeleton - Compact design
    const BrowseSkeleton = () => (
        <div className="min-h-screen bg-gray-900 pt-14">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                {/* Compact Header Skeleton */}
                <div className="mb-4 sm:mb-5">
                    <div className="h-5 sm:h-6 bg-gray-700 rounded w-32 sm:w-40 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>

                {/* Compact Grid Skeleton */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
                    {[...Array(14)].map((_, index) => (
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
        return <BrowseSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 pt-14 flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 text-red-400">!</div>
                    </div>
                    <h3 className="text-white text-base sm:text-lg font-semibold mb-1">
                        {t('browse.errors.unableToLoadTitle')}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-3">{error}</p>
                    <button
                        onClick={fetchContent}
                        className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm"
                    >
                        {t('browse.errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 pt-14">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                {/* Compact Header */}
                <div className="mb-4 sm:mb-5">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                        {t('browse.title')}
                    </h1>
                    <p className="text-gray-400 text-xs mt-0.5">
                        {t('browse.subtitle')}
                    </p>
                </div>

                {/* Content - Ultra Compact Responsive Grid */}
                {content.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500">📺</div>
                        </div>
                        <h3 className="text-white text-sm sm:text-base font-semibold mb-1">
                            {t('browse.emptyState.title')}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm max-w-xs mx-auto">
                            {t('browse.emptyState.message')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Compact Horizontal Scroll */}
                        <div className="block sm:hidden">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-3 px-3">
                                {content.map((item) => (
                                    <div key={item.id} className="flex-shrink-0 w-24 xs:w-26">
                                        <ContentCard
                                            content={item}
                                            size="small"
                                            onPlay={handlePlayContent}
                                            onAddToList={handleAddToLibrary}
                                            onMoreInfo={handleMoreInfo}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tablet: Compact Grid */}
                        <div className="hidden sm:block lg:hidden">
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5">
                                {content.map((item) => (
                                    <ContentCard
                                        key={item.id}
                                        content={item}
                                        size="medium"
                                        onPlay={handlePlayContent}
                                        onAddToList={handleAddToLibrary}
                                        onMoreInfo={handleMoreInfo}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Desktop: Ultra Compact Grid */}
                        <div className="hidden lg:block">
                            <div className="grid grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 lg:gap-3">
                                {content.map((item) => (
                                    <ContentCard
                                        key={item.id}
                                        content={item}
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

            {/* Minimal bottom padding */}
            <div className="h-2 sm:h-3"></div>
        </div>
    );
};

export default BrowsePage;