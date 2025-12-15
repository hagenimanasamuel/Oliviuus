import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuth } from "../../context/AuthContext";
import ProfileMenu from "../../components/ui/ProfileMenu";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from '@react-oauth/google';
import api from "../../api/axios";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showOneTap, setShowOneTap] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const headerRef = useRef(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  const oneTapTimerRef = useRef(null);

  // Handle Google Sign-In Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    
    try {
      const response = await api.post("/auth/google", { 
        token: credentialResponse.credential 
      });

      if (response.data && response.data.success) {
        // Hide One-Tap immediately on success
        setShowOneTap(false);
        // Redirect to dashboard
        window.location.href = '/';
      } else {
        throw new Error(response.data?.error || 'Google authentication failed');
      }
    } catch (error) {
      alert(error.message || "Google login failed. Please try again.");
      setShowOneTap(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    alert("Google login failed. Please try again.");
    setShowOneTap(false);
  };

  // Show One-Tap for non-logged-in users after a delay
  useEffect(() => {
    if (!user) {
      // Clear any existing timer
      if (oneTapTimerRef.current) {
        clearTimeout(oneTapTimerRef.current);
      }

      // Show One-Tap after 3 seconds on homepage or 1 second on other pages
      const isHomePage = window.location.pathname === '/';
      const delay = isHomePage ? 3000 : 1000;
      
      oneTapTimerRef.current = setTimeout(() => {
        setShowOneTap(true);
        
        // Auto-hide after 15 seconds if not interacted with
        const hideTimer = setTimeout(() => {
          setShowOneTap(false);
        }, 15000);
        
        return () => clearTimeout(hideTimer);
      }, delay);
    } else {
      setShowOneTap(false);
    }

    return () => {
      if (oneTapTimerRef.current) {
        clearTimeout(oneTapTimerRef.current);
      }
    };
  }, [user, window.location.pathname]);

  // Hide One-Tap when scrolling
  useEffect(() => {
    if (showOneTap && isScrolled) {
      setShowOneTap(false);
    }
  }, [isScrolled, showOneTap]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide header
        setIsVisible(false);
      } else {
        // Scrolling up - show header
        setIsVisible(true);
      }
      
      // Set background when scrolled past 100px
      setIsScrolled(currentScrollY > 100);
      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Google One-Tap Floating Modal (like LinkedIn) */}
      {showOneTap && !user && (
        <div className="fixed top-4 right-4 z-[1000] w-80 sm:w-96 animate-fade-in">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setShowOneTap(false)}
              className="absolute -top-2 -right-2 z-10 bg-gray-800 hover:bg-gray-700 rounded-full w-7 h-7 flex items-center justify-center text-white text-lg transition-colors shadow-lg border border-gray-700"
              aria-label="Close"
            >
              ×
            </button>
            
            {/* One-Tap Container */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-[#BC8BBC]/30 p-5 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8">
                      <Logo className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {t("oneTap.title", "Quick access to Oliviuus")}
                    </h3>
                    <p className="text-xs text-gray-300">
                      {t("oneTap.subtitle", "Sign in to continue watching")}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Google Sign-In Button (Shows immediately) */}
              <div className="mb-3">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  logo_alignment="left"
                  width="100%"
                  locale={localStorage.getItem("lang") || "rw"}
                  ux_mode="popup"
                />
              </div>
              
              <div className="pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-4 h-4 text-[#BC8BBC]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>{t("oneTap.privacy", "Secure & private")}</span>
                </div>
                <button
                  onClick={() => setShowOneTap(false)}
                  className="text-gray-400 hover:text-gray-300 transition-colors px-3 py-1 rounded-full hover:bg-gray-800/50"
                >
                  {t("oneTap.notNow", "Not now")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Loading Overlay */}
      {googleLoading && (
        <div className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-[#BC8BBC]/30 shadow-2xl">
            {/* Google-style spinner with your brand colors */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-transparent border-t-[#BC8BBC] border-r-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-transparent border-b-white border-l-[#BC8BBC] rounded-full animate-spin animation-delay-200"></div>
              <div className="absolute inset-8 border-4 border-transparent border-t-purple-600 border-r-white rounded-full animate-spin animation-delay-400"></div>
            </div>
            <p className="text-white font-bold text-xl mb-2">Signing you in...</p>
            <p className="text-gray-300">Using your Google account</p>
            <div className="mt-6">
              <div className="h-1 w-48 bg-gray-800 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header 
        ref={headerRef}
        className={`fixed w-full z-50 transition-all duration-500 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled 
            ? 'bg-black/95 backdrop-blur-md py-3 shadow-2xl border-b border-[#BC8BBC]/20' 
            : 'bg-gradient-to-b from-black/80 to-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo - Responsive sizing */}
          <Link to="/" className="flex items-center group">
            <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 transform group-hover:scale-110 transition-transform duration-300">
              <Logo />
            </div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
            {/* Language Switcher - Always visible on all devices */}
            <div className="flex items-center">
              <LanguageSwitcher />
            </div>

            {/* Dynamic Action Button - Shows ProfileMenu when logged in, Sign In when not */}
            {user ? (
              <ProfileMenu />
            ) : (
              <Link
                to="/auth"
                className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#a87aa8] hover:to-purple-500 text-white px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 text-sm sm:text-base"
              >
                {t("landingPage.header.signIn")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          
          @keyframes progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0); }
            100% { transform: translateX(100%); }
          }
          .animate-progress {
            animation: progress 2s ease-in-out infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          
          .animation-delay-200 {
            animation-delay: -0.2s;
          }
          .animation-delay-400 {
            animation-delay: -0.4s;
          }
          
          /* Google Button Styling */
          .g_id_signin {
            width: 100% !important;
            margin: 0 !important;
          }
          
          .g_id_signin > div {
            width: 100% !important;
            border-radius: 10px !important;
            height: 46px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            border: 1px solid #5f6368 !important;
            background: #2d2d2d !important;
            color: #e8eaed !important;
            transition: all 0.2s ease !important;
          }
          
          .g_id_signin > div:hover {
            background-color: #3c4043 !important;
            border-color: #8ab4f8 !important;
            box-shadow: 0 2px 8px rgba(138, 180, 248, 0.2) !important;
          }
        `}
      </style>
    </>
  );
};

export default Header;