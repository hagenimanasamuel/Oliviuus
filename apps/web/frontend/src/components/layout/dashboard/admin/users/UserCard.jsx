import React, { forwardRef, useState, useRef, useEffect } from "react";
import { MoreHorizontal, User, Mail, Calendar, Shield, Ban, Trash2, Edit, Eye, Phone } from "lucide-react";
import clsx from "clsx";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";

// Helper functions moved OUTSIDE the component
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

const UserCard = forwardRef(({ user, onClick, onUserUpdated }, ref) => {
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showActions &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActions]);

  // Safely extract user information with fallbacks
  const safeUser = user ? {
    id: user.id || '',
    email: user.email,
    phone: user.phone,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    profile_avatar_url: user.profile_avatar_url,
    role: user.role || 'viewer',
    is_active: user.is_active ?? true,
    status: user.status || (user.is_active ? 'active' : 'inactive'),
    joinDate: user.joinDate || user.created_at || new Date(),
    // Derived fields - using the helper functions
    displayName: getUserDisplayName(user),
    primaryIdentifier: getUserPrimaryIdentifier(user)
  } : null;

  const handleCardClick = (e) => {
    if (e.target.closest(".actions-container") || dropdownRef.current?.contains(e.target)) return;
    onClick?.(user);
  };

  const getStatusColor = (status) => {
    if (!safeUser) return "bg-gray-500";
    const userStatus = status || (safeUser.is_active ? "active" : "inactive");
    switch (userStatus) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "suspended": return "bg-yellow-500";
      case "banned": return "bg-red-500";
      default: return safeUser.is_active ? "bg-green-500" : "bg-gray-500";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <Shield className="w-4 h-4" />;
      case "viewer": return <Eye className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // --- ACTION HANDLERS ---
  const handleDelete = async () => {
    if (!safeUser || !window.confirm(t("userModal.confirmation.deleteAccount", { email: safeUser.email || safeUser.phone || 'this user' }))) return;
    try {
      setActionLoading(true);
      await api.delete(`/user/${safeUser.id}`);
      
      // Notify parent about deletion
      if (onUserUpdated && typeof onUserUpdated === 'function') {
        onUserUpdated(user, "deleted");
      }
    } catch (error) {
      console.error("❌ Failed to delete user:", error);
      if (error.response) {
        alert(error.response.data.error || error.response.data.message || t("userModal.errors.deleteUser"));
      } else {
        alert(t("userModal.errors.networkError"));
      }
    } finally {
      setActionLoading(false);
      setShowActions(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!safeUser) return;
    try {
      setActionLoading(true);
      const is_active = !safeUser.is_active;

      const response = await api.put(`/user/${safeUser.id}/status`, { is_active });
      
      const updatedUser = {
        ...user,
        is_active,
        status: is_active ? "active" : "inactive"
      };

      // Notify parent about status change
      if (onUserUpdated && typeof onUserUpdated === 'function') {
        onUserUpdated(updatedUser);
      }
    } catch (error) {
      console.error("❌ Failed to update user status:", error);
      if (error.response) {
        alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateStatus"));
      } else {
        alert(t("userModal.errors.networkError"));
      }
    } finally {
      setActionLoading(false);
      setShowActions(false);
    }
  };

  const handleEditEmail = async () => {
    if (!safeUser) return;
    const newEmail = prompt(t("userModal.prompts.enterNewEmail"), safeUser.email || '');
    if (!newEmail) return;
    
    if (newEmail === safeUser.email) {
      alert(t("userModal.errors.sameEmail"));
      return;
    }

    if (!newEmail.includes('@')) {
      alert(t("userModal.errors.invalidEmail"));
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.put(`/user/${safeUser.id}/email`, { email: newEmail });
      
      const updatedUser = {
        ...user,
        email: newEmail
      };

      // Notify parent about email change
      if (onUserUpdated && typeof onUserUpdated === 'function') {
        onUserUpdated(updatedUser);
      }
      
      alert(t("userModal.success.emailUpdated"));
    } catch (error) {
      console.error("❌ Failed to update email:", error);
      if (error.response) {
        alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateEmail"));
      } else {
        alert(t("userModal.errors.networkError"));
      }
    } finally {
      setActionLoading(false);
      setShowActions(false);
    }
  };

  // Guard against null user
  if (!user || !safeUser) {
    return (
      <div className="group bg-gray-900 border border-gray-800 rounded-lg p-4 w-full max-w-full">
        <div className="text-gray-400 text-center">{t("userModal.errors.userNotFound")}</div>
      </div>
    );
  }

  // Determine current status for display
  const displayStatus = safeUser.status;

  const actionButtons = [
    { 
      id: "edit", 
      icon: Edit, 
      label: t("userModal.actions.editEmail"), 
      onClick: handleEditEmail,
      disabled: actionLoading || !safeUser.email // Disable if user doesn't have email
    },
    {
      id: "status",
      icon: safeUser.is_active ? Ban : User,
      label: safeUser.is_active ? t("userModal.actions.deactivate") : t("userModal.actions.activate"),
      onClick: handleToggleStatus,
      disabled: actionLoading
    },
    { 
      id: "delete", 
      icon: Trash2, 
      label: t("userModal.actions.delete"), 
      onClick: handleDelete, 
      destructive: true,
      disabled: actionLoading
    }
  ];

  return (
    <div
      ref={ref}
      onClick={handleCardClick}
      className="group bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-all duration-200 cursor-pointer hover:shadow-lg w-full max-w-full relative"
    >
      <div className="flex items-center justify-between w-full max-w-full">
        {/* User Info Section */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 max-w-full overflow-hidden">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center">
              {safeUser.profile_avatar_url ? (
                <img
                  src={safeUser.profile_avatar_url}
                  alt={safeUser.displayName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm-h-6 text-white" />
              )}
            </div>
            <div className={clsx(
              "absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 border-gray-900",
              getStatusColor(displayStatus)
            )} />
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 max-w-full overflow-hidden">
            {/* Display Name */}
            <div className="flex items-center space-x-2 mb-1 flex-wrap">
              <h3 className="text-white font-semibold truncate text-base sm:text-lg max-w-full">
                {safeUser.displayName}
              </h3>
              <div className="flex items-center space-x-1 text-gray-400 flex-shrink-0">
                {getRoleIcon(safeUser.role)}
                <span className="text-xs font-medium capitalize hidden xs:inline">
                  {t(`userModal.roles.${safeUser.role}`)}
                </span>
              </div>
            </div>

            {/* Identifiers Section */}
            <div className="flex flex-col space-y-1 text-sm text-gray-400">
              {/* Email if available */}
              {safeUser.email && (
                <div className="flex items-center space-x-1 truncate">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">{safeUser.email}</span>
                </div>
              )}
              
              {/* Phone if available */}
              {safeUser.phone && (
                <div className="flex items-center space-x-1 truncate">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">{safeUser.phone}</span>
                </div>
              )}
              
              {/* Username if available (only show if no email or phone) */}
              {safeUser.username && !safeUser.email && !safeUser.phone && (
                <div className="flex items-center space-x-1 truncate">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">@{safeUser.username}</span>
                </div>
              )}
              
              {/* First and Last name if available and not used as display name */}
              {safeUser.firstName && safeUser.displayName !== `${safeUser.firstName} ${safeUser.lastName || ''}`.trim() && (
                <div className="flex items-center space-x-1 truncate">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate text-xs sm:text-sm">
                    {safeUser.firstName} {safeUser.lastName}
                  </span>
                </div>
              )}
              
              {/* Join Date */}
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">
                  {new Date(safeUser.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center space-x-1 actions-container flex-shrink-0 ml-2 relative">
          {/* Desktop Actions - Always show all buttons */}
          <div className="hidden sm:flex items-center space-x-1">
            {actionButtons.map((button) => (
              <button
                key={button.id}
                onClick={(e) => {
                  e.stopPropagation();
                  button.onClick();
                }}
                disabled={button.disabled}
                className={clsx(
                  "p-2 rounded transition",
                  button.destructive
                    ? "text-gray-400 hover:text-red-500 hover:bg-gray-800"
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                  button.disabled && "opacity-50 cursor-not-allowed"
                )}
                title={button.label}
              >
                <button.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Mobile Dropdown - Show three dots menu */}
          <div className="sm:hidden relative">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              disabled={actionLoading}
              className={clsx(
                "p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition",
                actionLoading && "opacity-50 cursor-not-allowed",
                showActions && "bg-gray-800 text-white"
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showActions && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50"
              >
                {actionButtons.map((button) => (
                  <button
                    key={button.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      button.onClick();
                      setShowActions(false);
                    }}
                    disabled={button.disabled}
                    className={clsx(
                      "flex items-center space-x-3 w-full px-4 py-3 text-sm transition",
                      button.destructive ? "text-red-400 hover:bg-gray-700 hover:text-red-300" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      button.disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <button.icon className="w-4 h-4" />
                    <span>{button.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {actionLoading && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-lg flex items-center justify-center z-10">
          <div className="text-white text-sm">{t("userModal.confirmation.processing")}</div>
        </div>
      )}
    </div>
  );
});

export default UserCard;