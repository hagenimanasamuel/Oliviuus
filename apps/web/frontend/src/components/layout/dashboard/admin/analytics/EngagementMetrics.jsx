import React from 'react';

const EngagementMetrics = ({ data }) => {
  if (!data?.engagementMetrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Active Sessions',
      value: data.engagementMetrics.active_sessions || 0,
      subtitle: 'Real-time users',
      icon: '👥',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      label: 'Avg. Session Duration',
      value: `${Math.round((data.engagementMetrics.avg_session_duration || 0) / 60)}m ${(data.engagementMetrics.avg_session_duration || 0) % 60}s`,
      subtitle: 'User engagement',
      icon: '⏱️',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      label: 'Content Views',
      value: (data.engagementMetrics.total_views || 0).toLocaleString(),
      subtitle: 'Total watch time',
      icon: '👀',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      label: 'Content Likes',
      value: (data.engagementMetrics.total_likes || 0).toLocaleString(),
      subtitle: 'User interactions',
      icon: '❤️',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  const platformData = [
    { 
      platform: 'Mobile', 
      users: data.engagementMetrics.mobile_users || 0, 
      color: 'bg-blue-500',
      icon: '📱'
    },
    { 
      platform: 'Desktop', 
      users: data.engagementMetrics.desktop_users || 0, 
      color: 'bg-green-500',
      icon: '💻'
    },
    { 
      platform: 'Tablet', 
      users: data.engagementMetrics.tablet_users || 0, 
      color: 'bg-yellow-500',
      icon: '📟'
    },
    { 
      platform: 'Smart TV', 
      users: data.engagementMetrics.smarttv_users || 0, 
      color: 'bg-purple-500',
      icon: '📺'
    }
  ];

  const totalUsers = platformData.reduce((sum, item) => sum + (parseInt(item.users) || 0), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Engagement Overview
      </h3>

      {/* Key Metrics */}
      <div className="space-y-4 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center space-x-4">
              <div className={`p-3 ${metric.bgColor} rounded-xl`}>
                <span className="text-xl">{metric.icon}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.subtitle}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${metric.color}`}>
                {metric.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Distribution */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Platform Distribution
        </h4>
        <div className="space-y-3">
          {platformData.map((item, index) => {
            const percentage = totalUsers > 0 ? Math.round((item.users / totalUsers) * 100) : 0;
            
            return (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-lg">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.platform}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.users}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${item.color} group-hover:opacity-80`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="w-12 text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement Score */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Overall Engagement Score
          </div>
          <div className="relative inline-flex">
            <div className="w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#BC8BBC"
                  strokeWidth="3"
                  strokeDasharray="75, 100"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">75%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Based on user activity and interactions
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementMetrics;