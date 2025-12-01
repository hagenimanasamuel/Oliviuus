import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Video, 
  Download, 
  Star, 
  Zap,
  Shield,
  Crown,
  Smartphone,
  Monitor,
  Tv,
  Gamepad,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Info,
  HelpCircle,
  PlusCircle
} from "lucide-react";
import api from "../../../../../api/axios";
import ContactSupport from "../../../../../components/subscription/HelpSupport";
import PlanChangeModal from "./PlanChangeModal";
import NewPlanModal from "./NewPlanModal";

export default function CurrentPlan({ subscription, onRefresh, realTimeStatus }) {
  const [loading, setLoading] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const handleContactSupport = () => {
    setShowContactSupport(true);
    setTimeout(() => {
      document.getElementById('contact-support-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handlePlanChangeSuccess = () => {
    setShowPlanChangeModal(false);
    onRefresh();
  };

  const handleNewPlanSuccess = () => {
    setShowNewPlanModal(false);
    onRefresh();
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 🛡️ CRITICAL: Use backend-provided time remaining instead of frontend calculation
  const getDaysRemaining = () => {
    if (!subscription) return 0;
    
    // 🛡️ Use backend-calculated time remaining if available
    if (subscription.time_remaining) {
      return subscription.time_remaining.days || 0;
    }
    
    // Fallback to frontend calculation (should rarely be needed)
    const end = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 🛡️ CRITICAL: Get days until start for scheduled subscriptions
  const getDaysUntilStart = () => {
    if (!subscription || !subscription.start_date) return 0;
    
    const start = new Date(subscription.start_date);
    const now = new Date();
    const diffTime = start - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 🛡️ CRITICAL: Use backend-provided status instead of frontend logic
  const getSubscriptionStatus = () => {
    if (!subscription) return 'no_subscription';
    
    // 🛡️ Use backend real_time_status if available
    return subscription.real_time_status || subscription.status;
  };

  // 🛡️ CRITICAL: Check if subscription is currently active (not scheduled)
  const isCurrentlyActive = () => {
    const status = getSubscriptionStatus();
    return status === 'active' || status === 'grace_period' || status === 'trialing';
  };

  // 🛡️ CRITICAL: Check if subscription is scheduled for future
  const isScheduledSubscription = () => {
    const status = getSubscriptionStatus();
    return status === 'scheduled';
  };

  // 🛡️ CRITICAL: Check if we should show "No Current Subscription"
  const shouldShowNoSubscription = () => {
    if (!subscription) return true;
    
    const status = getSubscriptionStatus();
    // Show "No Current Subscription" only for expired, cancelled, or no subscription
    return status === 'expired' || status === 'cancelled' || status === 'no_subscription';
  };

  // Get plan icon based on type
  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'family':
        return <Users className="w-6 h-6 text-purple-400" />;
      case 'standard':
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 'basic':
        return <Monitor className="w-6 h-6 text-blue-400" />;
      case 'mobile':
        return <Smartphone className="w-6 h-6 text-green-400" />;
      default:
        return <Star className="w-6 h-6 text-gray-400" />;
    }
  };

  // 🛡️ CRITICAL: Get status badge using backend status
  const getStatusBadge = () => {
    const status = getSubscriptionStatus();
    
    const statusConfig = {
      active: { color: 'bg-green-500 text-white', icon: CheckCircle, text: 'Active' },
      scheduled: { color: 'bg-blue-500 text-white', icon: Clock, text: 'Scheduled' },
      grace_period: { color: 'bg-yellow-500 text-white', icon: AlertTriangle, text: 'Grace Period' },
      cancelled: { color: 'bg-yellow-500 text-white', icon: Clock, text: 'Cancelled' },
      expired: { color: 'bg-red-500 text-white', icon: XCircle, text: 'Expired' },
      trialing: { color: 'bg-purple-500 text-white', icon: Clock, text: 'Trial' },
      past_due: { color: 'bg-orange-500 text-white', icon: AlertTriangle, text: 'Past Due' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  // 🛡️ CRITICAL: Determine if subscription can be changed based on backend status
  const canChangePlan = () => {
    return isCurrentlyActive();
  };

  // Feature list with icons
  const renderFeature = (icon, text, value, available = true) => (
    <div className={`flex items-center justify-between py-3 ${available ? 'text-white' : 'text-gray-500'}`}>
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { 
          className: `w-4 h-4 ${available ? 'text-green-400' : 'text-gray-600'}` 
        })}
        <span className={available ? '' : 'line-through'}>{text}</span>
      </div>
      <span className={`font-semibold ${available ? 'text-white' : 'text-gray-500'}`}>
        {value}
      </span>
    </div>
  );

  // 🛡️ CRITICAL: Render expired or cancelled subscription
  const renderExpiredSubscription = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {getSubscriptionStatus() === 'expired' ? 'Subscription Expired' : 'Subscription Cancelled'}
        </h3>
        <p className="text-gray-400 mb-6">
          {getSubscriptionStatus() === 'expired' 
            ? 'Your subscription has ended. Choose a new plan to continue enjoying premium content.'
            : 'Your subscription has been cancelled. You can still access your account features.'
          }
        </p>
        
        {/* Show previous plan details */}
        {subscription && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-white font-semibold mb-2">Previous Plan Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Plan:</span>
                <p className="text-white font-medium">{subscription.plan_name || `${subscription.plan_type} Plan`}</p>
              </div>
              <div>
                <span className="text-gray-400">Ended:</span>
                <p className="text-white font-medium">{formatDate(subscription.end_date)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => setShowNewPlanModal(true)}
            className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            {getSubscriptionStatus() === 'expired' ? 'Renew Subscription' : 'Get New Plan'}
          </button>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );

  // 🛡️ CRITICAL: Render scheduled subscription (future plan)
  const renderScheduledSubscription = () => (
    <div className="space-y-6">
      {/* Scheduled Plan Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Plan Info */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-blue-500/30 border-2 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                {getPlanIcon(subscription.plan_type)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  {subscription.plan_name || `${subscription.plan_type} Plan`}
                  <span className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    <Clock className="w-3 h-3" />
                    Scheduled
                  </span>
                </h3>
                <p className="text-gray-400 mt-1">{subscription.description}</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
          
          {/* Scheduled Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-blue-300 font-semibold">Subscription Scheduled</p>
                <p className="text-blue-200 text-sm">
                  Your plan will automatically activate on {formatDate(subscription.start_date)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Price and Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-750 rounded-lg">
            <div className="text-center sm:text-left">
              <p className="text-gray-400 text-sm">Monthly Price</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(subscription.subscription_price)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Starts In</p>
              <p className="text-lg font-semibold text-white">
                {getDaysUntilStart()} day{getDaysUntilStart() !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-gray-400 text-sm">Start Date</p>
              <p className="text-lg font-semibold text-white">{formatDate(subscription.start_date)}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{subscription.device_limit || subscription.max_sessions}</p>
              <p className="text-gray-400 text-sm">Devices</p>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Video className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{subscription.video_quality}</p>
              <p className="text-gray-400 text-sm">Quality</p>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Download className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {subscription.max_downloads === -1 ? 'Unlimited' : subscription.max_downloads}
              </p>
              <p className="text-gray-400 text-sm">Downloads</p>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{subscription.max_profiles}</p>
              <p className="text-gray-400 text-sm">Profiles</p>
            </div>
          </div>

          {/* Plan Features */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Plan Features (Available after start date)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFeature(
                <Smartphone />, 
                "Supported Devices", 
                `${subscription.devices_allowed?.length || 0} device types`,
                true
              )}
              {renderFeature(
                <Video />, 
                "Video Quality", 
                subscription.video_quality || "HD",
                true
              )}
              {renderFeature(
                <Download />, 
                "Offline Downloads", 
                subscription.offline_downloads ? "Available" : "Not available",
                subscription.offline_downloads
              )}
              {renderFeature(
                <Users />, 
                "Simultaneous Streams", 
                `${subscription.device_limit || subscription.max_sessions} devices`,
                true
              )}
              {renderFeature(
                <Shield />, 
                "Parental Controls", 
                subscription.parental_controls ? "Enabled" : "Disabled",
                subscription.parental_controls
              )}
              {renderFeature(
                <Crown />, 
                "Exclusive Content", 
                subscription.exclusive_content ? "Access" : "No access",
                subscription.exclusive_content
              )}
              {renderFeature(
                <Zap />, 
                "HDR Support", 
                subscription.hdr_support ? "Yes" : "No",
                subscription.hdr_support
              )}
              {renderFeature(
                <Star />, 
                "Early Access", 
                subscription.early_access ? "Yes" : "No",
                subscription.early_access
              )}
            </div>
          </div>
        </div>

        {/* Subscription Details Sidebar */}
        <div className="space-y-6">
          {/* Subscription Details Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Scheduled Details
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                {getStatusBadge()}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scheduled Start</span>
                <span className="text-white font-medium">{formatDate(subscription.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">End Date</span>
                <span className="text-white font-medium">{formatDate(subscription.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Auto Renew</span>
                <span className={`font-medium ${subscription.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                  {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
            <div className="space-y-3">
              <button 
                onClick={() => setShowNewPlanModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add Another Plan
              </button>
              
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="w-full bg-gray-750 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-400 mb-2">Need Help?</h4>
            <p className="text-blue-300 text-sm mb-4">
              Questions about your scheduled subscription? Our support team can help.
            </p>
            <button 
              onClick={handleContactSupport}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 🛡️ CRITICAL: Render active subscription
  const renderActiveSubscription = () => (
    <div className="space-y-6">
      {/* Plan Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Plan Info */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="p-3 bg-gray-700 rounded-lg">
                {getPlanIcon(subscription.plan_type)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  {subscription.plan_name || `${subscription.plan_type} Plan`}
                  {subscription.is_popular && (
                    <span className="flex items-center gap-1 bg-[#BC8BBC] text-white px-3 py-1 rounded-full text-sm">
                      <Star className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </h3>
                <p className="text-gray-400 mt-1">{subscription.description}</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
          
          {/* Price and Billing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-750 rounded-lg">
            <div className="text-center sm:text-left">
              <p className="text-gray-400 text-sm">Monthly Price</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(subscription.subscription_price)}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Billing Cycle</p>
              <p className="text-lg font-semibold text-white">Monthly</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-gray-400 text-sm">Renews in</p>
              <p className="text-lg font-semibold text-white">
                {getDaysRemaining()} day{getDaysRemaining() !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{subscription.device_limit || subscription.max_sessions}</p>
              <p className="text-gray-400 text-sm">Devices</p>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Video className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{subscription.video_quality}</p>
              <p className="text-gray-400 text-sm">Quality</p>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Download className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {subscription.max_downloads === -1 ? 'Unlimited' : subscription.max_downloads}
              </p>
              <p className="text-gray-400 text-sm">Downloads</p>
            </div>
            <div className="text-center p-3 bg-gray-750 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{subscription.max_profiles}</p>
              <p className="text-gray-400 text-sm">Profiles</p>
            </div>
          </div>

          {/* Plan Features */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Plan Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFeature(
                <Smartphone />, 
                "Supported Devices", 
                `${subscription.devices_allowed?.length || 0} device types`
              )}
              {renderFeature(
                <Video />, 
                "Video Quality", 
                subscription.video_quality || "HD"
              )}
              {renderFeature(
                <Download />, 
                "Offline Downloads", 
                subscription.offline_downloads ? "Available" : "Not available",
                subscription.offline_downloads
              )}
              {renderFeature(
                <Users />, 
                "Simultaneous Streams", 
                `${subscription.device_limit || subscription.max_sessions} devices`
              )}
              {renderFeature(
                <Shield />, 
                "Parental Controls", 
                subscription.parental_controls ? "Enabled" : "Disabled",
                subscription.parental_controls
              )}
              {renderFeature(
                <Crown />, 
                "Exclusive Content", 
                subscription.exclusive_content ? "Access" : "No access",
                subscription.exclusive_content
              )}
              {renderFeature(
                <Zap />, 
                "HDR Support", 
                subscription.hdr_support ? "Yes" : "No",
                subscription.hdr_support
              )}
              {renderFeature(
                <Star />, 
                "Early Access", 
                subscription.early_access ? "Yes" : "No",
                subscription.early_access
              )}
            </div>
          </div>
        </div>

        {/* Subscription Details Sidebar */}
        <div className="space-y-6">
          {/* Subscription Details Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Subscription Details
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                {getStatusBadge()}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Started</span>
                <span className="text-white font-medium">{formatDate(subscription.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Renews</span>
                <span className="text-white font-medium">{formatDate(subscription.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Auto Renew</span>
                <span className={`font-medium ${subscription.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                  {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {subscription.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Cancelled On</span>
                  <span className="text-white font-medium">{formatDate(subscription.cancelled_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h4 className="text-lg font-semibold text-white mb-4">Quick Actions</h4>
            <div className="space-y-3">
              {canChangePlan() && (
                <button 
                  onClick={() => setShowPlanChangeModal(true)}
                  className="w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-4 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Change Plan
                </button>
              )}
              
              <button 
                onClick={() => setShowNewPlanModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add New Plan
              </button>
              
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="w-full bg-gray-750 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-blue-400 mb-2">Need Help?</h4>
            <p className="text-blue-300 text-sm mb-4">
              Having issues with your subscription? Our support team is here to help.
            </p>
            <button 
              onClick={handleContactSupport}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 🛡️ CRITICAL: Main render logic
  if (shouldShowNoSubscription()) {
    return (
      <div className="space-y-6">
        {renderExpiredSubscription()}
        
        {/* New Plan Modal */}
        {showNewPlanModal && (
          <NewPlanModal
            currentSubscription={subscription}
            onClose={() => setShowNewPlanModal(false)}
            onSuccess={handleNewPlanSuccess}
          />
        )}
      </div>
    );
  }

  // 🛡️ CRITICAL: Show scheduled subscription if it's scheduled
  if (isScheduledSubscription()) {
    return (
      <div className="space-y-6">
        {renderScheduledSubscription()}
        
        {/* Contact Support Section */}
        {showContactSupport && (
          <div id="contact-support-section" className="scroll-mt-8">
            <ContactSupport 
              title="Subscription Support"
              subtitle="Need help with your subscription? Contact our support team for assistance with billing, plan changes, or any other questions."
              compact={true}
            />
          </div>
        )}

        {/* New Plan Modal */}
        {showNewPlanModal && (
          <NewPlanModal
            currentSubscription={subscription}
            onClose={() => setShowNewPlanModal(false)}
            onSuccess={handleNewPlanSuccess}
          />
        )}
      </div>
    );
  }

  // 🛡️ CRITICAL: Show active subscription
  return (
    <div className="space-y-6">
      {renderActiveSubscription()}

      {/* Contact Support Section */}
      {showContactSupport && (
        <div id="contact-support-section" className="scroll-mt-8">
          <ContactSupport 
            title="Subscription Support"
            subtitle="Need help with your subscription? Contact our support team for assistance with billing, plan changes, or any other questions."
            compact={true}
          />
        </div>
      )}

      {/* Plan Change Modal */}
      {showPlanChangeModal && (
        <PlanChangeModal
          currentSubscription={subscription}
          onClose={() => setShowPlanChangeModal(false)}
          onSuccess={handlePlanChangeSuccess}
        />
      )}

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <NewPlanModal
          currentSubscription={subscription}
          onClose={() => setShowNewPlanModal(false)}
          onSuccess={handleNewPlanSuccess}
        />
      )}
    </div>
  );
}