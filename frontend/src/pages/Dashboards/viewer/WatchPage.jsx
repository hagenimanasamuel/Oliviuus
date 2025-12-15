// Enhanced Professional WatchPage.jsx with Security Validation
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, AlertCircle, Shield, Users, Globe, Clock, Lock, User } from 'lucide-react';
import api from '../../../api/axios';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

// Hooks
import { useVideoPlayer } from './WatchPage/hooks/useVideoPlayer';
import { useVideoControls } from './WatchPage/hooks/useVideoControls';
import { useVideoState } from './WatchPage/hooks/useVideoState';
import { useVideoQuality } from './WatchPage/hooks/useVideoQuality';

// Components imports
import VideoPlayer from './WatchPage/components/VideoPlayer/VideoPlayer';
import PlayerControls from './WatchPage/components/PlayerControls/PlayerControls';
import LoadingOverlay from './WatchPage/components/Overlays/LoadingOverlay';
import JumpIndicator from './WatchPage/components/Overlays/JumpIndicator';
import ConnectionIndicator from './WatchPage/components/Overlays/ConnectionIndicator';
import EpisodeSelector from './WatchPage/components/EpisodeSelector/EpisodeSelector';
import EndScreen from './WatchPage/components/EndScreen/EndScreen';

// Device detection
const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/smart-tv|smarttv|googletv|appletv|hbbtv|roku/i.test(userAgent)) return 'smarttv';
  return 'web';
};

// Generate device ID
const generateDeviceId = (deviceType) => {
  const storedId = localStorage.getItem('device_id');
  if (storedId) return storedId;
  
  const newId = `device_${deviceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('device_id', newId);
  return newId;
};

// Security Error Component with Detailed Messages
const SecurityErrorOverlay = ({ error, errorDetails, onRetry }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getErrorIcon = () => {
    switch (errorDetails?.code) {
      case 'SUBSCRIPTION_REQUIRED':
        return <Shield className="w-16 h-16 text-yellow-500 mb-4" />;
      case 'DEVICE_LIMIT_REACHED':
        return <Users className="w-16 h-16 text-orange-500 mb-4" />;
      case 'STREAM_LIMIT_REACHED':
        return <Users className="w-16 h-16 text-red-500 mb-4" />;
      case 'GEO_RESTRICTED':
        return <Globe className="w-16 h-16 text-blue-500 mb-4" />;
      case 'KID_CONTENT_RESTRICTED':
        return <Lock className="w-16 h-16 text-pink-500 mb-4" />;
      case 'TIME_RESTRICTION':
        return <Clock className="w-16 h-16 text-amber-500 mb-4" />;
      case 'FAMILY_ACCESS_RESTRICTED':
        return <Users className="w-16 h-16 text-indigo-500 mb-4" />;
      case 'CONTENT_INVALID':
        return <AlertCircle className="w-16 h-16 text-purple-500 mb-4" />;
      case 'USER_INVALID':
        return <User className="w-16 h-16 text-red-500 mb-4" />;
      case 'CONTENT_RIGHTS_RESTRICTED':
        return <Lock className="w-16 h-16 text-red-500 mb-4" />;
      default:
        return <AlertCircle className="w-16 h-16 text-red-500 mb-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorDetails?.code) {
      case 'SUBSCRIPTION_REQUIRED':
        return t('watch.errors.subscriptionRequired.title', 'Subscription Required');
      case 'DEVICE_LIMIT_REACHED':
        return errorDetails?.details?.is_family_shared
          ? t('watch.errors.deviceLimitReached.familyTitle', 'Family Device Limit Reached')
          : t('watch.errors.deviceLimitReached.title', 'Device Limit Reached');
      case 'STREAM_LIMIT_REACHED':
        return errorDetails?.details?.is_family_shared
          ? t('watch.errors.streamLimitReached.familyTitle', 'Family Stream Limit Reached')
          : t('watch.errors.streamLimitReached.title', 'Stream Limit Reached');
      case 'GEO_RESTRICTED':
        return t('watch.errors.geoRestricted.title', 'Content Not Available');
      case 'KID_CONTENT_RESTRICTED':
        return t('watch.errors.kidContentRestricted.title', 'Content Restricted for Kids');
      case 'TIME_RESTRICTION':
        return t('watch.errors.timeRestriction.title', 'Access Time Restricted');
      case 'FAMILY_ACCESS_RESTRICTED':
        return t('watch.errors.familyAccessRestricted.title', 'Family Access Restricted');
      case 'CONTENT_INVALID':
        return t('watch.errors.contentInvalid.title', 'Content Not Available');
      case 'USER_INVALID':
        return t('watch.errors.userInvalid.title', 'Account Issue');
      case 'CONTENT_RIGHTS_RESTRICTED':
        return t('watch.errors.contentRightsRestricted.title', 'Content Rights Restricted');
      default:
        return t('watch.errors.accessDenied.title', 'Access Denied');
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    // Always show Go Back button
    buttons.push(
      <button
        key="go-back"
        onClick={() => navigate('/')}
        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
      >
        {t('common.actions.goBack', 'Go Back')}
      </button>
    );

    // Show subscription button for subscription errors
    if (errorDetails?.code === 'SUBSCRIPTION_REQUIRED') {
      buttons.push(
        <button
          key="subscription"
          onClick={() => window.location.href = '/account/settings#subscription'}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
        >
          {t('watch.errors.subscriptionRequired.viewPlans', 'View Subscription Plans')}
        </button>
      );
    }

    // Show switch profile button for kid content restrictions
    if (errorDetails?.code === 'KID_CONTENT_RESTRICTED') {
      buttons.push(
        <button
          key="switch-profile"
          onClick={() => window.location.href = '/account/switch-profile'}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
        >
          {t('watch.errors.kidContentRestricted.switchProfile', 'Switch to Parent Profile')}
        </button>
      );
    }

    // Show device management for device limit errors
    if (errorDetails?.code === 'DEVICE_LIMIT_REACHED') {
      buttons.push(
        <button
          key="manage-devices"
          onClick={() => window.location.href = '/account/settings#sessions'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
        >
          {errorDetails?.details?.is_family_shared
            ? t('watch.errors.deviceLimitReached.viewFamilySessions', 'View Family Sessions')
            : t('watch.errors.deviceLimitReached.manageSessions', 'Manage Active Sessions')}
        </button>
      );
    }

    // Show retry button for most errors
    if (errorDetails?.code !== 'USER_INVALID' && errorDetails?.code !== 'CONTENT_INVALID') {
      buttons.push(
        <button
          key="retry"
          onClick={onRetry}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
        >
          {t('common.actions.tryAgain', 'Try Again')}
        </button>
      );
    }

    return buttons;
  };

  const getErrorDetails = () => {
    if (!errorDetails?.details) return null;

    const details = errorDetails.details;
    
    // Show limits for device/stream limit errors
    if ((errorDetails.code === 'DEVICE_LIMIT_REACHED' || errorDetails.code === 'STREAM_LIMIT_REACHED') && details.limits) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border-l-4 border-yellow-500">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">{t('watch.errors.limits.active', 'Active')}</p>
              <p className="text-white text-xl font-bold">{details.limits.active}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">{t('watch.errors.limits.maximum', 'Maximum')}</p>
              <p className="text-white text-xl font-bold">{details.limits.maximum}</p>
            </div>
          </div>
        </div>
      );
    }

    // Show time restrictions
    if (errorDetails.code === 'TIME_RESTRICTION' && (details.sleep_time_start || details.allowed_access_start)) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border-l-4 border-amber-500">
          {details.sleep_time_start && (
            <p className="text-gray-300 text-sm mb-2">
              {t('watch.errors.timeRestriction.sleepTime', 'Sleep Time')}: {details.sleep_time_start} - {details.sleep_time_end}
            </p>
          )}
          {details.allowed_access_start && (
            <p className="text-gray-300 text-sm">
              {t('watch.errors.timeRestriction.accessTime', 'Access Time')}: {details.allowed_access_start} - {details.allowed_access_end}
            </p>
          )}
        </div>
      );
    }

    // Show generic details
    if (typeof details === 'string' || details.error) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border-l-4 border-gray-500">
          <p className="text-gray-300 text-sm">{typeof details === 'string' ? details : details.error}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-6">
      <div className="text-center max-w-md w-full animate-fadeIn">
        {getErrorIcon()}
        
        <h3 className="text-white text-2xl font-bold mb-3">
          {getErrorTitle()}
        </h3>
        
        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
          {error || t('watch.errors.default.description', 'You do not have permission to access this content.')}
        </p>

        {getErrorDetails()}

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
          {getActionButtons()}
        </div>

        <div className="mt-8 text-sm text-gray-400 space-y-2">
          <p className="leading-relaxed">
            {errorDetails?.code === 'SUBSCRIPTION_REQUIRED' 
              ? t('watch.errors.subscriptionRequired.help', 'Choose from our flexible subscription plans or join a family plan to start watching unlimited content.')
              : errorDetails?.code === 'DEVICE_LIMIT_REACHED'
              ? t('watch.errors.deviceLimitReached.help', 'Manage your active sessions in account settings to free up device slots. Sessions automatically expire after 30 minutes of inactivity.')
              : t('watch.errors.default.help', 'If this problem persists, please contact our support team for assistance.')}
          </p>
        </div>
      </div>
    </div>
  );
};

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const { t } = useTranslation();

  // Content state
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [similarContent, setSimilarContent] = useState([]);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
  const [securityValidation, setSecurityValidation] = useState(null);

  // Security state
  const [securityValidated, setSecurityValidated] = useState(false);
  const [securityError, setSecurityError] = useState(null);

  // Watch tracking state
  const [watchSessionId, setWatchSessionId] = useState(null);
  const [viewRecorded, setViewRecorded] = useState(false);

  // Get episode ID from URL
  const episodeId = searchParams.get('ep');

  // SEO Metadata
  const pageTitle = useMemo(() => {
    if (content) {
      return `${content.title} - Streaming Platform`;
    }
    return t('watch.defaultTitle', 'Watch Video - Streaming Platform');
  }, [content, t]);

  // Generate session ID for watch tracking
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Step 1: Security Validation - Check if user can access this content
  const validateSecurity = useCallback(async () => {
    try {
      setLoading(true);
      setSecurityError(null);
      setErrorDetails(null);
      setSecurityValidation(null);

      console.log('🔒 Starting security validation for content:', id);

      const deviceType = detectDeviceType();
      const deviceId = generateDeviceId(deviceType);

      // Call security validation endpoint
      const validationResponse = await api.post('/security/validate-stream', {
        contentId: id,
        deviceId,
        deviceType
      });

      console.log('🔒 Security validation response:', validationResponse.data);

      if (validationResponse.data.success && validationResponse.data.valid) {
        console.log('✅ Security validation passed');
        setSecurityValidation(validationResponse.data);
        setSecurityValidated(true);
        return true;
      } else {
        setSecurityError(validationResponse.data.message || 'Access denied');
        setErrorDetails({
          code: validationResponse.data.code,
          details: validationResponse.data.details
        });
        setSecurityValidated(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Security validation failed:', error);
      
      if (error.response?.status === 403) {
        setSecurityError(error.response.data.message || 'Access denied');
        setErrorDetails({
          code: error.response.data.code,
          details: error.response.data.details
        });
      } else if (error.response?.status === 401) {
        setSecurityError('Please log in to access this content');
        setErrorDetails({
          code: 'AUTH_REQUIRED',
          details: 'Your session may have expired. Please log in again.'
        });
      } else if (error.response?.status === 404) {
        setSecurityError('Content not found');
        setErrorDetails({
          code: 'CONTENT_NOT_FOUND',
          details: 'The requested content could not be found.'
        });
      } else if (error.message.includes('Network')) {
        setSecurityError('Network error. Please check your internet connection.');
        setErrorDetails({
          code: 'NETWORK_ERROR',
          details: 'Unable to connect to the server.'
        });
      } else {
        setSecurityError('Security validation failed. Please try again.');
        setErrorDetails({
          code: 'VALIDATION_ERROR',
          details: error.message
        });
      }
      
      setSecurityValidated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Step 2: Fetch Content - Only if security validation passes
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 Fetching content for ID:', id);

      const response = await api.get(`/viewer/content/${id}`);
      
      console.log('📥 Content fetch response:', response.data);

      if (response.data.success) {
        const contentData = response.data.data;
        setContent(contentData);
        
        // Handle series content
        if (contentData.content_type === 'series') {
          // If episodeId is provided in URL, use it
          if (episodeId) {
            const episode = contentData.media_assets?.find(
              asset => (asset.id === episodeId || asset._id === episodeId) && 
                      asset.asset_type === 'episodeVideo'
            );
            if (episode) {
              setCurrentEpisode(episode);
            } else {
              // Fallback to first episode
              const firstEpisode = contentData.media_assets?.find(
                asset => asset.asset_type === 'episodeVideo'
              );
              if (firstEpisode) {
                setCurrentEpisode(firstEpisode);
              }
            }
          } else {
            // Get first episode
            const firstEpisode = contentData.media_assets?.find(
              asset => asset.asset_type === 'episodeVideo'
            );
            if (firstEpisode) {
              setCurrentEpisode(firstEpisode);
            }
          }
        }
        
        console.log('✅ Content loaded successfully');
      } else {
        throw new Error(response.data.error || 'Failed to load content');
      }
    } catch (error) {
      console.error('❌ Error fetching content:', error);
      setError(error.response?.data?.error || 'Unable to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, episodeId]);

  // Step 3: Load everything - Security first, then content
  useEffect(() => {
    const loadContent = async () => {
      console.log('🚀 Starting content load process');
      const isSecure = await validateSecurity();
      if (isSecure) {
        await fetchContent();
      }
    };
    
    loadContent();
  }, [validateSecurity, fetchContent]);

  // Video source based on content
  const videoSource = useMemo(() => {
    if (!content || securityError) return null;

    if (currentEpisode) {
      return currentEpisode.url || currentEpisode.episode_video_url;
    }

    const mainVideo = content.media_assets?.find(
      asset => asset.asset_type === 'mainVideo' && asset.upload_status === 'completed'
    );

    return mainVideo?.url || content.media_assets?.find(
      asset => asset.upload_status === 'completed'
    )?.url || null;
  }, [content, currentEpisode, securityError]);

  // Initialize video player hooks only if we have a video source
  const {
    videoRef,
    duration,
    currentTime,
    isPlaying,
    isLoading,
    isBuffering,
    isSeeking,
    buffered,
    setCurrentTime,
    setIsPlaying,
    videoEvents
  } = useVideoPlayer(videoSource, currentEpisode?.id || id, setAutoPlayAttempted);

  const {
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
    setVolume,
    toggleFullscreen
  } = useVideoControls(videoRef, isPlaying, currentTime, duration);

  const {
    volume,
    isMuted,
    isFullscreen,
    showControls,
    showSettings,
    playbackRate,
    quality,
    jumpIndicator,
    showVolumeSlider,
    timeDisplayMode,
    consecutiveSkips,
    showConnectionMessage,
    isOnline,
    handleVolumeChange,
    handleSkip,
    toggleMute,
    changePlaybackRate,
    changeQuality,
    toggleFullscreenMode,
    showControlsTemporarily,
    setShowSettings,
    setShowVolumeSlider,
    setTimeDisplayMode,
    setShowControls
  } = useVideoState(videoRef, containerRef, toggleFullscreen);

  // Secure watch tracking - silent failure
  const trackWatchProgress = useCallback(async () => {
    if (viewRecorded || !videoRef.current || !content || currentTime < 2 || isSeeking || securityError) return;

    try {
      const sessionId = watchSessionId || generateSessionId();
      if (!watchSessionId) {
        setWatchSessionId(sessionId);
      }

      const response = await api.post(`/viewer/content/${id}/view`, {
        watch_duration_seconds: 5,
        percentage_watched: (currentTime / duration) * 100,
        device_type: 'web',
        session_id: sessionId
      });

      if (response.data.success && currentTime >= 5) {
        setViewRecorded(true);
      }
    } catch (error) {
      // Silent fail for tracking - don't show errors to user
      console.log('⚠️ Tracking failed (non-critical):', error.message);
    }
  }, [currentTime, duration, content, id, watchSessionId, viewRecorded, isSeeking, videoRef, securityError, generateSessionId]);

  // Watch tracking interval
  useEffect(() => {
    if (viewRecorded || !isPlaying || !content || duration === 0 || securityError) return;

    const progressInterval = setInterval(() => {
      if (!viewRecorded) {
        trackWatchProgress();
      }
    }, 5000);

    return () => clearInterval(progressInterval);
  }, [currentTime, isPlaying, content, duration, trackWatchProgress, viewRecorded, securityError]);

  // Load playback position from localStorage
  useEffect(() => {
    if (!content || !videoRef.current || securityError) return;

    const savedTime = localStorage.getItem(`video-progress-${currentEpisode?.id || id}`);
    if (savedTime) {
      const time = parseFloat(savedTime);
      if (time > 0 && time < (duration - 30)) {
        setCurrentTime(time);
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      }
    }
  }, [content, currentEpisode, id, videoRef, setCurrentTime, duration, securityError]);

  // Save playback position
  useEffect(() => {
    if (!content || !videoRef.current || currentTime < 5 || isSeeking || securityError) return;

    const saveProgress = () => {
      localStorage.setItem(`video-progress-${currentEpisode?.id || id}`, currentTime.toString());
    };

    const timer = setTimeout(saveProgress, 2000);
    return () => clearTimeout(timer);
  }, [currentTime, content, currentEpisode, id, isSeeking, videoRef, securityError]);

  // Handle episode selection
  const handleEpisodeSelect = useCallback((episode) => {
    if (securityError) {
      console.warn('⚠️ Episode selection blocked due to security error');
      return;
    }

    setShowEndScreen(false);
    setWatchSessionId(null);
    setViewRecorded(false);

    setIsLoadingNext(true);
    setCurrentEpisode(episode);
    setIsPlaying(false);
    setCurrentTime(0);
    setAutoPlayAttempted(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;

      setTimeout(() => {
        setIsLoadingNext(false);

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsPlaying(true);
              setAutoPlayAttempted(true);
            }).catch(error => {
              console.log('Auto-play failed:', error);
              setAutoPlayAttempted(true);
            });
          }
        }, 500);
      }, 300);
    }
  }, [setIsPlaying, setCurrentTime, videoRef, setAutoPlayAttempted, securityError]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    if (securityError) return;

    // Save that video was completed
    localStorage.setItem(`video-completed-${currentEpisode?.id || id}`, 'true');
    
    // Clear progress for completed video
    localStorage.removeItem(`video-progress-${currentEpisode?.id || id}`);

    // Track final view
    if (!viewRecorded && duration > 0 && currentTime >= duration * 0.9) {
      trackWatchProgress().catch(err => {
        console.log('Final tracking failed:', err.message);
      });
    }

    setShowEndScreen(true);
  }, [content, currentEpisode, id, duration, currentTime, trackWatchProgress, viewRecorded, securityError]);

  // Add video ended event listener
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && !securityError) {
      videoElement.addEventListener('ended', handleVideoEnded);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('ended', handleVideoEnded);
      }
    };
  }, [handleVideoEnded, videoRef, securityError]);

  // Replay handler
  const handleReplay = useCallback(() => {
    setShowEndScreen(false);
    setCurrentTime(0);
    setViewRecorded(false);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  }, [setCurrentTime, videoRef]);

  // Auto-play after load
  useEffect(() => {
    if (content && videoRef.current && !isPlaying && !autoPlayAttempted && !securityError) {
      const attemptAutoPlay = () => {
        if (videoRef.current && videoRef.current.readyState >= 3) {
          videoRef.current.play().then(() => {
            setAutoPlayAttempted(true);
          }).catch(error => {
            console.log('Auto-play failed on load:', error);
            setAutoPlayAttempted(true);
          });
        }
      };

      if (videoRef.current.readyState >= 3) {
        attemptAutoPlay();
      } else {
        const handleCanPlay = () => {
          attemptAutoPlay();
          videoRef.current.removeEventListener('canplay', handleCanPlay);
        };
        videoRef.current.addEventListener('canplay', handleCanPlay);

        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('canplay', handleCanPlay);
          }
        };
      }
    }
  }, [content, isPlaying, autoPlayAttempted, videoRef, setAutoPlayAttempted, securityError]);

  // Retry function
  const handleRetry = useCallback(() => {
    setSecurityError(null);
    setErrorDetails(null);
    setError(null);
    setSecurityValidated(false);
    setSecurityValidation(null);
    validateSecurity();
  }, [validateSecurity]);

  // Show security error overlay
  if (securityError) {
    return (
      <>
        <Helmet>
          <title>Access Error - Streaming Platform</title>
        </Helmet>
        <SecurityErrorOverlay
          error={securityError}
          errorDetails={errorDetails}
          onRetry={handleRetry}
        />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading... - Streaming Platform</title>
        </Helmet>
        <LoadingOverlay 
          type="initial"
          message="Checking access permissions..."
        />
      </>
    );
  }

  if (error && !securityError) {
    return (
      <>
        <Helmet>
          <title>Playback Error - Streaming Platform</title>
        </Helmet>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center max-w-md animate-fadeIn">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              {t('watch.errors.playbackTitle', 'Playback Error')}
            </h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              >
                {t('common.actions.goBack', 'Go Back')}
              </button>
              <button
                onClick={handleRetry}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              >
                {t('common.actions.tryAgain', 'Try Again')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!content) {
    return (
      <>
        <Helmet>
          <title>Content Not Found - Streaming Platform</title>
        </Helmet>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-white text-xl animate-pulse">
            {t('watch.errors.contentNotFound', 'Content not found')}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={content.description || content.short_description} />
        {content.meta_title && <meta property="og:title" content={content.meta_title} />}
        {content.meta_description && <meta property="og:description" content={content.meta_description} />}
        {content.primary_image_url && <meta property="og:image" content={content.primary_image_url} />}
      </Helmet>

      <div className="min-h-screen bg-black relative">
        {/* Header */}
        <div
          className={`absolute top-0 left-0 right-0 z-50 p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
          onMouseEnter={showControlsTemporarily}
          onMouseMove={showControlsTemporarily}
        >
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-purple-300 transition-all duration-200 group bg-black/40 hover:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold hidden sm:inline">
                {t('common.actions.close', 'Close')}
              </span>
            </button>

            <div className="flex-1 text-center px-4 overflow-hidden">
              <h1 className="text-white font-semibold text-sm md:text-lg truncate">
                {content.title}
              </h1>
              {currentEpisode && (
                <p className="text-gray-400 text-xs md:text-sm truncate">
                  {currentEpisode.title || `Episode ${currentEpisode.episode_number}`}
                </p>
              )}
            </div>

            <EpisodeSelector
              content={content}
              currentEpisode={currentEpisode}
              onEpisodeSelect={handleEpisodeSelect}
              currentTime={currentTime}
              duration={duration}
              similarContent={similarContent}
              showControlsTemporarily={showControlsTemporarily}
            />
          </div>
        </div>

        {/* Connection Indicator */}
        <ConnectionIndicator
          showConnectionMessage={showConnectionMessage}
          isOnline={isOnline}
        />

        {/* Video Player Container */}
        <div
          ref={containerRef}
          className="video-container relative w-full h-screen bg-black overflow-hidden"
          onMouseMove={showControlsTemporarily}
          onMouseLeave={() => {
            if (isPlaying) {
              setTimeout(() => {
                setShowControls(false);
                setShowVolumeSlider(false);
              }, 1000);
            }
          }}
        >
          <VideoPlayer
            videoSource={videoSource}
            videoRef={videoRef}
            videoEvents={videoEvents}
            isPlaying={isPlaying}
            autoPlayAttempted={autoPlayAttempted}
            onTogglePlay={togglePlay}
          />

          {/* Loading Overlay */}
          {(isLoading || isBuffering || isLoadingNext) && (
            <div className="animate-fadeIn">
              <LoadingOverlay
                isLoading={isLoading || isLoadingNext}
                isBuffering={isBuffering}
                message={isLoadingNext ? t('watch.loading.nextEpisode', 'Loading next episode...') : undefined}
              />
            </div>
          )}

          <JumpIndicator
            jumpIndicator={jumpIndicator}
            consecutiveSkips={consecutiveSkips}
          />

          {/* End Screen */}
          {showEndScreen && (
            <div className="animate-fadeIn">
              <EndScreen
                content={content}
                currentEpisode={currentEpisode}
                episodes={content.seasons?.[0]?.episodes || []}
                onReplay={handleReplay}
                onNextEpisode={handleEpisodeSelect}
                similarContent={similarContent}
                isSeries={content.content_type === 'series'}
              />
            </div>
          )}

          {/* Player Controls */}
          {!showEndScreen && (
            <PlayerControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isMuted={isMuted}
              isFullscreen={isFullscreen}
              showControls={showControls}
              showSettings={showSettings}
              showVolumeSlider={showVolumeSlider}
              playbackRate={playbackRate}
              quality={quality}
              timeDisplayMode={timeDisplayMode}
              buffered={buffered}
              videoSource={videoSource}
              videoRef={videoRef}
              onTogglePlay={togglePlay}
              onSeek={seek}
              onSkip={handleSkip}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
              onToggleFullscreen={toggleFullscreenMode}
              onPlaybackRateChange={changePlaybackRate}
              onQualityChange={changeQuality}
              onTimeDisplayToggle={() => setTimeDisplayMode(timeDisplayMode === 'elapsed' ? 'remaining' : 'elapsed')}
              onShowSettings={setShowSettings}
              onShowVolumeSlider={setShowVolumeSlider}
              containerRef={containerRef}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default WatchPage;