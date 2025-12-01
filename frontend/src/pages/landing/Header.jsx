import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useAuth } from "../../context/AuthContext";
import ProfileMenu from "../../components/ui/ProfileMenu";
import { useTranslation } from "react-i18next";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerRef = useRef(null);
  const { user } = useAuth();
  const { t } = useTranslation();

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
  );
};

export default Header;