import React from "react";

export default function SubscriptionInfo({ user }) {
  return (
    <div className="space-y-4 max-w-md">
      <p className="text-gray-400">Current Plan</p>
      <div className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white">
        {user.subscription_plan || "No active subscription"}
      </div>
      {/* Optionally show expiry, devices allowed, or other features */}
      <p className="text-gray-400 text-sm mt-2">
        Subscription features and limits will appear here.
      </p>
    </div>
  );
}
