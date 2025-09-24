// src/pages/account/tabs/Preferences.jsx
import React, { useState, useEffect } from "react";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

const AVAILABLE_GENRES = [
  "Comedy",
  "Drama",
  "Action",
  "Romance",
  "Horror",
  "Documentary",
  "Animation",
];

export default function Preferences({ user }) {
  const { t, i18n } = useTranslation();

  const [language, setLanguage] = useState("rw");
  const [genres, setGenres] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [autoSubtitles, setAutoSubtitles] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialPrefs, setInitialPrefs] = useState(null);

  // Determine initial language dynamically
  const getDynamicLanguage = () => {
    if (user?.preferences?.language) return user.preferences.language;
    const stored = localStorage.getItem("lang");
    return stored || "rw";
  };

  // Auto-fill form using user.preferences
  useEffect(() => {
    if (user?.preferences) {
      const prefs = user.preferences;

      const detectedLang = getDynamicLanguage();
      setLanguage(detectedLang);
      i18n.changeLanguage(detectedLang);

      // Normalize genres
      if (Array.isArray(prefs.genres)) {
        setGenres(prefs.genres);
      } else if (typeof prefs.genres === "string") {
        try {
          setGenres(JSON.parse(prefs.genres));
        } catch {
          setGenres([]);
        }
      } else {
        setGenres([]);
      }

      setNotifications(
        prefs.notifications !== undefined ? prefs.notifications : true
      );

      setAutoSubtitles(
        prefs.subtitles !== undefined ? prefs.subtitles : true
      );

      setInitialPrefs({
        language: detectedLang,
        genres: Array.isArray(prefs.genres)
          ? prefs.genres
          : typeof prefs.genres === "string"
          ? JSON.parse(prefs.genres || "[]")
          : [],
        notifications:
          prefs.notifications !== undefined ? prefs.notifications : true,
        autoSubtitles:
          prefs.subtitles !== undefined ? prefs.subtitles : true,
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

  const toggleGenre = (genre) => {
    setGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setLoading(true);
    setMessage("");
    try {
      await api.put(
        "/user/update-preferences",
        { language, genres, notifications, subtitles: autoSubtitles },
        { withCredentials: true }
      );
      setMessage(t("preferences.update_success"));
      setInitialPrefs({ language, genres, notifications, autoSubtitles });
      i18n.changeLanguage(language); // update UI instantly
    } catch (err) {
      console.error(err);
      setMessage(t("preferences.update_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-2">
      {/* Language selection */}
      <div>
        <label className="block text-gray-400 mb-1">{t("preferences.language")}</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]"
        >
          <option value="rw">{t("preferences.lang_rw")}</option>
          <option value="en">{t("preferences.lang_en")}</option>
          <option value="fr">{t("preferences.lang_fr")}</option>
          <option value="sw">{t("preferences.lang_sw")}</option>
        </select>
      </div>

      {/* Notifications toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="notifications"
          checked={notifications}
          onChange={(e) => setNotifications(e.target.checked)}
          className="w-4 h-4 text-[#BC8BBC] bg-gray-800 border-gray-600 rounded focus:ring-[#BC8BBC]"
        />
        <label htmlFor="notifications" className="text-gray-400">
          {t("preferences.notifications")}
        </label>
      </div>

      {/* Auto subtitles toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoSubtitles"
          checked={autoSubtitles}
          onChange={(e) => setAutoSubtitles(e.target.checked)}
          className="w-4 h-4 text-[#BC8BBC] bg-gray-800 border-gray-600 rounded focus:ring-[#BC8BBC]"
        />
        <label htmlFor="autoSubtitles" className="text-gray-400">
          {t("preferences.subtitles")}
        </label>
      </div>

      {/* Preferred genres */}
      <div>
        <label className="block text-gray-400 mb-2">{t("preferences.genres")}</label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_GENRES.map((genre) => (
            <label
              key={genre}
              className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-md border border-gray-600 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={genres.includes(genre)}
                onChange={() => toggleGenre(genre)}
                className="w-4 h-4 text-[#BC8BBC] focus:ring-[#BC8BBC]"
              />
              <span className="text-gray-300">{t(`genres.${genre.toLowerCase()}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading || !hasChanges}
        className={`w-full px-6 py-3 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition ${
          loading || !hasChanges ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? t("preferences.saving") : t("preferences.save")}
      </button>

      {message && <p className="text-green-400 text-center mt-2">{message}</p>}
    </div>
  );
}
