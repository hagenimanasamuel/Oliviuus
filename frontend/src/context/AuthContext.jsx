// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
import i18n from "../i18n/i18n";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Authentication and user state management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("lang") || "rw"
  );
  const [kidProfile, setKidProfile] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [availableKidProfiles, setAvailableKidProfiles] = useState([]);
  const [tokenVersion, setTokenVersion] = useState(0);
  const [familyMemberData, setFamilyMemberData] = useState(null);

  // Use localStorage to persist profile selection state across page reloads
  const [hasMadeProfileSelection, setHasMadeProfileSelection] = useState(
    () => localStorage.getItem('hasMadeProfileSelection') === 'true'
  );

  /**
   * Applies language preferences from user data or falls back to stored preference
   */
  const applyLanguage = (userData) => {
    const lang = userData?.preferences?.language || currentLanguage;
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    // Store language preference for non-authenticated users
    if (!userData) {
      localStorage.setItem("lang", lang);
    }
  };

  /**
   * Updates the profile selection state in both React state and localStorage
   */
  const setProfileSelectionMade = (value) => {
    setHasMadeProfileSelection(value);
    if (value) {
      localStorage.setItem('hasMadeProfileSelection', 'true');
    } else {
      localStorage.removeItem('hasMadeProfileSelection');
    }
  };

  /**
   * Fetches current user data from the server
   */
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

  /**
   * Check if user is a family member and get family data
   */
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
      console.error("Error checking family membership:", error);
      setFamilyMemberData(null);
      return null;
    }
  };

  /**
   * Retrieves and filters available profiles for selection
   */
  const getAvailableProfiles = async () => {
    try {
      const profilesRes = await axios.get("/profile/profiles/available", {
        withCredentials: true
      });

      if (profilesRes.data.success) {
        const profiles = profilesRes.data.profiles || [];

        // Find main account profile and kid profiles
        const mainAccount = profiles.find(p => p.type === 'adult' || p.type === 'main');
        const kidProfiles = profiles.filter(p => p.type === 'kid');

        // Create clean array with only one main account
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

        // Add formatted kid profiles
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
      console.error("Error loading profiles:", error);
      return [];
    }
  };

  /**
   * Checks current kid session status and updates state accordingly
   */
  const checkKidSession = async () => {
    try {
      // 🆕 Skip kid session check for family members with kid dashboard
      if (familyMemberData && familyMemberData.dashboard_type === 'kid') {
        console.log('🎯 Family member with kid dashboard - skipping kid session check');
        return { isKidMode: true, kidProfile: null };
      }

      const res = await axios.get("/kids/session/current", {
        withCredentials: true
      });

      if (res.data.is_kid_mode && res.data.kid_session) {
        setKidProfile(res.data.kid_session);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return { isKidMode: true, kidProfile: res.data.kid_session };
      } else {
        setKidProfile(null);
        return { isKidMode: false, kidProfile: null };
      }
    } catch (error) {
      // 🆕 Handle 403 errors gracefully - they're expected for non-kid users
      if (error.response?.status === 403) {
        console.log('🔒 User not in kid mode - 403 is expected');
        setKidProfile(null);
        return { isKidMode: false, kidProfile: null };
      }

      // 🆕 Handle 401 errors - user not authenticated for kid endpoints
      if (error.response?.status === 401) {
        console.log('🔒 User not authorized for kid endpoints');
        setKidProfile(null);
        return { isKidMode: false, kidProfile: null };
      }

      console.error("Error checking kid session:", error);
      setKidProfile(null);
      return { isKidMode: false, kidProfile: null };
    }
  };

  /**
   * Checks if user requires profile selection
   */
  const checkProfileSelectionRequired = async () => {
    try {
      const selectionRes = await axios.get("/profile/check-selection", {
        withCredentials: true
      });

      return selectionRes.data.success && selectionRes.data.requires_profile_selection;
    } catch (error) {
      console.error("Error checking profile selection:", error);
      return false;
    }
  };

  /**
   * Determines dashboard type based on user role and family membership
   */
  const determineDashboardType = (userData, familyData, kidSession) => {
    // If in kid mode, always use kid dashboard
    if (kidSession) return 'kid';

    // If family member with kid dashboard type
    if (familyData && familyData.dashboard_type === 'kid') {
      return 'kid';
    }

    // Regular user dashboard types
    if (userData.role === 'admin') return 'admin';
    if (userData.role === 'viewer') return 'viewer';

    return 'viewer'; // default
  };

  /**
   * Loads complete user data including profile information
   */
  const loadUserData = async () => {
    try {
      setLoading(true);

      // Fetch basic user authentication data
      const userData = await fetchUser();

      if (userData) {
        // Check family membership
        const familyData = await checkFamilyMembership(userData.id);

        // Check current kid session status
        const sessionInfo = await checkKidSession();

        // Determine dashboard type
        const dashboardType = determineDashboardType(userData, familyData, sessionInfo.kidProfile);

        console.log("Dashboard type determined:", {
          userId: userData.id,
          role: userData.role,
          familyData: !!familyData,
          dashboardType: dashboardType,
          isKidMode: sessionInfo.isKidMode
        });

        // If user should be in kid dashboard (either via kid mode or family member with kid dashboard)
        if (dashboardType === 'kid') {
          setShowProfileSelector(false);
          setProfileSelectionMade(true);

          // If family member with kid dashboard but no active kid session, simulate kid profile
          if (familyData && familyData.dashboard_type === 'kid' && !sessionInfo.isKidMode) {
            setKidProfile({
              is_family_member: true,
              family_owner_id: familyData.family_owner_id,
              member_role: familyData.member_role,
              dashboard_type: 'kid',
              kid_profile_id: `family_${userData.id}`,
              name: userData.email.split('@')[0],
              max_age_rating: '7+'
            });
          }
        } else {
          // For viewers, check if they need to select a profile
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
        // Clear all state for non-authenticated users
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

  /**
   * Enters kid mode by creating a kid session
   */
  const enterKidMode = async (kidProfileId) => {
    try {
      const res = await axios.post("/kids/session", {
        kid_profile_id: kidProfileId
      }, { withCredentials: true });

      if (res.data.success) {
        setTokenVersion(prev => prev + 1);
        setKidProfile(res.data.kid_profile);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error entering kid mode:", error);
      return false;
    }
  };

  /**
   * Exits kid mode and returns to main account
   */
  const exitKidMode = async () => {
    try {
      const res = await axios.post("/kids/session/exit", {}, {
        withCredentials: true
      });

      if (res.data.success) {
        setTokenVersion(prev => prev + 1);
        setKidProfile(null);
        setShowProfileSelector(false);
        await loadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error exiting kid mode:", error);
      return false;
    }
  };

  /**
   * Switches to main account mode (adult profile)
   */
  const selectMainAccount = async () => {
    try {
      if (kidProfile) {
        await exitKidMode();
      }

      const res = await axios.post("/profile/switch-to-adult", {}, {
        withCredentials: true
      });

      if (res.data.success) {
        setTokenVersion(prev => prev + 1);
        setKidProfile(null);
        setShowProfileSelector(false);
        setProfileSelectionMade(true);

        await loadUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error selecting main account:", error);
      return false;
    }
  };

  /**
   * Handles profile selection for both main account and kid profiles
   */
  const handleProfileSelection = async (profile) => {
    setShowProfileSelector(false);
    setProfileSelectionMade(true);

    if (profile.type === 'main') {
      window.location.href = "/";

      selectMainAccount().then(success => {
        if (!success) {
          window.location.reload();
        }
      });
    } else {
      await enterKidMode(profile.id);
    }
  };

  /**
   * Manually shows the profile selection modal
   */
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

  /**
   * Hides the profile selection modal
   */
  const hideProfileSelection = () => {
    setShowProfileSelector(false);
  };

  /**
   * Forces a refresh of authentication data
   */
  const forceRefresh = () => {
    setTokenVersion(prev => prev + 1);
  };

  /**
   * Handles user login and initializes profile selection if needed
   */
  const loginUser = async (userData) => {
    setUser(userData);
    applyLanguage(userData);

    // Reset session state on new login
    setKidProfile(null);
    setFamilyMemberData(null);
    setShowProfileSelector(false);
    setAvailableKidProfiles([]);
    setProfileSelectionMade(false);

    // Check for profile selection requirement
    try {
      const selectionRes = await axios.get("/profile/check-selection", {
        withCredentials: true
      });

      if (selectionRes.data.success && selectionRes.data.requires_profile_selection) {
        const profiles = await getAvailableProfiles();
        if (profiles.length > 0) {
          setAvailableKidProfiles(profiles);
          setShowProfileSelector(true);
        }
      }
    } catch (error) {
      console.error("Error checking profile selection:", error);
      setShowProfileSelector(false);
    }

    setTokenVersion(prev => prev + 1);
  };

  /**
   * Handles user logout with proper session cleanup
   */
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
      setTokenVersion(prev => prev + 1);
    }
  };

  /**
   * Changes application language
   */
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    if (!user) {
      localStorage.setItem("lang", lang);
    }
  };

  // Initialize authentication data on component mount
  useEffect(() => {
    loadUserData();
  }, [tokenVersion]);

  // Determine if user is in kid mode (either via kid session or family member with kid dashboard)
  const isKidMode = !!kidProfile || (familyMemberData && familyMemberData.dashboard_type === 'kid');

  // Context value providing authentication state and methods
  const contextValue = {
    // User authentication state
    user,
    loading,
    loginUser,
    logoutUser,
    currentLanguage,
    changeLanguage,
    refreshUser: loadUserData,
    forceRefresh,

    // Kid session management
    kidProfile,
    isKidMode,
    showProfileSelector,
    availableKidProfiles,
    enterKidMode,
    exitKidMode,
    showProfileSelection,
    hideProfileSelection,

    // Family member data
    familyMemberData,

    // Profile selection
    selectProfile: handleProfileSelection
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);