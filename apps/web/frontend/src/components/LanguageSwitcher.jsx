import React, { useState, useEffect, useRef } from "react";
import i18n from "../i18n/i18n";
import { Globe, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const LanguageSwitcher = ({ small = false }) => {
  const { user, updateUserPreferences } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropUp, setDropUp] = useState(false);
  const [currentLang, setCurrentLang] = useState("rw");
  const [saving, setSaving] = useState(false);

  const languages = [
    { code: "rw", label: "Kinyarwanda", flag: "🇷🇼" },
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
  ];

  const toggleDropdown = () => setOpen((prev) => !prev);

  const handleClickOutside = (e) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      !buttonRef.current.contains(e.target)
    ) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Decide whether dropdown should go up or down
  useEffect(() => {
    if (buttonRef.current && open) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 10;
      const spaceAbove = rect.top - 10;
      setDropUp(spaceBelow < 140 && spaceAbove > spaceBelow);
    }
  }, [open]);

  // Sync language with user preference OR localStorage fallback
  useEffect(() => {
    let langToApply;

    if (user?.preferences?.language) {
      langToApply = user.preferences.language;
    } else {
      langToApply = localStorage.getItem("lang") || "rw";
    }

    if (langToApply !== currentLang) {
      setCurrentLang(langToApply);
      i18n.changeLanguage(langToApply);
    }
  }, [user]);

  const selectLanguage = async (code) => {
    if (code === currentLang) {
      setOpen(false);
      return;
    }

    // Update UI immediately
    setCurrentLang(code);
    i18n.changeLanguage(code);
    setOpen(false);

    // Save the language preference
    if (user) {
      // User is logged in - save to database
      setSaving(true);
      try {
        // Update user preferences in database
        await api.put("/user/update-preferences", 
          { 
            language: code,
            // Preserve other preferences if they exist
            ...(user.preferences?.genres && { genres: user.preferences.genres }),
            ...(user.preferences?.notifications !== undefined && { 
              notifications: user.preferences.notifications 
            }),
            ...(user.preferences?.subtitles !== undefined && { 
              subtitles: user.preferences.subtitles 
            })
          },
          { withCredentials: true }
        );
        
        // Update local user context
        await updateUserPreferences({
          ...user.preferences,
          language: code
        });
      } catch (error) {
        console.error("Failed to save language preference:", error);
        // On error, revert and refresh to previous state
        const previousLang = user.preferences?.language || "rw";
        localStorage.setItem("lang", previousLang);
        window.location.reload();
        return;
      } finally {
        setSaving(false);
      }
    } else {
      // Not logged in - save to localStorage only
      localStorage.setItem("lang", code);
    }

    // Refresh browser to apply language change completely
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const currentLangLabel =
    languages.find((lang) => lang.code === currentLang)?.label || "English";

  const currentFlag =
    languages.find((lang) => lang.code === currentLang)?.flag || "🌐";

  return (
    <div className="relative inline-block z-50 text-left">
      {/* Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        disabled={saving}
        className={`flex items-center gap-2 px-3 py-2 border border-gray-600 rounded-md hover:border-[#9b69b2] transition-all duration-150
          ${small ? "text-xs" : "text-sm"} min-w-[90px] md:min-w-[120px]
          ${saving ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={saving ? "Saving..." : "Change Language"}
      >
        {saving ? (
          <div className="w-3 h-3 border-2 border-[#9b69b2] border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <Globe
            className={`w-${small ? 3 : 4} h-${small ? 3 : 4} text-gray-300 md:w-4 md:h-4`}
          />
        )}
        <span className="text-gray-100 truncate mr-1">{currentFlag}</span>
        <span className="capitalize text-gray-100 truncate hidden sm:inline">
          {currentLangLabel}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          ref={dropdownRef}
          style={{
            maxHeight: dropUp
              ? buttonRef.current.getBoundingClientRect().top - 20
              : window.innerHeight -
                buttonRef.current.getBoundingClientRect().bottom -
                10,
          }}
          className={`absolute z-50 left-0 right-0 sm:left-auto sm:right-0 rounded-md shadow-lg border border-gray-700 transition-all duration-200
            ${dropUp ? "bottom-full mb-2" : "top-full mt-2"} bg-gray-900 overflow-auto min-w-[180px]
          `}
        >
          {languages.map((lang) => (
            <li
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`group px-3 py-2.5 text-sm cursor-pointer transition-all duration-150 flex items-center justify-between
                ${lang.code === currentLang 
                  ? "bg-[#BC8BBC]/10 text-[#BC8BBC] border-l-2 border-[#BC8BBC]" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {lang.code === currentLang && (
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-[#BC8BBC]" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;