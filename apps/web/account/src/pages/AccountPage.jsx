import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { 
  User, Mail, Phone, Calendar, Shield, LogOut, 
  Edit, Key, Globe, CreditCard, Bell, Settings,
  CheckCircle, XCircle, Clock, UserCheck, Users,
  Monitor, Tablet, Smartphone, MapPin, Crown,
  Eye, EyeOff, Lock
} from "lucide-react";

const AccountPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [accountStats, setAccountStats] = useState({
    unreadNotifications: 0,
    activeSessions: 0,
    kidProfiles: 0,
    familyMembers: 0
  });

  // Detect theme
  useEffect(() => {
    const detectTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    };

    detectTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);

    return () => mediaQuery.removeEventListener('change', detectTheme);
  }, []);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/me", { withCredentials: true });
      
      if (response.data.success) {
        const data = response.data;
        setUserData(data.user);
        
        // Update account stats
        setAccountStats({
          unreadNotifications: data.notifications?.unread_count || 0,
          activeSessions: data.sessions?.filter(s => s.is_active)?.length || 0,
          kidProfiles: data.kid_profiles?.length || 0,
          familyMembers: data.family_members?.length || 0
        });
        
        // Set user preferences
        if (data.preferences?.language) {
          // Apply language if needed
        }
      } else {
        setError("Failed to load account information");
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      if (err.response?.status === 401) {
        // Not logged in, redirect to auth
        navigate("/auth");
      } else {
        setError("Failed to load account information. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      // Clear any client-side state
      setUserData(null);
      // Redirect to home page
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect even if logout fails
      navigate("/");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'smartphone':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
      case 'pc':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getSubscriptionBadgeColor = (planType) => {
    switch (planType?.toLowerCase()) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'family':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pro':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
          }`}>
            <Crown className="w-3 h-3" />
            Administrator
          </div>
        );
      case 'owner':
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
          }`}>
            <Users className="w-3 h-3" />
            Family Owner
          </div>
        );
      default:
        return (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>
            <User className="w-3 h-3" />
            Member
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Oops!</h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => navigate("/auth")}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No user data available</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Account - Oliviuus</title>
        <meta name="description" content="Manage your Oliviuus account, profile, and settings" />
      </Helmet>

      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Header */}
        <div className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">My Account</h1>
                <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Manage your profile and settings
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="font-medium">{userData.first_name} {userData.last_name}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {userData.oliviuus_id}
                  </p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 border border-red-800' 
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex flex-wrap gap-2">
              {["overview", "profile", "security", "subscription", "sessions", "family"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab === "overview" && "Overview"}
                  {tab === "profile" && "Profile"}
                  {tab === "security" && "Security"}
                  {tab === "subscription" && "Subscription"}
                  {tab === "sessions" && "Sessions"}
                  {tab === "family" && "Family"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - User Summary */}
            <div className="lg:col-span-1">
              <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                {/* Profile Header */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <img
                      src={userData.profile_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.oliviuus_id}`}
                      alt="Profile"
                      className="w-32 h-32 rounded-full mx-auto border-4 border-purple-500"
                    />
                    <button className={`absolute bottom-2 right-2 p-2 rounded-full ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                    } shadow-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h2 className="text-xl font-bold mt-4">
                    {userData.first_name} {userData.last_name}
                  </h2>
                  <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    @{userData.username}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    {getRoleBadge(userData.role)}
                    {userData.is_family_member && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                      }`}>
                        <Users className="w-3 h-3" />
                        Family Member
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Stats */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide">Account Overview</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {accountStats.kidProfiles}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kid Profiles</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {accountStats.familyMembers}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Family Members</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {accountStats.activeSessions}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Sessions</div>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {accountStats.unreadNotifications}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notifications</div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member Since</span>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{formatDate(userData.created_at)}</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {accountStats.meta?.account_age_days || 'New'} days
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Active</span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{formatDateTime(userData.last_active_at || userData.last_login_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Welcome Card */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-purple-500" />
                      Welcome to Your Account
                    </h3>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Hello {userData.first_name}! Here's a quick overview of your account status and information.
                    </p>
                  </div>

                  {/* Account Details Card */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">Account Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Info */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide">Personal Information</h4>
                        
                        <div>
                          <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Oliviuus ID</label>
                          <div className="mt-1 font-mono text-lg font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            {userData.oliviuus_id}
                          </div>
                        </div>

                        <div>
                          <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Full Name</label>
                          <div className="mt-1 font-medium flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {userData.first_name} {userData.last_name || ''}
                          </div>
                        </div>

                        {userData.date_of_birth && (
                          <div>
                            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date of Birth</label>
                            <div className="mt-1 font-medium flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {formatDate(userData.date_of_birth)}
                            </div>
                          </div>
                        )}

                        {userData.gender && (
                          <div>
                            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gender</label>
                            <div className="mt-1 font-medium capitalize">
                              {userData.gender}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact & Verification */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wide">Contact & Verification</h4>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</label>
                            {userData.email_verified ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                                <XCircle className="w-3 h-3" />
                                Not Verified
                              </span>
                            )}
                          </div>
                          <div className="mt-1 font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {userData.email || "Not set"}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</label>
                            {userData.phone_verified ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : userData.phone ? (
                              <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                                <XCircle className="w-3 h-3" />
                                Not Verified
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {userData.phone || "Not set"}
                          </div>
                        </div>

                        <div>
                          <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                          <div className="mt-1 font-medium">
                            @{userData.username}
                          </div>
                        </div>

                        <div>
                          <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account Status</label>
                          <div className="mt-1 flex items-center gap-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                              userData.is_active
                                ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                                : isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${userData.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              {userData.is_active ? 'Active' : 'Inactive'}
                            </div>
                            {userData.is_locked && (
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                              }`}>
                                <Shield className="w-3 h-3" />
                                Locked
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button className={`p-4 rounded-lg text-left transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                            <Edit className="w-5 h-5" />
                          </div>
                          <span className="font-medium">Edit Profile</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Update your personal information
                        </p>
                      </button>

                      <button className={`p-4 rounded-lg text-left transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                            <Key className="w-5 h-5" />
                          </div>
                          <span className="font-medium">Change Password</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Update your account password
                        </p>
                      </button>

                      <button className={`p-4 rounded-lg text-left transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-600'}`}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <span className="font-medium">Subscription</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Manage your subscription plan
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === "sessions" && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-blue-500" />
                      Active Sessions
                    </h3>
                    
                    <div className="space-y-4">
                      {accountStats.activeSessions > 0 ? (
                        <div className="space-y-3">
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            You have {accountStats.activeSessions} active session{accountStats.activeSessions !== 1 ? 's' : ''}
                          </div>
                          {accountStats.sessions?.filter(s => s.is_active).map((session, index) => (
                            <div key={session.id || index} className={`p-4 rounded-lg border ${
                              isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  {getDeviceIcon(session.device_type)}
                                  <div>
                                    <div className="font-medium">{session.device_name || 'Unknown Device'}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {session.location || 'Location unknown'}
                                    </div>
                                  </div>
                                </div>
                                {session.session_mode === 'kid' && (
                                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                    isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    <User className="w-3 h-3" />
                                    Kid Mode
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Login Time</div>
                                  <div>{formatDateTime(session.login_time)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500 dark:text-gray-400">Last Activity</div>
                                  <div>{formatDateTime(session.last_activity)}</div>
                                </div>
                              </div>
                              
                              <button className="mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                                Terminate Session
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            No active sessions found
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subscription Tab */}
              {activeTab === "subscription" && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-500" />
                      Subscription & Billing
                    </h3>
                    
                    <div className="space-y-6">
                      <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-lg">Current Plan</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Manage your subscription and billing details
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-full font-medium ${getSubscriptionBadgeColor(userData.subscription?.plan_type)}`}>
                            {userData.subscription?.plan_name || 'Free Plan'}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                            <div className={`font-medium ${
                              userData.subscription?.has_active_subscription 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {userData.subscription?.has_active_subscription ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Plan Type</div>
                            <div className="font-medium capitalize">
                              {userData.subscription?.plan_type || 'free'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Max Profiles</div>
                            <div className="font-medium">
                              {userData.subscription?.max_profiles || 1}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Family Plan</div>
                            <div className="font-medium">
                              {userData.subscription?.is_family_plan ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>
                        
                        {userData.subscription?.end_date && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Renewal Date</div>
                            <div className="font-medium">
                              {formatDate(userData.subscription.end_date)}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
                          <div>
                            <h5 className="font-medium mb-1">Family Plan Access</h5>
                            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              {userData.subscription?.has_family_access 
                                ? 'You have access to family plan features and can add family members.'
                                : 'Upgrade to a family plan to add family members and share your subscription.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Tab */}
              {activeTab === "family" && (
                <div className="space-y-6">
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-500" />
                      Family Management
                    </h3>
                    
                    {userData.is_family_member ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
                          <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-purple-500 mt-0.5" />
                            <div>
                              <h5 className="font-medium mb-1">Family Member Account</h5>
                              <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                                You are part of a family plan managed by another account.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Member Role</div>
                            <div className="font-medium capitalize">{userData.member_role || 'member'}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Dashboard Type</div>
                            <div className="font-medium capitalize">{userData.dashboard_type || 'normal'}</div>
                          </div>
                        </div>
                      </div>
                    ) : userData.subscription?.is_family_plan ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                          <div className="flex items-start gap-3">
                            <Crown className="w-5 h-5 text-green-500 mt-0.5" />
                            <div>
                              <h5 className="font-medium mb-1">Family Plan Owner</h5>
                              <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                                You are the owner of a family plan. You can add and manage family members.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Total Family Members</div>
                            <div className="font-medium text-2xl">{accountStats.familyMembers}</div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Available Slots</div>
                            <div className="font-medium text-2xl">
                              {Math.max(0, (userData.subscription?.max_profiles || 1) - (accountStats.familyMembers + 1))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2">No Family Plan</h4>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          You don't have a family plan subscription yet.
                        </p>
                        <button className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                          Upgrade to Family Plan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile & Security Tabs - simplified for now */}
              {(activeTab === "profile" || activeTab === "security") && (
                <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                  <h3 className="text-lg font-bold mb-4 capitalize flex items-center gap-2">
                    {activeTab === "profile" ? <User className="w-5 h-5 text-blue-500" /> : <Shield className="w-5 h-5 text-red-500" />}
                    {activeTab} Settings
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {activeTab === "profile" && "Manage your profile information, preferences, and personal details."}
                    {activeTab === "security" && "Configure security settings, two-factor authentication, and login history."}
                  </p>
                  <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      This section is under development. More features coming soon!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sign Out</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to sign out of your account?
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountPage;