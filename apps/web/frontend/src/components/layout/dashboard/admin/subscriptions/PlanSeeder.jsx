import React, { useState } from "react";
import { Database, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";
import api from "../../../../../api/axios";

export default function PlanSeeder() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  const seedPlans = async () => {
    try {
      setLoading(true);
      setMessage("");
      const response = await api.post("/admin/subscriptions/seed");
      
      if (response.data.success) {
        setMessageType("success");
        setMessage("Subscription plans seeded successfully!");
      } else {
        setMessageType("error");
        setMessage(response.data.message || "Failed to seed plans");
      }
    } catch (err) {
      console.error("Error seeding plans:", err);
      setMessageType("error");
      setMessage("Failed to seed subscription plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPlans = async () => {
    if (!window.confirm("Are you sure you want to reset all subscription plans? This will delete all existing plans and recreate the default ones.")) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const response = await api.post("/admin/subscriptions/reset");
      
      if (response.data.success) {
        setMessageType("success");
        setMessage("Subscription plans reset successfully!");
      } else {
        setMessageType("error");
        setMessage(response.data.message || "Failed to reset plans");
      }
    } catch (err) {
      console.error("Error resetting plans:", err);
      setMessageType("error");
      setMessage("Failed to reset subscription plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Database className="w-6 h-6 text-[#BC8BBC] mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Initialize Subscription Plans
          </h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Use this tool to initialize or reset the default subscription plans for your streaming service. 
          This will create the Mobile, Basic, Standard, and Family plans with their default configurations.
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            messageType === "success" 
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}>
            {messageType === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
            )}
            <span className={messageType === "success" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
              {message}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
              Default Plans Overview
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• <strong>Mobile Plan</strong> - FRw 3,000/month - 1 device, SD quality</li>
              <li>• <strong>Basic Plan</strong> - FRw 5,000/month - 2 devices, HD quality</li>
              <li>• <strong>Standard Plan</strong> - FRw 7,000/month - 3 devices, Full HD quality</li>
              <li>• <strong>Family Plan</strong> - FRw 10,000/month - 5 devices, 4K quality</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={seedPlans}
              disabled={loading}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#9b69b2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Database className="w-5 h-5 mr-2" />
              {loading ? "Seeding Plans..." : "Seed Default Plans"}
            </button>

            <button
              onClick={resetPlans}
              disabled={loading}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {loading ? "Resetting..." : "Reset All Plans"}
            </button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p><strong>Note:</strong> "Seed Default Plans" will only work if no plans exist. "Reset All Plans" will delete all existing plans and recreate the default ones.</p>
          </div>
        </div>
      </div>
    </div>
  );
}