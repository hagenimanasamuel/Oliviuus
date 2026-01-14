import React from 'react';
import { Shield, Smartphone, Monitor, Users, Activity } from 'lucide-react';

export default function SecurityOverview({ data }) {
  const securityStats = data?.securityStats || {};

  const sessionMetrics = [
    {
      label: 'Desktop',
      value: securityStats.desktop_sessions || 0,
      icon: Monitor,
      color: 'text-blue-500'
    },
    {
      label: 'Mobile',
      value: securityStats.mobile_sessions || 0,
      icon: Smartphone,
      color: 'text-green-500'
    },
    {
      label: 'Active Now',
      value: securityStats.recent_activity || 0,
      icon: Activity,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2 text-[#BC8BBC]" />
        Security & Sessions
      </h3>

      {/* Total Sessions */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 mb-4">
        <div className="text-center text-white">
          <div className="text-2xl font-bold">{securityStats.total_sessions || 0}</div>
          <div className="text-blue-100 text-sm">Total Active Sessions</div>
        </div>
      </div>

      {/* Session Distribution */}
      <div className="space-y-3 mb-4">
        {sessionMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-750 rounded">
            <div className="flex items-center space-x-3">
              <div className={metric.color}>
                <metric.icon className="w-4 h-4" />
              </div>
              <span className="text-gray-300 text-sm">{metric.label}</span>
            </div>
            <span className="text-white font-bold">{metric.value}</span>
          </div>
        ))}
      </div>

      {/* Unique Users */}
      <div className="p-3 bg-gray-750 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#BC8BBC]" />
            <span className="text-gray-300 text-sm">Unique Active Users</span>
          </div>
          <span className="text-white font-bold">{securityStats.unique_active_users || 0}</span>
        </div>
      </div>

      {/* Security Status */}
      <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
        <div className="flex items-center">
          <Shield className="w-4 h-4 text-green-400 mr-2" />
          <span className="text-green-300 text-sm">All security systems operational</span>
        </div>
      </div>
    </div>
  );
}