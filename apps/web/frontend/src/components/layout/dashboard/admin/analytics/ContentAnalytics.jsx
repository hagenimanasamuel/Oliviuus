import React from 'react';

const ContentAnalytics = ({ data }) => {
  if (!data?.contentPerformance || data.contentPerformance.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const topContent = data.contentPerformance.slice(0, 5);

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'movie': return '🎬';
      case 'series': return '📺';
      case 'documentary': return '📝';
      case 'short_film': return '🎥';
      case 'live_event': return '🔴';
      default: return '📁';
    }
  };

  // Safe number conversion with fallbacks
  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  const getEngagementScore = (content) => {
    const views = safeNumber(content.view_count);
    const likes = safeNumber(content.total_likes);
    const watchTime = safeNumber(content.avg_watch_time);
    const watchlist = safeNumber(content.watchlist_adds);
    
    return ((views * 0.4) + (likes * 0.3) + (watchTime * 0.2) + (watchlist * 0.1)) / 100;
  };

  // Calculate average rating safely
  const getAverageRating = (content) => {
    const rating = safeNumber(content.average_rating);
    return rating > 0 ? rating : 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Performing Content
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Based on views, engagement, and ratings
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data.contentPerformance.length} total
        </div>
      </div>

      <div className="space-y-4">
        {topContent.map((content, index) => {
          const engagementScore = getEngagementScore(content);
          const averageRating = getAverageRating(content);
          
          return (
            <div key={content.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="absolute -top-1 -right-1 text-lg">
                    {getContentTypeIcon(content.content_type)}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {content.title || 'Untitled Content'}
                  </h4>
                  {averageRating > 4.5 && (
                    <span className="flex items-center text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                      ⭐ {averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="capitalize">{content.content_type?.replace('_', ' ') || 'Unknown'}</span>
                  <span>•</span>
                  <span>{safeNumber(content.unique_viewers).toLocaleString()} viewers</span>
                  <span>•</span>
                  <span>{Math.round(safeNumber(content.avg_watch_time) / 60) || 0}m avg</span>
                </div>
                
                {/* Engagement Bar */}
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-[#BC8BBC] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(engagementScore, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {safeNumber(content.view_count).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  views
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Total Published</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {safeNumber(data.summary?.published_content).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-1">Avg. Rating</div>
            <div className="text-lg font-semibold text-yellow-600 flex items-center">
              ⭐ {getAverageRating(data.contentPerformance[0] || {}).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalytics;