import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import userPreferencesApi from "../api/userPreferencesApi";
import { useContentDetail } from './useContentDetail';

export function useViewerLanding() {
  const navigate = useNavigate();
  const { detailModal, openDetailModal, closeDetailModal } = useContentDetail();
  
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
    loading: { like: false, watchlist: false }
  });

  const videoRef = useRef(null);
  const heroSectionRef = useRef(null);
  const sectionRefs = useRef({});
  const contentFetchedRef = useRef(false);

  // Helper function to update hero preferences
  const updateHeroPreferences = useCallback((updates) => {
    setHeroPreferences(prev => ({ ...prev, ...updates }));
  }, []);

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
    const fetchHeroPreferences = async () => {
      if (!heroContent?.id) return;

      try {
        const response = await userPreferencesApi.getUserContentPreferences(heroContent.id);
        if (response.success) {
          updateHeroPreferences({
            isLiked: response.data?.isLiked || false,
            isInList: response.data?.isInList || false
          });
        }
      } catch (error) {
        console.error('Error fetching hero preferences:', error);
      }
    };

    fetchHeroPreferences();
  }, [heroContent, updateHeroPreferences]);

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
      { threshold: [0, 0.5, 1], rootMargin: '-50px 0px -50px 0px' }
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isTrailerMuted;
      videoRef.current.volume = isTrailerMuted ? 0 : 1;
    }
  }, [isTrailerMuted]);

  const handlePlayContent = useCallback((content) => {
    navigate('/watch', { state: { content } });
  }, [navigate]);

  const handleAddToLibrary = useCallback(async (content, e) => {
    e?.stopPropagation();
    
    if (!content?.id) return;

    try {
      updateHeroPreferences({ loading: { ...heroPreferences.loading, watchlist: true } });
      
      const action = heroPreferences.isInList ? 'remove' : 'add';
      const response = await userPreferencesApi.toggleWatchlist(content.id, action);

      if (response.success) {
        const newInListState = !heroPreferences.isInList;
        updateHeroPreferences({ 
          isInList: newInListState,
          loading: { ...heroPreferences.loading, watchlist: false }
        });
        console.log(`Successfully ${action === 'add' ? 'added to' : 'removed from'} watchlist`);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      updateHeroPreferences({ loading: { ...heroPreferences.loading, watchlist: false } });
    }
  }, [heroPreferences.isInList, heroPreferences.loading, updateHeroPreferences]);

  const handleLikeContent = useCallback(async (content, e) => {
    e?.stopPropagation();
    
    if (!content?.id) return;

    try {
      updateHeroPreferences({ loading: { ...heroPreferences.loading, like: true } });
      
      const action = heroPreferences.isLiked ? 'unlike' : 'like';
      const response = await userPreferencesApi.toggleLike(content.id, action);

      if (response.success) {
        const newLikedState = !heroPreferences.isLiked;
        updateHeroPreferences({ 
          isLiked: newLikedState,
          loading: { ...heroPreferences.loading, like: false }
        });
        console.log(`Successfully ${action}d content`);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      updateHeroPreferences({ loading: { ...heroPreferences.loading, like: false } });
    }
  }, [heroPreferences.isLiked, heroPreferences.loading, updateHeroPreferences]);

  const handleMoreInfo = useCallback((content, cardRect) => {
    openDetailModal(content, cardRect);
  }, [openDetailModal]);

  const handleExploreMore = useCallback((section) => {
    console.log('Explore more:', section);
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

  return {
    // State
    contents,
    heroContent,
    featuredContent,
    trendingContent,
    recentContent,
    loading,
    error,
    isTrailerPlaying,
    isTrailerMuted,
    isHeroInView,
    isPageVisible,
    heroPreferences,
    detailModal,
    
    // Refs
    videoRef,
    heroSectionRef,
    
    // Actions
    fetchContentData,
    startTrailerPlayback,
    handleTrailerEnd,
    handleTrailerError,
    toggleTrailer,
    toggleMute,
    handlePlayContent,
    handleAddToLibrary,
    handleLikeContent,
    handleMoreInfo,
    handleExploreMore,
    getAgeRating,
    closeDetailModal,
    updateHeroPreferences
  };
}