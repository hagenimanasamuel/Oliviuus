import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, LogOut, Download, Heart, Clock, Star, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProfileDropdown = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Get account center URL from environment
  const ACCOUNT_CENTER_URL = import.meta.env.VITE_ACCOUNT_CENTER_URL || 'http://account.oliviuus.com';

  const profileImage = user?.profile_avatar_url || (user?.id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : "https://placehold.co/100x100/333333/FFFFFF?text=User");

  const libraryItems = [
    { icon: <Download size={18} />, label: t("profile.dropdown.library.downloads"), path: "/downloads" },
    { icon: <Heart size={18} />, label: t("profile.dropdown.library.myList"), path: "/my-list" },
    { icon: <Clock size={18} />, label: t("profile.dropdown.library.continueWatching"), path: "/history" },
    { icon: <Star size={18} />, label: t("profile.dropdown.library.topPicks"), path: "/new" },
  ];

  const getCurrentYear = () => new Date().getFullYear();

  // Function to navigate to account center
  const navigateToAccountCenter = () => {
    const currentUrl = window.location.href;
    const encodedRedirect = encodeURIComponent(currentUrl);
    const url = `${ACCOUNT_CENTER_URL}?redirect=${encodedRedirect}`;
    window.location.href = url;
  };

  // Handle navigation for footer links
  const handleFooterLinkClick = (path) => {
    navigate(path);
    setProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={profileRef} className="relative">
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-gray-600 transform hover:scale-105"
        aria-label={t("profile.dropdown.toggle")}
      >
        <img 
          src={profileImage} 
          alt={t("profile.dropdown.avatarAlt")} 
          className="w-8 h-8 rounded-lg object-cover"
        />
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform duration-200 ${
            profileOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {/* Profile Dropdown */}
      {profileOpen && (
        <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center gap-3">
              <img 
                src={profileImage} 
                alt={t("profile.dropdown.avatarAlt")} 
                className="w-14 h-14 rounded-lg border-2 border-[#BC8BBC] object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-lg truncate">
                  {user?.name || t("profile.dropdown.welcome")}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">
              {t("profile.dropdown.library.title")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {libraryItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setProfileOpen(false);
                  }}
                  className="flex items-center gap-2 p-3 text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors border border-transparent hover:border-gray-600"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-2">
            {/* ACCOUNT CENTER BUTTON - ONLY NEW ADDITION */}
            <button 
              onClick={() => {
                navigateToAccountCenter();
                setProfileOpen(false);
              }}
              className="flex items-center justify-between w-full px-4 py-3 text-sm text-[#BC8BBC] hover:bg-[#BC8BBC]/10 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Settings size={18} className="mr-3" />
                Account Center
              </div>
              <ExternalLink size={14} className="text-[#BC8BBC]/70" />
            </button>
            
            <button 
              onClick={() => {
                navigate("/account/settings");
                setProfileOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors mt-1"
            >
              <Settings size={18} className="mr-3" />
              {t("profile.dropdown.accountSettings")}
            </button>
            
            <button 
              onClick={() => {
                onLogout();
                // ✅ FULL PAGE RELOAD AFTER LOGOUT
                window.location.reload();
              }}
              className="flex items-center w-full px-4 py-3 text-sm text-[#BC8BBC] hover:bg-[#BC8BBC]/10 rounded-lg transition-colors mt-1"
            >
              <LogOut size={18} className="mr-3" />
              {t("profile.dropdown.signOut")}
            </button>
          </div>

          <div className="p-3 bg-gray-900/50 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              <p>© {getCurrentYear()} {t("profile.dropdown.companyName")}</p>
              <div className="flex gap-4 mt-2 flex-wrap">
                <button 
                  onClick={() => handleFooterLinkClick("/privacy")}
                  className="hover:text-gray-300 transition-colors hover:underline"
                >
                  {t("profile.dropdown.footer.privacy")}
                </button>
                <button 
                  onClick={() => handleFooterLinkClick("/terms")}
                  className="hover:text-gray-300 transition-colors hover:underline"
                >
                  {t("profile.dropdown.footer.terms")}
                </button>
                <button 
                  onClick={() => handleFooterLinkClick("/help")}
                  className="hover:text-gray-300 transition-colors hover:underline"
                >
                  {t("profile.dropdown.footer.help")}
                </button>
                <button 
                  onClick={() => handleFooterLinkClick("/about")}
                  className="hover:text-gray-300 transition-colors hover:underline"
                >
                  {t("profile.dropdown.footer.about")}
                </button>
                <button 
                  onClick={() => handleFooterLinkClick("/feedback")}
                  className="hover:text-gray-300 transition-colors hover:underline"
                >
                  {t("profile.dropdown.footer.feedback")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;