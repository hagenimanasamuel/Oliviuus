import React from 'react';

const PlatformAnalytics = ({ data }) => {
  if (!data?.engagementMetrics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const platformStats = [
    {
      name: 'Mobile',
      users: data.engagementMetrics.mobile_users || 0,
      sessions: Math.round((data.engagementMetrics.mobile_users || 0) * 1.2),
      growth: '+15%',
      trend: 'up',
      icon: '📱',
      color: 'from-blue-500 to-blue-600',
      sessionDuration: '12m 34s'
    },
    {
      name: 'Desktop',
      users: data.engagementMetrics.desktop_users || 0,
      sessions: Math.round((data.engagementMetrics.desktop_users || 0) * 1.5),
      growth: '+8%',
      trend: 'up',
      icon: '💻',
      color: 'from-green-500 to-green-600',
      sessionDuration: '18m 45s'
    },
    {
      name: 'Tablet',
      users: data.engagementMetrics.tablet_users || 0,
      sessions: Math.round((data.engagementMetrics.tablet_users || 0) * 1.1),
      growth: '+12%',
      trend: 'up',
      icon: '📟',
      color: 'from-yellow-500 to-yellow-600',
      sessionDuration: '14m 22s'
    },
    {
      name: 'Smart TV',
      users: data.engagementMetrics.smarttv_users || 0,
      sessions: Math.round((data.engagementMetrics.smarttv_users || 0) * 2.1),
      growth: '+25%',
      trend: 'up',
      icon: '📺',
      color: 'from-purple-500 to-purple-600',
      sessionDuration: '45m 18s'
    }
  ];

  const totalSessions = platformStats.reduce((sum, platform) => sum + platform.sessions, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Platform Performance
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            User distribution across platforms
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {totalSessions.toLocaleString()} total sessions
        </div>
      </div>

      <div className="space-y-4">
        {platformStats.map((platform, index) => {
          const sessionPercentage = totalSessions > 0 ? (platform.sessions / totalSessions) * 100 : 0;
          
          return (
            <div key={index} className="relative group">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative">
                    <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center text-white text-lg shadow-sm`}>
                      {platform.icon}
                    </div>
                    <div className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        platform.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {platform.name}
                      </h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        platform.trend === 'up' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {platform.growth}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{platform.users} active users</span>
                      <span>•</span>
                      <span>{platform.sessions} sessions</span>
                    </div>
                    
                    {/* Session Duration */}
                    <div className="mt-2 flex items-center space-x-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Avg. session:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {platform.sessionDuration}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {sessionPercentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of total
                  </div>
                </div>
              </div>
              
              {/* Background progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-gray-200 dark:bg-gray-600 rounded-b-xl w-full">
                <div 
                  className={`h-1 bg-gradient-to-r ${platform.color} rounded-b-xl transition-all duration-1000`}
                  style={{ width: `${sessionPercentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Platform Insights
        </h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <span>📱</span>
              <span className="text-gray-700 dark:text-gray-300">Mobile leads with</span>
            </div>
            <span className="font-semibold text-blue-600">
              {Math.round((platformStats[0].sessions / totalSessions) * 100)}% sessions
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <span>📺</span>
              <span className="text-gray-700 dark:text-gray-300">Smart TV has longest</span>
            </div>
            <span className="font-semibold text-purple-600">
              {platformStats[3].sessionDuration} avg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;