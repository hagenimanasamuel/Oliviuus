import React, { useRef, useCallback, useState } from 'react';
import {
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
  ChevronDown
} from 'lucide-react';
import { formatTime } from '../../utils/timeFormatters';
import SettingsPanel from '../SettingsPanel/SettingsPanel';
import PreviewThumbnail from '../Preview/PreviewThumbnail';

const PlayerControls = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  showControls,
  showSettings,
  showVolumeSlider,
  playbackRate,
  timeDisplayMode,
  buffered,
  videoSource,
  videoRef, // Added for SettingsPanel
  onTogglePlay,
  onSeek,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onPlaybackRateChange,
  onTimeDisplayToggle,
  onShowSettings,
  onShowVolumeSlider,
  containerRef,
  quality,
  onQualityChange,
  // Add all the new props for SettingsPanel functionality
  onTogglePip,
  onToggleSleepTimer,
  onVolumeBoost,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange
}) => {
  const progressBarRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const volumeHideTimerRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  // Preview state
  const [seekPreview, setSeekPreview] = useState({
    show: false,
    time: 0,
    position: 0,
    loading: false
  });

  const getDisplayTime = () => {
    if (timeDisplayMode === 'remaining') {
      const remaining = duration - currentTime;
      return `-${formatTime(remaining)}`;
    }
    return formatTime(currentTime);
  };

  const handleProgressClick = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(percent * duration);
  }, [duration, onSeek]);

  const handleProgressHover = useCallback((e) => {
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const previewTime = percent * duration;

    setSeekPreview({
      show: true,
      time: previewTime,
      position: percent * 100,
      loading: true
    });

    clearTimeout(previewTimeoutRef.current);

    previewTimeoutRef.current = setTimeout(() => {
      setSeekPreview(prev => prev.show ? {
        ...prev,
        loading: false
      } : prev);
    }, 100);
  }, [duration]);

  const handleProgressLeave = () => {
    clearTimeout(previewTimeoutRef.current);
    setSeekPreview({ show: false, time: 0, position: 0, loading: false });
  };

  const handleVolumeMouseEnter = () => {
    if (volumeHideTimerRef.current) clearTimeout(volumeHideTimerRef.current);
    onShowVolumeSlider(true);
  };

  const handleVolumeMouseLeave = (e) => {
    if (volumeContainerRef.current?.contains(e.relatedTarget)) return;
    volumeHideTimerRef.current = setTimeout(() => {
      onShowVolumeSlider(false);
    }, 100);
  };

  const getBufferedSegments = () => {
    if (!duration || buffered.length === 0) return [];
    return buffered.map(segment => ({
      start: (segment.start / duration) * 100,
      width: ((segment.end - segment.start) / duration) * 100
    }));
  };

  return (
    <div
      className={`absolute inset-0 z-40 flex flex-col justify-end transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => {
        e.stopPropagation();
        // This will keep controls visible when moving within controls area
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Bottom Controls Container */}
      <div className="relative z-10 p-4 md:p-6 space-y-3 md:space-y-4">
        {/* Progress Bar with Preview */}
        <div className="group relative">
          {/* Seek Preview Container */}
          {seekPreview.show && (
            <PreviewThumbnail
              time={seekPreview.time}
              position={seekPreview.position}
              videoSource={videoSource}
              duration={duration}
            />
          )}

          <div
            ref={progressBarRef}
            className="relative h-1 cursor-pointer group-hover:h-1.5 transition-all duration-200"
            onMouseMove={handleProgressHover}
            onMouseLeave={handleProgressLeave}
            onClick={handleProgressClick}
          >
            {/* Progress Bar Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700/60 to-gray-700/80 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            </div>

            {/* Buffered Progress */}
            {getBufferedSegments().map((segment, index) => (
              <div
                key={index}
                className="absolute top-0 h-full bg-gradient-to-r from-gray-400/40 to-gray-500/50 rounded-full transition-all duration-300"
                style={{
                  left: `${segment.start}%`,
                  width: `${segment.width}%`
                }}
              />
            ))}

            {/* Main Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 rounded-full transition-all duration-100 group-hover:from-purple-500 group-hover:via-purple-400 group-hover:to-purple-500 shadow-lg shadow-purple-500/50"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              {/* Progress Handle */}
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-0 h-0 opacity-0 group-hover:w-3.5 group-hover:h-3.5 group-hover:opacity-100 transition-all duration-200">
                <div className="w-full h-full bg-white rounded-full shadow-xl shadow-purple-500/50 border-2 border-purple-400 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-purple-100 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Hover Preview Indicator */}
            {seekPreview.show && (
              <div
                className="absolute top-0 h-full w-0.5 bg-white/90 shadow-lg shadow-white/50 pointer-events-none z-30 rounded-full"
                style={{ left: `${seekPreview.position}%` }}
              />
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left Controls */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
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
                onClick={() => onSkip(-5)}
                className="text-white hover:text-yellow-400 transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full flex-shrink-0"
                title="Rewind 5s"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => onSkip(5)}
                className="text-white hover:text-green-400 transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full flex-shrink-0"
                title="Forward 5s"
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div
              ref={volumeContainerRef}
              className="relative flex-shrink-0"
              onMouseEnter={handleVolumeMouseEnter}
              onMouseLeave={handleVolumeMouseLeave}
            >
              <button
                onClick={onToggleMute}
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

              {/* Volume Slider */}
              {showVolumeSlider && (
                <div
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
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="volume-slider vertical h-24 md:h-32 accent-purple-500 mx-auto"
                      orient="vertical"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Time Display */}
            <button
              onClick={onTimeDisplayToggle}
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
            <div className="relative">
              <button
                onClick={() => onShowSettings(!showSettings)}
                className={`text-white transition-all duration-200 transform hover:scale-110 bg-white/10 hover:bg-white/20 p-2 rounded-full ${showSettings ? 'text-purple-400 bg-white/20' : 'hover:text-purple-400'}`}
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              {/* Settings Panel */}
              {showSettings && (
                <SettingsPanel
                  playbackRate={playbackRate}
                  quality={quality}
                  onPlaybackRateChange={onPlaybackRateChange}
                  onQualityChange={onQualityChange}
                  onClose={() => onShowSettings(false)}
                  videoRef={videoRef}
                  onTogglePip={onTogglePip}
                  onToggleSleepTimer={onToggleSleepTimer}
                  onVolumeBoost={onVolumeBoost}
                  onBrightnessChange={onBrightnessChange}
                  onContrastChange={onContrastChange}
                  onSaturationChange={onSaturationChange}
                />
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
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
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
};

export default PlayerControls;