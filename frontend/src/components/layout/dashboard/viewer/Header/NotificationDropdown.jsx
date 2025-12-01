import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Sparkles, ExternalLink, CheckCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotificationDropdown = ({
  notifications,
  unreadCount,
  apiError,
  loading,
  onRefresh,
  onNotificationClick,
  onViewAll,
  responsive = false,
  align = "right"
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const dropdownRef = useRef(null);

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.status === 'unread' && b.status !== 'unread') return -1;
    if (a.status !== 'unread' && b.status === 'unread') return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleBellClick = async () => {
    const wasOpen = notificationsOpen;
    setNotificationsOpen(!wasOpen);

    if (!wasOpen) {
      onRefresh();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setNotificationsOpen(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notification.time.justNow');
    if (diffMins < 60) return t('notification.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notification.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notification.time.daysAgo', { count: diffDays });
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (notification) => {
    const iconMap = {
      bell: <Bell size={16} className="text-blue-400" />,
      warning: <Sparkles size={16} className="text-yellow-400" />,
      error: <X size={16} className="text-red-400" />,
      success: <CheckCircle size={16} className="text-green-400" />,
      info: <Sparkles size={16} className="text-purple-400" />,
      default: <Bell size={16} className="text-[#BC8BBC]" />
    };
    return iconMap[notification.icon] || iconMap.default;
  };

  const getReadStatusIcon = (status) => {
    return status === 'read' ? (
      <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
    ) : (
      <div className="w-2 h-2 bg-[#BC8BBC] rounded-full flex-shrink-0 animate-pulse" />
    );
  };

  const renderNotificationBadge = () => {
    if (unreadCount === 0 || apiError) return null;
    const displayCount = unreadCount > 9 ? '9+' : unreadCount;

    return (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#BC8BBC] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 animate-pulse">
        {displayCount}
      </span>
    );
  };

  const getNotificationBackground = (notification) => {
    if (notification.status === 'unread') {
      return 'bg-gradient-to-r from-[#BC8BBC]/10 to-transparent border-l-4 border-[#BC8BBC]';
    }
    return 'bg-gradient-to-r from-[#BC8BBC]/5 to-transparent';
  };

  // Enhanced positioning - Always centered on mobile
  const getDropdownPosition = () => {
    if (!responsive) {
      return "right-0";
    }

    const viewportWidth = window.innerWidth;
    
    if (viewportWidth < 768) {
      // On mobile: ALWAYS centered with safe margins
      return "left-1/2 transform -translate-x-1/2 mx-auto";
    } else if (viewportWidth < 1024) {
      // On tablet: ensure it doesn't shrink and stays visible
      if (align === "left") {
        return "left-0";
      } else {
        return "right-0";
      }
    } else {
      // On desktop: use preferred alignment
      if (align === "left") {
        return "left-0";
      } else {
        return "right-0";
      }
    }
  };

  // Enhanced responsive width - Perfect fit for mobile
  const getDropdownWidth = () => {
    if (!responsive) return "w-96 min-w-96";

    const viewportWidth = window.innerWidth;
    
    if (viewportWidth < 640) {
      // Perfect fit for mobile with safe margins
      return "w-[calc(100vw-2rem)] max-w-sm";
    } else if (viewportWidth < 768) {
      // Good fit for small tablets
      return "w-[calc(100vw-3rem)] max-w-md";
    } else if (viewportWidth < 1024) {
      // Standard for larger tablets
      return "w-80 min-w-80";
    } else {
      // Standard width on desktop
      return "w-96 min-w-96";
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update position when window resizes
  useEffect(() => {
    const handleResize = () => {
      // Force re-render to update positioning
      if (notificationsOpen) {
        setNotificationsOpen(false);
        setTimeout(() => setNotificationsOpen(true), 10);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [notificationsOpen]);

  return (
    <div ref={notificationsRef} className="relative flex-shrink-0">
      <button 
        onClick={handleBellClick}
        disabled={loading}
        className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800/50 rounded-lg relative group flex-shrink-0"
      >
        <Bell size={20} className={`group-hover:text-[#BC8BBC] transition-colors ${loading ? "animate-pulse" : ""}`} />
        {renderNotificationBadge()}
        {apiError && (
          <span className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full w-1.5 h-1.5 animate-ping"></span>
        )}
      </button>

      {/* Enhanced Notifications Dropdown - Perfectly Centered on Mobile */}
      {notificationsOpen && (
        <div 
          ref={dropdownRef}
          className={`fixed sm:absolute ${getDropdownPosition()} top-16 sm:top-12 ${getDropdownWidth()} bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-2xl shadow-2xl overflow-hidden z-50`}
          style={{
            // Ensure perfect centering on mobile
            maxWidth: 'calc(100vw - 2rem)'
          }}
        >
          <div className="p-4 border-b border-gray-600/50 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-[#BC8BBC]/10 rounded-lg flex-shrink-0">
                  <Bell size={20} className="text-[#BC8BBC]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-lg truncate">{t('notification.dropdown.title')}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {unreadCount > 0 
                      ? t('notification.dropdown.unreadCount', { count: unreadCount })
                      : t('notification.dropdown.allCaughtUp')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-[#BC8BBC] transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-700/50 flex-shrink-0"
                  title={t('notification.dropdown.refresh')}
                >
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC] mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">{t('notification.dropdown.loading')}</p>
              </div>
            ) : apiError ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X size={24} className="text-red-400" />
                </div>
                <p className="text-gray-300 font-medium mb-2 text-sm sm:text-base">{t('notification.dropdown.connectionIssue')}</p>
                <p className="text-gray-400 text-xs sm:text-sm mb-4 px-2">{t('notification.dropdown.unableToLoad')}</p>
                <button 
                  onClick={onRefresh}
                  className="px-4 py-2 text-sm text-[#BC8BBC] hover:text-white hover:bg-[#BC8BBC] transition-all duration-200 rounded-lg border border-[#BC8BBC] font-medium"
                >
                  {t('notification.dropdown.tryAgain')}
                </button>
              </div>
            ) : (
              <>
                <div className="max-h-80 overflow-y-auto">
                  {sortedNotifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-[#BC8BBC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={32} className="text-[#BC8BBC] opacity-60" />
                      </div>
                      <p className="text-gray-300 font-medium text-base sm:text-lg mb-2">{t('notification.dropdown.noNotifications')}</p>
                      <p className="text-gray-400 text-sm">{t('notification.dropdown.allCaughtUpMessage')}</p>
                    </div>
                  ) : (
                    sortedNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`group p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${getNotificationBackground(notification)} border-b border-gray-700/30 last:border-b-0`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="flex-shrink-0 mt-1">
                            <div className="p-2 bg-gray-700/50 rounded-lg">
                              {getNotificationIcon(notification)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className={`text-sm font-semibold truncate ${
                                notification.status === 'unread' ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {getReadStatusIcon(notification.status)}
                                {notification.action_url && (
                                  <ExternalLink size={12} className="text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full truncate max-w-[100px] sm:max-w-[120px]">
                                {formatTime(notification.created_at)}
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                                notification.status === 'unread' 
                                  ? 'text-[#BC8BBC] bg-[#BC8BBC]/10' 
                                  : 'text-green-400 bg-green-400/10'
                              }`}>
                                {notification.status === 'read' 
                                  ? t('notification.status.read') 
                                  : t('notification.status.new')
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-4 border-t border-gray-600/50 bg-gradient-to-r from-gray-800 to-gray-900">
                    <button 
                      onClick={onViewAll}
                      className="w-full text-center text-[#BC8BBC] hover:text-white font-semibold py-3 transition-all duration-200 hover:bg-[#BC8BBC]/10 rounded-lg border border-[#BC8BBC]/30 hover:border-[#BC8BBC] text-sm sm:text-base"
                    >
                      {t('notification.dropdown.viewAll')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;