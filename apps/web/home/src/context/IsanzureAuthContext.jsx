// src/context/iSanzureAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const IsanzureAuthContext = createContext(); 

export const IsanzureAuthProvider = ({ children }) => { 
  const { user } = useAuth();
  const [isanzureUser, setIsanzureUser] = useState(null);
  const [userType, setUserType] = useState('tenant');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch iSanzure user data
  const fetchIsanzureUser = async () => {
    if (!user) {
      setIsanzureUser(null);
      setUserType('tenant');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/isanzure/user-info');
      
      if (response.data.success) {
        if (response.data.exists) {
          setIsanzureUser(response.data.user);
          setUserType(response.data.user.user_type);
        } else {
          setIsanzureUser(null);
          setUserType('tenant');
        }
      }
    } catch (err) {
      console.error("Error fetching iSanzure user:", err);
      setError(err.response?.data?.message || err.message);
      setIsanzureUser(null);
      setUserType('tenant');
    } finally {
      setLoading(false);
    }
  };

  const refreshIsanzureUser = async () => {
    return await fetchIsanzureUser();
  };

  const isUserType = (type) => {
    return userType === type;
  };

  const isLandlord = () => {
    return userType === 'landlord';
  };

  const isAgent = () => {
    return userType === 'agent';
  };

  const isPropertyManager = () => {
    return userType === 'property_manager';
  };

  const isTenant = () => {
    return userType === 'tenant';
  };

  const updateUserType = (newUserType) => {
    setUserType(newUserType);
  };

  useEffect(() => {
    fetchIsanzureUser();
  }, [user]);

  const contextValue = {
    isanzureUser,
    userType,
    loading,
    error,
    refreshIsanzureUser,
    isLandlord: isLandlord(),
    isAgent: isAgent(),
    isPropertyManager: isPropertyManager(),
    isTenant: isTenant(),
    isUserType,
    updateUserType,
  };

  return (
    <IsanzureAuthContext.Provider value={contextValue}>
      {children}
    </IsanzureAuthContext.Provider>
  );
};

// Custom hook
export const useIsanzureAuth = () => { 
  const context = useContext(IsanzureAuthContext);
  if (!context) {
    throw new Error('useIsanzureAuth must be used within an IsanzureAuthProvider');
  }
  return context;
};