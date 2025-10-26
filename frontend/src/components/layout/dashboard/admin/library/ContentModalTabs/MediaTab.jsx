import React, { useState, useRef, useEffect } from "react";
import { 
  Download, 
  Eye, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Video,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Play,
  X,
  ZoomIn,
  RotateCw,
  Star,
  Film,
  Music,
  Captions,
  FileText,
  ExternalLink,
  Grid,
  List,
  Filter,
  SortAsc,
  Crown,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader,
  ChevronDown,
  FolderOpen,
  Edit,
  Tv,
  Clapperboard,
  Calendar,
  User,
  MapPin,
  Globe,
  Info,
  BarChart3,
  Settings,
  Tag,
  Clock4,
  HardDrive
} from "lucide-react";
import clsx from "clsx";

const MediaTab = ({ content, onMediaUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all');
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [editingAsset, setEditingAsset] = useState(null);
  const fileInputRefs = useRef({});

  // Professional asset categories based on your database schema
  const assetCategories = {
    mainContent: {
      title: "Main Content",
      description: "Primary video files and main content",
      types: ['mainVideo', 'episodeVideo'],
      icon: Film,
      color: 'from-blue-500 to-blue-600',
      accept: "video/*"
    },
    promotional: {
      title: "Promotional Media",
      description: "Trailers, teasers, and promotional content",
      types: ['trailer', 'teaser', 'behind_scenes'],
      icon: Clapperboard,
      color: 'from-purple-500 to-purple-600',
      accept: "video/*"
    },
    images: {
      title: "Images & Posters",
      description: "Thumbnails, posters, and key art",
      types: ['thumbnail', 'poster', 'key_art', 'screenshot', 'season_poster'],
      icon: ImageIcon,
      color: 'from-green-500 to-green-600',
      accept: "image/*"
    },
    episodes: {
      title: "Episode Media",
      description: "Episode-specific videos and thumbnails",
      types: ['episodeVideo', 'episodeThumbnail', 'episodeTrailer'],
      icon: Tv,
      color: 'from-orange-500 to-orange-600',
      accept: "video/*,image/*"
    }
  };

  const assetTypeConfig = {
    // Main Content
    mainVideo: { 
      icon: Film, 
      color: 'text-blue-400 bg-blue-400/10', 
      label: 'Main Video',
      category: 'mainContent'
    },
    episodeVideo: { 
      icon: Film, 
      color: 'text-blue-400 bg-blue-400/10', 
      label: 'Episode Video',
      category: 'mainContent'
    },
    
    // Promotional
    trailer: { 
      icon: Video, 
      color: 'text-purple-400 bg-purple-400/10', 
      label: 'Trailer',
      category: 'promotional'
    },
    teaser: { 
      icon: Video, 
      color: 'text-purple-400 bg-purple-400/10', 
      label: 'Teaser',
      category: 'promotional'
    },
    behind_scenes: { 
      icon: Video, 
      color: 'text-purple-400 bg-purple-400/10', 
      label: 'Behind Scenes',
      category: 'promotional'
    },
    
    // Images
    thumbnail: { 
      icon: ImageIcon, 
      color: 'text-green-400 bg-green-400/10', 
      label: 'Thumbnail',
      category: 'images'
    },
    poster: { 
      icon: ImageIcon, 
      color: 'text-green-400 bg-green-400/10', 
      label: 'Poster',
      category: 'images'
    },
    key_art: { 
      icon: ImageIcon, 
      color: 'text-green-400 bg-green-400/10', 
      label: 'Key Art',
      category: 'images'
    },
    screenshot: { 
      icon: ImageIcon, 
      color: 'text-green-400 bg-green-400/10', 
      label: 'Screenshot',
      category: 'images'
    },
    season_poster: { 
      icon: ImageIcon, 
      color: 'text-green-400 bg-green-400/10', 
      label: 'Season Poster',
      category: 'images'
    },
    
    // Episodes
    episodeThumbnail: { 
      icon: ImageIcon, 
      color: 'text-orange-400 bg-orange-400/10', 
      label: 'Episode Thumbnail',
      category: 'episodes'
    },
    episodeTrailer: { 
      icon: Video, 
      color: 'text-orange-400 bg-orange-400/10', 
      label: 'Episode Trailer',
      category: 'episodes'
    }
  };

  const getAssetTypeIcon = (type) => {
    const config = assetTypeConfig[type] || { icon: File };
    const IconComponent = config.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getAssetTypeColor = (type) => {
    return assetTypeConfig[type]?.color || 'text-gray-400 bg-gray-400/10';
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Ready', 
          icon: CheckCircle, 
          color: 'text-green-400', 
          bg: 'bg-green-400/10' 
        };
      case 'processing':
        return { 
          label: 'Processing', 
          icon: Clock, 
          color: 'text-blue-400', 
          bg: 'bg-blue-400/10' 
        };
      case 'failed':
        return { 
          label: 'Failed', 
          icon: AlertCircle, 
          color: 'text-red-400', 
          bg: 'bg-red-400/10' 
        };
      default:
        return { 
          label: 'Pending', 
          icon: Clock, 
          color: 'text-yellow-400', 
          bg: 'bg-yellow-400/10' 
        };
    }
  };

  const getFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and sort assets
  const filteredAssets = content.media_assets?.filter(asset => {
    const matchesSearch = asset.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'image' && ['thumbnail', 'poster', 'screenshot', 'key_art', 'season_poster'].includes(asset.asset_type)) ||
                         (filterType === 'video' && ['trailer', 'video', 'mainVideo', 'episodeVideo', 'teaser', 'behind_scenes'].includes(asset.asset_type)) ||
                         (filterType === 'audio' && ['audio', 'music'].includes(asset.asset_type)) ||
                         (filterType === 'document' && ['document', 'script'].includes(asset.asset_type));
    
    return matchesSearch && matchesFilter;
  }) || [];

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.file_name.localeCompare(b.file_name);
      case 'size':
        return (b.file_size || 0) - (a.file_size || 0);
      case 'date':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'type':
        return a.asset_type.localeCompare(b.asset_type);
      default:
        return 0;
    }
  });

  // Group assets by category
  const assetsByCategory = Object.keys(assetCategories).reduce((acc, categoryKey) => {
    const category = assetCategories[categoryKey];
    acc[categoryKey] = sortedAssets.filter(asset => 
      category.types.includes(asset.asset_type)
    );
    return acc;
  }, {});

  const handleAssetSelect = (assetId) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSelectAll = (categoryAssets) => {
    const allSelected = categoryAssets.every(asset => selectedAssets.includes(asset.id));
    if (allSelected) {
      setSelectedAssets(prev => prev.filter(id => !categoryAssets.map(a => a.id).includes(id)));
    } else {
      setSelectedAssets(prev => [...prev, ...categoryAssets.map(a => a.id).filter(id => !prev.includes(id))]);
    }
  };

  const handleDownload = (asset) => {
    if (asset.url) {
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = asset.file_name;
      link.click();
    }
  };

  const handleBulkDownload = () => {
    selectedAssets.forEach(assetId => {
      const asset = content.media_assets?.find(a => a.id === assetId);
      if (asset?.url) {
        const link = document.createElement('a');
        link.href = asset.url;
        link.download = asset.file_name;
        link.click();
      }
    });
  };

  const handlePreview = (asset) => {
    setPreviewAsset(asset);
  };

  const handleSetPrimary = async (assetId) => {
    console.log('Set primary asset:', assetId);
    // API call to set primary asset
  };

  const handleFileUpload = (event, category) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    
    files.forEach((file, index) => {
      const progressKey = `${file.name}-${index}`;
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev[progressKey] + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setUploadProgress(prev => {
                const { [progressKey]: removed, ...rest } = prev;
                return rest;
              });
            }, 1000);
          }
          return { ...prev, [progressKey]: newProgress };
        });
      }, 200);
    });

    event.target.value = '';
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
  };

  const handleSaveAsset = async (updatedAsset) => {
    console.log('Save asset:', updatedAsset);
    // API call to update asset
    setEditingAsset(null);
  };

  const handleDeleteAsset = (assetId) => {
    if (window.confirm('Are you sure you want to delete this media asset?')) {
      console.log('Delete asset:', assetId);
      // API call to delete asset
    }
  };

  const toggleSection = (category) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Enhanced Professional Preview Modal
  const AssetPreviewModal = ({ asset, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [imageZoom, setImageZoom] = useState(1);
    const [activeTab, setActiveTab] = useState('preview');
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const isVideo = ['trailer', 'video', 'mainVideo', 'episodeVideo', 'teaser', 'behind_scenes'].includes(asset.asset_type);
    const isImage = ['thumbnail', 'poster', 'key_art', 'screenshot', 'season_poster', 'episodeThumbnail'].includes(asset.asset_type);
    
    const statusConfig = getStatusConfig(asset.upload_status);
    const StatusIcon = statusConfig.icon;

    const handlePlayPause = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
      }
    };

    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
        setIsLoading(false);
      }
    };

    const handleSeek = (e) => {
      if (videoRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = percent * duration;
      }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleImageZoom = () => {
      setImageZoom(prev => prev === 1 ? 2 : 1);
    };

    const handleResetZoom = () => {
      setImageZoom(1);
    };

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          if (imageZoom > 1) {
            setImageZoom(1);
          } else {
            onClose();
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [imageZoom, onClose]);

    // Metadata Panel Component
    const MetadataPanel = () => (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">File Name</label>
              <p className="text-white font-medium">{asset.file_name}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Asset Type</label>
              <p className="text-white font-medium capitalize">{asset.asset_type?.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">File Size</label>
              <p className="text-white font-medium">{getFileSize(asset.file_size)}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">MIME Type</label>
              <p className="text-white font-medium">{asset.mime_type || 'N/A'}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Upload Status</label>
              <span className={clsx(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                statusConfig.bg,
                statusConfig.color
              )}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Created Date</label>
              <p className="text-white font-medium">{formatDate(asset.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Media Specifications */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-400" />
            Media Specifications
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {asset.resolution && (
              <div>
                <label className="text-gray-400 text-sm">Resolution</label>
                <p className="text-white font-medium">{asset.resolution}</p>
              </div>
            )}
            {asset.duration_seconds && (
              <div>
                <label className="text-gray-400 text-sm">Duration</label>
                <p className="text-white font-medium">{formatDuration(asset.duration_seconds)}</p>
              </div>
            )}
            {asset.bitrate && (
              <div>
                <label className="text-gray-400 text-sm">Bitrate</label>
                <p className="text-white font-medium">{Math.round(asset.bitrate / 1000)} kbps</p>
              </div>
            )}
            {asset.format && (
              <div>
                <label className="text-gray-400 text-sm">Format</label>
                <p className="text-white font-medium">{asset.format}</p>
              </div>
            )}
            {asset.is_optimized !== undefined && (
              <div>
                <label className="text-gray-400 text-sm">Optimized</label>
                <p className={clsx(
                  "font-medium",
                  asset.is_optimized ? "text-green-400" : "text-yellow-400"
                )}>
                  {asset.is_optimized ? 'Yes' : 'No'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Content Metadata */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            Content Metadata
          </h4>
          <div className="space-y-4">
            {asset.asset_title && (
              <div>
                <label className="text-gray-400 text-sm">Asset Title</label>
                <p className="text-white font-medium">{asset.asset_title}</p>
              </div>
            )}
            {asset.asset_description && (
              <div>
                <label className="text-gray-400 text-sm">Asset Description</label>
                <p className="text-white">{asset.asset_description}</p>
              </div>
            )}
            {asset.alt_text && (
              <div>
                <label className="text-gray-400 text-sm">Alt Text</label>
                <p className="text-white">{asset.alt_text}</p>
              </div>
            )}
            {asset.caption && (
              <div>
                <label className="text-gray-400 text-sm">Caption</label>
                <p className="text-white">{asset.caption}</p>
              </div>
            )}
          </div>
        </div>

        {/* Episode/Season Information */}
        {(asset.season_number !== null || asset.episode_number !== null) && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Tv className="w-5 h-5 text-orange-400" />
              Episode Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asset.season_number !== null && (
                <div>
                  <label className="text-gray-400 text-sm">Season Number</label>
                  <p className="text-white font-medium">Season {asset.season_number}</p>
                </div>
              )}
              {asset.episode_number !== null && (
                <div>
                  <label className="text-gray-400 text-sm">Episode Number</label>
                  <p className="text-white font-medium">Episode {asset.episode_number}</p>
                </div>
              )}
              {asset.episode_title && (
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-sm">Episode Title</label>
                  <p className="text-white font-medium">{asset.episode_title}</p>
                </div>
              )}
              {asset.episode_description && (
                <div className="md:col-span-2">
                  <label className="text-gray-400 text-sm">Episode Description</label>
                  <p className="text-white">{asset.episode_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Technical Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">Processing Progress</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${asset.processing_progress || 0}%` }}
                  />
                </div>
                <span className="text-white text-sm font-medium w-12">{asset.processing_progress || 0}%</span>
              </div>
            </div>
            {asset.has_subtitles && (
              <div>
                <label className="text-gray-400 text-sm">Subtitles</label>
                <p className="text-white font-medium">
                  {asset.subtitle_languages ? JSON.parse(asset.subtitle_languages).join(', ') : 'No subtitles'}
                </p>
              </div>
            )}
            {asset.validation_errors && (
              <div className="md:col-span-2">
                <label className="text-gray-400 text-sm">Validation Errors</label>
                <p className="text-red-400 text-sm">{JSON.stringify(asset.validation_errors)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
        <div 
          ref={containerRef}
          className={clsx(
            "relative bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col",
            isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-7xl max-h-[95vh]"
          )}
        >
          {/* Header - Always visible */}
          <div className="flex items-center justify-between p-6 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={clsx("p-3 rounded-xl", getAssetTypeColor(asset.asset_type))}>
                {getAssetTypeIcon(asset.asset_type)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-bold text-lg truncate">{asset.asset_title || asset.file_name}</h3>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className="text-gray-300 text-sm">
                    {getFileSize(asset.file_size)} • {assetTypeConfig[asset.asset_type]?.label}
                  </span>
                  {asset.is_primary && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      Primary
                    </span>
                  )}
                  {asset.resolution && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                      {asset.resolution}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-3 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="p-3 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-gray-700 bg-gray-900">
            <button
              onClick={() => setActiveTab('preview')}
              className={clsx(
                "px-6 py-4 font-medium transition-colors border-b-2",
                activeTab === 'preview'
                  ? "text-[#BC8BBC] border-[#BC8BBC]"
                  : "text-gray-400 border-transparent hover:text-gray-300"
              )}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={clsx(
                "px-6 py-4 font-medium transition-colors border-b-2",
                activeTab === 'metadata'
                  ? "text-[#BC8BBC] border-[#BC8BBC]"
                  : "text-gray-400 border-transparent hover:text-gray-300"
              )}
            >
              Metadata
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'preview' ? (
              <div className="relative flex items-center justify-center p-6 min-h-[400px]">
                {isLoading && !hasError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <Loader className="w-8 h-8 text-[#BC8BBC] animate-spin mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">Loading preview...</p>
                    </div>
                  </div>
                )}

                {hasError && (
                  <div className="text-center p-8">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-white text-xl font-semibold mb-2">Preview Unavailable</h3>
                    <p className="text-gray-400 mb-6">
                      Unable to load the preview for this file.
                    </p>
                    <button
                      onClick={() => handleDownload(asset)}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors mx-auto"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                  </div>
                )}

                {isVideo && !hasError && (
                  <div className="relative w-full h-full max-h-[70vh] bg-black rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      src={asset.url}
                      className="w-full h-full object-contain"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onError={handleError}
                      muted={isMuted}
                      controls={false}
                      preload="metadata"
                      playsInline
                    />
                    
                    {/* Custom Video Controls */}
                    <div className="absolute bottom-6 left-6 right-6 bg-black/90 rounded-xl p-4 backdrop-blur-sm border border-gray-700">
                      {/* Progress Bar */}
                      <div 
                        className="w-full bg-gray-600 rounded-full h-2 mb-4 cursor-pointer group"
                        onClick={handleSeek}
                      >
                        <div 
                          className="bg-[#BC8BBC] h-2 rounded-full transition-all duration-100 relative group-hover:bg-[#9b69b2]"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={handlePlayPause}
                            className="p-3 bg-[#BC8BBC] rounded-full text-white hover:bg-[#9b69b2] transition-colors shadow-lg"
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </button>
                          
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors"
                          >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                          </button>

                          <span className="text-white text-sm font-medium bg-gray-800 px-3 py-1 rounded-lg">
                            {formatDuration(currentTime)} / {formatDuration(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">
                            {asset.resolution || 'HD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isImage && !hasError && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="max-w-full max-h-full overflow-auto bg-gray-800 rounded-xl p-4">
                      <img
                        src={asset.url}
                        alt={asset.alt_text || asset.file_name}
                        className="max-w-full max-h-full object-scale-down transition-transform duration-300 rounded-lg"
                        style={{ 
                          transform: `scale(${imageZoom})`,
                          cursor: imageZoom > 1 ? 'grab' : 'zoom-in'
                        }}
                        onLoad={() => setIsLoading(false)}
                        onError={handleError}
                        onClick={handleImageZoom}
                        loading="eager"
                      />
                    </div>
                    
                    {/* Image Controls */}
                    <div className="absolute bottom-6 right-6 flex gap-3">
                      {imageZoom > 1 && (
                        <button
                          onClick={handleResetZoom}
                          className="p-3 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-colors backdrop-blur-sm border border-gray-600"
                        >
                          <RotateCw className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={handleImageZoom}
                        className="p-3 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-colors backdrop-blur-sm border border-gray-600"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => window.open(asset.url, '_blank')}
                        className="p-3 bg-gray-800 rounded-xl text-white hover:bg-gray-700 transition-colors backdrop-blur-sm border border-gray-600"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {!isVideo && !isImage && !hasError && (
                  <div className="text-center p-8 max-w-md">
                    <File className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white text-xl font-semibold mb-2">{asset.file_name}</h3>
                    <p className="text-gray-400 mb-6">
                      Preview not available for this file type.
                    </p>
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => handleDownload(asset)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <MetadataPanel />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-900 border-t border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
                  statusConfig.bg,
                  statusConfig.color
                )}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </span>
                
                {asset.duration_seconds && (
                  <span className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm flex items-center gap-2">
                    <Clock4 className="w-4 h-4" />
                    {formatDuration(asset.duration_seconds)}
                  </span>
                )}
                
                {asset.bitrate && (
                  <span className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    {Math.round(asset.bitrate / 1000)}kbps
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditAsset(asset)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                
                <button
                  onClick={() => handleSetPrimary(asset.id)}
                  disabled={asset.is_primary}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    asset.is_primary
                      ? "bg-yellow-500 text-white cursor-not-allowed"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  )}
                >
                  <Star className="w-4 h-4" />
                  {asset.is_primary ? 'Primary' : 'Set Primary'}
                </button>
                
                <button
                  onClick={() => handleDownload(asset)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Asset Card Component
  const AssetCard = ({ asset }) => {
    const statusConfig = getStatusConfig(asset.upload_status);
    const StatusIcon = statusConfig.icon;
    const isVideo = ['trailer', 'video', 'mainVideo', 'episodeVideo', 'teaser', 'behind_scenes'].includes(asset.asset_type);
    const isImage = ['thumbnail', 'poster', 'key_art', 'screenshot', 'season_poster', 'episodeThumbnail'].includes(asset.asset_type);

    return (
      <div
        className={clsx(
          "group relative bg-gray-800/50 border-2 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
          selectedAssets.includes(asset.id)
            ? "border-[#BC8BBC] bg-[#BC8BBC]/10 shadow-lg"
            : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/70"
        )}
      >
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={selectedAssets.includes(asset.id)}
          onChange={() => handleAssetSelect(asset.id)}
          className="absolute top-3 right-3 w-5 h-5 text-[#BC8BBC] bg-gray-900 border-gray-600 rounded focus:ring-[#BC8BBC] focus:ring-2 z-10"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Primary Badge */}
        {asset.is_primary && (
          <div className="absolute top-3 left-3 z-10">
            <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-lg" />
          </div>
        )}

        {/* Asset Preview */}
        <div 
          className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg mb-4 overflow-hidden relative cursor-pointer group/preview"
          onClick={() => handlePreview(asset)}
        >
          {isImage && asset.url ? (
            <>
              <img
                src={asset.url}
                alt={asset.alt_text || asset.file_name}
                className="w-full h-full object-scale-down bg-gray-800 transition-transform duration-500 group-hover/preview:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
                <ZoomIn className="w-8 h-8 text-white transform group-hover/preview:scale-110 transition-transform" />
              </div>
            </>
          ) : isVideo && asset.url ? (
            <>
              <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                <Video className="w-12 h-12 text-gray-400" />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/preview:opacity-100">
                <Play className="w-12 h-12 text-white fill-white transform group-hover/preview:scale-110 transition-transform" />
              </div>
              {asset.duration_seconds && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                  {formatDuration(asset.duration_seconds)}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              {getAssetTypeIcon(asset.asset_type)}
              <span className="text-gray-400 text-xs mt-2 text-center">No Preview Available</span>
            </div>
          )}
        </div>

        {/* Asset Info */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate text-sm mb-1" title={asset.asset_title || asset.file_name}>
                {asset.asset_title || asset.file_name}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getAssetTypeColor(asset.asset_type)
                )}>
                  {assetTypeConfig[asset.asset_type]?.label}
                </span>
                {asset.resolution && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                    {asset.resolution}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{getFileSize(asset.file_size)}</span>
            <span className={clsx(
              "flex items-center gap-1 px-2 py-1 rounded-full",
              statusConfig.bg,
              statusConfig.color
            )}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pt-3 border-t border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePreview(asset);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(asset);
              }}
              disabled={asset.upload_status !== 'completed'}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditAsset(asset);
              }}
              className="p-2 text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Edit Asset"
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Category Section Component
  const CategorySection = ({ categoryKey, category }) => {
    const isExpanded = expandedSections[categoryKey] !== false;
    const IconComponent = category.icon;
    const assets = assetsByCategory[categoryKey] || [];

    return (
      <div className="bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={clsx("p-4 rounded-2xl bg-gradient-to-r", category.color)}>
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">{category.title}</h3>
                <p className="text-gray-400 mt-1">{category.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Individual Upload Button for this Category */}
              <input
                type="file"
                ref={el => fileInputRefs.current[categoryKey] = el}
                onChange={(e) => handleFileUpload(e, categoryKey)}
                accept={category.accept}
                multiple
                className="hidden"
              />
              
              <button 
                onClick={() => fileInputRefs.current[categoryKey]?.click()}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white rounded-xl hover:from-[#9b69b2] hover:to-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={isUploading}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Upload {category.title}</span>
              </button>

              <button
                onClick={() => toggleSection(categoryKey)}
                className="p-3 bg-gray-700 rounded-xl text-gray-300 hover:bg-gray-600 transition-colors"
              >
                <ChevronDown className={clsx(
                  "w-5 h-5 transition-transform duration-300",
                  isExpanded ? "rotate-180" : ""
                )} />
              </button>
            </div>
          </div>

          {isExpanded && (
            <>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-gray-400">
                  {assets.length} file{assets.length !== 1 ? 's' : ''}
                  {assets.some(a => a.is_primary) && (
                    <span className="ml-3 text-yellow-400">• Contains primary asset</span>
                  )}
                </div>
                
                {assets.length > 0 && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleSelectAll(assets)}
                      className="text-[#BC8BBC] hover:text-[#9b69b2] font-medium transition-colors duration-200 text-sm"
                    >
                      {assets.every(asset => selectedAssets.includes(asset.id)) 
                        ? 'Deselect All' 
                        : 'Select All'
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Assets Grid */}
              {assets.length > 0 ? (
                <div className={clsx(
                  "gap-6",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    : "space-y-4"
                )}>
                  {assets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-2xl">
                  <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-2">No {category.title} Yet</h4>
                  <p className="text-gray-400 mb-6">Upload your first {category.title.toLowerCase()} to get started</p>
                  <button 
                    onClick={() => fileInputRefs.current[categoryKey]?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white rounded-xl hover:from-[#9b69b2] hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4" />
                    Upload {category.title}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      {Object.keys(assetCategories).map(categoryKey => (
        <input
          key={categoryKey}
          type="file"
          ref={el => fileInputRefs.current[categoryKey] = el}
          onChange={(e) => handleFileUpload(e, categoryKey)}
          accept={assetCategories[categoryKey].accept}
          multiple
          className="hidden"
        />
      ))}

      {/* Preview Modal */}
      {previewAsset && (
        <AssetPreviewModal 
          asset={previewAsset} 
          onClose={() => setPreviewAsset(null)} 
        />
      )}

      {/* Professional Header */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Title and Stats */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-xl">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">Media Management</h2>
              <p className="text-gray-400">
                {content.media_assets?.length || 0} total assets • {selectedAssets.length} selected
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-900 rounded-xl p-1 border border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-2 rounded-lg transition-all duration-200",
                  viewMode === 'grid' 
                    ? "bg-[#BC8BBC] text-white shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-2 rounded-lg transition-all duration-200",
                  viewMode === 'list' 
                    ? "bg-[#BC8BBC] text-white shadow-lg" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedAssets.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDownload}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download ({selectedAssets.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search media files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 appearance-none pr-10 transition-all duration-200"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 appearance-none pr-10 transition-all duration-200"
            >
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="date">Sort by Date</option>
              <option value="type">Sort by Type</option>
            </select>
            <SortAsc className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-600">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Uploading Files
            </h4>
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <div key={key} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300 shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-gray-300 text-sm font-medium w-12">{progress}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Sections */}
      <div className="space-y-6">
        {Object.keys(assetCategories).map(categoryKey => (
          <CategorySection 
            key={categoryKey}
            categoryKey={categoryKey}
            category={assetCategories[categoryKey]}
          />
        ))}
      </div>

      {/* Empty State */}
      {content.media_assets?.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Film className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-white text-2xl font-bold mb-3">No Media Assets Yet</h3>
            <p className="text-gray-400 mb-8 text-lg">
              Start by uploading your first media file to enhance your content
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {Object.keys(assetCategories).map(categoryKey => (
                <button 
                  key={categoryKey}
                  onClick={() => fileInputRefs.current[categoryKey]?.click()}
                  className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white rounded-2xl hover:from-[#9b69b2] hover:to-purple-500 transition-all duration-300 shadow-2xl hover:shadow-3xl font-semibold"
                >
                  <Upload className="w-5 h-5" />
                  Upload {assetCategories[categoryKey].title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaTab;