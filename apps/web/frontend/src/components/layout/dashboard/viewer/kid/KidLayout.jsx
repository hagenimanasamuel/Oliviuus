// src/components/layout/dashboard/kid/KidLayout.jsx
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import KidHeader from "./KidHeader";

export default function KidLayout({ children, kidProfile, onExit }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle scroll detection like ViewerLayout
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY > 10;
      setIsScrolled(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    
    handleScroll();
    
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Landing page is just the root path "/"
  const isLandingPage = location.pathname === "/";

  if (!isMounted) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-[#BC8BBC] to-[#9A679A]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 animate-bounce">🌈</div>
            <p className="text-lg sm:text-2xl font-bold mb-2">Getting Ready!</p>
            <p className="text-sm sm:text-lg">Loading your fun space... ✨</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#BC8BBC] to-[#9A679A]">
      <KidHeader 
        kidProfile={kidProfile} 
        onExit={onExit} 
        isScrolled={isScrolled} 
      />
      
      {/* ✅ FIXED: Apply pt-0 only for landing page, all other pages get pt-16 */}
      <main className={`flex-1 ${isLandingPage ? 'pt-0' : 'pt-26'}`}>
        {children}
      </main>

      <div className="h-4 sm:h-6 md:h-8 lg:hidden safe-area-inset-bottom"></div>
    </div>
  );
}