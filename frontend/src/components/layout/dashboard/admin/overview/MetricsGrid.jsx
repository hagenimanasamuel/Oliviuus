import React from 'react';
import { Users, CreditCard, DollarSign, HelpCircle, Shield, Activity } from 'lucide-react';

export default function MetricsGrid({ overviewData }) {
  const metrics = [
    {
      title: 'Total Users',
      value: overviewData?.userStats?.total_users || 0,
      change: `${overviewData?.userStats?.new_users_30d || 0} new (30d)`,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Registered platform users'
    },
    {
      title: 'Active Subscriptions',
      value: overviewData?.subscriptionStats?.active_subscriptions || 0,
      change: `${overviewData?.subscriptionStats?.new_subscriptions_30d || 0} new (30d)`,
      icon: CreditCard,
      color: 'bg-green-500',
      description: 'Currently active subscriptions'
    },
    {
      title: 'Monthly Revenue',
      value: `RWF ${(overviewData?.paymentStats?.revenue_30d || 0).toLocaleString()}`,
      change: `${overviewData?.paymentStats?.transactions_30d || 0} transactions`,
      icon: DollarSign,
      color: 'bg-purple-500',
      description: 'Revenue last 30 days'
    },
    {
      title: 'Pending Tickets',
      value: overviewData?.supportStats?.new_tickets || 0,
      change: `${overviewData?.supportStats?.total_tickets || 0} total`,
      icon: HelpCircle,
      color: 'bg-orange-500',
      description: 'New support requests'
    },
    {
      title: 'Active Sessions',
      value: overviewData?.securityStats?.active_sessions || 0,
      change: `${overviewData?.securityStats?.unique_active_users || 0} unique users`,
      icon: Shield,
      color: 'bg-indigo-500',
      description: 'Current active user sessions'
    },
    {
      title: 'System Health',
      value: 'Optimal',
      change: 'All systems operational',
      icon: Activity,
      color: 'bg-emerald-500',
      description: 'Platform status'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${metric.color}`}>
              <metric.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="text-sm text-gray-400">{metric.change}</div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{metric.title}</h3>
          <p className="text-gray-400 text-sm">{metric.description}</p>
        </div>
      ))}
    </div>
  );
}