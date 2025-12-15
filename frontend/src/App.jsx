import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import ProfileSelector from "./components/layout/dashboard/viewer/kid/ProfileSelector";
import { useAuth } from "./context/AuthContext";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "./components/Logo";
import { GoogleOAuthProvider } from '@react-oauth/google';

// ==================== ELEGANT LOADING SCREEN ====================
const ElegantLoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoScale, setLogoScale] = useState(1);
  const [glowIntensity, setGlowIntensity] = useState(0.2);

  useEffect(() => {
    const breathInterval = setInterval(() => {
      setLogoScale(prev => prev === 1 ? 1.02 : 1);
      setGlowIntensity(prev => prev === 0.2 ? 0.25 : 0.2);
    }, 2000);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 500);

    return () => {
      clearInterval(breathInterval);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-950 via-black to-gray-950 flex items-center justify-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#BC8BBC]/5 via-transparent to-[#BC8BBC]/5" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] bg-[#BC8BBC]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main logo with elegant effects */}
      <div className="relative z-10">
        <div className="relative" style={{ transform: `scale(${logoScale})`, transition: 'transform 2s ease-in-out' }}>
          {/* Glow effect */}
          <div
            className="absolute inset-[-30px] blur-3xl rounded-full transition-opacity duration-2000"
            style={{
              backgroundColor: '#BC8BBC',
              opacity: glowIntensity
            }}
          />

          {/* Outer ring */}
          <div className="absolute inset-[-15px] border border-[#BC8BBC]/30 rounded-full" />

          {/* Logo */}
          <div className="relative">
            <Logo className="w-28 h-28 md:w-36 md:h-36 text-white" />
          </div>
        </div>
      </div>

      {/* Smooth fade-out overlay */}
      <div className="absolute inset-0 bg-black/0" />
    </div>
  );
};

// ==================== MAIN APPLICATION COMPONENT ====================
function App() {
  // Asset preloading for optimal performance
  useEffect(() => {
    const preloadCriticalAssets = () => {
      // Preload fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.as = 'font';
      fontLink.href = '/fonts/inter.woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);
    };

    preloadCriticalAssets();
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <AppContent />
          </Router>
        </SubscriptionProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

// ==================== APP CONTENT (Everything inside providers) ====================
function AppContent() {
  const { user, loading: authLoading, showProfileSelector } = useAuth();
  const { t } = useTranslation();

  // ==================== GOOGLE ONE-TAP MODAL (INSIDE AuthProvider) ====================
  const GoogleOneTapModal = () => {
    const oneTapContainerRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
      // Load Google Identity Services script
      const loadGoogleScript = () => {
        if (window.google || document.querySelector('script[src*="accounts.google.com"]')) {
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setIsInitialized(true);
        document.body.appendChild(script);
      };

      loadGoogleScript();
    }, []);

    useEffect(() => {
      if (!user && isInitialized && window.google?.accounts?.id) {
        // Initialize Google One-Tap
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleOneTapSuccess,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: 'signin',
          itp_support: true,
        });

        // Display One-Tap
        window.google.accounts.id.prompt((notification) => {
          // Optional: Handle notifications if needed
        });
      }

      return () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.cancel();
        }
      };
    }, [user, isInitialized]);

    const handleGoogleOneTapSuccess = async (response) => {
      try {
        // Send token to your backend
        const result = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: response.credential })
        });

        if (result.ok) {
          // Reload page to update auth state
          window.location.reload();
        }
      } catch (error) {
        console.error('Google One-Tap login failed:', error);
      }
    };

    if (user) return null;

    return (
      <div 
        ref={oneTapContainerRef}
        id="g_id_onload"
        className="fixed top-4 right-4 z-50"
        data-client_id={import.meta.env.VITE_GOOGLE_CLIENT_ID}
        data-context="signin"
        data-ux_mode="popup"
        data-auto_prompt="false"
      />
    );
  };

  // Optimized state management
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  // Performance optimizations
  const connectionTimeoutRef = useRef(null);
  const installTimeoutRef = useRef(null);

  // Internet connection monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowConnectionStatus(true);

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      connectionTimeoutRef.current = setTimeout(() => {
        setShowConnectionStatus(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowConnectionStatus(true);
    };

    window.addEventListener('online', handleOnline, { passive: true });
    window.addEventListener('offline', handleOffline, { passive: true });

    if (!navigator.onLine) {
      setShowConnectionStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // PWA installation handling - REMOVED DEVICE CHECK
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (installTimeoutRef.current) {
        clearTimeout(installTimeoutRef.current);
      }
      installTimeoutRef.current = setTimeout(() => {
        setShowInstallButton(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { passive: true });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (installTimeoutRef.current) {
        clearTimeout(installTimeoutRef.current);
      }
    };
  }, []); // Removed isDesktop dependency

  // Install button auto-hide - REMOVED DEVICE CHECK
  useEffect(() => {
    if (!showInstallButton) return;

    const hideTimer = setTimeout(() => {
      setShowInstallButton(false);
    }, 30000);

    return () => clearTimeout(hideTimer);
  }, [showInstallButton]); // Removed isDesktop dependency

  // Loading screen management
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, authLoading ? 600 : 300);

    return () => clearTimeout(timer);
  }, [authLoading]);

  // Show elegant loading screen during initial load
  if (showLoadingScreen) {
    return <ElegantLoadingScreen />;
  }

  // Profile selection screen
  if (user && showProfileSelector) {
    return (
      <>
        <ProfileSelector />

        {showConnectionStatus && (
          <div className={`fixed bottom-4 left-4 z-50 px-4 py-2.5 rounded-xl backdrop-blur-sm border transition-all duration-300 ${isOnline
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Offline</span>
                </>
              )}
            </div>
          </div>
        )}

        {showInstallButton && (
          <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
            <button
              onClick={async () => {
                if (deferredPrompt) {
                  try {
                    await deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    setDeferredPrompt(null);
                    setShowInstallButton(false);
                  } catch (error) {
                    console.error('Installation error:', error);
                  }
                }
              }}
              className="group relative bg-gradient-to-br from-[#BC8BBC]/10 to-purple-600/10 hover:from-[#BC8BBC]/20 hover:to-purple-600/20 backdrop-blur-sm border border-[#BC8BBC]/30 hover:border-[#BC8BBC]/50 text-[#BC8BBC] hover:text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-1"
              title="Install Oliviuus"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">Install</span>
            </button>
          </div>
        )}
      </>
    );
  }

  // Main application routes
  return (
    <>
      {/* Google One-Tap Modal (floating at top-right like LinkedIn) */}
      <GoogleOneTapModal />
      
      <AppRoutes />

      {showConnectionStatus && (
        <div className={`fixed bottom-4 left-4 z-50 px-4 py-2.5 rounded-xl backdrop-blur-sm border transition-all duration-300 ${isOnline
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Offline</span>
              </>
            )}
          </div>
        </div>
      )}

      {showInstallButton && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <button
            onClick={async () => {
              if (deferredPrompt) {
                try {
                  await deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                  setShowInstallButton(false);
                } catch (error) {
                  console.error('Installation error:', error);
                }
              }
            }}
            className="group relative bg-gradient-to-br from-[#BC8BBC]/10 to-purple-600/10 hover:from-[#BC8BBC]/20 hover:to-purple-600/20 backdrop-blur-sm border border-[#BC8BBC]/30 hover:border-[#BC8BBC]/50 text-[#BC8BBC] hover:text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-1"
            title="Install Oliviuus"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium opacity-80 group-hover:opacity-100 transition-opacity">Install</span>
          </button>
        </div>
      )}

      {/* Add fade-in animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in;
          }
        `}
      </style>
    </>
  );
}

export default App;