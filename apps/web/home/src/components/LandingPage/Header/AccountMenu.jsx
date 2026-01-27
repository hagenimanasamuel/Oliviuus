// src/components/AccountMenu/AccountMenu.jsx
import { 
  User, Settings, LogOut, BookOpen, Heart, Mail, Building, Key, 
  LayoutDashboard, Briefcase, LogIn, Calendar, Home, Building2, 
  Shield, UserCheck, Star, HelpCircle 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';

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
  
  // Get account center URL from environment
  const ACCOUNT_CENTER_URL = import.meta.env.VITE_ACCOUNT_CENTER_URL || 'https://account.oliviuus.com';

  // Define all available menu items with metadata
  const ALL_MENU_ITEMS = {
    // Public items (can be accessed without login)
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
    
    // Auth-protected items
    bookings: { 
      label: 'Bookings', 
      icon: <BookOpen size={16} />, 
      path: '/bookings',
      requiresAuth: true,
      authMessage: 'Sign in to view your bookings'
    },
    wishlist: { 
      label: 'Wishlist', 
      icon: <Heart size={16} />, 
      path: '/wishlist',
      requiresAuth: true,
      authMessage: 'Sign in to save properties to your wishlist'
    },
    
    // Upgrade options
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
    
    // User type specific dashboards
    landlordCenter: { 
      label: 'Landlord Dashboard', 
      icon: <LayoutDashboard size={16} />, 
      path: '/landlord/dashboard',
      requiresAuth: true,
      availableFor: ['landlord'],
      authMessage: 'Available for landlords only'
    },
    agentDashboard: { 
      label: 'Agent Dashboard', 
      icon: <Building size={16} />, 
      path: '/agent/dashboard',
      requiresAuth: true,
      availableFor: ['agent'],
      authMessage: 'Available for agents only'
    },
    propertyManager: { 
      label: 'Property Manager', 
      icon: <Building2 size={16} />, 
      path: '/property-manager/dashboard',
      requiresAuth: true,
      availableFor: ['property_manager'],
      authMessage: 'Available for property managers only'
    },
    
    // Account management
    settings: { 
      label: 'Settings', 
      icon: <Settings size={16} />, 
      path: '/settings',
      requiresAuth: true,
      authMessage: 'Sign in to access settings'
    },
    helpSupport: { 
      label: 'Help & Support', 
      icon: <HelpCircle size={16} />, 
      path: '/help',
      requiresAuth: false
    },
    
    // Additional attractive items for guests
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
    // Use the provided redirect path or current page
    const redirectUrl = redirectPath ? `${window.location.origin}${redirectPath}` : window.location.href;
    const encodedRedirect = encodeURIComponent(redirectUrl);
    return `${ACCOUNT_CENTER_URL}/auth?redirect=${encodedRedirect}`;
  };

  // Get menu items based on user state and type
  const getMenuItems = () => {
    const items = [];
    
    // For logged-in users
    if (user) {
      // Always show these for logged-in users
      items.push(
        ALL_MENU_ITEMS.bookings,
        ALL_MENU_ITEMS.wishlist
      );

      // Show upgrade options only for tenants
      if (isTenant) {
        items.push(
          ALL_MENU_ITEMS.becomeHost,
          ALL_MENU_ITEMS.becomeAgent
        );
      }

      // Show user-type specific dashboard
      if (isLandlord) {
        items.push(ALL_MENU_ITEMS.landlordCenter);
      } else if (isAgent) {
        items.push(ALL_MENU_ITEMS.agentDashboard);
      } else if (userType === 'property_manager') {
        items.push(ALL_MENU_ITEMS.propertyManager);
      }

      // Always show settings for logged-in users
      items.push(ALL_MENU_ITEMS.settings);
      
    } else {
      // For logged-out users - show attractive options
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

  const handleMenuItemClick = (item) => {
    const { path, requiresAuth, authMessage } = item;
    
    // If item requires auth but user is not logged in, redirect to auth page
    if (requiresAuth && !user) {
      // Show a quick notification (optional)
      if (authMessage) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-[#BC8BBC] text-white px-4 py-2 rounded-lg shadow-lg z-[1000] animate-fade-in';
        notification.textContent = authMessage;
        document.body.appendChild(notification);
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
      }
      
      // Redirect to auth page with return URL
      window.location.href = getAuthUrl(path);
    } else {
      // Navigate directly if no auth required or user is logged in
      window.location.href = path;
    }
    
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
    // Redirect to home page after logout
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

  // Format user type for display
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

  // Get badge color based on user type
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

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 border border-gray-200 py-3 max-h-[80vh] overflow-y-auto">
        {/* User Profile Section */}
        {user ? (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
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
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">
                  {user.first_name} {user.last_name || ''}
                </h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                  <Mail size={12} />
                  <span className="truncate">{user.email || 'No email set'}</span>
                </div>
                {user.username && (
                  <p className="text-xs text-gray-400 mt-1 truncate">@{user.username}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Guest user section with sign in button
          <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-[#BC8BBC]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-[#BC8BBC]/20 border border-gray-300 flex items-center justify-center">
                  <User size={24} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Welcome Guest</h3>
                  <p className="text-sm text-gray-500">Sign in for full access</p>
                </div>
              </div>
            </div>
            
            {/* Sign In Button for guests */}
            <button
              onClick={handleSignIn}
              className="w-full mt-3 bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#BC8BBC]/90 hover:to-purple-600/90 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              Sign In
            </button>
          </div>
        )}

        {/* Menu Items */}
        <div className="py-2">
          {isanzureLoading && user ? (
            // Loading skeleton for logged-in users
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-4 py-3 flex items-center space-x-3">
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
                
                return (
                  <button
                    key={index}
                    onClick={() => handleMenuItemClick(item)}
                    disabled={false} // Never disabled, always redirects to auth if needed
                    className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors group ${
                      isDisabled 
                        ? 'text-gray-400 cursor-pointer hover:bg-gray-50' 
                        : 'text-gray-700 hover:bg-[#BC8BBC]/5 hover:text-[#BC8BBC] cursor-pointer'
                    }`}
                    title={isDisabled ? 'Sign in to access this feature' : ''}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${isDisabled ? 'text-gray-400' : 'text-gray-500 group-hover:text-[#BC8BBC]'}`}>
                        {icon}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    
                    {badge && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor}`}>
                        {badge}
                      </span>
                    )}
                    
                    {isDisabled && !user && label.includes('Become') && (
                      <span className="text-xs text-[#BC8BBC] font-medium">
                        Sign in required
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Always show Log out for logged-in users */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-red-50 text-left text-gray-700 hover:text-red-600 transition-colors group border-t border-gray-100 mt-2"
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

        {/* User Type Indicator & Info */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {isanzureLoading && user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Account Type</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getUserTypeBadgeStyle()}`}>
                  {getUserTypeDisplay()}
                </span>
              </div>
              
              {user && user.created_at && (
                <div className="flex items-center justify-between">
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

      {/* Add CSS animations */}
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
        `}
      </style>
    </>
  );
}