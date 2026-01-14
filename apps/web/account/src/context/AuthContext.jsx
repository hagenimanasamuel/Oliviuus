import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
// import i18n from "../i18n/i18n";

// Debug configuration
const DEBUG = process.env.NODE_ENV === 'development';
const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || "http://localhost:5000";

// Debug logger
const debugLog = (message, data = null, type = 'info') => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    const styles = {
      info: 'color: #4CAF50; font-weight: bold;',
      warn: 'color: #FF9800; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;',
      api: 'color: #2196F3; font-weight: bold;'
    };
    
    console.log(`%c[AuthContext ${type.toUpperCase()}] ${timestamp}: ${message}`, styles[type]);
    if (data) {
      console.log('Data:', data);
    }
  }
};

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
  
  // Debug states
  const [debugInfo, setDebugInfo] = useState({
    lastApiCall: null,
    cookieStatus: null,
    authStatus: 'unknown',
    errorDetails: null
  });

  // Debug: Check if cookies are accessible
  const checkCookieStatus = () => {
    const cookies = document.cookie;
    const hasToken = cookies.includes('token=');
    const status = {
      cookiesPresent: cookies.length > 0,
      hasTokenCookie: hasToken,
      allCookies: cookies,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(prev => ({ ...prev, cookieStatus: status }));
    debugLog('Cookie status checked', status, 'info');
    
    return hasToken;
  };

  // Debug: Check if we can reach the auth service
  const checkAuthServiceReachable = async () => {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${AUTH_SERVICE_URL}/auth/health`, {
        withCredentials: true,
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;
      
      const status = {
        reachable: true,
        responseTime: `${responseTime}ms`,
        status: response.status,
        url: AUTH_SERVICE_URL,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(prev => ({ ...prev, authStatus: 'reachable' }));
      debugLog('Auth service is reachable', status, 'api');
      
      return true;
    } catch (error) {
      const status = {
        reachable: false,
        error: error.message,
        url: AUTH_SERVICE_URL,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(prev => ({ ...prev, authStatus: 'unreachable', errorDetails: error.message }));
      debugLog('Auth service is NOT reachable', status, 'error');
      
      return false;
    }
  };

  const refreshAuth = async () => {
    debugLog('refreshAuth called', null, 'info');
    try {
      await loadUserData();
      return true;
    } catch (error) {
      debugLog('refreshAuth failed', error, 'error');
      return false;
    }
  };

  const applyLanguage = (userData) => {
    const lang = userData?.preferences?.language || currentLanguage;
    // i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    if (!userData) {
      localStorage.setItem("lang", lang);
    }
    debugLog(`Language applied: ${lang}`, { userData: !!userData }, 'info');
  };

  const setProfileSelectionMade = (value) => {
    setHasMadeProfileSelection(value);
    if (value) {
      localStorage.setItem('hasMadeProfileSelection', 'true');
    } else {
      localStorage.removeItem('hasMadeProfileSelection');
    }
    debugLog(`Profile selection made: ${value}`, null, 'info');
  };

  const fetchUser = async () => {
    debugLog('fetchUser called', { hasCookie: checkCookieStatus() }, 'api');
    
    try {
      // First check if auth service is reachable
      const isReachable = await checkAuthServiceReachable();
      if (!isReachable) {
        throw new Error('Auth service is not reachable');
      }

      setDebugInfo(prev => ({ 
        ...prev, 
        lastApiCall: { 
          endpoint: '/auth/me', 
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      }));

      const res = await axios.get("/auth/me", {
        withCredentials: true,
        headers: {
          'X-Debug': 'true',
          'X-App-Name': process.env.REACT_APP_APP_NAME || 'unknown-app'
        }
      });
      
      debugLog('fetchUser response received', {
        status: res.status,
        dataStructure: Object.keys(res.data),
        hasSuccess: 'success' in res.data,
        hasUser: 'user' in res.data
      }, 'api');

      if (res.data.success) {
        const userData = res.data.user;
        const preferences = res.data.preferences;
        const subscription = res.data.subscription;
        const currentSession = res.data.current_session;
        const kidProfiles = res.data.kid_profiles || [];

        debugLog('User data parsed successfully', {
          userId: userData.id,
          email: userData.email,
          role: userData.role,
          hasPreferences: !!preferences,
          hasSubscription: !!subscription,
          sessionMode: currentSession?.mode
        }, 'info');

        // Merge user data with preferences
        const mergedUser = {
          ...userData,
          preferences: preferences
        };

        setUser((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(mergedUser)) {
            applyLanguage(mergedUser);
            return mergedUser;
          }
          return prev;
        });

        // Set subscription data
        setSubscriptionData(subscription);
        debugLog('Subscription data set', subscription, 'info');

        // Check if user is a family member
        if (userData.is_family_member) {
          setFamilyMemberData({
            family_owner_id: userData.family_owner_id,
            member_role: userData.member_role,
            dashboard_type: userData.dashboard_type
          });
          debugLog('Family member data set', {
            member_role: userData.member_role,
            dashboard_type: userData.dashboard_type
          }, 'info');
        } else {
          setFamilyMemberData(null);
        }

        // Check current session mode
        if (currentSession.mode === 'kid') {
          // Handle regular kid mode
          if (currentSession.active_kid_profile) {
            setKidProfile(currentSession.active_kid_profile);
            debugLog('Kid mode active - regular kid profile', currentSession.active_kid_profile, 'info');
          }
        } else if (userData.dashboard_type === 'kid') {
          // Handle family member with kid dashboard
          const simulatedKidProfile = {
            is_family_member: true,
            family_owner_id: userData.family_owner_id,
            member_role: userData.member_role,
            dashboard_type: 'kid',
            name: userData.first_name || userData.email?.split('@')[0] || 'Kid',
            id: userData.id,
            type: 'family_kid_dashboard'
          };
          setKidProfile(simulatedKidProfile);
          debugLog('Kid mode active - family kid dashboard', simulatedKidProfile, 'info');
        } else {
          setKidProfile(null);
          debugLog('Not in kid mode', null, 'info');
        }

        // Store kid profiles for selection
        if (kidProfiles.length > 0) {
          setAvailableKidProfiles(kidProfiles);
          debugLog(`Loaded ${kidProfiles.length} kid profiles`, kidProfiles.map(p => p.name), 'info');
        }

        setDebugInfo(prev => ({ 
          ...prev, 
          lastApiCall: { 
            ...prev.lastApiCall,
            status: 'success',
            userFound: true,
            userId: userData.id
          }
        }));

        // Check if profile selection is needed
        if (currentSession.needs_profile_selection) {
          return { 
            user: mergedUser, 
            needsSelection: true,
            sessionMode: currentSession.mode
          };
        }

        return { 
          user: mergedUser, 
          needsSelection: false,
          sessionMode: currentSession.mode
        };
      } else {
        debugLog('API returned success: false', res.data, 'warn');
        setUser(null);
        setFamilyMemberData(null);
        setKidProfile(null);
        setDebugInfo(prev => ({ 
          ...prev, 
          lastApiCall: { 
            ...prev.lastApiCall,
            status: 'failed',
            reason: 'API success false'
          }
        }));
        return null;
      }
    } catch (err) {
      debugLog('fetchUser error', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url
      }, 'error');
      
      if (err.response?.status === 401) {
        debugLog('Authentication failed (401)', {
          cookies: document.cookie,
          url: err.config?.url
        }, 'error');
        
        // Clear auth data
        setUser(null);
        setKidProfile(null);
        setFamilyMemberData(null);
        setShowProfileSelector(false);
        setProfileSelectionMade(false);
        
        // Try to clear cookie (might not work due to HttpOnly)
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        setDebugInfo(prev => ({ 
          ...prev, 
          lastApiCall: { 
            ...prev.lastApiCall,
            status: 'failed',
            reason: '401 Unauthorized',
            details: err.message
          },
          authStatus: 'unauthorized'
        }));
      } else if (err.code === 'ECONNREFUSED') {
        debugLog('Connection refused - Auth service might be down', {
          url: AUTH_SERVICE_URL,
          error: err.message
        }, 'error');
        setDebugInfo(prev => ({ 
          ...prev, 
          authStatus: 'service_down',
          errorDetails: err.message
        }));
      } else if (err.code === 'ERR_NETWORK') {
        debugLog('Network error - CORS or connectivity issue', {
          url: AUTH_SERVICE_URL,
          error: err.message
        }, 'error');
        setDebugInfo(prev => ({ 
          ...prev, 
          authStatus: 'network_error',
          errorDetails: err.message
        }));
      }
      
      return null;
    }
  };

  const loadUserData = async () => {
    debugLog('loadUserData started', { loading: true }, 'info');
    
    try {
      setLoading(true);
      setDebugInfo(prev => ({ ...prev, errorDetails: null }));
      
      const result = await fetchUser();

      if (result && result.user) {
        const dashboardType = result.user.dashboard_type === 'kid' ? 'kid' : 
                             result.sessionMode === 'kid' ? 'kid' :
                             result.user.role === 'admin' ? 'admin' : 'viewer';
        
        debugLog('Dashboard type determined', { 
          type: dashboardType,
          userRole: result.user.role,
          sessionMode: result.sessionMode
        }, 'info');
        
        if (dashboardType === 'kid') {
          setShowProfileSelector(false);
          setProfileSelectionMade(true);
          debugLog('Kid dashboard - profile selection not needed', null, 'info');
        } else {
          if (result.user.role === 'viewer' && !hasMadeProfileSelection) {
            const requiresSelection = result.needsSelection;
            debugLog('Profile selection check', {
              requiresSelection,
              hasMadeProfileSelection,
              userRole: result.user.role
            }, 'info');
            
            if (requiresSelection) {
              const profiles = await getAvailableProfiles();
              if (profiles.length > 0) {
                setShowProfileSelector(true);
                debugLog('Showing profile selector', { profileCount: profiles.length }, 'info');
              } else {
                setShowProfileSelector(false);
                debugLog('No profiles available for selection', null, 'warn');
              }
            } else {
              setShowProfileSelector(false);
              if (!requiresSelection) {
                setProfileSelectionMade(true);
              }
            }
          } else {
            setShowProfileSelector(false);
            debugLog('Profile selector hidden (not viewer or already made selection)', null, 'info');
          }
        }
      } else {
        debugLog('No user data loaded - user is not logged in', null, 'warn');
        clearAuthData();
      }
    } catch (err) {
      debugLog('Error in loadUserData', err, 'error');
      clearAuthData();
    } finally {
      setLoading(false);
      debugLog('loadUserData completed', { loading: false, user: !!user }, 'info');
    }
  };

  const clearAuthData = () => {
    debugLog('Clearing all auth data', null, 'info');
    setUser(null);
    setKidProfile(null);
    setFamilyMemberData(null);
    setSubscriptionData(null);
    setShowProfileSelector(false);
    setAvailableKidProfiles([]);
    setProfileSelectionMade(false);
    applyLanguage(null);
    
    // Try to clear cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const getAvailableProfiles = async () => {
    try {
      debugLog('Fetching available profiles', null, 'api');
      
      const res = await axios.get("/auth/me", {
        withCredentials: true
      });

      if (res.data.success) {
        const userData = res.data.user;
        const kidProfiles = res.data.kid_profiles || [];
        const cleanProfiles = [];

        // Add main account as first option
        cleanProfiles.push({
          id: userData.id,
          name: 'My Account',
          display_name: 'My Account',
          type: 'main',
          description: 'Full access to all features'
        });

        // Add kid profiles
        const formattedKidProfiles = kidProfiles.map(kid => ({
          ...kid,
          display_name: kid.name,
          description: 'Kids mode',
          type: 'kid'
        }));

        cleanProfiles.push(...formattedKidProfiles);
        setAvailableKidProfiles(cleanProfiles);
        
        debugLog('Profiles loaded successfully', {
          totalProfiles: cleanProfiles.length,
          kidProfiles: formattedKidProfiles.length
        }, 'info');
        
        return cleanProfiles;
      }
      return [];
    } catch (error) {
      debugLog('Error loading profiles', error, 'error');
      return [];
    }
  };

  const enterKidMode = async (kidProfileId) => {
    try {
      debugLog('Entering kid mode', { kidProfileId }, 'api');
      
      const res = await axios.post("/kids/enter", {
        kid_profile_id: kidProfileId
      }, { withCredentials: true });

      if (res.data.success) {
        debugLog('Successfully entered kid mode', res.data, 'info');
        await loadUserData();
        return true;
      }
      debugLog('Failed to enter kid mode - API returned false', res.data, 'warn');
      return false;
    } catch (error) {
      debugLog('Error entering kid mode', error, 'error');
      return false;
    }
  };

  const exitKidMode = async () => {
    try {
      debugLog('Exiting kid mode', null, 'api');
      
      const res = await axios.post("/kids/exit", {}, {
        withCredentials: true
      });

      if (res.data.success) {
        debugLog('Successfully exited kid mode', res.data, 'info');
        await loadUserData();
        return true;
      }
      debugLog('Failed to exit kid mode - API returned false', res.data, 'warn');
      return false;
    } catch (error) {
      debugLog('Error exiting kid mode', error, 'error');
      return false;
    }
  };

  const handleProfileSelection = async (profile) => {
    debugLog('Profile selected', profile, 'info');
    
    setShowProfileSelector(false);
    setProfileSelectionMade(true);

    if (profile.type === 'main') {
      // Exit kid mode if currently in it
      if (kidProfile) {
        await exitKidMode();
      }
      window.location.href = "/";
    } else {
      await enterKidMode(profile.id);
    }
  };

  const showProfileSelection = async () => {
    try {
      debugLog('Manually showing profile selection', null, 'info');
      
      const profiles = await getAvailableProfiles();
      if (profiles.length > 0) {
        setShowProfileSelector(true);
        debugLog('Profile selector shown', { profileCount: profiles.length }, 'info');
      } else {
        debugLog('No profiles available to show', null, 'warn');
      }
    } catch (error) {
      debugLog('Error loading profiles for manual selection', error, 'error');
    }
  };

  const hideProfileSelection = () => {
    debugLog('Hiding profile selection', null, 'info');
    setShowProfileSelector(false);
  };

  const loginUser = async (userData) => {
    debugLog('Manual login called', { hasUserData: !!userData }, 'info');
    
    // After manual login, reload user data from backend
    await loadUserData();
  };

  const logoutUser = async () => {
    debugLog('Logout initiated', null, 'info');
    
    try {
      if (kidProfile) {
        debugLog('Exiting kid mode before logout', null, 'info');
        await exitKidMode();
      }
      
      debugLog('Calling auth service logout', null, 'api');
      await axios.post("/auth/logout", {}, { withCredentials: true });
      debugLog('Auth service logout successful', null, 'info');
      
    } catch (error) {
      debugLog('Error during logout process', error, 'error');
    } finally {
      clearAuthData();
      debugLog('Logout completed - auth data cleared', null, 'info');
    }
  };

  const changeLanguage = (lang) => {
    debugLog('Changing language', { from: currentLanguage, to: lang }, 'info');
    
    // i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    localStorage.setItem("lang", lang);
    
    // Update user preference if logged in
    if (user) {
      const updatedUser = { ...user, preferences: { ...user.preferences, language: lang } };
      setUser(updatedUser);
    }
  };

  // Debug: Add a method to print debug info
  const printDebugInfo = () => {
    console.group('🔍 Auth Context Debug Info');
    console.log('📅 Last updated:', new Date().toISOString());
    console.log('👤 User:', user);
    console.log('🔄 Loading:', loading);
    console.log('🍪 Cookies:', document.cookie);
    console.log('🔧 Debug Info:', debugInfo);
    console.log('🌐 Auth Service URL:', AUTH_SERVICE_URL);
    console.log('🏠 App Name:', process.env.REACT_APP_APP_NAME || 'not-set');
    console.log('👶 Kid Profile:', kidProfile);
    console.log('👨‍👩‍👧‍👦 Family Data:', familyMemberData);
    console.log('💰 Subscription:', subscriptionData);
    console.log('🎭 Show Profile Selector:', showProfileSelector);
    console.log('📋 Available Profiles:', availableKidProfiles.length);
    console.groupEnd();
  };

  // Initialize on mount
  useEffect(() => {
    debugLog('AuthProvider mounted', {
      env: process.env.NODE_ENV,
      authServiceUrl: AUTH_SERVICE_URL,
      appName: process.env.REACT_APP_APP_NAME
    }, 'info');
    
    // Check cookies immediately
    checkCookieStatus();
    
    // Load user data
    loadUserData();
    
    // Set up debug hotkey (Ctrl+Shift+D)
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        printDebugInfo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Combined kid mode check
  const isKidMode = !!kidProfile || 
    (familyMemberData && familyMemberData.dashboard_type === 'kid');

  const contextValue = {
    // Core auth data
    user,
    loading,
    
    // Auth actions
    loginUser,
    logoutUser,
    refreshUser: loadUserData,
    refreshAuth,
    
    // Profile and mode management
    kidProfile,
    isKidMode,
    showProfileSelector,
    availableKidProfiles,
    enterKidMode,
    exitKidMode,
    showProfileSelection,
    hideProfileSelection,
    familyMemberData,
    subscriptionData,
    selectProfile: handleProfileSelection,
    
    // Language
    currentLanguage,
    changeLanguage,
    
    // Debug features
    debugInfo,
    printDebugInfo,
    checkAuthServiceReachable,
    checkCookieStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      
      {/* Debug overlay in development */}
      {DEBUG && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px',
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            🔍 Auth Debug
          </div>
          <div>Status: {user ? '✅ Logged In' : '❌ Not Logged In'}</div>
          <div>User: {user ? user.email : 'None'}</div>
          <div>Cookies: {document.cookie ? '🍪 Present' : '❌ Missing'}</div>
          <div>Auth Service: {debugInfo.authStatus}</div>
          <button 
            onClick={printDebugInfo}
            style={{
              marginTop: '5px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Show Full Debug
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);