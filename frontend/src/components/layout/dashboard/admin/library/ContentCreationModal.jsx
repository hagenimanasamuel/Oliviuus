import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ChevronLeft, ChevronRight, Film, CheckCircle,
  ChevronDown, MoreHorizontal, Upload,
  PartyPopper, Rocket, Sparkles, Trophy, 
  Star, Award, Gift
} from "lucide-react";
import clsx from "clsx";
import axios from "../../../../../api/axios";
import { FileText, Image, Shield, MapPin, Eye } from "lucide-react";
import ContentTypeStep from "./ContentCreationSteps/ContentTypeStep";
import BasicInfoStep from "./ContentCreationSteps/BasicInfoStep";
import MediaAssetsStep from "./ContentCreationSteps/MediaAssetsStep";
import ClassificationStep from "./ContentCreationSteps/ClassificationStep";
import RightsDistributionStep from "./ContentCreationSteps/RightsDistributionStep";
import ReviewStep from "./ContentCreationSteps/ReviewStep";

const STEPS = [
  { id: 'type', label: 'Content Type', icon: Film },
  { id: 'basic', label: 'Basic Info', icon: FileText },
  { id: 'media', label: 'Media Assets', icon: Image },
  { id: 'classification', label: 'Classification', icon: Shield },
  { id: 'rights', label: 'Rights & Distribution', icon: MapPin },
  { id: 'review', label: 'Review & Publish', icon: Eye }
];

// Enhanced Upload Progress Component
const EnhancedUploadProgress = ({ uploadProgress, isSubmitting }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Calculate time remaining
  useEffect(() => {
    if (isSubmitting && uploadProgress.overall > 0 && uploadProgress.overall < 100) {
      if (!startTime) {
        setStartTime(Date.now());
      } else {
        const elapsed = Date.now() - startTime;
        const remaining = (elapsed / uploadProgress.overall) * (100 - uploadProgress.overall);
        setTimeRemaining(Math.max(0, Math.round(remaining / 1000))); // Convert to seconds
      }
    } else if (uploadProgress.overall >= 100) {
      setTimeRemaining(0);
      setStartTime(null);
    }
  }, [uploadProgress.overall, isSubmitting, startTime]);

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getFileCategory = (fileType) => {
    const categories = {
      thumbnail: { label: 'Thumbnail', category: 'Images', color: 'bg-blue-500' },
      poster: { label: 'Poster', category: 'Images', color: 'bg-blue-500' },
      screenshot: { label: 'Screenshot', category: 'Images', color: 'bg-blue-500' },
      keyArt: { label: 'Key Art', category: 'Images', color: 'bg-blue-500' },
      seasonPosters: { label: 'Season Poster', category: 'Images', color: 'bg-blue-500' },
      mainVideo: { label: 'Main Video', category: 'Videos', color: 'bg-purple-500' },
      trailer: { label: 'Trailer', category: 'Videos', color: 'bg-purple-500' },
      behindScenes: { label: 'Behind Scenes', category: 'Videos', color: 'bg-purple-500' },
      bloopers: { label: 'Bloopers', category: 'Videos', color: 'bg-purple-500' },
      episodeVideo: { label: 'Episode Video', category: 'Videos', color: 'bg-purple-500' },
      episodeThumbnail: { label: 'Episode Thumbnail', category: 'Images', color: 'bg-blue-500' },
      episodeTrailer: { label: 'Episode Trailer', category: 'Videos', color: 'bg-purple-500' },
      subtitle: { label: 'Subtitle', category: 'Subtitles', color: 'bg-green-500' }
    };
    return categories[fileType] || { label: fileType, category: 'Other', color: 'bg-gray-500' };
  };

  // Group files by category
  const groupedFiles = uploadProgress.files.reduce((acc, file) => {
    const category = getFileCategory(file.type).category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {});

  const totalFiles = uploadProgress.files.length;
  const completedFiles = uploadProgress.files.filter(f => f.status === 'completed').length;
  const failedFiles = uploadProgress.files.filter(f => f.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header with Celebration */}
      {uploadProgress.overall === 100 ? (
        <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-800">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-400 absolute top-2 right-10 animate-pulse" />
            <Sparkles className="w-5 h-5 text-yellow-400 absolute top-4 left-10 animate-pulse delay-300" />
            <Sparkles className="w-4 h-4 text-yellow-400 absolute bottom-2 right-12 animate-pulse delay-700" />
          </div>
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
            🎉 Upload Complete!
          </h3>
          <p className="text-green-700 dark:text-green-400 text-lg mb-4">
            Congratulations! Your content has been successfully published.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
              {completedFiles} files uploaded
            </div>
            {failedFiles > 0 && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">
                {failedFiles} failed
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Uploading Your Content
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {uploadProgress.currentStep}
          </p>
        </div>
      )}

      {/* Main Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Overall Progress</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {completedFiles} of {totalFiles} files processed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(uploadProgress.overall)}%
            </div>
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ~{formatTime(timeRemaining)} remaining
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
            style={{ width: `${uploadProgress.overall}%` }}
          />
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedFiles}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {uploadProgress.files.filter(f => f.status === 'uploading').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Uploading</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{failedFiles}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
          </div>
        </div>
      </div>

      {/* Current File Progress */}
      {uploadProgress.currentFile && uploadProgress.overall < 100 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-800 dark:text-blue-300 text-sm">
              Current File
            </span>
            <span className="text-blue-600 dark:text-blue-400 text-sm">
              {Math.round(uploadProgress.files.find(f => f.status === 'uploading')?.progress || 0)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.files.find(f => f.status === 'uploading')?.progress || 0}%` }}
            />
          </div>
          <p className="text-blue-700 dark:text-blue-400 text-sm mt-2 truncate">
            {uploadProgress.currentFile}
          </p>
        </div>
      )}

      {/* Grouped File Progress */}
      {Object.entries(groupedFiles).map(([category, files]) => (
        <div key={category} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <div className={`w-3 h-3 rounded-full ${getFileCategory(files[0]?.type).color} mr-2`} />
            {category} ({files.length})
          </h5>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    file.status === 'completed' ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                    file.status === 'failed' ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                    file.status === 'uploading' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                    "bg-gray-100 text-gray-400 dark:bg-gray-700"
                  )}>
                    {file.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : file.status === 'failed' ? (
                      <X className="w-4 h-4" />
                    ) : file.status === 'uploading' ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getFileCategory(file.type).label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {file.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={clsx(
                        "h-1.5 rounded-full transition-all duration-300",
                        file.status === 'completed' ? "bg-green-500" :
                        file.status === 'failed' ? "bg-red-500" :
                        file.status === 'uploading' ? "bg-blue-500" :
                        "bg-gray-400"
                      )}
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <span className={clsx(
                    "text-xs w-8 text-right",
                    file.status === 'completed' ? "text-green-600 dark:text-green-400" :
                    file.status === 'failed' ? "text-red-600 dark:text-red-400" :
                    file.status === 'uploading' ? "text-blue-600 dark:text-blue-400" :
                    "text-gray-500"
                  )}>
                    {Math.round(file.progress)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function ContentCreationModal({ onClose, onContentCreated, categories, genres, tags }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStepsDropdown, setShowStepsDropdown] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [overflowSteps, setOverflowSteps] = useState([]);
  const [stepErrors, setStepErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState({
    overall: 0,
    currentFile: '',
    files: [],
    currentStep: 'Creating content...'
  });
  const [showCelebration, setShowCelebration] = useState(false);

  const stepsContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    contentType: '',
    title: '',
    description: '',
    genre: '',
    categories: [],
    releaseDate: '',
    duration: '',
    director: '',
    cast: [],
    tags: [],
    thumbnail: null,
    poster: null,
    trailer: null,
    mainVideo: null,
    screenshots: [],
    ageRating: '',
    contentWarnings: [],
    languages: [],
    subtitles: [],
    licenseType: '',
    regions: [],
    startDate: '',
    endDate: '',
    exclusive: false,
    downloadable: false,
    shareable: false,
    seasons: [],
    episodes: [],
    primaryLanguage: 'en'
  });

  // Validation rules for each step
  const validationRules = {
    type: () => {
      const errors = [];
      if (!formData.contentType) {
        errors.push('Content type is required');
      }
      return errors;
    },
    basic: () => {
      const errors = [];
      if (!formData.title?.trim()) errors.push('Title is required');
      if (!formData.description?.trim()) errors.push('Description is required');
      if (!formData.genre) errors.push('Genre is required');
      if (formData.title?.length > 255) errors.push('Title must be less than 255 characters');
      if (formData.description?.length < 10) errors.push('Description must be at least 10 characters');
      return errors;
    },
    media: () => {
      const errors = [];

      // Check if required files exist and have file objects
      if (!formData.thumbnail || !formData.thumbnail.file) {
        errors.push('Thumbnail is required');
      }
      if (!formData.poster || !formData.poster.file) {
        errors.push('Poster is required');
      }
      // Only require mainVideo for non-series content types
      if (formData.contentType !== 'series') {
        if (!formData.mainVideo || !formData.mainVideo.file) {
          errors.push('Main video is required');
        }
      }

      // Validate file types and sizes only if files exist
      if (formData.thumbnail && formData.thumbnail.file) {
        if (!validateFile('thumbnail', formData.thumbnail.file)) {
          errors.push('Thumbnail must be an image (JPEG, PNG, WebP) under 5MB');
        }
      }
      if (formData.poster && formData.poster.file) {
        if (!validateFile('poster', formData.poster.file)) {
          errors.push('Poster must be an image (JPEG, PNG, WebP) under 10MB');
        }
      }
      if (formData.mainVideo && formData.mainVideo.file) {
        if (!validateFile('mainVideo', formData.mainVideo.file)) {
          errors.push('Main video must be a video file (MP4, MOV, AVI) under 4GB');
        }
      }
      if (formData.trailer && formData.trailer.file) {
        if (!validateFile('trailer', formData.trailer.file)) {
          errors.push('Trailer must be a video file (MP4, MOV) under 500MB');
        }
      }

      return errors;
    },
    classification: () => {
      const errors = [];
      if (!formData.ageRating) errors.push('Age rating is required');
      if (!formData.primaryLanguage) errors.push('Primary language is required');
      if (formData.contentWarnings.length === 0) errors.push('At least one content warning is required');
      if (formData.languages.length === 0) errors.push('At least one language is required');
      return errors;
    },
    rights: () => {
      const errors = [];
      if (!formData.licenseType) errors.push('License type is required');
      if (formData.licenseType !== 'perpetual' && !formData.startDate) {
        errors.push('Start date is required for non-perpetual licenses');
      }
      if (formData.regions.length === 0) errors.push('At least one region is required');
      return errors;
    },
    review: () => {
      // Review step doesn't have specific validations
      return [];
    }
  };

  // File validation helper
  const validateFile = (fileType, file) => {
    if (!file || !(file instanceof File)) return false;

    const maxSizes = {
      thumbnail: 5 * 1024 * 1024, // 5MB
      poster: 10 * 1024 * 1024, // 10MB
      mainVideo: 4 * 1024 * 1024 * 1024, // 4GB
      trailer: 500 * 1024 * 1024, // 500MB
      screenshot: 5 * 1024 * 1024 // 5MB
    };

    const allowedTypes = {
      thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
      poster: ['image/jpeg', 'image/png', 'image/webp'],
      mainVideo: ['video/mp4', 'video/mov', 'video/avi'],
      trailer: ['video/mp4', 'video/mov'],
      screenshot: ['image/jpeg', 'image/png', 'image/webp']
    };

    // Check file size
    if (file.size > (maxSizes[fileType] || 0)) {
      console.log(`File ${fileType} too large: ${file.size} > ${maxSizes[fileType]}`);
      return false;
    }

    // Check file type
    if (!allowedTypes[fileType]?.includes(file.type)) {
      console.log(`Invalid file type for ${fileType}: ${file.type}, allowed: ${allowedTypes[fileType]}`);
      return false;
    }

    return true;
  };

  // Calculate visible steps based on container width
  const calculateVisibleSteps = useCallback(() => {
    if (!stepsContainerRef.current) return;

    const container = stepsContainerRef.current;
    const containerWidth = container.offsetWidth;
    const stepElements = container.querySelectorAll('[data-step]');

    let usedWidth = 0;
    const newVisible = [];
    const newOverflow = [];
    const moreButtonWidth = 80;

    stepElements.forEach(step => {
      step.style.display = 'flex';
      step.style.visibility = 'hidden';
    });

    container.offsetHeight;

    STEPS.forEach((step, index) => {
      const stepElement = container.querySelector(`[data-step="${step.id}"]`);
      if (!stepElement) return;

      const stepWidth = stepElement.offsetWidth + 12;

      if (usedWidth + stepWidth <= containerWidth - moreButtonWidth) {
        newVisible.push(step);
        usedWidth += stepWidth;
        stepElement.style.visibility = 'visible';
      } else {
        newOverflow.push(step);
        stepElement.style.display = 'none';
      }
    });

    setVisibleSteps(newVisible);
    setOverflowSteps(newOverflow);
  }, []);

  // Handle resize with debounce
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(calculateVisibleSteps, 150);
    };

    calculateVisibleSteps();

    const resizeObserver = new ResizeObserver(handleResize);
    if (stepsContainerRef.current) {
      resizeObserver.observe(stepsContainerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [calculateVisibleSteps]);

  // Validate current step whenever form data changes
  useEffect(() => {
    const currentStepId = STEPS[currentStep].id;
    const errors = validationRules[currentStepId]();
    setStepErrors(prev => ({
      ...prev,
      [currentStepId]: errors
    }));
  }, [formData, currentStep]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStepsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing during submission
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = () => {
    const currentStepId = STEPS[currentStep].id;
    const errors = validationRules[currentStepId]();
    setStepErrors(prev => ({
      ...prev,
      [currentStepId]: errors
    }));
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepSelect = (stepIndex) => {
    // Only allow going to completed steps or next step
    if (stepIndex <= currentStep || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
      setShowStepsDropdown(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all steps before submission
    const allErrors = {};
    let hasErrors = false;

    STEPS.forEach((step, index) => {
      if (index < STEPS.length - 1) { // Don't validate review step
        const errors = validationRules[step.id]();
        allErrors[step.id] = errors;
        if (errors.length > 0) {
          hasErrors = true;
        }
      }
    });

    setStepErrors(allErrors);

    if (hasErrors) {
      alert('Please fix all validation errors before submitting.');
      // Go to first step with errors
      const firstErrorStep = STEPS.findIndex(step => allErrors[step.id]?.length > 0);
      if (firstErrorStep !== -1) {
        setCurrentStep(firstErrorStep);
      }
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({
      overall: 0,
      currentFile: '',
      files: [],
      currentStep: 'Creating content...'
    });

    try {
      // Prepare COMPLETE data for backend - INCLUDING ALL FIELDS
      const contentData = {
        // === BASIC INFO ===
        title: formData.title,
        description: formData.description,
        short_description: formData.description?.substring(0, 150) || '',
        content_type: formData.contentType,

        // === CLASSIFICATION ===
        age_rating: formData.ageRating,
        primary_language: formData.primaryLanguage || 'en',
        genre: formData.genre,
        categories: formData.categories || [],

        // === METADATA ===
        duration: formData.duration ? parseInt(formData.duration) : null,
        release_date: formData.releaseDate || null,
        director: formData.director || null,

        // === PRODUCTION DETAILS (Previously Missing) ===
        production_company: formData.productionCompany || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        subject: formData.subject || null, // Documentary subject
        location: formData.location || null, // Documentary location
        festival: formData.festival || null, // Film festival

        // === CAST & CREW (Previously Missing) ===
        cast: formData.cast || [],
        tags: formData.tags || [],

        // === SERIES-SPECIFIC DATA ===
        total_seasons: formData.contentType === 'series' ? parseInt(formData.totalSeasons) : null,
        episodes_per_season: formData.contentType === 'series' ? parseInt(formData.episodesPerSeason) : null,
        episode_duration: formData.contentType === 'series' ? parseInt(formData.episodeDuration) : null,

        // === LIVE EVENT DATA ===
        event_date: formData.contentType === 'live_event' ? formData.eventDate : null,
        event_location: formData.contentType === 'live_event' ? formData.eventLocation : null,
        expected_audience: formData.contentType === 'live_event' ? parseInt(formData.expectedAudience) : null,

        // === RIGHTS AND DISTRIBUTION ===
        license_type: formData.licenseType,
        regions: formData.regions || [],
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        exclusive: formData.exclusive || false,
        downloadable: formData.downloadable || false,
        shareable: formData.shareable || false,

        // === CONTENT WARNINGS AND LANGUAGES ===
        content_warnings: formData.contentWarnings || [],
        languages: formData.languages || [],
        subtitles: formData.subtitles || [],

        // === MEDIA METADATA (Previously Missing) ===
        media_metadata: {
          // Thumbnail metadata
          thumbnail_title: formData.thumbnail?.title || null,
          thumbnail_description: formData.thumbnail?.description || null,

          // Poster metadata  
          poster_title: formData.poster?.title || null,
          poster_description: formData.poster?.description || null,

          // Main video metadata
          main_video_title: formData.mainVideo?.title || null,
          main_video_description: formData.mainVideo?.description || null,

          // Trailer metadata
          trailer_title: formData.trailer?.title || null,
          trailer_description: formData.trailer?.description || null,

          // Screenshots metadata - FIXED: Handle non-array cases
          screenshots: Array.isArray(formData.screenshots) ? formData.screenshots?.map((screenshot, index) => ({
            title: screenshot.title || null,
            description: screenshot.description || null,
            order: index
          })) : [],

          // Behind the scenes metadata - FIXED: Handle non-array cases
          behind_scenes: Array.isArray(formData.behindScenes) ? formData.behindScenes?.map((item, index) => ({
            title: item.title || null,
            description: item.description || null,
            order: index
          })) : [],

          // Key art metadata - FIXED: Handle non-array cases
          key_art: Array.isArray(formData.keyArt) ? formData.keyArt?.map((art, index) => ({
            title: art.title || null,
            description: art.description || null,
            order: index
          })) : [],

          // Season posters metadata (for series) - FIXED: Handle non-array cases
          season_posters: Array.isArray(formData.seasonPosters) ? formData.seasonPosters?.map((poster, index) => ({
            title: poster.title || null,
            description: poster.description || null,
            season_number: index + 1,
            order: index
          })) : [],

          // Bloopers & extras metadata - FIXED: Handle non-array cases
          bloopers: Array.isArray(formData.bloopers) ? formData.bloopers?.map((blooper, index) => ({
            title: blooper.title || null,
            description: blooper.description || null,
            order: index
          })) : []
        },

        // === EPISODE DATA (for series - Previously Missing) ===
        episodes_data: formData.contentType === 'series' ? {
          seasons: Array.isArray(formData.seasons) ? formData.seasons.map(season => ({
            id: season.id,
            name: season.name,
            season_title: season.seasonTitle || null,
            season_description: season.seasonDescription || null,
            episode_count: season.episodeCount || 0,
            episodes: Array.isArray(season.episodes) ? season.episodes.map(episode => ({
              id: episode.id,
              title: episode.title,
              description: episode.description,
              episode_title: episode.episodeTitle || null,
              episode_description: episode.episodeDescription || null,
              duration: episode.duration || null,
              release_date: episode.releaseDate || null,
              media_assets: {
                // Episode video metadata
                episode_video_title: episode.episodeVideo?.title || null,
                episode_video_description: episode.episodeVideo?.description || null,

                // Episode thumbnail metadata
                episode_thumbnail_title: episode.episodeThumbnail?.title || null,
                episode_thumbnail_description: episode.episodeThumbnail?.description || null,

                // Episode trailer metadata
                episode_trailer_title: episode.episodeTrailer?.title || null,
                episode_trailer_description: episode.episodeTrailer?.description || null
              },
              subtitles: episode.subtitles || []
            })) : []
          })) : []
        } : null
      };

      console.log('📤 Sending COMPLETE content data:', contentData);

      // 1. Create content in database with ALL data
      setUploadProgress(prev => ({ ...prev, currentStep: 'Creating content record...' }));
      const response = await axios.post('/contents', contentData);
      const newContent = response.data.content;

      setUploadProgress(prev => ({ ...prev, overall: 20 }));

      // 2. Upload ALL media files with progress tracking (including metadata)
      await uploadMediaFiles(newContent.id);

      setUploadProgress(prev => ({ ...prev, overall: 100, currentStep: 'Finalizing...' }));
      
      // Show celebration effect
      setShowCelebration(true);
      
      setTimeout(() => {
        if (onContentCreated) {
          onContentCreated(newContent);
        }
        handleClose();
      }, 3000);

    } catch (error) {
      console.error('❌ Failed to create content:', error);
      setUploadProgress(prev => ({ ...prev, currentStep: 'Error occurred!' }));

      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else if (error.response?.data?.details) {
        alert(`Error: ${error.response.data.details}`);
      } else {
        alert('Failed to create content. Please check all required fields and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadMediaFiles = async (contentId) => {
    // Collect ALL media files including those with metadata - FIXED: Handle non-array cases
    const mediaFiles = [
      // Main promotional assets
      { type: 'thumbnail', file: formData.thumbnail?.file, metadata: formData.thumbnail },
      { type: 'poster', file: formData.poster?.file, metadata: formData.poster },
      { type: 'mainVideo', file: formData.mainVideo?.file, metadata: formData.mainVideo },
      { type: 'trailer', file: formData.trailer?.file, metadata: formData.trailer },

      // Multiple file assets - FIXED: Handle non-array cases
      ...(Array.isArray(formData.screenshots) ? formData.screenshots.map((screenshot, index) => ({
        type: 'screenshot',
        file: screenshot.file,
        metadata: screenshot,
        options: { index }
      })) : []),

      ...(Array.isArray(formData.behindScenes) ? formData.behindScenes.map((video, index) => ({
        type: 'behindScenes',
        file: video.file,
        metadata: video,
        options: { index }
      })) : []),

      ...(Array.isArray(formData.keyArt) ? formData.keyArt.map((art, index) => ({
        type: 'keyArt',
        file: art.file,
        metadata: art,
        options: { index }
      })) : []),

      ...(Array.isArray(formData.seasonPosters) ? formData.seasonPosters.map((poster, index) => ({
        type: 'seasonPosters',
        file: poster.file,
        metadata: poster,
        options: { index, seasonNumber: index + 1 }
      })) : []),

      ...(Array.isArray(formData.bloopers) ? formData.bloopers.map((blooper, index) => ({
        type: 'bloopers',
        file: blooper.file,
        metadata: blooper,
        options: { index }
      })) : []),

      // Subtitles for main video
      ...(formData.mainVideo?.subtitles ? Object.entries(formData.mainVideo.subtitles).map(([language, file]) => ({
        type: 'subtitle',
        file: file,
        options: { language, forAsset: 'mainVideo' }
      })) : []),

      // Episode media files (for series) - FIXED: Handle non-array/object cases
      ...(formData.contentType === 'series' && formData.episodes && typeof formData.episodes === 'object' ?
        Object.entries(formData.episodes).flatMap(([seasonId, seasonEpisodes]) =>
          seasonEpisodes && typeof seasonEpisodes === 'object' ?
            Object.entries(seasonEpisodes).flatMap(([episodeId, episode]) => [
              // Episode video
              ...(episode.episodeVideo ? [{
                type: 'episodeVideo',
                file: episode.episodeVideo.file,
                metadata: episode.episodeVideo,
                options: {
                  seasonNumber: parseInt(seasonId),
                  episodeNumber: parseInt(episodeId),
                  episodeTitle: episode.title
                }
              }] : []),

              // Episode thumbnail
              ...(episode.episodeThumbnail ? [{
                type: 'episodeThumbnail',
                file: episode.episodeThumbnail.file,
                metadata: episode.episodeThumbnail,
                options: {
                  seasonNumber: parseInt(seasonId),
                  episodeNumber: parseInt(episodeId),
                  episodeTitle: episode.title
                }
              }] : []),

              // Episode trailer
              ...(episode.episodeTrailer ? [{
                type: 'episodeTrailer',
                file: episode.episodeTrailer.file,
                metadata: episode.episodeTrailer,
                options: {
                  seasonNumber: parseInt(seasonId),
                  episodeNumber: parseInt(episodeId),
                  episodeTitle: episode.title
                }
              }] : []),

              // Episode subtitles
              ...(episode.subtitles ? Object.entries(episode.subtitles).map(([language, file]) => ({
                type: 'subtitle',
                file: file,
                options: {
                  language,
                  forAsset: 'episodeVideo',
                  seasonNumber: parseInt(seasonId),
                  episodeNumber: parseInt(episodeId)
                }
              })) : [])
            ]) : []
        ) : [])
    ].filter(item => item.file && item.file instanceof File);

    const totalFiles = mediaFiles.length;
    if (totalFiles === 0) {
      setUploadProgress(prev => ({ ...prev, overall: 100 }));
      return;
    }

    setUploadProgress(prev => ({
      ...prev,
      files: mediaFiles.map(item => ({
        name: item.file.name,
        type: item.type,
        status: 'pending',
        progress: 0
      }))
    }));

    // Upload ALL files
    for (let i = 0; i < mediaFiles.length; i++) {
      const { type, file, metadata = {}, options = {} } = mediaFiles[i];
      const fileIndex = i;

      setUploadProgress(prev => ({
        ...prev,
        currentFile: `Uploading ${type}: ${file.name}`,
        currentStep: `Uploading file ${fileIndex + 1} of ${totalFiles}`
      }));

      await uploadFileWithProgress(contentId, type, file, metadata, options, fileIndex, totalFiles);
    }
  };

  const uploadFileWithProgress = async (contentId, assetType, file, metadata, options, fileIndex, totalFiles) => {
    try {
      setUploadProgress(prev => ({
        ...prev,
        files: prev.files.map((f, i) =>
          i === fileIndex ? { ...f, status: 'uploading', progress: 0 } : f
        )
      }));

      // 1. Get pre-signed URL with ALL metadata
      const urlResponse = await axios.post('/upload/generate-url', {
        contentType: formData.contentType,
        contentId: contentId,
        assetType: assetType,
        fileName: file.name,
        fileSize: file.size,
        seasonNumber: options.seasonNumber,
        episodeNumber: options.episodeNumber,
        language: options.language,
        // Include metadata for database storage
        metadata: {
          title: metadata?.title || null,
          description: metadata?.description || null,
          episodeTitle: options?.episodeTitle || null,
          index: options?.index || null,
          forAsset: options?.forAsset || null,
          seasonNumber: options?.seasonNumber || null,
          episodeNumber: options?.episodeNumber || null,
          language: options?.language || null
        }
      });

      const { uploadUrl, key } = urlResponse.data;

      // 2. Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(prev => ({
            ...prev,
            files: prev.files.map((f, i) =>
              i === fileIndex ? { ...f, progress } : f
            ),
            overall: 20 + (fileIndex / totalFiles) * 80 + (progress / 100) * (80 / totalFiles)
          }));
        }
      });

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        // Add additional headers for better tracking
        if (metadata?.title) {
          xhr.setRequestHeader('X-Asset-Title', encodeURIComponent(metadata.title));
        }
        if (metadata?.description) {
          xhr.setRequestHeader('X-Asset-Description', encodeURIComponent(metadata.description));
        }

        xhr.send(file);
      });

      // 3. Confirm upload completion with COMPLETE metadata
      await axios.post('/upload/confirm', {
        key,
        contentId: contentId,
        assetType: assetType,
        metadata: {
          // Asset metadata
          asset_title: metadata?.title || null,
          asset_description: metadata?.description || null,
          alt_text: metadata?.title || null, // For SEO
          caption: metadata?.description || null,

          // Episode/season metadata
          episode_title: options?.episodeTitle || null,
          season_number: options?.seasonNumber || null,
          episode_number: options?.episodeNumber || null,

          // Subtitle information
          subtitle_languages: options?.language ? [options.language] : [],
          has_subtitles: !!options?.language,

          // Order and indexing
          sort_order: options?.index || 0,

          // Additional tracking
          original_file_name: file.name,
          file_size: file.size,
          mime_type: file.type
        }
      });

      setUploadProgress(prev => ({
        ...prev,
        files: prev.files.map((f, i) =>
          i === fileIndex ? { ...f, status: 'completed', progress: 100 } : f
        )
      }));

      console.log(`✅ Successfully uploaded ${assetType}: ${file.name}`);
      console.log(`📝 Metadata stored:`, {
        title: metadata?.title,
        description: metadata?.description,
        episodeTitle: options?.episodeTitle,
        season: options?.seasonNumber,
        episode: options?.episodeNumber,
        language: options?.language
      });

    } catch (error) {
      console.error(`❌ Failed to upload ${assetType}:`, error);
      setUploadProgress(prev => ({
        ...prev,
        files: prev.files.map((f, i) =>
          i === fileIndex ? { ...f, status: 'failed', progress: 0 } : f
        )
      }));

      // Log detailed error information
      console.error(`📄 File details:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        assetType: assetType,
        metadata: metadata,
        options: options
      });

      // Continue with other uploads even if one fails
    }
  };

  const renderStepContent = () => {
    const currentStepId = STEPS[currentStep].id;
    const errors = stepErrors[currentStepId] || [];

    const stepProps = {
      formData,
      updateFormData,
      categories,
      genres,
      tags,
      errors,
      validateCurrentStep: () => validationRules[currentStepId]()
    };

    // Show only upload progress during submission on review step
    if (currentStep === 5 && isSubmitting) {
      return <EnhancedUploadProgress uploadProgress={uploadProgress} isSubmitting={isSubmitting} />;
    }

    return (
      <div>
        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-1 text-xs">
              Please fix the following errors:
            </h3>
            <ul className="text-red-700 dark:text-red-300 text-xs list-disc list-inside space-y-0.5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Step Content */}
        <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
          {currentStep === 0 && <ContentTypeStep {...stepProps} />}
          {currentStep === 1 && <BasicInfoStep {...stepProps} />}
          {currentStep === 2 && <MediaAssetsStep {...stepProps} />}
          {currentStep === 3 && <ClassificationStep {...stepProps} />}
          {currentStep === 4 && <RightsDistributionStep {...stepProps} />}
          {currentStep === 5 && <ReviewStep {...stepProps} />}
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 transition-all duration-300",
        isVisible ? "bg-black/60" : "bg-transparent",
        isClosing ? "bg-black/0" : ""
      )}
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          "bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl transform transition-all duration-300 overflow-hidden flex flex-col",
          isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="bg-gradient-to-br from-[#BC8BBC] to-purple-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                Add New Content
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-500 dark:text-gray-400 flex-shrink-0 ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Steps - Responsive */}
        <div className="border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div
            ref={stepsContainerRef}
            className="flex items-center justify-between px-3 sm:px-4 py-2 relative min-h-[50px]"
          >
            {/* Visible Steps */}
            <div className="flex items-center flex-1 min-w-0">
              {STEPS.map((step, index) => {
                const stepErrors = validationRules[step.id]?.() || [];
                const hasErrors = stepErrors.length > 0 && index <= currentStep;

                return (
                  <div
                    key={step.id}
                    data-step={step.id}
                    className={clsx(
                      "flex items-center transition-all duration-200 flex-shrink-0",
                      index < STEPS.length - 1 && "mr-3"
                    )}
                  >
                    <button
                      onClick={() => handleStepSelect(index)}
                      disabled={isSubmitting || index > currentStep + 1}
                      className={clsx(
                        "flex items-center space-x-1.5 px-2 py-1.5 rounded transition-all duration-200 min-w-0 relative text-xs",
                        index === currentStep
                          ? "bg-[#BC8BBC] text-white shadow transform scale-105"
                          : index < currentStep
                            ? hasErrors
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {hasErrors && index < currentStep && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                      )}
                      <div className={clsx(
                        "flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0",
                        index === currentStep ? "bg-white/20" : ""
                      )}>
                        {index < currentStep ? (
                          hasErrors ? (
                            <span className="text-xs">!</span>
                          ) : (
                            <CheckCircle className="w-2.5 h-2.5" />
                          )
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="hidden xs:inline text-xs font-medium whitespace-nowrap">
                        {step.label}
                      </span>
                    </button>

                    {/* Connector Line */}
                    {index < STEPS.length - 1 && (
                      <div className={clsx(
                        "w-3 h-0.5 mx-1.5 flex-shrink-0",
                        index < currentStep ?
                          (validationRules[step.id]?.().length > 0 ? "bg-red-500" : "bg-green-500")
                          : "bg-gray-300 dark:bg-gray-600"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Steps Dropdown for Overflow */}
            {overflowSteps.length > 0 && (
              <div className="relative ml-1.5 flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setShowStepsDropdown(!showStepsDropdown)}
                  className={clsx(
                    "flex items-center space-x-1 px-2 py-1.5 rounded border transition-all duration-200 text-xs",
                    "border-[#BC8BBC] bg-[#BC8BBC]/10 text-[#BC8BBC] hover:bg-[#BC8BBC]/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  disabled={isSubmitting}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                  <ChevronDown className={clsx(
                    "w-2.5 h-2.5 transition-transform duration-200",
                    showStepsDropdown ? "rotate-180" : ""
                  )} />
                </button>

                {showStepsDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700 z-50 py-1">
                    {overflowSteps.map((step, index) => {
                      const stepIndex = STEPS.findIndex(s => s.id === step.id);
                      const stepErrors = validationRules[step.id]?.() || [];
                      const hasErrors = stepErrors.length > 0 && stepIndex <= currentStep;

                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStepSelect(stepIndex)}
                          disabled={isSubmitting || stepIndex > currentStep + 1}
                          className={clsx(
                            "flex items-center space-x-2 w-full text-left px-3 py-2 text-xs transition-colors relative",
                            "hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t last:rounded-b",
                            stepIndex === currentStep && "bg-[#BC8BBC]/10 text-[#BC8BBC]",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                          )}
                        >
                          {hasErrors && stepIndex < currentStep && (
                            <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                          )}
                          <div className={clsx(
                            "flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0",
                            stepIndex === currentStep
                              ? "bg-[#BC8BBC] text-white"
                              : stepIndex < currentStep
                                ? hasErrors
                                  ? "bg-red-500 text-white"
                                  : "bg-green-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          )}>
                            {stepIndex < currentStep ? (
                              hasErrors ? (
                                <span className="text-xs">!</span>
                              ) : (
                                <CheckCircle className="w-2.5 h-2.5" />
                              )
                            ) : (
                              stepIndex + 1
                            )}
                          </div>
                          <span className="flex-1 text-xs">{step.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Step Indicator */}
          <div className="px-3 sm:px-4 pb-2 sm:hidden">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Step {currentStep + 1} of {STEPS.length}</span>
              <span className="font-medium text-[#BC8BBC] text-xs">{STEPS[currentStep].label}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1.5">
              <div
                className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="max-w-4xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer Actions - Responsive */}
        <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 gap-2">
          <div className="flex justify-center xs:justify-start">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap text-xs">Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center xs:justify-end space-x-1.5 flex-wrap gap-1.5">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap text-xs"
            >
              Cancel
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white rounded hover:from-[#9b69b2] hover:to-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 whitespace-nowrap text-xs"
              >
                <span className="text-xs">Next Step</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 whitespace-nowrap text-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span className="text-xs">Publish Content</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}