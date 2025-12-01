import React from 'react';

const TopPerformers = ({ data }) => {
  if (!data?.contentPerformance || data.contentPerformance.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((category) => (
              <div key={category}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Safe number conversion utility
  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  const categories = [
    {
      title: 'Most Viewed',
      icon: '👑',
      data: data.contentPerformance
        .filter(item => safeNumber(item.view_count) > 0)
        .slice(0, 3),
      metric: 'view_count',
      formatter: (value) => safeNumber(value).toLocaleString(),
      suffix: 'views',
      color: 'from-purple-500 to-[#BC8BBC]'
    },
    {
      title: 'Highest Rated',
      icon: '⭐',
      data: [...data.contentPerformance]
        .filter(item => safeNumber(item.rating_count) > 10 && safeNumber(item.average_rating) > 0)
        .sort((a, b) => safeNumber(b.average_rating) - safeNumber(a.average_rating))
        .slice(0, 3),
      metric: 'average_rating',
      formatter: (value) => safeNumber(value).toFixed(1),
      suffix: '/5',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Most Engaging',
      icon: '🔥',
      data: [...data.contentPerformance]
        .filter(item => safeNumber(item.avg_watch_time) > 0)
        .sort((a, b) => safeNumber(b.avg_watch_time) - safeNumber(a.avg_watch_time))
        .slice(0, 3),
      metric: 'avg_watch_time',
      formatter: (value) => `${Math.round(safeNumber(value) / 60)}m`,
      suffix: 'avg',
      color: 'from-red-500 to-pink-500'
    }
  ];

  const getContentTypeBadge = (type) => {
    const types = {
      movie: { label: 'Movie', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      series: { label: 'Series', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      documentary: { label: 'Doc', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      short_film: { label: 'Short', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
      live_event: { label: 'Live', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' }
    };
    
    const typeConfig = types[type] || { label: type, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' };
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.color}`}>
        {typeConfig.label}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performers
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Leading content across key metrics
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <div className="flex items-center space-x-2 mb-4">
              <div className={`w-8 h-8 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                {category.icon}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {category.title}
              </h4>
            </div>
            
            <div className="space-y-3">
              {category.data.map((item, itemIndex) => (
                <div 
                  key={itemIndex}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          {itemIndex + 1}
                        </div>
                        {itemIndex === 0 && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-xs">🏆</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.title || 'Untitled Content'}
                        </h5>
                        {getContentTypeBadge(item.content_type)}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{safeNumber(item.unique_viewers).toLocaleString()} viewers</span>
                        <span>•</span>
                        <span>{safeNumber(item.total_likes).toLocaleString()} likes</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {category.formatter(item[category.metric])}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">
                        {category.suffix}
                      </span>
                    </div>
                    {category.metric === 'average_rating' && item.rating_count && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {safeNumber(item.rating_count).toLocaleString()} ratings
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {category.data.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </div>
            
            {categoryIndex < categories.length - 1 && (
              <div className="border-t border-gray-200 dark:border-gray-600 my-6"></div>
            )}
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Performance Summary
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-gradient-to-br from-[#BC8BBC]/10 to-purple-500/10 rounded-lg">
            <div className="text-2xl font-bold text-[#BC8BBC]">
              {data.contentPerformance.filter(item => safeNumber(item.view_count) > 1000).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              1K+ Views
            </div>
          </div>
          
          <div className="text-center p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {data.contentPerformance.filter(item => safeNumber(item.average_rating) > 4).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              4+ Stars
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;