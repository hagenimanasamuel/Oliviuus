import React, { useState, useRef, useEffect } from "react";
import { 
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Crown,
  Home,
  PlayCircle,
  Tv,
  Film,
  Clapperboard,
  Sparkles,
  Compass,
  Download,
  Heart,
  Clock,
  Star,
  Radio,
  Grid3X3,
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../../Logo.jsx";

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const profileImage = user?.profile_avatar_url || (user?.id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}` : "https://placehold.co/100x100/333333/FFFFFF?text=User");

  // Navigation items
  const navigationItems = [
    { icon: <Home size={20} />, label: "Home", path: "/" },
    { icon: <Sparkles size={20} />, label: "New & Popular", path: "/new" },
    { icon: <Tv size={20} />, label: "TV Shows", path: "/tv" },
    { icon: <Film size={20} />, label: "Movies", path: "/movies" },
    { icon: <Clapperboard size={20} />, label: "Originals", path: "/originals" },
    { icon: <Compass size={20} />, label: "Browse", path: "/browse" },
  ];

  const libraryItems = [
    { icon: <Download size={20} />, label: "Downloads", path: "/downloads" },
    { icon: <Heart size={20} />, label: "My List", path: "/my-list" },
    { icon: <Clock size={20} />, label: "Continue Watching", path: "/continue" },
    { icon: <Star size={20} />, label: "Top Picks", path: "/top-picks" },
    { icon: <Radio size={20} />, label: "Live TV", path: "/live" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) setMobileMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActivePath = (path) => location.pathname === path;

  return (
    <>
      {/* Main Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-gray-900/95 backdrop-blur-md border-b border-gray-800 shadow-xl" 
            : "bg-gradient-to-b from-gray-900/80 to-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-4 lg:px-8 h-16">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div 
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => navigate("/")}
            >
              <Logo className="h-8 w-auto text-red-500" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePath(item.path)
                      ? "text-white bg-red-500/10 border border-red-500/20"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Right Section - Search, Notifications, Profile */}
          <div className="flex items-center gap-4">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <Search size={20} />
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800/50 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Premium Upgrade */}
            <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-gray-900 text-sm font-bold rounded-lg transition-all duration-200">
              <Crown size={16} />
              <span>Upgrade</span>
            </button>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-800/50 transition-all duration-200"
              >
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-red-500 transition-colors object-cover"
                />
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-200 ${
                    profileOpen ? "rotate-180" : ""
                  }`} 
                />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
                    <div className="flex items-center gap-3">
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-14 h-14 rounded-lg border-2 border-red-500 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-lg truncate">
                          {user?.name || "Welcome"}
                        </p>
                        <p className="text-gray-400 text-sm truncate">
                          {user?.email}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
                            Premium
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Access */}
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium mb-3">Quick Access</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {libraryItems.slice(0, 4).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            navigate(item.path);
                            setProfileOpen(false);
                          }}
                          className="flex items-center gap-2 p-3 text-sm text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings & Logout */}
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        navigate("/account-settings");
                        setProfileOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Settings size={18} className="mr-3" />
                      Account & Settings
                    </button>
                    
                    <button 
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <LogOut size={18} className="mr-3" />
                      Sign Out
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-gray-900/50 border-t border-gray-700">
                    <div className="text-xs text-gray-500">
                      <p>© 2024 Oliviuus</p>
                      <div className="flex gap-4 mt-2">
                        <button className="hover:text-gray-300 transition-colors">Privacy</button>
                        <button className="hover:text-gray-300 transition-colors">Terms</button>
                        <button className="hover:text-gray-300 transition-colors">Help</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors duration-200 hover:bg-gray-800/50 rounded-lg"
            >
              <Grid3X3 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div ref={searchRef} className="w-full max-w-4xl mx-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-4">
                  <Search size={24} className="text-gray-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search movies, TV shows, and more..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 text-xl outline-none"
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
              
              {searchQuery && (
                <div className="p-6">
                  <h3 className="text-gray-400 text-sm font-medium mb-4">Search Results</h3>
                  <div className="space-y-2">
                    {/* Search results would go here */}
                    <div className="text-gray-500 text-center py-8">
                      Start typing to see results...
                    </div>
                  </div>
                </div>
              )}
              
              {!searchQuery && (
                <div className="p-6">
                  <h3 className="text-gray-400 text-sm font-medium mb-4">Quick Searches</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Action Movies", "Comedy Shows", "New Releases", "Top Rated", "Drama Series", "Family Movies"].map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(item)}
                        className="p-4 text-left bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm z-50 lg:hidden">
          <div ref={mobileMenuRef} className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <Logo className="h-8 w-auto text-red-500" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
            </div>

            <nav className="p-6">
              <div className="space-y-2 mb-8">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">
                  Navigation
                </h3>
                {navigationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all duration-200 ${
                      isActivePath(item.path)
                        ? "text-white bg-red-500/10 border border-red-500/20"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-4">
                  Your Library
                </h3>
                {libraryItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}