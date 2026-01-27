import React from "react";
import SubscriptionsNavTabs from "../../../../components/layout/dashboard/admin/subscriptions/SubscriptionsNavTabs.jsx";

export default function Subscriptions() {
  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Subscription Plans Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and configure all subscription plans for Oliviuus.
          </p>
        </div>
        <SubscriptionsNavTabs />
      </div>
    </div>
  );
}