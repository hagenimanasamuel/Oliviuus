import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  User, Mail, Calendar, Shield, Eye, Edit, Ban, Trash2, X, 
  Clock, LogOut, Monitor, CreditCard, Activity, ChevronRight,
  Download, Filter, Search, CheckCircle, AlertCircle, Clock4,
  MoreHorizontal, RefreshCw, Ellipsis, Bell, Lock, Phone, Key, Globe
} from "lucide-react";
import clsx from "clsx";
import OverviewTab from "./UserModalTabs/OverviewTab";
import ActivityTab from "./UserModalTabs/ActivityTab";
import SubscriptionTab from "./UserModalTabs/SubscriptionTab";
import SecurityTab from "./UserModalTabs/SecurityTab";
import SecurityLogsTab from "./UserModalTabs/SecurityLogsTab";
import NotificationsTab from "./UserModalTabs/NotificationsTab";
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

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export default function UserModal({ user, onClose, onUserUpdated }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentUser, setCurrentUser] = useState(user);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
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
  const resizeTimeoutRef = useRef(null);
  const isCalculatingRef = useRef(false);

  const tabs = [
    { id: "overview", label: t("userModal.tabs.overview"), icon: User },
    { id: "activity", label: t("userModal.tabs.activity"), icon: Activity },
    { id: "subscription", label: t("userModal.tabs.subscription"), icon: CreditCard },
    { id: "security", label: t("userModal.tabs.security"), icon: Shield },
    { id: "security-logs", label: t("userModal.tabs.securityLogs"), icon: Lock },
    { id: "notifications", label: t("userModal.tabs.notifications"), icon: Bell }
  ];

  useEffect(() => {
    if (user) {
      setIsVisible(true);
      setIsClosing(false);
      setCurrentUser(user);
      setNewEmail(user.email || "");
      setNewPhone(user.phone || "");
      setNewUsername(user.username || "");
      setNewFirstName(user.first_name || "");
      setNewLastName(user.last_name || "");
    }
  }, [user]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isEditingEmail || isEditingPhone || isEditingUsername || isEditingName) {
          cancelAllEdits();
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isEditingEmail, isEditingPhone, isEditingUsername, isEditingName, currentUser]);

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

  // Fixed handleResize function with debouncing
  const handleResize = useCallback(() => {
    if (!tabContainerRef.current || isCalculatingRef.current) return;
    
    isCalculatingRef.current = true;
    
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      const container = tabContainerRef.current;
      const containerWidth = container.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      tabs.forEach(tab => {
        const tabElement = container.querySelector(`[data-tab="${tab.id}"]`);
        if (tabElement) {
          tabElement.style.display = 'flex';
          tabElement.style.visibility = 'hidden';
        }
      });

      container.offsetHeight;

      const moreButtonWidth = 80;
      
      tabs.forEach(tab => {
        const tabElement = container.querySelector(`[data-tab="${tab.id}"]`);
        if (!tabElement) return;

        const tabWidth = tabElement.offsetWidth + 8;
        if (usedWidth + tabWidth <= containerWidth - moreButtonWidth) {
          newVisible.push(tab);
          usedWidth += tabWidth;
          tabElement.style.visibility = 'visible';
        } else {
          newOverflow.push(tab);
          tabElement.style.display = 'none';
        }
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
      
      isCalculatingRef.current = false;
    }, 100);
  }, [tabs]);

  // Handle responsive tabs
  useEffect(() => {
    handleResize();
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.target === tabContainerRef.current) {
          handleResize();
        }
      }
    });

    if (tabContainerRef.current) {
      resizeObserver.observe(tabContainerRef.current);
    }

    const handleWindowResize = () => {
      handleResize();
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      cancelAllEdits();
      onClose();
    }, 300);
  };

  const cancelAllEdits = () => {
    setIsEditingEmail(false);
    setIsEditingPhone(false);
    setIsEditingUsername(false);
    setIsEditingName(false);
    setNewEmail(currentUser.email || "");
    setNewPhone(currentUser.phone || "");
    setNewUsername(currentUser.username || "");
    setNewFirstName(currentUser.first_name || "");
    setNewLastName(currentUser.last_name || "");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isEditingEmail || isEditingPhone || isEditingUsername || isEditingName) {
        cancelAllEdits();
      } else {
        handleClose();
      }
    }
  };

  const handleChangeRole = async () => {
    const newRole = currentUser.role === "admin" ? "viewer" : "admin";
    const roleName = newRole === "admin" ? t("userModal.roles.admin") : t("userModal.roles.viewer");
    const userIdentifier = getUserPrimaryIdentifier(currentUser);
    
    if (!window.confirm(t("userModal.confirmation.changeRole", { identifier: userIdentifier, role: roleName }))) return;

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
    const userIdentifier = getUserPrimaryIdentifier(currentUser);
    if (window.confirm(t("userModal.confirmation.deleteAccount", { identifier: userIdentifier }))) {
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
      if (!newEmail.includes('@')) {
        alert(t("userModal.errors.invalidEmail"));
        return;
      }

      setIsLoading(true);
      try {
        await api.put(`/user/${currentUser.id}/email`, { email: newEmail });

        const updatedUser = { 
          ...currentUser, 
          email: newEmail,
          email_verified: false // Reset verification when email changes
        };
        setCurrentUser(updatedUser);
        setIsEditingEmail(false);
        
        if (onUserUpdated && typeof onUserUpdated === 'function') {
          try {
            onUserUpdated(updatedUser);
          } catch (callbackError) {
            console.warn('Error in onUserUpdated callback:', callbackError);
          }
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
        setIsLoading(false);
      }
    } else {
      setIsEditingEmail(false);
    }
  };

  const handleSavePhone = async () => {
    if (newPhone !== currentUser.phone) {
      setIsLoading(true);
      try {
        await api.put(`/user/${currentUser.id}/phone`, { phone: newPhone });

        const updatedUser = { 
          ...currentUser, 
          phone: newPhone,
          phone_verified: false // Reset verification when phone changes
        };
        setCurrentUser(updatedUser);
        setIsEditingPhone(false);
        
        if (onUserUpdated && typeof onUserUpdated === 'function') {
          try {
            onUserUpdated(updatedUser);
          } catch (callbackError) {
            console.warn('Error in onUserUpdated callback:', callbackError);
          }
        }

        alert(t("userModal.success.phoneUpdated"));

      } catch (error) {
        console.error("❌ Failed to update phone:", error);
        if (error.response) {
          alert(error.response.data.error || error.response.data.message || t("userModal.errors.updatePhone"));
        } else {
          alert(t("userModal.errors.networkError"));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditingPhone(false);
    }
  };

  const handleSaveUsername = async () => {
    if (newUsername && newUsername !== currentUser.username) {
      setIsLoading(true);
      try {
        await api.put(`/user/${currentUser.id}/username`, { username: newUsername });

        const updatedUser = { 
          ...currentUser, 
          username: newUsername,
          username_verified: true // Username is verified immediately
        };
        setCurrentUser(updatedUser);
        setIsEditingUsername(false);
        
        if (onUserUpdated && typeof onUserUpdated === 'function') {
          try {
            onUserUpdated(updatedUser);
          } catch (callbackError) {
            console.warn('Error in onUserUpdated callback:', callbackError);
          }
        }

        alert(t("userModal.success.usernameUpdated"));

      } catch (error) {
        console.error("❌ Failed to update username:", error);
        if (error.response) {
          alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateUsername"));
        } else {
          alert(t("userModal.errors.networkError"));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditingUsername(false);
    }
  };

  const handleSaveName = async () => {
    if ((newFirstName !== currentUser.first_name) || (newLastName !== currentUser.last_name)) {
      setIsLoading(true);
      try {
        await api.put(`/user/${currentUser.id}/name`, { 
          first_name: newFirstName || null, 
          last_name: newLastName || null 
        });

        const updatedUser = { 
          ...currentUser, 
          first_name: newFirstName || null,
          last_name: newLastName || null
        };
        setCurrentUser(updatedUser);
        setIsEditingName(false);
        
        if (onUserUpdated && typeof onUserUpdated === 'function') {
          try {
            onUserUpdated(updatedUser);
          } catch (callbackError) {
            console.warn('Error in onUserUpdated callback:', callbackError);
          }
        }

        alert(t("userModal.success.nameUpdated"));

      } catch (error) {
        console.error("❌ Failed to update name:", error);
        if (error.response) {
          alert(error.response.data.error || error.response.data.message || t("userModal.errors.updateName"));
        } else {
          alert(t("userModal.errors.networkError"));
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditingName(false);
    }
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
  const displayName = getUserDisplayName(currentUser);
  const primaryIdentifier = getUserPrimaryIdentifier(currentUser);

  const userDetails = {
    ...currentUser,
    id: currentUser.id,
    createdAt: currentUser.created_at || new Date().toISOString(),
    lastLogin: currentUser.last_login_at || new Date().toISOString(),
    subscriptionStatus: currentUser.subscription_plan || "free",
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
      id: "edit-email", 
      icon: Mail, 
      label: isEditingEmail ? t("userModal.actions.save") : t("userModal.actions.editEmail"), 
      onClick: isEditingEmail ? handleSaveEmail : () => setIsEditingEmail(true), 
      disabled: isLoading,
      priority: "high",
      show: !!currentUser.email
    },
    { 
      id: "edit-phone", 
      icon: Phone, 
      label: isEditingPhone ? t("userModal.actions.save") : t("userModal.actions.editPhone"), 
      onClick: isEditingPhone ? handleSavePhone : () => setIsEditingPhone(true), 
      disabled: isLoading,
      priority: "high",
      show: !!currentUser.phone
    },
    { 
      id: "edit-username", 
      icon: User, 
      label: isEditingUsername ? t("userModal.actions.save") : t("userModal.actions.editUsername"), 
      onClick: isEditingUsername ? handleSaveUsername : () => setIsEditingUsername(true), 
      disabled: isLoading,
      priority: "medium",
      show: !!currentUser.username
    },
    { 
      id: "edit-name", 
      icon: Edit, 
      label: isEditingName ? t("userModal.actions.save") : t("userModal.actions.editName"), 
      onClick: isEditingName ? handleSaveName : () => setIsEditingName(true), 
      disabled: isLoading,
      priority: "medium",
      show: !!currentUser.first_name || !!currentUser.last_name
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

  const visibleActionButtons = actionButtons.filter(btn => btn.show !== false);
  const highPriorityButtons = visibleActionButtons.filter(btn => btn.priority === "high");
  const mediumPriorityButtons = visibleActionButtons.filter(btn => btn.priority === "medium");
  const lowPriorityButtons = visibleActionButtons.filter(btn => btn.priority === "low");

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
                    alt={displayName} 
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
                  {displayName}
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
              
              {/* User Identifiers */}
              <div className="space-y-1 mt-1">
                {isEditingEmail ? (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <input 
                      type="email" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500 flex-1 min-w-0" 
                      placeholder="Enter new email" 
                      autoFocus 
                      disabled={isLoading} 
                    />
                  </div>
                ) : currentUser.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs truncate">{currentUser.email}</span>
                    {currentUser.email_verified ? (
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                )}
                
                {isEditingPhone ? (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <input 
                      type="tel" 
                      value={newPhone} 
                      onChange={(e) => setNewPhone(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500 flex-1 min-w-0" 
                      placeholder="Enter new phone" 
                      autoFocus 
                      disabled={isLoading} 
                    />
                  </div>
                ) : currentUser.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs truncate">{currentUser.phone}</span>
                    {currentUser.phone_verified ? (
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                )}
                
                {isEditingUsername ? (
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <input 
                      type="text" 
                      value={newUsername} 
                      onChange={(e) => setNewUsername(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500 flex-1 min-w-0" 
                      placeholder="Enter new username" 
                      autoFocus 
                      disabled={isLoading} 
                    />
                  </div>
                ) : currentUser.username && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs truncate">@{currentUser.username}</span>
                    {currentUser.username_verified && (
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                )}
                
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <input 
                      type="text" 
                      value={newFirstName} 
                      onChange={(e) => setNewFirstName(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500 flex-1 min-w-0" 
                      placeholder="First name" 
                      autoFocus 
                      disabled={isLoading} 
                    />
                    <input 
                      type="text" 
                      value={newLastName} 
                      onChange={(e) => setNewLastName(e.target.value)} 
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500 flex-1 min-w-0" 
                      placeholder="Last name" 
                      disabled={isLoading} 
                    />
                  </div>
                ) : (currentUser.first_name || currentUser.last_name) && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs truncate">
                      {currentUser.first_name} {currentUser.last_name}
                    </span>
                  </div>
                )}
                
                {/* Oliviuus ID */}
                {currentUser.oliviuus_id && (
                  <div className="flex items-center space-x-1">
                    <Key className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400 text-xs truncate">{currentUser.oliviuus_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={isEditingEmail || isEditingPhone || isEditingUsername || isEditingName ? cancelAllEdits : handleClose} 
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
                  "flex items-center space-x-2 px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-200 capitalize flex-shrink-0",
                  activeTab === tab.id 
                    ? "text-white border-b-2 border-purple-500" 
                    : "text-gray-400 hover:text-gray-300", 
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
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
                          "flex items-center space-x-2 w-full text-left px-4 py-3 text-sm transition first:rounded-t-lg last:rounded-b-lg",
                          activeTab === tab.id
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <tab.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{tab.label}</span>
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
                userId={currentUser.id} 
              />
            )}
            {activeTab === "security" && (
              <SecurityTab 
                userDetails={userDetails} 
                userId={currentUser.id}
              />
            )}
            {activeTab === "security-logs" && (
              <SecurityLogsTab 
                userDetails={userDetails} 
                userId={currentUser.id}
              />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab 
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
                  (btn.id.includes("edit") && (btn.id.includes("email") && isEditingEmail || 
                                              btn.id.includes("phone") && isEditingPhone || 
                                              btn.id.includes("username") && isEditingUsername || 
                                              btn.id.includes("name") && isEditingName)) && 
                    "bg-purple-500/20 border-purple-500/50 text-purple-300", 
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
                  {btn.id === "edit-email" ? (isEditingEmail ? t("userModal.actions.save") : t("userModal.actions.editEmail")) : 
                   btn.id === "edit-phone" ? (isEditingPhone ? t("userModal.actions.save") : t("userModal.actions.editPhone")) : 
                   btn.id === "edit-username" ? (isEditingUsername ? t("userModal.actions.save") : t("userModal.actions.editUsername")) : 
                   btn.id === "edit-name" ? (isEditingName ? t("userModal.actions.save") : t("userModal.actions.editName")) : 
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