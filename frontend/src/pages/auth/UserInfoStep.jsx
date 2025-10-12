import React, { useState, useEffect } from "react"; 
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Alert from "../../components/ui/Alert.jsx";
import api from "../../api/axios";
import { validatePassword, validateConfirmPassword } from "../../utils/validate";
import { decodeState } from "../../utils/urlState";

const UserInfoStep = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFocused, setIsFocused] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Extract email from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const encodedEmail = params.get("state");
    const decoded = decodeState(encodedEmail);
    if (decoded?.email) setEmail(decoded.email);
  }, [location.search]);

  // ✅ Detect device and session info 
  const getSessionInfo = () => {
    const deviceName = navigator.platform || "Unknown Device";
    const userAgent = navigator.userAgent || "Unknown UA";
    const deviceType = /Mobi|Android/i.test(navigator.userAgent)
      ? "mobile"
      : /Tablet|iPad/i.test(navigator.userAgent)
        ? "tablet"
        : "desktop";

    return {
      device_name: deviceName,
      device_type: deviceType,
      user_agent: userAgent,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    if (passwordError) return setError(t(`userInfo.${passwordError}`));
    if (confirmError) return setError(t(`userInfo.${confirmError}`));

    setLoading(true);
    setError("");

    try {
      // Get language from localStorage (fallback to "rw")
      const language = localStorage.getItem("lang") || "rw";

      // ✅ Get device/session info
      const sessionInfo = getSessionInfo();

      // ✅ Send all data to backend
      const res = await api.post("/auth/user-info", { 
        email, 
        password, 
        language,
        ...sessionInfo,
      }, { withCredentials: true }); // set cookies

      if (res.status === 200) {
        // ✅ Redirect to subscription page after successful signup
        navigate("/dashboard", { replace: true });
      } else {
        setError(t("userInfo.server_error"));
      }
    } catch (err) {
      console.error(err);
      setError(t("userInfo.server_error"));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-4 text-lg bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] peer";

  const labelClass = (fieldValue, field) =>
    `absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:text-[#BC8BBC] ${
      fieldValue || isFocused[field] ? "text-xs -translate-y-6 text-[#BC8BBC]" : "text-lg"
    }`;

  return (
    <div className="w-full max-w-md mx-auto relative">
      {(loading) && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 overflow-hidden rounded-t">
          <div className="h-1 w-1/3 bg-[#BC8BBC] animate-loader"></div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={`flex flex-col gap-6 bg-transparent relative ${
          loading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {error && <Alert message={error} type="error" />}

        <p className="text-gray-400 text-center mb-2">{t("userInfo.enter_details_desc")}</p>

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsFocused({ ...isFocused, password: true })}
            onBlur={() => setIsFocused({ ...isFocused, password: false })}
            className={inputClass}
          />
          <label className={labelClass(password, "password")}>
            {t("userInfo.password_placeholder")}
          </label>
          {password && (
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-300 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setIsFocused({ ...isFocused, confirmPassword: true })}
            onBlur={() => setIsFocused({ ...isFocused, confirmPassword: false })}
            className={inputClass}
          />
          <label className={labelClass(confirmPassword, "confirmPassword")}>
            {t("userInfo.confirm_password_placeholder")}
          </label>
          {confirmPassword && (
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-300 hover:text-white"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium py-3 rounded-md transition-colors duration-200 text-base ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? t("userInfo.loading") : t("userInfo.continue")}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          {t("userInfo.disclaimer_before")}{" "}
          <a href="/terms" className="text-[#BC8BBC] hover:underline">
            {t("userInfo.terms")}
          </a>{" "}
          {t("userInfo.and")}{" "}
          <a href="/privacy" className="text-[#BC8BBC] hover:underline">
            {t("userInfo.privacy")}
          </a>.
        </p>
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
  );
};

export default UserInfoStep;
