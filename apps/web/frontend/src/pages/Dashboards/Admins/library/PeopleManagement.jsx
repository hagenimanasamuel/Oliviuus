import React, { useState, useEffect, useRef } from "react";
import { 
  Edit3, ToggleLeft, ToggleRight, Eye, EyeOff, Star, 
  X, CheckCircle, AlertCircle, Plus, Search, Filter,
  Trash2, Save, ArrowUp, ArrowDown, Hash, Tag,
  Users, UserCheck, UserCog, Film, Award, Calendar,
  Mail, Globe, MapPin, Camera, List
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../api/axios";

// Lazy-loaded modal components
const PersonModal = React.lazy(() => import("../../../../components/layout/dashboard/admin/library/PersonModal.jsx"));
const CastingModal = React.lazy(() => import("../../../../components/layout/dashboard/admin/library/CastingModal.jsx"));

export default function PeopleManagement() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedCasting, setSelectedCasting] = useState(null);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isCastingModalOpen, setIsCastingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState(new Set());

  const roles = [
    { value: 'actor', label: 'Actor', icon: UserCheck, color: 'from-blue-500 to-cyan-500' },
    { value: 'director', label: 'Director', icon: UserCog, color: 'from-purple-500 to-pink-500' },
    { value: 'producer', label: 'Producer', icon: Users, color: 'from-green-500 to-emerald-500' },
    { value: 'writer', label: 'Writer', icon: Edit3, color: 'from-orange-500 to-red-500' },
    { value: 'cinematographer', label: 'Cinematographer', icon: Camera, color: 'from-yellow-500 to-orange-500' },
    { value: 'composer', label: 'Composer', icon: Award, color: 'from-indigo-500 to-purple-500' },
    { value: 'editor', label: 'Editor', icon: Film, color: 'from-gray-500 to-gray-700' },
    { value: 'other', label: 'Other', icon: Users, color: 'from-gray-400 to-gray-600' }
  ];

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await api.get("/people");
      if (response.data.success) {
        setPeople(response.data.data);
      } else {
        setError("Failed to load people");
      }
    } catch (err) {
      console.error("Error fetching people:", err);
      setError("Failed to load people");
    } finally {
      setLoading(false);
    }
  };

  const togglePersonStatus = async (personId, currentStatus) => {
    try {
      const response = await api.put(`/people/${personId}`, {
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        setPeople(people.map(person => 
          person.id === personId ? { ...person, is_active: !currentStatus } : person
        ));
        setSuccess(`Person ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating person:", err);
      setError("Failed to update person status");
    }
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setIsPersonModalOpen(true);
  };

  const handleCreatePerson = () => {
    setSelectedPerson(null);
    setIsPersonModalOpen(true);
  };

  const handleAddCasting = () => {
    setSelectedCasting(null);
    setIsCastingModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsPersonModalOpen(false);
    setIsCastingModalOpen(false);
    setSelectedPerson(null);
    setSelectedCasting(null);
  };

  const handlePersonSaved = (savedPerson) => {
    if (selectedPerson) {
      setPeople(people.map(person => 
        person.id === savedPerson.id ? savedPerson : person
      ));
      setSuccess("Person updated successfully");
    } else {
      setPeople([savedPerson, ...people]);
      setSuccess("Person created successfully");
    }
    setTimeout(() => setSuccess(""), 3000);
    handleCloseModals();
  };

  const handleDeletePerson = async (personId) => {
    if (!window.confirm("Are you sure you want to delete this person? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await api.delete(`/people/${personId}`);
      
      if (response.data.success) {
        setPeople(people.filter(person => person.id !== personId));
        setSuccess("Person deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting person:", err);
      if (err.response?.data?.used_in_content) {
        setError("Cannot delete person that is associated with content");
      } else {
        setError("Failed to delete person");
      }
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPeople.size === 0) {
      setError("Please select at least one person");
      return;
    }

    try {
      if (action === 'activate') {
        await Promise.all(
          Array.from(selectedPeople).map(personId =>
            api.put(`/people/${personId}`, { is_active: true })
          )
        );
        setPeople(people.map(person =>
          selectedPeople.has(person.id) ? { ...person, is_active: true } : person
        ));
        setSuccess(`${selectedPeople.size} person(s) activated`);
      } else if (action === 'deactivate') {
        await Promise.all(
          Array.from(selectedPeople).map(personId =>
            api.put(`/people/${personId}`, { is_active: false })
          )
        );
        setPeople(people.map(person =>
          selectedPeople.has(person.id) ? { ...person, is_active: false } : person
        ));
        setSuccess(`${selectedPeople.size} person(s) deactivated`);
      } else if (action === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${selectedPeople.size} person(s)?`)) {
          return;
        }
        await Promise.all(
          Array.from(selectedPeople).map(personId =>
            api.delete(`/people/${personId}`)
          )
        );
        setPeople(people.filter(person => !selectedPeople.has(person.id)));
        setSuccess(`${selectedPeople.size} person(s) deleted`);
      }
      
      setSelectedPeople(new Set());
      setBulkEditMode(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error performing bulk action:", err);
      setError("Failed to perform bulk action");
    }
  };

  const togglePersonSelection = (personId) => {
    const newSelection = new Set(selectedPeople);
    if (newSelection.has(personId)) {
      newSelection.delete(personId);
    } else {
      newSelection.add(personId);
    }
    setSelectedPeople(newSelection);
  };

  const selectAllPeople = () => {
    if (selectedPeople.size === filteredPeople.length) {
      setSelectedPeople(new Set());
    } else {
      setSelectedPeople(new Set(filteredPeople.map(p => p.id)));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getRoleConfig = (role) => {
    return roles.find(r => r.value === role) || roles.find(r => r.value === 'other');
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  // Filter and sort people
  const filteredPeople = people
    .filter(person => {
      const matchesSearch = person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (person.display_name && person.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (person.bio && person.bio.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = filterRole === "all" || person.primary_role === filterRole;
      const matchesStatus = filterStatus === "all" ||
                           (filterStatus === "active" && person.is_active) ||
                           (filterStatus === "inactive" && !person.is_active);
      
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      if (sortConfig.key === 'full_name') {
        return sortConfig.direction === 'asc' ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name);
      }
      if (sortConfig.key === 'content_count') {
        return sortConfig.direction === 'asc' ? a.content_count - b.content_count : b.content_count - a.content_count;
      }
      if (sortConfig.key === 'popularity_score') {
        return sortConfig.direction === 'asc' ? a.popularity_score - b.popularity_score : b.popularity_score - a.popularity_score;
      }
      if (sortConfig.key === 'created_at') {
        return sortConfig.direction === 'asc' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at);
      }
      return 0;
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading people...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage actors, directors, and crew members for your content
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAddCasting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <UserCheck size={18} />
            Add Casting
          </button>
          <button 
            onClick={handleCreatePerson}
            className="flex items-center gap-2 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors font-medium"
          >
            <Plus size={18} />
            Add Person
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search people by name, bio, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={clsx(
                "p-2 transition-colors",
                viewMode === "grid" 
                  ? "bg-[#BC8BBC] text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <Users size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={clsx(
                "p-2 transition-colors",
                viewMode === "list" 
                  ? "bg-[#BC8BBC] text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkEditMode && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              {selectedPeople.size} person(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setBulkEditMode(false);
              setSelectedPeople(new Set());
            }}
            className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
          <p className="text-green-700 dark:text-green-400">{success}</p>
          <button 
            onClick={() => setSuccess("")}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* People Table/Grid */}
      {viewMode === "list" ? (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {bulkEditMode && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedPeople.size === filteredPeople.length && filteredPeople.length > 0}
                      onChange={selectAllPeople}
                      className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Person
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('content_count')}
                >
                  <div className="flex items-center gap-1">
                    <Film size={14} />
                    Content
                    {getSortIcon('content_count')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPeople.map((person) => {
                const roleConfig = getRoleConfig(person.primary_role);
                const RoleIcon = roleConfig.icon;
                const age = calculateAge(person.date_of_birth);
                
                return (
                  <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {bulkEditMode && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPeople.has(person.id)}
                          onChange={() => togglePersonSelection(person.id)}
                          className="rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {person.profile_image_url ? (
                          <img
                            src={person.profile_image_url}
                            alt={person.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{person.full_name}</div>
                          {person.display_name && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">{person.display_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Film size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {person.content_count || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RoleIcon size={16} className={clsx("text-" + roleConfig.color.split('-')[1] + "-500")} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {person.primary_role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {person.date_of_birth && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(person.date_of_birth)} {age && `(${age} yrs)`}</span>
                          </div>
                        )}
                        {person.nationality && (
                          <div className="flex items-center gap-1">
                            <Globe size={12} />
                            <span>{person.nationality}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        person.is_active 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        {person.is_active ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                        {person.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditPerson(person)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#BC8BBC] hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Edit person"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => togglePersonStatus(person.id, person.is_active)}
                          className={clsx(
                            "p-2 rounded transition-colors",
                            person.is_active
                              ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          )}
                          title={person.is_active ? "Deactivate" : "Activate"}
                        >
                          {person.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeletePerson(person.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete person"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredPeople.map((person) => {
            const roleConfig = getRoleConfig(person.primary_role);
            const RoleIcon = roleConfig.icon;
            const age = calculateAge(person.date_of_birth);
            
            return (
              <div
                key={person.id}
                className={clsx(
                  "bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group",
                  person.is_active 
                    ? 'border-green-200 dark:border-green-800' 
                    : 'border-red-200 dark:border-red-800',
                  selectedPeople.has(person.id) && 'ring-2 ring-[#BC8BBC] ring-offset-2'
                )}
              >
                {/* Person Header */}
                <div className={clsx(
                  "p-6 rounded-t-xl text-white relative overflow-hidden",
                  `bg-gradient-to-r ${roleConfig.color}`
                )}>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {person.profile_image_url ? (
                          <img
                            src={person.profile_image_url}
                            alt={person.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center">
                            <Users size={24} className="text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold">{person.full_name}</h3>
                          {person.display_name && (
                            <p className="text-white/80 text-sm">{person.display_name}</p>
                          )}
                        </div>
                      </div>
                      {bulkEditMode ? (
                        <input
                          type="checkbox"
                          checked={selectedPeople.has(person.id)}
                          onChange={() => togglePersonSelection(person.id)}
                          className="rounded border-white bg-white/20 backdrop-blur-sm text-[#BC8BBC] focus:ring-[#BC8BBC]"
                        />
                      ) : (
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <RoleIcon size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Person Content */}
                <div className="p-6 space-y-4">
                  {/* Role and Stats */}
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize",
                      `bg-${roleConfig.color.split('-')[1]}-100 dark:bg-${roleConfig.color.split('-')[1]}-900/30`,
                      `text-${roleConfig.color.split('-')[1]}-700 dark:text-${roleConfig.color.split('-')[1]}-400`
                    )}>
                      <RoleIcon size={12} />
                      {person.primary_role}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Film size={14} />
                      <span>{person.content_count || 0} content</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {person.bio || (
                        <span className="text-gray-400 italic">No biography provided</span>
                      )}
                    </p>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-2 text-sm">
                    {person.date_of_birth && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          Born
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {formatDate(person.date_of_birth)} {age && `(${age})`}
                        </span>
                      </div>
                    )}
                    {person.nationality && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Globe size={12} />
                          Nationality
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {person.nationality}
                        </span>
                      </div>
                    )}
                    {person.place_of_birth && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin size={12} />
                          Birth Place
                        </span>
                        <span className="text-gray-900 dark:text-white truncate max-w-[120px]">
                          {person.place_of_birth}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <span className={clsx(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
                      person.is_active 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    )}>
                      {person.is_active ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {person.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {!bulkEditMode && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleEditPerson(person)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#BC8BBC] text-white rounded-lg text-sm font-medium hover:bg-[#9b69b2] transition-all hover:scale-105"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => togglePersonStatus(person.id, person.is_active)}
                        className={clsx(
                          "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          person.is_active
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                        )}
                      >
                        {person.is_active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                        {person.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredPeople.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No people found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No people have been added yet. Get started by adding your first person!'
            }
          </p>
          {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
            <button 
              onClick={handleCreatePerson}
              className="flex items-center gap-2 px-6 py-3 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] transition-colors font-medium mx-auto"
            >
              <Plus size={18} />
              Add First Person
            </button>
          )}
        </div>
      )}

      {/* Bulk Edit Toggle */}
      {!loading && filteredPeople.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-all",
              bulkEditMode
                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {bulkEditMode ? "Cancel Bulk Edit" : "Bulk Edit"}
          </button>
        </div>
      )}

      {/* Modals */}
      {isPersonModalOpen && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
          </div>
        }>
          <PersonModal
            person={selectedPerson}
            onClose={handleCloseModals}
            onSave={handlePersonSaved}
          />
        </React.Suspense>
      )}

      {isCastingModalOpen && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
          </div>
        }>
          <CastingModal
            casting={selectedCasting}
            onClose={handleCloseModals}
            onSave={() => {
              setSuccess("Casting added successfully");
              setTimeout(() => setSuccess(""), 3000);
              handleCloseModals();
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}