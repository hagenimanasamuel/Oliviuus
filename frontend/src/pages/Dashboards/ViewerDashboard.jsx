import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSubscription } from "../../context/SubscriptionContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import ViewerLayout from "../../components/layout/dashboard/viewer/ViewerLayout";

export default function ViewerDashboard({ bodyContent }) {
  const { user, logoutUser } = useAuth();
  const { canAccessPremium, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      logoutUser();
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  // Show loading while checking subscription - REMOVED
  // Loading is already handled in App.js loading screen
  
  // Check if user can access premium content
  // This runs globally in the background via SubscriptionContext
  if (!canAccessPremium()) {
    // Redirect to subscription page if user doesn't have premium access
    navigate('/subscription');
    return null;
  }

  return (
    <ViewerLayout user={user} onLogout={handleLogout}>
      {bodyContent}
    </ViewerLayout>
  );
}