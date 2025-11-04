// src/pages/Dashboards/viewer/ViewerLandingPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Clock as ClockIcon
} from "lucide-react";
import api from "../../../../api/axios";
import ContentCard from "./content/ContentCard.jsx";
import { useContentDetail } from '../../../../hooks/useContentDetail';
import ContentDetailModal from './content/ContentDetailModal.jsx';

export default function ViewerLandingPage() {
  const navigate = useNavigate();
    const {
    detailModal,
    openDetailModal,
    closeDetailModal,
    openDetailPage
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

  const videoRef = useRef(null);
  const heroSectionRef = useRef(null);
  const sectionRefs = useRef({});
  const contentFetchedRef = useRef(false);

  const fetchContentData = useCallback(async () => {
    if (contentFetchedRef.current) return;

    try {
      setLoading(true);
      setError(null);
      contentFetchedRef.current = true;

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
      setError('We encountered an issue loading content. Please try again shortly.');
      contentFetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, []);

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
      'G': 'All Ages',
      'PG': 'PG',
      'PG-13': '13+',
      'R': '18+',
      'NC-17': '18+'
    };

    return ratingMap[rating] || rating;
  };

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

  const handleExploreMore = useCallback((section) => {
    console.log('Explore more:', section);
  }, []);

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

  // Optimized ContentRow component - completely independent
  const ContentRow = React.memo(({
    title,
    subtitle,
    items,
    sectionKey,
    icon: Icon,
    showExplore = true,
    onPlay,
    onAddToList,
    onMoreInfo,
    onExploreMore
  }) => {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const containerRef = useRef(null);

    // Memoized scroll handlers
    const handleScrollLeft = useCallback(() => {
      const container = containerRef.current;
      if (container) {
        const scrollAmount = container.clientWidth * 0.8;
        const newScrollPos = container.scrollLeft - scrollAmount;
        container.scrollTo({ left: newScrollPos, behavior: 'smooth' });
      }
    }, []);

    const handleScrollRight = useCallback(() => {
      const container = containerRef.current;
      if (container) {
        const scrollAmount = container.clientWidth * 0.8;
        const newScrollPos = container.scrollLeft + scrollAmount;
        container.scrollTo({ left: newScrollPos, behavior: 'smooth' });
      }
    }, []);

    const handleSectionExplore = useCallback(() => {
      onExploreMore?.(sectionKey);
    }, [sectionKey, onExploreMore]);

    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        const updateScrollState = () => {
          setCanScrollLeft(container.scrollLeft > 0);
          setCanScrollRight(
            container.scrollLeft < (container.scrollWidth - container.clientWidth - 10)
          );
        };

        updateScrollState();
        container.addEventListener('scroll', updateScrollState);

        return () => {
          container.removeEventListener('scroll', updateScrollState);
        };
      }
    }, []);

    const hasMoreContent = items.length >= 5;

    return (
      <section className="relative mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            {Icon && (
              <div className="p-1 sm:p-2 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-gray-400 text-xs sm:text-sm mt-1">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Scroll buttons - hidden on mobile, visible on sm and up */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={handleScrollLeft}
                disabled={!canScrollLeft}
                className={`p-2 rounded-full transition-all ${canScrollLeft
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleScrollRight}
                disabled={!canScrollRight}
                className={`p-2 rounded-full transition-all ${canScrollRight
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Explore More Button */}
            {showExplore && hasMoreContent && (
              <button
                onClick={handleSectionExplore}
                className="hidden sm:flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm"
              >
                View All
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Mobile scroll indicators */}
          <div className="sm:hidden flex justify-center gap-2 mb-3 px-4">
            <div className="text-xs text-gray-500">
              Swipe to browse →
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 scroll-smooth py-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {items.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                size="medium"
                onPlay={onPlay}
                onAddToList={onAddToList}
                onMoreInfo={onMoreInfo}
              />
            ))}
          </div>
        </div>
      </section>
    );
  });

  ContentRow.displayName = 'ContentRow';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
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
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-400 text-sm sm:text-base mb-6">{error}</p>
          <button
            onClick={fetchContentData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!heroContent && featuredContent.length === 0 && trendingContent.length === 0 && recentContent.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">No content available</h3>
          <p className="text-gray-400 text-sm sm:text-base">Check back later for new additions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div ref={heroSectionRef}>
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

                  <div className="px-2 sm:px-3 py-1 bg-black/50 text-white text-xs sm:text-sm rounded-full border border-gray-600 backdrop-blur-sm font-medium">
                    {getAgeRating(heroContent)}
                  </div>

                  {heroContent.trailer && isTrailerPlaying && (
                    <button
                      onClick={toggleMute}
                      className="flex items-center gap-1 sm:gap-2 bg-black/50 hover:bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full border border-gray-600 backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm"
                      title={isTrailerMuted ? "Unmute" : "Mute"}
                    >
                      {isTrailerMuted ? (
                        <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="font-medium">
                        {isTrailerMuted ? "Unmute" : "Mute"}
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-3xl drop-shadow-lg line-clamp-3 sm:line-clamp-none">
                  {heroContent.short_description || heroContent.description}
                </p>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => handlePlayContent(heroContent)}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    Play
                  </button>

                  {heroContent.trailer && (
                    <button
                      onClick={toggleTrailer}
                      className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      {isTrailerPlaying ? 'Stop' : 'Trailer'}
                    </button>
                  )}

                  <button
                    onClick={(e) => handleAddToLibrary(heroContent, e)}
                    className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">My List</span>
                  </button>

                  <button
                    onClick={(e) => handleMoreInfo(heroContent, e)}
                    className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm"
                  >
                    <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="relative z-30 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="space-y-8 sm:space-y-16 py-8 sm:py-16">
          {featuredContent.length > 0 && (
            <ContentRow
              title="Popular in Rwanda"
              subtitle="Top picks loved by Rwandan viewers"
              items={featuredContent}
              sectionKey="featured"
              icon={Sparkles}
              showExplore={featuredContent.length >= 5}
              onPlay={handlePlayContent}
              onAddToList={handleAddToLibrary}
              onMoreInfo={handleMoreInfo}
              onExploreMore={handleExploreMore}
            />
          )}

          {trendingContent.length > 0 && (
            <ContentRow
              title="Trending Now"
              subtitle="What everyone is watching"
              items={trendingContent}
              sectionKey="trending"
              icon={TrendingUp}
              showExplore={trendingContent.length >= 5}
              onPlay={handlePlayContent}
              onAddToList={handleAddToLibrary}
              onMoreInfo={handleMoreInfo}
              onExploreMore={handleExploreMore}
            />
          )}

          {recentContent.length > 0 && (
            <ContentRow
              title="New Releases"
              subtitle="Fresh content just added"
              items={recentContent}
              sectionKey="recent"
              icon={ClockIcon}
              showExplore={recentContent.length >= 5}
              onPlay={handlePlayContent}
              onAddToList={handleAddToLibrary}
              onMoreInfo={handleMoreInfo}
              onExploreMore={handleExploreMore}
            />
          )}
        </div>
      </div>
      <ContentDetailModal
        content={detailModal.content}
        isOpen={detailModal.isOpen}
        position={detailModal.position}
        onClose={closeDetailModal}
        onPlay={handlePlayContent}
        onAddToList={handleAddToLibrary}
      />
    </div>
  );
}