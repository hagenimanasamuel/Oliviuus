import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "../api/axios";
import { useAuth } from "./AuthContext";

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use refs to track data without causing re-renders
  const currentSubscriptionRef = useRef(null);
  const isMountedRef = useRef(true);

  // Keep ref in sync with state (but ref changes don't trigger re-renders)
  useEffect(() => {
    currentSubscriptionRef.current = currentSubscription;
  }, [currentSubscription]);

  // Check session limit before video playback
  const checkSessionLimitBeforePlay = async () => {
    if (!user) return { canProceed: true }; // Allow if no user
    
    try {
      const response = await axios.get("/subscriptions/user/sessions/quick-check", {
        withCredentials: true,
      });
      
      if (response.data.success) {
        return {
          canProceed: true,
          currentSessions: response.data.data.currentSessions,
          maxAllowed: response.data.data.maxAllowed
        };
      } else {
        return {
          canProceed: false,
          error: response.data.error,
          message: response.data.message,
          details: response.data.details
        };
      }
    } catch (err) {
      if (err.response?.status === 429) {
        // Session limit exceeded
        return {
          canProceed: false,
          error: err.response.data.error,
          message: err.response.data.message,
          details: err.response.data.details
        };
      }
      
      // On other errors, allow to proceed to avoid blocking users
      console.error('Session limit check error:', err);
      return { 
        canProceed: true,
        error: true
      };
    }
  };

  // Fetch current active subscription (background version - no loading state)
  const fetchCurrentSubscriptionBackground = async () => {
    if (!user || user.role === "admin") return;

    try {
      const response = await axios.get("/subscriptions/user/current", {
        withCredentials: true,
      });
      
      if (response.data.success && response.data.data) {
        // Only update state if data actually changed (prevents unnecessary re-renders)
        const newSubscription = response.data.data;
        const current = currentSubscriptionRef.current;
        
        if (!current || 
            current.id !== newSubscription.id ||
            current.status !== newSubscription.status ||
            current.end_date !== newSubscription.end_date) {
          setCurrentSubscription(newSubscription);
        }
      } else if (currentSubscriptionRef.current !== null) {
        // If we had a subscription but now it's gone, update state
        setCurrentSubscription(null);
      }
    } catch (err) {
      // Silent fail for background updates - don't set error state
      console.error("Background subscription update failed:", err);
    }
  };

  // Fetch current active subscription (with loading state for user actions)
  const fetchCurrentSubscription = async () => {
    if (!user || user.role === "admin") {
      setCurrentSubscription(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("/subscriptions/user/current", {
        withCredentials: true,
      });
      
      if (response.data.success && response.data.data) {
        setCurrentSubscription(response.data.data);
      } else {
        setCurrentSubscription(null);
      }
    } catch (err) {
      setError("Failed to load subscription data");
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription history
  const fetchSubscriptionHistory = async () => {
    if (!user || user.role === "admin") return;

    try {
      const response = await axios.get("/subscriptions/user/history", {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setSubscriptionHistory(response.data.data);
      }
    } catch (err) {
      // Silent fail for history - not critical
    }
  };

  // Fetch available subscription plans
  const fetchAvailablePlans = async () => {
    if (!user || user.role === "admin") return;

    try {
      const response = await axios.get("/subscriptions/user/available-plans", {
        withCredentials: true,
      });
      
      if (response.data.success) {
        setAvailablePlans(response.data.data);
      }
    } catch (err) {
      // Silent fail for available plans - not critical
    }
  };

  // Subscribe to a plan
  const subscribeToPlan = async (subscriptionId, paymentMethodId = null) => {
    try {
      const response = await axios.post("/subscriptions/user/subscribe", 
        {
          subscription_id: subscriptionId,
          payment_method_id: paymentMethodId,
          auto_renew: true
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchCurrentSubscription();
        await fetchSubscriptionHistory();
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || "Failed to subscribe" 
      };
    }
  };

  // Cancel subscription
  const cancelSubscription = async (subscriptionId, reason = 'user_cancelled') => {
    try {
      const response = await axios.post("/subscriptions/user/cancel", 
        {
          subscription_id: subscriptionId,
          reason: reason
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchCurrentSubscription();
        await fetchSubscriptionHistory();
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.message || "Failed to cancel subscription" 
      };
    }
  };

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get("/subscriptions/user/status", {
        withCredentials: true,
      });
      
      return response.data;
    } catch (err) {
      return { success: false, error: "Failed to check subscription status" };
    }
  };

  // Refresh all subscription data (user-initiated)
  const refreshSubscription = async () => {
    await Promise.all([
      fetchCurrentSubscription(),
      fetchSubscriptionHistory(),
      fetchAvailablePlans()
    ]);
  };

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    if (!currentSubscription) return false;
    
    const now = new Date();
    const endDate = new Date(currentSubscription.end_date);
    return currentSubscription.status === 'active' && endDate > now;
  };

  // Check if subscription is expired
  const isSubscriptionExpired = () => {
    if (!currentSubscription) return true;
    
    const now = new Date();
    const endDate = new Date(currentSubscription.end_date);
    return endDate < now || currentSubscription.status === 'expired';
  };

  // Check if subscription is in grace period
  const isInGracePeriod = () => {
    if (!currentSubscription || !currentSubscription.grace_period_ends) return false;
    
    const now = new Date();
    const graceEnd = new Date(currentSubscription.grace_period_ends);
    return now < graceEnd;
  };

  // Check if user can access premium content
  const canAccessPremium = () => {
    return hasActiveSubscription() || isInGracePeriod();
  };

  // Get days remaining in subscription
  const getDaysRemaining = () => {
    if (!currentSubscription || !hasActiveSubscription()) return 0;
    
    const now = new Date();
    const endDate = new Date(currentSubscription.end_date);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Get subscription plan features
  const getPlanFeatures = () => {
    if (!currentSubscription) return null;
    
    return {
      videoQuality: currentSubscription.video_quality,
      maxSessions: currentSubscription.max_sessions,
      offlineDownloads: currentSubscription.offline_downloads,
      maxDownloads: currentSubscription.max_downloads,
      simultaneousDownloads: currentSubscription.simultaneous_downloads,
      maxProfiles: currentSubscription.max_profiles,
      parentalControls: currentSubscription.parental_controls,
      earlyAccess: currentSubscription.early_access,
      exclusiveContent: currentSubscription.exclusive_content
    };
  };

  // Background refresh without UI impact
  useEffect(() => {
    isMountedRef.current = true;

    if (!user || user.role !== "viewer") {
      setCurrentSubscription(null);
      setSubscriptionHistory([]);
      setAvailablePlans([]);
      return;
    }

    // Initial load
    refreshSubscription();

    // Set up background interval (no loading states, no error states)
    const interval = setInterval(() => {
      if (isMountedRef.current && user && user.role === "viewer") {
        fetchCurrentSubscriptionBackground();
      }
    }, 60000); // Refresh every 60 seconds (less frequent)

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [user]); // Only depend on user, not currentSubscription

  return (
    <SubscriptionContext.Provider
      value={{
        currentSubscription,
        subscriptionHistory,
        availablePlans,
        loading,
        error,
        refreshSubscription,
        subscribeToPlan,
        cancelSubscription,
        checkSubscriptionStatus,
        hasActiveSubscription,
        isSubscriptionExpired,
        isInGracePeriod,
        canAccessPremium,
        getDaysRemaining,
        getPlanFeatures,
        // ✅ NEW: Add session limit check function
        checkSessionLimitBeforePlay,
      }}
    >
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