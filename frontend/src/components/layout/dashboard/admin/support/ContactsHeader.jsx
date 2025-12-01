import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Filter,
  Download,
  X,
  ChevronDown,
  SlidersHorizontal,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function ContactsHeader({
  filters,
  onFilterChange,
  totalContacts,
  filteredCount = 0,
  onExport,
  onRefresh,
}) {
  const { t } = useTranslation();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize advanced filters from props
  const [dateRange, setDateRange] = useState({ 
    start: filters.date_start || "", 
    end: filters.date_end || "" 
  });
  const [responseCount, setResponseCount] = useState(filters.response_count || "");
  const [source, setSource] = useState(filters.source || "");

  // Sync local advanced filter state with props when they change
  useEffect(() => {
    setDateRange({ 
      start: filters.date_start || "", 
      end: filters.date_end || "" 
    });
    setResponseCount(filters.response_count || "");
    setSource(filters.source || "");
  }, [filters.date_start, filters.date_end, filters.response_count, filters.source]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Error refreshing contacts:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const clearAllFilters = () => {
    onFilterChange('search', '');
    onFilterChange('status', '');
    onFilterChange('priority', '');
    onFilterChange('category', '');
    onFilterChange('sortBy', 'created_at');
    onFilterChange('sortOrder', 'DESC');
    // Clear advanced filters
    onFilterChange('date_start', '');
    onFilterChange('date_end', '');
    onFilterChange('response_count', '');
    onFilterChange('source', '');
  };

  const clearAdvancedFilters = () => {
    onFilterChange('date_start', '');
    onFilterChange('date_end', '');
    onFilterChange('response_count', '');
    onFilterChange('source', '');
  };

  // Handle date range changes
  const handleDateChange = (type, value) => {
    const newDateRange = { ...dateRange, [type]: value };
    setDateRange(newDateRange);
    
    // Update the main filters immediately
    onFilterChange('date_start', newDateRange.start);
    onFilterChange('date_end', newDateRange.end);
  };

  // Handle response count changes
  const handleResponseCountChange = (value) => {
    setResponseCount(value);
    onFilterChange('response_count', value);
  };

  // Handle source changes
  const handleSourceChange = (value) => {
    setSource(value);
    onFilterChange('source', value);
  };

  const handleExportClick = async () => {
    try {
      // Build export parameters including advanced filters
      const exportParams = {
        status: filters.status,
        priority: filters.priority,
        category: filters.category,
        search: filters.search,
        date_start: filters.date_start,
        date_end: filters.date_end,
        source: filters.source,
        response_count: filters.response_count
      };

      // Remove empty parameters
      Object.keys(exportParams).forEach(key => {
        if (!exportParams[key]) delete exportParams[key];
      });

      console.log('Exporting with params:', exportParams);

      const response = await api.get('/contact/admin/contacts/export', {
        params: exportParams,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contacts_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('contact.exportError'));
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.category ||
    filters.date_start ||
    filters.date_end ||
    filters.response_count ||
    filters.source;

  const hasAdvancedFilters = filters.date_start || filters.date_end || filters.response_count || filters.source;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 md:p-6">
      {/* Top Section - Stats, Search, and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* Left Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#BC8BBC] to-purple-600 p-3 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('contact.stats.totalContacts')}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalContacts}
                </p>
                {filteredCount !== totalContacts && (
                  <span className="text-sm text-[#BC8BBC] font-medium">
                    ({filteredCount} {t('contact.filters.filtered')})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div
              className={`relative transition-all duration-200 ${
                isSearchFocused ? "ring-2 ring-[#BC8BBC] rounded-lg" : ""
              }`}
            >
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={t('contact.filters.search')}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-colors"
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange('search', '')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title={t('contact.settings.refresh')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">{t('contact.settings.export')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Filter className="w-4 h-4" />
              <span>{t('contact.filters.filters')}:</span>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t('contact.filters.allStatus')}</option>
              <option value="new">{t('contact.status.new')}</option>
              <option value="open">{t('contact.status.open')}</option>
              <option value="in_progress">{t('contact.status.in_progress')}</option>
              <option value="awaiting_reply">{t('contact.status.awaiting_reply')}</option>
              <option value="resolved">{t('contact.status.resolved')}</option>
              <option value="closed">{t('contact.status.closed')}</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t('contact.filters.allPriority')}</option>
              <option value="urgent">{t('contact.priority.urgent')}</option>
              <option value="high">{t('contact.priority.high')}</option>
              <option value="medium">{t('contact.priority.medium')}</option>
              <option value="low">{t('contact.priority.low')}</option>
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="">{t('contact.filters.allCategories')}</option>
              <option value="general">{t('contact.category.general')}</option>
              <option value="technical">{t('contact.category.technical')}</option>
              <option value="billing">{t('contact.category.billing')}</option>
              <option value="feature_request">{t('contact.category.feature_request')}</option>
              <option value="bug_report">{t('contact.category.bug_report')}</option>
              <option value="partnership">{t('contact.category.partnership')}</option>
              <option value="feedback">{t('contact.category.feedback')}</option>
              <option value="other">{t('contact.category.other')}</option>
            </select>

            {/* Advanced */}
            <button
              onClick={() => setShowAdvancedSection(!showAdvancedSection)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition text-sm"
            >
              <span>{t('contact.filters.advanced')}</span>
              {showAdvancedSection ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
              >
                <X className="w-3 h-3" />
                {t('contact.filters.clearAll')}
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('contact.filters.sortBy')}
            </span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] transition text-sm"
            >
              <option value="created_at">{t('contact.filters.newestFirst')}</option>
              <option value="updated_at">{t('contact.filters.lastUpdated')}</option>
              <option value="priority">{t('contact.filters.priority')}</option>
              <option value="status">{t('contact.filters.status')}</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedSection && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contact.filters.dateRange')}
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Response Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contact.filters.responseCount')}
                </label>
                <select 
                  value={responseCount}
                  onChange={(e) => handleResponseCountChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">{t('contact.filters.any')}</option>
                  <option value="0">{t('contact.filters.noResponses')}</option>
                  <option value="1-3">{t('contact.filters.responses1to3')}</option>
                  <option value="4+">{t('contact.filters.responses4plus')}</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contact.filters.source')}
                </label>
                <select 
                  value={source}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">{t('contact.filters.allSources')}</option>
                  <option value="website">Website</option>
                  <option value="mobile_app">Mobile App</option>
                  <option value="api">API</option>
                  <option value="email">Email</option>
                </select>
              </div>

              {/* Clear Advanced */}
              <div className="flex items-end">
                <button
                  onClick={clearAdvancedFilters}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
                >
                  {t('contact.filters.clearAdvanced')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Badges (Mobile) */}
      {hasActiveFilters && (
        <div className="lg:hidden mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {t('contact.filters.search')}: {filters.search}
              <button onClick={() => onFilterChange('search', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {t('contact.filters.status')}: {t(`contact.status.${filters.status}`)}
              <button onClick={() => onFilterChange('status', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              {t('contact.filters.priority')}: {t(`contact.priority.${filters.priority}`)}
              <button onClick={() => onFilterChange('priority', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {t('contact.filters.category')}: {t(`contact.category.${filters.category}`)}
              <button onClick={() => onFilterChange('category', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.date_start && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
              {t('contact.filters.from')}: {filters.date_start}
              <button onClick={() => onFilterChange('date_start', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.date_end && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
              {t('contact.filters.to')}: {filters.date_end}
              <button onClick={() => onFilterChange('date_end', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.response_count && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
              {t('contact.filters.responses')}: {filters.response_count}
              <button onClick={() => onFilterChange('response_count', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.source && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
              {t('contact.filters.source')}: {filters.source}
              <button onClick={() => onFilterChange('source', '')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}