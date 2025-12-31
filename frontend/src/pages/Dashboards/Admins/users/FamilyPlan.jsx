import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Users,
  UserPlus,
  Shield,
  Clock,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Mail,
  Home,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  XCircle,
  Ban,
  Unlock,
  Key,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  Activity,
  AlertTriangle,
  Info,
  Play,
  Pause,
  Zap,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Tv,
  Plus,
  Save,
  X,
  ChevronDown,
  ShieldAlert,
  CalendarClock,
  Timer,
  Check,
  Loader2,
  Menu,
  ChevronRight
} from "lucide-react";
import api from "../../../../api/axios";

export default function FamilyPlan() {
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyStats, setFamilyStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    role: "all",
    dashboardType: "all",
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showPinSecurityModal, setShowPinSecurityModal] = useState(false);
  const [selectedMemberSessions, setSelectedMemberSessions] = useState([]);
  const [pinSecurityData, setPinSecurityData] = useState(null);
  const [familyPlanInfo, setFamilyPlanInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [newMember, setNewMember] = useState({
    email: "",
    role: "child",
    relationship: "",
    dashboardType: "normal",
  });
  const [memberSettings, setMemberSettings] = useState({
    dashboard_type: "normal",
    member_role: "child",
    relationship: "",
    is_suspended: false,
    suspended_until: "",
    sleep_time_start: "",
    sleep_time_end: "",
    allowed_access_start: "06:00",
    allowed_access_end: "22:00",
    monthly_spending_limit: 0,
    enforce_sleep_time: false,
    enforce_access_window: false,
    max_daily_watch_time: 120,
    content_restrictions: {
      max_age_rating: "PG",
      blocked_categories: []
    }
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [activeTab, setActiveTab] = useState("members");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [bulkOperation, setBulkOperation] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("month");
  const [savingSettings, setSavingSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const membersRes = await api.get('/user/family/members');
      
      if (membersRes.data.success) {
        setFamilyMembers(membersRes.data.members || []);
        setFamilyStats(membersRes.data.stats || {
          total: 0,
          active: 0,
          pending: 0,
          suspended: 0
        });
      }

      // Try to get family plan info, but don't fail if it doesn't exist
      try {
        const infoRes = await api.get('/user/family/plan-info');
        if (infoRes.data.success) {
          setFamilyPlanInfo(infoRes.data);
        }
      } catch (infoError) {
        console.warn("Could not fetch family plan info:", infoError);
        // Set default info if API fails
        setFamilyPlanInfo({
          subscription: {
            name: "Basic Plan",
            is_family_plan: true,
            max_family_members: 6,
            current_members: membersRes.data?.members?.length || 0,
            available_slots: 6 - (membersRes.data?.members?.length || 0),
            status: "active"
          }
        });
      }

      showToast("Family data loaded successfully");
    } catch (error) {
      console.error("Error fetching family data:", error);
      showToast(error.response?.data?.message || "Error loading family data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (period = 'month') => {
    try {
      const response = await api.get(`/user/family/analytics?period=${period}`);
      if (response.data.success) {
        setAnalyticsData(response.data);
        setShowAnalyticsModal(true);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      showToast(error.response?.data?.message || "Error loading analytics", "error");
    }
  };

  const fetchMemberSessions = async (memberId) => {
    try {
      const response = await api.get(`/user/family/members/${memberId}/sessions`);
      if (response.data.success) {
        setSelectedMemberSessions(response.data.sessions);
        setShowSessionsModal(true);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      showToast(error.response?.data?.message || "Error loading sessions", "error");
    }
  };

  const fetchPinSecurity = async (memberId) => {
    try {
      const response = await api.get(`/user/family/members/${memberId}/pin-security`);
      if (response.data.success) {
        setPinSecurityData(response.data);
        setShowPinSecurityModal(true);
      }
    } catch (error) {
      console.error("Error fetching PIN security:", error);
      showToast(error.response?.data?.message || "Error loading PIN security", "error");
    }
  };

  const addFamilyMember = async () => {
    if (!newMember.email || !newMember.email.includes('@')) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      const response = await api.post('/user/family/members/add', newMember);
      
      if (response.data.success) {
        showToast("User added to family plan successfully");
        setShowAddModal(false);
        setNewMember({
          email: "",
          role: "child",
          relationship: "",
          dashboardType: "normal",
        });
        fetchFamilyData();
      } else {
        showToast(response.data.message || "Failed to add user", "error");
      }
    } catch (error) {
      console.error("Error adding family member:", error);
      showToast(error.response?.data?.message || "Error adding user", "error");
    }
  };

  const updateMemberSettings = async (memberId) => {
    try {
      setSavingSettings(true);
      const response = await api.put(`/user/family/members/${memberId}/settings`, memberSettings);
      
      if (response.data.success) {
        showToast("Member settings updated successfully");
        setShowSettingsModal(false);
        fetchFamilyData();
      } else {
        showToast(response.data.message || "Failed to update settings", "error");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      showToast(error.response?.data?.message || "Error updating settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const removeFamilyMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Are you sure you want to remove ${memberEmail} from the family plan?`)) {
      return;
    }

    try {
      const response = await api.delete(`/user/family/members/${memberId}`);
      
      if (response.data.success) {
        showToast("Family member removed successfully");
        fetchFamilyData();
      } else {
        showToast(response.data.message || "Failed to remove member", "error");
      }
    } catch (error) {
      console.error("Error removing family member:", error);
      showToast(error.response?.data?.message || "Error removing member", "error");
    }
  };

  const suspendMember = async (memberId, suspend = true, suspendedUntil = null) => {
    try {
      const response = await api.put(`/user/family/members/${memberId}/settings`, {
        is_suspended: suspend,
        suspended_until: suspendedUntil
      });
      
      if (response.data.success) {
        showToast(`Member ${suspend ? 'suspended' : 'unsuspended'} successfully`);
        fetchFamilyData();
      } else {
        showToast(response.data.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Error updating member status:", error);
      showToast(error.response?.data?.message || "Error updating status", "error");
    }
  };

  const resetMemberPin = async (memberId) => {
    if (!window.confirm("Are you sure you want to reset PIN security for this member?")) {
      return;
    }

    try {
      const response = await api.post(`/user/family/members/${memberId}/reset-pin`);
      
      if (response.data.success) {
        showToast("PIN security reset successfully");
        fetchPinSecurity(memberId);
      } else {
        showToast(response.data.message || "Failed to reset PIN", "error");
      }
    } catch (error) {
      console.error("Error resetting PIN:", error);
      showToast(error.response?.data?.message || "Error resetting PIN", "error");
    }
  };

  const terminateSessions = async (memberId, sessionId = null) => {
    const message = sessionId 
      ? "Are you sure you want to terminate this session?" 
      : "Are you sure you want to terminate all active sessions for this member?";

    if (!window.confirm(message)) {
      return;
    }

    try {
      const url = sessionId 
        ? `/user/family/members/${memberId}/terminate-sessions?sessionId=${sessionId}`
        : `/user/family/members/${memberId}/terminate-sessions`;

      const response = await api.post(url);
      
      if (response.data.success) {
        showToast(sessionId ? "Session terminated" : "All sessions terminated");
        if (showSessionsModal) {
          fetchMemberSessions(memberId);
        }
      }
    } catch (error) {
      console.error("Error terminating sessions:", error);
      showToast(error.response?.data?.message || "Error terminating sessions", "error");
    }
  };

  const performBulkOperation = async () => {
    if (selectedMembers.length === 0) {
      showToast("Please select at least one member", "error");
      return;
    }

    if (!bulkOperation) {
      showToast("Please select a bulk operation", "error");
      return;
    }

    let confirmMessage = "";
    switch (bulkOperation) {
      case 'suspend':
        confirmMessage = `Suspend ${selectedMembers.length} selected members?`;
        break;
      case 'unsuspend':
        confirmMessage = `Unsuspend ${selectedMembers.length} selected members?`;
        break;
      case 'remove':
        confirmMessage = `Remove ${selectedMembers.length} selected members from family plan?`;
        break;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await api.post('/user/family/bulk-operations', {
        memberIds: selectedMembers,
        operation: bulkOperation
      });
      
      if (response.data.success) {
        showToast(`Bulk ${bulkOperation} operation completed`);
        setSelectedMembers([]);
        setBulkOperation("");
        fetchFamilyData();
      }
    } catch (error) {
      console.error("Error performing bulk operation:", error);
      showToast(error.response?.data?.message || "Error performing bulk operation", "error");
    }
  };

  const exportToCSV = () => {
    if (filteredFamilyMembers.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = ["ID", "Email", "Role", "Relationship", "Status", "Dashboard Type", "Joined Date", "Last Login", "Active Sessions"];
    const csvData = filteredFamilyMembers.map(member => [
      member.id,
      member.user_email,
      member.member_role,
      member.relationship || "N/A",
      member.is_suspended ? "Suspended" : (member.is_active ? "Active" : "Inactive"),
      member.dashboard_type,
      member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Not joined",
      member.last_login ? new Date(member.last_login).toLocaleDateString() : "Never",
      member.active_sessions || 0
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `family-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast("CSV exported successfully");
  };

  const getStatusBadge = (member) => {
    if (member.is_suspended) return "Suspended";
    return member.is_active ? "Active" : "Inactive";
  };

  const getStatusColor = (member) => {
    if (member.is_suspended) return "bg-[#FFD0D0] text-[#8A4B4B] border border-[#8A4B4B]";
    return member.is_active 
      ? "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]" 
      : "bg-gray-100 text-gray-800 border border-gray-300";
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'owner': return "bg-[#E6D0FF] text-[#8A4BC8] border border-[#8A4BC8]";
      case 'parent': return "bg-[#D0E6E6] text-[#4B8A8A] border border-[#4B8A8A]";
      case 'teen': return "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]";
      case 'child': return "bg-[#FFF4D0] text-[#8A7A4B] border border-[#8A7A4B]";
      default: return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch(deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-3 w-3" />;
      case 'tablet': return <Tablet className="h-3 w-3" />;
      case 'smarttv': return <Tv className="h-3 w-3" />;
      default: return <Monitor className="h-3 w-3" />;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not set';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const filteredFamilyMembers = familyMembers.filter(member => {
    const matchesSearch = searchTerm === "" || 
      member.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === "all" || 
      (filters.status === "active" && member.is_active && !member.is_suspended) ||
      (filters.status === "suspended" && member.is_suspended) ||
      (filters.status === "inactive" && !member.is_active);
    
    const matchesRole = filters.role === "all" || member.member_role === filters.role;
    const matchesDashboard = filters.dashboardType === "all" || member.dashboard_type === filters.dashboardType;
    
    return matchesSearch && matchesStatus && matchesRole && matchesDashboard;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-hidden">
      {/* Toast Notification - Fixed for mobile */}
      {toast.show && (
        <div className={`fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-auto z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === "success" 
            ? "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]" 
            : "bg-[#FFD0D0] text-[#8A4B4B] border border-[#8A4B4B]"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="text-sm flex-grow truncate">{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="ml-2 hover:opacity-80 flex-shrink-0"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header - Optimized for mobile */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              Family Plan
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              Manage family members and settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] flex-shrink-0"
              disabled={familyPlanInfo && familyPlanInfo.available_slots <= 0}
              title="Add Member"
            >
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0 sm:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} sm:hidden flex-col gap-2 animate-slideDown`}>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAnalytics('month')}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </button>
            <button
              onClick={exportToCSV}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </button>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => fetchAnalytics('month')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] text-sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm"
            disabled={familyPlanInfo && familyPlanInfo.available_slots <= 0}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
            {familyPlanInfo && (
              <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                {familyPlanInfo.available_slots}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Family Plan Info Card - Mobile optimized */}
      {familyPlanInfo && (
        <div className="bg-gradient-to-r from-[#BC8BBC] to-[#A87BA8] rounded-lg shadow p-3 sm:p-4 text-white overflow-hidden">
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold">Family Plan</h3>
              <p className="text-white/80 text-xs sm:text-sm">{familyPlanInfo.subscription?.name || "Premium Family"}</p>
              <div className="mt-1 flex flex-wrap gap-1.5 sm:gap-2">
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Status: {familyPlanInfo.subscription?.status || 'Active'}</span>
                <span className="text-xs">Valid until: {familyPlanInfo.subscription?.end_date ? new Date(familyPlanInfo.subscription.end_date).toLocaleDateString() : 'No expiration'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="text-center p-2 bg-white/10 rounded">
                <div className="text-lg sm:text-xl font-bold">{familyStats.total}</div>
                <div className="text-xs text-white/80">Total</div>
              </div>
              <div className="text-center p-2 bg-white/10 rounded">
                <div className="text-lg sm:text-xl font-bold">{familyStats.active}</div>
                <div className="text-xs text-white/80">Active</div>
              </div>
              <div className="text-center p-2 bg-white/10 rounded">
                <div className="text-lg sm:text-xl font-bold">{familyStats.suspended}</div>
                <div className="text-xs text-white/80">Suspended</div>
              </div>
              <div className="text-center p-2 bg-white/10 rounded">
                <div className="text-lg sm:text-xl font-bold">{familyPlanInfo.available_slots}</div>
                <div className="text-xs text-white/80">Slots Left</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Mobile scrollable */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <nav className="flex space-x-1 sm:space-x-4 min-w-max">
          <button
            onClick={() => setActiveTab("members")}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "members"
                ? "border-[#BC8BBC] text-[#BC8BBC]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Members ({familyMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("bulk")}
            className={`py-2 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === "bulk"
                ? "border-[#BC8BBC] text-[#BC8BBC]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Zap className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Bulk Operations
          </button>
        </nav>
      </div>

      {/* Bulk Operations Tab - Mobile optimized */}
      {activeTab === "bulk" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">Bulk Operations</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected: {selectedMembers.length}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3 max-h-20 overflow-y-auto p-1">
                {selectedMembers.slice(0, 3).map(memberId => {
                  const member = familyMembers.find(m => m.id === memberId);
                  return member ? (
                    <span key={memberId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#E6D0E6] text-[#8A4B8A] truncate max-w-[120px]">
                      {member.user_email}
                    </span>
                  ) : null;
                })}
                {selectedMembers.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                    +{selectedMembers.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-xs sm:text-sm"
              >
                <option value="">Select Operation</option>
                <option value="suspend">Suspend Selected</option>
                <option value="unsuspend">Unsuspend Selected</option>
                <option value="remove">Remove Selected</option>
                <option value="update_settings">Update Settings</option>
              </select>
              <button
                onClick={performBulkOperation}
                disabled={!bulkOperation || selectedMembers.length === 0}
                className="px-3 sm:px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm whitespace-nowrap"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters - Mobile optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-xs sm:text-sm"
            />
          </div>
          
          {/* Mobile Filters Toggle */}
          <button
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="sm:hidden inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
            <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${isMobileFiltersOpen ? 'rotate-90' : ''}`} />
          </button>
          
          {/* Filters Grid */}
          <div className={`${isMobileFiltersOpen ? 'grid' : 'hidden'} sm:grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2`}>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="col-span-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="col-span-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="parent">Parent</option>
              <option value="teen">Teen</option>
              <option value="child">Child</option>
              <option value="guest">Guest</option>
            </select>
            <select
              value={filters.dashboardType}
              onChange={(e) => setFilters({...filters, dashboardType: e.target.value})}
              className="col-span-2 border border-gray-300 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Dashboards</option>
              <option value="normal">Normal</option>
              <option value="kid">Kid</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({status: "all", role: "all", dashboardType: "all"});
                setSelectedMembers([]);
                setIsMobileFiltersOpen(false);
              }}
              className="col-span-2 sm:col-auto inline-flex items-center justify-center px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <RefreshCw className="h-3 w-3 mr-1 sm:mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Family Members Table - Mobile card view */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === filteredFamilyMembers.length && filteredFamilyMembers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers(filteredFamilyMembers.map(m => m.id));
                      } else {
                        setSelectedMembers([]);
                      }
                    }}
                    className="h-3 w-3 sm:h-4 sm:w-4 text-[#BC8BBC] focus:ring-[#BC8BBC] border-gray-300 rounded"
                  />
                </th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFamilyMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm font-medium">No family members found</p>
                      <p className="text-xs mt-1 text-center">
                        {familyMembers.length === 0 
                          ? "Start by adding family members" 
                          : "Try changing your search or filters"}
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-3 inline-flex items-center px-3 py-1.5 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-xs"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add First Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFamilyMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="h-3 w-3 sm:h-4 sm:w-4 text-[#BC8BBC] focus:ring-[#BC8BBC] border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#E6D0E6] flex items-center justify-center mr-2 flex-shrink-0">
                          <Users className="h-4 w-4 text-[#8A4B8A]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{member.user_email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.dashboard_type} • {member.relationship || "No relation"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.member_role)}`}>
                        {member.member_role}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member)}`}>
                          {getStatusBadge(member)}
                        </span>
                        {member.active_sessions > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Online
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => fetchMemberSessions(member.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded"
                          title="View Sessions"
                        >
                          <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => fetchPinSecurity(member.id)}
                          className="p-1 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded"
                          title="PIN Security"
                        >
                          <Key className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const menus = document.querySelectorAll('.action-menu');
                              menus.forEach(menu => menu.classList.add('hidden'));
                              e.currentTarget.nextElementSibling.classList.toggle('hidden');
                            }}
                            className="inline-flex items-center p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="action-menu hidden absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setMemberSettings({
                                  dashboard_type: member.dashboard_type || "normal",
                                  member_role: member.member_role || "child",
                                  relationship: member.relationship || "",
                                  is_suspended: member.is_suspended || false,
                                  suspended_until: member.suspended_until || "",
                                  sleep_time_start: member.sleep_time_start || "",
                                  sleep_time_end: member.sleep_time_end || "",
                                  allowed_access_start: member.allowed_access_start || "06:00",
                                  allowed_access_end: member.allowed_access_end || "22:00",
                                  monthly_spending_limit: member.monthly_spending_limit || 0,
                                  enforce_sleep_time: member.enforce_sleep_time || false,
                                  enforce_access_window: member.enforce_access_window || false,
                                  max_daily_watch_time: member.max_daily_watch_time || 120,
                                  content_restrictions: member.content_restrictions || {
                                    max_age_rating: "PG",
                                    blocked_categories: []
                                  }
                                });
                                setShowSettingsModal(true);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Settings className="h-3 w-3 mr-2" />
                              Settings
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowDetailsModal(true);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-3 w-3 mr-2" />
                              Details
                            </button>
                            {!member.is_suspended ? (
                              <button
                                onClick={() => {
                                  suspendMember(member.id, true);
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-3 py-2 text-xs text-[#8A7A4B] dark:text-[#FFF4B3] hover:bg-[#FFF4D0] dark:hover:bg-[#8A7A4B]/20"
                              >
                                <Ban className="h-3 w-3 mr-2" />
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  suspendMember(member.id, false);
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-3 py-2 text-xs text-[#4B8A4B] dark:text-[#B3FFB3] hover:bg-[#D0E6D0] dark:hover:bg-[#4B8A4B]/20"
                              >
                                <Unlock className="h-3 w-3 mr-2" />
                                Restore
                              </button>
                            )}
                            <button
                              onClick={() => {
                                terminateSessions(member.id);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-[#4B4B8A] dark:text-[#B3B3FF] hover:bg-[#D0D0FF] dark:hover:bg-[#4B4B8A]/20"
                            >
                              <LogOut className="h-3 w-3 mr-2" />
                              Terminate Sessions
                            </button>
                            <button
                              onClick={() => {
                                removeFamilyMember(member.id, member.user_email);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-[#8A4B4B] dark:text-[#FFB3B3] hover:bg-[#FFE6E6] dark:hover:bg-[#8A4B4B]/20"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredFamilyMembers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium">No family members found</p>
              <p className="text-xs mt-1">
                {familyMembers.length === 0 
                  ? "Start by adding family members" 
                  : "Try changing your search"}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 inline-flex items-center px-3 py-1.5 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-xs"
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add First Member
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFamilyMembers.map((member) => (
                <div key={member.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                          }
                        }}
                        className="h-4 w-4 text-[#BC8BBC] focus:ring-[#BC8BBC] border-gray-300 rounded mt-1 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-full bg-[#E6D0E6] flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-[#8A4B8A]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {member.user_email}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.member_role)}`}>
                                {member.member_role}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member)}`}>
                                {getStatusBadge(member)}
                              </span>
                              {member.active_sessions > 0 && (
                                <div className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                  Online
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <div className="truncate">{member.dashboard_type} • {member.relationship || "No relation"}</div>
                          <div>Joined: {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Not joined"}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => fetchMemberSessions(member.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Sessions"
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            const menus = document.querySelectorAll('.action-menu');
                            menus.forEach(menu => menu.classList.add('hidden'));
                            e.currentTarget.nextElementSibling.classList.toggle('hidden');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="action-menu hidden absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowDetailsModal(true);
                              document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                            }}
                            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </button>
                          <button
                            onClick={() => fetchPinSecurity(member.id)}
                            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Key className="h-3 w-3 mr-2" />
                            PIN Security
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setMemberSettings({
                                dashboard_type: member.dashboard_type || "normal",
                                member_role: member.member_role || "child",
                                relationship: member.relationship || "",
                                is_suspended: member.is_suspended || false,
                                suspended_until: member.suspended_until || "",
                                sleep_time_start: member.sleep_time_start || "",
                                sleep_time_end: member.sleep_time_end || "",
                                allowed_access_start: member.allowed_access_start || "06:00",
                                allowed_access_end: member.allowed_access_end || "22:00",
                                monthly_spending_limit: member.monthly_spending_limit || 0,
                                enforce_sleep_time: member.enforce_sleep_time || false,
                                enforce_access_window: member.enforce_access_window || false,
                                max_daily_watch_time: member.max_daily_watch_time || 120,
                                content_restrictions: member.content_restrictions || {
                                  max_age_rating: "PG",
                                  blocked_categories: []
                                }
                              });
                              setShowSettingsModal(true);
                              document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                            }}
                            className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Settings className="h-3 w-3 mr-2" />
                            Settings
                          </button>
                          {!member.is_suspended ? (
                            <button
                              onClick={() => {
                                suspendMember(member.id, true);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-[#8A7A4B] dark:text-[#FFF4B3] hover:bg-[#FFF4D0] dark:hover:bg-[#8A7A4B]/20"
                            >
                              <Ban className="h-3 w-3 mr-2" />
                              Suspend Access
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                suspendMember(member.id, false);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-[#4B8A4B] dark:text-[#B3FFB3] hover:bg-[#D0E6D0] dark:hover:bg-[#4B8A4B]/20"
                            >
                              <Unlock className="h-3 w-3 mr-2" />
                              Restore Access
                            </button>
                          )}
                          <button
                            onClick={() => removeFamilyMember(member.id, member.user_email)}
                            className="flex items-center w-full px-3 py-2 text-xs text-[#8A4B4B] dark:text-[#FFB3B3] hover:bg-[#FFE6E6] dark:hover:bg-[#8A4B4B]/20"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Remove Member
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal - Mobile optimized */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-4 sm:my-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Family Member</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    placeholder="family.member@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                  >
                    <option value="child">Child</option>
                    <option value="teen">Teen</option>
                    <option value="parent">Parent</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relationship (Optional)
                  </label>
                  <input
                    type="text"
                    value={newMember.relationship}
                    onChange={(e) => setNewMember({...newMember, relationship: e.target.value})}
                    placeholder="e.g., Son, Daughter, Spouse"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dashboard Type
                  </label>
                  <select
                    value={newMember.dashboardType}
                    onChange={(e) => setNewMember({...newMember, dashboardType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                  >
                    <option value="normal">Normal Dashboard</option>
                    <option value="kid">Kid-Friendly Dashboard</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={addFamilyMember}
                  className="px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 flex items-center justify-center text-sm order-1 sm:order-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Mobile optimized */}
      {showSettingsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-4 sm:my-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">Settings for {selectedMember.user_email}</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded p-1 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Basic Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select
                          value={memberSettings.member_role}
                          onChange={(e) => setMemberSettings({...memberSettings, member_role: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                        >
                          <option value="child">Child</option>
                          <option value="teen">Teen</option>
                          <option value="parent">Parent</option>
                          <option value="guest">Guest</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={memberSettings.relationship}
                          onChange={(e) => setMemberSettings({...memberSettings, relationship: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dashboard Type</label>
                        <select
                          value={memberSettings.dashboard_type}
                          onChange={(e) => setMemberSettings({...memberSettings, dashboard_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="kid">Kid-Friendly</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Content Restrictions */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Content Restrictions</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Age Rating</label>
                        <select
                          value={memberSettings.content_restrictions?.max_age_rating || "PG"}
                          onChange={(e) => setMemberSettings({
                            ...memberSettings,
                            content_restrictions: {
                              ...memberSettings.content_restrictions,
                              max_age_rating: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                        >
                          <option value="G">G - General Audiences</option>
                          <option value="PG">PG - Parental Guidance</option>
                          <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                          <option value="R">R - Restricted</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Daily Watch Time (minutes)</label>
                        <input
                          type="number"
                          value={memberSettings.max_daily_watch_time}
                          onChange={(e) => setMemberSettings({...memberSettings, max_daily_watch_time: parseInt(e.target.value) || 120})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Controls */}
                <div className="space-y-4">
                  {/* Time Restrictions */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Time Restrictions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Enforce Sleep Time</label>
                        <button
                          onClick={() => setMemberSettings({...memberSettings, enforce_sleep_time: !memberSettings.enforce_sleep_time})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${memberSettings.enforce_sleep_time ? 'bg-[#BC8BBC]' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${memberSettings.enforce_sleep_time ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {memberSettings.enforce_sleep_time && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sleep Start</label>
                            <input
                              type="time"
                              value={memberSettings.sleep_time_start}
                              onChange={(e) => setMemberSettings({...memberSettings, sleep_time_start: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sleep End</label>
                            <input
                              type="time"
                              value={memberSettings.sleep_time_end}
                              onChange={(e) => setMemberSettings({...memberSettings, sleep_time_end: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Access Window */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Access Window</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Enforce Access Window</label>
                        <button
                          onClick={() => setMemberSettings({...memberSettings, enforce_access_window: !memberSettings.enforce_access_window})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${memberSettings.enforce_access_window ? 'bg-[#BC8BBC]' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${memberSettings.enforce_access_window ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      {memberSettings.enforce_access_window && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={memberSettings.allowed_access_start}
                              onChange={(e) => setMemberSettings({...memberSettings, allowed_access_start: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                            <input
                              type="time"
                              value={memberSettings.allowed_access_end}
                              onChange={(e) => setMemberSettings({...memberSettings, allowed_access_end: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spending Limit */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Spending Limit</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Spending Limit ($)</label>
                        <input
                          type="number"
                          value={memberSettings.monthly_spending_limit}
                          onChange={(e) => setMemberSettings({...memberSettings, monthly_spending_limit: parseFloat(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMemberSettings(selectedMember.id)}
                  disabled={savingSettings}
                  className="px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 flex items-center justify-center text-sm disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal - Mobile optimized */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-4 sm:my-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#E6D0E6] flex items-center justify-center mr-3 flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#8A4B8A]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{selectedMember.user_email}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm truncate">Family Member Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded p-1 ml-2 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                      <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Member Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedMember.member_role)}`}>
                          {selectedMember.member_role}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Relationship</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{selectedMember.relationship || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard Type</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white capitalize">{selectedMember.dashboard_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Activity Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMember)}`}>
                          {getStatusBadge(selectedMember)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Active Sessions</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{selectedMember.active_sessions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {selectedMember.last_login ? new Date(selectedMember.last_login).toLocaleString() : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Time Restrictions
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Sleep Time</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {selectedMember.sleep_time_start ? formatTime(selectedMember.sleep_time_start) : "Not set"} - {selectedMember.sleep_time_end ? formatTime(selectedMember.sleep_time_end) : "Not set"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Enforce Sleep Time</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{selectedMember.enforce_sleep_time ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Access Window</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {selectedMember.allowed_access_start ? formatTime(selectedMember.allowed_access_start) : "Not set"} - {selectedMember.allowed_access_end ? formatTime(selectedMember.allowed_access_end) : "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Financial Controls
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Spending Limit</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">${selectedMember.monthly_spending_limit || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Joined Date</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {selectedMember.joined_at ? new Date(selectedMember.joined_at).toLocaleDateString() : "Not joined"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal - Mobile optimized */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl my-4 sm:my-0">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Active Sessions</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => terminateSessions(selectedMember?.id)}
                    className="px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs sm:text-sm hover:bg-red-200 dark:hover:bg-red-800 whitespace-nowrap"
                  >
                    Terminate All
                  </button>
                  <button
                    onClick={() => setShowSessionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Time</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedMemberSessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <Monitor className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm">No active sessions found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      selectedMemberSessions.map((session, index) => (
                        <tr key={session.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              <div className="mr-2">
                                {getDeviceIcon(session.device_type)}
                              </div>
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-none">{session.device_name || 'Unknown Device'}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{session.device_type || 'Unknown'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs sm:text-sm text-gray-900 dark:text-white">{session.ip_address || 'Unknown'}</td>
                          <td className="px-3 py-3 text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[80px] sm:max-w-none">{session.location || 'Unknown'}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                            {session.login_time ? new Date(session.login_time).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              session.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            }`}>
                              {session.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {session.is_active && (
                              <button
                                onClick={() => terminateSessions(selectedMember?.id, session.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs sm:text-sm whitespace-nowrap"
                              >
                                Terminate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Security Modal - Mobile optimized */}
      {showPinSecurityModal && pinSecurityData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-4 sm:my-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">PIN Security</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{pinSecurityData.member?.email}</p>
                </div>
                <button
                  onClick={() => setShowPinSecurityModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded p-1 ml-2 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {pinSecurityData.pin_security ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
                      <Key className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Security Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">PIN Locked</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pinSecurityData.pin_security.is_pin_locked 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {pinSecurityData.pin_security.is_pin_locked ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Failed Attempts</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">{pinSecurityData.pin_security.pin_attempts || 0} / {pinSecurityData.pin_security.max_pin_attempts || 5}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Last PIN Attempt</span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                          {pinSecurityData.pin_security.last_pin_attempt 
                            ? new Date(pinSecurityData.pin_security.last_pin_attempt).toLocaleString() 
                            : 'Never'
                          }
                        </span>
                      </div>
                      {pinSecurityData.pin_security.pin_locked_until && (
                        <div className="flex justify-between">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Locked Until</span>
                          <span className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                            {new Date(pinSecurityData.pin_security.pin_locked_until).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => resetMemberPin(pinSecurityData.member?.id)}
                      className="px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm"
                    >
                      Reset PIN Security
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Key className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">No PIN security configuration found</p>
                  <button
                    onClick={() => resetMemberPin(pinSecurityData.member?.id)}
                    className="mt-4 px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors text-sm"
                  >
                    Initialize PIN Security
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal - Mobile optimized */}
      {showAnalyticsModal && analyticsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl my-4 sm:my-0">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Family Usage Analytics</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={analyticsPeriod}
                    onChange={(e) => {
                      setAnalyticsPeriod(e.target.value);
                      fetchAnalytics(e.target.value);
                    }}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-auto"
                  >
                    <option value="day">Last 24 Hours</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last 365 Days</option>
                  </select>
                  <button
                    onClick={() => setShowAnalyticsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Totals Card - Responsive */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Usage Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{analyticsData.totals?.total_members || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Members</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{analyticsData.totals?.total_sessions || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{analyticsData.totals?.active_sessions || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Active Sessions</div>
                  </div>
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{analyticsData.totals?.total_watch_minutes || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Watch Time (min)</div>
                  </div>
                </div>
              </div>

              {/* Analytics Table - Responsive */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sessions</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Watch Time</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analyticsData.analytics?.map((analytic, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-3">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-none">{analytic.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(analytic.member_role)}`}>
                            {analytic.member_role}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs sm:text-sm text-gray-900 dark:text-white">{analytic.total_sessions || 0} sessions</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{analytic.active_sessions || 0} active</div>
                        </td>
                        <td className="px-3 py-3 text-xs sm:text-sm text-gray-900 dark:text-white">{analytic.total_watch_minutes || 0} minutes</td>
                        <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {analytic.last_login ? new Date(analytic.last_login).toLocaleString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-4 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}