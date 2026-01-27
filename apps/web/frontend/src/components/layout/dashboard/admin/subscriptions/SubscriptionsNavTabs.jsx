import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { MoreHorizontal, Calendar, Clock, Gift, Users, Zap } from "lucide-react";
import clsx from "clsx";

// Lazy-loaded components
const SubscriptionPlans = React.lazy(() => import("./SubscriptionPlans"));
const PlanSeeder = React.lazy(() => import("./PlanSeeder"));
const SubscriptionAnalytics = React.lazy(() => import("./SubscriptionAnalytics"));
const CustomerManagement = React.lazy(() => import("./CustomerManagement"));
const BillingManagement = React.lazy(() => import("./BillingManagement"));
const FreePlansManagement = React.lazy(() => import("./FreePlansManagement"));

export default function SubscriptionsNavTabs() {
  // Restore tab from URL hash
  const initialTab = window.location.hash ? window.location.hash.replace("#", "") : "plans";
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [showMore, setShowMore] = useState(false);

  // ✅ Memoize tabs
  const tabs = useMemo(
    () => [
      { id: "plans", label: "Manage Plans", component: <SubscriptionPlans /> },
      { id: "free-plans", label: "Free Plans", component: <FreePlansManagement />, icon: <Gift size={16} /> },
      { id: "seeder", label: "Initialize Plans", component: <PlanSeeder /> },
      { id: "customers", label: "Customers", component: <CustomerManagement /> },
      { id: "billing", label: "Billing & Invoices", component: <BillingManagement /> },
      { id: "analytics", label: "Analytics", component: <SubscriptionAnalytics /> }
    ],
    []
  );

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const moreButtonRef = useRef(null);

  const [visibleTabs, setVisibleTabs] = useState(tabs);
  const [overflowTabs, setOverflowTabs] = useState([]);

  // Update URL hash whenever tab changes
  useEffect(() => {
    window.history.replaceState(null, "", `#${selectedTab}`);
  }, [selectedTab]);

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

  // ✅ Measure and adjust visible vs overflow tabs
  const calculateVisibleTabs = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth - 80; // space for "More"

    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.visibility = "hidden";
    tempContainer.style.whiteSpace = "nowrap";

    tabs.forEach((tab) => {
      const tempBtn = document.createElement("button");
      tempBtn.className = "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap";
      const iconHtml = tab.icon ? `<div class="flex items-center">${tab.icon.outerHTML || ''}</div>` : '';
      tempBtn.innerHTML = `${iconHtml}<span>${tab.label}</span>`;
      tempContainer.appendChild(tempBtn);
    });

    document.body.appendChild(tempContainer);

    const tabElements = tempContainer.children;
    let usedWidth = 0;
    const visible = [];
    const overflow = [];

    Array.from(tabElements).forEach((tabElement, index) => {
      const tabWidth = tabElement.offsetWidth + 8;
      if (usedWidth + tabWidth < containerWidth) {
        visible.push(tabs[index]);
        usedWidth += tabWidth;
      } else {
        overflow.push(tabs[index]);
      }
    });

    document.body.removeChild(tempContainer);

    setVisibleTabs(visible);
    setOverflowTabs(overflow);
  }, [tabs]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleTabs();
    });

    resizeObserver.observe(containerRef.current);
    calculateVisibleTabs();

    return () => resizeObserver.disconnect();
  }, [calculateVisibleTabs]);

  // Window resize fallback
  useEffect(() => {
    const handleWindowResize = () => {
      calculateVisibleTabs();
    };

    const debouncedResize = debounce(handleWindowResize, 100);
    window.addEventListener("resize", debouncedResize);
    return () => window.removeEventListener("resize", debouncedResize);
  }, [calculateVisibleTabs]);

  // Simple debounce
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

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-300 dark:border-gray-700 relative" ref={containerRef}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition",
              selectedTab === tab.id
                ? "border-b-2 border-[#BC8BBC] text-[#BC8BBC]"
                : "text-gray-600 dark:text-gray-400 hover:text-[#BC8BBC] dark:hover:text-[#BC8BBC]"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}

        {overflowTabs.length > 0 && (
          <div className="ml-auto relative" ref={moreButtonRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1"
            >
              <MoreHorizontal size={20} />
              <span>More</span>
            </button>

            {showMore && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 z-30"
              >
                {overflowTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedTab(tab.id);
                      setShowMore(false);
                    }}
                    className={clsx(
                      "flex items-center gap-2 w-full text-left px-4 py-2 text-sm transition",
                      selectedTab === tab.id
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {tab.icon && <span>{tab.icon}</span>}
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg min-h-[400px]">
        <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
          {tabs.find((tab) => tab.id === selectedTab)?.component}
        </Suspense>
      </div>
    </div>
  );
}