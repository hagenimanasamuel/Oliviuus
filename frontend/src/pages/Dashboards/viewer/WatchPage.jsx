// src/pages/Dashboards/viewer/WatchPage.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Settings,
  Clock,
  Monitor,
  Download,
  Cast,
  Airplay,
  PictureInPicture,
  Captions,
  Zap,
  Gauge,
  RotateCw,
  Sparkles,
  Eye,
  EyeOff,
  FastForward,
  Rewind,
  SkipBack,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import api from '../../../api/axios';

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [timeDisplayMode, setTimeDisplayMode] = useState('elapsed');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [buffered, setBuffered] = useState([]);
  const [seekPreview, setSeekPreview] = useState({
    show: false,
    time: 0,
    position: 0,
    image: null,
    loading: false
  });
  const [jumpIndicator, setJumpIndicator] = useState({ show: false, direction: '', time: 0 });
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Internet connection states
  const [isOnline, setIsOnline] = useState(true);
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);

  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const settingsRef = useRef(null);
  const skipTimerRef = useRef(null);
  const connectionMessageRef = useRef(null);
  const previewImageRef = useRef(null);
  const previewTimeoutRef = useRef(null);
  const volumeHideTimerRef = useRef(null);
  const saveSettingsTimeoutRef = useRef(null);
  const bufferingTimeoutRef = useRef(null);

  // Fetch content data
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/viewer/content/${id}`);

        if (response.data.success) {
          setContent(response.data.data);
        } else {
          throw new Error('Failed to load content');
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Unable to load this content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  // Get the main video URL
  const videoSource = useMemo(() => {
    if (!content) return null;

    const mainVideo = content.media_assets?.find(
      asset => asset.asset_type === 'mainVideo' && asset.upload_status === 'completed'
    );

    return mainVideo?.url || content.media_assets?.find(
      asset => asset.upload_status === 'completed'
    )?.url || null;
  }, [content]);

  // Initialize preview video and canvas
  useEffect(() => {
    if (!videoSource) return;

    const previewVideo = document.createElement("video");
    previewVideo.src = videoSource;
    previewVideo.crossOrigin = "anonymous";
    previewVideo.muted = true;
    previewVideo.preload = "auto";
    previewVideo.style.display = "none";

    document.body.appendChild(previewVideo);
    previewVideoRef.current = previewVideo;

    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 135;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    return () => {
      if (previewVideo) document.body.removeChild(previewVideo);
      if (canvas) document.body.removeChild(canvas);
    };
  }, [videoSource]);

  // Load settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('video-player-volume');
    const savedPlaybackRate = localStorage.getItem('video-player-playbackRate');
    const savedTime = localStorage.getItem(`video-player-time-${id}`);
    const savedMuted = localStorage.getItem('video-player-muted');

    if (savedVolume) {
      const volumeValue = parseFloat(savedVolume);
      setVolume(volumeValue);
    }

    if (savedPlaybackRate) {
      const rateValue = parseFloat(savedPlaybackRate);
      setPlaybackRate(rateValue);
    }

    if (savedMuted) {
      setIsMuted(savedMuted === 'true');
    }

    if (savedTime) {
      const timeValue = parseFloat(savedTime);
      setCurrentTime(timeValue);
    }
  }, [id]);

  // Apply settings to video when loaded
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackRate;
      
      if (currentTime > 0) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [videoRef.current, volume, isMuted, playbackRate, currentTime]);

  // Save settings to localStorage with debouncing
  const saveSettings = useCallback((key, value) => {
    if (saveSettingsTimeoutRef.current) {
      clearTimeout(saveSettingsTimeoutRef.current);
    }
    
    saveSettingsTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(key, value.toString());
    }, 500);
  }, []);

  // Save volume changes
  useEffect(() => {
    saveSettings('video-player-volume', volume);
  }, [volume, saveSettings]);

  // Save playback rate changes
  useEffect(() => {
    saveSettings('video-player-playbackRate', playbackRate);
  }, [playbackRate, saveSettings]);

  // Save mute state changes
  useEffect(() => {
    saveSettings('video-player-muted', isMuted);
  }, [isMuted, saveSettings]);

  // Save current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && duration > 0 && currentTime > 0) {
        localStorage.setItem(`video-player-time-${id}`, currentTime.toString());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, currentTime, duration]);

  // Auto-play when video is ready
  useEffect(() => {
    if (videoRef.current && !isPlaying && !autoPlayAttempted) {
      const attemptAutoPlay = async () => {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          setAutoPlayAttempted(true);
        } catch (error) {
          console.log('Auto-play was prevented:', error);
          setAutoPlayAttempted(true);
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
      }
    }
  }, [videoSource, isPlaying, autoPlayAttempted]);

  // Internet connection detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowConnectionMessage(true);
      setTimeout(() => setShowConnectionMessage(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowConnectionMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.playbackRate = playbackRate;
      
      // Apply saved time if exists
      const savedTime = localStorage.getItem(`video-player-time-${id}`);
      if (savedTime) {
        const time = parseFloat(savedTime);
        if (time < videoRef.current.duration) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
      updateBufferedProgress();
    }
  };

  // Improved buffered progress calculation
  const updateBufferedProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedRanges = [];
      for (let i = 0; i < videoRef.current.buffered.length; i++) {
        bufferedRanges.push({
          start: videoRef.current.buffered.start(i),
          end: videoRef.current.buffered.end(i)
        });
      }
      setBuffered(bufferedRanges);
    }
  }, []);

  const handleProgress = () => {
    updateBufferedProgress();
  };

  const handlePlay = () => {
    setIsPlaying(true);
    // Clear any buffering state when play starts
    setIsBuffering(false);
    clearTimeout(bufferingTimeoutRef.current);
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Clear buffering state when paused
    setIsBuffering(false);
    clearTimeout(bufferingTimeoutRef.current);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsBuffering(false);
    // Clear saved time when video ends
    localStorage.removeItem(`video-player-time-${id}`);
  };

  const handleError = (e) => {
    console.error('🎬 Video error:', e);
    setError('Video playback error. Please check your connection and try again.');
    setIsLoading(false);
    setIsBuffering(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setIsBuffering(false);
    clearTimeout(bufferingTimeoutRef.current);
  };

  const handleWaiting = () => {
    // Only show buffering if we're actually playing and have been waiting for a bit
    if (isPlaying) {
      bufferingTimeoutRef.current = setTimeout(() => {
        setIsBuffering(true);
      }, 500); // Only show buffering after 500ms of waiting
    }
  };

  const handleSeeking = () => {
    setIsSeeking(true);
    // Don't show loading immediately for seeking - only if it takes too long
    bufferingTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
    }, 300);
  };

  const handleSeeked = () => {
    setIsSeeking(false);
    setIsLoading(false);
    clearTimeout(bufferingTimeoutRef.current);
    updateBufferedProgress();
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(bufferingTimeoutRef.current);
      clearTimeout(controlsTimeoutRef.current);
      clearTimeout(saveSettingsTimeoutRef.current);
      clearTimeout(previewTimeoutRef.current);
      clearTimeout(volumeHideTimerRef.current);
      clearTimeout(skipTimerRef.current);
    };
  }, []);

  // Control functions
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPlaying]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeek = useCallback((time) => {
    if (videoRef.current && duration) {
      const seekTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [duration]);

  const handleVolumeChange = useCallback((newVolume) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      videoRef.current.volume = clampedVolume;
      setVolume(clampedVolume);
      setIsMuted(clampedVolume === 0);
    }
  }, []);

  // Enhanced skip function
  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      const skipMultiplier = Math.min(consecutiveSkips + 1, 6);
      const skipAmount = seconds * skipMultiplier;

      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + skipAmount, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);

      setJumpIndicator({
        show: true,
        direction: seconds > 0 ? 'forward' : 'backward',
        time: Math.abs(skipAmount)
      });

      setConsecutiveSkips(prev => prev + 1);

      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = setTimeout(() => {
        setConsecutiveSkips(0);
      }, 1000);

      setTimeout(() => setJumpIndicator({ show: false, direction: '', time: 0 }), 800);
    }
  }, [duration, consecutiveSkips]);

  const skipForward = () => skip(5);
  const skipBackward = () => skip(-5);

  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setActiveSettingsTab(null);
    }
  };

  // Format time functions
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    if (timeDisplayMode === 'remaining') {
      const remaining = duration - currentTime;
      return `-${formatTime(remaining)}`;
    }
    return formatTime(currentTime);
  };

  const toggleTimeDisplay = () => {
    setTimeDisplayMode(timeDisplayMode === 'elapsed' ? 'remaining' : 'elapsed');
  };

  // Improved preview system using canvas frame capture
  const generatePreviewImage = useCallback(async (time) => {
    const previewVideo = previewVideoRef.current;
    const canvas = canvasRef.current;
    if (!previewVideo || !canvas) return null;

    return new Promise((resolve) => {
      previewVideo.currentTime = time;

      const onSeeked = () => {
        previewVideo.removeEventListener('seeked', onSeeked);
        previewVideo.removeEventListener('error', onError);
        
        try {
          const ctx = canvas.getContext("2d");
          ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch (error) {
          resolve(null);
        }
      };

      const onError = () => {
        previewVideo.removeEventListener('seeked', onSeeked);
        previewVideo.removeEventListener('error', onError);
        resolve(null);
      };

      previewVideo.addEventListener('seeked', onSeeked, { once: true });
      previewVideo.addEventListener('error', onError, { once: true });

      setTimeout(() => {
        previewVideo.removeEventListener('seeked', onSeeked);
        previewVideo.removeEventListener('error', onError);
        resolve(null);
      }, 500);
    });
  }, []);

  // Improved progress bar hover with frame capture
  const handleProgressHover = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const previewTime = percent * duration;
    
    setSeekPreview({
      show: true,
      time: previewTime,
      position: percent * 100,
      image: null,
      loading: true
    });

    clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        const previewImage = await generatePreviewImage(previewTime);
        
        setSeekPreview(prev => prev.show ? {
          ...prev,
          image: previewImage,
          loading: false
        } : prev);
      } catch (error) {
        setSeekPreview(prev => prev.show ? {
          ...prev,
          image: null,
          loading: false
        } : prev);
      }
    }, 50);
  }, [duration, generatePreviewImage]);

  const handleProgressLeave = () => {
    clearTimeout(previewTimeoutRef.current);
    setSeekPreview({ show: false, time: 0, position: 0, image: null, loading: false });
  };

  const handleProgressClick = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    handleSeek(percent * duration);
  }, [duration, handleSeek]);

  // Improved volume slider interaction
  const handleVolumeMouseEnter = () => {
    if (volumeHideTimerRef.current) clearTimeout(volumeHideTimerRef.current);
    setShowVolumeSlider(true);
  };

  const handleVolumeMouseLeave = (e) => {
    if (volumeContainerRef.current?.contains(e.relatedTarget)) return;
    
    volumeHideTimerRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1000);
  };

  // Controls auto-hide
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings && !showVolumeSlider && !activeSettingsTab) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showSettings, showVolumeSlider, activeSettingsTab]);

  useEffect(() => {
    if (isPlaying && !showSettings && !showVolumeSlider && !activeSettingsTab) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showSettings, showVolumeSlider, activeSettingsTab]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
        setActiveSettingsTab(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!videoRef.current || showSettings) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case '>':
        case '.':
          e.preventDefault();
          changePlaybackRate(Math.min(2, playbackRate + 0.25));
          break;
        case '<':
        case ',':
          e.preventDefault();
          changePlaybackRate(Math.max(0.25, playbackRate - 0.25));
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [volume, playbackRate, showSettings, togglePlay, handleVolumeChange, skip]);

  // Settings structure
  const settingsTabs = [
    {
      id: 'speed',
      label: 'Playback Speed',
      icon: <Gauge className="w-4 h-4" />,
      options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    },
    {
      id: 'quality',
      label: 'Quality',
      icon: <Monitor className="w-4 h-4" />,
      options: ['Auto', '1080p', '720p', '480p']
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Zap className="w-4 h-4" />
    }
  ];

  const shortcuts = [
    { key: 'Space/K', action: 'Play/Pause' },
    { key: 'F', action: 'Fullscreen' },
    { key: 'M', action: 'Mute' },
    { key: '←/→', action: 'Seek 5s' },
    { key: '↑/↓', action: 'Volume' },
    { key: ',/.', action: 'Speed' }
  ];

  // Skeleton loading component for preview
  const PreviewSkeleton = () => (
    <div className="w-40 bg-gray-800 rounded-xl p-3 animate-pulse">
      <div className="w-full h-24 bg-gray-700 rounded-lg mb-2"></div>
      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
    </div>
  );

  // Calculate buffered progress for display
  const getBufferedPercentage = () => {
    if (!videoRef.current || buffered.length === 0) return 0;
    
    let bufferedEnd = 0;
    for (let i = 0; i < buffered.length; i++) {
      if (currentTime >= buffered[i].start && currentTime <= buffered[i].end) {
        bufferedEnd = buffered[i].end;
        break;
      }
    }
    
    if (bufferedEnd === 0 && buffered.length > 0) {
      bufferedEnd = buffered[buffered.length - 1].end;
    }
    
    return (bufferedEnd / duration) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Preparing Your Stream</h3>
          <p className="text-gray-400 text-sm">Loading high-quality content...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Playback Error</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
        <div className="text-white text-xl">Content not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Browse</span>
        </button>
      </div>

      {/* Internet Connection Message */}
      {showConnectionMessage && (
        <div
          ref={connectionMessageRef}
          className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 animate-scale-in ${isOnline
            ? 'bg-green-500/20 border-green-500/30 text-green-400'
            : 'bg-red-500/20 border-red-500/30 text-red-400'
            }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5" />
                <span>Internet connection restored</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                <span>Internet connection lost</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Player Container */}
      <div
        ref={containerRef}
        className="relative w-full h-screen bg-black"
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => {
          if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
              setShowControls(false);
              setShowVolumeSlider(false);
            }, 1000);
          }
        }}
      >
        {videoSource ? (
          <>
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              src={videoSource}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onProgress={handleProgress}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onError={handleError}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              onSeeking={handleSeeking}
              onSeeked={handleSeeked}
              onClick={togglePlay}
              muted={isMuted}
              volume={volume}
              playsInline
              preload="auto"
            />

            {/* Auto-play blocked overlay */}
            {!isPlaying && !autoPlayAttempted && (
              <div 
                className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 cursor-pointer"
                onClick={togglePlay}
              >
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-full transform hover:scale-110 transition-all duration-200 shadow-2xl"
                >
                  <Play className="w-12 h-12" />
                </button>
              </div>
            )}

            {/* Smart Loading Overlay - Only shows for actual buffering */}
            {(isLoading || isBuffering) && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 border-4 border-purple-500/50 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  </div>
                  <p className="text-white text-sm font-medium">
                    {isBuffering ? 'Buffering...' : 'Loading...'}
                  </p>
                </div>
              </div>
            )}

            {/* Jump Indicator */}
            {jumpIndicator.show && (
              <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 transform animate-scale-in">
                  <div className="flex items-center gap-3 text-white text-xl font-bold">
                    {jumpIndicator.direction === 'forward' ? (
                      <FastForward className="w-8 h-8 text-green-400" />
                    ) : (
                      <Rewind className="w-8 h-8 text-yellow-400" />
                    )}
                    <span>{jumpIndicator.time}s</span>
                    {consecutiveSkips > 1 && (
                      <span className="text-sm text-gray-300 ml-2">(x{consecutiveSkips})</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Controls Overlay */}
            <div
              className={`absolute inset-0 z-40 flex flex-col justify-end transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

              {/* Bottom Controls Container */}
              <div className="relative z-10 p-4 md:p-6 space-y-3 md:space-y-4">
                {/* Enhanced Progress Bar with Preview */}
                <div className="group relative">
                  {/* Seek Preview Container */}
                  {seekPreview.show && (
                    <div
                      className="absolute bottom-full mb-3 transform -translate-x-1/2 z-50 pointer-events-none"
                      style={{
                        left: `${Math.max(5, Math.min(seekPreview.position, 95))}%`,
                      }}
                    >
                      {seekPreview.loading ? (
                        <PreviewSkeleton />
                      ) : (
                        <div className="bg-black/90 backdrop-blur-sm rounded-xl p-3 border border-white/20 shadow-2xl min-w-[160px]">
                          {/* Preview Image */}
                          <div className="w-40 h-24 bg-gray-800 rounded-lg overflow-hidden mb-2">
                            {seekPreview.image ? (
                              <img
                                ref={previewImageRef}
                                src={seekPreview.image}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <span className="text-white text-sm">No preview</span>
                              </div>
                            )}
                          </div>
                          {/* Time Stamp */}
                          <div className="text-white text-sm font-medium text-center">
                            {formatTime(seekPreview.time)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    ref={progressBarRef}
                    className="relative h-2 md:h-3 cursor-pointer group"
                    onMouseMove={handleProgressHover}
                    onMouseLeave={handleProgressLeave}
                    onClick={handleProgressClick}
                  >
                    {/* Progress Bar Background */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-700/80 rounded-full" />

                    {/* Buffered Progress - Real data */}
                    <div
                      className="absolute top-0 left-0 h-full bg-gray-500/60 rounded-full transition-all duration-200 z-10"
                      style={{ width: `${getBufferedPercentage()}%` }}
                    />

                    {/* Main Progress */}
                    <div
                      className="absolute top-0 left-0 h-full bg-purple-600 rounded-full transition-all duration-100 group-hover:bg-purple-500 z-20"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      {/* Progress Handle */}
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border-2 border-purple-500" />
                    </div>

                    {/* Hover Preview Indicator */}
                    {seekPreview.show && (
                      <div
                        className="absolute top-0 h-full w-0.5 bg-white/80 pointer-events-none z-30"
                        style={{ left: `${seekPreview.position}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Controls Row - Responsive */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="text-white hover:text-purple-400 transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full flex-shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 md:w-6 md:h-6" />
                      ) : (
                        <Play className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </button>

                    {/* Skip Buttons */}
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        onClick={skipBackward}
                        className="text-white hover:text-yellow-400 transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full flex-shrink-0"
                        title="Rewind 5s"
                      >
                        <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      <button
                        onClick={skipForward}
                        className="text-white hover:text-green-400 transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full flex-shrink-0"
                        title="Forward 5s"
                      >
                        <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>

                    {/* Volume Control - Fixed Interaction */}
                    <div
                      ref={volumeContainerRef}
                      className="relative flex-shrink-0"
                      onMouseEnter={handleVolumeMouseEnter}
                      onMouseLeave={handleVolumeMouseLeave}
                    >
                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-purple-400 transition-all duration-200 transform hover:scale-110 flex items-center justify-center bg-white/10 hover:bg-white/20 p-2 rounded-full w-10 h-10 md:w-12 md:h-12"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        ) : volume < 0.5 ? (
                          <Volume1 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        ) : (
                          <Volume2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        )}
                      </button>

                      {/* Volume Slider - Stays visible when interacting */}
                      {showVolumeSlider && (
                        <div
                          ref={volumeSliderRef}
                          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-black/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/10 z-50 flex flex-col items-center justify-center"
                          style={{ minWidth: '80px' }}
                          onMouseEnter={handleVolumeMouseEnter}
                          onMouseLeave={handleVolumeMouseLeave}
                        >
                          <div className="flex items-center justify-center mb-3 w-full">
                            <span className="text-white text-sm font-medium text-center">
                              {Math.round(volume * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-center w-full">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                              className="volume-slider vertical h-24 md:h-32 accent-purple-500 mx-auto"
                              orient="vertical"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time Display */}
                    <button
                      onClick={toggleTimeDisplay}
                      className="text-white hover:text-gray-300 transition-colors text-xs md:text-sm font-mono bg-white/10 hover:bg-white/20 px-2 md:px-3 py-1 md:py-2 rounded-lg min-w-[80px] md:min-w-[120px] text-center flex-shrink-0"
                    >
                      {getDisplayTime()} / {formatTime(duration)}
                    </button>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    {/* Playback Rate Indicator */}
                    {playbackRate !== 1 && (
                      <div className="text-white text-xs md:text-sm bg-purple-500 px-2 md:px-3 py-1 md:py-2 rounded-lg font-medium hidden sm:block">
                        {playbackRate}x
                      </div>
                    )}

                    {/* Settings */}
                    <div className="relative" ref={settingsRef}>
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`text-white transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full ${showSettings ? 'text-purple-400 bg-white/20' : 'hover:text-purple-400'}`}
                      >
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                      </button>

                      {/* Settings Panel - Responsive */}
                      {showSettings && (
                        <div className="absolute bottom-full right-0 mb-3 w-72 md:w-80 bg-black/95 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-2xl border border-white/10 z-50">
                          <div className="space-y-2 md:space-y-3">
                            {settingsTabs.map((tab) => (
                              <div key={tab.id} className="space-y-1 md:space-y-2">
                                <button
                                  onClick={() => setActiveSettingsTab(activeSettingsTab === tab.id ? null : tab.id)}
                                  className="flex items-center justify-between w-full p-2 md:p-3 text-white hover:bg-white/10 rounded-lg transition-colors text-sm md:text-base"
                                >
                                  <div className="flex items-center gap-2 md:gap-3">
                                    {tab.icon}
                                    <span className="font-medium">{tab.label}</span>
                                  </div>
                                  <ChevronDown className={`w-4 h-4 transition-transform ${activeSettingsTab === tab.id ? 'rotate-180' : ''}`} />
                                </button>

                                {activeSettingsTab === tab.id && (
                                  <div className="pl-3 md:pl-4 space-y-1 md:space-y-2 animate-slide-down">
                                    {tab.id === 'shortcuts' ? (
                                      <div className="space-y-1 md:space-y-2">
                                        {shortcuts.map((shortcut, index) => (
                                          <div key={index} className="flex items-center justify-between text-xs md:text-sm text-gray-300">
                                            <kbd className="bg-gray-700 px-1 md:px-2 py-1 rounded text-xs">{shortcut.key}</kbd>
                                            <span>{shortcut.action}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-1 md:gap-2">
                                        {tab.options.map((option) => (
                                          <button
                                            key={option}
                                            onClick={() => {
                                              if (tab.id === 'speed') {
                                                changePlaybackRate(option);
                                              } else if (tab.id === 'quality') {
                                                setQuality(option);
                                                setActiveSettingsTab(null);
                                              }
                                            }}
                                            className={`py-1 md:py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${(tab.id === 'speed' && playbackRate === option) ||
                                              (tab.id === 'quality' && quality === option)
                                              ? 'bg-purple-500 text-white shadow-lg'
                                              : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                              }`}
                                          >
                                            {tab.id === 'speed' ? (option === 1 ? 'Normal' : `${option}x`) : option}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="text-white hover:text-purple-400 transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full flex-shrink-0"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-yellow-400 text-2xl">!</span>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">No Video Available</h3>
              <p className="text-gray-400">This content doesn't have a playable video file.</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .volume-slider.vertical {
          writing-mode: bt-lr;
          -webkit-appearance: slider-vertical;
          width: 6px;
          height: 96px;
          padding: 0 4px;
        }
        
        @media (min-width: 768px) {
          .volume-slider.vertical {
            width: 8px;
            height: 128px;
          }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slide-down {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WatchPage;