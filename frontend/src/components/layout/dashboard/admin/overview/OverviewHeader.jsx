import React from 'react';
import { RefreshCw, Calendar } from 'lucide-react';

export default function OverviewHeader({ user, lastUpdated, onRefresh }) {
  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">
            System Overview
          </h1>
          <p className="text-gray-300 text-lg">
            Welcome back, <span className="font-semibold text-[#BC8BBC]">{user?.email}</span>
          </p>
          <div className="flex items-center mt-2 text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm">Last updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}