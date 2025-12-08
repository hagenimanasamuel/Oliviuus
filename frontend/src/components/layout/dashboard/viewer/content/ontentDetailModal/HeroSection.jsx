// src/pages/Dashboards/viewer/content/components/HeroSection.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Play, Plus, Share2, Heart, Star, Clock, Calendar, Eye, 
  Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Check, Loader2 
} from 'lucide-react';
import ShareModal from './ShareModal';
import userPreferencesApi from '../../../../../../api/userPreferencesApi';
import { useAuth } from '../../../../../../context/AuthContext';
import { useSubscription } from '../../../../../../context/SubscriptionContext';
import EmailInput from '../../../../../../pages/landing/EmailInput';
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_EMAIL_STATE_SECRET;

const encodeState = (data) => {
  const str = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
};

const HeroSection = ({ contentData, onPlay, onAddToList, onGoBack }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentSubscription } = useSubscription();
  
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
  const [redirecting, setRedirecting] = useState(false);
  const videoRef = useRef(null);
  const contentRef = useRef(null);

  const canAccessContent = user && (currentSubscription || user.role === 'admin');

  useEffect(() => {
    const checkUserPreferences = async () => {
      if (!user || !contentData?.id) return;

      try {
        const response = await userPreferencesApi.getUserContentPreferences(contentData.id);
        if (response.success) {
          setIsLiked(response.data?.isLiked || false);
          setIsInList(response.data?.isInList || false);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };

    checkUserPreferences();
  }, [user, contentData?.id]);

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
    return typeof rating === 'number' ? rating.toFixed(1) : t('contentdetail.metadata.notAvailable', 'N/A');
  };

  const getAgeRating = () => {
    const rating = contentData?.age_rating || "13+";
    const ratingMap = {
      'G': t('contentdetail.ratings.G', 'All Ages'),
      'PG': t('contentdetail.ratings.PG', 'PG'),
      'PG-13': t('contentdetail.ratings.PG13', '13+'),
      'R': t('contentdetail.ratings.R', '18+'),
      'NC-17': t('contentdetail.ratings.NC17', '18+')
    };
    return ratingMap[rating] || rating;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return t('contentdetail.metadata.durationHours', '{{hours}}h {{mins}}m', { hours, mins });
    }
    return t('contentdetail.metadata.durationMinutes', '{{mins}}m', { mins });
  };

  // Auto-play trailer functionality
  const startTrailerPlayback = async () => {
    const trailer = getTrailer();
    if (!trailer || !videoRef.current) return;

    try {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      setIsTrailerMuted(false);
      setIsTrailerPlaying(true);
      await videoRef.current.play();
    } catch (error) {
      console.error('Trailer auto-play failed:', error);
      try {
        videoRef.current.muted = true;
        setIsTrailerMuted(true);
        await videoRef.current.play();
      } catch (mutedError) {
        setIsTrailerPlaying(false);
      }
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlay = () => {
    if (isTrailerPlaying) {
      stopTrailerPlayback();
    }
    
    if (!user) {
      return;
    }
    
    if (!canAccessContent) {
      navigate('/subscription');
      return;
    }
    
    setRedirecting(true);
    
    setTimeout(() => {
      if (contentData?.id) {
        navigate(`/watch/${contentData.id}`);
      }
      onPlay?.(contentData);
    }, 500);
  };

  const handleAddToList = async () => {
    if (!user || !contentData?.id) {
      navigate('/auth');
      return;
    }
    
    setLoading(prev => ({ ...prev, watchlist: true }));
    setError(null);

    try {
      const action = isInList ? 'remove' : 'add';
      const response = await userPreferencesApi.toggleWatchlist(contentData.id, action);

      if (response.success) {
        const newInListState = !isInList;
        setIsInList(newInListState);
        onAddToList?.(contentData, newInListState);
        
        const message = isInList 
          ? t('contentdetail.messages.removedFromList', 'Removed from your list')
          : t('contentdetail.messages.addedToList', 'Added to your list');
        setError(message);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      const errorMessage = isInList 
        ? t('contentdetail.errors.failedToRemove', 'Failed to remove from watchlist')
        : t('contentdetail.errors.failedToAdd', 'Failed to add to watchlist');
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, watchlist: false }));
    }
  };

  const handleLike = async () => {
    if (!user || !contentData?.id) {
      navigate('/auth');
      return;
    }
    
    setLoading(prev => ({ ...prev, like: true }));
    setError(null);

    try {
      const action = isLiked ? 'unlike' : 'like';
      const response = await userPreferencesApi.toggleLike(contentData.id, action);

      if (response.success) {
        setIsLiked(!isLiked);
        
        const message = isLiked 
          ? t('contentdetail.messages.contentUnliked', 'Content unliked')
          : t('contentdetail.messages.contentLiked', 'Content liked');
        setError(message);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      const errorMessage = isLiked 
        ? t('contentdetail.errors.failedToUnlike', 'Failed to unlike content')
        : t('contentdetail.errors.failedToLike', 'Failed to like content');
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  // Handle EmailInput submission - Navigates directly to auth page
  const handleEmailSubmit = (result) => {
    const nextStep = result.isExistingUser ? "password" : "code";

    const stateData = {
      step: nextStep,
      email: result.email,
      isExistingUser: result.isExistingUser
    };

    const hash = encodeState(stateData);
    navigate(`/auth?state=${hash}`);
  };

  // Auto-play trailer on mount
  useEffect(() => {
    const trailer = getTrailer();
    if (trailer && !isTrailerPlaying) {
      const timer = setTimeout(() => {
        startTrailerPlayback();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [contentData?.id]);

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

  const getPlayButtonText = () => {
    if (!user) return t('contentdetail.actions.startNow', 'Start Now');
    if (!canAccessContent) return t('contentdetail.actions.startMembership', 'Start Membership');
    return t('contentdetail.actions.playNow', 'Play Now');
  };

  return (
    <>
      {/* Error/Success Toast */}
      {error && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-60 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg border backdrop-blur-sm ${
            error.includes('Failed') || error.includes('Error') 
              ? 'bg-red-500 text-white border-red-400' 
              : 'bg-green-500 text-white border-green-400'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={contentRef} 
        className={`relative h-screen bg-gray-800 overflow-hidden transition-all duration-500 ${
          redirecting ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Optional Back Button */}
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="absolute top-4 left-4 z-40 bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
            title={t('contentdetail.actions.goBack', 'Go Back')}
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
              autoPlay={true}
              loop={true}
            />

            {/* Video Controls - MOVED TO METADATA ROW */}
            <div className="absolute top-4 left-16 flex gap-2">
              <button
                onClick={toggleMute}
                className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-2 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 shadow-lg"
                title={isTrailerMuted 
                  ? t('contentdetail.actions.unmute', 'Unmute') 
                  : t('contentdetail.actions.mute', 'Mute')
                }
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
                title={t('contentdetail.actions.fullscreen', 'Fullscreen')}
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

            {/* Enhanced Metadata Row with Trailer Button */}
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

              {/* Trailer Control Button - MOVED HERE */}
              {trailer && (
                <button
                  onClick={isTrailerPlaying ? stopTrailerPlayback : startTrailerPlayback}
                  className="flex items-center gap-2 text-white px-4 py-1.5 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 border backdrop-blur-sm border-white/30 bg-white/20"
                >
                  <Play className="w-4 h-4" />
                  {isTrailerPlaying 
                    ? t('contentdetail.actions.stopTrailer', 'Stop Trailer')
                    : t('contentdetail.actions.watchTrailer', 'Watch Trailer')
                  }
                </button>
              )}
            </div>

            {/* Dynamic Section Based on User Status */}
            {user ? (
              /* LOGGED IN USER SECTION */
              <>
                {/* Enhanced Action Buttons for logged-in users */}
                <div className="flex items-center gap-4 flex-wrap mb-6">
                  {/* Main Play Button */}
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
                    {!canAccessContent && <Star className="w-6 h-6 fill-current" />}
                    {canAccessContent && <Play className="w-6 h-6 fill-current" />}
                    {getPlayButtonText()}
                  </button>

                  {/* Additional buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddToList}
                      disabled={loading.watchlist}
                      className={`flex items-center justify-center rounded-xl p-3 transition-all duration-200 transform hover:scale-110 border backdrop-blur-sm group ${
                        isInList 
                          ? 'bg-[#BC8BBC] text-white border-[#BC8BBC]' 
                          : 'text-white border-white/30'
                      } ${loading.watchlist ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isInList 
                        ? t('contentdetail.actions.removeFromList', 'Remove from List') 
                        : t('contentdetail.actions.addToList', 'Add to List')
                      }
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
                      title={isLiked 
                        ? t('contentdetail.actions.unlike', 'Unlike') 
                        : t('contentdetail.actions.like', 'Like')
                      }
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
                      title={t('contentdetail.actions.share', 'Share')}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* NOT LOGGED IN USER SECTION */
              <>
                {/* Text above EmailInput */}
                <div className="mb-6">
                  <p className="text-xl font-semibold text-white mb-2">
                    {t('contentdetail.emailInput.title', 'Ready to watch?')}
                  </p>
                  <p className="text-gray-300 text-lg">
                    {t('contentdetail.emailInput.description', 'Enter your email to create or restart your membership.')}
                  </p>
                </div>

                {/* Email Input */}
                <div className="max-w-2xl mb-8">
                  <EmailInput 
                    onSubmit={handleEmailSubmit}
                    isLoading={false}
                  />
                </div>
              </>
            )}
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