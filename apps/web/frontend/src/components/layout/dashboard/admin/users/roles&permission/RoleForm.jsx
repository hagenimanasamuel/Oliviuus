import React, { useState, useEffect } from "react";
import axios from "../../../../../../api/axios";
import { navItems } from "../../Sidebar/NavItems.jsx";
import { useTranslation } from "react-i18next";
import { 
  X, 
  Save, 
  Shield, 
  Users, 
  Settings, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Edit2,
  Plus
} from "lucide-react";

export default function RoleForm({ onClose, onSave, role }) {
  const { t } = useTranslation();
  const [roleCode, setRoleCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    features: true
  });

  useEffect(() => {
    if (role) {
      // Editing existing role
      setRoleCode(role.role_code || "");
      setName(role.role_name || "");
      setDescription(role.description || "");
      setFeatures(role.features || []);
    } else {
      // Creating new role
      setRoleCode("");
      setName("");
      setDescription("");
      setFeatures([]);
    }
    setIsVisible(true);
    setIsClosing(false);
  }, [role]);

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFeature = (featurePath) => {
    setFeatures((prev) =>
      prev.includes(featurePath)
        ? prev.filter((f) => f !== featurePath)
        : [...prev, featurePath]
    );
  };

  const toggleAllFeatures = () => {
    if (features.length === navItems.length) {
      setFeatures([]);
    } else {
      setFeatures(navItems.map(item => item.path));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "", message: "" });

    if (!roleCode.trim() || !name.trim() || features.length === 0) {
      return setAlert({
        type: "error",
        message: "Please fill all required fields and select at least one feature.",
      });
    }

    try {
      const roleData = { 
        role_code: roleCode.trim().toLowerCase(), 
        role_name: name.trim(), 
        description: description.trim(), 
        features 
      };

      if (role?.id) {
        // Update existing role
        await axios.put(`/roles/${role.id}`, roleData);
        setAlert({ type: "success", message: "Role updated successfully!" });
      } else {
        // Create new role
        await axios.post("/roles", roleData);
        setAlert({ type: "success", message: "Role created successfully!" });
      }

      setTimeout(() => {
        if (onSave) onSave();
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Error saving role:", err);
      setAlert({
        type: "error",
        message: err.response?.data?.message || "Server error. Please try again.",
      });
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'bg-black/60' : 'bg-transparent'
      } ${isClosing ? 'bg-black/0' : ''}`}
      onClick={handleBackdropClick}
    >
      {/* Modal */}
      <div 
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BC8BBC] bg-opacity-10 rounded-lg">
              <Shield className="w-6 h-6 text-[#BC8BBC]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {role ? 'Edit Role' : 'Create New Role'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {role ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="p-6">
            {/* Alert */}
            {alert.message && (
              <div
                className={`mb-6 px-4 py-3 rounded-lg border ${
                  alert.type === "error"
                    ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    : "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                }`}
              >
                {alert.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('basic')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-[#BC8BBC]" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                  </div>
                  {expandedSections.basic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedSections.basic && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Role Code *
                        </label>
                        <input
                          type="text"
                          value={roleCode}
                          onChange={(e) => setRoleCode(e.target.value)}
                          placeholder="e.g., admin, moderator, viewer"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all"
                          required
                          disabled={!!role} // Disable role code editing for existing roles
                        />
                        {role && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Role code cannot be changed for existing roles
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Role Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Administrator, Moderator"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the role's purpose and responsibilities..."
                        rows="3"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Features Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('features')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[#BC8BBC]" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Features & Permissions</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {features.length} of {navItems.length} features selected
                      </p>
                    </div>
                  </div>
                  {expandedSections.features ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {expandedSections.features && (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Select features this role can access
                      </span>
                      <button
                        type="button"
                        onClick={toggleAllFeatures}
                        className="text-sm text-[#BC8BBC] hover:text-[#9b69b2] font-medium"
                      >
                        {features.length === navItems.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2 bg-white dark:bg-gray-700">
                      {navItems.map((item) => (
                        <div
                          key={item.path}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            features.includes(item.path)
                              ? 'bg-[#BC8BBC] bg-opacity-10 border border-[#BC8BBC] border-opacity-30'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600 border border-transparent'
                          }`}
                          onClick={() => toggleFeature(item.path)}
                        >
                          {/* Hidden checkbox for accessibility */}
                          <input
                            type="checkbox"
                            checked={features.includes(item.path)}
                            onChange={() => toggleFeature(item.path)}
                            className="sr-only"
                            aria-label={`Select ${t(item.labelKey)} feature`}
                          />
                          {/* Custom checkbox */}
                          <div className={`flex items-center justify-center w-5 h-5 border-2 rounded ${
                            features.includes(item.path)
                              ? 'bg-[#BC8BBC] border-[#BC8BBC]'
                              : 'border-gray-300 dark:border-gray-500'
                          }`}>
                            {features.includes(item.path) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-300 flex-1">
                            {t(item.labelKey)}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            features.includes(item.path) ? 'bg-[#BC8BBC]' : 'bg-gray-300 dark:bg-gray-500'
                          }`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
          >
            {role ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {role ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}