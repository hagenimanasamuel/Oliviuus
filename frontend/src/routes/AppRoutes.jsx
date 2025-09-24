// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotFound from "../pages/NotFound";
import AuthForm from "../pages/auth/AuthForm";
import SubscriptionPage from "../pages/subscription/SubscriptionPage";
import Dashboard from "../pages/Dashboards/Dashboard";
import AccountSettings from "../pages/Dashboards/setting/AccountSettings";
import LandingPage from "../pages/LandingPage";
import ProtectedRoute from "../components/ProtectedRoute";

// ✅ Strong route protection
export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Checking authentication...
      </div>
    );
  }

  // Helper function for subscription page access
  const canAccessSubscription = (user) => {
    if (!user) return false;
    if (user.role === "admin") return false; // admins cannot access subscription
    return true;
  };

  return (
    <Routes>
      {/* Root route: dynamically render dashboard or landing */}
      <Route path="/" element={user ? <Dashboard /> : <LandingPage />} />

      {/* Auth route */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthForm />}
      />

      {/* Subscription route - viewers only */}
      <Route
        path="/subscription"
        element={
          canAccessSubscription(user) ? (
            <SubscriptionPage />
          ) : user ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* Account settings route - all logged-in users */}
      <Route
        path="/account/settings"
        element={
          <ProtectedRoute allowedRoles={["viewer", "admin"]}>
            <AccountSettings />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
