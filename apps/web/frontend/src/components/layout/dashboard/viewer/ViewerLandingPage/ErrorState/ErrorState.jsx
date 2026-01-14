import React from 'react';
import { X, Film } from "lucide-react";

export default function ErrorState({ error, onRetry, isEmpty = false }) {
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">No content available</h3>
          <p className="text-gray-400 text-sm sm:text-base">Check back later for new additions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
        </div>
        <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-400 text-sm sm:text-base mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}