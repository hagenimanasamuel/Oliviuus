import React, { useState, useEffect } from "react";
import { X, Calendar, Shield, Clock, Palette, Lock, Book, Tv, Search, TrendingUp, Star } from "lucide-react";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function EditKidProfileModal({ kid, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: kid.name || "",
    birth_date: kid.birth_date || "",
    max_age_rating: kid.max_age_rating || "7",
    daily_time_limit_minutes: kid.daily_time_limit_minutes || 120,
    require_pin_to_exit: kid.require_pin_to_exit !== false,
    theme_color: kid.theme_color || "default",
    interface_mode: kid.interface_mode || "simple",
    allowed_content_types: kid.allowed_content_types || ["cartoons", "educational", "family"],
    allow_movies: kid.allow_movies !== false,
    allow_series: kid.allow_series !== false,
    allow_live_events: kid.allow_live_events || false,
    allow_search: kid.allow_search !== false,
    allow_trending: kid.allow_trending !== false,
    allow_recommendations: kid.allow_recommendations !== false,
    blocked_genres: kid.blocked_genres || []
  });

  const [loading, setLoading] = useState(false);
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

  const contentCategories = [
    { id: "cartoons", label: t('familyProfiles.modals.editKidProfile.contentCategories.cartoons'), icon: "📺" },
    { id: "educational", label: t('familyProfiles.modals.editKidProfile.contentCategories.educational'), icon: "📚" },
    { id: "family", label: t('familyProfiles.modals.editKidProfile.contentCategories.family'), icon: "👨‍👩‍👧‍👦" },
    { id: "adventure", label: t('familyProfiles.modals.editKidProfile.contentCategories.adventure'), icon: "🏔️" },
    { id: "comedy", label: t('familyProfiles.modals.editKidProfile.contentCategories.comedy'), icon: "😂" },
    { id: "music", label: t('familyProfiles.modals.editKidProfile.contentCategories.music'), icon: "🎵" }
  ];

  const blockedGenresOptions = [
    t('familyProfiles.modals.editKidProfile.blockedGenres.horror'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.violence'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.romance'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.thriller'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.drama'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.action'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.fantasy'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.sciFi'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.mystery'),
    t('familyProfiles.modals.editKidProfile.blockedGenres.crime')
  ];

  // Initialize modal with zoom-in animation
  useEffect(() => {
    setTimeout(() => setShowModal(true), 50);
  }, []);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/kids/profiles/${kid.id}`, formData);
      setShowModal(false);
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error) {
      console.error("Error updating kid profile:", error);
      alert(error.response?.data?.message || t('familyProfiles.modals.editKidProfile.error'));
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

  const toggleContentType = (typeId) => {
    setFormData(prev => ({
      ...prev,
      allowed_content_types: prev.allowed_content_types.includes(typeId)
        ? prev.allowed_content_types.filter(id => id !== typeId)
        : [...prev.allowed_content_types, typeId]
    }));
  };

  const toggleBlockedGenre = (genre) => {
    setFormData(prev => ({
      ...prev,
      blocked_genres: prev.blocked_genres.includes(genre)
        ? prev.blocked_genres.filter(g => g !== genre)
        : [...prev.blocked_genres, genre]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        showModal ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t('familyProfiles.modals.editKidProfile.title', { name: kid.name })}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {t('familyProfiles.modals.editKidProfile.subtitle')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              {t('familyProfiles.modals.editKidProfile.basicInformation')}
            </h4>
            
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('familyProfiles.modals.editKidProfile.childName')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={t('familyProfiles.modals.editKidProfile.childNamePlaceholder')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Calendar size={14} className="mr-2" />
                {t('familyProfiles.modals.editKidProfile.birthDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.birth_date}
                onChange={(e) => handleChange("birth_date", e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
              />
            </div>
          </div>

          {/* Content Restrictions Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              {t('familyProfiles.modals.editKidProfile.contentRestrictions')}
            </h4>

            {/* Maximum Age Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Shield size={14} className="mr-2" />
                {t('familyProfiles.modals.editKidProfile.maxAgeRating')} *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {ageRatings.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleChange("max_age_rating", rating)}
                    className={`py-2 px-3 rounded-lg border transition-all duration-300 transform hover:scale-105 ${
                      formData.max_age_rating === rating
                        ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white scale-105"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {rating}+
                  </button>
                ))}
              </div>
            </div>

            {/* Allowed Content Types */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {t('familyProfiles.modals.editKidProfile.allowedContentTypes')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {contentCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleContentType(category.id)}
                    className={`flex items-center p-3 rounded-lg border transition-all duration-300 transform hover:scale-105 ${
                      formData.allowed_content_types.includes(category.id)
                        ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white"
                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <span className="text-lg mr-2">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Blocked Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                {t('familyProfiles.modals.editKidProfile.blockedGenres')}
              </label>
              <div className="flex flex-wrap gap-2">
                {blockedGenresOptions.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleBlockedGenre(genre)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                      formData.blocked_genres.includes(genre)
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time & Access Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              {t('familyProfiles.modals.editKidProfile.timeAndAccess')}
            </h4>

            {/* Daily Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Clock size={14} className="mr-2" />
                {t('familyProfiles.modals.editKidProfile.dailyTimeLimit')} *
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {timeLimits.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => handleChange("daily_time_limit_minutes", minutes)}
                      className={`py-2 px-3 rounded-lg border transition-all duration-300 transform hover:scale-105 text-sm ${
                        formData.daily_time_limit_minutes === minutes
                          ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white scale-105"
                          : "border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
                
                {/* Time Slider */}
                <div className="pt-2">
                  <input
                    type="range"
                    min="30"
                    max="240"
                    step="30"
                    value={formData.daily_time_limit_minutes}
                    onChange={(e) => handleChange("daily_time_limit_minutes", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider transition-all duration-300"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>30m</span>
                    <span>240m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Access */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex items-center">
                  <Tv size={16} className="text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      {t('familyProfiles.modals.editKidProfile.allowMovies')}
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("allow_movies", !formData.allow_movies)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    formData.allow_movies ? "bg-[#BC8BBC]" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                      formData.allow_movies ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex items-center">
                  <Book size={16} className="text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      {t('familyProfiles.modals.editKidProfile.allowSeries')}
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("allow_series", !formData.allow_series)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    formData.allow_series ? "bg-[#BC8BBC]" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                      formData.allow_series ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex items-center">
                  <Search size={16} className="text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      {t('familyProfiles.modals.editKidProfile.allowSearch')}
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("allow_search", !formData.allow_search)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    formData.allow_search ? "bg-[#BC8BBC]" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                      formData.allow_search ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex items-center">
                  <TrendingUp size={16} className="text-gray-400 mr-3" />
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      {t('familyProfiles.modals.editKidProfile.allowTrending')}
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("allow_trending", !formData.allow_trending)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    formData.allow_trending ? "bg-[#BC8BBC]" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                      formData.allow_trending ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance & Security Section */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              {t('familyProfiles.modals.editKidProfile.appearanceAndSecurity')}
            </h4>

            {/* Theme Color - FIXED: DEFAULT IS PERMANENTLY SELECTED AND UNMODIFIABLE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Palette size={14} className="mr-2" />
                {t('familyProfiles.modals.editKidProfile.themeColor')}
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
                      title={color.value === "default" ? color.label : `${color.label} - ${t('familyProfiles.modals.editKidProfile.upgradeToModify')}`}
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
                    {t('familyProfiles.modals.editKidProfile.selected')}: <span className="font-medium text-white">
                      {themeColors.find(color => color.value === formData.theme_color)?.label}
                    </span>
                    <span className="ml-2 text-xs text-[#BC8BBC] bg-[#BC8BBC]/10 px-2 py-1 rounded-full">
                      {t('familyProfiles.modals.editKidProfile.default')}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('familyProfiles.modals.editKidProfile.defaultThemeDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* PIN Protection */}
            <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50 transform transition-all duration-300 hover:scale-[1.02]">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  {t('familyProfiles.modals.editKidProfile.requirePin')}
                </label>
                <p className="text-gray-500 text-sm">
                  {t('familyProfiles.modals.editKidProfile.requirePinDescription')}
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
              {loading ? t('familyProfiles.modals.editKidProfile.updating') : t('familyProfiles.modals.editKidProfile.updateProfile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}