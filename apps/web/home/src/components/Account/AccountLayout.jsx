// src/components/Account/AccountLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Heart, 
  MessageSquare, 
  Settings, 
  Home,
  ChevronRight,
  LayoutGrid,
  Compass,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIsanzureAuth } from '../../context/IsanzureAuthContext';
import Header from '../LandingPage/Header/Header';
import BottomNav from '../LandingPage/BottomNav/BottomNav';
import api from '../../api/axios';

export default function AccountLayout() {
  const { user } = useAuth();
  const { userType, isLandlord, isAgent } = useIsanzureAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // ========== NOTIFICATION STATES FOR USER ==========
  const [notifications, setNotifications] = useState({
    sidebar: {
      messages: { count: 0, hasUnread: false, dotColor: '#EF4444' },
      bookings: { count: 0, hasUnread: false, dotColor: '#EAB308' },
      wishlist: { count: 0, hasUnread: false, dotColor: '#EF4444' },
      settings: { count: 0, hasUnread: false, dotColor: '#A855F7' }
    },
    summary: {
      totalUnread: 0,
      totalPending: 0
    }
  });

  const [loading, setLoading] = useState(true);

  // ========== FETCH USER NOTIFICATION COUNTS ==========
  const fetchNotificationCounts = async () => {
    try {
      // Get unread messages count
      const messagesRes = await api.get('/notifications/counts/messages').catch(() => ({ data: { data: { count: 0 } } }));
      const unreadMessages = messagesRes.data?.data?.count || 0;
      
      // Get pending bookings count (for tenants)
      const bookingsRes = await api.get('/notifications/counts/bookings').catch(() => ({ data: { data: { count: 0 } } }));
      const pendingBookings = bookingsRes.data?.data?.count || 0;
      
      // Get wishlist notifications (price drops, availability)
      const wishlistRes = await api.get('/notifications/counts/wishlist').catch(() => ({ data: { data: { count: 0 } } }));
      const wishlistNotifications = wishlistRes.data?.data?.count || 0;
      
      // Get pending verifications for settings
      const verificationsRes = await api.get('/notifications/counts/verifications').catch(() => ({ data: { data: { count: 0 } } }));
      const pendingVerifications = verificationsRes.data?.data?.count || 0;

      setNotifications({
        sidebar: {
          messages: { 
            count: unreadMessages, 
            hasUnread: unreadMessages > 0, 
            dotColor: '#EF4444' 
          },
          bookings: { 
            count: pendingBookings, 
            hasUnread: pendingBookings > 0, 
            dotColor: '#EAB308' 
          },
          wishlist: { 
            count: wishlistNotifications, 
            hasUnread: wishlistNotifications > 0, 
            dotColor: '#EF4444' 
          },
          settings: { 
            count: pendingVerifications, 
            hasUnread: pendingVerifications > 0, 
            dotColor: '#A855F7' 
          }
        },
        summary: {
          totalUnread: unreadMessages + wishlistNotifications,
          totalPending: pendingBookings + pendingVerifications
        }
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== MARK NOTIFICATION AS READ ==========
  const markAsRead = async (type, id) => {
    try {
      await api.put(`/notifications/${type}/${id}/read`);
      
      // Update local state
      if (type === 'messages') {
        setNotifications(prev => ({
          ...prev,
          sidebar: {
            ...prev.sidebar,
            messages: { ...prev.sidebar.messages, count: 0, hasUnread: false }
          },
          summary: {
            ...prev.summary,
            totalUnread: prev.summary.totalUnread - prev.sidebar.messages.count
          }
        }));
      } else if (type === 'bookings') {
        setNotifications(prev => ({
          ...prev,
          sidebar: {
            ...prev.sidebar,
            bookings: { ...prev.sidebar.bookings, count: 0, hasUnread: false }
          },
          summary: {
            ...prev.summary,
            totalPending: prev.summary.totalPending - prev.sidebar.bookings.count
          }
        }));
      } else if (type === 'wishlist') {
        setNotifications(prev => ({
          ...prev,
          sidebar: {
            ...prev.sidebar,
            wishlist: { ...prev.sidebar.wishlist, count: 0, hasUnread: false }
          },
          summary: {
            ...prev.summary,
            totalUnread: prev.summary.totalUnread - prev.sidebar.wishlist.count
          }
        }));
      } else if (type === 'settings' || type === 'verifications') {
        setNotifications(prev => ({
          ...prev,
          sidebar: {
            ...prev.sidebar,
            settings: { ...prev.sidebar.settings, count: 0, hasUnread: false }
          },
          summary: {
            ...prev.summary,
            totalPending: prev.summary.totalPending - prev.sidebar.settings.count
          }
        }));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // ========== FETCH ON MOUNT AND SETUP POLLING ==========
  useEffect(() => {
    fetchNotificationCounts();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotificationCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ========== HANDLE NAVIGATION WITH MARK AS READ ==========
  const handleNavigation = async (item, e) => {
    // Navigate first
    navigate(item.path);
    
    // Mark notifications as read based on which item was clicked
    if (item.label === 'Messages' && notifications.sidebar.messages.hasUnread) {
      await markAsRead('messages', 'all');
    } else if (item.label === 'Bookings' && notifications.sidebar.bookings.hasUnread) {
      await markAsRead('bookings', 'all');
    } else if (item.label === 'Wishlist' && notifications.sidebar.wishlist.hasUnread) {
      await markAsRead('wishlist', 'all');
    } else if (item.label === 'Settings' && notifications.sidebar.settings.hasUnread) {
      await markAsRead('settings', 'all');
    }
  };

  // Desktop navigation items - With notification dots
  const navItems = [
    {
      label: 'Explore',
      icon: <Compass size={20} />,
      path: '/',
      end: true,
      color: 'from-emerald-500 to-teal-500',
      description: 'Discover properties'
    },
    {
      label: 'Bookings',
      icon: <Calendar size={20} />,
      path: '/account/bookings',
      badge: notifications.sidebar.bookings.count > 0 ? notifications.sidebar.bookings.count.toString() : null,
      badgeColor: 'bg-yellow-100 text-yellow-700',
      dotColor: notifications.sidebar.bookings.dotColor,
      hasNotification: notifications.sidebar.bookings.hasUnread,
      notificationCount: notifications.sidebar.bookings.count,
      color: 'from-purple-500 to-pink-500',
      description: 'Your reservations'
    },
    {
      label: 'Wishlist',
      icon: <Heart size={20} />,
      path: '/account/wishlist',
      badge: notifications.sidebar.wishlist.count > 0 ? notifications.sidebar.wishlist.count.toString() : null,
      badgeColor: 'bg-red-100 text-red-600',
      dotColor: notifications.sidebar.wishlist.dotColor,
      hasNotification: notifications.sidebar.wishlist.hasUnread,
      notificationCount: notifications.sidebar.wishlist.count,
      color: 'from-red-500 to-orange-500',
      description: 'Saved properties'
    },
    {
      label: 'Messages',
      icon: <MessageSquare size={20} />,
      path: '/account/messages',
      badge: notifications.sidebar.messages.count > 0 ? notifications.sidebar.messages.count.toString() : null,
      badgeColor: 'bg-green-100 text-green-700',
      dotColor: notifications.sidebar.messages.dotColor,
      hasNotification: notifications.sidebar.messages.hasUnread,
      notificationCount: notifications.sidebar.messages.count,
      color: 'from-emerald-500 to-teal-500',
      description: 'Your conversations'
    },
    {
      label: 'Settings',
      icon: <Settings size={20} />,
      path: '/account/settings',
      badge: notifications.sidebar.settings.count > 0 ? notifications.sidebar.settings.count.toString() : null,
      badgeColor: 'bg-purple-100 text-purple-700',
      dotColor: notifications.sidebar.settings.dotColor,
      hasNotification: notifications.sidebar.settings.hasUnread,
      notificationCount: notifications.sidebar.settings.count,
      color: 'from-gray-500 to-slate-500',
      description: 'Account preferences'
    }
  ];

  // Dashboard links for landlords/agents
  const getDashboardLinks = () => {
    const links = [];
    
    if (isLandlord) {
      links.push({
        label: 'Landlord Dashboard',
        icon: <Home size={18} />,
        path: '/landlord/dashboard',
        color: 'text-[#BC8BBC]'
      });
    }
    
    if (isAgent) {
      links.push({
        label: 'Agent Dashboard',
        icon: <LayoutGrid size={18} />,
        path: '/agent/dashboard',
        color: 'text-blue-600'
      });
    }
    
    return links;
  };

  const dashboardLinks = getDashboardLinks();

  // Desktop - Full layout with fixed sidebar
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
        {/* Shared Header */}
        <Header />
        
        <div className="flex">
          {/* Desktop Sidebar - Completely fixed, no scroll */}
          <aside className={`
            fixed top-20 left-0 h-[calc(100vh-80px)] transition-all duration-500 ease-in-out
            ${isSidebarCollapsed ? 'w-24' : 'w-72'}
            bg-white/90 backdrop-blur-xl border-r border-gray-200/80
            flex flex-col
            z-30
          `}>
            {/* Logo Area - Fixed at top of sidebar */}
            <div className={`
              flex-shrink-0 px-4 py-5 border-b border-gray-100
              ${isSidebarCollapsed ? 'px-2' : 'px-5'}
            `}>
              <div className={`
                flex items-center
                ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}
              `}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#BC8BBC] to-purple-600 flex items-center justify-center shadow-md shadow-[#BC8BBC]/30">
                  <Compass className="w-4 h-4 text-white" />
                </div>
                {!isSidebarCollapsed && (
                  <span className="ml-3 text-sm font-semibold text-gray-700">
                    Account Center
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Area - Scrollable if needed */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
              <div className="space-y-1.5">
                {navItems.map((item, index) => (
                  <NavLink
                    key={index}
                    to={item.path}
                    end={item.end}
                    onClick={(e) => handleNavigation(item, e)}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                      ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}
                      ${isActive && item.path !== '/'
                        ? 'bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 text-[#BC8BBC] border border-[#BC8BBC]/30 shadow-md' 
                        : item.path === '/' && location.pathname === '/'
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 border border-emerald-500/30 shadow-md'
                          : 'text-gray-600 hover:bg-gray-100/80 hover:text-[#BC8BBC] border border-transparent'
                      }
                    `}
                  >
                    <div className={`
                      relative
                      ${!isSidebarCollapsed && 'mr-3'}
                    `}>
                      {item.icon}
                      
                      {/* Notification Dot - Shows when collapsed */}
                      {isSidebarCollapsed && item.hasNotification && (
                        <span 
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                          style={{ backgroundColor: item.dotColor }}
                        ></span>
                      )}
                    </div>
                    
                    {!isSidebarCollapsed && (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium block">
                              {item.label}
                            </span>
                            
                            {/* Notification Badge */}
                            {item.hasNotification && item.notificationCount > 0 && (
                              <span 
                                className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white"
                                style={{ backgroundColor: item.dotColor }}
                              >
                                {item.notificationCount > 9 ? '9+' : item.notificationCount}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 mt-0.5 block">
                            {item.description}
                          </span>
                        </div>
                        
                        {/* Legacy badge support */}
                        {item.badge && !item.hasNotification && (
                          <span className={`
                            px-2 py-1 text-xs font-medium rounded-full ml-2
                            ${item.badgeColor}
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Dashboard Links Section - Only shown if user is landlord/agent */}
              {dashboardLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="space-y-1.5">
                    {dashboardLinks.map((link, index) => (
                      <NavLink
                        key={index}
                        to={link.path}
                        className={({ isActive }) => `
                          flex items-center px-4 py-3 rounded-xl transition-all duration-300
                          ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}
                          ${isActive 
                            ? 'bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 text-[#BC8BBC] border border-[#BC8BBC]/30' 
                            : 'text-gray-600 hover:bg-gray-100/80 hover:text-[#BC8BBC] border border-transparent'
                          }
                        `}
                      >
                        <div className={`
                          ${link.color}
                          ${!isSidebarCollapsed && 'mr-3'}
                        `}>
                          {link.icon}
                        </div>
                        {!isSidebarCollapsed && (
                          <span className="text-sm font-medium">
                            {link.label}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Sidebar Footer - Fixed at bottom, never moves */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50/50">
              {/* Collapse Button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-200/80 transition-colors text-gray-500 group"
              >
                <ChevronRight className={`
                  w-4 h-4 transition-all duration-500 group-hover:text-[#BC8BBC]
                  ${isSidebarCollapsed ? 'rotate-180' : ''}
                `} />
                {!isSidebarCollapsed && (
                  <span className="text-xs font-medium group-hover:text-[#BC8BBC]">Collapse sidebar</span>
                )}
              </button>
              
              {/* Last updated time (for debugging) */}
              {!isSidebarCollapsed && (
                <p className="mt-3 text-[10px] text-gray-400 text-center">
                  Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </aside>

          {/* Main Content - With left margin to account for fixed sidebar */}
          <main className={`
            flex-1 min-h-[calc(100vh-80px)] bg-gray-50/30 transition-all duration-500 ease-in-out
            ${isSidebarCollapsed ? 'ml-24' : 'ml-72'}
          `}>
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Custom Scrollbar Styles */}
        <style>
          {`
            /* Thin scrollbar for sidebar */
            .scrollbar-thin::-webkit-scrollbar {
              width: 4px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
              background: transparent;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 20px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
              background: #cbd5e1;
            }

            /* Animation for notification dot */
            @keyframes pulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.8;
                transform: scale(1.1);
              }
            }
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}
        </style>
      </div>
    );
  }

  // Mobile Layout - With notification badges in BottomNav
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 w-full">
      {/* Shared Header */}
      <Header />
      
      {/* Main Content */}
      <main className="w-full pb-20">
        <Outlet />
      </main>
      
      {/* Unified Bottom Navigation - Pass notification counts */}
      <BottomNav 
        notificationCounts={{
          messages: notifications.sidebar.messages.count,
          bookings: notifications.sidebar.bookings.count,
          wishlist: notifications.sidebar.wishlist.count
        }}
      />
    </div>
  );
}