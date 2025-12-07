import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import AdminDashboard from "./Admins/AdminDashboard.jsx";
import ViewerDashboard from "./ViewerDashboard.jsx";
import KidDashboard from "./viewer/kid/KidDashboard.jsx";
import Overview from "./Admins/overview/Overview";
import ViewerLandingPage from "../../components/layout/dashboard/viewer/ViewerLandingPage";

const Dashboard = () => {
  const { user, kidProfile, isKidMode, familyMemberData } = useAuth();
  const { 
    currentSubscription, 
    loading,
    error,
    refreshSubscription,
    isFamilyPlanAccess
  } = useSubscription();

  // State to track if we've loaded subscription data
  const [dataLoaded, setDataLoaded] = React.useState(false);
  const [loadAttempted, setLoadAttempted] = React.useState(false);

  // Check if user is family member with kid dashboard
  const isFamilyMemberKidDashboard = familyMemberData && familyMemberData.dashboard_type === 'kid';
  
  // Combined kid mode check - includes family members with kid dashboard
  const shouldShowKidDashboard = isKidMode || isFamilyMemberKidDashboard;

  // Effect to load subscription data when user is a viewer - RUNS ONLY ONCE
  React.useEffect(() => {
    // Skip subscription checks for family members with plan access or kid mode
    if (user && (isFamilyPlanAccess || shouldShowKidDashboard)) {
      setDataLoaded(true);
      setLoadAttempted(true);
      return;
    }

    // Only run for viewers who haven't attempted load yet
    if (user && user.role === "viewer" && !loadAttempted && !shouldShowKidDashboard) {
      setLoadAttempted(true);
      refreshSubscription().finally(() => {
        setDataLoaded(true);
      });
    } else if (user && (user.role === "admin" || shouldShowKidDashboard)) {
      // For admin or kid mode, mark as loaded immediately
      setDataLoaded(true);
      setLoadAttempted(true);
    }
  }, [user, loadAttempted, refreshSubscription, shouldShowKidDashboard, isFamilyPlanAccess]);

  // Show generic loading during initial data fetch
  if (user && !dataLoaded && loadAttempted) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BC8BBC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-white">Preparing your Home...</div>
        </div>
      </div>
    );
  }

  // Show generic error state (only for viewer mode without family plan)
  if (error && !shouldShowKidDashboard && !isFamilyPlanAccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Temporary Issue</h3>
          <p className="text-gray-300 mb-4">
            We're having trouble loading your Home. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // 🎯 KID MODE: Highest priority - if in kid mode OR family member with kid dashboard
  if (shouldShowKidDashboard) {
    // Create effective kid profile for family members
    const effectiveKidProfile = kidProfile || (isFamilyMemberKidDashboard ? {
      is_family_member: true,
      family_owner_id: familyMemberData.family_owner_id,
      member_role: familyMemberData.member_role,
      dashboard_type: 'kid',
      name: user?.email?.split('@')[0] || 'Kid',
      max_age_rating: '7+',
      id: user.id
    } : null);
    
    if (effectiveKidProfile) {
      return <KidDashboard kidProfile={effectiveKidProfile} />;
    }
  }

  // 👑 ADMIN: Admin users go to admin dashboard
  if (user.role === "admin") {
    return <AdminDashboard bodyContent={<Overview />} />;
  }

  // 👀 VIEWER: For viewers, show generic loading until data is loaded
  if (user.role === "viewer" && !dataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#BC8BBC] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-white">Setting up your experience...</div>
        </div>
      </div>
    );
  }

  // 🛡️ VIEWER WITH SUBSCRIPTION OR FAMILY PLAN: Allow dashboard access
  if (user.role === "viewer" && (currentSubscription || isFamilyPlanAccess)) {
    return <ViewerDashboard bodyContent={<ViewerLandingPage />} />;
  }

  // 🛡️ VIEWER WITHOUT SUBSCRIPTION: Redirect to subscription page if no subscription
  if (user.role === "viewer" && !currentSubscription && !isFamilyPlanAccess && dataLoaded) {
    return <Navigate to="/subscription" replace />;
  }

  // Handle unexpected cases with generic message
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">⚙️</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Almost Ready</h3>
        <p className="text-gray-300 mb-4">
          Please refresh the page to continue.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default Dashboard;