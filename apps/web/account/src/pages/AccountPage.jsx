import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, User, Mail, Phone, Calendar, CheckCircle, 
  XCircle, Edit, Globe, Settings, Shield, Bell,
  Smartphone, Monitor, ExternalLink, ChevronRight,
  Sparkles, Star, Key, UserCheck, BadgeCheck,
  MoreVertical, Home, Grid, LayoutDashboard
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, loading, logoutUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Apps configuration
  const apps = [
    {
      id: "oliviuus",
      name: "Oliviuus",
      description: "Main platform with all features",
      icon: Sparkles,
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
      textColor: "text-purple-600 dark:text-purple-400",
      url: "http://localhost:5173",
      status: "active",
      category: "main"
    },
    {
      id: "isanzure",
      name: "iSanzure",
      description: "Healthcare & wellness platform",
      icon: Shield,
      color: "bg-gradient-to-br from-teal-500 to-emerald-600",
      textColor: "text-teal-600 dark:text-teal-400",
      url: "http://localhost:3002",
      status: "active",
      category: "health"
    }
  ];

  // Detect theme
  useEffect(() => {
    const detectTheme = () => {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    detectTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);

    return () => mediaQuery.removeEventListener('change', detectTheme);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  const navigateToApp = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getAccountAge = () => {
    if (!user?.created_at) return "New";
    const created = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading your account...</p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center max-w-md p-8">
          <User className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
          <h1 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Account Access Required</h1>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Please sign in to access your account information.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Account • Oliviuus</title>
        <meta name="description" content="Manage your Oliviuus account and connected applications" />
      </Helmet>

      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300 dark:bg-teal-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30"></div>
        </div>

        {/* Main Content Container */}
        <div className="relative container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  My Account
                </h1>
              </div>
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage your profile and connected applications
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-lg">{user.first_name} {user.last_name}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'} Account
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveSection("profile")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                activeSection === "profile"
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveSection("apps")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                activeSection === "apps"
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              Applications
            </button>
          </div>

          {/* Profile Section */}
          {activeSection === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your account details and verification status
                      </p>
                    </div>
                    <button className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Details */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Full Name</p>
                          <p className="font-semibold text-lg">{user.first_name} {user.last_name || ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <BadgeCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Username</p>
                          <p className="font-semibold text-lg">@{user.username}</p>
                        </div>
                      </div>

                      {user.date_of_birth && (
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Calendar className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date of Birth</p>
                            <p className="font-semibold text-lg">{formatDate(user.date_of_birth)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Mail className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email Address</p>
                            {user.email_verified ? (
                              <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full">
                                <XCircle className="w-3 h-3" />
                                Unverified
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-lg truncate">{user.email || "Not set"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Phone className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone Number</p>
                            {user.phone_verified ? (
                              <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : user.phone ? (
                              <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full">
                                <XCircle className="w-3 h-3" />
                                Unverified
                              </span>
                            ) : null}
                          </div>
                          <p className="font-semibold text-lg">{user.phone || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className={`mt-8 p-6 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-gray-50 to-gray-100'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h3 className="font-bold text-lg mb-4">Account Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Account Type</p>
                        <p className="font-bold text-lg">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Standard'}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Status</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <span className="font-bold text-lg">{user.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Member Since</p>
                        <p className="font-bold text-lg">{user.created_at ? formatDate(user.created_at) : 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Account Age</p>
                        <p className="font-bold text-lg">{getAccountAge()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Sidebar */}
              <div className="space-y-8">
                {/* Profile Picture Card */}
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <img
                        src={user.profile_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}&background=6366f1&color=fff`}
                        alt="Profile"
                        className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl"
                      />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{user.first_name} {user.last_name}</h3>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>@{user.username}</p>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <UserCheck className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified User</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Key className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Change Password</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Language & Region</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Notifications</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Apps Section */}
          {activeSection === "apps" && (
            <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-3">Connected Applications</h2>
                <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Access all your connected platforms with a single account
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <div
                      key={app.id}
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 hover:border-purple-500/50' 
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      } shadow-lg hover:shadow-2xl cursor-pointer`}
                      onClick={() => navigateToApp(app.url)}
                    >
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`${app.color} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg`}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold mb-1">{app.name}</h3>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {app.description}
                              </p>
                            </div>
                          </div>
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                            app.status === 'active' 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${app.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                            {app.status === 'active' ? 'Active' : 'Maintenance'}
                          </div>
                          <span className={`text-sm font-medium ${app.textColor}`}>
                            {app.category === 'main' ? 'Primary Platform' : 'Specialized Service'}
                          </span>
                        </div>

                        <div className="mt-6 flex items-center gap-4">
                          <div className="flex-1">
                            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Platform URL</p>
                            <p className="text-sm font-mono truncate">{app.url}</p>
                          </div>
                          <button className={`px-4 py-2 rounded-xl font-medium transition-all ${
                            isDarkMode 
                              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                          }`}>
                            Launch
                          </button>
                        </div>
                      </div>

                      {/* Hover effect line */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${app.id === 'oliviuus' ? 'from-purple-600 to-indigo-600' : 'from-teal-500 to-emerald-600'} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Info */}
              <div className={`mt-10 p-6 rounded-xl ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
                    <LayoutDashboard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-2">Single Sign-On Enabled</h4>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      You can seamlessly access all connected applications with your Oliviuus account.
                      No need to sign in separately to each platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className={`mt-8 rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100'} shadow-xl`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-lg mb-3`}>
                  <Monitor className="w-6 h-6 text-purple-600" />
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Sessions</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-lg mb-3`}>
                  <Smartphone className="w-6 h-6 text-teal-600" />
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Connected Apps</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-lg mb-3`}>
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Verifications</p>
                <p className="text-2xl font-bold">{[user.email_verified, user.phone_verified].filter(Boolean).length}/2</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-white'} shadow-lg mb-3`}>
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Last Active</p>
                <p className="text-lg font-bold">{formatDateTime(user.last_active_at || user.last_login_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-8 max-w-md w-full transform transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 mb-6">
                <LogOut className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Sign Out Confirmation</h3>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to sign out of your account?
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                You'll need to sign in again to access your account.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
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