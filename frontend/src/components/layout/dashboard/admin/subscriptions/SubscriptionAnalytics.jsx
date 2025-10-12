import React from "react";
import { Users, TrendingUp, DollarSign, Clock } from "lucide-react";

export default function SubscriptionAnalytics() {
  // Mock data - you would fetch this from your API
  const analyticsData = {
    totalSubscribers: 1250,
    monthlyRevenue: 8450000,
    popularPlan: "Standard Plan",
    averageRevenuePerUser: 6760
  };

  const stats = [
    {
      label: "Total Subscribers",
      value: analyticsData.totalSubscribers.toLocaleString(),
      icon: Users,
      color: "blue"
    },
    {
      label: "Monthly Revenue",
      value: `FRw ${analyticsData.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "green"
    },
    {
      label: "Most Popular Plan",
      value: analyticsData.popularPlan,
      icon: TrendingUp,
      color: "purple"
    },
    {
      label: "Avg Revenue Per User",
      value: `FRw ${analyticsData.averageRevenuePerUser.toLocaleString()}`,
      icon: Clock,
      color: "orange"
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      green: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
      orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Subscription Analytics
        </h3>
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Detailed analytics and charts will be displayed here.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Revenue trends, subscriber growth, and plan performance metrics coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}