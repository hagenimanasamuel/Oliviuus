// src/pages/dashboard/users/UserForm.jsx
import React, { useState, useEffect } from "react";
import axios from "../../../../../api/axios";
import { X, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function UserForm({ onClose, onSave }) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: "",
    role: "viewer",
    sendInvitation: true,
    language: "rw"
  });
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setIsClosing(false);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) return t("userForm.alerts.emailRequired");
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return t("userForm.alerts.emailInvalid");
    if (!formData.role) return t("userForm.alerts.roleRequired");
    if (!formData.language) return t("userForm.alerts.languageRequired");
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    const validationError = validateForm();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        language: formData.language
      };

      const res = await axios.post("/auth/create-user", payload);

      setAlert({
        type: "success",
        message: formData.sendInvitation
          ? t("userForm.alerts.successInvitation")
          : t("userForm.alerts.successManual")
      });

      setTimeout(() => {
        if (onSave) onSave(res.data.user);
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Error creating user:", err);
      setAlert({
        type: "error",
        message: err.response?.data?.error || t("userForm.alerts.failed")
      });
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = [
    { role_code: "admin", role_name: t("userForm.roles.admin") },
    { role_code: "viewer", role_name: t("userForm.roles.viewer") }
  ];

  const languages = [
    { code: "en", name: t("userForm.languages.en") },
    { code: "rw", name: t("userForm.languages.rw") },
    { code: "fr", name: t("userForm.languages.fr") },
    { code: "sw", name: t("userForm.languages.sw") }
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 transition-all duration-300 ${isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'} ${isClosing ? 'bg-black/0' : ''}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-2 sm:mx-0 max-h-[90vh] overflow-hidden relative transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3">
            <div className="p-1.5 sm:p-2 lg:p-2 bg-[#BC8BBC] bg-opacity-10 rounded-lg">
              <Send className="w-4 h-4 sm:w-6 sm:h-6 lg:w-6 lg:h-6 text-[#BC8BBC]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl lg:text-xl font-bold text-gray-900 dark:text-white">{t("userForm.title")}</h2>
              <p className="text-xs sm:text-sm lg:text-sm text-gray-500 dark:text-gray-400">{t("userForm.subtitle")}</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 sm:p-2 lg:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 lg:p-6 space-y-4 lg:space-y-5">
          {alert.message && (
            <div className={`mb-4 sm:mb-6 lg:mb-6 px-3 py-2 sm:px-4 sm:py-3 lg:px-4 lg:py-3 rounded-lg border text-sm transition-all duration-300 ${alert.type === "error" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300" : "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"}`}>
              {alert.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-6">
            {/* Email */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 lg:p-4 transition-colors duration-200">
              <label className="block text-xs sm:text-sm lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("userForm.fields.email")} *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2.5 text-sm sm:text-base lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>

            {/* Role */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 lg:p-4 transition-colors duration-200">
              <label className="block text-xs sm:text-sm lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("userForm.fields.role")} *</label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2.5 text-sm sm:text-base lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                {availableRoles.map(role => (
                  <option key={role.role_code} value={role.role_code}>{role.role_name}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 lg:p-4 transition-colors duration-200">
              <label className="block text-xs sm:text-sm lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("userForm.fields.language")} *</label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2.5 text-sm sm:text-base lg:text-base border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent transition-all duration-200 cursor-pointer"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* Send Invitation */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 p-2 sm:p-3 lg:p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200">
              <input
                type="checkbox"
                checked={formData.sendInvitation}
                onChange={(e) => handleInputChange('sendInvitation', e.target.checked)}
                className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-[#BC8BBC] border-gray-300 rounded focus:ring-[#BC8BBC] transition-colors duration-200 cursor-pointer"
              />
              <label className="text-xs sm:text-sm lg:text-sm font-medium text-gray-900 dark:text-white flex-1 cursor-pointer">{t("userForm.fields.sendInvitation")}</label>
              <Send className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-gray-400 flex-shrink-0" />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 sm:gap-3 lg:gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleClose} 
                className="px-4 py-2 sm:px-6 sm:py-2.5 lg:px-6 lg:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 text-sm sm:text-base lg:text-base"
              >
                {t("userForm.buttons.cancel")}
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 sm:px-6 sm:py-2.5 lg:px-6 lg:py-2.5 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] disabled:hover:scale-100 text-sm sm:text-base lg:text-base"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 lg:h-4 lg:w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4" />
                )}
                {formData.sendInvitation ? t("userForm.buttons.sendInvitation") : t("userForm.buttons.createUser")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
