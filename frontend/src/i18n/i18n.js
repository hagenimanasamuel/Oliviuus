import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation JSON files
import en from "./en.json";
import rw from "./rw.json";
import fr from "./fr.json";
import sw from "./sw.json";

// Configure resources
const resources = {
  en: { translation: en },
  rw: { translation: rw },
  fr: { translation: fr },
  sw: { translation: sw },
};

// Get language from localStorage, default to 'rw' if not set
const savedLang = localStorage.getItem("lang") || "rw";

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "rw",
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
