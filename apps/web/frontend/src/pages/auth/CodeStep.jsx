import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Alert from "../../components/ui/Alert.jsx";
import EditableEmail from "../../components/ui/EditableEmail";
import api from "../../api/axios"; 

const RESEND_DELAY = 30; // seconds before allowing resend

const CodeStep = ({ email, onSubmit, goBackToEmail }) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  // resend state
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);

  // countdown for resend
  useEffect(() => {
    let timer;
    if (!canResend && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    if (resendTimer === 0) setCanResend(true);
    return () => clearTimeout(timer);
  }, [resendTimer, canResend]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) {
      setError(t("verifyEmail.code_required"));
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/email-verification/verify-code", {
        email: email,
        code: code,
      });

      if (res.status === 200) {
        onSubmit(code);
      } else {
        setError(t("verifyEmail.invalid_or_expired_code"));
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        setError(t("verifyEmail.invalid_or_expired_code"));
      } else {
        setError(t("verifyEmail.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setRedirecting(true);
    setTimeout(() => {
      goBackToEmail();
      setRedirecting(false);
    }, 600);
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setLoading(true);
      await api.post("/auth/check-email", { email }); // same endpoint as initial send
      setError(""); // clear errors
      setCanResend(false);
      setResendTimer(RESEND_DELAY); // restart countdown
    } catch (err) {
      console.error(err);
      setError(t("verifyEmail.resend_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {(loading || redirecting) && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 overflow-hidden rounded-t">
          <div className="h-1 w-1/3 bg-[#BC8BBC] animate-loader"></div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto relative">
        <form
          onSubmit={handleSubmit}
          className={`flex flex-col gap-6 bg-transparent relative ${
            loading || redirecting ? "pointer-events-none opacity-70" : ""
          }`}
        >
          {error && <Alert message={error} type="error" />}

          <p className="text-gray-400 text-center mb-2">
            {t("verifyEmail.enter_code_desc")}
          </p>

          <div className="flex justify-center mb-4">
            <EditableEmail email={email} onClick={handleEditClick} />
          </div>

          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full px-4 py-4 text-lg bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] peer"
            />
            <label
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:text-[#BC8BBC] ${
                code || isFocused ? "text-xs -translate-y-6 text-[#BC8BBC]" : "text-lg"
              }`}
            >
              {t("verifyEmail.code_placeholder")}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || redirecting}
            className={`w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium py-3 rounded-md transition-colors duration-200 text-base ${
              loading || redirecting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? t("verifyEmail.loading") : t("verifyEmail.verify")}
          </button>

          {/* Resend section */}
          <div className="flex flex-col items-center mt-4 space-y-2 text-sm text-gray-400">
            <p>{t("verifyEmail.not_received")}</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || loading}
              className={`text-[#BC8BBC] hover:underline ${
                !canResend || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-[#9b69b2]"
              }`}
            >
              {canResend
                ? t("verifyEmail.resend_code")
                : t("verifyEmail.resend_in", { seconds: resendTimer })}
            </button>
            <p className="text-xs text-gray-500 text-center max-w-sm">
              {t("verifyEmail.tips")}
            </p>
          </div>
        </form>

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

export default CodeStep;
