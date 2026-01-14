import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import DashboardHeader from "../../DashboardHeader.jsx";

export default function AdminLayout({ children, user, onLogout }) {
  const HEADER_HEIGHT = 64;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [isMounted, setIsMounted] = useState(false);

  const isMobileView = windowWidth < 768;

  // Track window resize with debounce
  useEffect(() => {
    setIsMounted(true);
    
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        setWindowWidth(newWidth);
        
        if (newWidth < 768) {
          setIsCollapsed(false);
          setIsMobileOpen(false);
        } else if (newWidth >= 768 && newWidth < 1024) {
          setIsCollapsed(true);
          setIsMobileOpen(false);
        } else {
          setIsCollapsed(false);
          setIsMobileOpen(false);
        }
      }, 150);
    };
    
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const toggleCollapse = () => {
    if (!isMobileView) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const toggleMobile = () => {
    if (isMobileView) {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  useEffect(() => {
    if (isMobileOpen && isMobileView) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    if (!isMobileView && isMobileOpen) {
      setIsMobileOpen(false);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, isMobileView]);

  const sidebarWidth = !isMobileView ? (isCollapsed ? 80 : 256) : 0;

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
    <div className="flex h-screen bg-gray-900 text-gray-300 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        isMobile={isMobileOpen}
        toggleMobile={toggleMobile}
      />

      {/* Right side: header + main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isMobileOpen && isMobileView ? 'opacity-50' : 'opacity-100'
        }`}
        style={{
          marginLeft: isMobileView ? 0 : sidebarWidth,
        }}
        onClick={() => {
          if (isMobileOpen && isMobileView) {
            toggleMobile();
          }
        }}
      >
        {/* Fixed Header */}
        <DashboardHeader 
          user={user} 
          onLogout={onLogout} 
          onMenuToggle={toggleMobile}
        />

        {/* Scrollable Main Content - Updated to account for header */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ 
            marginTop: isMobileView ? HEADER_HEIGHT : HEADER_HEIGHT, // Only add margin-top on desktop
            height: isMobileView 
              ? '100vh' 
              : `calc(100vh - ${HEADER_HEIGHT}px)`,
            maxHeight: isMobileView 
              ? '100vh' 
              : `calc(100vh - ${HEADER_HEIGHT}px)`
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}