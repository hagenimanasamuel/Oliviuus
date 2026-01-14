import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
import i18n from "../i18n/i18n";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("lang") || "rw"
  );
  const [kidProfile, setKidProfile] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [availableKidProfiles, setAvailableKidProfiles] = useState([]);
  const [familyMemberData, setFamilyMemberData] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [hasMadeProfileSelection, setHasMadeProfileSelection] = useState(
    () => localStorage.getItem('hasMadeProfileSelection') === 'true'
  );
  const [userSessions, setUserSessions] = useState([]);
  const [kidProfiles, setKidProfiles] = useState([]);

  const refreshAuth = async () => {
    try {
      await loadUserData();
      return true;
    } catch (error) {
      console.error("refreshAuth failed:", error);
      return false;
    }
  };

  const applyLanguage = (userData) => {
    const lang = userData?.preferences?.language || currentLanguage;
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const setProfileSelectionMade = (value) => {
    setHasMadeProfileSelection(value);
    if (value) {
      localStorage.setItem('hasMadeProfileSelection', 'true');
    } else {
      localStorage.removeItem('hasMadeProfileSelection');
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/me", {
        withCredentials: true
      });
      
      console.log("🔍 FetchUser response:", res.data);
      
      if (res.data && (res.data.success || res.data.id)) {
        const data = res.data;
        
        // ✅ COMPATIBILITY: Handle both old and new response formats
        let userData, preferences, subscription, sessions, kidProfilesList, currentSession;
        
        // OLD FORMAT (has sessions at root level)
        if (data.sessions && data.current_session_token) {
          userData = {
            id: data.id,
            email: data.email,
            role: data.role,
            username: data.username,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            profile_avatar_url: data.profile_avatar_url,
            created_at: data.created_at,
            updated_at: data.updated_at,
            email_verified: data.email_verified,
            phone_verified: data.phone_verified,
            sessions: data.sessions,
            current_session_token: data.current_session_token,
            preferences: data.preferences
          };
          preferences = data.preferences;
          sessions = data.sessions;
        } 
        // NEW FORMAT (structured response)
        else if (data.success && data.user) {
          userData = data.user;
          preferences = data.preferences;
          subscription = data.subscription;
          sessions = data.sessions || data.user.sessions || [];
          kidProfilesList = data.kid_profiles || [];
          currentSession = data.current_session;
          
          // Ensure sessions are in userData for UserSessions component
          if (!userData.sessions) {
            userData.sessions = sessions;
          }
          if (!userData.current_session_token && data.user.current_session_token) {
            userData.current_session_token = data.user.current_session_token;
          }
        }
        
        if (!userData) {
          setUser(null);
          return null;
        }

        // Merge preferences with user data
        const mergedUser = {
          ...userData,
          preferences: preferences || {}
        };

        setUser((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(mergedUser)) {
            applyLanguage(mergedUser);
            return mergedUser;
          }
          return prev;
        });

        // Set other data
        setSubscriptionData(subscription);
        setKidProfiles(kidProfilesList || []);
        setUserSessions(sessions || []);

        // Check if user is a family member
        if (userData.is_family_member || userData.family_owner_id) {
          const familyData = {
            family_owner_id: userData.family_owner_id,
            member_role: userData.member_role,
            dashboard_type: userData.dashboard_type,
            family_members: data.family_members || []
          };
          setFamilyMemberData(familyData);
        } else {
          setFamilyMemberData(null);
        }

        // Return data for further processing
        return {
          user: mergedUser,
          currentSession,
          subscription,
          kidProfiles: kidProfilesList,
          sessions: sessions,
          isFamilyMember: userData.is_family_member || userData.family_owner_id,
          familyData: (userData.is_family_member || userData.family_owner_id) ? {
            family_owner_id: userData.family_owner_id,
            member_role: userData.member_role,
            dashboard_type: userData.dashboard_type
          } : null
        };
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
      return null;
    }
  };

  // ✅ OLD checkSessionMode function (for compatibility)
  const checkSessionMode = async () => {
    try {
      const res = await axios.get("/kids/current", {
        withCredentials: true
      });

      // Handle family members with kid dashboard
      if (res.data && res.data.active_kid_profile?.is_family_member) {
        setKidProfile(res.data.active_kid_profile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile: res.data.active_kid_profile };
      }

      // Regular kid mode check
      if (res.data && res.data.session_mode === 'kid' && res.data.active_kid_profile) {
        setKidProfile(res.data.active_kid_profile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile: res.data.active_kid_profile };
      } else {
        setKidProfile(null);
        return { isKidMode: false, kidProfile: null };
      }
    } catch (error) {
      console.error("Session mode check error:", error);
      setKidProfile(null);
      return { isKidMode: false, kidProfile: null };
    }
  };

  // ✅ OLD checkProfileSelectionRequired function
  const checkProfileSelectionRequired = async () => {
    try {
      const selectionRes = await axios.get("/kids/check-selection", {
        withCredentials: true
      });
      return selectionRes.data.requires_profile_selection;
    } catch (error) {
      return false;
    }
  };

  // ✅ OLD getAvailableProfiles function
  const getAvailableProfiles = async () => {
    try {
      const profilesRes = await axios.get("/profile/profiles/available", {
        withCredentials: true
      });

      if (profilesRes.data.success) {
        const profiles = profilesRes.data.profiles || [];
        const mainAccount = profiles.find(p => p.type === 'adult' || p.type === 'main');
        const kidProfiles = profiles.filter(p => p.type === 'kid');
        const cleanProfiles = [];

        if (mainAccount) {
          cleanProfiles.push({
            ...mainAccount,
            display_name: 'My Account',
            name: 'My Account',
            type: 'main',
            description: 'Full access to all features'
          });
        }

        const formattedKidProfiles = kidProfiles.map(kid => ({
          ...kid,
          display_name: kid.name,
          description: 'Kids mode'
        }));

        cleanProfiles.push(...formattedKidProfiles);
        setAvailableKidProfiles(cleanProfiles);
        return cleanProfiles;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  // ✅ OLD determineDashboardType function
  const determineDashboardType = (userData, familyData, sessionInfo) => {
    // If family member with kid dashboard type
    if (familyData && familyData.dashboard_type === 'kid') {
      return 'kid';
    }
    
    // If in kid mode via session
    if (sessionInfo.isKidMode) return 'kid';

    // Regular user dashboard types
    if (userData.role === 'admin') return 'admin';
    return 'viewer';
  };

  // ✅ OLD loadUserData function structure
  const loadUserData = async () => {
    try {
      setLoading(true);
      const result = await fetchUser();

      if (result && result.user) {
        const familyData = result.familyData;
        const sessionInfo = await checkSessionMode();
        
        // IMPORTANT: If family member with kid dashboard, create kid profile
        if (familyData && familyData.dashboard_type === 'kid' && !sessionInfo.kidProfile) {
          const simulatedKidProfile = {
            is_family_member: true,
            family_owner_id: familyData.family_owner_id,
            member_role: familyData.member_role,
            dashboard_type: 'kid',
            name: result.user.email?.split('@')[0] || 'Kid',
            max_age_rating: '7+',
            id: result.user.id
          };
          setKidProfile(simulatedKidProfile);
          setShowProfileSelector(false);
          setProfileSelectionMade(true);
          
          // Update sessionInfo for dashboard type determination
          sessionInfo.isKidMode = true;
          sessionInfo.kidProfile = simulatedKidProfile;
        }
        
        const dashboardType = determineDashboardType(result.user, familyData, sessionInfo);

        if (dashboardType === 'kid') {
          setShowProfileSelector(false);
          setProfileSelectionMade(true);
        } else {
          if (result.user.role === 'viewer' && !hasMadeProfileSelection) {
            const requiresSelection = await checkProfileSelectionRequired();
            const profiles = await getAvailableProfiles();

            if (requiresSelection && profiles.length > 0) {
              setShowProfileSelector(true);
            } else {
              setShowProfileSelector(false);
              if (!requiresSelection) {
                setProfileSelectionMade(true);
              }
            }
          } else {
            setShowProfileSelector(false);
          }
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ OLD enterKidMode function
  const enterKidMode = async (kidProfileId) => {
    try {
      const res = await axios.post("/kids/enter", {
        kid_profile_id: kidProfileId
      }, { withCredentials: true });

      if (res.data.success) {
        await loadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error entering kid mode:", error);
      return false;
    }
  };

  // ✅ OLD exitKidMode function
  const exitKidMode = async () => {
    try {
      const res = await axios.post("/kids/exit", {}, {
        withCredentials: true
      });

      if (res.data.success) {
        await loadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error exiting kid mode:", error);
      return false;
    }
  };

  // ✅ OLD handleProfileSelection function
  const handleProfileSelection = async (profile) => {
    setShowProfileSelector(false);
    setProfileSelectionMade(true);

    if (profile.type === 'main') {
      window.location.href = "/";
    } else {
      await enterKidMode(profile.id);
    }
  };

  const showProfileSelection = async () => {
    try {
      const profiles = await getAvailableProfiles();
      if (profiles.length > 0) {
        setShowProfileSelector(true);
      }
    } catch (error) {
      console.error("Error loading profiles for selection:", error);
    }
  };

  const hideProfileSelection = () => {
    setShowProfileSelector(false);
  };

  // ✅ OLD loginUser function
  const loginUser = async (userData) => {
    setUser(userData);
    applyLanguage(userData);
    setKidProfile(null);
    setFamilyMemberData(null);
    setShowProfileSelector(false);
    setAvailableKidProfiles([]);
    setProfileSelectionMade(false);

    try {
      const selectionRes = await axios.get("/kids/check-selection", {
        withCredentials: true
      });

      if (selectionRes.data.requires_profile_selection) {
        const profiles = await getAvailableProfiles();
        if (profiles.length > 0) {
          setAvailableKidProfiles(profiles);
          setShowProfileSelector(true);
        }
      }
    } catch (error) {
      setShowProfileSelector(false);
    }
  };

  // ✅ OLD logoutUser function
  const logoutUser = async () => {
    try {
      if (kidProfile) {
        await exitKidMode();
      }
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setKidProfile(null);
    setFamilyMemberData(null);
    setSubscriptionData(null);
    setShowProfileSelector(false);
    setAvailableKidProfiles([]);
    setUserSessions([]);
    setKidProfiles([]);
    setProfileSelectionMade(false);
    applyLanguage(null);
    
    // Clear token cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    if (!user) {
      localStorage.setItem("lang", lang);
    }
  };

  // ✅ Get active sessions for UserSessions component
  const getActiveSessions = () => {
    return userSessions.filter(session => session.is_active);
  };

  // ✅ Helper functions for sessions
  const terminateSession = async (sessionId) => {
    try {
      const res = await axios.post(`/user/sessions/logout`, 
        { session_id: sessionId },
        { withCredentials: true }
      );
      
      if (res.data.success) {
        await loadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error terminating session:", error);
      return false;
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      const res = await axios.post("/user/sessions/logout-all", {}, {
        withCredentials: true
      });
      
      if (res.data.success) {
        await loadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error terminating all sessions:", error);
      return false;
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // ✅ Combined kid mode check - includes family members with kid dashboard
  const isKidMode = !!kidProfile || (familyMemberData && familyMemberData.dashboard_type === 'kid');

  const contextValue = {
    // OLD AuthContext properties (for compatibility)
    user,
    loading,
    loginUser,
    logoutUser,
    currentLanguage,
    changeLanguage,
    refreshUser: loadUserData,
    refreshAuth: refreshAuth,
    kidProfile,
    isKidMode,
    showProfileSelector,
    availableKidProfiles,
    enterKidMode,
    exitKidMode,
    showProfileSelection,
    hideProfileSelection,
    familyMemberData,
    selectProfile: handleProfileSelection,
    
    // NEW properties
    subscription: subscriptionData,
    sessions: userSessions,
    activeSessions: getActiveSessions(),
    kidProfiles: kidProfiles,
    
    // Helper functions
    terminateSession,
    terminateAllOtherSessions,
    updateUserProfile: async (profileData) => {
      try {
        const res = await axios.put("/user/profile", profileData, {
          withCredentials: true
        });
        if (res.data.success) {
          await loadUserData();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating profile:", error);
        return false;
      }
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);