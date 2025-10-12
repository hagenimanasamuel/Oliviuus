import React, { useState } from "react";
import SubscriptionPlans from "./SubscriptionPlans";
import PlanSeeder from "./PlanSeeder";
import SubscriptionAnalytics from "./SubscriptionAnalytics";

export default function SubscriptionsNavTabs() {
  const [activeTab, setActiveTab] = useState("plans");

  const tabs = [
    { id: "plans", label: "Manage Plans", component: <SubscriptionPlans /> },
    { id: "seeder", label: "Initialize Plans", component: <PlanSeeder /> },
    { id: "analytics", label: "Analytics", component: <SubscriptionAnalytics /> }
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-[#BC8BBC] text-[#BC8BBC]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}