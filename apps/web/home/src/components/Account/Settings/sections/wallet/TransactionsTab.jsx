// src/components/Account/Settings/sections/TransactionsTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Clock, 
  Wallet, Loader2, CheckCircle, XCircle,
  Home, CreditCard, Smartphone, ChevronDown
} from 'lucide-react';
import api from '../../../../../api/axios';

export default function TransactionsTab({ formatCurrency, formatDate }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    has_more: false
  });

  useEffect(() => {
    fetchTransactions(1, true);
  }, []);

  const fetchTransactions = async (pageNum = 1, reset = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.get(`/isanzure/balance/tenant/transactions?page=${pageNum}&limit=10&status=${filter}`);
      console.log('📊 Transactions API Response:', res.data);
      
      if (res.data.success) {
        const newTransactions = res.data.data.transactions || [];
        
        setTransactions(prev => reset ? newTransactions : [...prev, ...newTransactions]);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle filter change
  useEffect(() => {
    fetchTransactions(1, true);
  }, [filter]);

  const handleLoadMore = () => {
    if (pagination.has_more && !loadingMore) {
      fetchTransactions(pagination.page + 1, false);
    }
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.type === 'rent_payment') {
      return <Home className="text-blue-600" size={16} />;
    } else if (transaction.type === 'withdrawal') {
      return <ArrowUpRight className="text-red-600" size={16} />;
    } else if (transaction.type === 'refund') {
      return <ArrowDownLeft className="text-green-600" size={16} />;
    } else if (transaction.type === 'deposit') {
      return <Wallet className="text-purple-600" size={16} />;
    } else {
      return transaction.direction === 'credit' 
        ? <ArrowDownLeft className="text-green-600" size={16} />
        : <ArrowUpRight className="text-red-600" size={16} />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'mobile_money': return <Smartphone size={12} className="text-gray-500" />;
      case 'card': return <CreditCard size={12} className="text-gray-500" />;
      case 'balance': return <Wallet size={12} className="text-gray-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Completed' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
      'failed': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Failed' },
      'cancelled': { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle, label: 'Cancelled' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getTransactionDescription = (tx) => {
    if (tx.description) {
      return tx.description;
    }
    
    if (tx.type === 'rent_payment') {
      if (tx.booking?.property) {
        return `Rent payment for ${tx.booking.property}`;
      }
      if (tx.notes?.property_title) {
        return `Rent payment for ${tx.notes.property_title}`;
      }
      return 'Rent payment';
    } else if (tx.type === 'withdrawal') {
      return 'Withdrawal to bank account';
    } else if (tx.type === 'refund') {
      return `Refund from ${tx.counterparty?.name || 'landlord'}`;
    } else if (tx.type === 'deposit') {
      return 'Security deposit payment';
    }
    
    return 'Transaction';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-[#BC8BBC]" />
            Transaction History
            {pagination.total > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({pagination.total} total)
              </span>
            )}
          </h4>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {['all', 'completed', 'pending', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === f
                    ? 'bg-[#BC8BBC] text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#BC8BBC]" size={24} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((tx) => {
                const status = getStatusBadge(tx.status);
                const StatusIcon = status.icon;
                
                return (
                  <div key={tx.uid} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-[#BC8BBC] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.direction === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getTransactionIcon(tx)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">
                            {getTransactionDescription(tx)}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.text}`}>
                            {StatusIcon && <StatusIcon size={10} />}
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-gray-500">
                            {formatDate(tx.created_at)}
                          </p>
                          {tx.payment_method && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <div className="flex items-center gap-1">
                                {getPaymentMethodIcon(tx.payment_method)}
                                <span className="text-xs text-gray-600 capitalize">
                                  {tx.payment_method.replace('_', ' ')}
                                </span>
                              </div>
                            </>
                          )}
                          {tx.counterparty?.name && tx.counterparty.name !== 'Unknown' && tx.counterparty.name.trim() !== '' && (
                            <>
                              <span className="text-xs text-gray-300">•</span>
                              <p className="text-xs text-gray-600">
                                {tx.direction === 'credit' ? 'From: ' : 'To: '}
                                <span className="font-medium text-gray-700">{tx.counterparty.name}</span>
                              </p>
                            </>
                          )}
                        </div>
                        {tx.booking?.reference && (
                          <p className="text-xs text-gray-400 mt-1">
                            Ref: {tx.booking.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block font-medium ${
                        tx.direction === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {pagination.has_more && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Load More ({pagination.total - transactions.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Showing X of Y */}
            {pagination.total > 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Showing {transactions.length} of {pagination.total} transactions
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}