// src/pages/auth/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../../components/ui/Alert.jsx";
import api from "../../api/axios"; 
import Logo from "../../components/Logo"; 

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFocused, setIsFocused] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) setError(t("auth.invalid_reset_link"));
  }, [token, t]);

  const inputClass =
    "w-full px-4 py-4 text-lg bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] peer border border-gray-600";

  const labelClass = (fieldValue, focused) =>
    `absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 peer-focus:text-[#BC8BBC] ${
      fieldValue || focused ? "text-xs -translate-y-6 text-[#BC8BBC]" : "text-lg"
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password.trim() || !confirmPassword.trim()) {
      return setError(t("auth.enter_password"));
    }

    if (password !== confirmPassword) {
      return setError(t("auth.password_mismatch"));
    }

    try {
      setLoading(true);
      await api.post("/auth/reset-password", { token, password });
      setSuccess(t("auth.password_reset_success"));
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      console.error("❌ Reset failed:", err);
      setError(err.response?.data?.error || t("auth.server_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0D0D0D] p-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-[#1A1A1A] p-8 rounded-xl w-full max-w-md border border-gray-700 shadow-lg"
      >
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>

        <h2 className="text-2xl font-bold text-center text-white">
          {t("auth.reset_password")}
        </h2>

        {error && <Alert message={error} type="error" />}
        {success && <Alert message={success} type="success" />}

        {/* New Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setIsFocused({ ...isFocused, password: true })}
            onBlur={() => setIsFocused({ ...isFocused, password: false })}
            className={inputClass}
          />
          <label className={labelClass(password, isFocused.password)}>
            {t("auth.new_password")}
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
            onFocus={() => setIsFocused({ ...isFocused, confirm: true })}
            onBlur={() => setIsFocused({ ...isFocused, confirm: false })}
            className={inputClass}
          />
          <label className={labelClass(confirmPassword, isFocused.confirm)}>
            {t("auth.confirm_password")}
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
          className={`w-full ${
            loading ? "bg-gray-500" : "bg-[#BC8BBC] hover:bg-[#9b69b2]"
          } text-white font-medium py-3 rounded-lg transition`}
        >
          {loading ? t("auth.loading") : t("auth.reset_password_button")}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
