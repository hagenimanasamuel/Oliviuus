import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, RefreshCw, AlertCircle, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import api from "../../../api/axios"; 
import { useNavigate } from "react-router-dom";

const NotificationModal = ({ isOpen, onClose, userId }) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Brand color
  const brandColor = '#BC8BBC';

  // Separate notifications into unread and read sections
  const unreadNotifications = notifications
    .filter(notif => notif.status === 'unread')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Newest unread first

  const readNotifications = notifications
    .filter(notif => notif.status === 'read')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Newest read first

  // Fetch notifications count
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

  // Fetch all notifications
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

  // Mark notification as read and handle navigation
  const handleNotificationClick = async (notification) => {
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
      navigate(notification.action_url);
      onClose(); // Close modal after navigation
    }
    // If no action_url, do nothing (notification is already marked as read)
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setError(null);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  };

  // Close modal on ESC key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
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

  const getNotificationIcon = (iconName) => {
    const iconMap = {
      bell: '🔔',
      warning: '⚠️',
      error: '❌',
      success: '✅',
      info: 'ℹ️',
      subscription: '💳',
      payment: '💰',
      device: '📱',
      security: '🛡️',
      video: '🎬',
      download: '📥',
      support: '💬',
      system: '⚙️',
      user: '👤',
      default: '🔔'
    };
    return iconMap[iconName] || iconMap.default;
  };

  // Notification Item Component
  const NotificationItem = ({ notification }) => (
    <div
      className={`group transition-all duration-200 ${
        notification.action_url 
          ? 'cursor-pointer hover:bg-gray-750/50' 
          : 'cursor-default'
      } ${
        notification.status === 'unread' 
          ? 'bg-gradient-to-r from-[#BC8BBC]/5 to-transparent border-l-2 border-[#BC8BBC]' 
          : 'bg-transparent'
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Indicator */}
          <div className="flex-shrink-0 mt-1">
            {notification.status === 'unread' ? (
              <div className="w-2 h-2 bg-[#BC8BBC] rounded-full animate-pulse" />
            ) : (
              <CheckCircle2 size={14} className="text-green-500" />
            )}
          </div>
          
          {/* Icon */}
          <div className="flex-shrink-0">
            <span className="text-2xl">
              {getNotificationIcon(notification.icon)}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className={`font-semibold truncate ${
                notification.status === 'unread' 
                  ? 'text-white font-bold' 
                  : 'text-gray-300'
              }`}>
                {notification.title}
              </h3>
              {notification.action_url && (
                <ChevronRight 
                  size={16} 
                  className="text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" 
                />
              )}
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatTime(notification.created_at)}
              </span>
              {notification.status === 'unread' && (
                <span className="text-xs text-[#BC8BBC] font-medium bg-[#BC8BBC]/10 px-2 py-1 rounded-full">
                  New
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Section Header Component
  const SectionHeader = ({ title, count, icon, color = "text-[#BC8BBC]" }) => (
    <div className="sticky top-0 z-10 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className={`font-semibold text-sm ${color}`}>
          {title}
        </span>
        {count > 0 && (
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full font-medium">
            {count}
          </span>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-gray-900 border border-gray-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl transform animate-in slide-in-from-bottom-10 duration-300"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-800/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BC8BBC]/10 rounded-xl">
              <Bell size={24} className="text-[#BC8BBC]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <p className="text-sm text-gray-400 mt-1">
                Stay updated with your latest activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={refreshData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-700/50 rounded-xl transition-all duration-200 disabled:opacity-50"
              title="Refresh notifications"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                disabled={loading}
                className="px-4 py-2 text-sm text-[#BC8BBC] hover:text-white hover:bg-[#BC8BBC] rounded-xl border border-[#BC8BBC] transition-all duration-200 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="p-4 bg-red-500/10 rounded-2xl mb-4">
                <AlertCircle size={48} className="text-red-400" />
              </div>
              <p className="text-lg font-semibold text-white mb-2">Failed to load notifications</p>
              <p className="text-sm mb-6 text-center max-w-md text-gray-300">{error}</p>
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Retrying..." : "Try Again"}
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mb-4"></div>
              <p className="text-gray-400 font-medium">Loading your notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="p-6 bg-gray-800/50 rounded-2xl mb-4">
                <Bell size={64} className="opacity-50 text-[#BC8BBC]" />
              </div>
              <p className="text-xl font-bold text-white mb-2">No notifications yet</p>
              <p className="text-gray-300 text-center max-w-sm">
                You're all caught up! We'll notify you when there's something new.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/30">
              {/* Unread Notifications Section */}
              {unreadNotifications.length > 0 && (
                <div>
                  <SectionHeader
                    title="Unread"
                    count={unreadNotifications.length}
                    icon={<Circle size={16} className="text-[#BC8BBC] fill-[#BC8BBC]" />}
                  />
                  <div className="divide-y divide-gray-700/20">
                    {unreadNotifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
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
                    icon={<CheckCircle2 size={16} className="text-green-500" />}
                    color="text-green-500"
                  />
                  <div className="divide-y divide-gray-700/20">
                    {readNotifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-700/50 bg-gray-800/50 rounded-b-2xl">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="font-medium">
                Total: {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <span className="text-[#BC8BBC] font-semibold">
                    {unreadCount} unread
                  </span>
                )}
                <span className="text-gray-500">
                  {readNotifications.length} read
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;