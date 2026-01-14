import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  ArrowUp,
  ArrowDown,
  Crown,
  Filter,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Activity
} from "lucide-react";
import api from "../../../../../api/axios";

// Chart components
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, AreaChart, Area, ComposedChart, Scatter, ReferenceLine
} from 'recharts';

export default function SubscriptionAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);
  const [dataQuality, setDataQuality] = useState({ hasData: false, message: '' });

  const timeRanges = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  // Colors for charts
  const CHART_COLORS = {
    primary: '#BC8BBC',
    secondary: '#6B46C1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    plans: ['#BC8BBC', '#6B46C1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']
  };

  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true);
      const response = await api.get(`/admin/subscriptions/admin/analytics/overview?period=${timeRange}`);

      if (response.data.success) {
        setAnalyticsData(response.data.data);

        // Enhanced data quality check
        const hasRevenueData = response.data.data.overview.total_revenue > 0;
        const hasSubscriberData = response.data.data.overview.total_subscribers > 0;
        const hasTrendData = response.data.data.trends.revenue.some(item => item.revenue > 0);

        setDataQuality({
          hasData: hasRevenueData || hasSubscriberData || hasTrendData,
          message: !hasRevenueData && !hasSubscriberData ? 'No subscription data available for the selected period' : ''
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setDataQuality({
        hasData: false,
        message: 'Failed to load analytics data'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Enhanced chart data preparation
  const prepareChartData = () => {
    if (!analyticsData) return {};

    const revenueData = analyticsData.trends.revenue || [];
    const subscriberData = analyticsData.trends.subscribers || [];
    const planData = analyticsData.distribution.plans || [];
    const cancellationData = analyticsData.performance.cancellations || [];
    const revenueByPlanData = analyticsData.distribution.revenue_by_plan || [];
    const userGrowthData = analyticsData.trends.user_growth || [];

    // Enhanced revenue chart with growth calculations
    const revenueWithGrowth = revenueData.map((item, index, array) => {
      const prevRevenue = index > 0 ? array[index - 1].revenue : item.revenue;
      const growth = prevRevenue > 0 ? ((item.revenue - prevRevenue) / prevRevenue) * 100 : 0;

      return {
        ...item,
        growth: growth,
        dateShort: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    // Enhanced subscriber growth with trend analysis
    const subscribersWithAnalysis = subscriberData.map((item, index, array) => {
      const netGrowth = item.new_subscribers - item.immediate_cancellations;
      const growthRate = index > 0 ?
        ((item.cumulative_subscribers - array[index - 1].cumulative_subscribers) / array[index - 1].cumulative_subscribers) * 100 : 0;

      return {
        ...item,
        net_growth: netGrowth,
        growth_rate: growthRate,
        dateShort: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    // Enhanced plan data with revenue information
    const enhancedPlanData = planData.map(plan => ({
      ...plan,
      display_name: plan.plan_type === 'unknown' ? 'Other Plans' : plan.plan_type,
      revenue_per_subscriber: plan.active_subscribers > 0 ? plan.revenue / plan.active_subscribers : 0,
      conversion_rate: plan.total_subscribers > 0 ? (plan.active_subscribers / plan.total_subscribers) * 100 : 0
    }));

    // Enhanced revenue by plan with better naming
    const enhancedRevenueByPlan = revenueByPlanData.map(plan => ({
      ...plan,
      display_name: plan.plan_type === 'unknown' ? 'Other Plans' : plan.plan_type,
      avg_revenue_per_customer: plan.unique_customers > 0 ? plan.total_revenue / plan.unique_customers : 0
    }));

    return {
      revenue: revenueWithGrowth,
      subscribers: subscribersWithAnalysis,
      plans: enhancedPlanData,
      cancellations: cancellationData,
      revenueByPlan: enhancedRevenueByPlan,
      userGrowth: userGrowthData
    };
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Preparing your subscription insights</p>
        </div>
      </div>
    );
  }

  // Render empty state only if truly no data
  if (!analyticsData || !dataQuality.hasData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {dataQuality.message || 'Ready for Analytics'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {dataQuality.message
              ? 'Analytics will appear here once you have subscription activity.'
              : 'Start by creating subscription plans and processing payments.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center justify-center px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#a57ba5] transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check for Data
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  const { overview, trends, distribution, performance, real_time, period } = analyticsData;
  const chartData = prepareChartData();

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#BC8BBC] to-[#6B46C1] rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Subscription Analytics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time insights • {period.start_date} to {period.end_date}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Time Range Filter - Fixed Design */}
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent w-full sm:w-48 appearance-none"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <button
            onClick={() => setShowDetailedCharts(!showDetailedCharts)}
            className="flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            {showDetailedCharts ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showDetailedCharts ? 'Simple' : 'Detailed'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalyticsData}
            disabled={refreshing}
            className="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-[#BC8BBC] to-[#6B46C1] text-white rounded-lg hover:from-[#a57ba5] hover:to-[#5d3d9f] disabled:opacity-50 transition-all duration-200 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Analytics Data Loaded Successfully
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Tracking {formatNumber(overview.active_subscribers)} active subscribers • {formatCurrency(overview.total_revenue)} total revenue
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-green-400" />
        </div>
      </div>

      {/* Real-time Stats Grid */}
      {real_time && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Now"
            value={formatNumber(real_time.active_now)}
            subtitle="Live subscribers"
            icon={Users}
            gradient="from-blue-500 to-cyan-500"
            trend={{ value: 12, direction: 'up' }}
          />

          <StatCard
            title="Today's Revenue"
            value={formatCurrency(real_time.today.revenue)}
            subtitle={`${real_time.today.paying_customers} payments`}
            icon={DollarSign}
            gradient="from-green-500 to-emerald-500"
            trend={{ value: 8, direction: 'up' }}
          />

          <StatCard
            title="New Today"
            value={real_time.today.new_subscriptions}
            subtitle="Subscriptions"
            icon={TrendingUp}
            gradient="from-purple-500 to-violet-500"
            trend={{ value: 15, direction: 'up' }}
          />

          <StatCard
            title="Cancellations"
            value={real_time.today.cancellations}
            subtitle="Today"
            icon={Clock}
            gradient="from-orange-500 to-amber-500"
            trend={{ value: 5, direction: 'down' }}
          />
        </div>
      )}

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Subscribers"
          value={formatNumber(overview.total_subscribers)}
          subtitle={`${overview.active_subscribers} active`}
          icon={Users}
          color="blue"
          change={calculateChange(overview.total_subscribers, overview.total_subscribers - overview.growth_metrics.net_growth)}
        />

        <StatCard
          title="Active Subscribers"
          value={formatNumber(overview.active_subscribers)}
          subtitle={`${overview.period_paying_customers} paid`}
          icon={Target}
          color="green"
        />

        <StatCard
          title="Total Revenue"
          value={formatCurrency(overview.total_revenue)}
          subtitle={`${overview.total_paying_customers} customers`}
          icon={DollarSign}
          color="purple"
        />

        <StatCard
          title="Avg Revenue/User"
          value={formatCurrency(overview.average_revenue_per_user)}
          subtitle="Active subscribers"
          icon={Crown}
          color="orange"
        />
      </div>

      {/* Enhanced Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Trend with Growth */}
        <ChartCard
          title="Revenue Performance"
          icon={Activity}
          description="Daily revenue with growth indicators"
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData.revenue}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="dateShort"
                angle={-45}
                textAnchor="end"
                height={50}
                fontSize={12}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' || name === 'movingAverage' ? formatCurrency(value) : formatPercentage(value),
                  name === 'movingAverage' ? 'Trend' :
                    name === 'growth' ? 'Growth Rate' : 'Revenue'
                ]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill={CHART_COLORS.primary}
                fillOpacity={0.8}
                name="Revenue"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growth"
                stroke={CHART_COLORS.success}
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Growth Rate"
                dot={false}
              />
              <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Subscriber Growth Analysis */}
        <ChartCard
          title="Subscriber Growth Analysis"
          icon={TrendingUp}
          description="New subscriptions vs cancellations"
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData.subscribers}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="dateShort"
                angle={-45}
                textAnchor="end"
                height={50}
                fontSize={12}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => [
                  formatNumber(value),
                  name === 'cumulative_subscribers' ? 'Total Subscribers' :
                    name === 'new_subscribers' ? 'New Subscribers' :
                      name === 'immediate_cancellations' ? 'Cancellations' : 'Net Growth'
                ]}
              />
              <Legend />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="cumulative_subscribers"
                stroke={CHART_COLORS.primary}
                fill={CHART_COLORS.primary}
                fillOpacity={0.1}
                name="Total Subscribers"
                strokeWidth={2}
              />
              <Bar
                yAxisId="left"
                dataKey="new_subscribers"
                fill={CHART_COLORS.success}
                name="New Subscribers"
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="immediate_cancellations"
                fill={CHART_COLORS.danger}
                name="Cancellations"
                opacity={0.8}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Plan Performance */}
        <ChartCard
          title="Plan Performance"
          icon={PieChart}
          description="Revenue distribution by subscription plan"
        >
          <div className="flex flex-col lg:flex-row items-start gap-4">
            <div className="w-full lg:w-2/5">
              <ResponsiveContainer width="100%" height={240}>
                <RechartsPieChart>
                  <Pie
                    data={chartData.revenueByPlan.filter(plan => plan.total_revenue > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ display_name, percent }) => `${display_name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    innerRadius={40}
                    dataKey="total_revenue"
                  >
                    {chartData.revenueByPlan.filter(plan => plan.total_revenue > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.plans[index % CHART_COLORS.plans.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-3/5">
              <div className="space-y-3">
                {chartData.revenueByPlan.filter(plan => plan.total_revenue > 0).map((plan, index) => (
                  <div key={plan.plan_type} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center flex-1">
                      <div
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS.plans[index % CHART_COLORS.plans.length] }}
                      ></div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm capitalize truncate">{plan.display_name}</div>
                        <div className="text-xs text-gray-500 truncate">{plan.unique_customers} customers</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-semibold text-sm">{formatCurrency(plan.total_revenue)}</div>
                      <div className="text-xs text-gray-500">
                        {plan.total_transactions} transactions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Growth Metrics */}
        <ChartCard
          title="Growth Metrics"
          icon={Zap}
          description="Key performance indicators over time"
        >
          <div className="grid grid-cols-2 gap-4 h-64">
            <MetricBox
              title="Retention Rate"
              value={formatPercentage(performance.retention.monthly_retention_rate)}
              subtitle="Monthly"
              color="green"
              icon={TrendingUp}
            />
            <MetricBox
              title="Churn Rate"
              value={formatPercentage(performance.retention.monthly_churn_rate)}
              subtitle="Monthly"
              color="red"
              icon={TrendingDown}
            />
            <MetricBox
              title="Renewal Rate"
              value={formatPercentage(performance.retention.auto_renewal_rate)}
              subtitle="Auto-renewal"
              color="blue"
              icon={RefreshCw}
            />
            <MetricBox
              title="Avg Duration"
              value={`${performance.retention.avg_subscription_duration.toFixed(0)} days`}
              subtitle="Subscription length"
              color="purple"
              icon={Clock}
            />
          </div>
        </ChartCard>
      </div>

      {/* Payment Methods & Additional Insights */}
      {showDetailedCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <ChartCard title="Payment Methods" icon={DollarSign}>
            <div className="space-y-3">
              {distribution.payment_methods?.map((method, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-sm font-medium capitalize">{method.provider}</span>
                      <div className="text-xs text-gray-500">
                        Success: {method.success_rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatNumber(method.user_count)}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(method.total_processed)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Quick Insights */}
          <ChartCard title="Quick Insights" icon={Sparkles}>
            <div className="space-y-4">
              <InsightItem
                title="Revenue Growth"
                value={formatPercentage(15.2)}
                description="Compared to last period"
                positive={true}
              />
              <InsightItem
                title="Subscriber Growth"
                value={formatPercentage(8.7)}
                description="New subscribers this month"
                positive={true}
              />
              <InsightItem
                title="Churn Impact"
                value={formatCurrency(2500)}
                description="Potential revenue loss"
                positive={false}
              />
              <InsightItem
                title="Best Performing"
                value="Standard Plan"
                description="Highest revenue per user"
                positive={true}
              />
            </div>
          </ChartCard>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
          Analytics updated • Period: {period.start_date} to {period.end_date}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last refresh: {new Date(analyticsData.last_updated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, gradient, color, change, trend }) => {
  const isGradient = !!gradient;

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className={`rounded-xl p-5 ${isGradient
      ? `bg-gradient-to-br ${gradient} text-white shadow-lg`
      : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${isGradient ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
            {title}
          </p>
          <p className={`text-2xl font-bold mt-2 ${isGradient ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${isGradient ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
              {subtitle}
            </p>
          )}

          {(change || trend) && (
            <div className={`flex items-center mt-2 text-xs ${(change?.direction === 'up' || trend?.direction === 'up')
                ? (isGradient ? 'text-white' : 'text-green-600')
                : (isGradient ? 'text-white' : 'text-red-600')
              }`}>
              {(change?.direction === 'up' || trend?.direction === 'up') ?
                <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              }
              <span className="ml-1">
                {change ? `${change.value}%` : `${trend.value}%`}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${isGradient
          ? 'bg-white/20'
          : colorClasses[color]
          }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Enhanced Chart Card Component
const ChartCard = ({ title, icon: Icon, description, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Icon className="w-5 h-5 mr-2" />
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

// New Metric Box Component
const MetricBox = ({ title, value, subtitle, color, icon: Icon }) => {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
  };

  return (
    <div className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center text-center ${colorClasses[color]}`}>
      <Icon className="w-6 h-6 mb-2" />
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
};

// New Insight Item Component
const InsightItem = ({ title, value, description, positive }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
    <div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
    </div>
    <div className={`text-sm font-semibold ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {value}
    </div>
  </div>
);

// Icons for metrics
const TrendingDown = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M22 17L13.5 8.5L8.5 13.5L2 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17H22V11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Helper function for change calculation
const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return { value: 100, direction: 'up' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change).toFixed(1),
    direction: change >= 0 ? 'up' : 'down'
  };
};