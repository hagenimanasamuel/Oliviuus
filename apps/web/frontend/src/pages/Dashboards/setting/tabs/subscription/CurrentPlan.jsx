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
  PlusCircle,
  EyeOff,
  Eye
} from "lucide-react";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";
import ContactSupport from "../../../../../components/subscription/HelpSupport";
import PlanChangeModal from "./PlanChangeModal";
import NewPlanModal from "./NewPlanModal";

export default function CurrentPlan({ subscription, onRefresh, realTimeStatus, t }) {
  const [loading, setLoading] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState('checking');

  // Use translation from props or hook
  const { t: translate } = useTranslation();
  const tFunc = t || translate;

  // Determine subscription state based on ALL possible data
  useEffect(() => {
    const determineSubscriptionState = () => {
      // Case 1: No subscription data at all
      if (!subscription) {
        return 'no_subscription';
      }

      // Case 2: Check real_time_status first (from backend)
      if (subscription.real_time_status) {
        return subscription.real_time_status;
      }

      // Case 3: Check security_validation status
      if (subscription.security_validation) {
        if (subscription.security_validation.real_time_status) {
          return subscription.security_validation.real_time_status;
        }
        
        // Check boolean flags
        if (subscription.security_validation.is_expired) return 'expired';
        if (subscription.security_validation.is_scheduled) return 'scheduled';
        if (subscription.security_validation.is_currently_active) return 'active';
        if (subscription.security_validation.is_in_grace_period) return 'grace_period';
      }

      // Case 4: Check subscription status field
      if (subscription.status) {
        // Map backend status to our frontend status
        const statusMap = {
          'active': 'active',
          'trialing': 'trialing',
          'past_due': 'grace_period',
          'cancelled': 'cancelled',
          'expired': 'expired'
        };
        return statusMap[subscription.status] || subscription.status;
      }

      // Case 5: Check time-based status
      if (subscription.start_date && subscription.end_date) {
        const now = new Date();
        const start = new Date(subscription.start_date);
        const end = new Date(subscription.end_date);

        if (now < start) return 'scheduled';
        if (now > end) return 'expired';
        if (now >= start && now <= end) {
          // Check if it's cancelled
          if (subscription.cancelled_at) {
            const cancelled = new Date(subscription.cancelled_at);
            if (cancelled <= now) return 'cancelled';
          }
          return 'active';
        }
      }

      // Default case
      return 'unknown';
    };

    setSubscriptionState(determineSubscriptionState());
  }, [subscription]);

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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get days remaining/until start
  const getTimeInfo = () => {
    if (!subscription) return { type: 'none', days: 0, date: null };

    const now = new Date();
    const start = subscription.start_date ? new Date(subscription.start_date) : null;
    const end = subscription.end_date ? new Date(subscription.end_date) : null;

    if (subscriptionState === 'scheduled' && start) {
      const diffTime = start - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        type: 'starts',
        days: diffDays > 0 ? diffDays : 0,
        date: start
      };
    } else if ((subscriptionState === 'active' || subscriptionState === 'grace_period' || subscriptionState === 'trialing') && end) {
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        type: 'renews',
        days: diffDays > 0 ? diffDays : 0,
        date: end
      };
    } else if (subscriptionState === 'expired' && end) {
      return {
        type: 'expired',
        days: 0,
        date: end
      };
    }

    return { type: 'none', days: 0, date: null };
  };

  // Get plan icon based on type
  const getPlanIcon = (planType) => {
    const iconClass = "w-6 h-6";
    switch (planType?.toLowerCase()) {
      case 'family':
        return <Users className={`${iconClass} text-purple-400`} />;
      case 'standard':
      case 'premium':
        return <Crown className={`${iconClass} text-yellow-400`} />;
      case 'basic':
        return <Monitor className={`${iconClass} text-blue-400`} />;
      case 'mobile':
        return <Smartphone className={`${iconClass} text-green-400`} />;
      case 'free':
        return <Star className={`${iconClass} text-gray-400`} />;
      default:
        return <Star className={`${iconClass} text-gray-400`} />;
    }
  };

  // Get status badge configuration
  const getStatusBadge = () => {
    const statusConfig = {
      active: { 
        color: 'bg-green-500 text-white', 
        icon: CheckCircle, 
        text: tFunc('subscription.status.active.title'),
        description: tFunc('subscription.status.active.description')
      },
      scheduled: { 
        color: 'bg-blue-500 text-white', 
        icon: Clock, 
        text: tFunc('subscription.status.scheduled.title'),
        description: tFunc('subscription.status.scheduled.description')
      },
      grace_period: { 
        color: 'bg-yellow-500 text-white', 
        icon: AlertTriangle, 
        text: tFunc('subscription.status.grace_period.title'),
        description: tFunc('subscription.status.grace_period.description')
      },
      cancelled: { 
        color: 'bg-orange-500 text-white', 
        icon: XCircle, 
        text: tFunc('subscription.status.cancelled.title'),
        description: tFunc('subscription.status.cancelled.description')
      },
      expired: { 
        color: 'bg-red-500 text-white', 
        icon: XCircle, 
        text: tFunc('subscription.status.expired.title'),
        description: tFunc('subscription.status.expired.description')
      },
      trialing: { 
        color: 'bg-purple-500 text-white', 
        icon: Clock, 
        text: tFunc('subscription.status.trialing.title'),
        description: tFunc('subscription.status.trialing.description')
      },
      past_due: { 
        color: 'bg-orange-500 text-white', 
        icon: AlertTriangle, 
        text: tFunc('subscription.status.past_due.title'),
        description: tFunc('subscription.status.past_due.description')
      },
      no_subscription: { 
        color: 'bg-gray-500 text-white', 
        icon: EyeOff, 
        text: tFunc('subscription.status.no_subscription.title'),
        description: tFunc('subscription.status.no_subscription.description')
      }
    };

    const config = statusConfig[subscriptionState] || statusConfig.no_subscription;
    const IconComponent = config.icon;

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
          <IconComponent className="w-3 h-3" />
          {config.text}
        </span>
      </div>
    );
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

  // Determine if plan can be changed
  const canChangePlan = () => {
    return subscriptionState === 'active' || subscriptionState === 'grace_period' || subscriptionState === 'trialing';
  };

  // Render when there's NO subscription
  const renderNoSubscription = () => {
    const timeInfo = getTimeInfo();
    
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <EyeOff className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            {tFunc('currentPlan.noSubscription.title')}
          </h3>
          <p className="text-gray-400 mb-6">
            {tFunc('currentPlan.noSubscription.description')}
          </p>

          {/* Benefits of subscribing */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              {tFunc('currentPlan.benefits.title')}
            </h4>
            <div className="space-y-3">
              {[
                { icon: <Video className="w-4 h-4" />, text: tFunc('currentPlan.benefits.hdQuality') },
                { icon: <Users className="w-4 h-4" />, text: tFunc('currentPlan.benefits.multipleDevices') },
                { icon: <Download className="w-4 h-4" />, text: tFunc('currentPlan.benefits.offlineDownloads') },
                { icon: <Shield className="w-4 h-4" />, text: tFunc('currentPlan.benefits.noAds') }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-white">
                  {React.cloneElement(benefit.icon, { className: "w-4 h-4 text-green-400" })}
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-8 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {tFunc('currentPlan.getStarted')}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {tFunc('common.actions.refresh')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render expired subscription
  const renderExpiredSubscription = () => {
    const timeInfo = getTimeInfo();
    
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-3">
            {tFunc('currentPlan.expired.title')}
          </h3>
          <p className="text-gray-400 mb-6">
            {tFunc('currentPlan.expired.description')}
          </p>

          {/* Previous subscription details */}
          {subscription && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
              <h4 className="text-white font-semibold mb-4">{tFunc('currentPlan.previousDetails')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">{tFunc('currentPlan.plan')}:</span>
                  <span className="text-white font-medium">
                    {subscription.plan_name || subscription.plan_type || subscription.subscription_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{tFunc('currentPlan.endedOn')}:</span>
                  <span className="text-white font-medium">{formatDate(subscription.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{tFunc('currentPlan.lastPayment')}:</span>
                  <span className="text-white font-medium">
                    {subscription.subscription_price ? formatCurrency(subscription.subscription_price) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-8 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {tFunc('currentPlan.renewNow')}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {tFunc('common.actions.refresh')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render cancelled subscription
  const renderCancelledSubscription = () => {
    const timeInfo = getTimeInfo();
    
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-orange-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            {tFunc('currentPlan.cancelled.title')}
          </h3>
          <p className="text-gray-400 mb-6">
            {subscription.cancelled_at 
              ? tFunc('currentPlan.cancelled.descriptionWithDate', { date: formatDate(subscription.cancelled_at) })
              : tFunc('currentPlan.cancelled.description')
            }
          </p>

          {/* Cancelled subscription details */}
          {subscription && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left">
              <h4 className="text-white font-semibold mb-4">{tFunc('currentPlan.cancelledDetails')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">{tFunc('currentPlan.plan')}:</span>
                  <span className="text-white font-medium">
                    {subscription.plan_name || subscription.plan_type || subscription.subscription_name}
                  </span>
                </div>
                {subscription.cancelled_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{tFunc('currentPlan.cancelledOn')}:</span>
                    <span className="text-white font-medium">{formatDate(subscription.cancelled_at)}</span>
                  </div>
                )}
                {subscription.end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{tFunc('currentPlan.accessUntil')}:</span>
                    <span className="text-white font-medium">{formatDate(subscription.end_date)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowNewPlanModal(true)}
              className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-8 py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {tFunc('currentPlan.startNewPlan')}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {tFunc('common.actions.refresh')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render scheduled subscription
  const renderScheduledSubscription = () => {
    const timeInfo = getTimeInfo();
    
    return (
      <div className="space-y-6">
        {/* Scheduled Plan Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {subscription.plan_name || `${subscription.plan_type} ${tFunc('currentPlan.plan')}`}
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {tFunc('subscription.status.scheduled.title')}
                  </span>
                </h2>
                <p className="text-blue-200 mt-1">
                  {tFunc('currentPlan.scheduled.description', { 
                    days: timeInfo.days,
                    date: formatDate(timeInfo.date) 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">
                {subscription.subscription_price ? formatCurrency(subscription.subscription_price) : 'Free'}
              </span>
              <span className="text-blue-300">/month</span>
            </div>
          </div>
        </div>

        {/* Scheduled Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Plan Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown and Date Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                {tFunc('currentPlan.scheduleDetails')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-750 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">{tFunc('currentPlan.startsIn')}</p>
                  <p className="text-2xl font-bold text-blue-400">{timeInfo.days}</p>
                  <p className="text-gray-400 text-sm">{tFunc('currentPlan.days')}</p>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">{tFunc('currentPlan.startDate')}</p>
                  <p className="text-lg font-semibold text-white">{formatDate(subscription.start_date)}</p>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">{tFunc('currentPlan.endDate')}</p>
                  <p className="text-lg font-semibold text-white">{formatDate(subscription.end_date)}</p>
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                {tFunc('currentPlan.includedFeatures')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    icon: <Users />, 
                    text: tFunc('currentPlan.simultaneousStreams'), 
                    value: `${subscription.max_sessions || subscription.device_limit || 1}`,
                    available: true 
                  },
                  { 
                    icon: <Video />, 
                    text: tFunc('currentPlan.videoQuality'), 
                    value: subscription.video_quality || "HD",
                    available: true 
                  },
                  { 
                    icon: <Download />, 
                    text: tFunc('currentPlan.offlineDownloads'), 
                    value: subscription.offline_downloads ? tFunc('currentPlan.available') : tFunc('currentPlan.notAvailable'),
                    available: subscription.offline_downloads 
                  },
                  { 
                    icon: <Shield />, 
                    text: tFunc('currentPlan.parentalControls'), 
                    value: subscription.parental_controls ? tFunc('currentPlan.enabled') : tFunc('currentPlan.disabled'),
                    available: subscription.parental_controls 
                  }
                ].map((feature, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${feature.available ? 'bg-gray-750' : 'bg-gray-900/50'}`}>
                    <div className="flex items-center gap-3">
                      {React.cloneElement(feature.icon, { className: `w-4 h-4 ${feature.available ? 'text-green-400' : 'text-gray-600'}` })}
                      <span className={feature.available ? 'text-white' : 'text-gray-500'}>{feature.text}</span>
                    </div>
                    <span className={`font-semibold ${feature.available ? 'text-white' : 'text-gray-500'}`}>
                      {feature.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{tFunc('currentPlan.status')}</h3>
              <div className="space-y-4">
                {getStatusBadge()}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{tFunc('currentPlan.autoRenew')}:</span>
                    <span className={`font-medium ${subscription.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                      {subscription.auto_renew ? tFunc('common.yes') : tFunc('common.no')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{tFunc('currentPlan.paymentMethod')}:</span>
                    <span className="text-white font-medium">
                      {subscription.payment_method || tFunc('currentPlan.notSet')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{tFunc('currentPlan.actions')}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowNewPlanModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  {tFunc('currentPlan.addNewPlan')}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {tFunc('common.actions.refresh')}
                </button>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">{tFunc('currentPlan.questions')}</h4>
              <p className="text-blue-300 text-sm mb-4">
                {tFunc('currentPlan.scheduledSupport')}
              </p>
              <button
                onClick={handleContactSupport}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {tFunc('currentPlan.contactSupport')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render active subscription (including grace_period and trialing)
  const renderActiveSubscription = () => {
    const timeInfo = getTimeInfo();
    const isTrial = subscriptionState === 'trialing';
    const isGracePeriod = subscriptionState === 'grace_period';
    
    return (
      <div className="space-y-6">
        {/* Subscription Header */}
        <div className={`bg-gradient-to-r ${isTrial ? 'from-purple-500/10 to-purple-600/10' : isGracePeriod ? 'from-yellow-500/10 to-yellow-600/10' : 'from-green-500/10 to-green-600/10'} border-2 ${isTrial ? 'border-purple-500/30' : isGracePeriod ? 'border-yellow-500/30' : 'border-green-500/30'} rounded-xl p-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 ${isTrial ? 'bg-purple-500/20' : isGracePeriod ? 'bg-yellow-500/20' : 'bg-green-500/20'} rounded-lg`}>
                {getPlanIcon(subscription.plan_type)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  {subscription.plan_name || `${subscription.plan_type} ${tFunc('currentPlan.plan')}`}
                  {isTrial && (
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {tFunc('subscription.status.trialing.title')}
                    </span>
                  )}
                  {isGracePeriod && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {tFunc('subscription.status.grace_period.title')}
                    </span>
                  )}
                  {subscription.is_popular && (
                    <span className="bg-[#BC8BBC] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {tFunc('subscription.plans.standard.popular')}
                    </span>
                  )}
                </h2>
                <p className={`mt-1 ${isTrial ? 'text-purple-200' : isGracePeriod ? 'text-yellow-200' : 'text-green-200'}`}>
                  {isTrial ? tFunc('currentPlan.trial.description') : 
                   isGracePeriod ? tFunc('currentPlan.gracePeriod.description') : 
                   tFunc('currentPlan.active.description')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {subscription.subscription_price ? formatCurrency(subscription.subscription_price) : 'Free'}
              </div>
              <div className="text-gray-300">/month</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Plan Features */}
          <div className="lg:col-span-2 space-y-6">
            {/* Time and Billing Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-750 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">{tFunc('currentPlan.timeRemaining')}</p>
                  <p className="text-2xl font-bold text-white">{timeInfo.days}</p>
                  <p className="text-gray-400 text-sm">{tFunc('currentPlan.days')}</p>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">{isTrial ? tFunc('currentPlan.trialEnds') : tFunc('currentPlan.renewsOn')}</p>
                  <p className="text-lg font-semibold text-white">{formatDate(timeInfo.date)}</p>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">{tFunc('currentPlan.autoRenew')}</p>
                  <p className={`text-lg font-semibold ${subscription.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                    {subscription.auto_renew ? tFunc('common.yes') : tFunc('common.no')}
                  </p>
                </div>
              </div>
            </div>

            {/* Plan Features Grid */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                {tFunc('currentPlan.planFeatures')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { 
                    icon: <Users />, 
                    text: tFunc('currentPlan.simultaneousStreams'), 
                    value: `${subscription.max_sessions || subscription.device_limit || 1} ${tFunc('currentPlan.devices')}`,
                    available: true 
                  },
                  { 
                    icon: <Video />, 
                    text: tFunc('currentPlan.videoQuality'), 
                    value: subscription.video_quality || "HD",
                    available: true 
                  },
                  { 
                    icon: <Download />, 
                    text: tFunc('currentPlan.offlineDownloads'), 
                    value: subscription.offline_downloads ? tFunc('currentPlan.available') : tFunc('currentPlan.notAvailable'),
                    available: subscription.offline_downloads 
                  },
                  { 
                    icon: <Shield />, 
                    text: tFunc('currentPlan.parentalControls'), 
                    value: subscription.parental_controls ? tFunc('currentPlan.enabled') : tFunc('currentPlan.disabled'),
                    available: subscription.parental_controls 
                  },
                  { 
                    icon: <Crown />, 
                    text: tFunc('currentPlan.exclusiveContent'), 
                    value: subscription.exclusive_content ? tFunc('currentPlan.access') : tFunc('currentPlan.noAccess'),
                    available: subscription.exclusive_content 
                  },
                  { 
                    icon: <Zap />, 
                    text: tFunc('currentPlan.hdrSupport'), 
                    value: subscription.hdr_support ? tFunc('common.yes') : tFunc('common.no'),
                    available: subscription.hdr_support 
                  },
                  { 
                    icon: <Star />, 
                    text: tFunc('currentPlan.earlyAccess'), 
                    value: subscription.early_access ? tFunc('common.yes') : tFunc('common.no'),
                    available: subscription.early_access 
                  },
                  { 
                    icon: <Smartphone />, 
                    text: tFunc('currentPlan.supportedDevices'), 
                    value: `${subscription.devices_allowed?.length || 0} ${tFunc('currentPlan.deviceTypes')}`,
                    available: true 
                  }
                ].map((feature, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${feature.available ? 'bg-gray-750' : 'bg-gray-900/50'}`}>
                    <div className="flex items-center gap-3">
                      {React.cloneElement(feature.icon, { className: `w-4 h-4 ${feature.available ? 'text-green-400' : 'text-gray-600'}` })}
                      <span className={feature.available ? 'text-white' : 'text-gray-500'}>{feature.text}</span>
                    </div>
                    <span className={`font-semibold ${feature.available ? 'text-white' : 'text-gray-500'}`}>
                      {feature.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Actions and Details */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{tFunc('currentPlan.subscriptionDetails')}</h3>
              <div className="space-y-4">
                {getStatusBadge()}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{tFunc('currentPlan.startedOn')}:</span>
                    <span className="text-white font-medium">{formatDate(subscription.start_date)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{tFunc('currentPlan.billingCycle')}:</span>
                    <span className="text-white font-medium">{tFunc('currentPlan.monthly')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{tFunc('currentPlan.nextBilling')}:</span>
                    <span className="text-white font-medium">{formatDate(timeInfo.date)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{tFunc('currentPlan.actions')}</h3>
              <div className="space-y-3">
                {canChangePlan() && (
                  <button
                    onClick={() => setShowPlanChangeModal(true)}
                    className="w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    {tFunc('currentPlan.changePlan')}
                  </button>
                )}
                <button
                  onClick={() => setShowNewPlanModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  {tFunc('currentPlan.addNewPlan')}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {tFunc('common.actions.refresh')}
                </button>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">{tFunc('currentPlan.needHelp')}</h4>
              <p className="text-blue-300 text-sm mb-4">
                {tFunc('currentPlan.supportDescription')}
              </p>
              <button
                onClick={handleContactSupport}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {tFunc('currentPlan.contactSupport')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render logic based on subscription state
  const renderContent = () => {
    switch (subscriptionState) {
      case 'no_subscription':
      case 'unknown':
        return renderNoSubscription();
      
      case 'expired':
        return renderExpiredSubscription();
      
      case 'cancelled':
        return renderCancelledSubscription();
      
      case 'scheduled':
        return renderScheduledSubscription();
      
      case 'active':
      case 'grace_period':
      case 'trialing':
      case 'past_due':
        return renderActiveSubscription();
      
      case 'checking':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-12 h-12 text-[#BC8BBC] animate-spin mb-4" />
            <p className="text-gray-400">{tFunc('currentPlan.checkingStatus')}</p>
          </div>
        );
      
      default:
        return renderNoSubscription();
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}

      {/* Contact Support Section */}
      {showContactSupport && (
        <div id="contact-support-section" className="scroll-mt-8">
          <ContactSupport
            title={tFunc('currentPlan.subscriptionSupport')}
            subtitle={tFunc('currentPlan.subscriptionSupportDescription')}
            compact={true}
          />
        </div>
      )}

      {/* Modals */}
      {showPlanChangeModal && (
        <PlanChangeModal
          currentSubscription={subscription}
          onClose={() => setShowPlanChangeModal(false)}
          onSuccess={handlePlanChangeSuccess}
          t={tFunc}
        />
      )}

      {showNewPlanModal && (
        <NewPlanModal
          currentSubscription={subscription}
          onClose={() => setShowNewPlanModal(false)}
          onSuccess={handleNewPlanSuccess}
          t={tFunc}
        />
      )}
    </div>
  );
}