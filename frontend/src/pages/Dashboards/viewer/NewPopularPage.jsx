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

    // Fetch trending content from API
    const fetchTrendingContent = useCallback(async () => {
        try {
            const response = await api.get('/trending/movies', {
                params: {
                    limit: 50,
                    refresh: false,
                    min_score: 0.01
                }
            });
            
            if (response.data.success) {
                return response.data.data || [];
            }
            return [];
        } catch (err) {
            console.error('Error fetching trending content:', err);
            return [];
        }
    }, []);

    // Fetch all content from API
    const fetchContent = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch trending content
            const trendingResponse = await fetchTrendingContent();
            
            // Fetch all content
            const response = await api.get('/viewer/content', {
                params: {
                    limit: 200
                }
            });

            if (response.data.success) {
                const allContent = response.data.data.contents || [];
                
                // Merge trending data with content data
                const contentWithTrending = allContent.map(item => {
                    // Find matching trending item
                    const trendingItem = trendingResponse.find(trending => trending.id === item.id);
                    
                    if (trendingItem) {
                        return {
                            ...item,
                            trending_score: trendingItem.trending_score,
                            trending_rank: trendingItem.trending_rank,
                            is_trending: true
                        };
                    }
                    
                    // Calculate trending score for non-trending items
                    const calculatedScore = calculateTrendingScore(item);
                    return {
                        ...item,
                        trending_score: calculatedScore,
                        trending_rank: null,
                        is_trending: calculatedScore > 0.3 // Consider as trending if score > 30%
                    };
                });

                setContent(contentWithTrending);
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
    }, [fetchTrendingContent, t]);

    // Simple trending score calculation for frontend
    const calculateTrendingScore = (item) => {
        let score = 0;
        
        // View count weight (35%)
        if (item.view_count) {
            const normalizedViews = Math.log10(item.view_count + 1) / Math.log10(100);
            score += Math.min(normalizedViews, 1) * 0.35;
        }
        
        // Rating weight (30%)
        if (item.average_rating) {
            const ratingWeight = Math.min((item.rating_count || 0) / 5, 1);
            score += Math.min(item.average_rating / 5, 1) * 0.30 * ratingWeight;
        }
        
        // Like ratio weight (20%)
        const likeRatio = item.view_count > 0 ? ((item.like_count || 0) / item.view_count) : 0;
        score += Math.min(likeRatio * 10, 1) * 0.20;
        
        // Recency weight (15%)
        const contentAgeDays = Math.max(1, Math.floor((new Date() - new Date(item.release_date || item.created_at)) / (1000 * 60 * 60 * 24)));
        if (contentAgeDays <= 7) score += 0.15;
        else if (contentAgeDays <= 30) score += 0.10;
        else if (contentAgeDays <= 90) score += 0.05;
        
        return Math.max(0.1, Math.min(1, score));
    };

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    // Enhanced content filtering with trending algorithm
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
                // Use trending algorithm score and rank
                return (item.trending_score && item.trending_score > 0.3) || 
                       item.is_trending ||
                       (item.view_count > 50 && item.trending_score > 0.2);
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
                // Sort by trending score first, then trending rank
                if (a.trending_rank && b.trending_rank) {
                    return a.trending_rank - b.trending_rank;
                }
                if (a.trending_rank && !b.trending_rank) return -1;
                if (!a.trending_rank && b.trending_rank) return 1;
                // If no rank, sort by trending score
                return (b.trending_score || 0) - (a.trending_score || 0);
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
            case 'trending': 
                // Show trending stats
                const trendingItems = displayContent.filter(item => item.trending_score > 0.3);
                const top3Items = trendingItems.filter(item => item.trending_rank && item.trending_rank <= 3);
                return (
                    <div className="flex items-center gap-2">
                        <span>{t('newPopular.tabs.descriptions.trending')}</span>
                        {top3Items.length > 0 && (
                            <span className="text-orange-400 text-xs font-medium bg-orange-400/10 px-2 py-0.5 rounded">
                                {top3Items.length} {t('common.topTrending', 'Top Trending')}
                            </span>
                        )}
                    </div>
                );
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
                                        <div key={item.id} className="flex-shrink-0 w-28 xs:w-32 relative">
                                            {/* Trending rank badge for top 3 */}
                                            {activeTab === 'trending' && item.trending_rank && item.trending_rank <= 3 && (
                                                <div className="absolute -top-2 -left-2 z-20 w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg border border-white/20">
                                                    <span className="text-white text-xs font-bold">#{item.trending_rank}</span>
                                                </div>
                                            )}
                                            
                                            {/* Trending score indicator */}
                                            {activeTab === 'trending' && item.trending_score && item.trending_score > 0.3 && (
                                                <div className="absolute top-1 right-1 z-10">
                                                    <div className="flex items-center gap-0.5 bg-black/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-orange-500/30">
                                                        <Zap className="w-2 h-2 text-orange-400" />
                                                        <span className="text-[10px] font-medium text-white">
                                                            {Math.round(item.trending_score * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

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
                                        <div key={item.id} className="relative">
                                            {/* Trending rank badge for top 3 */}
                                            {activeTab === 'trending' && item.trending_rank && item.trending_rank <= 3 && (
                                                <div className="absolute -top-2 -left-2 z-20 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg border-2 border-white/20">
                                                    <span className="text-white text-xs font-bold">#{item.trending_rank}</span>
                                                </div>
                                            )}
                                            
                                            {/* Trending score indicator */}
                                            {activeTab === 'trending' && item.trending_score && item.trending_score > 0.3 && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 border border-orange-500/30">
                                                        <Zap className="w-3 h-3 text-orange-400" />
                                                        <span className="text-xs font-medium text-white">
                                                            {Math.round(item.trending_score * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <ContentCard
                                                content={item}
                                                size="medium"
                                                onPlay={handlePlayContent}
                                                onAddToList={handleAddToLibrary}
                                                onMoreInfo={handleMoreInfo}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop: Enhanced Grid */}
                            <div className="hidden lg:block">
                                <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-5 xl:gap-6">
                                    {displayContent.map((item) => (
                                        <div key={item.id} className="relative">
                                            {/* Trending rank badge for top 3 */}
                                            {activeTab === 'trending' && item.trending_rank && item.trending_rank <= 3 && (
                                                <div className="absolute -top-2 -left-2 z-20 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg border-2 border-white/20 animate-pulse-glow">
                                                    <span className="text-white text-xs font-bold">#{item.trending_rank}</span>
                                                </div>
                                            )}
                                            
                                            {/* Trending score indicator */}
                                            {activeTab === 'trending' && item.trending_score && item.trending_score > 0.3 && (
                                                <div className="absolute top-2 right-2 z-10">
                                                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 border border-orange-500/30">
                                                        <Zap className="w-3 h-3 text-orange-400" />
                                                        <span className="text-xs font-medium text-white">
                                                            {Math.round(item.trending_score * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <ContentCard
                                                content={item}
                                                size="medium"
                                                onPlay={handlePlayContent}
                                                onAddToList={handleAddToLibrary}
                                                onMoreInfo={handleMoreInfo}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Trending Section Legend - with multilingual support */}
                {activeTab === 'trending' && displayContent.length > 0 && (
                    <div className="mt-4 sm:mt-6 border-t border-gray-800/50 pt-4 sm:pt-6">
                        <div className="text-xs text-gray-500 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    <span>{t('newPopular.tabs.trending', 'Top 3 Trending')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-orange-300"></div>
                                    <span>{t('common.highScore', 'High Score (>30%)')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 5px rgba(249, 115, 22, 0.5);
                    }
                    50% {
                        box-shadow: 0 0 15px rgba(249, 115, 22, 0.8);
                    }
                }
                
                .animate-pulse-glow {
                    animation: pulse-glow 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default NewPopularPage;