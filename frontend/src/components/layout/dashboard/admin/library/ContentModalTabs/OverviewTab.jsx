import React from "react";
import { 
  Calendar, 
  Clock, 
  Eye, 
  Users, 
  Star, 
  Tag, 
  Globe, 
  Film,
  Tv,
  Radio,
  AlertTriangle
} from "lucide-react";
import clsx from "clsx";

const OverviewTab = ({ content }) => {
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'series': return <Tv className="w-4 h-4" />;
      case 'live_event': return <Radio className="w-4 h-4" />;
      default: return <Film className="w-4 h-4" />;
    }
  };

  const stats = [
    {
      label: "Total Views",
      value: content.views || "0",
      icon: Eye,
      color: "text-blue-400"
    },
    {
      label: "Engagement Rate",
      value: "68%",
      icon: Users,
      color: "text-green-400"
    },
    {
      label: "Average Rating",
      value: "4.2/5.0",
      icon: Star,
      color: "text-yellow-400"
    },
    {
      label: "Completion Rate",
      value: "85%",
      icon: Clock,
      color: "text-purple-400"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Content Description */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Description</h3>
        <p className="text-gray-300 leading-relaxed">
          {content.description || "No description available."}
        </p>
      </div>

      {/* Key Stats */}
      <div>
        <h3 className="text-white font-semibold mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Content Details</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Release Date
              </span>
              <span className="text-white">{formatDate(content.release_date)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </span>
              <span className="text-white">{formatDuration(content.duration_minutes)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Primary Language
              </span>
              <span className="text-white uppercase">{content.primary_language || 'EN'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400 flex items-center gap-2">
                {getContentTypeIcon(content.content_type)}
                Content Type
              </span>
              <span className="text-white capitalize">{content.content_type?.replace('_', ' ')}</span>
            </div>

            {content.director && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Director</span>
                <span className="text-white">{content.director}</span>
              </div>
            )}

            {content.age_rating && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Age Rating</span>
                <span className="text-white">{content.age_rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Classification</h3>
          
          {/* Genres */}
          {content.genres && content.genres.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-400 text-sm mb-2">Genres</h4>
              <div className="flex flex-wrap gap-2">
                {content.genres.map((genre, index) => (
                  <span
                    key={genre.id || index}
                    className="inline-flex items-center px-3 py-1 bg-[#BC8BBC]/20 text-[#BC8BBC] rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {content.categories && content.categories.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-400 text-sm mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {content.categories.slice(0, 4).map((category, index) => (
                  <span
                    key={category.id || index}
                    className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ))}
                {content.categories.length > 4 && (
                  <span className="inline-flex items-center px-3 py-1 bg-gray-600 text-gray-300 rounded-full text-sm">
                    +{content.categories.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content Warnings */}
          {content.content_warnings && content.content_warnings.length > 0 && (
            <div>
              <h4 className="text-gray-400 text-sm mb-2">Content Warnings</h4>
              <div className="flex flex-wrap gap-2">
                {content.content_warnings.map((warning, index) => (
                  <span
                    key={warning.id || index}
                    className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm"
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {warning.warning_type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages & Subtitles */}
          {content.available_languages && content.available_languages.length > 0 && (
            <div className="mt-4">
              <h4 className="text-gray-400 text-sm mb-2">Available Languages</h4>
              <div className="flex flex-wrap gap-2">
                {content.available_languages.map((lang, index) => (
                  <span
                    key={lang.id || index}
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm",
                      lang.is_default 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-gray-600 text-gray-300"
                    )}
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    {lang.language_code.toUpperCase()}
                    {lang.is_default && (
                      <span className="ml-1 text-xs">(Default)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Series Specific Information */}
      {(content.content_type === 'series' && (content.total_seasons || content.episodes_per_season)) && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Series Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {content.total_seasons && (
              <div>
                <div className="text-gray-400 text-sm">Total Seasons</div>
                <div className="text-white font-semibold">{content.total_seasons}</div>
              </div>
            )}
            {content.episodes_per_season && (
              <div>
                <div className="text-gray-400 text-sm">Episodes per Season</div>
                <div className="text-white font-semibold">{content.episodes_per_season}</div>
              </div>
            )}
            {content.episode_duration_minutes && (
              <div>
                <div className="text-gray-400 text-sm">Episode Duration</div>
                <div className="text-white font-semibold">{formatDuration(content.episode_duration_minutes)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Event Specific Information */}
      {(content.content_type === 'live_event' && (content.event_date || content.event_location)) && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.event_date && (
              <div>
                <div className="text-gray-400 text-sm">Event Date</div>
                <div className="text-white font-semibold">{formatDate(content.event_date)}</div>
              </div>
            )}
            {content.event_location && (
              <div>
                <div className="text-gray-400 text-sm">Event Location</div>
                <div className="text-white font-semibold">{content.event_location}</div>
              </div>
            )}
            {content.expected_audience && (
              <div>
                <div className="text-gray-400 text-sm">Expected Audience</div>
                <div className="text-white font-semibold">{content.expected_audience.toLocaleString()}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;