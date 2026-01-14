import { useState, useEffect, useRef, useCallback } from 'react';

export const useVideoState = (videoRef, containerRef, toggleFullscreen) => {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [jumpIndicator, setJumpIndicator] = useState({ show: false, direction: '', time: 0 });
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [timeDisplayMode, setTimeDisplayMode] = useState('elapsed');
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
  const [showConnectionMessage, setShowConnectionMessage] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [quality, setQuality] = useState('Auto');

  const controlsTimeoutRef = useRef(null);
  const skipTimerRef = useRef(null);
  const volumeHideTimerRef = useRef(null);
  const saveSettingsTimeoutRef = useRef(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('video-player-volume');
    const savedPlaybackRate = localStorage.getItem('video-player-playbackRate');
    const savedMuted = localStorage.getItem('video-player-muted');

    if (savedVolume) setVolume(parseFloat(savedVolume));
    if (savedPlaybackRate) setPlaybackRate(parseFloat(savedPlaybackRate));
    if (savedMuted) setIsMuted(savedMuted === 'true');
  }, []);

  // Apply settings to video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [videoRef.current, volume, isMuted, playbackRate]);

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

  // managing video quality 
  const changeQuality = useCallback((newQuality) => {
    setQuality(newQuality);
  }, []);

  // Enhanced skip function
  const handleSkip = useCallback((seconds) => {
    if (videoRef.current && videoRef.current.duration) {
      const skipMultiplier = Math.min(consecutiveSkips + 1, 6);
      const skipAmount = seconds * skipMultiplier;

      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + skipAmount, videoRef.current.duration));
      videoRef.current.currentTime = newTime;

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
  }, [consecutiveSkips, videoRef]);

  const handleVolumeChange = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
  }, [isMuted, videoRef]);

  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate);
    setShowSettings(false);
  }, []);

  const toggleFullscreenMode = useCallback(() => {
    toggleFullscreen(containerRef);
  }, [toggleFullscreen, containerRef]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings && !showVolumeSlider) {
        setShowControls(false);
      }
    }, 3000);
  }, [showSettings, showVolumeSlider]);

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

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hide
  useEffect(() => {
    if (!showSettings && !showVolumeSlider) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    } else {
      setShowControls(true);
    }

    return () => {
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [showSettings, showVolumeSlider]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(controlsTimeoutRef.current);
      clearTimeout(skipTimerRef.current);
      clearTimeout(volumeHideTimerRef.current);
      clearTimeout(saveSettingsTimeoutRef.current);
    };
  }, []);

  return {
    volume,
    isMuted,
    isFullscreen,
    showControls,
    showSettings,
    playbackRate,
    jumpIndicator,
    showVolumeSlider,
    timeDisplayMode,
    consecutiveSkips,
    autoPlayAttempted,
    showConnectionMessage,
    isOnline,
    setShowControls,
    handleVolumeChange,
    handleSkip,
    toggleMute,
    changePlaybackRate,
    toggleFullscreenMode,
    showControlsTemporarily,
    setShowSettings,
    setShowVolumeSlider,
    setTimeDisplayMode,
    setAutoPlayAttempted,
    quality,
    changeQuality,
  };
};