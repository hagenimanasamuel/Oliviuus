import React, { useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import { Users, User, Settings, Plus, X, Crown } from "lucide-react";
import CreateKidProfileModal from "../../../../../pages/Dashboards/setting/tabs/family/modals/CreateKidProfileModal";

const ProfileSelector = () => {
  const { 
    user, 
    availableKidProfiles, 
    selectProfile,
    showProfileSelector
  } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (showProfileSelector) {
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [showProfileSelector]);

  if (!showProfileSelector) return null;

  // Create main account profile
  const mainAccountProfile = {
    id: 'main',
    type: 'main',
    name: 'My Account',
    display_name: user?.name || 'My Account',
    avatar_url: user?.profile_avatar_url,
    description: 'Full access to all features'
  };

  // Filter out duplicate adult profiles and ensure unique profiles
  const uniqueProfiles = [mainAccountProfile];
  const usedIds = new Set(['main']);
  
  availableKidProfiles.forEach(profile => {
    if (!usedIds.has(profile.id) && profile.type === 'kid') {
      uniqueProfiles.push(profile);
      usedIds.add(profile.id);
    }
  });

  const handleSettingsClick = (e) => {
    e.stopPropagation();
    window.location.href = '/account/settings#profiles';
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    setShowAddModal(true);
  };

  const handleProfileCreated = () => {
    setShowAddModal(false);
    // The profiles will refresh automatically through the context
    window.location.reload(); // Simple solution to refresh profiles
  };

  return (
    <>
      <div className={`fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 p-4 transition-all duration-700 ${isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        
        {/* Header with animation */}
        <div className="text-center mb-8 sm:mb-12 transform transition-all duration-700 delay-200">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 transform transition-all duration-500 hover:scale-105">
            Who's Watching?
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg transform transition-all duration-500 delay-100">
            Select a profile to continue
          </p>
        </div>

        {/* Profiles Grid with staggered animations */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 justify-items-center">
            {uniqueProfiles.map((profile, index) => (
              <div
                key={profile.id}
                onClick={() => selectProfile(profile)}
                className="flex flex-col items-center cursor-pointer group w-full max-w-[100px] sm:max-w-[120px] md:max-w-[140px] transform transition-all duration-500 hover:scale-110"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Profile Avatar */}
                <div className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center mb-3 group-hover:scale-125 transition-all duration-500 border-2 ${
                  profile.type === 'main' 
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 border-purple-500 shadow-lg shadow-purple-500/30' 
                    : 'bg-gradient-to-br from-green-500 to-blue-500 border-green-400 shadow-lg shadow-green-500/30'
                } group-hover:shadow-2xl group-hover:shadow-purple-500/50 transform transition-all duration-500`}>
                  
                  {/* Profile Icon/Image */}
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.display_name}
                      className="w-full h-full rounded-xl object-cover transform transition-all duration-500 group-hover:scale-110"
                    />
                  ) : profile.type === 'main' ? (
                    <User className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white opacity-90 transform transition-all duration-500 group-hover:scale-110" />
                  ) : (
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white opacity-90 transform transition-all duration-500 group-hover:scale-110" />
                  )}
                  
                  {/* Crown for main account */}
                  {profile.type === 'main' && (
                    <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1 shadow-lg transform transition-all duration-500 group-hover:scale-125 group-hover:rotate-12">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                  
                  {/* Age rating badge for kid profiles - REMOVED NOTIFICATION DOT */}
                  {profile.type === 'kid' && profile.max_age_rating && (
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg text-[10px] transform transition-all duration-500 group-hover:scale-125">
                      {profile.max_age_rating}
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-all duration-500 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-125 bg-white/20 rounded-full p-2">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Profile Name */}
                <span className="text-white text-sm font-semibold group-hover:text-purple-300 transition-all duration-500 text-center break-words w-full leading-tight transform group-hover:scale-105">
                  {profile.display_name}
                </span>
                
                {/* Profile Description */}
                <p className="text-gray-400 text-xs text-center mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-y-1">
                  {profile.type === 'main' ? 'Full access' : 'Kids mode'}
                </p>
              </div>
            ))}

            {/* Manage Profiles Card with enhanced animations */}
            <div className="flex flex-col items-center cursor-pointer group w-full max-w-[100px] sm:max-w-[120px] md:max-w-[140px] transform transition-all duration-500 hover:scale-110">
              <div 
                onClick={handleSettingsClick}
                className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 mb-3 group-hover:scale-125 transition-all duration-500 border-2 border-dashed border-gray-600 group-hover:border-purple-500 group-hover:bg-gray-700/50 group-hover:shadow-2xl group-hover:shadow-purple-500/30"
              >
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 group-hover:text-purple-400 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-90" />
                
                {/* Add Icon in Corner - NOW OPENS CREATE KID PROFILE MODAL */}
                <div 
                  onClick={handleAddClick}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-all duration-300 shadow-lg border-2 border-gray-900 group-hover:scale-125 transform hover:rotate-90"
                >
                  <Plus size={12} className="text-white transform transition-all duration-300" />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all duration-500"></div>
              </div>
              <span className="text-gray-400 text-sm font-semibold group-hover:text-purple-300 transition-all duration-500 text-center break-words w-full leading-tight transform group-hover:scale-105">
                Manage
              </span>
              <p className="text-gray-500 text-xs text-center mt-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-y-1">
                Add or edit
              </p>
            </div>
          </div>
        </div>

        {/* Professional Footer Note */}
        <div className="mt-8 sm:mt-12 text-center transform transition-all duration-700 delay-500">
          <p className="text-gray-500 text-sm transform transition-all duration-500 hover:scale-105">
            Select a profile to start your experience
          </p>
        </div>
      </div>

      {/* Create Kid Profile Modal */}
      {showAddModal && (
        <CreateKidProfileModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleProfileCreated}
        />
      )}
    </>
  );
};

export default ProfileSelector;