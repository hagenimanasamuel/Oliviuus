import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  Globe,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Download,
  Share2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Film,
  Tv,
  Video,
  FileText,
  Award,
  Users,
  BarChart3,
  Crown
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";

const SettingsTab = ({ content, onSettingsUpdate, isLoading: parentLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Content types from your database ENUM
  const CONTENT_TYPES = [
    { value: 'movie', label: 'Movie', icon: Film },
    { value: 'series', label: 'Series', icon: Tv },
    { value: 'documentary', label: 'Documentary', icon: FileText },
    { value: 'short_film', label: 'Short Film', icon: Video },
    { value: 'live_event', label: 'Live Event', icon: Users }
  ];

  // Status options from your database ENUM
  const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft', color: 'text-yellow-500' },
    { value: 'published', label: 'Published', color: 'text-green-500' },
    { value: 'archived', label: 'Archived', color: 'text-red-500' },
    { value: 'scheduled', label: 'Scheduled', color: 'text-blue-500' }
  ];

  // Visibility options from your database ENUM
  const VISIBILITY_OPTIONS = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Visible to everyone' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only visible to you and admins' },
    { value: 'unlisted', label: 'Unlisted', icon: EyeOff, description: 'Only accessible with direct link' }
  ];

  // Content quality options from your database ENUM
  const QUALITY_OPTIONS = [
    { value: 'SD', label: 'Standard Definition (SD)' },
    { value: 'HD', label: 'High Definition (HD)' },
    { value: 'FHD', label: 'Full HD (1080p)' },
    { value: 'UHD', label: 'Ultra HD (4K)' }
  ];

  // Parse content data from backend
  const parseContentData = (content) => {
    if (!content) {
      return getDefaultFormData();
    }

    return {
      // Basic Information
      title: content.title || '',
      description: content.description || '',
      short_description: content.short_description || '',
      content_type: content.content_type || 'movie',

      // Publishing Control
      status: content.status || 'draft',
      visibility: content.visibility || 'private',
      featured: Boolean(content.featured),
      trending: Boolean(content.trending),
      featured_order: content.featured_order || 0,
      scheduled_publish_at: content.scheduled_publish_at
        ? new Date(content.scheduled_publish_at).toISOString().split('T')[0]
        : '',

      // Classification
      age_rating: content.age_rating || '',
      primary_language: content.primary_language || 'en',

      // Content Quality
      content_quality: content.content_quality || 'HD',
      has_subtitles: Boolean(content.has_subtitles),
      has_dubbing: Boolean(content.has_dubbing),

      // Metadata
      duration_minutes: content.duration_minutes || '',
      release_date: content.release_date || '',
      director: content.director || '',

      // Additional Fields
      production_company: content.production_company || '',
      budget: content.budget || '',
      subject: content.subject || '',
      location: content.location || '',
      festival: content.festival || '',

      // Series-specific
      total_seasons: content.total_seasons || '',
      episodes_per_season: content.episodes_per_season || '',
      episode_duration_minutes: content.episode_duration_minutes || '',

      // Live event specific
      event_date: content.event_date || '',
      event_location: content.event_location || '',
      expected_audience: content.expected_audience || '',

      // SEO
      meta_title: content.meta_title || '',
      meta_description: content.meta_description || '',
      keywords: Array.isArray(content.keywords) ? content.keywords.join(', ') : (content.keywords || ''),
      canonical_url: content.canonical_url || '',

      // Engagement Metrics (read-only display)
      view_count: content.view_count || 0,
      like_count: content.like_count || 0,
      share_count: content.share_count || 0,
      average_rating: content.average_rating || 0,
      rating_count: content.rating_count || 0
    };
  };

  const getDefaultFormData = () => ({
    title: '',
    description: '',
    short_description: '',
    content_type: 'movie',
    status: 'draft',
    visibility: 'private',
    featured: false,
    trending: false,
    featured_order: 0,
    scheduled_publish_at: '',
    age_rating: '',
    primary_language: 'en',
    content_quality: 'HD',
    has_subtitles: false,
    has_dubbing: false,
    duration_minutes: '',
    release_date: '',
    director: '',
    production_company: '',
    budget: '',
    subject: '',
    location: '',
    festival: '',
    total_seasons: '',
    episodes_per_season: '',
    episode_duration_minutes: '',
    event_date: '',
    event_location: '',
    expected_audience: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    canonical_url: '',
    view_count: 0,
    like_count: 0,
    share_count: 0,
    average_rating: 0,
    rating_count: 0
  });

  // Deep comparison function
  const hasChanges = (current, original) => {
    if (!current || !original) return false;
    
    const currentKeys = Object.keys(current);
    const originalKeys = Object.keys(original);
    
    if (currentKeys.length !== originalKeys.length) return true;
    
    for (let key of currentKeys) {
      const currentVal = current[key];
      const originalVal = original[key];
      
      // Handle different types and deep comparison
      if (currentVal !== originalVal) {
        // Special handling for numbers vs strings
        if (!isNaN(currentVal) && !isNaN(originalVal)) {
          if (Number(currentVal) !== Number(originalVal)) return true;
        } else if (currentVal !== originalVal) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Validation function
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    } else if (data.title.length > 255) {
      errors.title = 'Title must be less than 255 characters';
    }
    
    if (!data.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!data.age_rating?.trim()) {
      errors.age_rating = 'Age rating is required';
    }
    
    if (!data.content_type) {
      errors.content_type = 'Content type is required';
    }
    
    if (data.featured_order < 0) {
      errors.featured_order = 'Featured order cannot be negative';
    }
    
    if (data.duration_minutes && data.duration_minutes < 0) {
      errors.duration_minutes = 'Duration cannot be negative';
    }
    
    if (data.budget && data.budget < 0) {
      errors.budget = 'Budget cannot be negative';
    }
    
    if (data.total_seasons && data.total_seasons < 0) {
      errors.total_seasons = 'Total seasons cannot be negative';
    }
    
    if (data.episodes_per_season && data.episodes_per_season < 0) {
      errors.episodes_per_season = 'Episodes per season cannot be negative';
    }
    
    if (data.episode_duration_minutes && data.episode_duration_minutes < 0) {
      errors.episode_duration_minutes = 'Episode duration cannot be negative';
    }
    
    if (data.expected_audience && data.expected_audience < 0) {
      errors.expected_audience = 'Expected audience cannot be negative';
    }
    
    return errors;
  };

  // Load content data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsInitializing(true);
        setValidationErrors({});

        if (content?.id) {
          // If we have content ID but content data might be incomplete, fetch fresh data
          if (!content.title || Object.keys(content).length <= 1) {
            const response = await api.get(`/contents/${content.id}`);
            const freshContent = response.data.content;
            const parsedData = parseContentData(freshContent);
            setFormData(parsedData);
            setOriginalData(parsedData);
          } else {
            const parsedData = parseContentData(content);
            setFormData(parsedData);
            setOriginalData(parsedData);
          }
        } else {
          const defaultData = getDefaultFormData();
          setFormData(defaultData);
          setOriginalData(defaultData);
        }
      } catch (error) {
        console.error('Error initializing settings data:', error);
        const defaultData = getDefaultFormData();
        setFormData(defaultData);
        setOriginalData(defaultData);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [content]);

  const handleSave = async () => {
    if (!content?.id) {
      alert('Cannot save settings: No content selected');
      return;
    }

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      alert('Please fix the validation errors before saving.');
      return;
    }

    // Check if there are actual changes
    if (!hasChanges(formData, originalData)) {
      alert('No changes detected. Settings are already up to date.');
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setSaveStatus('saving');
    setValidationErrors({});

    try {
      const settingsData = {
        // Basic Information
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description,
        content_type: formData.content_type,

        // Publishing Control
        status: formData.status,
        visibility: formData.visibility,
        featured: formData.featured,
        trending: formData.trending,
        featured_order: parseInt(formData.featured_order) || 0,
        scheduled_publish_at: formData.scheduled_publish_at || null,

        // Classification
        age_rating: formData.age_rating,
        primary_language: formData.primary_language,

        // Content Quality
        content_quality: formData.content_quality,
        has_subtitles: formData.has_subtitles,
        has_dubbing: formData.has_dubbing,

        // Metadata
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        release_date: formData.release_date || null,
        director: formData.director || null,
        production_company: formData.production_company || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        subject: formData.subject || null,
        location: formData.location || null,
        festival: formData.festival || null,

        // Series-specific
        total_seasons: formData.total_seasons ? parseInt(formData.total_seasons) : null,
        episodes_per_season: formData.episodes_per_season ? parseInt(formData.episodes_per_season) : null,
        episode_duration_minutes: formData.episode_duration_minutes ? parseInt(formData.episode_duration_minutes) : null,

        // Live event specific
        event_date: formData.event_date || null,
        event_location: formData.event_location || null,
        expected_audience: formData.expected_audience ? parseInt(formData.expected_audience) : null,

        // SEO
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        keywords: formData.keywords || null,
        canonical_url: formData.canonical_url || null
      };

      // Use PATCH for partial updates to prevent data loss
      const response = await api.patch(`/contents/${content.id}`, settingsData);
      
      setSaveStatus('success');

      // Update local form data with the response
      const updatedContent = response.data.content;
      if (updatedContent) {
        const parsedData = parseContentData(updatedContent);
        setFormData(parsedData);
        setOriginalData(parsedData); // Update original data to new state
      }

      // Call parent update callback
      if (onSettingsUpdate && response.data.content) {
        onSettingsUpdate(response.data.content);
      }

      // Auto-close edit mode after successful save
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus('');
      }, 2000);

    } catch (error) {
      console.error("❌ Failed to update settings:", error);
      setSaveStatus('error');

      let errorMessage = 'Failed to update settings. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setFormData(originalData);
    setValidationErrors({});
    setIsEditing(false);
    setSaveStatus('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleNumberChange = (field, value) => {
    // Allow empty string or valid numbers
    if (value === '' || !isNaN(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: null }));
      }
    }
  };

  const handleEditStart = () => {
    setValidationErrors({});
    setIsEditing(true);
  };

  const isSaving = isLoading || parentLoading;
  const hasUnsavedChanges = formData && originalData && hasChanges(formData, originalData);

  // Show loading only during initial data fetch
  if (isInitializing || !formData) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-[#BC8BBC]" />
        <span className="ml-2 text-gray-400">Loading settings...</span>
      </div>
    );
  }

  const SettingSection = ({ title, icon: Icon, children, className }) => (
    <div className={clsx("bg-gray-800/50 rounded-lg p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#BC8BBC]/10 rounded-lg">
          <Icon className="w-5 h-5 text-[#BC8BBC]" />
        </div>
        <h3 className="text-white font-semibold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );

  const SettingField = ({ label, description, children, required = false, error }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
        enabled ? "bg-[#BC8BBC]" : "bg-gray-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header with Edit Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Content Settings</h2>
          <p className="text-gray-400 text-sm">
            Manage all content settings, metadata, and publishing options
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEditStart}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors border border-[#BC8BBC] rounded-lg disabled:opacity-50"
          >
            <Settings className="w-4 h-4" />
            Edit Settings
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 transition-colors rounded-lg min-w-24 justify-center",
                hasUnsavedChanges 
                  ? "bg-[#BC8BBC] text-white hover:bg-[#9b69b2]" 
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Save Status Indicator */}
      {saveStatus === 'success' && (
        <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <h4 className="text-green-400 font-semibold">Settings Updated Successfully!</h4>
              <p className="text-green-300 text-sm">Your changes have been saved.</p>
            </div>
          </div>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <h4 className="text-red-400 font-semibold">Failed to Save</h4>
              <p className="text-red-300 text-sm">Please try again or check your connection.</p>
            </div>
          </div>
        </div>
      )}

      {/* Changes Indicator */}
      {isEditing && hasUnsavedChanges && (
        <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-semibold">Unsaved Changes</h4>
              <p className="text-blue-300 text-sm">You have unsaved changes. Click "Save Changes" to apply them.</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <SettingSection title="Basic Information" icon={FileText}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingField label="Content Type" required error={validationErrors.content_type}>
            <select
              value={formData.content_type}
              onChange={(e) => handleInputChange('content_type', e.target.value)}
              disabled={!isEditing}
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                validationErrors.content_type ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            >
              {CONTENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </SettingField>

          <SettingField label="Age Rating" required description="Enter age rating (e.g., 13+, 16+, 18+, All Ages)" error={validationErrors.age_rating}>
            <input
              type="text"
              value={formData.age_rating}
              onChange={(e) => handleInputChange('age_rating', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., 13+, 16+, All Ages"
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                validationErrors.age_rating ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            />
          </SettingField>

          <SettingField label="Title" required error={validationErrors.title}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={!isEditing}
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                validationErrors.title ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            />
          </SettingField>

          <SettingField label="Primary Language" required>
            <select
              value={formData.primary_language}
              onChange={(e) => handleInputChange('primary_language', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            >
              <option value="en">English</option>
              <option value="rw">Kinyarwanda</option>
              <option value="fr">French</option>
              <option value="sw">Kiswahili</option>
            </select>
          </SettingField>

          <SettingField label="Description" required error={validationErrors.description} className="lg:col-span-2">
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows="4"
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50 resize-vertical",
                validationErrors.description ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            />
          </SettingField>

          <SettingField label="Short Description" className="lg:col-span-2">
            <textarea
              value={formData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              disabled={!isEditing}
              rows="2"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50 resize-vertical"
              placeholder="Brief description (max 150 characters)"
            />
          </SettingField>
        </div>
      </SettingSection>

      {/* Publishing Control */}
      <SettingSection title="Publishing Control" icon={Globe}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SettingField label="Status" required>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </SettingField>

          <SettingField label="Visibility" required>
            <select
              value={formData.visibility}
              onChange={(e) => handleInputChange('visibility', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            >
              {VISIBILITY_OPTIONS.map(visibility => (
                <option key={visibility.value} value={visibility.value}>{visibility.label}</option>
              ))}
            </select>
          </SettingField>

          <SettingField label="Scheduled Publish Date">
            <input
              type="datetime-local"
              value={formData.scheduled_publish_at}
              onChange={(e) => handleInputChange('scheduled_publish_at', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            />
          </SettingField>

          <SettingField label="Featured Order" error={validationErrors.featured_order}>
            <input
              type="number"
              value={formData.featured_order}
              onChange={(e) => handleNumberChange('featured_order', e.target.value)}
              disabled={!isEditing}
              min="0"
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                validationErrors.featured_order ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            />
          </SettingField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-white font-medium">Featured</div>
                <div className="text-gray-400 text-sm">Show in featured section</div>
              </div>
            </div>
            <ToggleSwitch
              enabled={formData.featured}
              onChange={(enabled) => handleCheckboxChange('featured', enabled)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-white font-medium">Trending</div>
                <div className="text-gray-400 text-sm">Mark as trending content</div>
              </div>
            </div>
            <ToggleSwitch
              enabled={formData.trending}
              onChange={(enabled) => handleCheckboxChange('trending', enabled)}
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-white font-medium">Subtitles</div>
                <div className="text-gray-400 text-sm">Has subtitle tracks</div>
              </div>
            </div>
            <ToggleSwitch
              enabled={formData.has_subtitles}
              onChange={(enabled) => handleCheckboxChange('has_subtitles', enabled)}
              disabled={!isEditing}
            />
          </div>
        </div>
      </SettingSection>

      {/* Content Metadata */}
      <SettingSection title="Content Metadata" icon={Film}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SettingField label="Duration (minutes)" error={validationErrors.duration_minutes}>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => handleNumberChange('duration_minutes', e.target.value)}
              disabled={!isEditing}
              min="0"
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                validationErrors.duration_minutes ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            />
          </SettingField>

          <SettingField label="Release Date">
            <input
              type="date"
              value={formData.release_date}
              onChange={(e) => handleInputChange('release_date', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            />
          </SettingField>

          <SettingField label="Director">
            <input
              type="text"
              value={formData.director}
              onChange={(e) => handleInputChange('director', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            />
          </SettingField>

          <SettingField label="Production Company">
            <input
              type="text"
              value={formData.production_company}
              onChange={(e) => handleInputChange('production_company', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            />
          </SettingField>

          <SettingField label="Budget ($)" error={validationErrors.budget}>
            <input
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => handleNumberChange('budget', e.target.value)}
              disabled={!isEditing}
              min="0"
              className={clsx(
                "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                validationErrors.budget ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
              )}
            />
          </SettingField>

          <SettingField label="Content Quality">
            <select
              value={formData.content_quality}
              onChange={(e) => handleInputChange('content_quality', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            >
              {QUALITY_OPTIONS.map(quality => (
                <option key={quality.value} value={quality.value}>{quality.label}</option>
              ))}
            </select>
          </SettingField>

          <SettingField label="Subject" className="md:col-span-2">
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            />
          </SettingField>

          <SettingField label="Location">
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
            />
          </SettingField>
        </div>
      </SettingSection>

      {/* Series Specific Settings */}
      {(formData.content_type === 'series' || formData.total_seasons) && (
        <SettingSection title="Series Information" icon={Tv}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SettingField label="Total Seasons" error={validationErrors.total_seasons}>
              <input
                type="number"
                value={formData.total_seasons}
                onChange={(e) => handleNumberChange('total_seasons', e.target.value)}
                disabled={!isEditing}
                min="0"
                className={clsx(
                  "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                  validationErrors.total_seasons ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
                )}
              />
            </SettingField>

            <SettingField label="Episodes Per Season" error={validationErrors.episodes_per_season}>
              <input
                type="number"
                value={formData.episodes_per_season}
                onChange={(e) => handleNumberChange('episodes_per_season', e.target.value)}
                disabled={!isEditing}
                min="0"
                className={clsx(
                  "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                  validationErrors.episodes_per_season ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
                )}
              />
            </SettingField>

            <SettingField label="Episode Duration (minutes)" error={validationErrors.episode_duration_minutes}>
              <input
                type="number"
                value={formData.episode_duration_minutes}
                onChange={(e) => handleNumberChange('episode_duration_minutes', e.target.value)}
                disabled={!isEditing}
                min="0"
                className={clsx(
                  "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                  validationErrors.episode_duration_minutes ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
                )}
              />
            </SettingField>
          </div>
        </SettingSection>
      )}

      {/* Live Event Specific Settings */}
      {(formData.content_type === 'live_event' || formData.event_date) && (
        <SettingSection title="Live Event Information" icon={Users}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingField label="Event Date & Time">
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
              />
            </SettingField>

            <SettingField label="Event Location">
              <input
                type="text"
                value={formData.event_location}
                onChange={(e) => handleInputChange('event_location', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
              />
            </SettingField>

            <SettingField label="Expected Audience" error={validationErrors.expected_audience}>
              <input
                type="number"
                value={formData.expected_audience}
                onChange={(e) => handleNumberChange('expected_audience', e.target.value)}
                disabled={!isEditing}
                min="0"
                className={clsx(
                  "w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:outline-none disabled:opacity-50",
                  validationErrors.expected_audience ? "border-red-500" : "border-gray-600 focus:border-[#BC8BBC]"
                )}
              />
            </SettingField>

            <SettingField label="Festival">
              <input
                type="text"
                value={formData.festival}
                onChange={(e) => handleInputChange('festival', e.target.value)}
                disabled={!isEditing}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
              />
            </SettingField>
          </div>
        </SettingSection>
      )}

      {/* SEO Settings */}
      <SettingSection title="SEO Settings" icon={BarChart3}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettingField label="Meta Title">
            <input
              type="text"
              value={formData.meta_title}
              onChange={(e) => handleInputChange('meta_title', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
              placeholder="SEO title for search engines"
            />
          </SettingField>

          <SettingField label="Canonical URL">
            <input
              type="url"
              value={formData.canonical_url}
              onChange={(e) => handleInputChange('canonical_url', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
              placeholder="https://example.com/canonical-url"
            />
          </SettingField>

          <SettingField label="Meta Description" className="lg:col-span-2">
            <textarea
              value={formData.meta_description}
              onChange={(e) => handleInputChange('meta_description', e.target.value)}
              disabled={!isEditing}
              rows="3"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50 resize-vertical"
              placeholder="SEO description for search engines"
            />
          </SettingField>

          <SettingField label="Keywords" className="lg:col-span-2">
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50"
              placeholder="comma, separated, keywords"
            />
          </SettingField>
        </div>
      </SettingSection>

      {/* Engagement Metrics (Read-only) */}
      <SettingSection title="Engagement Metrics" icon={Award}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 border border-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{formData.view_count?.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Views</div>
          </div>
          <div className="text-center p-4 border border-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{formData.like_count?.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Likes</div>
          </div>
          <div className="text-center p-4 border border-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{formData.share_count?.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Shares</div>
          </div>
          <div className="text-center p-4 border border-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-white">{formData.average_rating || 0}</div>
            <div className="text-gray-400 text-sm">Rating ({formData.rating_count} reviews)</div>
          </div>
        </div>
      </SettingSection>

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1">Edit Mode Active</h4>
              <p className="text-yellow-300 text-sm">
                You are currently editing content settings. Changes will be saved when you click "Save Changes".
                Some fields are required and must be filled before saving.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;