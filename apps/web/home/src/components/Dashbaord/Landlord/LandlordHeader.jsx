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

// Format currency helper
const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) return showSymbol ? 'RWF 0' : '0';
  
  // Handle large numbers with K, M, B suffixes for compact display
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
  
  // For smaller numbers, show full amount with commas
  return showSymbol 
    ? `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}` 
    : num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

// Format full amount for tooltip/detailed view
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
  const [showBalance, setShowBalance] = useState(false); // Toggle balance visibility
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

  // Fetch balance data using the configured api instance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      
      setIsLoadingBalance(true);
      setBalanceError(null);
      
      try {
        // Using the configured api instance which already has the baseURL and headers
        const response = await api.get('/isanzure/balance');
        
        if (response.data.success) {
          setBalanceData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          setBalanceError('Session expired. Please login again.');
        } else if (error.response?.status === 404) {
          // User has no balance yet - that's ok, use defaults
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

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Format balance display based on visibility
  const getDisplayBalance = () => {
    if (!showBalance) return 'RWF •••••';
    return formatCurrency(balanceData.current.available);
  };

  // Get balance color based on amount
  const getBalanceColor = () => {
    const available = balanceData.current.available;
    if (available === 0) return 'text-gray-500';
    if (available < 5000) return 'text-orange-600';
    return 'text-gray-900';
  };
  
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
    { label: 'Add Funds', icon: <PlusCircle size={18} />, action: () => navigate('/landlord/dashboard/payments?action=deposit') },
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
                  className={`flex items-center space-x-3 px-5 py-2.5 bg-white rounded-xl border transition-all duration-200 group ${
                    isBalanceDropdownOpen 
                      ? 'border-[#BC8BBC] shadow-md' 
                      : 'border-gray-300 hover:border-[#BC8BBC] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-[#8A5A8A]" />
                    
                    {/* Eye toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBalance(!showBalance);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                    >
                      {showBalance ? (
                        <EyeOff size={16} className="text-gray-400 hover:text-[#8A5A8A]" />
                      ) : (
                        <Eye size={16} className="text-gray-400 hover:text-[#8A5A8A]" />
                      )}
                    </button>
                    
                    {/* Loading state */}
                    {isLoadingBalance ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ) : balanceError ? (
                      <span className="text-sm text-red-500">Error</span>
                    ) : (
                      <span className={`text-lg font-bold ${getBalanceColor()}`}>
                        {getDisplayBalance()}
                      </span>
                    )}
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
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-40 border border-gray-200 py-2">
                      
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
                            
                            {/* Balance Breakdown */}
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
                            
                            {/* Quick Stats */}
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

            {/* Right: Desktop User Profile */}
            <div className="hidden lg:flex items-center space-x-4">
              
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

                {/* User Dropdown Menu */}
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
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Balance Preview */}
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Balance</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowBalance(!showBalance);
                              }}
                              className="text-gray-400 hover:text-[#8A5A8A]"
                            >
                              {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Wallet size={14} className="text-[#8A5A8A]" />
                            <span className="font-semibold text-gray-900">
                              {isLoadingBalance 
                                ? '...' 
                                : showBalance 
                                  ? formatCurrency(balanceData.current.available)
                                  : 'RWF •••••'
                              }
                            </span>
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
                {isLoadingBalance ? (
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className={`font-bold text-sm ${getBalanceColor()}`}>
                    {getDisplayBalance()}
                  </span>
                )}
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
                
                {/* Mobile Balance Preview */}
                <div className="mt-3 flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Wallet size={16} className="text-[#8A5A8A]" />
                    <span className="text-xs text-gray-600">Balance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-gray-400"
                    >
                      {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <span className="font-semibold text-gray-900">
                      {isLoadingBalance ? '...' : getDisplayBalance()}
                    </span>
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
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-6 z-40 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Wallet</h3>
              <button
                onClick={() => setIsBalanceDropdownOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            {isLoadingBalance ? (
              <div className="space-y-4">
                <div className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            ) : balanceError ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle size={48} className="mx-auto mb-2" />
                <p>{balanceError}</p>
              </div>
            ) : (
              <>
                {/* Balance Card */}
                <div className="p-4 bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] rounded-xl border border-[#BC8BBC] mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5 text-[#8A5A8A]" />
                      <span className="text-sm font-medium text-gray-700">Available Balance</span>
                    </div>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 bg-white rounded-lg"
                    >
                      {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {showBalance 
                      ? formatFullAmount(balanceData.current.available)
                      : 'RWF •••••••'
                    }
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="text-xs text-gray-600">Pending</span>
                      <p className="font-semibold text-gray-800">
                        {showBalance ? formatCurrency(balanceData.current.pending, false) : '•••••'}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-2">
                      <span className="text-xs text-gray-600">On Hold</span>
                      <p className="font-semibold text-gray-800">
                        {showBalance ? formatCurrency(balanceData.current.on_hold, false) : '•••••'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet Actions */}
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
                      <div className="flex items-center space-x-3">
                        <span className="text-[#8A5A8A]">{item.icon}</span>
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 rotate-270" />
                    </button>
                  ))}
                </div>

                {/* Total Balance Footer */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Balance</span>
                    <span className="text-lg font-bold text-gray-900">
                      {showBalance 
                        ? formatFullAmount(balanceData.current.total)
                        : 'RWF •••••••'
                      }
                    </span>
                  </div>
                </div>
              </>
            )}
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

              {/* Quick Balance */}
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Your Balance</span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-gray-400"
                  >
                    {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingBalance ? '...' : getDisplayBalance()}
                </p>
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