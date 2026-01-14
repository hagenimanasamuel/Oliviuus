import React from 'react';

const UserAnalyticsChart = ({ data }) => {
  if (!data?.userGrowth || data.userGrowth.length === 0) {
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

  const recentData = data.userGrowth.slice(-14); // Last 14 days
  const maxNewUsers = Math.max(...recentData.map(d => d.new_users));
  const maxCumulative = Math.max(...recentData.map(d => d.cumulative_users));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Growth Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            New user registrations and cumulative growth
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-[#BC8BBC] rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">New Users</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">Cumulative</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {recentData.map((day, index) => (
          <div key={index} className="flex items-center justify-between group">
            <div className="w-24 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {new Date(day.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            
            <div className="flex-1 mx-4">
              <div className="flex space-x-1 h-8 items-end">
                {/* New Users Bar */}
                <div 
                  className="bg-[#BC8BBC] rounded-t-lg transition-all duration-300 group-hover:opacity-80 relative"
                  style={{ 
                    height: `${maxNewUsers > 0 ? (day.new_users / maxNewUsers) * 100 : 0}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.new_users} new users`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {day.new_users} new users
                  </div>
                </div>
                
                {/* Cumulative Users Bar */}
                <div 
                  className="bg-blue-500 rounded-t-lg transition-all duration-300 group-hover:opacity-80 relative"
                  style={{ 
                    height: `${maxCumulative > 0 ? (day.cumulative_users / maxCumulative) * 100 : 0}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.cumulative_users} total users`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {day.cumulative_users} total users
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-20 text-right">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {day.new_users}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {day.cumulative_users} total
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-[#BC8BBC]">
              {data.summary?.total_users?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Users
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              +{recentData[recentData.length - 1]?.new_users || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Today
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(((recentData[recentData.length - 1]?.new_users || 0) / (recentData[recentData.length - 2]?.new_users || 1)) * 100 - 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Growth Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsChart;