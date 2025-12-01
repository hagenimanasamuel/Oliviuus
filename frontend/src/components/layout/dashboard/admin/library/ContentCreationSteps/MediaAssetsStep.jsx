import React, { useState } from "react";
import {
  Upload, X, Image, Video, Film, CheckCircle, AlertCircle, FileText,
  Plus, Tv, Calendar, Clock, FolderOpen, List, Grid, Settings,
  Play, Pause, Edit, Trash2, Eye, Download, Share2, Info, ChevronDown, ChevronUp,
  Type, Languages
} from "lucide-react";
import clsx from "clsx";

const CONTENT_TYPE_MEDIA_CONFIG = {
  movie: {
    title: "Movie Media Assets",
    description: "Upload high-quality media files and promotional materials for your movie.",
    assets: {
      required: [
        {
          field: 'thumbnail',
          label: 'Thumbnail Image',
          description: 'Primary preview image (16:9, 320x180px min)',
          type: 'image',
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'poster',
          label: 'Poster Image',
          description: 'Promotional poster (2:3, 1000x1500px min)',
          type: 'image',
          maxSize: 10,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'mainVideo',
          label: 'Main Video File',
          description: 'Complete movie file (MP4, MOV, up to 4GB)',
          type: 'video',
          maxSize: 4096,
          hasDescription: true,
          hasTitle: true,
          hasSubtitles: true
        }
      ],
      recommended: [
        {
          field: 'trailer',
          label: 'Trailer Video',
          description: 'Promotional trailer (under 3 minutes)',
          type: 'video',
          maxSize: 500,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'behindScenes',
          label: 'Behind the Scenes',
          description: 'Making-of content',
          type: 'video',
          maxSize: 500,
          hasDescription: true,
          hasTitle: true
        }
      ],
      optional: [
        {
          field: 'screenshots',
          label: 'Screenshots',
          description: 'Key scenes from the movie',
          type: 'image-multiple',
          count: 8,
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        }
      ]
    }
  },
  series: {
    title: "Series Media Assets",
    description: "Upload series promotional materials and manage episode content with seasons.",
    assets: {
      required: [
        {
          field: 'thumbnail',
          label: 'Series Thumbnail',
          description: 'Series preview image (16:9, 320x180px min)',
          type: 'image',
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'poster',
          label: 'Series Poster',
          description: 'Main promotional poster (2:3, 1000x1500px min)',
          type: 'image',
          maxSize: 10,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'seasonPosters',
          label: 'Season Posters',
          description: 'Individual season posters',
          type: 'image-multiple',
          count: 10,
          maxSize: 10,
          hasDescription: true,
          hasTitle: true
        }
      ],
      recommended: [
        {
          field: 'trailer',
          label: 'Series Trailer',
          description: 'Main series trailer',
          type: 'video',
          maxSize: 500,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'teaser',
          label: 'Teaser Trailer',
          description: 'Short teaser video',
          type: 'video',
          maxSize: 200,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'keyArt',
          label: 'Key Art',
          description: 'Additional promotional artwork',
          type: 'image-multiple',
          count: 5,
          maxSize: 8,
          hasDescription: true,
          hasTitle: true
        }
      ],
      optional: [
        {
          field: 'behindScenes',
          label: 'Behind the Scenes',
          description: 'Making-of and interviews',
          type: 'video-multiple',
          count: 10,
          maxSize: 500,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'bloopers',
          label: 'Bloopers & Extras',
          description: 'Additional content',
          type: 'video-multiple',
          count: 5,
          maxSize: 300,
          hasDescription: true,
          hasTitle: true
        }
      ]
    },
    episodes: {
      required: [
        {
          field: 'episodeVideo',
          label: 'Episode Video',
          description: 'Main episode file',
          type: 'video',
          maxSize: 2048,
          hasDescription: true,
          hasTitle: true,
          hasSubtitles: true
        },
        {
          field: 'episodeThumbnail',
          label: 'Episode Thumbnail',
          description: 'Episode preview image',
          type: 'image',
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        }
      ],
      recommended: [
        {
          field: 'episodeTrailer',
          label: 'Episode Preview',
          description: 'Short episode preview',
          type: 'video',
          maxSize: 100,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'subtitles',
          label: 'Subtitles',
          description: 'Multi-language subtitle files',
          type: 'subtitle-multiple',
          languages: ['en', 'rw', 'fr', 'sw'],
          hasDescription: false,
          hasTitle: false
        }
      ]
    }
  },
  documentary: {
    title: "Documentary Media Assets",
    description: "Upload documentary files and supporting materials.",
    assets: {
      required: [
        {
          field: 'thumbnail',
          label: 'Thumbnail Image',
          description: 'Documentary preview image',
          type: 'image',
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'mainVideo',
          label: 'Documentary Video',
          description: 'Complete documentary file',
          type: 'video',
          maxSize: 4096,
          hasDescription: true,
          hasTitle: true,
          hasSubtitles: true
        }
      ],
      recommended: [
        {
          field: 'poster',
          label: 'Poster Image',
          description: 'Promotional poster',
          type: 'image',
          maxSize: 10,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'trailer',
          label: 'Trailer Video',
          description: 'Documentary trailer',
          type: 'video',
          maxSize: 500,
          hasDescription: true,
          hasTitle: true
        }
      ],
      optional: [
        {
          field: 'screenshots',
          label: 'Key Moments',
          description: 'Important documentary scenes',
          type: 'image-multiple',
          count: 6,
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'interviewClips',
          label: 'Interview Clips',
          description: 'Additional interview footage',
          type: 'video-multiple',
          count: 5,
          maxSize: 300,
          hasDescription: true,
          hasTitle: true
        }
      ]
    }
  },
  short_film: {
    title: "Short Film Media Assets",
    description: "Upload short film files and promotional materials.",
    assets: {
      required: [
        {
          field: 'thumbnail',
          label: 'Thumbnail Image',
          description: 'Short film preview image',
          type: 'image',
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'mainVideo',
          label: 'Short Film Video',
          description: 'Complete short film file',
          type: 'video',
          maxSize: 2048,
          hasDescription: true,
          hasTitle: true,
          hasSubtitles: true
        }
      ],
      recommended: [
        {
          field: 'poster',
          label: 'Poster Image',
          description: 'Promotional poster',
          type: 'image',
          maxSize: 10,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'trailer',
          label: 'Trailer Video',
          description: 'Short film trailer',
          type: 'video',
          maxSize: 200,
          hasDescription: true,
          hasTitle: true
        }
      ],
      optional: [
        {
          field: 'screenshots',
          label: 'Key Scenes',
          description: 'Important film moments',
          type: 'image-multiple',
          count: 4,
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        }
      ]
    }
  },
  live_event: {
    title: "Live Event Media Assets",
    description: "Upload promotional materials for your live streaming event.",
    assets: {
      required: [
        {
          field: 'thumbnail',
          label: 'Event Thumbnail',
          description: 'Event preview image',
          type: 'image',
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'poster',
          label: 'Event Poster',
          description: 'Promotional poster',
          type: 'image',
          maxSize: 10,
          hasDescription: true,
          hasTitle: true
        }
      ],
      recommended: [
        {
          field: 'trailer',
          label: 'Event Trailer',
          description: 'Promotional video',
          type: 'video',
          maxSize: 300,
          hasDescription: true,
          hasTitle: true
        },
        {
          field: 'teaser',
          label: 'Teaser Video',
          description: 'Short teaser content',
          type: 'video',
          maxSize: 100,
          hasDescription: true,
          hasTitle: true
        }
      ],
      optional: [
        {
          field: 'promoImages',
          label: 'Promotional Images',
          description: 'Additional event images',
          type: 'image-multiple',
          count: 6,
          maxSize: 5,
          hasDescription: true,
          hasTitle: true
        }
      ]
    }
  }
};

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  'image-multiple': Grid,
  'video-multiple': Film,
  'subtitle-multiple': FileText
};

const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/mov', 'video/avi'],
  subtitle: ['text/vtt', 'application/x-subrip']
};

const LANGUAGE_NAMES = {
  en: 'English',
  rw: 'Kinyarwanda',
  fr: 'French',
  sw: 'Swahili',
  es: 'Spanish',
  de: 'German'
};

// Episode Manager Component
const EpisodeManager = ({ formData, updateFormData, config, selectedSeason, setSelectedSeason, fileErrors, setFileErrors, validateFile, FileUpload }) => {
  const seasons = formData.seasons || [];
  const currentSeason = seasons.find(s => s.id === selectedSeason);
  const episodes = currentSeason?.episodes || [];

  const addSeason = () => {
    const newSeasonId = (formData.seasons?.length || 0) + 1;
    const newSeasons = [...(formData.seasons || []), {
      id: newSeasonId,
      name: `Season ${newSeasonId}`,
      episodeCount: 0,
      episodes: []
    }];
    updateFormData({ seasons: newSeasons });
    setSelectedSeason(newSeasonId);
  };

  const addEpisode = (seasonId) => {
    const seasons = formData.seasons || [];
    const seasonIndex = seasons.findIndex(s => s.id === seasonId);
    if (seasonIndex !== -1) {
      const season = seasons[seasonIndex];
      const newEpisodeId = (season.episodes?.length || 0) + 1;
      const updatedSeasons = [...seasons];
      updatedSeasons[seasonIndex] = {
        ...season,
        episodeCount: newEpisodeId,
        episodes: [...(season.episodes || []), {
          id: newEpisodeId,
          title: `Episode ${newEpisodeId}`,
          description: ''
        }]
      };
      updateFormData({ seasons: updatedSeasons });
    }
  };

  const updateEpisodeMetadata = (seasonId, episodeId, updates) => {
    const updatedSeasons = [...(formData.seasons || [])];
    const seasonIndex = updatedSeasons.findIndex(s => s.id === seasonId);
    if (seasonIndex !== -1) {
      const episodeIndex = updatedSeasons[seasonIndex].episodes.findIndex(ep => ep.id === episodeId);
      if (episodeIndex !== -1) {
        updatedSeasons[seasonIndex].episodes[episodeIndex] = {
          ...updatedSeasons[seasonIndex].episodes[episodeIndex],
          ...updates
        };
        updateFormData({ seasons: updatedSeasons });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Season Navigation */}
      <div className="space-y-3">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Season Management</h4>
          <button
            onClick={() => addEpisode(selectedSeason)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#BC8BBC] text-white rounded hover:bg-[#9b69b2] transition-colors text-xs w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Episode</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {seasons.map(season => (
            <button
              key={season.id}
              onClick={() => setSelectedSeason(season.id)}
              className={clsx(
                "px-2.5 py-1.5 rounded border transition-all duration-200 text-xs",
                selectedSeason === season.id
                  ? "border-[#BC8BBC] bg-[#BC8BBC]/10 text-[#BC8BBC] font-medium"
                  : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-[#BC8BBC]"
              )}
            >
              {season.name}
            </button>
          ))}
          <button
            onClick={addSeason}
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-500 hover:text-[#BC8BBC] hover:border-[#BC8BBC] transition-colors text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Episodes Grid */}
      {episodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {episodes.map(episode => (
            <div key={episode.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              {/* Episode Header with Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={episode.title || `Episode ${episode.id}`}
                      onChange={(e) => updateEpisodeMetadata(selectedSeason, episode.id, { title: e.target.value })}
                      className="w-full text-sm font-semibold bg-transparent border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#BC8BBC] text-gray-900 dark:text-white placeholder-gray-500"
                      placeholder="Episode title"
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Edit className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={episode.description || ''}
                  onChange={(e) => updateEpisodeMetadata(selectedSeason, episode.id, { description: e.target.value })}
                  placeholder="Add episode description..."
                  rows={2}
                  className="w-full text-xs bg-transparent border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#BC8BBC] text-gray-600 dark:text-gray-400 resize-none"
                />

                <p className="text-xs text-gray-500 dark:text-gray-400">S{selectedSeason} • E{episode.id}</p>
              </div>

              {/* Episode Media Uploads */}
              <div className="space-y-2">
                {config.episodes.required.map(asset => (
                  <FileUpload
                    key={asset.field}
                    field={asset.field}
                    label={asset.label}
                    description={asset.description}
                    type={asset.type}
                    maxSize={asset.maxSize}
                    required={true}
                    episodeId={episode.id}
                    seasonId={selectedSeason}
                    hasDescription={asset.hasDescription}
                    hasTitle={asset.hasTitle}
                    hasSubtitles={asset.hasSubtitles}
                    formData={formData}
                    updateFormData={updateFormData}
                    fileErrors={fileErrors}
                    setFileErrors={setFileErrors}
                    validateFile={validateFile}
                  />
                ))}

                {config.episodes.recommended.map(asset => (
                  <FileUpload
                    key={asset.field}
                    field={asset.field}
                    label={asset.label}
                    description={asset.description}
                    type={asset.type}
                    maxSize={asset.maxSize}
                    episodeId={episode.id}
                    seasonId={selectedSeason}
                    hasDescription={asset.hasDescription}
                    hasTitle={asset.hasTitle}
                    hasSubtitles={asset.hasSubtitles}
                    formData={formData}
                    updateFormData={updateFormData}
                    fileErrors={fileErrors}
                    setFileErrors={setFileErrors}
                    validateFile={validateFile}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Tv className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No Episodes Added</h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            Start by adding episodes to season {selectedSeason}
          </p>
          <button
            onClick={() => addEpisode(selectedSeason)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#BC8BBC] text-white rounded hover:bg-[#9b69b2] transition-colors mx-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Episode</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function EnhancedMediaAssetsStep({ formData, updateFormData, errors = [] }) {
  const [activeTab, setActiveTab] = useState('promotional');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [fileErrors, setFileErrors] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    required: true,
    recommended: false,
    optional: false,
    episodes: false
  });

  const hasErrors = errors.length > 0;
  const contentType = formData.contentType;
  const config = CONTENT_TYPE_MEDIA_CONFIG[contentType] || CONTENT_TYPE_MEDIA_CONFIG.movie;

  // Initialize series data if not present
  React.useEffect(() => {
    if (contentType === 'series' && !formData.seasons) {
      updateFormData({
        seasons: [{ id: 1, name: 'Season 1', episodeCount: 0, episodes: [] }],
        episodes: {}
      });
    }
  }, [contentType, formData.seasons, updateFormData]);

// FIXED: Check if required files are actually uploaded
const checkRequiredFilesUploaded = () => {
  const requiredAssets = config.assets.required || [];
  
  for (const asset of requiredAssets) {
    const fieldData = formData[asset.field];
    // Check if file exists and has a file object
    // Skip mainVideo requirement for series
    if (asset.field === 'mainVideo' && contentType === 'series') {
      continue;
    }
    if (!fieldData || !fieldData.file) {
      return false;
    }
  }

  return true;
};

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateFile = (file, assetConfig) => {
    const errors = [];

    // Check file size
    if (file.size > assetConfig.maxSize * 1024 * 1024) {
      errors.push(`File too large. Maximum size is ${assetConfig.maxSize}MB`);
    }

    // Check file type
    const fileCategory = assetConfig.type.includes('image') ? 'image' :
      assetConfig.type.includes('video') ? 'video' : 'subtitle';
    if (!ALLOWED_FILE_TYPES[fileCategory]?.includes(file.type)) {
      const allowedTypes = fileCategory === 'image' ? 'JPEG, PNG, WebP' :
        fileCategory === 'video' ? 'MP4, MOV, AVI' : 'VTT, SRT';
      errors.push(`Invalid file type. Allowed types: ${allowedTypes}`);
    }

    return errors;
  };

  // FIXED: FileUpload Component with proper required state handling
  const FileUpload = React.memo(({
    field,
    label,
    description,
    type,
    maxSize,
    required = false,
    episodeId = null,
    seasonId = null,
    hasDescription = false,
    hasTitle = false,
    hasSubtitles = false,
    formData,
    updateFormData,
    fileErrors,
    setFileErrors,
    validateFile
  }) => {
    const currentFileData = episodeId && seasonId
      ? formData.episodes?.[seasonId]?.[episodeId]?.[field]
      : formData[field];

    const currentFile = currentFileData?.file;
    const currentTitle = currentFileData?.title || '';
    const currentDescription = currentFileData?.description || '';
    const currentSubtitles = currentFileData?.subtitles || {};

    const isUploaded = !!currentFile;
    const Icon = FILE_TYPE_ICONS[type] || FileText;

    const [showMetadata, setShowMetadata] = useState(false);
    const [localSubtitles, setLocalSubtitles] = useState(currentSubtitles);
    const [localTitle, setLocalTitle] = useState(currentTitle);
    const [localDescription, setLocalDescription] = useState(currentDescription);

    // FIXED: Use local state for inputs to prevent re-renders from parent
    React.useEffect(() => {
      setLocalTitle(currentTitle);
    }, [currentTitle]);

    React.useEffect(() => {
      setLocalDescription(currentDescription);
    }, [currentDescription]);

    React.useEffect(() => {
      setLocalSubtitles(currentSubtitles);
    }, [currentSubtitles]);

    // Auto-show metadata if there's existing data
    React.useEffect(() => {
      if ((hasTitle && currentTitle) || (hasDescription && currentDescription) || (hasSubtitles && Object.keys(currentSubtitles).length > 0)) {
        setShowMetadata(true);
      }
    }, [hasTitle, hasDescription, hasSubtitles, currentTitle, currentDescription, currentSubtitles]);

    const handleFileChange = (file) => {
      if (!file) return;

      const assetConfig = { type, maxSize };
      const validationErrors = validateFile(file, assetConfig);

      if (validationErrors.length > 0) {
        const errorKey = episodeId ? `${seasonId}-${episodeId}-${field}` : field;
        setFileErrors(prev => ({ ...prev, [errorKey]: validationErrors[0] }));
        return;
      }

      // Clear any previous errors for this field
      const errorKey = episodeId ? `${seasonId}-${episodeId}-${field}` : field;
      setFileErrors(prev => ({ ...prev, [errorKey]: null }));

      const fileData = {
        file,
        ...(hasTitle && { title: localTitle }),
        ...(hasDescription && { description: localDescription }),
        ...(hasSubtitles && { subtitles: localSubtitles })
      };

      if (episodeId && seasonId) {
        const updatedEpisodes = { ...formData.episodes };
        if (!updatedEpisodes[seasonId]) updatedEpisodes[seasonId] = {};
        if (!updatedEpisodes[seasonId][episodeId]) updatedEpisodes[seasonId][episodeId] = {};
        updatedEpisodes[seasonId][episodeId][field] = fileData;
        updateFormData({ episodes: updatedEpisodes });
      } else {
        updateFormData({ [field]: fileData });
      }
    };

    const handleMetadataChange = (key, value) => {
      if (episodeId && seasonId) {
        const updatedEpisodes = { ...formData.episodes };
        if (!updatedEpisodes[seasonId]) updatedEpisodes[seasonId] = {};
        if (!updatedEpisodes[seasonId][episodeId]) updatedEpisodes[seasonId][episodeId] = {};
        if (!updatedEpisodes[seasonId][episodeId][field]) {
          updatedEpisodes[seasonId][episodeId][field] = { file: currentFile };
        }
        updatedEpisodes[seasonId][episodeId][field][key] = value;
        updateFormData({ episodes: updatedEpisodes });
      } else {
        const currentData = formData[field] || { file: currentFile };
        updateFormData({
          [field]: { ...currentData, [key]: value }
        });
      }
    };

    // FIXED: Debounced title change to prevent excessive re-renders
    const handleTitleChange = (value) => {
      setLocalTitle(value);
      // Only update parent when user stops typing
      const timeoutId = setTimeout(() => {
        handleMetadataChange('title', value);
      }, 500);
      return () => clearTimeout(timeoutId);
    };

    // FIXED: Debounced description change to prevent excessive re-renders
    const handleDescriptionChange = (value) => {
      setLocalDescription(value);
      // Only update parent when user stops typing
      const timeoutId = setTimeout(() => {
        handleMetadataChange('description', value);
      }, 500);
      return () => clearTimeout(timeoutId);
    };

    const handleSubtitleChange = (language, file) => {
      const newSubtitles = { ...localSubtitles };
      if (file) {
        newSubtitles[language] = file;
      } else {
        delete newSubtitles[language];
      }
      setLocalSubtitles(newSubtitles);
      handleMetadataChange('subtitles', newSubtitles);
    };

    const removeFile = () => {
      const errorKey = episodeId ? `${seasonId}-${episodeId}-${field}` : field;
      setFileErrors(prev => ({ ...prev, [errorKey]: null }));

      if (episodeId && seasonId) {
        const updatedEpisodes = { ...formData.episodes };
        if (updatedEpisodes[seasonId]?.[episodeId]?.[field]) {
          delete updatedEpisodes[seasonId][episodeId][field];
          updateFormData({ episodes: updatedEpisodes });
        }
      } else {
        updateFormData({ [field]: null });
      }
    };

    const errorKey = episodeId ? `${seasonId}-${episodeId}-${field}` : field;
    const fileError = fileErrors[errorKey];
    const hasFileError = !!fileError;

    // FIXED: Proper required state - only show as missing if file is actually required AND not uploaded
    const isMissingRequired = required && !isUploaded && !hasFileError;

    const handleFileInputChange = (e) => {
      handleFileChange(e.target.files[0]);
    };

    const handleToggleMetadata = () => {
      setShowMetadata(prev => !prev);
    };

    return (
      <div className={clsx(
        "group relative border-2 rounded-lg p-3 transition-all duration-300",
        "hover:shadow-md hover:scale-102 focus-within:scale-102",
        hasFileError
          ? "border-red-500 bg-red-50/50 dark:bg-red-900/10 animate-pulse"
          : isUploaded
            ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10"
            : isMissingRequired
              ? "border-red-300 bg-red-50/30 dark:bg-red-900/5 border-dashed"
              : "border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]"
      )}>
        <input
          type="file"
          id={`${field}-${episodeId || 'main'}-${seasonId || ''}`}
          accept={type.includes('image') ? 'image/*' : type.includes('video') ? 'video/*' : '.srt,.vtt'}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-3">
          {/* File Upload Section */}
          <label
            htmlFor={`${field}-${episodeId || 'main'}-${seasonId || ''}`}
            className={clsx(
              "cursor-pointer block space-y-2",
              (isUploaded && !hasFileError) && "cursor-default"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between space-x-2">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className={clsx(
                  "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-colors duration-300",
                  hasFileError
                    ? "bg-red-500 text-white"
                    : isUploaded
                      ? "bg-green-500 text-white"
                      : isMissingRequired
                        ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-[#BC8BBC]/10 group-hover:text-[#BC8BBC]"
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h4 className={clsx(
                      "font-semibold text-sm transition-colors duration-300 truncate",
                      hasFileError
                        ? "text-red-700 dark:text-red-300"
                        : isUploaded
                          ? "text-green-700 dark:text-green-300"
                          : isMissingRequired
                            ? "text-red-700 dark:text-red-300"
                            : "text-gray-900 dark:text-white group-hover:text-[#BC8BBC]"
                    )}>
                      {label}
                    </h4>
                    {required && (
                      <span className={clsx(
                        "text-xs px-1.5 py-0.5 rounded flex-shrink-0",
                        hasFileError
                          ? "text-red-700 bg-red-100 dark:bg-red-900/30"
                          : isUploaded
                            ? "text-green-700 bg-green-100 dark:bg-green-900/30"
                            : isMissingRequired
                              ? "text-red-700 bg-red-100 dark:bg-red-900/30"
                              : "text-gray-500 bg-gray-100 dark:bg-gray-700"
                      )}>
                        Required
                      </span>
                    )}
                  </div>
                  <p className={clsx(
                    "text-xs mt-0.5 line-clamp-2",
                    hasFileError
                      ? "text-red-600/80 dark:text-red-400/80"
                      : isMissingRequired
                        ? "text-red-600/80 dark:text-red-400/80"
                        : "text-gray-500 dark:text-gray-400"
                  )}>
                    {description}
                  </p>
                  <p className={clsx(
                    "text-xs mt-0.5",
                    hasFileError
                      ? "text-red-600/80 dark:text-red-400/80"
                      : isMissingRequired
                        ? "text-red-600/80 dark:text-red-400/80"
                        : "text-gray-400 dark:text-gray-500"
                  )}>
                    Max: {maxSize}MB
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              {isUploaded && !hasFileError && (
                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden xs:inline">Uploaded</span>
                </div>
              )}
              {hasFileError && (
                <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden xs:inline">Error</span>
                </div>
              )}
              {isMissingRequired && (
                <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden xs:inline">Required</span>
                </div>
              )}
            </div>

            {/* File Info or Upload Prompt */}
            {currentFile ? (
              <div className="space-y-2">
                <div className={clsx(
                  "flex items-center justify-between p-2 rounded border",
                  hasFileError
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                )}>
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <FileText className={clsx(
                      "w-3.5 h-3.5 flex-shrink-0",
                      hasFileError ? "text-red-500" : "text-gray-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "text-sm font-medium truncate",
                        hasFileError ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
                      )}>
                        {currentFile.name}
                      </p>
                      <p className={clsx(
                        "text-xs",
                        hasFileError ? "text-red-600/80 dark:text-red-400/80" : "text-gray-500 dark:text-gray-400"
                      )}>
                        {(currentFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className={clsx(
                      "p-1 rounded transition-colors flex-shrink-0",
                      hasFileError
                        ? "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Error Message */}
                {hasFileError && (
                  <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-red-600 dark:text-red-400 text-xs flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{fileError}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className={clsx(
                "border-2 border-dashed rounded p-3 text-center transition-colors duration-300",
                hasFileError
                  ? "border-red-300 bg-red-50/50 dark:bg-red-900/10"
                  : isMissingRequired
                    ? "border-red-300 bg-red-50/30 dark:bg-red-900/5"
                    : "group-hover:border-[#BC8BBC] group-hover:bg-[#BC8BBC]/5 border-gray-300 dark:border-gray-600"
              )}>
                <Upload className={clsx(
                  "w-6 h-6 mx-auto mb-1 transition-colors",
                  hasFileError
                    ? "text-red-400"
                    : isMissingRequired
                      ? "text-red-400"
                      : "text-gray-400 group-hover:text-[#BC8BBC]"
                )} />
                <p className={clsx(
                  "text-sm font-medium transition-colors",
                  hasFileError
                    ? "text-red-600 dark:text-red-400"
                    : isMissingRequired
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-[#BC8BBC]"
                )}>
                  Click to upload
                </p>
                <p className={clsx(
                  "text-xs mt-0.5",
                  hasFileError
                    ? "text-red-600/80 dark:text-red-400/80"
                    : isMissingRequired
                      ? "text-red-600/80 dark:text-red-400/80"
                      : "text-gray-400 dark:text-gray-500"
                )}>
                  or drag and drop
                </p>
              </div>
            )}
          </label>

          {/* Metadata Section - Always show if there's data or if explicitly opened */}
          {(hasTitle || hasDescription || hasSubtitles) && isUploaded && !hasFileError && (
            <div className="border-t pt-3 space-y-3">
              <button
                type="button"
                onClick={handleToggleMetadata}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#BC8BBC] transition-colors"
              >
                <Type className="w-4 h-4" />
                <span>
                  {showMetadata ? 'Hide Metadata' : 'Show Metadata'}
                  {(localTitle || localDescription || Object.keys(localSubtitles).length > 0) && (
                    <span className="ml-2 text-xs bg-[#BC8BBC] text-white px-1.5 py-0.5 rounded-full">
                      ✓
                    </span>
                  )}
                </span>
                <ChevronDown className={clsx("w-4 h-4 transition-transform", showMetadata && "rotate-180")} />
              </button>

              {showMetadata && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {/* Title Input */}
                  {hasTitle && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title {localTitle && <span className="text-green-500 ml-1">✓</span>}
                      </label>
                      <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder={`Enter title for ${label.toLowerCase()}`}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                        onBlur={() => handleMetadataChange('title', localTitle)}
                      />
                    </div>
                  )}

                  {/* Description Input */}
                  {hasDescription && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description {localDescription && <span className="text-green-500 ml-1">✓</span>}
                      </label>
                      <textarea
                        value={localDescription}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        onBlur={() => handleMetadataChange('description', localDescription)}
                        placeholder={`Enter description for ${label.toLowerCase()}`}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
                      />
                    </div>
                  )}

                  {/* Subtitles Section */}
                  {hasSubtitles && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Languages className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Subtitles (Optional) {Object.keys(localSubtitles).length > 0 && (
                            <span className="text-green-500 ml-1">
                              ✓ {Object.keys(localSubtitles).length} languages
                            </span>
                          )}
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['en', 'rw', 'fr', 'sw'].map(language => (
                          <div key={language} className="flex items-center space-x-2">
                            <input
                              type="file"
                              id={`subtitle-${field}-${language}-${episodeId || 'main'}-${seasonId || ''}`}
                              accept=".srt,.vtt"
                              onChange={(e) => handleSubtitleChange(language, e.target.files[0])}
                              className="hidden"
                            />
                            <label
                              htmlFor={`subtitle-${field}-${language}-${episodeId || 'main'}-${seasonId || ''}`}
                              className={clsx(
                                "flex-1 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors text-center",
                                localSubtitles[language]
                                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-[#BC8BBC]/10 hover:border-[#BC8BBC] hover:text-[#BC8BBC]"
                              )}
                            >
                              {LANGUAGE_NAMES[language]}
                              {localSubtitles[language] && (
                                <span className="ml-1 text-green-500">✓</span>
                              )}
                            </label>
                            {localSubtitles[language] && (
                              <button
                                type="button"
                                onClick={() => handleSubtitleChange(language, null)}
                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Required Indicator - Only show if file is missing and required */}
          {isMissingRequired && (
            <div className="absolute -top-1 -right-1">
              <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center space-x-1">
                <AlertCircle className="w-2.5 h-2.5" />
                <span className="hidden xs:inline">Required</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });

  const MediaSection = ({ title, assets, type, defaultExpanded = false }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(type)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className={clsx(
            "w-1.5 h-4 rounded-full",
            type === 'required' ? "bg-red-500" :
              type === 'recommended' ? "bg-blue-500" :
                "bg-gray-400"
          )}></div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h4>
          <span className={clsx(
            "text-xs px-1.5 py-0.5 rounded",
            type === 'required'
              ? "text-red-700 bg-red-100 dark:bg-red-900/30"
              : type === 'recommended'
                ? "text-blue-700 bg-blue-100 dark:bg-blue-900/30"
                : "text-gray-500 bg-gray-100 dark:bg-gray-700"
          )}>
            {type === 'required' ? 'Required' : type === 'recommended' ? 'Recommended' : 'Optional'}
          </span>
        </div>
        <ChevronDown className={clsx(
          "w-4 h-4 text-gray-500 transition-transform",
          expandedSections[type] && "rotate-180"
        )} />
      </button>

      {expandedSections[type] && (
        <div className="p-3 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3">
            {assets.map(asset => (
              <FileUpload
                key={asset.field}
                field={asset.field}
                label={asset.label}
                description={asset.description}
                type={asset.type}
                maxSize={asset.maxSize}
                required={type === 'required'}
                hasDescription={asset.hasDescription}
                hasTitle={asset.hasTitle}
                hasSubtitles={asset.hasSubtitles}
                formData={formData}
                updateFormData={updateFormData}
                fileErrors={fileErrors}
                setFileErrors={setFileErrors}
                validateFile={validateFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!contentType) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Image className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Select Content Type First
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
          Please go back and select a content type to see relevant media upload options.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className={clsx(
          "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300",
          hasErrors
            ? "bg-red-500 animate-pulse"
            : "bg-[#BC8BBC]"
        )}>
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-white" />
          ) : (
            <Image className="w-5 h-5 text-white" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {config.title}
        </h3>
        <p className={clsx(
          "text-xs",
          hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
        )}>
          {hasErrors ? "Please fix validation errors to continue." : config.description}
        </p>

        {/* Error Summary */}
        {hasErrors && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-1.5 text-red-700 dark:text-red-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">Fix these issues:</span>
            </div>
            <ul className="text-red-600 dark:text-red-400 text-xs mt-1 list-disc list-inside space-y-0.5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Content Type Badge */}
      <div className="flex justify-center">
        <div className={clsx(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-300",
          hasErrors
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-[#BC8BBC]/10 text-[#BC8BBC]"
        )}>
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
          )}></span>
          {contentType.charAt(0).toUpperCase() + contentType.slice(1).replace('_', ' ')} Content
        </div>
      </div>

      {/* Series Tabs */}
      {contentType === 'series' && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('promotional')}
              className={clsx(
                "pb-3 px-1 border-b-2 font-medium text-xs transition-colors",
                activeTab === 'promotional'
                  ? "border-[#BC8BBC] text-[#BC8BBC]"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Promotional
            </button>
            <button
              onClick={() => setActiveTab('episodes')}
              className={clsx(
                "pb-3 px-1 border-b-2 font-medium text-xs transition-colors",
                activeTab === 'episodes'
                  ? "border-[#BC8BBC] text-[#BC8BBC]"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Episodes
            </button>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'promotional' || contentType !== 'series' ? (
        <div className="space-y-3">
          <MediaSection
            title="Required Media"
            assets={config.assets.required}
            type="required"
            defaultExpanded={true}
          />

          {config.assets.recommended.length > 0 && (
            <MediaSection
              title="Recommended Media"
              assets={config.assets.recommended}
              type="recommended"
            />
          )}

          {config.assets.optional.length > 0 && (
            <MediaSection
              title="Optional Media"
              assets={config.assets.optional}
              type="optional"
            />
          )}
        </div>
      ) : (
        <EpisodeManager
          formData={formData}
          updateFormData={updateFormData}
          config={config}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          fileErrors={fileErrors}
          setFileErrors={setFileErrors}
          validateFile={validateFile}
          FileUpload={FileUpload}
        />
      )}
    </div>
  );
}