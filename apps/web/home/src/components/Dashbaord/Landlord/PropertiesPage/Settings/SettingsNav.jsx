import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Lock, 
  Phone, 
  CreditCard, 
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // Added Link and useLocation
import clsx from 'clsx';

const SettingsNav = ({ verificationStatus }) => {
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const moreButtonRef = useRef(null);
  const mobileMoreButtonRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Get current active section from URL
  const getActiveSectionFromUrl = () => {
    const pathSegments = location.pathname.split('/');
    const section = pathSegments[pathSegments.length - 1];
    
    // Default to 'pin' if we're at the root settings path
    if (!section || section === 'settings') {
      return 'pin';
    }
    
    // Map common section names
    switch(section) {
      case 'pin':
      case 'contact':
      case 'withdrawal':
      case 'verification':
        return section;
      default:
        return 'pin';
    }
  };

  const activeSection = getActiveSectionFromUrl();

  // Get verification status icon
  const getVerificationIcon = (status) => {
    switch(status) {
      case 'approved': return CheckCircle2;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      default: return AlertTriangle;
    }
  };

  // Navigation items - memoized to prevent unnecessary re-renders
  const navItems = useMemo(() => [
    { 
      id: 'pin', 
      label: 'Account PIN', 
      icon: Lock, 
      description: 'Set 4-digit security PIN for sensitive actions',
      showBadge: false,
      path: '/landlord/dashboard/settings/pin'
    },
    { 
      id: 'contact', 
      label: 'Public Contact', 
      icon: Phone, 
      description: 'Manage how tenants can contact you',
      showBadge: false,
      path: '/landlord/dashboard/settings/contact'
    },
    { 
      id: 'withdrawal', 
      label: 'Withdrawal', 
      icon: CreditCard, 
      description: 'Set up payment methods for receiving funds',
      showBadge: false,
      path: '/landlord/dashboard/settings/withdrawal'
    },
    { 
      id: 'verification', 
      label: 'Verification', 
      icon: getVerificationIcon(verificationStatus),
      description: 'Get verified as a landlord',
      showBadge: true,
      badgeStatus: verificationStatus,
      path: '/landlord/dashboard/settings/verification'
    },
  ], [verificationStatus]);

  const activeNavItem = useMemo(() => 
    navItems.find(item => item.id === activeSection),
    [activeSection, navItems]
  );

  // Get badge color based on verification status
  const getBadgeColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get badge text based on verification status
  const getBadgeText = (status) => {
    switch(status) {
      case 'approved': return '✓';
      case 'pending': return '⏳';
      case 'rejected': return '✗';
      default: return '!';
    }
  };

  // Stable debounce function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Calculate visible vs overflow tabs
  const calculateVisibleTabs = useCallback(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const container = containerRef.current;
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, we'll show all tabs in dropdown, so just set all as visible
      setVisibleTabs(navItems);
      setOverflowTabs([]);
      return;
    }

    const containerWidth = container.offsetWidth;
    const moreButtonWidth = 120; // Approximate width for "More" button
    const availableWidth = containerWidth - moreButtonWidth;

    // Create a temporary container to measure tab widths
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.visibility = "hidden";
    tempContainer.style.whiteSpace = "nowrap";
    tempContainer.style.top = "-9999px";

    // Add each tab button to temp container for measurement
    navItems.forEach((tab) => {
      const tempBtn = document.createElement("a");
      tempBtn.className = clsx(
        "flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition"
      );
      
      // Add icon
      const iconSpan = document.createElement("span");
      iconSpan.innerHTML = '<svg width="20" height="20"></svg>';
      tempBtn.appendChild(iconSpan);
      
      // Add label
      const textSpan = document.createElement("span");
      textSpan.textContent = tab.label;
      tempBtn.appendChild(textSpan);
      
      // Add badge if needed
      if (tab.showBadge) {
        const badgeSpan = document.createElement("span");
        badgeSpan.className = `inline-flex items-center justify-center w-5 h-5 text-xs rounded-full ${getBadgeColor(tab.badgeStatus)}`;
        badgeSpan.textContent = getBadgeText(tab.badgeStatus);
        badgeSpan.style.marginLeft = "4px";
        tempBtn.appendChild(badgeSpan);
      }
      
      tempContainer.appendChild(tempBtn);
    });

    document.body.appendChild(tempContainer);

    const tabElements = tempContainer.children;
    let usedWidth = 0;
    const visible = [];
    const overflow = [];

    // Calculate which tabs fit
    Array.from(tabElements).forEach((tabElement, index) => {
      const tabWidth = tabElement.offsetWidth;
      if (usedWidth + tabWidth < availableWidth) {
        visible.push(navItems[index]);
        usedWidth += tabWidth;
      } else {
        overflow.push(navItems[index]);
      }
    });

    document.body.removeChild(tempContainer);

    setVisibleTabs(visible);
    setOverflowTabs(overflow);
  }, [navItems]);

  // Setup ResizeObserver for container
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      calculateVisibleTabs();
    });

    resizeObserverRef.current.observe(containerRef.current);
    
    // Initial calculation with small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      calculateVisibleTabs();
    }, 100);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      clearTimeout(timer);
    };
  }, [calculateVisibleTabs]);

  // Window resize fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWindowResize = debounce(() => {
      calculateVisibleTabs();
    }, 150);

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [calculateVisibleTabs, debounce]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Desktop more dropdown
      if (
        showMore &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMore(false);
      }
      
      // Mobile dropdown
      if (
        showMobileMenu &&
        mobileMoreButtonRef.current &&
        !mobileMoreButtonRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMore, showMobileMenu]);

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block border-b border-gray-200">
        <div className="flex items-center bg-gray-50" ref={containerRef}>
          {visibleTabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
              className={`flex-1 flex flex-col items-center px-6 py-4 border-r border-gray-200 last:border-r-0 transition-all relative ${
                activeSection === tab.id 
                  ? 'bg-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <tab.icon className={`w-5 h-5 mb-2 ${
                  activeSection === tab.id ? 'text-[#BC8BBC]' : 'text-gray-500'
                }`} />
                {tab.showBadge && tab.badgeStatus && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                    getBadgeColor(tab.badgeStatus)
                  }`}>
                    {getBadgeText(tab.badgeStatus)}
                  </div>
                )}
              </div>
              <span className={`text-sm font-medium ${
                activeSection === tab.id ? 'text-[#BC8BBC]' : 'text-gray-700'
              }`}>
                {tab.label}
              </span>
              <div className={`mt-1 h-1 w-12 rounded-full transition-all ${
                activeSection === tab.id ? 'bg-[#BC8BBC]' : 'bg-transparent'
              }`} />
            </Link>
          ))}

          {/* Desktop "More" dropdown for overflow tabs */}
          {overflowTabs.length > 0 && (
            <div className="ml-auto relative" ref={moreButtonRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className="px-4 py-2 flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mx-2"
              >
                <MoreHorizontal size={18} />
                <span className="text-sm font-medium">More</span>
                <ChevronDown size={16} className={`transition-transform ${showMore ? "rotate-180" : ""}`} />
              </button>
              
              {showMore && (
                <div
                  className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1"
                  ref={dropdownRef}
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      More Settings
                    </span>
                  </div>
                  
                  {overflowTabs.map((tab) => (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      onClick={() => setShowMore(false)}
                      className={clsx(
                        "w-full text-left px-4 py-3 text-sm transition flex items-center gap-3 hover:bg-gray-50",
                        activeSection === tab.id
                          ? "text-[#BC8BBC] bg-[#BC8BBC] bg-opacity-5"
                          : "text-gray-700"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <tab.icon className="w-4 h-4" />
                        {tab.showBadge && tab.badgeStatus && (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                            getBadgeColor(tab.badgeStatus)
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                      </div>
                      {activeSection === tab.id && (
                        <div className="w-2 h-2 bg-[#BC8BBC] rounded-full flex-shrink-0"></div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation - IMPROVED with clear "More" button */}
      <div className="md:hidden border-b border-gray-200">
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
          {/* Current section info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {activeNavItem && (
              <div className="relative p-2 bg-white rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                <activeNavItem.icon className="w-5 h-5 text-[#BC8BBC]" />
                {activeNavItem.showBadge && activeNavItem.badgeStatus && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                    getBadgeColor(activeNavItem.badgeStatus)
                  }`}>
                    {getBadgeText(activeNavItem.badgeStatus)}
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate flex items-center gap-2">
                {activeNavItem?.label}
                {activeNavItem?.showBadge && activeNavItem?.badgeStatus && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    getBadgeColor(activeNavItem.badgeStatus)
                  }`}>
                    {getBadgeText(activeNavItem.badgeStatus)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {activeNavItem?.description}
              </div>
            </div>
          </div>
          
          {/* Mobile "More" button - Clear indication of more sections */}
          <div className="relative" ref={mobileMoreButtonRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <MoreHorizontal size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                All Sections
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gray-500 transition-transform ${showMobileMenu ? "rotate-180" : ""}`} 
              />
            </button>
            
            {/* Mobile dropdown menu */}
            {showMobileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-30 max-h-[80vh] overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Account Settings
                    </span>
                    <span className="text-xs text-gray-500">
                      {navItems.length} sections
                    </span>
                  </div>
                </div>
                
                <div className="py-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={clsx(
                        "w-full text-left px-4 py-3 transition flex items-center gap-3 border-l-4",
                        activeSection === item.id
                          ? "bg-[#BC8BBC] bg-opacity-5 border-l-[#BC8BBC]"
                          : "border-l-transparent hover:bg-gray-50"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <item.icon className={`w-5 h-5 ${
                          activeSection === item.id ? "text-[#BC8BBC]" : "text-gray-500"
                        }`} />
                        {item.showBadge && item.badgeStatus && (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                            getBadgeColor(item.badgeStatus)
                          }`}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className='font-medium text-gray-700 flex items-center gap-2'>
                          {item.label}
                          {item.showBadge && item.badgeStatus && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              getBadgeColor(item.badgeStatus)
                            }`}>
                              {getBadgeText(item.badgeStatus)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.description}
                        </div>
                      </div>
                      {activeSection === item.id && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-[#BC8BBC] rounded-full"></div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
                
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <div className="text-xs text-gray-500">
                    Tap any section to switch views
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsNav;