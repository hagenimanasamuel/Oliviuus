// src/pages/account/AccountSettings.jsx
import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useSubscription } from "../../../context/SubscriptionContext";
import api from "../../../api/axios";
import { ArrowLeft, MoreHorizontal, Bell, Users, Shield, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AccountInfo = React.lazy(() => import("./tabs/AccountInfo"));
const SecuritySettings = React.lazy(() => import("./tabs/SecuritySettings"));
const Preferences = React.lazy(() => import("./tabs/Preferences"));
const UserSessions = React.lazy(() => import("./tabs/UserSessions"));
const SubscriptionInfo = React.lazy(() => import("./tabs/SubscriptionInfo"));
const FamilyProfiles = React.lazy(() => import("./tabs/FamilyProfiles"));
const ParentalControls = React.lazy(() => import("./tabs/ParentalControls"));
const FamilyInvitations = React.lazy(() => import("./tabs/FamilyInvitations"));

export default function AccountSettings() {
  const { user } = useAuth();
  const { currentSubscription, isFamilyPlanAccess } = useSubscription();
  const { t } = useTranslation();

  // Initialize selectedTab from URL hash
  const initialTab = window.location.hash ? window.location.hash.replace("#", "") : "account";
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [familyMemberData, setFamilyMemberData] = useState(null);
  const [isFamilyMember, setIsFamilyMember] = useState(false);

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

  // Check for pending family invitations and family membership
  useEffect(() => {
    const checkFamilyStatus = async () => {
      try {
        // Check if user has pending invitations
        const invitationsResponse = await api.get('/family/invitations/pending');
        const pendingCount = invitationsResponse.data?.pending_invitations || 0;
        setPendingInvitations(pendingCount);

        // Check if user is already a family member and get detailed data
        const familyStatusResponse = await api.get('/family/members/my-status');
        
        const isMember = familyStatusResponse.data?.success && familyStatusResponse.data.data?.is_family_member;
        setIsFamilyMember(isMember);
        
        if (isMember) {
          setFamilyMemberData(familyStatusResponse.data.data);
        } else {
          setFamilyMemberData(null);
        }

      } catch (error) {
        console.error("Error checking family status:", error);
        setPendingInvitations(0);
        setIsFamilyMember(false);
        setFamilyMemberData(null);
      }
    };

    checkFamilyStatus();
  }, [user.id]);

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

  // Build tabs list with proper parental controls logic
  useEffect(() => {
    const baseTabs = [
      { id: "account", label: t("settings.tabs.account") },
      { id: "security", label: t("settings.tabs.security") },
      { id: "preferences", label: t("settings.tabs.preferences") },
      { id: "sessions", label: t("settings.tabs.sessions") },
    ];
    
    const viewerTabs = [
      { id: "subscription", label: t("settings.tabs.subscription") },
    ];

    // Check if user is a family member
    const isFamilyMemberUser = isFamilyMember && familyMemberData;
    
    // Check if user is family owner (has family plan subscription)
    const isFamilyOwner = currentSubscription && 
      (currentSubscription.plan_type === 'family' || currentSubscription.is_family_plan);
    
    // Check if family member has parent role
    const hasParentRole = isFamilyMemberUser && familyMemberData.member_role === 'parent';

    // Family invitations tab - shown when user has pending invites OR is family member
    const familyInvitationsTab = (pendingInvitations > 0 || isFamilyMember) ? [
      { 
        id: "family-invitations", 
        label: t("settings.tabs.family_invitations"),
        badge: pendingInvitations > 0 ? pendingInvitations : null,
        icon: pendingInvitations > 0 ? <Bell size={14} className="text-yellow-400" /> : <Users size={14} />
      }
    ] : [];

    // Family management tabs - only for family plan OWNERS (not regular family members)
    const familyManagementTabs = isFamilyOwner ? [
      { id: "profiles", label: t("settings.tabs.profiles"), icon: <UserCog size={14} /> },
    ] : [];

    // Parental controls logic:
    // 1. Family owners (with family plan) get parental controls
    // 2. Family members with 'parent' role get parental controls
    // 3. Family members with 'child' or 'teen' roles DO NOT get parental controls
    const parentalControlsTab = (isFamilyOwner || (isFamilyMemberUser && hasParentRole)) ? [
      { id: "parental", label: t("settings.tabs.parental"), icon: <Shield size={14} /> }
    ] : [];

    // Determine which tabs to show based on user role and family status
    let finalTabs = [];

    if (user.role === "admin") {
      // Admins see base tabs + family invitations if applicable
      finalTabs = [...baseTabs, ...familyInvitationsTab];
    } else if (user.role === "viewer") {
      if (isFamilyMemberUser) {
        // Family members see base tabs + family invitations
        finalTabs = [...baseTabs, ...familyInvitationsTab];
        
        // Add parental controls ONLY if they have parent role
        if (hasParentRole) {
          finalTabs = [...finalTabs, ...parentalControlsTab];
        }
        
        // Family members with family plan access don't need individual subscription tab
        if (!isFamilyPlanAccess) {
          finalTabs.splice(4, 0, ...viewerTabs); // Insert subscription tab at position 4
        }
      } else {
        // Regular viewers see all tabs including family management if they are owners
        finalTabs = [...baseTabs, ...viewerTabs, ...familyInvitationsTab, ...familyManagementTabs, ...parentalControlsTab];
      }
    }

    setTabs(finalTabs);
  }, [user, currentSubscription, pendingInvitations, isFamilyMember, familyMemberData, isFamilyPlanAccess, t]);

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

  // Show family member badge in account info
  const showFamilyMemberBadge = isFamilyMember && familyMemberData;

  // Get role display text for badge - Now using translations
  const getRoleDisplayText = () => {
    if (!familyMemberData) return t('family.memberRoles.familyMember');
    
    const roleKey = `family.memberRoles.${familyMemberData.member_role}`;
    return t(roleKey, { defaultValue: t('family.memberRoles.familyMember') });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-16 px-4 sm:px-6 lg:px-8">
      {/* Enhanced Responsive Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Back Button and Title Section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-gray-800 transition flex-shrink-0"
            aria-label={t("settings.back")}
          >
            <ArrowLeft size={22} />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">
              {t("settings.title")}
            </h1>
            {showFamilyMemberBadge && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded-full flex items-center gap-1 w-fit flex-shrink-0">
                  <Users size={12} className="flex-shrink-0" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {getRoleDisplayText()}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Optional: Add space for future header actions if needed */}
        <div className="flex-shrink-0">
          {/* This div maintains flex layout balance and can be used for future header actions */}
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-0 bg-[#0d0d0d] z-20 border-b border-gray-700 mb-6">
        <div className="flex items-center relative" ref={containerRef}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap flex items-center gap-2 relative ${
                selectedTab === tab.id
                  ? "border-b-2 border-[#BC8BBC] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.icon && tab.icon}
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {tab.badge}
                </span>
              )}
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
                      className={`block w-full text-left px-4 py-2 text-sm transition flex items-center gap-2 ${
                        selectedTab === tab.id
                          ? "bg-gray-800 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {tab.icon && tab.icon}
                      {tab.label}
                      {tab.badge && tab.badge > 0 && (
                        <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {tab.badge}
                        </span>
                      )}
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
          {selectedTab === "account" && (
            <AccountInfo 
              user={user} 
              isFamilyMember={isFamilyMember}
              familyMemberData={familyMemberData}
            />
          )}
          {selectedTab === "security" && <SecuritySettings user={user} />}
          {selectedTab === "preferences" && <Preferences user={user} />}
          {selectedTab === "sessions" && <UserSessions user={user} />}
          
          {/* Subscription tab - hidden for family members with plan access */}
          {selectedTab === "subscription" && (
            <SubscriptionInfo 
              user={user} 
              isFamilyMember={isFamilyMember}
              hasFamilyPlanAccess={isFamilyPlanAccess}
            />
          )}
          
          {/* Family invitations - available to all users */}
          {selectedTab === "family-invitations" && (
            <FamilyInvitations 
              user={user} 
              isFamilyMember={isFamilyMember}
              onInvitationUpdate={() => {
                // Refresh pending invitations count
                const checkPending = async () => {
                  try {
                    const response = await api.get('/family/invitations/pending');
                    setPendingInvitations(response.data?.pending_invitations || 0);
                    
                    // Also refresh family status
                    const familyStatusResponse = await api.get('/family/members/my-status');
                    const isMember = familyStatusResponse.data?.success && familyStatusResponse.data.data?.is_family_member;
                    setIsFamilyMember(isMember);
                    if (isMember) {
                      setFamilyMemberData(familyStatusResponse.data.data);
                    }
                  } catch (error) {
                    console.error("Error refreshing invitations:", error);
                  }
                };
                checkPending();
              }}
            />
          )}
          
          {/* Family profiles - ONLY for family owners */}
          {selectedTab === "profiles" && (
            <FamilyProfiles 
              user={user} 
              isFamilyOwner={currentSubscription?.plan_type === 'family'}
            />
          )}
          
          {/* Parental controls - for family owners AND family members with parent role */}
          {selectedTab === "parental" && (
            <ParentalControls 
              user={user} 
              isFamilyOwner={currentSubscription?.plan_type === 'family'}
              isFamilyMember={isFamilyMember}
              memberRole={familyMemberData?.member_role}
              familyMemberData={familyMemberData}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}