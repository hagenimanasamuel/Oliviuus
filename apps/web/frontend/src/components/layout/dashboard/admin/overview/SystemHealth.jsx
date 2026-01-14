import React from 'react';
import { Server, Database, Users, Bell, Shield } from 'lucide-react';

export default function SystemHealth({ data }) {
  const systemHealth = data?.systemHealth || {};

  const healthMetrics = [
    {
      label: 'Total Users',
      value: systemHealth.total_users || 0,
      icon: Users,
      status: 'normal'
    },
    {
      label: 'Active Subscriptions',
      value: systemHealth.active_subscriptions || 0,
      icon: Database,
      status: 'normal'
    },
    {
      label: 'Pending Tickets',
      value: systemHealth.pending_tickets || 0,
      icon: Bell,
      status: systemHealth.pending_tickets > 10 ? 'warning' : 'normal'
    },
    {
      label: 'Security Events (24h)',
      value: systemHealth.security_events_24h || 0,
      icon: Shield,
      status: systemHealth.security_events_24h > 50 ? 'warning' : 'normal'
    },
    {
      label: 'Unread Notifications',
      value: systemHealth.unread_notifications || 0,
      icon: Bell,
      status: systemHealth.unread_notifications > 20 ? 'warning' : 'normal'
    }
  ];

  const getStatusColor = (status) => {
    return status === 'warning' ? 'text-yellow-500' : 'text-green-500';
  };

  const getStatusIcon = (status) => {
    return status === 'warning' ? '⚠️' : '✅';
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Server className="w-5 h-5 mr-2 text-[#BC8BBC]" />
        System Health
      </h3>

      <div className="space-y-3">
        {healthMetrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
            <div className="flex items-center space-x-3">
              <metric.icon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">{metric.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold">{metric.value}</span>
              <span className={getStatusColor(metric.status)}>
                {getStatusIcon(metric.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Status */}
      <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-green-300 text-sm">System Status</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-medium">Operational</span>
          </div>
        </div>
      </div>

      {/* Last Check */}
      <div className="mt-3 text-center">
        <span className="text-gray-500 text-xs">
          Last checked: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}