import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Calendar, Shield, Clock, Palette, Pencil, Lock } from "lucide-react";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

const avatarCategories = {
  People: [
    "avataaars",
    "bottts",
    "identicon",
    "thumbs",
    "micah",
    "pixel-art",
    "croodles",
    "fun-emoji",
    "personas",
    "open-peeps",
    "notionists",
    "miniavs",
  ],
  Animals: [
    "adventurer",
    "big-ears",
    "big-smile",
    "pixel-art-neutral",
    "miniavs",
    "notionists-neutral",
    "icons",
    "gridy",
  ],
  Fantasy: [
    "shapes",
    "avataaars",
    "micah",
    "thumbs",
    "pixel-art",
    "croodles",
    "bottts",
    "adventurer",
  ],
  Abstract: [
    "icons",
    "gridy",
    "bottts",
    "beam",
    "croodles-neutral",
    "lorelei",
    "micah",
    "shapes",
  ],
};

export default function CreateKidProfileModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    max_age_rating: "7",
    daily_time_limit_minutes: 120,
    require_pin_to_exit: true,
    theme_color: "default", // Always default, cannot be changed
    interface_mode: "simple",
    avatar_url: ""
  });

  const [loading, setLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("People");
  const [customAgeRating, setCustomAgeRating] = useState("");
  const [customTimeLimit, setCustomTimeLimit] = useState("");
  const [showModal, setShowModal] = useState(false);

  const ageRatings = ["3", "7", "11", "13", "16"];
  const timeLimits = [30, 60, 90, 120, 150, 180, 210, 240];
  const themeColors = [
    { value: "default", label: "Default", class: "bg-gradient-to-r from-[#BC8BBC] to-purple-600" },
    { value: "#3B82F6", label: "Blue", class: "bg-blue-500" },
    { value: "#10B981", label: "Green", class: "bg-green-500" },
    { value: "#8B5CF6", label: "Purple", class: "bg-purple-500" },
    { value: "#EC4899", label: "Pink", class: "bg-pink-500" },
    { value: "#F59E0B", label: "Orange", class: "bg-orange-500" },
    { value: "#EF4444", label: "Red", class: "bg-red-500" },
  ];

  // Initialize modal with zoom-in animation
  useEffect(() => {
    setTimeout(() => setShowModal(true), 50);
  }, []);

  // Generate avatar list
  const avatarList = useMemo(() => {
    const list = [];
    avatarCategories[selectedCategory].forEach((style) => {
      for (let i = 0; i < 6; i++) {
        const seed = `${style}-${i}-${Date.now()}`;
        list.push({
          url: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=BC8BBC`,
          style: style,
        });
      }
    });
    return list;
  }, [selectedCategory]);

  // Set default avatar when name changes
  useEffect(() => {
    if (formData.name && !formData.avatar_url) {
      const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}&backgroundColor=BC8BBC`;
      setFormData(prev => ({ ...prev, avatar_url: defaultAvatar }));
    }
  }, [formData.name]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        max_age_rating: customAgeRating || formData.max_age_rating,
        daily_time_limit_minutes: customTimeLimit ? parseInt(customTimeLimit) : formData.daily_time_limit_minutes,
        // Content restrictions (default values)
        blocked_genres: [],
        allowed_content_types: ["cartoons", "educational", "family"],
        allow_movies: true,
        allow_series: true,
        allow_live_events: false,
        allow_search: true,
        allow_trending: true,
        allow_recommendations: true
      };

      await api.post("/kids/profiles", submitData);
      setShowModal(false);
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error) {
      console.error("Error creating kid profile:", error);
      alert(error.response?.data?.message || t('familyProfiles.modals.createKidProfile.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarSelect = (avatarUrl) => {
    setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
    setShowAvatarPicker(false);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        showModal ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Plus className="mr-2 text-[#BC8BBC]" size={20} />
            {t('familyProfiles.modals.createKidProfile.title')}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Selection */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative transform transition-all duration-300 hover:scale-105">
              <img
                src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=BC8BBC`}
                alt="Kid avatar"
                className="w-20 h-20 rounded-full border-2 border-[#BC8BBC] object-cover transform transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-2 -right-2 bg-[#BC8BBC] text-white p-1 rounded-full hover:bg-[#9b69b2] transition-all duration-300 transform hover:scale-110"
              >
                <Pencil size={14} />
              </button>
            </div>
            
            {showAvatarPicker && (
              <div className="w-full space-y-3 p-4 border border-gray-700 rounded-lg bg-gray-800 transform transition-all duration-300">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.keys(avatarCategories).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === cat
                          ? "bg-[#BC8BBC] text-white scale-105"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {t(`familyProfiles.modals.createKidProfile.avatarCategories.${cat}`, cat)}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {avatarList.map((avatar, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar.url)}
                      className="p-1 rounded-lg hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
                    >
                      <img
                        src={avatar.url}
                        alt={`Avatar ${index}`}
                        className="w-12 h-12 rounded-full object-cover transform transition-all duration-300"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('familyProfiles.modals.createKidProfile.childName')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t('familyProfiles.modals.createKidProfile.childNamePlaceholder')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
            />
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Calendar size={14} className="mr-2" />
              {t('familyProfiles.modals.createKidProfile.birthDate')} *
            </label>
            <input
              type="date"
              required
              value={formData.birth_date}
              onChange={(e) => handleChange("birth_date", e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
            />
            {formData.birth_date && (
              <p className="text-sm text-gray-400 mt-1 transform transition-all duration-300">
                {t('familyProfiles.modals.createKidProfile.age', { age: calculateAge(formData.birth_date) })}
              </p>
            )}
          </div>

          {/* Maximum Age Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Shield size={14} className="mr-2" />
              {t('familyProfiles.modals.createKidProfile.maxAgeRating')} *
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {ageRatings.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, max_age_rating: rating }));
                      setCustomAgeRating("");
                    }}
                    className={`py-2 px-3 rounded-lg border transition-all duration-300 transform hover:scale-105 ${
                      formData.max_age_rating === rating && !customAgeRating
                        ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white scale-105"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {rating}+
                  </button>
                ))}
              </div>
              
              {/* Custom Age Input */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">{t('familyProfiles.modals.createKidProfile.custom')}:</span>
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={customAgeRating}
                  onChange={(e) => {
                    setCustomAgeRating(e.target.value);
                    if (e.target.value) {
                      setFormData(prev => ({ ...prev, max_age_rating: e.target.value }));
                    }
                  }}
                  placeholder={t('familyProfiles.modals.createKidProfile.enterAge')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
                />
                <span className="text-gray-400 text-sm">{t('familyProfiles.modals.createKidProfile.yearsOld')}</span>
              </div>
            </div>
          </div>

          {/* Daily Time Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Clock size={14} className="mr-2" />
              {t('familyProfiles.modals.createKidProfile.dailyTimeLimit')} *
            </label>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {timeLimits.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, daily_time_limit_minutes: minutes }));
                      setCustomTimeLimit("");
                    }}
                    className={`py-2 px-3 rounded-lg border transition-all duration-300 transform hover:scale-105 text-sm ${
                      formData.daily_time_limit_minutes === minutes && !customTimeLimit
                        ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white scale-105"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
              
              {/* Custom Time Input */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">{t('familyProfiles.modals.createKidProfile.custom')}:</span>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={customTimeLimit}
                  onChange={(e) => {
                    setCustomTimeLimit(e.target.value);
                    if (e.target.value) {
                      setFormData(prev => ({ ...prev, daily_time_limit_minutes: parseInt(e.target.value) }));
                    }
                  }}
                  placeholder={t('familyProfiles.modals.createKidProfile.enterMinutes')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
                />
                <span className="text-gray-400 text-sm">{t('familyProfiles.modals.createKidProfile.minutes')}</span>
              </div>
              
              {/* Time Slider */}
              <div className="pt-2">
                <input
                  type="range"
                  min="30"
                  max="240"
                  step="30"
                  value={customTimeLimit ? parseInt(customTimeLimit) : formData.daily_time_limit_minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, daily_time_limit_minutes: value }));
                    setCustomTimeLimit(value.toString());
                  }}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider transition-all duration-300"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>30m</span>
                  <span>240m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Color - FIXED: DEFAULT IS PERMANENTLY SELECTED AND UNMODIFIABLE */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
              <Palette size={14} className="mr-2" />
              {t('familyProfiles.modals.createKidProfile.themeColor')}
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {themeColors.map((color) => (
                  <div
                    key={color.value}
                    className={`relative w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      formData.theme_color === color.value
                        ? "border-white ring-2 ring-[#BC8BBC] scale-110"
                        : "border-gray-600"
                    } ${
                      color.value !== "default" ? "cursor-not-allowed opacity-50" : ""
                    }`}
                    style={color.value !== 'default' ? { backgroundColor: color.value } : {}}
                    title={color.value === "default" ? color.label : `${color.label} - ${t('familyProfiles.modals.createKidProfile.upgradeToModify')}`}
                  >
                    {color.value === 'default' && (
                      <div className={`w-full h-full rounded-full ${color.class} flex items-center justify-center`}>
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                    )}
                    
                    {/* Lock icon for non-default colors */}
                    {color.value !== "default" && (
                      <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                        <Lock size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Selected Theme Info */}
              <div className="p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-300">
                  {t('familyProfiles.modals.createKidProfile.selected')}: <span className="font-medium text-white">
                    {themeColors.find(color => color.value === formData.theme_color)?.label}
                  </span>
                  <span className="ml-2 text-xs text-[#BC8BBC] bg-[#BC8BBC]/10 px-2 py-1 rounded-full">
                    {t('familyProfiles.modals.createKidProfile.default')}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('familyProfiles.modals.createKidProfile.defaultThemeDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* PIN Protection */}
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('familyProfiles.modals.createKidProfile.requirePin')}
              </label>
              <p className="text-gray-500 text-sm">
                {t('familyProfiles.modals.createKidProfile.requirePinDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("require_pin_to_exit", !formData.require_pin_to_exit)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                formData.require_pin_to_exit ? "bg-[#BC8BBC]" : "bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                  formData.require_pin_to_exit ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-900 pb-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.birth_date}
              className="flex-1 bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? t('familyProfiles.modals.createKidProfile.creating') : t('familyProfiles.modals.createKidProfile.createProfile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}