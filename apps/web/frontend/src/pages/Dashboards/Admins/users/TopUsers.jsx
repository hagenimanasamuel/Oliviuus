import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  Activity,
  Film,
  BarChart3,
  Download,
  Filter,
  Search,
  ChevronDown,
  Award,
  Crown,
  Star,
  Target,
  TrendingDown,
  Calendar,
  Eye,
  UserCheck,
  Zap,
  Trophy,
  TrendingUp as TrendingUpIcon,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Menu,
  X,
  Mail,
  Phone,
  User as UserIcon
} from "lucide-react";
import api from "../../../../api/axios";

export default function TopUsers() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("watch_time");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [limit, setLimit] = useState(10);
  const [topUsers, setTopUsers] = useState([]);
  const [stats, setStats] = useState({
    total_watch_minutes: 0,
    total_sessions: 0,
    total_subscription_value: 0,
    avg_watch_minutes: 0,
    total_users: 0
  });
  const [engagementData, setEngagementData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [loadingEngagement, setLoadingEngagement] = useState(false);
  const [viewMode, setViewMode] = useState("detailed");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab configurations
  const tabs = [
    { id: "watch_time", label: "Watch Time", icon: Clock, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    { id: "sessions", label: "Sessions", icon: Users, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    { id: "subscription_value", label: "Revenue", icon: DollarSign, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    { id: "recent_activity", label: "Recent", icon: Activity, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    { id: "content_engagement", label: "Content", icon: Film, color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300" }
  ];

  // Period options
  const periods = [
    { id: "day", label: "24H" },
    { id: "week", label: "7D" },
    { id: "month", label: "30D" },
    { id: "year", label: "1Y" }
  ];

  useEffect(() => {
    fetchTopUsers();
    fetchSummaryData();
  }, [activeTab, selectedPeriod, limit]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return 'User';
    
    // Priority: username > full name > email prefix > phone > fallback
    if (user.username) return user.username;
    
    if (user.first_name) {
      return `${user.first_name} ${user.last_name || ''}`.trim();
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    if (user.phone) {
      return `User (${user.phone.substring(user.phone.length - 4)})`;
    }
    
    return 'User';
  };

  // Helper function to get user primary identifier
  const getUserPrimaryIdentifier = (user) => {
    if (!user) return 'No identifier';
    
    // Show the primary identifier
    if (user.email) return user.email;
    if (user.phone) return user.phone;
    if (user.username) return `@${user.username}`;
    
    return 'No identifier';
  };

  // Helper function to get user identifier type
  const getUserIdentifierType = (user) => {
    if (!user) return 'unknown';
    
    if (user.email) return 'email';
    if (user.phone) return 'phone';
    if (user.username) return 'username';
    
    return 'unknown';
  };

  // Helper function to get user identifier icon
  const getUserIdentifierIcon = (user) => {
    const type = getUserIdentifierType(user);
    switch (type) {
      case 'email': return <Mail className="h-3 w-3" />;
      case 'phone': return <Phone className="h-3 w-3" />;
      case 'username': return <UserIcon className="h-3 w-3" />;
      default: return <UserIcon className="h-3 w-3" />;
    }
  };

  const fetchTopUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/user/top-users?criteria=${activeTab}&period=${selectedPeriod}&limit=${limit}`);
      
      if (response.data.success) {
        const users = response.data.top_users || [];
        
        // Process users to add display names and identifier info
        const processedUsers = users.map(user => ({
          ...user,
          display_name: getUserDisplayName(user),
          primary_identifier: getUserPrimaryIdentifier(user),
          identifier_type: getUserIdentifierType(user),
          identifier_icon: getUserIdentifierIcon(user)
        }));
        
        setTopUsers(processedUsers);
        setStats(response.data.stats || {
          total_watch_minutes: 0,
          total_sessions: 0,
          total_subscription_value: 0,
          avg_watch_minutes: 0,
          total_users: 0
        });
      }
    } catch (error) {
      console.error("Error fetching top users:", error);
      showToast(error.response?.data?.message || "Error loading top users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEngagementData = async () => {
    try {
      setLoadingEngagement(true);
      const response = await api.get(`/user/user-engagement?period=${selectedPeriod}`);
      
      if (response.data.success) {
        const engagement = response.data.analytics || [];
        
        // Process engagement data to add user info
        const processedEngagement = engagement.map(item => ({
          ...item,
          display_name: getUserDisplayName(item),
          primary_identifier: getUserPrimaryIdentifier(item),
          identifier_type: getUserIdentifierType(item)
        }));
        
        setEngagementData(processedEngagement);
      }
    } catch (error) {
      console.error("Error fetching engagement data:", error);
    } finally {
      setLoadingEngagement(false);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const response = await api.get('/user/top-users-summary');
      if (response.data.success) {
        const summary = response.data.summary;
        
        // Process each category to add display names
        const processedSummary = {
          ...summary,
          top_by_watch_time: summary.top_by_watch_time?.map(user => ({
            ...user,
            display_name: getUserDisplayName(user)
          })) || [],
          top_by_sessions: summary.top_by_sessions?.map(user => ({
            ...user,
            display_name: getUserDisplayName(user)
          })) || [],
          top_by_subscription: summary.top_by_subscription?.map(user => ({
            ...user,
            display_name: getUserDisplayName(user)
          })) || [],
          recent_active: summary.recent_active?.map(user => ({
            ...user,
            display_name: getUserDisplayName(user)
          })) || []
        };
        
        setSummaryData(processedSummary);
      }
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  const exportToCSV = () => {
    if (topUsers.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = [
      "Rank", 
      "Display Name", 
      "Email", 
      "Phone", 
      "Username", 
      "Identifier Type",
      "Watch Time (min)", 
      "Total Sessions", 
      "Subscription Value (RWF)", 
      "Subscription Plan", 
      "Last Activity"
    ];
    
    const csvData = topUsers.map((user, index) => [
      index + 1,
      user.display_name,
      user.email || '',
      user.phone || '',
      user.username || '',
      user.identifier_type,
      user.total_watch_minutes || 0,
      user.total_sessions || 0,
      formatCurrency(user.total_subscription_value || 0, true),
      user.subscription_plan || 'none',
      user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top-users-${activeTab}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast("CSV exported successfully");
  };

  // Helper function to format currency in RWF
  const formatCurrency = (amount, plain = false) => {
    if (plain) {
      return `RWF ${Number(amount).toLocaleString()}`;
    }
    const formatted = Number(amount).toLocaleString();
    return amount >= 1000 ? `RWF ${formatted}` : `RWF ${formatted}`;
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return "bg-gradient-to-r from-yellow-500 to-yellow-600";
      case 2: return "bg-gradient-to-r from-gray-400 to-gray-500";
      case 3: return "bg-gradient-to-r from-amber-600 to-amber-700";
      default: return "bg-gray-200 dark:bg-gray-700";
    }
  };

  const getEngagementLevel = (score) => {
    if (score >= 80) return { label: "Highly Engaged", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" };
    if (score >= 60) return { label: "Engaged", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" };
    if (score >= 40) return { label: "Moderate", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" };
    if (score >= 20) return { label: "Low", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" };
    return { label: "Inactive", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" };
  };

  const getSubscriptionLevel = (value) => {
    if (value >= 10000) return { label: "Premium", icon: <Crown className="h-4 w-4" /> };
    if (value >= 5000) return { label: "Pro", icon: <Star className="h-4 w-4" /> };
    if (value >= 2000) return { label: "Standard", icon: <UserCheck className="h-4 w-4" /> };
    return { label: "Basic", icon: <Users className="h-4 w-4" /> };
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Filter users by search term across all identifier fields
  const filteredUsers = topUsers.filter(user => {
    if (searchTerm === "") return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower)) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchLower)) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchLower))
    );
  });

  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-[#BC8BBC]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 md:px-6 md:py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-[90vw] ${
          toast.type === "success" 
            ? "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]" 
            : "bg-[#FFD0D0] text-[#8A4B4B] border border-[#8A4B4B]"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          )}
          <span className="text-sm md:text-base truncate">{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="ml-2 hover:opacity-80 flex-shrink-0"
          >
            <XCircle className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Top Users Analytics
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden md:block">
              Track top-performing users by engagement, revenue, and activity
            </p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-wrap gap-2`}>
          <button
            onClick={() => setViewMode(viewMode === "detailed" ? "summary" : "detailed")}
            className="inline-flex items-center px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 w-full md:w-auto justify-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {viewMode === "detailed" ? "Summary" : "Detailed"}
          </button>
          <button
            onClick={exportToCSV}
            disabled={topUsers.length === 0}
            className="inline-flex items-center px-3 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 w-full md:w-auto justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && viewMode === "summary" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Watch Time</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.total_watch_minutes)} min
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Avg: {stats.avg_watch_minutes} min/user
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.total_sessions)}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {topUsers.length} active users
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.total_subscription_value)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {topUsers.filter(u => u.total_subscription_value > 0).length} paying users
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Engagement</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {engagementData.length > 0 
                    ? Math.round(engagementData.reduce((sum, u) => sum + (u.engagement_score || 0), 0) / engagementData.length)
                    : 0}%
                </p>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
            <button
              onClick={fetchEngagementData}
              className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {loadingEngagement ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-wrap gap-1 md:gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition text-xs md:text-sm ${
                    activeTab === tab.id
                      ? tab.color
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.charAt(0)}</span>
                </button>
              );
            })}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 md:gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 md:px-3 py-1.5 md:py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-xs md:text-sm"
              >
                {periods.map(period => (
                  <option key={period.id} value={period.id}>{period.label}</option>
                ))}
              </select>
              
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 md:px-3 py-1.5 md:py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-xs md:text-sm"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
              </select>
            </div>
            
            <button
              onClick={fetchTopUsers}
              className="inline-flex items-center px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 text-xs md:text-sm"
            >
              <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3 md:mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 md:h-4 md:w-4" />
            <input
              type="text"
              placeholder="Search users by name, email, phone, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 md:pl-10 pr-4 py-1.5 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-xs md:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Top Users Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-3 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Top {limit} Users by {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {periods.find(p => p.id === selectedPeriod)?.label} • Sorted by {activeTab.replace('_', ' ')}
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-40 md:h-64">
            <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-[#BC8BBC]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 md:p-8 text-center">
            <Trophy className="h-10 w-10 md:h-16 md:w-16 text-gray-400 mx-auto mb-2 md:mb-4" />
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">No users found</p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-500 mt-0.5">Try changing filters or search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile View */}
            <div className="md:hidden">
              <div className="space-y-3 p-3">
                {filteredUsers.map((user, index) => {
                  const engagement = getEngagementLevel(user.engagement_score || 50);
                  const subscription = getSubscriptionLevel(user.total_subscription_value || 0);
                  
                  return (
                    <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex items-center justify-center h-6 w-6 rounded-full ${getRankColor(index + 1)} text-white text-xs font-bold mr-2`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.display_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                              {user.primary_identifier}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${engagement.color}`}>
                          {engagement.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Watch Time</div>
                          <div className="font-medium">{user.total_watch_minutes || 0}m</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Sessions</div>
                          <div className="font-medium">{user.total_sessions || 0}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Revenue</div>
                          <div className="font-medium">{formatCurrency(user.total_subscription_value || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Plan</div>
                          <div className="flex items-center">
                            {subscription.icon}
                            <span className="ml-1 text-xs">{subscription.label}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => showToast(`Viewing ${user.primary_identifier}`, "info")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Details
                        </button>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop View */}
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                    Rank
                  </th>
                  <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Primary Metric
                  </th>
                  <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Additional Metrics
                  </th>
                  <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 md:px-6 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user, index) => {
                  const engagement = getEngagementLevel(user.engagement_score || 50);
                  const subscription = getSubscriptionLevel(user.total_subscription_value || 0);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <div className={`flex items-center justify-center h-7 w-7 md:h-8 md:w-8 rounded-full ${getRankColor(index + 1)} text-white font-bold text-sm`}>
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <div className="mt-1 text-center">
                            {index === 0 && <Trophy className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 mx-auto" />}
                            {index === 1 && <Award className="h-3 w-3 md:h-4 md:w-4 text-gray-400 mx-auto" />}
                            {index === 2 && <Award className="h-3 w-3 md:h-4 md:w-4 text-amber-600 mx-auto" />}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-[#E6D0E6] flex items-center justify-center mr-2 md:mr-3">
                            {user.email ? (
                              <Mail className="h-4 w-4 md:h-5 md:w-5 text-[#8A4B8A]" />
                            ) : user.phone ? (
                              <Phone className="h-4 w-4 md:h-5 md:w-5 text-[#8A4B8A]" />
                            ) : (
                              <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-[#8A4B8A]" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] md:max-w-none">
                              {user.display_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] md:max-w-none">
                              {user.primary_identifier}
                            </div>
                            <div className="flex items-center mt-0.5 space-x-2">
                              {user.email && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  <Mail className="h-2 w-2 mr-1" />
                                  Email
                                </span>
                              )}
                              {user.phone && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  <Phone className="h-2 w-2 mr-1" />
                                  Phone
                                </span>
                              )}
                              {user.username && !user.email && !user.phone && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                  <UserIcon className="h-2 w-2 mr-1" />
                                  Username
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        {activeTab === 'watch_time' && (
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                              {formatNumber(user.total_watch_minutes || 0)} min
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {user.total_unique_content || 0} unique titles
                            </div>
                          </div>
                        )}
                        {activeTab === 'sessions' && (
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                              {user.total_sessions || 0} sessions
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {user.active_sessions || 0} active
                            </div>
                          </div>
                        )}
                        {activeTab === 'subscription_value' && (
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                              {formatCurrency(user.total_subscription_value || 0)}
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                              {subscription.icon}
                              <span className="ml-1">{subscription.label}</span>
                            </div>
                          </div>
                        )}
                        {activeTab === 'recent_activity' && (
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                              {user.last_activity 
                                ? new Date(user.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Never'
                              }
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {user.daily_watch_sessions || 0} sessions today
                            </div>
                          </div>
                        )}
                        {activeTab === 'content_engagement' && (
                          <div>
                            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                              {user.total_unique_content || 0} titles
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {user.total_viewing_sessions || 0} sessions
                            </div>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3 md:px-6 md:py-4">
                        <div className="space-y-0.5 md:space-y-1">
                          <div className="flex items-center text-xs md:text-sm">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-700 dark:text-gray-300">{user.total_watch_minutes || 0}m</span>
                          </div>
                          <div className="flex items-center text-xs md:text-sm">
                            <Users className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-700 dark:text-gray-300">{user.total_sessions || 0} sessions</span>
                          </div>
                          <div className="flex items-center text-xs md:text-sm">
                            <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-700 dark:text-gray-300">{formatCurrency(user.total_subscription_value || 0)}</span>
                          </div>
                          <div className="flex items-center text-xs md:text-sm">
                            <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="space-y-1 md:space-y-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${engagement.color}`}>
                            {engagement.label}
                          </span>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Plan: {user.subscription_plan || 'none'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <button
                            onClick={() => showToast(`Viewing ${user.primary_identifier}`, "info")}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {user.email && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(user.email);
                                showToast("Email copied", "success");
                              }}
                              className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                              title="Copy Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          )}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                const menus = document.querySelectorAll('.action-menu');
                                menus.forEach(menu => menu.classList.add('hidden'));
                                e.currentTarget.nextElementSibling.classList.toggle('hidden');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <div className="action-menu hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <button
                                onClick={() => {
                                  showToast(`Analyzing ${user.display_name}'s behavior`, "info");
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analyze
                              </button>
                              <button
                                onClick={() => {
                                  if (user.email) {
                                    navigator.clipboard.writeText(user.email);
                                    showToast("Email copied", "success");
                                  } else if (user.phone) {
                                    navigator.clipboard.writeText(user.phone);
                                    showToast("Phone copied", "success");
                                  } else if (user.username) {
                                    navigator.clipboard.writeText(user.username);
                                    showToast("Username copied", "success");
                                  }
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Copy Identifier
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Analytics Section */}
      {viewMode === "detailed" && engagementData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-3 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
              Engagement Analytics
            </h3>
            <button
              onClick={fetchEngagementData}
              disabled={loadingEngagement}
              className="inline-flex items-center px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
            >
              {loadingEngagement ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Engagement Score Distribution */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">Engagement Distribution</h4>
              <div className="space-y-1 md:space-y-2">
                {[80, 60, 40, 20, 0].map((threshold, index) => {
                  const count = engagementData.filter(u => (u.engagement_score || 0) >= threshold).length;
                  const percentage = Math.round((count / engagementData.length) * 100);
                  const level = getEngagementLevel(threshold);
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${level.color.split(' ')[0]}`} />
                        <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300">{level.label}</span>
                      </div>
                      <div className="text-xs md:text-sm font-medium">{count} ({percentage}%)</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Top Engaged Users */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">Most Engaged</h4>
              <div className="space-y-2 md:space-y-3">
                {engagementData.slice(0, 5).map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-5 w-5 md:h-6 md:w-6 rounded-full flex items-center justify-center mr-2 ${getRankColor(index + 1)} text-white text-xs`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[80px] md:max-w-none">
                          {user.display_name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 hidden md:block">
                          {user.primary_identifier}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm md:text-lg font-bold text-gray-900 dark:text-white">
                      {user.engagement_score || 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Engagement Insights */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 md:p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 md:mb-3 text-sm md:text-base">Key Insights</h4>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start">
                  <TrendingUpIcon className="h-3 w-3 md:h-4 md:w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Top 20% users</span> account for 60% of watch time
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Premium users</span> have 40% higher engagement
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Daily users</span> watch 120 minutes per day
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary Section */}
      {summaryData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-3 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">Quick Leaderboards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Watch Time Leaders */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-4">
              <div className="flex items-center mb-2 md:mb-3">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500 mr-1 md:mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">Watch Time</h4>
              </div>
              <div className="space-y-1 md:space-y-2">
                {summaryData.top_by_watch_time.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center mr-1 md:mr-2 ${getRankColor(index + 1)} text-white text-xs`}>
                        {index + 1}
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70px] md:max-w-[100px]">
                        {user.display_name}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(user.total_watch_minutes)}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Session Leaders */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-4">
              <div className="flex items-center mb-2 md:mb-3">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-1 md:mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">Sessions</h4>
              </div>
              <div className="space-y-1 md:space-y-2">
                {summaryData.top_by_sessions.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center mr-1 md:mr-2 ${getRankColor(index + 1)} text-white text-xs`}>
                        {index + 1}
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70px] md:max-w-[100px]">
                        {user.display_name}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                      {user.total_sessions}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Revenue Leaders */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-4">
              <div className="flex items-center mb-2 md:mb-3">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-purple-500 mr-1 md:mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">Revenue</h4>
              </div>
              <div className="space-y-1 md:space-y-2">
                {summaryData.top_by_subscription.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center mr-1 md:mr-2 ${getRankColor(index + 1)} text-white text-xs`}>
                        {index + 1}
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70px] md:max-w-[100px]">
                        {user.display_name}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(user.total_subscription_value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recently Active */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 md:p-4">
              <div className="flex items-center mb-2 md:mb-3">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-orange-500 mr-1 md:mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white text-sm md:text-base">Recent</h4>
              </div>
              <div className="space-y-1 md:space-y-2">
                {summaryData.recent_active.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`h-4 w-4 md:h-5 md:w-5 rounded-full flex items-center justify-center mr-1 md:mr-2 ${getRankColor(index + 1)} text-white text-xs`}>
                        {index + 1}
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[70px] md:max-w-[100px]">
                        {user.display_name}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {user.last_activity 
                        ? new Date(user.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}