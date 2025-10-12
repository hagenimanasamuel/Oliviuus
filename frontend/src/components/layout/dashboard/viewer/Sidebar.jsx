import React, { useState, useEffect, useRef } from "react";
import { 
  Home, 
  PlayCircle, 
  Search,
  Tv,
  Film,
  Clapperboard,
  Star,
  Heart,
  Download,
  Clock,
  User,
  Settings, 
  LogOut, 
  Menu,
  X,
  Crown,
  Bell,
  TrendingUp,
  Sparkles,
  Grid3X3,
  MoreHorizontal,
  ChevronRight,
  Aperture,
  Zap,
  Compass,
  Radio
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../Logo.jsx";

export default function Sidebar({ isCollapsed, toggleCollapse, isMobile, toggleMobile, user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [isMounted, setIsMounted] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const moreRef = useRef(null);
  const isMobileView = windowWidth < 768;
  const isTabletView = windowWidth < 1024;

  // Start collapsed by default
  const [localCollapsed, setLocalCollapsed] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        setWindowWidth(newWidth);
        if (newWidth < 768) {
          setLocalCollapsed(false);
        } else {
          setLocalCollapsed(true);
        }
      }, 100);
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sidebarBase = "bg-gray-900 text-gray-300 flex flex-col shadow-2xl fixed z-40 transition-all duration-300 ease-in-out border-r border-gray-800 overflow-hidden";
  let sidebarWidthClass = localCollapsed ? "w-20" : "w-64";
  let sidebarPosition = "top-0 left-0 h-screen";

  if (isMobileView) {
    sidebarWidthClass = "w-full";
    sidebarPosition = "bottom-0 left-0 h-20";
  }

  if (!isMounted) return null;

  const profileImage = user?.profile_avatar_url || (user?.id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : "https://placehold.co/100x100/333333/FFFFFF?text=User");

  // Navigation sections
  const navigationSections = {
    main: [
      { icon: <Home size={24} />, label: "Home", path: "/" },
      { icon: <Sparkles size={24} />, label: "New & Popular", path: "/new" },
      { icon: <Tv size={24} />, label: "TV Shows", path: "/tv" },
      { icon: <Film size={24} />, label: "Movies", path: "/movies" },
      { icon: <Clapperboard size={24} />, label: "Originals", path: "/originals" },
      { icon: <Compass size={24} />, label: "Browse", path: "/browse" },
    ],
    library: [
      { icon: <Download size={24} />, label: "Downloads", path: "/downloads" },
      { icon: <Heart size={24} />, label: "My List", path: "/my-list" },
      { icon: <Clock size={24} />, label: "Continue Watching", path: "/continue" },
      { icon: <Star size={24} />, label: "Top Picks", path: "/top-picks" },
      { icon: <Radio size={24} />, label: "Live TV", path: "/live" },
    ]
  };

  // Primary navigation items (first 4 for mobile, all for desktop when expanded)
  const primaryNavigation = navigationSections.main.slice(0, 4);
  const remainingNavigation = navigationSections.main.slice(4);
  const allLibraryItems = navigationSections.library;

  const isActivePath = (path) => location.pathname === path;

  // Search Modal Component
  const SearchModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div ref={searchRef} className="w-full max-w-2xl mx-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Search size={24} className="text-gray-400" />
              <input 
                type="text"
                placeholder="Search movies, TV shows, and more..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 text-lg outline-none"
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-gray-400 text-sm font-medium mb-3">Quick Searches</h3>
            <div className="grid grid-cols-2 gap-2">
              {["Action Movies", "Comedy Shows", "New Releases", "Top Rated", "Drama Series", "Family Movies"].map((item, index) => (
                <button
                  key={index}
                  className="p-3 text-left bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  if (isMobileView) {
    return (
      <>
        {searchOpen && <SearchModal />}
        
        <aside className={`${sidebarBase} ${sidebarWidthClass} ${sidebarPosition} flex-row items-center justify-around px-4 py-3`}>
          {primaryNavigation.map((item, index) => (
            <MobileNavItem
              key={index}
              icon={item.icon}
              label={item.label}
              active={isActivePath(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
          
          {/* Search Button */}
          <MobileNavItem
            icon={<Search size={24} />}
            label="Search"
            active={searchOpen}
            onClick={() => setSearchOpen(true)}
          />

          {/* More Button with Dropdown */}
          <div ref={moreRef} className="relative">
            <MobileNavItem
              icon={<MoreHorizontal size={24} />}
              label="More"
              active={moreOpen}
              onClick={() => setMoreOpen(!moreOpen)}
            />
            
            {moreOpen && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-white font-medium text-sm">More Options</p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {remainingNavigation.concat(allLibraryItems).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        navigate(item.path);
                        setMoreOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200"
            >
              <img 
                src={profileImage} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-red-500 transition-colors object-cover"
              />
              <span className="text-xs mt-1 text-gray-400 font-medium">Profile</span>
            </button>
            
            {profileOpen && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-lg border-2 border-red-500 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-white text-sm">{user?.name || "Welcome"}</p>
                      <p className="text-gray-400 text-xs">{user?.plan || "Premium Member"}</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    navigate("/account-settings");
                    setProfileOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors border-b border-gray-700"
                >
                  <Settings size={18} className="mr-3" />
                  Account & Settings
                </button>
                
                <button 
                  onClick={onLogout}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={18} className="mr-3" />
                  Sign Out
                </button>

                <div className="p-3 bg-gray-900/50 border-t border-gray-700">
                  <div className="text-xs text-gray-500">
                    <p>© 2024 Oliviuus</p>
                    <div className="flex gap-3 mt-2">
                      <button className="hover:text-gray-300 transition-colors">Privacy</button>
                      <button className="hover:text-gray-300 transition-colors">Terms</button>
                      <button className="hover:text-gray-300 transition-colors">Help</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      {searchOpen && <SearchModal />}
      
      <aside className={`${sidebarBase} ${sidebarWidthClass} ${sidebarPosition}`}>
        
        {/* Logo Header with Unique Toggle */}
        <div className="px-4 py-5 border-b border-gray-800 relative">
          <div 
            className={`flex items-center cursor-pointer transition-all duration-300 ${
              localCollapsed ? "justify-center" : "justify-start"
            }`}
            onClick={() => navigate("/")}
          >
            <Logo className="h-8 w-auto text-red-500" />
          </div>

          {/* Unique & Attractive Toggle Button - Centered */}
          <button 
            onClick={() => setLocalCollapsed(!localCollapsed)}
            className="absolute -right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-r-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg group"
          >
            <Zap 
              size={14} 
              className="text-white transition-transform duration-300 group-hover:scale-110" 
              fill={localCollapsed ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Search Bar */}
        <div className={`p-4 border-b border-gray-800 ${localCollapsed ? 'px-2' : ''}`}>
          <button 
            onClick={() => setSearchOpen(true)}
            className={`flex items-center w-full p-3 rounded-xl bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 group ${
              localCollapsed ? "justify-center" : "justify-start gap-3"
            }`}
          >
            <Search size={20} className="text-gray-400 group-hover:text-white transition-colors" />
            {!localCollapsed && (
              <span className="text-gray-400 text-sm group-hover:text-white transition-colors">Search</span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigationSections.main.map((item, index) => (
              <SidebarItem 
                key={index}
                icon={item.icon}
                label={item.label}
                collapsed={localCollapsed}
                active={isActivePath(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>

          {/* "Show More" Button for collapsed state */}
          {localCollapsed && (
            <div className="mt-4 px-2">
              <button 
                onClick={() => setLocalCollapsed(false)}
                className="flex flex-col items-center w-full p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 group"
              >
                <Grid3X3 size={20} className="text-gray-400 group-hover:text-white mb-1" />
                <span className="text-xs text-gray-400 group-hover:text-white">More</span>
              </button>
            </div>
          )}

          {/* Expanded Content */}
          {!localCollapsed && (
            <>
              {/* Library Section */}
              <div className="mt-8">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Your Library
                </h3>
                <div className="space-y-1">
                  {navigationSections.library.map((item, index) => (
                    <SidebarItem 
                      key={index}
                      icon={item.icon}
                      label={item.label}
                      collapsed={localCollapsed}
                      active={isActivePath(item.path)}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </div>
              </div>

              {/* Premium Banner */}
              <div className="mt-8 mx-4">
                <div className="p-4 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown size={20} className="text-yellow-400" />
                    <span className="text-white font-semibold text-sm">Go Premium</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">Ad-free experience with 4K streaming</p>
                  <button className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-gray-900 text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-105">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Profile Section */}
        <div ref={profileRef} className="p-3 border-t border-gray-800 mt-auto bg-gray-900/50">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex items-center w-full rounded-xl transition-all duration-200 hover:bg-gray-800 group ${
              localCollapsed ? "justify-center p-3" : "justify-start p-2 gap-3"
            } ${profileOpen ? "bg-gray-800" : ""}`}
          >
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-8 h-8 rounded-lg border border-gray-600 object-cover group-hover:border-red-500 transition-colors"
            />
            
            {!localCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "Welcome"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.plan || "Premium Member"}
                </p>
              </div>
            )}

            {!localCollapsed && (
              <ChevronRight 
                size={16} 
                className={`text-gray-400 transition-transform duration-200 ${
                  profileOpen ? "rotate-90" : ""
                }`} 
              />
            )}
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute left-3 right-3 bottom-16 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-lg border-2 border-red-500 object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{user?.name || "Welcome"}</p>
                    <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
                    Premium
                  </span>
                </div>
              </div>

              <button 
                onClick={() => {
                  navigate("/account-settings");
                  setProfileOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors border-b border-gray-700"
              >
                <Settings size={18} className="mr-3" />
                Account & Settings
              </button>

              <div className="p-3 bg-gray-900/50 border-t border-gray-700">
                <div className="text-xs text-gray-500">
                  <p>© 2024 Oliviuus</p>
                  <div className="flex gap-3 mt-2">
                    <button className="hover:text-gray-300 transition-colors">Privacy</button>
                    <button className="hover:text-gray-300 transition-colors">Terms</button>
                    <button className="hover:text-gray-300 transition-colors">Help</button>
                  </div>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <LogOut size={18} className="mr-3" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// Desktop Sidebar Item Component
function SidebarItem({ icon, label, collapsed, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center w-full transition-all duration-200 group ${
        collapsed ? "flex-col px-2 py-4" : "px-4 py-3"
      } ${
        active 
          ? "text-white bg-red-500/10 border-r-2 border-red-500" 
          : "text-gray-400 hover:text-white hover:bg-gray-800/30"
      }`}
    >
      <div className={`transition-transform duration-200 ${
        active ? "scale-110" : "group-hover:scale-105"
      }`}>
        {icon}
      </div>
      
      {/* Label for collapsed state */}
      {collapsed && (
        <span className={`mt-1 text-xs font-medium transition-all duration-200 ${
          active ? "text-red-400" : "text-gray-400"
        }`}>
          {label.split(' ')[0]}
        </span>
      )}

      {/* Full label when expanded */}
      {!collapsed && (
        <span className="ml-4 text-sm font-medium">
          {label}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-700">
          {label}
        </div>
      )}
    </button>
  );
}

// Mobile Bottom Navigation Item
function MobileNavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200 ${
        active ? "text-red-500" : "text-gray-400 hover:text-white"
      }`}
    >
      <div className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
        {icon}
      </div>
      <span className="text-xs mt-1 font-medium truncate max-w-[70px] text-center">
        {label}
      </span>
    </button>
  );
}