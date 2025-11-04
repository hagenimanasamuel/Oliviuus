import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../api/axios";
import ViewerLayout from "../../components/layout/dashboard/viewer/ViewerLayout";

export default function ViewerDashboard({ bodyContent }) {
  const { user, logoutUser } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      logoutUser();
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  const content = bodyContent || <ViewerLandingPage />;

  return (
    <ViewerLayout user={user} onLogout={handleLogout}>
      {/* Render the dynamic body content */}
      {bodyContent}
    </ViewerLayout>
  );
}
