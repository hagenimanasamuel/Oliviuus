// src/components/ContentCard/HoverModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Info, Heart, Clock, Star, Volume2, VolumeX, Check, Loader2 } from "lucide-react";
import { useContentDetail } from "../../../../../hooks/useContentDetail";
import userPreferencesApi from "../../../../../api/userPreferencesApi";

const HoverModal = ({ content, position, cardRect, onClose, onPlay, onAddToList, onMoreInfo }) => {
  const navigate = useNavigate();
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const [animationStage, setAnimationStage] = useState('entering');
  const [isLiked, setIsLiked] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [loading, setLoading] = useState({
    like: false,
    watchlist: false
  });
  const videoRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const modalRef = useRef(null);

  // Use your content detail hook
  const { openDetailModal } = useContentDetail();

  // Check if content is already liked or in list
  useEffect(() => {
    const checkUserPreferences = async () => {
      if (!content?.id) return;

      try {
        const response = await userPreferencesApi.getUserContentPreferences(content.id);
        if (response.success) {
          setIsLiked(response.data?.isLiked || false);
          setIsInList(response.data?.isInList || false);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        // Don't show error to user for preference loading
      }
    };

    checkUserPreferences();
  }, [content?.id]);

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

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getRating = () => {
    const rating = content.average_rating || content.rating;
    return typeof rating === 'number' ? rating.toFixed(1) : null;
  };

  const getGenres = () => {
    if (content.genres && Array.isArray(content.genres)) {
      if (typeof content.genres[0] === 'object') {
        return content.genres.map(genre => genre.name).slice(0, 3).join(' • ');
      } else {
        return content.genres.slice(0, 3).join(' • ');
      }
    }
    return content.genre || 'Movie';
  };

  // Animation lifecycle
  useEffect(() => {
    setAnimationStage('entering');
    const timer = setTimeout(() => {
      setAnimationStage('entered');
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Auto-play trailer after delay with sound ON
  useEffect(() => {
    if (content?.trailer && animationStage === 'entered') {
      autoPlayTimerRef.current = setTimeout(() => {
        startTrailerPlayback();
      }, 800);

      return () => {
        if (autoPlayTimerRef.current) {
          clearTimeout(autoPlayTimerRef.current);
        }
      };
    }
  }, [content, animationStage]);

  const startTrailerPlayback = async () => {
    if (!content?.trailer || !videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isTrailerMuted;
      videoRef.current.volume = isTrailerMuted ? 0 : 1;
      
      setIsTrailerPlaying(true);
      await videoRef.current.play();
    } catch (error) {
      console.error('Trailer auto-play failed:', error);
      setIsTrailerPlaying(false);
    }
  };

  const stopTrailerPlayback = () => {
    setIsTrailerPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      videoRef.current.volume = newMutedState ? 0 : 1;
      setIsTrailerMuted(newMutedState);
    }
  };

  const handleTrailerEnd = () => {
    setIsTrailerPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    stopTrailerPlayback();
    
    // Close the hover modal first
    onClose?.();
    
    // Navigate to WatchPage with the content ID
    if (content?.id) {
      navigate(`/watch/${content.id}`);
    }
    
    // Also call the original onPlay if provided
    onPlay?.(content);
  };

  const handleAddClick = async (e) => {
    e.stopPropagation();
    
    if (!content?.id) return;
    
    setLoading(prev => ({ ...prev, watchlist: true }));

    try {
      const action = isInList ? 'remove' : 'add';
      const response = await userPreferencesApi.toggleWatchlist(content.id, action);

      if (response.success) {
        const newInListState = !isInList;
        setIsInList(newInListState);
        onAddToList?.(content, newInListState);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    
    if (!content?.id) return;
    
    setLoading(prev => ({ ...prev, like: true }));

    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await userPreferencesApi.toggleLike(content.id, action);

      if (response.success) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    
    // Stop trailer before navigating
    stopTrailerPlayback();
    
    // Close the hover modal first
    onClose?.();
    
    // Use your hook to open the detail page with proper positioning
    openDetailModal(content, {
      left: cardRect?.left || 0,
      top: cardRect?.top || 0,
      width: cardRect?.width || 0,
      height: cardRect?.height || 0
    });
    
    // Also call the original onMoreInfo if provided
    onMoreInfo?.(content, cardRect);
  };

  // Enhanced responsive modal size calculation with viewport safety
  const getModalSize = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate max height based on viewport (leave space for content area)
    const maxHeight = viewportHeight * 0.7; // 70% of viewport height
    
    if (viewportWidth < 640) { // Mobile
      const width = Math.min(280, viewportWidth - 40);
      const imageHeight = Math.min(width * 1.5, maxHeight * 0.7); // 70% for image, 30% for content
      return { width, imageHeight, totalHeight: imageHeight + 140 }; // 140px for content area
    } else if (viewportWidth < 768) { // Tablet
      const width = Math.min(300, viewportWidth - 40);
      const imageHeight = Math.min(width * 1.5, maxHeight * 0.7);
      return { width, imageHeight, totalHeight: imageHeight + 150 };
    } else { // Desktop
      const width = Math.min(320, viewportWidth - 40);
      const imageHeight = Math.min(width * 1.5, maxHeight * 0.7);
      return { width, imageHeight, totalHeight: imageHeight + 160 };
    }
  };

  // Enhanced position calculation to ensure modal stays within viewport
  const getSafePosition = (targetLeft, targetTop, modalWidth, modalHeight) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const safeMargin = 20;

    // Ensure modal doesn't go off the left edge
    let safeLeft = Math.max(safeMargin, targetLeft);
    // Ensure modal doesn't go off the right edge
    safeLeft = Math.min(safeLeft, viewportWidth - modalWidth - safeMargin);
    
    // Ensure modal doesn't go off the top edge
    let safeTop = Math.max(safeMargin, targetTop);
    // Ensure modal doesn't go off the bottom edge
    safeTop = Math.min(safeTop, viewportHeight - modalHeight - safeMargin);

    return { left: safeLeft, top: safeTop };
  };

  // Calculate zoom animation styles with viewport safety
  const getModalStyle = () => {
    if (!cardRect) return { ...position, transform: 'scale(0.8)', opacity: 0 };

    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    const { width: modalWidth, totalHeight: modalHeight } = getModalSize();
    
    // Calculate target position
    const targetLeft = cardCenterX - modalWidth / 2;
    const targetTop = cardCenterY - modalHeight / 2;

    // Get safe position that stays within viewport
    const safePosition = getSafePosition(targetLeft, targetTop, modalWidth, modalHeight);

    if (animationStage === 'entering') {
      return {
        left: cardCenterX - (cardRect.width / 2),
        top: cardCenterY - (cardRect.height / 2),
        width: cardRect.width,
        height: cardRect.height,
        transform: 'scale(1)',
        opacity: 0.7,
        borderRadius: '8px',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
    }

    return {
      left: safePosition.left,
      top: safePosition.top,
      width: modalWidth,
      height: modalHeight,
      transform: 'scale(1)',
      opacity: 1,
      borderRadius: '12px',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    };
  };

  return (
    <div 
      ref={modalRef}
      className="fixed z-50 bg-gray-900 shadow-2xl border border-gray-700 overflow-hidden backdrop-blur-sm"
      style={getModalStyle()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      {/* Only show content when fully entered */}
      <div className={`w-full h-full flex flex-col ${animationStage === 'entering' ? 'opacity-0' : 'opacity-100 transition-opacity duration-200 delay-150'}`}>
        
        {/* Trailer Video or Image - Dynamic height based on modal width */}
        <div 
          className="relative bg-gray-800 overflow-hidden flex-shrink-0"
          style={{ height: getModalSize().imageHeight }}
        >
          {content.trailer ? (
            <>
              {/* Trailer Video */}
              <div className={`absolute inset-0 transition-opacity duration-500 ${
                isTrailerPlaying && trailerLoaded ? 'opacity-100' : 'opacity-0'
              }`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  src={content.trailer.url}
                  muted={isTrailerMuted}
                  onEnded={handleTrailerEnd}
                  onLoadedData={() => setTrailerLoaded(true)}
                  onPlay={() => console.log('🎬 Video play event fired')}
                  playsInline
                  preload="auto"
                />
                
                {/* Mute Toggle - Responsive size */}
                <button
                  onClick={toggleMute}
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 sm:p-2 transition-all duration-200 backdrop-blur-sm transform hover:scale-110"
                  title={isTrailerMuted ? "Unmute" : "Mute"}
                >
                  {isTrailerMuted ? (
                    <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>

                {/* Play Icon Overlay - Only show when video is playing */}
                {isTrailerPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                )}
              </div>

              {/* Fallback Image */}
              <div className={`absolute inset-0 transition-opacity duration-500 ${
                !isTrailerPlaying || !trailerLoaded ? 'opacity-100' : 'opacity-0'
              }`}>
                <img
                  src={content.media_assets?.[0]?.url || '/api/placeholder/320/480'}
                  alt={content.title}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoaded(true)}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-700 animate-pulse" />
                )}

                {/* Play Icon Overlay - Show on image when trailer is available but not playing */}
                {!isTrailerPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm transform hover:scale-110 transition-transform duration-200">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Only Image if no trailer
            <>
              <img
                src={content.media_assets?.[0]?.url || '/api/placeholder/320/480'}
                alt={content.title}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-700 animate-pulse" />
              )}

              {/* Play Icon Overlay - Always show on image when no trailer */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm transform hover:scale-110 transition-transform duration-200">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
              </div>
            </>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 bg-gradient-to-t from-gray-900 to-transparent" />
        </div>

        {/* Content Info - Responsive padding and spacing */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col">
          {/* Primary Actions - Responsive layout */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePlayClick}
                className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-100 text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                Play
              </button>
              <button
                onClick={handleAddClick}
                disabled={loading.watchlist}
                className={`flex items-center justify-center rounded-full p-1.5 sm:p-2 transition-all duration-200 transform hover:scale-110 border ${
                  isInList 
                    ? 'bg-[#BC8BBC] text-white border-[#BC8BBC]' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                } ${loading.watchlist ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isInList ? "Remove from List" : "Add to List"}
              >
                {loading.watchlist ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : isInList ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
              <button
                onClick={handleLikeClick}
                disabled={loading.like}
                className={`flex items-center justify-center rounded-full p-1.5 sm:p-2 transition-all duration-200 transform hover:scale-110 border ${
                  isLiked 
                    ? 'bg-red-500 text-white border-red-500' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600'
                } ${loading.like ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isLiked ? "Unlike" : "Like"}
              >
                {loading.like ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
                )}
              </button>
            </div>
            
            <button
              onClick={handleInfoClick}
              className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded-full p-1.5 sm:p-2 transition-all duration-200 transform hover:scale-110 border border-gray-600"
              title="More Info"
            >
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Metadata Row - Responsive spacing and text */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-300">
              {/* Age Rating */}
              <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-800 text-white rounded border border-gray-700 font-medium text-xs">
                {getAgeRating(content)}
              </div>
              
              {/* Duration */}
              {content.duration_minutes && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{formatDuration(content.duration_minutes)}</span>
                </div>
              )}
            </div>

            {/* Rating */}
            {getRating() && (
              <div className="flex items-center gap-1 text-xs text-gray-300">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                <span>{getRating()}</span>
              </div>
            )}
          </div>

          {/* Genres - Responsive text */}
          <div className="mb-2 sm:mb-3">
            <p className="text-xs text-gray-400 font-medium line-clamp-1">
              {getGenres()}
            </p>
          </div>

          {/* Description - Responsive text and line clamp */}
          {content.short_description && (
            <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed flex-1">
              {typeof content.short_description === 'string' 
                ? content.short_description 
                : 'Description not available'
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HoverModal;