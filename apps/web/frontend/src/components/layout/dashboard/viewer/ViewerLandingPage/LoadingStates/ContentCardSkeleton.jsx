import React from 'react';

export default function ContentCardSkeleton() {
  return (
    <div className="w-40 h-28 sm:w-48 sm:h-32 md:w-56 md:h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600"></div>
    </div>
  );
}