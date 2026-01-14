import React from 'react';
import { HelpCircle, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SupportOverview({ data }) {
  const supportStats = data?.supportStats || {};

  const ticketStatus = [
    {
      label: 'New',
      value: supportStats.new_tickets || 0,
      color: 'bg-yellow-500',
      icon: HelpCircle
    },
    {
      label: 'In Progress',
      value: supportStats.in_progress_tickets || 0,
      color: 'bg-blue-500',
      icon: Clock
    },
    {
      label: 'High Priority',
      value: supportStats.high_priority_tickets || 0,
      color: 'bg-red-500',
      icon: AlertTriangle
    },
    {
      label: 'Resolved',
      value: supportStats.resolved_tickets || 0,
      color: 'bg-green-500',
      icon: CheckCircle
    }
  ];

  const avgResponseTime = supportStats.avg_first_response_hours 
    ? `${Math.round(supportStats.avg_first_response_hours)}h` 
    : 'N/A';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <HelpCircle className="w-5 h-5 mr-2 text-[#BC8BBC]" />
        Support Overview
      </h3>

      {/* Ticket Status Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {ticketStatus.map((status, index) => (
          <div key={index} className="bg-gray-750 rounded-lg p-4 text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${status.color} mb-2`}>
              <status.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-white font-bold text-lg">{status.value}</div>
            <div className="text-gray-400 text-sm">{status.label}</div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-750 rounded">
          <span className="text-gray-300">Total Tickets</span>
          <span className="text-white font-bold">{supportStats.total_tickets || 0}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-750 rounded">
          <span className="text-gray-300">Avg. Response Time</span>
          <span className="text-white font-bold">{avgResponseTime}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-750 rounded">
          <span className="text-gray-300">Open Tickets</span>
          <span className="text-white font-bold">{supportStats.open_tickets || 0}</span>
        </div>
      </div>

      {/* Urgent Notice */}
      {(supportStats.high_priority_tickets > 0 || supportStats.new_tickets > 10) && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-red-300 text-sm">
              {supportStats.high_priority_tickets > 0 
                ? `${supportStats.high_priority_tickets} high priority tickets need attention`
                : 'High volume of new tickets'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}