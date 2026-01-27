// components/admin/subscriptions/FreePlansManagement.jsx
import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Gift, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Play, 
  Pause, 
  Eye,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Plus,
  BarChart3,
  TrendingUp,
  UserPlus,
  CalendarDays,
  UserCheck,
  Zap,
  Timer,
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  Gamepad,
  X,
  Globe,
  Target,
  Award,
  Shield,
  AlertTriangle,
  ExternalLink,
  Download,
  FileText,
  Clock3
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../../api/axios";

const FreePlansManagement = () => {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [activations, setActivations] = useState([]);
  const [stats, setStats] = useState({
    total_schedules: 0,
    active_schedules: 0,
    total_activations: 0,
    active_activations: 0,
    unique_users: 0,
    unique_plans: 0
  });
  
  const [activeTab, setActiveTab] = useState("schedules");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [viewingSchedule, setViewingSchedule] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [isTestingEligibility, setIsTestingEligibility] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // New schedule form
  const [newSchedule, setNewSchedule] = useState({
    schedule_name: "",
    description: "",
    schedule_type: "public_offer",
    target_plan_id: "",
    target_user_type: "eligible_users",
    target_user_ids: [],
    user_segment_criteria: {
      min_account_age_days: null,
      min_watch_time_minutes: null,
      require_email_verification: true,
      require_phone_verification: false,
      allowed_account_tiers: ["free", "basic"]
    },
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    plan_duration_days: 7,
    is_trial: true,
    auto_upgrade_to_paid: false,
    upgrade_plan_id: "",
    max_activations: "",
    allowed_devices: ["mobile", "tablet", "desktop", "smarttv"],
    allowed_regions: [],
    blocked_countries: [],
    terms_and_conditions: "",
    redemption_instructions: "Click the 'Activate Offer' button to claim your free plan."
  });

  // Manual assignment form
  const [assignmentData, setAssignmentData] = useState({
    plan_id: "",
    duration_days: 7,
    is_trial: true,
    activation_reason: "manual_activation"
  });

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    loadAvailablePlans();
  }, [activeTab, currentPage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === "schedules") {
        const response = await api.get(`/admin/subscriptions/free-plans/schedules?page=${currentPage}&limit=${itemsPerPage}`);
        if (response.data.success) {
          setSchedules(response.data.data || []);
          setTotalPages(response.data.pagination?.pages || 1);
          setTotalItems(response.data.pagination?.total || 0);
        }
      } else if (activeTab === "activations") {
        const response = await api.get(`/admin/subscriptions/free-plans/activations?page=${currentPage}&limit=${itemsPerPage}`);
        if (response.data.success) {
          setActivations(response.data.data || []);
          setTotalPages(response.data.pagination?.pages || 1);
          setTotalItems(response.data.pagination?.total || 0);
        }
      }

      const statsResponse = await api.get('/admin/subscriptions/free-plans/dashboard/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data.overall || {});
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      alert('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      const response = await api.get('/admin/subscriptions/free-plans/plans/available');
      if (response.data.success) {
        setAvailablePlans(response.data.data || []);
        if (response.data.data.length > 0 && !assignmentData.plan_id) {
          setAssignmentData(prev => ({ ...prev, plan_id: response.data.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error loading available plans:', error);
    }
  };

  const handleSearchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/admin/subscriptions/free-plans/users/search?search=${searchQuery}&limit=10`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await api.post('/admin/subscriptions/free-plans/schedules', newSchedule);
      if (response.data.success) {
        alert('Free plan offer created successfully!');
        setShowScheduleModal(false);
        setNewSchedule({
          schedule_name: "",
          description: "",
          schedule_type: "public_offer",
          target_plan_id: "",
          target_user_type: "eligible_users",
          target_user_ids: [],
          user_segment_criteria: {
            min_account_age_days: null,
            min_watch_time_minutes: null,
            require_email_verification: true,
            require_phone_verification: false,
            allowed_account_tiers: ["free", "basic"]
          },
          start_date: new Date().toISOString().slice(0, 16),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          plan_duration_days: 7,
          is_trial: true,
          auto_upgrade_to_paid: false,
          upgrade_plan_id: "",
          max_activations: "",
          allowed_devices: ["mobile", "tablet", "desktop", "smarttv"],
          allowed_regions: [],
          blocked_countries: [],
          terms_and_conditions: "",
          redemption_instructions: "Click the 'Activate Offer' button to claim your free plan."
        });
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert(error.response?.data?.message || 'Failed to create free plan offer');
    }
  };

  const handleManualActivation = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (!assignmentData.plan_id) {
      alert('Please select a plan');
      return;
    }

    try {
      const response = await api.post('/admin/subscriptions/free-plans/activations/manual', {
        ...assignmentData,
        user_ids: selectedUsers.map(u => u.id),
        schedule_id: null
      });

      if (response.data.success) {
        alert(`Free plans activated successfully! ${response.data.data.successful.length} successful, ${response.data.data.failed.length} failed`);
        setShowAssignModal(false);
        setSelectedUsers([]);
        setSearchQuery("");
        setSearchResults([]);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error activating free plans:', error);
      alert(error.response?.data?.message || 'Failed to activate free plans');
    }
  };

  const handleToggleSchedule = async (scheduleId, action) => {
    try {
      const response = await api.post(`/admin/subscriptions/free-plans/schedules/${scheduleId}/toggle`, { action });
      if (response.data.success) {
        alert(`Schedule ${action}d successfully!`);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
      alert(error.response?.data?.message || 'Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule? This will permanently remove the free plan offer.')) {
      try {
        const response = await api.delete(`/admin/subscriptions/free-plans/schedules/${scheduleId}`);
        if (response.data.success) {
          alert('Schedule deleted successfully!');
          loadDashboardData();
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert(error.response?.data?.message || 'Failed to delete schedule');
      }
    }
  };

  const handleViewSchedule = async (schedule) => {
    try {
      const response = await api.get(`/admin/subscriptions/free-plans/schedules/${schedule.id}`);
      if (response.data.success) {
        setViewingSchedule(response.data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error viewing schedule:', error);
      alert('Failed to load schedule details');
    }
  };

  const handleTestEligibility = async (scheduleId) => {
    setIsTestingEligibility(true);
    try {
      const response = await api.get(`/admin/subscriptions/free-plans/schedules/${scheduleId}/test-eligibility`);
      if (response.data.success) {
        setEligibilityResult(response.data);
        setShowEligibilityModal(true);
      }
    } catch (error) {
      console.error('Error testing eligibility:', error);
      alert(error.response?.data?.message || 'Failed to test eligibility');
    } finally {
      setIsTestingEligibility(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeRemaining = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours}h`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'Less than an hour';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { color: 'bg-green-900 text-green-200', icon: <CheckCircle size={12} /> },
      'paused': { color: 'bg-yellow-900 text-yellow-200', icon: <Pause size={12} /> },
      'scheduled': { color: 'bg-blue-900 text-blue-200', icon: <Calendar size={12} /> },
      'completed': { color: 'bg-gray-700 text-gray-300', icon: <CheckCircle size={12} /> },
      'cancelled': { color: 'bg-red-900 text-red-200', icon: <XCircle size={12} /> }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-700 text-gray-300', icon: <AlertCircle size={12} /> };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getScheduleTypeBadge = (type) => {
    const typeConfig = {
      'public_offer': { color: 'bg-purple-900 text-purple-200', label: 'Public Offer', icon: <Gift size={12} /> },
      'targeted_promo': { color: 'bg-indigo-900 text-indigo-200', label: 'Targeted Promo', icon: <Target size={12} /> },
      'event_reward': { color: 'bg-yellow-900 text-yellow-200', label: 'Event Reward', icon: <Award size={12} /> },
      'referral_bonus': { color: 'bg-teal-900 text-teal-200', label: 'Referral Bonus', icon: <Users size={12} /> }
    };
    
    const config = typeConfig[type] || { color: 'bg-gray-700 text-gray-300', label: type, icon: <Gift size={12} /> };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getActivationTypeBadge = (type) => {
    const typeConfig = {
      'user_activated': { color: 'bg-green-900 text-green-200', label: 'User Activated', icon: <UserCheck size={12} /> },
      'manual': { color: 'bg-blue-900 text-blue-200', label: 'Manual', icon: <UserPlus size={12} /> },
      'scheduled': { color: 'bg-purple-900 text-purple-200', label: 'Scheduled', icon: <Calendar size={12} /> },
      'referral': { color: 'bg-teal-900 text-teal-200', label: 'Referral', icon: <Users size={12} /> },
      'promotion': { color: 'bg-pink-900 text-pink-200', label: 'Promotion', icon: <Gift size={12} /> },
      'event': { color: 'bg-yellow-900 text-yellow-200', label: 'Event', icon: <Award size={12} /> }
    };
    
    const config = typeConfig[type] || { color: 'bg-gray-700 text-gray-300', label: type, icon: <AlertCircle size={12} /> };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const ScheduleRow = ({ schedule }) => (
    <tr className="border-b border-gray-700 hover:bg-gray-750">
      <td className="py-3 px-4">
        <div className="font-medium text-gray-100">{schedule.schedule_name}</div>
        <div className="text-sm text-gray-400 truncate max-w-xs">{schedule.description}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-gray-100">{schedule.plan_name}</div>
        <div className="text-xs text-gray-500">{schedule.plan_type}</div>
      </td>
      <td className="py-3 px-4">
        {getScheduleTypeBadge(schedule.schedule_type)}
      </td>
      <td className="py-3 px-4">
        <div className="text-gray-100">{formatDate(schedule.start_date)}</div>
        <div className="text-xs text-gray-500">
          Ends: {formatTimeRemaining(schedule.end_date)}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="text-gray-100">{schedule.current_activations || 0}</div>
          <div className="text-xs text-gray-500">/</div>
          <div className="text-xs text-gray-500">
            {schedule.max_activations || '∞'}
          </div>
        </div>
        {schedule.max_activations && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
            <div 
              className="bg-[#BC8BBC] h-1.5 rounded-full" 
              style={{ 
                width: `${Math.min(100, ((schedule.current_activations || 0) / schedule.max_activations) * 100)}%` 
              }}
            ></div>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        {getStatusBadge(schedule.status)}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewSchedule(schedule)}
            className="p-1 text-gray-400 hover:text-blue-400 transition"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleTestEligibility(schedule.id)}
            disabled={isTestingEligibility}
            className="p-1 text-gray-400 hover:text-green-400 transition disabled:opacity-50"
            title="Test Eligibility"
          >
            <UserCheck size={16} />
          </button>
          {schedule.status === 'active' ? (
            <button
              onClick={() => handleToggleSchedule(schedule.id, 'pause')}
              className="p-1 text-gray-400 hover:text-yellow-400 transition"
              title="Pause Schedule"
            >
              <Pause size={16} />
            </button>
          ) : schedule.status === 'paused' ? (
            <button
              onClick={() => handleToggleSchedule(schedule.id, 'activate')}
              className="p-1 text-gray-400 hover:text-green-400 transition"
              title="Activate Schedule"
            >
              <Play size={16} />
            </button>
          ) : null}
          <button
            onClick={() => handleDeleteSchedule(schedule.id)}
            className="p-1 text-gray-400 hover:text-red-400 transition"
            title="Delete Schedule"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return <Smartphone size={14} />;
      case 'tablet': return <Tablet size={14} />;
      case 'desktop': return <Monitor size={14} />;
      case 'smarttv': return <Tv size={14} />;
      case 'gaming': return <Gamepad size={14} />;
      default: return <Smartphone size={14} />;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-gray-100">
          <Gift className="text-[#BC8BBC]" size={24} />
          Free Plans Management
        </h2>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">
          Create and manage free plan offers that users can activate themselves
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Active Offers</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 text-gray-100">{stats.active_schedules || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Total: {stats.total_schedules || 0}</p>
            </div>
            <Gift className="text-[#BC8BBC]" size={20} />
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Total Activations</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 text-gray-100">{stats.total_activations || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{stats.active_activations || 0} active</p>
            </div>
            <Users className="text-green-500" size={20} />
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Unique Users</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 text-gray-100">{stats.unique_users || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">activated free plans</p>
            </div>
            <UserPlus className="text-blue-500" size={20} />
          </div>
        </div>

        <div className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Plans Used</p>
              <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 text-gray-100">{stats.unique_plans || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">different plans</p>
            </div>
            <Gift className="text-yellow-500" size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-0">
            <button
              onClick={() => setActiveTab("schedules")}
              className={clsx(
                "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition flex-1 sm:flex-none",
                activeTab === "schedules"
                  ? "bg-[#BC8BBC] text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={16} />
                <span className="hidden sm:inline">Free Plan Offers</span>
                <span className="sm:hidden">Offers</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("activations")}
              className={clsx(
                "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition flex-1 sm:flex-none",
                activeTab === "activations"
                  ? "bg-[#BC8BBC] text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Users size={16} />
                <span className="hidden sm:inline">Activations</span>
                <span className="sm:hidden">Act</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={clsx(
                "px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition flex-1 sm:flex-none",
                activeTab === "analytics"
                  ? "bg-[#BC8BBC] text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </div>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Manual Assignment</span>
              <span className="sm:hidden">Manual</span>
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3 sm:px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A87BA8] transition flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Offer</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={loadDashboardData}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading {activeTab}...</p>
            </div>
          ) : activeTab === "schedules" ? (
            <>
              {/* Search and Filter */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search free plan offers..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 text-sm">
                    <Filter size={16} />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
              </div>

              {/* Schedules Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Offer Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Plan</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Duration</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Activations</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No free plan offers found. Create your first offer!
                        </td>
                      </tr>
                    ) : (
                      schedules.map((schedule) => (
                        <ScheduleRow key={schedule.id} schedule={schedule} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {schedules.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                  <div className="text-xs sm:text-sm text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} offers
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={clsx(
                            "px-2 sm:px-3 py-1 rounded-lg transition text-sm min-w-[2rem]",
                            currentPage === pageNum
                              ? "bg-[#BC8BBC] text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : activeTab === "activations" ? (
            <>
              {/* Search and Filter for Activations */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search activations by user email or name..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 text-sm">
                    <Filter size={16} />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                  <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition flex items-center gap-2 text-sm">
                    <Download size={16} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Activations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">User</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Plan</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Offer</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Activated</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Expires</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-500">
                          No activations found.
                        </td>
                      </tr>
                    ) : (
                      activations.map((activation) => (
                        <tr key={activation.id} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-100 text-sm">{activation.user_name}</div>
                            <div className="text-xs text-gray-400">{activation.user_email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-100 text-sm">{activation.plan_name}</div>
                            <div className="text-xs text-gray-500">{activation.plan_type}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-100 text-sm truncate max-w-xs">{activation.schedule_name || 'Manual Assignment'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-100 text-sm">{formatDate(activation.activated_at)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-gray-100 text-sm">{formatDate(activation.expires_at)}</div>
                            <div className="text-xs text-gray-500">
                              {activation.days_remaining > 0 ? `${activation.days_remaining} days left` : 'Expired'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {activation.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-900 text-green-200 rounded-full">
                                <CheckCircle size={12} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-900 text-red-200 rounded-full">
                                <XCircle size={12} />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {getActivationTypeBadge(activation.activation_type)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination for Activations */}
              {activations.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
                  <div className="text-xs sm:text-sm text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} activations
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={clsx(
                            "px-2 sm:px-3 py-1 rounded-lg transition text-sm min-w-[2rem]",
                            currentPage === pageNum
                              ? "bg-[#BC8BBC] text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Analytics Tab */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Activation Summary */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 size={18} />
                  Activation Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                    <div className="text-gray-300">Total Activations</div>
                    <div className="text-xl font-bold text-gray-100">{stats.total_activations || 0}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                    <div className="text-gray-300">Active Activations</div>
                    <div className="text-xl font-bold text-green-400">{stats.active_activations || 0}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-750 rounded-lg">
                    <div className="text-gray-300">Unique Users</div>
                    <div className="text-xl font-bold text-blue-400">{stats.unique_users || 0}</div>
                  </div>
                </div>
              </div>

              {/* Recent Activations */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp size={18} />
                  Recent Activations
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {activations.slice(0, 5).map((activation) => (
                    <div key={activation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-750 rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-100 text-sm truncate">{activation.user_name}</div>
                        <div className="text-xs text-gray-400 truncate">{activation.plan_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          {new Date(activation.activated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs">
                          {getActivationTypeBadge(activation.activation_type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Performance */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="font-semibold text-gray-100 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <CalendarDays size={18} />
                  Top Performing Offers
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {schedules
                    .filter(s => s.status === 'active')
                    .sort((a, b) => (b.current_activations || 0) - (a.current_activations || 0))
                    .slice(0, 5)
                    .map((schedule) => (
                      <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-750 rounded-lg gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-100 text-sm truncate">{schedule.schedule_name}</div>
                          <div className="text-xs text-gray-400">{schedule.plan_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-100 font-semibold">{schedule.current_activations || 0}</div>
                          <div className="text-xs text-gray-400">activations</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      
      {/* Create Offer Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Create New Free Plan Offer</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 text-gray-400 hover:text-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Offer Name *</label>
                  <input 
                    type="text"
                    value={newSchedule.schedule_name}
                    onChange={(e) => setNewSchedule({...newSchedule, schedule_name: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                    placeholder="e.g., 7-Day Premium Trial"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Target Plan *</label>
                  <select 
                    value={newSchedule.target_plan_id}
                    onChange={(e) => setNewSchedule({...newSchedule, target_plan_id: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  >
                    <option value="">Select a plan...</option>
                    {availablePlans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.type}) - {plan.price} RWF
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                <textarea 
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({...newSchedule, description: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  rows="2"
                  placeholder="Describe this free plan offer..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Offer Type</label>
                  <select 
                    value={newSchedule.schedule_type}
                    onChange={(e) => setNewSchedule({...newSchedule, schedule_type: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  >
                    <option value="public_offer">Public Offer</option>
                    <option value="targeted_promo">Targeted Promotion</option>
                    <option value="event_reward">Event Reward</option>
                    <option value="referral_bonus">Referral Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Plan Duration (Days) *</label>
                  <input 
                    type="number"
                    value={newSchedule.plan_duration_days}
                    onChange={(e) => setNewSchedule({...newSchedule, plan_duration_days: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Start Date *</label>
                  <input 
                    type="datetime-local"
                    value={newSchedule.start_date}
                    onChange={(e) => setNewSchedule({...newSchedule, start_date: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">End Date *</label>
                  <input 
                    type="datetime-local"
                    value={newSchedule.end_date}
                    onChange={(e) => setNewSchedule({...newSchedule, end_date: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Max Activations</label>
                  <input 
                    type="number"
                    value={newSchedule.max_activations}
                    onChange={(e) => setNewSchedule({...newSchedule, max_activations: e.target.value || null})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Target User Type</label>
                  <select 
                    value={newSchedule.target_user_type}
                    onChange={(e) => setNewSchedule({...newSchedule, target_user_type: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  >
                    <option value="eligible_users">Eligible Users (Based on criteria)</option>
                    <option value="all_users">All Users</option>
                    <option value="specific_users">Specific Users Only</option>
                    <option value="new_users">New Users Only</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium mb-3 text-gray-300 flex items-center gap-2">
                  <Shield size={16} />
                  Eligibility Criteria
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-400">Min Account Age (Days)</label>
                    <input 
                      type="number"
                      value={newSchedule.user_segment_criteria.min_account_age_days || ''}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule, 
                        user_segment_criteria: {
                          ...newSchedule.user_segment_criteria,
                          min_account_age_days: e.target.value ? parseInt(e.target.value) : null
                        }
                      })}
                      className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                      placeholder="Optional"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-400">Min Watch Time (Minutes)</label>
                    <input 
                      type="number"
                      value={newSchedule.user_segment_criteria.min_watch_time_minutes || ''}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule, 
                        user_segment_criteria: {
                          ...newSchedule.user_segment_criteria,
                          min_watch_time_minutes: e.target.value ? parseInt(e.target.value) : null
                        }
                      })}
                      className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                      placeholder="Optional"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id="require_email"
                      checked={newSchedule.user_segment_criteria.require_email_verification}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule, 
                        user_segment_criteria: {
                          ...newSchedule.user_segment_criteria,
                          require_email_verification: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="require_email" className="text-gray-300 text-sm">Require Email Verification</label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id="require_phone"
                      checked={newSchedule.user_segment_criteria.require_phone_verification}
                      onChange={(e) => setNewSchedule({
                        ...newSchedule, 
                        user_segment_criteria: {
                          ...newSchedule.user_segment_criteria,
                          require_phone_verification: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <label htmlFor="require_phone" className="text-gray-300 text-sm">Require Phone Verification</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Allowed Devices</label>
                <div className="flex flex-wrap gap-2">
                  {['mobile', 'tablet', 'desktop', 'smarttv', 'gaming'].map(device => (
                    <div key={device} className="flex items-center">
                      <input 
                        type="checkbox"
                        id={`device_${device}`}
                        checked={newSchedule.allowed_devices.includes(device)}
                        onChange={(e) => {
                          const newDevices = e.target.checked
                            ? [...newSchedule.allowed_devices, device]
                            : newSchedule.allowed_devices.filter(d => d !== device);
                          setNewSchedule({...newSchedule, allowed_devices: newDevices});
                        }}
                        className="mr-1"
                      />
                      <label htmlFor={`device_${device}`} className="text-gray-300 text-sm capitalize">
                        {device}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    id="is_trial"
                    checked={newSchedule.is_trial}
                    onChange={(e) => setNewSchedule({...newSchedule, is_trial: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="is_trial" className="text-gray-300 text-sm">Mark as Trial</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox"
                    id="auto_upgrade"
                    checked={newSchedule.auto_upgrade_to_paid}
                    onChange={(e) => setNewSchedule({...newSchedule, auto_upgrade_to_paid: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="auto_upgrade" className="text-gray-300 text-sm">Auto-upgrade to Paid</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Redemption Instructions</label>
                <textarea 
                  value={newSchedule.redemption_instructions}
                  onChange={(e) => setNewSchedule({...newSchedule, redemption_instructions: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  rows="2"
                  placeholder="Instructions for users on how to claim this offer"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors text-sm order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  disabled={!newSchedule.schedule_name || !newSchedule.target_plan_id || !newSchedule.start_date || !newSchedule.end_date}
                  className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A87BA8] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm order-1 sm:order-2"
                >
                  Create Free Plan Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Test Modal */}
      {showEligibilityModal && eligibilityResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <UserCheck size={20} />
                Eligibility Test Result
              </h3>
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="p-1 text-gray-400 hover:text-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {eligibilityResult.eligible ? (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <h4 className="font-semibold text-green-300">User is Eligible</h4>
                      <p className="text-sm text-green-200">This user can activate the free plan offer</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Plan:</span>
                      <span className="text-gray-100">{eligibilityResult.schedule?.plan_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-gray-100">{eligibilityResult.schedule?.duration_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Offer Ends:</span>
                      <span className="text-gray-100">{formatDate(eligibilityResult.schedule?.ends_at)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <XCircle className="text-red-500" size={24} />
                    <div>
                      <h4 className="font-semibold text-red-300">User is Not Eligible</h4>
                      <p className="text-sm text-red-200">{eligibilityResult.reason}</p>
                    </div>
                  </div>
                  {eligibilityResult.starts_at && (
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Offer Starts:</span>
                        <span className="text-gray-100">{formatDate(eligibilityResult.starts_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowEligibilityModal(false)}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Manual Free Plan Assignment</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUsers([]);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Select Free Plan *</label>
                <select 
                  value={assignmentData.plan_id}
                  onChange={(e) => setAssignmentData({...assignmentData, plan_id: e.target.value})}
                  className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                >
                  <option value="">Choose a plan...</option>
                  {availablePlans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.type}) - {plan.price} RWF
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Duration (Days) *</label>
                  <input 
                    type="number"
                    value={assignmentData.duration_days}
                    onChange={(e) => setAssignmentData({...assignmentData, duration_days: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">Activation Reason</label>
                  <select 
                    value={assignmentData.activation_reason}
                    onChange={(e) => setAssignmentData({...assignmentData, activation_reason: e.target.value})}
                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 text-sm"
                  >
                    <option value="manual_activation">Manual Activation</option>
                    <option value="customer_support">Customer Support</option>
                    <option value="promotion">Promotion</option>
                    <option value="compensation">Compensation</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="is_trial_manual"
                  checked={assignmentData.is_trial}
                  onChange={(e) => setAssignmentData({...assignmentData, is_trial: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_trial_manual" className="text-gray-300 text-sm">Mark as Trial</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Search and Select Users *</label>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) {
                          handleSearchUsers();
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] text-sm"
                      placeholder="Search users by email, name, or phone..."
                    />
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Search Results:</div>
                    <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg">
                      {searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border-b border-gray-700 hover:bg-gray-750">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-100 text-sm truncate">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{user.email}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {user.has_active_subscription ? 'Has active subscription' : 'No active subscription'}
                              {user.has_active_free_plan && ' • Has active free plan'}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (!selectedUsers.some(u => u.id === user.id)) {
                                setSelectedUsers([...selectedUsers, user]);
                              }
                            }}
                            disabled={user.has_active_subscription || selectedUsers.some(u => u.id === user.id)}
                            className="px-3 py-1 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A87BA8] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm ml-2 flex-shrink-0"
                          >
                            {selectedUsers.some(u => u.id === user.id) ? 'Added' : 'Add'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Selected Users ({selectedUsers.length}):</div>
                    <div className="border border-gray-700 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto">
                        {selectedUsers.map(user => (
                          <div key={user.id} className="flex items-center gap-2 bg-gray-700 px-2 sm:px-3 py-1 rounded-full">
                            <span className="text-gray-100 text-xs truncate max-w-[100px]">
                              {user.first_name} {user.last_name}
                            </span>
                            <button
                              onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                              className="text-gray-400 hover:text-red-400 flex-shrink-0"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUsers([]);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors text-sm order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualActivation}
                  disabled={selectedUsers.length === 0 || !assignmentData.plan_id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm order-1 sm:order-2"
                >
                  Assign Free Plans ({selectedUsers.length} users)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Schedule Details Modal */}
      {showViewModal && viewingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Eye size={20} />
                Schedule Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 text-gray-400 hover:text-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Schedule Name</label>
                  <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">{viewingSchedule.schedule_name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Status</label>
                  <div className="p-2">
                    {getStatusBadge(viewingSchedule.status)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Description</label>
                <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">{viewingSchedule.description}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Plan</label>
                  <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">
                    {viewingSchedule.plan_name} ({viewingSchedule.plan_type})
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Schedule Type</label>
                  <div className="p-2">
                    {getScheduleTypeBadge(viewingSchedule.schedule_type)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Start Date</label>
                  <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">{formatDate(viewingSchedule.start_date)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">End Date</label>
                  <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">{formatDate(viewingSchedule.end_date)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Plan Duration</label>
                  <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">{viewingSchedule.plan_duration_days} days</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Activations</label>
                  <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm">
                    {viewingSchedule.current_activations || 0} / {viewingSchedule.max_activations || '∞'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Target Users</label>
                <div className="p-2 bg-gray-700 rounded-lg text-gray-100 text-sm capitalize">
                  {viewingSchedule.target_user_type?.replace(/_/g, ' ')}
                </div>
              </div>

              {viewingSchedule.allowed_devices && viewingSchedule.allowed_devices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Allowed Devices</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded-lg">
                    {viewingSchedule.allowed_devices.map((device, index) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-600 rounded">
                        {getDeviceIcon(device)}
                        <span className="text-gray-100 text-xs capitalize">{device}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors text-sm order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setActiveTab('activations');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm order-1 sm:order-2"
                >
                  View Activations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreePlansManagement;