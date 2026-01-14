// src/pages/Dashboards/viewer/content/components/TabContent/MediaTab.jsx
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Film, 
  Image, 
  Play, 
  Camera,
  Star,
  Clapperboard,
  Video,
  Images,
  Zap,
  X,
  User
} from 'lucide-react';

const MediaTab = ({ contentData }) => {
  const { t } = useTranslation();
  
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeCategory, setActiveCategory] = useState('trailers');
  const [modalLoaded, setModalLoaded] = useState(false);
  const [zoomTransform, setZoomTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [imageErrors, setImageErrors] = useState(new Set());
  const modalRef = useRef(null);

  // Filter out main videos and organize media by user-friendly categories
  const getMediaByCategory = () => {
    if (!contentData?.media_assets) return {};
    
    const media = contentData.media_assets.filter(asset => 
      asset.asset_type !== 'mainVideo' && asset.asset_type !== 'episodeVideo'
    );

    return {
      trailers: media.filter(asset => ['trailer', 'teaser', 'episodeTrailer'].includes(asset.asset_type)),
      behindScenes: media.filter(asset => asset.asset_type === 'behind_scenes'),
      posters: media.filter(asset => ['poster', 'season_poster', 'key_art'].includes(asset.asset_type)),
      photos: media.filter(asset => ['screenshot', 'thumbnail', 'episodeThumbnail'].includes(asset.asset_type))
    };
  };

  const mediaCategories = [
    {
      key: 'trailers',
      label: t('contentdetail.media.trailers', 'Trailers & Teasers'),
      icon: <Play className="w-5 h-5" />,
      description: t('contentdetail.media.trailersDescription', 'Watch previews and promotional videos')
    },
    {
      key: 'behindScenes',
      label: t('contentdetail.media.behindScenes', 'Behind the Scenes'),
      icon: <Camera className="w-5 h-5" />,
      description: t('contentdetail.media.behindScenesDescription', 'Exclusive making-of content')
    },
    {
      key: 'posters',
      label: t('contentdetail.media.posters', 'Posters & Artwork'),
      icon: <Images className="w-5 h-5" />,
      description: t('contentdetail.media.postersDescription', 'Official posters and key artwork')
    },
    {
      key: 'photos',
      label: t('contentdetail.media.photos', 'Photos & Stills'),
      icon: <Image className="w-5 h-5" />,
      description: t('contentdetail.media.photosDescription', 'Production stills and screenshots')
    }
  ].filter(cat => getMediaByCategory()[cat.key]?.length > 0);

  const getCategoryDisplayName = (category) => {
    const names = {
      'trailers': t('contentdetail.media.trailers', 'Trailers & Teasers'),
      'behindScenes': t('contentdetail.media.behindScenes', 'Behind the Scenes'),
      'posters': t('contentdetail.media.posters', 'Posters & Artwork'),
      'photos': t('contentdetail.media.photos', 'Photos & Stills')
    };
    return names[category] || category;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Generate placeholder based on asset type and content
  const generatePlaceholder = (asset, category) => {
    const isVideo = ['trailer', 'teaser', 'episodeTrailer', 'behind_scenes'].includes(asset.asset_type);
    const isPoster = ['poster', 'season_poster', 'key_art'].includes(asset.asset_type);
    
    const baseColor = '#BC8BBC';
    const accentColor = '#9B6B9B';
    
    if (isVideo) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-2xl">
            <Play className="w-8 h-8 text-white fill-current ml-1" />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-sm mb-1">
              {getCategoryDisplayName(category)}
            </div>
            <div className="text-gray-400 text-xs">
              {contentData?.title}
            </div>
          </div>
        </div>
      );
    }
    
    if (isPoster) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
          <Film className="w-12 h-12 text-[#BC8BBC] mb-3" />
          <div className="text-center">
            <div className="text-white font-semibold text-sm mb-1">
              {asset.asset_title || t('contentdetail.media.moviePoster', 'Movie Poster')}
            </div>
            <div className="text-gray-400 text-xs">
              {contentData?.title}
            </div>
          </div>
        </div>
      );
    }
    
    // Default placeholder for photos
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
        <Image className="w-12 h-12 text-[#BC8BBC] mb-3" />
        <div className="text-center">
          <div className="text-white font-semibold text-sm mb-1">
            {getCategoryDisplayName(category)}
          </div>
          <div className="text-gray-400 text-xs">
            {contentData?.title}
          </div>
        </div>
      </div>
    );
  };

  const handleImageError = (assetId) => {
    setImageErrors(prev => new Set(prev).add(assetId));
  };

  const isImageError = (assetId) => {
    return imageErrors.has(assetId);
  };

  const openMediaModal = (asset, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSelectedMedia({
      ...asset,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    });
    
    setTimeout(() => {
      setModalLoaded(true);
      setZoomTransform({ scale: 1, x: 0, y: 0 });
    }, 50);
  };

  const closeMediaModal = () => {
    setModalLoaded(false);
    setTimeout(() => {
      setSelectedMedia(null);
      setZoomTransform({ scale: 1, x: 0, y: 0 });
    }, 300);
  };

  const handleZoom = (event) => {
    if (!selectedMedia) return;
    
    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newScale = zoomTransform.scale === 1 ? 2 : 1;
    setZoomTransform({ 
      scale: newScale, 
      x: newScale === 2 ? (rect.width / 2 - x) * 0.5 : 0, 
      y: newScale === 2 ? (rect.height / 2 - y) * 0.5 : 0 
    });
  };

  const MediaCard = ({ asset, category, index }) => {
    const isVideo = ['trailer', 'teaser', 'episodeTrailer', 'behind_scenes'].includes(asset.asset_type);
    const isPoster = ['poster', 'season_poster', 'key_art'].includes(asset.asset_type);
    const assetId = asset.id || `asset-${category}-${index}`;
    const hasError = isImageError(assetId);
    
    return (
      <div 
        className="group relative bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-[#BC8BBC]/50 transition-all duration-300 cursor-pointer transform hover:scale-105 animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={(e) => openMediaModal(asset, e)}
      >
        {/* Media Thumbnail */}
        <div className={`${isPoster ? 'aspect-[2/3]' : 'aspect-video'} relative overflow-hidden bg-gray-800`}>
          {!hasError ? (
            <>
              <img
                src={asset.url}
                alt={asset.asset_title || t('contentdetail.media.mediaFrom', '{{category}} from {{title}}', { 
                  category: getCategoryDisplayName(category), 
                  title: contentData?.title 
                })}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={() => handleImageError(assetId)}
                loading="lazy"
              />
              
              {/* Video Play Button */}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#BC8BBC] rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-2xl opacity-90 group-hover:opacity-100">
                    <Play className="w-6 h-6 text-white fill-current ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : (
            generatePlaceholder(asset, category)
          )}
          
          {/* Duration Badge for Videos */}
          {isVideo && asset.duration_seconds && !hasError && (
            <div className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded transform transition-transform duration-300 group-hover:scale-110">
              {formatDuration(asset.duration_seconds)}
            </div>
          )}
          
          {/* Hover Overlay */}
          {!hasError && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium bg-black/70 px-2 py-1 rounded transform transition-transform duration-300 group-hover:scale-105">
                    {category === 'trailers' 
                      ? t('contentdetail.actions.watch', 'Watch')
                      : t('contentdetail.actions.view', 'View')
                    }
                  </span>
                  <Zap className="w-4 h-4 text-[#BC8BBC] transform transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Media Title */}
        <div className="p-4">
          <h4 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[#BC8BBC] transition-colors duration-300">
            {asset.asset_title || t('contentdetail.media.contentType', '{{category}} Content', { category: getCategoryDisplayName(category) })}
          </h4>
          
          {asset.asset_description && (
            <p className="text-gray-400 text-xs line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
              {asset.asset_description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const mediaData = getMediaByCategory();
  const currentMedia = mediaData[activeCategory] || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3 animate-slide-down">
          <Clapperboard className="w-8 h-8 text-[#BC8BBC] animate-pulse" />
          {t('contentdetail.sections.gallery', 'Gallery & Extras')}
        </h3>
        <p className="text-gray-400 text-lg animate-slide-up">
          {t('contentdetail.messages.discoverExclusive', 'Discover exclusive content from {{title}}', { title: contentData?.title })}
        </p>
      </div>

      {/* Category Navigation */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-slide-up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mediaCategories.map((category, index) => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`p-4 rounded-xl text-left transition-all duration-500 transform hover:scale-105 ${
                activeCategory === category.key
                  ? 'bg-[#BC8BBC] text-white shadow-lg scale-105 animate-pulse-subtle'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
              } animate-fade-in`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  activeCategory === category.key ? 'bg-white/20 scale-110' : 'bg-[#BC8BBC]/20'
                }`}>
                  {category.icon}
                </div>
                <span className="text-lg font-semibold">{category.label}</span>
              </div>
              <p className="text-sm opacity-80">
                {category.description}
              </p>
              <div className="mt-2 text-xs opacity-60">
                {t('contentdetail.metadata.itemsCount', '{{count}} items', { count: mediaData[category.key]?.length || 0 })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-slide-up">
        {currentMedia.length > 0 ? (
          <div className="space-y-6">
            {/* Category Header */}
            <div className="flex items-center justify-between animate-fade-in">
              <div>
                <h4 className="text-2xl font-bold text-white mb-2 animate-slide-right">
                  {getCategoryDisplayName(activeCategory)}
                </h4>
                <p className="text-gray-400 animate-slide-right" style={{ animationDelay: '100ms' }}>
                  {mediaCategories.find(cat => cat.key === activeCategory)?.description}
                </p>
              </div>
              <div className="text-[#BC8BBC] font-semibold animate-slide-left">
                {t('contentdetail.metadata.itemsCount', '{{count}} items', { count: currentMedia.length })}
              </div>
            </div>

            {/* Media Grid */}
            <div className={`grid gap-6 ${
              activeCategory === 'posters' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {currentMedia.map((asset, index) => (
                <MediaCard 
                  key={asset.id || index} 
                  asset={asset} 
                  category={activeCategory}
                  index={index}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <Image className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-bounce" />
            <h4 className="text-white text-lg font-semibold mb-2">
              {t('contentdetail.errors.noContentAvailable', 'No Content Available')}
            </h4>
            <p className="text-gray-400">
              {t('contentdetail.messages.checkBackLater', 'Check back later for exclusive {{category}}.', { 
                category: getCategoryDisplayName(activeCategory).toLowerCase() 
              })}
            </p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      {Object.values(mediaData).flat().length > 0 && (
        <div className="text-center animate-fade-in">
          <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 rounded-2xl border border-[#BC8BBC]/20 p-6 transform hover:scale-105 transition-all duration-500">
            <Star className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3 animate-spin-slow" />
            <h4 className="text-white font-semibold text-lg mb-2">
              {t('contentdetail.actions.exploreMore', 'Explore More')}
            </h4>
            <p className="text-gray-300">
              {t('contentdetail.messages.discoverAllExclusive', 'Discover all the exclusive content available for {{title}}', { title: contentData?.title })}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Media Modal with Zoom Animation */}
      {selectedMedia && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
            modalLoaded ? 'bg-black/90 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-0'
          }`}
          onClick={closeMediaModal}
        >
          <div 
            ref={modalRef}
            className={`relative bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 transition-all duration-500 ${
              modalLoaded 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-95'
            }`}
            style={{
              transform: `scale(${modalLoaded ? 1 : 0.95})`,
              transformOrigin: `${selectedMedia.position?.left + selectedMedia.position?.width / 2}px ${selectedMedia.position?.top + selectedMedia.position?.height / 2}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeMediaModal}
              className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 animate-pulse"
              title={t('contentdetail.actions.close', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Content */}
            <div className="relative">
              {['trailer', 'teaser', 'episodeTrailer'].includes(selectedMedia.asset_type) ? (
                <div className="aspect-video bg-black">
                  <video
                    src={selectedMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onError={() => {
                      // If video fails, show placeholder
                      const videoElement = document.querySelector('video');
                      if (videoElement) {
                        videoElement.style.display = 'none';
                      }
                    }}
                  />
                  {/* Video fallback placeholder */}
                  <div className="absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <Play className="w-10 h-10 text-white fill-current ml-1" />
                    </div>
                    <div className="text-white font-semibold text-lg">
                      {t('contentdetail.errors.videoNotAvailable', 'Video Not Available')}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      {t('contentdetail.actions.tryAgainLater', 'Try again later')}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="max-h-[70vh] overflow-hidden cursor-zoom-in"
                  onClick={handleZoom}
                >
                  {!isImageError(selectedMedia.id) ? (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.asset_title || t('contentdetail.media.mediaFromTitle', 'Media from {{title}}', { title: contentData?.title })}
                      className="w-full h-auto max-h-[70vh] object-contain transition-transform duration-500 ease-out"
                      style={{
                        transform: `scale(${zoomTransform.scale}) translate(${zoomTransform.x}px, ${zoomTransform.y}px)`
                      }}
                      onError={() => handleImageError(selectedMedia.id)}
                    />
                  ) : (
                    <div className="w-full h-96 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <Image className="w-16 h-16 text-[#BC8BBC] mb-4" />
                      <div className="text-white font-semibold text-lg">
                        {t('contentdetail.errors.imageNotAvailable', 'Image Not Available')}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {selectedMedia.asset_title || t('contentdetail.media.mediaContent', 'Media Content')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Media Info */}
            <div className="p-6 border-t border-white/10">
              <div className="space-y-3 animate-fade-in">
                <h3 className="text-xl font-bold text-white">
                  {selectedMedia.asset_title || t('contentdetail.media.exclusiveContent', 'Exclusive {{category}}', { 
                    category: getCategoryDisplayName(activeCategory).toLowerCase() 
                  })}
                </h3>
                
                {selectedMedia.asset_description && (
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {selectedMedia.asset_description}
                  </p>
                )}

                {/* Simple Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-400 pt-3 border-t border-white/10">
                  {selectedMedia.duration_seconds && (
                    <span className="flex items-center gap-1 animate-fade-in">
                      <Play className="w-4 h-4" />
                      {formatDuration(selectedMedia.duration_seconds)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <Clapperboard className="w-4 h-4" />
                    {getCategoryDisplayName(activeCategory)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaTab;