import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "../../../Logo.jsx";
import Navigation from "./Header/Navigation";
import SearchModal from "./Header/SearchModal";
import NotificationModal from "../NotificationModal";
import ProfileDropdown from "./Header/ProfileDropdown";
import NotificationDropdown from "./Header/NotificationDropdown";
import { useSubscription } from "../../../../context/SubscriptionContext";
import { useAuth } from "../../../../context/AuthContext"; // 
import api from "../../../../api/axios";

export default function Header({ user, onLogout, isScrolled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [subscriptionAlertOpen, setSubscriptionAlertOpen] = useState(false);
  const { t } = useTranslation();

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    getTimeRemaining,
    isKidMode
  } = useSubscription();

  const { isKidMode: authKidMode } = useAuth();

  const subscriptionAlertRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  // ✅ Skip notification fetching in kid mode
  const shouldFetchNotifications = user && !isKidMode && !authKidMode;

  const fetchUnreadCount = async () => {
    if (!shouldFetchNotifications) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get('/notifications/unread/count', {
        withCredentials: true
      });
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count || 0);
        setApiError(false);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setApiError(true);
      setUnreadCount(0);
    }
  };

  const fetchNotifications = async () => {
    if (!shouldFetchNotifications) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { limit: 5 },
        withCredentials: true
      });

      if (response.data.success) {
        setNotifications(response.data.data || []);
        setApiError(false);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setApiError(true);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!shouldFetchNotifications) return;

    if (notification.status === 'unread') {
      try {
        const response = await api.put(`/notifications/${notification.id}/read`, {}, {
          withCredentials: true
        });
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

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const markAllAsRead = async () => {
    if (!shouldFetchNotifications) return;

    try {
      const response = await api.put('/notifications/read-all', {}, {
        withCredentials: true
      });
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

  const refreshNotifications = async () => {
    if (!shouldFetchNotifications) return;
    await Promise.all([fetchUnreadCount(), fetchNotifications()]);
  };

  const handleNotificationModalClick = () => {
    if (!shouldFetchNotifications) return;
    setShowNotificationModal(true);
  };

  const handleRenewSubscription = () => {
    if (isKidMode || authKidMode) return; // ✅ Don't allow in kid mode
    navigate('/account/settings/#subscription');
    setSubscriptionAlertOpen(false);
  };

  // Handle search click - navigate to /search endpoint
  const handleSearchClick = () => {
    navigate('/search');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subscriptionAlertRef.current && !subscriptionAlertRef.current.contains(event.target)) {
        setSubscriptionAlertOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Initialize notifications only if not in kid mode
    if (shouldFetchNotifications) {
      fetchUnreadCount();

      // Set up interval to check for new notifications
      const interval = setInterval(fetchUnreadCount, 30000); // ✅ Reduced frequency

      return () => {
        clearInterval(interval);
      };
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [shouldFetchNotifications]);

  // Get time remaining for responsive display - skip in kid mode
  const { days, hours, minutes, isExpired, isScheduled, formatted } = getTimeRemaining();
  const isCritical = days === 0 && hours < 24;
  const isSubscriptionExpiringSoon = days <= 3 && !isExpired && !isScheduled;

  // ✅ Don't show subscription alerts in kid mode
  const showSubscriptionAlert = isSubscriptionExpiringSoon && !isKidMode && !authKidMode;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          {/* Left Section - Enhanced with proper spacing */}
          <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
            {/* Logo - Fixed size */}
            <div
              className="cursor-pointer transition-transform hover:scale-105 flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <Logo className="h-8 w-auto text-[#BC8BBC]" />
            </div>

            {/* Navigation Component */}
            <div className="flex-1 min-w-0">
              <Navigation />
            </div>

            {/* Enhanced Subscription Alert - Emergency Icon for Mobile */}
            {showSubscriptionAlert && (
              <div className="relative flex-shrink-0" ref={subscriptionAlertRef}>
                <button
                  onClick={() => setSubscriptionAlertOpen(!subscriptionAlertOpen)}
                  className={`flex items-center justify-center transition-all duration-200 rounded-lg border whitespace-nowrap flex-shrink-0 ${
                    isScrolled
                      ? "text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-200"
                      : "text-yellow-200 border-yellow-400/50 hover:bg-yellow-500/20 hover:text-yellow-100"
                  } ${isCritical ? 'animate-pulse' : ''} ${
                    // Responsive sizing
                    'px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm'
                  }`}
                >
                  {/* Emergency icon for mobile, text for larger screens */}
                  <AlertTriangle size={16} className="sm:hidden flex-shrink-0" />
                  <span className="hidden sm:inline">⏰ {formatted}</span>
                </button>

                {/* Enhanced Responsive Dropdown - Centered on Mobile */}
                {subscriptionAlertOpen && (
                  <div className="fixed inset-x-4 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:inset-x-auto w-auto max-w-[calc(100vw-2rem)] sm:max-w-sm sm:w-80 bg-gray-800/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl shadow-2xl z-50 mx-auto">
                    <div className="p-4 sm:p-5">
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <AlertTriangle size={20} className="text-yellow-400" />
                          <div className="text-yellow-400 font-semibold text-sm sm:text-base">
                            {isCritical 
                              ? "Subscription Expiring!" 
                              : "Subscription Expiring Soon"
                            }
                          </div>
                        </div>
                        <div className="text-yellow-300 text-lg sm:text-xl font-bold my-2 sm:my-3">
                          {formatted}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                          {isCritical
                            ? "Your subscription expires today! Renew now to continue watching."
                            : "Your subscription will expire soon. Renew to avoid interruption."
                          }
                        </div>
                      </div>
                      <button
                        onClick={handleRenewSubscription}
                        className="w-full bg-[#BC8BBC] hover:bg-[#a56ba5] text-white py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105"
                      >
                        Renew Subscription
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section - Fixed spacing and non-shrinking */}
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0 ml-2">
            {/* Search Button - Fixed size */}
            <button
              onClick={handleSearchClick}
              className={`p-2 transition-all duration-200 hover:bg-gray-800/50 rounded-lg transform hover:scale-110 flex-shrink-0 ${
                isScrolled ? "text-gray-300 hover:text-white" : "text-white hover:text-gray-300"
              }`}
              aria-label="Search"
            >
              <Search size={20} className="flex-shrink-0" />
            </button>

            {/* Notification Dropdown - Only show if not in kid mode */}
            {shouldFetchNotifications && (
              <div className="flex-shrink-0">
                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  apiError={apiError}
                  loading={loading}
                  onRefresh={refreshNotifications}
                  onNotificationClick={handleNotificationClick}
                  onMarkAllAsRead={markAllAsRead}
                  onViewAll={handleNotificationModalClick}
                  isScrolled={isScrolled}
                  responsive={true}
                  align="right"
                />
              </div>
            )}

            {/* Profile Dropdown - Fixed */}
            <div className="flex-shrink-0">
              <ProfileDropdown user={user} onLogout={onLogout} isScrolled={isScrolled} />
            </div>
          </div>
        </div>
      </header>

      {/* Notification Modal - Only show if not in kid mode */}
      {shouldFetchNotifications && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          userId={user?.id}
        />
      )}
    </>
  );
}