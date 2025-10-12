import React, { useEffect, useState, useRef } from "react";
import { 
  User, Mail, Calendar, Shield, Eye, Edit, Ban, Trash2, X, 
  Clock, LogOut, Monitor, CreditCard, Activity, ChevronRight,
  Download, Filter, Search, CheckCircle, AlertCircle, Clock4,
  MoreHorizontal, RefreshCw, Ellipsis
} from "lucide-react";
import clsx from "clsx";
import OverviewTab from "./UserModalTabs/OverviewTab";
import ActivityTab from "./UserModalTabs/ActivityTab";
import SubscriptionTab from "./UserModalTabs/SubscriptionTab";
import SecurityTab from "./UserModalTabs/SecurityTab";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function UserModal({ user, onClose, onUserUpdated }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(user);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showTabDropdown, setShowTabDropdown] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);

  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const tabContainerRef = useRef(null);
  const tabMoreButtonRef = useRef(null);
  const tabDropdownRef = useRef(null);

  const tabs = [
    { id: "overview", label: t("userModal.tabs.overview") },
    { id: "activity", label: t("userModal.tabs.activity") },
    { id: "subscription", label: t("userModal.tabs.subscription") },
    { id: "security", label: t("userModal.tabs.security") }
  ];

  useEffect(() => {
    if (user) {
      setIsVisible(true);
      setIsClosing(false);
      setCurrentUser(user);
      setNewEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isEditingEmail) {
          setIsEditingEmail(false);
          setNewEmail(currentUser.email);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isEditingEmail, currentUser.email]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMoreActions &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMoreActions(false);
      }

      if (
        showTabDropdown &&
        tabMoreButtonRef.current &&
        !tabMoreButtonRef.current.contains(event.target) &&
        tabDropdownRef.current &&
        !tabDropdownRef.current.contains(event.target)
      ) {
        setShowTabDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreActions, showTabDropdown]);

  // Handle responsive tabs
  useEffect(() => {
    const handleResize = () => {
      if (!tabContainerRef.current) return;
      
      const container = tabContainerRef.current;
      const containerWidth = container.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      tabs.forEach(tab => {
        const tabElement = container.querySelector(`[data-tab="${tab.id}"]`);
        if (tabElement) {
          tabElement.style.display = 'flex';
        }
      });

      const moreButtonWidth = 60;
      
      tabs.forEach(tab => {
        const tabElement = container.querySelector(`[data-tab="${tab.id}"]`);
        if (!tabElement) return;

        const tabWidth = tabElement.offsetWidth + 8;
        if (usedWidth + tabWidth <= containerWidth - moreButtonWidth) {
          newVisible.push(tab);
          usedWidth += tabWidth;
        } else {
          newOverflow.push(tab);
          tabElement.style.display = 'none';
        }
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tabs, t]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsEditingEmail(false);
      setNewEmail("");
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isEditingEmail) {
        setIsEditingEmail(false);
        setNewEmail(currentUser.email);
      } else {
        handleClose();
      }
    }
  };

  const handleChangeRole = async () => {
    const newRole = currentUser.role === "admin" ? "viewer" : "admin";
    const roleName = newRole === "admin" ? t("userModal.roles.admin") : t("userModal.roles.viewer");
    
    if (!window.confirm(t("userModal.confirmation.changeRole", { email: currentUser.email, role: roleName }))) return;

    setIsLoadingRole(true);
    try {
      const response = await api.put(`/user/${currentUser.id}/role`, { 
        role: newRole 
      });

      const updatedUser = {
        ...currentUser,
        role: newRole
      };
      setCurrentUser(updatedUser);

      if (onUserUpdated && typeof onUserUpdated === 'function') {
        try {
          onUserUpdated(updatedUser);
        } catch (callbackError) {
          console.warn('Error in onUserUpdated callback:', callbackError);
        }
      }

    } catch (error) {
      console.error("❌ Failed to update user role:", error);
      if (error.response) {
        alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateRole"));
      } else {
        alert(t("userModal.errors.networkError"));
      }
    } finally {
      setIsLoadingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const is_active = !currentUser.is_active;

      const response = await api.put(`/user/${currentUser.id}/status`, { is_active });

      const updatedUser = {
        ...currentUser,
        is_active,
        status: is_active ? "active" : "inactive"
      };
      setCurrentUser(updatedUser);

      if (onUserUpdated && typeof onUserUpdated === 'function') {
        try {
          onUserUpdated(updatedUser);
        } catch (callbackError) {
          console.warn('Error in onUserUpdated callback:', callbackError);
        }
      }

    } catch (error) {
      console.error("❌ Failed to update user status:", error);
      if (error.response) {
        alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateStatus"));
      } else {
        alert(t("userModal.errors.networkError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm(t("userModal.confirmation.deleteAccount", { email: currentUser.email }))) {
      setIsLoading(true);
      try {
        await api.delete(`/user/${currentUser.id}`);

        if (onUserUpdated && typeof onUserUpdated === 'function') {
          try {
            onUserUpdated(currentUser, "deleted");
          } catch (callbackError) {
            console.warn('Error in onUserUpdated callback:', callbackError);
          }
        }
        handleClose();

      } catch (error) {
        console.error("❌ Failed to delete user account:", error);
        if (error.response) {
          alert(error.response.data.error || error.response.data.message || t("userModal.errors.deleteUser"));
        } else {
          alert(t("userModal.errors.networkError"));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveEmail = async () => {
    if (newEmail && newEmail !== currentUser.email) {
      setIsLoading(true);
      try {
        await api.put(`/user/${currentUser.id}/email`, { email: newEmail });

        const updatedUser = { ...currentUser, email: newEmail };
        setCurrentUser(updatedUser);
        setIsEditingEmail(false);
        
        if (onUserUpdated && typeof onUserUpdated === 'function') {
          try {
            onUserUpdated(updatedUser);
          } catch (callbackError) {
            console.warn('Error in onUserUpdated callback:', callbackError);
          }
        }

      } catch (error) {
        console.error("❌ Failed to update email:", error);
        if (error.response) {
          alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateEmail"));
        } else {
          alert(t("userModal.errors.networkError"));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditingEmail(false);
    }
  };

  const handleCancelEmail = () => {
    setIsEditingEmail(false);
    setNewEmail(currentUser.email);
  };

  const getStatusColor = (status) => {
    const userStatus = status || (currentUser.is_active ? "active" : "inactive");
    switch (userStatus) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "suspended": return "bg-yellow-500";
      case "banned": return "bg-red-500";
      default: return currentUser.is_active ? "bg-green-500" : "bg-gray-500";
    }
  };

  const getStatusConfig = (status) => {
    const userStatus = status || (currentUser.is_active ? "active" : "inactive");
    switch (userStatus) {
      case "active": return { label: t("userModal.status.active"), icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10" };
      case "suspended": return { label: t("userModal.status.suspended"), icon: Ban, color: "text-yellow-400", bg: "bg-yellow-400/10" };
      case "banned": return { label: t("userModal.status.banned"), icon: Ban, color: "text-red-400", bg: "bg-red-400/10" };
      default: return { label: t("userModal.status.inactive"), icon: Clock4, color: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <Shield className="w-4 h-4 text-red-400" />;
      case "viewer": return <Eye className="w-4 h-4 text-blue-400" />;
      case "moderator": return <Shield className="w-4 h-4 text-purple-400" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case "admin": return { label: t("userModal.roles.admin"), color: "text-red-400", bg: "bg-red-400/10" };
      case "moderator": return { label: t("userModal.roles.moderator"), color: "text-purple-400", bg: "bg-purple-400/10" };
      case "viewer": return { label: t("userModal.roles.viewer"), color: "text-blue-400", bg: "bg-blue-400/10" };
      default: return { label: t("userModal.roles.user"), color: "text-gray-400", bg: "bg-gray-400/10" };
    }
  };

  if (!currentUser && !isVisible) return null;

  const displayStatus = currentUser.is_active ? "active" : "inactive";
  const statusConfig = getStatusConfig(displayStatus);
  const roleConfig = getRoleConfig(currentUser.role);

  const userDetails = {
    ...currentUser,
    id: currentUser.id,
    createdAt: currentUser.created_at || new Date().toISOString(),
    lastLogin: currentUser.last_login || new Date().toISOString(),
    subscriptionStatus: currentUser.subscription_plan || "premium",
    subscriptionSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    loginSessions: [
      { id: 1, device: "Chrome on Windows", ip: "192.168.1.1", location: "New York, US", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), success: true },
      { id: 2, device: "Safari on iPhone", ip: "192.168.1.2", location: "London, UK", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), success: true },
      { id: 3, device: "Firefox on Mac", ip: "192.168.1.3", location: "Tokyo, JP", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), success: false },
    ],
    activityStats: {
      totalLogins: currentUser.total_logins || 42,
      failedAttempts: currentUser.failed_attempts || 3,
      currentStreak: currentUser.current_streak || 7,
      avgSession: currentUser.avg_session || "12m 34s"
    }
  };

  const actionButtons = [
    { 
      id: "edit", 
      icon: Edit, 
      label: isEditingEmail ? t("userModal.actions.save") : t("userModal.actions.editEmail"), 
      onClick: isEditingEmail ? handleSaveEmail : () => setIsEditingEmail(true), 
      disabled: isLoading,
      priority: "high"
    },
    { 
      id: "role", 
      icon: Shield, 
      label: currentUser.role === "admin" ? t("userModal.actions.makeViewer") : t("userModal.actions.makeAdmin"), 
      onClick: handleChangeRole, 
      disabled: isLoading || isLoadingRole,
      loading: isLoadingRole,
      priority: "high"
    },
    { 
      id: "status", 
      icon: displayStatus === "active" ? Ban : User, 
      label: displayStatus === "active" ? t("userModal.actions.deactivate") : t("userModal.actions.activate"), 
      onClick: handleToggleStatus, 
      disabled: isLoading,
      priority: "medium"
    },
    { 
      id: "login-history", 
      icon: Activity, 
      label: t("userModal.actions.loginHistory"), 
      onClick: () => setActiveTab("activity"),
      disabled: isLoading,
      priority: "medium"
    },
    { 
      id: "delete", 
      icon: Trash2, 
      label: t("userModal.actions.delete"), 
      onClick: handleDeleteAccount, 
      destructive: true, 
      disabled: isLoading,
      priority: "low"
    }
  ];

  const highPriorityButtons = actionButtons.filter(btn => btn.priority === "high");
  const mediumPriorityButtons = actionButtons.filter(btn => btn.priority === "medium");
  const lowPriorityButtons = actionButtons.filter(btn => btn.priority === "low");

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-300",
        isVisible ? "bg-black/60" : "bg-transparent", 
        isClosing ? "bg-black/0" : ""
      )}
      onClick={handleBackdropClick}
    >
      <div 
        className={clsx(
          "bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] shadow-2xl transform transition-all duration-300 overflow-hidden flex flex-col",
          isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center overflow-hidden">
                {currentUser.profile_avatar_url ? (
                  <img 
                    src={currentUser.profile_avatar_url} 
                    alt={currentUser.name} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover" 
                    onError={(e) => { 
                      e.currentTarget.style.display = "none"; 
                    }} 
                  />
                ) : (
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                )}
              </div>
              <div className={clsx("absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 border-gray-900", getStatusColor(displayStatus))} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                <h2 className="text-white text-lg sm:text-xl font-bold truncate">
                  {currentUser.email.split("@")[0]}
                </h2>
                <span className={clsx(
                  "inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium flex-shrink-0",
                  roleConfig.bg, 
                  roleConfig.color
                )}>
                  {getRoleIcon(currentUser.role)}
                  <span className="hidden xs:inline">{roleConfig.label}</span>
                  <span className="xs:hidden">{currentUser.role === "admin" ? t("userModal.roles.admin") : t("userModal.roles.viewer")}</span>
                </span>
              </div>
              {isEditingEmail ? (
                <div className="flex items-center space-x-2 mt-1">
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500 flex-1 min-w-0" 
                    placeholder="Enter new email" 
                    autoFocus 
                    disabled={isLoading} 
                  />
                  <button 
                    onClick={handleCancelEmail} 
                    className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white flex-shrink-0" 
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm truncate">{currentUser.email}</p>
              )}
            </div>
          </div>
          <button 
            onClick={isEditingEmail ? handleCancelEmail : handleClose} 
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white flex-shrink-0 ml-2" 
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Tabs */}
        <div className="border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center relative px-4 sm:px-6" ref={tabContainerRef}>
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                disabled={isLoading} 
                className={clsx(
                  "flex items-center px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-200 capitalize flex-shrink-0",
                  activeTab === tab.id 
                    ? "text-white border-b-2 border-purple-500" 
                    : "text-gray-400 hover:text-gray-300", 
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {tab.label}
              </button>
            ))}

            {overflowTabs.length > 0 && (
              <div className="relative ml-auto" ref={tabMoreButtonRef}>
                <button
                  onClick={() => setShowTabDropdown(!showTabDropdown)}
                  className="flex items-center px-3 py-3 text-gray-400 hover:text-white transition-colors"
                >
                  <Ellipsis className="w-4 h-4" />
                </button>
                {showTabDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-40"
                    ref={tabDropdownRef}
                  >
                    {overflowTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowTabDropdown(false);
                        }}
                        className={clsx(
                          "block w-full text-left px-4 py-3 text-sm transition first:rounded-t-lg last:rounded-b-lg",
                          activeTab === tab.id
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6">
            {activeTab === "overview" && (
              <OverviewTab 
                userDetails={userDetails} 
                user={currentUser} 
                statusConfig={statusConfig} 
              />
            )}
            {activeTab === "activity" && (
              <ActivityTab 
                userDetails={userDetails} 
                userId={currentUser.id}
              />
            )}
            {activeTab === "subscription" && (
              <SubscriptionTab 
                userDetails={userDetails} 
              />
            )}
            {activeTab === "security" && (
              <SecurityTab 
                userDetails={userDetails} 
                userId={currentUser.id}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col xs:flex-row justify-between items-stretch xs:items-center p-4 sm:p-6 border-t border-gray-800 bg-gray-900/50 gap-3 flex-shrink-0" ref={containerRef}>
          <div className="flex flex-wrap gap-2 justify-center xs:justify-start">
            {highPriorityButtons.map((btn) => (
              <button 
                key={btn.id} 
                onClick={btn.onClick} 
                disabled={btn.disabled}
                className={clsx(
                  "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition text-sm font-medium border min-w-0 flex-1 xs:flex-none justify-center",
                  btn.destructive 
                    ? "text-red-400 hover:bg-red-400/10 border-red-400/20" 
                    : "text-gray-300 hover:bg-gray-800 border-gray-700", 
                  btn.id === "edit" && isEditingEmail && "bg-purple-500/20 border-purple-500/50 text-purple-300", 
                  btn.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {btn.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                ) : (
                  <btn.icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="whitespace-nowrap hidden sm:inline">{btn.label}</span>
                <span className="whitespace-nowrap sm:hidden">
                  {btn.id === "edit" ? (isEditingEmail ? t("userModal.actions.save") : t("userModal.actions.editEmail")) : 
                   btn.id === "role" ? (currentUser.role === "admin" ? t("userModal.roles.viewer") : t("userModal.roles.admin")) : 
                   btn.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center xs:justify-end">
            <div className="hidden sm:flex gap-2">
              {mediumPriorityButtons.map((btn) => (
                <button 
                  key={btn.id} 
                  onClick={btn.onClick} 
                  disabled={btn.disabled}
                  className={clsx(
                    "flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition text-sm font-medium border min-w-0",
                    "text-gray-300 hover:bg-gray-800 border-gray-700", 
                    btn.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <btn.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{btn.label}</span>
                </button>
              ))}
            </div>

            {(mediumPriorityButtons.length > 0 || lowPriorityButtons.length > 0) && (
              <div className="relative" ref={moreButtonRef}>
                <button
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 min-w-0"
                >
                  <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap hidden xs:inline">{t("userModal.actions.more")}</span>
                </button>
                
                {showMoreActions && (
                  <div
                    className="absolute right-0 bottom-full mb-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-40"
                    ref={dropdownRef}
                  >
                    {mediumPriorityButtons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => {
                          btn.onClick();
                          setShowMoreActions(false);
                        }}
                        disabled={btn.disabled}
                        className={clsx(
                          "flex items-center space-x-2 w-full text-left px-4 py-3 text-sm transition first:rounded-t-lg last:rounded-b-lg",
                          "text-gray-300 hover:bg-gray-800 hover:text-white",
                          btn.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <btn.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{btn.label}</span>
                      </button>
                    ))}
                    
                    {lowPriorityButtons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => {
                          btn.onClick();
                          setShowMoreActions(false);
                        }}
                        disabled={btn.disabled}
                        className={clsx(
                          "flex items-center space-x-2 w-full text-left px-4 py-3 text-sm transition first:rounded-t-lg last:rounded-b-lg",
                          btn.destructive 
                            ? "text-red-400 hover:bg-red-400/10" 
                            : "text-gray-300 hover:bg-gray-800 hover:text-white",
                          btn.disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <btn.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50">
            <div className="text-white text-lg">{t("userModal.confirmation.processing")}</div>
          </div>
        )}
      </div>
    </div>
  );
}