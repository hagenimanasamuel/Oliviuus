// components/EndScreen/EndScreen.jsx
import React, { useState, useEffect } from 'react';
import { Play, Clock, RotateCcw, SkipForward, Film, Tv, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EndScreen = ({ 
  content, 
  currentEpisode, 
  episodes, 
  onReplay, 
  onNextEpisode, 
  onNextContent,
  similarContent = [],
  isSeries 
}) => {
  const [countdown, setCountdown] = useState(10);
  const [autoPlayCancelled, setAutoPlayCancelled] = useState(false);
  const navigate = useNavigate();

  // Filter out the current content from similar content
  const filteredSimilarContent = similarContent.filter(item => 
    item.id !== content?.id
  );

  const nextEpisode = episodes && currentEpisode ? 
    episodes[episodes.findIndex(ep => ep.id === currentEpisode?.id) + 1] : null;

  // Use filtered similar content
  const nextContent = filteredSimilarContent[0] || null;

  useEffect(() => {
    if (countdown > 0 && !autoPlayCancelled && nextContent) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && nextContent && onNextContent && !autoPlayCancelled) {
      console.log('Auto-playing next content:', nextContent.title);
      onNextContent(nextContent);
    }
  }, [countdown, nextContent, onNextContent, autoPlayCancelled]);

  const handleContentSelect = (contentItem) => {
    console.log('Selected content:', contentItem.title);
    navigate(`/watch/${contentItem.id}`);
  };

  const handlePlayNow = () => {
    if (nextContent) {
      console.log('Playing now:', nextContent.title);
      onNextContent(nextContent);
    }
  };

  const handleSkipAutoPlay = () => {
    setAutoPlayCancelled(true);
    setCountdown(0);
  };

  const getContentTitle = () => {
    if (isSeries && currentEpisode) {
      return currentEpisode.title || `Episode ${episodes.findIndex(ep => ep.id === currentEpisode.id) + 1}`;
    }
    return content?.title || 'Content';
  };

  // Get thumbnail URL for content
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

  // If all content is watched, show professional message
  const allEpisodesWatched = isSeries && episodes && 
    episodes.every(episode => {
      const epId = episode.id || episode._id;
      const savedTime = localStorage.getItem(`video-player-time-${epId}`);
      const episodeDuration = episode.duration || 0;
      return savedTime && parseFloat(savedTime) >= episodeDuration * 0.9;
    });

  if (allEpisodesWatched && !nextEpisode) {
    return (
      <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto pt-20">
        <div className="w-full max-w-6xl mx-auto text-white">
          <div className="bg-gray-900/90 rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
            {/* Congratulations Section */}
            <div className="text-center mb-6 md:mb-8 lg:mb-10">
              <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-2xl md:text-3xl lg:text-4xl">🎉</span>
              </div>
              <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Congratulations!
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-2">
                You've completed watching all episodes of
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-purple-400 mb-4">
                "{content?.title}"
              </p>
              <p className="text-sm md:text-base text-gray-400">
                Visit us next moment to watch more amazing content!
              </p>
            </div>

            {/* Similar Content Grid */}
            {filteredSimilarContent.length > 0 && (
              <div className="mt-6 md:mt-8 lg:mt-10">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-center text-white">
                  Check Out These Similar {isSeries ? 'Series' : 'Movies'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
                  {filteredSimilarContent.slice(0, 5).map((item) => {
                    const thumbnailUrl = getThumbnailUrl(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleContentSelect(item)}
                        className="group text-left transition-all duration-300 hover:scale-105 focus:scale-105 focus:outline-none"
                      >
                        <div className="relative aspect-[2/3] bg-gray-800 rounded-lg md:rounded-xl overflow-hidden mb-2 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/20 transition-all duration-300">
                          {thumbnailUrl ? (
                            <img 
                              src={thumbnailUrl} 
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${thumbnailUrl ? 'hidden' : 'flex'}`}>
                            {item.content_type === 'series' ? (
                              <Tv className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                            ) : (
                              <Film className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-black/80 rounded-full p-1 md:p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Play className="w-2 h-2 md:w-3 md:h-3 text-white" />
                          </div>
                        </div>
                        <h4 className="text-xs md:text-sm font-semibold text-white truncate mb-1 group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">
                          {item.content_type === 'series' ? 'Series' : 'Movie'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Browse Button */}
            <div className="text-center mt-6 md:mt-8 lg:mt-10">
              <button
                onClick={() => navigate('/browse')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-base md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 w-full max-w-xs"
              >
                Browse All Content
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-start justify-center p-2 sm:p-3 md:p-4 lg:p-6 overflow-y-auto pt-16 md:pt-20">
      <div className="w-full max-w-4xl lg:max-w-6xl mx-auto text-white mt-4 md:mt-8">
        
        {/* Close Button for Mobile */}
        <div className="flex justify-end mb-4 md:hidden">
          <button
            onClick={onReplay}
            className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Container */}
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          
          {/* Main Actions Section */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent px-2">
              {isSeries && nextEpisode ? "Next Episode Starting Soon" : "You've Finished Watching"}
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-4 md:mb-6 px-2">
              {getContentTitle()}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-3 mb-6 md:mb-8 px-2">
              {/* Replay Button */}
              <button
                onClick={onReplay}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 py-3 md:px-6 md:py-4 rounded-xl text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105 w-full sm:w-auto justify-center shadow-lg hover:shadow-xl hover:shadow-purple-500/20 min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                Watch Again
              </button>

              {/* Next Episode Button (for series) */}
              {isSeries && nextEpisode && (
                <button
                  onClick={() => {
                    console.log('Playing next episode:', nextEpisode.title);
                    onNextEpisode(nextEpisode);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-4 py-3 md:px-6 md:py-4 rounded-xl text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105 w-full sm:w-auto justify-center shadow-lg hover:shadow-xl hover:shadow-green-500/20 min-h-[44px]"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5" />
                  Next Episode
                </button>
              )}
            </div>
          </div>

          {/* Up Next Section */}
          {nextContent && !autoPlayCancelled && (
            <div className="bg-gray-900/80 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 border border-gray-700/50 shadow-xl mx-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-2">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                  Up Next
                </h3>
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  <span className="text-base md:text-lg font-semibold text-white">
                    {countdown}s
                  </span>
                  <button
                    onClick={handleSkipAutoPlay}
                    className="text-gray-400 hover:text-white transition-colors text-sm bg-transparent hover:bg-gray-700 px-2 py-1 rounded ml-2"
                  >
                    Skip
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 lg:gap-6">
                {/* Thumbnail */}
                <div className="w-full md:w-32 lg:w-40 xl:w-48 h-32 md:h-40 lg:h-48 bg-gray-800 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
                  {getThumbnailUrl(nextContent) ? (
                    <img 
                      src={getThumbnailUrl(nextContent)} 
                      alt={nextContent.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${getThumbnailUrl(nextContent) ? 'hidden' : 'flex'}`}>
                    {nextContent.content_type === 'series' ? (
                      <Tv className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-400" />
                    ) : (
                      <Film className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {/* Content Info */}
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 text-white">
                    {nextContent.title}
                  </h4>
                  <p className="text-gray-300 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3 text-sm md:text-base">
                    {nextContent.description || 'No description available'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                    <button
                      onClick={handlePlayNow}
                      className="flex items-center gap-2 bg-white text-black px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto justify-center min-h-[44px] text-sm md:text-base"
                    >
                      <Play className="w-4 h-4 md:w-5 md:h-5" />
                      <span>Play Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* More Like This Grid */}
          {filteredSimilarContent.length > 0 && (
            <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 border border-gray-700/50 mx-2">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-4 md:mb-6 text-white text-center md:text-left">
                {isSeries ? "More Series Like This" : "More Movies Like This"}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
                {filteredSimilarContent.slice(0, 6).map((item, index) => {
                  const thumbnailUrl = getThumbnailUrl(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleContentSelect(item)}
                      className="group text-left transition-all duration-300 hover:scale-105 focus:scale-105 focus:outline-none"
                    >
                      <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-1 md:mb-2 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/20 transition-all duration-300">
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${thumbnailUrl ? 'hidden' : 'flex'}`}>
                          {item.content_type === 'series' ? (
                            <Tv className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                          ) : (
                            <Film className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-1 right-1 bg-black/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Play className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate mb-1 group-hover:text-purple-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {item.content_type === 'series' ? 'Series' : 'Movie'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Content Message */}
          {filteredSimilarContent.length === 0 && (
            <div className="text-center py-6 md:py-8 bg-gray-900/50 rounded-xl md:rounded-2xl border border-gray-700/50 mx-2">
              <Film className="w-12 h-12 md:w-16 md:h-16 text-gray-500 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-400 text-base md:text-lg mb-4 md:mb-6">
                Check back later for more amazing content!
              </p>
              <button
                onClick={() => navigate('/browse')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg min-h-[44px] text-sm md:text-base"
              >
                Browse All Content
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndScreen;