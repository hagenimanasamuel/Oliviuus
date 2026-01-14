import React, { useState, useEffect } from "react";
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Monitor,
  Star,
  Heart,
  Share2,
  DollarSign,
  Target,
  RefreshCw
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from "../../../../../../api/axios";

const AnalyticsTab = ({ content, stats }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('views');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions
  const formatWatchTime = (seconds) => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatRevenue = (amount) => {
    if (!amount) return 'RWF 0';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${Math.round(value)}%`;
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trend < 0) return <TrendingUp className="w-4 h-4 text-red-400 transform rotate-180" />;
    return <Target className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // Safe number formatting function
  const safeToFixed = (value, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    return parseFloat(value).toFixed(decimals);
  };

  // Enhanced metrics with real data
  const metrics = [
    { 
      id: 'views', 
      label: 'Total Views', 
      value: analyticsData?.overview?.totalViews || stats?.views || 0, 
      icon: Eye, 
      color: 'text-blue-400',
      trend: analyticsData?.overview?.viewsTrend || 0
    },
    { 
      id: 'viewers', 
      label: 'Unique Viewers', 
      value: analyticsData?.overview?.uniqueViewers || 0, 
      icon: Users, 
      color: 'text-green-400',
      trend: analyticsData?.overview?.viewersTrend || 0
    },
    { 
      id: 'watchtime', 
      label: 'Avg Watch Time', 
      value: formatWatchTime(analyticsData?.overview?.avgWatchTimeSeconds || 0), 
      icon: Clock, 
      color: 'text-purple-400',
      trend: analyticsData?.overview?.watchTimeTrend || 0
    },
    { 
      id: 'completion', 
      label: 'Completion Rate', 
      value: `${analyticsData?.overview?.completionRate || 0}%`, 
      icon: TrendingUp, 
      color: 'text-yellow-400',
      trend: analyticsData?.overview?.completionTrend || 0
    },
    { 
      id: 'engagement', 
      label: 'Engagement Score', 
      value: analyticsData?.overview?.engagementScore || 0, 
      icon: Heart, 
      color: 'text-pink-400',
      trend: analyticsData?.overview?.engagementTrend || 0
    },
    { 
      id: 'revenue', 
      label: 'Estimated Revenue', 
      value: formatRevenue(analyticsData?.overview?.estimatedRevenue || 0), 
      icon: DollarSign, 
      color: 'text-emerald-400',
      trend: analyticsData?.overview?.revenueTrend || 0
    }
  ];

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  // Prepare chart data from analytics
  const getChartData = () => {
    if (!analyticsData?.trends?.labels) return [];
    
    return analyticsData.trends.labels.map((label, index) => ({
      name: label,
      views: analyticsData.trends.views[index] || 0,
      engagement: analyticsData.trends.engagement[index] || 0,
      revenue: analyticsData.trends.revenue[index] || 0
    }));
  };

  // Prepare device data for pie chart
  const getDeviceChartData = () => {
    if (!analyticsData?.devices) return [];
    
    const colors = ['#BC8BBC', '#8B7BBC', '#7BBC8B', '#BC8B7B', '#8BBCBC'];
    return analyticsData.devices.map((device, index) => ({
      name: device.device,
      value: device.percentage,
      color: colors[index % colors.length]
    }));
  };

  // Prepare demographic data for chart
  const getDemographicChartData = () => {
    if (!analyticsData?.demographics) return [];
    
    return analyticsData.demographics.slice(0, 5).map(demo => ({
      name: demo.country,
      viewers: demo.viewers
    }));
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [content?.id, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!content?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/contents/analytics/content/${content.id}`, {
        params: { timeRange }
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'revenue' ? formatRevenue(entry.value) : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Error</div>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const deviceChartData = getDeviceChartData();
  const demographicChartData = getDemographicChartData();

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-white text-xl font-semibold">Content Analytics</h2>
          <p className="text-gray-400">Performance metrics and viewer insights for "{content?.title}"</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-[#BC8BBC] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <button 
            className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={fetchAnalyticsData}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
              <div className="flex items-center gap-1">
                {getTrendIcon(metric.trend)}
                <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                  {metric.trend > 0 ? '+' : ''}{metric.trend}%
                </span>
              </div>
            </div>
            <div className="text-xl font-bold text-white mb-1 truncate" title={metric.value}>
              {metric.value}
            </div>
            <div className="text-gray-400 text-xs truncate">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* View Trends Chart */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <h3 className="text-white font-semibold text-lg">View Trends</h3>
            <div className="flex items-center gap-2">
              {['views', 'engagement', 'revenue'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-3 py-1 text-sm rounded capitalize transition-colors ${
                    activeMetric === metric
                      ? 'bg-[#BC8BBC] text-white'
                      : 'text-gray-400 hover:text-white bg-gray-700'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {activeMetric === 'views' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="views" 
                    fill="#BC8BBC" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : activeMetric === 'engagement' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#BC8BBC" 
                    strokeWidth={2}
                    dot={{ fill: '#BC8BBC' }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#BC8BBC" 
                    fill="#BC8BBC"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution Pie Chart */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg">Device Usage</h3>
            <Monitor className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold text-lg">Top Locations</h3>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={demographicChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [value.toLocaleString(), 'Viewers']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="viewers" 
                  fill="#BC8BBC" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-6">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-gray-300">Likes</span>
              </div>
              <span className="text-white font-semibold text-lg">
                {analyticsData?.engagement?.likes || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Shares</span>
              </div>
              <span className="text-white font-semibold text-lg">
                {analyticsData?.engagement?.shares || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300">Comments</span>
              </div>
              <span className="text-white font-semibold text-lg">
                {analyticsData?.engagement?.comments || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">Watchlist Adds</span>
              </div>
              <span className="text-white font-semibold text-lg">
                {analyticsData?.engagement?.watchlistAdds || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Performance Insights</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {formatPercentage(analyticsData?.insights?.completionRate || 0)}
            </div>
            <div className="text-gray-400 text-sm">Completion Rate</div>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {analyticsData?.insights?.avgSessionDuration || '0:00'}
            </div>
            <div className="text-gray-400 text-sm">Avg Session</div>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {analyticsData?.insights?.returnViewerRate || '0%'}
            </div>
            <div className="text-gray-400 text-sm">Return Viewers</div>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {analyticsData?.insights?.socialEngagement || '0%'}
            </div>
            <div className="text-gray-400 text-sm">Social Engagement</div>
          </div>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Content Ratings</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Average Rating</span>
              <span className="text-white font-semibold">
                {safeToFixed(content?.average_rating)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Total Ratings</span>
              <span className="text-white font-semibold">
                {content?.rating_count || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">5-Star Ratings</span>
              <span className="text-white font-semibold">
                {analyticsData?.ratings?.fiveStar || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Audience Retention</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Peak Concurrent</span>
              <span className="text-white font-semibold">
                {analyticsData?.retention?.peakConcurrent || 0}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Drop-off Point</span>
              <span className="text-white font-semibold">
                {analyticsData?.retention?.avgDropOff || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Bounce Rate</span>
              <span className="text-white font-semibold">
                {analyticsData?.retention?.bounceRate || '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6">
          <h3 className="text-white font-semibold text-lg mb-4">Revenue Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Total Revenue</span>
              <span className="text-white font-semibold">
                {formatRevenue(analyticsData?.revenue?.total || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Revenue/View</span>
              <span className="text-white font-semibold">
                {formatRevenue(analyticsData?.revenue?.perView || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Projected Monthly</span>
              <span className="text-white font-semibold">
                {formatRevenue(analyticsData?.revenue?.projectedMonthly || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;