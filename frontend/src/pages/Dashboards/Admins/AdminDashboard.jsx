// src/pages/dashboards/admin/AdminDashboard.jsx
import React from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import AdminLayout from "../../../components/layout/dashboard/admin/AdminLayout";

export default function AdminDashboard({ bodyContent }) {
  const { user, logoutUser } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      logoutUser();
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      {/* Render the dynamic body content */}
      {bodyContent}
    </AdminLayout>
  );
}
