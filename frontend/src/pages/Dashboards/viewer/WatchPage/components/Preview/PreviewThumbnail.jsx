import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../../utils/timeFormatters';
import { useTranslation } from 'react-i18next';

const PreviewThumbnail = ({ 
  time, 
  position, 
  videoSource,
  duration 
}) => {
  const { t } = useTranslation();
  const previewRef = useRef(null);
  const previewVideoRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize preview video
  useEffect(() => {
    if (!videoSource || !duration || time < 0 || time > duration) return;

    let previewVideo = previewVideoRef.current;

    // Create preview video element if it doesn't exist
    if (!previewVideo) {
      previewVideo = document.createElement("video");
      previewVideo.src = videoSource;
      previewVideo.crossOrigin = "anonymous";
      previewVideo.muted = true;
      previewVideo.preload = "metadata";
      previewVideo.style.display = "none";
      previewVideo.playsInline = true;
      
      document.body.appendChild(previewVideo);
      previewVideoRef.current = previewVideo;
    }

    return () => {
      // Cleanup will be handled by the main component
    };
  }, [videoSource, duration]);

  // Sync preview video time
  useEffect(() => {
    const previewVideo = previewVideoRef.current;
    if (!previewVideo || !previewRef.current || !duration || time < 0 || time > duration) return;

    const syncPreview = async () => {
      setIsLoading(true);
      setIsReady(false);

      try {
        // Don't seek if we're already close to the target time
        if (Math.abs(previewVideo.currentTime - time) > 0.5) {
          previewVideo.currentTime = time;
        }

        const handleSeeked = () => {
          setIsReady(true);
          setIsLoading(false);
          previewVideo.removeEventListener('seeked', handleSeeked);
        };

        const handleError = () => {
          setIsLoading(false);
          previewVideo.removeEventListener('error', handleError);
        };

        previewVideo.addEventListener('seeked', handleSeeked, { once: true });
        previewVideo.addEventListener('error', handleError, { once: true });

        // Fallback timeout
        const timeoutId = setTimeout(() => {
          setIsReady(true);
          setIsLoading(false);
          previewVideo.removeEventListener('seeked', handleSeeked);
          previewVideo.removeEventListener('error', handleError);
        }, 500);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error('Preview sync error:', error);
        setIsLoading(false);
      }
    };

    syncPreview();
  }, [time, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const previewVideo = previewVideoRef.current;
      if (previewVideo && document.body.contains(previewVideo)) {
        document.body.removeChild(previewVideo);
      }
    };
  }, []);

  if (!videoSource || !duration) return null;

  return (
    <div 
      className="absolute bottom-full mb-2 transform -translate-x-1/2 z-50 pointer-events-none"
      style={{ left: `${Math.max(8, Math.min(position, 92))}%` }}
      role="tooltip"
      aria-label={t('previewThumbnail.aria.timePreview', 'Preview for time: {{time}}', { 
        time: formatTime(time) 
      })}
    >
      <div className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-md rounded-xl p-2 border border-purple-500/30 shadow-2xl shadow-purple-500/20 min-w-[160px]">
        <div className="w-40 h-[90px] bg-gray-800 rounded-lg overflow-hidden mb-2 relative border border-gray-700/50">
          {/* Loading State */}
          {(isLoading || !isReady) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/90 z-10">
              <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"
                aria-label={t('previewThumbnail.loading', 'Loading preview...')}
              ></div>
            </div>
          )}
          
          {/* Preview Video */}
          <video
            ref={previewRef}
            src={videoSource}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isReady && !isLoading ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
          />
        </div>
        
        {/* Time Display */}
        <div className="text-white text-xs font-semibold text-center bg-purple-500/20 py-1 px-2 rounded-md">
          {formatTime(time)}
        </div>
      </div>
      
      {/* Arrow Pointer */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500/30"></div>
      </div>
    </div>
  );
};

export default PreviewThumbnail;