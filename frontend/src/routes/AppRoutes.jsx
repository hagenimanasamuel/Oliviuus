// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext"; // Add this import
import NotFound from "../pages/NotFound";
import AuthForm from "../pages/auth/AuthForm";
import ResetPassword from "../pages/auth/ResetPassword";
import SubscriptionPage from "../pages/subscription/SubscriptionPage";
import Dashboard from "../pages/Dashboards/Dashboard";
import AccountSettings from "../pages/Dashboards/setting/AccountSettings";
import LandingPage from "../pages/LandingPage";
import ProtectedRoute from "../components/ProtectedRoute";
import ProtectedSubscriptionRoute from "./ProtectedSubscriptionRoute";

// Admin Dashboard modules
import AdminDashboard from "../pages/Dashboards/Admins/AdminDashboard";
import Overview from "../pages/Dashboards/Admins/overview/Overview";
import Users from "../pages/Dashboards/Admins/users/Users";
import Library from "../pages/Dashboards/Admins/library/Library";
import Subscriptions from "../pages/Dashboards/Admins/subscriptions/Subscriptions";
import Analytics from "../pages/Dashboards/Admins/analytics/Analytics";
import GlobalManagement from "../pages/Dashboards/Admins/GlobalManagement/GlobalManagement";
import Support from "../pages/Dashboards/Admins/support/Support";

// Viewer Dashboard modules (new routes)
import ViewerDashboard from "../pages/Dashboards/ViewerDashboard"; 
import WatchPage from "../pages/Dashboards/viewer/WatchPage.jsx"; 
import MyLibrary from "../pages/Dashboards/viewer/MyLibrary"; 
import DownloadPage from "../pages/Dashboards/viewer/DownloadPage"; 
import ProfilePage from "../pages/Dashboards/viewer/ProfilePage"; 
import ContentDetailPage from "../pages/Dashboards/viewer/ContentDetailPage.jsx";

// Sample subscription
import SampleSubscription from "../pages/subscription/SampleSubscriptionPage";
import SecurityGridSystem from "../pages/subscription/SecurityGridSystem.jsx";
import SecurityGridPresentation from "../pages/subscription/SecurityGridSystem.jsx";

export default function AppRoutes() {
  const { user, loading } = useAuth();
  const { canAccessPremium } = useSubscription(); // Add this hook

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Checking authentication...
      </div>
    );
  }

  // Simple helper to protect admin routes
  const AdminRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard bodyContent={element} />
    </ProtectedRoute>
  );

  // Simple helper to protect viewer routes with subscription
  const ViewerRoute = ({ element, requireSubscription = true }) => (
    <ProtectedSubscriptionRoute requireActiveSubscription={requireSubscription}>
      <ViewerDashboard bodyContent={element} />
    </ProtectedSubscriptionRoute>
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

      {/* Password reset */}
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* Subscription route - ONLY for viewers WITHOUT active subscription */}
      <Route
        path="/subscription"
        element={
          user && user.role === "viewer" && !canAccessPremium() ? (
            <SubscriptionPage />
          ) : user ? (
            // If user has subscription or is admin, redirect to dashboard
            <Navigate to="/" replace />
          ) : (
            // If no user, redirect to auth
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

      {/* Viewer Dashboard Routes (require active subscription) */}
      <Route path="/watch" element={<ViewerRoute element={<WatchPage />} />} />
      <Route path="/library" element={<ViewerRoute element={<MyLibrary />} />} />
      <Route path="/downloads" element={<ViewerRoute element={<DownloadPage />} />} />
      <Route path="/profile" element={<ViewerRoute element={<ProfilePage />} requireSubscription={false} />} />
      <Route path="/title/:id" element={<ContentDetailPage />} />

      {/* Sample routes */}
      <Route path="/sample" element={<SampleSubscription />} />
      <Route path="/sample/security" element={<SecurityGridPresentation />} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}