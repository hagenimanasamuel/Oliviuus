// src/pages/Dashboard/Landlord/components/LandlordHeader.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Home,
  Wallet,
  HelpCircle,
  Menu,
  X,
  PlusCircle,
  DollarSign,
  Users,
  BarChart,
  Calendar,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../ui/Logo';

export default function LandlordHeader() {
  const navigate = useNavigate();
  const { userType } = useIsanzureAuth();
  const { user, logoutUser } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBalanceDropdownOpen, setIsBalanceDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Default balance
  const balance = "RWF 100";
  
  // Format user name
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user?.first_name) {
      return user.first_name;
    } else if (user?.username) {
      return user.username;
    }
    return "User";
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Safe ID formatting function
  const getFormattedId = () => {
    if (!user?.id) return 'N/A';
    const idStr = String(user.id);
    return idStr.slice(0, 8);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const menuItems = [
    { label: 'Account Settings', icon: <Settings size={20} />, action: () => navigate('/landlord/dashboard/settings') },
    { label: 'Back to Homepage', icon: <Home size={20} />, action: () => navigate('/') },
    { label: 'Help Center', icon: <HelpCircle size={20} />, action: () => window.open('/help', '_blank') },
    { label: 'Sign Out', icon: <LogOut size={20} />, action: handleLogout, isDestructive: true }
  ];

  const walletActions = [
    { label: 'Wallet Overview', action: () => navigate('/landlord/dashboard/payments') },
    { label: 'Add Funds', action: () => navigate('/landlord/dashboard/payments?action=deposit') },
    { label: 'Withdraw', action: () => navigate('/landlord/dashboard/payments?action=withdraw') },
    { label: 'Transaction History', action: () => navigate('/landlord/dashboard/payments?action=history') },
    { label: 'Payment Methods', action: () => navigate('/landlord/dashboard/settings?tab=payments') }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            
            {/* Left: Mobile Menu Button & Logo */}
            <div className="flex items-center space-x-3 lg:space-x-0">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Logo */}
              <div className="flex items-center">
                <Logo className="h-8 w-auto" />
                <div className="hidden lg:block ml-4 pl-4 border-l border-gray-300">
                  <span className="text-sm font-medium text-gray-600">Landlord Center</span>
                </div>
              </div>
            </div>

            {/* Center: Desktop Wallet Balance */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="relative">
                <button
                  onClick={() => setIsBalanceDropdownOpen(!isBalanceDropdownOpen)}
                  className="flex items-center space-x-3 px-5 py-2.5 bg-white rounded-xl border border-gray-300 hover:border-[#BC8BBC] hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-[#8A5A8A]" />
                    <span className="text-lg font-bold text-gray-800">{balance}</span>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`text-gray-400 transition-transform duration-200 group-hover:text-[#BC8BBC] ${
                      isBalanceDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Wallet Dropdown Menu */}
                {isBalanceDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsBalanceDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-40 border border-gray-200 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Available Balance</span>
                          <span className="text-lg font-bold text-gray-900">{balance}</span>
                        </div>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Wallet size={12} className="mr-1" />
                          <span>Landlord Wallet</span>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        {walletActions.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              item.action();
                              setIsBalanceDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left text-gray-700 hover:text-[#8A5A8A] transition-colors group"
                          >
                            <span className="text-sm font-medium">{item.label}</span>
                            <ChevronDown size={14} className="rotate-270 opacity-0 group-hover:opacity-100 text-[#BC8BBC] transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Desktop User Profile */}
            <div className="hidden lg:flex items-center space-x-4">
              
              {/* Mobile Wallet Button - Only visible on mobile */}
              <button
                onClick={() => setIsBalanceDropdownOpen(!isBalanceDropdownOpen)}
                className="lg:hidden flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-300"
              >
                <Wallet className="h-4 w-4 text-[#8A5A8A]" />
                <span className="font-bold text-gray-800 text-sm">{balance}</span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl border border-gray-300 hover:border-[#BC8BBC] hover:shadow-sm transition-all duration-200 bg-white"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {user?.profile_avatar_url ? (
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200">
                        <img 
                          src={user.profile_avatar_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-[#8A5A8A]">
                          {getUserInitials()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>

                  {/* User Info */}
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">
                        {getUserDisplayName()}
                      </span>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform duration-200 ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#f4eaf4] text-[#8A5A8A] font-medium">
                        {userType || 'User'}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg z-40 border border-gray-200 py-3">
                      
                      {/* User Summary */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {user?.profile_avatar_url ? (
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                                <img 
                                  src={user.profile_avatar_url} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] border-2 border-gray-200 flex items-center justify-center">
                                <span className="text-lg font-bold text-[#8A5A8A]">
                                  {getUserInitials()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate">{getUserDisplayName()}</h3>
                            <div className="flex items-center mt-1 space-x-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-[#f4eaf4] text-[#8A5A8A] font-medium">
                                {userType || 'User'}
                              </span>
                              {user?.username && (
                                <span className="text-xs text-gray-500 truncate">@{user.username}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2 max-h-80 overflow-y-auto">
                        {menuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              item.action();
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full px-4 py-3 flex items-center space-x-3 text-left transition-colors group ${
                              item.isDestructive 
                                ? 'hover:bg-red-50 text-gray-700 hover:text-red-600' 
                                : 'hover:bg-gray-50 text-gray-700 hover:text-[#8A5A8A]'
                            }`}
                          >
                            <div className={
                              item.isDestructive 
                                ? 'text-gray-500 group-hover:text-red-600' 
                                : 'text-gray-500 group-hover:text-[#BC8BBC]'
                            }>
                              {item.icon}
                            </div>
                            <span className="text-sm font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Right Section */}
            <div className="flex lg:hidden items-center space-x-3">
              {/* Wallet Button for Mobile */}
              <button
                onClick={() => setIsBalanceDropdownOpen(!isBalanceDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border border-gray-300"
              >
                <Wallet className="h-4 w-4 text-[#8A5A8A]" />
                <span className="font-bold text-gray-800 text-sm">{balance}</span>
              </button>

              {/* Mobile User Avatar */}
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1"
              >
                {user?.profile_avatar_url ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                    <img 
                      src={user.profile_avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm font-semibold text-[#8A5A8A]">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Includes Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-xl overflow-y-auto">
            <div className="p-4">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <Logo className="h-7 w-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  {user?.profile_avatar_url ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      <img 
                        src={user.profile_avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#8A5A8A]">
                        {getUserInitials()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{getUserDisplayName()}</h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#f4eaf4] text-[#8A5A8A] font-medium">
                        {userType || 'User'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sidebar Menu */}
              <MobileSidebar onClose={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </>
      )}

      {/* Mobile Wallet Bottom Sheet */}
      {isBalanceDropdownOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-6 z-40 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Wallet</h3>
              <button
                onClick={() => setIsBalanceDropdownOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{balance}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-[#8A5A8A]" />
                </div>
              </div>

              <div className="space-y-2">
                {walletActions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.action();
                      setIsBalanceDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-[#BC8BBC] hover:bg-[#f4eaf4] transition-colors"
                  >
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <ChevronDown size={16} className="text-gray-400 rotate-270" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile User Menu Bottom Sheet */}
      {isUserMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-6 z-40 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Account</h3>
              <button
                onClick={() => setIsUserMenuOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                {user?.profile_avatar_url ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200">
                    <img 
                      src={user.profile_avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#8A5A8A]">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{getUserDisplayName()}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#f4eaf4] text-[#8A5A8A] font-medium">
                      {userType || 'User'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.action();
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors ${
                      item.isDestructive 
                        ? 'text-red-600 hover:bg-red-50 border border-red-100' 
                        : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={item.isDestructive ? 'text-red-500' : 'text-gray-500'}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400 rotate-270" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Mobile Sidebar Component
function MobileSidebar({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    { label: 'Overview', icon: <Home size={20} />, path: '', exact: true },
    { label: 'My Properties', icon: <Home size={20} />, path: 'properties' },
    { label: 'Add Property', icon: <PlusCircle size={20} />, path: 'add-property' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: 'bookings' },
    { label: 'Tenants', icon: <Users size={20} />, path: 'tenants' },
    { label: 'Payments', icon: <DollarSign size={20} />, path: 'payments' },
    { label: 'Analytics', icon: <BarChart size={20} />, path: 'analytics' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: 'messages' },
    { label: 'Settings', icon: <Settings size={20} />, path: 'settings' },
  ];

  const isActive = (itemPath, exact = false) => {
    const currentPath = location.pathname;
    if (exact) {
      return currentPath === `/landlord/dashboard${itemPath ? `/${itemPath}` : ''}`;
    }
    return currentPath.startsWith(`/landlord/dashboard/${itemPath}`);
  };

  const handleItemClick = (path) => {
    navigate(`/landlord/dashboard/${path}`);
    onClose();
  };

  return (
    <nav className="space-y-1">
      <div className="flex items-center mb-4 px-2">
        <Shield className="h-5 w-5 text-[#BC8BBC]" />
        <h2 className="ml-2 text-base font-semibold text-gray-900">Landlord Tools</h2>
      </div>
      
      {sidebarItems.map((item) => {
        const active = isActive(item.path, item.exact);
        return (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.path)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              active 
                ? 'bg-[#f4eaf4] text-[#8A5A8A] border-l-4 border-[#BC8BBC] pl-3' 
                : 'text-gray-700 hover:bg-[#f9f3f9] hover:text-[#8A5A8A]'
            }`}
          >
            <div className={active ? 'text-[#BC8BBC]' : 'text-gray-500'}>
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
            {active && (
              <div className="ml-auto w-2 h-2 rounded-full bg-[#BC8BBC] animate-pulse"></div>
            )}
          </button>
        );
      })}
    </nav>
  );
}