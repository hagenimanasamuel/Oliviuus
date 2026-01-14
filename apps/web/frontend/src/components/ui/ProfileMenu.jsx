import React, { useState, useEffect, useRef } from "react";
import { LogOut, ChevronDown, User, Mail, Phone, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

// Helper functions moved outside component
const getUserDisplayName = (userData) => {
  if (!userData) return 'User';
  
  // Priority: username > full name > email prefix > phone > fallback
  if (userData.username) return userData.username;
  
  if (userData.first_name) {
    return `${userData.first_name} ${userData.last_name || ''}`.trim();
  }
  
  if (userData.email) {
    return userData.email.split('@')[0];
  }
  
  if (userData.phone) {
    return `User (${userData.phone.substring(userData.phone.length - 4)})`;
  }
  
  return 'User';
};

const getUserPrimaryIdentifier = (userData) => {
  if (!userData) return 'No identifier';
  
  // Show the primary identifier
  if (userData.email) return userData.email;
  if (userData.phone) return userData.phone;
  if (userData.username) return `@${userData.username}`;
  
  return 'No identifier';
};

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null); // Changed to null initially
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const menuRef = useRef();

  // Get account center URL from environment
  const ACCOUNT_CENTER_URL = import.meta.env.VITE_ACCOUNT_CENTER_URL || 'https://account.oliviuus.com';

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data && res.data.success) {
          const userData = res.data.user || res.data.data || res.data;
          
          if (userData) {
            // Calculate display values
            const displayName = getUserDisplayName(userData);
            const primaryIdentifier = getUserPrimaryIdentifier(userData);
            
            setUser({
              email: userData.email || "",
              phone: userData.phone || "",
              username: userData.username || "",
              first_name: userData.first_name || "",
              last_name: userData.last_name || "",
              profile_avatar_url: userData.profile_avatar_url || "",
              displayName,
              primaryIdentifier
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // If not authenticated, user remains null
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Close dropdown when clicked outside
  useEffect(() => {
    if (!user) return; // Only add listeners if user is logged in
    
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
  }, [user]);

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
    // Fallback to initials based on display name
    const initials = user.displayName.charAt(0).toUpperCase();
    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'user'}&backgroundColor=BC8BBC&textColor=ffffff`;
  };

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (user.profile_avatar_url) {
      return user.profile_avatar_url;
    }
    
    // Generate avatar based on display name
    const seed = user.displayName || 'user';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=BC8BBC&textColor=ffffff`;
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user.displayName) return "U";
    
    // If it's a username or email prefix
    if (user.displayName && user.displayName.length > 0) {
      return user.displayName.charAt(0).toUpperCase();
    }
    
    return "U";
  };

  // Get identifier icon based on user's primary identifier
  const getIdentifierIcon = () => {
    if (user.email) return <Mail className="w-3 h-3" />;
    if (user.phone) return <Phone className="w-3 h-3" />;
    if (user.username) return <UserIcon className="w-3 h-3" />;
    return <UserIcon className="w-3 h-3" />;
  };

  // Generate auth URL with redirect parameter (same as Header component)
  const getAuthUrl = () => {
    const currentUrl = window.location.href;
    const encodedRedirect = encodeURIComponent(currentUrl);
    return `${ACCOUNT_CENTER_URL}/auth?redirect=${encodedRedirect}`;
  };

  // If loading, show a simple placeholder
  if (loading) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-700 transition-all duration-200 min-w-[40px] min-h-[40px] opacity-70 cursor-not-allowed"
          disabled
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 flex-shrink-0">
            <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </button>
      </div>
    );
  }

  // If no user is logged in, show Sign In button
  if (!user) {
    return (
      <a
        href={getAuthUrl()}
        className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#a87aa8] hover:to-purple-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
      >
        {t("landingPage.header.signIn")}
      </a>
    );
  }

  const profileImage = getProfileImageUrl();
  const initials = getInitials();

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
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center border border-gray-600 flex-shrink-0 overflow-hidden">
          {user.profile_avatar_url ? (
            <img
              src={profileImage}
              alt={t('profileMenu.profilePicture', 'Profile picture')}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="text-white text-xs font-semibold">
              {initials}
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
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center border border-gray-600 overflow-hidden">
                  {user.profile_avatar_url ? (
                    <img
                      src={profileImage}
                      alt={t('profileMenu.profilePicture', 'Profile picture')}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <span className="text-white text-base font-semibold">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {/* Display Name */}
                <p className="text-white text-sm font-medium truncate">
                  {user.displayName}
                </p>
                
                {/* Primary Identifier */}
                <div className="flex items-center space-x-1 mt-1">
                  <div className="text-gray-400">
                    {getIdentifierIcon()}
                  </div>
                  <p className="text-gray-400 text-xs truncate">
                    {user.primaryIdentifier}
                  </p>
                </div>
                
                {/* Additional Identifiers (if any) */}
                <div className="mt-2 space-y-1">
                  {/* Email if available and not the primary identifier */}
                  {user.email && user.primaryIdentifier !== user.email && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-2.5 h-2.5 text-gray-500" />
                      <span className="text-gray-500 text-xs truncate">
                        {user.email}
                      </span>
                    </div>
                  )}
                  
                  {/* Phone if available and not the primary identifier */}
                  {user.phone && user.primaryIdentifier !== user.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-2.5 h-2.5 text-gray-500" />
                      <span className="text-gray-500 text-xs truncate">
                        {user.phone}
                      </span>
                    </div>
                  )}
                  
                  {/* Full name if available and different from display name */}
                  {(user.first_name || user.last_name) && 
                   user.displayName !== `${user.first_name} ${user.last_name || ''}`.trim() && (
                    <div className="flex items-center space-x-1">
                      <UserIcon className="w-2.5 h-2.5 text-gray-500" />
                      <span className="text-gray-500 text-xs truncate">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                  )}
                </div>
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
              <div className="text-left">
                <span>{t('profileMenu.account', 'Account')}</span>
                <p className="text-gray-400 text-xs mt-0.5">
                  {t('profileMenu.manageYourAccount', 'Manage your account settings')}
                </p>
              </div>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-700 my-1"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-3 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:text-red-300 group"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <div className="text-left">
                <span>{t('profileMenu.signOut', 'Sign out')}</span>
                <p className="text-red-400/70 text-xs mt-0.5">
                  {t('profileMenu.signOutDescription', 'Log out of your account')}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;