// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotFound from "../pages/NotFound";
import AuthForm from "../pages/auth/AuthForm";
import ResetPassword from "../pages/auth/ResetPassword";
import SubscriptionPage from "../pages/subscription/SubscriptionPage";
import Dashboard from "../pages/Dashboards/Dashboard";
import AccountSettings from "../pages/Dashboards/setting/AccountSettings";
import LandingPage from "../pages/LandingPage";
import ProtectedRoute from "../components/ProtectedRoute";

// Admin Dashboard modules
import AdminDashboard from "../pages/Dashboards/Admins/AdminDashboard";
import Overview from "../pages/Dashboards/Admins/overview/Overview";
import Users from "../pages/Dashboards/Admins/users/Users";
import Library from "../pages/Dashboards/Admins/library/Library";
import Subscriptions from "../pages/Dashboards/Admins/subscriptions/Subscriptions";
import Analytics from "../pages/Dashboards/Admins/analytics/Analytics";
import GlobalManagement from "../pages/Dashboards/Admins/GlobalManagement/GlobalManagement";
import Support from "../pages/Dashboards/Admins/support/Support";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Checking authentication...
      </div>
    );
  }

  const canAccessSubscription = (user) => {
    if (!user) return false;
    if (user.role === "admin") return false; // admins cannot access subscription
    return true;
  };

  //  Simple helper to protect admin routes
  const AdminRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard bodyContent={element} />
    </ProtectedRoute>
  );

  return (
    <Routes>
      {/* Root route */}
      <Route path="/" element={user ? <Dashboard /> : <LandingPage />} />

      {/* Auth route */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthForm />}
      />

      {/* password reset */}
      <Route
        path="/reset-password"
        element={<ResetPassword />}
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

      {/* Account settings route */}
      <Route
        path="/account/settings"
        element={
          <ProtectedRoute allowedRoles={["viewer", "admin"]}>
            <AccountSettings />
          </ProtectedRoute>
        }
      />

      {/* Admin routes using bodyContent prop */}
      <Route path="/admin" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/overview" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
      <Route path="/admin/library" element={<AdminRoute element={<Library />} />} />
      <Route path="/admin/subscriptions" element={<AdminRoute element={<Subscriptions />} />} />
      <Route path="/admin/analytics" element={<AdminRoute element={<Analytics />} />} />
      <Route path="/admin/global-management" element={<AdminRoute element={<GlobalManagement />} />} />
      <Route path="/admin/support" element={<AdminRoute element={<Support />} />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
