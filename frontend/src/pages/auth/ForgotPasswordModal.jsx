import React, { useState } from "react";
import { Mail, AlertTriangle } from "lucide-react";
import api from "../../api/axios";
import { useTranslation } from "react-i18next";
import Alert from "../../components/ui/Alert.jsx";

export default function ForgotPasswordModal({ isOpen, onClose, email }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSendLink = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/request-password-reset", { email });
      setSuccess(t("auth.reset_link_sent", { email }));
      // Automatically close modal after short delay
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("❌ Reset link error:", err);
      setError(err.response?.data?.error || t("auth.reset_link_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1A1A] text-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fadeIn border border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-2 text-[#BC8BBC] mb-4">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">{t("auth.reset_password")}</h2>
        </div>

        {/* Message */}
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-3 rounded-md mb-4">
          <Mail className="w-5 h-5 text-gray-400" />
          <span className="text-sm">
            {t("auth.reset_link_confirm")}{" "}
            <span className="font-medium text-white">{email}</span>?
          </span>
        </div>

        {/* Alerts */}
        {error && <Alert message={error} type="error" />}
        {success && <Alert message={success} type="success" />}

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border border-gray-600 hover:bg-gray-700 transition"
          >
            {t("auth.cancel")}
          </button>
          <button
            onClick={handleSendLink}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-md text-white transition ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-[#BC8BBC] hover:bg-[#9b69b2]"
            }`}
          >
            {loading ? t("auth.sending") : t("auth.send_reset_link")}
          </button>
        </div>
      </div>
    </div>
  );
}
