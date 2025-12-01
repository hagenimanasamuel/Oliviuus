import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * @param {ReactNode} children - Component to render
 * @param {Array} allowedRoles - array of strings, e.g., ["admin", "viewer"]
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  if (!user) {
    // user not logged in
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // user logged in but not allowed
    return <Navigate to="/" replace />; // redirect to landing or dashboard home
  }

  return children;
};

export default ProtectedRoute;
