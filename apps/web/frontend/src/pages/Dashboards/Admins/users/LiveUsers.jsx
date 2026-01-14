// frontend/src/components/dashboard/LiveUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, Activity, Map, BarChart3, AlertTriangle, Globe, Clock, 
  Eye, Smartphone, Tv, Tablet, Monitor, RefreshCw, Zap, Wifi, 
  WifiOff, Download, Filter, Search, X, CheckCircle, AlertCircle 
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import socketService from "../../../../utils/socket";
import api from "../../../../api/axios";

export default function LiveUsers() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState("overview");
  const [liveStats, setLiveStats] = useState(null);
  const [liveUsers, setLiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_type: "",
    device_type: "",
    session_type: "",
    country_code: "",
    content_type: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 0
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || '{}');
    
    if (token && user.role === 'admin') {
      socketService.connect(token);
      
      const socket = socketService.getSocket();
      if (socket) {
        setSocketConnected(socket.connected);
        
        socket.on('connect', () => {
          setSocketConnected(true);
          console.log('Socket connected for LiveUsers');
          // Join admin room when connected
          socketService.joinAdminRoom();
        });
        
        socket.on('disconnect', () => {
          setSocketConnected(false);
        });
      }
    }

    return () => {
      // Don't disconnect globally, just remove listeners
      if (socketService.getSocket()) {
        socketService.off('live_stats_update');
        socketService.off('user_activity_update');
      }
    };
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleLiveStatsUpdate = (event) => {
      const data = event.detail;
      setLiveStats(prev => ({
        ...prev,
        total_live_users: data.total_live || 0,
        session_types: [
          { session_type: 'viewing', count: data.viewing || 0 },
          { session_type: 'browsing', count: data.browsing || 0 },
          { session_type: 'idle', count: data.idle || 0 }
        ],
        device_types: data.device_types || [],
        geographic_distribution: data.geographic_distribution || [],
        peak_today: data.peak_today || { users: 0, time: 'N/A' },
        active_users_list: data.active_users || []
      }));
      setLastUpdate(new Date());
    };

    const handleUserActivityUpdate = (event) => {
      const data = event.detail;
      
      // Update live users list in real-time
      if (data.activity === 'left') {
        setLiveUsers(prev => prev.filter(user => user.session_id !== data.sessionId));
      } else if (data.activity === 'joined') {
        // Add new user if not already in list
        setLiveUsers(prev => {
          if (!prev.some(user => user.session_id === data.sessionId)) {
            return [...prev, {
              session_id: data.sessionId,
              user_id: data.userId,
              user_type: data.metadata?.user_type || 'anonymous',
              session_type: data.metadata?.session_type || 'browsing',
              device_type: data.metadata?.device_type || 'web',
              device_name: data.metadata?.device_name || 'Unknown',
              ip_address: data.metadata?.ip_address,
              country_code: data.metadata?.country_code,
              region: data.metadata?.region,
              city: data.metadata?.city,
              content_title: data.metadata?.content_title,
              content_type: data.metadata?.content_type,
              last_activity: data.timestamp,
              joined_at: data.timestamp
            }];
          }
          return prev;
        });
      } else if (data.activity === 'activity') {
        // Update existing user activity
        setLiveUsers(prev => prev.map(user => {
          if (user.session_id === data.sessionId) {
            return {
              ...user,
              session_type: data.metadata?.session_type || user.session_type,
              content_title: data.metadata?.content_title || user.content_title,
              content_type: data.metadata?.content_type || user.content_type,
              last_activity: data.timestamp,
              ...data.metadata
            };
          }
          return user;
        }));
      }
    };

    window.addEventListener('live_stats_update', handleLiveStatsUpdate);
    window.addEventListener('user_activity_update', handleUserActivityUpdate);

    return () => {
      window.removeEventListener('live_stats_update', handleLiveStatsUpdate);
      window.removeEventListener('user_activity_update', handleUserActivityUpdate);
    };
  }, []);

  // Fetch initial data using axios
  const fetchLiveStats = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get("/user/live/overview");
      if (response.data.success) {
        setLiveStats(response.data.overview);
        setLastUpdate(new Date());
      } else {
        setError(response.data.message || "Failed to fetch live stats");
      }
    } catch (error) {
      console.error("Error fetching live stats:", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Failed to connect to server. Please check your API endpoint."
      );
    }
  }, []);

  // Fetch live users using axios
  const fetchLiveUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      const response = await api.get("/user/live/users", { params });
      
      if (response.data.success) {
        setLiveUsers(response.data.live_users);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          total_pages: response.data.total_pages
        }));
        setLastUpdate(new Date());
      } else {
        setError(response.data.message || "Failed to fetch live users");
      }
    } catch (error) {
      console.error("Error fetching live users:", error);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Failed to connect to server. Please check your API endpoint."
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Toggle real-time updates
  const toggleRealtime = () => {
    setIsRealtime(!isRealtime);
    if (!isRealtime) {
      // When turning real-time back on, fetch fresh data
      fetchLiveStats();
      fetchLiveUsers();
    }
  };

  // Refresh data manually
  const refreshData = () => {
    setError(null);
    fetchLiveStats();
    fetchLiveUsers();
  };

  // Initial data fetch
  useEffect(() => {
    fetchLiveStats();
    fetchLiveUsers();
  }, [fetchLiveStats, fetchLiveUsers]);

  // Real-time polling (fallback if Socket.IO fails)
  useEffect(() => {
    if (!isRealtime || socketConnected) return;

    const interval = setInterval(() => {
      if (activeView === "overview") {
        fetchLiveStats();
      }
      fetchLiveUsers();
    }, 10000); // Poll every 10 seconds if socket not connected

    return () => clearInterval(interval);
  }, [isRealtime, socketConnected, activeView, fetchLiveStats, fetchLiveUsers]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      user_type: "",
      device_type: "",
      session_type: "",
      country_code: "",
      content_type: ""
    });
    setSearchQuery("");
    setPagination(prev => ({ ...prev, page: 1 }));
    setError(null);
  };

  // Export data
  const exportData = async () => {
    try {
      const response = await api.get("/user/live/export", {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `live-users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting data:", error);
      setError("Failed to export data. Please try again.");
    }
  };

  // Disconnect user
  const disconnectUser = async (sessionId) => {
    if (window.confirm('Are you sure you want to disconnect this user?')) {
      try {
        await api.delete(`/user/live/users/${sessionId}/disconnect`);
        // Remove user from local state immediately
        setLiveUsers(prev => prev.filter(user => user.session_id !== sessionId));
      } catch (error) {
        console.error('Error disconnecting user:', error);
        setError("Failed to disconnect user. Please try again.");
      }
    }
  };

  // Update header with connection status
  const ConnectionStatus = () => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${socketConnected 
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
        <span className="text-sm font-medium">
          {socketConnected ? 'Real-time Connected' : 'Polling (10s)'}
        </span>
      </div>

      <button
        onClick={toggleRealtime}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
          isRealtime
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        <Zap size={14} className={isRealtime ? 'animate-pulse' : ''} />
        <span className="text-sm font-medium">
          {isRealtime ? 'Realtime ON' : 'Realtime OFF'}
        </span>
      </button>

      <button
        onClick={refreshData}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        <span className="text-sm font-medium">Refresh</span>
      </button>

      <button
        onClick={exportData}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 transition"
      >
        <Download size={14} />
        <span className="text-sm font-medium">Export</span>
      </button>

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800 transition"
      >
        <Filter size={14} />
        <span className="text-sm font-medium">Filters</span>
      </button>

      {lastUpdate && (
        <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
          Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );

  // Filter component
  const FilterSection = () => {
    if (!showFilters) return null;

    return (
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400"
            >
              Clear All
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">User Type</label>
            <select
              value={filters.user_type}
              onChange={(e) => handleFilterChange('user_type', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All User Types</option>
              <option value="authenticated">Authenticated</option>
              <option value="anonymous">Anonymous</option>
              <option value="kid_profile">Kid Profile</option>
              <option value="family_member">Family Member</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Device Type</label>
            <select
              value={filters.device_type}
              onChange={(e) => handleFilterChange('device_type', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Devices</option>
              <option value="mobile">Mobile</option>
              <option value="web">Web</option>
              <option value="tablet">Tablet</option>
              <option value="smarttv">Smart TV</option>
              <option value="desktop">Desktop</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Activity</label>
            <select
              value={filters.session_type}
              onChange={(e) => handleFilterChange('session_type', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Activities</option>
              <option value="viewing">Watching</option>
              <option value="browsing">Browsing</option>
              <option value="idle">Idle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content Type</label>
            <select
              value={filters.content_type}
              onChange={(e) => handleFilterChange('content_type', e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">All Content</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
              <option value="documentary">Documentary</option>
              <option value="game">Games</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full border rounded px-3 py-2 pl-9 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Views configuration
  const views = useMemo(() => [
    {
      id: "overview",
      label: t("liveUsers.overview") || "Overview",
      icon: Activity,
      component: <OverviewView 
        stats={liveStats} 
        socketConnected={socketConnected} 
        error={error}
        loading={loading}
      />
    },
    {
      id: "users",
      label: t("liveUsers.liveUsers") || "Live Users",
      icon: Users,
      component: <UsersView 
        users={liveUsers} 
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        pagination={pagination}
        setPagination={setPagination}
        socketConnected={socketConnected}
        searchQuery={searchQuery}
        onDisconnectUser={disconnectUser}
        error={error}
      />
    },
    {
      id: "map",
      label: t("liveUsers.map") || "Map",
      icon: Map,
      component: <MapView />
    },
    {
      id: "analytics",
      label: t("liveUsers.analytics") || "Analytics",
      icon: BarChart3,
      component: <AnalyticsView />
    },
    {
      id: "warnings",
      label: t("liveUsers.warnings") || "Warnings",
      icon: AlertTriangle,
      component: <WarningsView />
    }
  ], [t, liveStats, liveUsers, loading, filters, pagination, socketConnected, searchQuery, error]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return liveUsers;
    
    const query = searchQuery.toLowerCase();
    return liveUsers.filter(user => {
      return (
        (user.user_email?.toLowerCase().includes(query)) ||
        (user.content_title?.toLowerCase().includes(query)) ||
        (user.device_name?.toLowerCase().includes(query)) ||
        (user.country_code?.toLowerCase().includes(query)) ||
        (user.ip_address?.toLowerCase().includes(query)) ||
        (user.user_type?.toLowerCase().includes(query))
      );
    });
  }, [liveUsers, searchQuery]);

  // Error display component
  const ErrorDisplay = () => {
    if (!error) return null;
    
    return (
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error Loading Data</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={refreshData}
                className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Live Users Dashboard
              {socketConnected && (
                <div className="relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-0.5 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time monitoring of all active users on the platform
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      <ErrorDisplay />

      {/* Connection Status */}
      <ConnectionStatus />

      {/* Filter Section */}
      <FilterSection />

      {/* Quick Stats - Only show if no error */}
      {!error && liveStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Users}
            label="Total Live Users"
            value={liveStats.total_live_users || 0}
            color="blue"
            realtime={socketConnected}
          />
          <StatCard
            icon={Eye}
            label="Currently Watching"
            value={liveStats.session_types?.find(s => s.session_type === 'viewing')?.count || 0}
            color="green"
            realtime={socketConnected}
          />
          <StatCard
            icon={Globe}
            label="Countries"
            value={liveStats.geographic_distribution?.length || 0}
            color="purple"
            realtime={socketConnected}
          />
          <StatCard
            icon={Clock}
            label="Peak Today"
            value={liveStats.peak_today?.users || 0}
            subtitle={liveStats.peak_today?.time || 'N/A'}
            color="orange"
            realtime={socketConnected}
          />
        </div>
      )}

      {/* Device Distribution */}
      {!error && liveStats?.device_types?.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Device Distribution
            </h3>
            {socketConnected && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {liveStats.device_types.map(device => (
              <DeviceBadge
                key={device.device_type}
                type={device.device_type}
                count={device.count}
              />
            ))}
          </div>
        </div>
      )}

      {/* Views Navigation */}
      <div className="border-b border-gray-300 dark:border-gray-700 mb-6 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {views.map(view => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                disabled={loading && view.id === activeView}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition relative whitespace-nowrap",
                  activeView === view.id
                    ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400",
                  loading && view.id === activeView ? "opacity-70 cursor-wait" : ""
                )}
              >
                <Icon size={18} />
                {view.label}
                {socketConnected && activeView === view.id && !loading && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                {loading && view.id === activeView && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active View Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 md:p-6">
        {views.find(view => view.id === activeView)?.component}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, change, subtitle, color = "blue", realtime = false }) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 relative">
      {realtime && (
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          <div className="absolute inset-0.5 bg-green-500 rounded-full"></div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {change && (
        <div className="mt-2 text-sm">
          <span className={change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
            {change}
          </span>
          <span className="text-gray-500 ml-1">from last hour</span>
        </div>
      )}
    </div>
  );
}

// Device Badge Component
function DeviceBadge({ type, count }) {
  const deviceIcons = {
    mobile: Smartphone,
    web: Monitor,
    tablet: Tablet,
    smarttv: Tv,
    desktop: Monitor
  };

  const Icon = deviceIcons[type] || Monitor;
  
  const deviceColors = {
    mobile: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    web: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    tablet: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    smarttv: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    desktop: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  };
  
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${deviceColors[type] || 'bg-gray-100'}`}>
      <Icon size={18} />
      <span className="font-medium capitalize">{type}</span>
      <span className="bg-white/50 dark:bg-black/50 px-2 py-1 rounded text-xs font-bold">
        {count}
      </span>
    </div>
  );
}

// Overview View Component
function OverviewView({ stats, socketConnected, error, loading }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Unable to Load Data</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading live stats...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center justify-center">
          <Activity className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
          <p className="text-sm text-gray-500">Try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Watching Now */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Watching Now</h3>
          {socketConnected && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </span>
          )}
        </div>
        
        {stats.watching_content?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.watching_content.slice(0, 6).map(content => (
              <div key={content.content_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="font-medium truncate">{content.content_title || 'Unknown'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {content.content_type} • {content.viewers} viewers
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${Math.min(content.avg_completion || 0, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>Avg completion</span>
                    <span>{Math.round(content.avg_completion || 0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No users are currently watching content
          </div>
        )}
      </div>

      {/* Active Users List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Active Users</h3>
        {stats.active_users_list?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    User Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Device
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Content
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {stats.active_users_list.slice(0, 10).map(user => (
                  <tr key={user.session_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.user_type === 'authenticated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        user.user_type === 'kid_profile' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.session_type === 'viewing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                        user.session_type === 'browsing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {user.session_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.device_type === 'mobile' && <Smartphone size={14} />}
                        {user.device_type === 'web' && <Monitor size={14} />}
                        {user.device_type === 'tablet' && <Tablet size={14} />}
                        {user.device_type === 'smarttv' && <Tv size={14} />}
                        <span className="capitalize">{user.device_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate">
                        {user.content_title || 'Not watching'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {user.last_activity ? new Date(user.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No active users found
          </div>
        )}
      </div>
    </div>
  );
}

// Users View Component
function UsersView({ 
  users, 
  loading, 
  filters, 
  setFilters, 
  pagination, 
  setPagination, 
  socketConnected, 
  searchQuery,
  onDisconnectUser,
  error 
}) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (userType) => {
    switch (userType) {
      case 'authenticated': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'anonymous': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'kid_profile': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'family_member': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Unable to Load Users</h3>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading live users...</p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (user.user_email?.toLowerCase().includes(query)) ||
        (user.content_title?.toLowerCase().includes(query)) ||
        (user.device_name?.toLowerCase().includes(query)) ||
        (user.country_code?.toLowerCase().includes(query)) ||
        (user.ip_address?.toLowerCase().includes(query)) ||
        (user.user_type?.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Real-time indicator */}
      {socketConnected && (
        <div className="flex items-center justify-end gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 dark:text-green-400">Live updates active</span>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Device
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Time Online
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.session_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded text-xs ${getStatusColor(user.user_type)}`}>
                        {user.user_type}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-xs">
                          {user.user_email || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {user.session_id?.substring(0, 20)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium truncate max-w-xs">
                        {user.content_title || user.session_type}
                      </div>
                      {user.percentage_watched > 0 && (
                        <div className="mt-1">
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-24">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${Math.min(user.percentage_watched, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(user.percentage_watched)}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.device_type === 'mobile' && <Smartphone size={16} />}
                      {user.device_type === 'web' && <Monitor size={16} />}
                      {user.device_type === 'tablet' && <Tablet size={16} />}
                      {user.device_type === 'smarttv' && <Tv size={16} />}
                      <span className="capitalize">{user.device_name || user.device_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{user.country_code || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                        {user.ip_address}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm">
                      {user.time_online_minutes || 0} min
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      since {user.joined_at ? new Date(user.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onDisconnectUser(user.session_id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Disconnect user"
                    >
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 text-gray-400 mb-2" />
                    <p>No active users found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Loading indicator at bottom */}
      {loading && users.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading more users...</span>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.total_pages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Map View Component
function MapView() {
  return (
    <div className="text-center py-12">
      <div className="relative inline-block">
        <Globe size={64} className="mx-auto text-gray-400 mb-4 animate-spin-slow" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-10 blur-xl rounded-full"></div>
      </div>
      <h3 className="text-lg font-medium mt-4">Live Users Map</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
        Geographic distribution of live users across different regions. This feature shows real-time user locations on an interactive map.
      </p>
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg inline-block">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <AlertCircle size={16} />
          <span>Map visualization coming soon</span>
        </div>
      </div>
    </div>
  );
}

// Analytics View Component
function AnalyticsView() {
  return (
    <div className="text-center py-12">
      <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mt-4">Analytics & Trends</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
        Historical trends, performance metrics, and user engagement analytics. View detailed reports on user behavior patterns.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time Monitoring</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">30 Days</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Historical Data</div>
        </div>
      </div>
    </div>
  );
}

// Warnings View Component
function WarningsView() {
  return (
    <div className="text-center py-12">
      <AlertTriangle size={64} className="mx-auto text-yellow-400 mb-4" />
      <h3 className="text-lg font-medium mt-4">Session Warnings & Alerts</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
        Performance issues, suspicious activities, and system alerts. Monitor potential security concerns and user experience problems.
      </p>
      <div className="mt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg">
          <CheckCircle size={16} />
          <span className="text-sm">No active warnings at this time</span>
        </div>
      </div>
    </div>
  );
}

// Add CSS for slow spin animation
const styles = `
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin-slow {
    animation: spin-slow 20s linear infinite;
  }
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
