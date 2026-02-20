// src/pages/Dashboard/Landlord/LandlordDashboard.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandlordHeader from '../../../components/Dashbaord/Landlord/LandlordHeader';
import LandlordSidebar from '../../../components/Dashbaord/Landlord/LandlordSidebar';
import DashboardOverview from './DashboardOverview';

// Import page components
import PropertiesPage from './PropertiesPage.jsx';
import PropertyDetailPage from './PropertiesPage/PropertyDetailPage';
import AddPropertyPage from './AddPropertyPage';
import BookingsPage from './BookingsPage';
import TenantsPage from './TenantsPage';
import PaymentsPage from './PaymentsPage';
import AnalyticsPage from './AnalyticsPage';
import MessagesPage from './MessagesPage';
import SettingsPage from './SettingsPage';

export default function LandlordDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header — fixed height, never scrolls */}
      <LandlordHeader />

      {/* Body — fills exact remaining height after header */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar — hidden on mobile, gets full height from parent on desktop */}
        <div className="hidden lg:block" style={{ height: '100%' }}>
          <LandlordSidebar />
        </div>

        {/* Main Content — scrolls independently */}
        <main style={{ flex: 1, overflowY: 'auto' }} className="bg-gray-50 p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/dashboard/properties" element={<PropertiesPage />} />
            <Route path="/dashboard/properties/:propertyUid" element={<PropertyDetailPage />} />
            <Route path="/dashboard/add-property" element={<AddPropertyPage />} />
            <Route path="/dashboard/bookings" element={<BookingsPage />} />
            <Route path="/dashboard/tenants" element={<TenantsPage />} />
            <Route path="/dashboard/payments" element={<PaymentsPage />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/messages" element={<MessagesPage />} />
            <Route path="/dashboard/settings/*" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}