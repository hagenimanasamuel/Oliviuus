// src/pages/Dashboard/Landlord/components/DashboardOverview.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, PlusCircle, Calendar, Settings, DollarSign, Users } from 'lucide-react';

export default function DashboardOverview() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome to Your Dashboard</h2>
        <p className="text-gray-600 mt-2">Manage your properties, bookings, and earnings in one place.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Properties</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <Home className="h-10 w-10 p-2 rounded-lg" 
                  style={{ color: '#f4eaf4', backgroundColor: '#BC8BBC' }} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
            </div>
            <DollarSign className="h-10 w-10 p-2 rounded-lg" 
                        style={{ color: '#f4eaf4', backgroundColor: '#BC8BBC' }} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <Users className="h-10 w-10 p-2 rounded-lg" 
                   style={{ color: '#f4eaf4', backgroundColor: '#BC8BBC' }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/landlord/dashboard/add-property')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#BC8BBC] hover:bg-[#f4eaf4] transition-colors text-center group"
          >
            <PlusCircle className="h-8 w-8 text-gray-400 mx-auto mb-2 group-hover:text-[#BC8BBC]" />
            <p className="font-medium text-gray-700 group-hover:text-[#8A5A8A]">Add Property</p>
          </button>
          
          <button
            onClick={() => navigate('/landlord/dashboard/properties')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#BC8BBC] hover:bg-[#f4eaf4] transition-colors text-center group"
          >
            <Home className="h-8 w-8 text-gray-400 mx-auto mb-2 group-hover:text-[#BC8BBC]" />
            <p className="font-medium text-gray-700 group-hover:text-[#8A5A8A]">View Properties</p>
          </button>
          
          <button
            onClick={() => navigate('/landlord/dashboard/bookings')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#BC8BBC] hover:bg-[#f4eaf4] transition-colors text-center group"
          >
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2 group-hover:text-[#BC8BBC]" />
            <p className="font-medium text-gray-700 group-hover:text-[#8A5A8A]">Manage Bookings</p>
          </button>
          
          <button
            onClick={() => navigate('/landlord/dashboard/settings')}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#BC8BBC] hover:bg-[#f4eaf4] transition-colors text-center group"
          >
            <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2 group-hover:text-[#BC8BBC]" />
            <p className="font-medium text-gray-700 group-hover:text-[#8A5A8A]">Settings</p>
          </button>
        </div>
      </div>
    </div>
  );
}