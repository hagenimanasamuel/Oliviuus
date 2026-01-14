import React, { useState, useEffect } from "react";
import { 
  BarChart3, Users, MessageSquare, Clock, AlertTriangle, CheckCircle, 
  RefreshCw, TrendingUp, PieChart, Mail, Phone, Calendar,
  ArrowUp, ArrowDown
} from "lucide-react";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

// Simple chart components
const BarChart = ({ data, colors, height = 200 }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="flex items-end justify-between h-40 space-x-2 pt-4">
      {data.map((item, index) => (
        <div key={item.label} className="flex flex-col items-center flex-1">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
            {item.label}
          </div>
          <div
            className="w-full rounded-t transition-all duration-500 hover:opacity-80"
            style={{
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: colors[index % colors.length],
              minHeight: '8px'
            }}
          ></div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data, colors, size = 120 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulated = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 42 42">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${percentage} ${100 - percentage}`;
          const strokeDashoffset = -accumulated;
          accumulated += percentage;

          return (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.91549430918954"
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 21 21)"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ percentage, color, label }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{
          width: `${percentage}%`,
          backgroundColor: color
        }}
      ></div>
    </div>
  </div>
);

export default function ContactStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, today, week, month

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contact/admin/contacts/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Status distribution for donut chart
  const statusData = stats ? [
    { label: t('contact.status.new'), value: stats.overview.new },
    { label: t('contact.status.open'), value: stats.overview.open },
    { label: t('contact.status.in_progress'), value: stats.overview.in_progress },
    { label: t('contact.status.awaiting_reply'), value: stats.overview.awaiting_reply },
    { label: t('contact.status.resolved'), value: stats.overview.resolved },
    { label: t('contact.status.closed'), value: stats.overview.closed }
  ].filter(item => item.value > 0) : [];

  // Priority data for bar chart
  const priorityData = stats ? [
    { label: t('contact.priority.urgent'), value: stats.overview.urgent },
    { label: t('contact.priority.high'), value: stats.overview.high },
    { label: t('contact.priority.medium'), value: stats.overview.medium },
    { label: t('contact.priority.low'), value: stats.overview.low }
  ] : [];

  // Response rate calculation
  const totalContacts = stats?.overview.total || 0;
  const respondedContacts = (stats?.overview.total || 0) - (stats?.overview.new || 0);
  const responseRate = totalContacts > 0 ? Math.round((respondedContacts / totalContacts) * 100) : 0;

  // Resolution rate
  const resolvedContacts = (stats?.overview.resolved || 0) + (stats?.overview.closed || 0);
  const resolutionRate = totalContacts > 0 ? Math.round((resolvedContacts / totalContacts) * 100) : 0;

  // Color schemes
  const statusColors = ['#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#10B981', '#6B7280'];
  const priorityColors = ['#EF4444', '#F59E0B', '#EAB308', '#10B981'];
  const categoryColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#84CC16'];

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={color.replace('text-', 'text-').split(' ')[0]} size={24} />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center mt-3 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          <span className="ml-1">{Math.abs(trend)}% {t('contact.stats.fromLastPeriod')}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('contact.stats.loading')}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">{t('contact.stats.failedToLoad')}</p>
        <button
          onClick={fetchStats}
          className="text-[#BC8BBC] hover:text-[#9b69b2] font-medium"
        >
          {t('contact.stats.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contact.stats.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('contact.stats.subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#BC8BBC]"
          >
            <option value="all">{t('contact.stats.timeRanges.all')}</option>
            <option value="today">{t('contact.stats.timeRanges.today')}</option>
            <option value="week">{t('contact.stats.timeRanges.week')}</option>
            <option value="month">{t('contact.stats.timeRanges.month')}</option>
          </select>
          <button
            onClick={fetchStats}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw size={16} />
            <span>{t('contact.stats.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('contact.stats.totalContacts')}
          value={stats.overview.total}
          subtitle={t('contact.stats.allTimeContacts')}
          icon={MessageSquare}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
          trend={12}
        />
        <StatCard
          title={t('contact.stats.responseRate')}
          value={`${responseRate}%`}
          subtitle={t('contact.stats.respondedOfTotal', { responded: respondedContacts, total: totalContacts })}
          icon={TrendingUp}
          color="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
          trend={8}
        />
        <StatCard
          title={t('contact.stats.avgResponseTime')}
          value="2.4h"
          subtitle={t('contact.stats.acrossAllContacts')}
          icon={Clock}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
          trend={-5}
        />
        <StatCard
          title={t('contact.stats.resolutionRate')}
          value={`${resolutionRate}%`}
          subtitle={t('contact.stats.resolvedContacts', { resolved: resolvedContacts })}
          icon={CheckCircle}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
          trend={15}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('contact.stats.statusDistribution')}</h3>
            <PieChart className="text-gray-400" size={20} />
          </div>
          <div className="flex items-center justify-center">
            <DonutChart data={statusData} colors={statusColors} size={160} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {statusData.map((item, index) => (
              <div key={item.label} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColors[index] }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white ml-auto">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('contact.stats.priorityOverview')}</h3>
            <AlertTriangle className="text-gray-400" size={20} />
          </div>
          <BarChart data={priorityData} colors={priorityColors} />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {priorityData.map((item, index) => (
              <div key={item.label} className="text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: priorityColors[index] }}
                ></div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('contact.stats.categoryBreakdown')}</h3>
          <div className="space-y-4">
            {stats.categories.map((category, index) => (
              <ProgressBar
                key={category.category}
                percentage={Math.round((category.count / totalContacts) * 100)}
                color={categoryColors[index % categoryColors.length]}
                label={t(`contact.category.${category.category}`)}
              />
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t('contact.stats.performanceMetrics')}</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Mail className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{t('contact.stats.emailResponses')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('contact.stats.totalSentReplies')}</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.overview.total - stats.overview.new}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{t('contact.stats.satisfactionRate')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('contact.stats.estimatedFromResolutions')}</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {resolutionRate}%
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Clock className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{t('contact.stats.activeConversations')}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t('contact.stats.currentlyInProgress')}</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.overview.in_progress + stats.overview.awaiting_reply}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{stats.overview.new}</div>
          <div className="text-sm opacity-90">{t('contact.stats.newToday')}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{stats.overview.urgent}</div>
          <div className="text-sm opacity-90">{t('contact.priority.urgent')}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{stats.overview.open}</div>
          <div className="text-sm opacity-90">{t('contact.status.open')}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="text-2xl font-bold">{stats.overview.resolved}</div>
          <div className="text-sm opacity-90">{t('contact.status.resolved')}</div>
        </div>
      </div>
    </div>
  );
}