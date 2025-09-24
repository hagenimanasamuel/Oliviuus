// src/pages/Dashboards/ViewerDashboard.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import DashboardHeader from "../../components/layout/DashboardHeader";

const ViewerDashboard = () => {
  const { user, logoutUser } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      logoutUser();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center p-6">
      <DashboardHeader />
      <h1 className="text-2xl font-bold mb-4">
        Welcome, <span className="text-[#BC8BBC]">{user.email}</span> 👋
      </h1>
      <p className="text-gray-300 mb-6">Role: Viewer</p>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-500 py-2 px-6 rounded-lg font-medium"
      >
        Logout
      </button>
    </div>
  );
};

export default ViewerDashboard;
