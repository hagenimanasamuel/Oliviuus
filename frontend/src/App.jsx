import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import ProfileSelector from "./components/layout/dashboard/viewer/kid/ProfileSelector";
import { useAuth } from "./context/AuthContext";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

// Create a wrapper component to handle the profile selection logic
function AppWithProfileSelection() {
  const { user, loading, showProfileSelector } = useAuth();
  const { t } = useTranslation();
  
  // ADD PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // ADD Internet Connection State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  // ADD Internet Connection Effect
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowConnectionStatus(true);
      // Hide the status after 3 seconds when back online
      setTimeout(() => {
        setShowConnectionStatus(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowConnectionStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowConnectionStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ADD Device Detection Effect
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|webos|blackberry|windows phone/.test(userAgent);
      const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/.test(userAgent);
      setIsDesktop(!isMobile && !isTablet);
    };

    checkDevice();
    
    // Optional: Listen for resize to handle responsive changes
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // ADD PWA Install Prompt Effect (Only for Desktop)
  useEffect(() => {
    if (!isDesktop) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install button after a delay for better UX
      setTimeout(() => {
        setShowInstallButton(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

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
  }, [isDesktop]); // Only run when isDesktop changes

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

  // ADD Auto-hide Install Button Effect
  useEffect(() => {
    if (!showInstallButton || !isDesktop) return;

    // Auto-hide after 30 seconds
    const hideTimer = setTimeout(() => {
      setShowInstallButton(false);
    }, 30000);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [showInstallButton, isDesktop]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Only show selector if user exists AND selector should be shown
  if (user && showProfileSelector) {
    return (
      <>
        <ProfileSelector />
        {/* ADD Internet Connection Indicator (Bottom Left) */}
        {showConnectionStatus && (
          <div className={`fixed bottom-4 left-4 z-50 px-4 py-2.5 rounded-xl backdrop-blur-sm border transition-all duration-300 ${isOnline
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">{t('connectionIndicator.online', 'Internet connection restored')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">{t('connectionIndicator.offline', 'No internet connection')}</span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* ADD Minimal Install Button (Desktop Only) */}
        {showInstallButton && isDesktop && (
          <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <button 
              onClick={handleInstallClick}
              className="group relative bg-gradient-to-br from-purple-500/10 to-indigo-600/10 hover:from-purple-500/20 hover:to-indigo-600/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-1"
              title="Install App"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">Install</span>
              
              {/* Optional: Add a subtle glow effect on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-indigo-600/0 group-hover:from-purple-500/5 group-hover:to-indigo-600/5 transition-all duration-300" />
            </button>
          </div>
        )}
      </>
    );
  }

  // Show main app routes in all other cases
  return (
    <>
      <AppRoutes />
      
      {/* ADD Internet Connection Indicator (Bottom Left) */}
      {showConnectionStatus && (
        <div className={`fixed bottom-4 left-4 z-50 px-4 py-2.5 rounded-xl backdrop-blur-sm border transition-all duration-300 ${isOnline
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm">{t('connectionIndicator.online', 'Internet connection restored')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">{t('connectionIndicator.offline', 'No internet connection')}</span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* ADD Minimal Install Button (Desktop Only) */}
      {showInstallButton && isDesktop && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <button 
            onClick={handleInstallClick}
            className="group relative bg-gradient-to-br from-purple-500/10 to-indigo-600/10 hover:from-purple-500/20 hover:to-indigo-600/20 backdrop-blur-sm border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-1"
            title="Install App"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">Install</span>
            
            {/* Optional: Add a subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-indigo-600/0 group-hover:from-purple-500/5 group-hover:to-indigo-600/5 transition-all duration-300" />
          </button>
        </div>
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