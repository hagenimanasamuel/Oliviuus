import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationRef = useRef(null);

  const navigationItems = [
    { label: "Home", path: "/" },
    { label: "TV Shows", path: "/tv" },
    { label: "Movies", path: "/movies" },
    { label: "New & Popular", path: "/new" },
    { label: "My List", path: "/my-list" },
    { label: "Browse by Languages", path: "/languages" },
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navigationRef.current && !navigationRef.current.contains(event.target)) {
        setNavigationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActivePath = (path) => location.pathname === path;

  const getCurrentNavItem = () => {
    return navigationItems.find(item => isActivePath(item.path)) || navigationItems[0];
  };

  const handleNavigationClick = (path) => {
    navigate(path);
    setNavigationOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-6">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(item.path)}
            className={`relative px-2 py-1 text-sm font-medium transition-all duration-200 hover:text-white ${
              isActivePath(item.path)
                ? "text-white font-semibold"
                : "text-gray-300"
            }`}
          >
            {item.label}
            {isActivePath(item.path) && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BC8BBC] rounded-full"></div>
            )}
          </button>
        ))}
      </nav>

      {/* Mobile Navigation Dropdown */}
      <div ref={navigationRef} className="lg:hidden relative">
        <button
          onClick={() => setNavigationOpen(!navigationOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 border border-gray-700"
        >
          <span>{getCurrentNavItem().label}</span>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${
              navigationOpen ? "rotate-180" : ""
            }`} 
          />
        </button>

        {/* Navigation Dropdown */}
        {navigationOpen && (
          <div className="absolute left-0 top-12 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
              <h3 className="text-white font-semibold text-sm">Browse</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigationClick(item.path)}
                  className={`flex items-center w-full px-4 py-3 text-sm transition-all duration-200 border-b border-gray-700/30 last:border-b-0 ${
                    isActivePath(item.path)
                      ? "text-white bg-[#BC8BBC]/10 border-l-2 border-[#BC8BBC]"
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navigation;