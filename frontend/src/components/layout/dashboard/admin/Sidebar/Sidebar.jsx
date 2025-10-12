import React, { useState, useEffect } from "react";
import NavItems from "./NavItems.jsx";

export default function Sidebar({ isCollapsed, toggleCollapse, isMobile, toggleMobile }) {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [isMounted, setIsMounted] = useState(false);

  // Track window resize with debounce
  useEffect(() => {
    setIsMounted(true);
    
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 100);
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Determine if mobile overlay is active
  const isMobileView = windowWidth < 768;
  const HEADER_HEIGHT = 64; // Match this with your header height

  // Sidebar classes - Updated for larger devices
  const sidebarBase = "bg-gray-900 text-gray-300 flex flex-col shadow-lg fixed z-40 transition-all duration-300 ease-in-out";

  let sidebarWidthClass = isCollapsed ? "w-20" : "w-64";
  let sidebarTransform = "";
  let sidebarPosition = "";
  
  if (isMobileView) {
    // Mobile: full screen overlay starting from top
    sidebarWidthClass = "w-64";
    sidebarTransform = isMobile ? "translate-x-0" : "-translate-x-full";
    sidebarPosition = "top-0 left-0 h-screen";
  } else {
    // Desktop: starts below header
    sidebarTransform = "translate-x-0";
    sidebarPosition = `top-${HEADER_HEIGHT}px left-0 h-[calc(100vh-${HEADER_HEIGHT}px)]`;
  }

  // Backdrop for mobile overlay
  const Backdrop = () => (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
        isMobile && isMobileView ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={toggleMobile}
    />
  );

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileView && <Backdrop />}

      {/* Sidebar */}
      <aside
        className={`${sidebarBase} ${sidebarWidthClass} ${sidebarTransform} ${sidebarPosition}`}
        aria-label="Main navigation"
        style={
          !isMobileView 
            ? { 
                top: `${HEADER_HEIGHT}px`, 
                height: `calc(100vh - ${HEADER_HEIGHT}px)`,
                left: '0'
              } 
            : {}
        }
      >
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <NavItems isCollapsed={isCollapsed} />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-xs text-gray-500 flex-shrink-0">
          &copy; {new Date().getFullYear()} Oliviuus
        </div>

        {/* Collapse button (desktop only) */}
        {!isMobileView && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-12 bg-gray-800 rounded-r-lg hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-l-0 border-gray-600"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className={`transform transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}>
              {isCollapsed ? "»" : "«"}
            </span>
          </button>
        )}
      </aside>
    </>
  );
}