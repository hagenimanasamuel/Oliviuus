import React from 'react';

const AnalyticsMetrics = ({ data }) => {
  if (!data?.summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Safe number conversion
  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: `RWF ${safeNumber(data.summary.total_revenue).toLocaleString()}`,
      subtitle: `${safeNumber(data.summary.total_transactions).toLocaleString()} transactions`,
      change: '+12.5%',
      trend: 'up',
      icon: (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
      )
    },
    {
      title: 'Active Users',
      value: safeNumber(data.realTimeMetrics?.active_users_5min).toLocaleString(),
      subtitle: 'Currently online',
      change: '+8.2%',
      trend: 'up',
      icon: (
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )
    },
    {
      title: 'Content Views',
      value: safeNumber(data.summary.total_views).toLocaleString(),
      subtitle: `${safeNumber(data.summary.unique_content_viewed).toLocaleString()} unique contents`,
      change: '+18.7%',
      trend: 'up',
      icon: (
        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      )
    },
    {
      title: 'Avg. Session',
      value: `${Math.round(safeNumber(data.engagementMetrics?.avg_session_duration) / 60)}m`,
      subtitle: 'User engagement',
      change: '+5.3%',
      trend: 'up',
      icon: (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    },
    {
      title: 'Subscriptions',
      value: safeNumber(data.summary.subscribed_users).toLocaleString(),
      subtitle: 'Active plans',
      change: '+3.1%',
      trend: 'up',
      icon: (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      )
    },
    {
      title: 'Satisfaction',
      value: '4.8/5',
      subtitle: 'Average rating',
      change: '+0.2',
      trend: 'up',
      icon: (
        <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-xl">
          <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">
                {metric.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {metric.subtitle}
              </p>
              <div className={`flex items-center mt-2 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>{metric.change}</span>
                <svg className={`w-4 h-4 ml-1 ${metric.trend === 'up' ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            {metric.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsMetrics;