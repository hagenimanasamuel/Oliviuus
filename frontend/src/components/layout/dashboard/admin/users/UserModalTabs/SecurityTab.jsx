import React, { useState, useEffect, useRef } from "react";
import { 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Send,
  LogOut,
  AlertTriangle,
  Clock,
  Shield,
  Wifi,
  UserCheck
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next";

const SecurityTab = ({ userDetails, userId }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState({
    sendReset: false,
    forceReset: false,
    terminateSessions: false
  });
  const [isLoadingSecurityData, setIsLoadingSecurityData] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', message: '', source: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityData, setSecurityData] = useState({
    email_verified: false,
    last_login: null,
    pending_reset_requests: 0,
    active_sessions: 0,
    recent_logins: 0,
    failed_logins_30d: 0
  });

  // Use ref to track if we've already fetched data
  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Fetch real security data from server - only once when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchSecurityData = async () => {
      // Prevent multiple fetches
      if (hasFetchedRef.current || !userId || !isMountedRef.current) return;
      
      try {
        hasFetchedRef.current = true;
        setIsLoadingSecurityData(true);
        
        const response = await api.get(`/user/${userId}/security-info`);
        
        if (isMountedRef.current) {
          setSecurityData(response.data);
        }
      } catch (error) {
        console.error('❌ Failed to fetch security data:', error);
        // Fallback to userDetails if API fails
        if (isMountedRef.current) {
          setSecurityData({
            email_verified: userDetails.email_verified || false,
            last_login: userDetails.last_login || null,
            pending_reset_requests: 0,
            active_sessions: 0,
            recent_logins: 0,
            failed_logins_30d: 0
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoadingSecurityData(false);
        }
      }
    };

    fetchSecurityData();

    return () => {
      isMountedRef.current = false;
    };
  }, [userId, userDetails]);

  // Refresh security data when actions are performed - with debouncing
  const refreshSecurityData = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsLoadingSecurityData(true);
      const response = await api.get(`/user/${userId}/security-info`);
      
      if (isMountedRef.current) {
        setSecurityData(response.data);
      }
    } catch (error) {
      console.error('❌ Failed to refresh security data:', error);
    } finally {
      if (isMountedRef.current) {
        // Small delay to prevent flickering
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsLoadingSecurityData(false);
          }
        }, 300);
      }
    }
  };

  const clearMessage = () => {
    setTimeout(() => {
      if (isMountedRef.current) {
        setActionMessage({ type: '', message: '', source: '' });
      }
    }, 5000);
  };

  const setLoading = (key, value) => {
    if (isMountedRef.current) {
      setIsLoading(prev => ({ ...prev, [key]: value }));
    }
  };

  // Debounced action handler to prevent rapid successive calls
  const debouncedAction = async (action, loadingKey, successMessage, apiCall) => {
    if (isLoading[loadingKey]) return; // Prevent double clicks
    
    setLoading(loadingKey, true);
    setActionMessage({ type: 'info', message: t("securityTab.messages.processing"), source: loadingKey });

    try {
      await apiCall();
      
      setActionMessage({ 
        type: 'success', 
        message: successMessage,
        source: loadingKey
      });
      
      // Only refresh data after successful action, not on every render
      await refreshSecurityData();
      
    } catch (error) {
      console.error(`❌ Failed to ${action}:`, error);
      setActionMessage({ 
        type: 'error', 
        message: error.response?.data?.message || t("securityTab.messages.failedAction", { action }),
        source: loadingKey
      });
    } finally {
      setLoading(loadingKey, false);
      clearMessage();
    }
  };

  // Send password reset email
  const handleSendPasswordReset = async () => {
    if (!window.confirm(t("securityTab.passwordReset.confirmSendReset", { email: userDetails.email }))) return;

    debouncedAction(
      'send password reset',
      'sendReset',
      t("securityTab.passwordReset.successResetSent"),
      () => api.post(`/user/${userId}/send-password-reset`)
    );
  };

  // Reset password immediately (admin force reset)
  const handleForcePasswordReset = async () => {
    if (!newPassword) {
      setActionMessage({ type: 'error', message: t("securityTab.messages.enterPassword"), source: 'forceReset' });
      clearMessage();
      return;
    }

    if (newPassword !== confirmPassword) {
      setActionMessage({ type: 'error', message: t("securityTab.messages.passwordsMatch"), source: 'forceReset' });
      clearMessage();
      return;
    }

    if (newPassword.length < 8) {
      setActionMessage({ type: 'error', message: t("securityTab.messages.passwordLength"), source: 'forceReset' });
      clearMessage();
      return;
    }

    if (!window.confirm(t("securityTab.passwordReset.confirmForceReset", { email: userDetails.email }))) return;

    debouncedAction(
      'reset password',
      'forceReset',
      t("securityTab.passwordReset.successResetDone"),
      async () => {
        const response = await api.put(`/user/${userId}/force-password-reset`, { newPassword });
        setNewPassword("");
        setConfirmPassword("");
        return response;
      }
    );
  };

  // Terminate all sessions
  const handleTerminateAllSessions = async () => {
    if (!window.confirm(t("securityTab.sessions.confirmTerminate", { email: userDetails.email }))) return;

    debouncedAction(
      'terminate sessions',
      'terminateSessions',
      t("securityTab.sessions.successTerminate"),
      () => api.delete(`/user/${userId}/sessions`)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return t("securityTab.time.never");
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return t("securityTab.time.never");
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return t("securityTab.time.today");
      if (diffDays === 1) return t("securityTab.time.yesterday");
      if (diffDays < 7) return t("securityTab.time.daysAgo", { count: diffDays });
      if (diffDays < 30) return t("securityTab.time.weeksAgo", { count: Math.floor(diffDays / 7) });
      return t("securityTab.time.monthsAgo", { count: Math.floor(diffDays / 30) });
    } catch (error) {
      return t("securityTab.time.unknown");
    }
  };

  // Skeleton loader component
  const StatSkeleton = ({ width = 'w-20' }) => (
    <div className={`h-4 sm:h-6 ${width} bg-gray-700 rounded animate-pulse`}></div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800/70 transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-sm sm:text-base truncate">
                {isLoadingSecurityData ? (
                  <StatSkeleton width="w-12 sm:w-20" />
                ) : (
                  securityData.email_verified ? t("securityTab.stats.verified") : t("securityTab.stats.unverified")
                )}
              </div>
              <div className="text-gray-400 text-xs">{t("securityTab.stats.emailStatus")}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800/70 transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-sm sm:text-base truncate">
                {isLoadingSecurityData ? (
                  <StatSkeleton width="w-16 sm:w-24" />
                ) : (
                  formatDate(securityData.last_login)
                )}
              </div>
              <div className="text-gray-400 text-xs truncate">
                {!isLoadingSecurityData && securityData.last_login && getTimeAgo(securityData.last_login)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800/70 transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-sm sm:text-base">
                {isLoadingSecurityData ? (
                  <StatSkeleton width="w-8" />
                ) : (
                  securityData.pending_reset_requests || 0
                )}
              </div>
              <div className="text-gray-400 text-xs">
                <span className="hidden sm:inline">{t("securityTab.stats.pendingResets")}</span>
                <span className="sm:hidden">{t("securityTab.stats.pendingResets")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 hover:bg-gray-800/70 transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold text-sm sm:text-base">
                {isLoadingSecurityData ? (
                  <StatSkeleton width="w-8" />
                ) : (
                  securityData.failed_logins_30d || 0
                )}
              </div>
              <div className="text-gray-400 text-xs">
                <span className="hidden sm:inline">{t("securityTab.stats.failedLogins")}</span>
                <span className="sm:hidden">{t("securityTab.stats.failedLogins")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-gray-800/30 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span className="hidden xs:inline">{t("securityTab.passwordManagement")}</span>
          <span className="xs:hidden">{t("securityTab.passwordManagement")}</span>
        </h3>
        
        {/* Send Reset Link Section */}
        <div className="space-y-3">
          {actionMessage.source === 'sendReset' && actionMessage.message && (
            <div className={clsx(
              "p-3 rounded-lg border",
              actionMessage.type === 'success' && "bg-green-500/20 border-green-500/30 text-green-400",
              actionMessage.type === 'error' && "bg-red-500/20 border-red-500/30 text-red-400",
              actionMessage.type === 'info' && "bg-blue-500/20 border-blue-500/30 text-blue-400"
            )}>
              <div className="flex items-center space-x-2">
                {actionMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {actionMessage.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
                {actionMessage.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />}
                <span className="text-sm break-words">{actionMessage.message}</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/50 rounded-lg gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm sm:text-base">
                <span className="hidden sm:inline">{t("securityTab.passwordReset.sendResetEmail")}</span>
                <span className="sm:hidden">{t("securityTab.passwordReset.sendResetEmailShort")}</span>
              </div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1">
                {t("securityTab.passwordReset.description")}
              </div>
            </div>
            <button
              onClick={handleSendPasswordReset}
              disabled={isLoading.sendReset || isLoadingSecurityData}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50 min-w-[140px] sm:min-w-32 justify-center flex-shrink-0"
            >
              {isLoading.sendReset ? (
                <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
              ) : (
                <Send className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="whitespace-nowrap text-sm">
                {isLoading.sendReset ? t("securityTab.passwordReset.sending") : t("securityTab.passwordReset.sendResetLink")}
              </span>
            </button>
          </div>
        </div>

        {/* Force Password Reset Section */}
        <div className="space-y-3">
          {actionMessage.source === 'forceReset' && actionMessage.message && (
            <div className={clsx(
              "p-3 rounded-lg border",
              actionMessage.type === 'success' && "bg-green-500/20 border-green-500/30 text-green-400",
              actionMessage.type === 'error' && "bg-red-500/20 border-red-500/30 text-red-400",
              actionMessage.type === 'info' && "bg-blue-500/20 border-blue-500/30 text-blue-400"
            )}>
              <div className="flex items-center space-x-2">
                {actionMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                {actionMessage.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
                {actionMessage.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />}
                <span className="text-sm break-words">{actionMessage.message}</span>
              </div>
            </div>
          )}
          
          <div className="p-4 bg-gray-800/50 rounded-lg space-y-4">
            <div>
              <div className="text-white font-medium text-sm sm:text-base">{t("securityTab.passwordReset.forceReset")}</div>
              <div className="text-gray-400 text-xs sm:text-sm mt-1">
                {t("securityTab.passwordReset.forceDescription")}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-gray-400 text-xs sm:text-sm">{t("securityTab.passwordReset.newPassword")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("securityTab.passwordReset.enterNewPassword")}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 pr-10 text-sm"
                    disabled={isLoading.forceReset || isLoadingSecurityData}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    disabled={isLoading.forceReset || isLoadingSecurityData}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-gray-400 text-xs sm:text-sm">{t("securityTab.passwordReset.confirmPassword")}</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("securityTab.passwordReset.confirmNewPassword")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm"
                  disabled={isLoading.forceReset || isLoadingSecurityData}
                />
              </div>
            </div>
            
            <button
              onClick={handleForcePasswordReset}
              disabled={isLoading.forceReset || isLoadingSecurityData || !newPassword || !confirmPassword}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              {isLoading.forceReset ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span className="whitespace-nowrap">
                {isLoading.forceReset ? t("securityTab.passwordReset.resetting") : t("securityTab.passwordReset.resetPassword")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-gray-800/30 rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <LogOut className="w-5 h-5" />
          <span className="hidden xs:inline">{t("securityTab.sessionManagement")}</span>
          <span className="xs:hidden">{t("securityTab.sessionManagement")}</span>
        </h3>
        
        {actionMessage.source === 'terminateSessions' && actionMessage.message && (
          <div className={clsx(
            "p-3 rounded-lg border",
            actionMessage.type === 'success' && "bg-green-500/20 border-green-500/30 text-green-400",
            actionMessage.type === 'error' && "bg-red-500/20 border-red-500/30 text-red-400",
            actionMessage.type === 'info' && "bg-blue-500/20 border-blue-500/30 text-blue-400"
          )}>
            <div className="flex items-center space-x-2">
              {actionMessage.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {actionMessage.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
              {actionMessage.type === 'info' && <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />}
              <span className="text-sm break-words">{actionMessage.message}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/50 rounded-lg gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm sm:text-base">
              <span className="hidden sm:inline">{t("securityTab.sessions.terminateAll")}</span>
              <span className="sm:hidden">{t("securityTab.sessions.terminateAllShort")}</span>
            </div>
            <div className="text-gray-400 text-xs sm:text-sm mt-1">
              {t("securityTab.sessions.description")}
            </div>
          </div>
          <button
            onClick={handleTerminateAllSessions}
            disabled={isLoading.terminateSessions || isLoadingSecurityData}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 min-w-[140px] sm:min-w-32 justify-center flex-shrink-0"
          >
            {isLoading.terminateSessions ? (
              <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <LogOut className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="whitespace-nowrap text-sm">
              {isLoading.terminateSessions ? t("securityTab.sessions.terminating") : t("securityTab.sessions.logoutAll")}
            </span>
          </button>
        </div>

        {/* Active Sessions Info */}
        {!isLoadingSecurityData && securityData.active_sessions > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-400">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t("securityTab.sessions.activeSessions", { count: securityData.active_sessions })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityTab;