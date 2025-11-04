import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Download,
  Share2,
  Clock,
  Calendar,
  MapPin,
  Lock,
  Unlock,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  RefreshCw,
  Save,
  X,
  DollarSign,
  TrendingUp,
  Building,
  Target,
  Shield,
  AlertCircle
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";

const RightsTab = ({ content, onRightsUpdate, isLoading: parentLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Database-driven default values
  const DEFAULT_RIGHTS_DATA = {
    license_type: 'non-exclusive',
    exclusive: false,
    downloadable: false,
    shareable: false,
    commercial_use: false,
    georestricted: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    allowed_regions: ['rwanda'],
    blocked_countries: [],
    license_fee: '',
    revenue_share_percentage: ''
  };

  // Enhanced license types matching your backend ENUM
  const LICENSE_TYPES = [
    {
      value: 'exclusive',
      label: 'Exclusive License',
      description: 'Sole rights for distribution',
      icon: Crown,
      color: 'text-purple-600'
    },
    {
      value: 'non-exclusive',
      label: 'Non-Exclusive License',
      description: 'Multiple distributors allowed',
      icon: Globe,
      color: 'text-blue-600'
    },
    {
      value: 'limited',
      label: 'Limited Time License',
      description: 'Fixed duration with renewal options',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      value: 'perpetual',
      label: 'Perpetual License',
      description: 'Lifetime rights without expiration',
      icon: Lock,
      color: 'text-green-600'
    }
  ];

  // Enhanced regions with all African and global coverage
  const REGIONS = [
    { value: 'rwanda', label: 'Rwanda', countries: ['RW'], local: true, flag: '🇷🇼' },
    { value: 'uganda', label: 'Uganda', countries: ['UG'], local: true, flag: '🇺🇬' },
    { value: 'kenya', label: 'Kenya', countries: ['KE'], local: true, flag: '🇰🇪' },
    { value: 'tanzania', label: 'Tanzania', countries: ['TZ'], local: true, flag: '🇹🇿' },
    { value: 'burundi', label: 'Burundi', countries: ['BI'], local: true, flag: '🇧🇮' },
    { value: 'east-africa', label: 'East Africa', countries: ['RW', 'KE', 'TZ', 'UG', 'BI', 'SS', 'ET', 'ER', 'DJ', 'SO'], flag: '🌍' },
    { value: 'west-africa', label: 'West Africa', countries: ['NG', 'GH', 'CI', 'SN', 'ML', 'GN', 'BF', 'NE', 'TG', 'BJ'], flag: '🌍' },
    { value: 'southern-africa', label: 'Southern Africa', countries: ['ZA', 'ZM', 'ZW', 'MW', 'BW', 'NA', 'LS', 'SZ', 'AO', 'MZ'], flag: '🌍' },
    { value: 'central-africa', label: 'Central Africa', countries: ['CD', 'CG', 'CM', 'GA', 'CF', 'GQ', 'ST', 'TD'], flag: '🌍' },
    { value: 'north-africa', label: 'North Africa', countries: ['EG', 'MA', 'TN', 'DZ', 'LY', 'SD', 'MR'], flag: '🌍' },
    { value: 'africa', label: 'All Africa', countries: ['All African Countries'], flag: '🌍' },
    { value: 'europe', label: 'Europe', countries: ['All EU Countries'], flag: '🇪🇺' },
    { value: 'north-america', label: 'North America', countries: ['US', 'CA', 'MX'], flag: '🌎' },
    { value: 'south-america', label: 'South America', countries: ['All South American Countries'], flag: '🌎' },
    { value: 'asia', label: 'Asia', countries: ['All Asian Countries'], flag: '🌏' },
    { value: 'global', label: 'Global', countries: ['Worldwide'], flag: '🌐' }
  ];

  // Content warnings from your database/classification system
  const CONTENT_WARNINGS = [
    'None',
    'Violence',
    'Graphic Violence',
    'Strong Language',
    'Profanity',
    'Nudity',
    'Partial Nudity',
    'Sexual Content',
    'Sexual Themes',
    'Sexual Violence',
    'Drug Use',
    'Substance Abuse',
    'Alcohol Use',
    'Smoking',
    'Flashing Lights',
    'Strobe Effects',
    'Gore',
    'Body Horror',
    'Jump Scares',
    'Psychological Horror',
    'Horror Themes',
    'Thematic Elements',
    'Mature Themes',
    'Disturbing Content',
    'Emotional Distress',
    'Suicide Themes',
    'Self-Harm',
    'Abuse',
    'Domestic Violence',
    'Child Abuse',
    'Animal Cruelty',
    'Animal Death',
    'Death',
    'Grief',
    'War Violence',
    'Torture',
    'Kidnapping',
    'Stalking',
    'Bullying',
    'Discrimination',
    'Racism',
    'Sexism',
    'Homophobia',
    'Transphobia',
    'Religious Themes',
    'Political Themes',
    'Conspiracy Theories',
    'Legal Issues',
    'Crime',
    'Criminal Behavior',
    'Weapons',
    'Gun Violence',
    'Knife Violence',
    'Explosions',
    'Car Accidents',
    'Natural Disasters',
    'Medical Procedures',
    'Illness',
    'Pandemic Themes',
    'Body Transformation',
    'Eating Disorders',
    'Mental Health Issues',
    'Abandonment',
    'Betrayal',
    'Revenge',
    'Revenge Porn',
    'Sex Trafficking',
    'Human Trafficking',
    'Terrorism',
    'Extremism',
    'Cult Themes',
    'Occult Themes',
    'Supernatural Violence',
    'Paranormal Activity',
    'Exorcism',
    'Witchcraft',
    'Satanic Themes',
    'Religious Violence',
    'Blasphemy',
    'Sacrilege'
  ];

  // Enhanced parseRightsData with debugging
  const parseRightsData = useCallback((rights, contentData = null) => {
    // Check if rights data is truly invalid
    const isInvalidRights = !rights ||
      typeof rights !== 'object' ||
      Object.keys(rights).length === 0 ||
      (!rights.license_type && !rights.allowed_regions);


    if (isInvalidRights) {
      const defaultData = { ...DEFAULT_RIGHTS_DATA };

      // Enhance with content-specific defaults if available
      if (contentData) {

        // Set region based on content location if available
        if (contentData.location) {
          const location = contentData.location.toLowerCase();
          if (location.includes('rwanda')) defaultData.allowed_regions = ['rwanda'];
          else if (location.includes('east africa')) defaultData.allowed_regions = ['east-africa'];
          else if (location.includes('africa')) defaultData.allowed_regions = ['africa'];
        }

        // Set license type based on content type
        if (contentData.content_type === 'movie') {
          defaultData.license_type = 'exclusive';
        }
      }

      return defaultData;
    }


    // Handle allowed_regions - parse JSON if string, or use array directly
    let allowedRegions = DEFAULT_RIGHTS_DATA.allowed_regions;
    try {
      if (rights.allowed_regions) {

        if (typeof rights.allowed_regions === 'string') {
          allowedRegions = JSON.parse(rights.allowed_regions);
        } else if (Array.isArray(rights.allowed_regions)) {
          allowedRegions = rights.allowed_regions;
        }
      }
    } catch (e) {
      console.error('❌ Failed to parse allowed_regions:', e);
      console.log('❌ Raw allowed_regions that failed:', rights.allowed_regions);
    }

    // Handle blocked_countries
    let blockedCountries = [];
    try {
      if (rights.blocked_countries) {
        if (typeof rights.blocked_countries === 'string') {
          blockedCountries = JSON.parse(rights.blocked_countries);
        } else if (Array.isArray(rights.blocked_countries)) {
          blockedCountries = rights.blocked_countries;
        }
      }
    } catch (e) {
      console.error('❌ Failed to parse blocked_countries:', e);
    }

    // Handle dates - convert to YYYY-MM-DD format for inputs
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (e) {
        console.warn('Date parsing error:', e);
        return '';
      }
    };

    // Handle boolean values - ensure proper boolean conversion
    const exclusive = Boolean(rights.exclusive);
    const downloadable = Boolean(rights.downloadable);
    const shareable = Boolean(rights.shareable);
    const commercial_use = Boolean(rights.commercial_use);
    const georestricted = rights.georestricted !== false; // Default to true

    // Handle numeric values safely
    const license_fee = rights.license_fee ? parseFloat(rights.license_fee).toString() : '';
    const revenue_share_percentage = rights.revenue_share_percentage ? parseFloat(rights.revenue_share_percentage).toString() : '';

    const result = {
      license_type: rights.license_type || DEFAULT_RIGHTS_DATA.license_type,
      exclusive: exclusive,
      downloadable: downloadable,
      shareable: shareable,
      commercial_use: commercial_use,
      georestricted: georestricted,
      start_date: formatDateForInput(rights.start_date) || DEFAULT_RIGHTS_DATA.start_date,
      end_date: formatDateForInput(rights.end_date),
      allowed_regions: allowedRegions,
      blocked_countries: blockedCountries,
      license_fee: license_fee,
      revenue_share_percentage: revenue_share_percentage
    };

    return result;
  }, []);

  // Enhanced validation function
  const validateForm = (data) => {
    const errors = {};

    if (!data.license_type) {
      errors.license_type = 'License type is required';
    }

    if (data.license_fee && parseFloat(data.license_fee) < 0) {
      errors.license_fee = 'License fee cannot be negative';
    }

    if (data.revenue_share_percentage) {
      const percentage = parseFloat(data.revenue_share_percentage);
      if (percentage < 0 || percentage > 100) {
        errors.revenue_share_percentage = 'Revenue share must be between 0-100%';
      }
    }

    if (data.end_date && data.start_date && new Date(data.end_date) < new Date(data.start_date)) {
      errors.end_date = 'End date cannot be before start date';
    }

    if (data.license_type !== 'perpetual' && !data.end_date) {
      errors.end_date = 'End date is required for non-perpetual licenses';
    }

    if (!data.allowed_regions || data.allowed_regions.length === 0) {
      errors.allowed_regions = 'At least one distribution region is required';
    }

    return errors;
  };

  // Change detection
  const hasChanges = (current, original) => {
    if (!current || !original) return false;
    return JSON.stringify(current) !== JSON.stringify(original);
  };

  // Load rights data
  useEffect(() => {
    const initializeRightsData = async () => {
      try {
        setIsInitializing(true);
        setValidationErrors({});

        let parsedData;

        if (content?.id) {
          // Enhanced check for valid rights data
          const hasValidRights = content?.rights &&
            typeof content.rights === 'object' &&
            Object.keys(content.rights).length > 0 &&
            (content.rights.license_type || content.rights.allowed_regions);

          if (!hasValidRights) {
            console.log('🔄 No valid rights data found, creating from defaults and content data');
            parsedData = parseRightsData({}, content);
          } else {
            console.log('📥 Using existing rights data:', content.rights);
            parsedData = parseRightsData(content.rights, content);
          }
        } else {
          console.log('🔄 No content ID, using defaults');
          parsedData = parseRightsData({});
        }

        setFormData(parsedData);
        setOriginalData(parsedData);

      } catch (error) {
        console.error('❌ Error initializing rights data:', error);
        // Set safe defaults on error
        const defaultData = parseRightsData({});
        setFormData(defaultData);
        setOriginalData(defaultData);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeRightsData();
  }, [content, parseRightsData]);

  const handleSave = async () => {
    if (!content?.id) {
      alert('Cannot save rights: No content selected');
      return;
    }

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessage = Object.values(errors).join('\n• ');
      alert(`Please fix the following errors:\n• ${errorMessage}`);
      return;
    }

    // Check if there are actual changes
    if (!hasChanges(formData, originalData)) {
      alert('No changes detected. Rights settings are already up to date.');
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setSaveStatus('saving');
    setValidationErrors({});

    try {
      console.log('💾 Saving enhanced rights data:', formData);

      // Prepare data according to your content_rights table structure
      const rightsData = {
        license_type: formData.license_type,
        exclusive: formData.exclusive,
        downloadable: formData.downloadable,
        shareable: formData.shareable,
        commercial_use: formData.commercial_use,
        georestricted: formData.georestricted,
        start_date: formData.start_date || null,
        end_date: formData.license_type === 'perpetual' ? null : (formData.end_date || null),
        allowed_regions: formData.allowed_regions.length > 0 ? formData.allowed_regions : ['rwanda'],
        blocked_countries: formData.blocked_countries || [],
        license_fee: formData.license_fee ? parseFloat(formData.license_fee) : null,
        revenue_share_percentage: formData.revenue_share_percentage ? parseFloat(formData.revenue_share_percentage) : null
      };

      // Use the correct endpoint from your contentController
      const response = await api.put(`/contents/${content.id}/rights`, rightsData);

      setSaveStatus('success');

      // Update local form data with the response
      const updatedRights = response.data.content?.rights;
      if (updatedRights) {
        const parsedData = parseRightsData(updatedRights);
        setFormData(parsedData);
        setOriginalData(parsedData); // Update original data
      }

      // Call parent update callback
      if (onRightsUpdate) {
        onRightsUpdate(response.data.content);
      }

      // Auto-close edit mode after successful save
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus('');
      }, 1500);

    } catch (error) {
      console.error("❌ Failed to update rights:", error);
      setSaveStatus('error');

      let errorMessage = 'Failed to update rights. Please try again.';
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

  const handleRegionToggle = (regionValue) => {
    const currentRegions = formData.allowed_regions || [];
    const newRegions = currentRegions.includes(regionValue)
      ? currentRegions.filter(r => r !== regionValue)
      : [...currentRegions, regionValue];

    setFormData(prev => ({ ...prev, allowed_regions: newRegions }));
    // Clear validation error when user makes changes
    if (validationErrors.allowed_regions) {
      setValidationErrors(prev => ({ ...prev, allowed_regions: null }));
    }
  };

  const handleSelectAllRegions = async (category = 'all') => {
    let regionsToSelect = [];

    if (category === 'local') {
      regionsToSelect = REGIONS.filter(region => region.local).map(r => r.value);
    } else if (category === 'regional') {
      regionsToSelect = REGIONS.filter(region => !region.local && region.value !== 'global').map(r => r.value);
    } else {
      regionsToSelect = REGIONS.map(r => r.value);
    }

    setFormData(prev => ({
      ...prev,
      allowed_regions: [...new Set([...prev.allowed_regions, ...regionsToSelect])]
    }));

    // Clear validation error
    if (validationErrors.allowed_regions) {
      setValidationErrors(prev => ({ ...prev, allowed_regions: null }));
    }
  };

  const handleClearAllRegions = (category = 'all') => {
    const regionCount = getSelectedRegionsCount(category);
    if (regionCount > 0) {
      const message = category === 'all'
        ? `Clear all ${regionCount} selected regions?`
        : `Clear ${regionCount} selected ${category} regions?`;

      if (!window.confirm(message)) return;
    }

    let regionsToKeep = [];

    if (category === 'local') {
      regionsToKeep = formData.allowed_regions.filter(region =>
        !REGIONS.find(r => r.value === region && r.local)
      );
    } else if (category === 'regional') {
      regionsToKeep = formData.allowed_regions.filter(region =>
        !REGIONS.find(r => r.value === region && !r.local && r.value !== 'global')
      );
    } else {
      regionsToKeep = [];
    }

    // Always keep at least Rwanda if clearing everything
    if (regionsToKeep.length === 0 && category === 'all') {
      regionsToKeep = ['rwanda'];
    }

    setFormData(prev => ({
      ...prev,
      allowed_regions: regionsToKeep
    }));
  };

  const getLicenseConfig = (type) => {
    const license = LICENSE_TYPES.find(l => l.value === type);
    if (!license) return { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: Globe };

    switch (type) {
      case 'exclusive':
        return { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: license.icon };
      case 'non-exclusive':
        return { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: license.icon };
      case 'limited':
        return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: license.icon };
      case 'perpetual':
        return { color: 'text-green-400', bg: 'bg-green-400/10', icon: license.icon };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: Globe };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const calculateRemainingTime = () => {
    if (!formData?.start_date || !formData?.end_date || formData.license_type === 'perpetual') return null;

    try {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const today = new Date();

      if (end <= today) return { status: 'expired', days: 0 };

      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) return { status: 'expiring', days: diffDays };
      return { status: 'active', days: diffDays };
    } catch (e) {
      return null;
    }
  };

  const getSelectedRegionsCount = (category = 'all') => {
    if (!formData?.allowed_regions) return 0;

    if (category === 'local') {
      return formData.allowed_regions.filter(region =>
        REGIONS.find(r => r.value === region && r.local)
      ).length;
    } else if (category === 'regional') {
      return formData.allowed_regions.filter(region =>
        REGIONS.find(r => r.value === region && !r.local)
      ).length;
    }

    return formData.allowed_regions.length;
  };

  // Show loading only during initial data fetch
  if (isInitializing || !formData) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 animate-spin text-[#BC8BBC]" />
        <span className="ml-2 text-gray-400">Loading rights data...</span>
      </div>
    );
  }

  const timeRemaining = calculateRemainingTime();
  const isSaving = isLoading || parentLoading;
  const hasUnsavedChanges = formData && originalData && hasChanges(formData, originalData);

  const LicenseBadge = ({ type }) => {
    const config = getLicenseConfig(type);
    const Icon = config.icon;
    const license = LICENSE_TYPES.find(l => l.value === type);

    return (
      <div className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
        config.bg,
        config.color
      )}>
        <Icon className="w-4 h-4" />
        {license?.label || type}
      </div>
    );
  };

  const PermissionToggle = ({ icon: Icon, label, enabled, description, onToggle, disabled, color = "green" }) => (
    <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className={clsx(
          "p-2 rounded-lg flex-shrink-0",
          enabled
            ? color === "green" ? "bg-green-400/10 text-green-400"
              : color === "blue" ? "bg-blue-400/10 text-blue-400"
                : "bg-purple-400/10 text-purple-400"
            : "bg-gray-600 text-gray-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-white font-medium">{label}</div>
          <div className="text-gray-400 text-sm">{description}</div>
        </div>
      </div>
      {isEditing ? (
        <button
          onClick={onToggle}
          disabled={disabled}
          className={clsx(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
            enabled
              ? color === "green" ? "bg-green-500"
                : color === "blue" ? "bg-blue-500"
                  : "bg-purple-500"
              : "bg-gray-600",
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
      ) : (
        <div className={clsx(
          "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
          enabled
            ? color === "green" ? "bg-green-400/10 text-green-400"
              : color === "blue" ? "bg-blue-400/10 text-blue-400"
                : "bg-purple-400/10 text-purple-400"
            : "bg-gray-600 text-gray-400"
        )}>
          {enabled ? 'Enabled' : 'Disabled'}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Edit Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold">Rights & Distribution</h2>
          <p className="text-gray-400 text-sm">
            Manage licensing, distribution regions, and usage rights
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors border border-[#BC8BBC] rounded-lg disabled:opacity-50"
          >
            <Edit className="w-4 h-4" />
            Edit Rights
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors border border-gray-600 rounded-lg disabled:opacity-50"
            >
              <X className="w-4 h-4" />
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
              <h4 className="text-green-400 font-semibold">Rights Updated Successfully!</h4>
              <p className="text-green-300 text-sm">Your changes have been saved.</p>
            </div>
          </div>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
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

      {/* License Information */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">License Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">License Type</div>
            {isEditing ? (
              <div className="space-y-1">
                <select
                  value={formData.license_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_type: e.target.value }))}
                  className={clsx(
                    "w-full bg-gray-600 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#BC8BBC]",
                    validationErrors.license_type ? "border-red-500" : "border-gray-500"
                  )}
                >
                  {LICENSE_TYPES.map(license => (
                    <option key={license.value} value={license.value}>
                      {license.label}
                    </option>
                  ))}
                </select>
                {validationErrors.license_type && (
                  <p className="text-red-400 text-xs">{validationErrors.license_type}</p>
                )}
              </div>
            ) : (
              <LicenseBadge type={formData.license_type} />
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Start Date</div>
            {isEditing ? (
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#BC8BBC]"
              />
            ) : (
              <div className="text-white font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(formData.start_date)}
              </div>
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">End Date</div>
            {isEditing && formData.license_type !== 'perpetual' ? (
              <div className="space-y-1">
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={formData.start_date}
                  className={clsx(
                    "w-full bg-gray-600 border rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#BC8BBC]",
                    validationErrors.end_date ? "border-red-500" : "border-gray-500"
                  )}
                />
                {validationErrors.end_date && (
                  <p className="text-red-400 text-xs">{validationErrors.end_date}</p>
                )}
              </div>
            ) : (
              <div className="text-white font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {formData.license_type === 'perpetual' ? 'Never' : formatDate(formData.end_date) || 'Not set'}
              </div>
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-2">Exclusivity</div>
            <div className={clsx(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm",
              formData.exclusive
                ? "bg-red-400/10 text-red-400"
                : "bg-green-400/10 text-green-400"
            )}>
              {formData.exclusive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              {formData.exclusive ? 'Exclusive' : 'Non-exclusive'}
            </div>
          </div>
        </div>

        {/* Time Remaining Display */}
        {timeRemaining && formData.start_date && formData.end_date && formData.license_type !== 'perpetual' && (
          <div className={clsx(
            "flex items-center gap-3 p-3 rounded-lg border text-sm font-medium",
            timeRemaining.status === 'expired' && "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
            timeRemaining.status === 'expiring' && "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300",
            timeRemaining.status === 'active' && "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
          )}>
            <Clock className="w-4 h-4" />
            <span>
              {timeRemaining.status === 'expired' && 'License has expired'}
              {timeRemaining.status === 'expiring' && `License expires in ${timeRemaining.days} days`}
              {timeRemaining.status === 'active' && `License active for ${timeRemaining.days} more days`}
            </span>
          </div>
        )}

        <div className="text-sm text-gray-400 mt-3">
          {LICENSE_TYPES.find(l => l.value === formData.license_type)?.description}
        </div>
      </div>

      {/* Distribution Regions */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">Distribution Regions</h3>
            <p className="text-gray-400 text-sm">
              {getSelectedRegionsCount()} of {REGIONS.length} regions enabled
              {formData.georestricted && ' • Geo-restrictions active'}
            </p>
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAllRegions('local')}
                className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
              >
                Select Local
              </button>
              <button
                onClick={() => handleClearAllRegions('local')}
                className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
              >
                Clear Local
              </button>
            </div>
          )}
        </div>

        {validationErrors.allowed_regions && (
          <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.allowed_regions}
            </p>
          </div>
        )}

        {/* Local Regions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="text-sm font-medium text-gray-300">Local & Border Regions</h4>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
                {getSelectedRegionsCount('local')} selected
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {REGIONS.filter(region => region.local).map((region) => {
              const isEnabled = formData.allowed_regions?.includes(region.value);

              return (
                <div
                  key={region.value}
                  className={clsx(
                    "border rounded-lg p-3 transition-all cursor-pointer group",
                    isEnabled
                      ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
                      : "border-gray-700 bg-gray-700/30",
                    isEditing && "hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/5"
                  )}
                  onClick={() => isEditing && handleRegionToggle(region.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{region.flag}</span>
                      <MapPin className={clsx(
                        "w-4 h-4",
                        isEnabled ? "text-[#BC8BBC]" : "text-gray-500"
                      )} />
                    </div>
                    {isEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className={clsx(
                    "font-medium text-sm mb-1",
                    isEnabled ? "text-white" : "text-gray-400"
                  )}>
                    {region.label}
                  </div>
                  <div className={clsx(
                    "text-xs",
                    isEnabled ? "text-[#BC8BBC]" : "text-gray-500"
                  )}>
                    {region.countries.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regional & Global Regions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-sm font-medium text-gray-300">Regional & Global Distribution</h4>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                {getSelectedRegionsCount('regional')} selected
              </span>
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAllRegions('regional')}
                  className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleClearAllRegions('regional')}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {REGIONS.filter(region => !region.local).map((region) => {
              const isEnabled = formData.allowed_regions?.includes(region.value);

              return (
                <div
                  key={region.value}
                  className={clsx(
                    "border rounded-lg p-3 transition-all cursor-pointer group",
                    isEnabled
                      ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
                      : "border-gray-700 bg-gray-700/30",
                    isEditing && "hover:border-[#BC8BBC] hover:bg-[#BC8BBC]/5"
                  )}
                  onClick={() => isEditing && handleRegionToggle(region.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{region.flag}</span>
                      <Globe className={clsx(
                        "w-4 h-4",
                        isEnabled ? "text-[#BC8BBC]" : "text-gray-500"
                      )} />
                    </div>
                    {isEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className={clsx(
                    "font-medium text-sm mb-1",
                    isEnabled ? "text-white" : "text-gray-400"
                  )}>
                    {region.label}
                  </div>
                  <div className={clsx(
                    "text-xs",
                    isEnabled ? "text-[#BC8BBC]" : "text-gray-500"
                  )}>
                    {Array.isArray(region.countries)
                      ? region.countries.slice(0, 2).join(', ') + (region.countries.length > 2 ? '...' : '')
                      : region.countries
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Usage Permissions */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Usage Permissions</h3>

        <div className="space-y-3">
          <PermissionToggle
            icon={Download}
            label="Offline Downloads"
            enabled={formData.downloadable}
            description="Allow users to download this content for offline viewing"
            onToggle={() => setFormData(prev => ({ ...prev, downloadable: !prev.downloadable }))}
            disabled={!isEditing}
            color="green"
          />

          <PermissionToggle
            icon={Share2}
            label="Social Sharing"
            enabled={formData.shareable}
            description="Allow users to share this content with others"
            onToggle={() => setFormData(prev => ({ ...prev, shareable: !prev.shareable }))}
            disabled={!isEditing}
            color="blue"
          />

          <PermissionToggle
            icon={Building}
            label="Commercial Use"
            enabled={formData.commercial_use}
            description="Allow commercial use and monetization"
            onToggle={() => setFormData(prev => ({ ...prev, commercial_use: !prev.commercial_use }))}
            disabled={!isEditing}
            color="purple"
          />

          <PermissionToggle
            icon={Target}
            label="Geo-restrictions"
            enabled={formData.georestricted}
            description="Restrict access based on user location"
            onToggle={() => setFormData(prev => ({ ...prev, georestricted: !prev.georestricted }))}
            disabled={!isEditing}
            color="blue"
          />
        </div>
      </div>

      {/* Financial Information */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Financial Terms</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              License Fee
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.license_fee || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, license_fee: e.target.value }))}
                className={clsx(
                  "w-full bg-gray-700 border rounded pl-8 pr-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50",
                  validationErrors.license_fee ? "border-red-500" : "border-gray-600"
                )}
                placeholder="0.00"
                disabled={!isEditing}
              />
            </div>
            {validationErrors.license_fee && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.license_fee}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">One-time licensing fee</p>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue Share
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.revenue_share_percentage || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, revenue_share_percentage: e.target.value }))}
                className={clsx(
                  "w-full bg-gray-700 border rounded pl-3 pr-8 py-2 text-white focus:outline-none focus:border-[#BC8BBC] disabled:opacity-50",
                  validationErrors.revenue_share_percentage ? "border-red-500" : "border-gray-600"
                )}
                placeholder="0.00"
                disabled={!isEditing}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">%</span>
              </div>
            </div>
            {validationErrors.revenue_share_percentage && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.revenue_share_percentage}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">Percentage of revenue share</p>
          </div>
        </div>
      </div>

      {/* Content Warnings Integration */}
      {(content?.content_warnings && content.content_warnings.length > 0) && (
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#BC8BBC]" />
              <div>
                <h3 className="text-white font-semibold">Content Warnings</h3>
                <p className="text-gray-400 text-sm">Based on content classification</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-orange-400/20 text-orange-300 rounded-full">
              {content.content_warnings.length} warning(s)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {content.content_warnings
              .filter(warning => warning.warning_type && warning.warning_type !== 'None')
              .map((warning, index) => (
                <div
                  key={warning.id || index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-400/10 border border-orange-400/20 rounded-full text-xs text-orange-300"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {warning.warning_type}
                  {warning.severity && (
                    <span className="text-orange-200/70 ml-1">({warning.severity})</span>
                  )}
                </div>
              ))
            }

            {/* Show message if only "None" is selected */}
            {content.content_warnings.length === 1 &&
              content.content_warnings[0].warning_type === 'None' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-400/10 border border-green-400/20 rounded-full text-xs text-green-300">
                  <CheckCircle className="w-3 h-3" />
                  No content warnings
                </div>
              )}
          </div>

          <p className="text-gray-400 text-xs mt-3">
            These warnings are managed in the Content Classification settings and help inform distribution decisions.
          </p>
        </div>
      )}

      {/* Fallback if no content warnings data */}
      {(!content?.content_warnings || content.content_warnings.length === 0) && (
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="text-white font-semibold">Content Warnings</h3>
              <p className="text-gray-400 text-sm">No content warnings configured</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Content warnings can be added in the Content Classification settings.
          </p>
        </div>
      )}

      {/* Fallback if no content warnings data */}
      {(!content?.content_warnings || content.content_warnings.length === 0) && (
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="text-white font-semibold">Content Warnings</h3>
              <p className="text-gray-400 text-sm">No content warnings configured</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Content warnings can be added in the Content Classification settings.
          </p>
        </div>
      )}

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1">Edit Mode Active</h4>
              <p className="text-yellow-300 text-sm">
                You are currently editing rights and distribution settings.
                Changes will be saved when you click "Save Changes".
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RightsTab;