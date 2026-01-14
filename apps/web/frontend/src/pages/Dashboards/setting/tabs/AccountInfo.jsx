// src/pages/account/tabs/AccountInfo.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  Pencil, 
  X, 
  User, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../../api/axios";

const avatarCategories = {
  People: [
    "avataaars",
    "bottts",
    "identicon",
    "thumbs",
    "micah",
    "pixel-art",
    "croodles",
    "fun-emoji",
    "personas",
    "open-peeps",
    "notionists",
    "miniavs",
  ],
  Animals: [
    "adventurer",
    "big-ears",
    "big-smile",
    "pixel-art-neutral",
    "miniavs",
    "notionists-neutral",
    "icons",
    "gridy",
  ],
  Fantasy: [
    "shapes",
    "avataaars",
    "micah",
    "thumbs",
    "pixel-art",
    "croodles",
    "bottts",
    "adventurer",
  ],
  Abstract: [
    "icons",
    "gridy",
    "bottts",
    "beam",
    "croodles-neutral",
    "lorelei",
    "micah",
    "shapes",
  ],
};

// Helper functions
const getUserDisplayName = (userData) => {
  if (!userData) return 'User';
  
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

export default function AccountInfo({ user }) {
  const { t } = useTranslation();

  const [email] = useState(user?.email || "");
  const [username] = useState(user?.username || "");
  const [phone] = useState(user?.phone || "");
  const [firstName] = useState(user?.first_name || "");
  const [lastName] = useState(user?.last_name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_avatar_url || "");
  const [tempAvatar, setTempAvatar] = useState(user?.profile_avatar_url || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("People");
  const [expandedDetails, setExpandedDetails] = useState(false);

  // Calculate display name for avatar
  const displayName = getUserDisplayName(user);
  const fullName = (firstName || lastName) ? `${firstName || ''} ${lastName || ''}`.trim() : null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    setHasChanges(tempAvatar !== avatarUrl);
  }, [tempAvatar, avatarUrl]);

  const handleSave = async () => {
    if (!hasChanges) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await api.put("/auth/update-avatar", {
        profile_avatar_url: tempAvatar,
      });
      setAvatarUrl(res.data.user.profile_avatar_url);
      setMessage(t("accountInfo.success"));
      setShowAvatarPicker(false);
    } catch (err) {
      console.error(err);
      setMessage(t("accountInfo.error"));
    } finally {
      setLoading(false);
    }
  };

  const avatarList = useMemo(() => {
    const list = [];
    avatarCategories[selectedCategory].forEach((style) => {
      for (let i = 0; i < 6; i++) {
        list.push({
          url: `https://api.dicebear.com/7.x/${style}/svg?seed=${displayName || 'user'}-${i}`,
          style: style,
        });
      }
    });
    return list;
  }, [selectedCategory, displayName]);

  // Get fallback avatar based on user info
  const getFallbackAvatar = () => {
    if (avatarUrl) return avatarUrl;
    
    // Generate avatar based on display name
    const seed = displayName || 'user';
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=BC8BBC&textColor=ffffff`;
  };

  // Status badge component
  const StatusBadge = ({ verified }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      verified 
        ? "bg-green-900/30 text-green-400 border border-green-800/30" 
        : "bg-gray-700 text-gray-400 border border-gray-600"
    }`}>
      {verified ? (
        <>
          <CheckCircle className="w-3 h-3" />
          {t("accountInfo.verified")}
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3" />
          {t("accountInfo.notSet")}
        </>
      )}
    </span>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-2 sm:p-4">
      {/* Main Profile Section */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 shadow-xl">
        {/* Avatar and Basic Info Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <img
              src={tempAvatar || getFallbackAvatar()}
              alt={t("accountInfo.avatarAlt")}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-3 border-[#BC8BBC] object-cover shadow-lg"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${displayName || 'user'}&backgroundColor=BC8BBC&textColor=ffffff`;
              }}
            />
            <button
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              className="absolute -bottom-2 -right-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white p-2 rounded-full shadow-lg transition transform hover:scale-110 cursor-pointer"
              title={t("accountInfo.changeAvatar")}
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <p className="text-white font-bold text-2xl sm:text-3xl mb-1 break-words">
                {displayName}
              </p>
              {fullName && (
                <div className="inline-flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700">
                  <User className="w-4 h-4 text-[#BC8BBC]" />
                  <p className="text-gray-300 text-sm font-medium">{fullName}</p>
                </div>
              )}
            </div>

            {/* Expandable Details Button */}
            <button
              onClick={() => setExpandedDetails(!expandedDetails)}
              className="inline-flex items-center gap-2 text-[#BC8BBC] hover:text-[#9b69b2] font-medium transition group"
            >
              {expandedDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  {t("accountInfo.hideDetails")}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  {t("accountInfo.showDetails")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Inline Avatar Picker */}
        {showAvatarPicker && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="space-y-4">
              {/* Categories with Close Button */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(avatarCategories).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                        selectedCategory === cat
                          ? "bg-[#BC8BBC] text-white shadow-md"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {t(`accountInfo.categories.${cat}`)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="order-first sm:order-last self-center sm:self-auto p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition flex items-center justify-center cursor-pointer"
                  title={t("accountInfo.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar grid */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 max-h-72 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800/50 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {avatarList.map((avatar, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setTempAvatar(avatar.url);
                      setShowAvatarPicker(false);
                    }}
                    className="cursor-pointer transition transform hover:scale-110"
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.style}
                      className={`rounded-full border-2 object-cover ${
                        tempAvatar === avatar.url
                          ? "border-[#BC8BBC] shadow-md scale-110"
                          : "border-transparent"
                      }`}
                      style={{ width: "45px", height: "45px" }}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${displayName || 'user'}-${index}&backgroundColor=BC8BBC&textColor=ffffff`;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details Section */}
      {expandedDetails && (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 shadow-xl animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#BC8BBC]" />
                  <h3 className="text-white font-medium">{t("accountInfo.email")}</h3>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-gray-300 text-sm truncate mr-2">
                    {email || t("accountInfo.notProvided")}
                  </span>
                  <StatusBadge verified={!!email} />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#BC8BBC]" />
                  <h3 className="text-white font-medium">{t("accountInfo.phone")}</h3>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-gray-300 text-sm truncate mr-2">
                    {phone || t("accountInfo.notProvided")}
                  </span>
                  <StatusBadge verified={!!phone} />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#BC8BBC]" />
                  <h3 className="text-white font-medium">{t("accountInfo.username")}</h3>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-gray-300 text-sm truncate mr-2">
                    {username ? `@${username}` : t("accountInfo.notProvided")}
                  </span>
                  <StatusBadge verified={!!username} />
                </div>
              </div>

              {/* Member Since */}
              {user?.created_at && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#BC8BBC]" />
                    <h3 className="text-white font-medium">{t("accountInfo.memberSince")}</h3>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <span className="text-gray-300 text-sm">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Button - Only show if avatar was changed */}
      {hasChanges && (
        <div className="sticky bottom-6 z-10">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-600">
                  <img
                    src={tempAvatar}
                    alt="New avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-medium">{t("accountInfo.avatarPreview")}</p>
                  <p className="text-gray-400 text-sm">{t("accountInfo.saveChanges")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTempAvatar(avatarUrl);
                    setHasChanges(false);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition text-sm"
                >
                  {t("accountInfo.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("accountInfo.saving")}
                    </>
                  ) : (
                    t("accountInfo.save")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.includes(t("accountInfo.success")) 
            ? "bg-green-900/20 text-green-400 border-green-800/30" 
            : "bg-red-900/20 text-red-400 border-red-800/30"
        }`}>
          <div className="flex items-center gap-3">
            {message.includes(t("accountInfo.success")) ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="font-medium">{message}</p>
          </div>
        </div>
      )}

      {/* Information note */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[#BC8BBC]" />
          <h3 className="text-white font-medium">{t("accountInfo.noteTitle")}</h3>
        </div>
        <p className="text-gray-400 mb-4">{t("accountInfo.noteDescription")}</p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#BC8BBC] mt-1.5 flex-shrink-0"></div>
            <span className="text-gray-300 text-sm">{t("accountInfo.noteContactSupport")}</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#BC8BBC] mt-1.5 flex-shrink-0"></div>
            <span className="text-gray-300 text-sm">{t("accountInfo.noteVerification")}</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#BC8BBC] mt-1.5 flex-shrink-0"></div>
            <span className="text-gray-300 text-sm">{t("accountInfo.noteFullName")}</span>
          </li>
        </ul>
      </div>

      {/* Add CSS animation */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
        `}
      </style>
    </div>
  );
}