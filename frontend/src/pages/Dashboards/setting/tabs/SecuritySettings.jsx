import React, { useState, useEffect, useRef } from "react";
import PasswordSettings from "./security/PasswordSettings";
import CriticalActions from "./security/CriticalActions";
import { MoreHorizontal } from "lucide-react";

const securitySubTabs = ["Password", "Critical Actions"];

export default function SecuritySettings() {
  const [activeSubTab, setActiveSubTab] = useState("Password");
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);

  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMore &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMore(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMore]);

  // Handle responsive overflow
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      // Reset to measure all buttons
      securitySubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab}"]`);
        if (!btn) return;
        btn.style.display = "block";
      });

      // Calculate visible tabs with space for "More" button
      securitySubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab}"]`);
        if (!btn) return;
        const btnWidth = btn.offsetWidth + 8; // spacing
        if (usedWidth + btnWidth < containerWidth - 80) {
          newVisible.push(tab);
          usedWidth += btnWidth;
        } else {
          newOverflow.push(tab);
        }
      });

      // Hide overflowed tabs
      securitySubTabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(`button[data-tab="${tab}"]`);
        if (!btn) return;
        const isVisible = newVisible.includes(tab);
        btn.style.display = isVisible ? "block" : "none";
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "Password":
        return <PasswordSettings />;
      case "Critical Actions":
        return <CriticalActions />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>

      {/* Tabs */}
      <div className="flex items-center relative border-b border-gray-700 mb-4" ref={containerRef}>
        {securitySubTabs.map((tab) => (
          <button
            key={tab}
            data-tab={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition ${
              activeSubTab === tab
                ? "border-b-2 border-[#BC8BBC] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}

        {/* Overflow "More" button */}
        {overflowTabs.length > 0 && (
          <div className="ml-auto relative" ref={moreButtonRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 rounded-full hover:bg-gray-800 transition flex items-center gap-1"
            >
              <MoreHorizontal size={20} />
              More
            </button>
            {showMore && (
              <div
                className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-30"
                ref={dropdownRef}
              >
                {overflowTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveSubTab(tab);
                      setShowMore(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition ${
                      activeSubTab === tab
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-tab content */}
      <div>{renderSubTabContent()}</div>
    </div>
  );
}
