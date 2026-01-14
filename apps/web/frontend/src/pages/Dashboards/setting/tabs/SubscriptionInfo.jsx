import React, { useState, useEffect, useRef, Suspense } from "react";
import { MoreHorizontal, AlertTriangle, CheckCircle, Clock, XCircle, RefreshCw, CreditCard, BarChart3, Settings } from "lucide-react";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

// Lazy load components for better performance
const CurrentPlan = React.lazy(() => import("./subscription/CurrentPlan"));
const History = React.lazy(() => import("./subscription/History"));
const PaymentMethods = React.lazy(() => import("./subscription/PaymentMethods"));
const UsageMetrics = React.lazy(() => import("./subscription/UsageMetrics"));

export default function SubscriptionInfo({ user }) {
  const { t } = useTranslation();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realTimeStatus, setRealTimeStatus] = useState(null);

  // Subscription sub-tabs with translations
  const subscriptionSubTabs = [
    { id: "current", label: t("subscription.tabs.current"), icon: CheckCircle },
    { id: "history", label: t("subscription.tabs.history"), icon: CreditCard },
    { id: "payment", label: t("subscription.tabs.payment"), icon: Settings },
    { id: "usage", label: t("subscription.tabs.usage"), icon: BarChart3 }
  ];

  const [activeSubTab, setActiveSubTab] = useState(subscriptionSubTabs[0].id);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);

  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch real-time subscription status from backend
  const fetchRealTimeStatus = async () => {
    try {
      const response = await api.get('/user-subscriptions/status', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.data.success) {
        setRealTimeStatus(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Real-time status check failed:', error);
      return null;
    }
  };

  // Enhanced subscription data fetch with real-time validation
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get real-time status from backend
      const statusData = await fetchRealTimeStatus();
      
      // Get detailed subscription data
      const response = await api.get('/user-subscriptions/current', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (response.data.success) {
        const subscription = response.data.data;
        
        // Validate subscription against real-time status
        if (subscription && statusData) {
          const validatedSubscription = {
            ...subscription,
            // Use backend-provided real_time_status
            real_time_status: subscription.security_validation?.real_time_status || 
                            subscription.real_time_status || 
                            subscription.status,
            // Use backend validation data
            is_currently_active: subscription.security_validation?.is_currently_active || false,
            is_scheduled: subscription.security_validation?.is_scheduled || false,
            is_expired: subscription.security_validation?.is_expired || false,
            is_in_grace_period: subscription.security_validation?.is_in_grace_period || false,
          };
          
          setSubscriptionData(validatedSubscription);
        } else {
          setSubscriptionData(subscription);
        }
      } else {
        throw new Error(response.data.message || t('subscription.errors.loadFailed'));
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err.response?.data?.message || err.message || t('subscription.errors.loadFailed'));
      
      // On error, clear subscription data to prevent false access
      setSubscriptionData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription data on component mount
  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  // Set up periodic real-time status checks
  useEffect(() => {
    const interval = setInterval(() => {
      if (subscriptionData) {
        fetchRealTimeStatus();
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [subscriptionData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMore &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMore(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMore]);

  // Handle responsive overflow
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      // Reset to measure all buttons
      subscriptionSubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab.id}"]`);
        if (!btn) return;
        btn.style.display = "block";
      });

      // Calculate visible tabs with space for "More" button
      subscriptionSubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab.id}"]`);
        if (!btn) return;
        const btnWidth = btn.offsetWidth + 8; // spacing
        if (usedWidth + btnWidth < containerWidth - 80) {
          newVisible.push(tab);
          usedWidth += btnWidth;
        } else {
          newOverflow.push(tab);
        }
      });

      // Hide overflowed tabs
      subscriptionSubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab.id}"]`);
        if (!btn) return;
        const isVisible = newVisible.find(t => t.id === tab.id);
        btn.style.display = isVisible ? "block" : "none";
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [subscriptionSubTabs]);

  // Enhanced status detection using backend data only
  const getSubscriptionStatus = () => {
    if (!subscriptionData) return 'no_subscription';
    
    const status = subscriptionData.real_time_status || 
                  subscriptionData.security_validation?.real_time_status || 
                  subscriptionData.status;
    
    return status;
  };

  const renderSubTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
          <span className="ml-3 text-gray-400 text-sm sm:text-base mt-2 sm:mt-0">
            {t('subscription.loading')}
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('subscription.errors.title')}
          </h3>
          <p className="text-gray-400 text-sm sm:text-base mb-4 max-w-md mx-auto">
            {error}
          </p>
          <button
            onClick={fetchSubscriptionData}
            className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            {t('subscription.errors.tryAgain')}
          </button>
        </div>
      );
    }

    // Pass real-time status to all components
    const enhancedProps = {
      subscription: subscriptionData,
      realTimeStatus: realTimeStatus,
      onRefresh: fetchSubscriptionData,
      t: t // Pass translation function to child components
    };

    switch (activeSubTab) {
      case "current":
        return <CurrentPlan {...enhancedProps} />;
      case "history":
        return <History {...enhancedProps} />;
      case "payment":
        return <PaymentMethods {...enhancedProps} />;
      case "usage":
        return <UsageMetrics {...enhancedProps} />;
      default:
        return null;
    }
  };

  // Clean status banner configuration - PRODUCTION READY
  const getStatusConfig = () => {
    const status = getSubscriptionStatus();
    
    const configs = {
      active: {
        icon: CheckCircle,
        title: t('subscription.status.active.title'),
        description: t('subscription.status.active.description'),
        styles: 'bg-green-500/10 border-green-500/20 text-green-400'
      },
      scheduled: {
        icon: Clock,
        title: t('subscription.status.scheduled.title'),
        description: t('subscription.status.scheduled.description'),
        styles: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
      },
      grace_period: {
        icon: AlertTriangle,
        title: t('subscription.status.grace_period.title'),
        description: t('subscription.status.grace_period.description'),
        styles: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
      },
      cancelled: {
        icon: Clock,
        title: t('subscription.status.cancelled.title'),
        description: t('subscription.status.cancelled.description'),
        styles: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
      },
      expired: {
        icon: XCircle,
        title: t('subscription.status.expired.title'),
        description: t('subscription.status.expired.description'),
        styles: 'bg-red-500/10 border-red-500/20 text-red-400'
      },
      trialing: {
        icon: CheckCircle,
        title: t('subscription.status.trialing.title'),
        description: t('subscription.status.trialing.description'),
        styles: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
      },
      no_subscription: {
        icon: XCircle,
        title: t('subscription.status.no_subscription.title'),
        description: t('subscription.status.no_subscription.description'),
        styles: 'bg-gray-500/10 border-gray-500/20 text-gray-400'
      }
    };
    
    return configs[status] || configs.no_subscription;
  };

  // Get display text based on backend status
  const getStatusDisplayText = () => {
    const status = getSubscriptionStatus();
    
    if (status === 'active' || status === 'trialing' || status === 'grace_period') {
      return t('subscription.status.renews');
    } else if (status === 'scheduled') {
      return t('subscription.status.starts');
    } else {
      return t('subscription.status.ends');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6 bg-gray-900 rounded-lg shadow-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            {t('subscription.title')}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            {t('subscription.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchSubscriptionData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 text-white rounded-lg transition-colors w-full sm:w-auto text-sm sm:text-base"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('subscription.refresh')}
        </button>
      </div>

      {/* Clean Status Banner - PRODUCTION READY */}
      {subscriptionData && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${getStatusConfig().styles}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 flex-1">
              {(() => {
                const IconComponent = getStatusConfig().icon;
                return <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />;
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">
                  {getStatusConfig().title}
                </p>
                <p className="text-sm opacity-80 mt-1 line-clamp-2 sm:line-clamp-1">
                  {getStatusConfig().description}
                </p>
              </div>
            </div>
            {subscriptionData.end_date && (
              <div className="text-right flex-shrink-0">
                <p className="text-sm opacity-80 whitespace-nowrap">
                  {getStatusDisplayText()}
                </p>
                <p className="font-semibold text-sm sm:text-base whitespace-nowrap">
                  {new Date(subscriptionData.end_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center relative border-b border-gray-700 mb-4 sm:mb-6" ref={containerRef}>
        {subscriptionSubTabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap transition text-sm sm:text-base ${
              activeSubTab === tab.id
                ? "border-b-2 border-[#BC8BBC] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xs:inline">{tab.label}</span>
          </button>
        ))}

        {/* Overflow "More" button */}
        {overflowTabs.length > 0 && (
          <div className="ml-auto relative" ref={moreButtonRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 rounded-full hover:bg-gray-800 transition flex items-center gap-1 text-sm sm:text-base"
            >
              <MoreHorizontal size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{t('subscription.more')}</span>
            </button>
            {showMore && (
              <div
                className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-30"
                ref={dropdownRef}
              >
                {overflowTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setShowMore(false);
                    }}
                    className={`flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition ${
                      activeSubTab === tab.id
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-tab content */}
      <div className="min-h-[300px] sm:min-h-[400px]">
        <Suspense fallback={
          <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 px-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
            <span className="ml-3 text-gray-400 text-sm sm:text-base mt-2 sm:mt-0">
              {t('subscription.loading')}
            </span>
          </div>
        }>
          {renderSubTabContent()}
        </Suspense>
      </div>
    </div>
  );
}