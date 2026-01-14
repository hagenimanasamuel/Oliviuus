import React from "react";
import Alert from "../../../../../ui/Alert.jsx";
import { Edit2, Users, Shield, Calendar, CheckCircle } from "lucide-react";

export default function RolesList({ roles, onSelectRole, loading, error }) {
  const getRoleBadge = (roleName) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      moderator: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      user: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      distributor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    };
    
    const roleKey = roleName?.toLowerCase();
    return colors[roleKey] || colors.viewer;
  };

  // Safe data extraction function
  const getRoleData = (role) => {
    return {
      id: role.id || role._id,
      role_name: role.role_name || role.name || 'Unnamed Role',
      role_code: role.role_code || role.code || 'unknown',
      description: role.description || '',
      features: role.features || [],
      userCount: role.userCount || role.users_count || role.assignedUsers || 0,
      created_at: role.created_at || role.createdAt || role.created_date || new Date().toISOString()
    };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BC8BBC] bg-opacity-10 rounded-lg">
              <Shield className="w-5 h-5 text-[#BC8BBC]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Roles & Permissions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Array.isArray(roles) ? roles.length : 0} role{roles.length !== 1 ? 's' : ''} in the system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-6 mt-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Empty State */}
      {!loading && (!Array.isArray(roles) || roles.length === 0) && (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No roles created</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Get started by creating your first role to manage user permissions and access levels.
          </p>
        </div>
      )}

      {/* Roles Grid */}
      {!loading && Array.isArray(roles) && roles.length > 0 && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const roleData = getRoleData(role);
              
              return (
                <div
                  key={roleData.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-[#BC8BBC] hover:shadow-md transition-all duration-200 group cursor-pointer relative"
                  onClick={() => onSelectRole(roleData)}
                >
                  {/* Role Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                        <Shield className="w-4 h-4 text-[#BC8BBC]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#BC8BBC] transition-colors">
                          {roleData.role_name}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(roleData.role_code)}`}>
                          {roleData.role_code}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRole(roleData);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-all"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#BC8BBC]" />
                    </button>
                  </div>

                  {/* Description */}
                  {roleData.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {roleData.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{roleData.userCount} users</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>{roleData.features.length} features</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(roleData.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-6 py-2 text-xs text-gray-500 border-t">
          Debug: Received {Array.isArray(roles) ? roles.length : 'non-array'} roles
          {Array.isArray(roles) && roles.length > 0 && (
            <pre className="mt-1 text-xs">{JSON.stringify(roles[0], null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}