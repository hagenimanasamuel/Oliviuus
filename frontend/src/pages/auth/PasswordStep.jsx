import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import EditableEmail from "../../components/ui/EditableEmail";
import Alert from "../../components/ui/Alert.jsx";
import api from "../../api/axios"; // pre-configured Axios
import { useAuth } from "../../context/AuthContext";

const PasswordStep = ({ email }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginUser, user: currentUser } = useAuth(); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Redirect immediately if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/", { replace: true });
    }
  }, [currentUser, navigate]);

  // ✅ Detect device and user info
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
    if (!password.trim()) {
      return setError(t("auth.enter_password"));
    }

    try {
      setLoading(true);
      setError("");

      const sessionInfo = getSessionInfo();

      // ✅ Login request including device/session info
      await api.post(
        "/auth/login",
        { email, password, ...sessionInfo },
        { withCredentials: true }
      );

      // ✅ Fetch logged-in user info
      const res = await api.get("/auth/me", { withCredentials: true });
      loginUser(res.data); // update context instantly

      // ✅ Redirect to dashboard
      navigate("/", { replace: true });
    } catch (err) {
      console.error("❌ Login failed:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(t("auth.server_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-4 text-lg bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] peer border border-gray-600";

  const labelClass = (fieldValue) =>
    `absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:text-[#BC8BBC] ${
      fieldValue || isFocused ? "text-xs -translate-y-6 text-[#BC8BBC]" : "text-lg"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 bg-transparent relative"
    >
      <h2 className="text-xl font-semibold text-center">{t("auth.login_title")}</h2>

      <p className="text-gray-400 text-center">
        <EditableEmail email={email} />
      </p>

      {error && <Alert message={error} type="error" />}

      {/* Password input */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={inputClass}
        />
        <label className={labelClass(password)}>
          {t("auth.password_placeholder")}
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

      <div className="flex justify-between text-sm">
        <Link to="/forgot-password" className="text-[#BC8BBC] hover:underline">
          {t("auth.forgot_password")}
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full ${
          loading ? "bg-gray-500" : "bg-[#BC8BBC] hover:bg-[#9b69b2]"
        } text-white font-medium py-3 rounded-lg transition`}
      >
        {loading ? t("auth.loading") : t("auth.login")}
      </button>
    </form>
  );
};

export default PasswordStep;
