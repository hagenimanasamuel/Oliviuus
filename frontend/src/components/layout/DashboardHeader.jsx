import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, ChevronDown, LogOut, Settings, Menu, ExternalLink, CheckCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";
import NotificationModal from "./dashboard/NotificationModal";
import api from "../../api/axios";

export default function DashboardHeader({ user, onLogout, onMenuToggle }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const [avatarUrl, setAvatarUrl] = useState(user?.profile_avatar_url || "");
  const [tempAvatar, setTempAvatar] = useState(user?.profile_avatar_url || "");

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const soundRef = useRef(null);
  const lastPlayedRef = useRef(0);
  const previousUnreadCountRef = useRef(0);

  // Brand color
  const brandColor = '#BC8BBC';

  // Initialize sound only when needed - prevent preloading that triggers download managers
  const initializeSound = useCallback(() => {
    if (soundRef.current) return; // Already initialized
    
    try {
      // Use absolute path from public directory
      const soundPath = '/sound/notification_sound.wav';
      soundRef.current = new Audio(soundPath);
      
      // Don't preload - this is what triggers download managers
      soundRef.current.preload = 'none';
      
      // Set minimal event listeners
      soundRef.current.addEventListener('error', (e) => {
        console.error('Error with notification sound:', e);
      });
      
    } catch (error) {
      console.error('Failed to initialize notification sound:', error);
    }
  }, []);

  // Sort notifications: unread first, then by creation date (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    // First sort by status (unread first)
    if (a.status === 'unread' && b.status !== 'unread') return -1;
    if (a.status !== 'unread' && b.status === 'unread') return 1;
    
    // Then sort by creation date (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Smart sound notification player
  const playNotificationSound = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPlay = now - lastPlayedRef.current;
    
    // Prevent multiple sounds within 2 seconds (cooldown period)
    if (timeSinceLastPlay < 2000) {
      console.log('Sound cooldown active, skipping play');
      return;
    }

    // Prevent sound spam - only play if user is not actively interacting with notifications
    if (notifOpen || showNotificationModal) {
      console.log('User is viewing notifications, skipping sound');
      return;
    }

    try {
      // Initialize sound only when actually needed (first play)
      if (!soundRef.current) {
        initializeSound();
      }

      if (soundRef.current) {
        // Reset audio to start and play
        soundRef.current.currentTime = 0;
        soundRef.current.play().catch(error => {
          console.warn('Audio play failed:', error);
          // Don't throw error, just log it
        });
        lastPlayedRef.current = now;
        console.log('Notification sound played successfully');
      }
    } catch (error) {
      console.warn('Sound play error (non-critical):', error);
      // Don't break the app if sound fails
    }
  }, [notifOpen, showNotificationModal, initializeSound]);

  // Fetch notifications count using API instance
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      
      if (response.data.success) {
        const newUnreadCount = response.data.data.unread_count || 0;
        const previousUnreadCount = previousUnreadCountRef.current;
        
        // Update the count
        setUnreadCount(newUnreadCount);
        setApiError(false);

        // Play sound only if:
        // 1. Count increased (new notifications)
        // 2. User is not currently viewing notifications
        // 3. This is not the initial load (previous count was not 0)
        if (newUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
          console.log(`New notification detected: ${previousUnreadCount} -> ${newUnreadCount}`);
          playNotificationSound();
        }

        // Update the previous count reference
        previousUnreadCountRef.current = newUnreadCount;
      } else {
        throw new Error(response.data.message || 'Failed to fetch unread count');
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setApiError(true);
      setUnreadCount(0);
    }
  };

  // Fetch notifications for dropdown using API instance
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { limit: 5 }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setApiError(false);
        setLastUpdate(Date.now());
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setApiError(true);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Real-time check for new notifications
  const checkForNewNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      if (response.data.success) {
        const currentUnreadCount = response.data.data.unread_count || 0;
        const previousUnreadCount = previousUnreadCountRef.current;
        
        if (currentUnreadCount !== previousUnreadCount) {
          setUnreadCount(currentUnreadCount);
          
          // Play sound only if count increased and conditions are met
          if (currentUnreadCount > previousUnreadCount && previousUnreadCount > 0) {
            console.log(`Real-time update: ${previousUnreadCount} -> ${currentUnreadCount}`);
            playNotificationSound();
          }
          
          previousUnreadCountRef.current = currentUnreadCount;
          
          // If dropdown is open, refresh the notifications list
          if (notifOpen) {
            fetchNotifications();
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  }, [notifOpen, playNotificationSound]);

  // Mark notification as read using API instance
  const markAsRead = async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read', read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        previousUnreadCountRef.current = Math.max(0, previousUnreadCountRef.current - 1);
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    return false;
  };

  // Auto-mark all visible notifications as read when dropdown opens
  const markVisibleAsRead = async () => {
    const unreadNotifications = notifications.filter(notif => notif.status === 'unread');
    if (unreadNotifications.length === 0) return;

    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        previousUnreadCountRef.current = 0;
      }
    } catch (error) {
      console.error('Error marking visible as read:', error);
    }
  };

  // Mark all as read using API instance
  const markAllAsRead = async () => {
    try {
      const response = await api.put('/notifications/read-all');
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
        previousUnreadCountRef.current = 0;
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Auto-mark notification as read when opened/clicked and handle navigation
  const handleNotificationClick = async (notification) => {
    // Mark as read immediately if unread
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }

    // Auto-hide dropdown after a short delay for smooth UX
    setTimeout(() => {
      setNotifOpen(false);
    }, 150);

    // If notification has action_url, navigate to it
    if (notification.action_url) {
      setTimeout(() => {
        navigate(notification.action_url);
      }, 200);
    }
  };

  // Refresh all notification data
  const refreshNotifications = async () => {
    await Promise.all([fetchUnreadCount(), fetchNotifications()]);
  };

  // Handle bell icon click
  const handleBellClick = async () => {
    const wasOpen = notifOpen;
    setNotifOpen(!wasOpen);
    
    if (!wasOpen) {
      // First time opening - fetch notifications and auto-mark as read
      await fetchNotifications();
      // Auto-mark all visible as read when dropdown opens
      await markVisibleAsRead();
    }
  };

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize and set up real-time checks
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount().then(() => {
      // Set the initial previous count after first load
      previousUnreadCountRef.current = unreadCount;
    });
    
    // Set up interval to check for new notifications (every 3 seconds)
    const interval = setInterval(checkForNewNotifications, 3000);
    return () => clearInterval(interval);
  }, [checkForNewNotifications]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen]);

  const isMobileView = windowWidth < 768;

  useEffect(() => {
    setTempAvatar(user?.profile_avatar_url || "");
    setAvatarUrl(user?.profile_avatar_url || "");
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileImage =
    tempAvatar ||
    avatarUrl ||
    (user?.id
      ? `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}`
      : "https://placehold.co/100x100/333333/FFFFFF?text=User");

  const handleImageError = (e) => {
    e.target.src = user?.id
      ? `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}`
      : "https://placehold.co/100x100/333333/FFFFFF?text=User";
  };

  const handleNotificationModalClick = () => {
    setShowNotificationModal(true);
    setNotifOpen(false);
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

  const getReadStatusIcon = (status) => {
    return status === 'read' ? (
      <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
    ) : (
      <Circle size={14} className="text-[#BC8BBC] flex-shrink-0" />
    );
  };

  // Professional notification badge display
  const renderNotificationBadge = () => {
    if (unreadCount === 0 || apiError) return null;

    // Show number up to 9, then 9+
    const displayCount = unreadCount > 9 ? '9+' : unreadCount;
    
    return (
      <span className="absolute -top-0.5 -right-0.5 bg-[#BC8BBC] text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-white/20">
        {displayCount}
      </span>
    );
  };

  return (
    <>
      <header className="w-full bg-gray-900 text-white shadow-md px-4 sm:px-6 py-3 flex justify-between items-center fixed top-0 left-0 z-50">
        {/* Left side: Menu button + Logo */}
        <div className="flex items-center gap-4">
          {/* Menu button - only shown on mobile */}
          {isMobileView && (
            <button
              onClick={onMenuToggle}
              className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          )}
          
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Logo className="h-8 w-auto" />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              className="relative cursor-pointer transition-colors hover:text-[#BC8BBC] disabled:opacity-50 group"
              onClick={handleBellClick}
              disabled={loading}
            >
              <Bell size={22} className={`group-hover:text-[#BC8BBC] transition-colors ${loading ? "animate-pulse" : ""}`} />
              {renderNotificationBadge()}
              {apiError && (
                <span className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full w-1.5 h-1.5"></span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
                        Updated {formatTime(new Date(lastUpdate))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={refreshNotifications}
                        disabled={loading}
                        className="text-xs text-gray-400 hover:text-[#BC8BBC] transition-colors disabled:opacity-50 p-1 rounded-lg hover:bg-gray-700"
                        title="Refresh"
                      >
                        ↻
                      </button>
                      {unreadCount > 0 && !apiError && (
                        <button 
                          onClick={markAllAsRead}
                          disabled={loading}
                          className="text-xs text-[#BC8BBC] hover:text-[#9b69b2] transition-colors disabled:opacity-50 px-2 py-1 rounded-lg border border-[#BC8BBC] hover:border-[#9b69b2] font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#BC8BBC] mx-auto"></div>
                    <p className="text-xs mt-2">Loading notifications...</p>
                  </div>
                ) : apiError ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <p className="text-sm">Unable to load notifications</p>
                    <p className="text-xs mt-1">API connection issue</p>
                    <button 
                      onClick={refreshNotifications}
                      className="text-xs text-[#BC8BBC] hover:text-[#9b69b2] mt-2 px-3 py-1 rounded-lg border border-[#BC8BBC] hover:border-[#9b69b2] transition-colors font-medium"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-700/50">
                      {sortedNotifications.length === 0 ? (
                        <li className="px-4 py-8 text-center text-gray-400">
                          <Bell size={32} className="mx-auto mb-2 opacity-50 text-[#BC8BBC]" />
                          <p className="text-sm font-medium">No notifications</p>
                          <p className="text-xs mt-1">You're all caught up!</p>
                        </li>
                      ) : (
                        sortedNotifications.map((notification) => (
                          <li 
                            key={notification.id}
                            className={`group transition-all duration-200 ${
                              notification.status === 'unread' 
                                ? 'bg-gradient-to-r from-[#BC8BBC]/5 to-transparent border-l-2 border-[#BC8BBC]' 
                                : 'bg-transparent'
                            } ${
                              notification.action_url 
                                ? 'cursor-pointer hover:bg-gray-700/50' 
                                : 'cursor-default'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getReadStatusIcon(notification.status)}
                                </div>
                                <span className="text-xl flex-shrink-0">
                                  {getNotificationIcon(notification.icon)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className={`text-sm font-semibold truncate ${
                                      notification.status === 'unread' ? 'text-white font-bold' : 'text-gray-300'
                                    }`}>
                                      {notification.title}
                                    </p>
                                    {notification.action_url && (
                                      <ExternalLink size={12} className="text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                      {formatTime(notification.created_at)}
                                    </span>
                                    <span className={`text-xs font-medium ${
                                      notification.status === 'unread' ? 'text-[#BC8BBC]' : 'text-green-400'
                                    }`}>
                                      {notification.status === 'read' ? 'Read' : 'New'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="px-4 py-3 border-t border-gray-700 bg-gray-900/95">
                      <button 
                        onClick={handleNotificationModalClick}
                        className="w-full text-center text-sm text-[#BC8BBC] hover:text-[#9b69b2] font-semibold py-2 transition-colors"
                      >
                        View all notifications
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer transition-colors hover:text-[#BC8BBC] group"
            >
              <img
                src={profileImage}
                alt="profile avatar"
                className="w-8 h-8 rounded-full border border-gray-700 object-cover group-hover:border-[#BC8BBC] transition-colors"
                onError={handleImageError}
              />
              <ChevronDown size={18} className="group-hover:text-[#BC8BBC] transition-colors" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-sm">
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/95">
                  <p className="text-sm text-gray-400">Signed in as</p>
                  <p className="text-white truncate font-medium">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate("/account/settings");
                    setProfileOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-300 transition-colors hover:text-white hover:bg-gray-700/50"
                >
                  <Settings size={16} className="mr-3 text-[#BC8BBC]" /> 
                  Settings
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setProfileOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-400 transition-colors hover:text-red-300 hover:bg-gray-700/50 border-t border-gray-700"
                >
                  <LogOut size={16} className="mr-3" /> 
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Notification Modal */}
      <NotificationModal 
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userId={user?.id}
      />

      {/* Push body content down by header height + padding */}
      <div className="pt-5" />
    </>
  );
}