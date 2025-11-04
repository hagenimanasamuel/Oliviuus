import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, RefreshCw, AlertCircle, ChevronRight, CheckCircle2, Circle, Sparkles, Zap, Gift, TrendingUp } from "lucide-react";
import api from "../../../api/axios"; 
import { useNavigate } from "react-router-dom";

const NotificationModal = ({ isOpen, onClose, userId }) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Brand color
  const brandColor = '#BC8BBC';

  // Separate notifications into unread and read sections
  const unreadNotifications = notifications
    .filter(notif => notif.status === 'unread')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const readNotifications = notifications
    .filter(notif => notif.status === 'read')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Enhanced fetch functions with animation delays
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setError('Failed to load notification count');
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setError(null);
      } else {
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced notification click with ripple effect
  const handleNotificationClick = async (notification, event) => {
    // Create ripple effect
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(188, 139, 188, 0.3);
      transform: scale(0);
      animation: ripple-animation 600ms linear;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);

    // Mark as read immediately if unread
    if (notification.status === 'unread') {
      try {
        const response = await api.put(`/notifications/${notification.id}/read`);
        if (response.data.success) {
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === notification.id 
                ? { ...notif, status: 'read', read_at: new Date().toISOString() }
                : notif
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // If notification has action_url, navigate to it
    if (notification.action_url) {
      setTimeout(() => {
        navigate(notification.action_url);
        handleClose();
      }, 300);
    }
  };

  // Enhanced mark all as read with confirmation animation
  const markAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        // Add success animation
        const markAllBtn = document.querySelector('[data-mark-all-btn]');
        if (markAllBtn) {
          markAllBtn.style.transform = 'scale(0.95)';
          setTimeout(() => {
            markAllBtn.style.transform = 'scale(1)';
          }, 150);
        }
        
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Refresh all data with animation
  const refreshData = async () => {
    setError(null);
    const refreshBtn = document.querySelector('[data-refresh-btn]');
    if (refreshBtn) {
      refreshBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
      }, 500);
    }
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  };

  // Enhanced close handler with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  // Enhanced ESC key handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen && !isClosing) {
      handleClose();
    }
  }, [isOpen, isClosing, handleClose]);

  // Enhanced backdrop click with ripple
  const handleBackdropClick = (e) => {
    if (backdropRef.current === e.target && !isClosing) {
      // Create backdrop ripple effect
      const ripple = document.createElement('div');
      const rect = backdropRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        transform: scale(0);
        animation: backdrop-ripple 500ms ease-out;
        width: 100px;
        height: 100px;
        left: ${x - 50}px;
        top: ${y - 50}px;
        pointer-events: none;
      `;
      
      backdropRef.current.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 500);
      
      handleClose();
    }
  };

  // Enhanced notification icons with animated versions
  const getNotificationIcon = (notification) => {
    const iconMap = {
      bell: <Bell size={20} className="text-blue-400 animate-pulse" />,
      warning: <Zap size={20} className="text-yellow-400 animate-bounce" />,
      error: <X size={20} className="text-red-400 animate-pulse" />,
      success: <CheckCircle2 size={20} className="text-green-400 animate-bounce" />,
      info: <Sparkles size={20} className="text-purple-400 animate-pulse" />,
      subscription: <Gift size={20} className="text-pink-400 animate-bounce" />,
      payment: <TrendingUp size={20} className="text-green-400 animate-pulse" />,
      device: <Circle size={20} className="text-blue-400 animate-pulse" />,
      security: <CheckCircle2 size={20} className="text-green-400 animate-bounce" />,
      video: <Sparkles size={20} className="text-yellow-400 animate-pulse" />,
      download: <TrendingUp size={20} className="text-blue-400 animate-bounce" />,
      support: <Bell size={20} className="text-red-400 animate-pulse" />,
      system: <Zap size={20} className="text-gray-400 animate-pulse" />,
      user: <Circle size={20} className="text-[#BC8BBC] animate-bounce" />,
      default: <Bell size={20} className="text-[#BC8BBC] animate-pulse" />
    };

    return (
      <div className="p-2 bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-600/30">
        {iconMap[notification.icon] || iconMap.default}
      </div>
    );
  };

  // Enhanced background based on notification type
  const getNotificationBackground = (notification) => {
    if (notification.status === 'unread') {
      return 'bg-gradient-to-r from-[#BC8BBC]/10 via-[#BC8BBC]/5 to-transparent border-l-4 border-[#BC8BBC] shadow-lg shadow-[#BC8BBC]/10';
    }
    
    const type = notification.type || notification.icon;
    switch (type) {
      case 'success':
      case 'payment':
        return 'bg-gradient-to-r from-green-500/5 via-green-500/2 to-transparent border-l-2 border-green-500/30';
      case 'warning':
      case 'error':
        return 'bg-gradient-to-r from-yellow-500/5 via-yellow-500/2 to-transparent border-l-2 border-yellow-500/30';
      case 'info':
      case 'system':
        return 'bg-gradient-to-r from-blue-500/5 via-blue-500/2 to-transparent border-l-2 border-blue-500/30';
      default:
        return 'bg-gradient-to-r from-[#BC8BBC]/5 via-[#BC8BBC]/2 to-transparent border-l-2 border-[#BC8BBC]/30';
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshData();
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  };

  // Enhanced Notification Item Component
  const NotificationItem = ({ notification, index }) => (
    <div
      className={`group transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
        notification.action_url 
          ? 'cursor-pointer hover:bg-gray-750/30' 
          : 'cursor-default'
      } ${getNotificationBackground(notification)} rounded-xl m-2`}
      onClick={(e) => handleNotificationClick(notification, e)}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: 'slideInRight 0.5s ease-out both'
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Indicator */}
          <div className="flex-shrink-0 mt-1">
            {notification.status === 'unread' ? (
              <div className="w-3 h-3 bg-[#BC8BBC] rounded-full animate-ping shadow-lg shadow-[#BC8BBC]/50" />
            ) : (
              <CheckCircle2 size={16} className="text-green-500 animate-bounce" />
            )}
          </div>
          
          {/* Enhanced Icon */}
          {getNotificationIcon(notification)}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className={`font-bold truncate text-lg ${
                notification.status === 'unread' 
                  ? 'text-white' 
                  : 'text-gray-300'
              }`}>
                {notification.title}
              </h3>
              {notification.action_url && (
                <ChevronRight 
                  size={18} 
                  className="text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 flex-shrink-0 mt-1" 
                />
              )}
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 bg-gray-700/50 px-3 py-1 rounded-full backdrop-blur-sm">
                {formatTime(notification.created_at)}
              </span>
              {notification.status === 'unread' && (
                <span className="text-xs text-[#BC8BBC] font-bold bg-[#BC8BBC]/20 px-3 py-1 rounded-full backdrop-blur-sm border border-[#BC8BBC]/30 animate-pulse">
                  NEW
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Section Header Component
  const SectionHeader = ({ title, count, icon, color = "text-[#BC8BBC]" }) => (
    <div className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-xl border-b border-gray-600/30 px-6 py-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-700/50 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
        <span className={`font-bold text-lg ${color}`}>
          {title}
        </span>
        {count > 0 && (
          <span className="bg-gray-600 text-white text-sm px-3 py-1 rounded-full font-bold backdrop-blur-sm border border-gray-500/30 animate-pulse">
            {count}
          </span>
        )}
      </div>
    </div>
  );

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes backdrop-ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes modalExit {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
        }
      `}</style>

      <div 
        ref={backdropRef}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 transition-all duration-300 ${
          isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
        }`}
        onClick={handleBackdropClick}
      >
        <div 
          ref={modalRef}
          className={`bg-gray-900/80 backdrop-blur-xl border border-gray-600/30 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl transform transition-all duration-300 ${
            isClosing 
              ? 'animate-out slide-out-to-bottom-10 scale-95 opacity-0' 
              : 'animate-in slide-in-from-bottom-10 scale-100 opacity-100'
          }`}
          style={{
            animation: isClosing ? 'modalExit 0.3s ease-in-out both' : 'modalEnter 0.4s ease-out both'
          }}
        >
          {/* Enhanced Modal Header */}
          <div className="flex items-center justify-between p-8 border-b border-gray-600/30 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-t-3xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#BC8BBC]/20 rounded-2xl backdrop-blur-sm border border-[#BC8BBC]/30">
                <Bell size={28} className="text-[#BC8BBC] animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Notifications
                </h2>
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#BC8BBC]" />
                  Stay updated with your latest activities
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                data-refresh-btn
                onClick={refreshData}
                disabled={loading}
                className="p-3 text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-700/50 rounded-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-110 backdrop-blur-sm border border-gray-600/30"
                title="Refresh notifications"
              >
                <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
              </button>
              {unreadCount > 0 && (
                <button 
                  data-mark-all-btn
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="px-6 py-3 text-sm text-[#BC8BBC] hover:text-white hover:bg-[#BC8BBC] rounded-2xl border-2 border-[#BC8BBC] transition-all duration-300 disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-3 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-2xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-gray-600/30 hover:border-red-500/50"
                title="Close"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Enhanced Modal Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="p-6 bg-red-500/10 rounded-3xl mb-6 backdrop-blur-sm border border-red-500/30">
                  <AlertCircle size={64} className="text-red-400 animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-white mb-3">Failed to load notifications</p>
                <p className="text-lg mb-8 text-center max-w-md text-gray-300">{error}</p>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-3 px-8 py-4 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 backdrop-blur-sm border-2 border-[#BC8BBC]"
                >
                  <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                  {loading ? "Retrying..." : "Try Again"}
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#BC8BBC] border-t-transparent mb-6 shadow-lg"></div>
                <p className="text-gray-400 font-bold text-lg animate-pulse">Loading your notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="p-8 bg-gray-800/50 rounded-3xl mb-6 backdrop-blur-sm border border-gray-600/30 animate-pulse">
                  <Bell size={80} className="opacity-50 text-[#BC8BBC]" />
                </div>
                <p className="text-2xl font-bold text-white mb-3">No notifications yet</p>
                <p className="text-gray-300 text-center max-w-sm text-lg">
                  You're all caught up! We'll notify you when there's something new.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-600/20">
                {/* Unread Notifications Section */}
                {unreadNotifications.length > 0 && (
                  <div>
                    <SectionHeader
                      title="Unread"
                      count={unreadNotifications.length}
                      icon={<Circle size={20} className="text-[#BC8BBC] fill-[#BC8BBC] animate-pulse" />}
                    />
                    <div className="divide-y divide-gray-600/10">
                      {unreadNotifications.map((notification, index) => (
                        <NotificationItem 
                          key={notification.id} 
                          notification={notification}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Read Notifications Section */}
                {readNotifications.length > 0 && (
                  <div>
                    <SectionHeader
                      title="Read"
                      count={readNotifications.length}
                      icon={<CheckCircle2 size={20} className="text-green-500 animate-bounce" />}
                      color="text-green-500"
                    />
                    <div className="divide-y divide-gray-600/10">
                      {readNotifications.map((notification, index) => (
                        <NotificationItem 
                          key={notification.id} 
                          notification={notification}
                          index={index}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Modal Footer */}
          {notifications.length > 0 && (
            <div className="p-6 border-t border-gray-600/30 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-b-3xl">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">
                  Total: {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-6">
                  {unreadCount > 0 && (
                    <span className="text-[#BC8BBC] bg-[#BC8BBC]/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-[#BC8BBC]/30 animate-pulse">
                      {unreadCount} unread
                    </span>
                  )}
                  <span className="text-gray-400 bg-gray-700/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-gray-600/30">
                    {readNotifications.length} read
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationModal;