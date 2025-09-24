import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-[#1f1f1f] text-gray-200 border-t border-gray-700 py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-4 text-sm">

        {/* Top section with logo + language switcher */}
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Language Switcher */}
          <div className="flex items-center gap-2 justify-center">
            <LanguageSwitcher small />
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
          <Link
            to="/terms"
            className="hover:underline transition hover:text-[#9b69b2]"
          >
            {t("footer.terms")}
          </Link>
          <Link
            to="/privacy"
            className="hover:underline transition hover:text-[#9b69b2]"
          >
            {t("footer.privacy")}
          </Link>
          <Link
            to="/help"
            className="hover:underline transition hover:text-[#9b69b2]"
          >
            {t("footer.help")}
          </Link>
          <Link
            to="/feedback"
            className="hover:underline transition hover:text-[#9b69b2]"
          >
            {t("footer.feedback")}
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-xs text-center w-full mt-4 text-gray-400">
          &copy; {new Date().getFullYear()} Oliviuus Inc. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
