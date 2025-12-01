import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import ProfileSelector from "./components/layout/dashboard/viewer/kid/ProfileSelector";
import { useAuth } from "./context/AuthContext";

// Create a wrapper component to handle the profile selection logic
function AppWithProfileSelection() {
  const { user, loading, showProfileSelector } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Only show selector if user exists AND selector should be shown
  // Remove the !kidProfile check since it causes the issue with "My Account"
  if (user && showProfileSelector) {
    return <ProfileSelector />;
  }

  // Show main app routes in all other cases
  return <AppRoutes />;
}

function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Router>
          <AppWithProfileSelection />
        </Router>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;