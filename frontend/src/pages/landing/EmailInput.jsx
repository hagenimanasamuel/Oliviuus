import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Alert from "../../components/ui/Alert";

const EmailInput = ({ onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
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
      setLoading(true);
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

  // If user is logged in, show a different message
  if (user) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center">
        <p className="text-xs md:text-sm text-gray-300 mb-4 font-light">
          {t("landingPage.emailInput.alreadyLoggedIn")}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-[#BC8CBC] to-purple-600 hover:from-[#a87aa8] hover:to-purple-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
        >
          {t("landingPage.emailInput.continueToAccount")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      {/* Alert Message */}
      {alert && (
        <div className="mb-4">
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
        {/* Email Input Container */}
        <div className="flex-1">
          <div className="relative h-16">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="email-input-custom w-full h-full px-6 backdrop-blur-sm rounded-lg text-white text-lg focus:ring-2 focus:ring-[#BC8CBC]/30 transition-all duration-300"
            />

            {/* Floating Label */}
            <label
              className={`absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 ${email || isFocused
                  ? "text-sm -translate-y-6 text-[#BC8CBC] font-medium"
                  : "text-lg"
                }`}
            >
              {t("auth.email_placeholder")}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`h-16 px-8 rounded-lg font-bold text-lg transition-all duration-300 min-w-[180px] flex items-center justify-center gap-2 ${loading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#BC8CBC] to-purple-600 hover:from-[#a87aa8] hover:to-purple-500 text-white transform hover:scale-105 shadow-lg hover:shadow-purple-500/25'
            }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t("auth.loading")}</span>
            </>
          ) : (
            <>
              <span>{t("landingPage.emailInput.getStarted")}</span>
              <span className="text-xl">›</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Indicator */}
      {(loading || isLoading) && (
        <div className="mt-4 max-w-2xl mx-auto">
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#BC8CBC] animate-loader"
            ></div>
          </div>
        </div>
      )}

      {/* Custom styles to override global CSS */}
      <style>
        {`
          .email-input-custom {
            background-color: rgba(0, 0, 0, 0.2) !important;
            border: 2px solid rgba(107, 114, 128, 0.5) !important;
          }
          
          .email-input-custom:focus {
            border-color: #BC8CBC !important;
            outline: none !important;
          }
          
          @keyframes loader-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(500%); }
          }
          .animate-loader {
            animation: loader-move 1.5s linear infinite;
          }
        `}
      </style>
    </form>
  );
};

export default EmailInput;