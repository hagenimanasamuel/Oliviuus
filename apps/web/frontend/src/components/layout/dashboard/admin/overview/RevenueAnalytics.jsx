import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function RevenueAnalytics({ data }) {
  const paymentStats = data?.paymentStats || {};

  const revenueMetrics = [
    {
      label: 'Total Revenue',
      value: `RWF ${(paymentStats.total_revenue || 0).toLocaleString()}`,
      description: 'All-time total revenue',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      label: '30-Day Revenue',
      value: `RWF ${(paymentStats.revenue_30d || 0).toLocaleString()}`,
      description: 'Revenue from last 30 days',
      icon: TrendingUp,
      color: 'text-blue-500'
    },
    {
      label: 'Successful Payments',
      value: paymentStats.successful_payments || 0,
      description: 'Completed transactions',
      icon: CheckCircle,
      color: 'text-emerald-500'
    },
    {
      label: 'Failed Payments',
      value: paymentStats.failed_payments || 0,
      description: 'Failed transactions',
      icon: AlertCircle,
      color: 'text-red-500'
    }
  ];

  const successRate = paymentStats.total_transactions ? 
    ((paymentStats.successful_payments / paymentStats.total_transactions) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2 text-[#BC8BBC]" />
        Revenue Analytics
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {revenueMetrics.map((metric, index) => (
          <div key={index} className="bg-gray-750 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className={metric.color}>
                <metric.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">{metric.value}</div>
                <div className="text-gray-400 text-xs">{metric.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Rate */}
      <div className="bg-gray-750 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-medium">Payment Success Rate</div>
          <div className="text-white font-bold">{successRate}%</div>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${successRate}%` }}
          />
        </div>
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>Failed</span>
          <span>Successful</span>
        </div>
      </div>

      {/* Transaction Volume */}
      <div className="mt-4 text-center text-gray-400 text-sm">
        {paymentStats.transactions_30d || 0} transactions in last 30 days
      </div>
    </div>
  );
}