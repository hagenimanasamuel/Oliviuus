import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";

function AppWrapper() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default AppWrapper;