// src/pages/account/tabs/FamilyProfiles.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useSubscription } from "../../../../context/SubscriptionContext";
import api from "../../../../api/axios";
import { Users, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  const tabs = [
    { id: "kids", label: t('familyProfiles.tabs.kidsProfiles') },
    { id: "members", label: t('familyProfiles.tabs.familyMembers') }
  ];

  useEffect(() => {
    loadFamilyData();
  }, []);

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6 sm:mb-8">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 whitespace-nowrap min-w-[120px] text-center ${
                activeTab === tab.id
                  ? "bg-[#BC8BBC] text-white shadow-lg transform scale-105"
                  : "text-gray-400 hover:text-white hover:bg-gray-800 transform hover:scale-105"
              }`}
            >
              {tab.label}
            </button>
          ))}
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