import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Bell, X, RefreshCw, AlertCircle, ChevronRight, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../../api/axios"; 
import { useNavigate } from "react-router-dom";

const NotificationModal = ({ isOpen, onClose, userId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [hasAutoMarkedAsRead, setHasAutoMarkedAsRead] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  // Memoized calculations to prevent unnecessary re-renders
  const { unreadNotifications, readNotifications } = useMemo(() => {
    const unread = notifications
      .filter(notif => notif.status === 'unread')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const read = notifications
      .filter(notif => notif.status === 'read')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return { unreadNotifications: unread, readNotifications: read };
  }, [notifications]);

  // Throttle auto-mark as read to prevent rapid API calls
  const instantMarkAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some(notif => notif.status === 'unread');
    
    if (hasUnread && !isMarkingAsRead && !hasAutoMarkedAsRead) {
      setIsMarkingAsRead(true);
      try {
        await api.put('/notifications/read-all');
        
        setHasAutoMarkedAsRead(true);
        
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            status: 'read', 
            read_at: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
      } catch (error) {
        console.error('Error instantly marking all as read:', error);
      } finally {
        setIsMarkingAsRead(false);
      }
    }
  }, [notifications, isMarkingAsRead, hasAutoMarkedAsRead]);

  // Optimized fetch functions with debouncing
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setError(t('notification.modal.errors.failedToLoadCount'));
    }
  }, [t]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setError(null);
        setHasAutoMarkedAsRead(false);
      } else {
        setError(t('notification.modal.errors.failedToLoad'));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.response?.data?.message || t('notification.modal.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Optimized notification click handler
  const handleNotificationClick = useCallback(async (notification, event) => {
    // Use CSS for ripple instead of DOM manipulation
    if (event.currentTarget) {
      event.currentTarget.classList.add('ripple-active');
      setTimeout(() => {
        if (event.currentTarget) {
          event.currentTarget.classList.remove('ripple-active');
        }
      }, 600);
    }

    // Mark as read immediately if unread
    if (notification.status === 'unread' && !hasAutoMarkedAsRead) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notification.id 
              ? { ...notif, status: 'read', read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle navigation
    if (notification.action_url) {
      setTimeout(() => {
        navigate(notification.action_url);
        handleClose();
      }, 200);
    }
  }, [hasAutoMarkedAsRead, navigate]);

  // Optimized mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            status: 'read', 
            read_at: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
        setHasAutoMarkedAsRead(true);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Optimized refresh function
  const refreshData = useCallback(async () => {
    setError(null);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  // Optimized key handler
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen && !isClosing) {
      handleClose();
    }
  }, [isOpen, isClosing, handleClose]);

  // Optimized backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (backdropRef.current === e.target && !isClosing) {
      handleClose();
    }
  }, [isClosing, handleClose]);

  // Memoized notification icon getter
  const getNotificationIcon = useCallback((notification) => {
    const iconMap = {
      bell: <Bell size={20} className="text-blue-400" />,
      warning: <AlertCircle size={20} className="text-yellow-400" />,
      error: <X size={20} className="text-red-400" />,
      success: <CheckCircle2 size={20} className="text-green-400" />,
      info: <Sparkles size={20} className="text-purple-400" />,
      subscription: <Bell size={20} className="text-pink-400" />,
      payment: <CheckCircle2 size={20} className="text-green-400" />,
      device: <Circle size={20} className="text-blue-400" />,
      security: <CheckCircle2 size={20} className="text-green-400" />,
      video: <Sparkles size={20} className="text-yellow-400" />,
      download: <CheckCircle2 size={20} className="text-blue-400" />,
      support: <Bell size={20} className="text-red-400" />,
      system: <AlertCircle size={20} className="text-gray-400" />,
      user: <Circle size={20} className="text-[#BC8BBC]" />,
      default: <Bell size={20} className="text-[#BC8BBC]" />
    };

    return (
      <div className="p-2 bg-gray-700/50 rounded-xl border border-gray-600/30">
        {iconMap[notification.icon] || iconMap.default}
      </div>
    );
  }, []);

  // Memoized notification background getter
  const getNotificationBackground = useCallback((notification) => {
    if (notification.status === 'unread' && !hasAutoMarkedAsRead && !isMarkingAsRead) {
      return 'bg-gradient-to-r from-[#BC8BBC]/10 via-[#BC8BBC]/5 to-transparent border-l-2 border-[#BC8BBC]';
    }
    
    return 'bg-transparent';
  }, [hasAutoMarkedAsRead, isMarkingAsRead]);

  // Responsive modal size
  const getModalSize = useCallback(() => {
    if (typeof window === 'undefined') return "w-full max-w-4xl max-h-[85vh]";
    
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth < 640) return "w-[95vw] h-[90vh]";
    if (viewportWidth < 768) return "w-[90vw] h-[85vh]";
    if (viewportWidth < 1024) return "w-[85vw] h-[80vh] max-w-4xl";
    return "w-full max-w-4xl max-h-[85vh]";
  }, []);

  // Memoized time formatter
  const formatTime = useCallback((dateString) => {
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
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  }, [t]);

  // Memoized Notification Item Component
  const NotificationItem = useCallback(({ notification, index }) => (
    <button
      className={`w-full text-left transition-all duration-200 hover:bg-gray-800/30 ${getNotificationBackground(notification)} rounded-xl p-3 sm:p-4 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-opacity-50 relative overflow-hidden`}
      onClick={(e) => handleNotificationClick(notification, e)}
      onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification, e)}
      tabIndex={0}
      aria-label={`Notification: ${notification.title}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Status Indicator */}
        <div className="flex-shrink-0 mt-0.5">
          {(notification.status === 'unread' && !hasAutoMarkedAsRead && !isMarkingAsRead) ? (
            <div className="w-2 h-2 bg-[#BC8BBC] rounded-full" />
          ) : (
            <CheckCircle2 size={14} className="text-green-500" />
          )}
        </div>
        
        {/* Icon */}
        {getNotificationIcon(notification)}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold truncate text-sm sm:text-base ${
              (notification.status === 'unread' && !hasAutoMarkedAsRead && !isMarkingAsRead)
                ? 'text-white' 
                : 'text-gray-300'
            }`}>
              {notification.title}
            </h3>
            {notification.action_url && (
              <ChevronRight 
                size={16} 
                className="text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" 
              />
            )}
          </div>
          
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-2 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full truncate max-w-[100px] sm:max-w-none">
              {formatTime(notification.created_at)}
            </span>
            {(notification.status === 'unread' && !hasAutoMarkedAsRead && !isMarkingAsRead) && (
              <span className="text-xs text-[#BC8BBC] font-medium bg-[#BC8BBC]/10 px-2 py-1 rounded-full border border-[#BC8BBC]/30 whitespace-nowrap">
                {t('notification.status.new')}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  ), [getNotificationBackground, hasAutoMarkedAsRead, isMarkingAsRead, getNotificationIcon, formatTime, handleNotificationClick, t]);

  // Memoized Section Header Component
  const SectionHeader = useCallback(({ title, count, icon, color = "text-[#BC8BBC]" }) => {
    const displayCount = hasAutoMarkedAsRead || isMarkingAsRead ? 0 : count;
    
    return (
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            {icon}
          </div>
          <span className={`font-semibold text-sm sm:text-base ${color}`}>
            {title}
          </span>
          {displayCount > 0 && (
            <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-full font-medium">
              {displayCount}
            </span>
          )}
        </div>
      </div>
    );
  }, [hasAutoMarkedAsRead, isMarkingAsRead]);

  // Auto-mark as read when notifications change
  useEffect(() => {
    if (notifications.length > 0 && !loading && !hasAutoMarkedAsRead) {
      instantMarkAllAsRead();
    }
  }, [notifications, loading, hasAutoMarkedAsRead, instantMarkAllAsRead]);

  // Modal open/close effects
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
  }, [isOpen, handleKeyDown, refreshData]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* CSS for animations - more efficient */}
      <style jsx global>{`
        .notification-modal-enter {
          animation: modalEnter 0.3s ease-out;
        }
        .notification-modal-exit {
          animation: modalExit 0.3s ease-in;
        }
        .backdrop-enter {
          animation: backdropBlurIn 0.3s ease-out;
        }
        .backdrop-exit {
          animation: backdropBlurOut 0.3s ease-in;
        }
        .ripple-active::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(188, 139, 188, 0.3) 0%, transparent 70%);
          transform: translate(-50%, -50%) scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        }
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
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
            transform: scale(0.95) translateY(10px);
          }
        }
        @keyframes backdropBlurIn {
          from {
            backdrop-filter: blur(0);
            background: rgba(0, 0, 0, 0);
          }
          to {
            backdrop-filter: blur(8px);
            background: rgba(0, 0, 0, 0.7);
          }
        }
        @keyframes backdropBlurOut {
          from {
            backdrop-filter: blur(8px);
            background: rgba(0, 0, 0, 0.7);
          }
          to {
            backdrop-filter: blur(0);
            background: rgba(0, 0, 0, 0);
          }
        }
        @keyframes ripple {
          to {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4B5563 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 3px;
        }
        @media (max-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
        }
      `}</style>

      <div 
        ref={backdropRef}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${isClosing ? 'backdrop-exit' : 'backdrop-enter'}`}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
      >
        <div 
          ref={modalRef}
          className={`bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl ${getModalSize()} flex flex-col shadow-2xl ${isClosing ? 'notification-modal-exit' : 'notification-modal-enter'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 bg-gray-900 rounded-t-xl sm:rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-[#BC8BBC]/10 rounded-lg sm:rounded-xl">
                <Bell size={20} className="text-[#BC8BBC]" />
              </div>
              <div className="min-w-0">
                <h2 id="notification-modal-title" className="text-lg sm:text-xl font-bold text-white truncate">
                  {t('notification.modal.title')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 flex items-center gap-1 truncate">
                  <Sparkles size={12} className="text-[#BC8BBC]" />
                  <span className="truncate">{t('notification.modal.subtitle')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={refreshData}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title={t('notification.modal.actions.refresh')}
                aria-label="Refresh notifications"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title={t('notification.modal.actions.close')}
                aria-label="Close notification modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {error ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-4 bg-red-500/10 rounded-xl mb-4">
                  <AlertCircle size={32} className="text-red-400" />
                </div>
                <p className="text-lg font-semibold text-white mb-2">{t('notification.modal.errors.failedToLoadTitle')}</p>
                <p className="text-gray-300 mb-6 max-w-sm">{error}</p>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="px-6 py-3 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? t('notification.modal.actions.retrying') : t('notification.modal.actions.tryAgain')}
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#BC8BBC] border-t-transparent mb-4"></div>
                <p className="text-gray-400 font-medium">{t('notification.modal.loading')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="p-4 bg-gray-800/50 rounded-xl mb-4">
                  <Bell size={32} className="text-[#BC8BBC] opacity-60" />
                </div>
                <p className="text-lg font-semibold text-white mb-2">{t('notification.modal.noNotifications')}</p>
                <p className="text-gray-300 max-w-sm">
                  {t('notification.modal.allCaughtUp')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {/* Unread Notifications Section */}
                {unreadNotifications.length > 0 && !hasAutoMarkedAsRead && !isMarkingAsRead && (
                  <div>
                    <SectionHeader
                      title={t('notification.modal.sections.unread')}
                      count={unreadNotifications.length}
                      icon={<Circle size={16} className="text-[#BC8BBC]" />}
                    />
                    <div className="p-2 sm:p-4 space-y-2">
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
                      title={t('notification.modal.sections.read')}
                      count={readNotifications.length}
                      icon={<CheckCircle2 size={16} className="text-green-500" />}
                      color="text-green-500"
                    />
                    <div className="p-2 sm:p-4 space-y-2">
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
            <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-xl sm:rounded-b-2xl flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white font-medium">
                  {t('notification.modal.footer.total', { count: notifications.length })}
                </span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && !hasAutoMarkedAsRead && !isMarkingAsRead && (
                    <span className="text-[#BC8BBC] bg-[#BC8BBC]/10 px-3 py-1 rounded-lg font-medium">
                      {t('notification.modal.footer.unread', { count: unreadCount })}
                    </span>
                  )}
                  <span className="text-gray-400 bg-gray-800/50 px-3 py-1 rounded-lg">
                    {t('notification.modal.footer.read', { count: readNotifications.length + (hasAutoMarkedAsRead ? unreadNotifications.length : 0) })}
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