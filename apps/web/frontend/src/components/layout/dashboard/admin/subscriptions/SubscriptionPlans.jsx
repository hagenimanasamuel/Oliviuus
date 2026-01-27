import React, { useState, useEffect } from "react";
import { 
  Edit3, ToggleLeft, ToggleRight, Eye, EyeOff, Star, 
  X, CheckCircle, AlertCircle, Plus, Search, Filter,
  Monitor, Download, Users, Crown, Zap, CreditCard,
  ChevronDown, ChevronUp
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../api/axios";

const PlanDetailsModal = React.lazy(() => import("./PlanDetailsModal"));

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

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

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handlePlanUpdated = (updatedPlan) => {
    setPlans(plans.map(plan => 
      plan.id === updatedPlan.id ? updatedPlan : plan
    ));
    handleCloseModal();
  };

  const toggleExpandPlan = (planId) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  // Filter plans based on search and filter criteria
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plan.tagline && plan.tagline.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === "all" ||
                         (filterStatus === "active" && plan.is_active) ||
                         (filterStatus === "inactive" && !plan.is_active) ||
                         (filterStatus === "popular" && plan.is_popular) ||
                         (filterStatus === "visible" && plan.is_visible) ||
                         (filterStatus === "hidden" && !plan.is_visible);
    
    return matchesSearch && matchesFilter;
  });

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('standard')) return Monitor;
    if (name.includes('premium') || name.includes('pro')) return Zap;
    if (name.includes('family')) return Users;
    if (name.includes('ultimate') || name.includes('enterprise')) return Crown;
    if (name.includes('free')) return CreditCard;
    return CreditCard;
  };

  const getPlanColor = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return 'from-blue-500 to-cyan-500';
    if (name.includes('standard')) return 'from-green-500 to-emerald-500';
    if (name.includes('premium') || name.includes('pro')) return 'from-purple-500 to-pink-500';
    if (name.includes('family')) return 'from-orange-500 to-red-500';
    if (name.includes('ultimate')) return 'from-yellow-500 to-orange-500';
    if (name.includes('free')) return 'from-gray-400 to-gray-600';
    return 'from-gray-500 to-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and configure all subscription plans from the database
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search plans by name, tagline, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="popular">Popular</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredPlans.map((plan) => {
          const PlanIcon = getPlanIcon(plan.name);
          const planColor = getPlanColor(plan.name);
          
          return (
            <div
              key={plan.id}
              className={clsx(
                "bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl",
                plan.is_popular 
                  ? 'border-[#BC8BBC] ring-2 ring-[#BC8BBC]/20' 
                  : 'border-gray-200 dark:border-gray-700',
                !plan.is_active && 'opacity-60'
              )}
            >
              {/* Plan Header with Gradient */}
              <div 
                className={clsx(
                  "p-6 rounded-t-xl text-white relative overflow-hidden cursor-pointer",
                  plan.is_popular ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600' : `bg-gradient-to-r ${planColor}`
                )}
                onClick={() => toggleExpandPlan(plan.id)}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <PlanIcon size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{plan.name}</h3>
                        <p className="text-white/80 text-sm">{plan.tagline}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {plan.is_popular && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                          <Star size={12} />
                          Popular
                        </span>
                      )}
                      <button className="text-white/80 hover:text-white">
                        {expandedPlanId === plan.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Free' : `FRw ${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && <span className="ml-2 text-white/80">/month</span>}
                  </div>
                  <div className="mt-2 text-sm text-white/80">
                    Type: <span className="font-semibold capitalize">{plan.type}</span>
                  </div>
                </div>
                
                {/* Background pattern */}
                <div className="absolute inset-0 bg-black/10"></div>
              </div>

              {/* Expanded Details */}
              {expandedPlanId === plan.id && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Max Sessions:</span>
                      <span className="font-semibold">{plan.max_sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Max Profiles:</span>
                      <span className="font-semibold">{plan.max_profiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Max Downloads:</span>
                      <span className="font-semibold">
                        {plan.max_downloads === -1 ? 'Unlimited' : plan.max_downloads}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Video Quality:</span>
                      <span className="font-semibold capitalize">{plan.video_quality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Simultaneous Downloads:</span>
                      <span className="font-semibold">{plan.simultaneous_downloads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Offline Downloads:</span>
                      <span className="font-semibold">{plan.offline_downloads ? 'Yes' : 'No'}</span>
                    </div>
                    {plan.devices_allowed && Array.isArray(plan.devices_allowed) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Devices:</span>
                        <span className="font-semibold">{plan.devices_allowed.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Features & Actions */}
              <div className="p-6 space-y-4">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={clsx(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    plan.is_active 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  )}>
                    {plan.is_active ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <span className={clsx(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    plan.is_visible 
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" 
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                  )}>
                    {plan.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    {plan.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                  
                  {plan.is_family_plan && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                      <Users size={12} />
                      Family Plan
                    </span>
                  )}
                  
                  {plan.is_featured && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                      <Star size={12} />
                      Featured
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => setPopularPlan(plan.id)}
                    disabled={plan.is_popular}
                    className={clsx(
                      "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      plan.is_popular
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <Star size={16} />
                    {plan.is_popular ? 'Current Popular' : 'Set as Popular'}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => togglePlanVisibility(plan.id, plan.is_visible)}
                      className={clsx(
                        "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        plan.is_visible
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {plan.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      {plan.is_visible ? 'Hide' : 'Show'}
                    </button>

                    <button
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      className={clsx(
                        "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        plan.is_active
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                          : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                      )}
                    >
                      {plan.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      {plan.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  <button 
                    onClick={() => handleEditPlan(plan)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg text-sm font-medium hover:bg-[#9b69b2] transition-all"
                  >
                    <Edit3 size={16} />
                    Edit Plan Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <CreditCard className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No plans found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No subscription plans have been created yet.'
            }
          </p>
        </div>
      )}

      {/* Plan Details Modal */}
      {isModalOpen && selectedPlan && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
          </div>
        }>
          <PlanDetailsModal
            plan={selectedPlan}
            onClose={handleCloseModal}
            onPlanUpdated={handlePlanUpdated}
          />
        </React.Suspense>
      )}
    </div>
  );
}