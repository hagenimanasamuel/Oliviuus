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
  Crown,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader,
  ChevronDown,
  Edit,
  Tv,
  Clapperboard,
  FolderOpen,
  Filter,
  SortAsc,
  Grid,
  List,
  ExternalLink,
  Info,
  Save,
  XCircle,
  Settings,
  HardDrive,
  Monitor,
  Clock4,
  Type,
  FileText,
  Globe,
  Award,
  CheckSquare,
  Square
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";

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
  const [editForm, setEditForm] = useState({});
  const [uploadTime, setUploadTime] = useState({});
  const fileInputRefs = useRef({});

  // Asset categories organized by type : Proper mapping
  const assetCategories = {
    mainContent: {
      title: "Main Content",
      types: ['mainVideo'],
      icon: Film,
      color: 'from-blue-500 to-blue-600',
      accept: "video/*"
    },
    promotional: {
      title: "Promotional",
      types: ['trailer', 'teaser', 'behind_scenes'],
      icon: Clapperboard,
      color: 'from-purple-500 to-purple-600',
      accept: "video/*"
    },
    images: {
      title: "Images",
      types: ['thumbnail', 'poster', 'key_art', 'screenshot', 'season_poster'],
      icon: ImageIcon,
      color: 'from-green-500 to-green-600',
      accept: "image/*"
    },
    episodes: {
      title: "Episodes",
      types: ['episodeVideo', 'episodeThumbnail', 'episodeTrailer'],
      icon: Tv,
      color: 'from-orange-500 to-orange-600',
      accept: "video/*,image/*"
    }
  };

  const assetTypeConfig = {
    mainVideo: { icon: Film, color: 'text-blue-400 bg-blue-400/10', label: 'Main Video' },
    episodeVideo: { icon: Film, color: 'text-blue-400 bg-blue-400/10', label: 'Episode Video' },
    trailer: { icon: Video, color: 'text-purple-400 bg-purple-400/10', label: 'Trailer' },
    teaser: { icon: Video, color: 'text-purple-400 bg-purple-400/10', label: 'Teaser' },
    behind_scenes: { icon: Video, color: 'text-purple-400 bg-purple-400/10', label: 'Behind Scenes' },
    thumbnail: { icon: ImageIcon, color: 'text-green-400 bg-green-400/10', label: 'Thumbnail' },
    poster: { icon: ImageIcon, color: 'text-green-400 bg-green-400/10', label: 'Poster' },
    key_art: { icon: ImageIcon, color: 'text-green-400 bg-green-400/10', label: 'Key Art' },
    screenshot: { icon: ImageIcon, color: 'text-green-400 bg-green-400/10', label: 'Screenshot' },
    season_poster: { icon: ImageIcon, color: 'text-green-400 bg-green-400/10', label: 'Season Poster' },
    episodeThumbnail: { icon: ImageIcon, color: 'text-orange-400 bg-orange-400/10', label: 'Episode Thumbnail' },
    episodeTrailer: { icon: Video, color: 'text-orange-400 bg-orange-400/10', label: 'Episode Trailer' }
  };

  const getAssetTypeIcon = (type) => {
    const config = assetTypeConfig[type] || { icon: File };
    const IconComponent = config.icon;
    return <IconComponent className="w-3 h-3" />;
  };

  const getAssetTypeColor = (type) => {
    return assetTypeConfig[type]?.color || 'text-gray-400 bg-gray-400/10';
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Ready', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'processing':
        return { label: 'Processing', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'failed':
        return { label: 'Failed', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' };
      default:
        return { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
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
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Refresh media assets
  const refreshMediaAssets = async () => {
    try {
      if (onMediaUpdate) {
        await onMediaUpdate();
      }
    } catch (error) {
      console.error('Failed to refresh media assets:', error);
    }
  };

  // Start editing an asset
  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setEditForm({
      asset_title: asset.asset_title || '',
      asset_description: asset.asset_description || '',
      alt_text: asset.alt_text || '',
      caption: asset.caption || '',
      resolution: asset.resolution || '',
      duration_seconds: asset.duration_seconds || '',
      bitrate: asset.bitrate || '',
      format: asset.format || '',
      season_number: asset.season_number || '',
      episode_number: asset.episode_number || '',
      episode_title: asset.episode_title || '',
      episode_description: asset.episode_description || '',
      is_primary: asset.is_primary || false,
      is_optimized: asset.is_optimized || false,
      has_subtitles: asset.has_subtitles || false,
      subtitle_languages: asset.subtitle_languages 
        ? (() => {
            try {
              const parsed = JSON.parse(asset.subtitle_languages);
              return Array.isArray(parsed) ? parsed.join(', ') : '';
            } catch (e) {
              console.error('Error parsing subtitle_languages:', e);
              return '';
            }
          })()
        : ''
    });
  };

  // Save edited asset - FIXED: Correct API endpoint
  const handleSaveAsset = async () => {
    if (!editingAsset) return;

    try {
      const updatedAsset = {
        ...editingAsset,
        ...editForm,
        duration_seconds: editForm.duration_seconds ? parseInt(editForm.duration_seconds) : null,
        bitrate: editForm.bitrate ? parseInt(editForm.bitrate) : null,
        season_number: editForm.season_number ? parseInt(editForm.season_number) : null,
        episode_number: editForm.episode_number ? parseInt(editForm.episode_number) : null,
        subtitle_languages: editForm.subtitle_languages 
          ? JSON.stringify(
              editForm.subtitle_languages
                .split(',')
                .map(lang => lang.trim())
                .filter(lang => lang)
            )
          : JSON.stringify([])
      };

      // FIXED: Use correct API endpoint
      await api.put(`/contents/media/${editingAsset.id}`, updatedAsset);
      
      // Refresh media list
      await refreshMediaAssets();

      setEditingAsset(null);
      setEditForm({});
      alert('Asset updated successfully!');
    } catch (error) {
      console.error('Failed to update asset:', error);
      alert('Failed to update asset');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingAsset(null);
    setEditForm({});
  };

  // Set asset as primary - FIXED: Correct API endpoint
  const handleSetPrimary = async (assetId) => {
    try {
      await api.put(`/contents/media/${assetId}/primary`);
      await refreshMediaAssets();
      alert('Asset set as primary successfully!');
    } catch (error) {
      console.error('Failed to set primary asset:', error);
      alert('Failed to set primary asset');
    }
  };

  // Delete asset - FIXED: Correct API endpoint
  const handleDeleteAsset = async (assetId) => {
    if (window.confirm('Are you sure you want to delete this media asset? This will remove it from Cloudflare R2 as well.')) {
      try {
        await api.delete(`/contents/media/${assetId}`);
        await refreshMediaAssets();
        alert('Asset deleted successfully!');
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('Failed to delete asset');
      }
    }
  };

  // Upload file with progress tracking - FIXED: Proper category handling
  const handleFileUpload = async (event, categoryKey) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      const progressKey = `${file.name}-${Date.now()}`;
      const startTime = Date.now();
      
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      setUploadTime(prev => ({ ...prev, [progressKey]: startTime }));

      try {
        const category = assetCategories[categoryKey];
        const assetType = category.types[0]; // Use first type in category

        // Step 1: Generate upload URL
        const uploadResponse = await api.post('/upload/generate-url', {
          contentType: content.content_type,
          contentId: content.id,
          assetType: assetType,
          fileName: file.name,
          fileSize: file.size,
          seasonNumber: null,
          episodeNumber: null,
          metadata: {
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: `Uploaded ${new Date().toLocaleDateString()}`
          }
        });

        const { uploadUrl, key } = uploadResponse.data;

        // Step 2: Upload file to R2 with progress tracking
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(prev => ({ 
              ...prev, 
              [progressKey]: Math.round(percentComplete) 
            }));
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            // Step 3: Confirm upload completion
            await api.post('/upload/confirm', {
              key,
              contentId: content.id,
              assetType: assetType,
              metadata: {
                asset_title: file.name.replace(/\.[^/.]+$/, ""),
                asset_description: `Uploaded ${new Date().toLocaleDateString()}`
              }
            });

            // Remove from progress tracking
            setTimeout(() => {
              setUploadProgress(prev => {
                const { [progressKey]: removed, ...rest } = prev;
                return rest;
              });
              setUploadTime(prev => {
                const { [progressKey]: removed, ...rest } = prev;
                return rest;
              });
            }, 1000);

            // Refresh media list
            await refreshMediaAssets();
          } else {
            console.error('Upload failed:', xhr.statusText);
            setUploadProgress(prev => ({ 
              ...prev, 
              [progressKey]: -1
            }));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Upload error');
          setUploadProgress(prev => ({ 
            ...prev, 
            [progressKey]: -1
          }));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadProgress(prev => ({ 
          ...prev, 
          [progressKey]: -1
        }));
      }
    }

    setIsUploading(false);
    event.target.value = '';
  };

  // Calculate upload speed and time remaining
  const getUploadStats = (progressKey) => {
    const progress = uploadProgress[progressKey];
    const startTime = uploadTime[progressKey];
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    
    if (progress <= 0 || elapsedTime <= 0) return null;

    const uploadSpeed = progress / elapsedTime;
    const timeRemaining = (100 - progress) / uploadSpeed;

    return {
      speed: uploadSpeed,
      timeRemaining: timeRemaining,
      elapsedTime: elapsedTime
    };
  };

  // Group assets by season and episode for series content
  const getGroupedAssets = () => {
    if (content.content_type !== 'series') {
      return { standalone: content.media_assets || [] };
    }

    const grouped = { standalone: [] };
    
    (content.media_assets || []).forEach(asset => {
      if (asset.season_number !== null) {
        const seasonKey = `season-${asset.season_number}`;
        if (!grouped[seasonKey]) {
          grouped[seasonKey] = [];
        }
        grouped[seasonKey].push(asset);
      } else {
        grouped.standalone.push(asset);
      }
    });

    return grouped;
  };

  const groupedAssets = getGroupedAssets();

  // Filter and sort assets
  const filterAndSortAssets = (assets) => {
    if (!assets) return [];

    const filtered = assets.filter(asset => {
      const matchesSearch = asset.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.asset_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.asset_title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
                           (filterType === 'image' && ['thumbnail', 'poster', 'screenshot', 'key_art', 'season_poster', 'episodeThumbnail'].includes(asset.asset_type)) ||
                           (filterType === 'video' && ['trailer', 'mainVideo', 'episodeVideo', 'teaser', 'behind_scenes', 'episodeTrailer'].includes(asset.asset_type));
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.file_name?.localeCompare(b.file_name || '');
        case 'size': return (b.file_size || 0) - (a.file_size || 0);
        case 'date': return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'type': return a.asset_type?.localeCompare(b.asset_type || '');
        default: return 0;
      }
    });
  };

  const handleAssetSelect = (assetId) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handlePreview = (asset) => {
    setPreviewAsset(asset);
  };

  const handleDownload = (asset) => {
    if (asset.url) {
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = asset.file_name;
      link.click();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Edit Modal Component
  const EditAssetModal = ({ asset, onClose, onSave }) => {
    const handleInputChange = (field, value) => {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleCheckboxChange = (field, checked) => {
      setEditForm(prev => ({
        ...prev,
        [field]: checked
      }));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Edit className="w-5 h-5 text-[#BC8BBC]" />
              <div>
                <h3 className="text-white font-semibold">Edit Media Asset</h3>
                <p className="text-gray-400 text-sm">{asset.file_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Edit Form */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Basic Information
                </h4>
                
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Asset Title</label>
                  <input
                    type="text"
                    value={editForm.asset_title}
                    onChange={(e) => handleInputChange('asset_title', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                    placeholder="Enter asset title"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-2">Asset Description</label>
                  <textarea
                    value={editForm.asset_description}
                    onChange={(e) => handleInputChange('asset_description', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] resize-none"
                    rows="3"
                    placeholder="Enter asset description"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-2">Alt Text</label>
                  <input
                    type="text"
                    value={editForm.alt_text}
                    onChange={(e) => handleInputChange('alt_text', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                    placeholder="Enter alt text for accessibility"
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm block mb-2">Caption</label>
                  <textarea
                    value={editForm.caption}
                    onChange={(e) => handleInputChange('caption', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] resize-none"
                    rows="2"
                    placeholder="Enter caption"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editForm.is_primary}
                        onChange={(e) => handleCheckboxChange('is_primary', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={clsx(
                        "w-5 h-5 border-2 rounded transition-all",
                        editForm.is_primary
                          ? "bg-[#BC8BBC] border-[#BC8BBC]"
                          : "bg-gray-700 border-gray-600"
                      )}>
                        {editForm.is_primary && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-white text-sm">Set as Primary Asset</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editForm.is_optimized}
                        onChange={(e) => handleCheckboxChange('is_optimized', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={clsx(
                        "w-5 h-5 border-2 rounded transition-all",
                        editForm.is_optimized
                          ? "bg-green-500 border-green-500"
                          : "bg-gray-700 border-gray-600"
                      )}>
                        {editForm.is_optimized && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-white text-sm">Mark as Optimized</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editForm.has_subtitles}
                        onChange={(e) => handleCheckboxChange('has_subtitles', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={clsx(
                        "w-5 h-5 border-2 rounded transition-all",
                        editForm.has_subtitles
                          ? "bg-blue-500 border-blue-500"
                          : "bg-gray-700 border-gray-600"
                      )}>
                        {editForm.has_subtitles && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-white text-sm">Has Subtitles</span>
                  </label>
                </div>
              </div>

              {/* Right Column - Technical & Episode Info */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Technical Specifications
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Resolution</label>
                    <input
                      type="text"
                      value={editForm.resolution}
                      onChange={(e) => handleInputChange('resolution', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                      placeholder="e.g., 1920x1080"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      value={editForm.duration_seconds}
                      onChange={(e) => handleInputChange('duration_seconds', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                      placeholder="Duration in seconds"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Bitrate</label>
                    <input
                      type="number"
                      value={editForm.bitrate}
                      onChange={(e) => handleInputChange('bitrate', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                      placeholder="Bitrate in kbps"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Format</label>
                    <input
                      type="text"
                      value={editForm.format}
                      onChange={(e) => handleInputChange('format', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                      placeholder="e.g., MP4, JPEG"
                    />
                  </div>
                </div>

                {/* Episode Information */}
                {(asset.asset_type?.includes('episode') || content.content_type === 'series') && (
                  <>
                    <h4 className="text-white font-semibold flex items-center gap-2 mt-6">
                      <Tv className="w-4 h-4" />
                      Episode Information
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm block mb-2">Season Number</label>
                        <input
                          type="number"
                          value={editForm.season_number}
                          onChange={(e) => handleInputChange('season_number', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                          placeholder="Season number"
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm block mb-2">Episode Number</label>
                        <input
                          type="number"
                          value={editForm.episode_number}
                          onChange={(e) => handleInputChange('episode_number', e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                          placeholder="Episode number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm block mb-2">Episode Title</label>
                      <input
                        type="text"
                        value={editForm.episode_title}
                        onChange={(e) => handleInputChange('episode_title', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                        placeholder="Episode title"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm block mb-2">Episode Description</label>
                      <textarea
                        value={editForm.episode_description}
                        onChange={(e) => handleInputChange('episode_description', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] resize-none"
                        rows="3"
                        placeholder="Episode description"
                      />
                    </div>
                  </>
                )}

                {/* Subtitle Languages */}
                {editForm.has_subtitles && (
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Subtitle Languages</label>
                    <input
                      type="text"
                      value={editForm.subtitle_languages}
                      onChange={(e) => handleInputChange('subtitle_languages', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
                      placeholder="e.g., en, fr, es (comma separated)"
                    />
                    <p className="text-gray-500 text-xs mt-1">Enter language codes separated by commas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Simple Preview Modal
  const AssetPreviewModal = ({ asset, onClose }) => {
    const [activeTab, setActiveTab] = useState('preview');
    const [imageZoom, setImageZoom] = useState(1);
    const isVideo = ['trailer', 'mainVideo', 'episodeVideo', 'teaser', 'behind_scenes', 'episodeTrailer'].includes(asset.asset_type);
    const isImage = ['thumbnail', 'poster', 'key_art', 'screenshot', 'season_poster', 'episodeThumbnail'].includes(asset.asset_type);
    const statusConfig = getStatusConfig(asset.upload_status);

    const handleImageZoom = () => {
      setImageZoom(prev => prev === 1 ? 2 : 1);
    };

    const handleResetZoom = () => {
      setImageZoom(1);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={clsx("p-2 rounded-lg", getAssetTypeColor(asset.asset_type))}>
                {getAssetTypeIcon(asset.asset_type)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold text-sm truncate">
                  {asset.asset_title || asset.file_name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {assetTypeConfig[asset.asset_type]?.label} • {getFileSize(asset.file_size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditAsset(asset)}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                title="Edit Asset"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('preview')}
              className={clsx(
                "px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'preview'
                  ? "text-[#BC8BBC] border-[#BC8BBC]"
                  : "text-gray-400 border-transparent hover:text-gray-300"
              )}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={clsx(
                "px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'details'
                  ? "text-[#BC8BBC] border-[#BC8BBC]"
                  : "text-gray-400 border-transparent hover:text-gray-300"
              )}
            >
              Details
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'preview' ? (
              <div className="flex items-center justify-center min-h-[300px]">
                {isVideo && asset.url ? (
                  <div className="w-full max-w-2xl">
                    <video
                      src={asset.url}
                      controls
                      className="w-full rounded-lg"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : isImage && asset.url ? (
                  <div className="relative">
                    <img
                      src={asset.url}
                      alt={asset.alt_text || asset.file_name}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg cursor-zoom-in"
                      style={{ transform: `scale(${imageZoom})` }}
                      onClick={handleImageZoom}
                    />
                    {imageZoom > 1 && (
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={handleResetZoom}
                          className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(asset.url, '_blank')}
                          className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <File className="w-12 h-12 mx-auto mb-2" />
                    <p>Preview not available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400">File Name</label>
                    <p className="text-white">{asset.file_name}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Type</label>
                    <p className="text-white capitalize">{asset.asset_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Size</label>
                    <p className="text-white">{getFileSize(asset.file_size)}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Status</label>
                    <span className={clsx("px-2 py-1 rounded text-xs", statusConfig.bg, statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                
                {asset.asset_title && (
                  <div>
                    <label className="text-gray-400">Title</label>
                    <p className="text-white">{asset.asset_title}</p>
                  </div>
                )}
                
                {asset.asset_description && (
                  <div>
                    <label className="text-gray-400">Description</label>
                    <p className="text-white">{asset.asset_description}</p>
                  </div>
                )}

                {(asset.season_number !== null || asset.episode_number !== null) && (
                  <div className="grid grid-cols-2 gap-4">
                    {asset.season_number !== null && (
                      <div>
                        <label className="text-gray-400">Season</label>
                        <p className="text-white">{asset.season_number}</p>
                      </div>
                    )}
                    {asset.episode_number !== null && (
                      <div>
                        <label className="text-gray-400">Episode</label>
                        <p className="text-white">{asset.episode_number}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {asset.duration_seconds && (
                <span>{formatDuration(asset.duration_seconds)}</span>
              )}
              {asset.resolution && (
                <span>{asset.resolution}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetPrimary(asset.id)}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors"
              >
                Set Primary
              </button>
              <button
                onClick={() => handleDownload(asset)}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Download
              </button>
              <button
                onClick={() => handleDeleteAsset(asset.id)}
                className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Asset Card Component
  const AssetCard = ({ asset }) => {
    const statusConfig = getStatusConfig(asset.upload_status);
    const isVideo = ['trailer', 'mainVideo', 'episodeVideo', 'teaser', 'behind_scenes', 'episodeTrailer'].includes(asset.asset_type);
    const isImage = ['thumbnail', 'poster', 'key_art', 'screenshot', 'season_poster', 'episodeThumbnail'].includes(asset.asset_type);

    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-colors group">
        {/* Preview */}
        <div 
          className="aspect-video bg-gray-700 rounded mb-3 overflow-hidden relative cursor-pointer"
          onClick={() => handlePreview(asset)}
        >
          {isImage && asset.url ? (
            <img
              src={asset.url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : isVideo && asset.url ? (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-400" />
              {asset.duration_seconds && (
                <div className="absolute bottom-1 right-1 bg-black/80 text-white px-1 py-0.5 rounded text-xs">
                  {formatDuration(asset.duration_seconds)}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <File className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Eye className="w-6 h-6 text-white" />
          </div>

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditAsset(asset);
            }}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-white hover:bg-black/70"
            title="Edit Asset"
          >
            <Edit className="w-3 h-3" />
          </button>

          {/* Primary Badge */}
          {asset.is_primary && (
            <div className="absolute top-2 left-2">
              <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-sm font-medium truncate" title={asset.asset_title || asset.file_name}>
                {asset.asset_title || asset.file_name}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <span className={clsx("px-1.5 py-0.5 rounded text-xs", getAssetTypeColor(asset.asset_type))}>
                  {assetTypeConfig[asset.asset_type]?.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{getFileSize(asset.file_size)}</span>
            <span className={clsx("px-1.5 py-0.5 rounded", statusConfig.bg, statusConfig.color)}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Upload Progress Component
  const UploadProgress = () => {
    if (Object.keys(uploadProgress).length === 0) return null;

    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Uploading Files
        </h4>
        <div className="space-y-3">
          {Object.entries(uploadProgress).map(([key, progress]) => {
            const stats = getUploadStats(key);
            const fileName = key.split('-').slice(0, -1).join('-');
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm truncate flex-1 mr-2">{fileName}</span>
                  <span className={clsx(
                    "text-sm font-medium",
                    progress === -1 ? "text-red-400" : "text-blue-400"
                  )}>
                    {progress === -1 ? 'Failed' : `${progress}%`}
                  </span>
                </div>
                
                {progress > 0 && progress < 100 && stats && (
                  <div className="text-gray-400 text-xs flex justify-between">
                    <span>Time remaining: {Math.ceil(stats.timeRemaining)}s</span>
                    <span>Elapsed: {Math.ceil(stats.elapsedTime)}s</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={clsx(
                        "h-2 rounded-full transition-all duration-300",
                        progress === -1 
                          ? "bg-red-500" 
                          : progress === 100 
                          ? "bg-green-500" 
                          : "bg-gradient-to-r from-blue-500 to-purple-500"
                      )}
                      style={{ width: `${progress === -1 ? 100 : progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Season Section for Series
  const SeasonSection = ({ seasonKey, assets }) => {
    const seasonNumber = seasonKey.replace('season-', '');
    const isExpanded = expandedSections[seasonKey] !== false;
    const filteredAssets = filterAndSortAssets(assets);

    return (
      <div className="bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tv className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="text-white font-semibold">Season {seasonNumber}</h3>
                <p className="text-gray-400 text-sm">{filteredAssets.length} assets</p>
              </div>
            </div>
            <button
              onClick={() => toggleSection(seasonKey)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown className={clsx("w-4 h-4 transition-transform", isExpanded ? "rotate-180" : "")} />
            </button>
          </div>

          {isExpanded && filteredAssets.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAssets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Category Section
  const CategorySection = ({ categoryKey, category }) => {
    const isExpanded = expandedSections[categoryKey] !== false;
    const assets = filterAndSortAssets(
      (content.media_assets || []).filter(asset => 
        category.types.includes(asset.asset_type) && 
        asset.season_number === null
      )
    );

    return (
      <div className="bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx("p-2 rounded-lg bg-gradient-to-r", category.color)}>
                <category.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">{category.title}</h3>
                <p className="text-gray-400 text-sm">{assets.length} assets</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                disabled={isUploading}
                className="px-3 py-2 bg-[#BC8BBC] text-white rounded-lg text-sm hover:bg-[#9b69b2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => toggleSection(categoryKey)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className={clsx("w-4 h-4 transition-transform", isExpanded ? "rotate-180" : "")} />
              </button>
            </div>
          </div>

          {isExpanded && assets.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}

          {isExpanded && assets.length === 0 && (
            <div className="mt-4 text-center py-8 text-gray-400 text-sm">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No {category.title.toLowerCase()} assets yet</p>
              <p className="text-xs mt-1">Upload files to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
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

      {/* Edit Modal */}
      {editingAsset && (
        <EditAssetModal 
          asset={editingAsset}
          onClose={handleCancelEdit}
          onSave={handleSaveAsset}
        />
      )}

      {/* Header */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Media Assets</h2>
            <p className="text-gray-400 text-sm">
              {content.media_assets?.length || 0} total assets
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1.5 rounded transition-colors",
                  viewMode === 'grid' ? "bg-[#BC8BBC] text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-1.5 rounded transition-colors",
                  viewMode === 'list' ? "bg-[#BC8BBC] text-white" : "text-gray-400 hover:text-white"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] text-sm"
            />
          </div>

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#BC8BBC] appearance-none pr-10 text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#BC8BBC] appearance-none pr-10 text-sm"
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
        <UploadProgress />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Season Sections for Series */}
        {content.content_type === 'series' && Object.keys(groupedAssets)
          .filter(key => key !== 'standalone')
          .map(seasonKey => (
            <SeasonSection 
              key={seasonKey}
              seasonKey={seasonKey}
              assets={groupedAssets[seasonKey]}
            />
          ))
        }

        {/* Category Sections */}
        {Object.keys(assetCategories).map(categoryKey => (
          <CategorySection 
            key={categoryKey}
            categoryKey={categoryKey}
            category={assetCategories[categoryKey]}
          />
        ))}

        {/* Empty State */}
        {content.media_assets?.length === 0 && Object.keys(uploadProgress).length === 0 && (
          <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No Media Assets</h3>
            <p className="text-gray-400 mb-6 text-sm">Upload your first media file to get started</p>
            <button 
              onClick={() => fileInputRefs.current.images?.click()}
              className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors text-sm"
            >
              Upload Media
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaTab;