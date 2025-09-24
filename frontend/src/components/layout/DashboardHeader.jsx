import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";

export default function DashboardHeader({ user, onLogout }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user?.profile_avatar_url || "");
  const [tempAvatar, setTempAvatar] = useState(user?.profile_avatar_url || "");

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    setTempAvatar(user?.profile_avatar_url || "");
    setAvatarUrl(user?.profile_avatar_url || "");
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileImage =
    tempAvatar ||
    avatarUrl ||
    (user?.id
      ? `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}`
      : "https://placehold.co/100x100/333333/FFFFFF?text=User");

  const handleImageError = (e) => {
    e.target.src = user?.id
      ? `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}`
      : "https://placehold.co/100x100/333333/FFFFFF?text=User";
  };

  return (
    <>
      <header className="w-full bg-gray-900 text-white shadow-md px-4 sm:px-6 py-3 flex justify-between items-center fixed top-0 left-0 z-50">
        {/* Logo / Branding */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Logo className="h-8 w-auto" />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              className="relative cursor-pointer transition-colors hover:text-gray-300"
              onClick={() => setNotifOpen((prev) => !prev)}
            >
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-2 text-sm text-gray-400 font-medium">
                  Notifications
                </div>
                <ul className="max-h-60 overflow-y-auto divide-y divide-gray-700">
                  <li className="px-4 py-2 text-gray-300 cursor-pointer transition-colors hover:text-white">
                    New user registered
                  </li>
                  <li className="px-4 py-2 text-gray-300 cursor-pointer transition-colors hover:text-white">
                    Subscription payment received
                  </li>
                  <li className="px-4 py-2 text-gray-300 cursor-pointer transition-colors hover:text-white">
                    Server maintenance scheduled
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer transition-colors hover:text-gray-300"
            >
              <img
                src={profileImage}
                alt="profile avatar"
                className="w-8 h-8 rounded-full border border-gray-700 object-cover"
                onError={handleImageError}
              />
              <ChevronDown size={18} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="text-white truncate font-medium">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/account/settings")}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 transition-colors hover:text-white"
                >
                  <Settings size={16} className="mr-2" /> Settings
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 transition-colors hover:text-red-300"
                >
                  <LogOut size={16} className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Push body content down by header height + padding */}
      <div className="pt-5" />
    </>
  );
}
