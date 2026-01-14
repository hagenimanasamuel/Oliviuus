import React, { useState, useEffect } from "react";
import RolesList from "../../../../components/layout/dashboard/admin/users/roles&permission/RolesList";
import RoleForm from "../../../../components/layout/dashboard/admin/users/roles&permission/RoleForm";
import axios from "../../../../api/axios";
import { Shield, Plus, RefreshCw } from "lucide-react";

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("/roles");
      
      // Handle different API response formats
      let rolesData = [];
      
      if (response.data) {
        // Format 1: Direct array
        if (Array.isArray(response.data)) {
          rolesData = response.data;
        }
        // Format 2: { data: [...] }
        else if (Array.isArray(response.data.data)) {
          rolesData = response.data.data;
        }
        // Format 3: { success: true, roles: [...] }
        else if (response.data.success && Array.isArray(response.data.roles)) {
          rolesData = response.data.roles;
        }
        // Format 4: { results: [...] }
        else if (Array.isArray(response.data.results)) {
          rolesData = response.data.results;
        }
        // Format 5: Single object (wrap in array)
        else if (typeof response.data === 'object' && response.data !== null) {
          rolesData = [response.data];
        }
      }
      
      console.log('Fetched roles data:', rolesData); // Debug log
      setRoles(rolesData);
      
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          "Failed to load roles. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEditRole = (role) => {
    console.log('Editing role:', role); // Debug log
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  const handleRetry = () => {
    fetchRoles();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Enhanced Responsive Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#BC8BBC] bg-opacity-10 rounded-lg">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#BC8BBC]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Roles & Permissions
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : `${roles.length} role${roles.length !== 1 ? 's' : ''} in system`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRetry}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
            title="Refresh roles"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Create Role Button */}
          <button
            onClick={handleCreateRole}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#9b69b2] disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:inline">Create Role</span>
          </button>
        </div>
      </header>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Debug Info:</strong>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Roles Count: {roles.length}</div>
            <div>Error: {error || 'None'}</div>
            <div>API Response Sample: {roles[0] ? JSON.stringify(roles[0]).substring(0, 100) + '...' : 'No data'}</div>
          </div>
        </div>
      )}

      {/* Roles list */}
      <div className="min-h-[400px]">
        <RolesList
          roles={roles}
          loading={loading}
          error={error}
          onSelectRole={handleEditRole}
        />
      </div>

      {/* Role Form Modal */}
      {isFormOpen && (
        <RoleForm
          role={selectedRole}
          onClose={handleCloseForm}
          onSave={fetchRoles}
        />
      )}
    </div>
  );
}