// src/components/Dashbaord/Landlord/LandlordHeader.jsx
import React, { useState, useEffect } from 'react';
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
  Shield,
  Eye,
  EyeOff,
  TrendingUp,
  Clock,
  AlertCircle,
  CreditCard
} from 'lucide-react';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../ui/Logo';
import api from '../../../api/axios'; 

const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return showSymbol ? 'RWF 0' : '0';
  const num = parseFloat(amount);
  
  if (num >= 1000000000) {
    return showSymbol ? `RWF ${(num / 1000000000).toFixed(1)}B` : `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return showSymbol ? `RWF ${(num / 1000000).toFixed(1)}M` : `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return showSymbol ? `RWF ${(num / 1000).toFixed(1)}K` : `${(num / 1000).toFixed(1)}K`;
  }
  
  return showSymbol 
    ? `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}` 
    : num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const formatFullAmount = (amount) => {
  if (amount === null || amount === undefined) return 'RWF 0';
  const num = parseFloat(amount);
  return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

export default function LandlordHeader() {
  const navigate = useNavigate();
  const { userType } = useIsanzureAuth();
  const { user, logoutUser } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isBalanceDropdownOpen, setIsBalanceDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  
  const [notifications, setNotifications] = useState({
    sidebar: {
      messages: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      bookingMessages: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      bookings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      activeBookings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      upcomingBookings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      payments: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      settings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      withdrawalVerification: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      propertyVerifications: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      tenants: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      system: { count: 0, hasUnread: false, dotColor: '#BC8BBC' }
    },
    summary: {
      totalUnread: 0,
      totalPending: 0
    }
  });
  
  const [balanceData, setBalanceData] = useState({
    current: {
      available: 0,
      pending: 0,
      on_hold: 0,
      frozen: 0,
      total: 0
    },
    stats: {
      pending_withdrawals: 0,
      pending_withdrawal_amount: 0,
      recent_transactions: 0,
      frozen_balances: 0
    },
    currency: 'RWF',
    last_updated: null
  });
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/counts/all');
        if (response.data.success && response.data.data) {
          setNotifications(prev => ({
            sidebar: {
              ...prev.sidebar,
              ...(response.data.data.sidebar || {})
            },
            summary: {
              ...prev.summary,
              ...(response.data.data.summary || {})
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      
      setIsLoadingBalance(true);
      setBalanceError(null);
      
      try {
        const response = await api.get('/isanzure/balance');
        
        if (response.data.success) {
          setBalanceData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        
        if (error.response?.status === 404) {
          setBalanceData({
            current: { available: 0, pending: 0, on_hold: 0, frozen: 0, total: 0 },
            stats: { pending_withdrawals: 0, pending_withdrawal_amount: 0, recent_transactions: 0, frozen_balances: 0 },
            currency: 'RWF',
            last_updated: new Date().toISOString()
          });
          setBalanceError(null);
        } else {
          setBalanceError('Failed to load balance');
        }
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const hasNotifications = () => {
    if (!notifications?.sidebar) return false;
    
    return (
      (notifications.sidebar.messages?.hasUnread || false) ||
      (notifications.sidebar.bookingMessages?.hasUnread || false) ||
      (notifications.sidebar.bookings?.hasUnread || false) ||
      (notifications.sidebar.payments?.hasUnread || false) ||
      (notifications.sidebar.settings?.hasUnread || false) ||
      (notifications.sidebar.withdrawalVerification?.hasUnread || false) ||
      (notifications.sidebar.propertyVerifications?.hasUnread || false) ||
      (notifications.sidebar.tenants?.hasUnread || false) ||
      (notifications.sidebar.system?.hasUnread || false)
    );
  };

  const getDisplayBalance = () => {
    if (!showBalance) return 'RWF •••••';
    return formatCurrency(balanceData.current.available);
  };

  const getBalanceColor = () => {
    const available = balanceData.current.available;
    if (available === 0) return 'text-gray-500';
    if (available < 5000) return 'text-orange-600';
    return 'text-gray-900';
  };
  
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
    { label: 'Wallet Overview', icon: <Wallet size={18} />, action: () => navigate('/landlord/dashboard/payments') },
    { label: 'Withdraw', icon: <DollarSign size={18} />, action: () => navigate('/landlord/dashboard/payments?action=withdraw') },
    { label: 'Transaction History', icon: <Clock size={18} />, action: () => navigate('/landlord/dashboard/payments?action=history') },
    { label: 'Payment Methods', icon: <CreditCard size={18} />, action: () => navigate('/landlord/dashboard/settings?tab=payments') }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            
            {/* Left: Mobile Menu Button & Logo */}
            <div className="flex items-center space-x-3 lg:space-x-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="flex items-center">
                <Logo className="h-8 w-auto" />
                <div className="hidden lg:block ml-4 pl-4 border-l border-gray-300">
                  <span className="text-sm font-medium text-gray-600">Landlord Center</span>
                </div>
              </div>
            </div>

            {/* Center: Wallet Balance - Always visible */}
            <div className="flex items-center justify-center flex-1">
              <div className="relative">
                <button
                  onClick={() => setIsBalanceDropdownOpen(!isBalanceDropdownOpen)}
                  className={`flex items-center space-x-2 lg:space-x-3 px-3 lg:px-5 py-2 lg:py-2.5 bg-white rounded-lg lg:rounded-xl border transition-all duration-200 group ${
                    isBalanceDropdownOpen 
                      ? 'border-[#BC8BBC] shadow-md' 
                      : 'border-gray-300 hover:border-[#BC8BBC] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-1 lg:space-x-2">
                    <Wallet className="h-4 w-4 lg:h-5 lg:w-5 text-[#8A5A8A]" />
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBalance(!showBalance);
                      }}
                      className="p-0.5 lg:p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {showBalance ? (
                        <EyeOff size={14} className="lg:hidden text-gray-400" />
                      ) : (
                        <Eye size={14} className="lg:hidden text-gray-400" />
                      )}
                      {showBalance ? (
                        <EyeOff size={16} className="hidden lg:block text-gray-400 hover:text-[#8A5A8A]" />
                      ) : (
                        <Eye size={16} className="hidden lg:block text-gray-400 hover:text-[#8A5A8A]" />
                      )}
                    </button>
                    
                    {isLoadingBalance ? (
                      <div className="w-16 lg:w-20 h-4 lg:h-5 bg-gray-200 rounded animate-pulse"></div>
                    ) : balanceError ? (
                      <span className="text-xs lg:text-sm text-red-500">Error</span>
                    ) : (
                      <span className={`text-sm lg:text-lg font-bold ${getBalanceColor()}`}>
                        <span className="lg:hidden">{formatCurrency(balanceData.current.available, false)}</span>
                        <span className="hidden lg:inline">{getDisplayBalance()}</span>
                      </span>
                    )}
                  </div>
                  
                  <ChevronDown 
                    size={14} 
                    className="lg:hidden text-gray-400 transition-transform duration-200 group-hover:text-[#BC8BBC]" 
                  />
                  <ChevronDown 
                    size={18} 
                    className={`hidden lg:block text-gray-400 transition-transform duration-200 group-hover:text-[#BC8BBC] ${
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
                    <div className="absolute right-0 mt-2 w-72 lg:w-80 bg-white rounded-xl shadow-lg z-40 border border-gray-200 py-2">
                      
                      {/* Balance Summary */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Available Balance</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowBalance(!showBalance);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                          >
                            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        
                        {isLoadingBalance ? (
                          <div className="space-y-2">
                            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ) : balanceError ? (
                          <div className="flex items-center space-x-2 text-red-500">
                            <AlertCircle size={16} />
                            <span className="text-sm">{balanceError}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-2xl font-bold text-gray-900">
                                {showBalance 
                                  ? formatFullAmount(balanceData.current.available)
                                  : 'RWF •••••••'
                                }
                              </span>
                              <span className="text-xs text-gray-500">RWF</span>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div className="bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock size={12} className="mr-1" />
                                  Pending
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {showBalance 
                                    ? formatCurrency(balanceData.current.pending, false)
                                    : '•••••'
                                  }
                                </span>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center text-xs text-gray-500">
                                  <AlertCircle size={12} className="mr-1" />
                                  On Hold
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {showBalance 
                                    ? formatCurrency(balanceData.current.on_hold, false)
                                    : '•••••'
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {balanceData.stats.pending_withdrawals > 0 && (
                              <div className="mt-2 flex items-center text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1">
                                <TrendingUp size={12} className="mr-1" />
                                {balanceData.stats.pending_withdrawals} pending withdrawal(s)
                                {showBalance && ` (${formatCurrency(balanceData.stats.pending_withdrawal_amount, false)})`}
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs text-gray-500">
                              Last updated: {balanceData.last_updated 
                                ? new Date(balanceData.last_updated).toLocaleTimeString() 
                                : 'Just now'
                              }
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Wallet Actions */}
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
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-500 group-hover:text-[#BC8BBC]">
                                {item.icon}
                              </span>
                              <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            <ChevronDown size={14} className="rotate-270 opacity-0 group-hover:opacity-100 text-[#BC8BBC] transition-opacity" />
                          </button>
                        ))}
                      </div>
                      
                      {/* Total Balance Footer */}
                      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total Balance</span>
                          <span className="text-sm font-bold text-gray-900">
                            {showBalance 
                              ? formatFullAmount(balanceData.current.total)
                              : 'RWF •••••••'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: User Profile with Notification Dot */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-xl border border-gray-300 hover:border-[#BC8BBC] hover:shadow-sm transition-all duration-200 bg-white relative"
                >
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
                    
                    {/* Notification dot on avatar */}
                    {hasNotifications() && (
                      <span 
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse border-2 border-white"
                        style={{ backgroundColor: '#BC8BBC' }}
                      ></span>
                    )}
                    
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>

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

                {/* User Dropdown Menu - NO WALLET */}
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
                            
                            {hasNotifications() && (
                              <span 
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse border-2 border-white"
                                style={{ backgroundColor: '#BC8BBC' }}
                              ></span>
                            )}
                          </div>
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
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 relative"
              >
                <div className="relative">
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
                  
                  {hasNotifications() && (
                    <span 
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse border-2 border-white"
                      style={{ backgroundColor: '#BC8BBC' }}
                    ></span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-72 bg-white z-40 shadow-xl overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <Logo className="h-7 w-auto" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
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
                    
                    {hasNotifications() && (
                      <span 
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse border-2 border-white"
                        style={{ backgroundColor: '#BC8BBC' }}
                      ></span>
                    )}
                  </div>
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

              <MobileSidebar 
                onClose={() => setIsMobileMenuOpen(false)} 
                notifications={notifications}
              />
            </div>
          </div>
        </>
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
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <div className="relative">
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
                  
                  {hasNotifications() && (
                    <span 
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse border-2 border-white"
                      style={{ backgroundColor: '#BC8BBC' }}
                    ></span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{getUserDisplayName()}</h3>
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-[#f4eaf4] text-[#8A5A8A] font-medium">
                      {userType || 'User'}
                    </span>
                  </div>
                </div>
              </div>

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

// Mobile Sidebar Component with Notification Dots
function MobileSidebar({ onClose, notifications }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getHasUnread = (type) => {
    return notifications?.sidebar?.[type]?.hasUnread ?? false;
  };

  const getItemHasUnread = (types) => {
    return types.some(type => notifications?.sidebar?.[type]?.hasUnread ?? false);
  };

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
        
        let hasNotification = false;
        if (item.label === 'Messages') {
          hasNotification = getItemHasUnread(['messages', 'bookingMessages']);
        } else if (item.label === 'Bookings') {
          hasNotification = getItemHasUnread(['bookings', 'activeBookings', 'upcomingBookings', 'bookingMessages']);
        } else if (item.label === 'Payments') {
          hasNotification = getHasUnread('payments');
        } else if (item.label === 'My Properties') {
          hasNotification = getHasUnread('propertyVerifications');
        } else if (item.label === 'Tenants') {
          hasNotification = getHasUnread('tenants');
        } else if (item.label === 'Settings') {
          hasNotification = getItemHasUnread(['settings', 'withdrawalVerification']);
        }
        
        return (
          <button
            key={item.label}
            onClick={() => handleItemClick(item.path)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${
              active 
                ? 'bg-[#f4eaf4] text-[#8A5A8A] border-l-4 border-[#BC8BBC] pl-3' 
                : 'text-gray-700 hover:bg-[#f9f3f9] hover:text-[#8A5A8A]'
            }`}
          >
            <div className="relative">
              <div className={active ? 'text-[#BC8BBC]' : 'text-gray-500'}>
                {item.icon}
              </div>
              
              {hasNotification && (
                <span 
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse border-2 border-white"
                  style={{ backgroundColor: '#BC8BBC' }}
                ></span>
              )}
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