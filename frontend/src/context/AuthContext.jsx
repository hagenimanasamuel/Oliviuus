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

    if (!userData) {
      localStorage.setItem("lang", lang);
    }
  };

  // Fetch user only if logged in (cookies/session exists)
  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/me", { withCredentials: true });
      const newUser = res.data;

      if (newUser && newUser.id) {
        setUser((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(newUser)) {
            applyLanguage(newUser);
            return newUser;
          }
          return prev;
        });
      } else {
        // no user → fallback to localStorage language
        setUser(null);
        applyLanguage(null);
      }
    } catch (err) {
      setUser(null);
      applyLanguage(null); // fallback to localStorage/default
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser(); // initial check
    const interval = setInterval(() => {
      if (user) {
        // ✅ only refresh if logged in
        fetchUser();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

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

  // Manual language change
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    if (!user) {
      localStorage.setItem("lang", lang);
    }
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
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
