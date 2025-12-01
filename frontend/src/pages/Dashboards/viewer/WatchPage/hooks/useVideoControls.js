import { useCallback } from 'react';

export const useVideoControls = (videoRef, isPlaying, currentTime, duration) => {
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [videoRef, isPlaying]);

  const seek = useCallback((time) => {
    if (videoRef.current && duration) {
      const seekTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = seekTime;
    }
  }, [videoRef, duration]);

  const skip = useCallback((seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      videoRef.current.currentTime = newTime;
      return newTime;
    }
    return currentTime;
  }, [videoRef, currentTime, duration]);

  const setPlaybackRate = useCallback((rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, [videoRef]);

  const setVolume = useCallback((volume) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      videoRef.current.volume = clampedVolume;
    }
  }, [videoRef]);

  // Remove toggleMute from here completely
  // const toggleMute = useCallback(() => {
  //   if (videoRef.current) {
  //     videoRef.current.muted = !videoRef.current.muted;
  //   }
  // }, [videoRef]);

  const toggleFullscreen = useCallback((containerRef) => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }, []);

  return {
    togglePlay,
    seek,
    skip,
    setPlaybackRate,
    setVolume,
    toggleFullscreen
  };
};