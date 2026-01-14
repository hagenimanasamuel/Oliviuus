import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tv, Grid, List, Play, Clock, TrendingUp, Sparkles, Filter, X, Volume2, VolumeX, Plus, Heart, Info, Check, Loader2, ChevronDown } from 'lucide-react';
import api from '../../../api/axios';
import userPreferencesApi from '../../../api/userPreferencesApi';
import ContentCard from '../../../components/layout/dashboard/viewer/content/ContentCard';
import { useContentDetail } from '../../../hooks/useContentDetail';

const TvShowsPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { openDetailModal } = useContentDetail();

    const [tvShows, setTvShows] = useState([]);
    const [filteredShows, setFilteredShows] = useState([]);
    const [featuredShow, setFeaturedShow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [filters, setFilters] = useState({
        genre: '',
        sort: 'latest'
    });
    const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
    const [isTrailerMuted, setIsTrailerMuted] = useState(true);
    const [heroLoading, setHeroLoading] = useState(true);
    const [heroPreferences, setHeroPreferences] = useState({
        isLiked: false,
        isInList: false,
        loading: {
            like: false,
            watchlist: false
        }
    });
    const [redirecting, setRedirecting] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    
    const videoRef = useRef(null);
    const heroSectionRef = useRef(null);
    const filtersRef = useRef(null);

    const fetchTvShows = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all content first
            const response = await api.get('/viewer/content', {
                params: {
                    limit: 200  // Get more content to filter from
                }
            });

            if (response.data.success) {
                const allContent = response.data.data.contents || [];
                
                // FILTER TO ONLY SHOW SERIES CONTENT
                const seriesContent = allContent.filter(content => 
                    content.content_type === 'series' || 
                    content.type === 'series' ||
                    (content.content_type && content.content_type.toLowerCase().includes('series')) ||
                    (content.type && content.type.toLowerCase().includes('series'))
                );
                
                console.log('Series content found:', seriesContent.length);
                console.log('All content types:', [...new Set(allContent.map(item => item.content_type))]);
                
                setTvShows(seriesContent);
                setFilteredShows(seriesContent);
                
                // Set featured show (most popular or newest with trailer)
                const featured = seriesContent
                    .filter(show => show.trailer)
                    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))[0] 
                    || seriesContent[0];
                
                setFeaturedShow(featured);
            } else {
                setTvShows([]);
                setFilteredShows([]);
                setFeaturedShow(null);
            }
        } catch (err) {
            console.error('Error fetching TV shows:', err);
            setError(t('tvShows.errors.unableToLoad'));
            setTvShows([]);
            setFilteredShows([]);
            setFeaturedShow(null);
        } finally {
            setLoading(false);
            setHeroLoading(false);
        }
    }, [t]);

    // Close filters when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filtersRef.current && !filtersRef.current.contains(event.target)) {
                setIsFiltersOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch hero content preferences when hero content is loaded
    useEffect(() => {
        const fetchHeroPreferences = async () => {
            if (!featuredShow?.id) return;

            try {
                const response = await userPreferencesApi.getUserContentPreferences(featuredShow.id);
                if (response.success) {
                    setHeroPreferences(prev => ({
                        ...prev,
                        isLiked: response.data?.isLiked || false,
                        isInList: response.data?.isInList || false
                    }));
                }
            } catch (error) {
                console.error('Error fetching hero preferences:', error);
            }
        };

        if (featuredShow) {
            fetchHeroPreferences();
        }
    }, [featuredShow]);

    useEffect(() => {
        fetchTvShows();
    }, [fetchTvShows]);

    // Auto-play trailer when featured show loads
    useEffect(() => {
        if (featuredShow?.trailer && !heroLoading) {
            const timer = setTimeout(() => {
                startTrailerPlayback();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [featuredShow, heroLoading]);

    // Start trailer playback
    const startTrailerPlayback = async () => {
        if (!featuredShow?.trailer || !videoRef.current) return;

        try {
            videoRef.current.currentTime = 0;
            setIsTrailerPlaying(true);
            videoRef.current.muted = isTrailerMuted;

            await videoRef.current.play();
        } catch (error) {
            console.error('Auto-play failed:', error);
            setIsTrailerPlaying(false);
        }
    };

    // Handle trailer end
    const handleTrailerEnd = () => {
        setIsTrailerPlaying(false);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
        // Restart trailer after a delay
        setTimeout(() => {
            if (featuredShow?.trailer) {
                startTrailerPlayback();
            }
        }, 3000);
    };

    const toggleTrailer = () => {
        if (!featuredShow?.trailer) return;

        if (isTrailerPlaying) {
            setIsTrailerPlaying(false);
            if (videoRef.current) {
                videoRef.current.pause();
            }
        } else {
            startTrailerPlayback();
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        const newMutedState = !videoRef.current.muted;
        videoRef.current.muted = newMutedState;
        setIsTrailerMuted(newMutedState);
    };

    // Enhanced handlePlayContent with zoom animation - matches landing page
    const handlePlayContent = useCallback((content) => {
        // Stop trailer if playing
        if (isTrailerPlaying) {
            setIsTrailerPlaying(false);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
        
        // Start redirect animation
        setRedirecting(true);
        
        // Wait for animation to complete before navigating
        setTimeout(() => {
            // Navigate to WatchPage with the content ID
            if (content?.id) {
                navigate(`/watch/${content.id}`);
            }
        }, 500);
    }, [navigate, isTrailerPlaying]);

    // Apply filters - with additional content type check
    useEffect(() => {
        let filtered = [...tvShows];

        // Ensure we only show series (double safety check)
        filtered = filtered.filter(show => 
            show.content_type === 'series' || 
            show.type === 'series' ||
            (show.content_type && show.content_type.toLowerCase().includes('series')) ||
            (show.type && show.type.toLowerCase().includes('series'))
        );

        // Genre filter
        if (filters.genre) {
            filtered = filtered.filter(show => 
                show.genres?.some(genre => 
                    genre.name.toLowerCase().includes(filters.genre.toLowerCase())
                )
            );
        }

        // Sort
        switch (filters.sort) {
            case 'latest':
                filtered.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
                break;
            case 'popular':
                filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
                break;
            default:
                break;
        }

        setFilteredShows(filtered);
    }, [tvShows, filters]);

    // PROPER DATABASE INTEGRATION - Matches Landing Page Implementation
    const handleAddToLibrary = useCallback(async (content, e) => {
        e?.stopPropagation();
        
        if (!content?.id) return;

        try {
            const action = heroPreferences.isInList ? 'remove' : 'add';
            
            // Set loading state
            setHeroPreferences(prev => ({
                ...prev,
                loading: { ...prev.loading, watchlist: true }
            }));

            const response = await userPreferencesApi.toggleWatchlist(content.id, action);

            if (response.success) {
                const newInListState = !heroPreferences.isInList;
                setHeroPreferences(prev => ({
                    ...prev,
                    isInList: newInListState,
                    loading: { ...prev.loading, watchlist: false }
                }));
                console.log(`Successfully ${action === 'add' ? 'added to' : 'removed from'} watchlist`);
            }
        } catch (error) {
            console.error('Error updating watchlist:', error);
            setHeroPreferences(prev => ({
                ...prev,
                loading: { ...prev.loading, watchlist: false }
            }));
        }
    }, [heroPreferences.isInList]);

    const handleLikeContent = useCallback(async (content, e) => {
        e?.stopPropagation();
        
        if (!content?.id) return;

        try {
            const action = heroPreferences.isLiked ? 'unlike' : 'like';
            
            // Set loading state
            setHeroPreferences(prev => ({
                ...prev,
                loading: { ...prev.loading, like: true }
            }));

            const response = await userPreferencesApi.toggleLike(content.id, action);

            if (response.success) {
                const newLikedState = !heroPreferences.isLiked;
                setHeroPreferences(prev => ({
                    ...prev,
                    isLiked: newLikedState,
                    loading: { ...prev.loading, like: false }
                }));
                console.log(`Successfully ${action}d content`);
            }
        } catch (error) {
            console.error('Error updating like:', error);
            setHeroPreferences(prev => ({
                ...prev,
                loading: { ...prev.loading, like: false }
            }));
        }
    }, [heroPreferences.isLiked]);

    const handleMoreInfo = useCallback((content, cardRect) => {
        openDetailModal(content, cardRect);
    }, [openDetailModal]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        // Close mobile filters after selection
        if (window.innerWidth < 768) {
            setIsFiltersOpen(false);
        }
    };

    const handlePlayFeatured = () => {
        if (featuredShow) {
            handlePlayContent(featuredShow);
        }
    };

    const handleFeaturedMoreInfo = () => {
        if (featuredShow) {
            openDetailModal(featuredShow);
        }
    };

    // Get unique genres for filters
    const genres = [...new Set(tvShows
        .flatMap(show => show.genres?.map(g => g.name) || [])
    )].sort();

    // Loading Skeleton
    const TvShowsSkeleton = () => (
        <div className="min-h-screen bg-gray-900 pt-16">
            {/* Hero Skeleton */}
            <div className="relative h-screen bg-gray-800 animate-pulse" style={{ marginTop: '-64px', paddingTop: '64px' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600" />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>

                {/* Grid Skeleton */}
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
        return <TvShowsSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 pt-16 flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-white text-xl font-semibold mb-2">
                        {t('tvShows.errors.unableToLoadTitle')}
                    </h3>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={fetchTvShows}
                        className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
                    >
                        {t('tvShows.errors.tryAgain')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Hero Banner Section with Auto-Play Trailer */}
            {featuredShow && (
                <div 
                    ref={heroSectionRef}
                    className={`relative w-full h-screen overflow-hidden transition-all duration-500 ${redirecting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
                    style={{ marginTop: '-64px', paddingTop: '64px' }}
                >
                    {/* Background Image with Overlay */}
                    <div 
                        className={`absolute inset-0 transition-opacity duration-500 ${
                            isTrailerPlaying ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                        <div className="relative w-full h-full">
                            <img
                                src={featuredShow.media_assets?.[0]?.url || '/api/placeholder/1920/1080'}
                                alt={featuredShow.title}
                                className="w-full h-full object-cover min-w-full min-h-full"
                                loading="eager"
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, transparent 100%)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Trailer Video */}
                    {featuredShow.trailer && (
                        <div className={`absolute inset-0 transition-all duration-500 ${
                            isTrailerPlaying ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}>
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover min-w-full min-h-full"
                                src={featuredShow.trailer.url}
                                muted={isTrailerMuted}
                                onEnded={handleTrailerEnd}
                                playsInline
                                preload="auto"
                                loop
                            />
                        </div>
                    )}

                    {/* Hero Content Overlay */}
                    <div className="relative z-20 h-full flex items-center px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl text-left w-full">
                            {/* Featured Badge */}
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-[#BC8BBC]" />
                                <span className="text-[#BC8BBC] font-semibold text-sm uppercase tracking-wider bg-[#BC8BBC]/10 px-3 py-1 rounded-full border border-[#BC8BBC]/20 backdrop-blur-sm">
                                    {t('tvShows.hero.featuredBadge')}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
                                {featuredShow.title}
                            </h1>

                            {/* Metadata */}
                            <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
                                <div className="flex items-center gap-1 sm:gap-2 text-white bg-black/30 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                                    <span className="font-medium">
                                        {featuredShow.duration_minutes ?
                                            `${Math.floor(featuredShow.duration_minutes / 60)}h ${featuredShow.duration_minutes % 60}m` : ''
                                        }
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 sm:gap-2 text-white bg-black/30 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                                    <span className="font-medium">
                                        {featuredShow.release_date ?
                                            new Date(featuredShow.release_date).getFullYear() : ''
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Genres */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {featuredShow.genres?.slice(0, 3).map(genre => (
                                    <span 
                                        key={genre.id}
                                        className="bg-[#BC8BBC]/20 text-[#BC8BBC] px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-[#BC8BBC]/30 backdrop-blur-sm"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            {/* Description */}
                            <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-3xl drop-shadow-lg line-clamp-3 sm:line-clamp-none">
                                {featuredShow.short_description || featuredShow.description}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <button
                                    onClick={handlePlayFeatured}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 transform hover:scale-105"
                                >
                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                    {t('contentdetail.actions.play')}
                                </button>

                                {featuredShow.trailer && (
                                    <button
                                        onClick={toggleTrailer}
                                        className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm transform hover:scale-105"
                                    >
                                        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                        {isTrailerPlaying 
                                            ? t('contentdetail.actions.stopTrailer') 
                                            : t('contentdetail.actions.trailer')
                                        }
                                    </button>
                                )}

                                <button
                                    onClick={(e) => handleAddToLibrary(featuredShow, e)}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border backdrop-blur-sm transform hover:scale-105 ${
                                        heroPreferences.isInList
                                            ? 'bg-[#BC8BBC] hover:bg-[#a56ba5] text-white border-[#BC8BBC]'
                                            : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500'
                                    }`}
                                >
                                    {heroPreferences.loading.watchlist ? (
                                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                    ) : heroPreferences.isInList ? (
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                    ) : (
                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {heroPreferences.isInList 
                                            ? t('contentdetail.actions.inList') 
                                            : t('contentdetail.actions.myList')
                                        }
                                    </span>
                                </button>

                                <button
                                    onClick={(e) => handleLikeContent(featuredShow, e)}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border backdrop-blur-sm transform hover:scale-105 ${
                                        heroPreferences.isLiked
                                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                                            : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500'
                                    }`}
                                >
                                    {heroPreferences.loading.like ? (
                                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                    ) : (
                                        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${heroPreferences.isLiked ? 'fill-current' : ''}`} />
                                    )}
                                    <span className="hidden sm:inline">
                                        {heroPreferences.isLiked 
                                            ? t('contentdetail.actions.liked') 
                                            : t('contentdetail.actions.like')
                                        }
                                    </span>
                                </button>

                                <button
                                    onClick={handleFeaturedMoreInfo}
                                    className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm transform hover:scale-105"
                                >
                                    <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">
                                        {t('contentdetail.actions.details')}
                                    </span>
                                </button>

                                {featuredShow.trailer && isTrailerPlaying && (
                                    <button
                                        onClick={toggleMute}
                                        className="flex items-center gap-1 sm:gap-2 bg-black/50 hover:bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full border border-gray-600 backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm"
                                        title={isTrailerMuted 
                                            ? t('contentdetail.actions.unmute') 
                                            : t('contentdetail.actions.mute')
                                        }
                                    >
                                        {isTrailerMuted ? (
                                            <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                                        ) : (
                                            <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`relative z-30 bg-gray-900 transition-all duration-500 ${redirecting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-xl">
                                    <Tv className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                                {t('tvShows.title')}
                            </h1>
                            <p className="text-gray-400 mt-2 text-sm sm:text-base">
                                {t('tvShows.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Professional Filters with View Toggle - RESPONSIVE FIXED */}
                    <div ref={filtersRef} className="mb-8">
                        {/* Mobile Filter Toggle */}
                        <div className="md:hidden mb-4">
                            <button
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className="w-full flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-white backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <Filter className="w-4 h-4" />
                                    <span className="font-medium">
                                        {t('tvShows.filters.title')}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Filters Container - Responsive */}
                        <div className={`
                            ${isFiltersOpen ? 'block' : 'hidden'} 
                            md:flex md:flex-wrap md:items-center md:justify-between gap-4 p-4 bg-gray-800/30 rounded-xl backdrop-blur-sm border border-gray-700/50
                        `}>
                            {/* Left Side - Filters */}
                            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-3 text-gray-300 mb-3 md:mb-0">
                                    <div className="p-2 bg-gray-700 rounded-lg">
                                        <Filter className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium hidden md:block">
                                        {t('tvShows.filters.browse')}
                                    </span>
                                </div>
                                
                                {/* Genre Filter */}
                                <div className="relative group w-full md:w-auto">
                                    <select
                                        value={filters.genre}
                                        onChange={(e) => handleFilterChange('genre', e.target.value)}
                                        className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-3 md:py-2.5 text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 transition-all cursor-pointer w-full text-sm"
                                    >
                                        <option value="">
                                            {t('tvShows.filters.allCategories')}
                                        </option>
                                        {genres.map(genre => (
                                            <option key={genre} value={genre}>{genre}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <Sparkles className="w-4 h-4 text-[#BC8BBC]" />
                                    </div>
                                </div>

                                {/* Sort Filter */}
                                <div className="relative group w-full md:w-auto">
                                    <select
                                        value={filters.sort}
                                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                                        className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-3 md:py-2.5 text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 transition-all cursor-pointer w-full text-sm"
                                    >
                                        <option value="latest">
                                            {t('tvShows.filters.sort.latest')}
                                        </option>
                                        <option value="oldest">
                                            {t('tvShows.filters.sort.oldest')}
                                        </option>
                                        <option value="popular">
                                            {t('tvShows.filters.sort.popular')}
                                        </option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <TrendingUp className="w-4 h-4 text-[#BC8BBC]" />
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                {filters.genre && (
                                    <button
                                        onClick={() => {
                                            setFilters({ genre: '', sort: 'latest' });
                                            if (window.innerWidth < 768) {
                                                setIsFiltersOpen(false);
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 md:py-2.5 rounded-lg transition-colors font-medium text-sm w-full md:w-auto"
                                    >
                                        <X className="w-4 h-4" />
                                        {t('tvShows.filters.reset')}
                                    </button>
                                )}
                            </div>

                            {/* Right Side - View Toggle */}
                            <div className="flex items-center justify-between md:justify-end gap-4 mt-4 md:mt-0">
                                <span className="text-gray-400 text-sm hidden md:block">
                                    {t('tvShows.filters.view')}
                                </span>
                                <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all duration-200 ${
                                            viewMode === 'grid' 
                                                ? 'bg-[#BC8BBC] text-white shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        <Grid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-md transition-all duration-200 ${
                                            viewMode === 'list' 
                                                ? 'bg-[#BC8BBC] text-white shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-6">
                        <p className="text-gray-400 text-sm">
                            {t('tvShows.resultsCount', { count: filteredShows.length })}
                        </p>
                    </div>

                    {/* TV Shows Content */}
                    {filteredShows.length === 0 ? (
                        <div className="text-center py-16 sm:py-24">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Tv className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" />
                            </div>
                            <h3 className="text-white text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3">
                                {t('tvShows.emptyState.title')}
                            </h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                                {tvShows.length === 0 
                                    ? t('tvShows.emptyState.noShowsAvailable') 
                                    : t('tvShows.emptyState.adjustFilters')
                                }
                            </p>
                            {tvShows.length > 0 && (
                                <button
                                    onClick={() => setFilters({ genre: '', sort: 'latest' })}
                                    className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors transform hover:scale-105"
                                >
                                    {t('tvShows.filters.reset')}
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'list' ? (
                        /* List View */
                        <div className="space-y-4">
                            {filteredShows.map((show) => (
                                <div 
                                    key={show.id}
                                    className="bg-gray-800 rounded-xl p-4 sm:p-6 hover:bg-gray-750 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] border border-gray-700/50 hover:border-gray-600 group"
                                    onClick={() => handleMoreInfo(show)}
                                >
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <div className="relative flex-shrink-0">
                                            <img 
                                                src={show.media_assets?.[0]?.url || '/api/placeholder/120/180'} 
                                                alt={show.title}
                                                className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded-lg shadow-lg group-hover:shadow-xl transition-all"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold text-lg sm:text-xl mb-2 group-hover:text-[#BC8BBC] transition-colors truncate">{show.title}</h3>
                                            <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
                                                {show.short_description || show.description}
                                            </p>
                                            <div className="flex items-center gap-3 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    {show.duration_minutes || t('contentdetail.metadata.notAvailable')} min
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(show.release_date).getFullYear()}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {show.genres?.slice(0, 2).map(genre => (
                                                    <span 
                                                        key={genre.id}
                                                        className="bg-[#BC8BBC]/10 text-[#BC8BBC] px-2 py-1 rounded-full text-xs font-medium border border-[#BC8BBC]/20 group-hover:bg-[#BC8BBC]/20 transition-colors"
                                                    >
                                                        {genre.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlayContent(show);
                                                }}
                                                className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white p-2 sm:p-3 rounded-full transition-all transform hover:scale-110 shadow-lg"
                                            >
                                                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Grid View */
                        <>
                            {/* Mobile: Horizontal Scroll */}
                            <div className="block sm:hidden">
                                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
                                    {filteredShows.map((show) => (
                                        <div key={show.id} className="flex-shrink-0 w-32">
                                            <ContentCard
                                                content={show}
                                                size="small"
                                                onPlay={handlePlayContent}
                                                onAddToList={handleAddToLibrary}
                                                onMoreInfo={handleMoreInfo}
                                                hideViews={true}
                                                hideRating={true}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tablet/Desktop: Grid */}
                            <div className="hidden sm:block">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                                    {filteredShows.map((show) => (
                                        <ContentCard
                                            key={show.id}
                                            content={show}
                                            size="medium"
                                            onPlay={handlePlayContent}
                                            onAddToList={handleAddToLibrary}
                                            onMoreInfo={handleMoreInfo}
                                            hideViews={true}
                                            hideRating={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TvShowsPage;