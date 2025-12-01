// Enhanced Professional WatchPage.jsx with Advanced Security & Custom Right-Click
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ChevronLeft, AlertCircle, Shield, Users, Globe, Copy, Link, Download, Share } from 'lucide-react';
import api from '../../../api/axios';

// Hooks
import { useVideoPlayer } from './WatchPage/hooks/useVideoPlayer';
import { useVideoControls } from './WatchPage/hooks/useVideoControls';
import { useVideoState } from './WatchPage/hooks/useVideoState';
import { useVideoQuality } from './WatchPage/hooks/useVideoQuality';

// Components
import VideoPlayer from './WatchPage/components/VideoPlayer/VideoPlayer';
import PlayerControls from './WatchPage/components/PlayerControls/PlayerControls';
import LoadingOverlay from './WatchPage/components/Overlays/LoadingOverlay';
import JumpIndicator from './WatchPage/components/Overlays/JumpIndicator';
import ConnectionIndicator from './WatchPage/components/Overlays/ConnectionIndicator';
import EpisodeSelector from './WatchPage/components/EpisodeSelector/EpisodeSelector';
import EndScreen from './WatchPage/components/EndScreen/EndScreen';

// Enhanced device detection with download manager detection
const detectDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for mobile devices
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Check for tablet devices
  const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);

  // Check for smart TV
  const isSmartTV = /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|boxee|kylo|roku|dlnadoc|ce-html|philipstv|inettvbrowser|browser|crkey|web0s|webos|viera|pov_tv|pov_tv|pov_tv/i.test(userAgent);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (isSmartTV) return 'smarttv';
  return 'web';
};

// Advanced download manager detection
const detectDownloadManager = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const plugins = Array.from(navigator.plugins || []);
  const mimeTypes = Array.from(navigator.mimeTypes || []);
  
  // Common download manager signatures
  const downloadManagerPatterns = [
    /idm|internet download manager/i,
    /fdm|free download manager/i,
    /jdownloader/i,
    /eagleget/i,
    /orbit downloader/i,
    /flashget/i,
    /net transport/i,
    /download accelerator/i,
    /getright/i,
    /reget/i,
    /leechget/i,
    /mass downloader/i,
    /star downloader/i,
    /ant download manager/i
  ];

  // Check user agent
  const hasDownloadManagerUA = downloadManagerPatterns.some(pattern => 
    pattern.test(userAgent)
  );

  // Check plugins for download managers
  const hasDownloadManagerPlugin = plugins.some(plugin => 
    downloadManagerPatterns.some(pattern => pattern.test(plugin.name || ''))
  );

  // Check mime types
  const hasDownloadManagerMime = mimeTypes.some(mimeType => 
    downloadManagerPatterns.some(pattern => pattern.test(mimeType.type || ''))
  );

  return hasDownloadManagerUA || hasDownloadManagerPlugin || hasDownloadManagerMime;
};

// Enhanced Security Error Component with Professional Messaging
const SecurityErrorOverlay = ({ error, onBack, onRetry, errorDetails }) => {
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const previousPath = window.history.state?.usr?.from;
      if (previousPath && previousPath.startsWith('/watch/')) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  }, [countdown, navigate]);

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
      case 'PLAN_RESTRICTION':
        return <Shield className="w-16 h-16 text-purple-500 mb-4" />;
      case 'FAMILY_ACCESS_RESTRICTED':
        return <Users className="w-16 h-16 text-indigo-500 mb-4" />;
      case 'TIME_RESTRICTION':
        return <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />;
      default:
        return <AlertCircle className="w-16 h-16 text-red-500 mb-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorDetails?.code) {
      case 'SUBSCRIPTION_REQUIRED':
        return 'Subscription Required';
      case 'DEVICE_LIMIT_REACHED':
        return errorDetails?.isFamilyShared ? 'Family Device Limit Reached' : 'Device Limit Reached';
      case 'STREAM_LIMIT_REACHED':
        return errorDetails?.isFamilyShared ? 'Family Stream Limit Reached' : 'Stream Limit Reached';
      case 'GEO_RESTRICTED':
        return 'Content Not Available';
      case 'PLAN_RESTRICTION':
        return 'Plan Restriction';
      case 'FAMILY_ACCESS_RESTRICTED':
        return 'Family Access Restricted';
      case 'TIME_RESTRICTION':
        return 'Access Time Restricted';
      default:
        return 'Access Denied';
    }
  };

  const getErrorDescription = () => {
    return error || 'You do not have permission to access this content.';
  };

  const getActionButtons = () => {
    switch (errorDetails?.code) {
      case 'SUBSCRIPTION_REQUIRED':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/account/settings#subscription'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              View Subscription Plans
            </button>
            <button
              onClick={() => window.location.href = '/family'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Join Family Plan
            </button>
          </div>
        );

      case 'DEVICE_LIMIT_REACHED':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/account/settings#sessions'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              {errorDetails?.isFamilyShared ? 'View Family Sessions' : 'Manage Active Sessions'}
            </button>
            <button
              onClick={onRetry}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Try Again
            </button>
          </div>
        );

      case 'STREAM_LIMIT_REACHED':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onRetry}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              {errorDetails?.isFamilyShared ? 'Ask Family to Close Streams' : 'I\'ve Closed Other Streams'}
            </button>
          </div>
        );

      case 'PLAN_RESTRICTION':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/account/settings#subscription'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Upgrade Plan
            </button>
          </div>
        );

      case 'FAMILY_ACCESS_RESTRICTED':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/family'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Manage Family Settings
            </button>
            <button
              onClick={() => window.location.href = '/account/settings#subscription'}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Get Personal Plan
            </button>
          </div>
        );

      case 'TIME_RESTRICTION':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/family#settings'}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              View Time Settings
            </button>
            <button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Try Again Later
            </button>
          </div>
        );

      case 'GEO_RESTRICTED':
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onRetry}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105 w-full sm:w-auto text-center"
            >
              Try Again
            </button>
          </div>
        );
    }
  };

  const getHelpText = () => {
    switch (errorDetails?.code) {
      case 'DEVICE_LIMIT_REACHED':
        return errorDetails?.isFamilyShared
          ? 'The family plan has reached its device limit. Ask the family owner to manage active sessions or upgrade the plan.'
          : 'Manage your active sessions in account settings to free up device slots. Sessions automatically expire after 30 minutes of inactivity.';

      case 'STREAM_LIMIT_REACHED':
        return errorDetails?.isFamilyShared
          ? 'Your family has reached the maximum number of simultaneous streams. Ask family members to close other video players.'
          : 'Close video players on other devices or browser tabs to free up stream slots.';

      case 'SUBSCRIPTION_REQUIRED':
        return 'Choose from our flexible subscription plans or join a family plan to start watching unlimited content.';

      case 'PLAN_RESTRICTION':
        return 'Upgrade to a premium plan to watch on all your favorite devices without restrictions.';

      case 'FAMILY_ACCESS_RESTRICTED':
        return 'Your family access has been restricted. This could be due to suspension, expired family plan, or access time restrictions.';

      case 'TIME_RESTRICTION':
        return 'Your access is restricted during these hours due to family settings. Please try again during allowed access times.';

      case 'GEO_RESTRICTED':
        return 'This content is only available in specific regions due to licensing restrictions.';

      default:
        return 'If this problem persists, please contact our support team for assistance.';
    }
  };

  const getAdditionalInfo = () => {
    if (errorDetails?.additionalInfo) {
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border-l-4 border-gray-500">
          <p className="text-gray-300 text-sm">{errorDetails.additionalInfo}</p>
        </div>
      );
    }

    if (errorDetails?.details && errorDetails.code !== 'DEVICE_LIMIT_REACHED' && errorDetails.code !== 'STREAM_LIMIT_REACHED') {
      return (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border-l-4 border-gray-500">
          <p className="text-gray-300 text-sm">{errorDetails.details}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full animate-fadeIn">
        {getErrorIcon()}
        <h3 className="text-white text-2xl font-bold mb-3">{getErrorTitle()}</h3>
        <p className="text-gray-300 text-lg mb-6 leading-relaxed">{getErrorDescription()}</p>

        {getAdditionalInfo()}

        <div className="mb-8">
          {getActionButtons()}
        </div>

        <div className="mt-8 text-sm text-gray-400 space-y-2">
          <p className="leading-relaxed">{getHelpText()}</p>
          <div className="pt-4 border-t border-gray-700/50">
            <p className="text-purple-400 font-medium">
              Redirecting back in {countdown} seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
      className="fixed bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-2xl z-1000 py-2 min-w-[200px] animate-fadeIn"
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

// ExternalLink icon component
const ExternalLink = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// Check icon component
const Check = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef(null);
  const videoContainerRef = useRef(null);

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

  // Security state
  const [securityChecked, setSecurityChecked] = useState(false);
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

  // Generate unique session ID for watch tracking
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Enhanced content fetch with advanced security and download manager detection
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSecurityError(null);
      setErrorDetails(null);

      // Detect download manager
      const downloadManagerDetected = detectDownloadManager();
      setHasDownloadManager(downloadManagerDetected);

      if (downloadManagerDetected) {
        console.warn('⚠️ Download manager detected - applying enhanced security measures');
      }

      // Add device info to headers
      const deviceType = detectDeviceType();
      const deviceId = localStorage.getItem('device_id') || `device_${deviceType}_${Date.now()}`;

      // Save device ID for future requests
      localStorage.setItem('device_id', deviceId);

      const config = {
        headers: {
          'x-device-id': deviceId,
          'x-device-type': deviceType,
          'x-screen-width': window.screen.width,
          'x-screen-height': window.screen.height,
          'x-has-download-manager': downloadManagerDetected.toString(),
          'x-security-level': 'enhanced'
        }
      };

      // Fetch content with enhanced security
      const response = await api.get(`/viewer/content/${id}`, config);

      if (response.data.success) {
        setContent(response.data.data);

        // Enhanced security context handling
        if (response.data.security) {
          console.log('🔒 Enhanced security context applied');
        }

        setSecurityChecked(true);
      } else {
        throw new Error('Failed to load content');
      }
    } catch (err) {
      // Enhanced error handling with specific messages
      if (err.response?.status === 403) {
        const errorData = err.response.data;
        setSecurityError(errorData?.error || 'Access denied');
        setErrorDetails({
          code: errorData?.code || 'ACCESS_DENIED',
          details: errorData?.details || err.message
        });
        setSecurityChecked(true);
      } else if (err.response?.status === 404) {
        setError('Content not found. It may have been removed or is unavailable.');
      } else if (err.response?.status === 401) {
        setSecurityError('Please log in to access this content.');
        setErrorDetails({
          code: 'AUTH_REQUIRED',
          details: 'Your session may have expired. Please log in again.'
        });
      } else {
        setError('Unable to load this content. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

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

    if (!securityError) {
      const cleanup = protectFromDownloadManagers();
      return cleanup;
    }
  }, [securityError]);

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

  // Fetch content with security check
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Check if content is series
  const isSeries = useMemo(() => {
    return content?.media_assets?.some(asset =>
      asset.asset_type === 'episodeVideo'
    );
  }, [content]);

  // Get all episodes
  const episodes = useMemo(() => {
    return content?.media_assets?.filter(asset =>
      asset.asset_type === 'episodeVideo'
    ) || [];
  }, [content]);

  // Get first unwatched episode
  const getFirstUnwatchedEpisode = useCallback((episodesList) => {
    for (let episode of episodesList) {
      const epId = episode.id || episode._id;
      const savedTime = localStorage.getItem(`video-player-time-${epId}`);
      const episodeDuration = episode.duration || 0;

      if (!savedTime || parseFloat(savedTime) < episodeDuration * 0.9) {
        return episode;
      }
    }
    return episodesList[0] || null;
  }, []);

  // Get next episode
  const getNextEpisode = useCallback((currentEp) => {
    if (!episodes.length) return null;
    const currentIndex = episodes.findIndex(ep =>
      ep.id === currentEp?.id || ep._id === currentEp?._id
    );
    return episodes[currentIndex + 1] || null;
  }, [episodes]);

  // Video source with enhanced security
  const videoSource = useMemo(() => {
    if (!content || securityError) return null;

    if (currentEpisode) {
      return currentEpisode.url;
    }

    const mainVideo = content.media_assets?.find(
      asset => asset.asset_type === 'mainVideo' && asset.upload_status === 'completed'
    );

    return mainVideo?.url || content.media_assets?.find(
      asset => asset.upload_status === 'completed'
    )?.url || null;
  }, [content, currentEpisode, securityError]);

  // Video player hooks - only initialize if security passed
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

  // Enhanced watch tracking with security validation
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
    }
  }, [currentTime, duration, content, id, watchSessionId, lastTrackedTime, viewRecorded, totalWatchTime, isSeeking, generateSessionId, videoRef, securityError]);

  // Watch tracking interval - only if security passed
  useEffect(() => {
    if (viewRecorded || !isPlaying || !content || duration === 0 || securityError) return;

    const progressInterval = setInterval(() => {
      if (!viewRecorded) {
        trackWatchProgress();
      }
    }, 5000);

    return () => {
      clearInterval(progressInterval);
    };
  }, [currentTime, isPlaying, content, duration, trackWatchProgress, viewRecorded, securityError]);

  // Load playback position - only if security passed
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
        // Silent fail for position loading
      }
    };

    if (!securityError) {
      loadPlaybackPosition();
    }
  }, [content, currentEpisode, id, videoRef, setCurrentTime, securityError]);

  // Reset tracking when content changes
  useEffect(() => {
    setWatchSessionId(null);
    setLastTrackedTime(0);
    setViewRecorded(false);
    setTotalWatchTime(0);
  }, [id, episodeId]);

  // Enhanced episode selection with proper URL update
  const handleEpisodeSelect = useCallback((episode) => {
    if (securityError) return;

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

  // Episode selection logic with URL management
  useEffect(() => {
    if (!content || !isSeries || episodeId || securityError) return;

    let targetEpisode = null;
    targetEpisode = getFirstUnwatchedEpisode(episodes);

    if (!targetEpisode && episodes.length > 0) {
      targetEpisode = episodes[0];
    }

    if (targetEpisode) {
      const shouldUpdateEpisode = !currentEpisode || currentEpisode.id !== targetEpisode.id;
      const shouldUpdateURL = !episodeId || episodeId !== (targetEpisode.id || targetEpisode._id);

      if (shouldUpdateEpisode) {
        setCurrentEpisode(targetEpisode);
      }

      if (shouldUpdateURL && !episodeId) {
        const epId = targetEpisode.id || targetEpisode._id;
        setSearchParams({ ep: epId });
      }

      if (!episodeAutoPlayed && shouldUpdateEpisode) {
        setEpisodeAutoPlayed(true);
      }
    }
  }, [content, episodeId, episodes, isSeries, currentEpisode, setSearchParams, getFirstUnwatchedEpisode, episodeAutoPlayed, securityError]);

  // Handle episodeId from URL
  useEffect(() => {
    if (!content || !isSeries || !episodeId || securityError) return;

    const episodeFromUrl = episodes.find(ep =>
      ep.id === episodeId || ep._id === episodeId
    );

    if (episodeFromUrl && (!currentEpisode || currentEpisode.id !== episodeFromUrl.id)) {
      setCurrentEpisode(episodeFromUrl);

      if (!episodeAutoPlayed) {
        setEpisodeAutoPlayed(true);
      }
    }
  }, [content, episodeId, episodes, isSeries, currentEpisode, episodeAutoPlayed, securityError]);

  // Fetch similar content - only if security passed
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

  // Video ended handler
  const handleVideoEnded = useCallback(() => {
    if (securityError) return;

    if (duration > 0 && currentTime >= duration * 0.9) {
      trackWatchProgress();
    }

    if (isSeries && currentEpisode) {
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
  }, [isSeries, currentEpisode, getNextEpisode, handleEpisodeSelect, duration, currentTime, trackWatchProgress, securityError]);

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
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  }, [setCurrentTime, videoRef]);

  // Auto-play first episode - ONLY when no episodeId in URL
  useEffect(() => {
    if (isSeries && currentEpisode && !isPlaying && !autoPlayAttempted && videoRef.current && !episodeId && !securityError) {
      const attemptAutoPlay = () => {
        if (videoRef.current && videoRef.current.readyState >= 3) {
          videoRef.current.play().then(() => {
            setAutoPlayAttempted(true);
          }).catch(error => {
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
  }, [isSeries, currentEpisode, isPlaying, autoPlayAttempted, videoRef, setAutoPlayAttempted, episodeId, securityError]);

  // Hide end screen when URL changes
  useEffect(() => {
    setShowEndScreen(false);
  }, [id, episodeId]);

  // Load best quality - only if security passed
  useEffect(() => {
    const loadOptimalQuality = async () => {
      if (videoSource && videoRef.current && loadBestAvailableQuality && !securityError) {
        try {
          const bestQualityUrl = await loadBestAvailableQuality(videoSource);
          if (videoRef.current && bestQualityUrl !== videoRef.current.src) {
            videoRef.current.src = bestQualityUrl;
          }
        } catch (error) {
          // Silent fail for quality loading
        }
      }
    };

    loadOptimalQuality();
  }, [videoSource, loadBestAvailableQuality, securityError]);

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

  // Retry function for security errors
  const handleRetry = useCallback(() => {
    setSecurityError(null);
    setErrorDetails(null);
    setError(null);
    fetchContent();
  }, [fetchContent]);

  // Keyboard shortcuts - only if security passed
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
          if (isSeries && currentEpisode) {
            const nextEpisode = getNextEpisode(currentEpisode);
            if (nextEpisode) handleEpisodeSelect(nextEpisode);
          }
          break;
        case 'p':
          e.preventDefault();
          if (isSeries && currentEpisode) {
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
    setShowSettings, isSeries, currentEpisode, episodes, getNextEpisode, handleEpisodeSelect, securityError
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
    if (isSeries && currentEpisode) {
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
      <SecurityErrorOverlay
        error={securityError}
        errorDetails={errorDetails}
        onRetry={handleRetry}
      />
    );
  }

  if (loading) {
    return <LoadingOverlay type="initial" />;
  }

  if (error && !securityError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md animate-fadeIn">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Playback Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleBackClick}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Go Back
            </button>
            <button
              onClick={handleRetry}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Content not found</div>
      </div>
    );
  }

  return (
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
            <span className="font-semibold hidden sm:inline">Close</span>
          </button>

          {/* Center - Current title */}
          <div className="flex-1 text-center px-4 overflow-hidden">
            <h1 className="text-white font-semibold text-sm md:text-lg truncate animate-fadeIn">
              {getCurrentTitle()}
            </h1>
            {isSeries && content?.title && (
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
          isSeries={isSeries}
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
              message={isLoadingNext ? "Loading next episode..." : undefined}
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
              isSeries={isSeries}
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
  );
};

export default WatchPage;