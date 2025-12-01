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
  AlertTriangle,
  Building,
  DollarSign,
  MapPin,
  Trophy,
  TrendingUp,
  Heart,
  Share2,
  Users as UsersIcon,
  Award,
  Video,
  CheckCircle,
  XCircle
} from "lucide-react";
import clsx from "clsx";

const OverviewTab = ({ content, stats }) => {
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'series': return <Tv className="w-4 h-4" />;
      case 'live_event': return <Radio className="w-4 h-4" />;
      case 'documentary': return <Video className="w-4 h-4" />;
      case 'short_film': return <Film className="w-4 h-4" />;
      default: return <Film className="w-4 h-4" />;
    }
  };

  // Real stats from backend data - FIXED: Handle null/undefined values
  const realStats = [
    {
      label: "Total Views",
      value: formatNumber(content.view_count || 0),
      icon: Eye,
      color: "text-blue-400",
      description: "Total view count"
    },
    {
      label: "Likes",
      value: formatNumber(content.like_count || 0),
      icon: Heart,
      color: "text-red-400",
      description: "Total likes received"
    },
    {
      label: "Shares",
      value: formatNumber(content.share_count || 0),
      icon: Share2,
      color: "text-green-400",
      description: "Total shares"
    },
    {
      label: "Average Rating",
      value: content.average_rating && typeof content.average_rating === 'number' 
        ? `${content.average_rating.toFixed(1)}/5.0` 
        : "N/A",
      icon: Star,
      color: "text-yellow-400",
      description: `${formatNumber(content.rating_count || 0)} ratings`
    },
    {
      label: "Cast & Crew",
      value: formatNumber(content.cast_crew?.length || 0),
      icon: UsersIcon,
      color: "text-purple-400",
      description: "Total people involved"
    },
    {
      label: "Awards",
      value: formatNumber(content.awards?.length || 0),
      icon: Award,
      color: "text-orange-400",
      description: "Awards & nominations"
    }
  ];

  // Content quality indicators
  const qualityIndicators = [
    {
      label: "Content Quality",
      value: content.content_quality || 'HD',
      icon: Video,
      color: "text-blue-400"
    },
    {
      label: "Subtitles",
      value: content.has_subtitles ? "Available" : "Not Available",
      icon: CheckCircle,
      color: content.has_subtitles ? "text-green-400" : "text-gray-400"
    },
    {
      label: "Dubbing",
      value: content.has_dubbing ? "Available" : "Not Available",
      icon: Users,
      color: content.has_dubbing ? "text-green-400" : "text-gray-400"
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
        {content.short_description && content.short_description !== content.description && (
          <div className="mt-3">
            <h4 className="text-gray-400 text-sm mb-2">Short Description</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {content.short_description}
            </p>
          </div>
        )}
      </div>

      {/* Performance Stats */}
      <div>
        <h3 className="text-white font-semibold mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {realStats.map((stat, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
              <div className="text-gray-500 text-xs">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Basic Information</h3>
          
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
              <span className="text-white capitalize">{content.content_type?.replace(/_/g, ' ')}</span>
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

            {/* Production Details */}
            {content.production_company && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Production Company
                </span>
                <span className="text-white">{content.production_company}</span>
              </div>
            )}

            {content.budget && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Budget
                </span>
                <span className="text-white">{formatCurrency(content.budget)}</span>
              </div>
            )}

            {content.subject && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Subject</span>
                <span className="text-white">{content.subject}</span>
              </div>
            )}

            {content.location && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </span>
                <span className="text-white">{content.location}</span>
              </div>
            )}

            {content.festival && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Festival
                </span>
                <span className="text-white">{content.festival}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Classification */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Classification & Quality</h3>
          
          {/* Genres */}
          {content.genres && content.genres.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-400 text-sm mb-2">Genres</h4>
              <div className="flex flex-wrap gap-2">
                {content.genres.map((genre, index) => (
                  <span
                    key={genre.id || index}
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm",
                      genre.is_primary 
                        ? "bg-[#BC8BBC]/20 text-[#BC8BBC] border border-[#BC8BBC]/30"
                        : "bg-gray-600/50 text-gray-300"
                    )}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {genre.name}
                    {genre.is_primary && (
                      <span className="ml-1 text-xs">(Primary)</span>
                    )}
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
                {content.categories.map((category, index) => (
                  <span
                    key={category.id || index}
                    className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content Warnings */}
          {content.content_warnings && content.content_warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-400 text-sm mb-2">Content Warnings</h4>
              <div className="flex flex-wrap gap-2">
                {content.content_warnings.map((warning, index) => (
                  <span
                    key={warning.id || index}
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full text-sm",
                      warning.severity === 'strong' 
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : warning.severity === 'moderate'
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    )}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {warning.warning_type}
                    <span className="ml-1 text-xs capitalize">({warning.severity})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quality Indicators */}
          <div className="mb-4">
            <h4 className="text-gray-400 text-sm mb-2">Technical Quality</h4>
            <div className="space-y-2">
              {qualityIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-gray-300 text-sm flex items-center gap-2">
                    <indicator.icon className={`w-4 h-4 ${indicator.color}`} />
                    {indicator.label}
                  </span>
                  <span className={`text-sm font-medium ${indicator.color}`}>
                    {indicator.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Languages & Subtitles */}
          {content.available_languages && content.available_languages.length > 0 && (
            <div>
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

        {/* Right Column - Status & Publishing */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold">Status & Publishing</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Status</span>
              <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                content.status === 'published' 
                  ? "bg-green-500/20 text-green-300"
                  : content.status === 'draft'
                  ? "bg-yellow-500/20 text-yellow-300"
                  : content.status === 'archived'
                  ? "bg-red-500/20 text-red-300"
                  : "bg-gray-500/20 text-gray-300"
              )}>
                {content.status?.charAt(0).toUpperCase() + content.status?.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Visibility</span>
              <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                content.visibility === 'public'
                  ? "bg-green-500/20 text-green-300"
                  : content.visibility === 'private'
                  ? "bg-red-500/20 text-red-300"
                  : "bg-yellow-500/20 text-yellow-300"
              )}>
                {content.visibility?.charAt(0).toUpperCase() + content.visibility?.slice(1)}
              </span>
            </div>

            {content.published_at && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Published Date</span>
                <span className="text-white text-sm">{formatDateTime(content.published_at)}</span>
              </div>
            )}

            {content.scheduled_publish_at && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Scheduled Publish</span>
                <span className="text-white text-sm">{formatDateTime(content.scheduled_publish_at)}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Featured
              </span>
              <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                content.featured
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-gray-500/20 text-gray-300"
              )}>
                {content.featured ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </span>
              <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                content.trending
                  ? "bg-orange-500/20 text-orange-300"
                  : "bg-gray-500/20 text-gray-300"
              )}>
                {content.trending ? "Yes" : "No"}
              </span>
            </div>

            {content.featured_order > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-400">Featured Order</span>
                <span className="text-white">#{content.featured_order}</span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Created</span>
              <span className="text-white text-sm">{formatDateTime(content.created_at)}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-700">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white text-sm">{formatDateTime(content.updated_at)}</span>
            </div>
          </div>

          {/* SEO Information */}
          {(content.meta_title || content.meta_description || content.keywords) && (
            <div className="mt-4">
              <h4 className="text-gray-400 text-sm mb-2">SEO Information</h4>
              <div className="space-y-2">
                {content.meta_title && (
                  <div>
                    <div className="text-gray-300 text-xs">Meta Title</div>
                    <div className="text-white text-sm truncate">{content.meta_title}</div>
                  </div>
                )}
                {content.meta_description && (
                  <div>
                    <div className="text-gray-300 text-xs">Meta Description</div>
                    <div className="text-white text-sm line-clamp-2">{content.meta_description}</div>
                  </div>
                )}
                {content.keywords && (
                  <div>
                    <div className="text-gray-300 text-xs">Keywords</div>
                    <div className="text-white text-sm">
                      {Array.isArray(content.keywords) 
                        ? content.keywords.slice(0, 5).join(', ') 
                        : content.keywords}
                    </div>
                  </div>
                )}
                {content.canonical_url && (
                  <div>
                    <div className="text-gray-300 text-xs">Canonical URL</div>
                    <div className="text-white text-sm truncate">{content.canonical_url}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Series Specific Information */}
      {(content.content_type === 'series' && (content.total_seasons || content.episodes_per_season || content.seasons)) && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Series Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {content.total_seasons && (
              <div>
                <div className="text-gray-400 text-sm">Total Seasons</div>
                <div className="text-white font-semibold text-xl">{content.total_seasons}</div>
              </div>
            )}
            {content.episodes_per_season && (
              <div>
                <div className="text-gray-400 text-sm">Episodes per Season</div>
                <div className="text-white font-semibold text-xl">{content.episodes_per_season}</div>
              </div>
            )}
            {content.episode_duration_minutes && (
              <div>
                <div className="text-gray-400 text-sm">Episode Duration</div>
                <div className="text-white font-semibold">{formatDuration(content.episode_duration_minutes)}</div>
              </div>
            )}
            {content.seasons && (
              <div>
                <div className="text-gray-400 text-sm">Total Episodes</div>
                <div className="text-white font-semibold text-xl">
                  {content.seasons.reduce((total, season) => total + (season.episodes?.length || 0), 0)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Event Specific Information */}
      {(content.content_type === 'live_event' && (content.event_date || content.event_location || content.expected_audience)) && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Event Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.event_date && (
              <div>
                <div className="text-gray-400 text-sm">Event Date & Time</div>
                <div className="text-white font-semibold">{formatDateTime(content.event_date)}</div>
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
                <div className="text-white font-semibold text-xl">{formatNumber(content.expected_audience)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;