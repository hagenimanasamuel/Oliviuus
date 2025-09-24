import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import api from "../../../../../api/axios";
import Popup from "../../../../../components/ui/Popup";
import Toast from "../../../../../components/ui/Toast";

export default function CriticalActions() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [criticalAction, setCriticalAction] = useState(""); // "delete" or "deactivate"
  const [criticalLoading, setCriticalLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const handleCriticalAction = async () => {
    setCriticalLoading(true);
    try {
      if (criticalAction === "delete") {
        await api.delete("/user/delete-account", { withCredentials: true });
        setToast({ message: "Account deleted successfully.", type: "success" });
      } else if (criticalAction === "deactivate") {
        await api.put("/user/deactivate-account", {}, { withCredentials: true });
        setToast({ message: "Account deactivated successfully.", type: "success" });
      }
    } catch (err) {
      console.error(err);
      setToast({
        message: err.response?.data?.message || "Failed to perform action.",
        type: "error",
      });
    } finally {
      setCriticalLoading(false);
      setPopupOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <p className="text-red-400 flex items-center gap-2">
        <AlertTriangle size={18} /> Warning: Critical account actions
      </p>
      <button
        onClick={() => {
          setCriticalAction("deactivate");
          setPopupOpen(true);
        }}
        disabled={criticalLoading}
        className={`w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition cursor-pointer ${
          criticalLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {criticalLoading ? "Processing..." : "Deactivate Account"}
      </button>
      <button
        onClick={() => {
          setCriticalAction("delete");
          setPopupOpen(true);
        }}
        disabled={criticalLoading}
        className={`w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition cursor-pointer ${
          criticalLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {criticalLoading ? "Processing..." : "Delete Account"}
      </button>

      <p className="text-gray-400 text-sm mt-2">
        Deactivating will temporarily disable your account. Deleting will permanently remove all data.
      </p>

      <Popup
        isOpen={popupOpen}
        message={`Are you sure you want to ${criticalAction} your account? This action cannot be undone.`}
        onConfirm={handleCriticalAction}
        onCancel={() => setPopupOpen(false)}
      />

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
