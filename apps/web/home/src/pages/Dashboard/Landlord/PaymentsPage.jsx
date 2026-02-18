import React, { useState, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { format, parseISO, subDays, subMonths, subYears } from 'date-fns';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import { useAuth } from '../../../context/AuthContext';

// Import sub-components
import WithdrawalModal from './paymentpage/WithdrawalModal';
import OverviewTab from './paymentpage/OverviewTab';
import HistoryTab from './paymentpage/HistoryTab';
import WithdrawalsTab from './paymentpage/WithdrawalsTab';

// Toast functions
const showError = (title, message, details = null) => {
  toast.error(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-800">{title}</p>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {details && (
            <p className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
              {details}
            </p>
          )}
        </div>
      </div>
    </div>,
    {
      duration: 6000,
      style: {
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

const showSuccess = (title, message) => {
  toast.success(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">{title}</p>
          <p className="text-sm text-green-700 mt-1">{message}</p>
        </div>
      </div>
    </div>,
    {
      duration: 5000,
      style: {
        background: '#dcfce7',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

const showInfo = (title, message) => {
  toast(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-800">{title}</p>
          <p className="text-sm text-blue-700 mt-1">{message}</p>
        </div>
      </div>
    </div>,
    {
      duration: 4000,
      style: {
        background: '#dbeafe',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

// Formatter functions
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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy • h:mm a');
  } catch {
    return dateString;
  }
};

const formatPhoneNumber = (value) => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `+${cleaned}`;
  if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)}`;
};

export default function PaymentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useIsanzureAuth();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [balanceData, setBalanceData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    has_more: false
  });
  const [filters, setFilters] = useState({
    dateRange: '30days',
    type: 'all'
  });

  // Landlord name from auth context (like in LandlordHeader)
  const [landlordName, setLandlordName] = useState('Landlord');

  // Withdrawal account
  const [withdrawalAccount, setWithdrawalAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Format user name like in LandlordHeader
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user?.first_name) {
      return user.first_name;
    } else if (user?.username) {
      return user.username;
    }
    return "Landlord";
  };

  // Set landlord name from auth context
  useEffect(() => {
    if (user) {
      setLandlordName(getUserDisplayName());
    }
  }, [user]);

  // Check URL params for actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');

    if (action === 'withdraw') {
      setShowWithdrawalModal(true);
    } else if (action === 'history') {
      setActiveTab('history');
    }
  }, [location]);

  // Fetch withdrawal account from settings
  const fetchWithdrawalAccount = async () => {
    setLoadingAccount(true);
    try {
      const response = await api.get('/isanzure/settings');

      if (response.data.success && response.data.data?.withdrawal?.method) {
        const withdrawal = response.data.data.withdrawal;
        setWithdrawalAccount({
          method: withdrawal.method,
          verified: withdrawal.verified,
          set_at: withdrawal.set_at,
          requires_verification: withdrawal.requires_verification
        });
      } else {
        setWithdrawalAccount(null);
      }
    } catch (error) {
      console.error('Error fetching withdrawal account:', error);
      setWithdrawalAccount(null);
    } finally {
      setLoadingAccount(false);
    }
  };

  // Fetch balance data (like in LandlordHeader)
  const fetchBalance = async () => {
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
      }
    }
  };

  // Fetch transactions with filters
  const fetchTransactions = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);

      const params = new URLSearchParams({
        page: pageNum,
        limit: pagination.limit,
        days: filters.dateRange === '7days' ? 7 :
          filters.dateRange === '30days' ? 30 :
            filters.dateRange === '90days' ? 90 :
              filters.dateRange === 'year' ? 365 : 30,
        change_type: filters.type === 'all' ? 'all' : filters.type
      });

      const response = await api.get(`/isanzure/balance/history?${params}`);

      if (response.data.success) {
        const newTransactions = response.data.data.history || [];
        setTransactions(prev => append ? [...prev, ...newTransactions] : newTransactions);
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch withdrawals
  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/isanzure/balance/withdrawals?status=all');
      if (response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/isanzure/balance/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Load all data
  const loadAllData = () => {
    fetchBalance();
    fetchTransactions(1);
    fetchWithdrawals();
    fetchStats();
    fetchWithdrawalAccount();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle tab change
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions(1);
    } else if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [activeTab]);

  // Handle filter change
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions(1);
    }
  }, [filters]);

  // Handle successful withdrawal
  const handleWithdrawalSuccess = () => {
    fetchWithdrawals();
    fetchBalance();
    setShowWithdrawalModal(false);
    setActiveTab('withdrawals');
  };

  // Handle cancel withdrawal
  const handleCancelWithdrawal = async (withdrawalUid) => {
    try {
      const response = await api.post(`/isanzure/balance/withdrawals/${withdrawalUid}/cancel`);

      if (response.data.success) {
        showSuccess('Withdrawal Cancelled', 'Your withdrawal request has been cancelled');
        fetchWithdrawals();
        fetchBalance();
      }
    } catch (error) {
      console.error('Cancel withdrawal error:', error);
      showError('Cancel Failed', 'Failed to cancel withdrawal');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-[#BC8BBC]" />
            Payments & Wallet
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your balance, withdrawals, and transaction history
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowWithdrawalModal(true)}
            disabled={loadingAccount}
            className="flex items-center gap-2 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingAccount ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <DollarSign size={18} />
            )}
            Withdraw Funds
          </button>

          <button
            onClick={() => {
              loadAllData();
              showSuccess('Refreshed', 'Data updated successfully');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-700">Available Balance</h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                  {showBalance
                    ? formatFullAmount(balanceData?.current?.available || 0)
                    : 'RWF •••••••'
                  }
                </span>
                <span className="text-gray-500">RWF</span>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Last updated: {balanceData?.last_updated
                  ? format(new Date(balanceData.last_updated), 'MMM d, yyyy • h:mm a')
                  : 'Just now'
                }
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="font-semibold text-gray-700">
                  {showBalance
                    ? formatCurrency(balanceData?.current?.pending || 0, false)
                    : '•••••'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">On Hold</p>
                <p className="font-semibold text-gray-700">
                  {showBalance
                    ? formatCurrency(balanceData?.current?.on_hold || 0, false)
                    : '•••••'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-semibold text-gray-700">
                  {showBalance
                    ? formatCurrency(balanceData?.current?.total || 0, false)
                    : '•••••'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'overview'
                  ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'history'
                  ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'withdrawals'
                  ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Withdrawals
              {balanceData?.stats?.pending_withdrawals > 0 && (
                <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {balanceData.stats.pending_withdrawals}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeTab === 'overview' && (
            <OverviewTab 
              stats={stats}
              balanceData={balanceData}
              transactions={transactions}
              showBalance={showBalance}
              onViewAll={() => setActiveTab('history')}
              formatFullAmount={formatFullAmount}
              formatDate={formatDate}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab 
              transactions={transactions}
              loading={loading}
              pagination={pagination}
              filters={filters}
              setFilters={setFilters}
              onLoadMore={() => fetchTransactions(pagination.page + 1, true)}
              formatFullAmount={formatFullAmount}
              formatDate={formatDate}
              formatPhoneNumber={formatPhoneNumber}
            />
          )}

          {activeTab === 'withdrawals' && (
            <WithdrawalsTab 
              withdrawals={withdrawals}
              balanceData={balanceData}
              showBalance={showBalance}
              onWithdraw={() => setShowWithdrawalModal(true)}
              onCancelWithdrawal={handleCancelWithdrawal}
              formatFullAmount={formatFullAmount}
              formatDate={formatDate}
              formatPhoneNumber={formatPhoneNumber}
              landlordName={landlordName} // ← Real landlord name from auth context
            />
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={handleWithdrawalSuccess}
        maxAmount={balanceData?.current?.available || 0}
        withdrawalAccount={withdrawalAccount}
        formatFullAmount={formatFullAmount}
        formatCurrency={formatCurrency}
        formatPhoneNumber={formatPhoneNumber}
        landlordName={landlordName} 
      />
    </div>
  );
}