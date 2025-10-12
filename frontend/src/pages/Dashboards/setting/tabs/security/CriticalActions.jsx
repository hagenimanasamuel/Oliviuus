import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import api from "../../../../../api/axios";
import Popup from "../../../../../components/ui/Popup";
import Toast from "../../../../../components/ui/Toast";
import { useTranslation } from "react-i18next";

export default function CriticalActions() {
  const { t } = useTranslation();
  const [popupOpen, setPopupOpen] = useState(false);
  const [criticalAction, setCriticalAction] = useState(""); // "delete" or "deactivate"
  const [criticalLoading, setCriticalLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const handleCriticalAction = async () => {
    setCriticalLoading(true);
    try {
      if (criticalAction === "delete") {
        await api.delete("/user/delete-account", { withCredentials: true });
        setToast({ message: t("criticalActions.deleteSuccess"), type: "success" });
      } else if (criticalAction === "deactivate") {
        await api.put("/user/deactivate-account", {}, { withCredentials: true });
        setToast({ message: t("criticalActions.deactivateSuccess"), type: "success" });
      }
    } catch (err) {
      console.error(err);
      setToast({
        message: err.response?.data?.message || t("criticalActions.actionFailed"),
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
        <AlertTriangle size={18} /> {t("criticalActions.warning")}
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
        {criticalLoading ? t("criticalActions.processing") : t("criticalActions.deactivate")}
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
        {criticalLoading ? t("criticalActions.processing") : t("criticalActions.delete")}
      </button>

      <p className="text-gray-400 text-sm mt-2">
        {t("criticalActions.info")}
      </p>

      <Popup
        isOpen={popupOpen}
        message={t("criticalActions.confirm", { action: t(`criticalActions.${criticalAction}`) })}
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
