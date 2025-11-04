import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Sparkles, ExternalLink, CheckCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationDropdown = ({ 
  notifications, 
  unreadCount, 
  apiError, 
  loading, 
  onRefresh, 
  onNotificationClick,
  onViewAll 
}) => {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={notificationsRef} className="relative">
      <button 
        onClick={handleBellClick}
        disabled={loading}
        className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800/50 rounded-lg relative group"
      >
        <Bell size={20} className={`group-hover:text-[#BC8BBC] transition-colors ${loading ? "animate-pulse" : ""}`} />
        {renderNotificationBadge()}
        {apiError && (
          <span className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full w-1.5 h-1.5 animate-ping"></span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {notificationsOpen && (
        <div className="absolute right-0 top-12 w-96 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-600/50 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#BC8BBC]/10 rounded-lg">
                  <Bell size={20} className="text-[#BC8BBC]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Notifications</h3>
                  <p className="text-gray-400 text-sm">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-[#BC8BBC] transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-700/50"
                  title="Refresh"
                >
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC] mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Loading notifications...</p>
            </div>
          ) : apiError ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <X size={24} className="text-red-400" />
              </div>
              <p className="text-gray-300 font-medium mb-2">Connection Issue</p>
              <p className="text-gray-400 text-sm mb-4">Unable to load notifications</p>
              <button 
                onClick={onRefresh}
                className="px-4 py-2 text-sm text-[#BC8BBC] hover:text-white hover:bg-[#BC8BBC] transition-all duration-200 rounded-lg border border-[#BC8BBC] font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {sortedNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-[#BC8BBC]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={32} className="text-[#BC8BBC] opacity-60" />
                    </div>
                    <p className="text-gray-300 font-medium text-lg mb-2">No notifications</p>
                    <p className="text-gray-400 text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  sortedNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`group p-4 transition-all duration-300 cursor-pointer hover:scale-[1.02] ${getNotificationBackground(notification)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-4">
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
                            <div className="flex items-center gap-2">
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
                            <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">
                              {formatTime(notification.created_at)}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              notification.status === 'unread' 
                                ? 'text-[#BC8BBC] bg-[#BC8BBC]/10' 
                                : 'text-green-400 bg-green-400/10'
                            }`}>
                              {notification.status === 'read' ? 'Read' : 'New'}
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
                    className="w-full text-center text-[#BC8BBC] hover:text-white font-semibold py-3 transition-all duration-200 hover:bg-[#BC8BBC]/10 rounded-lg border border-[#BC8BBC]/30 hover:border-[#BC8BBC]"
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;