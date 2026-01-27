import React, { useState, useEffect } from "react";
import { 
  X, Monitor, Download, Users, Zap, Crown, Star, 
  Edit3, Eye, EyeOff, ToggleLeft, ToggleRight, CheckCircle,
  AlertCircle, Save, RotateCcw, CreditCard, Tag, 
  Globe, Video, Shield, Calendar, Smartphone, Tv
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../api/axios";

export default function PlanDetailsModal({ plan, onClose, onPlanUpdated }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(plan);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize form data based on ACTUAL database schema
  const [formData, setFormData] = useState({
    // Basic Information (from your subscriptions table)
    name: plan.name || "",
    type: plan.type || "free",
    tagline: plan.tagline || "",
    description: plan.description || "",
    
    // Pricing (from your subscriptions table)
    price: plan.price || 0,
    original_price: plan.original_price || plan.price || 0,
    currency: plan.currency || "RWF",
    
    // Device and Session Limits (from your subscriptions table)
    max_sessions: plan.max_sessions || 1,
    max_devices_registered: plan.max_devices_registered || 10,
    
    // Content Features (from your subscriptions table)
    video_quality: plan.video_quality || "SD",
    max_video_bitrate: plan.max_video_bitrate || 2000,
    hdr_support: plan.hdr_support || false,
    
    offline_downloads: plan.offline_downloads || false,
    max_downloads: plan.max_downloads || 0,
    download_quality: plan.download_quality || "SD",
    download_expiry_days: plan.download_expiry_days || 30,
    simultaneous_downloads: plan.simultaneous_downloads || 1,
    
    // Premium Features (from your subscriptions table)
    early_access: plan.early_access || false,
    exclusive_content: plan.exclusive_content || false,
    parental_controls: plan.parental_controls || false,
    
    // Family Plan specific (from your subscriptions table - it exists!)
    is_family_plan: plan.is_family_plan || false,
    max_family_members: plan.max_family_members || 0,
    
    // User limits (from your subscriptions table)
    max_profiles: plan.max_profiles || 1,
    
    // JSON fields - MUST be arrays
    devices_allowed: Array.isArray(plan.devices_allowed) ? plan.devices_allowed : 
                    (typeof plan.devices_allowed === 'string' ? JSON.parse(plan.devices_allowed || '[]') : []),
    
    supported_platforms: Array.isArray(plan.supported_platforms) ? plan.supported_platforms : 
                        (typeof plan.supported_platforms === 'string' ? JSON.parse(plan.supported_platforms || '[]') : []),
    
    content_restrictions: Array.isArray(plan.content_restrictions) ? plan.content_restrictions : 
                         (typeof plan.content_restrictions === 'string' ? JSON.parse(plan.content_restrictions || '[]') : []),
    
    // Display Settings (from your subscriptions table)
    display_order: plan.display_order || 0,
    is_popular: plan.is_popular || false,
    is_featured: plan.is_featured || false,
    
    // Status (from your subscriptions table)
    is_active: plan.is_active !== undefined ? plan.is_active : true,
    is_visible: plan.is_visible !== undefined ? plan.is_visible : true
  });

  // Available options based on your database ENUMs and typical values
  const planTypes = ['free', 'mobile', 'basic', 'standard', 'family', 'custom'];
  const videoQualities = ['SD', 'HD', 'FHD', 'UHD'];
  const devices = ['mobile', 'tablet', 'desktop', 'smarttv', 'gaming'];
  const platforms = ['web', 'mobile', 'tablet', 'smarttv', 'gaming'];
  const contentTypes = ['premium', 'exclusive'];

  useEffect(() => {
    setIsVisible(true);
    setCurrentPlan(plan);
    
    // Re-initialize form data when plan changes
    setFormData({
      name: plan.name || "",
      type: plan.type || "free",
      tagline: plan.tagline || "",
      description: plan.description || "",
      price: plan.price || 0,
      original_price: plan.original_price || plan.price || 0,
      currency: plan.currency || "RWF",
      max_sessions: plan.max_sessions || 1,
      max_devices_registered: plan.max_devices_registered || 10,
      video_quality: plan.video_quality || "SD",
      max_video_bitrate: plan.max_video_bitrate || 2000,
      hdr_support: plan.hdr_support || false,
      offline_downloads: plan.offline_downloads || false,
      max_downloads: plan.max_downloads || 0,
      download_quality: plan.download_quality || "SD",
      download_expiry_days: plan.download_expiry_days || 30,
      simultaneous_downloads: plan.simultaneous_downloads || 1,
      early_access: plan.early_access || false,
      exclusive_content: plan.exclusive_content || false,
      parental_controls: plan.parental_controls || false,
      is_family_plan: plan.is_family_plan || false,
      max_family_members: plan.max_family_members || 0,
      max_profiles: plan.max_profiles || 1,
      devices_allowed: Array.isArray(plan.devices_allowed) ? plan.devices_allowed : 
                      (typeof plan.devices_allowed === 'string' ? JSON.parse(plan.devices_allowed || '[]') : []),
      supported_platforms: Array.isArray(plan.supported_platforms) ? plan.supported_platforms : 
                          (typeof plan.supported_platforms === 'string' ? JSON.parse(plan.supported_platforms || '[]') : []),
      content_restrictions: Array.isArray(plan.content_restrictions) ? plan.content_restrictions : 
                           (typeof plan.content_restrictions === 'string' ? JSON.parse(plan.content_restrictions || '[]') : []),
      display_order: plan.display_order || 0,
      is_popular: plan.is_popular || false,
      is_featured: plan.is_featured || false,
      is_active: plan.is_active !== undefined ? plan.is_active : true,
      is_visible: plan.is_visible !== undefined ? plan.is_visible : true
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

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => {
      const currentArray = Array.isArray(prev[field]) ? prev[field] : [];
      let newArray;
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const handleBooleanChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Prepare data for backend - convert arrays to JSON strings
      const updateData = {
        ...formData,
        devices_allowed: JSON.stringify(formData.devices_allowed),
        supported_platforms: JSON.stringify(formData.supported_platforms),
        content_restrictions: JSON.stringify(formData.content_restrictions)
      };
      
      const response = await api.put(`/admin/subscriptions/${plan.id}`, updateData);
      
      if (response.data.success) {
        // Update local state with the new data
        const updatedPlan = { 
          ...currentPlan, 
          ...formData,
          // Keep arrays as arrays for frontend display
          devices_allowed: formData.devices_allowed,
          supported_platforms: formData.supported_platforms,
          content_restrictions: formData.content_restrictions
        };
        setCurrentPlan(updatedPlan);
        setIsEditing(false);
        onPlanUpdated(updatedPlan);
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Failed to update plan. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to current plan values
    setFormData({
      name: currentPlan.name || "",
      type: currentPlan.type || "free",
      tagline: currentPlan.tagline || "",
      description: currentPlan.description || "",
      price: currentPlan.price || 0,
      original_price: currentPlan.original_price || currentPlan.price || 0,
      currency: currentPlan.currency || "RWF",
      max_sessions: currentPlan.max_sessions || 1,
      max_devices_registered: currentPlan.max_devices_registered || 10,
      video_quality: currentPlan.video_quality || "SD",
      max_video_bitrate: currentPlan.max_video_bitrate || 2000,
      hdr_support: currentPlan.hdr_support || false,
      offline_downloads: currentPlan.offline_downloads || false,
      max_downloads: currentPlan.max_downloads || 0,
      download_quality: currentPlan.download_quality || "SD",
      download_expiry_days: currentPlan.download_expiry_days || 30,
      simultaneous_downloads: currentPlan.simultaneous_downloads || 1,
      early_access: currentPlan.early_access || false,
      exclusive_content: currentPlan.exclusive_content || false,
      parental_controls: currentPlan.parental_controls || false,
      is_family_plan: currentPlan.is_family_plan || false,
      max_family_members: currentPlan.max_family_members || 0,
      max_profiles: currentPlan.max_profiles || 1,
      devices_allowed: Array.isArray(currentPlan.devices_allowed) ? currentPlan.devices_allowed : 
                      (typeof currentPlan.devices_allowed === 'string' ? JSON.parse(currentPlan.devices_allowed || '[]') : []),
      supported_platforms: Array.isArray(currentPlan.supported_platforms) ? currentPlan.supported_platforms : 
                          (typeof currentPlan.supported_platforms === 'string' ? JSON.parse(currentPlan.supported_platforms || '[]') : []),
      content_restrictions: Array.isArray(currentPlan.content_restrictions) ? currentPlan.content_restrictions : 
                           (typeof currentPlan.content_restrictions === 'string' ? JSON.parse(currentPlan.content_restrictions || '[]') : []),
      display_order: currentPlan.display_order || 0,
      is_popular: currentPlan.is_popular || false,
      is_featured: currentPlan.is_featured || false,
      is_active: currentPlan.is_active !== undefined ? currentPlan.is_active : true,
      is_visible: currentPlan.is_visible !== undefined ? currentPlan.is_visible : true
    });
  };

  const getPlanIcon = (planName) => {
    const name = (planName || "").toLowerCase();
    if (name.includes('basic') || name.includes('standard')) return Monitor;
    if (name.includes('premium') || name.includes('pro')) return Zap;
    if (name.includes('family')) return Users;
    if (name.includes('ultimate') || name.includes('enterprise')) return Crown;
    if (name.includes('free')) return CreditCard;
    return CreditCard;
  };

  const PlanIcon = getPlanIcon(currentPlan.name);

  if (!isVisible) return null;

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 overflow-y-auto",
        isVisible ? "bg-black/60" : "bg-transparent", 
        isClosing ? "bg-black/0" : ""
      )}
      onClick={handleBackdropClick}
    >
      <div 
        className={clsx(
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-4xl shadow-2xl transform transition-all duration-300 overflow-hidden",
          isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className={clsx(
              "p-3 rounded-xl",
              currentPlan.is_popular 
                ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600' 
                : 'bg-gray-100 dark:bg-gray-700'
            )}>
              <PlanIcon className={currentPlan.is_popular ? "text-white" : "text-gray-600 dark:text-gray-400"} size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentPlan.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{currentPlan.type ? currentPlan.type.charAt(0).toUpperCase() + currentPlan.type.slice(1) : ''} Plan</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Cancel"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="p-2 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors"
                  title="Save Changes"
                >
                  <Save size={20} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Edit Plan"
              >
                <Edit3 size={20} />
              </button>
            )}
            <button 
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag size={20} />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">{currentPlan.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan Type
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    >
                      {planTypes.map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium capitalize">{currentPlan.type}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tagline
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">{currentPlan.tagline || "No tagline"}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent resize-none"
                    />
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentPlan.description || "No description provided."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Pricing */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tag size={20} />
                Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Price (RWF)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      FRw {currentPlan.price.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Original Price (RWF)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.original_price || ''}
                      onChange={(e) => handleInputChange('original_price', parseInt(e.target.value) || currentPlan.price)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {currentPlan.original_price ? `FRw ${currentPlan.original_price.toLocaleString()}` : `FRw ${currentPlan.price.toLocaleString()}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      maxLength={3}
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.currency}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Device & Session Limits */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Smartphone size={20} />
                Device & Session Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Simultaneous Sessions
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.max_sessions}
                      onChange={(e) => handleInputChange('max_sessions', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.max_sessions}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Registered Devices
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.max_devices_registered}
                      onChange={(e) => handleInputChange('max_devices_registered', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.max_devices_registered}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max User Profiles
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.max_profiles}
                      onChange={(e) => handleInputChange('max_profiles', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.max_profiles}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Devices
                </label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {devices.map(device => (
                      <label key={device} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.devices_allowed.includes(device)}
                          onChange={(e) => handleArrayChange('devices_allowed', device, e.target.checked)}
                          className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{device}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(currentPlan.devices_allowed) && currentPlan.devices_allowed.length > 0 ? (
                      currentPlan.devices_allowed.map(device => (
                        <span key={device} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm capitalize">
                          {device}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">No devices specified</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Content Features */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Video size={20} />
                Content Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {videoQualities.map(quality => (
                        <option key={quality} value={quality}>{quality}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.video_quality}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Downloads
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.max_downloads === -1 ? '' : formData.max_downloads}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange('max_downloads', value === '' ? -1 : parseInt(value))
                        }}
                        placeholder="-1 for unlimited"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                      />
                      {formData.max_downloads === -1 && (
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">Unlimited</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {currentPlan.max_downloads === -1 ? 'Unlimited' : currentPlan.max_downloads}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Simultaneous Downloads
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.simultaneous_downloads}
                      onChange={(e) => handleInputChange('simultaneous_downloads', parseInt(e.target.value) || 1)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.simultaneous_downloads}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Video Bitrate (kbps)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.max_video_bitrate}
                      onChange={(e) => handleInputChange('max_video_bitrate', parseInt(e.target.value) || 2000)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.max_video_bitrate} kbps</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Download Quality
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.download_quality}
                      onChange={(e) => handleInputChange('download_quality', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    >
                      {videoQualities.map(quality => (
                        <option key={quality} value={quality}>{quality}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.download_quality}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Download Expiry (Days)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.download_expiry_days}
                      onChange={(e) => handleInputChange('download_expiry_days', parseInt(e.target.value) || 30)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.download_expiry_days} days</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Premium Features */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Crown size={20} />
                Premium Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.offline_downloads}
                        onChange={(e) => handleBooleanChange('offline_downloads', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Offline Downloads</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.offline_downloads ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Offline Downloads</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.hdr_support}
                        onChange={(e) => handleBooleanChange('hdr_support', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">HDR Support</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.hdr_support ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">HDR Support</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.early_access}
                        onChange={(e) => handleBooleanChange('early_access', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Early Access</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.early_access ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Early Access</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.exclusive_content}
                        onChange={(e) => handleBooleanChange('exclusive_content', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Exclusive Content</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.exclusive_content ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Exclusive Content</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.parental_controls}
                        onChange={(e) => handleBooleanChange('parental_controls', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Parental Controls</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.parental_controls ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Parental Controls</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_family_plan}
                        onChange={(e) => handleBooleanChange('is_family_plan', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Family Plan</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.is_family_plan ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Family Plan</span>
                    </div>
                  )}
                </div>
              </div>
              
              {formData.is_family_plan && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Family Members
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.max_family_members}
                      onChange={(e) => handleInputChange('max_family_members', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.max_family_members}</p>
                  )}
                </div>
              )}
            </div>

            {/* Section 6: Content Restrictions & Platforms */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield size={20} />
                Content Restrictions & Platforms
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supported Platforms
                </label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {platforms.map(platform => (
                      <label key={platform} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.supported_platforms.includes(platform)}
                          onChange={(e) => handleArrayChange('supported_platforms', platform, e.target.checked)}
                          className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{platform}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(currentPlan.supported_platforms) && currentPlan.supported_platforms.length > 0 ? (
                      currentPlan.supported_platforms.map(platform => (
                        <span key={platform} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm capitalize">
                          {platform}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">No platforms specified</span>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Restrictions
                </label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {contentTypes.map(type => (
                      <label key={type} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.content_restrictions.includes(type)}
                          onChange={(e) => handleArrayChange('content_restrictions', type, e.target.checked)}
                          className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(currentPlan.content_restrictions) && currentPlan.content_restrictions.length > 0 ? (
                      currentPlan.content_restrictions.map(type => (
                        <span key={type} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm capitalize">
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">No content restrictions</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 7: Display Settings */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Tv size={20} />
                Display Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Order
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{currentPlan.display_order}</p>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_popular}
                        onChange={(e) => handleBooleanChange('is_popular', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Popular Plan</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.is_popular ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Popular Plan</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => handleBooleanChange('is_featured', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Featured Plan</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.is_featured ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Featured Plan</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 8: Status */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe size={20} />
                Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleBooleanChange('is_active', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.is_active ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Active</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {isEditing ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_visible}
                        onChange={(e) => handleBooleanChange('is_visible', e.target.checked)}
                        className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Visible to Users</span>
                    </label>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className={currentPlan.is_visible ? "text-green-500" : "text-gray-400"} size={20} />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Visible to Users</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Plan ID: {currentPlan.id}</span>
            <span>•</span>
            <span>Type: <span className="font-medium capitalize">{currentPlan.type}</span></span>
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