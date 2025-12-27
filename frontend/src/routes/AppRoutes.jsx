// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
import Games from "../pages/Dashboards/Admins/games/Games";
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
import CountingGame from "../pages/subscription/SimpleGame.jsx";
import EndlessRacer from "../pages/subscription/SimpleGame2.jsx";
import Onboarding from "../pages/onBoarding/onBoarding.jsx";

// ==================== PRO SKELETON LOADERS ====================
const DashboardSkeleton = () => (
  <div className="bg-black min-h-screen animate-pulse">
    {/* Navigation Skeleton */}
    <div className="h-16 bg-gray-900 flex items-center justify-between px-6">
      <div className="flex items-center space-x-8">
        <div className="h-8 w-32 bg-gray-800 rounded-lg"></div>
        <div className="hidden md:flex space-x-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-6 w-20 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-800 rounded-full"></div>
        <div className="h-10 w-10 bg-gray-800 rounded-full"></div>
      </div>
    </div>

    {/* Hero Section Skeleton */}
    <div className="relative h-[70vh] bg-gradient-to-r from-gray-900 to-gray-800 mt-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/40"></div>
      <div className="absolute bottom-20 left-10 max-w-2xl">
        <div className="h-12 w-3/4 bg-gray-800 rounded-lg mb-4 shimmer"></div>
        <div className="h-6 w-full bg-gray-800 rounded mb-3 shimmer" style={{ animationDelay: '0.1s' }}></div>
        <div className="h-6 w-2/3 bg-gray-800 rounded mb-6 shimmer" style={{ animationDelay: '0.2s' }}></div>
        <div className="flex space-x-4">
          <div className="h-12 w-40 bg-purple-600 rounded-lg shimmer" style={{ animationDelay: '0.3s' }}></div>
          <div className="h-12 w-40 bg-gray-700 rounded-lg shimmer" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>

    {/* Content Rows Skeleton */}
    <div className="p-6 space-y-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-7 w-48 bg-gray-900 rounded shimmer" style={{ animationDelay: `${i * 0.1}s` }}></div>
            <div className="h-6 w-24 bg-gray-900 rounded shimmer" style={{ animationDelay: `${i * 0.1 + 0.1}s` }}></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(j => (
              <div key={j} className="relative group">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shimmer" 
                     style={{ animationDelay: `${i * 0.1 + j * 0.05}s` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
                <div className="mt-2 h-4 w-3/4 bg-gray-800 rounded shimmer" 
                     style={{ animationDelay: `${i * 0.1 + j * 0.05 + 0.1}s` }}></div>
                <div className="mt-1 h-3 w-1/2 bg-gray-900 rounded shimmer" 
                     style={{ animationDelay: `${i * 0.1 + j * 0.05 + 0.15}s` }}></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const LandingSkeleton = () => (
  <div className="bg-black min-h-screen animate-pulse">
    {/* Navigation */}
    <nav className="fixed w-full z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="h-10 w-32 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shimmer"></div>
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 w-16 bg-gray-800 rounded shimmer" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>
          <div className="h-10 w-28 bg-[#BC8BBC] rounded-lg shimmer" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <section className="relative h-screen bg-gradient-to-b from-gray-900 via-black to-black pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-3xl space-y-6">
          <div className="h-16 w-3/4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shimmer"></div>
          <div className="space-y-4">
            <div className="h-6 w-full bg-gray-800 rounded shimmer" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-6 w-2/3 bg-gray-800 rounded shimmer" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-6 w-4/5 bg-gray-800 rounded shimmer" style={{ animationDelay: '0.3s' }}></div>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="h-14 w-48 bg-[#BC8BBC] rounded-lg shimmer" style={{ animationDelay: '0.4s' }}></div>
            <div className="h-14 w-48 bg-gray-700/70 rounded-lg shimmer" style={{ animationDelay: '0.5s' }}></div>
            <div className="h-14 w-48 bg-gray-700/70 rounded-lg shimmer" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="h-12 w-64 mx-auto bg-gray-800 rounded-lg mb-12 shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-900/50 rounded-xl p-8 space-y-4">
              <div className="h-10 w-10 bg-gray-800 rounded-lg shimmer" style={{ animationDelay: `${i * 0.1}s` }}></div>
              <div className="h-7 w-40 bg-gray-800 rounded shimmer" style={{ animationDelay: `${i * 0.1 + 0.1}s` }}></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-800 rounded shimmer" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}></div>
                <div className="h-4 w-3/4 bg-gray-800 rounded shimmer" style={{ animationDelay: `${i * 0.1 + 0.3}s` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

const AdminSkeleton = () => (
  <div className="bg-gray-900 min-h-screen flex animate-pulse">
    {/* Sidebar */}
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="h-8 w-32 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shimmer"></div>
      </div>
      <div className="flex-1 p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map(item => (
          <div key={item} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/30">
            <div className="h-5 w-5 bg-gray-600 rounded shimmer" style={{ animationDelay: `${item * 0.1}s` }}></div>
            <div className="h-5 w-32 bg-gray-600 rounded shimmer" style={{ animationDelay: `${item * 0.1 + 0.05}s` }}></div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 p-3">
          <div className="h-10 w-10 bg-gray-700 rounded-full shimmer"></div>
          <div className="space-y-2 flex-1">
            <div className="h-3 w-24 bg-gray-700 rounded shimmer"></div>
            <div className="h-2 w-16 bg-gray-600 rounded shimmer"></div>
          </div>
        </div>
      </div>
    </aside>

    {/* Main Content */}
    <main className="flex-1">
      {/* Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-700 rounded shimmer"></div>
          <div className="h-3 w-32 bg-gray-600 rounded shimmer" style={{ animationDelay: '0.1s' }}></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-10 w-40 bg-gray-700 rounded-full shimmer" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-10 w-10 bg-gray-700 rounded-full shimmer" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(stat => (
            <div key={stat} className="bg-gray-800/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-gray-700 rounded shimmer" style={{ animationDelay: `${stat * 0.1}s` }}></div>
                <div className="h-8 w-8 bg-gray-700 rounded-lg shimmer" style={{ animationDelay: `${stat * 0.1 + 0.05}s` }}></div>
              </div>
              <div className="h-10 w-32 bg-gray-700 rounded shimmer" style={{ animationDelay: `${stat * 0.1 + 0.1}s` }}></div>
              <div className="h-2 w-full bg-gray-700 rounded-full shimmer" style={{ animationDelay: `${stat * 0.1 + 0.15}s` }}></div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-800/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-7 w-48 bg-gray-700 rounded shimmer"></div>
              <div className="h-8 w-24 bg-gray-700 rounded-lg shimmer" style={{ animationDelay: '0.1s' }}></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(row => (
                <div key={row} className="flex items-center justify-between p-4 bg-gray-700/20 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-700 rounded-full shimmer" style={{ animationDelay: `${row * 0.1}s` }}></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-700 rounded shimmer" style={{ animationDelay: `${row * 0.1 + 0.05}s` }}></div>
                      <div className="h-3 w-24 bg-gray-600 rounded shimmer" style={{ animationDelay: `${row * 0.1 + 0.1}s` }}></div>
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-gray-700 rounded shimmer" style={{ animationDelay: `${row * 0.1 + 0.15}s` }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-800/30 rounded-xl p-6">
            <div className="h-7 w-32 bg-gray-700 rounded mb-6 shimmer"></div>
            <div className="space-y-6">
              {[1, 2, 3].map(item => (
                <div key={item} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-700 rounded shimmer" style={{ animationDelay: `${item * 0.1}s` }}></div>
                    <div className="h-4 w-16 bg-gray-700 rounded shimmer" style={{ animationDelay: `${item * 0.1 + 0.05}s` }}></div>
                  </div>
                  <div className="h-2 w-full bg-gray-700 rounded-full shimmer" style={{ animationDelay: `${item * 0.1 + 0.1}s` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);


const KidSkeleton = () => (
  <div className="bg-gradient-to-br from-purple-900 to-blue-900 min-h-screen animate-pulse">
    {/* Header */}
    <header className="h-20 bg-gradient-to-b from-purple-800/50 to-transparent">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <div className="h-12 w-40 bg-gradient-to-r from-purple-700 to-purple-600 rounded-full shimmer"></div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-yellow-500 rounded-full shimmer" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-10 w-10 bg-pink-500 rounded-full shimmer" style={{ animationDelay: '0.2s' }}></div>
          <div className="h-10 w-10 bg-green-500 rounded-full shimmer" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
    </header>

    {/* Welcome Section */}
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-16 w-16 bg-purple-700 rounded-full shimmer"></div>
        <div className="space-y-2">
          <div className="h-6 w-56 bg-purple-700 rounded-full shimmer" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-4 w-40 bg-purple-600/70 rounded-full shimmer" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12">
        <div className="h-8 w-48 bg-purple-700 rounded-full mb-6 shimmer" style={{ animationDelay: '0.3s' }}></div>
        <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map(item => (
            <div key={item} className="flex-shrink-0 h-12 w-32 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shimmer" 
                 style={{ animationDelay: `${0.4 + item * 0.1}s` }}></div>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="mb-12">
        <div className="h-8 w-64 bg-purple-700 rounded-full mb-6 shimmer" style={{ animationDelay: '0.5s' }}></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(item => (
            <div key={item} className="relative group">
              <div className="aspect-square bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl overflow-hidden shimmer"
                   style={{ animationDelay: `${0.6 + item * 0.05}s` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
              <div className="mt-2 h-4 w-20 bg-purple-700/70 rounded-full mx-auto shimmer"
                   style={{ animationDelay: `${0.6 + item * 0.05 + 0.1}s` }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Section */}
      <div>
        <div className="h-8 w-72 bg-purple-700 rounded-full mb-6 shimmer" style={{ animationDelay: '0.8s' }}></div>
        <div className="relative h-64 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl overflow-hidden shimmer"
             style={{ animationDelay: '0.9s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-x"></div>
          <div className="absolute bottom-8 left-8 w-1/2">
            <div className="h-10 w-48 bg-white/30 rounded-full mb-4 shimmer" style={{ animationDelay: '1s' }}></div>
            <div className="h-6 w-32 bg-white/30 rounded-full shimmer" style={{ animationDelay: '1.1s' }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
// ==================== END SKELETON LOADERS ====================

export default function AppRoutes() {
  const { user, loading: authLoading, isKidMode } = useAuth();
  
  // REMOVED: const { currentSubscription, loading: subLoading } = useSubscription();
  const [predictedView, setPredictedView] = useState('landing');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Track previous loading states
  const prevAuthLoading = useRef(authLoading);

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

  // Simplified loading state management
  useEffect(() => {
    // Hide skeleton after auth loading completes
    if (!authLoading && !hasLoadedOnce) {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        setHasLoadedOnce(true);
      }, 100); // Small delay for smooth transition
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, hasLoadedOnce]);

  // Memoized content to prevent re-renders
  const cachedContent = useMemo(() => {
    if (!user) return <LandingPage />;
    if (user.role === "admin") return <Dashboard />;
    if (isKidMode) return <Dashboard />;
    
    // For viewers, let Dashboard component handle subscription check internally
    if (user.role === "viewer") return <Dashboard />;
    
    return <LandingPage />;
  }, [user, isKidMode]);

  // Skeleton selection
  const getSkeleton = () => {
    switch(predictedView) {
      case 'admin': return <AdminSkeleton />;
      case 'kid': return <KidSkeleton />;
      case 'dashboard': return <DashboardSkeleton />;
      default: return <LandingSkeleton />;
    }
  };

  // Show skeleton only on initial load
  if (showSkeleton && !hasLoadedOnce) {
    return getSkeleton();
  }

  // Route component helpers
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
      {/* Root route - Dashboard handles subscription internally */}
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

      {/* Subscription route - Let the page handle its own logic */}
      <Route
        path="/subscription"
        element={
          <KidProtectedRoute>
            <SubscriptionPage />
          </KidProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <KidProtectedRoute>
            {user ? <PaymentPage /> : <Navigate to="/auth" replace state={{ from: '/payment' }} />}
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

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/overview" element={<AdminRoute element={<Overview />} />} />
      <Route path="/admin/users" element={<AdminRoute element={<Users />} />} />
      <Route path="/admin/library" element={<AdminRoute element={<Library />} />} />
      <Route path="/admin/subscriptions" element={<AdminRoute element={<Subscriptions />} />} />
      <Route path="/admin/analytics" element={<AdminRoute element={<Analytics />} />} />
      <Route path="/admin/games" element={<AdminRoute element={<Games />} />} />
      <Route path="/admin/support" element={<AdminRoute element={<Support />} />} />

      {/* Viewer routes - Each component handles its own subscription logic */}
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
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Kid routes */}
      <Route path="/learn" element={<KidRoute element={<KidLearningPage />} />} />
      <Route path="/favorites" element={<KidRoute element={<KidFavoritesPage />} />} />
      <Route path="/music" element={<KidRoute element={<KidSongsMusicPage />} />} />
      <Route path="/play" element={<KidRoute element={<KidGamesPage />} />} />

      {/* Public routes */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="/about" element={<About />} />

      {/* Watch and content routes */}
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

      {/* Sample routes */}
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
            <CountingGame />
          </KidProtectedRoute>
        }
      />
      <Route
        path="/sample/game/2"
        element={
          <KidProtectedRoute>
            <EndlessRacer />
          </KidProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}