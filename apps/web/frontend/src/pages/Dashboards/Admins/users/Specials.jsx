import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  User,
  Calendar,
  Clock,
  Shield,
  Users,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  BarChart3,
  TrendingUp,
  Activity,
  Timer,
  Baby,
  Baby as Child,
  UserCog,
  Lock,
  Unlock,
  Plus,
  Save,
  X,
  Smartphone,
  Tablet,
  Tv,
  Monitor,
  ChevronDown,
  Info,
  Menu as MenuIcon,
  X as CloseIcon,
  ArrowLeft,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import api from "../../../../api/axios";

export default function Specials() {
  const [loading, setLoading] = useState(true);
  const [kidProfiles, setKidProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    ageRange: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byAgeGroup: {},
  });
  const [selectedKid, setSelectedKid] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [viewingHistory, setViewingHistory] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [apiError, setApiError] = useState("");
  const [kidSettings, setKidSettings] = useState({
    name: "",
    birth_date: "",
    theme_color: "#BC8BBC",
    max_content_age_rating: "PG",
    daily_time_limit_minutes: 120,
    bedtime_start: "",
    bedtime_end: "",
    require_pin_to_exit: false,
    is_active: true
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Fetch kid profiles data
  useEffect(() => {
    fetchKidProfiles();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchKidProfiles = async () => {
    try {
      setLoading(true);
      setApiError("");
      
      const response = await api.get('/user/kids/profiles');
      
      if (response.data.success) {
        setKidProfiles(response.data.profiles || []);
        
        // Calculate stats
        const profiles = response.data.profiles || [];
        const statsData = {
          total: profiles.length || 0,
          active: profiles.filter(kid => kid.is_active)?.length || 0,
          byAgeGroup: calculateAgeGroups(profiles)
        };
        setStats(statsData);
        showToast("Kid profiles loaded successfully");
      } else {
        setApiError(response.data.message || "Failed to load profiles");
        showToast(response.data.message || "Failed to load profiles", "error");
      }
    } catch (error) {
      console.error("Error fetching kid profiles:", error);
      setApiError(error.response?.data?.message || error.message || "Network error");
      showToast(error.response?.data?.message || error.message || "Network error", "error");
      setKidProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAgeGroups = (profiles) => {
    const ageGroups = {
      '0-3': 0,
      '4-6': 0,
      '7-9': 0,
      '10-12': 0,
      '13+': 0
    };
    
    profiles.forEach(kid => {
      const age = kid.calculated_age || calculateAge(kid.birth_date) || 0;
      if (age <= 3) ageGroups['0-3']++;
      else if (age <= 6) ageGroups['4-6']++;
      else if (age <= 9) ageGroups['7-9']++;
      else if (age <= 12) ageGroups['10-12']++;
      else ageGroups['13+']++;
    });
    
    return ageGroups;
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return 0;
    }
  };

  const fetchViewingHistory = async (kidId) => {
    try {
      const response = await api.get(`/user/kids/${kidId}/viewing-history`);
      
      if (response.data.success) {
        setViewingHistory(response.data.history || []);
        setShowHistoryModal(true);
        showToast("Viewing history loaded");
      } else {
        showToast(response.data.message || "No viewing history found", "error");
      }
    } catch (error) {
      console.error("Error fetching viewing history:", error);
      showToast(error.response?.data?.message || "Error loading viewing history", "error");
    }
  };

  const fetchKidAnalytics = async () => {
    try {
      const response = await api.get('/user/kids/analytics');
      if (response.data.success) {
        setAnalyticsData(response.data);
        setShowAnalyticsModal(true);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      showToast(error.response?.data?.message || "Error loading analytics", "error");
    }
  };

  const deleteKidProfile = async (kidId, kidName) => {
    if (!window.confirm(`Are you sure you want to delete ${kidName}'s profile?`)) {
      return;
    }

    try {
      const response = await api.delete(`/user/kids/${kidId}`);
      
      if (response.data.success) {
        showToast("Kid profile deleted successfully");
        fetchKidProfiles(); // Refresh
      } else {
        showToast(response.data.message || "Failed to delete", "error");
      }
    } catch (error) {
      console.error("Error deleting kid profile:", error);
      showToast(error.response?.data?.message || "Error deleting profile", "error");
    }
  };

  const updateKidProfile = async (kidId) => {
    try {
      setSavingSettings(true);
      const response = await api.put(`/user/kids/${kidId}/settings`, kidSettings);
      
      if (response.data.success) {
        showToast("Kid profile updated successfully");
        setShowEditModal(false);
        fetchKidProfiles();
      } else {
        showToast(response.data.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Error updating kid profile:", error);
      showToast(error.response?.data?.message || "Error updating profile", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const exportToCSV = () => {
    if (filteredKidProfiles.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = ["ID", "Name", "Age", "Parent Email", "Max Age Rating", "Daily Limit", "Status", "Total Watch Time", "Created At"];
    const csvData = filteredKidProfiles.map(kid => [
      kid.id || '',
      kid.name || '',
      kid.calculated_age || calculateAge(kid.birth_date) || 0,
      kid.parent_email || '',
      kid.max_content_age_rating || 'N/A',
      `${kid.daily_time_limit_minutes || 0} mins`,
      kid.is_active ? "Active" : "Inactive",
      `${kid.total_watch_time_minutes || 0} mins`,
      kid.created_at ? new Date(kid.created_at).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kid-profiles-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast("CSV exported successfully");
  };

  const getAgeColor = (age) => {
    if (age <= 3) return "bg-[#E6D0E6] text-[#8A4B8A] border border-[#8A4B8A]";
    if (age <= 6) return "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]";
    if (age <= 9) return "bg-[#FFF4D0] text-[#8A7A4B] border border-[#8A7A4B]";
    if (age <= 12) return "bg-[#FFE6D0] text-[#8A5A4B] border border-[#8A5A4B]";
    return "bg-[#FFD0D0] text-[#8A4B4B] border border-[#8A4B4B]";
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]" 
      : "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-900 dark:text-gray-300";
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

  const filteredKidProfiles = kidProfiles.filter(kid => {
    const matchesSearch = searchTerm === "" || 
      (kid.name && kid.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (kid.parent_email && kid.parent_email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filters.status === "all" || 
      (filters.status === "active" && kid.is_active) ||
      (filters.status === "inactive" && !kid.is_active);
    
    const age = kid.calculated_age || calculateAge(kid.birth_date) || 0;
    const matchesAge = filters.ageRange === "all" || 
      (filters.ageRange === "0-3" && age <= 3) ||
      (filters.ageRange === "4-6" && age >= 4 && age <= 6) ||
      (filters.ageRange === "7-9" && age >= 7 && age <= 9) ||
      (filters.ageRange === "10-12" && age >= 10 && age <= 12) ||
      (filters.ageRange === "13+" && age >= 13);
    
    return matchesSearch && matchesStatus && matchesAge;
  });

  // Mobile responsive breakpoints
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#BC8BBC] mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading kid profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 md:px-6 md:py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-[90vw] ${
          toast.type === "success" 
            ? "bg-[#D0E6D0] text-[#4B8A4B] border border-[#4B8A4B]" 
            : "bg-[#FFD0D0] text-[#8A4B4B] border border-[#8A4B4B]"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          )}
          <span className="text-sm md:text-base truncate">{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="ml-2 hover:opacity-80 flex-shrink-0"
          >
            <XCircle className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Kid Profiles Management
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden md:block">
              Manage and monitor kid profiles and their activities
            </p>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              {viewMode === "grid" ? <MenuIcon className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              {mobileFiltersOpen ? <CloseIcon className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchKidAnalytics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base w-full md:w-auto justify-center"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={exportToCSV}
            disabled={kidProfiles.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base w-full md:w-auto justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setKidSettings({
                name: "",
                birth_date: "",
                theme_color: "#BC8BBC",
                max_content_age_rating: "PG",
                daily_time_limit_minutes: 120,
                bedtime_start: "",
                bedtime_end: "",
                require_pin_to_exit: false,
                is_active: true
              });
              setSelectedKid(null);
              setShowEditModal(true);
            }}
            className="inline-flex items-center px-3 py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm md:text-base w-full md:w-auto justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Kid Profile
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Profiles</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-[#E6D0E6] rounded-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-[#8A4B8A]" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Active Now</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="p-2 bg-[#D0E6D0] rounded-lg">
              <User className="h-5 w-5 md:h-6 md:w-6 text-[#4B8A4B]" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Avg Watch Time</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {kidProfiles.length > 0 
                  ? Math.round(kidProfiles.reduce((sum, kid) => sum + (kid.total_watch_time_minutes || 0), 0) / kidProfiles.length)
                  : 0} min
              </p>
            </div>
            <div className="p-2 bg-[#E6D0FF] rounded-lg">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-[#8A4BC8]" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Most Common Age</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {Object.entries(stats.byAgeGroup).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
            <div className="p-2 bg-[#FFE6D0] rounded-lg">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-[#8A5A4B]" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {mobileFiltersOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h3>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Age Range</label>
              <select
                value={filters.ageRange}
                onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm"
              >
                <option value="all">All Ages</option>
                <option value="0-3">0-3 years</option>
                <option value="4-6">4-6 years</option>
                <option value="7-9">7-9 years</option>
                <option value="10-12">10-12 years</option>
                <option value="13+">13+ years</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by kid name or parent email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              value={filters.ageRange}
              onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <option value="all">All Ages</option>
              <option value="0-3">0-3 years</option>
              <option value="4-6">4-6 years</option>
              <option value="7-9">7-9 years</option>
              <option value="10-12">10-12 years</option>
              <option value="13+">13+ years</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({status: "all", ageRange: "all"});
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Kid Profiles - Mobile Grid View */}
      {viewMode === "grid" && (isMobile || isTablet) && (
        <div className="md:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredKidProfiles.length === 0 ? (
              <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No kid profiles found</p>
              </div>
            ) : (
              filteredKidProfiles.map((kid) => {
                const age = kid.calculated_age || calculateAge(kid.birth_date) || 0;
                return (
                  <div key={kid.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                          style={{ backgroundColor: kid.theme_color || '#E6D0E6' }}
                        >
                          {age <= 3 ? (
                            <Baby className="h-4 w-4 text-white" />
                          ) : age <= 9 ? (
                            <Child className="h-4 w-4 text-white" />
                          ) : (
                            <User className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{kid.name || 'Unnamed'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Age: {age}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => fetchViewingHistory(kid.id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="History"
                        >
                          <Clock className="h-3 w-3" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const menus = document.querySelectorAll('.action-menu');
                              menus.forEach(menu => menu.classList.add('hidden'));
                              e.currentTarget.nextElementSibling.classList.toggle('hidden');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </button>
                          <div className="action-menu hidden absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <button
                              onClick={() => {
                                setSelectedKid(kid);
                                setShowDetailsModal(true);
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setSelectedKid(kid);
                                setKidSettings({
                                  name: kid.name || "",
                                  birth_date: kid.birth_date || "",
                                  theme_color: kid.theme_color || "#BC8BBC",
                                  max_content_age_rating: kid.max_content_age_rating || "PG",
                                  daily_time_limit_minutes: kid.daily_time_limit_minutes || 120,
                                  bedtime_start: kid.bedtime_start || "",
                                  bedtime_end: kid.bedtime_end || "",
                                  require_pin_to_exit: kid.require_pin_to_exit || false,
                                  is_active: kid.is_active || true
                                });
                                setShowEditModal(true);
                              }}
                              className="flex items-center w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteKidProfile(kid.id, kid.name)}
                              className="flex items-center w-full px-3 py-2 text-xs text-[#8A4B4B] dark:text-[#FFB3B3] hover:bg-[#FFE6E6] dark:hover:bg-[#8A4B4B]/20"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Parent:</span>
                        <span className="text-gray-900 dark:text-white truncate ml-2">{kid.parent_email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Watch Time:</span>
                        <span className="text-gray-900 dark:text-white">{kid.total_watch_time_minutes || 0}m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(kid.is_active)}`}>
                          {kid.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Kid Profiles Table (Desktop/Tablet) */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kid Profile</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Restrictions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Watch Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredKidProfiles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-lg font-medium">No kid profiles found</p>
                      <p className="text-sm mt-1">
                        {kidProfiles.length === 0 
                          ? "No kid profiles in the system yet" 
                          : "Try changing your search or filters"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredKidProfiles.map((kid) => {
                  const age = kid.calculated_age || calculateAge(kid.birth_date) || 0;
                  return (
                    <tr key={kid.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: kid.theme_color || '#E6D0E6' }}
                          >
                            {age <= 3 ? (
                              <Baby className="h-5 w-5 text-white" />
                            ) : age <= 9 ? (
                              <Child className="h-5 w-5 text-white" />
                            ) : (
                              <User className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{kid.name || 'Unnamed'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">ID: {kid.id || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgeColor(age)}`}>
                          {age} years
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{kid.parent_name || kid.parent_email || "Parent"}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{kid.parent_email || "No email"}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Shield className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-900 dark:text-white">Max: {kid.max_content_age_rating || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-900 dark:text-white">Daily: {kid.daily_time_limit_minutes || 0} mins</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{kid.total_watch_time_minutes || 0} mins</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {kid.total_viewing_sessions || 0} sessions
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kid.is_active)}`}>
                          {kid.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {kid.created_at ? new Date(kid.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => fetchViewingHistory(kid.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] rounded"
                            title="View History"
                          >
                            <Clock className="h-4 w-4" />
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
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            <div className="action-menu hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <button
                                onClick={() => {
                                  setSelectedKid(kid);
                                  setShowDetailsModal(true);
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedKid(kid);
                                  setKidSettings({
                                    name: kid.name || "",
                                    birth_date: kid.birth_date || "",
                                    theme_color: kid.theme_color || "#BC8BBC",
                                    max_content_age_rating: kid.max_content_age_rating || "PG",
                                    daily_time_limit_minutes: kid.daily_time_limit_minutes || 120,
                                    bedtime_start: kid.bedtime_start || "",
                                    bedtime_end: kid.bedtime_end || "",
                                    require_pin_to_exit: kid.require_pin_to_exit || false,
                                    is_active: kid.is_active || true
                                  });
                                  setShowEditModal(true);
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                              </button>
                              <button
                                onClick={() => {
                                  deleteKidProfile(kid.id, kid.name);
                                  document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-[#8A4B4B] dark:text-[#FFB3B3] hover:bg-[#FFE6E6] dark:hover:bg-[#8A4B4B]/20"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Profile
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (responsive) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                  {selectedKid ? 'Edit Kid Profile' : 'Create New Kid Profile'}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900 dark:text-white">Basic Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={kidSettings.name}
                          onChange={(e) => setKidSettings({...kidSettings, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base"
                          placeholder="Enter kid's name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Birth Date *
                        </label>
                        <input
                          type="date"
                          value={kidSettings.birth_date}
                          onChange={(e) => setKidSettings({...kidSettings, birth_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900 dark:text-white">Content Restrictions</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Max Age Rating
                        </label>
                        <select
                          value={kidSettings.max_content_age_rating}
                          onChange={(e) => setKidSettings({...kidSettings, max_content_age_rating: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base"
                        >
                          <option value="G">G - General Audiences</option>
                          <option value="PG">PG - Parental Guidance</option>
                          <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                          <option value="R">R - Restricted</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Daily Time Limit (minutes)
                        </label>
                        <input
                          type="number"
                          value={kidSettings.daily_time_limit_minutes}
                          onChange={(e) => setKidSettings({...kidSettings, daily_time_limit_minutes: parseInt(e.target.value) || 120})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedKid) {
                      updateKidProfile(selectedKid.id);
                    } else {
                      showToast("Create feature coming soon", "info");
                    }
                  }}
                  disabled={savingSettings || !kidSettings.name || !kidSettings.birth_date}
                  className="px-3 py-2 md:px-4 md:py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 flex items-center disabled:opacity-50 text-sm md:text-base"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {selectedKid ? 'Save Changes' : 'Create Profile'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewing History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl md:max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Viewing History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {viewingHistory.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Play className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">No viewing history found</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">This kid hasn't watched any content yet.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 md:mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {viewingHistory.length}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {Math.round(viewingHistory.reduce((sum, session) => sum + (session.watch_duration_seconds || 0), 0) / 60)}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                          {Math.round(viewingHistory.reduce((sum, session) => sum + (session.percentage_watched || 0), 0) / viewingHistory.length)}%
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Avg Completion</div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</th>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {viewingHistory.slice(0, 10).map((session, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-3 py-2 md:px-4 md:py-3">
                              <div className="flex items-center">
                                <div className="mr-2 md:mr-3">
                                  {getDeviceIcon(session.device_type)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{session.content_title || "Unknown Content"}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{session.content_type || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 md:px-4 md:py-3">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {Math.round((session.watch_duration_seconds || 0) / 60)} min
                              </div>
                              <div className="flex items-center mt-1">
                                <div className="w-16 md:w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-[#BC8BBC] h-2 rounded-full" 
                                    style={{ width: `${session.percentage_watched || 0}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-xs text-gray-900 dark:text-white">{session.percentage_watched || 0}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                              {session.started_at ? new Date(session.started_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              <div className="mt-4 md:mt-6 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-3 py-2 md:px-4 md:py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm md:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && analyticsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl md:max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Kid Profiles Analytics</h3>
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Age Distribution */}
              <div className="mb-6 md:mb-8">
                <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">Age Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                  {Object.entries(stats.byAgeGroup).map(([ageGroup, count]) => (
                    <div key={ageGroup} className="bg-white dark:bg-gray-700 rounded-lg p-3 md:p-4 shadow border border-gray-200 dark:border-gray-600">
                      <div className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white text-center">{count}</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">{ageGroup} years</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Statistics */}
              <div className="mb-6 md:mb-8">
                <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900 dark:text-white">Usage Statistics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Watch Time</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                          {kidProfiles.reduce((sum, kid) => sum + (kid.total_watch_time_minutes || 0), 0)} minutes
                        </p>
                      </div>
                      <Clock className="h-6 w-6 md:h-8 md:w-8 text-[#BC8BBC]" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Avg Daily Usage</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                          {kidProfiles.length > 0 
                            ? Math.round(kidProfiles.reduce((sum, kid) => sum + (kid.total_watch_time_minutes || 0), 0) / kidProfiles.length)
                            : 0} mins
                        </p>
                      </div>
                      <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-[#BC8BBC]" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <div>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Active Profiles</p>
                        <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{stats.active} / {stats.total}</p>
                      </div>
                      <Activity className="h-6 w-6 md:h-8 md:w-8 text-[#BC8BBC]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-3 py-2 md:px-4 md:py-2 bg-[#BC8BBC] hover:bg-[#A87BA8] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2 text-sm md:text-base"
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

// Grid icon component
const Grid = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);