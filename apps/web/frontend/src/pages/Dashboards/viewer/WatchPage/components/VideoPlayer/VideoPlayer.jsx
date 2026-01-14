import React from 'react';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const VideoPlayer = ({ 
  videoSource, 
  videoRef, 
  videoEvents,
  isPlaying,
  autoPlayAttempted,
  onTogglePlay,
  videoFilters
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative w-full h-full bg-black">
      {videoSource ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={videoSource}
            onClick={onTogglePlay}
            playsInline
            preload="auto"
            style={{ filter: videoFilters || '' }}
            {...videoEvents}
            aria-label={t('videoPlayer.accessibility.videoPlayer', 'Video player')}
          />

          {/* Auto-play blocked overlay - Only show if auto-play was attempted and failed */}
          {!isPlaying && !autoPlayAttempted && (
            <div 
              className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 cursor-pointer"
              onClick={onTogglePlay}
              role="button"
              aria-label={t('videoPlayer.accessibility.playVideo', 'Play video')}
            >
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-full transform hover:scale-110 transition-all duration-200 shadow-2xl"
                aria-label={t('videoPlayer.buttons.play', 'Play')}
              >
                <Play className="w-12 h-12" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-400 text-2xl">!</span>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">
              {t('videoPlayer.errors.noVideo.title', 'No Video Available')}
            </h3>
            <p className="text-gray-400">
              {t('videoPlayer.errors.noVideo.description', 'This content doesn\'t have a playable video file.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;