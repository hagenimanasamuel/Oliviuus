import React, { useEffect, useState } from "react";
import { User, Activity, CheckCircle, Ban, Clock4, CreditCard, Calendar, Globe, Shield, Wifi, TrendingUp, AlertTriangle, Clock, Users, Mail, Phone, Key, MapPin, Monitor, Smartphone, Tablet, Tv, Check, X } from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

// Helper functions for user display
const getUserDisplayName = (userData) => {
  if (!userData) return 'User';
  
  if (userData.username) return userData.username;
  
  if (userData.first_name) {
    return `${userData.first_name} ${userData.last_name || ''}`.trim();
  }
  
  if (userData.email) {
    return userData.email.split('@')[0];
  }
  
  if (userData.phone) {
    return `User (${userData.phone.substring(userData.phone.length - 4)})`;
  }
  
  return 'User';
};

const getUserPrimaryIdentifier = (userData) => {
  if (!userData) return 'No identifier';
  
  if (userData.email) return userData.email;
  if (userData.phone) return userData.phone;
  if (userData.username) return `@${userData.username}`;
  
  return 'No identifier';
};

const formatDate = (dateString, t) => {
  if (!dateString) return t("overviewTab.time.never");
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const getTimeAgo = (dateString, t) => {
  if (!dateString) return t("overviewTab.time.never");
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t("overviewTab.time.today");
    if (diffDays === 1) return t("overviewTab.time.yesterday");
    if (diffDays < 7) return t("overviewTab.time.daysAgo", { count: diffDays });
    if (diffDays < 30) return t("overviewTab.time.weeksAgo", { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t("overviewTab.time.monthsAgo", { count: Math.floor(diffDays / 30) });
    return t("overviewTab.time.yearsAgo", { count: Math.floor(diffDays / 365) });
  } catch (error) {
    return t("overviewTab.time.unknown");
  }
};

const getDeviceIcon = (deviceType) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile': return <Smartphone className="w-4 h-4" />;
    case 'tablet': return <Tablet className="w-4 h-4" />;
    case 'smarttv': return <Tv className="w-4 h-4" />;
    case 'desktop': return <Monitor className="w-4 h-4" />;
    default: return <Monitor className="w-4 h-4" />;
  }
};

const getDeviceName = (deviceType) => {
  switch (deviceType?.toLowerCase()) {
    case 'mobile': return 'Mobile';
    case 'tablet': return 'Tablet';
    case 'smarttv': return 'Smart TV';
    case 'desktop': return 'Desktop';
    case 'web': return 'Web';
    default: return deviceType || 'Unknown';
  }
};

const OverviewTab = ({ userDetails, user, statusConfig }) => {
  const { t } = useTranslation();
  const [overviewData, setOverviewData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/user/${user.id}/overview`);
        setOverviewData(response.data);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscriptionData = async () => {
      try {
        setSubscriptionLoading(true);
        const response = await api.get(`/user/${user.id}/subscription`);
        setSubscriptionData(response.data.subscription);
      } catch (error) {
        console.error("Failed to fetch subscription data:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (user?.id) {
      fetchOverviewData();
      fetchSubscriptionData();
    }
  }, [user?.id]);

  // Use real data from overviewData or fallback to props
  const userData = overviewData?.user || user;
  const preferences = overviewData?.preferences || {};
  const activity = overviewData?.activity || {};
  const subscription = subscriptionData || overviewData?.subscription || {};

  const getSubscriptionConfig = (subscription) => {
    let planName = 'free';
    
    if (typeof subscription === 'string') {
      planName = subscription.toLowerCase();
    } else if (subscription && typeof subscription === 'object') {
      planName = (subscription.type || subscription.name || 'free').toLowerCase().trim();
    }
    
    switch (planName) {
      case "mobile": 
      case "custom":
        return { 
          label: "Custom", 
          color: "text-purple-400", 
          bg: "bg-purple-400/10",
          icon: "✨"
        };
      case "basic": 
        return { 
          label: "Basic", 
          color: "text-blue-400", 
          bg: "bg-blue-400/10",
          icon: "⚡"
        };
      case "standard": 
        return { 
          label: "Standard", 
          color: "text-green-400", 
          bg: "bg-green-400/10",
          icon: "🚀"
        };
      case "family":
        return { 
          label: "Family", 
          color: "text-orange-400", 
          bg: "bg-orange-400/10",
          icon: "👨‍👩‍👧‍👦"
        };
      case "free_trial":
        return { 
          label: "Free Trial", 
          color: "text-yellow-400", 
          bg: "bg-yellow-400/10",
          icon: "🆓"
        };
      case "none":
      case "free": 
      default: 
        return { 
          label: "Free", 
          color: "text-gray-400", 
          bg: "bg-gray-400/10",
          icon: "🔓"
        };
    }
  };

  const subscriptionConfig = getSubscriptionConfig(subscription);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {/* User Info Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{t("overviewTab.title")}</span>
          </h3>
          <div className="flex items-center space-x-2">
            <div className={clsx(
              "flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-medium",
              statusConfig.bg, 
              statusConfig.color
            )}>
              <statusConfig.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">{statusConfig.label === t("userModal.status.active") ? t("userModal.status.active") : t("userModal.status.inactive")}</span>
            </div>
          </div>
        </div>
        
        {/* Status & Subscription Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wide">{t("overviewTab.status")}</label>
            <div className={clsx("flex items-center space-x-2 px-3 py-2 rounded-lg", statusConfig.bg)}>
              <statusConfig.icon className={clsx("w-4 h-4", statusConfig.color)} />
              <span className={clsx("text-sm font-medium", statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wide">{t("overviewTab.plan")}</label>
            <div className={clsx("flex items-center space-x-2 px-3 py-2 rounded-lg", subscriptionConfig.bg)}>
              <span className={clsx("text-sm font-medium", subscriptionConfig.color)}>
                {subscriptionLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>{subscriptionConfig.icon} {subscriptionConfig.label}</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="space-y-3">
          {/* Display Name */}
          {getUserDisplayName(userData) !== 'User' && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t("overviewTab.displayName")}</span>
              </span>
              <span className="text-white text-sm font-medium truncate ml-3">
                {getUserDisplayName(userData)}
              </span>
            </div>
          )}

          {/* Email */}
          {userData.email && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t("overviewTab.email")}</span>
              </span>
              <div className="text-right ml-3 min-w-0 flex-1">
                <span className="text-white text-sm font-medium block truncate">
                  {userData.email}
                </span>
                <div className="flex items-center space-x-1 justify-end">
                  {userData.email_verified ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs">{t("overviewTab.verified")}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 text-xs">{t("overviewTab.pending")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phone */}
          {userData.phone && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t("overviewTab.phone")}</span>
              </span>
              <div className="text-right ml-3 min-w-0 flex-1">
                <span className="text-white text-sm font-medium block truncate">
                  {userData.phone}
                </span>
                <div className="flex items-center space-x-1 justify-end">
                  {userData.phone_verified ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs">{t("overviewTab.verified")}</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-400 text-xs">{t("overviewTab.pending")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Username */}
          {userData.username && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t("overviewTab.username")}</span>
              </span>
              <div className="text-right ml-3 min-w-0 flex-1">
                <span className="text-white text-sm font-medium block truncate">
                  @{userData.username}
                </span>
                {userData.username_verified && (
                  <div className="flex items-center space-x-1 justify-end">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 text-xs">{t("overviewTab.verified")}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Oliviuus ID */}
          {userData.oliviuus_id && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                <Key className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t("overviewTab.oliviuusId")}</span>
              </span>
              <span className="text-white text-sm font-medium truncate ml-3 font-mono text-xs sm:text-sm">
                {userData.oliviuus_id}
              </span>
            </div>
          )}

          {/* Member Since */}
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("overviewTab.memberSince")}</span>
            </span>
            <div className="text-right ml-3 min-w-0 flex-1">
              <span className="text-white text-sm font-medium block truncate">
                {formatDate(userData.created_at, t)}
              </span>
              <span className="text-gray-500 text-xs truncate">
                {getTimeAgo(userData.created_at, t)}
              </span>
            </div>
          </div>
          
          {/* Last Login */}
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("overviewTab.lastLogin")}</span>
            </span>
            <div className="text-right ml-3 min-w-0 flex-1">
              <span className="text-white text-sm font-medium block truncate">
                {formatDate(activity.last_login || userData.last_login_at, t)}
              </span>
              <span className="text-gray-500 text-xs truncate">
                {getTimeAgo(activity.last_login || userData.last_login_at, t)}
              </span>
            </div>
          </div>
          
          {/* Language */}
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("overviewTab.language")}</span>
            </span>
            <span className="text-white text-sm font-medium capitalize truncate ml-3">
              {preferences.language || 'English'}
            </span>
          </div>

          {/* Primary Device */}
          {userData.primary_device_type && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                {getDeviceIcon(userData.primary_device_type)}
                <span className="truncate">{t("overviewTab.primaryDevice")}</span>
              </span>
              <div className="text-right ml-3 min-w-0 flex-1">
                <span className="text-white text-sm font-medium block truncate">
                  {getDeviceName(userData.primary_device_type)}
                </span>
                {userData.primary_device_name && (
                  <span className="text-gray-500 text-xs truncate">
                    {userData.primary_device_name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Last IP */}
          {activity.last_ip && (
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400 text-sm flex items-center space-x-2 min-w-0 flex-1">
                <Wifi className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{t("overviewTab.lastIp")}</span>
              </span>
              <span className="text-white text-sm font-medium font-mono truncate ml-3 text-xs sm:text-sm">
                {activity.last_ip}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>{t("overviewTab.activitySummary")}</span>
        </h3>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center hover:bg-gray-800/70 transition-colors group">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white group-hover:scale-105 transition-transform">
              {activity.total_logins || 0}
            </div>
            <div className="text-gray-400 text-xs mt-1">{t("overviewTab.stats.totalLogins")}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center hover:bg-gray-800/70 transition-colors group">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-400 group-hover:scale-105 transition-transform">
              {activity.current_streak || 0}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {t("overviewTab.stats.currentStreak")}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center hover:bg-gray-800/70 transition-colors group">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-red-400 group-hover:scale-105 transition-transform">
              {activity.failed_attempts || 0}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {t("overviewTab.stats.failedLogins")}
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 text-center hover:bg-gray-800/70 transition-colors group">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-blue-400 group-hover:scale-105 transition-transform font-mono text-sm sm:text-base">
              {activity.avg_session || "0m 00s"}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {t("overviewTab.stats.avgSession")}
            </div>
          </div>
        </div>

        {/* Additional activity information */}
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
          <h4 className="text-white font-medium text-sm flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{t("overviewTab.recentActivity")}</span>
          </h4>
          <div className="text-gray-400 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-2">
                <span>{t("overviewTab.stats.todayLogins")}:</span>
              </span>
              <span className="text-gray-300 font-medium">{activity.today_logins || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-2">
                <span>{t("overviewTab.stats.thisWeek")}:</span>
              </span>
              <span className="text-gray-300 font-medium">{activity.week_logins || 0} {t("overviewTab.stats.totalLogins").toLowerCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center space-x-2">
                <span>{t("overviewTab.stats.lastDevice")}:</span>
              </span>
              <span className="text-gray-300 font-medium text-right max-w-[120px] truncate">
                {activity.last_device || t("overviewTab.time.unknown")}
              </span>
            </div>
            {!subscriptionLoading && subscription.status && (
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span>{t("overviewTab.stats.subscription")}:</span>
                </span>
                <span className={clsx(
                  "font-medium",
                  subscription.status === 'active' ? "text-green-400" : "text-yellow-400"
                )}>
                  {subscription.status === 'active' ? t("overviewTab.stats.active") : t("overviewTab.stats.inactive")}
                </span>
              </div>
            )}
            {subscription.price > 0 && (
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span>{t("overviewTab.stats.subscriptionPrice")}:</span>
                </span>
                <span className="text-gray-300 font-medium">
                  {subscription.currency || 'RWF'} {subscription.price}
                </span>
              </div>
            )}
            {activity.avg_session_minutes && (
              <div className="flex justify-between items-center">
                <span className="flex items-center space-x-2">
                  <span>{t("overviewTab.stats.avgSessionTime")}:</span>
                </span>
                <span className="text-gray-300 font-medium">
                  {Math.round(activity.avg_session_minutes)} {t("overviewTab.stats.avgSession").split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/20 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{activity.active_sessions || 0}</div>
            <div className="text-gray-400 text-xs">{t("overviewTab.stats.activeSessions")}</div>
          </div>
          <div className="bg-gray-800/20 rounded-lg p-3 text-center">
            <div className="text-white font-bold text-lg">{activity.total_sessions || 0}</div>
            <div className="text-gray-400 text-xs">{t("overviewTab.stats.totalSessions")}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;