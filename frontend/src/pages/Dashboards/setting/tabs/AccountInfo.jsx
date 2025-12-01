// src/pages/account/tabs/AccountInfo.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Pencil, X } from "lucide-react";
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

export default function AccountInfo({ user }) {
  const { t } = useTranslation();

  const [email] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile_avatar_url || "");
  const [tempAvatar, setTempAvatar] = useState(user?.profile_avatar_url || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("People");

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
          url: `https://api.dicebear.com/7.x/${style}/svg?seed=${style}-${i}`,
          style: style,
        });
      }
    });
    return list;
  }, [selectedCategory]);

  return (
    <div className="space-y-6 max-w-md mx-auto p-2">
      {/* Avatar with Change Profile Picture button */}
      <div className="flex flex-col items-center space-y-2">
        <img
          src={tempAvatar || avatarUrl}
          alt={t("accountInfo.avatarAlt")}
          className="w-24 h-24 rounded-full border-2 border-[#BC8BBC] object-cover shadow-md transition-transform hover:scale-105"
          style={{ width: "100px", height: "100px" }}
        />
        <button
          onClick={() => setShowAvatarPicker((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-[#BC8BBC] hover:text-[#9b69b2] transition cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
          <span>{t("accountInfo.changeAvatar")}</span>
        </button>
      </div>

      {/* Inline Avatar Picker */}
      {showAvatarPicker && (
        <div className="space-y-4 mt-3">
          {/* Categories with Close Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {Object.keys(avatarCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition ${
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
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 max-h-72 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
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
                  style={{ width: "40px", height: "40px" }}
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/100x100/333333/FFFFFF?text=X";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email display */}
      <div>
        <label className="text-gray-400 block mb-1 text-sm">
          {t("accountInfo.email")}
        </label>
        <p className="w-full px-3 py-2 bg-gray-800 text-gray-400 border border-gray-600 rounded-md text-sm cursor-not-allowed">
          {email}
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!hasChanges || loading}
        className={`w-full px-5 py-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition ${
          !hasChanges || loading ? "opacity-50 cursor-not-allowed" : ""
        } text-sm`}
      >
        {loading ? t("accountInfo.saving") : t("accountInfo.save")}
      </button>

      {message && (
        <p className="text-green-400 text-center text-sm">{message}</p>
      )}
    </div>
  );
}
