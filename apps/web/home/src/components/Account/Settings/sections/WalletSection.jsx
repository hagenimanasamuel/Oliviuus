// src/components/Account/Settings/sections/WalletSection.jsx
import React, { useState, useEffect } from 'react';
import { 
  Wallet, DollarSign, Eye, EyeOff, 
  Loader2, Lock, KeyRound, ArrowLeftRight,
  CreditCard as CreditCardIcon, History
} from 'lucide-react';
import api from '../../../../api/axios';
import { useNavigate } from 'react-router-dom';
import WithdrawalModal from '../WithdrawalModal';
import WithdrawalAccountSection from './WithdrawalAccountSection';
import TransactionsTab from './wallet/TransactionsTab';
import WithdrawalHistoryTab from './wallet/WithdrawalHistoryTab';

export default function WalletSection({ showNotification, refreshAllData, onSaveWithdrawal, accountSettings }) {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAccount, setWithdrawalAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions', 'account', 'withdrawals'

  const navigate = useNavigate();
  const userHasPin = accountSettings?.security?.has_pin || false;

  // ✅ FIX: Properly extract user name from accountSettings
  const getUserName = () => {
    if (accountSettings?.user?.full_name) {
      return accountSettings.user.full_name;
    }
    if (accountSettings?.user?.first_name || accountSettings?.user?.last_name) {
      return `${accountSettings.user.first_name || ''} ${accountSettings.user.last_name || ''}`.trim();
    }
    // Try to get from the structure that landlord uses
    if (accountSettings?.user?.name) {
      return accountSettings.user.name;
    }
    return 'Tenant';
  };

  const getUserEmail = () => {
    return accountSettings?.contact?.public_email || 
           accountSettings?.user?.email || 
           '';
  };

  const getUserPhone = () => {
    return accountSettings?.contact?.public_phone || 
           accountSettings?.user?.phone || 
           '';
  };

  const userName = getUserName();
  const userEmail = getUserEmail();
  const userPhone = getUserPhone();

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    fetchWithdrawals();
    
    if (accountSettings?.withdrawal?.method) {
      setWithdrawalAccount(accountSettings.withdrawal);
    }
  }, [accountSettings]);

  const fetchBalance = async () => {
    try {
      const res = await api.get('/isanzure/balance');
      if (res.data.success) setBalance(res.data.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/isanzure/balance/history?limit=10');
      if (res.data.success) {
        console.log('Transactions fetched:', res.data.data.history); // Debug log
        setTransactions(res.data.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await api.get('/isanzure/balance/tenant/withdrawals?status=all');
      if (res.data.success) {
        console.log('Withdrawals fetched:', res.data.data.withdrawals); // Debug log
        setWithdrawals(res.data.data.withdrawals || []);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'RWF 0';
    const num = parseFloat(amount);
    return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleWithdraw = () => {
    if (!withdrawalAccount) {
      showNotification('Please set up a refund account first', 'info');
      setActiveTab('account');
    } else if (!userHasPin) {
      showNotification('Please set up your PIN first', 'info');
      navigate('/account/settings/pin');
    } else {
      setShowWithdrawalModal(true);
    }
  };

  const handleWithdrawalSuccess = () => {
    setShowWithdrawalModal(false);
    fetchBalance();
    fetchTransactions();
    fetchWithdrawals();
    showNotification('Withdrawal request submitted', 'success');
  };

  const handleCancelWithdrawal = async (withdrawalUid) => {
    try {
      const response = await api.post(`/isanzure/balance/tenant/withdrawals/${withdrawalUid}/cancel`);
      if (response.data.success) {
        showNotification('Withdrawal cancelled successfully', 'success');
        fetchWithdrawals();
        fetchBalance();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to cancel withdrawal', 'error');
    }
  };

  const handleAccountChange = () => {
    if (refreshAllData) {
      refreshAllData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card - Always on top */}
      <div className="bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={24} />
            <h3 className="font-semibold">Your Balance</h3>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/80">Available</span>
            <span className="text-2xl font-bold">
              {showBalance ? formatCurrency(balance?.current?.available) : 'RWF •••••'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Pending</span>
            <span>{showBalance ? formatCurrency(balance?.current?.pending) : '•••••'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/80">On hold</span>
            <span>{showBalance ? formatCurrency(balance?.current?.on_hold) : '•••••'}</span>
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          className="mt-4 w-full py-2 bg-white text-[#BC8BBC] rounded-lg font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
        >
          <DollarSign size={18} />
          Withdraw Funds
        </button>
      </div>

      {/* PIN Setup Reminder */}
      {!userHasPin && !withdrawalAccount && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Lock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 mb-1">Secure Your Account</h4>
              <p className="text-sm text-yellow-700 mb-2">
                Set up a PIN to protect your refund account and withdrawals.
              </p>
              <button
                onClick={() => navigate('/account/settings/pin')}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-800 flex items-center gap-1"
              >
                <KeyRound className="w-4 h-4" />
                Set Up PIN Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
              activeTab === 'transactions'
                ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ArrowLeftRight size={18} />
            Recent Transactions
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
              activeTab === 'account'
                ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCardIcon size={18} />
            Refund Account
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-3 px-1 font-medium text-sm transition-colors relative flex items-center gap-2 ${
              activeTab === 'withdrawals'
                ? 'text-[#BC8BBC] border-b-2 border-[#BC8BBC]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History size={18} />
            Withdrawal History
            {withdrawals.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-[#BC8BBC] text-white rounded-full">
                {withdrawals.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Recent Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            loading={loading}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        {/* Refund Account Tab */}
        {activeTab === 'account' && (
          <WithdrawalAccountSection
            accountSettings={accountSettings}
            showNotification={showNotification}
            refreshAllData={refreshAllData}
            onAccountChange={handleAccountChange}
          />
        )}

        {/* Withdrawal History Tab */}
        {activeTab === 'withdrawals' && (
          <WithdrawalHistoryTab
            withdrawals={withdrawals}
            loading={withdrawalsLoading}
            onCancel={handleCancelWithdrawal}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            userName={userName}
            userEmail={userEmail}
            userPhone={userPhone}
            showBalance={showBalance}
            pendingWithdrawalsCount={balance?.stats?.pending_withdrawals || 0}
            pendingWithdrawalsAmount={balance?.stats?.pending_withdrawal_amount || 0}
          />
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={handleWithdrawalSuccess}
        maxAmount={balance?.current?.available || 0}
        withdrawalAccount={withdrawalAccount}
        formatCurrency={formatCurrency}
        formatPhoneNumber={(p) => p}
        userHasPin={userHasPin}
      />
    </div>
  );
}