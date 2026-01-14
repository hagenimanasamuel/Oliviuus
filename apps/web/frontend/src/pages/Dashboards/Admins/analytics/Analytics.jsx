import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../../../api/axios';
import AnalyticsHeader from '../../../../components/layout/dashboard/admin/analytics/AnalyticsHeader';
import AnalyticsFilters from '../../../../components/layout/dashboard/admin/analytics/AnalyticsFilters';
import AnalyticsMetrics from '../../../../components/layout/dashboard/admin/analytics/AnalyticsMetrics';
import UserAnalyticsChart from '../../../../components/layout/dashboard/admin/analytics/UserAnalyticsChart';
import RevenueAnalyticsChart from '../../../../components/layout/dashboard/admin/analytics/RevenueAnalyticsChart';
import ContentAnalytics from '../../../../components/layout/dashboard/admin/analytics/ContentAnalytics';
import EngagementMetrics from '../../../../components/layout/dashboard/admin/analytics/EngagementMetrics';
import PlatformAnalytics from '../../../../components/layout/dashboard/admin/analytics/PlatformAnalytics';
import GeographicAnalytics from '../../../../components/layout/dashboard/admin/analytics/GeographicAnalytics';
import TopPerformers from '../../../../components/layout/dashboard/admin/analytics/TopPerformers';
import AnalyticsExport from '../../../../components/layout/dashboard/admin/analytics/AnalyticsExport';

export default function Analytics({ user }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '30d',
    startDate: null,
    endDate: null,
    contentType: 'all',
    metric: 'all'
  });
  const [exporting, setExporting] = useState(false);

  const fetchAnalyticsData = async (filterParams = filters) => {
    try {
      setLoading(true);
      const response = await axios.get('/analytics/comprehensive', {
        params: filterParams
      });
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchAnalyticsData(newFilters);
  };

  const handleExport = async (format, type) => {
    try {
      setExporting(true);
      const response = await axios.get('/analytics/export', {
        params: { ...filters, format, type },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-export-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export analytics data');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    
    // Refresh data every 10 minutes
    const interval = setInterval(fetchAnalyticsData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 dark:text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading analytics</h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            <button
              onClick={fetchAnalyticsData}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader 
        user={user}
        onExport={handleExport}
        exporting={exporting}
      />
      
      <AnalyticsFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <AnalyticsMetrics data={analyticsData} />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UserAnalyticsChart data={analyticsData} />
        <RevenueAnalyticsChart data={analyticsData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContentAnalytics data={analyticsData} />
        <EngagementMetrics data={analyticsData} />
        <PlatformAnalytics data={analyticsData} />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GeographicAnalytics data={analyticsData} />
        <TopPerformers data={analyticsData} />
      </div>
      
      <AnalyticsExport 
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
}