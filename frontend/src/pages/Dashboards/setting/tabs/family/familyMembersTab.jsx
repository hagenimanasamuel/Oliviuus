import React, { useState, useRef, useEffect } from "react";
import { 
  Users, UserPlus, Mail, Calendar, Crown, MoreVertical, 
  Edit3, Trash2, Shield, Clock, UserCheck, UserX,
  Smartphone, Monitor, Loader, AlertCircle
} from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";
import InviteFamilyMemberModal from "./modals/InviteFamilyMemberModal";
import EditFamilyMemberModal from "./modals/EditFamilyMemberModal";

export default function FamilyMembersTab({ familyMembers, onUpdate, currentSubscription }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [removingMember, setRemovingMember] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [operationLoading, setOperationLoading] = useState(null);
  const dropdownRefs = useRef({});

  // PROPER data access - handle all possible response structures
  const membersArray = React.useMemo(() => {
    if (!familyMembers) return [];
    
    if (Array.isArray(familyMembers)) {
      return familyMembers;
    } else if (familyMembers.family_members && Array.isArray(familyMembers.family_members)) {
      return familyMembers.family_members;
    } else if (familyMembers.data && Array.isArray(familyMembers.data)) {
      return familyMembers.data;
    } else if (typeof familyMembers === 'object' && familyMembers.members) {
      return familyMembers.members;
    }
    
    return [];
  }, [familyMembers]);

  // Get max members from multiple possible sources
  const maxMembers = React.useMemo(() => {
    if (familyMembers?.max_family_members) {
      return familyMembers.max_family_members;
    }
    if (currentSubscription?.max_family_members) {
      return currentSubscription.max_family_members;
    }
    if (familyMembers?.subscription_info?.max_family_members) {
      return familyMembers.subscription_info.max_family_members;
    }
    if (currentSubscription?.type === 'family') {
      return 6;
    }
    
    return 1;
  }, [familyMembers, currentSubscription]);

  const currentMemberCount = membersArray.length;
  const canInviteMore = currentMemberCount < maxMembers;
  const remainingInvites = maxMembers - currentMemberCount;

  // Close dropdown when clicking outside - IMPROVED VERSION
  useEffect(() => {
    const handleClickOutside = (event) => {
      let clickedOutsideAll = true;
      
      // Check if click was inside any dropdown
      Object.values(dropdownRefs.current).forEach(ref => {
        if (ref && ref.contains(event.target)) {
          clickedOutsideAll = false;
        }
      });

      if (clickedOutsideAll) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set dropdown ref for each member
  const setDropdownRef = (memberId, ref) => {
    dropdownRefs.current[memberId] = ref;
  };

  const handleRemoveMember = async (memberId) => {
    try {
      setOperationLoading(`remove-${memberId}`);
      setError('');
      await api.delete(`/family/members/${memberId}`);
      onUpdate();
      setRemovingMember(null);
      setShowDropdown(null);
    } catch (error) {
      console.error("Error removing family member:", error);
      setError(error.response?.data?.error || t('familyProfiles.membersTab.removeError'));
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEditClick = (member) => {
    setEditingMember(member);
    setShowDropdown(null);
  };

  const handleRemoveClick = (member) => {
    setRemovingMember(member);
    setShowDropdown(null);
  };

  // Helper functions
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

  const getRoleDisplayName = (role) => {
    return t(`family.roles.${role}`, { defaultValue: role });
  };

  const getStatusBadgeColor = (status, isActive) => {
    if (!isActive) return 'bg-red-500/20 text-red-400 border-red-500/30';
    
    const colors = {
      'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'accepted': 'bg-green-500/20 text-green-400 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
      'expired': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status] || colors.accepted;
  };

  const getStatusDisplayName = (status, isActive) => {
    if (!isActive) return t('familyProfiles.membersTab.suspended');
    
    const names = {
      'pending': t('familyProfiles.membersTab.pending'),
      'accepted': t('familyProfiles.membersTab.active'),
      'rejected': t('familyProfiles.membersTab.rejected'),
      'expired': t('familyProfiles.membersTab.expired')
    };
    return names[status] || t('familyProfiles.membersTab.active');
  };

  const getDashboardIcon = (dashboardType) => {
    return dashboardType === 'kid' ? <Smartphone size={14} /> : <Monitor size={14} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.never');
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return t('common.invalidDate');
    }
  };

  const formatTime = (timeString) => {
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

  if (!familyMembers) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center text-red-400">
            <AlertCircle size={18} className="mr-2" />
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl sm:text-2xl font-semibold text-white flex items-center">
              <Users className="mr-2 text-[#BC8BBC]" size={24} />
              {t('familyProfiles.membersTab.title')}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm font-medium">
              <Users size={14} className="mr-1" />
              {currentMemberCount}/{maxMembers}
              {maxMembers > 1}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {t('familyProfiles.membersTab.subtitle')}
            {maxMembers > 1 && ` • ${t('familyProfiles.membersTab.planAllows', { maxMembers })}`}
          </p>
        </div>
        
        <button
          onClick={() => setShowInviteModal(true)}
          disabled={!canInviteMore}
          className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
            canInviteMore
              ? "bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white shadow-lg"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          <UserPlus size={18} className="mr-2" />
          {t('familyProfiles.membersTab.inviteMember')}
          {maxMembers > 1 && canInviteMore && (
            <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
              {remainingInvites}
            </span>
          )}
        </button>
      </div>

      {/* Members List */}
      {membersArray.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-300 mb-2">
            {t('familyProfiles.membersTab.noMembers')}
          </h4>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            {maxMembers > 1 
              ? t('familyProfiles.membersTab.noMembersDescription', { maxMembers })
              : t('familyProfiles.membersTab.upgradeRequired')
            }
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={!canInviteMore}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
              canInviteMore
                ? "bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <UserPlus size={16} className="inline mr-2" />
            {canInviteMore ? t('familyProfiles.membersTab.inviteFirstMember') : t('familyProfiles.membersTab.upgradePlanRequired')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {membersArray.map((member) => (
            <div
              key={member.id}
              className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-[#BC8BBC]/30 transition-all duration-300 group relative"
            >
              {/* Operation loading overlay */}
              {(operationLoading === `remove-${member.id}` || operationLoading === `edit-${member.id}`) && (
                <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-10">
                  <Loader size={24} className="animate-spin text-[#BC8BBC]" />
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {member.profile_avatar_url ? (
                      <img 
                        src={member.profile_avatar_url} 
                        alt={member.email}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      member.email?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white text-base sm:text-lg truncate">
                        {member.email || t('common.unknownEmail')}
                      </h4>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.member_role)}`}>
                        {getRoleDisplayName(member.member_role)}
                      </span>

                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(member.invitation_status, member.is_active)}`}>
                        {getStatusDisplayName(member.invitation_status, member.is_active)}
                      </span>

                      {member.member_role === 'owner' && (
                        <Crown size={16} className="text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Mail size={14} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{member.email || t('common.noEmail')}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1 flex-shrink-0" />
                        {member.joined_at ? (
                          <span>{t('familyProfiles.membersTab.joined')} {formatDate(member.joined_at)}</span>
                        ) : member.invited_at ? (
                          <span>{t('familyProfiles.membersTab.invited')} {formatDate(member.invited_at)}</span>
                        ) : (
                          <span>{t('common.noDate')}</span>
                        )}
                      </div>

                      {member.dashboard_type && (
                        <div className="flex items-center">
                          {getDashboardIcon(member.dashboard_type)}
                          <span className="ml-1 capitalize">{t(`family.dashboardTypes.${member.dashboard_type}`, member.dashboard_type)}</span>
                        </div>
                      )}

                      {member.last_accessed_at && (
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1 flex-shrink-0" />
                          <span>{t('familyProfiles.membersTab.lastActive')} {formatDate(member.last_accessed_at)}</span>
                        </div>
                      )}
                    </div>

                    {(member.is_suspended || member.enforce_sleep_time || member.enforce_access_window) && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {member.is_suspended && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                            <UserX size={12} className="mr-1" />
                            {t('familyProfiles.membersTab.suspended')}
                          </span>
                        )}
                        {member.enforce_sleep_time && member.sleep_time_start && member.sleep_time_end && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <Clock size={12} className="mr-1" />
                            {t('familyProfiles.membersTab.sleepTime')}: {formatTime(member.sleep_time_start)}-{formatTime(member.sleep_time_end)}
                          </span>
                        )}
                        {member.enforce_access_window && member.allowed_access_start && member.allowed_access_end && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                            <Shield size={12} className="mr-1" />
                            {t('familyProfiles.membersTab.accessWindow')}: {formatTime(member.allowed_access_start)}-{formatTime(member.allowed_access_end)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Dropdown - Only for non-owner members */}
                {member.member_role !== 'owner' && (
                  <div 
                    className="relative flex-shrink-0"
                    ref={(ref) => setDropdownRef(member.id, ref)}
                  >
                    <button 
                      onClick={() => setShowDropdown(showDropdown === member.id ? null : member.id)}
                      disabled={operationLoading}
                      className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    
                    {showDropdown === member.id && (
                      <div className="absolute right-0 top-10 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 backdrop-blur-sm">
                        <button
                          onClick={() => handleEditClick(member)}
                          disabled={operationLoading}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/80 rounded-t-lg transition-all duration-200 disabled:opacity-50"
                        >
                          <Edit3 size={16} className="mr-3" />
                          {t('familyProfiles.membersTab.editSettings')}
                        </button>
                        <button
                          onClick={() => handleRemoveClick(member)}
                          disabled={operationLoading}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-gray-700/80 rounded-b-lg transition-all duration-200 disabled:opacity-50"
                        >
                          <Trash2 size={16} className="mr-3" />
                          {t('familyProfiles.membersTab.removeMember')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limit Warning */}
      {!canInviteMore && maxMembers > 1 && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center text-yellow-400">
            <Shield size={18} className="mr-2" />
            <span className="font-medium">{t('familyProfiles.membersTab.memberLimitReached')}</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">
            {t('familyProfiles.membersTab.memberLimitReachedDescription', { maxMembers })}
          </p>
        </div>
      )}

      {/* Individual Plan Notice */}
      {maxMembers <= 1 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center text-blue-400">
            <Users size={18} className="mr-2" />
            <span className="font-medium">{t('familyProfiles.membersTab.individualPlan')}</span>
          </div>
          <p className="text-blue-300 text-sm mt-1">
            {t('familyProfiles.membersTab.upgradeSuggestion')}
          </p>
        </div>
      )}

      {/* Modals */}
      {showInviteModal && (
        <InviteFamilyMemberModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            onUpdate();
          }}
          currentSubscription={currentSubscription}
          maxMembers={maxMembers}
          currentCount={currentMemberCount}
        />
      )}

      {editingMember && (
        <EditFamilyMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => {
            setEditingMember(null);
            onUpdate();
          }}
        />
      )}

      {/* Remove Confirmation Modal */}
      {removingMember && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => !operationLoading && setRemovingMember(null)}
        >
          <div 
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('familyProfiles.membersTab.removeConfirmationTitle')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('familyProfiles.membersTab.removeConfirmationDescription', { email: removingMember.email })}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setRemovingMember(null)}
                disabled={operationLoading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleRemoveMember(removingMember.id)}
                disabled={operationLoading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
              >
                {operationLoading === `remove-${removingMember.id}` ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  t('familyProfiles.membersTab.removeMember')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}