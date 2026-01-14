import { useState, useEffect, useRef, useCallback } from 'react';

export const useVideoPlayer = (videoSource, contentId, setAutoPlayAttempted) => {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [buffered, setBuffered] = useState([]);
  const [autoPlayAttempted, setAutoPlayAttemptedLocal] = useState(false);
  const lastUpdateTimeRef = useRef(0);
  const bufferingTimeoutRef = useRef(null);
  const waitingTimeoutRef = useRef(null);

  const updateBufferedProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0 && duration > 0) {
      const bufferedRanges = [];
      for (let i = 0; i < videoRef.current.buffered.length; i++) {
        bufferedRanges.push({
          start: videoRef.current.buffered.start(i),
          end: videoRef.current.buffered.end(i)
        });
      }
      setBuffered(bufferedRanges);
    }
  }, [duration]);

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Apply saved time if exists
      const savedTime = localStorage.getItem(`video-player-time-${contentId}`);
      if (savedTime) {
        const time = parseFloat(savedTime);
        if (time < videoRef.current.duration) {
          videoRef.current.currentTime = time;
          setCurrentTime(time);
        }
      }
    }
  }, [contentId]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isSeeking) return;

    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 100) {
      return;
    }

    lastUpdateTimeRef.current = now;
    
    requestAnimationFrame(() => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
        updateBufferedProgress();
      }
    });
  }, [isSeeking, updateBufferedProgress]);

  const handleProgress = useCallback(() => {
    updateBufferedProgress();
  }, [updateBufferedProgress]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsBuffering(false);
    setIsLoading(false);
    clearTimeout(bufferingTimeoutRef.current);
    clearTimeout(waitingTimeoutRef.current);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setIsLoading(false);
    clearTimeout(bufferingTimeoutRef.current);
    clearTimeout(waitingTimeoutRef.current);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setIsLoading(false);
    localStorage.removeItem(`video-player-time-${contentId}`);
    clearTimeout(bufferingTimeoutRef.current);
    clearTimeout(waitingTimeoutRef.current);
  }, [contentId]);

  const handleError = useCallback((e) => {
    console.error('Video error:', e);
    setIsLoading(false);
    setIsBuffering(false);
    clearTimeout(bufferingTimeoutRef.current);
    clearTimeout(waitingTimeoutRef.current);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setIsBuffering(false);
    clearTimeout(bufferingTimeoutRef.current);
    clearTimeout(waitingTimeoutRef.current);
  }, []);

  const handleWaiting = useCallback(() => {
    if (isPlaying && !isSeeking) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = setTimeout(() => {
        setIsBuffering(true);
      }, 800);
    }
  }, [isPlaying, isSeeking]);

  const handleSeeking = useCallback(() => {
    setIsSeeking(true);
    clearTimeout(bufferingTimeoutRef.current);
    bufferingTimeoutRef.current = setTimeout(() => {
      if (isSeeking) {
        setIsLoading(true);
      }
    }, 500);
  }, [isSeeking]);

  const handleSeeked = useCallback(() => {
    setIsSeeking(false);
    setIsLoading(false);
    clearTimeout(bufferingTimeoutRef.current);
    clearTimeout(waitingTimeoutRef.current);
    updateBufferedProgress();
    
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [updateBufferedProgress]);

  // Auto-play when video is ready
  useEffect(() => {
    if (videoRef.current && !isPlaying && !autoPlayAttempted) {
      const attemptAutoPlay = async () => {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          setAutoPlayAttemptedLocal(true);
          if (setAutoPlayAttempted) {
            setAutoPlayAttempted(true);
          }
        } catch (error) {
          console.log('Auto-play was prevented:', error);
          setAutoPlayAttemptedLocal(true);
          if (setAutoPlayAttempted) {
            setAutoPlayAttempted(true);
          }
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
  }, [videoSource, isPlaying, autoPlayAttempted, setAutoPlayAttempted]);

  // Save current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && duration > 0 && currentTime > 0) {
        localStorage.setItem(`video-player-time-${contentId}`, currentTime.toString());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [contentId, currentTime, duration]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeout(bufferingTimeoutRef.current);
      clearTimeout(waitingTimeoutRef.current);
    };
  }, []);

  return {
    videoRef,
    duration,
    currentTime,
    isPlaying,
    isLoading,
    isBuffering,
    isSeeking,
    buffered,
    autoPlayAttempted: autoPlayAttempted,
    setCurrentTime,
    setIsPlaying,
    videoEvents: {
      onLoadedMetadata: handleLoadedMetadata,
      onTimeUpdate: handleTimeUpdate,
      onProgress: handleProgress,
      onPlay: handlePlay,
      onPause: handlePause,
      onEnded: handleEnded,
      onError: handleError,
      onCanPlay: handleCanPlay,
      onWaiting: handleWaiting,
      onSeeking: handleSeeking,
      onSeeked: handleSeeked,
    }
  };
};