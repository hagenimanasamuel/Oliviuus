import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SubscriptionCard from "../../components/subscription/SubscriptionCard.jsx";
import ProfileMenu from "../../components/ui/ProfileMenu.jsx";  // ✅ import
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const plans = [
    { id: "free_trial", title: t("subscription.free_trial"), price: t("subscription.free_price"), description: t("subscription.free_desc") },
    { id: "basic", title: t("subscription.basic"), price: t("subscription.basic_price"), description: t("subscription.basic_desc") },
    { id: "standard", title: t("subscription.standard"), price: t("subscription.standard_price"), description: t("subscription.standard_desc") },
    { id: "premium", title: t("subscription.premium"), price: t("subscription.premium_price"), description: t("subscription.premium_desc") },
  ];

  const handleSelectPlan = async (planId) => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/subscription/select", { plan: planId });
      if (res.status === 200) {
        navigate("/home", { replace: true });
      } else {
        setError(t("subscription.server_error"));
      }
    } catch (err) {
      console.error(err);
      setError(t("subscription.server_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 🔹 Header with profile */}
      <div className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">{t("subscription.choose_plan")}</h1>
        <ProfileMenu /> {/* ✅ Profile dropdown */}
      </div>

      {/* Plans */}
      <div className="flex-1 flex flex-col items-center py-10 px-4">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {plans.map((plan) => (
            <SubscriptionCard 
              key={plan.id} 
              plan={plan} 
              onSelect={() => handleSelectPlan(plan.id)} 
              loading={loading} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
