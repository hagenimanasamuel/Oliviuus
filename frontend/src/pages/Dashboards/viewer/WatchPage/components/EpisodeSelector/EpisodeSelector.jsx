// Enhanced EpisodeSelector.jsx with Professional Features
import React, { useState, useRef, useEffect } from 'react';
import { Play, Clock, Check, ChevronDown, Tv, Film, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EpisodeSelector = ({ 
  content, 
  currentEpisode, 
  onEpisodeSelect, 
  currentTime, 
  duration,
  similarContent = [],
  showControlsTemporarily
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredEpisode, setHoveredEpisode] = useState(null);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Toggle dropdown
  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHoveredEpisode(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Check if content is a series
  const isSeries = content?.media_assets?.some(asset => 
    asset.asset_type === 'episodeVideo'
  );

  // Get all episodes
  const episodes = content?.media_assets?.filter(asset => 
    asset.asset_type === 'episodeVideo'
  ) || [];

  // Get main video for movies
  const mainVideo = content?.media_assets?.find(asset => 
    asset.asset_type === 'mainVideo'
  );

  // Group episodes by season
  const episodesBySeason = {};
  episodes.forEach(episode => {
    const season = episode.season_number || 1;
    if (!episodesBySeason[season]) {
      episodesBySeason[season] = [];
    }
    episodesBySeason[season].push(episode);
  });

  const getProgressPercentage = (episode) => {
    const epId = episode.id || episode._id;
    const savedTime = localStorage.getItem(`video-player-time-${epId}`);
    const episodeDuration = episode.duration || duration || 0;
    if (!savedTime || episodeDuration === 0) return 0;
    return (parseFloat(savedTime) / episodeDuration) * 100;
  };

  const getContinueWatchingTime = () => {
    if (!mainVideo) return 0;
    const savedTime = localStorage.getItem(`video-player-time-${content.id}`);
    return savedTime ? parseFloat(savedTime) : 0;
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEpisodeSelect = (episode) => {
    console.log('🎬 Episode selected:', episode.title || episode.file_name);
    
    // Clear any hover timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setHoveredEpisode(null);
    onEpisodeSelect(episode);
    
    // Small delay before closing to show feedback
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleEpisodeHover = (episodeId) => {
    // Clear existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Set new hover state immediately
    setHoveredEpisode(episodeId);
  };

  const handleEpisodeLeave = () => {
    // Add delay before clearing hover to prevent flickering
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEpisode(null);
    }, 300);
  };

  const handleContinueWatching = () => {
    const continueTime = getContinueWatchingTime();
    console.log('▶️ Continue watching from:', continueTime);
    if (mainVideo && onEpisodeSelect) {
      onEpisodeSelect(mainVideo);
    }
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleStartOver = () => {
    localStorage.removeItem(`video-player-time-${content.id}`);
    console.log('🔄 Start over');
    if (mainVideo && onEpisodeSelect) {
      onEpisodeSelect(mainVideo);
    }
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleSimilarContentSelect = (contentItem) => {
    console.log('🎬 Similar content selected:', contentItem.title);
    setIsOpen(false);
    navigate(`/watch/${contentItem.id}`);
  };

  // Get thumbnail URL
  const getThumbnailUrl = (contentItem) => {
    if (contentItem.thumbnail_url) {
      return contentItem.thumbnail_url;
    }
    if (contentItem.media_assets && contentItem.media_assets.length > 0) {
      const thumbnailAsset = contentItem.media_assets.find(asset => 
        asset.asset_type === 'thumbnail' || asset.asset_type === 'primaryImage'
      );
      if (thumbnailAsset?.url) return thumbnailAsset.url;
    }
    return null;
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown Trigger Button with animation */}
      <button
        onClick={handleToggleDropdown}
        onMouseEnter={showControlsTemporarily}
        onMouseMove={showControlsTemporarily}
        className={`flex items-center gap-2 text-white transition-all duration-300 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold border border-white/20 hover:border-purple-400 hover:bg-white/20 transform hover:scale-105 ${isOpen ? 'bg-purple-600 border-purple-400' : ''}`}
      >
        {isSeries ? (
          <>
            <Tv className="w-5 h-5" />
            <span className="hidden sm:inline">Episodes</span>
          </>
        ) : (
          <>
            <Film className="w-5 h-5" />
            <span className="hidden sm:inline">Continue</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Content with enhanced animations */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-3 w-[420px] max-w-[95vw] bg-black/98 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border border-purple-500/30 z-50 max-h-[80vh] overflow-y-auto animate-slideDown"
          onMouseEnter={() => {
            // Keep dropdown open when hovering over it
            if (hoverTimeoutRef.current) {
              clearTimeout(hoverTimeoutRef.current);
            }
            // Keep controls visible when hovering dropdown
            if (typeof showControlsTemporarily === 'function') {
              showControlsTemporarily();
            }
          }}
          onMouseMove={(e) => {
            // Prevent mouse events from bubbling to parent
            e.stopPropagation();
            // Keep controls visible
            if (typeof showControlsTemporarily === 'function') {
              showControlsTemporarily();
            }
          }}
        >
          {isSeries ? (
            // Series Content - Episodes by Season
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Tv className="w-5 h-5 text-purple-400" />
                  Episodes & Seasons
                </h3>
                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                  {episodes.length} episodes
                </span>
              </div>
              
              {Object.keys(episodesBySeason).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Tv className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm">No episodes available</p>
                </div>
              ) : (
                Object.entries(episodesBySeason).map(([season, seasonEpisodes]) => (
                  <div key={season} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                      <h4 className="text-white font-semibold text-sm bg-purple-600/20 px-3 py-1 rounded-full border border-purple-500/30">
                        Season {season}
                      </h4>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                    </div>
                    <div className="space-y-2">
                      {seasonEpisodes.map((episode, index) => {
                        const progress = getProgressPercentage(episode);
                        const episodeId = episode.id || episode._id;
                        const isPlaying = currentEpisode?.id === episodeId || currentEpisode?._id === episodeId;
                        const isHovered = hoveredEpisode === episodeId;
                        
                        return (
                          <button
                            key={episodeId}
                            onClick={() => handleEpisodeSelect(episode)}
                            onMouseEnter={() => handleEpisodeHover(episodeId)}
                            onMouseLeave={handleEpisodeLeave}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left group ${
                              isPlaying 
                                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/50 scale-[1.02]' 
                                : isHovered
                                ? 'bg-white/20 text-white scale-[1.02] shadow-lg'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            {/* Episode Number/Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                              isPlaying 
                                ? 'bg-white/20' 
                                : 'bg-white/10 group-hover:bg-purple-500/30'
                            }`}>
                              {isPlaying ? (
                                <Play className="w-5 h-5 fill-current animate-pulse" />
                              ) : progress > 90 ? (
                                <Check className="w-5 h-5 text-green-400" />
                              ) : progress > 0 ? (
                                <Clock className="w-5 h-5 text-yellow-400" />
                              ) : (
                                <span className="text-sm font-bold">{episode.episode_number || index + 1}</span>
                              )}
                            </div>
                            
                            {/* Episode Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate mb-1">
                                {episode.title || `Episode ${episode.episode_number || index + 1}`}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`${isPlaying ? 'text-white/80' : 'text-gray-400'}`}>
                                  {episode.duration ? formatTime(episode.duration) : 'Unknown'}
                                </span>
                                {progress > 0 && (
                                  <>
                                    <span className={`${isPlaying ? 'text-white/60' : 'text-gray-500'}`}>•</span>
                                    <span className={`${progress > 90 ? 'text-green-400' : 'text-yellow-400'}`}>
                                      {Math.round(progress)}% watched
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Progress Bar */}
                              {progress > 0 && progress < 100 && (
                                <div className="mt-2 w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ${
                                      isPlaying 
                                        ? 'bg-white' 
                                        : progress > 90 
                                        ? 'bg-green-400' 
                                        : 'bg-purple-400'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Play Icon on Hover */}
                            {!isPlaying && isHovered && (
                              <PlayCircle className="w-6 h-6 text-purple-400 animate-fadeIn" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Similar Content Section for Series */}
              {similarContent.length > 0 && (
                <div className="pt-4 border-t border-white/10 animate-fadeIn">
                  <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-purple-400" />
                    Similar Series
                  </h4>
                  <div className="space-y-2">
                    {similarContent.slice(0, 3).map((item) => {
                      const thumbnailUrl = getThumbnailUrl(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSimilarContentSelect(item)}
                          className="w-full flex items-center gap-3 p-2 bg-white/5 hover:bg-white/15 rounded-lg transition-all duration-300 text-left group hover:scale-[1.02]"
                        >
                          <div className="w-16 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative group-hover:shadow-lg transition-shadow">
                            {thumbnailUrl ? (
                              <img 
                                src={thumbnailUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PlayCircle className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate text-white group-hover:text-purple-300 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.content_type === 'series' ? 'Series' : 'Movie'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Movie Content - Continue Watching
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Film className="w-5 h-5 text-purple-400" />
                  Continue Watching
                </h3>
              </div>
              
              {mainVideo && (
                <div className="space-y-3">
                  {/* Continue from saved time */}
                  {getContinueWatchingTime() > 0 && (
                    <button
                      onClick={handleContinueWatching}
                      className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/40 hover:to-blue-600/40 rounded-xl transition-all duration-300 text-white border border-purple-500/30 hover:border-purple-400 hover:scale-[1.02] group"
                    >
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-current" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold mb-1">Continue Watching</div>
                        <div className="text-sm text-gray-300">
                          From {formatTime(getContinueWatchingTime())}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Start over */}
                  <button
                    onClick={handleStartOver}
                    className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/15 rounded-xl transition-all duration-300 text-white hover:scale-[1.02] group"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold mb-1">Start Over</div>
                      <div className="text-sm text-gray-400">Watch from beginning</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Progress indicator */}
              {getContinueWatchingTime() > 0 && duration > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-purple-400 font-semibold">
                      {Math.round((getContinueWatchingTime() / duration) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 relative"
                      style={{ width: `${(getContinueWatchingTime() / duration) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Similar Content Section for Movies */}
              {similarContent.length > 0 && (
                <div className="pt-4 border-t border-white/10 animate-fadeIn">
                  <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-purple-400" />
                    Similar Movies
                  </h4>
                  <div className="space-y-2">
                    {similarContent.slice(0, 3).map((item) => {
                      const thumbnailUrl = getThumbnailUrl(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSimilarContentSelect(item)}
                          className="w-full flex items-center gap-3 p-2 bg-white/5 hover:bg-white/15 rounded-lg transition-all duration-300 text-left group hover:scale-[1.02]"
                        >
                          <div className="w-16 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative group-hover:shadow-lg transition-shadow">
                            {thumbnailUrl ? (
                              <img 
                                src={thumbnailUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                <Play className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PlayCircle className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate text-white group-hover:text-purple-300 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-400">
                              {item.content_type === 'series' ? 'Series' : 'Movie'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!mainVideo && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Film className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 text-sm">No video content available</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        /* Custom scrollbar styling */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.8);
        }
      `}</style>
    </div>
  );
};

export default EpisodeSelector;