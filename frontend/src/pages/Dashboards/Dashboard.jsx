// src/pages/Dashboards/Dashboard.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ViewerDashboard from "./ViewerDashboard";
import AdminDashboard from "./Admins/AdminDashboard.jsx";
import Overview from "./Admins/overview/Overview.jsx"; // 

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center mt-10 text-white">Loading...</p>;
  }

  if (!user) return <Navigate to="/auth" replace />;

  // ✅ Dynamically render dashboard based on role
  switch (user.role) {
    case "viewer":
      return <ViewerDashboard />;
    case "admin":
      return <AdminDashboard bodyContent={<Overview />} />;
    default:
      return <Navigate to="/" replace />; // fallback for undefined roles
  }
};

export default Dashboard;
