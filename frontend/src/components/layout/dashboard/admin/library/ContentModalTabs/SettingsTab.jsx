import React, { useState } from "react";
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Globe, 
  Lock, 
  Download, 
  Share2,
  Calendar,
  Tag,
  AlertTriangle,
  Save,
  RotateCcw,
  Trash2
} from "lucide-react";
import clsx from "clsx";

const SettingsTab = ({ content }) => {
  const [settings, setSettings] = useState({
    visibility: content.visibility || 'private',
    status: content.status || 'draft',
    age_rating: content.age_rating || 'PG',
    primary_language: content.primary_language || 'en',
    downloadable: content.rights?.downloadable || false,
    shareable: content.rights?.shareable || false,
    allow_comments: true,
    content_warnings: content.content_warnings || [],
    custom_tags: []
  });

  const [hasChanges, setHasChanges] = useState(false);

  const visibilityOptions = [
    { value: 'public', label: 'Public', description: 'Visible to all users', icon: Globe },
    { value: 'private', label: 'Private', description: 'Only visible to you', icon: Lock },
    { value: 'unlisted', label: 'Unlisted', description: 'Accessible via direct link', icon: Eye }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', description: 'Work in progress' },
    { value: 'published', label: 'Published', description: 'Live and accessible' },
    { value: 'archived', label: 'Archived', description: 'Hidden from users' }
  ];

  const ageRatings = [
    { value: 'G', label: 'G - General Audience' },
    { value: 'PG', label: 'PG - Parental Guidance' },
    { value: 'PG-13', label: 'PG-13 - Parents Strongly Cautioned' },
    { value: 'R', label: 'R - Restricted' },
    { value: 'NC-17', label: 'NC-17 - Adults Only' }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' }
  ];

  const contentWarnings = [
    'Violence',
    'Strong Language',
    'Sexual Content',
    'Drug Use',
    'Flashing Lights',
    'Disturbing Imagery'
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving settings:', settings);
    setHasChanges(false);
    onSettingsUpdate?.(settings);
  };

  const handleReset = () => {
    setSettings({
      visibility: content.visibility || 'private',
      status: content.status || 'draft',
      age_rating: content.age_rating || 'PG',
      primary_language: content.primary_language || 'en',
      downloadable: content.rights?.downloadable || false,
      shareable: content.rights?.shareable || false,
      allow_comments: true,
      content_warnings: content.content_warnings || [],
      custom_tags: []
    });
    setHasChanges(false);
  };

  const SettingSection = ({ title, description, children }) => (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-gray-400 text-sm">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  const ToggleSetting = ({ label, description, enabled, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="text-white font-medium">{label}</div>
        {description && (
          <div className="text-gray-400 text-sm mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-green-500" : "bg-gray-600"
        )}
      >
        <span
          className={clsx(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-white text-xl font-semibold">Content Settings</h2>
          <p className="text-gray-400">Manage visibility, permissions, and content configuration</p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Visibility & Access */}
      <SettingSection
        title="Visibility & Access"
        description="Control who can see and access this content"
      >
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Visibility</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSettingChange('visibility', option.value)}
                    className={clsx(
                      "border rounded-lg p-4 cursor-pointer transition-all",
                      settings.visibility === option.value
                        ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
                        : "border-gray-700 hover:border-gray-600"
                    )}
                  >
                    <Icon className="w-5 h-5 mb-2 text-[#BC8BBC]" />
                    <div className="text-white font-medium mb-1">{option.label}</div>
                    <div className="text-gray-400 text-sm">{option.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Status</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSettingChange('status', option.value)}
                  className={clsx(
                    "border rounded-lg p-4 cursor-pointer transition-all",
                    settings.status === option.value
                      ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                >
                  <div className="text-white font-medium mb-1">{option.label}</div>
                  <div className="text-gray-400 text-sm">{option.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SettingSection>

      {/* Content Configuration */}
      <SettingSection
        title="Content Configuration"
        description="Basic content settings and classifications"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Age Rating</label>
            <select
              value={settings.age_rating}
              onChange={(e) => handleSettingChange('age_rating', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
            >
              {ageRatings.map((rating) => (
                <option key={rating.value} value={rating.value}>
                  {rating.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Primary Language</label>
            <select
              value={settings.primary_language}
              onChange={(e) => handleSettingChange('primary_language', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SettingSection>

      {/* Permissions */}
      <SettingSection
        title="User Permissions"
        description="Control what users can do with this content"
      >
        <div className="space-y-1">
          <ToggleSetting
            label="Allow Downloads"
            description="Users can download this content for offline viewing"
            enabled={settings.downloadable}
            onChange={(value) => handleSettingChange('downloadable', value)}
          />
          
          <ToggleSetting
            label="Allow Sharing"
            description="Users can share this content with others"
            enabled={settings.shareable}
            onChange={(value) => handleSettingChange('shareable', value)}
          />
          
          <ToggleSetting
            label="Allow Comments"
            description="Users can post comments and reviews"
            enabled={settings.allow_comments}
            onChange={(value) => handleSettingChange('allow_comments', value)}
          />
        </div>
      </SettingSection>

      {/* Content Warnings */}
      <SettingSection
        title="Content Warnings"
        description="Add warnings for sensitive content"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {contentWarnings.map((warning) => {
            const isSelected = settings.content_warnings.some(w => w.warning_type === warning);
            
            return (
              <div
                key={warning}
                onClick={() => {
                  const newWarnings = isSelected
                    ? settings.content_warnings.filter(w => w.warning_type !== warning)
                    : [...settings.content_warnings, { warning_type: warning, severity: 'moderate' }];
                  handleSettingChange('content_warnings', newWarnings);
                }}
                className={clsx(
                  "border rounded-lg p-3 cursor-pointer transition-all text-center",
                  isSelected
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                    : "border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300"
                )}
              >
                <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                <div className="text-sm">{warning}</div>
              </div>
            );
          })}
        </div>
      </SettingSection>

      {/* Custom Tags */}
      <SettingSection
        title="Custom Tags"
        description="Add custom tags for better organization and searchability"
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a custom tag..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC]"
            />
            <button className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors">
              <Tag className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {settings.custom_tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#BC8BBC]/20 text-[#BC8BBC] rounded-full text-sm"
              >
                <Tag className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => {
                    const newTags = settings.custom_tags.filter((_, i) => i !== index);
                    handleSettingChange('custom_tags', newTags);
                  }}
                  className="hover:text-[#9b69b2] transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection
        title="Danger Zone"
        description="Irreversible and destructive actions"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-400/20 bg-red-400/10 rounded-lg">
            <div>
              <div className="text-red-400 font-medium">Delete Content</div>
              <div className="text-red-300 text-sm">
                Permanently remove this content and all associated files
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
                  console.log('Delete content:', content.id);
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-yellow-400/20 bg-yellow-400/10 rounded-lg">
            <div>
              <div className="text-yellow-400 font-medium">Reset Analytics</div>
              <div className="text-yellow-300 text-sm">
                Clear all view statistics and engagement data
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset all analytics data?')) {
                  console.log('Reset analytics for:', content.id);
                }
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </SettingSection>
    </div>
  );
};

export default SettingsTab;