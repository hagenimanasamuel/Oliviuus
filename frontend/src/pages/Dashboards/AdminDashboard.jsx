// src/pages/Dashboards/AdminDashboard.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import DashboardHeader from "../../components/layout/DashboardHeader";
import {
  Users,
  BarChart3,
  CreditCard,
  Settings,
} from "lucide-react";

const AdminDashboard = () => {
  const { user, logoutUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
      logoutUser();
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ✅ Global Header */}
      <DashboardHeader user={user} onLogout={handleLogout} />

      {/* ✅ Body layout (Sidebar + Content) */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 p-4 hidden md:block">
          <h2 className="text-xl font-bold mb-6">Admin Menu</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === "overview"
                  ? "bg-[#BC8BBC] text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <BarChart3 className="mr-2 h-5 w-5" /> Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === "users"
                  ? "bg-[#BC8BBC] text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Users className="mr-2 h-5 w-5" /> Manage Users
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === "subscriptions"
                  ? "bg-[#BC8BBC] text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <CreditCard className="mr-2 h-5 w-5" /> Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition ${
                activeTab === "settings"
                  ? "bg-[#BC8BBC] text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Settings className="mr-2 h-5 w-5" /> Settings
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold mb-2">
            Admin Panel:{" "}
            <span className="text-[#BC8BBC]">{user?.email}</span>
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Role: <span className="font-medium">Admin</span>
          </p>

          {/* Content area depends on active tab */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-md">
            {activeTab === "overview" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Overview</h2>
                <p className="text-gray-300">
                  Quick stats, analytics, and recent activities will be shown here.
                </p>
              </>
            )}

            {activeTab === "users" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
                <p className="text-gray-300">
                  User management section: view, suspend, or promote users.
                </p>
              </>
            )}

            {activeTab === "subscriptions" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Subscriptions</h2>
                <p className="text-gray-300">
                  Manage subscription plans, billing cycles, and payments.
                </p>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Admin Settings</h2>
                <p className="text-gray-300">
                  Platform configurations and admin preferences.
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
