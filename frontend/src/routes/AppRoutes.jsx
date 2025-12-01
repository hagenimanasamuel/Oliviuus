// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import NotFound from "../pages/NotFound";
import AuthForm from "../pages/auth/AuthForm";
import ResetPassword from "../pages/auth/ResetPassword";
import SubscriptionPage from "../pages/subscription/SubscriptionPage";
import Dashboard from "../pages/Dashboards/Dashboard";
import AccountSettings from "../pages/Dashboards/setting/AccountSettings";
import LandingPage from "../pages/LandingPage";
import ProtectedRoute from "../components/ProtectedRoute";
import KidProtectedRoute from "./KidProtectedRoute.jsx";

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
import PaymentPage from "../pages/subscription/PaymentPage.jsx";
import SecurityGridSystem from "../pages/subscription/SecurityGridSystem.jsx";
import SecurityGridPresentation from "../pages/subscription/SecurityGridSystem.jsx";
import WatchlistPage from "../pages/Dashboards/viewer/preferences/WatchlistPage.jsx";
import SearchModal from "../components/layout/dashboard/viewer/Header/SearchModal.jsx";
import TvShowsPage from "../pages/Dashboards/viewer/TvShowsPage.jsx";
import MoviesPage from "../pages/Dashboards/viewer/MoviesPage.jsx";
import NewPopularPage from "../pages/Dashboards/viewer/NewPopularPage.jsx";
import BrowsePage from "../pages/Dashboards/viewer/BrowsePage.jsx";
import OliviuusInvestorPitch from "../pages/subscription/OliviuusPpt.jsx";
import UmukinoWoKwiruka from "../pages/subscription/SimpleGame.jsx";
import WatchHistoryPage from "../pages/Dashboards/viewer/WatchHistoryPage.jsx";

export default function AppRoutes() {
  const { user, loading, isKidMode } = useAuth();
  const { currentSubscription } = useSubscription();

  // Ultra-fast minimal loading component
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-[#BC8BBC] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[#BC8BBC] rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-[#BC8BBC] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    );
  }

  // Simple helper to protect admin routes
  const AdminRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <KidProtectedRoute>
        <AdminDashboard bodyContent={element} />
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  // Simple helper to protect viewer routes with kid protection
  const ViewerRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["viewer"]}>
      <KidProtectedRoute>
        <ViewerDashboard bodyContent={element} />
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  // Special route for watch page that needs both protections
  const ProtectedWatchRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["viewer"]}>
      <KidProtectedRoute>
        {element}
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  // Determine root route based on user status and subscription
  const getRootElement = () => {
    if (!user) {
      return <LandingPage />;
    }
    
    // Admin users go directly to admin dashboard
    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    
    // Viewer users without subscription can access landing page
    if (user.role === "viewer" && !currentSubscription) {
      return <LandingPage />;
    }
    
    // Viewer users with subscription go to dashboard
    if (user.role === "viewer" && currentSubscription) {
      return <Dashboard />;
    }
    
    // Fallback
    return <LandingPage />;
  };

  return (
    <Routes>
      {/* Root route - Now allows logged-in users without subscription to see landing page */}
      <Route 
        path="/" 
        element={
          <KidProtectedRoute>
            {getRootElement()}
          </KidProtectedRoute>
        } 
      />

      {/* Auth route */}
      <Route
        path="/auth"
        element={
          <KidProtectedRoute>
            {user ? <Navigate to="/" replace /> : <AuthForm />}
          </KidProtectedRoute>
        }
      />

      {/* Password reset */}
      <Route
        path="/reset-password"
        element={
          <KidProtectedRoute>
            <ResetPassword />
          </KidProtectedRoute>
        }
      />

      {/* Subscription route - Forbidden in kid mode */}
      <Route
        path="/subscription"
        element={
          <KidProtectedRoute>
            {user && user.role === "viewer" && !currentSubscription ? (
              <SubscriptionPage />
            ) : user && user.role === "viewer" && currentSubscription ? (
              <Navigate to="/" replace />
            ) : !user ? (
              <Navigate to="/auth" replace />
            ) : (
              <Navigate to="/" replace />
            )}
          </KidProtectedRoute>
        }
      />

      {/* Payment route - Forbidden in kid mode */}
      <Route
        path="/payment"
        element={
          <KidProtectedRoute>
            {user && user.role === "viewer" && !currentSubscription ? (
              <PaymentPage />
            ) : user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/auth" replace state={{ from: '/payment' }} />
            )}
          </KidProtectedRoute>
        }
      />

      {/* Account settings route - Forbidden in kid mode */}
      <Route
        path="/account/settings"
        element={
          <KidProtectedRoute>
            <ProtectedRoute allowedRoles={["viewer", "admin"]}>
              <AccountSettings />
            </ProtectedRoute>
          </KidProtectedRoute>
        }
      />

      {/* Admin routes - Forbidden in kid mode */}
      <Route path="/admin" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/overview" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
      <Route path="/admin/library" element={<AdminRoute element={<Library />} />} />
      <Route path="/admin/subscriptions" element={<AdminRoute element={<Subscriptions />} />} />
      <Route path="/admin/analytics" element={<AdminRoute element={<Analytics />} />} />
      <Route path="/admin/global-management" element={<AdminRoute element={<GlobalManagement />} />} />
      <Route path="/admin/support" element={<AdminRoute element={<Support />} />} />

      {/* Viewer Dashboard Routes - Allowed in kid mode */}
      <Route path="/library" element={<ViewerRoute element={<MyLibrary />} />} />
      <Route path="/downloads" element={<ViewerRoute element={<DownloadPage />} />} />
      <Route path="/history" element={<ViewerRoute element={<WatchHistoryPage />} />} />
      <Route path="/my-list" element={<ViewerRoute element={<WatchlistPage />} />} />
      <Route path="/tv" element={<ViewerRoute element={<TvShowsPage />} />} />
      <Route path="/movies" element={<ViewerRoute element={<MoviesPage />} />} />
      <Route path="/new" element={<ViewerRoute element={<NewPopularPage />} />} />
      <Route path="/browse" element={<ViewerRoute element={<BrowsePage />} />} />
      <Route path="/profile" element={<ViewerRoute element={<ProfilePage />} />} />
      <Route path="/search" element={<ViewerRoute element={<SearchModal isPage={true} />} />} />
      
      {/* Watch and Content routes - Allowed in kid mode */}
      <Route 
        path="/watch/:id" 
        element={
          <ProtectedWatchRoute element={<WatchPage />} />
        } 
      />
      <Route 
        path="/title/:id" 
        element={
          <ProtectedWatchRoute element={<ContentDetailPage />} />
        } 
      />

      {/* Sample routes - Forbidden in kid mode */}
      <Route 
        path="/sample/security" 
        element={
          <KidProtectedRoute>
            <SecurityGridPresentation />
          </KidProtectedRoute>
        } 
      />
      <Route 
        path="/sample/oliviuus" 
        element={
          <KidProtectedRoute>
            <OliviuusInvestorPitch />
          </KidProtectedRoute>
        } 
      />
      <Route 
        path="/sample/game" 
        element={
          <KidProtectedRoute>
            <UmukinoWoKwiruka />
          </KidProtectedRoute>
        } 
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}