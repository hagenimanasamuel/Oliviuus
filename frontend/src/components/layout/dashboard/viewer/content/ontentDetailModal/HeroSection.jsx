// src/pages/Dashboards/viewer/content/components/HeroSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Plus, Share2, Heart, Star, Clock, Calendar, Eye, 
  Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Check, Loader2 
} from 'lucide-react';
import ShareModal from './ShareModal';
import userPreferencesApi from '../../../../../../api/userPreferencesApi';

const HeroSection = ({ contentData, onPlay, onAddToList, onGoBack }) => {
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isTrailerMuted, setIsTrailerMuted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [trailerLoaded, setTrailerLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState({
    like: false,
    watchlist: false
  });
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  // Check if content is already liked or in list
  useEffect(() => {
    const checkUserPreferences = async () => {
      if (!contentData?.id) return;

      try {
        const response = await userPreferencesApi.getUserContentPreferences(contentData.id);
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
  }, [contentData?.id]);

  const getTrailer = () => {
    return contentData?.trailer || contentData?.media_assets?.find(asset => 
      asset.asset_type === 'trailer' && asset.upload_status === 'completed'
    );
  };

  const getPrimaryImage = () => {
    return contentData?.primary_image_url || 
           contentData?.media_assets?.find(asset => 
             asset.is_primary && (asset.asset_type === 'poster' || asset.asset_type === 'thumbnail')
           )?.url ||
           '/api/placeholder/1200/600';
  };

  const getRating = () => {
    const rating = contentData?.current_rating || contentData?.average_rating || contentData?.rating;
    return typeof rating === 'number' ? rating.toFixed(1) : 'N/A';
  };

  const getAgeRating = () => {
    const rating = contentData?.age_rating || "13+";
    const ratingMap = {
      'G': 'All Ages', 'PG': 'PG', 'PG-13': '13+', 'R': '18+', 'NC-17': '18+'
    };
    return ratingMap[rating] || rating;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const startTrailerPlayback = async () => {
    const trailer = getTrailer();
    if (!trailer || !videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = isTrailerMuted;
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
    e?.stopPropagation();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsTrailerMuted(newMutedState);
    }
  };

  const toggleFullscreen = () => {
    if (!contentRef.current) return;

    if (!document.fullscreenElement) {
      contentRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlay = () => {
    onPlay?.(contentData);
  };

  const handleAddToList = async () => {
    if (!contentData?.id) return;
    
    setLoading(prev => ({ ...prev, watchlist: true }));
    setError(null);

    try {
      const action = isInList ? 'remove' : 'add';
      const response = await userPreferencesApi.toggleWatchlist(contentData.id, action);

      if (response.success) {
        const newInListState = !isInList;
        setIsInList(newInListState);
        onAddToList?.(contentData, newInListState);
        
        // Show success feedback
        console.log(`Successfully ${action === 'add' ? 'added to' : 'removed from'} watchlist`);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      setError(`Failed to ${isInList ? 'remove from' : 'add to'} watchlist`);
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  const handleLike = async () => {
    if (!contentData?.id) return;
    
    setLoading(prev => ({ ...prev, like: true }));
    setError(null);

    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await userPreferencesApi.toggleLike(contentData.id, action);

      if (response.success) {
        setIsLiked(!isLiked);
        console.log(`Successfully ${action}d content`);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setError(`Failed to ${isLiked ? 'unlike' : 'like'} content`);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  // Auto-hide error messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const trailer = getTrailer();
  const primaryImage = getPrimaryImage();

  return (
    <>
      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-60 animate-fade-in">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg border border-red-400 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div ref={contentRef} className="relative h-screen bg-gray-800 overflow-hidden">
        {/* Optional Back Button */}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="absolute top-4 left-4 z-40 bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Trailer Video */}
        {trailer && (
          <div className={`absolute inset-0 transition-all duration-500 ${
            isTrailerPlaying && trailerLoaded ? 'opacity-100' : 'opacity-0'
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

            {/* Video Controls */}
            <div className="absolute top-4 left-16 flex gap-2">
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
        <div className={`absolute inset-0 transition-all duration-500 ${
          !isTrailerPlaying || !trailerLoaded ? 'opacity-100' : 'opacity-0'
        }`}>
          <img
            src={primaryImage}
            alt={contentData?.title}
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
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 drop-shadow-2xl leading-tight">
              {contentData?.title}
            </h1>

            {/* Enhanced Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="font-bold">{getRating()}</span>
                {contentData?.current_rating_count && (
                  <span className="text-gray-300 text-sm ml-1">
                    ({contentData.current_rating_count})
                  </span>
                )}
              </div>

              <div className="px-3 py-1.5 bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-md font-semibold">
                {getAgeRating()}
              </div>

              {contentData?.duration_minutes && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formatDuration(contentData.duration_minutes)}</span>
                </div>
              )}

              {contentData?.release_date && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {new Date(contentData.release_date).getFullYear()}
                  </span>
                </div>
              )}

              {contentData?.view_count && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">
                    {contentData.view_count.toLocaleString()} views
                  </span>
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center gap-4 flex-wrap">
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
                  disabled={loading.watchlist}
                  className={`flex items-center justify-center rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm group ${
                    isInList 
                      ? 'bg-[#BC8BBC] text-white border-[#BC8BBC]' 
                      : 'text-white border-white/30'
                  } ${loading.watchlist ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isInList ? "Remove from List" : "Add to List"}
                >
                  {loading.watchlist ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isInList ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  )}
                </button>

                <button
                  onClick={handleLike}
                  disabled={loading.like}
                  className={`flex items-center justify-center rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm ${
                    isLiked 
                      ? 'bg-red-500 text-white border-red-500' 
                      : 'text-white border-white/30'
                  } ${loading.like ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isLiked ? "Unlike" : "Like"}
                >
                  {loading.like ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center text-white rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm border-white/30"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {trailer && (
                <button
                  onClick={isTrailerPlaying ? stopTrailerPlayback : startTrailerPlayback}
                  className="flex items-center gap-2 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 border backdrop-blur-sm border-white/30"
                >
                  <Play className="w-4 h-4" />
                  {isTrailerPlaying ? 'Stop Trailer' : 'Play Trailer'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          content={contentData}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default HeroSection;