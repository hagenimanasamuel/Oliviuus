import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import Alert from "../../components/ui/Alert";

const EmailStep = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLanguage = () => {
    try {
      const lang = localStorage.getItem("lang");
      return lang || "rw";
    } catch {
      return "rw";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setAlert({ type: "error", message: t("auth.enter_email") });
      return;
    }

    const language = getCurrentLanguage();

    try {
      setLoading(true); // Start loader
      const res = await api.post("/auth/check-email", { email, language });

      onSubmit({ email, isExistingUser: res.data.exists });
      setLoading(false);
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.error || t("auth.server_error"),
      });
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loader bar */}
      {loading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 overflow-hidden rounded-t">
          <div className="h-1 w-1/3 bg-[#BC8BBC] animate-loader"></div>
        </div>
      )}
      <div className="w-full max-w-md mx-auto relative">
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form
          onSubmit={handleSubmit}
          className={`flex flex-col gap-6 bg-transparent ${loading ? "pointer-events-none opacity-70" : ""
            }`}
        >
          <p className="text-gray-400 text-center mb-2">{t("auth.enter_email_desc")}</p>

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full px-4 py-4 text-lg bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] peer"
            />
            <label
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:text-[#BC8BBC] ${email || isFocused
                ? "text-xs -translate-y-6 text-[#BC8BBC]"
                : "text-lg"
                }`}
            >
              {t("auth.email_placeholder")}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium py-3 rounded-md transition-colors duration-200 text-base ${loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {loading ? t("auth.loading") : t("auth.continue")}
          </button>
        </form>

        {/* Loader animation CSS */}
        <style>
          {`
          @keyframes loader-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(500%); }
          }
          .animate-loader {
            animation: loader-move 1.5s linear infinite;
          }
        `}
        </style>
      </div>
    </>
  );
};

export default EmailStep;