import React from 'react';

export default function HeroSkeleton() {
  return (
    <div className="relative w-full h-screen bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 animate-pulse" />
      <div className="relative z-20 h-full flex items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-left w-full">
          <div className="h-8 sm:h-10 lg:h-12 bg-gray-600 rounded-lg mb-4 sm:mb-6 w-3/4 animate-pulse"></div>
          <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
            <div className="h-4 sm:h-6 bg-gray-600 rounded w-16 sm:w-20 animate-pulse"></div>
            <div className="h-4 sm:h-6 bg-gray-600 rounded w-12 sm:w-16 animate-pulse"></div>
            <div className="h-4 sm:h-6 bg-gray-600 rounded w-8 sm:w-12 animate-pulse"></div>
          </div>
          <div className="h-16 sm:h-20 bg-gray-600 rounded-lg mb-6 sm:mb-8 w-full animate-pulse"></div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="h-10 sm:h-12 bg-gray-600 rounded-lg w-24 sm:w-32 animate-pulse"></div>
            <div className="h-10 sm:h-12 bg-gray-600 rounded-lg w-20 sm:w-28 animate-pulse"></div>
            <div className="h-10 sm:h-12 bg-gray-600 rounded-lg w-16 sm:w-24 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}