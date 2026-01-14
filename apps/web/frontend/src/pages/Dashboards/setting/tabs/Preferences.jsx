import React, { useState, useEffect, useRef } from "react";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export default function Preferences({ user }) {
  const { t, i18n } = useTranslation();

  const [language, setLanguage] = useState("rw");
  const [genres, setGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [filteredGenres, setFilteredGenres] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [autoSubtitles, setAutoSubtitles] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetchingGenres, setFetchingGenres] = useState(true);
  const [message, setMessage] = useState("");
  const [initialPrefs, setInitialPrefs] = useState(null);
  
  // UI states
  const [showGenres, setShowGenres] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Language dropdown state
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef(null);

  // Determine initial language dynamically
  const getDynamicLanguage = () => {
    if (user?.preferences?.language) return user.preferences.language;
    const stored = localStorage.getItem("lang");
    return stored || "rw";
  };

  // Fetch available genres from database
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setFetchingGenres(true);
        const response = await api.get('/user/genres/list', { withCredentials: true });
        
        if (response.data && response.data.genres) {
          setAvailableGenres(response.data.genres);
          setFilteredGenres(response.data.genres.slice(0, 8));
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
        // Fallback to static genres if API fails
        const fallbackGenres = [
          "Comedy",
          "Drama",
          "Action",
          "Romance",
          "Horror",
          "Documentary",
          "Animation",
        ].map((name, index) => ({
          id: index,
          name,
          slug: name.toLowerCase(),
          description: `${name} content`
        }));
        setAvailableGenres(fallbackGenres);
        setFilteredGenres(fallbackGenres.slice(0, 8));
      } finally {
        setFetchingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  // Filter genres based on search and categories
  useEffect(() => {
    let filtered = [...availableGenres];
    
    if (searchQuery) {
      filtered = filtered.filter(genre => 
        genre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (genre.description && genre.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(genre => 
        genre.category && selectedCategories.includes(genre.category)
      );
    }
    
    if (!showGenres) {
      filtered = filtered.slice(0, 8);
    }
    
    setFilteredGenres(filtered);
  }, [searchQuery, selectedCategories, showGenres, availableGenres]);

  // Auto-fill form using user.preferences
  useEffect(() => {
    if (user?.preferences) {
      const prefs = user.preferences;

      const detectedLang = getDynamicLanguage();
      setLanguage(detectedLang);
      i18n.changeLanguage(detectedLang);

      let savedGenres = [];
      if (Array.isArray(prefs.genres)) {
        if (prefs.genres.length > 0 && typeof prefs.genres[0] === 'object') {
          savedGenres = prefs.genres.map(g => g.id || g.name);
        } else {
          savedGenres = prefs.genres;
        }
      } else if (typeof prefs.genres === "string") {
        try {
          savedGenres = JSON.parse(prefs.genres);
        } catch {
          savedGenres = [];
        }
      }
      
      setGenres(savedGenres);

      setNotifications(
        prefs.notifications !== undefined ? prefs.notifications : true
      );

      setAutoSubtitles(
        prefs.subtitles !== undefined ? prefs.subtitles : true
      );

      setInitialPrefs({
        language: detectedLang,
        genres: savedGenres,
        notifications: prefs.notifications !== undefined ? prefs.notifications : true,
        autoSubtitles: prefs.subtitles !== undefined ? prefs.subtitles : true,
      });
    } else {
      const fallbackLang = getDynamicLanguage();
      setLanguage(fallbackLang);
      i18n.changeLanguage(fallbackLang);
    }
  }, [user]);

  // Detect changes
  const hasChanges =
    initialPrefs &&
    (language !== initialPrefs.language ||
      notifications !== initialPrefs.notifications ||
      autoSubtitles !== initialPrefs.autoSubtitles ||
      JSON.stringify(genres.sort()) !==
        JSON.stringify(initialPrefs.genres.sort()));

  const toggleGenre = (genreId) => {
    setGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllGenres = () => {
    setGenres([]);
  };

  const selectAllVisibleGenres = () => {
    const visibleGenreIds = filteredGenres.map(genre => genre.id);
    setGenres(prev => {
      const newGenres = [...prev];
      visibleGenreIds.forEach(id => {
        if (!newGenres.includes(id)) {
          newGenres.push(id);
        }
      });
      return newGenres;
    });
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setLoading(true);
    setMessage("");
    try {
      const genresToSave = genres.map(genreId => {
        const genre = availableGenres.find(g => g.id === genreId || g.name === genreId);
        return genre ? genre.id : genreId;
      });

      await api.put(
        "/user/update-preferences",
        { 
          language, 
          genres: genresToSave, 
          notifications, 
          subtitles: autoSubtitles 
        },
        { withCredentials: true }
      );
      
      i18n.changeLanguage(language);
      window.location.reload();
      
    } catch (err) {
      console.error(err);
      setMessage(t("preferences.update_error"));
      setLoading(false);
    }
  };

  // Get unique categories from available genres
  const uniqueCategories = [...new Set(availableGenres
    .filter(g => g.category)
    .map(g => g.category))];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const languageOptions = [
    { value: "rw", label: t("preferences.lang_rw") },
    { value: "en", label: t("preferences.lang_en") },
    { value: "fr", label: t("preferences.lang_fr") },
    { value: "sw", label: t("preferences.lang_sw") },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 pb-28 md:pb-6">
      {/* Language selection - Enhanced with custom dropdown */}
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <label className="block text-gray-300 mb-3 font-medium text-lg">
          {t("preferences.language")}
        </label>
        
        {/* Custom dropdown for better mobile experience */}
        <div className="relative" ref={languageDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="w-full px-5 py-3.5 bg-gray-900 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all text-base flex justify-between items-center"
          >
            <span>
              {languageOptions.find(opt => opt.value === language)?.label || t("preferences.lang_rw")}
            </span>
            <ChevronDown 
              size={20} 
              className={`transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`}
            />
          </button>
          
          {/* Dropdown menu */}
          {showLanguageDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {languageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLanguage(option.value);
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full px-5 py-3.5 text-left transition-colors ${
                    language === option.value
                      ? 'bg-[#BC8BBC]/20 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-gray-400 text-sm mt-3">
          {t("preferences.language_description")}
        </p>
      </div>

      {/* Settings toggles - Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notifications toggle */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-300 font-medium text-lg">
              {t("preferences.notifications_label")}
            </label>
            <div className="relative">
              <input
                type="checkbox"
                id="notifications"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="sr-only"
              />
              <div 
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all ${notifications ? 'bg-[#BC8BBC]' : 'bg-gray-700'}`}
                onClick={() => setNotifications(!notifications)}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-lg transform transition-transform ${notifications ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            {t("preferences.notifications_description")}
          </p>
        </div>

        {/* Auto subtitles toggle */}
        <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-300 font-medium text-lg">
              {t("preferences.subtitles_label")}
            </label>
            <div className="relative">
              <input
                type="checkbox"
                id="autoSubtitles"
                checked={autoSubtitles}
                onChange={(e) => setAutoSubtitles(e.target.checked)}
                className="sr-only"
              />
              <div 
                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all ${autoSubtitles ? 'bg-[#BC8BBC]' : 'bg-gray-700'}`}
                onClick={() => setAutoSubtitles(!autoSubtitles)}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-lg transform transition-transform ${autoSubtitles ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            {t("preferences.subtitles_description")}
          </p>
        </div>
      </div>

      {/* Preferred genres - Enhanced UI */}
      <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-gray-300 font-medium text-xl">
                {t("preferences.genres_title")}
              </h3>
              {genres.length > 0 && (
                <span className="px-3 py-1 bg-[#BC8BBC]/20 text-[#BC8BBC] text-sm font-medium rounded-full">
                  {genres.length} {t("preferences.genres_selected")}
                </span>
              )}
            </div>
            <p className="text-gray-400">
              {t("preferences.genres_description")}
            </p>
          </div>
          
          {/* Action buttons - Responsive layout */}
          <div className="flex flex-wrap gap-3">
            {availableGenres.length > 8 && (
              <button
                onClick={() => setShowGenres(!showGenres)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors font-medium text-sm sm:text-base"
              >
                {showGenres ? (
                  <>
                    <ChevronUp size={18} />
                    {t("preferences.show_less")}
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} />
                    {t("preferences.show_all")} ({availableGenres.length})
                  </>
                )}
              </button>
            )}
            
            {genres.length > 0 && (
              <button
                onClick={clearAllGenres}
                className="px-4 py-2.5 bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded-xl transition-colors font-medium text-sm sm:text-base"
              >
                {t("preferences.clear_all")}
              </button>
            )}
            
            <button
              onClick={selectAllVisibleGenres}
              className="px-4 py-2.5 bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded-xl transition-colors font-medium text-sm sm:text-base"
            >
              {t("preferences.select_all_visible")}
            </button>
          </div>
        </div>

        {/* Search and filter bar */}
        <div className="mb-6">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder={t("preferences.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-12 py-3.5 bg-gray-900 text-white border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-base"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            ) : (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                {/* <Search size={20} /> */}
              </div>
            )}
          </div>
          
          {/* Category filters */}
          {uniqueCategories.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-300 mb-3 font-medium">
                {t("preferences.filter_by_category")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategories([])}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors font-medium text-sm sm:text-base ${
                    selectedCategories.length === 0 
                      ? 'bg-[#BC8BBC] text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t("preferences.all_categories")}
                </button>
                {uniqueCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors font-medium text-sm sm:text-base ${
                      selectedCategories.includes(category)
                        ? 'bg-[#BC8BBC] text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected genres chips */}
        {genres.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-300 font-medium text-sm sm:text-base">
                {t("preferences.selected_genres")}
              </h4>
              <span className="text-gray-400 text-xs sm:text-sm">
                {genres.length} {t("preferences.genres_selected")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map(genreId => {
                const genre = availableGenres.find(g => g.id === genreId || g.name === genreId);
                if (!genre) return null;
                
                return (
                  <div
                    key={genre.id}
                    className="flex items-center gap-1 px-3 py-2 sm:px-4 sm:py-3 bg-[#BC8BBC]/20 text-[#BC8BBC] border border-[#BC8BBC]/40 rounded-xl hover:bg-[#BC8BBC]/30 transition-colors"
                  >
                    <span className="font-medium text-sm sm:text-base">{genre.name}</span>
                    <button
                      onClick={() => toggleGenre(genre.id)}
                      className="ml-1 text-[#BC8BBC] hover:text-white text-lg font-bold text-sm sm:text-base"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Genres grid */}
        {fetchingGenres ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-[#BC8BBC] mb-4"></div>
            <p className="text-gray-400">{t("preferences.loading_genres")}</p>
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {t("preferences.no_genres_found")}
            </div>
            <p className="text-gray-500">
              {t("preferences.try_different_search")}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategories([]);
              }}
              className="mt-4 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors"
            >
              {t("preferences.clear_filters")}
            </button>
          </div>
        ) : (
          <>
            {/* Responsive genres grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filteredGenres.map((genre) => {
                const isSelected = genres.includes(genre.id) || genres.includes(genre.name);
                
                return (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[120px] sm:min-h-[140px] group ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#BC8BBC]/20 to-[#9b69b2]/20 border-[#BC8BBC] text-white shadow-2xl shadow-[#BC8BBC]/20 transform scale-[1.02]'
                        : 'bg-gray-900/60 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:shadow-lg hover:shadow-gray-900/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-[#BC8BBC] text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg">
                        ✓
                      </div>
                    )}
                    
                    <span className="text-base sm:text-lg font-bold mb-1 sm:mb-2 group-hover:text-white transition-colors">
                      {genre.name}
                    </span>
                    
                    {genre.description && (
                      <span className="text-xs text-gray-400 group-hover:text-gray-300 line-clamp-2">
                        {genre.description}
                      </span>
                    )}
                    
                    {genre.category && (
                      <span className="text-xs px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-800 group-hover:bg-gray-700 rounded-full mt-2 sm:mt-3 font-medium">
                        {genre.category}
                      </span>
                    )}
                    
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                      isSelected ? 'bg-[#BC8BBC]/5' : 'bg-gray-700/10'
                    }`}></div>
                  </button>
                );
              })}
            </div>

            {/* Show more indicator */}
            {!showGenres && availableGenres.length > 8 && (
              <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
                <p className="text-gray-400 mb-3 text-sm sm:text-base">
                  {t("preferences.showing_genres", {
                    count: filteredGenres.length,
                    total: availableGenres.length
                  })}
                </p>
                <button
                  onClick={() => setShowGenres(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors font-medium text-sm sm:text-base"
                >
                  <ChevronDown size={18} />
                  {t("preferences.load_all_genres")} ({availableGenres.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save button - Enhanced fixed bottom container */}
      <div className="fixed bottom-0 left-0 right-0 md:static bg-gray-900/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-0 md:bg-gray-900/95 md:backdrop-blur-xl p-4 md:p-5 rounded-t-2xl md:rounded-2xl border-t md:border border-gray-700 shadow-2xl z-50">
        {/* Scroll indicator for mobile */}
        <div className="block md:hidden absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-gray-300 font-bold text-base sm:text-lg whitespace-nowrap overflow-hidden text-ellipsis">
              {t("preferences.save_preferences_title")}
            </div>
            <div className="text-gray-400 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {hasChanges 
                ? t("preferences.unsaved_changes")
                : t("preferences.all_up_to_date")}
            </div>
          </div>
          
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setLanguage(initialPrefs?.language || "rw");
                setNotifications(initialPrefs?.notifications ?? true);
                setAutoSubtitles(initialPrefs?.autoSubtitles ?? true);
                setGenres(initialPrefs?.genres || []);
              }}
              className="px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors font-medium text-sm sm:text-base flex-1 sm:flex-none"
              disabled={!hasChanges}
            >
              {t("preferences.reset")}
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className={`px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none justify-center ${
                loading || !hasChanges
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#BC8BBC] to-[#9b69b2] hover:from-[#9b69b2] hover:to-[#BC8BBC] text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
                  <span className="text-sm sm:text-base">{t("preferences.saving")}</span>
                </>
              ) : hasChanges ? (
                <span className="text-sm sm:text-base">{t("preferences.save_changes")}</span>
              ) : (
                <span className="text-sm sm:text-base">{t("preferences.all_changes_saved")}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extra spacing for mobile bottom bar */}
      <div className="h-16 md:h-0"></div>

      {message && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 max-w-md w-full mx-4">
          <div className="bg-red-900/90 backdrop-blur-sm text-red-100 p-4 rounded-xl border border-red-700 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-700/50 rounded-full flex items-center justify-center">
                  !
                </div>
                <div>
                  <p className="font-medium">{t("preferences.save_failed")}</p>
                  <p className="text-sm text-red-200">{message}</p>
                </div>
              </div>
              <button
                onClick={() => setMessage("")}
                className="text-red-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}