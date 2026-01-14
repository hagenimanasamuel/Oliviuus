import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import EditableEmail from "../../components/ui/EditableEmail";
import ForgotPasswordModal from "./ForgotPasswordModal";
import Alert from "../../components/ui/Alert.jsx";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";

const PasswordStep = ({ email }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginUser, user: currentUser } = useAuth();
  const { currentSubscription } = useSubscription();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Redirect immediately if already logged in
  useEffect(() => {
    if (currentUser) {
      // Check if user is a viewer without subscription
      if (currentUser.role === "viewer" && !currentSubscription) {
        navigate("/subscription", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [currentUser, currentSubscription, navigate]);

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
    setAlert({ type: "error", message: "Please enter your password" });
    return;
  }

  try {
    setLocalLoading(true);
    
    // Use 'identifier' instead of 'email'
    const response = await api.post("/auth/login", {
      identifier: email,  // email could be email, phone, or username
      password,
      device_name: navigator.userAgent,
      device_type: 'web',
      user_agent: navigator.userAgent,
      redirectUrl: redirectUrl || "/"
    }, { withCredentials: true }); // Important for cookies!

    if (response.data.success) {
      // Fetch user info after successful login
      const userRes = await api.get("/auth/me", { withCredentials: true });
      
      // Check subscription status
      try {
        const subscriptionRes = await api.get("/subscriptions/user/current", {
          withCredentials: true
        });
        
        // Determine redirect based on role and subscription
        if (userRes.data.role === "viewer" && (!subscriptionRes.data?.success || !subscriptionRes.data?.data)) {
          // Viewer without subscription
          window.location.href = "/subscription";
        } else if (userRes.data.role === "admin") {
          // Admin
          window.location.href = "/admin";
        } else {
          // Viewer with subscription or other roles
          window.location.href = redirectUrl || "/";
        }
      } catch (subscriptionError) {
        console.error("Subscription check failed:", subscriptionError);
        // Fallback redirect
        if (userRes.data.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = redirectUrl || "/";
        }
      }
    } else {
      setAlert({ type: "error", message: response.data.error || "Login failed" });
    }
  } catch (err) {
    console.error('Login error:', err);
    
    if (err.response?.status === 401 || err.response?.status === 400) {
      setAlert({ type: "error", message: "Invalid identifier or password" });
    } else if (err.response?.status === 403) {
      // Handle verification required
      if (err.response.data?.requires_verification) {
        setAlert({ 
          type: "error", 
          message: `${err.response.data.error} Click here to verify.` 
        });
      } else {
        setAlert({ type: "error", message: err.response.data?.error || "Account disabled" });
      }
    } else if (err.response?.status === 429) {
      setAlert({ type: "error", message: "Too many attempts. Account locked for 15 minutes." });
    } else {
      setAlert({ type: "error", message: "Server error. Please try again." });
    }
  } finally {
    setLocalLoading(false);
  }
};

  const inputClass =
    "w-full px-4 py-4 text-lg bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] peer border border-gray-600";

  const labelClass = (fieldValue) =>
    `absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:text-[#BC8BBC] ${fieldValue || isFocused ? "text-xs -translate-y-6 text-[#BC8BBC]" : "text-lg"
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
        <span
          onClick={() => setIsForgotOpen(true)}
          className="text-[#BC8BBC] hover:underline cursor-pointer"
        >
          {t("auth.forgot_password")}
        </span>
        <ForgotPasswordModal
          isOpen={isForgotOpen}
          onClose={() => setIsForgotOpen(false)}
          email={email}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full ${loading ? "bg-gray-500" : "bg-[#BC8BBC] hover:bg-[#9b69b2]"
          } text-white font-medium py-3 rounded-lg transition`}
      >
        {loading ? t("auth.loading") : t("auth.login")}
      </button>
    </form>
  );
};

export default PasswordStep;