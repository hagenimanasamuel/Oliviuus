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
  Phone,
  Home,
  UserCheck,
  UserX,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  Ban,
  Unlock,
  Key,
  DollarSign
} from "lucide-react";

export default function FamilyPlan() {
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    role: "all",
    dashboardType: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "child",
    relationship: "",
    dashboardType: "normal",
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/admin/users/family/members', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data.members || []);
        
        const statsData = {
          total: data.members?.length || 0,
          active: data.members?.filter(m => m.invitation_status === 'accepted' && !m.is_suspended)?.length || 0,
          pending: data.members?.filter(m => m.invitation_status === 'pending')?.length || 0,
          suspended: data.members?.filter(m => m.is_suspended)?.length || 0,
        };
        setStats(statsData);
        showToast("Family members loaded successfully");
      } else {
        showToast("Failed to load family members", "error");
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
      showToast("Error loading family members", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!newInvite.email || !newInvite.email.includes('@')) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/admin/users/family/members/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInvite)
      });
      
      if (response.ok) {
        const data = await response.json();
        showToast("Invitation sent successfully");
        setShowInviteModal(false);
        setNewInvite({
          email: "",
          role: "child",
          relationship: "",
          dashboardType: "normal",
        });
        fetchFamilyMembers();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Failed to send invitation", "error");
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      showToast("Error sending invitation", "error");
    }
  };

  const updateMemberStatus = async (memberId, updates) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/admin/users/family/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        showToast("Member updated successfully");
        fetchFamilyMembers();
      } else {
        showToast("Failed to update member", "error");
      }
    } catch (error) {
      console.error("Error updating member:", error);
      showToast("Error updating member", "error");
    }
  };

  const removeFamilyMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the family plan?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/admin/users/family/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        showToast("Family member removed successfully");
        fetchFamilyMembers();
      } else {
        showToast("Failed to remove family member", "error");
      }
    } catch (error) {
      console.error("Error removing family member:", error);
      showToast("Error removing family member", "error");
    }
  };

  const exportToCSV = () => {
    if (filteredFamilyMembers.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    const headers = ["ID", "Name", "Email", "Role", "Relationship", "Status", "Dashboard Type", "Owner", "Joined Date"];
    const csvData = filteredFamilyMembers.map(member => [
      member.id,
      member.user_name,
      member.user_email,
      member.member_role,
      member.relationship || "N/A",
      getStatusBadge(member),
      member.dashboard_type,
      member.owner_name,
      member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Not joined"
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
    if (member.invitation_status === 'pending') return "Pending";
    if (member.invitation_status === 'accepted') return "Active";
    return "Inactive";
  };

  const getStatusColor = (member) => {
    if (member.is_suspended) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    if (member.invitation_status === 'pending') return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    if (member.invitation_status === 'accepted') return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'owner': return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case 'parent': return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'teen': return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'child': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const filteredFamilyMembers = familyMembers.filter(member => {
    const matchesSearch = searchTerm === "" || 
      member.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === "all" || 
      (filters.status === "active" && member.invitation_status === 'accepted' && !member.is_suspended) ||
      (filters.status === "pending" && member.invitation_status === 'pending') ||
      (filters.status === "suspended" && member.is_suspended);
    
    const matchesRole = filters.role === "all" || member.member_role === filters.role;
    const matchesDashboard = filters.dashboardType === "all" || member.dashboard_type === filters.dashboardType;
    
    return matchesSearch && matchesStatus && matchesRole && matchesDashboard;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Family Plan Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage family members, invitations, and access controls
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Invites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Mail className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.suspended}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
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
                placeholder="Search by name, email, or owner..."
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
              <option value="pending">Pending Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dashboard Types</option>
              <option value="normal">Normal</option>
              <option value="kid">Kid</option>
            </select>
            <button
              onClick={() => setFilters({status: "all", role: "all", dashboardType: "all"})}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Family Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Relationship</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Access Controls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFamilyMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-gray-400 mb-2" />
                      <p>No family members found</p>
                      {searchTerm && (
                        <p className="text-sm mt-1">Try a different search term</p>
                      )}
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Your First Member
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFamilyMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{member.user_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{member.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.member_role)}`}>
                        {member.member_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {member.relationship || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{member.owner_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Plan Owner</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Home className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-gray-900 dark:text-white">Dashboard: {member.dashboard_type}</span>
                        </div>
                        {member.sleep_time_start && (
                          <div className="flex items-center text-sm">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-gray-900 dark:text-white">Sleep: {member.sleep_time_start} - {member.sleep_time_end}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member)}`}>
                        {getStatusBadge(member)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Not joined"}
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
                        <div className="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <button
                            onClick={() => {
                              setSelectedMember(member);
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
                              // Edit functionality
                              document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              showToast("Edit feature coming soon", "error");
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Member
                          </button>
                          {member.invitation_status === 'pending' && (
                            <button
                              onClick={() => {
                                updateMemberStatus(member.id, { resend_invitation: true });
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Resend Invite
                            </button>
                          )}
                          {!member.is_suspended ? (
                            <button
                              onClick={() => {
                                updateMemberStatus(member.id, { is_suspended: true });
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend Access
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                updateMemberStatus(member.id, { is_suspended: false });
                                document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Restore Access
                            </button>
                          )}
                          <button
                            onClick={() => {
                              removeFamilyMember(member.id, member.user_name);
                              document.querySelectorAll('.action-menu').forEach(m => m.classList.add('hidden'));
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Member
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite Family Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({...newInvite, email: e.target.value})}
                    placeholder="family.member@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newInvite.role}
                    onChange={(e) => setNewInvite({...newInvite, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="child">Child</option>
                    <option value="teen">Teen</option>
                    <option value="parent">Parent</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Relationship (Optional)
                  </label>
                  <input
                    type="text"
                    value={newInvite.relationship}
                    onChange={(e) => setNewInvite({...newInvite, relationship: e.target.value})}
                    placeholder="e.g., Son, Daughter, Spouse"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dashboard Type
                  </label>
                  <select
                    value={newInvite.dashboardType}
                    onChange={(e) => setNewInvite({...newInvite, dashboardType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal Dashboard</option>
                    <option value="kid">Kid-Friendly Dashboard</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={sendInvitation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Family Member Details</h3>
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
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Member Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {selectedMember.user_name}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {selectedMember.user_email}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Role:</span> {selectedMember.member_role}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Relationship:</span> {selectedMember.relationship || "N/A"}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Plan Information</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Owner:</span> {selectedMember.owner_name}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Owner Email:</span> {selectedMember.owner_email}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Invitation Status:</span> {selectedMember.invitation_status}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Joined Date:</span> {selectedMember.joined_at ? new Date(selectedMember.joined_at).toLocaleDateString() : "Not joined"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Access Controls</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Dashboard Type:</span> {selectedMember.dashboard_type}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Sleep Time:</span> {selectedMember.sleep_time_start} - {selectedMember.sleep_time_end}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Access Window:</span> {selectedMember.allowed_access_start} - {selectedMember.allowed_access_end}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Monthly Spending Limit:</span> ${selectedMember.monthly_spending_limit}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Restrictions & Security</h4>
                    <div className="space-y-2">
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Suspended:</span> {selectedMember.is_suspended ? "Yes" : "No"}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Suspended Until:</span> {selectedMember.suspended_until || "N/A"}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Enforce Sleep Time:</span> {selectedMember.enforce_sleep_time ? "Yes" : "No"}</p>
                      <p><span className="font-medium text-gray-700 dark:text-gray-300">Enforce Access Window:</span> {selectedMember.enforce_access_window ? "Yes" : "No"}</p>
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
    </div>
  );
}