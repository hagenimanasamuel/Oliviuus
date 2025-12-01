import React, { useState, useEffect, useRef } from "react";
import { LogOut, ChevronDown, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({ email: "", profile_avatar_url: "" });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const menuRef = useRef();

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data) {
          setUser({
            email: res.data.email || "",
            profile_avatar_url: res.data.profile_avatar_url || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      // Reload browser for quick refresh
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
      // Still reload even if API call fails
      window.location.reload();
    }
  };

  const handleAccountSettings = () => {
    setOpen(false);
    navigate("/account/settings");
  };

  const handleImageError = (e) => {
    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.email || 'user'}`;
  };

  const profileImage = user.profile_avatar_url || 
    `https://api.dicebear.com/7.x/initials/svg?seed=${user.email || 'user'}`;

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button - Optimized for mobile */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-700 transition-all duration-200 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-opacity-50 min-w-[40px] min-h-[40px]"
        aria-label={t('profileMenu.profileMenu', 'Profile menu')}
        aria-expanded={open}
      >
        {/* User Avatar */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center border border-gray-600 flex-shrink-0">
          {user.profile_avatar_url ? (
            <img
              src={profileImage}
              alt={t('profileMenu.profilePicture', 'Profile picture')}
              className="w-full h-full rounded-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="text-white text-xs font-semibold">
              {user.email ? user.email.charAt(0).toUpperCase() : "U"}
            </span>
          )}
        </div>
        
        {/* Chevron Icon - Hidden on mobile, shown on tablet and up */}
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform duration-200 hidden sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - Responsive positioning */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
          {/* User Info Section */}
          <div className="p-3 sm:p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center border border-gray-600 flex-shrink-0">
                {user.profile_avatar_url ? (
                  <img
                    src={profileImage}
                    alt={t('profileMenu.profilePicture', 'Profile picture')}
                    className="w-full h-full rounded-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.email || t('profileMenu.user', 'User')}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {t('profileMenu.activeAccount', 'Active account')}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1">
            {/* Account Button */}
            <button
              onClick={handleAccountSettings} 
              className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 group"
            >
              <User className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-[#BC8BBC]" />
              <span>{t('profileMenu.account', 'Account')}</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-700 my-1"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:text-red-300 group"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>{t('profileMenu.signOut', 'Sign out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;