import React from 'react';

const GeographicAnalytics = ({ data }) => {
  if (!data?.geographicDistribution || data.geographicDistribution.length === 0) {
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

  const topLocations = data.geographicDistribution.slice(0, 8);
  const totalUsers = topLocations.reduce((sum, location) => sum + (parseInt(location.users) || 0), 0);
  const maxUsers = Math.max(...topLocations.map(loc => parseInt(loc.users) || 0));

  const getFlagEmoji = (countryCode) => {
    // Simple mapping for common countries - in production you'd use a proper library
    const flags = {
      'rwanda': '🇷🇼',
      'kenya': '🇰🇪',
      'uganda': '🇺🇬',
      'tanzania': '🇹🇿',
      'burundi': '🇧🇮',
      'usa': '🇺🇸',
      'uk': '🇬🇧',
      'france': '🇫🇷',
      'germany': '🇩🇪',
      'canada': '🇨🇦',
      'australia': '🇦🇺',
      'india': '🇮🇳',
      'china': '🇨🇳',
      'japan': '🇯🇵',
      'brazil': '🇧🇷'
    };
    
    const normalizedLocation = location.location?.toLowerCase().trim();
    return flags[normalizedLocation] || '🌍';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Geographic Distribution
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            User activity by location
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.geographicDistribution.length} locations
        </div>
      </div>

      <div className="space-y-4">
        {topLocations.map((location, index) => {
          const userCount = parseInt(location.users) || 0;
          const percentage = totalUsers > 0 ? (userCount / totalUsers) * 100 : 0;
          const maxPercentage = maxUsers > 0 ? (userCount / maxUsers) * 100 : 0;
          
          return (
            <div key={index} className="flex items-center justify-between group">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-xl">
                    {getFlagEmoji(location.location)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {location.location || 'Unknown Location'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {location.unique_users || 0} unique users
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Progress Bar */}
                <div className="w-32 hidden sm:block">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#BC8BBC] to-[#a573a5] h-2 rounded-full transition-all duration-500 group-hover:opacity-90"
                      style={{ width: `${maxPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-right w-20">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {userCount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Geographic Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Geographic Insights
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Top Region</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {topLocations[0]?.location || 'N/A'}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {topLocations[0] ? Math.round((topLocations[0].users / totalUsers) * 100) : 0}% of traffic
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-700 dark:text-green-300">Avg. Session</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {topLocations[0]?.avg_session_duration ? 
                `${Math.round(topLocations[0].avg_session_duration / 60)}m` : 'N/A'
              }
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              in top region
            </div>
          </div>
        </div>
      </div>

      {/* Global Coverage */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Global Coverage</span>
          <span className="font-semibold text-[#BC8BBC]">
            {data.geographicDistribution.length} countries
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min((data.geographicDistribution.length / 50) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalytics;