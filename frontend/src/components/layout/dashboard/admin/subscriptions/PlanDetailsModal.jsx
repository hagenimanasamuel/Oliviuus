import React, { useState, useEffect, useRef } from "react";
import { 
  X, Monitor, Download, Users, Zap, Crown, Star, 
  Edit3, Eye, EyeOff, ToggleLeft, ToggleRight, CheckCircle,
  AlertCircle, Save, RotateCcw, CreditCard
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../api/axios";

export default function PlanDetailsModal({ plan, onClose, onPlanUpdated }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(plan);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: plan.name,
    tagline: plan.tagline,
    price: plan.price,
    max_sessions: plan.max_sessions,
    max_downloads: plan.max_downloads,
    max_profiles: plan.max_profiles,
    video_quality: plan.video_quality,
    description: plan.description || ""
  });

  useEffect(() => {
    setIsVisible(true);
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      tagline: plan.tagline,
      price: plan.price,
      max_sessions: plan.max_sessions,
      max_downloads: plan.max_downloads,
      max_profiles: plan.max_profiles,
      video_quality: plan.video_quality,
      description: plan.description || ""
    });
  }, [plan]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.put(`/admin/subscriptions/${plan.id}`, formData);
      
      if (response.data.success) {
        const updatedPlan = { ...currentPlan, ...formData };
        setCurrentPlan(updatedPlan);
        setIsEditing(false);
        onPlanUpdated(updatedPlan);
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Failed to update plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: currentPlan.name,
      tagline: currentPlan.tagline,
      price: currentPlan.price,
      max_sessions: currentPlan.max_sessions,
      max_downloads: currentPlan.max_downloads,
      max_profiles: currentPlan.max_profiles,
      video_quality: currentPlan.video_quality,
      description: currentPlan.description || ""
    });
  };

  const getPlanIcon = (planName) => {
    const name = planName.toLowerCase();
    if (name.includes('basic') || name.includes('standard')) return Monitor;
    if (name.includes('premium') || name.includes('pro')) return Zap;
    if (name.includes('family')) return Users;
    if (name.includes('ultimate') || name.includes('enterprise')) return Crown;
    return CreditCard;
  };

  const PlanIcon = getPlanIcon(currentPlan.name);

  if (!isVisible) return null;

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isVisible ? "bg-black/60" : "bg-transparent", 
        isClosing ? "bg-black/0" : ""
      )}
      onClick={handleBackdropClick}
    >
      <div 
        className={clsx(
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl transform transition-all duration-300 overflow-hidden flex flex-col",
          isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className={clsx(
              "p-3 rounded-xl",
              currentPlan.is_popular 
                ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600' 
                : 'bg-gray-100 dark:bg-gray-800'
            )}>
              <PlanIcon className={currentPlan.is_popular ? "text-white" : "text-gray-600 dark:text-gray-400"} size={24} />
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-xl font-bold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-[#BC8BBC] text-gray-900 dark:text-white"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentPlan.name}</h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-[#BC8BBC] text-gray-600 dark:text-gray-400 mt-1"
                  placeholder="Plan tagline"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400">{currentPlan.tagline}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="p-2 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors"
                >
                  <Save size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Edit3 size={20} />
              </button>
            )}
            <button 
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Price
                    </label>
                    {isEditing ? (
                      <div className="flex items-center">
                        <span className="text-gray-500 dark:text-gray-400 mr-2">FRw</span>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                        />
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        FRw {currentPlan.price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Simultaneous Devices
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.max_sessions}
                        onChange={(e) => handleInputChange('max_sessions', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{currentPlan.max_sessions}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Profiles
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.max_profiles}
                        onChange={(e) => handleInputChange('max_profiles', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{currentPlan.max_profiles}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Status */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Video Quality
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.video_quality}
                        onChange={(e) => handleInputChange('video_quality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      >
                        <option value="sd">SD</option>
                        <option value="hd">HD</option>
                        <option value="fullhd">Full HD</option>
                        <option value="ultrahd">Ultra HD</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white capitalize">{currentPlan.video_quality}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Downloads
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.max_downloads === -1 ? '' : formData.max_downloads}
                        onChange={(e) => handleInputChange('max_downloads', e.target.value === '' ? -1 : parseInt(e.target.value))}
                        placeholder="Leave empty for unlimited"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">
                        {currentPlan.max_downloads === -1 ? 'Unlimited' : currentPlan.max_downloads}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Active Status</span>
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      currentPlan.is_active 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}>
                      {currentPlan.is_active ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {currentPlan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Visibility</span>
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      currentPlan.is_visible 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" 
                        : "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400"
                    )}>
                      {currentPlan.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {currentPlan.is_visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  {currentPlan.is_popular && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Popular Plan</span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#BC8BBC]/20 text-[#BC8BBC] rounded-full text-xs font-medium">
                        <Star size={12} />
                        Popular
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
                placeholder="Plan description..."
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                {currentPlan.description || "No description provided."}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Plan ID: {currentPlan.id}</span>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
            
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}