// ContentModalTabs/CastingTab.js - Fixed Dynamic Icon Rendering
import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserCog, Award, Camera, Edit3, 
  Plus, Trash2, Search, Filter, MoreVertical, Star,
  Film, Tv, Calendar, Clock, X, Save, RefreshCw,
  ArrowUpDown, Eye, Edit, Download, Upload, SortAsc,
  Crown, Sparkles, TrendingUp, Award as AwardIcon,
  Layers, UserPlus, BadgeCheck, Zap, CheckCircle
} from 'lucide-react';
import clsx from 'clsx';
import api from '../../../../../../api/axios';

const CastingTab = ({ content }) => {
  const [castings, setCastings] = useState([]);
  const [groupedByPerson, setGroupedByPerson] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('person');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [statistics, setStatistics] = useState(null);

  const roles = [
    { value: 'actor', label: 'Actor', icon: UserCheck, color: 'from-blue-500 to-cyan-500', priority: 1 },
    { value: 'director', label: 'Director', icon: UserCog, color: 'from-purple-500 to-pink-500', priority: 2 },
    { value: 'producer', label: 'Producer', icon: Users, color: 'from-green-500 to-emerald-500', priority: 3 },
    { value: 'writer', label: 'Writer', icon: Edit3, color: 'from-orange-500 to-red-500', priority: 4 },
    { value: 'cinematographer', label: 'Cinematographer', icon: Camera, color: 'from-yellow-500 to-orange-500', priority: 5 },
    { value: 'composer', label: 'Composer', icon: Award, color: 'from-indigo-500 to-purple-500', priority: 6 }
  ];

  // Helper function to get role config
  const getRoleConfig = (roleValue) => {
    return roles.find(r => r.value === roleValue) || { 
      label: roleValue, 
      icon: Users, 
      color: 'from-gray-500 to-gray-700'
    };
  };

  // Dynamic Icon Component to fix the rendering issue
  const RoleIcon = ({ roleType, size = 14 }) => {
    const roleConfig = getRoleConfig(roleType);
    const IconComponent = roleConfig.icon;
    return <IconComponent size={size} />;
  };

  useEffect(() => {
    fetchCastings();
  }, [content]);

  const fetchCastings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/people/content/casting?content_id=${content.id}&group_by_person=true`);
      if (response.data.success) {
        setCastings(response.data.data || []);
        setGroupedByPerson(response.data.grouped_by_person || []);
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching castings:', error);
      setCastings([]);
      setGroupedByPerson([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoleToPerson = async (personId, roleData) => {
    try {
      const response = await api.post('/people/content/add', {
        content_id: content.id,
        person_id: personId,
        ...roleData
      });

      if (response.data.success) {
        fetchCastings();
      }
    } catch (error) {
      console.error('Error adding role:', error);
      alert('Failed to add role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to remove this role?')) return;
    
    try {
      await api.delete(`/people/content/${roleId}`);
      fetchCastings();
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to remove role');
    }
  };

  const handleDeleteAllPersonRoles = async (personId) => {
    if (!window.confirm('Are you sure you want to remove this person from all roles in this content?')) return;
    
    try {
      const personRoles = groupedByPerson.find(p => p.person.id === personId)?.roles || [];
      
      for (const role of personRoles) {
        await api.delete(`/people/content/${role.id}`);
      }
      
      fetchCastings();
    } catch (error) {
      console.error('Error deleting person roles:', error);
      alert('Failed to remove person from content');
    }
  };

  const handleUpdateRole = async (roleId, updates) => {
    try {
      const response = await api.put(`/people/content/${roleId}`, updates);
      if (response.data.success) {
        fetchCastings();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const filteredPersons = groupedByPerson.filter(personData => {
    const matchesSearch = personData.person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         personData.roles.some(role => 
                           role.character_name?.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    const matchesRole = roleFilter === 'all' || 
                       personData.roles.some(role => role.role_type === roleFilter);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-purple-500" />
          <p className="mt-2 text-gray-400 text-sm">Loading casting information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Enhanced Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cast & Crew</h2>
              <p className="text-gray-400 text-xs">Manage the talented team behind {content.title}</p>
            </div>
          </div>
          
          {statistics && (
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded text-xs">
                <Users className="h-3 w-3 text-blue-400" />
                <span className="text-gray-300">
                  <span className="font-semibold text-white">{statistics.unique_people}</span> people
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded text-xs">
                <Layers className="h-3 w-3 text-green-400" />
                <span className="text-gray-300">
                  <span className="font-semibold text-white">{statistics.total_roles}</span> roles
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded text-xs">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span className="text-gray-300">
                  <span className="font-semibold text-white">{statistics.people_with_multiple_roles}</span> multi-role
                </span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded text-xs">
                <Star className="h-3 w-3 text-purple-400" />
                <span className="text-gray-300">
                  <span className="font-semibold text-white">
                    {groupedByPerson.filter(p => p.is_featured).length}
                  </span> featured
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-gray-800 rounded p-0.5">
            <button
              onClick={() => setViewMode('person')}
              className={clsx(
                "px-2 py-1.5 rounded text-xs font-medium transition-all",
                viewMode === 'person' 
                  ? "bg-purple-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <UserPlus size={12} className="inline mr-1" />
              By Person
            </button>
            <button
              onClick={() => setViewMode('role')}
              className={clsx(
                "px-2 py-1.5 rounded text-xs font-medium transition-all",
                viewMode === 'role' 
                  ? "bg-purple-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Layers size={12} className="inline mr-1" />
              By Role
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded transition-all hover:from-purple-700 hover:to-pink-700 font-medium text-xs shadow"
          >
            <Plus size={14} />
            Add Person
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search people, characters, or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent min-w-[140px] text-sm"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
            }}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors font-medium text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Casting List - Person View */}
      {viewMode === 'person' && (
        <div className="space-y-3">
          {filteredPersons.length === 0 ? (
            <EmptyState onAddPerson={() => setShowAddModal(true)} />
          ) : (
            filteredPersons.map((personData) => (
              <PersonCard
                key={personData.person.id}
                personData={personData}
                onAddRole={handleAddRoleToPerson}
                onDeleteRole={handleDeleteRole}
                onDeleteAllRoles={handleDeleteAllPersonRoles}
                onUpdateRole={handleUpdateRole}
                onEdit={() => setEditingPerson(editingPerson?.person?.id === personData.person.id ? null : personData)}
                isEditing={editingPerson?.person?.id === personData.person.id}
                content={content}
                getRoleConfig={getRoleConfig}
                RoleIcon={RoleIcon}
              />
            ))
          )}
        </div>
      )}

      {/* Casting List - Role View */}
      {viewMode === 'role' && (
        <RoleView 
          castings={castings}
          onDeleteRole={handleDeleteRole}
          onUpdateRole={handleUpdateRole}
          content={content}
          getRoleConfig={getRoleConfig}
          RoleIcon={RoleIcon}
        />
      )}

      {/* Add Casting Modal */}
      {showAddModal && (
        <AddCastingModal
          content={content}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            fetchCastings();
          }}
          existingCastings={castings}
        />
      )}
    </div>
  );
};

// Person Card Component
const PersonCard = ({ personData, onAddRole, onDeleteRole, onDeleteAllRoles, onUpdateRole, onEdit, isEditing, content, getRoleConfig, RoleIcon }) => {
  const { person, roles, role_count, is_featured } = personData;
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    role_type: 'actor',
    character_name: '',
    role_description: '',
    billing_order: Math.max(...roles.map(r => r.billing_order || 0), 0) + 1,
    is_featured: false,
    credit_type: 'supporting',
    season_number: '',
    episode_number: ''
  });

  const handleAddRole = () => {
    if (!newRoleData.role_type) {
      alert('Please select a role type');
      return;
    }
    onAddRole(person.id, newRoleData);
    setShowAddRoleForm(false);
    setNewRoleData({
      role_type: 'actor',
      character_name: '',
      role_description: '',
      billing_order: Math.max(...roles.map(r => r.billing_order || 0), 0) + 1,
      is_featured: false,
      credit_type: 'supporting',
      season_number: '',
      episode_number: ''
    });
  };

  const hasMultipleRoles = roles.length > 1;

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all">
      {/* Person Header */}
      <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Person Avatar */}
            <div className="flex-shrink-0 relative">
              {person.profile_image_url ? (
                <img
                  src={person.profile_image_url}
                  alt={person.full_name}
                  className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                  <Users size={18} className="text-gray-400" />
                </div>
              )}
              {hasMultipleRoles && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-0.5 rounded-full shadow">
                    <Layers size={10} />
                  </div>
                </div>
              )}
              {is_featured && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="bg-yellow-500 text-white p-0.5 rounded-full shadow">
                    <Star size={10} className="fill-current" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Person Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base">{person.full_name}</h3>
                
                <div className="flex items-center gap-1 flex-wrap">
                  {hasMultipleRoles && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                      <Layers size={10} />
                      {roles.length} roles
                    </span>
                  )}
                  
                  {is_featured && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                      <Sparkles size={10} />
                      Featured
                    </span>
                  )}
                  
                  {person.nationality && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                      🌎 {person.nationality}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-gray-400 text-xs mt-0.5 capitalize">
                {person.primary_role}
                {person.popularity_score && ` • Popularity: ${person.popularity_score}`}
              </p>

              {/* Role Types Summary */}
              <div className="flex flex-wrap gap-1 mt-1">
                {Array.from(new Set(roles.map(r => r.role_type))).map(roleType => {
                  const roleConfig = getRoleConfig(roleType);
                  const IconComponent = roleConfig.icon;
                  return (
                    <span
                      key={roleType}
                      className={clsx(
                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium text-white",
                        roleConfig.color
                      )}
                    >
                      <IconComponent size={10} />
                      {roleConfig.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddRoleForm(!showAddRoleForm)}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-xs font-medium"
              title="Add another role"
            >
              <Plus size={12} />
              Add Role
            </button>
            <button
              onClick={onEdit}
              className={clsx(
                "p-1 rounded transition-colors",
                isEditing 
                  ? "bg-blue-600 text-white" 
                  : "text-blue-400 hover:bg-blue-400/10"
              )}
              title="Edit roles"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDeleteAllRoles(person.id)}
              className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="Remove from all roles"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Roles List */}
      <div className="divide-y divide-gray-700/50">
        {roles.map((role, index) => (
          <RoleItem
            key={role.id}
            role={role}
            person={person}
            onDelete={onDeleteRole}
            onUpdate={onUpdateRole}
            isFirst={index === 0}
            showActions={!isEditing}
            getRoleConfig={getRoleConfig}
            RoleIcon={RoleIcon}
          />
        ))}
      </div>

      {/* Add Role Form */}
      {showAddRoleForm && (
        <div className="p-3 bg-gray-800/50 border-t border-gray-700">
          <AddRoleForm
            roleData={newRoleData}
            onChange={setNewRoleData}
            onSubmit={handleAddRole}
            onCancel={() => setShowAddRoleForm(false)}
            content={content}
            existingRoles={roles}
          />
        </div>
      )}

      {/* Edit Roles */}
      {isEditing && (
        <EditRolesForm
          personData={personData}
          onSave={onEdit}
          onCancel={() => onEdit()}
          onUpdateRole={onUpdateRole}
          content={content}
          getRoleConfig={getRoleConfig}
          RoleIcon={RoleIcon}
        />
      )}
    </div>
  );
};

// Role Item Component
const RoleItem = ({ role, person, onDelete, onUpdate, isFirst, showActions = true, getRoleConfig, RoleIcon }) => {
  const roleConfig = getRoleConfig(role.role_type);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    character_name: role.character_name || '',
    role_description: role.role_description || '',
    billing_order: role.billing_order || 0,
    is_featured: role.is_featured || false,
    credit_type: role.credit_type || 'supporting',
    season_number: role.season_number || '',
    episode_number: role.episode_number || ''
  });

  const handleSave = () => {
    onUpdate(role.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      character_name: role.character_name || '',
      role_description: role.role_description || '',
      billing_order: role.billing_order || 0,
      is_featured: role.is_featured || false,
      credit_type: role.credit_type || 'supporting',
      season_number: role.season_number || '',
      episode_number: role.episode_number || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="p-3 hover:bg-gray-800/20 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Role Icon */}
          <div className={clsx(
            "p-1.5 rounded text-white flex-shrink-0",
            roleConfig.color
          )}>
            <RoleIcon roleType={role.role_type} size={16} />
          </div>
          
          {/* Role Details */}
          <div className="flex-1 min-w-0">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-white text-sm capitalize">{roleConfig.label}</h4>
                  
                  <div className="flex items-center gap-1 flex-wrap">
                    {role.is_featured && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                        <Star size={10} className="fill-current" />
                        Featured
                      </span>
                    )}
                    
                    {role.credit_type && role.credit_type !== 'supporting' && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs capitalize">
                        {role.credit_type}
                      </span>
                    )}
                    
                    {role.billing_order > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        <Crown size={10} />
                        #{role.billing_order}
                      </span>
                    )}
                  </div>
                </div>
                
                {role.character_name && (
                  <p className="text-purple-400 font-medium text-xs">
                    as {role.character_name}
                  </p>
                )}
                
                {role.role_description && (
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                    {role.role_description}
                  </p>
                )}
                
                {(role.season_number || role.episode_number) && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {role.season_number && (
                      <span className="flex items-center gap-0.5">
                        <Tv size={10} />
                        Season {role.season_number}
                      </span>
                    )}
                    {role.episode_number && (
                      <span className="flex items-center gap-0.5">
                        <Film size={10} />
                        Episode {role.episode_number}
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <RoleEditForm
                editData={editData}
                onChange={setEditData}
                onSave={handleSave}
                onCancel={handleCancel}
                roleType={role.role_type}
              />
            )}
          </div>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                  title="Edit this role"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => onDelete(role.id)}
                  className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Remove this role"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={handleSave}
                  className="p-1 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                  title="Save changes"
                >
                  <CheckCircle size={14} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-gray-400 hover:bg-gray-400/10 rounded transition-colors"
                  title="Cancel editing"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Add Role Form Component
const AddRoleForm = ({ roleData, onChange, onSubmit, onCancel, content, existingRoles }) => {
  const roles = [
    { value: 'actor', label: 'Actor', icon: UserCheck },
    { value: 'director', label: 'Director', icon: UserCog },
    { value: 'producer', label: 'Producer', icon: Users },
    { value: 'writer', label: 'Writer', icon: Edit3 },
    { value: 'cinematographer', label: 'Cinematographer', icon: Camera },
    { value: 'composer', label: 'Composer', icon: Award }
  ];

  return (
    <div className="space-y-3">
      <h5 className="font-semibold text-white text-sm">Add New Role</h5>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Role Type *
          </label>
          <select
            value={roleData.role_type}
            onChange={(e) => onChange({ ...roleData, role_type: e.target.value })}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Credit Type
          </label>
          <select
            value={roleData.credit_type}
            onChange={(e) => onChange({ ...roleData, credit_type: e.target.value })}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
          >
            <option value="supporting">Supporting</option>
            <option value="starring">Starring</option>
            <option value="guest">Guest</option>
            <option value="cameo">Cameo</option>
            <option value="voice">Voice</option>
          </select>
        </div>
      </div>

      {roleData.role_type === 'actor' && (
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Character Name
          </label>
          <input
            type="text"
            value={roleData.character_name}
            onChange={(e) => onChange({ ...roleData, character_name: e.target.value })}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
            placeholder="Enter character name"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Role Description
        </label>
        <textarea
          value={roleData.role_description}
          onChange={(e) => onChange({ ...roleData, role_description: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none text-sm"
          placeholder="Describe the role or responsibilities..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Billing Order
          </label>
          <input
            type="number"
            value={roleData.billing_order}
            onChange={(e) => onChange({ ...roleData, billing_order: parseInt(e.target.value) || 0 })}
            min="0"
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
          />
        </div>
        
        {content.content_type === 'series' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Season
              </label>
              <input
                type="number"
                value={roleData.season_number}
                onChange={(e) => onChange({ ...roleData, season_number: e.target.value })}
                min="1"
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                placeholder="Optional"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Episode
              </label>
              <input
                type="number"
                value={roleData.episode_number}
                onChange={(e) => onChange({ ...roleData, episode_number: e.target.value })}
                min="1"
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                placeholder="Optional"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          id="is_featured"
          checked={roleData.is_featured}
          onChange={(e) => onChange({ ...roleData, is_featured: e.target.checked })}
          className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 scale-90"
        />
        <label htmlFor="is_featured" className="text-xs text-gray-300">
          Mark as featured role
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-600">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors font-medium text-xs"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium text-xs"
        >
          Add Role
        </button>
      </div>
    </div>
  );
};

// Role Edit Form Component
const RoleEditForm = ({ editData, onChange, onSave, onCancel, roleType }) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Character Name
          </label>
          <input
            type="text"
            value={editData.character_name}
            onChange={(e) => onChange({ ...editData, character_name: e.target.value })}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
            placeholder="Character name"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Billing Order
          </label>
          <input
            type="number"
            value={editData.billing_order}
            onChange={(e) => onChange({ ...editData, billing_order: parseInt(e.target.value) || 0 })}
            min="0"
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            Credit Type
          </label>
          <select
            value={editData.credit_type}
            onChange={(e) => onChange({ ...editData, credit_type: e.target.value })}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
          >
            <option value="supporting">Supporting</option>
            <option value="starring">Starring</option>
            <option value="guest">Guest</option>
            <option value="cameo">Cameo</option>
            <option value="voice">Voice</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            id="is_featured"
            checked={editData.is_featured}
            onChange={(e) => onChange({ ...editData, is_featured: e.target.checked })}
            className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 scale-90"
          />
          <label htmlFor="is_featured" className="text-xs text-gray-300">
            Featured role
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">
          Role Description
        </label>
        <textarea
          value={editData.role_description}
          onChange={(e) => onChange({ ...editData, role_description: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none text-sm"
          placeholder="Role description"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors font-medium text-xs"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors font-medium text-xs"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// Edit Roles Form Component
const EditRolesForm = ({ personData, onSave, onCancel, onUpdateRole, content, getRoleConfig, RoleIcon }) => {
  const [roles, setRoles] = useState(personData.roles);

  const handleRoleUpdate = (index, updates) => {
    const updatedRoles = [...roles];
    updatedRoles[index] = { ...updatedRoles[index], ...updates };
    setRoles(updatedRoles);
    onUpdateRole(updatedRoles[index].id, updates);
  };

  return (
    <div className="p-3 bg-gray-800/50 border-t border-gray-700">
      <h5 className="font-semibold text-white text-sm mb-3">Edit Roles for {personData.person.full_name}</h5>
      
      <div className="space-y-3">
        {roles.map((role, index) => (
          <div key={role.id} className="p-3 bg-gray-700/30 rounded border border-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <div className={clsx("p-1.5 rounded text-white", getRoleConfig(role.role_type).color)}>
                <RoleIcon roleType={role.role_type} size={14} />
              </div>
              <h6 className="font-medium text-white text-sm capitalize">{getRoleConfig(role.role_type).label}</h6>
            </div>
            <RoleEditForm
              editData={role}
              onChange={(updates) => handleRoleUpdate(index, updates)}
              onSave={() => {}} // Individual saves are handled automatically
              onCancel={() => {}} // Individual cancels are handled automatically
              roleType={role.role_type}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-600">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors font-medium text-xs"
        >
          Done Editing
        </button>
      </div>
    </div>
  );
};

// Role View Component
const RoleView = ({ castings, onDeleteRole, onUpdateRole, content, getRoleConfig, RoleIcon }) => {
  const groupedByRole = castings.reduce((acc, casting) => {
    const roleType = casting.role_type;
    if (!acc[roleType]) {
      acc[roleType] = [];
    }
    acc[roleType].push(casting);
    return acc;
  }, {});

  const sortedRoles = Object.keys(groupedByRole).sort();

  return (
    <div className="space-y-4">
      {sortedRoles.map(roleType => {
        const roleConfig = getRoleConfig(roleType);
        const IconComponent = roleConfig.icon;
        const roleCastings = groupedByRole[roleType];

        return (
          <div key={roleType} className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
            <div className={clsx("p-3 bg-gradient-to-r text-white", roleConfig.color)}>
              <div className="flex items-center gap-2">
                <IconComponent size={18} />
                <div>
                  <h3 className="font-bold text-sm capitalize">{roleConfig.label}</h3>
                  <p className="text-white/80 text-xs">
                    {roleCastings.length} {roleCastings.length === 1 ? 'person' : 'people'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-700/50">
              {roleCastings.map(casting => (
                <RoleItem
                  key={casting.id}
                  role={casting}
                  person={casting}
                  onDelete={onDeleteRole}
                  onUpdate={onUpdateRole}
                  showActions={true}
                  getRoleConfig={getRoleConfig}
                  RoleIcon={RoleIcon}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Empty State Component
const EmptyState = ({ onAddPerson }) => (
  <div className="text-center py-12 bg-gray-800/20 rounded-lg border-2 border-dashed border-gray-700">
    <Users className="mx-auto h-12 w-12 text-gray-500 mb-3" />
    <h3 className="text-base font-semibold text-white mb-1">No Cast Members Yet</h3>
    <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
      Start building your cast and crew by adding talented people to your project.
      You can add multiple roles for the same person!
    </p>
    <button
      onClick={onAddPerson}
      className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm shadow"
    >
      <Plus size={14} />
      Add Your First Team Member
    </button>
  </div>
);

// Add Casting Modal Component (keep the same as before)
const AddCastingModal = ({ content, onClose, onSave, existingCastings }) => {
  const [formData, setFormData] = useState({
    person_id: '',
    role_type: 'actor',
    character_name: '',
    role_description: '',
    billing_order: (existingCastings.filter(c => c.role_type === 'actor').length || 0) + 1,
    is_featured: false,
    credit_type: 'supporting',
    season_number: '',
    episode_number: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'actor', label: 'Actor', icon: UserCheck },
    { value: 'director', label: 'Director', icon: UserCog },
    { value: 'producer', label: 'Producer', icon: Users },
    { value: 'writer', label: 'Writer', icon: Edit3 },
    { value: 'cinematographer', label: 'Cinematographer', icon: Camera },
    { value: 'composer', label: 'Composer', icon: Award }
  ];

  const searchPeople = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/people/search?q=${encodeURIComponent(query)}&content_id=${content.id}&exclude_current=true&limit=10`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching people:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      searchPeople(query);
    } else {
      setSearchResults([]);
    }
  };

  const handlePersonSelect = (person) => {
    setSelectedPerson(person);
    setFormData(prev => ({ ...prev, person_id: person.id }));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPerson) {
      alert('Please select a person');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/people/content/add', {
        ...formData,
        content_id: content.id
      });

      if (response.data.success) {
        onSave();
      }
    } catch (error) {
      console.error('Error adding person to content:', error);
      alert('Failed to add person to content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded">
              <UserCheck size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add to Cast & Crew</h3>
              <p className="text-gray-400 text-xs">Add a person to {content.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* ... (rest of the modal form remains the same but with smaller sizes) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-1">
              Select Person
            </h4>
            
            {selectedPerson ? (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedPerson.profile_image_url ? (
                      <img
                        src={selectedPerson.profile_image_url}
                        alt={selectedPerson.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-green-400" />
                      </div>
                    )}
                    <div>
                      <h5 className="font-semibold text-white text-sm">{selectedPerson.full_name}</h5>
                      <p className="text-green-400 text-xs capitalize">
                        {selectedPerson.primary_role}
                        {selectedPerson.nationality && ` • ${selectedPerson.nationality}`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPerson(null);
                      setFormData(prev => ({ ...prev, person_id: '' }));
                    }}
                    className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for people by name..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-gray-600 rounded bg-gray-700 max-h-48 overflow-y-auto">
                    {searchResults.map(person => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => handlePersonSelect(person)}
                        className="w-full text-left p-2 hover:bg-gray-600 border-b border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {person.profile_image_url ? (
                            <img
                              src={person.profile_image_url}
                              alt={person.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <Users size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white text-sm truncate">
                              {person.full_name}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {person.primary_role}
                              {person.nationality && ` • ${person.nationality}`}
                              {person.content_count > 0 && ` • ${person.content_count} credits`}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searching && (
                  <div className="text-center py-3">
                    <RefreshCw size={16} className="animate-spin text-purple-500 mx-auto" />
                    <p className="text-gray-400 text-xs mt-1">Searching...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white border-b border-gray-700 pb-1">
              Role Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Role Type *
                </label>
                <select
                  value={formData.role_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, role_type: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Credit Type
                </label>
                <select
                  value={formData.credit_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, credit_type: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  <option value="supporting">Supporting</option>
                  <option value="starring">Starring</option>
                  <option value="guest">Guest</option>
                  <option value="cameo">Cameo</option>
                  <option value="voice">Voice</option>
                </select>
              </div>
            </div>

            {formData.role_type === 'actor' && (
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Character Name
                </label>
                <input
                  type="text"
                  value={formData.character_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, character_name: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                  placeholder="Enter character name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Role Description
              </label>
              <textarea
                value={formData.role_description}
                onChange={(e) => setFormData(prev => ({ ...prev, role_description: e.target.value }))}
                rows={2}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none text-sm"
                placeholder="Describe the role or responsibilities..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Billing Order
              </label>
              <input
                type="number"
                value={formData.billing_order}
                onChange={(e) => setFormData(prev => ({ ...prev, billing_order: parseInt(e.target.value) || 0 }))}
                min="0"
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
              />
            </div>
            
            {content.content_type === 'series' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Season
                  </label>
                  <input
                    type="number"
                    value={formData.season_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, season_number: e.target.value }))}
                    min="1"
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Episode
                  </label>
                  <input
                    type="number"
                    value={formData.episode_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, episode_number: e.target.value }))}
                    min="1"
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 scale-90"
            />
            <label htmlFor="is_featured" className="text-xs text-gray-300">
              Mark as featured role
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedPerson}
              className="flex items-center gap-1 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  Add to Cast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CastingTab;