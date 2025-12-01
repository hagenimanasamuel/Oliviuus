import React, { useState } from "react";
import api from "../../../../api/axios";
import { LogOut } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function UserSessions() {
  const { t } = useTranslation();
  const { user, loginUser } = useAuth();
  const [message, setMessage] = useState("");
  const [loadingSession, setLoadingSession] = useState(null);

  if (!user) return null;

  const sessions = user.sessions || [];

  // Get the token of the current session from the backend user object
  const currentToken = user.current_session_token; // backend should provide this field

  const hasOtherActiveSessions = sessions.some(
    (s) => s.session_token !== currentToken && s.is_active
  );

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
      setMessage(t("sessions.logoutSuccess"));
    } catch (err) {
      console.error(err);
      setMessage(t("sessions.logoutFail"));
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
      setMessage(t("sessions.logoutAllSuccess"));
    } catch (err) {
      console.error(err);
      setMessage(t("sessions.logoutAllFail"));
    } finally {
      setLoadingSession(null);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {message && <p className="text-[#BC8BBC] font-medium">{message}</p>}

      {sessions.length === 0 ? (
        <p className="text-gray-400">{t("sessions.noActive")}</p>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <button
              onClick={logoutAllOtherSessions}
              disabled={!hasOtherActiveSessions || loadingSession === "all"}
              className={`px-3 py-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white rounded-md text-sm font-medium transition ${
                !hasOtherActiveSessions || loadingSession === "all"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {loadingSession === "all"
                ? t("sessions.loggingOut")
                : t("sessions.logoutAll")}
            </button>
          </div>

          <ul className="divide-y divide-gray-700">
            {sessions.map((s) => {
              const isCurrent = s.session_token === currentToken;

              return (
                <li
                  key={s.id}
                  className={`py-3 px-4 flex flex-col sm:flex-row sm:justify-between sm:items-center rounded-md transition ${
                    isCurrent
                      ? "bg-[#9b69b2]"
                      : s.is_active
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-gray-800"
                  }`}
                >
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      {s.device_name || s.device_type}
                      {isCurrent && (
                        <span className="text-gray-200 text-xs italic">
                          ({t("sessions.current")})
                        </span>
                      )}
                    </p>

                    <p className="text-gray-300 text-sm">
                      {t("sessions.ip")}: {s.ip_address || t("sessions.unknown")} |{" "}
                      {t("sessions.location")}: {s.location || t("sessions.unknown")}
                    </p>

                    <p className="text-gray-300 text-sm">
                      {t("sessions.login")}: {new Date(s.login_time).toLocaleString()}
                    </p>

                    {s.logout_time && (
                      <p className="text-gray-500 text-sm">
                        {t("sessions.logout")}: {new Date(s.logout_time).toLocaleString()}
                      </p>
                    )}

                    <p
                      className={`text-sm font-medium ${
                        s.is_active ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      {t("sessions.status")}: {s.is_active ? t("sessions.active") : t("sessions.loggedOut")}
                    </p>
                  </div>

                  {!isCurrent && s.is_active && (
                    <button
                      onClick={() => logoutSession(s.id)}
                      disabled={loadingSession === s.id}
                      className={`mt-2 sm:mt-0 px-3 py-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white rounded-md flex items-center gap-1 text-sm font-medium transition ${
                        loadingSession === s.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      {loadingSession === s.id
                        ? t("sessions.loggingOut")
                        : t("sessions.logout")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
