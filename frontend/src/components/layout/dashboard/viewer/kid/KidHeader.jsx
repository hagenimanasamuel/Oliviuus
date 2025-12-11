// src/components/layout/dashboard/kid/KidHeader.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext";
import Logo from "../../../../Logo";
import PinVerificationModal from "./modals/PinVerificationModal";
import api from "../../../../../api/axios";
import { useTranslation } from "react-i18next";

export default function KidHeader({ kidProfile, onExit, isScrolled }) {
  const { user, familyMemberData, logoutUser } = useAuth();
  const { t } = useTranslation(); 
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [showUpperSection, setShowUpperSection] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [parentHasPin, setParentHasPin] = useState(true);
  const [checkingPin, setCheckingPin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Add ref for the exit button
  const exitButtonRef = useRef(null);

  // Check if user is a family member with kid dashboard
  const isFamilyMemberWithKidDashboard = familyMemberData && familyMemberData.dashboard_type === 'kid';

  // Determine if we should show logout instead of exit
  const shouldShowLogout = isFamilyMemberWithKidDashboard;

  // Check if parent has PIN configured
  useEffect(() => {
    const checkPinStatus = async () => {
      // Skip if it's a family member (they don't need PIN to logout)
      if (shouldShowLogout) return;

      setCheckingPin(true);
      try {
        const response = await api.get("/family/pin/status", {
          withCredentials: true
        });

        const hasPin = response.data?.master_pin_set === true;
        setParentHasPin(hasPin);

        console.log("PIN Status Check:", {
          hasPin: hasPin,
          data: response.data
        });
      } catch (error) {
        console.error("Error checking PIN status:", error);
        setParentHasPin(true);

        if (error.response?.status === 404) {
          console.log("PIN status endpoint not found - defaulting to no PIN for easy testing");
        }
      } finally {
        setCheckingPin(false);
      }
    };

    // Only check PIN if we're not a family member
    if (!shouldShowLogout) {
      checkPinStatus();
    }
  }, [shouldShowLogout]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refs for scroll detection
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  // Enhanced scroll behavior - Different for mobile vs desktop
  useEffect(() => {
    const handleScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;

        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          if (isMobile) {
            // MOBILE BEHAVIOR: Hide/show entire header
            if (currentScrollY < 10) {
              setShowUpperSection(true);
            } else if (currentScrollY > lastScrollYRef.current + 5) {
              setShowUpperSection(false);
            } else if (currentScrollY < lastScrollYRef.current - 5) {
              setShowUpperSection(true);
            }
          } else {
            // DESKTOP BEHAVIOR: Hide/show only upper section
            if (currentScrollY < 10) {
              setShowUpperSection(true);
            } else if (currentScrollY > lastScrollYRef.current) {
              setShowUpperSection(false);
            } else {
              setShowUpperSection(true);
            }
          }

          lastScrollYRef.current = currentScrollY;
          tickingRef.current = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle exit or logout based on user type
  const handleExitOrLogout = async () => {
    if (shouldShowLogout) {
      await logoutUser();
      navigate('/auth');
    } else {
      if (!parentHasPin) {
        console.log("No PIN set - exiting directly");
        onExit();
      } else {
        console.log("PIN exists - showing verification modal");
        setShowPinModal(true);
      }
    }
  };

  // Handle successful PIN verification for kid profile exit only
  const handlePinVerified = () => {
    onExit();
  };

  // Navigation items with translations
  const navItems = [
    { 
      id: 'home', 
      label: t('kidDashboard.navigation.home'), 
      emoji: '🏠', 
      path: '/' 
    },
    { 
      id: 'music', 
      label: t('kidDashboard.navigation.music'), 
      emoji: '🎧', 
      path: '/music' 
    },
    { 
      id: 'play', 
      label: t('kidDashboard.navigation.play'), 
      emoji: '🎮', 
      path: '/play' 
    },
    { 
      id: 'learn', 
      label: t('kidDashboard.navigation.learn'), 
      emoji: '📚', 
      path: '/learn' 
    },
    { 
      id: 'favorites', 
      label: t('kidDashboard.navigation.favorites'), 
      emoji: '⭐', 
      path: '/favorites' 
    },
  ];

  // Handle navigation with fun animation
  const handleNavigation = (path) => {
    const button = document.activeElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1.1)';
        setTimeout(() => {
          button.style.transform = 'scale(1)';
          navigate(path);
          setShowNavigation(false);
        }, 100);
      }, 50);
    } else {
      navigate(path);
      setShowNavigation(false);
    }
  };

  // Handle logo click with fun animation
  const handleLogoClick = () => {
    const logo = document.querySelector('[data-logo]');
    if (logo) {
      logo.style.transform = 'rotate(360deg) scale(1.2)';
      setTimeout(() => {
        logo.style.transform = 'rotate(0deg) scale(1)';
        navigate('/');
      }, 300);
    } else {
      navigate('/');
    }
  };

  // Landing page is just the root path "/"
  const isLandingPage = location.pathname === "/";

  // ONLY main header has background - everything else transparent
  const shouldBeTransparent = !isScrolled && isLandingPage;

  // Get kid name for display
  const getKidName = () => {
    if (isFamilyMemberWithKidDashboard) {
      return user?.email?.split('@')[0] || t('kidDashboard.defaultName');
    }
    
    if (kidProfile && kidProfile.name) {
      return kidProfile.name;
    }
    
    if (kidProfile && kidProfile.display_name) {
      return kidProfile.display_name;
    }
    
    return user?.email?.split('@')[0] || t('kidDashboard.defaultName');
  };

  // Get kid avatar
  const getKidAvatar = () => {
    if (isFamilyMemberWithKidDashboard) {
      return user?.profile_avatar_url || '/default-kid-avatar.png';
    }

    if (kidProfile && kidProfile.avatar_url) {
      return kidProfile.avatar_url;
    }

    if (kidProfile && kidProfile.avatar) {
      return kidProfile.avatar;
    }

    if (user?.profile_avatar_url) {
      return user.profile_avatar_url;
    }

    return '/default-kid-avatar.png';
  };

  // Kid-friendly button styles
  const getButtonStyle = (isActive = false) => {
    const baseStyle = {
      backgroundColor: shouldBeTransparent ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)',
      border: shouldBeTransparent ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.5)',
      boxShadow: shouldBeTransparent
        ? '0 2px 8px rgba(0,0,0,0.1)'
        : '0 4px 12px rgba(0,0,0,0.2), 0 0 0 2px rgba(188, 139, 188, 0.3)',
      borderRadius: '12px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    if (isActive) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(188, 139, 188, 0.3)',
        border: '2px solid rgba(188, 139, 188, 0.6)',
        boxShadow: '0 4px 16px rgba(188, 139, 188, 0.4), 0 0 0 3px rgba(188, 139, 188, 0.2)'
      };
    }

    return baseStyle;
  };

  // Get exit/logout button content
  const getExitButtonContent = () => {
    if (shouldShowLogout) {
      return {
        emoji: '🚪',
        label: t('kidDashboard.buttons.logout'),
        title: t('kidDashboard.tooltips.logout')
      };
    } else {
      if (checkingPin) {
        return {
          emoji: '⏳',
          label: t('kidDashboard.buttons.checkingPin'),
          title: t('kidDashboard.tooltips.checkingPin')
        };
      }
      return {
        emoji: parentHasPin ? '🔐' : '👨‍👩‍👧‍👦',
        label: t('kidDashboard.buttons.exit'),
        title: parentHasPin 
          ? t('kidDashboard.tooltips.exitWithPin') 
          : t('kidDashboard.tooltips.exitNoPin')
      };
    }
  };

  const exitButtonContent = getExitButtonContent();

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={shouldBeTransparent ? {
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          border: 'none',
          boxShadow: 'none',
          transform: isMobile && !showUpperSection ? 'translateY(-100%)' : 'translateY(0)'
        } : {
          backgroundColor: '#1F2937',
          backdropFilter: 'blur(20px)',
          borderBottom: '3px solid rgba(188, 139, 188, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transform: isMobile && !showUpperSection ? 'translateY(-100%)' : 'translateY(0)'
        }}
      >
        {/* CONTAINER */}
        <div
          className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none'
          }}
        >
          {/* Upper Section - Hidden on mobile when scrolling down */}
          <div
            className={`transition-all duration-500 ${showUpperSection ? 'opacity-100 translate-y-0 mb-2 sm:mb-3' : 'opacity-0 -translate-y-4 h-0 mb-0 pointer-events-none'
              }`}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none'
              }}
            >
              {/* Left Side - Logo and Kid Info */}
              <div
                className="flex items-center space-x-2 sm:space-x-3 md:space-x-4"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {/* Logo with fun animation */}
                <div
                  className="flex-shrink-0 cursor-pointer transition-transform duration-500 hover:scale-110"
                  onClick={handleLogoClick}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                  data-logo
                >
                  <Logo className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 transition-all duration-300" />
                </div>

                {/* Kid Profile Info */}
                <div
                  className="flex items-center space-x-2 sm:space-x-3"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                >
                  <div
                    className="relative transition-transform duration-300 hover:scale-110"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    <img
                      src={getKidAvatar()}
                      alt={getKidName()}
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-3 border-white transition-all duration-300 hover:border-purple-300"
                      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"
                      style={{ boxShadow: '0 0 8px rgba(72, 187, 120, 0.6)' }}
                    ></div>
                  </div>
                  <div
                    className="hidden xs:block"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                      {t('kidDashboard.greeting', { name: getKidName() })} 👋
                    </h1>
                    <p className="text-white/80 text-xs sm:text-sm hidden sm:block animate-bounce">
                      {isFamilyMemberWithKidDashboard 
                        ? t('kidDashboard.status.familyFun') 
                        : t('kidDashboard.status.letsPlay')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Kid Friendly Design */}
              <div
                className="flex items-center space-x-1 sm:space-x-2 md:space-x-3"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="transition-all duration-300 transform hover:scale-110 flex items-center justify-center text-white min-h-[44px] min-w-[44px]"
                  style={getButtonStyle()}
                  title={isFullscreen 
                    ? t('kidDashboard.tooltips.exitFullscreen') 
                    : t('kidDashboard.tooltips.enterFullscreen')
                  }
                >
                  <span className="text-base sm:text-lg md:text-xl animate-pulse">
                    {isFullscreen ? "📱" : "🖥️"}
                  </span>
                </button>

                {/* Mobile Navigation Toggle */}
                <button
                  onClick={() => setShowNavigation(!showNavigation)}
                  className="transition-all duration-300 transform hover:scale-110 md:hidden flex items-center justify-center text-white min-h-[44px] min-w-[44px]"
                  style={getButtonStyle(showNavigation)}
                  title={t('kidDashboard.tooltips.toggleNavigation')}
                >
                  <span className="text-base sm:text-lg animate-bounce">
                    {showNavigation ? "❌" : "🌈"}
                  </span>
                </button>

                {/* Exit/Logout Button */}
                <button
                  ref={exitButtonRef}
                  onClick={handleExitOrLogout}
                  disabled={checkingPin}
                  className="transition-all duration-300 transform hover:scale-105 flex items-center space-x-1 min-h-[44px] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  style={getButtonStyle()}
                  title={exitButtonContent.title}
                >
                  <span className="text-sm sm:text-base animate-pulse">{exitButtonContent.emoji}</span>
                  <span className="hidden sm:inline bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    {exitButtonContent.label}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Bar - Desktop - Only show when upper section is visible or on scroll */}
          {(!isMobile || showUpperSection) && (
            <nav
              className={`hidden md:block transition-all duration-500 ${showUpperSection ? 'mt-0 opacity-100' : 'mt-2 opacity-70'
                }`}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none'
              }}
            >
              <div
                className="flex items-center justify-center space-x-2 p-2"
                style={{
                  backgroundColor: 'transparent',
                  backdropFilter: 'none',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300 text-white min-h-[44px] text-sm sm:text-base font-semibold"
                    style={getButtonStyle(location.pathname === item.path)}
                    title={t('kidDashboard.tooltips.navigateTo', { destination: item.label })}
                  >
                    <span className="text-lg sm:text-xl transition-transform duration-300 hover:scale-125">
                      {item.emoji}
                    </span>
                    <span className="transition-all duration-300 hover:scale-105">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* Mobile Navigation - Fun Design */}
          {showNavigation && (
            <nav
              className="md:hidden p-3 mt-2 transition-all duration-500"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 2px rgba(188, 139, 188, 0.2)'
              }}
            >
              <div
                className="grid grid-cols-3 gap-3"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none'
                }}
              >
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className="flex flex-col items-center justify-center p-3 transition-all duration-300 text-white text-center min-h-[70px] sm:min-h-[80px] active:scale-95"
                    style={getButtonStyle(location.pathname === item.path)}
                    title={t('kidDashboard.tooltips.navigateTo', { destination: item.label })}
                  >
                    <span className="text-2xl sm:text-3xl mb-1 transition-transform duration-300 hover:scale-125">
                      {item.emoji}
                    </span>
                    <span className="text-xs sm:text-sm font-bold transition-all duration-300">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* PIN Verification Modal - ONLY for kid profile exit when parent has PIN */}
      {!shouldShowLogout && parentHasPin && (
        <PinVerificationModal
          isOpen={showPinModal}
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinVerified}
          triggerButtonRef={exitButtonRef}
          title={t('kidDashboard.pinModal.title')}
          description={t('kidDashboard.pinModal.description')}
          actionType="exit_kid_mode"
        />
      )}
    </>
  );
}