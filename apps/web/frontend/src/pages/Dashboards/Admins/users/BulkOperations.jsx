import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, Mail, Shield, CreditCard, Trash2, Zap, Filter, 
  CheckCircle, XCircle, Clock, Download, Upload,
  ChevronDown, ChevronUp, AlertTriangle, Info, RefreshCw,
  LogOut, Calendar, UserX, UserCheck, Ban, Play, Pause,
  Settings, Plus, Minus, Eye, EyeOff, Lock, Unlock, Phone,
  Search, User
} from "lucide-react";
import clsx from "clsx";
import api from "../../../../api/axios";
import { useTranslation } from "react-i18next";

// Helper function to get user display name
const getUserDisplayName = (userData) => {
  if (!userData) return 'User';
  
  // Priority: username > full name > email prefix > phone > fallback
  if (userData.username) return userData.username;
  
  if (userData.first_name) {
    return `${userData.first_name} ${userData.last_name || ''}`.trim();
  }
  
  if (userData.email) {
    return userData.email.split('@')[0];
  }
  
  if (userData.phone) {
    return `User (${userData.phone.substring(userData.phone.length - 4)})`;
  }
  
  return 'User';
};

// Helper function to get user identifier
const getUserIdentifier = (userData) => {
  if (!userData) return 'No identifier';
  
  // Show the primary identifier
  if (userData.email) return userData.email;
  if (userData.phone) return userData.phone;
  if (userData.username) return `@${userData.username}`;
  
  return 'No identifier';
};

const BulkOperations = () => {
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    subscription: ""
  });
  const [operation, setOperation] = useState({
    type: "notification",
    title: "",
    message: "",
    subscriptionType: "",
    customSubscription: {
      name: "",
      type: "custom",
      price: 0,
      currency: "RWF",
      duration_months: 1
    },
    role: "viewer",
    sendType: "both",
    userStatus: "active",
    sessionAction: "logout_all"
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState(null);
  const [showCustomSubscription, setShowCustomSubscription] = useState(false);

  const operationTypes = [
    { 
      id: "notification", 
      label: "Send Notification", 
      icon: Mail, 
      description: "Send push notifications to selected users",
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    { 
      id: "email", 
      label: "Send Email", 
      icon: Mail, 
      description: "Send email messages to selected users",
      color: "text-green-400",
      bg: "bg-green-400/10"
    },
    { 
      id: "subscription", 
      label: "Update Subscription", 
      icon: CreditCard, 
      description: "Change subscription plans for selected users",
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
    { 
      id: "role", 
      label: "Change Role", 
      icon: Shield, 
      description: "Update user roles and permissions",
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
    { 
      id: "status", 
      label: "Change Status", 
      icon: UserCheck, 
      description: "Activate or deactivate user accounts",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10"
    },
    { 
      id: "session", 
      label: "Session Management", 
      icon: LogOut, 
      description: "Manage user sessions and logouts",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10"
    },
    { 
      id: "delete", 
      label: "Delete Users", 
      icon: Trash2, 
      description: "Permanently delete user accounts",
      color: "text-red-400",
      bg: "bg-red-400/10",
      destructive: true
    }
  ];

  const userRoles = [
    { value: "viewer", label: "Viewer" },
    { value: "admin", label: "Admin" }
  ];

  const statusOptions = [
    { value: "active", label: "Activate", icon: UserCheck, color: "text-green-400" },
    { value: "inactive", label: "Deactivate", icon: UserX, color: "text-red-400" }
  ];

  const sessionActions = [
    { value: "logout_all", label: "Logout All Sessions", description: "Logout users from all devices" },
    { value: "logout_specific", label: "Logout Specific Sessions", description: "Logout from specific session types" },
    { value: "clear_old", label: "Clear Old Sessions", description: "Remove sessions older than 30 days" }
  ];

  // Fetch all users with multiple identifiers support
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/user', {
        params: { 
          limit: 1000,
          include_display_name: true // Request backend to include display_name
        }
      });
      
      const users = response.data.users || [];
      
      // Process users to ensure they have display_name
      const processedUsers = users.map(user => ({
        ...user,
        display_name: user.display_name || getUserDisplayName(user),
        identifier: getUserIdentifier(user),
        // Ensure we have fallback values for all fields
        email: user.email || null,
        phone: user.phone || null,
        username: user.username || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null
      }));
      
      setAllUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch ALL subscription plans from database including free
  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      setIsLoadingPlans(true);
      const response = await api.get('/subscriptions/plans');
      const plans = response.data.subscriptions || response.data.plans || [];
      
      const mappedPlans = plans.map(plan => ({
        value: plan.type || plan.name,
        label: plan.name,
        price: plan.price || 0,
        currency: plan.currency || 'RWF',
        description: plan.description,
        is_free: plan.price === 0
      }));
      
      setSubscriptionPlans(mappedPlans);
      
      if (mappedPlans.length > 0 && !operation.subscriptionType) {
        const freePlan = mappedPlans.find(p => p.is_free) || mappedPlans[0];
        setOperation(prev => ({ ...prev, subscriptionType: freePlan.value }));
      }
    } catch (error) {
      console.error("❌ Failed to fetch subscription plans:", error);
      setSubscriptionPlans([
        { value: "free", label: "Free", price: 0, currency: "RWF", is_free: true },
        { value: "basic", label: "Basic", price: 4900, currency: "RWF", is_free: false },
        { value: "standard", label: "Standard", price: 8900, currency: "RWF", is_free: false },
        { value: "mobile", label: "Premium", price: 12900, currency: "RWF", is_free: false },
        { value: "family", label: "Family", price: 15900, currency: "RWF", is_free: false }
      ]);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [operation.subscriptionType]);

  useEffect(() => {
    fetchUsers();
    fetchSubscriptionPlans();
  }, [fetchUsers, fetchSubscriptionPlans]);

  // Apply filters with multiple identifier support
  useEffect(() => {
    let filtered = allUsers;
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => {
        // Search in all possible fields
        const searchFields = [
          user.email?.toLowerCase() || '',
          user.phone?.toLowerCase() || '',
          user.username?.toLowerCase() || '',
          user.first_name?.toLowerCase() || '',
          user.last_name?.toLowerCase() || '',
          user.display_name?.toLowerCase() || '',
          // Search in email prefix
          user.email?.split('@')[0]?.toLowerCase() || ''
        ];
        
        return searchFields.some(field => field.includes(searchTerm));
      });
    }

    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.status) {
      filtered = filtered.filter(user => 
        filters.status === "active" ? user.is_active : !user.is_active
      );
    }

    if (filters.subscription) {
      filtered = filtered.filter(user => 
        user.global_account_tier === filters.subscription || 
        user.subscription_plan === filters.subscription
      );
    }

    setFilteredUsers(filtered);
  }, [allUsers, filters]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleCustomSubscriptionChange = (field, value) => {
    setOperation(prev => ({
      ...prev,
      customSubscription: {
        ...prev.customSubscription,
        [field]: value
      }
    }));
  };

  const handleExecuteOperation = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user");
      return;
    }

    if ((operation.type === "notification" || operation.type === "email") && 
        (!operation.title.trim() || !operation.message.trim())) {
      alert("Please fill in both title and message");
      return;
    }

    if (operation.type === "subscription" && !operation.subscriptionType && !showCustomSubscription) {
      alert("Please select a subscription plan or create a custom one");
      return;
    }

    if (showCustomSubscription && (!operation.customSubscription.name.trim() || operation.customSubscription.price < 0)) {
      alert("Please fill in all required fields for custom subscription");
      return;
    }

    if (!window.confirm(`Are you sure you want to perform this operation on ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      setResults(null);

      const payload = {
        userIds: selectedUsers,
        operation: operation.type,
        ...operation,
        ...(showCustomSubscription && { 
          customSubscription: operation.customSubscription 
        })
      };

      const response = await api.post('/user/bulk-operations', payload);
      setResults(response.data);
      
      await fetchUsers();
      
    } catch (error) {
      console.error("❌ Bulk operation failed:", error);
      alert(error.response?.data?.message || error.response?.data?.error || "Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedCounts = () => {
    const selectedUserObjects = allUsers.filter(user => selectedUsers.includes(user.id));
    return {
      total: selectedUsers.length,
      active: selectedUserObjects.filter(user => user.is_active).length,
      admins: selectedUserObjects.filter(user => user.role === 'admin').length,
      premium: selectedUserObjects.filter(user => user.global_account_tier === 'premium' || user.subscription_plan === 'premium').length
    };
  };

  const selectedCounts = getSelectedCounts();

  const getPlanLabel = (planType) => {
    const plan = subscriptionPlans.find(p => p.value === planType);
    return plan ? `${plan.label} - ${plan.currency} ${plan.price}` : planType;
  };

  // Render user identifier based on available data
  const renderUserIdentifier = (user) => {
    if (user.email) {
      return (
        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
          <Mail className="w-3 h-3 lg:w-4 lg:h-4" />
          <span className="truncate">{user.email}</span>
        </div>
      );
    }
    
    if (user.phone) {
      return (
        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
          <Phone className="w-3 h-3 lg:w-4 lg:h-4" />
          <span className="truncate">{user.phone}</span>
        </div>
      );
    }
    
    if (user.username) {
      return (
        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
          <User className="w-3 h-3 lg:w-4 lg:h-4" />
          <span className="truncate">@{user.username}</span>
        </div>
      );
    }
    
    return (
      <div className="text-gray-500 dark:text-gray-400 italic">
        No identifier
      </div>
    );
  };

  // Render user name info
  const renderUserName = (user) => {
    if (user.first_name) {
      return (
        <span className="text-gray-900 dark:text-white">
          {user.first_name} {user.last_name || ''}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 lg:w-7 lg:h-7" />
            Bulk Operations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base mt-1">
            Perform actions on multiple users at once
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-sm lg:text-base text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
            {selectedCounts.total} users selected
          </div>
        </div>
      </div>

      {/* Operation Type Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
          Operation Type
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3">
          {operationTypes.map(op => (
            <button
              key={op.id}
              onClick={() => setOperation(prev => ({ ...prev, type: op.id }))}
              className={clsx(
                "w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm min-h-[80px]",
                operation.type === op.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx("p-2 rounded-lg flex-shrink-0", op.bg)}>
                  <op.icon className={clsx("w-4 h-4 lg:w-5 lg:h-5", op.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    "font-medium truncate text-sm lg:text-base",
                    operation.type === op.id ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                  )}>
                    {op.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {op.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Users List */}
        <div className="xl:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search by email, phone, username, or name..."
                    className="w-full pl-10 pr-4 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                >
                  <option value="">All Roles</option>
                  {userRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 lg:w-5 lg:h-5"
                />
                <span className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300">
                  Select All ({filteredUsers.length} users)
                </span>
              </div>
              <div className="text-sm lg:text-base text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                {selectedCounts.total} selected
              </div>
            </div>

            <div className="max-h-96 lg:max-h-[500px] xl:max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-12 lg:py-16">
                  <div className="animate-spin rounded-full h-8 w-8 lg:h-10 lg:w-10 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 lg:py-16">
                  <Users className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm lg:text-base">No users found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="p-4 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          {/* Display Name */}
                          <div className="mb-2">
                            <p className="text-sm lg:text-base font-medium text-gray-900 dark:text-white truncate">
                              {user.display_name}
                            </p>
                            {renderUserName(user) && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {renderUserName(user)}
                              </p>
                            )}
                          </div>
                          
                          {/* Identifiers */}
                          <div className="mb-3 lg:mb-4">
                            {renderUserIdentifier(user)}
                          </div>
                          
                          {/* Tags and metadata */}
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                            <div className="flex flex-wrap gap-2">
                              <span className={clsx(
                                "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                                user.role === 'admin' 
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              )}>
                                {user.role}
                              </span>
                              <span className={clsx(
                                "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                                user.is_active
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              )}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {user.global_account_tier && user.global_account_tier !== 'free' && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 flex-shrink-0">
                                  {user.global_account_tier}
                                </span>
                              )}
                            </div>
                            
                            <span className="text-xs text-gray-500 truncate">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Operation Configuration & Results */}
        <div className="space-y-6">
          {/* Operation Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
              Operation Details
            </h3>

            <div className="space-y-4 lg:space-y-5">
              {/* Notification/Email Configuration */}
              {(operation.type === "notification" || operation.type === "email") && (
                <>
                  <div>
                    <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={operation.title}
                      onChange={(e) => setOperation(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter message title"
                      className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                      Message *
                    </label>
                    <textarea
                      value={operation.message}
                      onChange={(e) => setOperation(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message here..."
                      rows={4}
                      className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base resize-vertical min-h-[100px]"
                    />
                  </div>

                  {operation.type === "notification" && (
                    <div>
                      <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                        Send As
                      </label>
                      <select
                        value={operation.sendType}
                        onChange={(e) => setOperation(prev => ({ ...prev, sendType: e.target.value }))}
                        className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                      >
                        <option value="notification">Notification Only</option>
                        <option value="both">Both Notification & Email</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Subscription Configuration */}
              {operation.type === "subscription" && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300">
                      Subscription Type
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomSubscription(!showCustomSubscription)}
                      className="flex items-center gap-1 px-3 py-1 lg:py-2 text-xs lg:text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                    >
                      <Settings className="w-3 h-3 lg:w-4 lg:h-4" />
                      {showCustomSubscription ? "Use Existing" : "Custom Plan"}
                    </button>
                  </div>

                  {showCustomSubscription ? (
                    <div className="space-y-3 p-3 lg:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                        <div className="xs:col-span-2">
                          <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Plan Name *
                          </label>
                          <input
                            type="text"
                            value={operation.customSubscription.name}
                            onChange={(e) => handleCustomSubscriptionChange('name', e.target.value)}
                            placeholder="e.g., Enterprise Plan"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price *
                          </label>
                          <input
                            type="number"
                            value={operation.customSubscription.price}
                            onChange={(e) => handleCustomSubscriptionChange('price', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Currency
                          </label>
                          <select
                            value={operation.customSubscription.currency}
                            onChange={(e) => handleCustomSubscriptionChange('currency', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="RWF">RWF</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>
                        <div className="xs:col-span-2">
                          <label className="block text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Duration (Months)
                          </label>
                          <input
                            type="number"
                            value={operation.customSubscription.duration_months}
                            onChange={(e) => handleCustomSubscriptionChange('duration_months', parseInt(e.target.value) || 1)}
                            placeholder="1"
                            min="1"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {isLoadingPlans ? (
                        <div className="flex items-center gap-2 text-sm lg:text-base text-gray-500">
                          <RefreshCw className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                          Loading plans...
                        </div>
                      ) : subscriptionPlans.length === 0 ? (
                        <div className="text-sm lg:text-base text-red-500">
                          No subscription plans available
                        </div>
                      ) : (
                        <select
                          value={operation.subscriptionType}
                          onChange={(e) => setOperation(prev => ({ ...prev, subscriptionType: e.target.value }))}
                          className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                        >
                          <option value="">Select a plan</option>
                          {subscriptionPlans.map(plan => (
                            <option key={plan.value} value={plan.value}>
                              {plan.label} - {plan.currency} {plan.price}
                            </option>
                          ))}
                        </select>
                      )}
                      {operation.subscriptionType && (
                        <p className="text-xs lg:text-sm text-gray-500 mt-2">
                          Selected: {getPlanLabel(operation.subscriptionType)}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Role Configuration */}
              {operation.type === "role" && (
                <div>
                  <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                    New Role
                  </label>
                  <select
                    value={operation.role}
                    onChange={(e) => setOperation(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 lg:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  >
                    {userRoles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Configuration */}
              {operation.type === "status" && (
                <div>
                  <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                    User Status
                  </label>
                  <div className="space-y-2">
                    {statusOptions.map(status => (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setOperation(prev => ({ ...prev, userStatus: status.value }))}
                        className={clsx(
                          "w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm flex items-center gap-3",
                          operation.userStatus === status.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        )}
                      >
                        <status.icon className={clsx("w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0", status.color)} />
                        <span className={clsx(
                          "font-medium text-sm lg:text-base",
                          operation.userStatus === status.value ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                        )}>
                          {status.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Management Configuration */}
              {operation.type === "session" && (
                <div>
                  <label className="block text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                    Session Action
                  </label>
                  <div className="space-y-2">
                    {sessionActions.map(action => (
                      <button
                        key={action.value}
                        type="button"
                        onClick={() => setOperation(prev => ({ ...prev, sessionAction: action.value }))}
                        className={clsx(
                          "w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm",
                          operation.sessionAction === action.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        )}
                      >
                        <div>
                          <p className={clsx(
                            "font-medium text-sm lg:text-base mb-1",
                            operation.sessionAction === action.value ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"
                          )}>
                            {action.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Warning */}
              {operation.type === "delete" && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold text-sm lg:text-base">Warning: Destructive Operation</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This will permanently delete {selectedCounts.total} user accounts and all their data. 
                    This action cannot be undone.
                  </p>
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={handleExecuteOperation}
                disabled={isProcessing || selectedCounts.total === 0 || 
                  (operation.type === "subscription" && !operation.subscriptionType && !showCustomSubscription) ||
                  (operation.type === "subscription" && showCustomSubscription && 
                   (!operation.customSubscription.name.trim() || operation.customSubscription.price < 0)) ||
                  ((operation.type === "notification" || operation.type === "email") && 
                   (!operation.title.trim() || !operation.message.trim()))
                }
                className={clsx(
                  "w-full py-3 lg:py-4 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center gap-2 text-sm lg:text-base",
                  operation.type === "delete" 
                    ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400 hover:shadow-lg transform hover:scale-[1.02]"
                    : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 hover:shadow-lg transform hover:scale-[1.02]",
                  isProcessing && "opacity-50 cursor-not-allowed transform-none hover:scale-100"
                )}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 lg:h-5 lg:w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>
                      Execute on {selectedCounts.total} Users
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          {results && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
                Operation Results
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Total Processed:</span>
                  <span className="font-medium text-sm lg:text-base">{results.processed}</span>
                </div>
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span className="text-sm lg:text-base">Successful:</span>
                  <span className="font-medium text-sm lg:text-base">{results.successful}</span>
                </div>
                <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                  <span className="text-sm lg:text-base">Failed:</span>
                  <span className="font-medium text-sm lg:text-base">{results.failed}</span>
                </div>
                {results.errors && results.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">Errors:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <p key={index} className="text-xs lg:text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;