// src/pages/Dashboards/viewer/NewPopularPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calendar, Star, Zap, Film, Tv } from 'lucide-react';
import api from '../../../api/axios';
import ContentCard from '../../../components/layout/dashboard/viewer/content/ContentCard';
import { useContentDetail } from '../../../hooks/useContentDetail';

const NewPopularPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { openDetailModal } = useContentDetail();

    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('new');

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
            setError(t('newPopular.errors.unableToLoad'));
            setContent([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    // Enhanced content filtering
    const filteredContent = content.filter(item => {
        const releaseDate = new Date(item.release_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        switch (activeTab) {
            case 'new':
                return releaseDate >= ninetyDaysAgo;
            case 'trending':
                return item.trending || 
                       item.view_count > 50 || 
                       (item.view_count > 20 && releaseDate >= thirtyDaysAgo);
            case 'popular':
                return item.average_rating >= 3.5 || 
                       item.view_count > 100 || 
                       item.featured;
            default:
                return true;
        }
    }).sort((a, b) => {
        switch (activeTab) {
            case 'new':
                return new Date(b.release_date) - new Date(a.release_date);
            case 'trending':
                const aScore = (a.trending ? 1000 : 0) + (a.view_count || 0);
                const bScore = (b.trending ? 1000 : 0) + (b.view_count || 0);
                return bScore - aScore;
            case 'popular':
                const aPopularity = (a.average_rating || 0) * 100 + (a.view_count || 0);
                const bPopularity = (b.average_rating || 0) * 100 + (b.view_count || 0);
                return bPopularity - aPopularity;
            default:
                return new Date(b.release_date) - new Date(a.release_date);
        }
    });

    // Fallback content
    const displayContent = filteredContent.length > 0 ? filteredContent : 
        content.slice(0, 20).sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

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

    // Loading Skeleton - Enhanced for mobile
    const NewPopularSkeleton = () => (
        <div className="min-h-screen bg-gray-900 pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                {/* Header Skeleton */}
                <div className="mb-6 sm:mb-8">
                    <div className="h-6 sm:h-8 bg-gray-700 rounded w-40 sm:w-64 mb-3 sm:mb-4 animate-pulse"></div>
                    <div className="h-3 sm:h-4 bg-gray-700 rounded w-32 sm:w-48 animate-pulse"></div>
                </div>

                {/* Tabs Skeleton - Responsive */}
                <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide pb-2">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="h-10 sm:h-12 bg-gray-800 rounded-lg w-28 sm:w-32 flex-shrink-0 animate-pulse"></div>
                    ))}
                </div>

                {/* Grid Skeleton - Responsive */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
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
        return <NewPopularSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 pt-16 sm:pt-20 flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                    </div>
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                        {t('newPopular.errors.unableToLoadTitle')}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">{error}</p>
                    <button
                        onClick={fetchContent}
                        className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                        {t('newPopular.errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    const getTabDescription = () => {
        switch (activeTab) {
            case 'new': return t('newPopular.tabs.descriptions.new');
            case 'trending': return t('newPopular.tabs.descriptions.trending');
            case 'popular': return t('newPopular.tabs.descriptions.popular');
            default: return t('newPopular.tabs.descriptions.default');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 pt-16 sm:pt-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
                {/* Header - Simplified */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-lg sm:rounded-xl">
                            <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                            {t('newPopular.title')}
                        </h1>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm">
                        {getTabDescription()}
                    </p>
                </div>

                {/* Enhanced Responsive Tabs */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all flex-shrink-0 whitespace-nowrap ${
                                activeTab === 'new'
                                    ? 'bg-[#BC8BBC] text-white shadow-lg'
                                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-semibold text-xs sm:text-sm">
                                {t('newPopular.tabs.new')}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('trending')}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all flex-shrink-0 whitespace-nowrap ${
                                activeTab === 'trending'
                                    ? 'bg-[#BC8BBC] text-white shadow-lg'
                                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-semibold text-xs sm:text-sm">
                                {t('newPopular.tabs.trending')}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('popular')}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all flex-shrink-0 whitespace-nowrap ${
                                activeTab === 'popular'
                                    ? 'bg-[#BC8BBC] text-white shadow-lg'
                                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-semibold text-xs sm:text-sm">
                                {t('newPopular.tabs.popular')}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content Section - Enhanced Responsive Grid */}
                <div className="mb-8">
                    {displayContent.length === 0 ? (
                        <div className="text-center py-12 sm:py-16 lg:py-24">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-500" />
                            </div>
                            <h3 className="text-white text-base sm:text-lg lg:text-xl font-semibold mb-2">
                                {t('newPopular.emptyState.noContentTitle')}
                            </h3>
                            <p className="text-gray-400 text-sm sm:text-base max-w-xs sm:max-w-md mx-auto px-2">
                                {t('newPopular.emptyState.noContentMessage')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Enhanced Horizontal Scroll */}
                            <div className="block sm:hidden">
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-3 px-3">
                                    {displayContent.map((item) => (
                                        <div key={item.id} className="flex-shrink-0 w-28 xs:w-32">
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

                            {/* Tablet: Enhanced Grid */}
                            <div className="hidden sm:block lg:hidden">
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                    {displayContent.map((item) => (
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

                            {/* Desktop: Enhanced Grid */}
                            <div className="hidden lg:block">
                                <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5 xl:gap-6">
                                    {displayContent.map((item) => (
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

                {/* Empty State Enhancement */}
                {content.length === 0 && !loading && (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" />
                        </div>
                        <h3 className="text-white text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                            {t('newPopular.emptyState.welcomeTitle')}
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto px-4">
                            {t('newPopular.emptyState.welcomeMessage')}
                        </p>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Padding for Better UX */}
            <div className="h-4 sm:h-8"></div>
        </div>
    );
};

export default NewPopularPage;