import React, { useState, useEffect } from 'react';
import axios from '../../../../api/axios';
import OverviewHeader from '../../../../components/layout/dashboard/admin/overview/OverviewHeader.jsx';
import MetricsGrid from '../../../../components/layout/dashboard/admin/overview/MetricsGrid';
import UserStatistics from '../../../../components/layout/dashboard/admin/overview/UserStatistics';
import SubscriptionAnalytics from '../../../../components/layout/dashboard/admin/overview/SubscriptionAnalytics';
import RevenueAnalytics from '../../../../components/layout/dashboard/admin/overview/RevenueAnalytics';
import SupportOverview from '../../../../components/layout/dashboard/admin/overview/SupportOverview';
import SecurityOverview from '../../../../components/layout/dashboard/admin/overview/SecurityOverview';
import RecentActivities from '../../../../components/layout/dashboard/admin/overview/RecentActivities';
import SystemHealth from '../../../../components/layout/dashboard/admin/overview/SystemHealth';

export default function Overview({ user }) {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/overview/system-overview');
      if (response.data.success) {
        setOverviewData(response.data.data);
        setLastUpdated(response.data.data.lastUpdated);
      }
    } catch (err) {
      setError('Failed to load overview data');
      console.error('Overview data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchOverviewData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 dark:text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading overview</h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            <button
              onClick={fetchOverviewData}
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
      <OverviewHeader 
        user={user} 
        lastUpdated={lastUpdated} 
        onRefresh={fetchOverviewData}
      />
      
      <MetricsGrid overviewData={overviewData} />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UserStatistics data={overviewData} />
        <SubscriptionAnalytics data={overviewData} />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueAnalytics data={overviewData} />
        <SupportOverview data={overviewData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SecurityOverview data={overviewData} />
        <RecentActivities data={overviewData} />
        <SystemHealth data={overviewData} />
      </div>
    </div>
  );
}