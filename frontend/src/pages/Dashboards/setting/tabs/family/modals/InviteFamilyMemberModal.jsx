import React, { useState, useEffect, useRef } from "react";
import { X, Mail, User, Shield, UserPlus, Smartphone, Monitor, Crown, AlertCircle } from "lucide-react";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function InviteFamilyMemberModal({ onClose, onSuccess, currentSubscription, maxMembers, currentCount }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    member_role: 'child',
    relationship: '',
    dashboard_type: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [remainingInvites, setRemainingInvites] = useState(maxMembers - currentCount);
  const modalRef = useRef(null);

  const memberRoles = [
    { value: 'parent', label: t('familyProfiles.modals.inviteMember.roles.parent'), description: t('familyProfiles.modals.inviteMember.roles.parentDescription'), icon: Crown },
    { value: 'teen', label: t('familyProfiles.modals.inviteMember.roles.teen'), description: t('familyProfiles.modals.inviteMember.roles.teenDescription'), icon: User },
    { value: 'child', label: t('familyProfiles.modals.inviteMember.roles.child'), description: t('familyProfiles.modals.inviteMember.roles.childDescription'), icon: User },
    { value: 'guest', label: t('familyProfiles.modals.inviteMember.roles.guest'), description: t('familyProfiles.modals.inviteMember.roles.guestDescription'), icon: User }
  ];

  const dashboardTypes = [
    { value: 'normal', label: t('familyProfiles.modals.inviteMember.dashboards.normal'), description: t('familyProfiles.modals.inviteMember.dashboards.normalDescription'), icon: Monitor },
    { value: 'kid', label: t('familyProfiles.modals.inviteMember.dashboards.kid'), description: t('familyProfiles.modals.inviteMember.dashboards.kidDescription'), icon: Smartphone }
  ];

  // Initialize modal with animation
  useEffect(() => {
    setTimeout(() => setShowModal(true), 50);
    setRemainingInvites(maxMembers - currentCount);
  }, [maxMembers, currentCount]);

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
      await api.post('/family/invite', formData);
      setShowModal(false);
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error) {
      setError(error.response?.data?.error || t('familyProfiles.modals.inviteMember.error'));
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

  const getRoleIcon = (roleValue) => {
    const role = memberRoles.find(r => r.value === roleValue);
    return role ? React.createElement(role.icon, { size: 16 }) : <User size={16} />;
  };

  const getDashboardIcon = (dashboardValue) => {
    const dashboard = dashboardTypes.find(d => d.value === dashboardValue);
    return dashboard ? React.createElement(dashboard.icon, { size: 16 }) : <Monitor size={16} />;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className={`bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          showModal ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center">
              <UserPlus className="mr-2 text-[#BC8BBC]" size={20} />
              {t('familyProfiles.modals.inviteMember.title')}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {remainingInvites > 0 
                ? t('familyProfiles.modals.inviteMember.invitationsRemaining', { count: remainingInvites })
                : t('familyProfiles.modals.inviteMember.noInvitationsRemaining')
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-110"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center text-red-400">
                <AlertCircle size={16} className="mr-2" />
                <span className="font-medium">{t('familyProfiles.modals.inviteMember.unableToSend')}</span>
              </div>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Invitation Limit Info */}
          {remainingInvites <= 0 ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center text-yellow-400">
                <Shield size={16} className="mr-2" />
                <span className="font-medium">{t('familyProfiles.modals.inviteMember.memberLimitReached')}</span>
              </div>
              <p className="text-yellow-300 text-sm mt-1">
                {t('familyProfiles.modals.inviteMember.memberLimitReachedDescription', { maxMembers })}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center text-blue-400">
                <UserPlus size={16} className="mr-2" />
                <span className="font-medium">{t('familyProfiles.modals.inviteMember.invitationDetails')}</span>
              </div>
              <p className="text-blue-300 text-sm mt-1">
                {t('familyProfiles.modals.inviteMember.invitationDescription')}
              </p>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('familyProfiles.modals.inviteMember.emailAddress')} *
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                disabled={remainingInvites <= 0}
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02] disabled:opacity-50"
              />
            </div>
          </div>
          
          {/* Member Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t('familyProfiles.modals.inviteMember.memberRole')} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {memberRoles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  disabled={remainingInvites <= 0}
                  onClick={() => handleChange('member_role', role.value)}
                  className={`p-3 rounded-lg border text-left transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${
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

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('familyProfiles.modals.inviteMember.relationship')}
            </label>
            <input
              type="text"
              disabled={remainingInvites <= 0}
              placeholder={t('familyProfiles.modals.inviteMember.relationshipPlaceholder')}
              value={formData.relationship}
              onChange={(e) => handleChange('relationship', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] transition-all duration-300 transform focus:scale-[1.02] disabled:opacity-50"
            />
          </div>

          {/* Dashboard Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              {t('familyProfiles.modals.inviteMember.dashboardType')} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {dashboardTypes.map((dashboard) => (
                <button
                  key={dashboard.value}
                  type="button"
                  disabled={remainingInvites <= 0}
                  onClick={() => handleChange('dashboard_type', dashboard.value)}
                  className={`p-3 rounded-lg border text-left transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${
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

          {/* Role & Dashboard Preview */}
          <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-300 mb-2">{t('familyProfiles.modals.inviteMember.preview')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('familyProfiles.modals.inviteMember.role')}:</span>
                <span className="text-white flex items-center">
                  {getRoleIcon(formData.member_role)}
                  <span className="ml-2 capitalize">
                    {memberRoles.find(r => r.value === formData.member_role)?.label}
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('familyProfiles.modals.inviteMember.dashboard')}:</span>
                <span className="text-white flex items-center">
                  {getDashboardIcon(formData.dashboard_type)}
                  <span className="ml-2 capitalize">
                    {dashboardTypes.find(d => d.value === formData.dashboard_type)?.label}
                  </span>
                </span>
              </div>
              {formData.relationship && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('familyProfiles.modals.inviteMember.relationship')}:</span>
                  <span className="text-white capitalize">{formData.relationship}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || remainingInvites <= 0 || !formData.email}
              className="flex-1 bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  {t('familyProfiles.modals.inviteMember.sendInvitation')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}