import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function OverviewTab({ 
  stats, 
  balanceData, 
  transactions, 
  showBalance, 
  onViewAll,
  formatFullAmount,
  formatDate
}) {
  return (
    <div className="p-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-3">Period Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net Change</span>
                <span className={`font-semibold ${stats.period?.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showBalance
                    ? formatFullAmount(Math.abs(stats.period?.net_change || 0))
                    : 'RWF •••••'
                  }
                  {stats.period?.net_change >= 0 ? ' ↑' : ' ↓'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Largest Transaction</span>
                <span className="font-semibold text-gray-900">
                  {showBalance
                    ? formatFullAmount(stats.period?.largest || 0)
                    : 'RWF •••••'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-700 mb-3">Withdrawal Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending Withdrawals</span>
                <span className="font-semibold text-orange-600">
                  {balanceData?.stats?.pending_withdrawals || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending Amount</span>
                <span className="font-semibold text-orange-600">
                  {showBalance
                    ? formatFullAmount(balanceData?.stats?.pending_withdrawal_amount || 0)
                    : 'RWF •••••'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions Preview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-700">Recent Transactions</h4>
          <button
            onClick={onViewAll}
            className="text-sm text-[#BC8BBC] hover:text-[#8A5A8A]"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {transactions.slice(0, 5).map((transaction) => (
            <TransactionRow 
              key={transaction.uid} 
              transaction={transaction}
              formatFullAmount={formatFullAmount}
              formatDate={formatDate}
            />
          ))}

          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ transaction, formatFullAmount, formatDate }) {
  const isCredit = transaction.change?.amount > 0;
  const isDebit = transaction.change?.amount < 0;

  const getIcon = () => {
    if (isCredit) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (isDebit) return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getBgColor = () => {
    if (isCredit) return 'bg-green-100';
    if (isDebit) return 'bg-red-100';
    return 'bg-gray-100';
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${getBgColor()} flex items-center justify-center flex-shrink-0`}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900">{transaction.reason}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(transaction.created_at)}
              </p>
            </div>

            <div className="text-right">
              <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                {isCredit ? '+' : '-'}
                {formatFullAmount(Math.abs(transaction.change?.amount || 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}