import React, { useState, useEffect, useRef } from "react";
import {
  Mail, Clock, UserCheck, UserX, Users, Crown,
  AlertCircle, CheckCircle, XCircle, Loader,
  ChevronDown, ChevronUp, Smartphone, Monitor,
  Calendar, Shield
} from "lucide-react";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function FamilyInvitations({ user, onInvitationUpdate }) {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState([]);
  const [currentFamily, setCurrentFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [expandedInvitation, setExpandedInvitation] = useState(null);
  const pageTopRef = useRef(null);

  useEffect(() => {
    loadFamilyData();
  }, []);

  // Auto-scroll to top when error occurs
  useEffect(() => {
    if (error && pageTopRef.current) {
      pageTopRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [error]);

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load pending invitations
      const invitationsResponse = await api.get('/family/invitations/pending');
      setInvitations(invitationsResponse.data.invitations || []);

      // Load current family membership
      const familyResponse = await api.get('/family/membership/status');
      setCurrentFamily(familyResponse.data);

    } catch (error) {
      console.error("Error loading family data:", error);
      setError(t('family.invitations.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationAction = async (invitationId, action) => {
    try {
      setProcessing(invitationId);
      setError('');

      if (action === 'accept') {
        await api.post('/family/invitations/accept', {
          token: invitations.find(inv => inv.id === invitationId)?.invitation_token
        });
      } else if (action === 'reject') {
        await api.post('/family/invitations/reject', { invitation_id: invitationId });
      }

      // Refresh data
      await loadFamilyData();
      onInvitationUpdate?.();

    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      setError(error.response?.data?.error || t('family.invitations.errors.actionFailed', { action: t(`family.invitations.actions.${action}`) }));
    } finally {
      setProcessing(null);
    }
  };

  const leaveFamily = async () => {
    if (!window.confirm(t('family.invitations.leaveConfirmation'))) {
      return;
    }

    try {
      setProcessing('leave-family');
      setError('');

      await api.post('/family/leave');

      // Refresh data
      await loadFamilyData();
      onInvitationUpdate?.();

    } catch (error) {
      console.error("Error leaving family:", error);
      setError(error.response?.data?.error || t('family.invitations.errors.leaveFailed'));
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return t('family.invitations.status.expired');
    if (diffDays === 1) return t('family.invitations.status.oneDayLeft');
    return t('family.invitations.status.daysLeft', { days: diffDays });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'owner': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'parent': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'teen': 'bg-green-500/20 text-green-400 border-green-500/30',
      'child': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'guest': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[role] || colors.guest;
  };

  const getDashboardIcon = (dashboardType) => {
    return dashboardType === 'kid' ?
      <Smartphone size={16} className="text-blue-400" /> :
      <Monitor size={16} className="text-green-400" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Page Top Reference for Auto-scroll */}
      <div ref={pageTopRef} className="absolute top-0" />

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center text-red-400">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="font-medium">{t('common.error')}</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-red-400 hover:text-red-300 text-sm underline"
          >
            {t('common.dismiss')}
          </button>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('family.invitations.stats.pendingInvitations')}</p>
              <p className="text-2xl font-bold text-white">{invitations.length}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Mail size={20} className="text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('family.invitations.stats.familyStatus')}</p>
              <p className="text-lg font-bold text-white">
                {currentFamily?.is_family_member ? t('family.invitations.stats.member') : t('family.invitations.stats.noFamily')}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Users size={20} className="text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('family.invitations.stats.yourRole')}</p>
              <p className="text-lg font-bold text-white capitalize">
                {currentFamily?.member_role || t('family.invitations.stats.individual')}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Shield size={20} className="text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Family Membership - Responsive Card */}
      {currentFamily?.is_family_member && (
        <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Users className="text-white" size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {t('family.invitations.familyMember.title')}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentFamily.member_role)}`}>
                    {t(`family.roles.${currentFamily.member_role}`, currentFamily.member_role)}
                  </span>
                  {currentFamily.member_role === 'owner' && (
                    <Crown size={16} className="text-yellow-400 flex-shrink-0" />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-4 text-sm text-blue-300">
                  <div className="flex items-center">
                    <Mail size={14} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{currentFamily.family_owner_email}</span>
                  </div>

                  <div className="flex items-center">
                    <Calendar size={14} className="mr-2 flex-shrink-0" />
                    <span>{t('family.invitations.familyMember.joined')} {formatDate(currentFamily.joined_at)}</span>
                  </div>

                  {currentFamily.dashboard_type && (
                    <div className="flex items-center">
                      {getDashboardIcon(currentFamily.dashboard_type)}
                      <span className="ml-1">
                        {t(`family.dashboardTypes.${currentFamily.dashboard_type}`)} {t('family.invitations.familyMember.dashboard')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {currentFamily.member_role !== 'owner' && (
              <div className="flex-shrink-0">
                <button
                  onClick={leaveFamily}
                  disabled={processing === 'leave-family'}
                  className="w-full lg:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing === 'leave-family' ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <UserX size={16} />
                  )}
                  <span className="whitespace-nowrap">{t('family.invitations.actions.leaveFamily')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Invitations Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Mail size={20} className="text-yellow-400" />
            </div>
            {t('family.invitations.pendingInvitations')}
            {invitations.length > 0 && (
              <span className="bg-yellow-500 text-white text-sm px-2 py-1 rounded-full animate-pulse">
                {t('family.invitations.pendingCount', { count: invitations.length })}
              </span>
            )}
          </h2>

          {invitations.length > 0 && (
            <div className="text-sm text-gray-400">
              {t('family.invitations.clickForDetails')}
            </div>
          )}
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-12 sm:py-16 border-2 border-dashed border-gray-700 rounded-xl">
            <Mail size={48} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">
              {t('family.invitations.noInvitations.title')}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto px-4">
              {t('family.invitations.noInvitations.description')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`bg-gray-800 rounded-xl border transition-all duration-300 cursor-pointer ${expandedInvitation === invitation.id
                  ? 'border-yellow-500 shadow-lg shadow-yellow-500/10'
                  : 'border-gray-700 hover:border-yellow-500/50 hover:shadow-lg'
                  }`}
                onClick={() => setExpandedInvitation(
                  expandedInvitation === invitation.id ? null : invitation.id
                )}
              >
                {/* Invitation Header - Always Visible */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Mail size={20} className="text-yellow-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                            {invitation.family_owner_email}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(invitation.member_role)}`}>
                              {t(`family.roles.${invitation.member_role}`, invitation.member_role)}
                            </span>
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                              {getTimeRemaining(invitation.invitation_expires_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-400">
                          <Clock size={14} className="mr-2 flex-shrink-0" />
                          <span>{t('family.invitations.sent')} {formatDate(invitation.invited_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="text-gray-400 hover:text-white transition">
                        {expandedInvitation === invitation.id ?
                          <ChevronUp size={20} /> :
                          <ChevronDown size={20} />
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {expandedInvitation === invitation.id && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4">
                      {/* Invitation Details */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                          {t('family.invitations.details.title')}
                        </h4>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('family.invitations.details.from')}</span>
                            <span className="text-white font-medium">{invitation.family_owner_email}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('family.invitations.details.yourRole')}</span>
                            <span className="text-white font-medium capitalize">{t(`family.roles.${invitation.member_role}`, invitation.member_role)}</span>
                          </div>

                          {invitation.relationship && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">{t('family.invitations.details.relationship')}</span>
                              <span className="text-white">{invitation.relationship}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('family.invitations.details.dashboard')}</span>
                            <div className="flex items-center gap-2">
                              {getDashboardIcon(invitation.dashboard_type)}
                              <span className="text-white">
                                {t(`family.dashboardTypes.${invitation.dashboard_type}`)} {t('family.invitations.familyMember.dashboard')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expiration Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                          {t('family.invitations.status.title')}
                        </h4>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('family.invitations.status.status')}</span>
                            <span className="text-yellow-400 font-medium">{t('family.invitations.status.pending')}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('family.invitations.status.expires')}</span>
                            <span className="text-white">{formatDate(invitation.invitation_expires_at)}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{t('family.invitations.status.timeLeft')}</span>
                            <span className="text-yellow-400 font-medium">
                              {getTimeRemaining(invitation.invitation_expires_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Responsive Layout */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvitationAction(invitation.id, 'accept');
                        }}
                        disabled={processing === invitation.id}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing === invitation.id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        <span className="font-medium">{t('family.invitations.actions.accept')}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvitationAction(invitation.id, 'reject');
                        }}
                        disabled={processing === invitation.id}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        <span className="font-medium">{t('family.invitations.actions.decline')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Section - Responsive Grid */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <AlertCircle size={16} className="text-blue-400" />
          </div>
          {t('family.invitations.aboutFamilyPlans.title')}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <UserCheck size={16} className="text-green-400" />
                {t('family.invitations.aboutFamilyPlans.accepting.title')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('family.invitations.aboutFamilyPlans.accepting.benefit1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('family.invitations.aboutFamilyPlans.accepting.benefit2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('family.invitations.aboutFamilyPlans.accepting.benefit3')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                {t('family.invitations.aboutFamilyPlans.subscription.title')}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('family.invitations.aboutFamilyPlans.subscription.note1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('family.invitations.aboutFamilyPlans.subscription.note2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('family.invitations.aboutFamilyPlans.subscription.note3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Actions */}
      {invitations.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 shadow-lg">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              {t('family.invitations.mobile.pendingCount', { count: invitations.length })}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#BC8BBC] hover:text-[#BC8BBC]/80 text-sm font-medium"
            >
              {t('family.invitations.mobile.scrollToReview')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}