import React from 'react';

const RevenueAnalyticsChart = ({ data }) => {
  if (!data?.revenueAnalytics || data.revenueAnalytics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentData = data.revenueAnalytics.slice(-7); // Last 7 days
  const totalRevenue = recentData.reduce((sum, day) => sum + (parseFloat(day.daily_revenue) || 0), 0);
  const totalTransactions = recentData.reduce((sum, day) => sum + (parseInt(day.transactions) || 0), 0);
  const avgTransaction = totalRevenue / totalTransactions || 0;

  const maxRevenue = Math.max(...recentData.map(d => parseFloat(d.daily_revenue) || 0));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Revenue Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Daily revenue and transaction metrics
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#BC8BBC] rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Daily Revenue</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {recentData.map((day, index) => {
          const revenue = parseFloat(day.daily_revenue) || 0;
          const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
          
          return (
            <div key={index} className="flex items-center justify-between group">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400 font-medium">
                {new Date(day.date).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  day: 'numeric'
                })}
              </div>
              
              <div className="flex-1 mx-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#BC8BBC] to-[#a573a5] h-full rounded-full transition-all duration-500 group-hover:opacity-90 relative"
                    style={{ width: `${percentage}%` }}
                    title={`RWF ${revenue.toLocaleString()}`}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      RWF {revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-28 text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  RWF {revenue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {day.transactions || 0} transactions
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#BC8BBC]">
              RWF {totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Revenue
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {totalTransactions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Transactions
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              RWF {avgTransaction.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Avg. Transaction
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plan Performance */}
      {data.subscriptionAnalytics && data.subscriptionAnalytics.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Subscription Plan Performance
          </h4>
          <div className="space-y-3">
            {data.subscriptionAnalytics.slice(0, 3).map((plan, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-[#BC8BBC] rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {plan.plan_name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {plan.active_subscriptions || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    RWF {parseFloat(plan.mrr || 0).toLocaleString()}/mo
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueAnalyticsChart;