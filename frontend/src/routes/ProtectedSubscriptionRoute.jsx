// src/components/ProtectedSubscriptionRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

const ProtectedSubscriptionRoute = ({ 
  children, 
  requireActiveSubscription = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { 
    canAccessPremium, 
    loading: subLoading 
  } = useSubscription();

  // Show loading while checking authentication and subscription
  if (authLoading || subLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        {/* Your TV loading animation */}
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only check subscription if it's required for this route
  if (requireActiveSubscription) {
    // If user is a viewer and cannot access premium, redirect to subscription
    if (user.role === "viewer" && !canAccessPremium()) {
      return <Navigate to="/subscription" replace />;
    }
    
    // If user is not a viewer (admin), allow access without subscription check
    // This prevents admins from being redirected to subscription page
  }

  // Allow access:
  // - If subscription is not required for this route OR
  // - If user has valid subscription OR  
  // - If user is admin (no subscription needed)
  return children;
};

export default ProtectedSubscriptionRoute;