import React, { useState, useEffect } from "react";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";
import { 
  Users, 
  Video, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  RefreshCw,
  Smartphone,
  Monitor,
  Tv,
  Wifi,
  Activity,
  Crown,
  XCircle
} from "lucide-react";

export default function UsageMetrics({ subscription, realTimeStatus, t }) {
  const { t: translate } = useTranslation();
  const tFunc = t || translate;
  
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('month');

  // 🛡️ CRITICAL: Check if user has active subscription
  const hasActiveSubscription = () => {
    if (!subscription) return false;
    
    // Use backend real_time_status if available
    const status = subscription.real_time_status || subscription.status;
    return status === 'active' || status === 'grace_period' || status === 'trialing';
  };

  // 🛡️ CRITICAL: Check if subscription is scheduled
  const isScheduledSubscription = () => {
    if (!subscription) return false;
    const status = subscription.real_time_status || subscription.status;
    return status === 'scheduled';
  };

  useEffect(() => {
    // Only fetch usage data if user has active subscription
    if (hasActiveSubscription()) {
      fetchUsageData();
    } else {
      setLoading(false);
    }
  }, [timeRange, subscription]);

  const fetchUsageData = async () => {
    // Don't fetch if no active subscription
    if (!hasActiveSubscription()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/user-subscriptions/usage-metrics', {
        params: { period: timeRange }
      });
      
      if (response.data.success) {
        setUsageData(response.data.data);
      } else {
        setUsageData(null);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      setUsageData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (!hasActiveSubscription()) return;
    
    setRefreshing(true);
    await fetchUsageData();
  };

  const ProgressBar = ({ current, limit, label, showPercentage = true }) => {
    const percentage = limit === 'Unlimited' ? 0 : (current / limit) * 100;
    const isUnlimited = limit === 'Unlimited';
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">{label}</span>
          <span className="text-white font-medium">
            {isUnlimited ? current : `${current} / ${limit}`}
            {showPercentage && !isUnlimited && (
              <span className="text-gray-400 ml-1">({Math.round(percentage)}%)</span>
            )}
          </span>
        </div>
        {!isUnlimited && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#BC8BBC] to-[#9b69b2] h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  const SimpleBarChart = ({ data, color = "#BC8BBC", height = 40 }) => {
    const maxValue = Math.max(...data);
    
    return (
      <div className="flex items-end justify-between gap-1" style={{ height: `${height}px` }}>
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all duration-500 ease-out"
              style={{
                height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                background: `linear-gradient(to top, ${color}40, ${color})`,
                minHeight: '2px'
              }}
            />
            <span className="text-xs text-gray-500 mt-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const UsageCard = ({ icon, title, value, subtitle, children, className = "" }) => (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            {React.cloneElement(icon, { className: "w-5 h-5 text-[#BC8BBC]" })}
          </div>
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'tablet': return <Tv className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  // 🛡️ CRITICAL: Show no subscription message
  if (!subscription) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {tFunc('usageMetrics.noActiveSubscription')}
        </h3>
        <p className="text-gray-400 mb-4">
          {tFunc('usageMetrics.noSubscriptionDescription')}
        </p>
        <p className="text-gray-500 text-sm">
          {tFunc('usageMetrics.subscribeToStart')}
        </p>
      </div>
    );
  }

  // 🛡️ CRITICAL: Show scheduled subscription message
  if (isScheduledSubscription()) {
    return (
      <div className="text-center py-12">
        <Clock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {tFunc('usageMetrics.scheduledSubscription')}
        </h3>
        <p className="text-gray-400 mb-4">
          {/* HARDCODED: Using direct string interpolation */}
          Usage metrics will be available once your subscription starts on {new Date(subscription.start_date).toLocaleDateString()}.
        </p>
        <p className="text-gray-500 text-sm">
          {tFunc('usageMetrics.checkBackAfterStart')}
        </p>
      </div>
    );
  }

  // 🛡️ CRITICAL: Show inactive subscription message
  if (!hasActiveSubscription()) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {tFunc('usageMetrics.subscriptionInactive')}
        </h3>
        <p className="text-gray-400 mb-4">
          {tFunc('usageMetrics.inactiveDescription')}
        </p>
        <p className="text-gray-500 text-sm">
          {tFunc('usageMetrics.renewToAccess')}
        </p>
      </div>
    );
  }

  // Loading state (only shown for active subscriptions)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {tFunc('usageMetrics.loadingUsageData')}
          </h3>
          <p className="text-gray-400">{tFunc('usageMetrics.gatheringInsights')}</p>
        </div>
      </div>
    );
  }

  // No usage data available (but subscription is active)
  if (!usageData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          {tFunc('usageMetrics.noUsageData')}
        </h3>
        <p className="text-gray-400 mb-4">
          {tFunc('usageMetrics.startStreaming')}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          {tFunc('usageMetrics.watchContent')}
        </p>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {tFunc('usageMetrics.checkAgain')}
        </button>
      </div>
    );
  }

  // 🛡️ CRITICAL: Main usage metrics display (only for active subscriptions)
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{tFunc('usageMetrics.title')}</h3>
          <p className="text-gray-400 mt-1">{tFunc('usageMetrics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
            {['week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-[#BC8BBC] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === 'week' ? tFunc('usageMetrics.week') : tFunc('usageMetrics.month')}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {tFunc('usageMetrics.refresh')}
          </button>
        </div>
      </div>

      {/* Subscription Status Banner */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-300 font-semibold">{tFunc('usageMetrics.activeSubscription')}</p>
            <p className="text-green-200 text-sm">
              {/* HARDCODED: Using direct string interpolation */}
              You're currently on the <strong>{subscription.plan_name || subscription.plan_type} Plan</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Main Usage Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Active Devices */}
        <UsageCard
          icon={<Users />}
          title={tFunc('usageMetrics.activeDevices')}
          value={`${usageData.devices.current}/${usageData.devices.limit}`}
          subtitle={`${Math.round((usageData.devices.current / usageData.devices.limit) * 100)}% ${tFunc('usageMetrics.ofLimit')}`}
        >
          <ProgressBar 
            current={usageData.devices.current} 
            limit={usageData.devices.limit} 
            // HARDCODED: Using English directly
            label="Connected devices"
          />
          
          {/* Active Devices List */}
          <div className="mt-4 space-y-2">
            <p className="text-gray-400 text-sm font-medium">
              {tFunc('usageMetrics.currentlyActive')}:
            </p>
            {usageData.devices.devices && usageData.devices.devices.length > 0 ? (
              usageData.devices.devices.map((device, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device.type)}
                    <span className="text-white">{device.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{device.last_active}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">{tFunc('usageMetrics.noActiveDevices')}</p>
            )}
          </div>
        </UsageCard>

        {/* Right Column - Streaming & Data */}
        <div className="space-y-6">
          {/* Streaming Hours */}
          <UsageCard
            icon={<Video />}
            title={tFunc('usageMetrics.streamingTime')}
            value={`${usageData.streaming.hours}h`}
            subtitle={`${usageData.streaming.average}h ${tFunc('usageMetrics.dailyAverage')}`}
          >
            <div className="space-y-4">
              <SimpleBarChart data={usageData.streaming.daily_breakdown} />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{tFunc('usageMetrics.thisWeek')}</span>
                {/* HARDCODED: Using direct string interpolation */}
                <span>Total: {usageData.streaming.hours}h</span>
              </div>
            </div>
          </UsageCard>

          {/* Data Usage */}
          <UsageCard
            icon={<Activity />}
            title={tFunc('usageMetrics.dataUsage')}
            value={`${usageData.data.used} GB`}
            subtitle={usageData.data.limit === 'Unlimited' ? 
              tFunc('usageMetrics.unlimitedData') : 
              `${tFunc('usageMetrics.of')} ${usageData.data.limit}`
            }
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className={`w-4 h-4 ${usageData.data.trend === 'up' ? 'text-green-400' : 'text-blue-400'}`} />
                <span className="text-white text-sm">
                  {usageData.data.trend === 'up' ? 
                    tFunc('usageMetrics.increasing') : 
                    tFunc('usageMetrics.stable')
                  }
                </span>
              </div>
              {usageData.data.limit !== 'Unlimited' && (
                <div className="text-right">
                  <div className="text-white font-semibold">
                    {Math.round((usageData.data.used / parseInt(usageData.data.limit)) * 100)}%
                  </div>
                  <div className="text-gray-400 text-xs">{tFunc('usageMetrics.ofLimitUsed')}</div>
                </div>
              )}
            </div>
          </UsageCard>
        </div>
      </div>

      {/* Usage Insights */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#BC8BBC]" />
          {tFunc('usageMetrics.usageInsights')}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-gray-400 text-sm mb-3 font-medium">{tFunc('usageMetrics.yourPatterns')}</h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                <span className="text-white text-sm">{tFunc('usageMetrics.activeDevices')}</span>
                {/* HARDCODED: Using direct string interpolation */}
                <span className="text-[#BC8BBC] font-semibold">
                  {usageData.devices.current} devices
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                <span className="text-white text-sm">{tFunc('usageMetrics.totalWatchTime')}</span>
                {/* HARDCODED: Using direct string interpolation */}
                <span className="text-[#BC8BBC] font-semibold">
                  {usageData.streaming.hours} hours
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                <span className="text-white text-sm">{tFunc('usageMetrics.dailyAverage')}</span>
                {/* HARDCODED: Using direct string interpolation */}
                <span className="text-[#BC8BBC] font-semibold">
                  {usageData.streaming.average}h/day
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-gray-400 text-sm mb-3 font-medium">{tFunc('usageMetrics.quickTips')}</h5>
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  {/* HARDCODED: Using English directly */}
                  💡 <strong>Watch in off-peak hours</strong> for better streaming quality
                </p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-300 text-sm">
                  {/* HARDCODED: Using English directly */}
                  📱 <strong>Use Wi-Fi when available</strong> to save mobile data
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-purple-300 text-sm">
                  {/* HARDCODED: Using English directly */}
                  ⚡ <strong>Log out from unused devices</strong> to free up slots
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Last Updated */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          {/* HARDCODED: Using English directly */}
          Data updated in real-time • Showing {timeRange}ly usage
        </p>
      </div>
    </div>
  );
}