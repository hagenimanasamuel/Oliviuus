// src/pages/account/AccountSettings.jsx
import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AccountInfo = React.lazy(() => import("./tabs/AccountInfo"));
const SecuritySettings = React.lazy(() => import("./tabs/SecuritySettings"));
const Preferences = React.lazy(() => import("./tabs/Preferences"));
const UserSessions = React.lazy(() => import("./tabs/UserSessions"));
const SubscriptionInfo = React.lazy(() => import("./tabs/SubscriptionInfo"));
const FamilyProfiles = React.lazy(() => import("./tabs/FamilyProfiles"));
const ParentalControls = React.lazy(() => import("./tabs/ParentalControls"));

export default function AccountSettings() {
  const { user } = useAuth();
  const { t } = useTranslation();

  // === FIX: Initialize selectedTab from URL hash synchronously ===
  const initialTab = window.location.hash ? window.location.hash.replace("#", "") : "account";
  const [selectedTab, setSelectedTab] = useState(initialTab);

  const [tabs, setTabs] = useState([]);
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);

  const navigate = useNavigate();
  const containerRef = React.useRef(null);
  const moreButtonRef = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Update URL hash whenever selectedTab changes
  useEffect(() => {
    if (selectedTab) {
      window.history.replaceState(null, "", `#${selectedTab}`);
    }
  }, [selectedTab]);

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

  // Build tabs list
  useEffect(() => {
    const baseTabs = [
      { id: "account", label: t("settings.tabs.account") },
      { id: "security", label: t("settings.tabs.security") },
      { id: "preferences", label: t("settings.tabs.preferences") },
      { id: "sessions", label: t("settings.tabs.sessions") },
    ];
    const viewerTabs = [
      { id: "subscription", label: t("settings.tabs.subscription") },
      { id: "profiles", label: t("settings.tabs.profiles") },
      { id: "parental", label: t("settings.tabs.parental") },
    ];
    setTabs(user.role === "viewer" ? [...baseTabs, ...viewerTabs] : baseTabs);
  }, [user, t]);

  // Measure overflow on resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      // Reset to measure all buttons
      tabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(
          `button[data-tab="${tab.id}"]`
        );
        if (!btn) return;
        btn.style.display = "block";
      });

      // Calculate visible tabs with space for "More" button
      tabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(
          `button[data-tab="${tab.id}"]`
        );
        if (!btn) return;

        const btnWidth = btn.offsetWidth + 8;
        if (usedWidth + btnWidth < containerWidth - 80) {
          newVisible.push(tab);
          usedWidth += btnWidth;
        } else {
          newOverflow.push(tab);
        }
      });

      // Hide overflowed tabs
      tabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(
          `button[data-tab="${tab.id}"]`
        );
        if (!btn) return;
        const isVisible = newVisible.find((t) => t.id === tab.id);
        btn.style.display = isVisible ? "block" : "none";
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tabs]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-16 px-4 sm:px-6 lg:px-8">
      {/* Page Title with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-gray-800 transition"
          aria-label={t("settings.back")}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-0 bg-[#0d0d0d] z-20 border-b border-gray-700 mb-6">
        <div className="flex items-center relative" ref={containerRef}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                selectedTab === tab.id
                  ? "border-b-2 border-[#BC8BBC] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {overflowTabs.length > 0 && (
            <div className="ml-auto relative" ref={moreButtonRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className="p-2 rounded-full hover:bg-gray-800 transition flex items-center gap-1"
              >
                <MoreHorizontal size={20} />
                <span>{t("settings.more")}</span>
              </button>
              {showMore && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700 z-30"
                  ref={dropdownRef}
                >
                  {overflowTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedTab(tab.id);
                        setShowMore(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition ${
                        selectedTab === tab.id
                          ? "bg-gray-800 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg min-h-[400px]">
        <Suspense fallback={<div className="text-gray-400">{t("settings.loading")}</div>}>
          {selectedTab === "account" && <AccountInfo user={user} />}
          {selectedTab === "security" && <SecuritySettings user={user} />}
          {selectedTab === "preferences" && <Preferences user={user} />}
          {selectedTab === "sessions" && <UserSessions user={user} />}
          {user.role === "viewer" && selectedTab === "subscription" && (
            <SubscriptionInfo user={user} />
          )}
          {user.role === "viewer" && selectedTab === "profiles" && (
            <FamilyProfiles user={user} />
          )}
          {user.role === "viewer" && selectedTab === "parental" && (
            <ParentalControls user={user} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
