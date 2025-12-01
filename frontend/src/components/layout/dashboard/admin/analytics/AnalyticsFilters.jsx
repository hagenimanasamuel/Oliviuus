import React from 'react';

const AnalyticsFilters = ({ filters, onFilterChange }) => {
  const handleDateRangeChange = (dateRange) => {
    onFilterChange({ ...filters, dateRange });
  };

  const handleContentTypeChange = (contentType) => {
    onFilterChange({ ...filters, contentType });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-6">
        {/* Date Range Filter */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Time Period
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { value: '24h', label: '24 Hours' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: '1y', label: '1 Year' },
              { value: 'custom', label: 'Custom' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleDateRangeChange(option.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  filters.dateRange === option.value
                    ? 'bg-[#BC8BBC] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Type Filter */}
        <div className="lg:w-64">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <select
            value={filters.contentType}
            onChange={(e) => handleContentTypeChange(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-colors duration-200"
          >
            <option value="all">All Content Types</option>
            <option value="movie">Movies</option>
            <option value="series">TV Series</option>
            <option value="documentary">Documentaries</option>
            <option value="short_film">Short Films</option>
            <option value="live_event">Live Events</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <div className="flex space-x-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <input
                type="date"
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <input
                type="date"
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsFilters;