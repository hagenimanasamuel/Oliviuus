import React from 'react';
import { TrendingUp, Users, CreditCard, AlertTriangle } from 'lucide-react';

export default function SubscriptionAnalytics({ data }) {
  const subscriptionStats = data?.subscriptionStats || {};
  const planDistribution = data?.planDistribution || [];

  const statusStats = [
    {
      label: 'Active',
      value: subscriptionStats.active_subscriptions || 0,
      color: 'bg-green-500',
      icon: Users
    },
    {
      label: 'Trial',
      value: subscriptionStats.trial_subscriptions || 0,
      color: 'bg-blue-500',
      icon: TrendingUp
    },
    {
      label: 'Cancelled',
      value: subscriptionStats.cancelled_subscriptions || 0,
      color: 'bg-red-500',
      icon: AlertTriangle
    }
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2 text-[#BC8BBC]" />
        Subscription Analytics
      </h3>

      {/* Subscription Status */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statusStats.map((stat, index) => (
          <div key={index} className="text-center p-3 bg-gray-750 rounded-lg">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${stat.color} mb-2`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-white font-bold text-lg">{stat.value}</div>
            <div className="text-gray-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div className="space-y-3">
        <h4 className="text-white font-medium mb-3">Plan Distribution</h4>
        {planDistribution.slice(0, 5).map((plan, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-750 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-[#BC8BBC]"></div>
              <div>
                <div className="text-white text-sm font-medium">{plan.plan_name}</div>
                <div className="text-gray-400 text-xs">{plan.plan_type}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">{plan.subscriber_count}</div>
              <div className="text-gray-400 text-xs">
                RWF {plan.total_revenue ? parseInt(plan.total_revenue).toLocaleString() : 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total Revenue */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-600 to-[#BC8BBC] rounded-lg">
        <div className="text-white text-center">
          <div className="text-2xl font-bold">
            RWF {subscriptionStats.monthly_recurring_revenue ? parseInt(subscriptionStats.monthly_recurring_revenue).toLocaleString() : 0}
          </div>
          <div className="text-purple-100 text-sm">Monthly Recurring Revenue</div>
        </div>
      </div>
    </div>
  );
}