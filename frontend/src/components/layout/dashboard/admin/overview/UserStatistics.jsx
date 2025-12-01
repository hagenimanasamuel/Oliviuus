import React from 'react';
import { UserCheck, UserX, Users, Shield } from 'lucide-react';

export default function UserStatistics({ data }) {
  const userStats = data?.userStats || {};
  
  const stats = [
    {
      label: 'Verified Users',
      value: userStats.verified_users || 0,
      total: userStats.total_users || 0,
      percentage: userStats.total_users ? ((userStats.verified_users / userStats.total_users) * 100).toFixed(1) : 0,
      icon: UserCheck,
      color: 'text-green-500'
    },
    {
      label: 'Active Users',
      value: userStats.active_users || 0,
      total: userStats.total_users || 0,
      percentage: userStats.total_users ? ((userStats.active_users / userStats.total_users) * 100).toFixed(1) : 0,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      label: 'Admin Users',
      value: userStats.admin_users || 0,
      total: userStats.total_users || 0,
      percentage: userStats.total_users ? ((userStats.admin_users / userStats.total_users) * 100).toFixed(1) : 0,
      icon: Shield,
      color: 'text-purple-500'
    },
    {
      label: 'Subscribed Users',
      value: userStats.subscribed_users || 0,
      total: userStats.total_users || 0,
      percentage: userStats.total_users ? ((userStats.subscribed_users / userStats.total_users) * 100).toFixed(1) : 0,
      icon: UserCheck,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-[#BC8BBC]" />
        User Statistics
      </h3>
      
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={stat.color}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white font-medium">{stat.label}</div>
                <div className="text-gray-400 text-sm">
                  {stat.value} of {stat.total} users
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">{stat.percentage}%</div>
              <div className="w-20 bg-gray-600 rounded-full h-2 mt-1">
                <div 
                  className="bg-[#BC8BBC] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-center text-gray-400 text-sm">
          {userStats.new_users_30d || 0} new users in last 30 days
        </div>
      </div>
    </div>
  );
}