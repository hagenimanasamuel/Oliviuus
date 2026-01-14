import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Save, 
  X, 
  RefreshCw,
  Crown,
  Zap,
  Building,
  Smartphone,
  History,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

const SubscriptionTab = ({ userDetails, userId }) => {
  const { t } = useTranslation();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [actionMessage, setActionMessage] = useState({ type: '', message: '' });
  const [editForm, setEditForm] = useState({
    subscription_type: 'free',
    price: 0,
    billing_cycle: 'monthly',
    start_date: '',
    end_date: '',
    auto_renew: false,
    status: 'active'
  });

  const isMountedRef = useRef(true);

  // Memoized fetch function to prevent infinite re-renders
  const fetchSubscriptionData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Check if userId is valid
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.log("❌ Invalid userId:", userId);
      setIsLoading(false);
      
      // Use userDetails as fallback immediately
      if (userDetails) {
        console.log("🔄 Using userDetails as fallback");
        const fallbackSubscription = {
          name: userDetails.subscription_plan !== 'none' ? userDetails.subscription_plan : 'Free',
          type: userDetails.subscription_plan !== 'none' ? userDetails.subscription_plan.toLowerCase() : 'free',
          price: 0,
          status: 'active',
          start_date: userDetails.created_at,
          auto_renew: false,
          currency: 'RWF'
        };
        setSubscriptionData(fallbackSubscription);
      }
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("🔍 Fetching subscription for user:", userId);
      
      const response = await api.get(`/user/${userId}/subscription`, {
        timeout: 10000
      });
      
      if (isMountedRef.current) {
        console.log("✅ Subscription data received:", response.data);
        setSubscriptionData(response.data.subscription);
        
        // Initialize edit form with current data
        const sub = response.data.subscription;
        setEditForm({
          subscription_type: sub.type || 'free',
          price: sub.price || 0,
          billing_cycle: 'monthly',
          start_date: sub.start_date 
            ? new Date(sub.start_date).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          end_date: sub.end_date 
            ? new Date(sub.end_date).toISOString().split('T')[0] 
            : '',
          auto_renew: sub.auto_renew || false,
          status: sub.status || 'active'
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch subscription data:', error);
      if (isMountedRef.current) {
        setActionMessage({ 
          type: 'error', 
          message: error.response?.data?.message || 'Failed to load subscription data' 
        });
        
        // Fallback to userDetails if API fails
        if (userDetails) {
          console.log("🔄 Using fallback data from userDetails after API error");
          const fallbackSubscription = {
            name: userDetails.subscription_plan !== 'none' ? userDetails.subscription_plan : 'Free',
            type: userDetails.subscription_plan !== 'none' ? userDetails.subscription_plan.toLowerCase() : 'free',
            price: 0,
            status: 'active',
            start_date: userDetails.created_at,
            auto_renew: false,
            currency: 'RWF'
          };
          setSubscriptionData(fallbackSubscription);
        }
      }
    } finally {
      if (isMountedRef.current) {
        console.log("🏁 Setting loading to false");
        setIsLoading(false);
      }
    }
  }, [userId, userDetails]);

const fetchSubscriptionHistory = useCallback(async () => {
  if (!userId || userId === 'undefined' || userId === 'null') return;
  
  try {
    setIsLoadingHistory(true);
    const response = await api.get(`/user/${userId}/subscription-history`);
    
    if (isMountedRef.current) {
      setSubscriptionHistory(response.data.subscriptions || []);
    }
  } catch (error) {
    console.error('❌ Failed to fetch subscription history:', error);
    // Don't show error for history, just set empty array
    if (isMountedRef.current) {
      setSubscriptionHistory([]);
    }
  } finally {
    if (isMountedRef.current) {
      setIsLoadingHistory(false);
    }
  }
}, [userId]);

  const fetchAvailablePlans = useCallback(async () => {
    try {
      const response = await api.get('/user/subscription/plans');
      if (isMountedRef.current) {
        setAvailablePlans(response.data.plans);
      }
    } catch (error) {
      console.error('❌ Failed to fetch available plans:', error);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    console.log("🚀 SubscriptionTab mounted with props:", { userId, userDetails });
    
    // Always try to fetch data, but handle undefined userId gracefully
    fetchSubscriptionData();
    fetchSubscriptionHistory();
    fetchAvailablePlans();

    return () => {
      console.log("🧹 Cleaning up SubscriptionTab");
      isMountedRef.current = false;
    };
  }, [fetchSubscriptionData, fetchSubscriptionHistory, fetchAvailablePlans]);

  const getSubscriptionConfig = (type) => {
    if (!type) {
      console.log("⚠️ No subscription type provided, using free as default");
      type = 'free';
    }
    
    console.log("🎨 Getting config for subscription type:", type);
    
    // Normalize the type
    const normalizedType = type.toLowerCase();
    
    switch (normalizedType) {
      case "mobile": 
      case "custom":
        return { 
          label: "Custom", 
          color: "text-purple-400", 
          bg: "bg-purple-400/10", 
          border: "border-purple-400/30",
          badge: "✨",
          icon: <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
        };
      case "basic": 
        return { 
          label: "Basic", 
          color: "text-blue-400", 
          bg: "bg-blue-400/10", 
          border: "border-blue-400/30",
          badge: "⚡",
          icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
        };
      case "standard": 
        return { 
          label: "Standard", 
          color: "text-green-400", 
          bg: "bg-green-400/10", 
          border: "border-green-400/30",
          badge: "🚀",
          icon: <Building className="w-4 h-4 sm:w-5 sm:h-5" />
        };
      case "family": 
        return { 
          label: "Family", 
          color: "text-orange-400", 
          bg: "bg-orange-400/10", 
          border: "border-orange-400/30",
          badge: "👨‍👩‍👧‍👦",
          icon: <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
        };
      case "free_trial":
        return { 
          label: "Free Trial", 
          color: "text-yellow-400", 
          bg: "bg-yellow-400/10", 
          border: "border-yellow-400/30",
          badge: "🆓",
          icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
        };
      case "none":
      case "free": 
      default: 
        return { 
          label: "Free", 
          color: "text-gray-400", 
          bg: "bg-gray-400/10", 
          border: "border-gray-400/30",
          badge: "🔓",
          icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
        };
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "text-green-400", bg: "bg-green-400/10", label: "Active" };
      case "expired":
        return { color: "text-red-400", bg: "bg-red-400/10", label: "Expired" };
      case "cancelled":
        return { color: "text-gray-400", bg: "bg-gray-400/10", label: "Cancelled" };
      case "past_due":
        return { color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Past Due" };
      case "trialing":
        return { color: "text-blue-400", bg: "bg-blue-400/10", label: "Trial" };
      default:
        return { color: "text-gray-400", bg: "bg-gray-400/10", label: status || "Unknown" };
    }
  };

  const handleSaveSubscription = async () => {
    if (!isMountedRef.current) return;
    
    // Check if we have a valid userId for the API call
    const effectiveUserId = userId && userId !== 'undefined' ? userId : userDetails?.id;
    
    if (!effectiveUserId) {
      setActionMessage({ 
        type: 'error', 
        message: 'Cannot update subscription: User ID is missing' 
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      setActionMessage({ type: 'info', message: 'Updating subscription...' });

      const response = await api.put(`/user/${effectiveUserId}/subscription`, editForm);
      
      if (isMountedRef.current) {
        setSubscriptionData(response.data.subscription);
        setIsEditing(false);
        setActionMessage({ type: 'success', message: 'Subscription updated successfully!' });
        
        // Refresh data to ensure consistency
        await fetchSubscriptionData();
        await fetchSubscriptionHistory();
      }
    } catch (error) {
      console.error('❌ Failed to update subscription:', error);
      if (isMountedRef.current) {
        setActionMessage({ 
          type: 'error', 
          message: error.response?.data?.message || 'Failed to update subscription' 
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  };

  const handleCancelSubscription = async () => {
    // Check if we have a valid userId for the API call
    const effectiveUserId = userId && userId !== 'undefined' ? userId : userDetails?.id;
    
    if (!effectiveUserId) {
      setActionMessage({ 
        type: 'error', 
        message: 'Cannot cancel subscription: User ID is missing' 
      });
      return;
    }
    
    if (!window.confirm('Are you sure you want to cancel this subscription? The user will be downgraded to Free plan.')) return;

    try {
      setIsUpdating(true);
      await api.delete(`/user/${effectiveUserId}/subscription`, {
        data: { reason: 'Cancelled by admin' }
      });
      
      if (isMountedRef.current) {
        setActionMessage({ type: 'success', message: 'Subscription cancelled successfully!' });
        await fetchSubscriptionData();
        await fetchSubscriptionHistory();
      }
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      if (isMountedRef.current) {
        setActionMessage({ 
          type: 'error', 
          message: error.response?.data?.message || 'Failed to cancel subscription' 
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  };

  const handlePlanChange = (planType) => {
    const selectedPlan = availablePlans.find(plan => plan.type === planType);
    if (selectedPlan) {
      setEditForm(prev => ({
        ...prev,
        subscription_type: selectedPlan.type,
        price: selectedPlan.price,
        billing_cycle: 'monthly'
      }));
    } else {
      // For custom plans not in available plans
      setEditForm(prev => ({
        ...prev,
        subscription_type: planType,
        price: planType === 'free' ? 0 : prev.price
      }));
    }
  };

  const formatCurrency = (amount, currency = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (error) {
      return '';
    }
  };

  const clearMessage = () => {
    setTimeout(() => {
      if (isMountedRef.current) {
        setActionMessage({ type: '', message: '' });
      }
    }, 5000);
  };

  useEffect(() => {
    if (actionMessage.message) {
      clearMessage();
    }
  }, [actionMessage.message]);

  // Show loading state only if we're actually loading and don't have fallback data
  if (isLoading && !subscriptionData) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-700/50 rounded-xl p-4 h-24"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-700/50 rounded-lg p-3 sm:p-4 h-16 sm:h-20"></div>
          ))}
        </div>
        <div className="text-center text-gray-400 text-sm">
          Loading subscription data...
        </div>
      </div>
    );
  }

  // Show error state if no data after loading
  if (!subscriptionData) {
    return (
      <div className="text-center py-4 sm:py-8">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
          <XCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-400 mx-auto mb-2" />
          <h3 className="text-white font-semibold text-sm sm:text-base mb-1">Unable to load subscription data</h3>
          <p className="text-gray-400 text-xs sm:text-sm mb-4">
            {!userId ? 'User ID is missing.' : 'Failed to fetch subscription information.'}
          </p>
          <button
            onClick={fetchSubscriptionData}
            className="px-3 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const subscriptionConfig = getSubscriptionConfig(subscriptionData.type);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Action Message */}
      {actionMessage.message && (
        <div className={clsx(
          "p-3 rounded-lg border text-sm",
          actionMessage.type === 'success' && "bg-green-500/20 border-green-500/30 text-green-400",
          actionMessage.type === 'error' && "bg-red-500/20 border-red-500/30 text-red-400",
          actionMessage.type === 'info' && "bg-blue-500/20 border-blue-500/30 text-blue-400"
        )}>
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {actionMessage.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
            {actionMessage.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />}
            <span className="break-words">{actionMessage.message}</span>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Current Subscription</span>
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg transition-colors text-sm"
              title="Edit subscription"
            >
              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
        </div>

        {/* Subscription Header */}
        <div className={clsx("p-4 rounded-xl border", subscriptionConfig.bg, subscriptionConfig.border)}>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                {subscriptionConfig.icon}
                <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                  {subscriptionConfig.label} Plan
                </h3>
                <span className={clsx("px-2 py-1 rounded-full text-xs font-medium flex-shrink-0", subscriptionConfig.bg, subscriptionConfig.color)}>
                  {subscriptionData.status || 'active'}
                </span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm">
                Active since {formatDate(subscriptionData.start_date)}
              </p>
              {subscriptionData.end_date && (
                <p className="text-gray-400 text-xs sm:text-sm">
                  Expires on {formatDate(subscriptionData.end_date)}
                </p>
              )}
              {!userId && (
                <p className="text-yellow-400 text-xs mt-1">
                  ⚠️ Using fallback data
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
              <div className="text-xl sm:text-2xl">{subscriptionConfig.badge}</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base sm:text-lg font-semibold text-white">Edit Subscription</h4>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveSubscription}
                  disabled={isUpdating}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 text-sm"
                >
                  {isUpdating ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4" />}
                  <span>Save</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-400 hover:bg-gray-500/30 transition-colors text-sm"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Plan Type</label>
                <select
                  value={editForm.subscription_type}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="mobile">Mobile</option>
                  <option value="family">Family</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                  Price ({editForm.subscription_type === 'free' ? 'Free' : 'RWF'})
                </label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  disabled={editForm.subscription_type === 'free'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Start Date</label>
                <input
                  type="date"
                  value={editForm.start_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">End Date</label>
                <input
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="auto_renew"
                  checked={editForm.auto_renew}
                  onChange={(e) => setEditForm(prev => ({ ...prev, auto_renew: e.target.checked }))}
                  className="rounded border-gray-700 bg-gray-800 text-purple-500 focus:ring-purple-500 w-4 h-4"
                />
                <label htmlFor="auto_renew" className="text-xs sm:text-sm text-gray-400">
                  Auto-renew subscription
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-lg">
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-white font-semibold text-sm sm:text-base">
              {subscriptionData.price > 0 ? formatCurrency(subscriptionData.price, subscriptionData.currency) : 'Free'}
            </div>
            <div className="text-gray-400 text-xs">Monthly</div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-lg">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-white font-semibold text-sm sm:text-base">
              {subscriptionData.end_date 
                ? Math.ceil((new Date(subscriptionData.end_date) - new Date()) / (1000 * 60 * 60 * 24)) + ' Days'
                : 'Lifetime'
              }
            </div>
            <div className="text-gray-400 text-xs">Remaining</div>
          </div>
          
          <div className="text-center p-3 sm:p-4 bg-gray-800/50 rounded-lg col-span-2 sm:col-span-1">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-1 sm:mb-2" />
            <div className="text-white font-semibold text-sm sm:text-base">
              {subscriptionData.auto_renew ? 'Auto-renew' : 'Manual'}
            </div>
            <div className="text-gray-400 text-xs">Renewal</div>
          </div>
        </div>

        {/* Cancel Subscription Button */}
        {!isEditing && subscriptionData.type !== 'free' && subscriptionData.status === 'active' && (
          <div className="flex justify-end">
            <button
              onClick={handleCancelSubscription}
              disabled={isUpdating}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm"
            >
              {isUpdating ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span>Cancel Subscription</span>
            </button>
          </div>
        )}
      </div>

      {/* Subscription History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Subscription History</span>
          </h3>
          <button
            onClick={fetchSubscriptionHistory}
            disabled={isLoadingHistory}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-700/50 hover:bg-gray-700/70 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-gray-700/50 rounded-lg p-4 h-16"></div>
            ))}
          </div>
        ) : subscriptionHistory.length > 0 ? (
          <div className="space-y-3">
            {subscriptionHistory.map((subscription, index) => {
              const historyConfig = getSubscriptionConfig(subscription.type);
              const statusConfig = getStatusConfig(subscription.status);
              
              return (
                <div key={subscription.id || index} className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={clsx("text-sm font-semibold", historyConfig.color)}>
                          {subscription.name || historyConfig.label}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded-full text-xs", statusConfig.bg, statusConfig.color)}>
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Start: {formatDate(subscription.start_date)}</span>
                        </div>
                        {subscription.end_date && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>End: {formatDate(subscription.end_date)}</span>
                          </div>
                        )}
                      </div>
                      
                      {subscription.price > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <CreditCard className="w-3 h-3 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">
                            {formatCurrency(subscription.price, subscription.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      {subscription.status === 'active' && (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      )}
                      {subscription.status === 'cancelled' && (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      {subscription.status === 'expired' && (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                  
                  {subscription.cancelled_at && (
                    <div className="mt-2 pt-2 border-t border-gray-700/50">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span>Cancelled on {formatDateTime(subscription.cancelled_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <History className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-2" />
            <h4 className="text-gray-400 font-medium text-sm sm:text-base">No subscription history</h4>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              This user doesn't have any previous subscriptions
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTab;