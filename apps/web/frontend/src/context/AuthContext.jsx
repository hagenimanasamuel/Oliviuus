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
  const [authError, setAuthError] = useState(null);

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

  // Helper to get display name from new user schema
  const getUserDisplayName = (userData) => {
    if (!userData) return 'User';
    
    if (userData.username) return userData.username;
    if (userData.first_name) {
      return `${userData.first_name} ${userData.last_name || ''}`.trim();
    }
    if (userData.email) return userData.email.split('@')[0];
    if (userData.phone) return `User (${userData.phone.substring(-4)})`;
    if (userData.oliviuus_id) return `User ${userData.oliviuus_id.substring(-4)}`;
    return 'User';
  };

  const fetchUser = async () => {
    try {
      console.log('🔍 Fetching user data...');
      const res = await axios.get("/auth/me", {
        withCredentials: true
      });
      
      console.log('✅ User data response:', res.data);

      // 🆕 ADAPTED FOR NEW RESPONSE STRUCTURE
      let userData = res.data;
      
      // Handle both old and new response formats
      if (res.data.success && res.data.user) {
        userData = res.data.user;
      }
      
      if (userData && userData.id) {
        // 🆕 Add display name for new user schema
        const enhancedUserData = {
          ...userData,
          display_name: getUserDisplayName(userData)
        };

        setUser((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(enhancedUserData)) {
            applyLanguage(enhancedUserData);
            return enhancedUserData;
          }
          return prev;
        });
        
        setAuthError(null);
        return enhancedUserData;
      } else {
        console.log('❌ No valid user data in response');
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("❌ Error fetching user:", err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        setUser(null);
        setKidProfile(null);
        setFamilyMemberData(null);
        setShowProfileSelector(false);
        setProfileSelectionMade(false);
        setAuthError('session_expired');
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
      const res = await axios.get("/kids/current", {
        withCredentials: true
      });

      console.log('👶 Session mode response:', res.data);

      // 🆕 ADAPTED FOR NEW RESPONSE STRUCTURE
      let sessionData = res.data;
      if (res.data.success && res.data.data) {
        sessionData = res.data.data;
      }

      // Handle family members with kid dashboard
      if (sessionData && sessionData.active_kid_profile?.is_family_member) {
        const kidProfile = sessionData.active_kid_profile;
        setKidProfile(kidProfile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile };
      }

      // Regular kid mode check
      if (sessionData && sessionData.session_mode === 'kid' && sessionData.active_kid_profile) {
        const kidProfile = sessionData.active_kid_profile;
        setKidProfile(kidProfile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile };
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

  const checkProfileSelectionRequired = async () => {
    try {
      const selectionRes = await axios.get("/kids/check-selection", {
        withCredentials: true
      });
      
      // 🆕 ADAPTED FOR NEW RESPONSE STRUCTURE
      if (selectionRes.data.success) {
        return selectionRes.data.data?.requires_profile_selection || false;
      }
      return selectionRes.data.requires_profile_selection || false;
    } catch (error) {
      console.error("❌ Error checking profile selection:", error);
      return false;
    }
  };

  const determineDashboardType = (userData, familyData, sessionInfo) => {
    console.log('🎯 Determining dashboard type:', {
      userRole: userData?.role,
      familyDashboardType: familyData?.dashboard_type,
      isKidMode: sessionInfo?.isKidMode
    });

    // If family member with kid dashboard type
    if (familyData && familyData.dashboard_type === 'kid') {
      console.log('✅ Dashboard type: kid (family member)');
      return 'kid';
    }
    
    // If in kid mode via session
    if (sessionInfo?.isKidMode) {
      console.log('✅ Dashboard type: kid (regular session)');
      return 'kid';
    }

    // Regular user dashboard types
    if (userData?.role === 'admin') {
      console.log('✅ Dashboard type: admin');
      return 'admin';
    }
    
    // 🆕 Handle guest mode
    if (userData?.guestMode) {
      console.log('✅ Dashboard type: guest');
      return 'guest';
    }
    
    console.log('✅ Dashboard type: viewer');
    return 'viewer';
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await fetchUser();

      if (userData) {
        console.log('👤 User data loaded:', {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role
        });

        const familyData = await checkFamilyMembership(userData.id);
        const sessionInfo = await checkSessionMode();
        
        console.log('📋 Session info:', sessionInfo);
        console.log('🏠 Family data:', familyData);
        
        // IMPORTANT: If family member with kid dashboard, create kid profile
        if (familyData && familyData.dashboard_type === 'kid' && !sessionInfo.kidProfile) {
          console.log('👶 Creating simulated kid profile for family member');
          
          const simulatedKidProfile = {
            is_family_member: true,
            family_owner_id: familyData.family_owner_id,
            member_role: familyData.member_role,
            dashboard_type: 'kid',
            name: getUserDisplayName(userData),
            display_name: getUserDisplayName(userData),
            max_age_rating: '7+',
            id: userData.id,
            // Include user identifiers
            user_id: userData.id,
            oliviuus_id: userData.oliviuus_id,
            username: userData.username,
            email: userData.email
          };
          
          setKidProfile(simulatedKidProfile);
          setShowProfileSelector(false);
          setProfileSelectionMade(true);
          
          // Update sessionInfo for dashboard type determination
          sessionInfo.isKidMode = true;
          sessionInfo.kidProfile = simulatedKidProfile;
        }
        
        const dashboardType = determineDashboardType(userData, familyData, sessionInfo);
        console.log('🎯 Final dashboard type:', dashboardType);

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
      console.log('👶 Entering kid mode for profile:', kidProfileId);
      const res = await axios.post("/kids/enter", {
        kid_profile_id: kidProfileId
      }, { withCredentials: true });

      console.log('✅ Enter kid mode response:', res.data);

      // 🆕 ADAPTED FOR NEW RESPONSE STRUCTURE
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
      console.log('👋 Exiting kid mode...');
      const res = await axios.post("/kids/exit", {}, {
        withCredentials: true
      });

      console.log('✅ Exit kid mode response:', res.data);

      // 🆕 ADAPTED FOR NEW RESPONSE STRUCTURE
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
    console.log('🎯 Profile selected:', profile);
    setShowProfileSelector(false);
    setProfileSelectionMade(true);

    if (profile.type === 'main') {
      console.log('🔄 Redirecting to main account...');
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
    console.log('🔑 Logging in user:', {
      id: userData.id,
      username: userData.username,
      email: userData.email
    });
    
    // 🆕 Add display name for new schema
    const enhancedUserData = {
      ...userData,
      display_name: getUserDisplayName(userData)
    };
    
    setUser(enhancedUserData);
    applyLanguage(enhancedUserData);
    setKidProfile(null);
    setFamilyMemberData(null);
    setShowProfileSelector(false);
    setAvailableKidProfiles([]);
    setProfileSelectionMade(false);
    setAuthError(null);

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
        console.log('👋 Exiting kid mode first...');
        await exitKidMode();
      }
      
      console.log('🚪 Logging out...');
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      console.log('🧹 Clearing auth state');
      setUser(null);
      setKidProfile(null);
      setFamilyMemberData(null);
      setShowProfileSelector(false);
      setAvailableKidProfiles([]);
      setProfileSelectionMade(false);
      applyLanguage(null);
      setAuthError(null);
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    if (!user) {
      localStorage.setItem("lang", lang);
    }
  };

  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    console.log('🔧 AuthContext mounted, loading user data...');
    loadUserData();
  }, []);

  // Combined kid mode check
  const isKidMode = !!kidProfile || (familyMemberData && familyMemberData.dashboard_type === 'kid');
  
  // 🆕 Check guest mode
  const isGuestMode = user?.guestMode || false;
  
  // 🆕 Get user display name
  const userDisplayName = getUserDisplayName(user);

  const contextValue = {
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
    isGuestMode, // 🆕
    showProfileSelector,
    availableKidProfiles,
    enterKidMode,
    exitKidMode,
    showProfileSelection,
    hideProfileSelection,
    familyMemberData,
    selectProfile: handleProfileSelection,
    userDisplayName, // 🆕
    authError, // 🆕
    clearAuthError // 🆕
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);