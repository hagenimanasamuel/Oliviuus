// src/routes/AccountRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load account pages
const BookingsPage = lazy(() => import('../pages/Account/BookingsPage.jsx'));
const WishlistPage = lazy(() => import('../pages/Account/WishlistPage.jsx'));
const MessagesPage = lazy(() => import('../pages/Account/MessagesPage.jsx'));
// const SettingsPage = lazy(() => import('../pages/Account/SettingsPage.jsx'));
// const BecomeLandlordPage = lazy(() => import('../pages/Account/BecomeLandlordPage.jsx'));
// const BecomeAgentPage = lazy(() => import('../pages/Account/BecomeAgentPage.jsx'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
      <div className="w-16 h-16 border-4 border-[#BC8BBC] border-t-transparent rounded-full animate-spin absolute top-0"></div>
    </div>
  </div>
);

export default function AccountRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Redirect root to bookings since we removed overview */}
        <Route index element={<Navigate to="/account/bookings" replace />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="messages" element={<MessagesPage />} />
        {/* <Route path="settings/*" element={<SettingsPage />} />
        <Route path="become-landlord" element={<BecomeLandlordPage />} />
        <Route path="become-agent" element={<BecomeAgentPage />} /> */}
        <Route path="*" element={<Navigate to="/account/bookings" replace />} />
      </Routes>
    </Suspense>
  );
}