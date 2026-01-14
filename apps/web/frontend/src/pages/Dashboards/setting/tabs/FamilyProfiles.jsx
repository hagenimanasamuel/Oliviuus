// src/pages/account/tabs/FamilyProfiles.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useSubscription } from "../../../../context/SubscriptionContext";
import api from "../../../../api/axios";
import { Users, Shield, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// Import the tab components
import KidsProfilesTab from "./family/KidsProfilesTab";
import FamilyMembersTab from "./family/familyMembersTab";

export default function FamilyProfiles({ user }) {
  const { t } = useTranslation();
  const { currentSubscription } = useSubscription();
  const [activeTab, setActiveTab] = useState("kids");
  const [loading, setLoading] = useState(true);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  // Responsive tab states
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const moreButtonRef = useRef(null);

  // Memoize tabs configuration
  const tabs = useMemo(() => [
    { id: "kids", label: t('familyProfiles.tabs.kidsProfiles'), icon: Users },
    { id: "members", label: t('familyProfiles.tabs.familyMembers'), icon: Users }
  ], [t]);

  // Initialize visibleTabs with all tabs after tabs is defined
  useEffect(() => {
    if (tabs.length > 0) {
      setVisibleTabs(tabs);
    }
  }, [tabs]);

  useEffect(() => {
    loadFamilyData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showMore &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMore]);

  // Calculate visible vs overflow tabs - FIXED VERSION
  const calculateVisibleTabs = useCallback(() => {
    if (!containerRef.current || tabs.length === 0) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const moreButtonWidth = 80; // Space reserved for "More" button
    
    // Get actual rendered tab elements
    const tabElements = container.querySelectorAll('[data-tab]');
    if (tabElements.length === 0) return;

    let usedWidth = 0;
    const visible = [];
    const overflow = [];

    // Calculate which tabs fit
    tabElements.forEach((tabElement, index) => {
      const tabWidth = tabElement.offsetWidth + 8; // Add margin
      
      // Check if this tab plus the "More" button (if needed) would fit
      const wouldNeedMoreButton = overflow.length > 0 || (usedWidth + tabWidth > containerWidth - moreButtonWidth);
      
      if (usedWidth + tabWidth + (wouldNeedMoreButton ? moreButtonWidth : 0) <= containerWidth) {
        visible.push(tabs[index]);
        usedWidth += tabWidth;
      } else {
        overflow.push(tabs[index]);
      }
    });

    setVisibleTabs(visible);
    setOverflowTabs(overflow);
  }, [tabs]);

  // Setup ResizeObserver for container - WITH DELAY FOR INITIAL RENDER
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleTabs();
    });

    resizeObserver.observe(containerRef.current);
    
    // Initial calculation after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      calculateVisibleTabs();
    }, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [calculateVisibleTabs]);

  // Recalculate when tabs change (language, etc)
  useEffect(() => {
    if (tabs.length > 0) {
      calculateVisibleTabs();
    }
  }, [tabs, calculateVisibleTabs]);

  // Simple debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const loadFamilyData = async () => {
    try {
      setLoading(true);
      // Load kid profiles
      const kidsResponse = await api.get("/kids/profiles");
      setKidProfiles(kidsResponse.data || []);
      
      // Load family members
      const membersResponse = await api.get("/family/members");
      setFamilyMembers(membersResponse.data || []);
    } catch (error) {
      console.error("Error loading family data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('familyProfiles.title')}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              {t('familyProfiles.subtitle')}
            </p>
          </div>
          
          {/* Plan Status Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#BC8BBC]/20 border border-[#BC8BBC]/30 text-[#BC8BBC] text-sm font-medium">
            <Shield size={14} className="mr-2" />
            {t('familyProfiles.planStatus')}
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation with Responsive Overflow */}
      <div className="sticky top-0 bg-gray-800/50 backdrop-blur-sm z-10 border-b border-gray-700 mb-6">
        <div className="flex items-center relative" ref={containerRef}>
          {/* Always render all tabs initially, they'll be hidden by CSS if not in visibleTabs */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isVisible = visibleTabs.some(vt => vt.id === tab.id);
            
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 min-w-[140px]",
                  activeTab === tab.id
                    ? "bg-[#BC8BBC] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-700",
                  !isVisible && "hidden" // Hide tabs that are not in visibleTabs
                )}
                style={{
                  display: isVisible ? 'flex' : 'none'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}

          {overflowTabs.length > 0 && (
            <div className="ml-auto relative" ref={moreButtonRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className="p-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-1 text-gray-400 hover:text-white"
              >
                <MoreHorizontal size={20} />
                <span className="text-sm">{t('settings.more', 'More')}</span>
              </button>

              {showMore && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-30"
                >
                  {overflowTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMore(false);
                        }}
                        className={clsx(
                          "flex items-center gap-2 w-full text-left px-4 py-3 text-sm transition",
                          activeTab === tab.id
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700">
        {activeTab === "kids" && (
          <KidsProfilesTab 
            kidProfiles={kidProfiles} 
            onUpdate={loadFamilyData}
            currentSubscription={currentSubscription}
          />
        )}
        
        {activeTab === "members" && (
          <FamilyMembersTab 
            familyMembers={familyMembers}
            onUpdate={loadFamilyData}
            currentSubscription={currentSubscription}
          />
        )}
      </div>
    </div>
  );
}