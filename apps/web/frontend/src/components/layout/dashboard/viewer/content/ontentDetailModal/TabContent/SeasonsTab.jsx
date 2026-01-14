// src/pages/Dashboards/viewer/content/components/TabContent/SeasonsTab.jsx
import React, { useState } from 'react';
import { Play, ChevronDown, ChevronUp } from 'lucide-react';

const SeasonsTab = ({ contentData }) => {
  const [expandedSeasons, setExpandedSeasons] = useState(new Set());

  const getSeasons = () => {
    return contentData?.seasons || [];
  };

  const toggleSeason = (seasonIndex) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonIndex)) {
      newExpanded.delete(seasonIndex);
    } else {
      newExpanded.add(seasonIndex);
    }
    setExpandedSeasons(newExpanded);
  };

  // Get episode thumbnail with smart fallbacks
  const getEpisodeThumbnail = (episode, season) => {
    // 1. Try episode thumbnail from media_assets
    if (episode.episode_thumbnail_url) {
      return episode.episode_thumbnail_url;
    }

    // 2. Look for episode thumbnail in media_assets table
    const episodeThumbnail = contentData?.media_assets?.find(asset =>
      asset.season_number === season.season_number &&
      asset.episode_number === episode.episode_number &&
      asset.asset_type === 'episodeThumbnail'
    );
    if (episodeThumbnail?.url) {
      return episodeThumbnail.url;
    }

    // 3. Look for any episode image (screenshot, thumbnail, etc.)
    const episodeImage = contentData?.media_assets?.find(asset =>
      asset.season_number === season.season_number &&
      asset.episode_number === episode.episode_number &&
      (asset.asset_type === 'screenshot' || asset.asset_type === 'thumbnail')
    );
    if (episodeImage?.url) {
      return episodeImage.url;
    }

    // 4. Fallback to season poster
    if (season.season_poster_url) {
      return season.season_poster_url;
    }

    // 5. Final fallback to content poster
    if (contentData.primary_image_url) {
      return contentData.primary_image_url;
    }

    // 6. Ultimate fallback
    return '/api/placeholder/300/169';
  };

  // Get episode title from media_assets or use default
  const getEpisodeTitle = (episode, season) => {
    if (episode.title && episode.title !== `Episode ${episode.episode_number}`) {
      return episode.title;
    }

    // Look for episode title in media_assets
    const episodeAsset = contentData?.media_assets?.find(asset =>
      asset.season_number === season.season_number &&
      asset.episode_number === episode.episode_number &&
      asset.episode_title
    );

    return episodeAsset?.episode_title || `Episode ${episode.episode_number}`;
  };

  // Get episode description from media_assets or use default
  const getEpisodeDescription = (episode, season) => {
    if (episode.description) {
      return episode.description;
    }

    // Look for episode description in media_assets
    const episodeAsset = contentData?.media_assets?.find(asset =>
      asset.season_number === season.season_number &&
      asset.episode_number === episode.episode_number &&
      asset.episode_description
    );

    return episodeAsset?.episode_description || 'No description available.';
  };

  const seasons = getSeasons();

  // Movie content component
  const MovieContent = () => (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Play className="w-12 h-12 text-white fill-current" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">Featured Movie</h3>
      <p className="text-gray-300 text-lg max-w-md mx-auto">
        Enjoy "{contentData?.title}" as a complete cinematic experience.
      </p>
    </div>
  );

  // Empty state for series with no seasons
  const EmptySeriesState = () => (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <Play className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">Coming Soon</h3>
      <p className="text-gray-400 text-lg">
        Episodes for "{contentData?.title}" will be available soon.
      </p>
    </div>
  );

  // If no content data
  if (!contentData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  // If it's a movie
  if (contentData.content_type === 'movie') {
    return (
      <div>
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-white">Movie</h3>
          <p className="text-gray-400 mt-2">Complete feature film</p>
        </div>
        <MovieContent />
      </div>
    );
  }

  // If it's a series but no seasons
  if (contentData.content_type === 'series' && seasons.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-white">Episodes</h3>
          <p className="text-gray-400 mt-2">Series content</p>
        </div>
        <EmptySeriesState />
      </div>
    );
  }

  // Show seasons for series content
  return (
    <div>
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-white">Episodes</h3>
        <p className="text-gray-400 mt-2">
          {seasons.length} season{seasons.length !== 1 ? 's' : ''} • {seasons.reduce((total, season) => total + (season.episodes?.length || 0), 0)} episodes
        </p>
      </div>

      <div className="space-y-6">
        {seasons.map((season, seasonIndex) => {
          const isSeasonExpanded = expandedSeasons.has(seasonIndex);
          const episodeCount = season.episodes?.length || 0;

          return (
            <div key={season.id || seasonIndex} className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
              {/* Season Header */}
              <div
                className="p-6 lg:p-8 cursor-pointer hover:bg-gray-700/40 transition-all duration-300"
                onClick={() => toggleSeason(seasonIndex)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl lg:text-2xl font-bold text-white mb-2">
                      {season.title || `Season ${season.season_number}`}
                    </h4>
                    <div className="flex items-center gap-4 text-gray-300">
                      <span className="bg-gray-700/50 px-3 py-1 rounded-full text-sm">
                        {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
                      </span>
                      {season.release_date && (
                        <span className="text-sm">
                          {new Date(season.release_date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isSeasonExpanded ? (
                      <ChevronUp className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Episodes List */}
              {isSeasonExpanded && season.episodes && season.episodes.length > 0 && (
                <div className="border-t border-gray-700/50 bg-gray-900/30">
                  <div className="p-6 lg:p-8">
                    <div className="space-y-6">
                      {season.episodes.map((episode, epIndex) => {
                        const episodeTitle = episode.title || `Episode ${episode.episode_number}`;
                        const episodeDescription = episode.description; // This will be null if no data

                        return (
                          <div key={episode.id || epIndex} className="flex gap-6 p-6 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300">
                            {/* Episode Thumbnail */}
                            <div className="flex-shrink-0">
                              <div className="relative group">
                                <img
                                  src={getEpisodeThumbnail(episode, season)}
                                  alt={episodeTitle}
                                  className="w-32 h-20 lg:w-40 lg:h-24 object-cover rounded-lg shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                                  <button className="bg-[#BC8BBC] hover:bg-[#a87ba8] text-white p-3 rounded-full transition-colors">
                                    <Play className="w-5 h-5 fill-current" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Episode Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-semibold text-lg lg:text-xl mb-2">
                                    {episode.episode_number}. {episodeTitle}
                                  </h5>

                                  {/* Only show description if it exists */}
                                  {episodeDescription && (
                                    <p className="text-gray-300 leading-relaxed line-clamp-3">
                                      {episodeDescription}
                                    </p>
                                  )}
                                </div>

                                <div className="flex-shrink-0 ml-4">
                                  <button className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#a87ba8] hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg">
                                    <Play className="w-4 h-4 fill-current" />
                                    Play
                                  </button>
                                </div>
                              </div>

                              {/* Episode Metadata */}
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                {episode.duration_minutes && (
                                  <span>{Math.floor(episode.duration_minutes / 60)}h {episode.duration_minutes % 60}m</span>
                                )}
                                {episode.release_date && (
                                  <span>{new Date(episode.release_date).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SeasonsTab;