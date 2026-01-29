// src/routes/HomeRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LandingPage from '../pages/Landing/LandingPage.jsx';
import HostProfilePage from '../pages/Landing/HostProfilePage.jsx';
import PropertyDetailsPage from '../pages/Landing/property/PropertyDetailsPage.jsx';
import BookingSuccessPage from '../pages/Booking/SuccessPage.jsx';
import BookingProcess from '../pages/Booking/BookingProcess.jsx';

// Lazy load components
const BookingsPage = lazy(() => import('../pages/Account/BookingsPage.jsx'));
const WishlistPage = lazy(() => import('../pages/Account/WishlistPage.jsx'));
const BecomeLandlordPage = lazy(() => import('../pages/Account/BecomeLandlordPage.jsx'));
const BecomeAgentPage = lazy(() => import('../pages/Account/BecomeAgentPage.jsx'));
const LandlordDashboard = lazy(() => import('../pages/Dashboard/Landlord/LandlordDashboard.jsx'));


// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Import hooks inside component to avoid hooks at top level
import { useAuth } from '../context/AuthContext';
import { useIsanzureAuth } from '../context/IsanzureAuthContext';

export default function HomeRoutes() {
  // Each component handles its own loading state with skeleton
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
          {/* Search Routes - Will render LandingPage with search params */}
        <Route path="/search" element={<LandingPage />} />
        <Route path="/properties/:propertyUid" element={<PropertyDetailsPage />} />
        <Route path="/host/:hostUid" element={<HostProfilePage />} />

         {/* Booking Routes */}
        <Route path="/book/:propertyUid" element={<BookingProcess />} />
        <Route path="/booking/success/:propertyUid" element={<BookingSuccessPage />} />

        {/* Account Routes */}
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/become-landlord" element={<BecomeLandlordPage />} />
        <Route path="/become-agent" element={<BecomeAgentPage />} />

        {/* Landlord Dashboard Routes */}
        <Route path="/landlord/*" element={<LandlordDashboard />} />

        {/* Catch-all "*" redirects to "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}