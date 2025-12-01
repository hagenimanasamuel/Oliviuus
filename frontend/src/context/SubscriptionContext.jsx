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

  // ✅ Skip all subscription checks in kid mode OR if user is family member with family plan access
  const shouldSkipSubscriptionChecks = !user || isKidMode || (familyMemberData && familyMemberData.has_family_plan_access);

  const checkRealTimeStatus = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) {
      return {
        canAccessPremium: familyMemberData?.has_family_plan_access || false,
        hasActiveSubscription: familyMemberData?.has_family_plan_access || false,
        hasScheduledSubscription: false,
        serverTime: new Date().toISOString(),
        error: shouldSkipSubscriptionChecks ? (isKidMode ? 'KID_MODE' : 'FAMILY_PLAN_ACCESS') : 'NO_USER',
        isFamilyPlanAccess: familyMemberData?.has_family_plan_access || false
      };
    }

    try {
      const response = await axios.get("/subscriptions/user/status", {
        withCredentials: true,
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

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
          isFamilyPlanAccess: false
        };
      }

      return {
        canAccessPremium: false,
        hasActiveSubscription: false,
        hasScheduledSubscription: false,
        serverTime: new Date().toISOString(),
        error: 'BACKEND_ERROR',
        isFamilyPlanAccess: false
      };
    } catch (error) {
      return {
        canAccessPremium: false,
        hasActiveSubscription: false,
        hasScheduledSubscription: false,
        serverTime: new Date().toISOString(),
        error: 'NETWORK_ERROR',
        isFamilyPlanAccess: false
      };
    }
  }, [shouldSkipSubscriptionChecks, isKidMode, familyMemberData]);

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
      const response = await axios.get("/subscriptions/user/current", {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

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
  }, [shouldSkipSubscriptionChecks, familyMemberData]);

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
        isFamilyPlanAccess: familyMemberData?.has_family_plan_access || false
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
          isFamilyPlanAccess: false
        };
      }

      const response = await axios.get("/subscriptions/user/sessions/quick-check", {
        withCredentials: true,
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

      if (response.data.success) {
        return {
          canProceed: true,
          currentSessions: response.data.data.currentSessions,
          maxAllowed: response.data.data.maxAllowed,
          planType: response.data.data.planType,
          backendVerified: true,
          isFamilyPlanAccess: false
        };
      } else {
        return {
          canProceed: false,
          error: response.data.error,
          message: response.data.message,
          details: response.data.details,
          backendVerified: true,
          isFamilyPlanAccess: false
        };
      }
    } catch (err) {
      if (err.response?.status === 429) {
        return {
          canProceed: false,
          error: err.response.data.error,
          message: err.response.data.message,
          details: err.response.data.details,
          backendVerified: true,
          isFamilyPlanAccess: false
        };
      }

      return {
        canProceed: false,
        error: 'BACKEND_ERROR',
        message: 'Unable to verify access rights with server. Please try again.',
        retryable: true,
        backendVerified: false,
        isFamilyPlanAccess: false
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
        isFamilyPlan: familyMemberData?.has_family_plan_access || false
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
      isFamilyPlan: currentSubscription.plan_type === 'family'
    };
  }, [shouldSkipSubscriptionChecks, currentSubscription, isKidMode, familyMemberData]);

  const fetchSubscriptionHistory = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return;

    try {
      const response = await axios.get("/subscriptions/user/history", {
        withCredentials: true,
      });

      if (response.data.success && isMountedRef.current) {
        setSubscriptionHistory(response.data.data);
      }
    } catch (err) {
      // Silent fail
    }
  }, [shouldSkipSubscriptionChecks]);

  const fetchAvailablePlans = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) return;

    try {
      const response = await axios.get("/subscriptions/user/available-plans", {
        withCredentials: true,
      });

      if (response.data.success && isMountedRef.current) {
        setAvailablePlans(response.data.data);
      }
    } catch (err) {
      // Silent fail
    }
  }, [shouldSkipSubscriptionChecks]);

  const subscribeToPlan = useCallback(async (subscriptionId, paymentMethodId = null, startDate = null) => {
    if (shouldSkipSubscriptionChecks) {
      return {
        success: false,
        error: "Cannot subscribe in kid mode or with family plan access",
        backendVerified: false
      };
    }

    try {
      const payload = {
        subscription_id: subscriptionId,
        auto_renew: true
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
          backendVerified: true
        };
      }

      return {
        success: false,
        error: response.data.message,
        details: response.data.details,
        backendVerified: true
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Backend subscription failed",
        details: err.response?.data?.details,
        backendVerified: false
      };
    }
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory]);

  const cancelSubscription = useCallback(async (subscriptionId, reason = 'user_cancelled') => {
    if (shouldSkipSubscriptionChecks) {
      return {
        success: false,
        error: "Cannot cancel in kid mode or with family plan access",
        backendVerified: false
      };
    }

    try {
      const response = await axios.post("/subscriptions/user/cancel",
        {
          subscription_id: subscriptionId,
          reason: reason
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
          backendVerified: true 
        };
      }

      return {
        success: false,
        error: response.data.message,
        backendVerified: true
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Backend cancellation failed",
        backendVerified: false
      };
    }
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory]);

  const checkSubscriptionStatus = useCallback(async () => {
    if (shouldSkipSubscriptionChecks) {
      return {
        success: false,
        error: "Cannot check status in kid mode or with family plan access",
        backendVerified: false
      };
    }

    try {
      const response = await axios.get("/subscriptions/user/status", {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

      return {
        ...response.data,
        backendVerified: true
      };
    } catch (err) {
      return { 
        success: false, 
        error: "Backend status check failed",
        backendVerified: false
      };
    }
  }, [shouldSkipSubscriptionChecks]);

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
          isFamilyPlan: true
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
      isFamilyPlan: currentSubscription.plan_type === 'family'
    };
  }, [shouldSkipSubscriptionChecks, currentSubscription, familyMemberData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
          family_owner_id: familyMemberData.family_owner_id
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
  }, [shouldSkipSubscriptionChecks, fetchCurrentSubscription, fetchSubscriptionHistory, fetchAvailablePlans, familyMemberData]);

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
    familyMemberData
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