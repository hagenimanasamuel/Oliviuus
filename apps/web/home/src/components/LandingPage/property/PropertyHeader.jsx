// src/components/LandingPage/property/PropertyHeader.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';

export default function PropertyHeader({ 
  navigate, 
  showShareModal, 
  isFavorite, 
  handleFavorite 
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for subtle background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`sticky top-0 z-30 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Back Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-[#BC8BBC]/40 hover:bg-[#BC8BBC]/5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-[#BC8BBC] transition-colors" />
              <span className="hidden sm:inline font-medium text-gray-700 group-hover:text-[#BC8BBC] transition-colors">
                Back
              </span>
            </button>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button 
              onClick={showShareModal}
              className="group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-[#BC8BBC]/40 hover:bg-[#BC8BBC]/5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Share2 className="h-5 w-5 text-gray-600 group-hover:text-[#BC8BBC] transition-colors" />
              <span className="hidden sm:inline font-medium text-gray-700 group-hover:text-[#BC8BBC] transition-colors">
                Share
              </span>
            </button>

            {/* Save Button */}
            <button 
              onClick={handleFavorite}
              className="group flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/10 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Heart className={`h-5 w-5 transition-all duration-300 ${
                isFavorite 
                  ? 'fill-[#BC8BBC] text-[#BC8BBC]' 
                  : 'text-gray-600 group-hover:text-[#BC8BBC]'
              }`} />
              <span className={`hidden sm:inline font-medium transition-colors ${
                isFavorite 
                  ? 'text-[#BC8BBC]' 
                  : 'text-gray-700 group-hover:text-[#BC8BBC]'
              }`}>
                {isFavorite ? 'Saved' : 'Save'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}