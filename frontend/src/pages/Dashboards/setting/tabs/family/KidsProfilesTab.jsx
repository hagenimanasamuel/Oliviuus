import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Edit3, Trash2, Play, Clock, 
  Shield, Settings, Users
} from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";
import CreateKidProfileModal from "./modals/CreateKidProfileModal";
import EditKidProfileModal from "./modals/EditKidProfileModal";

export default function KidsProfilesTab({ kidProfiles, onUpdate, currentSubscription }) {
  const { t } = useTranslation();
  const { selectProfile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKid, setEditingKid] = useState(null);
  const [deletingKid, setDeletingKid] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [operationLoading, setOperationLoading] = useState(null);
  const dropdownRefs = useRef({});

  // Get max profiles from server data or default to 4
  const maxProfiles = currentSubscription?.max_profiles || 4;
  const canCreateMore = kidProfiles.length < maxProfiles;

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

  // Set dropdown ref for each kid
  const setDropdownRef = (kidId, ref) => {
    dropdownRefs.current[kidId] = ref;
  };

  const handleDeleteKid = async (kidId) => {
    try {
      setOperationLoading(`delete-${kidId}`);
      await api.delete(`/kids/profiles/${kidId}`);
      onUpdate();
      setDeletingKid(null);
      setShowDropdown(null);
    } catch (error) {
      console.error("Error deleting kid profile:", error);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleEditClick = (kid) => {
    setEditingKid(kid);
    setShowDropdown(null);
  };

  const handleDeleteClick = (kid) => {
    setDeletingKid(kid);
    setShowDropdown(null);
  };

  const getAgeRatingColor = (rating) => {
    const colors = {
      '3+': 'bg-green-500',
      '7+': 'bg-blue-500',
      '11+': 'bg-yellow-500',
      '13+': 'bg-orange-500',
      '16+': 'bg-red-500'
    };
    return colors[rating] || 'bg-gray-500';
  };

  const handleSwitchToKid = async (kidProfile) => {
    try {
      // Use the same selectProfile function from AuthContext that ProfileSelector uses
      console.log("Switching to kid profile:", kidProfile);
      
      // Format the kid profile to match what ProfileSelector expects
      const formattedProfile = {
        id: kidProfile.id,
        type: 'kid',
        name: kidProfile.name,
        display_name: kidProfile.name,
        avatar_url: kidProfile.avatar_url,
        description: t('familyProfiles.kidsTab.kidsMode')
      };
      
      // This will call enterKidMode internally and handle the switch
      await selectProfile(formattedProfile);
      
    } catch (error) {
      console.error("Error switching to kid profile:", error);
      alert(t('familyProfiles.kidsTab.switchError'));
    }
  };

  return (
    <div>
      {/* Header with Create Button and Profile Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl sm:text-2xl font-semibold text-white">
              {t('familyProfiles.kidsTab.title')}
            </h3>
            {/* Profile Count Badge */}
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 text-gray-300 text-sm font-medium">
              <Users size={14} className="mr-1" />
              {kidProfiles.length}/{maxProfiles}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {t('familyProfiles.kidsTab.subtitle')}
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreateMore}
          className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
            canCreateMore
              ? "bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white shadow-lg"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Plus size={18} className="mr-2" />
          {t('familyProfiles.kidsTab.addProfile')}
        </button>
      </div>

      {/* Profiles Grid */}
      {kidProfiles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={32} className="text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-300 mb-2">
            {t('familyProfiles.kidsTab.noProfiles')}
          </h4>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            {t('familyProfiles.kidsTab.noProfilesDescription')}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#BC8BBC] hover:bg-[#BC8BBC]/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
          >
            <Plus size={16} className="inline mr-2" />
            {t('familyProfiles.kidsTab.createFirstProfile')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {kidProfiles.map((kid) => (
            <div
              key={kid.id}
              className="bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-[#BC8BBC]/50 transition-all duration-300 group relative transform hover:scale-[1.02]"
            >
              {/* Operation loading overlay */}
              {operationLoading === `delete-${kid.id}` && (
                <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
                </div>
              )}

              {/* Profile Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {kid.avatar_url ? (
                      <img 
                        src={kid.avatar_url} 
                        alt={kid.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      kid.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <h4 className="font-semibold text-white text-base sm:text-lg truncate">{kid.name}</h4>
                    <div className="flex items-center mt-1 flex-wrap gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getAgeRatingColor(kid.max_age_rating)}`}>
                        {kid.max_age_rating}
                      </span>
                      <span className="text-gray-400 text-xs sm:text-sm">
                        {kid.calculated_age} {t('familyProfiles.kidsTab.yearsOld')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions Dropdown - FIXED VERSION */}
                <div 
                  className="relative flex-shrink-0"
                  ref={(ref) => setDropdownRef(kid.id, ref)}
                >
                  <button 
                    onClick={() => setShowDropdown(showDropdown === kid.id ? null : kid.id)}
                    disabled={operationLoading}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-30"
                  >
                    <Edit3 size={16} className="text-gray-400" />
                  </button>
                  
                  {showDropdown === kid.id && (
                    <div className="absolute right-0 top-10 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 backdrop-blur-sm">
                      <button
                        onClick={() => handleEditClick(kid)}
                        disabled={operationLoading}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/80 rounded-t-lg transition-all duration-200 disabled:opacity-50"
                      >
                        <Edit3 size={16} className="mr-3" />
                        {t('familyProfiles.kidsTab.editProfile')}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(kid)}
                        disabled={operationLoading}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-gray-700/80 rounded-b-lg transition-all duration-200 disabled:opacity-50"
                      >
                        <Trash2 size={16} className="mr-3" />
                        {t('familyProfiles.kidsTab.deleteProfile')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                  <Clock size={14} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{t('familyProfiles.kidsTab.dailyTime')}: {kid.daily_time_limit_minutes}m</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Shield size={14} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{t('familyProfiles.kidsTab.pinRequired')}: {kid.require_pin_to_exit ? t('common.yes') : t('common.no')}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleSwitchToKid(kid)}
                  disabled={operationLoading}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center disabled:opacity-50"
                >
                  <Play size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{t('familyProfiles.kidsTab.switchTo')} {kid.name}</span>
                </button>
                <button 
                  onClick={() => setEditingKid(kid)}
                  disabled={operationLoading}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-300 transform hover:scale-110 disabled:opacity-50"
                >
                  <Settings size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limit Warning */}
      {!canCreateMore && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center text-yellow-400">
            <Shield size={18} className="mr-2" />
            <span className="font-medium">{t('familyProfiles.kidsTab.limitReached')}</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">
            {t('familyProfiles.kidsTab.limitReachedDescription', { maxProfiles })}
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateKidProfileModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            onUpdate();
          }}
        />
      )}

      {editingKid && (
        <EditKidProfileModal
          kid={editingKid}
          onClose={() => setEditingKid(null)}
          onSuccess={() => {
            setEditingKid(null);
            onUpdate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingKid && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => !operationLoading && setDeletingKid(null)}
        >
          <div 
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700 transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('familyProfiles.kidsTab.deleteConfirmationTitle')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('familyProfiles.kidsTab.deleteConfirmationDescription', { name: deletingKid.name })}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeletingKid(null)}
                disabled={operationLoading}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDeleteKid(deletingKid.id)}
                disabled={operationLoading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
              >
                {operationLoading === `delete-${deletingKid.id}` ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  t('common.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}