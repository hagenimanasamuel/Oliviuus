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
  Loader2
} from "lucide-react";

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
  const [viewingHistory, setViewingHistory] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [apiError, setApiError] = useState("");

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
      
      // Try different API endpoints
      const endpoints = [
        '/api/admin/users/kids/profiles',
        '/api/kids/profiles',
        '/api/users/kids/profiles'
      ];
      
      let response = null;
      let lastError = null;
      
      // Try each endpoint
      for (const endpoint of endpoints) {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          console.log(`Trying endpoint: ${endpoint}`);
          
          response = await fetch(endpoint, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Success from:', endpoint, data);
            
            setKidProfiles(data.profiles || data || []);
            
            // Calculate stats
            const profiles = data.profiles || data || [];
            const statsData = {
              total: profiles.length || 0,
              active: profiles.filter(kid => kid.is_active)?.length || 0,
              byAgeGroup: calculateAgeGroups(profiles)
            };
            setStats(statsData);
            showToast("Kid profiles loaded successfully");
            return; // Exit on success
          }
        } catch (err) {
          lastError = err;
          console.log(`Failed on ${endpoint}:`, err.message);
        }
      }
      
      // If all endpoints failed
      if (lastError) {
        throw lastError;
      }
      
      // If we get here, response exists but not ok
      if (response) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        setApiError(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
        showToast(`Server error: ${response.status}`, "error");
      }
      
    } catch (error) {
      console.error("Error fetching kid profiles:", error);
      setApiError(error.message);
      showToast(`Error: ${error.message}`, "error");
      setKidProfiles([]); // Set empty array on error
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/admin/users/kids/${kidId}/viewing-history`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setViewingHistory(data.history || data || []);
        setShowHistoryModal(true);
        showToast("Viewing history loaded");
      } else {
        showToast("No viewing history found", "error");
      }
    } catch (error) {
      console.error("Error fetching viewing history:", error);
      showToast("Error loading viewing history", "error");
    }
  };

  const deleteKidProfile = async (kidId, kidName) => {
    if (!window.confirm(`Are you sure you want to delete ${kidName}'s profile?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/admin/users/kids/${kidId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        showToast("Kid profile deleted successfully");
        fetchKidProfiles(); // Refresh
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (error) {
      console.error("Error deleting kid profile:", error);
      showToast("Error deleting profile", "error");
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
    if (age <= 3) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (age <= 6) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (age <= 9) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    if (age <= 12) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
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
      (filters.ageRange === "10+" && age >= 10);
    
    return matchesSearch && matchesStatus && matchesAge;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading kid profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === "success" 
            ? "bg-green-500 text-white" 
            : "bg-red-500 text-white"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="ml-4 hover:opacity-80"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">API Error: </span>
            <span className="ml-2">{apiError}</span>
          </div>
          <button
            onClick={() => setApiError("")}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Specials - Kid Profiles Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor kid profiles and their activities
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={kidProfiles.length === 0}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Kid Profiles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Now</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Daily Watch Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {kidProfiles.length > 0 
                  ? Math.round(kidProfiles.reduce((sum, kid) => sum + (kid.total_watch_time_minutes || 0), 0) / kidProfiles.length)
                  : 0} mins
              </p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Most Common Age</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Object.entries(stats.byAgeGroup).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by kid name or parent email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              value={filters.ageRange}
              onChange={(e) => setFilters({...filters, ageRange: e.target.value})}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ages</option>
              <option value="0-3">0-3 years</option>
              <option value="4-6">4-6 years</option>
              <option value="7-9">7-9 years</option>
              <option value="10+">10+ years</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilters({status: "all", ageRange: "all"});
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Kid Profiles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kid Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Restrictions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Watch Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{kid.name || 'Unnamed'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">ID: {kid.id || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgeColor(age)}`}>
                          {age} years
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{kid.parent_name || kid.parent_email || "Parent"}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{kid.parent_email || "No email"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{kid.total_watch_time_minutes || 0} mins</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Last active: {kid.last_active_at ? new Date(kid.last_active_at).toLocaleDateString() : "Never"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kid.is_active)}`}>
                          {kid.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {kid.created_at ? new Date(kid.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const menu = e.currentTarget.nextElementSibling;
                              menu.classList.toggle('hidden');
                            }}
                            className="inline-flex items-center p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          <div className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
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
                                fetchViewingHistory(kid.id);
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              View History
                            </button>
                            <button
                              onClick={() => {
                                showToast("Edit feature coming soon", "error");
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
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Profile
                            </button>
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

      {/* Modals */}
      {showDetailsModal && selectedKid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Kid Profile Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Basic Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {selectedKid.name || 'N/A'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Age:</span> {calculateAge(selectedKid.birth_date)} years</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Birth Date:</span> {selectedKid.birth_date ? new Date(selectedKid.birth_date).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Theme:</span> {selectedKid.theme_color || 'Default'}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Parent Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Parent:</span> {selectedKid.parent_name || 'N/A'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {selectedKid.parent_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Restrictions & Controls</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Max Age Rating:</span> {selectedKid.max_content_age_rating || 'N/A'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Daily Time Limit:</span> {selectedKid.daily_time_limit_minutes || 0} minutes</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Bedtime:</span> {selectedKid.bedtime_start || 'N/A'} - {selectedKid.bedtime_end || 'N/A'}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">PIN Required:</span> {selectedKid.require_pin_to_exit ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Activity Stats</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Watch Time:</span> {selectedKid.total_watch_time_minutes || 0} minutes</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Last Active:</span> {selectedKid.last_active_at ? new Date(selectedKid.last_active_at).toLocaleString() : "Never"}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Status:</span> {selectedKid.is_active ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Viewing History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% Watched</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {viewingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center justify-center">
                            <Play className="h-12 w-12 text-gray-400 mb-2" />
                            <p>No viewing history found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      viewingHistory.map((session, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{session.content_title || "Unknown Content"}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{session.content_type || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {Math.round((session.watch_duration_seconds || 0) / 60)} minutes
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${session.percentage_watched || 0}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-900 dark:text-white">{session.percentage_watched || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{session.device_type || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {session.started_at ? new Date(session.started_at).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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