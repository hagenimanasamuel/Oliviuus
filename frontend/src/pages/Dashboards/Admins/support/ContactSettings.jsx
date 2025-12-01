import React, { useState, useEffect } from "react";
import { Mail, Phone, Save, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function ContactSettings() {
  const { t } = useTranslation();
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch current contact info
  const fetchContactInfo = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contact/info');
      if (response.data.success) {
        setContactInfo(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
      setMessage({ type: 'error', text: t('contact.settings.loadError') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear message when user starts typing
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/contact/admin/info', contactInfo);
      if (response.data.success) {
        setMessage({ type: 'success', text: t('contact.settings.updateSuccess') });
        setContactInfo(response.data.data); // Update with server response
      } else {
        setMessage({ type: 'error', text: response.data.message || t('contact.settings.updateError') });
      }
    } catch (error) {
      console.error('Failed to update contact info:', error);
      const errorMessage = error.response?.data?.message || t('contact.settings.updateError');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchContactInfo();
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('contact.settings.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('contact.settings.subtitle')}
        </p>
      </div>

      {/* Contact Info Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 text-[#BC8BBC]" />
              {t('contact.settings.supportEmail')}
            </label>
            <input
              type="email"
              name="email"
              value={contactInfo.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors"
              placeholder={t('contact.settings.emailPlaceholder')}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('contact.settings.emailDescription')}
            </p>
          </div>

          {/* Phone Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4 text-[#BC8BBC]" />
              {t('contact.settings.supportPhone')}
            </label>
            <input
              type="tel"
              name="phone"
              value={contactInfo.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors"
              placeholder={t('contact.settings.phonePlaceholder')}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('contact.settings.phoneDescription')}
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  message.type === 'success' 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  {message.text}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {t('contact.settings.refresh')}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? t('contact.settings.saving') : t('contact.settings.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('contact.settings.preview')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
            <Mail className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3" />
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">
              {t('contact.emailSupport')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {contactInfo.email || t('contact.settings.defaultEmail')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {t('contact.responseTime')}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
            <Phone className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3" />
            <h4 className="text-gray-900 dark:text-white font-semibold mb-2">
              {t('contact.phoneSupport')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {contactInfo.phone || t('contact.settings.defaultPhone')}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {t('contact.phoneHours')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}