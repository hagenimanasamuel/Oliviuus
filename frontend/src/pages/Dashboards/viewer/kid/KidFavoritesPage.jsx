// src/pages/Dashboards/kid/KidFavoritesPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
    Play,
    Plus,
    Info,
    X,
    Loader2,
    Heart,
    Clock,
    Bookmark,
    Star,
    Filter,
    Grid,
    List,
    AlertCircle,
    Trash2,
    Check,
    BookOpen,
    GraduationCap,
    Sparkles,
    Baby,
    ChevronLeft,
    ChevronRight,
    Search,
    TrendingUp
} from "lucide-react";
import api from "../../../../api/axios";
import { useContentDetail } from '../../../../hooks/useContentDetail';
import ContentDetailPage from '../ContentDetailPage';
import { useTranslation } from "react-i18next";

export default function KidFavoritesPage({ kidProfile }) {
    const { t } = useTranslation(); // Initialize translation hook
    const navigate = useNavigate();

    const {
        detailModal,
        openDetailModal,
        closeDetailModal
    } = useContentDetail();

    const [likedContents, setLikedContents] = useState([]);
    const [watchLaterContents, setWatchLaterContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'liked', 'watchlater'
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isRemoving, setIsRemoving] = useState({});

    // Fetch kid's favorites and watch later
    const fetchKidFavorites = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch liked content using the new endpoint
            const likedResponse = await api.get('/kid/liked-content');
            const likedData = likedResponse.data.data;

            // Fetch watch later content using the new endpoint
            const watchLaterResponse = await api.get('/kid/watch-later');
            const watchLaterData = watchLaterResponse.data.data;

            // Process and set content
            setLikedContents(likedData.favorites || []);
            setWatchLaterContents(watchLaterData.watchlist || []);

            // Calculate total pages (20 items per page)
            const allContent = [...(likedData.favorites || []), ...(watchLaterData.watchlist || [])];
            setTotalPages(Math.ceil(allContent.length / 20));

        } catch (err) {
            console.error('Error fetching kid favorites:', err);
            setError(t('favorites.errors.loading'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Initial load
    useEffect(() => {
        fetchKidFavorites();
    }, [fetchKidFavorites]);

    // Filter content based on active tab and search
    const getFilteredContent = () => {
        let content = [];

        switch (activeTab) {
            case 'liked':
                content = likedContents;
                break;
            case 'watchlater':
                content = watchLaterContents;
                break;
            default:
                // Combine and deduplicate
                const allContent = [...likedContents, ...watchLaterContents];
                const uniqueContent = allContent.filter((item, index, self) =>
                    index === self.findIndex((t) => t.id === item.id)
                );
                content = uniqueContent;
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            content = content.filter(item =>
                item.title?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query) ||
                item.genres?.some(genre => genre.toLowerCase().includes(query))
            );
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * 20;
        const endIndex = startIndex + 20;
        return content.slice(startIndex, endIndex);
    };

    // Handle play content
    const handlePlayContent = useCallback((content) => {
        if (content?.id) {
            navigate(`/watch/${content.id}`);
        }
    }, [navigate]);

    // Handle more info
    const handleMoreInfo = useCallback((content, cardRect) => {
        openDetailModal(content, cardRect);
    }, [openDetailModal]);

    // Handle remove from liked list
    const handleRemoveFromLiked = useCallback(async (content) => {
        try {
            setIsRemoving(prev => ({ ...prev, [content.id]: true }));

            await api.delete(`/kid/liked-content/${content.id}`);
            setLikedContents(prev => prev.filter(item => item.id !== content.id));

            // Show success message
            setTimeout(() => {
                setIsRemoving(prev => ({ ...prev, [content.id]: false }));
            }, 500);

        } catch (err) {
            console.error('Error removing from liked:', err);
            setIsRemoving(prev => ({ ...prev, [content.id]: false }));
        }
    }, []);

    // Handle remove from watch later list
    const handleRemoveFromWatchLater = useCallback(async (content) => {
        try {
            setIsRemoving(prev => ({ ...prev, [content.id]: true }));

            await api.delete(`/kid/watch-later/${content.id}`);
            setWatchLaterContents(prev => prev.filter(item => item.id !== content.id));

            setTimeout(() => {
                setIsRemoving(prev => ({ ...prev, [content.id]: false }));
            }, 500);

        } catch (err) {
            console.error('Error removing from watch later:', err);
            setIsRemoving(prev => ({ ...prev, [content.id]: false }));
        }
    }, []);

    // Handle toggle like
    const handleToggleLike = useCallback(async (content) => {
        try {
            setIsRemoving(prev => ({ ...prev, [content.id]: true }));

            if (likedContents.some(item => item.id === content.id)) {
                await api.delete(`/kid/liked-content/${content.id}`);
                setLikedContents(prev => prev.filter(item => item.id !== content.id));
            } else {
                await api.post(`/kid/liked-content`, { contentId: content.id });
                setLikedContents(prev => [...prev, content]);
            }

            setTimeout(() => {
                setIsRemoving(prev => ({ ...prev, [content.id]: false }));
            }, 500);

        } catch (err) {
            console.error('Error toggling like:', err);
            setIsRemoving(prev => ({ ...prev, [content.id]: false }));
        }
    }, [likedContents]);

    // Handle toggle watch later
    const handleToggleWatchLater = useCallback(async (content) => {
        try {
            setIsRemoving(prev => ({ ...prev, [content.id]: true }));

            if (watchLaterContents.some(item => item.id === content.id)) {
                await api.delete(`/kid/watch-later/${content.id}`);
                setWatchLaterContents(prev => prev.filter(item => item.id !== content.id));
            } else {
                await api.post(`/kid/watch-later`, { contentId: content.id });
                setWatchLaterContents(prev => [...prev, content]);
            }

            setTimeout(() => {
                setIsRemoving(prev => ({ ...prev, [content.id]: false }));
            }, 500);

        } catch (err) {
            console.error('Error toggling watch later:', err);
            setIsRemoving(prev => ({ ...prev, [content.id]: false }));
        }
    }, [watchLaterContents]);

    // Handle page change
    const handlePageChange = useCallback((page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);

    // Get age rating color
    const getAgeRatingColor = (rating) => {
        const ratingMap = {
            'all': 'bg-gradient-to-r from-green-500 to-emerald-500',
            '3+': 'bg-gradient-to-r from-blue-400 to-blue-600',
            '4+': 'bg-gradient-to-r from-blue-400 to-blue-600',
            '5+': 'bg-gradient-to-r from-blue-400 to-blue-600',
            '6+': 'bg-gradient-to-r from-purple-400 to-purple-600',
            '7+': 'bg-gradient-to-r from-purple-400 to-purple-600',
            '8+': 'bg-gradient-to-r from-pink-400 to-pink-600',
            '9+': 'bg-gradient-to-r from-pink-400 to-pink-600',
            '10+': 'bg-gradient-to-r from-orange-400 to-orange-600',
            '11+': 'bg-gradient-to-r from-orange-400 to-orange-600',
            '12+': 'bg-gradient-to-r from-red-400 to-red-600',
            'G': 'bg-gradient-to-r from-green-500 to-emerald-500',
            'TV-Y': 'bg-gradient-to-r from-green-400 to-green-600',
            'TV-Y7': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
            'PG': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
            'default': 'bg-gradient-to-r from-gray-500 to-gray-600'
        };
        return ratingMap[rating] || ratingMap.default;
    };

    // Loading skeleton
    const ContentGridSkeleton = () => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(12)].map((_, index) => (
                <div key={index} className="animate-pulse">
                    <div className="bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 rounded-xl aspect-[2/3] mb-2"></div>
                    <div className="h-4 bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 rounded mb-1"></div>
                    <div className="h-3 bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 rounded w-2/3"></div>
                </div>
            ))}
        </div>
    );

    // If detail modal is open, show the ContentDetailPage
    if (detailModal.isOpen) {
        return (
            <ContentDetailPage
                content={detailModal.content}
                onPlay={handlePlayContent}
            />
        );
    }

    // Get filtered content
    const filteredContent = getFilteredContent();
    const totalLiked = likedContents.length;
    const totalWatchLater = watchLaterContents.length;
    const totalAll = [...new Set([...likedContents.map(c => c.id), ...watchLaterContents.map(c => c.id)])].length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] via-[#1A1A2E] to-[#16213E] pb-12">
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{t('favorites.seo.title')}</title>
                <meta name="description" content={t('favorites.seo.description')} />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            {/* ✅ COMPACT: Hero Header in single line */}
            <div className="relative bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 border-b border-[#BC8BBC]/30 pt-16">
                <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/10 to-[#9A679A]/10"></div>
                <div className="relative container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] rounded-lg shadow-lg">
                                    <Heart className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-[#FFD166] font-bold text-xs sm:text-sm">
                                    {t('favorites.header.title')}
                                </span>
                            </div>
                            
                            <span className="text-white font-bold text-base sm:text-lg mx-2">|</span>
                            
                            <h1 className="text-white font-bold text-base sm:text-lg md:text-xl">
                                {t('favorites.header.subtitle')}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ FIXED: Search and Filter Bar */}
            <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0F0F23] to-[#1A1A2E]/95 backdrop-blur-sm border-b border-[#BC8BBC]/30 pt-14">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 backdrop-blur-sm rounded-lg p-1 border border-[#BC8BBC]/30">
                            <button
                                onClick={() => {
                                    setActiveTab('all');
                                    setCurrentPage(1);
                                }}
                                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#BC8BBC]/30'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('favorites.tabs.all')}</span>
                                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{totalAll}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('liked');
                                    setCurrentPage(1);
                                }}
                                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'liked' ? 'bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#FF6B8B]/30'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('favorites.tabs.liked')}</span>
                                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{totalLiked}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setActiveTab('watchlater');
                                    setCurrentPage(1);
                                }}
                                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'watchlater' ? 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#4ECDC4]/30'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span className="hidden sm:inline">{t('favorites.tabs.watchLater')}</span>
                                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{totalWatchLater}</span>
                                </div>
                            </button>
                        </div>

                        {/* Search and View Controls */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('favorites.search.placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full sm:w-48 px-4 py-2.5 pl-10 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 backdrop-blur-sm border border-[#BC8BBC]/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD166] focus:border-transparent text-sm"
                                />
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#BC8BBC]" />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-1 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 backdrop-blur-sm rounded-lg p-1 border border-[#BC8BBC]/30">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#BC8BBC] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#BC8BBC]/30'}`}
                                    title={t('favorites.buttons.gridView')}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#BC8BBC] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#BC8BBC]/30'}`}
                                    title={t('favorites.buttons.listView')}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {(searchQuery || activeTab !== 'all') && (
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-gray-400 text-xs sm:text-sm">
                                {t('favorites.activeFilters')}:
                            </span>

                            {activeTab !== 'all' && (
                                <div className="flex items-center gap-1 bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 text-[#BC8BBC] px-2 sm:px-3 py-1 rounded-full text-xs border border-[#BC8BBC]/30">
                                    {activeTab === 'liked' && t('favorites.badges.liked')}
                                    {activeTab === 'watchlater' && t('favorites.badges.watchLater')}
                                    <button
                                        onClick={() => setActiveTab('all')}
                                        className="ml-1 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {searchQuery && (
                                <div className="flex items-center gap-1 bg-gradient-to-r from-[#4ECDC4]/20 to-[#44A08D]/20 text-[#4ECDC4] px-2 sm:px-3 py-1 rounded-full text-xs border border-[#4ECDC4]/30">
                                    🔍 "{searchQuery}"
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="ml-1 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {(searchQuery || activeTab !== 'all') && (
                                <button
                                    onClick={() => {
                                        setActiveTab('all');
                                        setSearchQuery('');
                                    }}
                                    className="text-[#BC8BBC] hover:text-[#FFD166] text-xs underline transition-colors font-medium"
                                >
                                    {t('favorites.buttons.clearFilters')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ✅ FIXED: Main Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="text-gray-300">
                        {loading ? (
                            <div className="h-5 w-40 bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 rounded animate-pulse"></div>
                        ) : (
                            <>
                                <span className="font-bold text-lg sm:text-xl text-white">{filteredContent.length}</span>
                                <span className="text-gray-400"> {t('favorites.results.videosFound')}</span>
                                {searchQuery && (
                                    <span className="text-[#4ECDC4] ml-1 sm:ml-2">{t('favorites.results.searchFor', { query: searchQuery })}</span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="space-y-6">
                        <ContentGridSkeleton />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#FF6B8B]/20 to-[#FF8E53]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF6B8B]" />
                        </div>
                        <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                            {t('favorites.errors.title')}
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto">{error}</p>
                        <button
                            onClick={fetchKidFavorites}
                            className="bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] hover:from-[#9A679A] hover:to-[#BC8BBC] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                        >
                            {t('favorites.buttons.tryAgain')}
                        </button>
                    </div>
                ) : filteredContent.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            {activeTab === 'liked' ? (
                                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-[#BC8BBC]" />
                            ) : activeTab === 'watchlater' ? (
                                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-[#BC8BBC]" />
                            ) : (
                                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#BC8BBC]" />
                            )}
                        </div>
                        <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                            {searchQuery ? t('favorites.emptyStates.noMatches') :
                                activeTab === 'liked' ? t('favorites.emptyStates.noLikedVideos') :
                                    activeTab === 'watchlater' ? t('favorites.emptyStates.noWatchLater') :
                                        t('favorites.emptyStates.noFavorites')}
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-md mx-auto">
                            {searchQuery ? t('favorites.emptyStates.tryDifferentSearch') :
                                activeTab === 'liked' ? t('favorites.emptyStates.likeSomeVideos') :
                                    activeTab === 'watchlater' ? t('favorites.emptyStates.addToWatchLater') :
                                        t('favorites.emptyStates.startLiking')}
                        </p>
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] hover:from-[#9A679A] hover:to-[#BC8BBC] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                            >
                                {t('favorites.buttons.clearSearch')}
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/')}
                                className="bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] hover:from-[#9A679A] hover:to-[#BC8BBC] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                            >
                                {t('favorites.buttons.browseVideos')}
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid View */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                        {filteredContent.map((content) => {
                            const isLiked = likedContents.some(item => item.id === content.id);
                            const isWatchLater = watchLaterContents.some(item => item.id === content.id);

                            return (
                                <div
                                    key={content.id}
                                    className="group relative bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#BC8BBC]/20 hover:border-[#FFD166] transition-all duration-300 hover:shadow-xl hover:shadow-[#BC8BBC]/10 transform hover:-translate-y-1"
                                >
                                    {/* List Badges */}
                                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                        {isLiked && (
                                            <div className="bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                <Heart className="w-3 h-3" />
                                                <span>{t('favorites.badges.liked')}</span>
                                            </div>
                                        )}
                                        {isWatchLater && (
                                            <div className="bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                                <Clock className="w-3 h-3" />
                                                <span>{t('favorites.badges.watchLater')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Age Rating Badge */}
                                    {content.age_rating && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <div className={`${getAgeRatingColor(content.age_rating)} text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-lg`}>
                                                {content.age_rating}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Image */}
                                    <div
                                        className="aspect-[2/3] bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 overflow-hidden cursor-pointer"
                                        onClick={() => handleMoreInfo(content)}
                                    >
                                        {content.primary_image_url ? (
                                            <img
                                                src={content.primary_image_url}
                                                alt={content.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 p-4">
                                                <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-[#BC8BBC]/50 mb-2" />
                                                <span className="text-[#BC8BBC]/50 text-xs text-center">{content.title}</span>
                                            </div>
                                        )}
                                        {/* Play Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayContent(content);
                                                    }}
                                                    className="bg-gradient-to-r from-[#FFD166] to-[#FFB347] hover:from-[#FFB347] hover:to-[#FFD166] text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                                                >
                                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="p-3 sm:p-4">
                                        <h3
                                            className="text-white font-bold text-sm sm:text-base mb-1 line-clamp-1 cursor-pointer hover:text-[#FFD166] transition-colors"
                                            onClick={() => handleMoreInfo(content)}
                                        >
                                            {content.title}
                                        </h3>

                                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-[#4ECDC4]" />
                                                {content.duration_minutes ?
                                                    `${Math.floor(content.duration_minutes / 60)}h ${content.duration_minutes % 60}m` :
                                                    t('favorites.metadata.durationNA')
                                                }
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-[#FFD166]" />
                                                <span>{t('favorites.metadata.kidSafe')}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#BC8BBC]/20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlayContent(content);
                                                }}
                                                className="flex items-center gap-1 text-[#FFD166] hover:text-[#FFB347] text-xs font-bold transition-colors"
                                            >
                                                <Play className="w-3 h-3" />
                                                {t('favorites.buttons.watch')}
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {/* Like Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleLike(content);
                                                    }}
                                                    disabled={isRemoving[content.id]}
                                                    className={`p-1.5 rounded-md transition-all ${isLiked ? 'text-[#FF6B8B] hover:text-[#FF8E53]' : 'text-gray-400 hover:text-white'} ${isRemoving[content.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={isLiked ? t('favorites.tooltips.removeFromLiked') : t('favorites.tooltips.addToLiked')}
                                                >
                                                    {isRemoving[content.id] ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                                                    )}
                                                </button>

                                                {/* Watch Later Button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleWatchLater(content);
                                                    }}
                                                    disabled={isRemoving[content.id]}
                                                    className={`p-1.5 rounded-md transition-all ${isWatchLater ? 'text-[#4ECDC4] hover:text-[#44A08D]' : 'text-gray-400 hover:text-white'} ${isRemoving[content.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={isWatchLater ? t('favorites.tooltips.removeFromWatchLater') : t('favorites.tooltips.addToWatchLater')}
                                                >
                                                    {isRemoving[content.id] ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Clock className={`w-3 h-3 ${isWatchLater ? 'text-current' : ''}`} />
                                                    )}
                                                </button>

                                                {/* Remove Button */}
                                                {(isLiked || isWatchLater) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isLiked) handleRemoveFromLiked(content);
                                                            else handleRemoveFromWatchLater(content);
                                                        }}
                                                        disabled={isRemoving[content.id]}
                                                        className="p-1.5 text-gray-400 hover:text-[#FF6B6B] rounded-md transition-all"
                                                        title={t('favorites.tooltips.removeFromList')}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-3">
                        {filteredContent.map((content) => {
                            const isLiked = likedContents.some(item => item.id === content.id);
                            const isWatchLater = watchLaterContents.some(item => item.id === content.id);

                            return (
                                <div
                                    key={content.id}
                                    className="group bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#BC8BBC]/20 hover:border-[#FFD166] transition-all duration-300"
                                >
                                    <div className="flex flex-col sm:flex-row">
                                        {/* Thumbnail */}
                                        <div
                                            className="w-full sm:w-48 h-40 sm:h-32 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 relative cursor-pointer"
                                            onClick={() => handleMoreInfo(content)}
                                        >
                                            {content.primary_image_url ? (
                                                <img
                                                    src={content.primary_image_url}
                                                    alt={content.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10">
                                                    <BookOpen className="w-8 h-8 text-[#BC8BBC]/50" />
                                                </div>
                                            )}

                                            {/* List Badges */}
                                            <div className="absolute top-2 left-2 flex gap-1">
                                                {isLiked && (
                                                    <div className="bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Heart className="w-3 h-3" />
                                                    </div>
                                                )}
                                                {isWatchLater && (
                                                    <div className="bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Play Button */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlayContent(content);
                                                    }}
                                                    className="bg-gradient-to-r from-[#FFD166] to-[#FFB347] hover:from-[#FFB347] hover:to-[#FFD166] text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                                                >
                                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content Details */}
                                        <div className="flex-1 p-3 sm:p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3
                                                            className="text-white font-bold text-base sm:text-lg cursor-pointer hover:text-[#FFD166] transition-colors"
                                                            onClick={() => handleMoreInfo(content)}
                                                        >
                                                            {content.title}
                                                        </h3>
                                                        {content.age_rating && (
                                                            <span className={`${getAgeRatingColor(content.age_rating)} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                                                                {content.age_rating}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-gray-300 text-sm mb-2 sm:mb-3 line-clamp-2">
                                                        {content.description || t('favorites.metadata.noDescription')}
                                                    </p>

                                                    {/* Metadata */}
                                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#4ECDC4]" />
                                                            {content.duration_minutes ?
                                                                `${Math.floor(content.duration_minutes / 60)}h ${content.duration_minutes % 60}m` :
                                                                t('favorites.metadata.durationNAFull')
                                                            }
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD166]" />
                                                            <span>{t('favorites.metadata.kidSafe')}</span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badges */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {isLiked && (
                                                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-[#FF6B8B]/20 to-[#FF8E53]/20 text-[#FF6B8B] rounded-full">
                                                                {t('favorites.badges.liked')}
                                                            </span>
                                                        )}
                                                        {isWatchLater && (
                                                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-[#4ECDC4]/20 to-[#44A08D]/20 text-[#4ECDC4] rounded-full">
                                                                {t('favorites.badges.watchLater')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex sm:flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handlePlayContent(content)}
                                                            className="flex items-center gap-2 bg-gradient-to-r from-[#FFD166] to-[#FFB347] hover:from-[#FFB347] hover:to-[#FFD166] text-white px-3 sm:px-4 py-2 rounded-lg font-bold transition-all shadow-lg"
                                                        >
                                                            <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                                                            <span className="hidden sm:inline">{t('favorites.buttons.watch')}</span>
                                                        </button>

                                                        <div className="flex items-center gap-1">
                                                            {/* Like Button */}
                                                            <button
                                                                onClick={() => handleToggleLike(content)}
                                                                disabled={isRemoving[content.id]}
                                                                className={`p-2 rounded-lg transition-all ${isLiked ? 'text-[#FF6B8B] hover:text-[#FF8E53]' : 'text-gray-400 hover:text-white'} ${isRemoving[content.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                {isRemoving[content.id] ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                                                )}
                                                            </button>

                                                            {/* Watch Later Button */}
                                                            <button
                                                                onClick={() => handleToggleWatchLater(content)}
                                                                disabled={isRemoving[content.id]}
                                                                className={`p-2 rounded-lg transition-all ${isWatchLater ? 'text-[#4ECDC4] hover:text-[#44A08D]' : 'text-gray-400 hover:text-white'} ${isRemoving[content.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                {isRemoving[content.id] ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Clock className={`w-4 h-4 ${isWatchLater ? 'text-current' : ''}`} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Remove Button */}
                                                    {(isLiked || isWatchLater) && (
                                                        <button
                                                            onClick={() => {
                                                                if (isLiked) handleRemoveFromLiked(content);
                                                                else handleRemoveFromWatchLater(content);
                                                            }}
                                                            disabled={isRemoving[content.id]}
                                                            className="text-xs text-gray-400 hover:text-[#FF6B6B] transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            {t('favorites.buttons.remove')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && filteredContent.length > 0 && (
                    <div className="flex items-center justify-center mt-6">
                        <nav className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30 text-gray-300 disabled:text-gray-500 rounded-lg transition-all disabled:cursor-not-allowed border border-[#BC8BBC]/30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('favorites.pagination.previous')}</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${currentPage === pageNum ? 'bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] text-white shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <>
                                        <span className="text-gray-500 px-2">...</span>
                                        <button
                                            onClick={() => handlePageChange(totalPages)}
                                            className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30 rounded-lg transition-all"
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30 text-gray-300 disabled:text-gray-500 rounded-lg transition-all disabled:cursor-not-allowed border border-[#BC8BBC]/30"
                            >
                                <span className="hidden sm:inline">{t('favorites.pagination.next')}</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}