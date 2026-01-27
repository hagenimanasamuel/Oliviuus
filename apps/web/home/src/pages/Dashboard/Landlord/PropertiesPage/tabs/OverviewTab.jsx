// src/pages/Dashboard/Landlord/pages/components/tabs/OverviewTab.jsx
import React from 'react';
import { Users, Home, Layers, Building } from 'lucide-react';

const OverviewTab = ({ property }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {property.description || 'No description provided.'}
        </p>
      </div>
      
      {/* Key Features Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <Users className="h-5 w-5 text-slate-600 mr-2" />
            <span className="text-sm font-medium text-slate-700">Max Guests</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{property.max_guests || 'N/A'}</div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <Home className="h-5 w-5 text-slate-600 mr-2" />
            <span className="text-sm font-medium text-slate-700">Total Rooms</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{property.total_rooms || 'N/A'}</div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <Layers className="h-5 w-5 text-slate-600 mr-2" />
            <span className="text-sm font-medium text-slate-700">Area</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {property.area ? `${property.area} m²` : 'N/A'}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="flex items-center mb-2">
            <Building className="h-5 w-5 text-slate-600 mr-2" />
            <span className="text-sm font-medium text-slate-700">Type</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 capitalize">
            {property.property_type?.replace('_', ' ') || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;