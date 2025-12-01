import React from 'react';
import ContentCardSkeleton from '../LoadingStates/ContentCardSkeleton.jsx';

export default function ContentRowSkeleton() {
  return (
    <section className="relative mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-6">
        <div>
          <div className="h-6 sm:h-8 bg-gray-700 rounded w-32 sm:w-48 mb-2 animate-pulse"></div>
          <div className="h-3 sm:h-4 bg-gray-700 rounded w-24 sm:w-32 animate-pulse"></div>
        </div>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 py-2">
        {[...Array(6)].map((_, index) => (
          <ContentCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}