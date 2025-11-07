// src/pages/Dashboards/viewer/content/components/TabContent/CastTab.jsx
import React from 'react';
import { User, Video, Settings, Mic, Users, Camera, Music, Award, Clapperboard } from 'lucide-react';

const CastTab = ({ contentData }) => {
  const getCast = () => {
    if (contentData?.cast && Array.isArray(contentData.cast)) {
      return contentData.cast.slice(0, 12);
    } else if (contentData?.cast_crew && Array.isArray(contentData.cast_crew)) {
      return contentData.cast_crew
        .filter(person => person.role_type === 'actor')
        .slice(0, 12);
    }
    return [];
  };

  const getCrew = (roleType) => {
    if (contentData?.crew && Array.isArray(contentData.crew)) {
      return contentData.crew.filter(person => person.role_type === roleType);
    } else if (contentData?.cast_crew && Array.isArray(contentData.cast_crew)) {
      return contentData.cast_crew.filter(person => person.role_type === roleType);
    }
    return [];
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      'director': <Video className="w-4 h-4" />,
      'producer': <Settings className="w-4 h-4" />,
      'writer': <Mic className="w-4 h-4" />,
      'cinematographer': <Camera className="w-4 h-4" />,
      'composer': <Music className="w-4 h-4" />,
      'editor': <Clapperboard className="w-4 h-4" />
    };
    return roleIcons[role] || <User className="w-4 h-4" />;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'director': 'Director',
      'producer': 'Producer',
      'writer': 'Writer',
      'cinematographer': 'Cinematographer',
      'composer': 'Music Composer',
      'editor': 'Editor'
    };
    return roleNames[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <Award className="w-8 h-8 text-[#BC8BBC]" />
          Cast & Crew
        </h3>
        <p className="text-gray-400 text-lg">
          Meet the talented people behind {contentData?.title}
        </p>
      </div>

      {/* Cast Section */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-[#BC8BBC]" />
          <div>
            <h4 className="text-xl font-bold text-white">Cast</h4>
            <p className="text-gray-400 text-sm">
              {getCast().length} talented actors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {getCast().map((person, index) => (
            <div 
              key={index} 
              className="group text-center cursor-pointer transform hover:scale-105 transition-all duration-300"
            >
              {/* Profile Image */}
              <div className="relative mx-auto mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden group-hover:shadow-xl transition-all duration-300">
                  {person.profile_image_url ? (
                    <img
                      src={person.profile_image_url}
                      alt={person.full_name || person.display_name}
                      className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center ${person.profile_image_url ? 'hidden' : 'flex'}`}>
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Hover effect ring */}
                <div className="absolute inset-0 rounded-full border-2 border-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110" />
              </div>

              {/* Name and Character */}
              <div className="space-y-1">
                {/* Original Name */}
                <h5 className="text-white font-semibold text-sm leading-tight group-hover:text-[#BC8BBC] transition-colors duration-200">
                  {person.full_name || person.display_name}
                </h5>
                
                {/* Display Name (if different from full name) */}
                {person.display_name && person.display_name !== person.full_name && (
                  <p className="text-[#BC8BBC] text-xs font-medium">
                    {person.display_name}
                  </p>
                )}

                {/* Character Name */}
                {person.character_name && (
                  <div className="mt-2">
                    <p className="text-gray-400 text-xs italic leading-tight">
                      as
                    </p>
                    <p className="text-gray-300 text-sm font-medium leading-tight mt-1">
                      {person.character_name}
                    </p>
                  </div>
                )}

                {/* Credit Type */}
                {person.credit_type && person.credit_type !== 'supporting' && (
                  <span className="inline-block mt-2 px-2 py-1 bg-[#BC8BBC]/20 text-[#BC8BBC] text-xs rounded-full border border-[#BC8BBC]/30">
                    {person.credit_type}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {getCast().length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No cast information available</p>
          </div>
        )}
      </div>

      {/* Crew Section */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-6 h-6 text-[#BC8BBC]" />
          <div>
            <h4 className="text-xl font-bold text-white">Production Crew</h4>
            <p className="text-gray-400 text-sm">
              The creative minds behind the production
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {['director', 'producer', 'writer', 'cinematographer', 'composer', 'editor'].map(role => {
            const crewMembers = getCrew(role);
            if (crewMembers.length === 0) return null;

            return (
              <div 
                key={role} 
                className="bg-white/5 rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  {/* Role Icon */}
                  <div className="flex-shrink-0 p-3 bg-[#BC8BBC]/20 rounded-xl group-hover:bg-[#BC8BBC]/30 transition-colors duration-300">
                    {getRoleIcon(role)}
                  </div>

                  {/* Crew Details */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-white font-semibold text-lg mb-3 group-hover:text-[#BC8BBC] transition-colors duration-200">
                      {getRoleDisplayName(role)}
                      {crewMembers.length > 1 && ` (${crewMembers.length})`}
                    </h5>

                    <div className="space-y-2">
                      {crewMembers.map((person, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                          <div className="flex-1 min-w-0">
                            {/* Original Name */}
                            <p className="text-white font-medium text-sm truncate">
                              {person.full_name || person.display_name}
                            </p>
                            
                            {/* Display Name (if different) */}
                            {person.display_name && person.display_name !== person.full_name && (
                              <p className="text-[#BC8BBC] text-xs truncate">
                                {person.display_name}
                              </p>
                            )}
                          </div>

                          {/* Role Description */}
                          {person.role_description && (
                            <span className="text-gray-400 text-xs text-right flex-shrink-0 ml-2">
                              {person.role_description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State for Crew */}
        {!['director', 'producer', 'writer', 'cinematographer', 'composer', 'editor'].some(role => getCrew(role).length > 0) && (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No crew information available</p>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 rounded-2xl border border-[#BC8BBC]/20 p-6 text-center">
        <Award className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3" />
        <h4 className="text-white font-semibold text-lg mb-2">Full Cast & Crew</h4>
        <p className="text-gray-300 text-sm">
          Explore more about the talented individuals who brought this story to life
        </p>
      </div>
    </div>
  );
};

export default CastTab;