// context/SubscriptionContext.js
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "../api/axios";
import { useAuth } from "./AuthContext";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user, isKidMode, familyMemberData } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentSubscriptionRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastRealTimeCheckRef = useRef(0);

  useEffect(() => {
    currentSubscriptionRef.current = currentSubscription;
  }, [currentSubscription]);

  // ✅ Helper to get API parameters based on user type
  const getApiParams = () => {
    if (!user) return {};
    
    // Kid profile
    if (user.kid_profile_id) {
      return { kid_profile_id: user.kid_profile_id };
    }
    
    // Family member (not owner)
    if (user.family_member_id && !user.is_family_owner) {
      return { 
        family_member_id: user.family_member_id,
        has_family_plan_access: user.has_family_plan_access || false,
        family_owner_id: user.family_owner_id || null
      };
    }
    
    // User with oliviuus_id (new system)
    if (user.oliviuus_id) {
      return { 
        oliviuus_id: user.oliviuus_id,
        user_id: user.id // Include user_id as fallback
      };
    }
    
    // Legacy user (email-based)
    return { user_id: user.id };
  };

  // ✅ Determine if we should use identifier-based API calls
  const shouldUseIdentifierApi = () => {
    // Use identifier API for kid profiles, family members, or users with oliviuus_id
    return !user || 
           user.kid_profile_id || 
           (user.family_member_id && !user.is_family_owner) || 
           user.oliviuus_id;
  };

  // ✅ Build API request config
  const buildRequestConfig = (params = {}) => {
    const config = {
      withCredentials: true,
      timeout: 10000,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    };

    // If we should use identifier-based API, add params
    if (shouldUseIdentifierApi()) {
      config.params = {
        ...getApiParams(),
        ...params
      };
    }

    return config;
  };

  // ✅ Skip subscription checks in kid mode OR if user is family member with family plan access
  const shouldSkipSubscriptionChecks = !user || isKidMode || (familyMemberData && familyMemberData.has_family_plan_access);

  const checkRealTimeStatus = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) {
      return {
        canAccessPremium: familyMemberData?.has_family_plan_access || false,
        hasActiveSubscription: familyMemberData?.has_family_plan_access || false,
        hasScheduledSubscription: false,
        serverTime: new Date().toISOString(),
        error: shouldSkipSubscriptionChecks ? (isKidMode ? 'KID_MODE' : 'FAMILY_PLAN_ACCESS') : 'NO_USER',
        isFamilyPlanAccess: familyMemberData?.has_family_plan_access || false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 
                  user?.id ? 'legacy_user' : 'anonymous'
      };
    }

    try {
      const response = await axios.get("/subscriptions/user/status", 
        buildRequestConfig()
      );

      if (response.data.success) {
        lastRealTimeCheckRef.current = Date.now();
        return {
          canAccessPremium: response.data.data.can_access_premium,
          hasActiveSubscription: response.data.data.has_active_subscription,
          hasScheduledSubscription: response.data.data.has_scheduled_subscription,
          isInGracePeriod: response.data.data.is_in_grace_period,
          currentSubscription: response.data.data.current_subscription,
          serverTime: response.data.data.server_time,
          realTimeData: response.data.data,
          isFamilyPlanAccess: false,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      }

      return {
        canAccessPremium: false,
        hasActiveSubscription: false,
        hasScheduledSubscription: false,
        serverTime: new Date().toISOString(),
        error: 'BACKEND_ERROR',
        isFamilyPlanAccess: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    } catch (error) {
      console.error('Real-time status check error:', error);
      return {
        canAccessPremium: false,
        hasActiveSubscription: false,
        hasScheduledSubscription: false,
        serverTime: new Date().toISOString(),
        error: 'NETWORK_ERROR',
        isFamilyPlanAccess: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    }
  }, [shouldSkipSubscriptionChecks, isKidMode, familyMemberData, user]);

  const fetchCurrentSubscription = useCallback(async (isBackground = false) => {
    // For family members with plan access, we don't need to fetch individual subscription
    if (familyMemberData?.has_family_plan_access) {
      if (!isBackground && isMountedRef.current) {
        setCurrentSubscription({
          id: 'family_plan',
          subscription_name: 'Family Plan',
          plan_type: 'family',
          is_family_plan: true,
          family_owner_id: familyMemberData.family_owner_id,
          max_sessions: 5, // Family plan typically allows more sessions
          video_quality: 'UHD',
          offline_downloads: true,
          max_downloads: -1, // unlimited
          parental_controls: true,
          devices_allowed: ['mobile', 'tablet', 'desktop', 'smarttv', 'gaming'],
          time_remaining: {
            seconds: 31536000, // 1 year in seconds
            days: 365,
            hours: 0,
            minutes: 0,
            is_expired: false,
            is_scheduled: false,
            formatted: 'Family Plan'
          }
        });
      }
      return;
    }

    if (shouldSkipSubscriptionChecks) {
      if (!isBackground && isMountedRef.current) {
        setCurrentSubscription(null);
      }
      return;
    }

    if (!isBackground) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await axios.get("/subscriptions/user/current", 
        buildRequestConfig()
      );

      if (response.data.success && response.data.data) {
        if (isMountedRef.current) {
          setCurrentSubscription(response.data.data);
        }
      } else {
        if (isMountedRef.current) {
          setCurrentSubscription(null);
        }
      }
    } catch (err) {
      console.error('Fetch current subscription error:', err);
      if (isMountedRef.current) {
        setCurrentSubscription(null);
        if (!isBackground) {
          setError('Backend subscription verification failed');
        }
      }
    } finally {
      if (!isBackground && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [shouldSkipSubscriptionChecks, familyMemberData, user]);

  const hasActiveSubscription = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return familyMemberData?.has_family_plan_access || false;
    const realTimeStatus = await checkRealTimeStatus();
    return realTimeStatus.hasActiveSubscription;
  }, [shouldSkipSubscriptionChecks, familyMemberData, checkRealTimeStatus]);

  const canAccessPremium = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return familyMemberData?.has_family_plan_access || false;
    const realTimeStatus = await checkRealTimeStatus();
    return realTimeStatus.canAccessPremium;
  }, [shouldSkipSubscriptionChecks, familyMemberData, checkRealTimeStatus]);

  const isSubscriptionExpired = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return !familyMemberData?.has_family_plan_access;
    const realTimeStatus = await checkRealTimeStatus();
    return !realTimeStatus.hasActiveSubscription && !realTimeStatus.hasScheduledSubscription;
  }, [shouldSkipSubscriptionChecks, familyMemberData, checkRealTimeStatus]);

  const isInGracePeriod = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return false;
    const realTimeStatus = await checkRealTimeStatus();
    return realTimeStatus.isInGracePeriod;
  }, [shouldSkipSubscriptionChecks, checkRealTimeStatus]);

  const isSubscriptionScheduled = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return false;
    const realTimeStatus = await checkRealTimeStatus();
    return realTimeStatus.hasScheduledSubscription;
  }, [shouldSkipSubscriptionChecks, checkRealTimeStatus]);

  const checkSessionLimitBeforePlay = useCallback(async () => {
    if (!user || shouldSkipSubscriptionChecks) {
      return { 
        canProceed: familyMemberData?.has_family_plan_access || false, 
        requiresLogin: !user,
        isKidMode: isKidMode,
        isFamilyPlanAccess: familyMemberData?.has_family_plan_access || false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 
                  user?.id ? 'legacy_user' : 'anonymous'
      };
    }

    try {
      const subscriptionStatus = await checkRealTimeStatus();
      
      if (!subscriptionStatus.canAccessPremium) {
        return {
          canProceed: false,
          error: 'NO_SUBSCRIPTION',
          message: 'Active subscription required to watch content',
          requiresSubscription: true,
          backendVerified: true,
          isFamilyPlanAccess: false,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      }

      const response = await axios.get("/subscriptions/user/sessions/quick-check",
        buildRequestConfig()
      );

      if (response.data.success) {
        return {
          canProceed: true,
          currentSessions: response.data.data.currentSessions,
          maxAllowed: response.data.data.maxAllowed,
          planType: response.data.data.planType,
          backendVerified: true,
          isFamilyPlanAccess: false,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      } else {
        return {
          canProceed: false,
          error: response.data.error,
          message: response.data.message,
          details: response.data.details,
          backendVerified: true,
          isFamilyPlanAccess: false,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      }
    } catch (err) {
      console.error('Session limit check error:', err);
      if (err.response?.status === 429) {
        return {
          canProceed: false,
          error: err.response.data.error,
          message: err.response.data.message,
          details: err.response.data.details,
          backendVerified: true,
          isFamilyPlanAccess: false,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      }

      return {
        canProceed: false,
        error: 'BACKEND_ERROR',
        message: 'Unable to verify access rights with server. Please try again.',
        retryable: true,
        backendVerified: false,
        isFamilyPlanAccess: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    }
  }, [user, shouldSkipSubscriptionChecks, isKidMode, familyMemberData, checkRealTimeStatus]);

  const getTimeRemaining = useCallback(() => {
    if (shouldSkipSubscriptionChecks || !currentSubscription || !currentSubscription.time_remaining) {
      return {
        days: familyMemberData?.has_family_plan_access ? 365 : 0,
        hours: 0,
        minutes: 0,
        totalHours: familyMemberData?.has_family_plan_access ? 8760 : 0,
        isExpired: !familyMemberData?.has_family_plan_access,
        isScheduled: false,
        formatted: isKidMode ? "Kid Mode" : (familyMemberData?.has_family_plan_access ? "Family Plan" : "No Subscription"),
        backendData: true,
        isKidMode: isKidMode,
        isFamilyPlan: familyMemberData?.has_family_plan_access || false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    }

    const timeData = currentSubscription.time_remaining;

    return {
      days: timeData.days,
      hours: timeData.hours,
      minutes: timeData.minutes,
      totalHours: Math.floor(timeData.seconds / 3600),
      isExpired: timeData.is_expired,
      isScheduled: timeData.is_scheduled,
      formatted: timeData.formatted,
      seconds: timeData.seconds,
      backendData: true,
      isKidMode: false,
      isFamilyPlan: currentSubscription.plan_type === 'family',
      userType: user?.kid_profile_id ? 'kid_profile' : 
                user?.family_member_id ? 'family_member' : 
                user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
    };
  }, [shouldSkipSubscriptionChecks, currentSubscription, isKidMode, familyMemberData, user]);

  const fetchSubscriptionHistory = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return;

    try {
      const response = await axios.get("/subscriptions/user/history",
        buildRequestConfig()
      );

      if (response.data.success && isMountedRef.current) {
        setSubscriptionHistory(response.data.data);
      }
    } catch (err) {
      console.error('Fetch subscription history error:', err);
    }
  }, [shouldSkipSubscriptionChecks, user]);

  const fetchAvailablePlans = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return;

    try {
      const response = await axios.get("/subscriptions/user/available-plans",
        buildRequestConfig()
      );

      if (response.data.success && isMountedRef.current) {
        setAvailablePlans(response.data.data);
      }
    } catch (err) {
      console.error('Fetch available plans error:', err);
    }
  }, [shouldSkipSubscriptionChecks, user]);

  const subscribeToPlan = useCallback(async (subscriptionId, paymentMethodId = null, startDate = null) => {
    if (shouldSkipSubscriptionChecks) {
      return {
        success: false,
        error: "Cannot subscribe in kid mode or with family plan access",
        backendVerified: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'anonymous'
      };
    }

    try {
      const payload = {
        subscription_id: subscriptionId,
        auto_renew: true,
        ...getApiParams() // Include user identifier in payload
      };

      if (startDate) {
        payload.start_date = new Date(startDate).toISOString();
      }

      const response = await axios.post("/subscriptions/user/subscribe", payload, {
        withCredentials: true,
      });

      if (response.data.success) {
        await Promise.all([
          fetchCurrentSubscription(),
          fetchSubscriptionHistory()
        ]);

        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
          backendVerified: true,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      }

      return {
        success: false,
        error: response.data.message,
        details: response.data.details,
        backendVerified: true,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    } catch (err) {
      console.error('Subscribe to plan error:', err);
      return {
        success: false,
        error: err.response?.data?.message || "Backend subscription failed",
        details: err.response?.data?.details,
        backendVerified: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    }
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory, user]);

  const cancelSubscription = useCallback(async (subscriptionId, reason = 'user_cancelled') => {
    if (shouldSkipSubscriptionChecks) {
      return {
        success: false,
        error: "Cannot cancel in kid mode or with family plan access",
        backendVerified: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'anonymous'
      };
    }

    try {
      const response = await axios.post("/subscriptions/user/cancel",
        {
          subscription_id: subscriptionId,
          reason: reason,
          ...getApiParams() // Include user identifier in payload
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        await Promise.all([
          fetchCurrentSubscription(),
          fetchSubscriptionHistory()
        ]);
        return { 
          success: true,
          backendVerified: true,
          userType: user?.kid_profile_id ? 'kid_profile' : 
                    user?.family_member_id ? 'family_member' : 
                    user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
        };
      }

      return {
        success: false,
        error: response.data.message,
        backendVerified: true,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    } catch (err) {
      console.error('Cancel subscription error:', err);
      return {
        success: false,
        error: err.response?.data?.message || "Backend cancellation failed",
        backendVerified: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    }
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory, user]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) {
      return {
        success: false,
        error: "Cannot check status in kid mode or with family plan access",
        backendVerified: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'anonymous'
      };
    }

    try {
      const response = await axios.get("/subscriptions/user/status",
        buildRequestConfig()
      );

      return {
        ...response.data,
        backendVerified: true,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    } catch (err) {
      console.error('Check subscription status error:', err);
      return { 
        success: false, 
        error: "Backend status check failed",
        backendVerified: false,
        userType: user?.kid_profile_id ? 'kid_profile' : 
                  user?.family_member_id ? 'family_member' : 
                  user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
      };
    }
  }, [shouldSkipSubscriptionChecks, user]);

  const refreshSubscription = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchCurrentSubscription(),
        fetchSubscriptionHistory(),
        fetchAvailablePlans()
      ]);
    } catch (error) {
      console.error('Refresh subscription error:', error);
      setError('Backend data refresh failed');
    } finally {
      setLoading(false);
    }
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory, fetchAvailablePlans]);

  const getDaysRemaining = useCallback(() => {
    const { days, isExpired } = getTimeRemaining();
    return isExpired ? 0 : days;
  }, [getTimeRemaining]);

  const getPlanFeatures = useCallback(() => {
    if (shouldSkipSubscriptionChecks || !currentSubscription) {
      // Return family plan features if user has family plan access
      if (familyMemberData?.has_family_plan_access) {
        return {
          videoQuality: 'UHD',
          maxSessions: 5,
          offlineDownloads: true,
          maxDownloads: -1, // unlimited
          simultaneousDownloads: 3,
          maxProfiles: 7,
          parentalControls: true,
          earlyAccess: true,
          exclusiveContent: true,
          devicesAllowed: ['mobile', 'tablet', 'desktop', 'smarttv', 'gaming'],
          supportedPlatforms: ['web', 'mobile', 'tablet', 'smarttv', 'gaming'],
          backendData: false,
          isFamilyPlan: true,
          userType: 'family_member'
        };
      }
      return null;
    }

    return {
      videoQuality: currentSubscription.video_quality,
      maxSessions: currentSubscription.max_sessions,
      offlineDownloads: currentSubscription.offline_downloads,
      maxDownloads: currentSubscription.max_downloads,
      simultaneousDownloads: currentSubscription.simultaneous_downloads,
      maxProfiles: currentSubscription.max_profiles,
      parentalControls: currentSubscription.parental_controls,
      earlyAccess: currentSubscription.early_access,
      exclusiveContent: currentSubscription.exclusive_content,
      devicesAllowed: currentSubscription.devices_allowed || [],
      supportedPlatforms: currentSubscription.supported_platforms || [],
      backendData: true,
      isFamilyPlan: currentSubscription.plan_type === 'family',
      userType: user?.kid_profile_id ? 'kid_profile' : 
                user?.family_member_id ? 'family_member' : 
                user?.oliviuus_id ? 'oliviuus_user' : 'legacy_user'
    };
  }, [shouldSkipSubscriptionChecks, currentSubscription, familyMemberData, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Debug function to check identifier info
  const getIdentifierInfo = useCallback(async () => {
    try {
      const response = await axios.get("/subscriptions/user/identifier-info",
        buildRequestConfig()
      );
      return response.data;
    } catch (error) {
      console.error('Get identifier info error:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;

    if (shouldSkipSubscriptionChecks) {
      // For family members with plan access, set a mock subscription
      if (familyMemberData?.has_family_plan_access) {
        setCurrentSubscription({
          id: 'family_plan',
          subscription_name: 'Family Plan',
          plan_type: 'family',
          is_family_plan: true,
          family_owner_id: familyMemberData.family_owner_id,
          userType: 'family_member'
        });
      } else if (user?.kid_profile_id) {
        // Kid profiles get free access
        setCurrentSubscription({
          id: 'kid_profile',
          subscription_name: 'Kid Profile Access',
          plan_type: 'free',
          is_family_plan: false,
          userType: 'kid_profile'
        });
      } else {
        setCurrentSubscription(null);
      }
      setSubscriptionHistory([]);
      setAvailablePlans([]);
      setLoading(false);
    } else {
      setLoading(true);
      fetchCurrentSubscription();
      fetchSubscriptionHistory();
      fetchAvailablePlans();
    }

    const backgroundCheck = setInterval(() => {
      if (isMountedRef.current && !shouldSkipSubscriptionChecks) {
        fetchCurrentSubscription(true);
      }
    }, 300000);

    return () => {
      isMountedRef.current = false;
      clearInterval(backgroundCheck);
    };
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory, fetchAvailablePlans, familyMemberData, user]);

  const value = {
    currentSubscription,
    subscriptionHistory,
    availablePlans,
    loading,
    error,

    refreshSubscription,
    subscribeToPlan,
    cancelSubscription,
    checkSubscriptionStatus,
    clearError,

    hasActiveSubscription,
    isSubscriptionExpired,
    isInGracePeriod,
    isSubscriptionScheduled,
    canAccessPremium,
    getDaysRemaining,
    getPlanFeatures,
    checkSessionLimitBeforePlay,

    getTimeRemaining,
    isKidMode,
    isFamilyPlanAccess: familyMemberData?.has_family_plan_access || false,
    familyMemberData,
    
    // Debug functions
    getIdentifierInfo,
    
    // User type information
    userType: user?.kid_profile_id ? 'kid_profile' : 
              user?.family_member_id ? 'family_member' : 
              user?.oliviuus_id ? 'oliviuus_user' : 
              user?.id ? 'legacy_user' : 'anonymous',
    
    // API methods
    apiParams: getApiParams(),
    usesIdentifierApi: shouldUseIdentifierApi()
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};