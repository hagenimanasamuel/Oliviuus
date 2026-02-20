import React, { useState } from 'react';
import { 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Loader, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Info,
  Building,
  Smartphone,
  CreditCard,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';

export default function HistoryTab({ 
  transactions, 
  loading, 
  pagination, 
  filters, 
  setFilters, 
  onLoadMore,
  formatFullAmount,
  formatDate,
  formatPhoneNumber
}) {
  const [showFilters, setShowFilters] = useState(false);

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'processing': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Get method icon and display name
  const getMethodInfo = (method) => {
    switch(method) {
      case 'bk':
        return { 
          icon: <Building className="h-4 w-4" />, 
          name: 'Bank of Kigali',
          bg: 'bg-blue-100 text-blue-700'
        };
      case 'equity':
        return { 
          icon: <Building className="h-4 w-4" />, 
          name: 'Equity Bank',
          bg: 'bg-purple-100 text-purple-700'
        };
      case 'mtn':
        return { 
          icon: <Smartphone className="h-4 w-4" />, 
          name: 'MTN Mobile Money',
          bg: 'bg-yellow-100 text-yellow-700'
        };
      case 'airtel':
        return { 
          icon: <Smartphone className="h-4 w-4" />, 
          name: 'Airtel Money',
          bg: 'bg-red-100 text-red-700'
        };
      default:
        return { 
          icon: <CreditCard className="h-4 w-4" />, 
          name: method,
          bg: 'bg-gray-100 text-gray-700'
        };
    }
  };

  // Mask sensitive data
  const maskAccountNumber = (number) => {
    if (!number) return null;
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length <= 4) return '••••';
    const last4 = cleaned.slice(-4);
    return `•••• •••• ${last4}`;
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return '••••••••';
    const last4 = cleaned.slice(-4);
    return `•••• •••• ${last4}`;
  };

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#BC8BBC] transition-colors"
        >
          <Filter size={16} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="year">Last year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Info className="h-3 w-3 inline mr-1" />
                Transaction Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              >
                <option value="all">All Transactions</option>
                <option value="credit">Credits Only (Money In)</option>
                <option value="debit">Debits Only (Money Out)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TransactionRow 
                  key={transaction.uid || transaction.id} 
                  transaction={transaction}
                  formatFullAmount={formatFullAmount}
                  formatDate={formatDate}
                  formatPhoneNumber={formatPhoneNumber}
                  getStatusBadge={getStatusBadge}
                  getMethodInfo={getMethodInfo}
                  maskAccountNumber={maskAccountNumber}
                  maskPhoneNumber={maskPhoneNumber}
                />
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {filters.type !== 'all' || filters.dateRange !== '30days' 
                    ? 'Try adjusting your filters to see more transactions'
                    : 'Your transaction history will appear here once you start making payments or receiving funds'}
                </p>
              </div>
            )}
          </div>

          {/* Load More */}
          {pagination.has_more && transactions.length > 0 && (
            <div className="p-4 text-center border-t border-gray-200">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="px-6 py-2 text-sm text-[#BC8BBC] hover:text-[#8A5A8A] font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Loading more...
                  </span>
                ) : (
                  'Load More Transactions'
                )}
              </button>
            </div>
          )}

          {/* Transaction count */}
          {transactions.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Showing {transactions.length} of {pagination.total} transactions
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TransactionRow({ 
  transaction, 
  formatFullAmount, 
  formatDate, 
  formatPhoneNumber,
  getStatusBadge, 
  getMethodInfo,
  maskAccountNumber,
  maskPhoneNumber
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  // Handle different transaction structures
  const isCredit = transaction.change?.amount > 0 || transaction.change_type === 'credit';
  const isDebit = transaction.change?.amount < 0 || transaction.change_type === 'debit';
  const transactionType = transaction.transaction?.type || transaction.change_type || 'unknown';
  
  // Get amount
  const amount = transaction.change?.amount || transaction.amount || 0;
  
  // Get status
  const status = transaction.transaction?.status || transaction.change?.type || transaction.status || 'completed';
  
  // Get reason/description
  const reason = transaction.reason || transaction.description || 'Transaction';
  
  // Get metadata for additional info
  const metadata = transaction.metadata || transaction.change?.metadata || null;

  // Check if it's a withdrawal
  const isWithdrawal = reason?.toLowerCase().includes('withdrawal') || transactionType === 'withdrawal';
  const hasFee = metadata?.fee_amount > 0;

  // Get withdrawal method if available
  const withdrawalMethod = transaction.transaction?.payment_method || metadata?.method;
  const methodInfo = withdrawalMethod ? getMethodInfo(withdrawalMethod) : null;

  // Account details from transaction
  const accountDetails = transaction.account_details || metadata?.account_details || null;

  return (
    <div className="hover:bg-gray-50 transition-colors">
      {/* Main row - clickable */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-start gap-3">
          {/* Icon with method color if withdrawal */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isWithdrawal && methodInfo ? methodInfo.bg : 
            isCredit ? 'bg-green-100' : 
            isDebit ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {isWithdrawal && methodInfo ? methodInfo.icon : 
             isCredit ? <ArrowUpRight className="h-4 w-4 text-green-600" /> :
             isDebit ? <ArrowDownLeft className="h-4 w-4 text-red-600" /> :
             <Clock className="h-4 w-4 text-gray-600" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              {/* Left side */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">
                    {reason}
                  </p>
                  {isWithdrawal && methodInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${methodInfo.bg}`}>
                      {methodInfo.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(transaction.created_at)}
                </p>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                    {isCredit ? '+' : '-'}
                    {formatFullAmount(Math.abs(amount))}
                  </p>
                  {isWithdrawal && metadata?.net_amount && (
                    <p className="text-xs text-gray-500">
                      You receive: {formatFullAmount(metadata.net_amount)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                  {showDetails ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {showDetails && (
        <div className="px-4 pb-4 pl-[68px] pr-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
            
            {/* Withdrawal Account Details - Only show method and masked info */}
            {isWithdrawal && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#BC8BBC]" />
                    Withdrawal Account
                  </h4>
                  <button
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="text-xs text-gray-500 hover:text-[#BC8BBC] flex items-center gap-1"
                  >
                    {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSensitive ? 'Hide' : 'Show'} details
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Method - Always visible */}
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <div className="flex items-center gap-2 mt-1">
                      {methodInfo && (
                        <>
                          <span className={`p-1.5 rounded-full ${methodInfo.bg}`}>
                            {methodInfo.icon}
                          </span>
                          <span className="font-medium text-gray-900">
                            {methodInfo.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Account Name - Masked unless revealed */}
                  {accountDetails?.name && (
                    <div>
                      <p className="text-xs text-gray-500">Account Name</p>
                      <p className="font-medium text-gray-900">
                        {showSensitive ? accountDetails.name : '••••••••'}
                      </p>
                    </div>
                  )}

                  {/* Account Number / Phone - Masked unless revealed */}
                  {withdrawalMethod === 'bk' || withdrawalMethod === 'equity' ? (
                    accountDetails?.number && (
                      <div>
                        <p className="text-xs text-gray-500">Account Number</p>
                        <p className="font-mono text-gray-900">
                          {showSensitive ? accountDetails.number : maskAccountNumber(accountDetails.number)}
                        </p>
                      </div>
                    )
                  ) : (
                    accountDetails?.phone && (
                      <div>
                        <p className="text-xs text-gray-500">Phone Number</p>
                        <p className="font-mono text-gray-900">
                          {showSensitive ? formatPhoneNumber(accountDetails.phone) : maskPhoneNumber(accountDetails.phone)}
                        </p>
                      </div>
                    )
                  )}

                  {/* Bank Name for bank transfers */}
                  {accountDetails?.bank && (
                    <div>
                      <p className="text-xs text-gray-500">Bank</p>
                      <p className="font-medium text-gray-900">
                        {showSensitive ? accountDetails.bank : '••••••••'}
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Shield size={12} />
                  Your full account details are encrypted. Click the eye icon to reveal.
                </p>
              </div>
            )}

            {/* Transaction IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t border-gray-200 pt-3">
              {transaction.uid && (
                <div>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <p className="font-mono text-xs text-gray-700">{transaction.uid}</p>
                </div>
              )}
              {transaction.transaction?.uid && (
                <div>
                  <p className="text-xs text-gray-500">Reference</p>
                  <p className="font-mono text-xs text-gray-700">{transaction.transaction.uid}</p>
                </div>
              )}
            </div>

            {/* Balance changes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-t border-gray-200 pt-3">
              {transaction.previous_balance !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Previous Balance</p>
                  <p className="font-medium text-gray-900">{formatFullAmount(transaction.previous_balance)}</p>
                </div>
              )}
              {transaction.new_balance !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">New Balance</p>
                  <p className="font-medium text-gray-900">{formatFullAmount(transaction.new_balance)}</p>
                </div>
              )}
            </div>

            {/* Fee breakdown for withdrawals */}
            {isWithdrawal && metadata && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Withdrawal Breakdown</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {metadata.fee_percentage && (
                    <div>
                      <p className="text-xs text-gray-500">Fee Percentage</p>
                      <p className="font-medium text-gray-900">{metadata.fee_percentage}%</p>
                    </div>
                  )}
                  {metadata.fee_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Fee Amount</p>
                      <p className="font-medium text-red-600">{formatFullAmount(metadata.fee_amount)}</p>
                    </div>
                  )}
                  {metadata.net_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">You Receive</p>
                      <p className="font-medium text-green-600">{formatFullAmount(metadata.net_amount)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}