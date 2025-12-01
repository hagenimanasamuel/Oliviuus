import React, { useState } from "react";
import { 
  Play, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  Film,
  Tv,
  Radio,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PauseCircle,
  Image as ImageIcon
} from "lucide-react";

const ContentCard = ({ 
  content, 
  onEdit, 
  onDelete, 
  onView, 
  onPlay,
  isSelected = false,
  onSelect,
  showCheckbox = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Production image URL generator with proxy fallback
  const getPrimaryImage = () => {
    if (!content.media_assets || content.media_assets.length === 0) {
      return null;
    }

    // Priority order for image selection
    const assetTypes = [
      { type: 'thumbnail', primary: true },
      { type: 'thumbnail', primary: false },
      { type: 'poster', primary: true },
      { type: 'poster', primary: false }
    ];

    for (const { type, primary } of assetTypes) {
      const asset = content.media_assets.find(asset => 
        asset.asset_type === type && 
        asset.upload_status === 'completed' &&
        (primary ? asset.is_primary === 1 : true)
      );

      if (asset && asset.url) {
        // Use direct URL temporarily while setting up proxy
        return asset.url;
      }
    }

    return null;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'draft': return <PauseCircle className="w-3 h-3 text-yellow-500" />;
      case 'archived': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <AlertTriangle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'movie': return <Film className="w-4 h-4" />;
      case 'series': return <Tv className="w-4 h-4" />;
      case 'live_event': return <Radio className="w-4 h-4" />;
      default: return <Film className="w-4 h-4" />;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleImageError = (e) => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleCardClick = (e) => {
    // Don't trigger view if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('input')) {
      return;
    }
    onView?.(content);
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);
    action?.(content);
  };

  const imageUrl = getPrimaryImage();

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-[#BC8BBC]/30 hover:translate-y-[-2px] group cursor-pointer ${
        isSelected ? 'ring-2 ring-[#BC8BBC] border-[#BC8BBC]' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Checkbox for selection */}
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-20">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(content.id, e.target.checked);
            }}
            className="w-4 h-4 text-[#BC8BBC] bg-white border-gray-300 rounded focus:ring-[#BC8BBC] focus:ring-2"
          />
        </div>
      )}

      {/* Thumbnail Section - UPDATED FOR PROPER IMAGE FITTING */}
      <div className="relative aspect-[2/3] bg-gray-200 dark:bg-gray-700 overflow-hidden">
        {!imageError && imageUrl ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                  <div className="animate-pulse flex space-x-2 mb-2 justify-center">
                    <div className="w-2 h-2 bg-[#BC8BBC] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#BC8BBC] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#BC8BBC] rounded-full"></div>
                  </div>
                  <div className="text-xs text-[#BC8BBC]">Loading image...</div>
                </div>
              </div>
            )}
            <div className="w-full h-full">
              <img
                src={imageUrl}
                alt={content.title}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onError={handleImageError}
                onLoad={handleImageLoad}
                loading="lazy"
              />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-purple-600/10">
            <ImageIcon className="w-12 h-12 text-[#BC8BBC] mb-2" />
            <span className="text-xs text-[#BC8BBC] text-center px-2">
              {content.media_assets?.length > 0 ? 'Image unavailable' : 'No image uploaded'}
            </span>
            {content.media_assets?.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                {content.media_assets.length} media file{content.media_assets.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
        
        {/* Overlay with play button only */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => handleAction(e, onPlay)}
            className="p-4 bg-white/90 hover:bg-white text-gray-900 rounded-full transition-transform transform hover:scale-110 shadow-lg"
            title="Play content"
          >
            <Play className="w-6 h-6" fill="currentColor" />
          </button>
        </div>

        {/* Content Type Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 text-white rounded-full text-xs">
          {getContentTypeIcon(content.content_type)}
          <span className="capitalize">{content.content_type?.replace('_', ' ')}</span>
        </div>

        {/* Duration Badge */}
        {content.duration_minutes && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/70 text-white rounded-full text-xs">
            <Clock className="w-3 h-3" />
            {formatDuration(content.duration_minutes)}
          </div>
        )}

        {/* Upload Status Badge */}
        {content.media_assets?.some(asset => asset.upload_status === 'processing') && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Processing
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="p-4">
        {/* Title and Menu */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2 group-hover:text-[#BC8BBC] transition-colors">
            {content.title}
          </h3>
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                <button
                  onClick={(e) => handleAction(e, onView)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={(e) => handleAction(e, onEdit)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => handleAction(e, onDelete)}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {content.short_description || content.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2">
          {/* Status and Age Rating */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
              {getStatusIcon(content.status)}
              <span className="capitalize">{content.status}</span>
            </div>
            {content.age_rating && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {content.age_rating}
              </span>
            )}
          </div>

          {/* Release Date and Language */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(content.release_date)}</span>
            </div>
            <span>{content.primary_language?.toUpperCase()}</span>
          </div>

          {/* Genres */}
          {content.genres && content.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {content.genres.slice(0, 2).map((genre, index) => (
                <span
                  key={genre.id || index}
                  className="inline-block px-2 py-1 bg-[#BC8BBC]/10 text-[#BC8BBC] text-xs rounded-full"
                >
                  {genre.name}
                </span>
              ))}
              {content.genres.length > 2 && (
                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
                  +{content.genres.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Media Assets Count */}
          {content.media_assets && content.media_assets.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <ImageIcon className="w-3 h-3" />
              <span>{content.media_assets.length} media file{content.media_assets.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCard;