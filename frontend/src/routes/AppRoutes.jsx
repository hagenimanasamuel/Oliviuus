// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useState, useEffect, useMemo, useRef } from "react";
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

// Viewer Dashboard modules
import ViewerDashboard from "../pages/Dashboards/ViewerDashboard";
import WatchPage from "../pages/Dashboards/viewer/WatchPage.jsx";
import MyLibrary from "../pages/Dashboards/viewer/MyLibrary";
import DownloadPage from "../pages/Dashboards/viewer/DownloadPage";
import ProfilePage from "../pages/Dashboards/viewer/ProfilePage";
import ContentDetailPage from "../pages/Dashboards/viewer/ContentDetailPage.jsx";

// Kid Dashboard modules
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

// ==================== PRO SKELETON LOADERS ====================
const DashboardSkeleton = () => (
  <div className="bg-black min-h-screen">
    <div className="h-16 bg-gray-900" />
    <div className="h-[70vh] bg-gradient-to-r from-gray-900 to-gray-800 mt-4" />
    {[1, 2, 3].map(i => (
      <div key={i} className="mt-8">
        <div className="h-8 w-48 bg-gray-800 mb-4 rounded" />
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5, 6].map(j => (
            <div key={j} className="h-48 w-[300px] bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const LandingSkeleton = () => (
  <div className="bg-black min-h-screen">
    <div className="h-20 bg-gradient-to-b from-black to-transparent fixed w-full">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <div className="h-10 w-40 bg-gray-800 rounded" />
        <div className="flex items-center gap-6">
          <div className="h-10 w-28 bg-[#BC8BBC] rounded" />
        </div>
      </div>
    </div>
    <div className="h-screen bg-gradient-to-b from-gray-900 to-black pt-20">
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="max-w-3xl">
          <div className="h-16 w-3/4 bg-gray-800 rounded mb-6" />
          <div className="h-6 w-full bg-gray-800 rounded mb-4" />
          <div className="h-6 w-2/3 bg-gray-800 rounded mb-8" />
          <div className="flex gap-4">
            <div className="h-14 w-48 bg-[#BC8BBC] rounded" />
            <div className="h-14 w-48 bg-gray-700/70 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminSkeleton = () => (
  <div className="bg-gray-900 min-h-screen">
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800">
      <div className="p-6 border-b border-gray-700">
        <div className="h-8 w-32 bg-gray-700 rounded" />
      </div>
      <div className="p-4">
        {[1, 2, 3, 4, 5, 6].map(item => (
          <div key={item} className="h-10 bg-gray-700/50 rounded mb-2" />
        ))}
      </div>
    </div>
    <div className="ml-64">
      <div className="h-16 bg-gray-800 border-b border-gray-700">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-700 rounded" />
          <div className="h-10 w-10 bg-gray-700 rounded-full" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(stat => (
            <div key={stat} className="bg-gray-800/50 rounded-xl p-6">
              <div className="h-6 w-24 bg-gray-700 rounded mb-4" />
              <div className="h-10 w-32 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-gray-800/30 rounded-xl p-6">
          <div className="h-7 w-48 bg-gray-700 rounded mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="h-12 bg-gray-700/50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const KidSkeleton = () => (
  <div className="bg-gradient-to-br from-purple-900 to-blue-900 min-h-screen">
    <div className="h-20 bg-gradient-to-b from-purple-800/50 to-transparent">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <div className="h-12 w-40 bg-purple-700 rounded-full" />
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-yellow-500 rounded-full" />
          <div className="h-10 w-10 bg-pink-500 rounded-full" />
        </div>
      </div>
    </div>
    <div className="container mx-auto px-4 py-8">
      <div className="h-10 w-56 bg-purple-700 rounded-full mb-8" />
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(item => (
          <div key={item} className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);
// ==================== END SKELETON LOADERS ====================

export default function AppRoutes() {
  const { user, loading: authLoading, isKidMode } = useAuth();
  const { currentSubscription, loading: subLoading } = useSubscription();

  const [predictedView, setPredictedView] = useState('landing');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Track previous loading states to detect changes
  const prevAuthLoading = useRef(authLoading);
  const prevSubLoading = useRef(subLoading);

  // Ultra-fast view prediction
  useEffect(() => {
    const predictView = () => {
      const hasSession = document.cookie.includes('session') || 
                        document.cookie.includes('token');
      const lastPath = localStorage.getItem('last-path') || '';
      
      if (hasSession && lastPath.includes('/admin')) return 'admin';
      if (hasSession && (lastPath.includes('/kid') || lastPath.includes('/play'))) return 'kid';
      if (hasSession) return 'dashboard';
      return 'landing';
    };

    setPredictedView(predictView());
  }, []);

  // Smooth loading state management
  useEffect(() => {
    // If loading just finished, mark content as ready
    if (!authLoading && !subLoading && !contentReady) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 50); // 50ms delay for smoothness
      
      return () => clearTimeout(timer);
    }
    
    // If loading started, show skeleton immediately
    if ((authLoading || subLoading) && !hasLoadedOnce) {
      setShowSkeleton(true);
      setContentReady(false);
    }
  }, [authLoading, subLoading, contentReady, hasLoadedOnce]);

  // Mark as loaded once to prevent future skeleton flashes
  useEffect(() => {
    if (!authLoading && !subLoading && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [authLoading, subLoading, hasLoadedOnce]);

  // Memoized content to prevent re-renders
  const cachedContent = useMemo(() => {
    if (!user) return <LandingPage />;
    if (user.role === "admin") return <Dashboard />;
    if (isKidMode) return <Dashboard />;
    if (user.role === "viewer" && !currentSubscription) return <LandingPage />;
    if (user.role === "viewer" && currentSubscription) return <Dashboard />;
    return <LandingPage />;
  }, [user, currentSubscription, isKidMode]);

  // Skeleton selection
  const getSkeleton = () => {
    switch(predictedView) {
      case 'admin': return <AdminSkeleton />;
      case 'kid': return <KidSkeleton />;
      case 'dashboard': return <DashboardSkeleton />;
      default: return <LandingSkeleton />;
    }
  };

  // ========== SMOOTH RENDERING LOGIC ==========
  // Only show skeleton on initial load, not on subsequent auth changes
  const shouldShowSkeleton = showSkeleton && (!hasLoadedOnce || (authLoading && !contentReady));
  
  // If we should show skeleton, show it with overlay for smooth transition
  if (shouldShowSkeleton) {
    return (
      <>
        {getSkeleton()}
        {/* Hidden content ready to appear */}
        <div style={{ display: 'none' }}>
          <RoutesComponent />
        </div>
      </>
    );
  }

  // Main routes component extracted for clean rendering
  function RoutesComponent() {
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

    const KidRoute = ({ element }) => (
      <ProtectedRoute allowedRoles={["viewer"]}>
        <KidProtectedRoute requireKidMode={true}>
          <KidDashboard bodyContent={element} />
        </KidProtectedRoute>
      </ProtectedRoute>
    );

    return (
      <Routes>
        <Route
          path="/"
          element={
            <KidProtectedRoute>
              {cachedContent}
            </KidProtectedRoute>
          }
        />

        <Route
          path="/auth"
          element={
            <KidProtectedRoute>
              {user ? <Navigate to="/" replace /> : <AuthForm />}
            </KidProtectedRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <KidProtectedRoute>
              <ResetPassword />
            </KidProtectedRoute>
          }
        />

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

        <Route path="/admin" element={<AdminRoute element={<Overview />} />} />
        <Route path="/admin/overview" element={<AdminRoute element={<Overview />} />} />
        <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
        <Route path="/admin/library" element={<AdminRoute element={<Library />} />} />
        <Route path="/admin/subscriptions" element={<AdminRoute element={<Subscriptions />} />} />
        <Route path="/admin/analytics" element={<AdminRoute element={<Analytics />} />} />
        <Route path="/admin/global-management" element={<AdminRoute element={<GlobalManagement />} />} />
        <Route path="/admin/support" element={<AdminRoute element={<Support />} />} />

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

        <Route path="/learn" element={<KidRoute element={<KidLearningPage />} />} />
        <Route path="/favorites" element={<KidRoute element={<KidFavoritesPage />} />} />
        <Route path="/music" element={<KidRoute element={<KidSongsMusicPage />} />} />
        <Route path="/play" element={<KidRoute element={<KidGamesPage />} />} />

        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/about" element={<About />} />

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

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  // Always render the routes component
  return <RoutesComponent />;
}