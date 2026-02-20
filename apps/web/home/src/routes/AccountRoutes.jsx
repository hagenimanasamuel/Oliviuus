import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Lazy load account pages
const BookingsPage = lazy(() => import('../pages/Account/BookingsPage.jsx'));
const WishlistPage = lazy(() => import('../pages/Account/WishlistPage.jsx'));
const MessagesPage = lazy(() => import('../pages/Account/MessagesPage.jsx'));
const SettingsPage = lazy(() => import('../pages/Account/SettingsPage.jsx'));

// Simple fallback that just shows nothing while loading
const EmptyFallback = () => null;

export default function AccountRoutes() {
  return (
    <Suspense fallback={<EmptyFallback />}>
      <Routes>
        <Route index element={<Navigate to="/account/bookings" replace />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings/*" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/account/bookings" replace />} />
      </Routes>
    </Suspense>
  );
}