import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header.jsx";

/**
 * Main layout component for viewer-facing pages
 * Handles header visibility, scroll behavior, and page-specific layouts
 */
export default function ViewerLayout({ children, user, onLogout }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Initialize component mount state for client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Handles scroll detection for header background transitions
   * Monitors window scroll position to determine when to show header background
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY > 10;
      setIsScrolled(scrolled);
    };

    // Register scroll event listeners with passive option for performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    
    // Set initial scroll state on component mount
    handleScroll();
    
    // Handle scroll state on window resize as well
    window.addEventListener("resize", handleScroll, { passive: true });

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Determine if current route is a landing page for layout adjustments
  const isLandingPage = location.pathname === "/" || location.pathname === "/viewer";

  // Show loading state until component is fully mounted
  if (!isMounted) {
    return (
      <div className="flex h-screen bg-gray-900 text-gray-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-300">
      {/* Header component with scroll state for background transitions */}
      <Header user={user} onLogout={onLogout} isScrolled={isScrolled} />
      
      {/* Main content area with conditional padding for landing pages */}
      <main className={`flex-1 ${isLandingPage ? 'pt-0' : 'pt-16'}`}>
        {children}
      </main>
    </div>
  );
}