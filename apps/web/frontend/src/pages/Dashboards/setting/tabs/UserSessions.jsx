import React, { useState } from "react";
import api from "../../../../api/axios";
import { LogOut, Monitor, MapPin, Globe, Clock, Shield } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function UserSessions() {
  const { t } = useTranslation();
  const { user, loginUser } = useAuth();
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loadingSession, setLoadingSession] = useState(null);

  if (!user) return null;

  const sessions = user.sessions || [];
  const currentToken = user.current_session_token;

  const hasOtherActiveSessions = sessions.some(
    (s) => s.session_token !== currentToken && s.is_active
  );

  const getSessionIcon = (deviceType) => {
    const type = deviceType?.toLowerCase() || "";
    if (type.includes("mobile")) return "📱";
    if (type.includes("tablet")) return "📱";
    if (type.includes("desktop")) return "💻";
    if (type.includes("bot")) return "🤖";
    return "🖥️";
  };

  const logoutSession = async (sessionId) => {
    try {
      setLoadingSession(sessionId);
      await api.post(
        `/user/sessions/logout`,
        { session_id: sessionId },
        { withCredentials: true }
      );

      const updatedSessions = sessions.map((s) =>
        s.id === sessionId ? { ...s, is_active: false, logout_time: new Date() } : s
      );

      loginUser({ ...user, sessions: updatedSessions });
      setMessage({ text: t("sessions.logoutSuccess"), type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: t("sessions.logoutFail"), type: "error" });
    } finally {
      setLoadingSession(null);
    }
  };

  const logoutAllOtherSessions = async () => {
    try {
      setLoadingSession("all");
      await api.post("/user/sessions/logout-all", {}, { withCredentials: true });

      const updatedSessions = sessions.map((s) =>
        s.session_token !== currentToken
          ? { ...s, is_active: false, logout_time: new Date() }
          : s
      );

      loginUser({ ...user, sessions: updatedSessions });
      setMessage({ text: t("sessions.logoutAllSuccess"), type: "success" });
    } catch (err) {
      console.error(err);
      setMessage({ text: t("sessions.logoutAllFail"), type: "error" });
    } finally {
      setLoadingSession(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("sessions.justNow");
    if (diffMins < 60) return `${diffMins}${t("sessions.minutesAgo")}`;
    if (diffHours < 24) return `${diffHours}${t("sessions.hoursAgo")}`;
    if (diffDays < 7) return `${diffDays}${t("sessions.daysAgo")}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === "success" 
            ? "bg-emerald-900/20 border-emerald-800 text-emerald-300" 
            : "bg-rose-900/20 border-rose-800 text-rose-300"
        }`}>
          {message.text}
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg">{t("sessions.noActive")}</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t("sessions.activeSessions")}
                </h2>
                <p className="text-gray-400 mt-1">
                  {sessions.filter(s => s.is_active).length} {t("sessions.activeSessionsCount")}
                </p>
              </div>
              
              <button
                onClick={logoutAllOtherSessions}
                disabled={!hasOtherActiveSessions || loadingSession === "all"}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  !hasOtherActiveSessions || loadingSession === "all"
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#BC8BBC] to-[#9b69b2] hover:from-[#9b69b2] hover:to-[#7a4f92] text-white shadow-lg hover:shadow-xl"
                }`}
              >
                {loadingSession === "all" ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("sessions.loggingOut")}
                  </span>
                ) : (
                  t("sessions.logoutAll")
                )}
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((s) => {
                const isCurrent = s.session_token === currentToken;

                return (
                  <div
                    key={s.id}
                    className={`group rounded-lg p-4 transition-all duration-300 ${
                      isCurrent
                        ? "bg-gradient-to-r from-[#9b69b2]/20 to-[#7a4f92]/20 border border-[#9b69b2]/30"
                        : s.is_active
                        ? "bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600"
                        : "bg-gray-900/30 border border-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        isCurrent ? "bg-[#9b69b2]/20" : "bg-gray-800"
                      }`}>
                        <span className="text-2xl">
                          {getSessionIcon(s.device_type)}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <p className="text-white font-semibold">
                              {s.device_name || s.device_type || t("sessions.unknownDevice")}
                            </p>
                            {isCurrent && (
                              <span className="px-2 py-1 bg-[#9b69b2] text-white text-xs font-medium rounded-full">
                                {t("sessions.current")}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              s.is_active
                                ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800/50"
                                : "bg-gray-800 text-gray-400"
                            }`}>
                              {s.is_active ? t("sessions.active") : t("sessions.loggedOut")}
                            </span>
                          </div>

                          {!isCurrent && s.is_active && (
                            <button
                              onClick={() => logoutSession(s.id)}
                              disabled={loadingSession === s.id}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                                loadingSession === s.id
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-[#BC8BBC] to-[#9b69b2] hover:from-[#9b69b2] hover:to-[#7a4f92] text-white shadow-md hover:shadow-lg"
                              }`}
                            >
                              {loadingSession === s.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <LogOut className="w-4 h-4" />
                              )}
                              {loadingSession === s.id ? t("sessions.loggingOut") : t("sessions.logout")}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-300">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{t("sessions.location")}:</span>
                              <span>{s.location || t("sessions.unknown")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Globe className="w-4 h-4" />
                              <span className="font-medium">IP:</span>
                              <code className="px-2 py-1 bg-gray-900/50 rounded text-xs font-mono">
                                {s.ip_address || t("sessions.unknown")}
                              </code>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-300">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{t("sessions.login")}:</span>
                              <span className="text-gray-400">{formatDate(s.login_time)}</span>
                              <span className="text-xs text-gray-500">
                                ({new Date(s.login_time).toLocaleString()})
                              </span>
                            </div>
                            {s.logout_time && (
                              <div className="flex items-center gap-2 text-gray-400">
                                <LogOut className="w-4 h-4" />
                                <span className="font-medium">{t("sessions.logout")}:</span>
                                <span>{formatDate(s.logout_time)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}