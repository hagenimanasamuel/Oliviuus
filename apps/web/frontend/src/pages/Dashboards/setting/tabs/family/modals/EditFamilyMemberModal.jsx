import React, { useState, useEffect, useRef } from "react";
import { 
  X, User, Shield, Clock, Smartphone, Monitor, Crown, 
  Moon, Sun, Calendar, AlertCircle, Lock, Zap
} from "lucide-react";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function EditFamilyMemberModal({ member, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    member_role: member.member_role || 'child',
    relationship: member.relationship || '',
    dashboard_type: member.dashboard_type || 'normal',
    is_suspended: member.is_suspended || false,
    suspended_until: member.suspended_until || '',
    sleep_time_start: member.sleep_time_start || '',
    sleep_time_end: member.sleep_time_end || '',
    enforce_sleep_time: member.enforce_sleep_time || false,
    allowed_access_start: member.allowed_access_start || '06:00',
    allowed_access_end: member.allowed_access_end || '22:00',
    enforce_access_window: member.enforce_access_window || false,
    monthly_spending_limit: member.monthly_spending_limit || 0,
    max_daily_watch_time: member.max_daily_watch_time || null,
    content_restrictions: member.content_restrictions || {},
    custom_permissions: member.custom_permissions || {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const modalRef = useRef(null);

  const memberRoles = [
    { value: 'parent', label: t('familyProfiles.modals.editMember.roles.parent'), description: t('familyProfiles.modals.editMember.roles.parentDescription'), icon: Crown },
    { value: 'teen', label: t('familyProfiles.modals.editMember.roles.teen'), description: t('familyProfiles.modals.editMember.roles.teenDescription'), icon: User },
    { value: 'child', label: t('familyProfiles.modals.editMember.roles.child'), description: t('familyProfiles.modals.editMember.roles.childDescription'), icon: User },
    { value: 'guest', label: t('familyProfiles.modals.editMember.roles.guest'), description: t('familyProfiles.modals.editMember.roles.guestDescription'), icon: User }
  ];

  const dashboardTypes = [
    { value: 'normal', label: t('familyProfiles.modals.editMember.dashboards.normal'), description: t('familyProfiles.modals.editMember.dashboards.normalDescription'), icon: Monitor },
    { value: 'kid', label: t('familyProfiles.modals.editMember.dashboards.kid'), description: t('familyProfiles.modals.editMember.dashboards.kidDescription'), icon: Smartphone }
  ];

  const tabs = [
    { id: 'basic', label: t('familyProfiles.modals.editMember.tabs.basic'), icon: User },
    { id: 'access', label: t('familyProfiles.modals.editMember.tabs.access'), icon: Shield },
    { id: 'restrictions', label: t('familyProfiles.modals.editMember.tabs.restrictions'), icon: Lock }
  ];

  // Initialize modal with animation
  useEffect(() => {
    setTimeout(() => setShowModal(true), 50);
  }, []);

  // Auto-scroll to top when error occurs
  useEffect(() => {
    if (error && modalRef.current) {
      modalRef.current.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  }, [error]);

  const handleClose = () => {
    setShowModal(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/family/members/${member.id}`, formData);
      setShowModal(false);
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error) {
      setError(error.response?.data?.error || t('familyProfiles.modals.editMember.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSetting = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getRoleIcon = (roleValue) => {
    const role = memberRoles.find(r => r.value === roleValue);
    return role ? React.createElement(role.icon, { size: 16 }) : <User size={16} />;
  };

  const getDashboardIcon = (dashboardValue) => {
    const dashboard = dashboardTypes.find(d => d.value === dashboardValue);
    return dashboard ? React.createElement(dashboard.icon, { size: 16 }) : <Monitor size={16} />;
  };

  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return t('common.notSet');
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return t('common.invalidTime');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className={`bg-gray-900 rounded-xl max-w-4xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          showModal ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t('familyProfiles.modals.editMember.title', { email: member.email })}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {t('familyProfiles.modals.editMember.subtitle')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center text-red-400">
              <AlertCircle size={16} className="mr-2" />
              <span className="font-medium">{t('familyProfiles.modals.editMember.updateFailed')}</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#BC8BBC] text-white shadow-lg transform scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800 transform hover:scale-105"
                }`}
              >
                {React.createElement(tab.icon, { size: 16, className: "mr-2" })}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                {t('familyProfiles.modals.editMember.basicSettings')}
              </h4>

              {/* Member Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('familyProfiles.modals.editMember.memberRole')}
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {memberRoles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleChange('member_role', role.value)}
                      className={`p-3 rounded-lg border text-left transition-all duration-300 transform hover:scale-105 ${
                        formData.member_role === role.value
                          ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white scale-105"
                          : "border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        {React.createElement(role.icon, { 
                          size: 16, 
                          className: formData.member_role === role.value ? "text-[#BC8BBC]" : "text-gray-500" 
                        })}
                        <span className="ml-2 text-sm font-medium">{role.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('familyProfiles.modals.editMember.dashboardType')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {dashboardTypes.map((dashboard) => (
                    <button
                      key={dashboard.value}
                      type="button"
                      onClick={() => handleChange('dashboard_type', dashboard.value)}
                      className={`p-3 rounded-lg border text-left transition-all duration-300 transform hover:scale-105 ${
                        formData.dashboard_type === dashboard.value
                          ? "border-[#BC8BBC] bg-[#BC8BBC]/20 text-white scale-105"
                          : "border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        {React.createElement(dashboard.icon, { 
                          size: 16, 
                          className: formData.dashboard_type === dashboard.value ? "text-[#BC8BBC]" : "text-gray-500" 
                        })}
                        <span className="ml-2 text-sm font-medium">{dashboard.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{dashboard.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('familyProfiles.modals.editMember.relationship')}
                </label>
                <input
                  type="text"
                  placeholder={t('familyProfiles.modals.editMember.relationshipPlaceholder')}
                  value={formData.relationship}
                  onChange={(e) => handleChange('relationship', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
                />
              </div>

              {/* Account Suspension */}
              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {t('familyProfiles.modals.editMember.temporarilySuspend')}
                  </label>
                  <p className="text-gray-500 text-sm">
                    {t('familyProfiles.modals.editMember.suspendDescription')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('is_suspended')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                    formData.is_suspended ? "bg-red-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                      formData.is_suspended ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Access Control Tab */}
          {activeTab === 'access' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                {t('familyProfiles.modals.editMember.accessControl')}
              </h4>

              {/* Sleep Time Restrictions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <Moon size={16} className="mr-2" />
                      {t('familyProfiles.modals.editMember.sleepTimeRestrictions')}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {t('familyProfiles.modals.editMember.sleepTimeDescription')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting('enforce_sleep_time')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                      formData.enforce_sleep_time ? "bg-[#BC8BBC]" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                        formData.enforce_sleep_time ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {formData.enforce_sleep_time && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('familyProfiles.modals.editMember.sleepStart')}
                      </label>
                      <input
                        type="time"
                        value={formData.sleep_time_start}
                        onChange={(e) => handleChange('sleep_time_start', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#BC8BBC] transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('familyProfiles.modals.editMember.sleepEnd')}
                      </label>
                      <input
                        type="time"
                        value={formData.sleep_time_end}
                        onChange={(e) => handleChange('sleep_time_end', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#BC8BBC] transition-all duration-300"
                      />
                    </div>
                    <div className="md:col-span-2 text-center p-2 bg-gray-800/50 rounded">
                      <p className="text-sm text-gray-400">
                        {t('familyProfiles.modals.editMember.activeFrom', { 
                          start: formatTimeForDisplay(formData.sleep_time_end), 
                          end: formatTimeForDisplay(formData.sleep_time_start) 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Access Time Window */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                      <Sun size={16} className="mr-2" />
                      {t('familyProfiles.modals.editMember.accessTimeWindow')}
                    </label>
                    <p className="text-gray-500 text-sm">
                      {t('familyProfiles.modals.editMember.accessTimeDescription')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSetting('enforce_access_window')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 transform hover:scale-110 ${
                      formData.enforce_access_window ? "bg-[#BC8BBC]" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 ${
                        formData.enforce_access_window ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {formData.enforce_access_window && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4 p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('familyProfiles.modals.editMember.accessStart')}
                      </label>
                      <input
                        type="time"
                        value={formData.allowed_access_start}
                        onChange={(e) => handleChange('allowed_access_start', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#BC8BBC] transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('familyProfiles.modals.editMember.accessEnd')}
                      </label>
                      <input
                        type="time"
                        value={formData.allowed_access_end}
                        onChange={(e) => handleChange('allowed_access_end', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#BC8BBC] transition-all duration-300"
                      />
                    </div>
                    <div className="md:col-span-2 text-center p-2 bg-gray-800/50 rounded">
                      <p className="text-sm text-gray-400">
                        {t('familyProfiles.modals.editMember.canAccessFrom', { 
                          start: formatTimeForDisplay(formData.allowed_access_start), 
                          end: formatTimeForDisplay(formData.allowed_access_end) 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Watch Time Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Clock size={16} className="mr-2" />
                  {t('familyProfiles.modals.editMember.dailyWatchTimeLimit')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="480"
                  step="30"
                  placeholder={t('familyProfiles.modals.editMember.unlimited')}
                  value={formData.max_daily_watch_time || ''}
                  onChange={(e) => handleChange('max_daily_watch_time', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
                />
                <p className="text-gray-500 text-sm mt-1">
                  {t('familyProfiles.modals.editMember.unlimitedDescription')}
                </p>
              </div>
            </div>
          )}

          {/* Restrictions Tab */}
          {activeTab === 'restrictions' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
                {t('familyProfiles.modals.editMember.contentAndSpending')}
              </h4>

              {/* Monthly Spending Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <Zap size={16} className="mr-2" />
                  {t('familyProfiles.modals.editMember.monthlySpendingLimit')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0.00"
                  value={formData.monthly_spending_limit}
                  onChange={(e) => handleChange('monthly_spending_limit', parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02]"
                />
                <p className="text-gray-500 text-sm mt-1">
                  {t('familyProfiles.modals.editMember.spendingLimitDescription')}
                </p>
              </div>

              {/* Content Restrictions Info */}
              <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex items-center text-blue-400 mb-2">
                  <Shield size={16} className="mr-2" />
                  <span className="font-medium">{t('familyProfiles.modals.editMember.contentRestrictions')}</span>
                </div>
                <p className="text-gray-400 text-sm">
                  {t('familyProfiles.modals.editMember.contentRestrictionsDescription')}
                </p>
              </div>

              {/* Current Restrictions Summary */}
              <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                <h5 className="text-sm font-medium text-gray-300 mb-3">{t('familyProfiles.modals.editMember.currentSettings')}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('familyProfiles.modals.editMember.role')}:</span>
                    <span className="text-white flex items-center">
                      {getRoleIcon(formData.member_role)}
                      <span className="ml-2 capitalize">
                        {memberRoles.find(r => r.value === formData.member_role)?.label}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('familyProfiles.modals.editMember.dashboard')}:</span>
                    <span className="text-white flex items-center">
                      {getDashboardIcon(formData.dashboard_type)}
                      <span className="ml-2 capitalize">
                        {dashboardTypes.find(d => d.value === formData.dashboard_type)?.label}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('familyProfiles.modals.editMember.accountStatus')}:</span>
                    <span className={`${formData.is_suspended ? 'text-red-400' : 'text-green-400'}`}>
                      {formData.is_suspended ? t('familyProfiles.modals.editMember.suspended') : t('familyProfiles.modals.editMember.active')}
                    </span>
                  </div>
                  {formData.enforce_sleep_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('familyProfiles.modals.editMember.sleepTime')}:</span>
                      <span className="text-white">
                        {formatTimeForDisplay(formData.sleep_time_start)} - {formatTimeForDisplay(formData.sleep_time_end)}
                      </span>
                    </div>
                  )}
                  {formData.enforce_access_window && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">{t('familyProfiles.modals.editMember.accessWindow')}:</span>
                      <span className="text-white">
                        {formatTimeForDisplay(formData.allowed_access_start)} - {formatTimeForDisplay(formData.allowed_access_end)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-700 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                t('familyProfiles.modals.editMember.saveChanges')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}