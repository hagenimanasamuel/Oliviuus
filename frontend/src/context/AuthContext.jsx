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
  const [hasMadeProfileSelection, setHasMadeProfileSelection] = useState(
    () => localStorage.getItem('hasMadeProfileSelection') === 'true'
  );

  const applyLanguage = (userData) => {
    const lang = userData?.preferences?.language || currentLanguage;
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    if (!userData) {
      localStorage.setItem("lang", lang);
    }
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
      const newUser = res.data;

      if (newUser && newUser.id) {
        setUser((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(newUser)) {
            applyLanguage(newUser);
            return newUser;
          }
          return prev;
        });
        return newUser;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        setKidProfile(null);
        setFamilyMemberData(null);
        setShowProfileSelector(false);
        setProfileSelectionMade(false);
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      return null;
    }
  };

  const checkFamilyMembership = async (userId) => {
    try {
      const response = await axios.get(`/family/members/check/${userId}`, {
        withCredentials: true
      });

      if (response.data.success && response.data.is_family_member) {
        setFamilyMemberData(response.data.family_data);
        return response.data.family_data;
      } else {
        setFamilyMemberData(null);
        return null;
      }
    } catch (error) {
      setFamilyMemberData(null);
      return null;
    }
  };

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

  const checkSessionMode = async () => {
    try {
      console.log('🔄 Checking session mode...');
      const res = await axios.get("/kids/current", {
        withCredentials: true
      });

      console.log('📡 Session mode response:', res.data);

      // Handle family members with kid dashboard
      if (res.data && res.data.active_kid_profile?.is_family_member) {
        console.log('✅ Family member with kid dashboard detected');
        setKidProfile(res.data.active_kid_profile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile: res.data.active_kid_profile };
      }

      // Regular kid mode check
      if (res.data && res.data.session_mode === 'kid' && res.data.active_kid_profile) {
        console.log('✅ Regular kid mode detected');
        setKidProfile(res.data.active_kid_profile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile: res.data.active_kid_profile };
      } else {
        console.log('✅ Parent/normal mode detected');
        setKidProfile(null);
        return { isKidMode: false, kidProfile: null };
      }
    } catch (error) {
      console.error("❌ Session mode check error:", error);
      setKidProfile(null);
      return { isKidMode: false, kidProfile: null };
    }
  };

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

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await fetchUser();

      if (userData) {
        const familyData = await checkFamilyMembership(userData.id);
        const sessionInfo = await checkSessionMode();
        
        // IMPORTANT: If family member with kid dashboard, create kid profile
        if (familyData && familyData.dashboard_type === 'kid' && !sessionInfo.kidProfile) {
          const simulatedKidProfile = {
            is_family_member: true,
            family_owner_id: familyData.family_owner_id,
            member_role: familyData.member_role,
            dashboard_type: 'kid',
            name: userData.email.split('@')[0] || 'Kid',
            max_age_rating: '7+',
            id: userData.id
          };
          setKidProfile(simulatedKidProfile);
          setShowProfileSelector(false);
          setProfileSelectionMade(true);
          
          // Update sessionInfo for dashboard type determination
          sessionInfo.isKidMode = true;
          sessionInfo.kidProfile = simulatedKidProfile;
        }
        
        const dashboardType = determineDashboardType(userData, familyData, sessionInfo);

        if (dashboardType === 'kid') {
          setShowProfileSelector(false);
          setProfileSelectionMade(true);
        } else {
          if (userData.role === 'viewer' && !hasMadeProfileSelection) {
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
        setUser(null);
        setKidProfile(null);
        setFamilyMemberData(null);
        setShowProfileSelector(false);
        setAvailableKidProfiles([]);
        setProfileSelectionMade(false);
        applyLanguage(null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setUser(null);
      setKidProfile(null);
      setFamilyMemberData(null);
      setShowProfileSelector(false);
      setAvailableKidProfiles([]);
      setProfileSelectionMade(false);
      applyLanguage(null);
    } finally {
      setLoading(false);
    }
  };

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

  const logoutUser = async () => {
    try {
      if (kidProfile) {
        await exitKidMode();
      }
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setKidProfile(null);
      setFamilyMemberData(null);
      setShowProfileSelector(false);
      setAvailableKidProfiles([]);
      setProfileSelectionMade(false);
      applyLanguage(null);
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    if (!user) {
      localStorage.setItem("lang", lang);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Combined kid mode check - includes family members with kid dashboard
  const isKidMode = !!kidProfile || (familyMemberData && familyMemberData.dashboard_type === 'kid');

  const contextValue = {
    user,
    loading,
    loginUser,
    logoutUser,
    currentLanguage,
    changeLanguage,
    refreshUser: loadUserData,
    kidProfile,
    isKidMode,
    showProfileSelector,
    availableKidProfiles,
    enterKidMode,
    exitKidMode,
    showProfileSelection,
    hideProfileSelection,
    familyMemberData,
    selectProfile: handleProfileSelection
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);