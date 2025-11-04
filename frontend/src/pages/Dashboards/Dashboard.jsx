// src/pages/Dashboards/Dashboard.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import AdminDashboard from "./Admins/AdminDashboard.jsx";
import ViewerDashboard from "./ViewerDashboard.jsx";
import Overview from "./Admins/overview/Overview";
import ViewerLandingPage from "../../components/layout/dashboard/viewer/ViewerLandingPage";

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    currentSubscription, 
    hasActiveSubscription, 
    canAccessPremium, 
    loading,
    error,
    refreshSubscription
  } = useSubscription();

  // State to track if we've loaded subscription data
  const [dataLoaded, setDataLoaded] = React.useState(false);

  // Effect to load subscription data when user is a viewer
  React.useEffect(() => {
    if (user && user.role === "viewer" && !loading && !dataLoaded) {
      refreshSubscription().finally(() => {
        setDataLoaded(true);
      });
    }
  }, [user, loading, dataLoaded, refreshSubscription]);

  // Show loading ONLY during initial data fetch
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading your subscription...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Error loading subscription: {error}</div>
        <button 
          onClick={() => {
            setDataLoaded(false);
            refreshSubscription();
          }}
          className="ml-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin users go to admin dashboard
  if (user.role === "admin") {
    return <AdminDashboard bodyContent={<Overview />} />;
  }

  // For viewers, wait until we've attempted to load subscription data
  if (user.role === "viewer" && !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Checking your subscription status...</div>
      </div>
    );
  }

  // Viewer users with active subscription go to viewer dashboard
  if (user.role === "viewer" && canAccessPremium()) {
    return <ViewerDashboard bodyContent={<ViewerLandingPage />} />;
  }

  // Viewer users without active subscription go to subscription page
  if (user.role === "viewer" && !canAccessPremium()) {
    return <Navigate to="/subscription" replace />;
  }

  // Handle other roles or unexpected cases
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-yellow-600">
        Unable to load dashboard. Please refresh the page.
      </div>
    </div>
  );
};

export default Dashboard;