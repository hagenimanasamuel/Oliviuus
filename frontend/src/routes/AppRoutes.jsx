// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useState, useEffect } from "react";
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

// Kid Dashboard modules (new routes)
import KidLearningPage from "../pages/Dashboards/viewer/kid/KidLearningPage";

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
import KidDashboard from "../pages/Dashboards/viewer/kid/KidDashboard.jsx";
import KidFavoritesPage from "../pages/Dashboards/viewer/kid/KidFavoritesPage.jsx";
import KidSongsMusicPage from "../pages/Dashboards/viewer/kid/KidSongsMusicPage.jsx";
import KidGamesPage from "../pages/Dashboards/viewer/kid/KidGamesPage.jsx";
import TermsOfService from "../pages/landing/Legal&Help/TermsOfService.jsx";
import PrivacyPolicy from "../pages/landing/Legal&Help/PrivacyPolicy.jsx";
import HelpCenter from "../pages/landing/Legal&Help/HelpCenter.jsx";
import FeedbackPage from "../pages/landing/Legal&Help/FeedbackPage.jsx";
import About from "../pages/landing/Legal&Help/About.jsx";

export default function AppRoutes() {
  const { user, loading: authLoading, isKidMode } = useAuth();
  const { currentSubscription, loading: subLoading } = useSubscription();

  const [showContent, setShowContent] = useState(false);
  const [cachedContent, setCachedContent] = useState(null);

  // INSTANT RENDER: Show content immediately, don't wait for auth
  useEffect(() => {
    // Immediate render - don't wait
    setShowContent(true);

    // Only show minimal loader if it's taking too long
    const timeout = setTimeout(() => {
      // If still loading after 100ms, we'll show something
      // but this rarely happens with instant rendering
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  // Cache the root element to prevent re-renders
  useEffect(() => {
    const getRootElement = () => {
      if (!user) {
        return <LandingPage />;
      }

      // Admin users go to dashboard
      if (user.role === "admin") {
        return <Dashboard />;
      }

      // Viewer users in kid mode go to dashboard
      if (isKidMode) {
        return <Dashboard />;
      }

      // Viewer users WITHOUT subscription can access landing page
      if (user.role === "viewer" && !currentSubscription) {
        return <LandingPage />;
      }

      // Viewer users WITH subscription go to dashboard
      if (user.role === "viewer" && currentSubscription) {
        return <Dashboard />;
      }

      // Fallback to landing page
      return <LandingPage />;
    };

    setCachedContent(getRootElement());
  }, [user, currentSubscription, isKidMode]);

  // SIMPLE HELPERS - Don't wait for loading
  const AdminRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <KidProtectedRoute>
        <AdminDashboard bodyContent={element} />
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  const ViewerRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["viewer"]}>
      <KidProtectedRoute>
        <ViewerDashboard bodyContent={element} />
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  const ProtectedWatchRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["viewer"]}>
      <KidProtectedRoute>
        {element}
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  // Add Kid Route helper 
  const KidRoute = ({ element }) => (
    <ProtectedRoute allowedRoles={["viewer"]}>
      <KidProtectedRoute requireKidMode={true}>
        <KidDashboard bodyContent={element} />
      </KidProtectedRoute>
    </ProtectedRoute>
  );

  // INSTANT RENDER: Show content immediately, even if auth is still checking
  // This is the Netflix approach - show UI instantly, update auth state in background
  if (!showContent) {
    // Only show blank screen for the first render (extremely brief)
    return null;
  }

  // If auth is still loading but we have cached content, show it
  // This prevents blocking the UI
  const shouldShowLoading = authLoading && !cachedContent;

  if (shouldShowLoading) {
    // Minimal, non-blocking loader that doesn't delay content
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute inset-0 opacity-0">
          {/* This is invisible but keeps the layout */}
        </div>
      </div>
    );
  }

  // Show routes immediately - auth checks happen in background
  return (
    <Routes>
      {/* Root route - Show cached content immediately */}
      <Route
        path="/"
        element={
          <KidProtectedRoute>
            {cachedContent || <div className="h-screen bg-black" />}
          </KidProtectedRoute>
        }
      />

      {/* Auth route - Immediate render */}
      <Route
        path="/auth"
        element={
          <KidProtectedRoute>
            {user ? <Navigate to="/" replace /> : <AuthForm />}
          </KidProtectedRoute>
        }
      />

      {/* Password reset - Immediate render */}
      <Route
        path="/reset-password"
        element={
          <KidProtectedRoute>
            <ResetPassword />
          </KidProtectedRoute>
        }
      />

      {/* Subscription route - Render immediately */}
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

      {/* Payment route - Render immediately */}
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


      {/* Account settings - Render immediately */}
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

      {/* Admin routes - Render immediately */}
      <Route path="/admin" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/overview" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
      <Route path="/admin/library" element={<AdminRoute element={<Library />} />} />
      <Route path="/admin/subscriptions" element={<AdminRoute element={<Subscriptions />} />} />
      <Route path="/admin/analytics" element={<AdminRoute element={<Analytics />} />} />
      <Route path="/admin/global-management" element={<AdminRoute element={<GlobalManagement />} />} />
      <Route path="/admin/support" element={<AdminRoute element={<Support />} />} />

      {/* Viewer Dashboard Routes - Render immediately */}
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

      {/* Kid routes */}
      <Route path="/learn" element={<KidRoute element={<KidLearningPage />} />} />
      <Route path="/favorites" element={<KidRoute element={<KidFavoritesPage />} />} />
      <Route path="/music" element={<KidRoute element={<KidSongsMusicPage />} />} />
      <Route path="/play" element={<KidRoute element={<KidGamesPage />} />} />

      {/* public Routes */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/about" element={<About />} />

      {/* Watch and Content routes - Render immediately */}
      <Route
        path="/watch/:id"
        element={
          <ProtectedWatchRoute element={<WatchPage />} />
        }
      />
      <Route
        path="/title/:id"
        element={
          <ContentDetailPage />
        }
      />

      {/* Sample routes - Render immediately */}
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

      {/* Catch-all - Render immediately */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}