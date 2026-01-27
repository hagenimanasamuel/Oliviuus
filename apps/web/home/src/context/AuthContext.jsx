// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("lang") || "rw"
  );

  // Helper to get display name from user data
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

  // Fetch user data from /auth/me endpoint
  const fetchUser = async () => {
    try {
      console.log('🔍 Fetching user data...');
      const res = await axios.get("/auth/me", {
        withCredentials: true
      });
      
      console.log('✅ User data response:', res.data);

      let userData = res.data;
      
      if (res.data.success && res.data.user) {
        userData = res.data.user;
      }
      
      if (userData && userData.id) {
        const enhancedUserData = {
          ...userData,
          display_name: getUserDisplayName(userData)
        };

        setUser(enhancedUserData);
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
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      return null;
    }
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
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      await loadUserData();
      return true;
    } catch (error) {
      console.error("refreshAuth failed:", error);
      return false;
    }
  };

  const loginUser = async (userData) => {
    console.log('🔑 Logging in user:', {
      id: userData.id,
      username: userData.username,
      email: userData.email
    });
    
    const enhancedUserData = {
      ...userData,
      display_name: getUserDisplayName(userData)
    };
    
    setUser(enhancedUserData);
  };

  const logoutUser = async () => {
    try {
      console.log('🚪 Logging out...');
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      console.log('🧹 Clearing auth state');
      setUser(null);
    }
  };

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang);
    if (!user) {
      localStorage.setItem("lang", lang);
    }
  };

  useEffect(() => {
    console.log('🔧 AuthContext mounted, loading user data...');
    loadUserData();
  }, []);

  const userDisplayName = getUserDisplayName(user);

  const contextValue = {
    user,
    loading,
    userDisplayName,
    loginUser,
    logoutUser,
    refreshUser: loadUserData,
    refreshAuth,
    currentLanguage,
    changeLanguage,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Make sure this is exported
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};