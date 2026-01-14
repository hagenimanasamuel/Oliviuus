import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingOverlay = ({ type = 'buffering', isLoading, isBuffering, message }) => {
  const { t } = useTranslation();

  if (type === 'initial') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">
            {t('loadingOverlay.initial.title', 'Preparing Your Stream')}
          </h3>
          <p className="text-gray-400 text-sm">
            {t('loadingOverlay.initial.description', 'Loading high-quality content...')}
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && !isBuffering) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-purple-500/50 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-white text-sm font-medium">
          {message || (isBuffering 
            ? t('loadingOverlay.buffering', 'Buffering...') 
            : t('loadingOverlay.loading', 'Loading...')
          )}
        </p>
        {message && (
          <p className="text-gray-400 text-xs mt-2">
            {t('loadingOverlay.waitMessage', 'Please wait while we prepare the content')}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;