// src/pages/Dashboards/viewer/content/ContentDetailModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Play, Plus, Share2, Heart, Clock, Calendar, Star, Users, X,
  Volume2, VolumeX, Maximize2, Minimize2, Home, ArrowLeft,
  Award, Eye, ThumbsUp, Languages, AlertTriangle, Film,
  User, Mic, Video, Settings, Download, Captions,
  MapPin, Globe, Shield, TrendingUp, CalendarDays
} from "lucide-react";

const ContentDetailModal = ({
  content,
  isOpen,
  onClose,
  position = null,
  onPlay,
  onAddToList
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [isVisible, setIsVisible] = useState(false);
  const [animationStage, setAnimationStage] = useState('entering');
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [borderGlow, setBorderGlow] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFloatingTrailer, setShowFloatingTrailer] = useState(false);
  const [contentData, setContentData] = useState(content);
  const [isLoading, setIsLoading] = useState(false);
  const [similarContent, setSimilarContent] = useState([]);

  const modalRef = useRef(null);
  const videoRef = useRef(null);
  const backdropRef = useRef(null);
  const contentRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const floatingVideoRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const previousPathRef = useRef('/');
  const cameFromExternalRef = useRef(false);

  // Fetch detailed content data
  const fetchContentDetails = useCallback(async (contentId) => {
    if (!contentId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/viewer/content/${contentId}?refresh=true`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setContentData(result.data);
          fetchSimilarContent(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching content details:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch similar content based on genres, categories, and type
  const fetchSimilarContent = useCallback(async (content) => {
    if (!content) return;

    try {
      // Try multiple strategies to get similar content
      const strategies = [];
      
      // Strategy 1: Same genres
      if (content.genres && content.genres.length > 0) {
        const genreIds = content.genres.map(g => g.id).join(',');
        strategies.push(`genres=${genreIds}`);
      }
      
      // Strategy 2: Same categories
      if (content.categories && content.categories.length > 0) {
        const categoryIds = content.categories.map(c => c.id).join(',');
        strategies.push(`categories=${categoryIds}`);
      }
      
      // Strategy 3: Same content type
      strategies.push(`type=${content.content_type}`);
      
      // Try each strategy until we get results
      for (let strategy of strategies) {
        try {
          const response = await fetch(`/api/viewer/content?${strategy}&limit=8`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.contents && result.data.contents.length > 0) {
              // Filter out current content and ensure we have unique items
              const filtered = result.data.contents
                .filter(item => item.id !== content.id)
                .slice(0, 6);
              
              if (filtered.length > 0) {
                setSimilarContent(filtered);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching similar content:', error);
        }
      }
      
      // Fallback: Get recent content if no similar content found
      const recentResponse = await fetch('/api/viewer/content?limit=6&sort=recent');
      if (recentResponse.ok) {
        const result = await recentResponse.json();
        if (result.success && result.data.contents) {
          setSimilarContent(result.data.contents.slice(0, 6));
        }
      }
    } catch (error) {
      console.error('Error fetching fallback content:', error);
    }
  }, []);

  // PRO: Enhanced trailer controls with PIP support
  const startTrailerPlayback = useCallback(async () => {
    const trailer = contentData?.trailer || contentData?.media_assets?.find(asset => asset.asset_type === 'trailer');
    if (!trailer || !videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isTrailerMuted;
      setIsTrailerPlaying(true);
      setShowFloatingTrailer(false);

      await videoRef.current.play();
    } catch (error) {
      console.error('Trailer auto-play failed:', error);
      setIsTrailerPlaying(false);
    }
  }, [contentData, isTrailerMuted]);

  const stopTrailerPlayback = useCallback(() => {
    setIsTrailerPlaying(false);
    setShowFloatingTrailer(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (floatingVideoRef.current) {
      floatingVideoRef.current.pause();
      floatingVideoRef.current.currentTime = 0;
    }
  }, []);

  const toggleMute = useCallback((e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsTrailerMuted(newMutedState);
    }
    if (floatingVideoRef.current) {
      floatingVideoRef.current.muted = !floatingVideoRef.current.muted;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!contentRef.current) return;

    if (!document.fullscreenElement) {
      contentRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // PRO: Enhanced floating trailer controls
  const toggleFloatingTrailer = useCallback(() => {
    const trailer = contentData?.trailer || contentData?.media_assets?.find(asset => asset.asset_type === 'trailer');
    if (!trailer) return;

    if (showFloatingTrailer) {
      setShowFloatingTrailer(false);
      if (floatingVideoRef.current) {
        floatingVideoRef.current.pause();
      }
      // Resume main trailer if it was playing
      if (isTrailerPlaying && videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
    } else {
      setShowFloatingTrailer(true);
      // Pause main trailer
      if (videoRef.current) {
        videoRef.current.pause();
      }
      // Start floating trailer
      setTimeout(() => {
        if (floatingVideoRef.current) {
          floatingVideoRef.current.currentTime = videoRef.current?.currentTime || 0;
          floatingVideoRef.current.muted = isTrailerMuted;
          floatingVideoRef.current.play().catch(console.error);
        }
      }, 100);
    }
  }, [contentData, showFloatingTrailer, isTrailerPlaying, isTrailerMuted]);

  // PRO: Smart scroll handling with floating trailer - FIXED FOR ENTIRE MODAL
  const handleScroll = useCallback((e) => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const scrollThreshold = 200; // Start showing floating trailer after 200px scroll

    setIsScrolling(true);

    const trailer = contentData?.trailer || contentData?.media_assets?.find(asset => asset.asset_type === 'trailer');

    // Show floating trailer when scrolling down, hide when scrolling up
    if (scrollTop > scrollThreshold && isTrailerPlaying && !showFloatingTrailer) {
      setShowFloatingTrailer(true);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      // Start floating trailer after a brief delay
      setTimeout(() => {
        if (floatingVideoRef.current && trailer) {
          floatingVideoRef.current.src = trailer.url;
          floatingVideoRef.current.currentTime = videoRef.current?.currentTime || 0;
          floatingVideoRef.current.muted = isTrailerMuted;
          floatingVideoRef.current.play().catch(console.error);
        }
      }, 100);
    } else if (scrollTop <= scrollThreshold && showFloatingTrailer) {
      setShowFloatingTrailer(false);
      if (floatingVideoRef.current) {
        floatingVideoRef.current.pause();
      }
      // Resume main trailer if it was playing
      if (isTrailerPlaying && videoRef.current) {
        videoRef.current.play().catch(console.error);
      }
    }

    // Clear previous timer
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    // Set timer to detect when scrolling stops
    scrollTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [isTrailerPlaying, showFloatingTrailer, isTrailerMuted, contentData]);

  // PRO: Handle backdrop scroll to modal scroll transfer
  const handleBackdropScroll = useCallback((e) => {
    if (!scrollContainerRef.current) return;

    const backdrop = backdropRef.current;
    const modal = scrollContainerRef.current;
    
    if (!backdrop || !modal) return;

    // Get scroll direction
    const deltaY = e.deltaY;
    
    // Get current scroll position of modal
    const modalScrollTop = modal.scrollTop;
    const modalScrollHeight = modal.scrollHeight;
    const modalClientHeight = modal.clientHeight;

    // Check if we can scroll further in the detected direction
    const canScrollDown = modalScrollTop < modalScrollHeight - modalClientHeight - 1;
    const canScrollUp = modalScrollTop > 0;

    // If scrolling down and we can scroll down in modal, scroll the modal instead
    if (deltaY > 0 && canScrollDown) {
      e.preventDefault();
      modal.scrollTop += deltaY * 0.8; // Smooth scroll transfer
    }
    // If scrolling up and we can scroll up in modal, scroll the modal instead
    else if (deltaY < 0 && canScrollUp) {
      e.preventDefault();
      modal.scrollTop += deltaY * 0.8; // Smooth scroll transfer
    }
  }, []);

  // PRO: Fixed navigation handlers
  const handleGoHome = useCallback(() => {
    stopTrailerPlayback();
    navigate('/', { replace: true });
    onClose?.();
  }, [navigate, onClose, stopTrailerPlayback]);

  const handleGoBack = useCallback(() => {
    stopTrailerPlayback();

    if (window.history.length > 1) {
      const previousPath = previousPathRef.current;
      if (previousPath && previousPath !== window.location.pathname) {
        navigate(previousPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }

    onClose?.();
  }, [navigate, onClose, stopTrailerPlayback]);

  const handleSmartClose = useCallback(() => {
    stopTrailerPlayback();
    setAnimationStage('exiting');

    setTimeout(() => {
      const hasInternalHistory = window.history.length > 1 && previousPathRef.current !== '/';

      if (hasInternalHistory) {
        navigate(previousPathRef.current, { replace: true });
      } else {
        navigate('/', { replace: true });
      }

      onClose?.();
    }, 300);
  }, [navigate, onClose, stopTrailerPlayback]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === backdropRef.current) {
      handleSmartClose();
    }
  }, [handleSmartClose]);

  const handlePlay = useCallback(() => {
    onPlay?.(contentData);
    handleSmartClose();
  }, [contentData, onPlay, handleSmartClose]);

  const handleAddToList = useCallback(() => {
    onAddToList?.(contentData);
  }, [contentData, onAddToList]);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/title/${contentData.id}`;
    if (navigator.share) {
      navigator.share({
        title: contentData.title,
        text: contentData.short_description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      console.log('URL copied to clipboard:', shareUrl);
    }
  }, [contentData]);

  // PRO: Enhanced helper functions
  const getAgeRating = useCallback(() => {
    const rating = contentData?.age_rating || "13+";
    const ratingMap = {
      'G': 'All Ages', 'PG': 'PG', 'PG-13': '13+', 'R': '18+', 'NC-17': '18+'
    };
    return ratingMap[rating] || rating;
  }, [contentData]);

  const formatDuration = useCallback((minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  const getRating = useCallback(() => {
    const rating = contentData?.current_rating || contentData?.average_rating || contentData?.rating;
    return typeof rating === 'number' ? rating.toFixed(1) : 'N/A';
  }, [contentData]);

  const getGenres = useCallback(() => {
    if (contentData?.genres && Array.isArray(contentData.genres)) {
      return contentData.genres.map(genre => genre.name).join(' • ');
    }
    return contentData?.genre || 'Movie';
  }, [contentData]);

  const getCast = useCallback(() => {
    if (contentData?.cast && Array.isArray(contentData.cast)) {
      return contentData.cast.slice(0, 12);
    } else if (contentData?.cast_crew && Array.isArray(contentData.cast_crew)) {
      return contentData.cast_crew
        .filter(person => person.role_type === 'actor')
        .slice(0, 12);
    }
    return [];
  }, [contentData]);

  const getCrew = useCallback((roleType) => {
    if (contentData?.crew && Array.isArray(contentData.crew)) {
      return contentData.crew.filter(person => person.role_type === roleType);
    } else if (contentData?.cast_crew && Array.isArray(contentData.cast_crew)) {
      return contentData.cast_crew.filter(person => person.role_type === roleType);
    }
    return [];
  }, [contentData]);

  const getContentWarnings = useCallback(() => {
    return contentData?.content_warnings || [];
  }, [contentData]);

  const getAvailableLanguages = useCallback(() => {
    return contentData?.available_languages?.map(lang => ({
      ...lang,
      is_default: lang.default || lang.is_default
    })) || [];
  }, [contentData]);

  const getAwards = useCallback(() => {
    return contentData?.awards || [];
  }, [contentData]);

  const getSeasons = useCallback(() => {
    return contentData?.seasons || [];
  }, [contentData]);

  const getStats = useCallback(() => {
    return contentData?.stats || {};
  }, [contentData]);

  const getMediaAssets = useCallback((type) => {
    if (!contentData?.media_assets) return [];
    return contentData.media_assets.filter(asset => asset.asset_type === type);
  }, [contentData]);

  const getTrailer = useCallback(() => {
    return contentData?.trailer || contentData?.media_assets?.find(asset => asset.asset_type === 'trailer');
  }, [contentData]);

  const getPrimaryImage = useCallback(() => {
    return contentData?.primary_image_url || 
           contentData?.media_assets?.find(asset => 
             asset.is_primary && (asset.asset_type === 'poster' || asset.asset_type === 'thumbnail')
           )?.url ||
           '/api/placeholder/1200/600';
  }, [contentData]);

  // PRO: Enhanced modal positioning
  const getModalStyle = useCallback(() => {
    const baseStyle = {
      transform: 'scale(1)',
      opacity: 1,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    if (animationStage === 'entering' && position) {
      return {
        transform: `scale(0.85) translate(${position.left}px, ${position.top}px)`,
        opacity: 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    }

    if (animationStage === 'exiting') {
      return {
        transform: 'scale(0.9)',
        opacity: 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      };
    }

    return baseStyle;
  }, [animationStage, position]);

  // PRO: Track user navigation origin
  useEffect(() => {
    if (id && !isOpen) {
      const referrer = document.referrer;
      cameFromExternalRef.current = !referrer.includes(window.location.origin);
      previousPathRef.current = location.state?.previousPath || '/';
    }
  }, [id, isOpen, location.state]);

  // PRO: Update previous path when location changes
  useEffect(() => {
    if (location.pathname !== '/title/' + contentData?.id) {
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname, contentData?.id]);

  // PRO: Enhanced scroll handling with floating trailer - FIXED IMPLEMENTATION
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // PRO: Handle backdrop wheel events for scroll transfer
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (backdrop) {
      backdrop.addEventListener('wheel', handleBackdropScroll, { passive: false });
      return () => {
        backdrop.removeEventListener('wheel', handleBackdropScroll);
      };
    }
  }, [handleBackdropScroll]);

  // PRO: Border glow effect
  useEffect(() => {
    if (isOpen || id) {
      const timer = setTimeout(() => {
        setBorderGlow(true);
      }, 600);

      return () => {
        setBorderGlow(false);
        clearTimeout(timer);
      };
    }
  }, [isOpen, id]);

  // PRO: Handle both modal and route scenarios
  useEffect(() => {
    const shouldShow = isOpen || id;

    if (shouldShow) {
      setIsVisible(true);
      setAnimationStage('entering');

      // Fetch detailed content if we only have basic data
      if (id && (!content || Object.keys(content).length < 10)) {
        fetchContentDetails(id);
      } else if (content) {
        setContentData(content);
        fetchSimilarContent(content);
      }

      const timer = setTimeout(() => {
        setAnimationStage('entered');
        autoPlayTimerRef.current = setTimeout(() => {
          startTrailerPlayback();
        }, 600);
      }, 50);

      return () => {
        clearTimeout(timer);
        if (autoPlayTimerRef.current) {
          clearTimeout(autoPlayTimerRef.current);
        }
      };
    } else {
      setAnimationStage('exiting');
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isOpen, id, startTrailerPlayback, content, fetchContentDetails, fetchSimilarContent]);

  // PRO: Enhanced browser back button handling
  useEffect(() => {
    const handlePopState = (event) => {
      if (isOpen || id) {
        handleSmartClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, id, handleSmartClose]);

  // PRO: Enhanced escape key with animation
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && (isOpen || id)) {
        e.preventDefault();
        handleSmartClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, id, handleSmartClose]);

  // PRO: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, []);

  if (!isVisible && !id) return null;

  const currentContent = contentData || content;
  const trailer = getTrailer();
  const primaryImage = getPrimaryImage();

  const modalContent = (
    <div
      ref={backdropRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-400 ${animationStage === 'entering'
          ? 'bg-black/0 backdrop-blur-0'
          : 'bg-black/60 backdrop-blur-sm'
        }`}
      onClick={handleBackdropClick}
      style={{
        pointerEvents: (isOpen || id) ? 'auto' : 'none',
        overflow: 'auto'
      }}
    >
      {/* PRO: Floating Trailer (Picture-in-Picture) */}
      {showFloatingTrailer && trailer && (
        <div className="fixed top-4 right-4 z-[1000] w-64 h-36 bg-black rounded-lg shadow-2xl border-2 border-[#BC8BBC] overflow-hidden group">
          <video
            ref={floatingVideoRef}
            className="w-full h-full object-cover"
            src={trailer.url}
            muted={isTrailerMuted}
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
              <button
                onClick={toggleMute}
                className="bg-black/80 text-white rounded-full p-1.5 transition-all duration-200 hover:bg-[#BC8BBC]"
              >
                {isTrailerMuted ? (
                  <VolumeX className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={toggleFloatingTrailer}
                className="bg-black/80 text-white rounded-full p-1.5 transition-all duration-200 hover:bg-[#BC8BBC]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRO: Enhanced Modal with ENTIRE MODAL SCROLLING */}
      <div
        ref={modalRef}
        className={`relative w-full max-w-6xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden transition-all duration-700 ${borderGlow
            ? 'shadow-2xl ring-2 ring-inset'
            : 'shadow-2xl border border-gray-700/50'
          }`}
        style={{
          ...getModalStyle(),
          boxShadow: borderGlow
            ? '0 0 80px rgba(188, 139, 188, 0.3), 0 0 120px rgba(188, 139, 188, 0.2), 0 0 160px rgba(188, 139, 188, 0.1)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderColor: borderGlow ? 'rgba(188, 139, 188, 0.4)' : 'rgba(75, 85, 99, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute inset-0 rounded-2xl opacity-0 transition-all duration-1000 ${borderGlow ? 'opacity-100' : ''
          }`} style={{
            background: 'linear-gradient(45deg, rgba(188, 139, 188, 0.15), rgba(188, 139, 188, 0.1), rgba(188, 139, 188, 0.05))'
          }} />

        {/* ENTIRE MODAL SCROLL CONTAINER */}
        <div 
          ref={scrollContainerRef}
          className="relative z-10 w-full h-full bg-gray-900 rounded-2xl overflow-y-auto custom-scrollbar flex flex-col"
          onScroll={handleScroll}
        >
          <div ref={contentRef} className="flex flex-col">

            {/* PRO: Enhanced Navigation Controls - STAYS FIXED AT TOP */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
              {/* Floating Trailer Toggle */}
              {trailer && isTrailerPlaying && (
                <button
                  onClick={toggleFloatingTrailer}
                  className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
                  title={showFloatingTrailer ? "Close Floating Trailer" : "Open Floating Trailer"}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(188, 139, 188, 0.3)'
                  }}
                >
                  <Film className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}

              <button
                onClick={handleGoBack}
                className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
                title="Go Back (Internal)"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={handleGoHome}
                className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
                title="Go to Homepage (Internal)"
              >
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={handleSmartClose}
                className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 hover:rotate-90 group shadow-lg"
                title="Close (Internal)"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* PRO: Enhanced Hero Section - NOW SCROLLS WITH CONTENT */}
            <div className="relative h-72 sm:h-80 md:h-96 lg:h-[500px] bg-gray-800 overflow-hidden flex-shrink-0">
              {/* Trailer Video */}
              {trailer && (
                <div className={`absolute inset-0 transition-all duration-500 ${isTrailerPlaying && trailerLoaded ? 'opacity-100' : 'opacity-0'
                  }`}>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src={trailer.url}
                    muted={isTrailerMuted}
                    onEnded={() => setIsTrailerPlaying(false)}
                    onLoadedData={() => setTrailerLoaded(true)}
                    onError={() => setIsTrailerPlaying(false)}
                    playsInline
                    preload="auto"
                  />

                  {/* PRO: Enhanced Video Controls */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <button
                      onClick={toggleMute}
                      className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-2 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 shadow-lg"
                      title={isTrailerMuted ? "Unmute" : "Mute"}
                    >
                      {isTrailerMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-2 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 shadow-lg"
                      title="Fullscreen"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Background Image */}
              <div className={`absolute inset-0 transition-all duration-500 ${!isTrailerPlaying || !trailerLoaded ? 'opacity-100' : 'opacity-0'
                }`}>
                <img
                  src={primaryImage}
                  alt={currentContent?.title}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
                )}
              </div>

              {/* Enhanced Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/10 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 drop-shadow-2xl leading-tight">
                  {currentContent?.title}
                </h1>

                {/* Enhanced Metadata Row */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold">{getRating()}</span>
                    {currentContent?.current_rating_count && (
                      <span className="text-gray-300 text-sm ml-1">
                        ({currentContent.current_rating_count})
                      </span>
                    )}
                  </div>

                  <div className="px-3 py-1.5 bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-md font-semibold">
                    {getAgeRating()}
                  </div>

                  {currentContent?.duration_minutes && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{formatDuration(currentContent.duration_minutes)}</span>
                    </div>
                  )}

                  {currentContent?.release_date && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">
                        {new Date(currentContent.release_date).getFullYear()}
                      </span>
                    </div>
                  )}

                  {currentContent?.view_count && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">
                        {currentContent.view_count.toLocaleString()} views
                      </span>
                    </div>
                  )}
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl"
                    style={{
                      backgroundColor: '#BC8BBC',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#a56ba5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#BC8BBC';
                    }}
                  >
                    <Play className="w-6 h-6 fill-current" />
                    Play Now
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddToList}
                      className="flex items-center justify-center text-white rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm group"
                      title="Add to List"
                      style={{
                        backgroundColor: 'rgba(188, 139, 188, 0.1)',
                        borderColor: 'rgba(188, 139, 188, 0.3)'
                      }}
                    >
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>

                    <button
                      onClick={() => console.log('Like:', currentContent.title)}
                      className="flex items-center justify-center text-white rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm"
                      title="Like"
                      style={{
                        backgroundColor: 'rgba(188, 139, 188, 0.1)',
                        borderColor: 'rgba(188, 139, 188, 0.3)'
                      }}
                    >
                      <Heart className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center text-white rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm"
                      title="Share"
                      style={{
                        backgroundColor: 'rgba(188, 139, 188, 0.1)',
                        borderColor: 'rgba(188, 139, 188, 0.3)'
                      }}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  {trailer && (
                    <button
                      onClick={isTrailerPlaying ? stopTrailerPlayback : startTrailerPlayback}
                      className="flex items-center gap-2 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 border backdrop-blur-sm"
                      style={{
                        backgroundColor: 'rgba(188, 139, 188, 0.1)',
                        borderColor: 'rgba(188, 139, 188, 0.3)'
                      }}
                    >
                      <Play className="w-4 h-4" />
                      {isTrailerPlaying ? 'Stop Trailer' : 'Play Trailer'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PRO: Enhanced Content Details - NOW PART OF SCROLLABLE CONTENT */}
            <div className="p-6 sm:p-8">
              {/* Enhanced Tabs */}
              <div className="flex border-b border-gray-700/50 mb-6 overflow-x-auto">
                {[
                  'overview',
                  'cast',
                  'details',
                  'media',
                  ...(getSeasons().length > 0 ? ['seasons'] : []),
                  ...(getAwards().length > 0 ? ['awards'] : []),
                  ...(similarContent.length > 0 ? ['similar'] : [])
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${activeTab === tab
                        ? 'border-white text-white bg-white/5'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'cast' && currentContent?.cast_count && (
                      <span className="ml-2 text-xs bg-[#BC8BBC] text-white rounded-full px-2 py-1">
                        {currentContent.cast_count}
                      </span>
                    )}
                    {tab === 'media' && getMediaAssets('behind_scenes').length > 0 && (
                      <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-2 py-1">
                        {getMediaAssets('behind_scenes').length}
                      </span>
                    )}
                    {tab === 'awards' && getAwards().length > 0 && (
                      <span className="ml-2 text-xs bg-yellow-500 text-white rounded-full px-2 py-1">
                        {getAwards().length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Enhanced Tab Content */}
              <div className="space-y-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">Synopsis</h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        {currentContent?.description || currentContent?.short_description || 'No description available.'}
                      </p>
                    </div>

                    {/* Enhanced Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Genre</h4>
                        <p className="text-white font-medium">{getGenres()}</p>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Rating</h4>
                        <p className="text-white font-medium">{getRating()}/5</p>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Duration</h4>
                        <p className="text-white font-medium">{formatDuration(currentContent?.duration_minutes)}</p>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Type</h4>
                        <p className="text-white font-medium capitalize">{currentContent?.content_type || 'Movie'}</p>
                      </div>
                    </div>

                    {/* Content Warnings */}
                    {getContentWarnings().length > 0 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          <h4 className="text-lg font-semibold text-yellow-400">Content Warnings</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getContentWarnings().map((warning, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm border border-yellow-500/30"
                            >
                              {warning.warning_type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Available Languages */}
                    {getAvailableLanguages().length > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Languages className="w-5 h-5 text-blue-400" />
                          <h4 className="text-lg font-semibold text-blue-400">Available Languages</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getAvailableLanguages().map((lang, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                            >
                              {lang.language_code.toUpperCase()}
                              {lang.is_default && " (Default)"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cast' && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6">Cast & Crew</h3>
                    
                    {/* Cast Section */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Cast ({getCast().length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {getCast().map((person, index) => (
                          <div key={index} className="text-center group">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg overflow-hidden">
                              {person.profile_image_url ? (
                                <img
                                  src={person.profile_image_url}
                                  alt={person.display_name || person.full_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <Users className="w-8 h-8 text-white" />
                              )}
                            </div>
                            <p className="text-white text-sm font-medium truncate group-hover:text-[#BC8BBC] transition-colors">
                              {person.display_name || person.full_name}
                            </p>
                            {person.character_name && (
                              <p className="text-gray-400 text-xs truncate mt-1">
                                as {person.character_name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Crew Section */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Crew
                      </h4>
                      <div className="space-y-4">
                        {['director', 'producer', 'writer', 'cinematographer', 'composer'].map(role => {
                          const crewMembers = getCrew(role);
                          if (crewMembers.length === 0) return null;

                          return (
                            <div key={role} className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#BC8BBC]/20 rounded-lg">
                                  {role === 'director' && <Video className="w-4 h-4 text-[#BC8BBC]" />}
                                  {role === 'producer' && <Settings className="w-4 h-4 text-[#BC8BBC]" />}
                                  {role === 'writer' && <Mic className="w-4 h-4 text-[#BC8BBC]" />}
                                  {role === 'cinematographer' && <Camera className="w-4 h-4 text-[#BC8BBC]" />}
                                  {role === 'composer' && <Music className="w-4 h-4 text-[#BC8BBC]" />}
                                </div>
                                <div>
                                  <span className="text-gray-300 capitalize font-medium">{role}s</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {crewMembers.map((person, index) => (
                                      <span key={index} className="text-white text-sm bg-white/10 px-2 py-1 rounded">
                                        {person.display_name || person.full_name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5" />
                        Content Information
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <h4 className="text-sm font-semibold text-gray-400 mb-1">Release Date</h4>
                          <p className="text-white font-medium">
                            {currentContent?.release_date
                              ? new Date(currentContent.release_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Not available'
                            }
                          </p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <h4 className="text-sm font-semibold text-gray-400 mb-1">Content Type</h4>
                          <p className="text-white font-medium capitalize">{currentContent?.content_type || 'Movie'}</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <h4 className="text-sm font-semibold text-gray-400 mb-1">Status</h4>
                          <p className="text-white font-medium capitalize">{currentContent?.status || 'Published'}</p>
                        </div>

                        {currentContent?.license_type && (
                          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">License</h4>
                            <p className="text-white font-medium capitalize">{currentContent.license_type}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Statistics & Rights
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">Categories</h4>
                          <div className="flex flex-wrap gap-2">
                            {currentContent?.categories?.map((category, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-[#BC8BBC]/20 text-[#BC8BBC] rounded-full text-sm border border-[#BC8BBC]/30"
                              >
                                {category.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Views</h4>
                            <p className="text-white font-medium">{currentContent?.view_count?.toLocaleString() || '0'}</p>
                          </div>

                          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-semibold text-gray-400 mb-1">Ratings</h4>
                            <p className="text-white font-medium">{currentContent?.current_rating_count || '0'}</p>
                          </div>
                        </div>

                        {currentContent?.downloadable && (
                          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <div className="flex items-center gap-2">
                              <Download className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 font-medium">Download Available</span>
                            </div>
                          </div>
                        )}

                        {currentContent?.shareable && (
                          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <div className="flex items-center gap-2">
                              <Share2 className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 font-medium">Shareable Content</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'media' && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6">Media Gallery</h3>
                    
                    {/* Behind the Scenes */}
                    {getMediaAssets('behind_scenes').length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-300 mb-4">Behind the Scenes</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {getMediaAssets('behind_scenes').map((asset, index) => (
                            <div key={index} className="group cursor-pointer">
                              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                                <img
                                  src={asset.url}
                                  alt={`Behind the scenes ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshots */}
                    {getMediaAssets('screenshot').length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-300 mb-4">Screenshots</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {getMediaAssets('screenshot').map((asset, index) => (
                            <div key={index} className="group cursor-pointer">
                              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                                <img
                                  src={asset.url}
                                  alt={`Screenshot ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Posters */}
                    {getMediaAssets('poster').length > 1 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-300 mb-4">Additional Posters</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {getMediaAssets('poster').slice(1).map((asset, index) => (
                            <div key={index} className="group cursor-pointer">
                              <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden relative">
                                <img
                                  src={asset.url}
                                  alt={`Poster ${index + 2}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'seasons' && getSeasons().length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6">Seasons & Episodes</h3>
                    <div className="space-y-6">
                      {getSeasons().map((season, index) => (
                        <div key={index} className="bg-white/5 rounded-xl border border-white/10 p-6">
                          <div className="flex items-start gap-4">
                            {season.season_poster_url && (
                              <img
                                src={season.season_poster_url}
                                alt={`Season ${season.season_number}`}
                                className="w-24 h-36 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="text-lg font-bold text-white">Season {season.season_number}</h4>
                                <span className="text-gray-400 text-sm">
                                  {season.actual_episode_count || season.episode_count} episodes
                                </span>
                                {season.release_date && (
                                  <span className="text-gray-400 text-sm">
                                    {new Date(season.release_date).getFullYear()}
                                  </span>
                                )}
                              </div>
                              {season.description && (
                                <p className="text-gray-300 mb-4">{season.description}</p>
                              )}
                              <div className="grid gap-2">
                                {season.episodes?.map((episode, epIndex) => (
                                  <div key={epIndex} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <div>
                                      <span className="text-white font-medium">
                                        Episode {episode.episode_number}: {episode.title}
                                      </span>
                                      {episode.description && (
                                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{episode.description}</p>
                                      )}
                                    </div>
                                    {episode.duration_minutes && (
                                      <span className="text-gray-400 text-sm">
                                        {formatDuration(episode.duration_minutes)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'awards' && getAwards().length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Awards & Nominations
                    </h3>
                    <div className="grid gap-4">
                      {getAwards().map((award, index) => (
                        <div key={index} className={`p-4 rounded-xl border ${
                          award.result === 'won' 
                            ? 'bg-green-500/10 border-green-500/20' 
                            : 'bg-yellow-500/10 border-yellow-500/20'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-white font-semibold">{award.award_name}</h4>
                              <p className="text-gray-300 text-sm">
                                {award.category} • {award.award_year}
                              </p>
                              {award.person_name && (
                                <p className="text-gray-400 text-sm mt-1">
                                  {award.person_display_name || award.person_name}
                                </p>
                              )}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              award.result === 'won' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-yellow-500 text-white'
                            }`}>
                              {award.result === 'won' ? 'Winner' : 'Nominee'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'similar' && similarContent.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6">You Might Also Like</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {similarContent.map((item, index) => (
                        <div 
                          key={index} 
                          className="group cursor-pointer transform hover:scale-105 transition-transform duration-200"
                          onClick={() => {
                            // Navigate to this content
                            navigate(`/title/${item.id}`);
                          }}
                        >
                          <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 relative">
                            <img
                              src={item.primary_image_url || '/api/placeholder/300/450'}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="flex items-center gap-1 text-white text-xs">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{item.average_rating || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-white text-sm font-medium truncate group-hover:text-[#BC8BBC] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {item.content_type === 'series' ? 'Series' : 'Movie'} • {new Date(item.release_date).getFullYear()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Enhanced custom scrollbar styles
const styles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #BC8BBC rgba(255, 255, 255, 0.05);
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #BC8BBC;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a56ba5;
  }
  
  /* Ensure modal backdrop doesn't block scrolling */
  .modal-backdrop {
    overflow: auto !important;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Add missing Lucide icons
const Camera = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const Music = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
);

export default ContentDetailModal;