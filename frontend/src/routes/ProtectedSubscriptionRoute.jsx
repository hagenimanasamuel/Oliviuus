// src/components/ProtectedSubscriptionRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";

const ProtectedSubscriptionRoute = ({ 
  children, 
  requireActiveSubscription = true 
}) => {
  const { user } = useAuth();
  const { 
    hasActiveSubscription, 
    canAccessPremium, 
    loading, 
    currentSubscription 
  } = useSubscription();

  // Show loading while checking subscription
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Checking subscription...</div>
      </div>
    );
  }

  // Redirect non-viewers to dashboard
  if (!user || user.role !== "viewer") {
    return <Navigate to="/" replace />;
  }

  // If subscription is required but user doesn't have active subscription
  if (requireActiveSubscription && !canAccessPremium()) {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

export default ProtectedSubscriptionRoute;