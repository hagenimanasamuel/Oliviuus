// Enhanced Professional WatchPage.jsx with Advanced Security & All Functionalities
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ChevronLeft, AlertCircle, Shield, Users, Globe, Copy, Link, Download, Share, ExternalLink, Check } from 'lucide-react';
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

// Enhanced device detection
const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/smart-tv|smarttv|googletv|appletv|hbbtv|roku/i.test(userAgent)) return 'smarttv';
  return 'web';
};

// Advanced download manager detection
const detectDownloadManager = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const plugins = Array.from(navigator.plugins || []);
  
  const downloadManagerPatterns = [
    /idm|internet download manager/i,
    /fdm|free download manager/i,
    /jdownloader/i,
    /eagleget/i,
    /orbit downloader/i,
    /flashget/i,
    /net transport/i,
    /download accelerator/i
  ];

  const hasDownloadManagerUA = downloadManagerPatterns.some(pattern => 
    pattern.test(userAgent)
  );

  const hasDownloadManagerPlugin = plugins.some(plugin => 
    downloadManagerPatterns.some(pattern => pattern.test(plugin.name || ''))
  );

  return hasDownloadManagerUA || hasDownloadManagerPlugin;
};

// Generate device ID
const generateDeviceId = (deviceType) => {
  const storedId = localStorage.getItem('device_id');
  if (storedId) return storedId;
  
  const newId = `device_${deviceType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('device_id', newId);
  return newId;
};

// Enhanced Custom Right Click Menu Component
const CustomRightClickMenu = ({ 
  position, 
  onClose, 
  content, 
  currentEpisode, 
  currentTime,
  isSeries 
}) => {
  const menuRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleCopyLink = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    }
  };

  const handleCopyTimestamp = async () => {
    const timestampUrl = `${window.location.href}&t=${Math.floor(currentTime)}`;
    try {
      await navigator.clipboard.writeText(timestampUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = timestampUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title || 'Video',
          url: window.location.href,
        });
        onClose();
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const menuItems = [
    {
      label: copied ? 'Copied!' : 'Copy Video Link',
      icon: copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />,
      onClick: handleCopyLink,
      disabled: false
    },
    {
      label: 'Copy Link with Timestamp',
      icon: <Link className="w-4 h-4" />,
      onClick: handleCopyTimestamp,
      disabled: currentTime === 0
    },
    {
      label: 'Share Video',
      icon: <Share className="w-4 h-4" />,
      onClick: handleShare,
      disabled: false
    },
    {
      label: 'Open in New Tab',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => {
        window.open(window.location.href, '_blank');
        onClose();
      },
      disabled: false
    }
  ];

  // Adjust position to keep menu within viewport
  const adjustedPosition = useMemo(() => {
    const menuWidth = 240;
    const menuHeight = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    return { x, y };
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-2xl z-50 py-2 min-w-[200px] animate-fadeIn"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.onClick}
          disabled={item.disabled}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
            item.disabled
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-gray-200 hover:bg-purple-600/50 hover:text-white'
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
      
      {/* Security Notice */}
      <div className="border-t border-gray-700/50 mt-2 pt-2 px-4">
        <p className="text-xs text-gray-400 text-center">
          Protected Content
        </p>
      </div>
    </div>
  );
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
        return <AlertCircle className="w-16 h-16 text-pink-500 mb-4" />;
      case 'TIME_RESTRICTION':
        return <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />;
      case 'FAMILY_ACCESS_RESTRICTED':
        return <Users className="w-16 h-16 text-indigo-500 mb-4" />;
      case 'CONTENT_INVALID':
        return <AlertCircle className="w-16 h-16 text-purple-500 mb-4" />;
      case 'USER_INVALID':
        return <AlertCircle className="w-16 h-16 text-red-500 mb-4" />;
      case 'CONTENT_RIGHTS_RESTRICTED':
        return <AlertCircle className="w-16 h-16 text-red-500 mb-4" />;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef(null);
  const videoContainerRef = useRef(null);
  const { t } = useTranslation();

  // Content state
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [episodeAutoPlayed, setEpisodeAutoPlayed] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [similarContent, setSimilarContent] = useState([]);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
  const [securityValidation, setSecurityValidation] = useState(null);

  // Security state
  const [securityValidated, setSecurityValidated] = useState(false);
  const [securityError, setSecurityError] = useState(null);
  const [hasDownloadManager, setHasDownloadManager] = useState(false);

  // Custom right click menu state
  const [rightClickMenu, setRightClickMenu] = useState({
    show: false,
    position: { x: 0, y: 0 }
  });

  // Watch tracking state
  const [watchSessionId, setWatchSessionId] = useState(null);
  const [lastTrackedTime, setLastTrackedTime] = useState(0);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [totalWatchTime, setTotalWatchTime] = useState(0);

  // Advanced settings state
  const [isPipActive, setIsPipActive] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [volumeBoost, setVolumeBoost] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [videoFilters, setVideoFilters] = useState('');

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

  // Step 1: Security Validation with enhanced security
  const validateSecurity = useCallback(async () => {
    try {
      setLoading(true);
      setSecurityError(null);
      setErrorDetails(null);
      setSecurityValidation(null);

      console.log('🔒 Starting enhanced security validation for content:', id);

      // Detect download manager
      const downloadManagerDetected = detectDownloadManager();
      setHasDownloadManager(downloadManagerDetected);

      const deviceType = detectDeviceType();
      const deviceId = generateDeviceId(deviceType);

      // Call enhanced security validation endpoint
      const validationResponse = await api.post('/security/validate-stream', {
        contentId: id,
        deviceId,
        deviceType,
        hasDownloadManager: downloadManagerDetected,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        securityLevel: 'enhanced'
      });

      console.log('🔒 Enhanced security validation response:', validationResponse.data);

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

      const deviceType = detectDeviceType();
      const deviceId = generateDeviceId(deviceType);
      const downloadManagerDetected = detectDownloadManager();

      const config = {
        headers: {
          'x-device-id': deviceId,
          'x-device-type': deviceType,
          'x-has-download-manager': downloadManagerDetected.toString(),
          'x-security-level': 'enhanced'
        }
      };

      const response = await api.get(`/viewer/content/${id}`, config);
      
      console.log('📥 Content fetch response:', response.data);

      if (response.data.success) {
        const contentData = response.data.data;
        setContent(contentData);
        
        // Check if content is series
        const isSeriesContent = contentData.content_type === 'series';
        
        // Handle series content
        if (isSeriesContent) {
          const episodes = contentData.media_assets?.filter(asset => 
            asset.asset_type === 'episodeVideo'
          ) || [];

          // If episodeId is provided in URL, use it
          if (episodeId) {
            const episode = episodes.find(
              asset => (asset.id === episodeId || asset._id === episodeId)
            );
            if (episode) {
              setCurrentEpisode(episode);
            } else {
              // Fallback to first episode
              const firstEpisode = episodes[0];
              if (firstEpisode) {
                setCurrentEpisode(firstEpisode);
              }
            }
          } else {
            // Get first unwatched episode
            const firstUnwatched = getFirstUnwatchedEpisode(episodes);
            if (firstUnwatched) {
              setCurrentEpisode(firstUnwatched);
              // Update URL with episode ID
              const epId = firstUnwatched.id || firstUnwatched._id;
              if (epId) {
                setSearchParams({ ep: epId });
              }
            } else if (episodes.length > 0) {
              // Fallback to first episode
              setCurrentEpisode(episodes[0]);
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
  }, [id, episodeId, setSearchParams]);

  // Get first unwatched episode
  const getFirstUnwatchedEpisode = useCallback((episodesList) => {
    for (let episode of episodesList) {
      const epId = episode.id || episode._id;
      const savedTime = localStorage.getItem(`video-progress-${epId}`);
      const episodeDuration = episode.duration || 0;

      if (!savedTime || parseFloat(savedTime) < episodeDuration * 0.9) {
        return episode;
      }
    }
    return episodesList[0] || null;
  }, []);

  // Get next episode
  const getNextEpisode = useCallback((currentEp) => {
    if (!content || content.content_type !== 'series') return null;
    
    const episodes = content.media_assets?.filter(asset => 
      asset.asset_type === 'episodeVideo'
    ) || [];
    
    if (!currentEp || episodes.length === 0) return null;
    
    const currentIndex = episodes.findIndex(ep =>
      ep.id === currentEp?.id || ep._id === currentEp?._id
    );
    return episodes[currentIndex + 1] || null;
  }, [content]);

  // Get all episodes
  const episodes = useMemo(() => {
    if (!content || content.content_type !== 'series') return [];
    return content.media_assets?.filter(asset => 
      asset.asset_type === 'episodeVideo'
    ) || [];
  }, [content]);

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
    quality,
    availableQualities,
    currentCDN,
    networkSpeed,
    cdnStatus,
    isSwitchingQuality,
    loadBestAvailableQuality,
    generateVideoUrl
  } = useVideoQuality(videoRef, currentEpisode?.id || id);

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
    quality: stateQuality,
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
    changeQuality: changeStateQuality,
    toggleFullscreenMode,
    showControlsTemporarily,
    setShowSettings,
    setShowVolumeSlider,
    setTimeDisplayMode,
    setShowControls
  } = useVideoState(videoRef, containerRef, toggleFullscreen);

  // Advanced download manager protection
  useEffect(() => {
    const protectFromDownloadManagers = () => {
      // Block common download manager techniques
      const blockContextMenu = (e) => {
        if (e.target.closest('video') || e.target.closest('.video-container')) {
          e.preventDefault();
          return false;
        }
      };

      // Block keyboard shortcuts used by download managers
      const blockKeyboardShortcuts = (e) => {
        const downloadManagerShortcuts = [
          'Alt+Shift+Click',
          'Ctrl+Alt+Click',
          'Ctrl+Shift+Click'
        ];

        if ((e.altKey && e.shiftKey) || (e.ctrlKey && e.altKey)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      // Prevent video element right-click
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        video.addEventListener('contextmenu', (e) => e.preventDefault());
        video.setAttribute('controlsList', 'nodownload noremoteplayback noplaybackrate');
      });

      document.addEventListener('contextmenu', blockContextMenu);
      document.addEventListener('keydown', blockKeyboardShortcuts);

      return () => {
        document.removeEventListener('contextmenu', blockContextMenu);
        document.removeEventListener('keydown', blockKeyboardShortcuts);
      };
    };

    if (!securityError && hasDownloadManager) {
      const cleanup = protectFromDownloadManagers();
      return cleanup;
    }
  }, [securityError, hasDownloadManager]);

  // Enhanced custom right-click handler
  const handleContextMenu = useCallback((e) => {
    // Only show custom menu on video container and related elements
    const isVideoArea = e.target.closest('.video-container') || 
                       e.target.closest('video') || 
                       e.target.closest('.player-controls');

    if (isVideoArea) {
      e.preventDefault();
      e.stopPropagation();

      setRightClickMenu({
        show: true,
        position: { x: e.clientX, y: e.clientY }
      });
    }
  }, []);

  const closeRightClickMenu = useCallback(() => {
    setRightClickMenu({ show: false, position: { x: 0, y: 0 } });
  }, []);

  // Add context menu event listener
  useEffect(() => {
    if (!securityError) {
      document.addEventListener('contextmenu', handleContextMenu);
      return () => document.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [handleContextMenu, securityError]);

  // Secure watch tracking with security validation
  const trackWatchProgress = useCallback(async () => {
    if (viewRecorded || !videoRef.current || !content || currentTime < 2 || isSeeking || securityError) return;

    const timeDiff = Math.abs(currentTime - lastTrackedTime);
    if (timeDiff < 5) return;

    try {
      const sessionId = watchSessionId || generateSessionId();
      if (!watchSessionId) {
        setWatchSessionId(sessionId);
      }

      const watchDuration = timeDiff >= 5 ? Math.floor(timeDiff) : 5;
      const newTotalWatchTime = totalWatchTime + watchDuration;

      const response = await api.post(`/viewer/content/${id}/view`, {
        watch_duration_seconds: watchDuration,
        percentage_watched: (currentTime / duration) * 100,
        device_type: 'web',
        session_id: sessionId,
        security_level: 'enhanced'
      });

      if (response.data.success) {
        setLastTrackedTime(currentTime);
        setTotalWatchTime(newTotalWatchTime);

        if (!viewRecorded && currentTime >= 5) {
          setViewRecorded(true);
        }
      }
    } catch (error) {
      // If we get a security error during tracking, show security message
      if (error.response?.status === 403) {
        setSecurityError(error.response.data?.error || 'Access denied during playback');
        setErrorDetails({
          code: error.response.data?.code || 'ACCESS_DENIED',
          details: error.response.data?.details || 'Your access was revoked during playback'
        });
      }
      console.log('⚠️ Tracking failed (non-critical):', error.message);
    }
  }, [currentTime, duration, content, id, watchSessionId, lastTrackedTime, viewRecorded, totalWatchTime, isSeeking, generateSessionId, videoRef, securityError]);

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

  // Load playback position from server
  useEffect(() => {
    const loadPlaybackPosition = async () => {
      if (!content || !videoRef.current || securityError) return;

      try {
        const mediaAssetId = currentEpisode?.id || null;
        const response = await api.get(`/watch/content/${id}/position?episodeId=${mediaAssetId || ''}`);

        if (response.data.success && response.data.data.currentTime > 0) {
          const { currentTime: savedTime, duration: savedDuration } = response.data.data;

          if (savedTime >= 5 && savedTime < (savedDuration - 30)) {
            setCurrentTime(savedTime);
            if (videoRef.current) {
              videoRef.current.currentTime = savedTime;
            }
          }
        }
      } catch (error) {
        // Fallback to localStorage
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
      }
    };

    if (!securityError) {
      loadPlaybackPosition();
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

  // Handle episode selection with URL update
  const handleEpisodeSelect = useCallback((episode) => {
    if (securityError) {
      console.warn('⚠️ Episode selection blocked due to security error');
      return;
    }

    setShowEndScreen(false);
    setWatchSessionId(null);
    setLastTrackedTime(0);
    setViewRecorded(false);
    setTotalWatchTime(0);

    setIsLoadingNext(true);
    setCurrentEpisode(episode);
    setIsPlaying(false);
    setCurrentTime(0);
    setAutoPlayAttempted(false);

    const episodeId = episode.id || episode._id;
    if (episodeId) {
      setSearchParams({ ep: episodeId });
    }

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
  }, [setIsPlaying, setCurrentTime, setSearchParams, videoRef, setAutoPlayAttempted, securityError]);

  // Navigate to next content
  const handleNextContent = useCallback((nextContent) => {
    setShowEndScreen(false);
    setTimeout(() => {
      navigate(`/watch/${nextContent.id}`);
    }, 300);
  }, [navigate]);

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

    if (content.content_type === 'series' && currentEpisode) {
      const nextEpisode = getNextEpisode(currentEpisode);
      if (nextEpisode) {
        setIsLoadingNext(true);
        setTimeout(() => {
          handleEpisodeSelect(nextEpisode);
        }, 3000);
      } else {
        setShowEndScreen(true);
      }
    } else {
      setShowEndScreen(true);
    }
  }, [content, currentEpisode, id, duration, currentTime, trackWatchProgress, viewRecorded, securityError, getNextEpisode, handleEpisodeSelect]);

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

  // Auto-play after load - ONLY when no episodeId in URL
  useEffect(() => {
    if (content?.content_type === 'series' && currentEpisode && !isPlaying && !autoPlayAttempted && videoRef.current && !episodeId && !securityError) {
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
  }, [content, currentEpisode, isPlaying, autoPlayAttempted, videoRef, setAutoPlayAttempted, episodeId, securityError]);

  // Fetch similar content
  useEffect(() => {
    const fetchSimilarContent = async () => {
      if (!content || securityError) return;

      try {
        const endpoints = [
          `/viewer/content/similar/${content.id}?limit=6`,
          `/viewer/content/related/${content.id}?limit=6`,
          `/viewer/content/recommended?content_id=${content.id}&limit=6`
        ];

        let similarData = [];

        for (const endpoint of endpoints) {
          try {
            const response = await api.get(endpoint);
            if (response.data?.success && response.data.data) {
              similarData = response.data.data;
              break;
            }
          } catch (endpointError) {
            continue;
          }
        }

        if (similarData.length === 0) {
          const fallbackResponse = await api.get('/viewer/content', {
            params: {
              limit: 6,
              sort: 'recent',
              type: content.content_type
            }
          });

          if (fallbackResponse.data?.success && fallbackResponse.data.data?.contents) {
            similarData = fallbackResponse.data.data.contents.filter(item =>
              item.id !== content.id
            );
          }
        }

        setSimilarContent(similarData);

      } catch (error) {
        setSimilarContent([]);
      }
    };

    if (!securityError) {
      fetchSimilarContent();
    }
  }, [content, securityError]);

  // Hide end screen when URL changes
  useEffect(() => {
    setShowEndScreen(false);
  }, [id, episodeId]);

  // Sync quality
  useEffect(() => {
    if (quality && changeStateQuality && quality !== stateQuality && !securityError) {
      changeStateQuality(quality);
    }
  }, [quality, stateQuality, changeStateQuality, securityError]);

  // Quality change handler
  const handleQualityChange = useCallback(async (newQuality) => {
    if (securityError) return;

    if (changeStateQuality) {
      changeStateQuality(newQuality);
    }
  }, [changeStateQuality, securityError]);

  // Picture-in-Picture
  const handleTogglePip = useCallback(async () => {
    if (securityError) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (error) {
      // Silent fail for PiP
    }
  }, [videoRef, securityError]);

  // Sleep timer
  const handleSleepTimer = useCallback((minutes) => {
    if (securityError) return;

    if (sleepTimer) {
      clearTimeout(sleepTimer);
      setSleepTimer(null);
    }

    if (minutes > 0) {
      const timer = setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimer(null);
      }, minutes * 60 * 1000);

      setSleepTimer(timer);
    }
  }, [sleepTimer, videoRef, setIsPlaying, securityError]);

  // Volume boost
  const handleVolumeBoost = useCallback((boostLevel) => {
    if (securityError) return;

    setVolumeBoost(boostLevel);
    if (videoRef.current) {
      const boostedVolume = Math.min(3, Math.max(1, boostLevel));
      videoRef.current.volume = Math.min(1, volume * boostedVolume);
    }
  }, [volume, videoRef, securityError]);

  // Video enhancements
  const handleBrightnessChange = useCallback((brightnessValue) => {
    if (securityError) return;

    setBrightness(brightnessValue);
    updateVideoFilters();
  }, [securityError]);

  const handleContrastChange = useCallback((contrastValue) => {
    if (securityError) return;

    setContrast(contrastValue);
    updateVideoFilters();
  }, [securityError]);

  const handleSaturationChange = useCallback((saturationValue) => {
    if (securityError) return;

    setSaturation(saturationValue);
    updateVideoFilters();
  }, [securityError]);

  const updateVideoFilters = useCallback(() => {
    const filters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    setVideoFilters(filters);

    if (videoRef.current) {
      videoRef.current.style.filter = filters;
    }
  }, [brightness, contrast, saturation, videoRef]);

  useEffect(() => {
    if (!securityError) {
      updateVideoFilters();
    }
  }, [updateVideoFilters, securityError]);

  // Smart back button handler
  const handleBackClick = useCallback(() => {
    const previousPath = window.history.state?.usr?.from;

    if (previousPath && previousPath.startsWith('/watch/')) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Retry function
  const handleRetry = useCallback(() => {
    setSecurityError(null);
    setErrorDetails(null);
    setError(null);
    setSecurityValidated(false);
    setSecurityValidation(null);
    validateSecurity();
  }, [validateSecurity]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current || showSettings || securityError) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreenMode();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkip(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkip(5);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case ',':
        case '<':
          e.preventDefault();
          changePlaybackRate(Math.max(0.25, playbackRate - 0.25));
          break;
        case '.':
        case '>':
          e.preventDefault();
          changePlaybackRate(Math.min(2, playbackRate + 0.25));
          break;
        case 's':
          e.preventDefault();
          setShowSettings(!showSettings);
          break;
        case 'n':
          e.preventDefault();
          if (content?.content_type === 'series' && currentEpisode) {
            const nextEpisode = getNextEpisode(currentEpisode);
            if (nextEpisode) handleEpisodeSelect(nextEpisode);
          }
          break;
        case 'p':
          e.preventDefault();
          if (content?.content_type === 'series' && currentEpisode) {
            const currentIndex = episodes.findIndex(ep =>
              ep.id === currentEpisode?.id || ep._id === currentEpisode?._id
            );
            const prevEpisode = episodes[currentIndex - 1];
            if (prevEpisode) handleEpisodeSelect(prevEpisode);
          }
          break;
        default:
          break;
      }
    };

    if (!securityError) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [
    videoRef, showSettings, togglePlay, toggleFullscreenMode, toggleMute,
    handleSkip, handleVolumeChange, volume, changePlaybackRate, playbackRate,
    setShowSettings, content, currentEpisode, episodes, getNextEpisode, handleEpisodeSelect, securityError
  ]);

  // Clean up sleep timer
  useEffect(() => {
    return () => {
      if (sleepTimer) {
        clearTimeout(sleepTimer);
      }
    };
  }, [sleepTimer]);

  // Handle PiP events
  useEffect(() => {
    const handlePipEnter = () => setIsPipActive(true);
    const handlePipLeave = () => setIsPipActive(false);

    if (videoRef.current && !securityError) {
      videoRef.current.addEventListener('enterpictureinpicture', handlePipEnter);
      videoRef.current.addEventListener('leavepictureinpicture', handlePipLeave);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('enterpictureinpicture', handlePipEnter);
        videoRef.current.removeEventListener('leavepictureinpicture', handlePipLeave);
      }
    };
  }, [videoRef, securityError]);

  // Reset filters on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.style.filter = '';
      }
    };
  }, [videoRef]);

  // Get current title for header
  const getCurrentTitle = () => {
    if (content?.content_type === 'series' && currentEpisode) {
      const episodeNum = currentEpisode.episode_number || '';
      const seasonNum = currentEpisode.season_number || '';
      const episodeTitle = currentEpisode.title || currentEpisode.file_name || '';

      if (seasonNum && episodeNum) {
        return `S${seasonNum}:E${episodeNum} - ${episodeTitle}`;
      } else if (episodeNum) {
        return `Episode ${episodeNum} - ${episodeTitle}`;
      }
      return episodeTitle;
    }
    return content?.title || 'Now Playing';
  };

  // Show security error overlay if there's a security error
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
                onClick={handleBackClick}
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
        {/* Enhanced Header with current title */}
        <div
          className={`absolute top-0 left-0 right-0 z-50 p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/60 to-transparent transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
          onMouseEnter={showControlsTemporarily}
          onMouseMove={showControlsTemporarily}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Close/Back button */}
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-white hover:text-purple-300 transition-all duration-200 group bg-black/40 hover:bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold hidden sm:inline">
                {t('common.actions.close', 'Close')}
              </span>
            </button>

            {/* Center - Current title */}
            <div className="flex-1 text-center px-4 overflow-hidden">
              <h1 className="text-white font-semibold text-sm md:text-lg truncate animate-fadeIn">
                {getCurrentTitle()}
              </h1>
              {content?.content_type === 'series' && content?.title && (
                <p className="text-gray-400 text-xs md:text-sm truncate">
                  {content.title}
                </p>
              )}
            </div>

            {/* Right side - Episode selector */}
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

        {/* Custom Right Click Menu */}
        {rightClickMenu.show && (
          <CustomRightClickMenu
            position={rightClickMenu.position}
            onClose={closeRightClickMenu}
            content={content}
            currentEpisode={currentEpisode}
            currentTime={currentTime}
            isSeries={content.content_type === 'series'}
          />
        )}

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
            videoFilters={videoFilters}
          />

          {/* Enhanced Loading Overlay with smooth transitions */}
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

          {/* End Screen with smooth transition */}
          {showEndScreen && (
            <div className="animate-fadeIn">
              <EndScreen
                content={content}
                currentEpisode={currentEpisode}
                episodes={episodes}
                onReplay={handleReplay}
                onNextEpisode={handleEpisodeSelect}
                onNextContent={handleNextContent}
                similarContent={similarContent}
                isSeries={content.content_type === 'series'}
              />
            </div>
          )}

          {!showEndScreen && (
            <PlayerControls
              // Basic player props
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

              // Basic control functions
              onTogglePlay={togglePlay}
              onSeek={seek}
              onSkip={handleSkip}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
              onToggleFullscreen={toggleFullscreenMode}
              onPlaybackRateChange={changePlaybackRate}
              onQualityChange={handleQualityChange}
              onTimeDisplayToggle={() => setTimeDisplayMode(timeDisplayMode === 'elapsed' ? 'remaining' : 'elapsed')}
              onShowSettings={setShowSettings}
              onShowVolumeSlider={setShowVolumeSlider}
              containerRef={containerRef}

              // Settings Panel advanced functions
              onTogglePip={handleTogglePip}
              onToggleSleepTimer={handleSleepTimer}
              onVolumeBoost={handleVolumeBoost}
              onBrightnessChange={handleBrightnessChange}
              onContrastChange={handleContrastChange}
              onSaturationChange={handleSaturationChange}
            />
          )}
        </div>

        {/* Global Styles for animations */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }

          .animate-slideIn {
            animation: slideIn 0.3s ease-out;
          }

          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          /* Smooth scrollbar for episode list */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(147, 51, 234, 0.5);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(147, 51, 234, 0.8);
          }
        `}</style>
      </div>
    </>
  );
};

export default WatchPage;