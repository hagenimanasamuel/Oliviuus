// src/pages/Dashboard/Landlord/pages/components/tabs/RulesTab.jsx
import React from 'react';
import { Clock as ClockIcon } from 'lucide-react';

const RulesTab = ({ property }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">House Rules</h3>
        <div className="bg-slate-50 p-4 rounded-xl">
          <p className="text-slate-700">
            {property.house_rules || 'No specific house rules have been set for this property.'}
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Check-in / Check-out</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-slate-600 mr-2" />
              <span className="font-medium text-slate-700">Check-in</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{property.check_in_time || '14:00'}</div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-slate-600 mr-2" />
              <span className="font-medium text-slate-700">Check-out</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{property.check_out_time || '11:00'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesTab;