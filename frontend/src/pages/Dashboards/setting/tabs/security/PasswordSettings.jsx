import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../../../../../api/axios";
import Alert from "../../../../../components/ui/Alert.jsx";
import Toast from "../../../../../components/ui/Toast";

export default function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [toast, setToast] = useState({ message: "", type: "info" });

  const validatePassword = (pwd) => {
    const lengthValid = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return lengthValid && hasUpper && hasLower && hasNumber && hasSymbol;
  };

const handleChangePassword = async () => {
  setAlertMessage("");
  
  if (newPassword !== confirmPassword) {
    setAlertType("error");
    setAlertMessage("Passwords do not match");
    return;
  }

  if (!validatePassword(newPassword)) {
    setAlertType("error");
    setAlertMessage(
      "Password must be 8+ chars and include uppercase, lowercase, number & symbol."
    );
    return;
  }

  if (!currentPassword) {
    setAlertType("error");
    setAlertMessage("Current password is required.");
    return;
  }

  setLoading(true);

  try {
    const res = await api.put(
      "/user/update-password",
      { currentPassword, newPassword },
      { withCredentials: true }
    );

    setAlertType("success");
    setAlertMessage(res.data.message || "Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (err) {
    console.error(err);

    // ✅ Extract message from server response, fallback if missing
    const serverMessage = err.response?.data?.message || "Failed to update password.";

    setAlertType("error");
    setAlertMessage(serverMessage);
  } finally {
    setLoading(false);
  }
};



  const handleRequestReset = async () => {
    try {
      await api.post("/user/request-password-reset", {}, { withCredentials: true });
      setToast({ message: "Password reset link sent to your email.", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: err.response?.data?.message || "Failed to send reset link.", type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      {alertMessage && (
        <Alert
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertMessage("")}
        />
      )}

      <div>
        <label className="block text-gray-400 mb-1">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]"
          />
          <span
            className="absolute right-3 top-2.5 cursor-pointer"
            onClick={() => setShowCurrent(!showCurrent)}
          >
            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Forgot your current password? <span
            onClick={handleRequestReset}
            className="text-[#BC8BBC] hover:underline cursor-pointer"
          >
            Request a reset link
          </span>
        </p>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">New Password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]"
          />
          <span
            className="absolute right-3 top-2.5 cursor-pointer"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Must be 8+ chars, include uppercase, lowercase, number & symbol
        </p>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]"
          />
          <span
            className="absolute right-3 top-2.5 cursor-pointer"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </span>
        </div>
      </div>

      <button
        onClick={handleChangePassword}
        disabled={loading}
        className={`px-6 py-3 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-medium rounded-lg transition cursor-pointer ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Saving..." : "Update Password"}
      </button>

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />
      )}
    </div>
  );
}
