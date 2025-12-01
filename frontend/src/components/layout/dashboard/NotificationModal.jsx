import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, RefreshCw, AlertCircle, ChevronRight, CheckCircle2, Circle, Sparkles, Zap, Gift, TrendingUp } from "lucide-react";
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
      setError(t('notification.modal.errors.failedToLoadCount'));
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
        setError(t('notification.modal.errors.failedToLoad'));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.response?.data?.message || t('notification.modal.errors.failedToLoad'));
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

  // Enhanced responsive modal sizing
  const getModalSize = () => {
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth < 640) {
      return "w-[95vw] h-[90vh] mx-2";
    } else if (viewportWidth < 768) {
      return "w-[90vw] h-[85vh]";
    } else if (viewportWidth < 1024) {
      return "w-[85vw] h-[80vh] max-w-4xl";
    } else {
      return "w-full max-w-4xl max-h-[85vh]";
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

    if (diffMins < 1) return t('notification.time.justNow');
    if (diffMins < 60) return t('notification.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notification.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notification.time.daysAgo', { count: diffDays });
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  };

  // Enhanced Notification Item Component - Responsive
  const NotificationItem = ({ notification, index }) => (
    <div
      className={`group transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
        notification.action_url 
          ? 'cursor-pointer hover:bg-gray-750/30' 
          : 'cursor-default'
      } ${getNotificationBackground(notification)} rounded-xl m-1 sm:m-2`}
      onClick={(e) => handleNotificationClick(notification, e)}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: 'slideInRight 0.5s ease-out both'
      }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Status Indicator */}
          <div className="flex-shrink-0 mt-0.5 sm:mt-1">
            {notification.status === 'unread' ? (
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[#BC8BBC] rounded-full animate-ping shadow-lg shadow-[#BC8BBC]/50" />
            ) : (
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4 text-green-500 animate-bounce" />
            )}
          </div>
          
          {/* Enhanced Icon */}
          {getNotificationIcon(notification)}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1 sm:mb-2">
              <h3 className={`font-bold truncate text-sm sm:text-base lg:text-lg ${
                notification.status === 'unread' 
                  ? 'text-white' 
                  : 'text-gray-300'
              }`}>
                {notification.title}
              </h3>
              {notification.action_url && (
                <ChevronRight 
                  size={16} 
                  className="sm:w-4 sm:h-4 text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 flex-shrink-0 mt-0.5 sm:mt-1" 
                />
              )}
            </div>
            
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm truncate max-w-[100px] sm:max-w-none">
                {formatTime(notification.created_at)}
              </span>
              {notification.status === 'unread' && (
                <span className="text-xs text-[#BC8BBC] font-bold bg-[#BC8BBC]/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm border border-[#BC8BBC]/30 animate-pulse whitespace-nowrap">
                  {t('notification.status.new')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Section Header Component - Responsive
  const SectionHeader = ({ title, count, icon, color = "text-[#BC8BBC]" }) => (
    <div className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-xl border-b border-gray-600/30 px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 bg-gray-700/50 rounded-lg sm:rounded-xl backdrop-blur-sm flex-shrink-0">
          {icon}
        </div>
        <span className={`font-bold text-base sm:text-lg ${color} truncate`}>
          {title}
        </span>
        {count > 0 && (
          <span className="bg-gray-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-bold backdrop-blur-sm border border-gray-500/30 animate-pulse flex-shrink-0">
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
        @keyframes backdropBlurIn {
          from {
            backdrop-filter: blur(0px);
            background: rgba(0, 0, 0, 0);
          }
          to {
            backdrop-filter: blur(12px);
            background: rgba(0, 0, 0, 0.6);
          }
        }
        @keyframes backdropBlurOut {
          from {
            backdrop-filter: blur(12px);
            background: rgba(0, 0, 0, 0.6);
          }
          to {
            backdrop-filter: blur(0px);
            background: rgba(0, 0, 0, 0);
          }
        }
      `}</style>

      <div 
        ref={backdropRef}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[100] p-2 sm:p-4 transition-all duration-300 ${
          isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
        }`}
        style={{
          animation: isClosing ? 'backdropBlurOut 0.3s ease-in-out both' : 'backdropBlurIn 0.3s ease-out both'
        }}
        onClick={handleBackdropClick}
      >
        <div 
          ref={modalRef}
          className={`bg-gray-900/80 backdrop-blur-xl border border-gray-600/30 rounded-3xl ${getModalSize()} flex flex-col shadow-2xl transform transition-all duration-300 ${
            isClosing 
              ? 'animate-out slide-out-to-bottom-10 scale-95 opacity-0' 
              : 'animate-in slide-in-from-bottom-10 scale-100 opacity-100'
          }`}
          style={{
            animation: isClosing ? 'modalExit 0.3s ease-in-out both' : 'modalEnter 0.4s ease-out both'
          }}
        >
          {/* Enhanced Modal Header - Responsive */}
          <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-600/30 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-t-3xl flex-shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 bg-[#BC8BBC]/20 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-[#BC8BBC]/30 flex-shrink-0">
                <Bell size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#BC8BBC] animate-pulse" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent truncate">
                  {t('notification.modal.title')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 truncate">
                  <Sparkles size={12} className="sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-[#BC8BBC] flex-shrink-0" />
                  <span className="truncate">{t('notification.modal.subtitle')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button 
                data-refresh-btn
                onClick={refreshData}
                disabled={loading}
                className="p-2 sm:p-3 text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-700/50 rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-110 backdrop-blur-sm border border-gray-600/30 flex-shrink-0"
                title={t('notification.modal.actions.refresh')}
              >
                <RefreshCw size={18} className={`sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
              {unreadCount > 0 && (
                <button 
                  data-mark-all-btn
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#BC8BBC] hover:text-white hover:bg-[#BC8BBC] rounded-xl sm:rounded-2xl border border-[#BC8BBC] transition-all duration-300 disabled:opacity-50 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 backdrop-blur-sm whitespace-nowrap flex-shrink-0"
                >
                  {t('notification.modal.actions.markAllRead')}
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 sm:p-3 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-gray-600/30 hover:border-red-500/50 flex-shrink-0"
                title={t('notification.modal.actions.close')}
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Enhanced Modal Body - Responsive */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4">
            {error ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-gray-400">
                <div className="p-4 sm:p-6 bg-red-500/10 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 backdrop-blur-sm border border-red-500/30">
                  <AlertCircle size={40} className="sm:w-16 sm:h-16 text-red-400 animate-pulse" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">{t('notification.modal.errors.failedToLoadTitle')}</p>
                <p className="text-sm sm:text-lg mb-6 sm:mb-8 text-center max-w-md text-gray-300 px-4">{error}</p>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 backdrop-blur-sm border border-[#BC8BBC] text-sm sm:text-base"
                >
                  <RefreshCw size={16} className={`sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
                  {loading ? t('notification.modal.actions.retrying') : t('notification.modal.actions.tryAgain')}
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-[#BC8BBC] border-t-transparent mb-4 sm:mb-6 shadow-lg"></div>
                <p className="text-gray-400 font-bold text-base sm:text-lg animate-pulse text-center">{t('notification.modal.loading')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-gray-400">
                <div className="p-6 sm:p-8 bg-gray-800/50 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 backdrop-blur-sm border border-gray-600/30 animate-pulse">
                  <Bell size={50} className="sm:w-20 sm:h-20 opacity-50 text-[#BC8BBC]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">{t('notification.modal.noNotifications')}</p>
                <p className="text-gray-300 text-center max-w-sm text-sm sm:text-lg px-4">
                  {t('notification.modal.allCaughtUp')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-600/20">
                {/* Unread Notifications Section */}
                {unreadNotifications.length > 0 && (
                  <div>
                    <SectionHeader
                      title={t('notification.modal.sections.unread')}
                      count={unreadNotifications.length}
                      icon={<Circle size={16} className="sm:w-5 sm:h-5 text-[#BC8BBC] fill-[#BC8BBC] animate-pulse" />}
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
                      title={t('notification.modal.sections.read')}
                      count={readNotifications.length}
                      icon={<CheckCircle2 size={16} className="sm:w-5 sm:h-5 text-green-500 animate-bounce" />}
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

          {/* Enhanced Modal Footer - Responsive */}
          {notifications.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-gray-600/30 bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-b-3xl flex-shrink-0">
              <div className="flex items-center justify-between text-sm sm:text-lg font-bold flex-wrap gap-2">
                <span className="text-white whitespace-nowrap">
                  {t('notification.modal.footer.total', { count: notifications.length })}
                </span>
                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                  {unreadCount > 0 && (
                    <span className="text-[#BC8BBC] bg-[#BC8BBC]/20 px-3 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-sm border border-[#BC8BBC]/30 animate-pulse text-xs sm:text-sm whitespace-nowrap">
                      {t('notification.modal.footer.unread', { count: unreadCount })}
                    </span>
                  )}
                  <span className="text-gray-400 bg-gray-700/50 px-3 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl backdrop-blur-sm border border-gray-600/30 text-xs sm:text-sm whitespace-nowrap">
                    {t('notification.modal.footer.read', { count: readNotifications.length })}
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