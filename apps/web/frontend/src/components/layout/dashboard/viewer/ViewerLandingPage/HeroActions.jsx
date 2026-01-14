import React from 'react';
import { Play, Plus, Check, Heart, Info, Loader2 } from "lucide-react";

export default function HeroActions({
  heroContent,
  heroPreferences,
  isTrailerPlaying,
  onPlayContent,
  onToggleTrailer,
  onAddToLibrary,
  onLikeContent,
  onMoreInfo
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <button
        onClick={() => onPlayContent(heroContent)}
        className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200"
      >
        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        Play
      </button>

      {heroContent.trailer && (
        <button
          onClick={onToggleTrailer}
          className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm"
        >
          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
          {isTrailerPlaying ? 'Stop' : 'Trailer'}
        </button>
      )}

      <button
        onClick={(e) => onAddToLibrary(heroContent, e)}
        disabled={heroPreferences.loading.watchlist}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border backdrop-blur-sm ${
          heroPreferences.isInList
            ? 'bg-[#BC8BBC] hover:bg-[#a56ba5] text-white border-[#BC8BBC]'
            : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500'
        } ${heroPreferences.loading.watchlist ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {heroPreferences.loading.watchlist ? (
          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        ) : heroPreferences.isInList ? (
          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : (
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        )}
        <span className="hidden sm:inline">
          {heroPreferences.isInList ? 'In List' : 'My List'}
        </span>
      </button>

      <button
        onClick={(e) => onLikeContent(heroContent, e)}
        disabled={heroPreferences.loading.like}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border backdrop-blur-sm ${
          heroPreferences.isLiked
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
            : 'bg-gray-600/90 hover:bg-gray-500/90 text-white border-gray-500'
        } ${heroPreferences.loading.like ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {heroPreferences.loading.like ? (
          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        ) : (
          <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${heroPreferences.isLiked ? 'fill-current' : ''}`} />
        )}
        <span className="hidden sm:inline">
          {heroPreferences.isLiked ? 'Liked' : 'Like'}
        </span>
      </button>

      <button
        onClick={(e) => onMoreInfo(heroContent, e)}
        className="flex items-center gap-2 bg-gray-600/90 hover:bg-gray-500/90 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 border border-gray-500 backdrop-blur-sm"
      >
        <Info className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Details</span>
      </button>
    </div>
  );
}