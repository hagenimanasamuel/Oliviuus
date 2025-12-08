import React, { useState, useEffect } from "react"; // ADD useState, useEffect
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import ProfileSelector from "./components/layout/dashboard/viewer/kid/ProfileSelector";
import { useAuth } from "./context/AuthContext";

// Create a wrapper component to handle the profile selection logic
function AppWithProfileSelection() {
  const { user, loading, showProfileSelector } = useAuth();
  
  // ADD PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // ADD PWA Install Prompt Effect
  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is already installed');
        setShowInstallButton(false);
      }
    };

    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // ADD PWA Install Handler
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

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
    return (
      <>
        <ProfileSelector />
        {/* ADD Install Button Overlay */}
        {showInstallButton && (
          <button 
            onClick={handleInstallClick}
            className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Install App
          </button>
        )}
      </>
    );
  }

  // Show main app routes in all other cases
  return (
    <>
      <AppRoutes />
      {/* ADD Install Button Overlay */}
      {showInstallButton && (
        <button 
          onClick={handleInstallClick}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Install App
        </button>
      )}
    </>
  );
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