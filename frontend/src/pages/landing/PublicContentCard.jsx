import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const PublicContentCard = ({ content, rank, onContentClick }) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset loading state when content changes
  useEffect(() => {
    if (content) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [content]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600 shadow-yellow-500/50';
    if (rank === 2) return 'from-gray-400 to-gray-600 shadow-gray-500/50';
    if (rank === 3) return 'from-orange-400 to-orange-600 shadow-orange-500/50';
    return 'from-purple-500 to-[#BC8BBC] shadow-purple-500/50';
  };

  const getRankGlow = (rank) => {
    if (rank === 1) return 'shadow-lg shadow-yellow-400/30';
    if (rank === 2) return 'shadow-lg shadow-gray-400/20';
    if (rank === 3) return 'shadow-lg shadow-orange-400/20';
    return 'shadow-lg shadow-purple-400/20';
  };

  // Show skeleton only when we don't have content
  if (!content) {
    return (
      <div className="flex-shrink-0 w-40 sm:w-48 md:w-56">
        {/* Rank Badge Skeleton */}
        <div className="absolute -top-2 -left-2 z-20 w-10 h-10 rounded-xl bg-gray-700 animate-pulse flex items-center justify-center shadow-2xl border-2 border-gray-600">
          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
        </div>

        {/* Content Card Skeleton */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-gray-700/50">
          {/* Image Container Skeleton */}
          <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse">
              {/* Skeleton shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group relative flex-shrink-0 w-40 sm:w-48 md:w-56 transform transition-all duration-500 hover:scale-105 hover:z-10 cursor-pointer"
      onClick={() => onContentClick(content)}
    >
      {/* Rank Badge - Artistic Design */}
      <div className={`absolute -top-2 -left-2 z-20 w-10 h-10 rounded-xl bg-gradient-to-br ${getRankColor(rank)} ${getRankGlow(rank)} flex items-center justify-center shadow-2xl border-2 border-white/20`}>
        <span className="text-white font-black text-base drop-shadow-lg">
          {rank}
        </span>
        
        {/* Crown for rank 1 */}
        {rank === 1 && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
          </div>
        )}
      </div>

      {/* Content Card */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-gray-700/50 group-hover:border-[#BC8BBC]/50 transition-all duration-500">
        {/* Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
          {/* Skeleton Loading State */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-10">
              {/* Professional skeleton shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/40 to-transparent -skew-x-12 animate-shimmer"></div>
            </div>
          )}
          
          {/* Error State */}
          {imageError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-gray-500 text-xs">
                  {t("landingPage.contentCard.noImage", "No Image")}
                </p>
              </div>
            </div>
          ) : (
            <img
              src={content.primary_image_url || '/api/placeholder/300/450'}
              alt={content.title}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Local Content Badge - Top Right */}
          {content.is_local_content && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg border border-white/20">
              {t("landingPage.contentCard.rwanda", "RWANDA")}
            </div>
          )}
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 blur-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default PublicContentCard;