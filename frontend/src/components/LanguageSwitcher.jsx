// src/components/LanguageSwitcher.jsx
import React, { useState, useEffect, useRef } from "react";
import i18n from "../i18n/i18n";
import { Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LanguageSwitcher = ({ small = false }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [dropUp, setDropUp] = useState(false);
  const [currentLang, setCurrentLang] = useState("rw");

  const languages = [
    { code: "rw", label: "Kinyarwanda" },
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "sw", label: "Kiswahili" },
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
  }, [user]); // re-run when user changes (login/logout/fetch)

  const selectLanguage = (code) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);

    if (!user) {
      // only persist to localStorage if no logged-in user
      localStorage.setItem("lang", code);
    }

    setOpen(false);
  };

  const currentLangLabel =
    languages.find((lang) => lang.code === currentLang)?.label || "English";

  return (
    <div className="relative inline-block z-50 text-left">
      {/* Button */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-3 py-2 border border-gray-600 rounded-md hover:border-[#9b69b2] transition-all duration-150
          ${small ? "text-xs" : "text-sm"} min-w-[90px] md:min-w-[120px]
        `}
        title="Change Language"
      >
        <Globe
          className={`w-${small ? 4 : 5} h-${small ? 4 : 5} text-gray-300 md:w-5 md:h-5`}
        />
        <span className="capitalize text-gray-100 truncate">
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
          className={`absolute z-50 left-0 right-0 sm:left-auto sm:right-0 rounded-md shadow-md border border-gray-600 transition-all duration-200
            ${dropUp ? "bottom-full mb-2" : "top-full mt-2"} bg-[#1f1f1f] overflow-auto
          `}
        >
          {languages.map((lang) => (
            <li
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`px-4 py-2 text-sm text-gray-200 hover:bg-[#2c2c2c] cursor-pointer transition
                ${lang.code === currentLang ? "bg-[#9b69b2] text-white" : ""}
              `}
            >
              {lang.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
