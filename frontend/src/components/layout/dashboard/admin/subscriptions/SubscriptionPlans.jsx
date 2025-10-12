import React, { useState, useEffect } from "react";
import { Edit3, ToggleLeft, ToggleRight, Eye, EyeOff, Star } from "lucide-react";
import api from "../../../../../api/axios";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/subscriptions");
      if (response.data.success) {
        setPlans(response.data.data);
      } else {
        setError("Failed to load subscription plans");
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      const response = await api.put(`/admin/subscriptions/${planId}`, {
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        setPlans(plans.map(plan => 
          plan.id === planId ? { ...plan, is_active: !currentStatus } : plan
        ));
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      setError("Failed to update plan status");
    }
  };

  const togglePlanVisibility = async (planId, currentVisibility) => {
    try {
      const response = await api.put(`/admin/subscriptions/${planId}`, {
        is_visible: !currentVisibility
      });
      
      if (response.data.success) {
        setPlans(plans.map(plan => 
          plan.id === planId ? { ...plan, is_visible: !currentVisibility } : plan
        ));
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      setError("Failed to update plan visibility");
    }
  };

  const setPopularPlan = async (planId) => {
    try {
      // First, remove popular flag from all plans
      await Promise.all(
        plans.map(plan => 
          api.put(`/admin/subscriptions/${plan.id}`, { is_popular: false })
        )
      );

      // Then set the selected plan as popular
      const response = await api.put(`/admin/subscriptions/${planId}`, {
        is_popular: true
      });
      
      if (response.data.success) {
        setPlans(plans.map(plan => 
          plan.id === planId 
            ? { ...plan, is_popular: true }
            : { ...plan, is_popular: false }
        ));
      }
    } catch (err) {
      console.error("Error setting popular plan:", err);
      setError("Failed to set popular plan");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 ${
              plan.is_popular ? 'border-[#BC8BBC]' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Plan Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                {plan.is_popular && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#BC8BBC] text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Popular
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {plan.tagline}
              </p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  FRw {plan.price.toLocaleString()}
                </span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  /month
                </span>
              </div>
            </div>

            {/* Plan Details */}
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Devices:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.max_sessions} simultaneous
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.video_quality}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Downloads:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.max_downloads === -1 ? 'Unlimited' : plan.max_downloads}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Profiles:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {plan.max_profiles}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setPopularPlan(plan.id)}
                  disabled={plan.is_popular}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
                    plan.is_popular
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {plan.is_popular ? 'Current Popular' : 'Set as Popular'}
                </button>

                <div className="flex space-x-2">
                  <button
                    onClick={() => togglePlanVisibility(plan.id, plan.is_visible)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
                      plan.is_visible
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {plan.is_visible ? (
                      <Eye className="w-4 h-4 mr-2" />
                    ) : (
                      <EyeOff className="w-4 h-4 mr-2" />
                    )}
                    {plan.is_visible ? 'Visible' : 'Hidden'}
                  </button>

                  <button
                    onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
                      plan.is_active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {plan.is_active ? (
                      <ToggleRight className="w-4 h-4 mr-2" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 mr-2" />
                    )}
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <button className="w-full flex items-center justify-center px-4 py-2 bg-[#BC8BBC] text-white rounded-md text-sm font-medium hover:bg-[#9b69b2] transition-colors">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}