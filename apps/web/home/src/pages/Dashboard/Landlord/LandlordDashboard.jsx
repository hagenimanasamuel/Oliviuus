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
    <div className="min-h-screen bg-gray-50">
      <LandlordHeader />
      
      <div className="flex">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <LandlordSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
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