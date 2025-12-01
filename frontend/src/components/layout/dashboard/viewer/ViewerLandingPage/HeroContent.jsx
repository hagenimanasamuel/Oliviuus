import React from 'react';
import { Clock, Calendar, Volume2, VolumeX } from "lucide-react";

export default function HeroContent({ 
  heroContent, 
  isTrailerPlaying, 
  isTrailerMuted,
  getAgeRating,
  onToggleMute
}) {
  return (
    <>
      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
        {heroContent.title}
      </h1>

      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2 text-white bg-black/30 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
          <span className="font-medium">
            {heroContent.duration_minutes ?
              `${Math.floor(heroContent.duration_minutes / 60)}h ${heroContent.duration_minutes % 60}m` : ''
            }
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 text-white bg-black/30 px-2 sm:px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
          <span className="font-medium">
            {heroContent.release_date ?
              new Date(heroContent.release_date).getFullYear() : ''
            }
          </span>
        </div>

        <div className="px-2 sm:px-3 py-1 bg-black/50 text-white text-xs sm:text-sm rounded-full border border-gray-600 backdrop-blur-sm font-medium">
          {getAgeRating(heroContent)}
        </div>

        {heroContent.trailer && isTrailerPlaying && (
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1 sm:gap-2 bg-black/50 hover:bg-black/70 text-white px-2 sm:px-3 py-1 rounded-full border border-gray-600 backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm"
            title={isTrailerMuted ? "Unmute" : "Mute"}
          >
            {isTrailerMuted ? (
              <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="font-medium">
              {isTrailerMuted ? "Unmute" : "Mute"}
            </span>
          </button>
        )}
      </div>

      <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-3xl drop-shadow-lg line-clamp-3 sm:line-clamp-none">
        {heroContent.short_description || heroContent.description}
      </p>
    </>
  );
}