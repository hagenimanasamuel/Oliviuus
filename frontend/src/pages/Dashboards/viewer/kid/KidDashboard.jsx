// src/pages/Dashboards/KidDashboard.jsx
import React from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useSubscription } from "../../../../context/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import KidLayout from "../../../../components/layout/dashboard/viewer/kid/KidLayout";
import KidLandingPage from "./KidLandingPage";

export default function KidDashboard({ bodyContent }) {
  const { kidProfile, exitKidMode, logoutUser, user } = useAuth();
  const { canAccessPremium, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  const handleExit = async () => {
    try {
      // If it's a family member with kid dashboard, redirect to family settings
      if (kidProfile?.is_family_member) {
        navigate('/account/settings#family');
      } else {
        // Regular kid profile - exit kid mode
        await exitKidMode();
        navigate('/'); // Redirect to parent dashboard
      }
    } catch (err) {
      console.error("❌ Exit kid mode failed:", err);
    }
  };

  // Show loading while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-purple-600">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">👶</div>
          <p className="text-xl">Loading your space...</p>
        </div>
      </div>
    );
  }

  // Check if user can access premium content
  // For family members, they inherit access from family owner
  // For regular kid profiles, they need individual subscription access
  const hasAccess = canAccessPremium();

  if (!hasAccess) {
    // Redirect based on user type
    if (kidProfile?.is_family_member) {
      // Family members without access should contact family owner
      navigate('/account/settings#family');
    } else {
      // Regular users need subscription
      navigate('/subscription');
    }
    return null;
  }

  // If not in kid mode, show fallback
  if (!kidProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-400 to-purple-600">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">👶</div>
          <p className="text-xl mb-4">No kid profile active</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold text-lg hover:bg-purple-100 transition"
          >
            Go to Parent Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <KidLayout 
      kidProfile={kidProfile} 
      onExit={handleExit}
      isFamilyMember={kidProfile.is_family_member}
    >
      {bodyContent || <KidLandingPage kidProfile={kidProfile} />}
    </KidLayout>
  );
}