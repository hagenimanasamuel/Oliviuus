import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
import Logo from "../../../Logo.jsx";
import Navigation from "./Header/Navigation";
import SearchModal from "./Header/SearchModal";
import NotificationModal from "../NotificationModal";
import ProfileDropdown from "./Header/ProfileDropdown";
import NotificationDropdown from "./Header/NotificationDropdown";
import api from "../../../../api/axios";

export default function Header({ user, onLogout, isScrolled }) { // ADD isScrolled prop
  const navigate = useNavigate();
  const location = useLocation();
  // REMOVED local isScrolled state: const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
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
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { limit: 5 }
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

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

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

  const refreshNotifications = async () => {
    await Promise.all([fetchUnreadCount(), fetchNotifications()]);
  };

  const handleNotificationModalClick = () => {
    setShowNotificationModal(true);
  };

  useEffect(() => {
    // REMOVED scroll event listener since it's now handled in layout

    // Initialize notifications
    fetchUnreadCount();

    // Set up interval to check for new notifications
    const interval = setInterval(fetchUnreadCount, 3000);

    return () => {
      // REMOVED: window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Main Header - FLOATING OVER CONTENT */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-xl" 
            : "bg-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div 
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate("/")}
            >
              <Logo className="h-8 w-auto text-[#BC8BBC]" />
            </div>

            {/* Navigation Component */}
            <Navigation />
          </div>

          {/* Right Section - Search, Notifications, Profile */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 transition-all duration-200 hover:bg-gray-800/50 rounded-lg transform hover:scale-110 ${
                isScrolled ? "text-gray-300 hover:text-white" : "text-white hover:text-gray-300"
              }`}
            >
              <Search size={20} />
            </button>

            {/* Notification Dropdown */}
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
            />

            {/* Profile Dropdown */}
            <ProfileDropdown user={user} onLogout={onLogout} isScrolled={isScrolled} />
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Notification Modal */}
      <NotificationModal 
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userId={user?.id}
      />
    </>
  );
}