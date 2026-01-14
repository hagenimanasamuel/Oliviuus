import React, { useState, useEffect } from "react";
import { CheckCircle, LogOut, MoreVertical, RefreshCw } from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

const ActivityTab = ({ userDetails, userId }) => {
  const { t } = useTranslation();
  const [loginSessions, setLoginSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showSessionMenu, setShowSessionMenu] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    total_sessions: 0,
    active_sessions: 0,
    completed_sessions: 0,
    last_login: null
  });

  useEffect(() => {
    if (userId && userId !== 'undefined') {
      console.log("🔄 ActivityTab mounted with userId:", userId);
      fetchLoginSessions();
    }
  }, [userId, activeFilter]);

  const fetchLoginSessions = async () => {
    if (!userId || userId === 'undefined') {
      console.error("❌ No valid userId provided");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("📡 Making API request for user sessions:", userId);
      
      // Test with different endpoints
      let endpoint;
      if (activeFilter === "all") {
        endpoint = `/user/${userId}/sessions`;
      } else {
        endpoint = `/user/${userId}/sessions/enhanced?filter=${activeFilter}`;
      }

      console.log("🌐 Calling endpoint:", endpoint);
      
      const response = await api.get(endpoint);
      console.log("✅ API Response received:", response.data);
      
      if (response.data && Array.isArray(response.data.sessions)) {
        setLoginSessions(response.data.sessions);
        setSessionStats(response.data.stats || response.data);
        console.log(`✅ Loaded ${response.data.sessions.length} sessions`);
      } else {
        console.warn("⚠️ Unexpected response format:", response.data);
        setLoginSessions([]);
      }
      
    } catch (error) {
      console.error("❌ API Error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message
      });
      
      // More detailed error handling
      if (error.response?.status === 404) {
        console.log("User not found or no sessions exist");
        setLoginSessions([]);
      } else if (error.response?.status === 403) {
        alert(t("activityTab.messages.permissionDenied"));
      } else {
        // Fallback to mock data for development
        const mockSessions = generateMockSessions();
        setLoginSessions(mockSessions);
        setSessionStats({
          total_sessions: mockSessions.length,
          active_sessions: mockSessions.filter(s => s.is_active).length,
          completed_sessions: mockSessions.filter(s => !s.is_active).length,
          last_login: mockSessions[0]?.login_time
        });
        console.log("🔄 Using mock data for development");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate realistic mock data
  const generateMockSessions = () => {
    const devices = [
      { name: "Chrome Browser", type: "desktop" },
      { name: "Safari Mobile", type: "mobile" },
      { name: "Firefox Desktop", type: "desktop" },
      { name: "Android App", type: "mobile" }
    ];
    
    const locations = ["New York, US", "London, UK", "Tokyo, JP", "Berlin, DE", "Paris, FR"];
    const ips = ["192.168.1.100", "192.168.1.101", "10.0.0.50", "172.16.0.100"];

    return Array.from({ length: 8 }, (_, i) => {
      const device = devices[i % devices.length];
      const isActive = i === 0; // First session is active
      const loginTime = new Date(Date.now() - (i * 2 * 60 * 60 * 1000));
      const logoutTime = isActive ? null : new Date(loginTime.getTime() + (60 * 60 * 1000));

      return {
        id: i + 1,
        device_name: device.name,
        device_type: device.type,
        ip_address: ips[i % ips.length],
        location: locations[i % locations.length],
        login_time: loginTime.toISOString(),
        logout_time: logoutTime?.toISOString() || null,
        is_active: isActive,
        user_agent: `Mozilla/5.0 (${device.type === 'mobile' ? 'iPhone' : 'Windows NT 10.0'}) AppleWebKit/537.36`,
        created_at: loginTime.toISOString()
      };
    });
  };

  const terminateSession = async (sessionId) => {
    try {
      console.log("🗑️ Terminating session:", sessionId);
      const response = await api.delete(`/user/${userId}/sessions/${sessionId}`);
      console.log("✅ Session terminated:", response.data);
      
      // Update local state
      setLoginSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              is_active: false, 
              logout_time: new Date().toISOString() 
            } 
          : session
      ));
      
      setShowSessionMenu(null);
      
      // Refresh stats
      fetchLoginSessions();
      
    } catch (error) {
      console.error('❌ Failed to terminate session:', error);
      alert(error.response?.data?.message || t("activityTab.messages.terminateError"));
    }
  };

  const terminateAllSessions = async () => {
    if (!window.confirm(t("activityTab.actions.terminateAllConfirm"))) {
      return;
    }

    try {
      const response = await api.delete(`/user/${userId}/sessions`);
      console.log("✅ All sessions terminated:", response.data);
      
      // Update local state for all active sessions
      setLoginSessions(prev => prev.map(session => 
        session.is_active 
          ? { 
              ...session, 
              is_active: false, 
              logout_time: new Date().toISOString() 
            } 
          : session
      ));
      
      fetchLoginSessions();
      
    } catch (error) {
      console.error('❌ Failed to terminate all sessions:', error);
      alert(error.response?.data?.message || t("activityTab.messages.terminateAllError"));
    }
  };

  const getSessionStatus = (session) => {
    if (session.is_active) {
      return { 
        label: t("activityTab.session.status.active"), 
        color: "text-green-400", 
        bg: "bg-green-400/10" 
      };
    }
    return { 
      label: t("activityTab.session.status.completed"), 
      color: "text-gray-400", 
      bg: "bg-gray-400/10" 
    };
  };

  const getDeviceIcon = (deviceType, deviceName) => {
    const type = (deviceType || '').toLowerCase();
    const name = (deviceName || '').toLowerCase();
    
    if (type === 'mobile' || name.includes('mobile') || name.includes('iphone') || name.includes('android')) {
      return t("activityTab.session.deviceTypes.mobile");
    } else if (type === 'tablet' || name.includes('tablet') || name.includes('ipad')) {
      return t("activityTab.session.deviceTypes.tablet");
    } else if (type === 'desktop' || name.includes('desktop') || name.includes('windows') || name.includes('mac')) {
      return t("activityTab.session.deviceTypes.desktop");
    }
    return t("activityTab.session.deviceTypes.default");
  };

  const formatDuration = (start, end) => {
    if (!start) return 'N/A';
    if (!end) return t("activityTab.session.active");
    
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime - startTime;
    
    if (diff < 0) return t("activityTab.session.active");
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    
    return t("activityTab.session.justNow");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Calculate stats
  const stats = {
    total: sessionStats.total_sessions || loginSessions.length,
    active: sessionStats.active_sessions || loginSessions.filter(s => s.is_active).length,
    successful: sessionStats.completed_sessions || loginSessions.filter(s => !s.is_active).length,
    lastLogin: sessionStats.last_login || loginSessions[0]?.login_time
  };

  // Filter sessions based on active filter
  const filteredSessions = loginSessions.filter(session => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return session.is_active;
    if (activeFilter === "completed") return !session.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg">
        <div className="text-blue-400 text-sm font-mono">
          <div>🔍 {t("activityTab.debug.userId")}: {userId}</div>
          <div>📊 {t("activityTab.debug.sessionsLoaded")}: {filteredSessions.length} | {stats.active} {t("activityTab.debug.activeSessions")}</div>
          <div>🔄 {t("activityTab.debug.filter")}: {activeFilter} | {t("activityTab.debug.loading")}: {isLoading ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-gray-400 text-xs">{t("activityTab.stats.totalSessions")}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-gray-400 text-xs">{t("activityTab.stats.activeNow")}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.successful}</div>
          <div className="text-gray-400 text-xs">{t("activityTab.stats.completed")}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-white text-sm font-medium">
            {stats.lastLogin ? new Date(stats.lastLogin).toLocaleDateString() : t("overviewTab.time.never")}
          </div>
          <div className="text-gray-400 text-xs">{t("activityTab.stats.lastLogin")}</div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-white">{t("activityTab.title")}</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">{t("activityTab.filters.all")}</option>
            <option value="active">{t("activityTab.filters.active")}</option>
            <option value="completed">{t("activityTab.filters.completed")}</option>
          </select>

          <button 
            onClick={fetchLoginSessions}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t("activityTab.actions.refresh")}</span>
          </button>

          {stats.active > 0 && (
            <button 
              onClick={terminateAllSessions}
              className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t("activityTab.actions.logoutAll")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <div className="text-gray-400 text-sm">{t("activityTab.messages.loading")}</div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">{t("activityTab.messages.noSessions")}</div>
            <div className="text-gray-500 text-xs mt-1">
              {activeFilter !== "all" 
                ? t("activityTab.messages.noFilteredSessions", { filter: activeFilter }) 
                : t("activityTab.messages.noSessionsYet")
              }
            </div>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const status = getSessionStatus(session);
            return (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={clsx("p-3 rounded-lg", status.bg)}>
                    {session.is_active ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <LogOut className="w-4 h-4 text-green-400" />
                      </div>
                    ) : (
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium truncate">
                          {getDeviceIcon(session.device_type, session.device_name)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {session.ip_address} • {session.location || t("activityTab.session.unknownLocation")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className={clsx(
                        "inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium",
                        status.bg, status.color
                      )}>
                        <span>{status.label}</span>
                      </div>
                      
                      <div className="text-gray-400 text-xs">
                        {t("activityTab.session.login")}: {formatDate(session.login_time)}
                      </div>
                      
                      <div className="text-gray-400 text-xs">
                        {t("activityTab.session.duration")}: {formatDuration(session.login_time, session.logout_time)}
                      </div>
                    </div>
                  </div>
                </div>

                {session.is_active && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSessionMenu(showSessionMenu === session.id ? null : session.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showSessionMenu === session.id && (
                      <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
                        <button
                          onClick={() => terminateSession(session.id)}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t("activityTab.actions.terminate")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityTab;