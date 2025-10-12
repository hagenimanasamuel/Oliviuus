// src/components/dashboard/admin/Users/UserModalTabs/SubscriptionTab.jsx
import React from "react";
import { CreditCard, Calendar, CheckCircle } from "lucide-react";
import clsx from "clsx";

const SubscriptionTab = ({ userDetails }) => {
  const getSubscriptionConfig = (status) => {
    switch (status) {
      case "premium": return { label: "Premium", color: "text-purple-400", bg: "bg-purple-400/10", badge: "✨" };
      case "pro": return { label: "Professional", color: "text-blue-400", bg: "bg-blue-400/10", badge: "⚡" };
      case "enterprise": return { label: "Enterprise", color: "text-green-400", bg: "bg-green-400/10", badge: "🏢" };
      default: return { label: "Free", color: "text-gray-400", bg: "bg-gray-400/10", badge: "🔓" };
    }
  };

  const subscriptionConfig = getSubscriptionConfig(userDetails.subscriptionStatus);

  return (
    <div className="space-y-4">
      <div className={clsx("p-4 rounded-xl border", subscriptionConfig.bg, subscriptionConfig.color.replace('text-', 'border-'))}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{subscriptionConfig.label} Plan</h3>
            <p className="text-gray-400">Active since {new Date(userDetails.subscriptionSince).toLocaleDateString()}</p>
          </div>
          <div className="text-2xl">{subscriptionConfig.badge}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <CreditCard className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-white font-semibold">$29.99</div>
          <div className="text-gray-400 text-sm">Monthly</div>
        </div>
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-white font-semibold">12 Months</div>
          <div className="text-gray-400 text-sm">Billing Cycle</div>
        </div>
        <div className="text-center p-4 bg-gray-800/50 rounded-lg">
          <CheckCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-white font-semibold">Auto-renew</div>
          <div className="text-gray-400 text-sm">Enabled</div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;