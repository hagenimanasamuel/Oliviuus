// src/components/AccountMenu/AccountMenu.jsx
import { 
  User, Settings, LogOut, BookOpen, Heart, Mail, Building, Key, 
  LayoutDashboard, Briefcase, LogIn, Calendar, Home, Building2, 
  Shield, UserCheck, Star, HelpCircle, Globe, Bell, Clock, Wallet,
  MessageSquare, AlertCircle, CheckCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import LanguageSelector from '../../ui/LanguageSelector';
import api from '../../../api/axios';

export default function AccountMenu({ onClose, user }) {
  const { logoutUser } = useAuth();
  const { 
    userType, 
    loading: isanzureLoading, 
    isLandlord, 
    isAgent, 
    isTenant 
  } = useIsanzureAuth();
  
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  
  // Notification states - all using brand color
  const [notifications, setNotifications] = useState({
    messages: { count: 0, hasUnread: false },
    bookingMessages: { count: 0, hasUnread: false },
    bookings: { count: 0, hasUnread: false },
    activeBookings: { count: 0, hasUnread: false },
    upcomingBookings: { count: 0, hasUnread: false },
    payments: { count: 0, hasUnread: false },
    wishlist: { count: 0, hasUnread: false },
    wishlistActivity: { count: 0, hasUnread: false },
    settings: { count: 0, hasUnread: false },
    withdrawalVerification: { count: 0, hasUnread: false },
    propertyVerifications: { count: 0, hasUnread: false }
  });

  // Get account center URL from environment
  const ACCOUNT_CENTER_URL = import.meta.env.VITE_ACCOUNT_CENTER_URL || 'https://account.oliviuus.com';

  // Fetch notification counts
  const fetchNotificationCounts = async () => {
    if (!user) return;

    try {
      const response = await api.get('/notifications/counts/all').catch(() => null);
      
      if (response?.data?.success) {
        const data = response.data.data.sidebar;
        setNotifications({
          messages: data.messages,
          bookingMessages: data.bookingMessages,
          bookings: data.bookings,
          activeBookings: data.activeBookings,
          upcomingBookings: data.upcomingBookings,
          payments: data.payments,
          wishlist: data.wishlist,
          wishlistActivity: data.wishlistActivity,
          settings: data.settings,
          withdrawalVerification: data.withdrawalVerification,
          propertyVerifications: data.propertyVerifications || { count: 0, hasUnread: false }
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Poll for notifications
  useEffect(() => {
    fetchNotificationCounts();
    
    const interval = setInterval(fetchNotificationCounts, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Check for RTL direction
  useEffect(() => {
    const checkRTL = () => {
      setIsRTL(document.documentElement.dir === 'rtl');
    };

    checkRTL();
    
    const observer = new MutationObserver(checkRTL);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    
    return () => observer.disconnect();
  }, []);

  // Get total count helper
  const getTotalCount = (types) => {
    return types.reduce((sum, type) => sum + (notifications[type]?.count || 0), 0);
  };

  // Check if any of the types have unread
  const hasUnread = (types) => {
    return types.some(type => notifications[type]?.hasUnread || false);
  };

  // Define all available menu items with notification metadata
  const ALL_MENU_ITEMS = {
    explore: { 
      label: 'Explore Properties', 
      icon: <Home size={16} />, 
      path: '/properties',
      requiresAuth: false 
    },
    howItWorks: { 
      label: 'How It Works', 
      icon: <HelpCircle size={16} />, 
      path: '/how-it-works',
      requiresAuth: false 
    },
    bookings: { 
      label: 'Bookings', 
      icon: <Calendar size={16} />, 
      path: '/account/bookings',
      requiresAuth: true,
      authMessage: 'Sign in to view your bookings',
      notificationTypes: ['bookings', 'activeBookings', 'upcomingBookings', 'bookingMessages'],
      getNotificationCount: () => getTotalCount(['bookings', 'activeBookings', 'upcomingBookings', 'bookingMessages']),
      hasNotification: () => hasUnread(['bookings', 'activeBookings', 'upcomingBookings', 'bookingMessages']),
      subNotifications: [
        { type: 'pending', count: () => notifications.bookings.count },
        { type: 'active', count: () => notifications.activeBookings.count },
        { type: 'upcoming', count: () => notifications.upcomingBookings.count },
        { type: 'updates', count: () => notifications.bookingMessages.count }
      ]
    },
    wishlist: { 
      label: 'Wishlist', 
      icon: <Heart size={16} />, 
      path: '/account/wishlist',
      requiresAuth: true,
      authMessage: 'Sign in to save properties to your wishlist',
      notificationTypes: ['wishlist', 'wishlistActivity'],
      getNotificationCount: () => getTotalCount(['wishlist', 'wishlistActivity']),
      hasNotification: () => hasUnread(['wishlist', 'wishlistActivity']),
      subNotifications: [
        { type: 'updates', count: () => notifications.wishlistActivity.count }
      ]
    },
    messages: {
      label: 'Messages',
      icon: <MessageSquare size={16} />,
      path: '/account/messages',
      requiresAuth: true,
      authMessage: 'Sign in to view your messages',
      notificationTypes: ['messages', 'bookingMessages'],
      getNotificationCount: () => getTotalCount(['messages', 'bookingMessages']),
      hasNotification: () => hasUnread(['messages', 'bookingMessages']),
      subNotifications: [
        { type: 'chats', count: () => notifications.messages.count },
        { type: 'updates', count: () => notifications.bookingMessages.count }
      ]
    },
    becomeHost: { 
      label: 'Become a Landlord', 
      icon: <Key size={16} />, 
      path: '/become-landlord',
      requiresAuth: true,
      authMessage: 'Sign in to become a landlord'
    },
    becomeAgent: { 
      label: 'Become an Agent', 
      icon: <Briefcase size={16} />, 
      path: '/agent',
      requiresAuth: true,
      authMessage: 'Sign in to become an agent'
    },
    landlordCenter: { 
      label: 'Landlord Center', 
      icon: <LayoutDashboard size={16} />, 
      path: '/landlord/dashboard',
      requiresAuth: true,
      availableFor: ['landlord'],
      authMessage: 'Available for landlords only',
      notificationTypes: ['propertyVerifications'],
      getNotificationCount: () => notifications.propertyVerifications.count,
      hasNotification: () => notifications.propertyVerifications.hasUnread
    },
    agentDashboard: { 
      label: 'Agent Dashboard', 
      icon: <Building size={16} />, 
      path: '/agent/dashboard',
      requiresAuth: true,
      availableFor: ['agent'],
      authMessage: 'Available for agents only',
      notificationTypes: ['propertyVerifications'],
      getNotificationCount: () => notifications.propertyVerifications.count,
      hasNotification: () => notifications.propertyVerifications.hasUnread
    },
    propertyManager: { 
      label: 'Property Manager', 
      icon: <Building2 size={16} />, 
      path: '/property-manager/dashboard',
      requiresAuth: true,
      availableFor: ['property_manager'],
      authMessage: 'Available for property managers only'
    },
    settings: { 
      label: 'Settings', 
      icon: <Settings size={16} />, 
      path: '/account/settings',
      requiresAuth: true,
      authMessage: 'Sign in to access settings',
      notificationTypes: ['settings', 'withdrawalVerification', 'payments'],
      getNotificationCount: () => getTotalCount(['settings', 'withdrawalVerification', 'payments']),
      hasNotification: () => hasUnread(['settings', 'withdrawalVerification', 'payments']),
      subNotifications: [
        { type: 'ID Verification', count: () => notifications.settings.count },
        { type: 'Wallet Setup', count: () => notifications.withdrawalVerification.count },
        { type: 'Payments', count: () => notifications.payments.count }
      ]
    },
    helpSupport: { 
      label: 'Help & Support', 
      icon: <HelpCircle size={16} />, 
      path: '/help',
      requiresAuth: false
    },
    featuredProperties: { 
      label: 'Featured Properties', 
      icon: <Star size={16} />, 
      path: '/featured',
      requiresAuth: false
    },
    verifiedListings: { 
      label: 'Verified Listings', 
      icon: <UserCheck size={16} />, 
      path: '/verified',
      requiresAuth: false,
      badge: 'Trusted',
      badgeColor: 'bg-emerald-100 text-emerald-700'
    }
  };

  // Generate auth URL with redirect parameter
  const getAuthUrl = (redirectPath = null) => {
    const redirectUrl = redirectPath ? `${window.location.origin}${redirectPath}` : window.location.href;
    const encodedRedirect = encodeURIComponent(redirectUrl);
    return `${ACCOUNT_CENTER_URL}/auth?redirect=${encodedRedirect}`;
  };

  // Mark notifications as read
  const markAsRead = async (types) => {
    try {
      for (const type of types) {
        await api.put(`/notifications/${type}/mark-all-read`).catch(() => {});
      }
      
      // Update local state
      setNotifications(prev => {
        const updated = { ...prev };
        types.forEach(type => {
          if (updated[type]) {
            updated[type] = { ...updated[type], count: 0, hasUnread: false };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Get menu items based on user state and type
  const getMenuItems = () => {
    const items = [];
    
    if (user) {
      items.push(
        ALL_MENU_ITEMS.bookings,
        ALL_MENU_ITEMS.wishlist,
        ALL_MENU_ITEMS.messages
      );

      if (isTenant) {
        items.push(
          ALL_MENU_ITEMS.becomeHost,
          ALL_MENU_ITEMS.becomeAgent
        );
      }

      if (isLandlord) {
        items.push(ALL_MENU_ITEMS.landlordCenter);
      } else if (isAgent) {
        items.push(ALL_MENU_ITEMS.agentDashboard);
      } else if (userType === 'property_manager') {
        items.push(ALL_MENU_ITEMS.propertyManager);
      }

      items.push(ALL_MENU_ITEMS.settings);
      
    } else {
      items.push(
        ALL_MENU_ITEMS.explore,
        ALL_MENU_ITEMS.featuredProperties,
        ALL_MENU_ITEMS.verifiedListings,
        ALL_MENU_ITEMS.becomeHost,
        ALL_MENU_ITEMS.becomeAgent,
        ALL_MENU_ITEMS.howItWorks,
        ALL_MENU_ITEMS.helpSupport
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  const handleMenuItemClick = async (item) => {
    const { path, requiresAuth, authMessage, notificationTypes } = item;
    
    if (requiresAuth && !user) {
      if (authMessage) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 ${isRTL ? 'left-4' : 'right-4'} bg-[#BC8BBC] text-white px-4 py-2 rounded-lg shadow-lg z-[1000] animate-fade-in`;
        notification.textContent = authMessage;
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
      
      window.location.href = getAuthUrl(path);
    } else {
      // Mark notifications as read if this item has notification types
      if (notificationTypes) {
        await markAsRead(notificationTypes);
      }
      window.location.href = path;
    }
    
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
    window.location.href = '/';
  };

  const handleSignIn = () => {
    window.location.href = getAuthUrl();
    onClose();
  };

  useEffect(() => {
    if (user?.profile_avatar_url) {
      const img = new Image();
      img.src = user.profile_avatar_url;
      img.onload = () => setAvatarLoaded(true);
      img.onerror = () => setAvatarError(true);
    }
  }, [user]);

  const getUserTypeDisplay = () => {
    if (!user) return 'Guest';
    
    switch(userType) {
      case 'landlord':
        return 'Landlord';
      case 'agent':
        return 'Agent';
      case 'property_manager':
        return 'Property Manager';
      default:
        return 'Tenant';
    }
  };

  const getUserTypeBadgeStyle = () => {
    if (!user) return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200';
    
    switch(userType) {
      case 'landlord':
        return 'bg-gradient-to-r from-[#BC8BBC]/20 to-purple-100 text-[#BC8BBC] border-[#BC8BBC]/30';
      case 'agent':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200';
      case 'property_manager':
        return 'bg-gradient-to-r from-[#BC8BBC]/20 to-indigo-100 text-[#BC8BBC] border-[#BC8BBC]/30';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200';
    }
  };

  // Get total notification count for avatar badge
  const getTotalNotificationCount = () => {
    return getTotalCount(['messages', 'bookingMessages', 'payments', 'settings', 'withdrawalVerification']);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-gray-200 py-3 max-h-[80vh] overflow-y-auto ${isRTL ? 'rtl' : ''}`}>
        {/* User Profile Section with Notification Badge */}
        {user ? (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="relative flex-shrink-0">
                {!avatarLoaded && !avatarError && user.profile_avatar_url ? (
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                ) : avatarError || !user.profile_avatar_url ? (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BC8BBC]/20 to-purple-100 flex items-center justify-center">
                    <User size={24} className="text-[#BC8BBC]" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#BC8BBC]/30">
                    <img 
                      src={user.profile_avatar_url} 
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Notification badge on avatar */}
                {getTotalNotificationCount() > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full text-white font-bold ring-2 ring-white"
                    style={{ backgroundColor: '#BC8BBC' }}
                  >
                    {getTotalNotificationCount() > 9 ? '9+' : getTotalNotificationCount()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate flex items-center gap-2">
                  {user.first_name} {user.last_name || ''}
                </h3>
                <div className={`flex items-center gap-1 text-sm text-gray-500 truncate ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Mail size={12} />
                  <span className="truncate">{user.email || 'No email set'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-[#BC8BBC]/10">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-[#BC8BBC]/20 border border-gray-300 flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Welcome Guest</h3>
                  <p className="text-sm text-gray-500">Sign in for full access</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSignIn}
              className="w-full mt-3 bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#BC8BBC]/90 hover:to-purple-600/90 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Sign In
            </button>
          </div>
        )}

        {/* Language Selector */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Globe size={16} className="text-[#BC8BBC]" />
            <span className="text-sm font-medium text-gray-700">Language</span>
          </div>
          <LanguageSelector 
            variant="full"
            position={isRTL ? 'bottom-left' : 'bottom-right'}
            align={isRTL ? 'start' : 'end'}
            showLabel={true}
            showFlag={true}
            size="sm"
            fullWidth={true}
            theme="light"
          />
        </div>

        {/* Menu Items with Notifications */}
        <div className="py-2">
          {isanzureLoading && user ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`px-4 py-3 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {menuItems.map((item, index) => {
                const { label, icon, badge, badgeColor, requiresAuth } = item;
                const isDisabled = requiresAuth && !user;
                const notificationCount = item.getNotificationCount ? item.getNotificationCount() : 0;
                const hasNotification = item.hasNotification ? item.hasNotification() : false;
                const subNotifications = item.subNotifications ? item.subNotifications.filter(sub => sub.count() > 0) : [];
                
                return (
                  <button
                    key={index}
                    onClick={() => handleMenuItemClick(item)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors group relative ${
                      isDisabled 
                        ? 'text-gray-400 cursor-pointer hover:bg-gray-50' 
                        : 'text-gray-700 hover:bg-[#BC8BBC]/5 hover:text-[#BC8BBC] cursor-pointer'
                    } ${isRTL ? 'flex-row-reverse' : ''} ${
                      hasNotification ? 'bg-[#BC8BBC]/5' : ''
                    }`}
                  >
                    <div className={`flex items-center flex-1 ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'}`}>
                      <div className="relative">
                        <div className={`${isDisabled ? 'text-gray-400' : 'text-gray-500 group-hover:text-[#BC8BBC]'}`}>
                          {icon}
                        </div>
                        
                        {/* Small dot for notification (1-2 notifications) */}
                        {hasNotification && notificationCount <= 2 && (
                          <span 
                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ring-2 ring-white"
                            style={{ backgroundColor: '#BC8BBC' }}
                          ></span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{label}</span>
                          
                          {/* Badge */}
                          {badge && typeof badge === 'string' && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                              {badge}
                            </span>
                          )}
                          
                          {typeof badge === 'function' && badge() && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                              {badge()}
                            </span>
                          )}
                        </div>
                        
                        {/* Sub-notifications */}
                        {subNotifications.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {subNotifications.map((sub, idx) => (
                              sub.count() > 0 && (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gray-100 rounded-full"
                                >
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: '#BC8BBC' }}
                                  ></span>
                                  {sub.count()} {sub.type}
                                </span>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {notificationCount > 0 && (
                        <>
                          {notificationCount > 2 ? (
                            <span 
                              className="text-xs px-2 py-1 rounded-full font-bold text-white"
                              style={{ 
                                backgroundColor: '#BC8BBC',
                                minWidth: '20px',
                                textAlign: 'center'
                              }}
                            >
                              {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                          ) : (
                            <span 
                              className="w-2 h-2 rounded-full animate-pulse"
                              style={{ backgroundColor: '#BC8BBC' }}
                            ></span>
                          )}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
              
              {user && (
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-3 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'} hover:bg-red-50 text-left text-gray-700 hover:text-red-600 transition-colors group border-t border-gray-100 mt-2`}
                >
                  <div className="text-gray-500 group-hover:text-red-600">
                    <LogOut size={16} />
                  </div>
                  <span className="text-sm font-medium">Log out</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* User Type Indicator */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {isanzureLoading && user ? (
            <div className="space-y-2">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs text-gray-500">Account Type</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getUserTypeBadgeStyle()}`}>
                  {getUserTypeDisplay()}
                </span>
              </div>
              
              {user && user.created_at && (
                <div className={`flex items-center justify-between mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs text-gray-500">Member Since</span>
                  <span className="text-xs text-gray-700 font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          .rtl {
            direction: rtl;
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
    </>
  );
}