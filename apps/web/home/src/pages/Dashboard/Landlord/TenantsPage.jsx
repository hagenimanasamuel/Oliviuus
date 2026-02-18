// src/pages/Dashboard/Landlord/pages/TenantsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Home,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  History,
  Building2,
  CreditCard,
  Award,
  ThumbsUp,
  AlertTriangle,
  Info,
  X,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  UserCheck  
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { format, differenceInDays } from 'date-fns';

// ============================================
// SKELETON LOADING COMPONENTS
// ============================================

const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="mt-2 h-3 bg-gray-200 rounded w-20"></div>
  </div>
);

const TenantCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-100 rounded w-24"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-full"></div>
          <div className="h-3 bg-gray-100 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  </div>
);

const ModalSkeleton = () => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-md w-full p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
        <div className="h-4 bg-gray-100 rounded w-64 mx-auto"></div>
        <div className="h-24 bg-gray-100 rounded-lg"></div>
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-10 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  </div>
);

const TenantsPage = () => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [stats, setStats] = useState(null);
  const [tenantHistory, setTenantHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'past', 'all'
  const [modalLoading, setModalLoading] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    propertyId: '',
    sortBy: 'recent'
  });
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [properties, setProperties] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    limit: 12,
    offset: 0,
    total: 0,
    hasMore: false
  });
  
  // Colors
  const colors = {
    primary: '#BC8BBC',
    primaryDark: '#8A5A8A',
    primaryLight: '#E6D3E6',
    secondary: '#F8F0F8',
    accent: '#D4A5D4'
  };

  // ============================================
  // FETCH DATA
  // ============================================
  
  useEffect(() => {
    fetchAllData();
  }, [pagination.offset, filters, activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTenants(),
        fetchStats(),
        fetchProperties()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        type: activeTab,
        ...(filters.search && { search: filters.search }),
        ...(filters.propertyId && { propertyId: filters.propertyId }),
        ...(filters.sortBy && { sortBy: filters.sortBy })
      });

      const response = await api.get(`/landlord/tenants?${params}`);
      
      if (response.data.success) {
        setTenants(response.data.data.tenants);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          hasMore: response.data.data.pagination.hasMore
        }));
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/landlord/tenants/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get('/isanzure/properties/landlord');
      if (response.data.success) {
        setProperties(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchTenantHistory = async (tenantId) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/landlord/tenants/${tenantId}/history`);
      if (response.data.success) {
        setTenantHistory(response.data.data);
        setShowHistoryModal(true);
      }
    } catch (error) {
      console.error('Error fetching tenant history:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchTenantDetails = async (tenantId) => {
    setModalLoading(true);
    try {
      const response = await api.get(`/landlord/tenants/${tenantId}`);
      if (response.data.success) {
        setSelectedTenant(response.data.data);
        setShowTenantDetails(true);
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // ============================================
  // ACTIONS
  // ============================================
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTenant) return;
    
    setProcessingId(selectedTenant.id);
    setModalLoading(true);
    
    try {
      const response = await api.post(`/landlord/tenants/${selectedTenant.id}/message`, {
        message: messageText
      });
      
      if (response.data.success) {
        setMessageText('');
        setShowMessageModal(false);
        alert('Message sent successfully');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setProcessingId(null);
      setModalLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      propertyId: '',
      sortBy: 'recent'
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const closeAllModals = () => {
    setShowTenantDetails(false);
    setShowMessageModal(false);
    setShowHistoryModal(false);
    setSelectedTenant(null);
    setMessageText('');
    setTenantHistory([]);
  };

  // ============================================
  // UTILITIES
  // ============================================
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const getTenantStatus = (tenant) => {
    if (tenant.current_booking) {
      const today = new Date();
      const endDate = new Date(tenant.current_booking.end_date);
      const daysLeft = differenceInDays(endDate, today);
      
      if (daysLeft < 0) {
        return { 
          label: 'Overdue', 
          color: 'text-red-600 bg-red-50', 
          icon: AlertTriangle,
          badge: 'bg-red-100 text-red-800'
        };
      }
      if (daysLeft <= 7) {
        return { 
          label: 'Leaving soon', 
          color: 'text-yellow-600 bg-yellow-50', 
          icon: Clock,
          badge: 'bg-yellow-100 text-yellow-800'
        };
      }
      return { 
        label: 'Active', 
        color: 'text-green-600 bg-green-50', 
        icon: Home,
        badge: 'bg-green-100 text-green-800'
      };
    }
    return { 
      label: 'Past tenant', 
      color: 'text-gray-600 bg-gray-50', 
      icon: History,
      badge: 'bg-gray-100 text-gray-800'
    };
  };

  const getPaymentStatus = (tenant) => {
    if (!tenant.current_booking?.payment) return null;
    
    const status = tenant.current_booking.payment.status;
    if (status === 'paid') {
      return { 
        label: 'Paid', 
        color: 'text-green-600', 
        icon: CheckCircle,
        badge: 'bg-green-100 text-green-800'
      };
    }
    if (status === 'pending') {
      return { 
        label: 'Pending', 
        color: 'text-yellow-600', 
        icon: Clock,
        badge: 'bg-yellow-100 text-yellow-800'
      };
    }
    if (status === 'overdue') {
      return { 
        label: 'Overdue', 
        color: 'text-red-600', 
        icon: AlertCircle,
        badge: 'bg-red-100 text-red-800'
      };
    }
    return null;
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (initialLoad) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatsCardSkeleton key={i} />)}
        </div>

        {/* Filter Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-6 border-b border-gray-200 pb-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
          ))}
        </div>

        {/* Tenant Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <TenantCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-1">View and manage all your tenants</p>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <StatsCardSkeleton key={i} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.current_tenants || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <Users className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Across {stats.active_properties || 0} properties
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tenants (All Time)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_tenants || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <History className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              +{stats.new_this_month || 0} this month
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthly_revenue)}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <DollarSign className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              From {stats.active_bookings || 0} active bookings
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Stay Duration</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avg_stay_duration || 0} days</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <Calendar className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.retention_rate || 0}% retention rate
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants by name, phone, email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              style={{ focusRingColor: colors.primary }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">Filters</span>
              <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              onClick={fetchTenants}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {showFilterMenu && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Property</label>
              <select
                value={filters.propertyId}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="stay_long">Longest Stay</option>
                <option value="stay_short">Shortest Stay</option>
                <option value="payment_high">Highest Payment</option>
              </select>
            </div>
            
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'current'
                ? `border-[${colors.primary}] text-[${colors.primary}]`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Current Tenants</span>
            {stats?.current_tenants > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                {stats.current_tenants}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('past')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'past'
                ? `border-[${colors.primary}] text-[${colors.primary}]`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Past Tenants</span>
            {stats?.past_tenants > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                {stats.past_tenants}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('all')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'all'
                ? `border-[${colors.primary}] text-[${colors.primary}]`
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>All Tenants</span>
          </button>
        </nav>
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <TenantCardSkeleton key={i} />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="p-4 rounded-full bg-gray-100 mb-4">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'current' 
                ? "You don't have any current tenants. When tenants check in, they'll appear here."
                : activeTab === 'past'
                ? "No past tenants found. When tenants complete their stay, they'll appear here."
                : "No tenants found. Try adjusting your filters."}
            </p>
            {activeTab !== 'current' && (
              <button
                onClick={() => setActiveTab('current')}
                className="px-6 py-2 rounded-lg text-white"
                style={{ backgroundColor: colors.primary }}
              >
                View Current Tenants
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map(tenant => {
              const status = getTenantStatus(tenant);
              const payment = getPaymentStatus(tenant);
              const StatusIcon = status.icon;
              const PaymentIcon = payment?.icon;
              
              return (
                <div
                  key={tenant.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      {tenant.avatar ? (
                        <img
                          src={tenant.avatar}
                          alt={tenant.full_name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                      )}
                      {/* Only show verified badge - no other verification info */}
                      {tenant.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{tenant.full_name}</h3>
                          <p className="text-sm text-gray-500">Member since {formatDate(tenant.created_at)}</p>
                        </div>
                        <button
                          onClick={() => fetchTenantDetails(tenant.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>

                      {/* Badges - only status and payment, no verification badge */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.badge}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                        
                        {payment && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${payment.badge}`}>
                            <PaymentIcon className="h-3 w-3" />
                            {payment.label}
                          </span>
                        )}
                      </div>

                      {/* Current Booking */}
                      {tenant.current_booking && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <Home className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{tenant.current_booking.property_title}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(tenant.current_booking.start_date)} - {formatDate(tenant.current_booking.end_date)}
                            </div>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(tenant.current_booking.total_amount)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="mt-3 space-y-1">
                        {tenant.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </div>
                        )}
                        {tenant.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="h-3 w-3" />
                            {tenant.email}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowMessageModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <MessageSquare className="h-4 w-4" style={{ color: colors.primary }} />
                          Message
                        </button>
                        <button
                          onClick={() => fetchTenantHistory(tenant.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <History className="h-4 w-4" style={{ color: colors.primary }} />
                          History
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + tenants.length, pagination.total)} of {pagination.total} tenants
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0 || loading}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={!pagination.hasMore || loading}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== MODALS ========== */}

      {/* Tenant Details Modal */}
      {showTenantDetails && selectedTenant && (
        modalLoading ? <ModalSkeleton /> : (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tenant Details</h2>
                <button
                  onClick={closeAllModals}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Header - No verification details shown */}
                <div className="flex items-start gap-4">
                  {selectedTenant.avatar ? (
                    <img
                      src={selectedTenant.avatar}
                      alt={selectedTenant.full_name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{selectedTenant.full_name}</h3>
                      {/* Only show verified badge if verified - no text */}
                      {selectedTenant.is_verified && (
                        <Shield className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-gray-600">Member since {formatDate(selectedTenant.created_at)}</p>
                    
                    {/* Stats */}
                    <div className="flex gap-4 mt-3">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedTenant.total_stays || 0}</p>
                        <p className="text-xs text-gray-500">Total Stays</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedTenant.total_spent || 0)}</p>
                        <p className="text-xs text-gray-500">Total Spent</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{selectedTenant.avg_stay_duration || 0}</p>
                        <p className="text-xs text-gray-500">Avg. Stay (days)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info - No verification section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" style={{ color: colors.primary }} />
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    {selectedTenant.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedTenant.phone}</span>
                      </div>
                    )}
                    {selectedTenant.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedTenant.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Booking */}
                {selectedTenant.current_booking && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Current Stay
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{selectedTenant.current_booking.property_title}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(selectedTenant.current_booking.start_date)} - {formatDate(selectedTenant.current_booking.end_date)}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(selectedTenant.current_booking.total_amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          Duration: {selectedTenant.current_booking.duration} {selectedTenant.current_booking.booking_period}(s)
                        </span>
                        {selectedTenant.current_booking.payment && (
                          <span className={`flex items-center gap-1 ${
                            selectedTenant.current_booking.payment.status === 'paid' ? 'text-green-600' :
                            selectedTenant.current_booking.payment.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            <CreditCard className="h-4 w-4" />
                            {selectedTenant.current_booking.payment.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowTenantDetails(false);
                      setShowMessageModal(true);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </button>
                  <button
                    onClick={() => {
                      setShowTenantDetails(false);
                      fetchTenantHistory(selectedTenant.id);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </button>
                  <button
                    onClick={closeAllModals}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Tenant History Modal */}
      {showHistoryModal && (
        modalLoading ? <ModalSkeleton /> : (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedTenant?.full_name}'s Stay History
                </h2>
                <button
                  onClick={closeAllModals}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                {tenantHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No stay history found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tenantHistory.map((stay, index) => (
                      <div key={stay.id} className="relative">
                        {index < tenantHistory.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                        )}
                        <div className="flex gap-4">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              stay.status === 'completed' ? 'bg-green-100' :
                              stay.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {stay.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : stay.status === 'cancelled' ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <Home className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{stay.property?.title}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  stay.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  stay.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {stay.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-500">Check-in</p>
                                  <p className="font-medium">{formatDate(stay.start_date)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Check-out</p>
                                  <p className="font-medium">{formatDate(stay.end_date)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Duration</p>
                                  <p className="font-medium">{stay.duration} {stay.booking_period}(s)</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Amount</p>
                                  <p className="font-medium">{formatCurrency(stay.total_amount)}</p>
                                </div>
                              </div>
                              {stay.payment && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-sm">
                                    Payment: <span className={
                                      stay.payment.status === 'paid' ? 'text-green-600' :
                                      stay.payment.status === 'pending' ? 'text-yellow-600' :
                                      'text-red-600'
                                    }>{stay.payment.status}</span>
                                  </p>
                                </div>
                              )}
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
        )
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedTenant && (
        modalLoading ? <ModalSkeleton /> : (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                    <MessageSquare className="h-5 w-5" style={{ color: colors.primary }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Send Message</h3>
                    <p className="text-sm text-gray-600">
                      To: {selectedTenant.full_name}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message here..."
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none resize-none"
                    style={{ focusRingColor: colors.primary }}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || processingId === selectedTenant.id}
                    className="flex-1 py-3 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: colors.primary }}
                  >
                    {processingId === selectedTenant.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                  <button
                    onClick={closeAllModals}
                    className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TenantsPage;