// src/pages/Dashboards/kid/KidLandingPage.jsx - UPDATED VERSION
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
  Heart,
  Check,
  Loader2,
  BookOpen,
  GamepadIcon,
  Star,
  Shield,
  GraduationCap
} from "lucide-react";
import api from "../../../../api/axios";
import userPreferencesApi from "../../../../api/userPreferencesApi";
import ContentCard from "../../../../components/layout/dashboard/viewer/kid/content/ContentCard";
import { useContentDetail } from '../../../../hooks/useContentDetail';
import ContentDetailPage from '../ContentDetailPage';
import KidLandingPageContents from './KidLandingPageContents';

export default function KidLandingPage({ kidProfile }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Initialize translation hook
  
  const {
    detailModal,
    openDetailModal,
    closeDetailModal
  } = useContentDetail();
  
  const [contents, setContents] = useState([]);
  const [heroContent, setHeroContent] = useState(null);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [educationalContent, setEducationalContent] = useState([]);
  const [funContent, setFunContent] = useState([]);
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
  const contentFetchedRef = useRef(false);

  // SEO Meta Data for kids - Using translations
  const getSeoMetadata = () => {
    const siteName = t("kidLanding.seo.siteName", "Oliviuus Kids");
    const defaultTitle = t("kidLanding.seo.defaultTitle", "Fun & Safe Kids Content");
    const defaultDescription = t("kidLanding.seo.defaultDescription", "Watch kid-friendly cartoons, educational shows, and fun adventures. Safe, age-appropriate content for children.");
    
    if (heroContent) {
      return {
        title: `${heroContent.title} | ${siteName}`,
        description: heroContent.short_description || heroContent.description || defaultDescription,
        image: heroContent.media_assets?.[0]?.url,
        canonical: window.location.href,
        language: i18n.language
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

  const fetchKidContentData = useCallback(async () => {
    if (contentFetchedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      contentFetchedRef.current = true;

      const response = await api.get('/kid/landing-content');
      const data = response.data.data;

      setHeroContent(data.hero || null);
      setFeaturedContent(data.featured || []);
      setEducationalContent(data.educational || []);
      setFunContent(data.fun || []);
      setRecentContent(data.recent || []);

      const allContent = [
        data.hero, 
        ...data.featured, 
        ...data.educational, 
        ...data.fun, 
        ...data.recent
      ].filter(Boolean);
      
      const uniqueContent = allContent.filter((content, index, self) =>
        index === self.findIndex(c => c.id === content.id)
      );
      setContents(uniqueContent);

    } catch (err) {
      console.error('Kid content loading error:', err);
      setError(t('kidLanding.errors.contentLoad', 'We encountered an issue loading content. Please try again shortly.'));
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
    fetchKidContentData();
  }, [fetchKidContentData]);

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
    if (isTrailerPlaying) {
      setIsTrailerPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
    
    setRedirecting(true);
    
    setTimeout(() => {
      if (content?.id) {
        navigate(`/watch/${content.id}`);
      }
    }, 500);
  }, [navigate, isTrailerPlaying]);

  const getAgeRating = (content) => {
    const rating = content.age_rating || "G";
    const ratingMap = {
      'all': t('kidLanding.ratings.all', 'All Ages'),
      'G': t('kidLanding.ratings.G', 'All Ages'),
      'TV-Y': t('kidLanding.ratings.TV-Y', 'Kids'),
      'TV-Y7': t('kidLanding.ratings.TV-Y7', 'Kids 7+'),
      'TV-G': t('kidLanding.ratings.TV-G', 'All Ages'),
      'PG': t('kidLanding.ratings.PG', 'Parental Guidance'),
      '7+': t('kidLanding.ratings.7+', 'Age 7+'),
      '8+': t('kidLanding.ratings.8+', 'Age 8+'),
      '9+': t('kidLanding.ratings.9+', 'Age 9+'),
      '10+': t('kidLanding.ratings.10+', 'Age 10+'),
      '11+': t('kidLanding.ratings.11+', 'Age 11+'),
      '12+': t('kidLanding.ratings.12+', 'Age 12+')
    };

    return ratingMap[rating] || t('kidLanding.ratings.default', 'Kid Safe');
  };

  const handleAddToLibrary = useCallback(async (content, e) => {
    e?.stopPropagation();
    
    if (!content?.id) return;

    try {
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

  // Structured Data for SEO
  const getStructuredData = () => {
    if (!heroContent) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": heroContent.title,
      "description": heroContent.short_description || heroContent.description,
      "thumbnailUrl": heroContent.media_assets?.[0]?.url,
      "uploadDate": heroContent.release_date,
      "duration": heroContent.duration_minutes ? `PT${heroContent.duration_minutes}M` : undefined,
      "contentUrl": heroContent.trailer?.url,
      "genre": heroContent.genres?.join(", "),
      "audience": {
        "@type": "PeopleAudience",
        "suggestedMinAge": 3,
        "suggestedMaxAge": 12
      },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Helmet>
          <title>{seoMetadata.title}</title>
          <meta name="description" content={seoMetadata.description} />
        </Helmet>
        <HeroSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Helmet>
          <title>{t('kidLanding.errors.error', 'Error')} - {t('kidLanding.seo.siteName', 'Oliviuus Kids')}</title>
        </Helmet>
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
            {t('kidLanding.errors.somethingWentWrong', 'Something went wrong')}
          </h3>
          <p className="text-gray-400 text-sm sm:text-base mb-6">{error}</p>
          <button
            onClick={fetchKidContentData}
            className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            {t('kidLanding.actions.tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  if (!heroContent && featuredContent.length === 0 && educationalContent.length === 0 && funContent.length === 0 && recentContent.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Helmet>
          <title>{seoMetadata.title}</title>
          <meta name="description" content={seoMetadata.description} />
        </Helmet>
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
            {t('kidLanding.errors.noContent', 'No content available')}
          </h3>
          <p className="text-gray-400 text-sm sm:text-base">
            {t('kidLanding.errors.checkBackLater', 'Check back later for new additions.')}
          </p>
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
        <link rel="canonical" href={seoMetadata.canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoMetadata.title} />
        <meta property="og:description" content={seoMetadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seoMetadata.canonical} />
        {seoMetadata.image && <meta property="og:image" content={seoMetadata.image} />}
        <meta property="og:site_name" content={t('kidLanding.seo.siteName', 'Oliviuus Kids')} />
        
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
                />
              </div>
            )}

            {/* Hero Content Overlay */}
            <div className="relative z-20 h-full flex items-center px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl text-left w-full">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
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
                    <span className="font-medium">
                      {heroContent.release_date ?
                        new Date(heroContent.release_date).getFullYear() : ''
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 bg-[#BC8BBC]/80 text-white px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium">
                      {getAgeRating(heroContent)}
                    </span>
                  </div>

                  {/* Educational Badge */}
                  {heroContent.is_educational && (
                    <div className="flex items-center gap-1 sm:gap-2 bg-green-500/80 text-white px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                      <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">
                        {t('kidLanding.badges.learning', 'Learning')}
                      </span>
                    </div>
                  )}

                  {/* Mute/Unmute button */}
                  {heroContent.trailer && isTrailerPlaying && (
                    <button
                      onClick={toggleMute}
                      className="flex items-center gap-1 sm:gap-2 bg-black/50 hover:bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full border border-gray-600 backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm"
                      title={isTrailerMuted ? 
                        t('kidLanding.actions.unmute', 'Unmute') : 
                        t('kidLanding.actions.mute', 'Mute')
                      }
                    >
                      {isTrailerMuted ? (
                        <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="font-medium">
                        {isTrailerMuted ? 
                          t('kidLanding.actions.unmute', 'Unmute') : 
                          t('kidLanding.actions.mute', 'Mute')
                        }
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-3xl drop-shadow-lg line-clamp-3 sm:line-clamp-none">
                  {heroContent.short_description || heroContent.description}
                </p>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Play button */}
                  <button
                    onClick={() => handlePlayContent(heroContent)}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 group relative"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    {t('kidLanding.actions.play', 'Play')}
                  </button>

                  {heroContent.trailer && (
                    <button
                      onClick={toggleTrailer}
                      className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm transform hover:scale-105 group relative"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      {isTrailerPlaying ? 
                        t('kidLanding.actions.stop', 'Stop') : 
                        t('kidLanding.actions.trailer', 'Trailer')
                      }
                    </button>
                  )}

                  {/* My List Button */}
                  <button
                    onClick={(e) => handleAddToLibrary(heroContent, e)}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all duration-300 border backdrop-blur-sm transform hover:scale-110 group relative ${
                      heroPreferences.isInList
                        ? 'bg-[#BC8BBC] hover:bg-[#a56ba5] text-white border-[#BC8BBC] shadow-lg shadow-[#BC8BBC]/30'
                        : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500 hover:shadow-lg hover:shadow-white/20'
                    } ${heroPreferences.loading.watchlist ? 'animate-pulse' : 'hover:animate-bounce'}`}
                    title={heroPreferences.isInList ? 
                      t('kidLanding.actions.removeFromList', 'Remove from My List') : 
                      t('kidLanding.actions.addToList', 'Add to My List')
                    }
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
                      {heroPreferences.isInList ? 
                        t('kidLanding.actions.inList', 'In List') : 
                        t('kidLanding.actions.myList', 'My List')
                      }
                    </span>
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={(e) => handleLikeContent(heroContent, e)}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold transition-all duration-300 border backdrop-blur-sm transform hover:scale-110 group relative ${
                      heroPreferences.isLiked
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse'
                        : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500 hover:shadow-lg hover:shadow-red-500/20'
                    } ${heroPreferences.loading.like ? 'animate-pulse' : 'hover:animate-bounce'}`}
                    title={heroPreferences.isLiked ? 
                      t('kidLanding.actions.unlike', 'Unlike') : 
                      t('kidLanding.actions.like', 'Like')
                    }
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
                      {heroPreferences.isLiked ? 
                        t('kidLanding.actions.liked', 'Liked') : 
                        t('kidLanding.actions.like', 'Like')
                      }
                    </span>
                  </button>

                  {/* Details Button */}
                  <button
                    onClick={(e) => handleMoreInfo(heroContent, e)}
                    className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gray-600/90 hover:bg-gray-500/90 text-white rounded-lg font-bold transition-all duration-300 border border-gray-500 backdrop-blur-sm transform hover:scale-110 hover:animate-bounce group relative"
                    title={t('kidLanding.actions.details', 'Details')}
                  >
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-12" />
                    
                    {/* Hover Tooltip */}
                    <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {t('kidLanding.actions.details', 'Details')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Sections using KidLandingPageContents */}
      <KidLandingPageContents
        featuredContent={featuredContent}
        educationalContent={educationalContent}
        funContent={funContent}
        recentContent={recentContent}
        onPlay={handlePlayContent} 
        onMoreInfo={handleMoreInfo}
        redirecting={redirecting}
      />
    </div>
  );
}