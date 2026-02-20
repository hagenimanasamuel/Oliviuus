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
  Bell,
  Wallet,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
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
      // Core notifications
      messages: { count: 0, hasUnread: false, dotColor: '#EF4444', subType: 'chat' },
      bookingMessages: { count: 0, hasUnread: false, dotColor: '#F97316', subType: 'booking_updates' },
      bookings: { count: 0, hasUnread: false, dotColor: '#EAB308', subType: 'pending' },
      activeBookings: { count: 0, hasUnread: false, dotColor: '#22C55E', subType: 'active' },
      upcomingBookings: { count: 0, hasUnread: false, dotColor: '#3B82F6', subType: 'upcoming' },
      payments: { count: 0, hasUnread: false, dotColor: '#22C55E', subType: 'pending' },
      
      // Settings/Wallet related
      settings: { count: 0, hasUnread: false, dotColor: '#A855F7', subType: 'id_verification' },
      withdrawalVerification: { count: 0, hasUnread: false, dotColor: '#8B5CF6', subType: 'withdrawal_account' },
      
      // Wishlist related
      wishlist: { count: 0, hasUnread: false, dotColor: '#EF4444', subType: 'notifications' },
      wishlistItems: { count: 0, hasUnread: false, dotColor: '#EC4899', subType: 'saved' },
      wishlistActivity: { count: 0, hasUnread: false, dotColor: '#F59E0B', subType: 'property_updates' },
      
      // Landlord specific
      propertyVerifications: { count: 0, hasUnread: false, dotColor: '#6366F1', subType: 'property_approval' }
    },
    summary: {
      totalUnread: 0,
      totalPending: 0,
      totalActive: 0,
      totalUpcoming: 0,
      totalSaved: 0,
      byCategory: {
        messages: 0,
        bookings: 0,
        payments: 0,
        verifications: 0,
        wishlist: 0
      }
    },
    userType: 'tenant',
    lastUpdated: null
  });

  const [loading, setLoading] = useState(true);

  // ========== FETCH USER NOTIFICATION COUNTS ==========
  const fetchNotificationCounts = async () => {
    try {
      // Use the all-in-one endpoint for efficiency
      const response = await api.get('/notifications/counts/all').catch(() => null);
      
      if (response?.data?.success) {
        setNotifications(response.data.data);
      } else {
        // Fallback to individual calls if all-in-one fails
        await fetchIndividualCounts();
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      // Try individual calls as fallback
      await fetchIndividualCounts();
    } finally {
      setLoading(false);
    }
  };

  // Fallback: fetch individual counts
  const fetchIndividualCounts = async () => {
    try {
      const [
        messagesRes,
        bookingMessagesRes,
        bookingsRes,
        activeBookingsRes,
        upcomingBookingsRes,
        paymentsRes,
        verificationsRes,
        withdrawalVerifRes,
        wishlistRes,
        wishlistItemsRes,
        wishlistActivityRes,
        propertyVerifRes
      ] = await Promise.allSettled([
        api.get('/notifications/counts/messages'),
        api.get('/notifications/counts/booking-messages'),
        api.get('/notifications/counts/bookings'),
        api.get('/notifications/counts/active-bookings'),
        api.get('/notifications/counts/upcoming-bookings'),
        api.get('/notifications/counts/payments'),
        api.get('/notifications/counts/verifications'),
        api.get('/notifications/counts/withdrawal-verification'),
        api.get('/notifications/counts/wishlist'),
        api.get('/notifications/counts/wishlist-items'),
        api.get('/notifications/counts/wishlist-activity'),
        api.get('/notifications/counts/property-verifications')
      ]);

      const getCount = (result) => result.status === 'fulfilled' ? result.value?.data?.data?.count || 0 : 0;

      const unreadMessages = getCount(messagesRes);
      const bookingMessages = getCount(bookingMessagesRes);
      const pendingBookings = getCount(bookingsRes);
      const activeBookings = getCount(activeBookingsRes);
      const upcomingBookings = getCount(upcomingBookingsRes);
      const pendingPayments = getCount(paymentsRes);
      const pendingVerifications = getCount(verificationsRes);
      const withdrawalVerification = getCount(withdrawalVerifRes);
      const wishlistNotifications = getCount(wishlistRes);
      const wishlistItems = getCount(wishlistItemsRes);
      const wishlistActivity = getCount(wishlistActivityRes);
      const propertyVerifications = getCount(propertyVerifRes);

      setNotifications({
        sidebar: {
          messages: { count: unreadMessages, hasUnread: unreadMessages > 0, dotColor: '#EF4444', subType: 'chat' },
          bookingMessages: { count: bookingMessages, hasUnread: bookingMessages > 0, dotColor: '#F97316', subType: 'booking_updates' },
          bookings: { count: pendingBookings, hasUnread: pendingBookings > 0, dotColor: '#EAB308', subType: 'pending' },
          activeBookings: { count: activeBookings, hasUnread: activeBookings > 0, dotColor: '#22C55E', subType: 'active' },
          upcomingBookings: { count: upcomingBookings, hasUnread: upcomingBookings > 0, dotColor: '#3B82F6', subType: 'upcoming' },
          payments: { count: pendingPayments, hasUnread: pendingPayments > 0, dotColor: '#22C55E', subType: 'pending' },
          settings: { count: pendingVerifications, hasUnread: pendingVerifications > 0, dotColor: '#A855F7', subType: 'id_verification' },
          withdrawalVerification: { count: withdrawalVerification, hasUnread: withdrawalVerification > 0, dotColor: '#8B5CF6', subType: 'withdrawal_account' },
          wishlist: { count: wishlistNotifications, hasUnread: wishlistNotifications > 0, dotColor: '#EF4444', subType: 'notifications' },
          wishlistItems: { count: wishlistItems, hasUnread: wishlistItems > 0, dotColor: '#EC4899', subType: 'saved' },
          wishlistActivity: { count: wishlistActivity, hasUnread: wishlistActivity > 0, dotColor: '#F59E0B', subType: 'property_updates' },
          propertyVerifications: { count: propertyVerifications, hasUnread: propertyVerifications > 0, dotColor: '#6366F1', subType: 'property_approval' }
        },
        summary: {
          totalUnread: unreadMessages + bookingMessages,
          totalPending: pendingBookings + pendingPayments + pendingVerifications + withdrawalVerification + propertyVerifications,
          totalActive: activeBookings,
          totalUpcoming: upcomingBookings,
          totalSaved: wishlistItems,
          byCategory: {
            messages: unreadMessages + bookingMessages,
            bookings: pendingBookings + activeBookings + upcomingBookings,
            payments: pendingPayments,
            verifications: pendingVerifications + withdrawalVerification + propertyVerifications,
            wishlist: wishlistNotifications + wishlistActivity
          }
        },
        userType: userType || 'tenant',
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching individual counts:', error);
    }
  };

  // ========== MARK NOTIFICATION AS READ ==========
  const markAsRead = async (type, id = 'all') => {
    try {
      await api.put(`/notifications/${type}/${id}/read`);
      
      // Update local state based on type
      setNotifications(prev => {
        const updated = { ...prev };
        
        if (type === 'messages' || type === 'booking_messages') {
          const messageType = type === 'messages' ? 'messages' : 'bookingMessages';
          const oldCount = updated.sidebar[messageType].count;
          updated.sidebar[messageType] = { ...updated.sidebar[messageType], count: 0, hasUnread: false };
          updated.summary.totalUnread = Math.max(0, updated.summary.totalUnread - oldCount);
          updated.summary.byCategory.messages = Math.max(0, updated.summary.byCategory.messages - oldCount);
        } 
        else if (type === 'bookings') {
          const oldCount = updated.sidebar.bookings.count;
          updated.sidebar.bookings = { ...updated.sidebar.bookings, count: 0, hasUnread: false };
          updated.summary.totalPending = Math.max(0, updated.summary.totalPending - oldCount);
          updated.summary.byCategory.bookings = Math.max(0, updated.summary.byCategory.bookings - oldCount);
        }
        else if (type === 'wishlist') {
          const oldCount = updated.sidebar.wishlist.count;
          updated.sidebar.wishlist = { ...updated.sidebar.wishlist, count: 0, hasUnread: false };
          updated.summary.totalUnread = Math.max(0, updated.summary.totalUnread - oldCount);
          updated.summary.byCategory.wishlist = Math.max(0, updated.summary.byCategory.wishlist - oldCount);
        }
        else if (type === 'settings' || type === 'verifications' || type === 'withdrawal_verification') {
          const settingTypes = ['settings', 'withdrawalVerification', 'propertyVerifications'];
          let totalDeduction = 0;
          
          settingTypes.forEach(settingType => {
            if (updated.sidebar[settingType]?.count > 0) {
              totalDeduction += updated.sidebar[settingType].count;
              updated.sidebar[settingType] = { ...updated.sidebar[settingType], count: 0, hasUnread: false };
            }
          });
          
          updated.summary.totalPending = Math.max(0, updated.summary.totalPending - totalDeduction);
          updated.summary.byCategory.verifications = Math.max(0, updated.summary.byCategory.verifications - totalDeduction);
        }
        
        return updated;
      });
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
    if (item.notificationTypes) {
      for (const type of item.notificationTypes) {
        if (notifications.sidebar[type]?.hasUnread) {
          await markAsRead(type === 'bookingMessages' ? 'booking_messages' : type);
        }
      }
    }
  };

  // Desktop navigation items - Enhanced with all notification types
  const navItems = [
    {
      label: 'Explore',
      icon: <Compass size={20} />,
      path: '/',
      end: true,
      color: 'from-emerald-500 to-teal-500',
      description: 'Discover properties',
      notificationTypes: []
    },
    {
      label: 'Bookings',
      icon: <Calendar size={20} />,
      path: '/account/bookings',
      dotColor: notifications.sidebar.bookings.dotColor,
      hasNotification: notifications.sidebar.bookings.hasUnread || 
                      notifications.sidebar.activeBookings.hasUnread || 
                      notifications.sidebar.upcomingBookings.hasUnread,
      notificationCount: notifications.sidebar.bookings.count + 
                        notifications.sidebar.activeBookings.count + 
                        notifications.sidebar.upcomingBookings.count,
      color: 'from-purple-500 to-pink-500',
      description: 'Your reservations',
      notificationTypes: ['bookings', 'activeBookings', 'upcomingBookings', 'bookingMessages'],
      subNotifications: [
        { type: 'pending', count: notifications.sidebar.bookings.count, color: '#EAB308' },
        { type: 'active', count: notifications.sidebar.activeBookings.count, color: '#22C55E' },
        { type: 'upcoming', count: notifications.sidebar.upcomingBookings.count, color: '#3B82F6' }
      ]
    },
    {
      label: 'Wishlist',
      icon: <Heart size={20} />,
      path: '/account/wishlist',
      dotColor: notifications.sidebar.wishlist.dotColor,
      hasNotification: notifications.sidebar.wishlist.hasUnread || 
                      notifications.sidebar.wishlistActivity.hasUnread,
      notificationCount: notifications.sidebar.wishlist.count + 
                        notifications.sidebar.wishlistActivity.count,
      color: 'from-red-500 to-orange-500',
      description: 'Saved properties',
      notificationTypes: ['wishlist', 'wishlistActivity'],
      totalItems: notifications.sidebar.wishlistItems.count
    },
    {
      label: 'Messages',
      icon: <MessageSquare size={20} />,
      path: '/account/messages',
      dotColor: notifications.sidebar.messages.dotColor,
      hasNotification: notifications.sidebar.messages.hasUnread || 
                      notifications.sidebar.bookingMessages.hasUnread,
      notificationCount: notifications.sidebar.messages.count + 
                        notifications.sidebar.bookingMessages.count,
      color: 'from-emerald-500 to-teal-500',
      description: 'Your conversations',
      notificationTypes: ['messages', 'bookingMessages'],
      subNotifications: [
        { type: 'chats', count: notifications.sidebar.messages.count, color: '#EF4444' },
        { type: 'updates', count: notifications.sidebar.bookingMessages.count, color: '#F97316' }
      ]
    },
    {
      label: 'Settings',
      icon: <Settings size={20} />,
      path: '/account/settings',
      dotColor: notifications.sidebar.settings.dotColor,
      hasNotification: notifications.sidebar.settings.hasUnread || 
                      notifications.sidebar.withdrawalVerification.hasUnread ||
                      notifications.sidebar.propertyVerifications.hasUnread,
      notificationCount: notifications.sidebar.settings.count + 
                        notifications.sidebar.withdrawalVerification.count +
                        notifications.sidebar.propertyVerifications.count,
      color: 'from-gray-500 to-slate-500',
      description: 'Account preferences',
      notificationTypes: ['settings', 'withdrawalVerification', 'propertyVerifications'],
      subNotifications: [
        { type: 'ID Verification', count: notifications.sidebar.settings.count, color: '#A855F7' },
        { type: 'Wallet Setup', count: notifications.sidebar.withdrawalVerification.count, color: '#8B5CF6' },
        { type: 'Properties', count: notifications.sidebar.propertyVerifications.count, color: '#6366F1' }
      ]
    }
  ];

  // Add Payments item for better visibility
  if (notifications.sidebar.payments.count > 0) {
    navItems.splice(3, 0, {
      label: 'Payments',
      icon: <Wallet size={20} />,
      path: '/account/payments',
      dotColor: notifications.sidebar.payments.dotColor,
      hasNotification: notifications.sidebar.payments.hasUnread,
      notificationCount: notifications.sidebar.payments.count,
      color: 'from-green-500 to-emerald-500',
      description: 'Pending payments',
      notificationTypes: ['payments']
    });
  }

  // Dashboard links for landlords/agents
  const getDashboardLinks = () => {
    const links = [];
    
    if (isLandlord) {
      links.push({
        label: 'Landlord Dashboard',
        icon: <Home size={18} />,
        path: '/landlord/dashboard',
        color: 'text-[#BC8BBC]',
        hasNotification: notifications.sidebar.propertyVerifications.hasUnread,
        notificationCount: notifications.sidebar.propertyVerifications.count
      });
    }
    
    if (isAgent) {
      links.push({
        label: 'Agent Dashboard',
        icon: <LayoutGrid size={18} />,
        path: '/agent/dashboard',
        color: 'text-blue-600',
        hasNotification: notifications.sidebar.propertyVerifications.hasUnread,
        notificationCount: notifications.sidebar.propertyVerifications.count
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
          {/* Desktop Sidebar */}
          <aside className={`
            fixed top-20 left-0 h-[calc(100vh-80px)] transition-all duration-500 ease-in-out
            ${isSidebarCollapsed ? 'w-24' : 'w-80'}
            bg-white/90 backdrop-blur-xl border-r border-gray-200/80
            flex flex-col
            z-30
          `}>
            {/* Logo Area */}
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
                  <div className="ml-3">
                    <span className="text-sm font-semibold text-gray-700 block">
                      Account Center
                    </span>
                    <span className="text-xs text-gray-500">
                      {notifications.userType === 'landlord' ? '🏠 Landlord' : 
                       notifications.userType === 'agent' ? '🤝 Agent' : '👤 Tenant'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Area */}
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
                            
                            {/* Main Notification Badge */}
                            {item.hasNotification && item.notificationCount > 0 && (
                              <span 
                                className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white"
                                style={{ backgroundColor: item.dotColor }}
                              >
                                {item.notificationCount > 9 ? '9+' : item.notificationCount}
                              </span>
                            )}

                            {/* Total items count (for wishlist) */}
                            {item.totalItems > 0 && !item.hasNotification && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                {item.totalItems}
                              </span>
                            )}
                          </div>
                          
                          {/* Description */}
                          <span className="text-xs text-gray-400 mt-0.5 block">
                            {item.description}
                          </span>

                          {/* Sub-notifications (tiny dots for different types) */}
                          {item.subNotifications && item.subNotifications.some(n => n.count > 0) && (
                            <div className="flex gap-1 mt-1">
                              {item.subNotifications.map((sub, idx) => (
                                sub.count > 0 && (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span 
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: sub.color }}
                                    ></span>
                                    <span className="text-[10px] text-gray-500">
                                      {sub.count} {sub.type}
                                    </span>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Dashboard Links Section */}
              {dashboardLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="space-y-1.5">
                    {dashboardLinks.map((link, index) => (
                      <NavLink
                        key={index}
                        to={link.path}
                        className={({ isActive }) => `
                          flex items-center px-4 py-3 rounded-xl transition-all duration-300 relative
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
                          <>
                            <span className="text-sm font-medium flex-1">
                              {link.label}
                            </span>
                            {link.hasNotification && link.notificationCount > 0 && (
                              <span 
                                className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white"
                                style={{ backgroundColor: '#6366F1' }}
                              >
                                {link.notificationCount}
                              </span>
                            )}
                          </>
                        )}
                        {isSidebarCollapsed && link.hasNotification && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* Sidebar Footer - Only collapse button and last updated */}
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
              
              {/* Last updated time - optional, can remove if not needed */}
              {!isSidebarCollapsed && notifications.lastUpdated && (
                <p className="mt-3 text-[10px] text-gray-400 text-center">
                  Updated {new Date(notifications.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className={`
            flex-1 min-h-[calc(100vh-80px)] bg-gray-50/30 transition-all duration-500 ease-in-out
            ${isSidebarCollapsed ? 'ml-24' : 'ml-80'}
          `}>
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Custom Scrollbar Styles */}
        <style>
          {`
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
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.8; transform: scale(1.1); }
            }
            .animate-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}
        </style>
      </div>
    );
  }

  // Mobile Layout - Enhanced with all notification types
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 w-full">
      <Header />
      
      {/* Mobile Header with Summary */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">My Account</h2>
          <div className="flex gap-3">
            {notifications.summary.totalUnread > 0 && (
              <div className="flex items-center gap-1">
                <Bell className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-red-500">{notifications.summary.totalUnread}</span>
              </div>
            )}
            {notifications.summary.totalPending > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500">{notifications.summary.totalPending}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="w-full pb-20">
        <Outlet />
      </main>
      
      {/* Enhanced Bottom Navigation */}
      <BottomNav 
        notificationCounts={{
          messages: notifications.sidebar.messages.count + notifications.sidebar.bookingMessages.count,
          bookings: notifications.sidebar.bookings.count + 
                   notifications.sidebar.activeBookings.count + 
                   notifications.sidebar.upcomingBookings.count,
          wishlist: notifications.sidebar.wishlist.count + notifications.sidebar.wishlistActivity.count,
          settings: notifications.sidebar.settings.count + 
                   notifications.sidebar.withdrawalVerification.count +
                   notifications.sidebar.propertyVerifications.count,
          payments: notifications.sidebar.payments.count
        }}
      />
    </div>
  );
}