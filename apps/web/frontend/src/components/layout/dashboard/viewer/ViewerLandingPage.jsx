// src/pages/Dashboards/viewer/ViewerLandingPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import {
  Play,
  Plus,
  Info,
  ChevronRight,
  ChevronLeft,
  Clock,
  Calendar,
  X,
  Film,
  Volume2,
  VolumeX,
  Sparkles,
  TrendingUp,
  Clock as ClockIcon,
  Heart,
  Check,
  Loader2
} from "lucide-react";
import api from "../../../../api/axios";
import userPreferencesApi from "../../../../api/userPreferencesApi";
import ContentCard from "./content/ContentCard.jsx";
import { useContentDetail } from '../../../../hooks/useContentDetail';
import ContentDetailPage from './content/ContentDetailModal';
import LandingPageContents from './ViewerLandingPage/LandingPageContents';

export default function ViewerLandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const {
    detailModal,
    openDetailModal,
    closeDetailModal
  } = useContentDetail();
  
  const [contents, setContents] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(false);
  const [isHeroInView, setIsHeroInView] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [heroPreferences, setHeroPreferences] = useState({
    isLiked: false,
    isInList: false,
    loading: {
      like: false,
      watchlist: false
    }
  });
  const [redirecting, setRedirecting] = useState(false);

  const videoRef = useRef(null);
  const heroSectionRef = useRef(null);
  const contentSectionRef = useRef(null);
  const sectionRefs = useRef({});
  const contentFetchedRef = useRef(false);

  // SEO Meta Data
  const getSeoMetadata = () => {
    const siteName = t("seo.siteName", "Oliviuus");
    const defaultTitle = t("seo.defaultTitle", "Stream Movies & TV Shows Online");
    const defaultDescription = t("seo.defaultDescription", "Watch the latest movies and TV shows online. Unlimited streaming, personalized recommendations, and family-friendly content.");
    
    if (heroContent) {
      return {
        title: `${heroContent.title} | ${siteName}`,
        description: heroContent.short_description || heroContent.description || defaultDescription,
        image: heroContent.media_assets?.[0]?.url,
        canonical: window.location.href,
        language: i18n.language,
        contentType: heroContent.content_type === 'movie' ? 'video.movie' : 'video.tv_show'
      };
    }

    return {
      title: defaultTitle,
      description: defaultDescription,
      canonical: window.location.href,
      language: i18n.language
    };
  };

  const seoMetadata = getSeoMetadata();

  const fetchContentData = useCallback(async () => {
    if (contentFetchedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      contentFetchedRef.current = true;

      // FIXED: Correct API URL
      const response = await api.get('/viewer/landing-content');
      const data = response.data.data;

      setHeroContent(data.hero || null);
      setFeaturedContent(data.featured || []);
      setTrendingContent(data.trending || []);
      setRecentContent(data.recent || []);

      const allContent = [data.hero, ...data.featured, ...data.trending, ...data.recent].filter(Boolean);
      const uniqueContent = allContent.filter((content, index, self) =>
        index === self.findIndex(c => c.id === content.id)
      );
      setContents(uniqueContent);

    } catch (err) {
      console.error('Content loading error:', err);
      setError(t('errors.contentLoad', 'We encountered an issue loading content. Please try again shortly.'));
      contentFetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch hero content preferences when hero content is loaded
  useEffect(() => {
    const fetchHeroPreferences = async () => {
      if (!heroContent?.id) return;

      try {
        const response = await userPreferencesApi.getUserContentPreferences(heroContent.id);
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

    fetchHeroPreferences();
  }, [heroContent]);

  useEffect(() => {
    fetchContentData();
  }, [fetchContentData]);

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (videoRef.current && isTrailerPlaying) {
        if (isVisible) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current.pause();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTrailerPlaying]);

  // Intersection Observer for hero section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.5;
        setIsHeroInView(isVisible);

        if (videoRef.current && isTrailerPlaying) {
          if (isVisible) {
            videoRef.current.play().catch(console.error);
          } else {
            videoRef.current.pause();
          }
        }
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    if (heroSectionRef.current) {
      observer.observe(heroSectionRef.current);
    }

    return () => observer.disconnect();
  }, [isTrailerPlaying]);

  // Auto-play trailer when hero content loads
  useEffect(() => {
    if (heroContent?.trailer) {
      const timer = setTimeout(() => {
        startTrailerPlayback();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [heroContent]);

  // Start trailer playback
  const startTrailerPlayback = async () => {
    if (!heroContent?.trailer || !videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      setIsTrailerPlaying(true);
      videoRef.current.muted = isTrailerMuted;

      await new Promise(resolve => setTimeout(resolve, 50));
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
      videoRef.current.pause();
    }
  };

  const handleTrailerError = (error) => {
    console.error('Trailer video error:', error);
    setIsTrailerPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const toggleTrailer = () => {
    if (!heroContent?.trailer) return;

    if (isTrailerPlaying) {
      setIsTrailerPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
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
    videoRef.current.volume = newMutedState ? 0 : 1;
    setIsTrailerMuted(newMutedState);
  };

  // Sync muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isTrailerMuted;
      videoRef.current.volume = isTrailerMuted ? 0 : 1;
    }
  }, [isTrailerMuted]);

  // Enhanced handlePlayContent with zoom animation
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
    }, 500); // Match this with CSS animation duration
  }, [navigate, isTrailerPlaying]);

  const scrollSection = useCallback((sectionKey, direction) => {
    const container = sectionRefs.current[sectionKey];
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollPos = direction === 'right'
        ? container.scrollLeft + scrollAmount
        : container.scrollLeft - scrollAmount;

      container.scrollTo({
        left: newScrollPos,
        behavior: 'smooth'
      });
    }
  }, []);

  const getAgeRating = (content) => {
    const rating = content.age_rating || "13+";
    const ratingMap = {
      'G': t('ratings.G', 'All Ages'),
      'PG': t('ratings.PG', 'PG'),
      'PG-13': t('ratings.PG13', '13+'),
      'R': t('ratings.R', '18+'),
      'NC-17': t('ratings.NC17', '18+')
    };

    return ratingMap[rating] || rating;
  };

  const handleAddToLibrary = useCallback(async (content, e) => {
    e?.stopPropagation();
    
    if (!content?.id) return;

    try {
      // Set loading state for better UX
      setHeroPreferences(prev => ({
        ...prev,
        loading: { ...prev.loading, watchlist: true }
      }));

      const action = heroPreferences.isInList ? 'remove' : 'add';
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
      // Set loading state for better UX
      setHeroPreferences(prev => ({
        ...prev,
        loading: { ...prev.loading, like: true }
      }));

      const action = heroPreferences.isLiked ? 'unlike' : 'like';
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
    // Use the hook to open detail page with positioning
    openDetailModal(content, cardRect);
  }, [openDetailModal]);

  const handleExploreMore = useCallback((section) => {
    console.log('Explore more:', section);
  }, []);

  // Structured Data for SEO
  const getStructuredData = () => {
    if (!heroContent) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": seoMetadata.contentType || "VideoObject",
      "name": heroContent.title,
      "description": heroContent.short_description || heroContent.description,
      "thumbnailUrl": heroContent.media_assets?.[0]?.url,
      "uploadDate": heroContent.release_date,
      "duration": heroContent.duration_minutes ? `PT${heroContent.duration_minutes}M` : undefined,
      "contentUrl": heroContent.trailer?.url,
      "genre": heroContent.genres?.join(", "),
      "actor": heroContent.cast?.map(actor => actor.name)?.join(", "),
      "director": heroContent.directors?.map(director => director.name)?.join(", "),
      "inLanguage": i18n.language
    };

    return JSON.stringify(structuredData);
  };

  // If detail modal is open, show the ContentDetailPage instead of landing page
  if (detailModal.isOpen) {
    return (
      <ContentDetailPage 
        content={detailModal.content}
        onPlay={handlePlayContent}
        onAddToList={handleAddToLibrary}
      />
    );
  }

  // Responsive Skeleton Loading Components
  const HeroSkeleton = () => (
    <div className="relative w-full h-screen bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 animate-pulse" />
      <div className="relative z-20 h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-left w-full">
          <div className="h-8 sm:h-10 lg:h-12 bg-gray-600 rounded-lg mb-4 sm:mb-6 w-3/4 animate-pulse"></div>
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
            <div className="h-4 sm:h-6 bg-gray-600 rounded w-16 sm:w-20 animate-pulse"></div>
            <div className="h-4 sm:h-6 bg-gray-600 rounded w-12 sm:w-16 animate-pulse"></div>
            <div className="h-4 sm:h-6 bg-gray-600 rounded w-8 sm:w-12 animate-pulse"></div>
          </div>
          <div className="h-16 sm:h-20 bg-gray-600 rounded-lg mb-6 sm:mb-8 w-full animate-pulse"></div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="h-10 sm:h-12 bg-gray-600 rounded-lg w-24 sm:w-32 animate-pulse"></div>
            <div className="h-10 sm:h-12 bg-gray-600 rounded-lg w-20 sm:w-28 animate-pulse"></div>
            <div className="h-10 sm:h-12 bg-gray-600 rounded-lg w-16 sm:w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const ContentCardSkeleton = () => (
    <div className="w-40 h-28 sm:w-48 sm:h-32 md:w-56 md:h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600"></div>
    </div>
  );

  const ContentRowSkeleton = () => (
    <section className="relative mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-6">
        <div>
          <div className="h-6 sm:h-8 bg-gray-700 rounded w-32 sm:w-48 mb-2 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-700 rounded w-24 sm:w-32 animate-pulse"></div>
        </div>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 py-2">
        {[...Array(6)].map((_, index) => (
          <ContentCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Helmet>
          <title>{t('seo.siteName', 'Oliviuus')} - {t('seo.defaultTitle', 'Stream Movies & TV Shows Online')}</title>
          <meta name="description" content={t('seo.defaultDescription', 'Watch the latest movies and TV shows online. Unlimited streaming, personalized recommendations, and family-friendly content.')} />
          <meta name="keywords" content={t('seo.keywords', 'movies, tv shows, streaming, online videos, entertainment')} />
          <link rel="canonical" href={window.location.href} />
          <meta property="og:title" content={t('seo.siteName', 'Oliviuus')} />
          <meta property="og:description" content={t('seo.defaultDescription', 'Watch the latest movies and TV shows online. Unlimited streaming, personalized recommendations, and family-friendly content.')} />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content={i18n.language} />
        </Helmet>
        <HeroSkeleton />
        <div className="relative z-30 bg-gray-900">
          <div className="space-y-8 sm:space-y-12 py-8 sm:py-12">
            <ContentRowSkeleton />
            <ContentRowSkeleton />
            <ContentRowSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Helmet>
          <title>{t('errors.error', 'Error')} - {t('seo.siteName', 'Oliviuus')}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">{t('errors.somethingWentWrong', 'Something went wrong')}</h3>
          <p className="text-gray-400 text-sm sm:text-base mb-6">{error}</p>
          <button
            onClick={fetchContentData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            {t('actions.tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  if (!heroContent && featuredContent.length === 0 && trendingContent.length === 0 && recentContent.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Helmet>
          <title>{t('seo.siteName', 'Oliviuus')} - {t('seo.defaultTitle', 'Stream Movies & TV Shows Online')}</title>
          <meta name="description" content={t('seo.defaultDescription', 'Watch the latest movies and TV shows online. Unlimited streaming, personalized recommendations, and family-friendly content.')} />
        </Helmet>
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">{t('errors.noContent', 'No content available')}</h3>
          <p className="text-gray-400 text-sm sm:text-base">{t('errors.checkBackLater', 'Check back later for new additions.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{seoMetadata.title}</title>
        <meta name="description" content={seoMetadata.description} />
        <meta name="keywords" content={t('seo.keywords', 'movies, tv shows, streaming, online videos, entertainment')} />
        <link rel="canonical" href={seoMetadata.canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoMetadata.title} />
        <meta property="og:description" content={seoMetadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoMetadata.canonical} />
        {seoMetadata.image && <meta property="og:image" content={seoMetadata.image} />}
        <meta property="og:locale" content={seoMetadata.language} />
        <meta property="og:site_name" content={t('seo.siteName', 'Oliviuus')} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoMetadata.title} />
        <meta name="twitter:description" content={seoMetadata.description} />
        {seoMetadata.image && <meta name="twitter:image" content={seoMetadata.image} />}
        
        {/* Additional Meta */}
        <meta name="language" content={seoMetadata.language} />
        <meta name="robots" content="index, follow" />
        
        {/* Structured Data */}
        {heroContent && (
          <script type="application/ld+json">
            {getStructuredData()}
          </script>
        )}
      </Helmet>

      {/* Hero Section with Zoom Animation */}
      <div 
        ref={heroSectionRef} 
        className={`transition-all duration-500 ${redirecting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
        itemScope 
        itemType={seoMetadata.contentType || "https://schema.org/VideoObject"}
      >
        {heroContent && (
          <div className="relative w-full h-screen overflow-hidden">
            {/* Background Image */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${isTrailerPlaying ? 'opacity-0' : 'opacity-100'
                }`}
            >
              <div className="relative w-full h-full">
                <img
                  src={heroContent.media_assets?.[0]?.url || '/api/placeholder/1920/1080'}
                  alt={heroContent.title}
                  className="w-full h-full object-cover min-w-full min-h-full"
                  loading="eager"
                  itemProp="thumbnailUrl"
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
            {heroContent.trailer && (
              <div className={`absolute inset-0 transition-all duration-500 ${isTrailerPlaying ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover min-w-full min-h-full"
                  src={heroContent.trailer.url}
                  muted={isTrailerMuted}
                  onEnded={handleTrailerEnd}
                  onError={handleTrailerError}
                  playsInline
                  preload="auto"
                  itemProp="contentUrl"
                />
              </div>
            )}

            {/* Hero Content Overlay */}
            <div className="relative z-20 h-full flex items-center px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl text-left w-full">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl" itemProp="name">
                  {heroContent.title}
                </h1>

                <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
                  <div className="flex items-center gap-1 sm:gap-2 text-white bg-black/30 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                    <span className="font-medium">
                      {heroContent.duration_minutes ?
                        `${Math.floor(heroContent.duration_minutes / 60)}h ${heroContent.duration_minutes % 60}m` : ''
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 text-white bg-black/30 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                    <span className="font-medium" itemProp="uploadDate">
                      {heroContent.release_date ?
                        new Date(heroContent.release_date).getFullYear() : ''
                      }
                    </span>
                  </div>

                  <div className="px-2 sm:px-3 py-1 bg-black/50 text-white text-xs sm:text-sm rounded-full border border-gray-600 backdrop-blur-sm font-medium">
                    {getAgeRating(heroContent)}
                  </div>

                  {heroContent.trailer && isTrailerPlaying && (
                    <button
                      onClick={toggleMute}
                      className="flex items-center gap-1 sm:gap-2 bg-black/50 hover:bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full border border-gray-600 backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm"
                      title={isTrailerMuted ? t('actions.unmute', 'Unmute') : t('actions.mute', 'Mute')}
                    >
                      {isTrailerMuted ? (
                        <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="font-medium">
                        {isTrailerMuted ? t('actions.unmute', 'Unmute') : t('actions.mute', 'Mute')}
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-3xl drop-shadow-lg line-clamp-3 sm:line-clamp-none" itemProp="description">
                  {heroContent.short_description || heroContent.description}
                </p>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => handlePlayContent(heroContent)}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 group relative"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    {t('actions.play', 'Play')}
                  </button>

                  {heroContent.trailer && (
                    <button
                      onClick={toggleTrailer}
                      className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm transform hover:scale-105 group relative"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      {isTrailerPlaying ? t('actions.stop', 'Stop') : t('actions.trailer', 'Trailer')}
                    </button>
                  )}

                  {/* My List Button - Icon Only with Hover Title */}
                  <button
                    onClick={(e) => handleAddToLibrary(heroContent, e)}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all duration-300 border backdrop-blur-sm transform hover:scale-110 group relative ${
                      heroPreferences.isInList
                        ? 'bg-[#BC8BBC] hover:bg-[#a56ba5] text-white border-[#BC8BBC] shadow-lg shadow-[#BC8BBC]/30'
                        : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500 hover:shadow-lg hover:shadow-white/20'
                    } ${heroPreferences.loading.watchlist ? 'animate-pulse' : 'hover:animate-bounce'}`}
                    title={heroPreferences.isInList ? t('actions.removeFromList', 'Remove from My List') : t('actions.addToList', 'Add to My List')}
                  >
                    {heroPreferences.loading.watchlist ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : heroPreferences.isInList ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 transform group-hover:scale-125" />
                    ) : (
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 transform group-hover:rotate-90 group-hover:scale-110" />
                    )}
                    
                    {/* Hover Tooltip */}
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {heroPreferences.isInList ? t('actions.inList', 'In List') : t('actions.myList', 'My List')}
                    </span>
                  </button>

                  {/* Like Button - Icon Only with Hover Title */}
                  <button
                    onClick={(e) => handleLikeContent(heroContent, e)}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all duration-300 border backdrop-blur-sm transform hover:scale-110 group relative ${
                      heroPreferences.isLiked
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                        : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500 hover:shadow-lg hover:shadow-red-500/20'
                    } ${heroPreferences.loading.like ? 'animate-pulse' : 'hover:animate-bounce'}`}
                    title={heroPreferences.isLiked ? t('actions.unlike', 'Unlike') : t('actions.like', 'Like')}
                  >
                    {heroPreferences.loading.like ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 transform ${
                        heroPreferences.isLiked 
                          ? 'fill-current scale-110 group-hover:scale-125' 
                          : 'group-hover:scale-110 group-hover:text-red-400'
                      }`} />
                    )}
                    
                    {/* Hover Tooltip */}
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {heroPreferences.isLiked ? t('actions.liked', 'Liked') : t('actions.like', 'Like')}
                    </span>

                    {/* Sparkle effect on like */}
                    {heroPreferences.isLiked && (
                      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg opacity-75 blur-sm animate-pulse"></div>
                      </div>
                    )}
                  </button>

                  {/* Details Button - Icon Only with Hover Title */}
                  <button
                    onClick={(e) => handleMoreInfo(heroContent, e)}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gray-600/90 hover:bg-gray-500/90 text-white rounded-lg font-bold transition-all duration-300 border border-gray-500 backdrop-blur-sm transform hover:scale-110 hover:animate-bounce group relative"
                    title={t('actions.details', 'Details')}
                  >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-12" />
                    
                    {/* Hover Tooltip */}
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {t('actions.details', 'Details')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Sections using the new LandingPageContents component */}
      <LandingPageContents
        featuredContent={featuredContent}
        trendingContent={trendingContent}
        recentContent={recentContent}
        onPlay={handlePlayContent}
        onAddToList={handleAddToLibrary}
        onMoreInfo={handleMoreInfo}
        onExploreMore={handleExploreMore}
        redirecting={redirecting}
      />
    </div>
  );
}