import React from "react";
import { User, X } from "lucide-react";
import clsx from "clsx";

export default function UserModalHeader({ user, handleClose }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "suspended": return "bg-yellow-500";
      case "banned": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <span className="text-red-400">🛡️</span>;
      case "viewer": return <span className="text-blue-400">👁️</span>;
      case "moderator": return <span className="text-purple-400">🧩</span>;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case "admin": return { label: "Administrator", color: "text-red-400", bg: "bg-red-400/10" };
      case "moderator": return { label: "Moderator", color: "text-purple-400", bg: "bg-purple-400/10" };
      case "viewer": return { label: "Viewer", color: "text-blue-400", bg: "bg-blue-400/10" };
      default: return { label: "User", color: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-800">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center overflow-hidden">
            {user.profile_avatar_url ? (
              <img
                src={user.profile_avatar_url}
                alt={user.name}
                className="w-12 h-12 rounded-xl object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div
            className={clsx(
              "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900",
              getStatusColor(user.status)
            )}
          />
        </div>

        <div>
          <h2 className="text-white text-xl font-bold flex items-center space-x-3">
            <span>{user.email.split("@")[0]}</span>
            <span
              className={clsx(
                "inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium",
                roleConfig.bg,
                roleConfig.color
              )}
            >
              {getRoleIcon(user.role)}
              <span>{roleConfig.label}</span>
            </span>
          </h2>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
      </div>

      <button
        onClick={handleClose}
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
