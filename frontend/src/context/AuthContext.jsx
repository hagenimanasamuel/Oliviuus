import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "../api/axios";
import i18n from "../i18n/i18n"; // your i18n instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem("lang") || "rw"
  );

  // Apply language globally
  const applyLanguage = (userData) => {
    const lang = userData?.preferences?.language || currentLanguage;
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    if (!userData) localStorage.setItem("lang", lang);
  };

  // Fetch user from backend
  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/me", { withCredentials: true });
      setUser(res.data); // backend returns full user object including sessions
      applyLanguage(res.data); // apply language from backend
    } catch (err) {
      setUser(null);
      applyLanguage(null); // fallback to localStorage/default
    } finally {
      setLoading(false);
    }
  };

  // Call once on mount and set interval to refresh user
  useEffect(() => {
    fetchUser(); // initial load

    const interval = setInterval(() => {
      fetchUser(); // refresh every 10 seconds
    }, 10000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // After login, update user immediately
  const loginUser = (userData) => {
    setUser(userData);
    applyLanguage(userData);
  };

  // After logout
  const logoutUser = () => {
    setUser(null);
    applyLanguage(null);
  };

  // Manual language change (e.g., from dropdown)
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    if (!user) localStorage.setItem("lang", lang);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        logoutUser,
        currentLanguage,
        changeLanguage,
        refreshUser: fetchUser, // expose for manual refresh if needed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
