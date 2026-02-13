// src/pages/Dashboard/Landlord/pages/BookingsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  User,
  DollarSign,
  TrendingUp,
  Download,
  CalendarDays,
  MessageSquare,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  Shield,
  Wallet,
  CreditCard,
  FileText,
  Percent,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { format } from 'date-fns';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [extensionResponse, setExtensionResponse] = useState({ action: '', note: '' });
  const [pendingRequests, setPendingRequests] = useState({ extensions: [], cancellations: [] });
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    propertyUid: '',
    period: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  });
  
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [properties, setProperties] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
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
    fetchBookings();
    fetchPendingRequests();
    fetchStats();
    fetchProperties();
    fetchAnalytics();
  }, [pagination.offset, filters, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        ...(filters.status && { status: filters.status }),
        ...(filters.propertyUid && { propertyUid: filters.propertyUid }),
        ...(filters.period && { period: filters.period }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search }),
        ...(activeTab !== 'all' && { status: activeTab })
      });

      const response = await api.get(`/landlord/bookings?${params}`);
      
      if (response.data.success) {
        setBookings(response.data.data.bookings);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          hasMore: response.data.data.pagination.hasMore
        }));
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/landlord/bookings/requests/pending');
      if (response.data.success) {
        setPendingRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/landlord/bookings/analytics/overview?period=month');
      if (response.data.success) {
        setStats(response.data.data.overview);
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/landlord/bookings/analytics/overview');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  // ============================================
  // ACTIONS
  // ============================================
  
  const handleUpdateStatus = async (bookingId, status) => {
    try {
      setProcessingId(bookingId);
      
      const response = await api.put(`/landlord/bookings/${bookingId}/status`, {
        status,
        reason: statusReason
      });
      
      if (response.data.success) {
        // Update local state
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status } : b
        ));
        
        // Refresh stats
        fetchStats();
        
        // Close modal
        setShowStatusModal(false);
        setStatusReason('');
        setStatusAction(null);
        
        // Show success message
        alert(`Booking ${status} successfully`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update booking status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExtensionResponse = async (extensionId, action) => {
    try {
      setProcessingId(extensionId);
      
      const response = await api.put(`/landlord/bookings/extensions/${extensionId}`, {
        action,
        responseNote: extensionResponse.note
      });
      
      if (response.data.success) {
        // Refresh data
        fetchPendingRequests();
        fetchBookings();
        
        // Close modal
        setShowExtensionModal(false);
        setExtensionResponse({ action: '', note: '' });
        
        alert(`Extension request ${action} successfully`);
      }
    } catch (error) {
      console.error('Error handling extension:', error);
      alert(error.response?.data?.message || 'Failed to process extension request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendMessage = async (bookingId) => {
    if (!messageText.trim()) return;
    
    try {
      setProcessingId(bookingId);
      
      const response = await api.post(`/landlord/bookings/${bookingId}/message`, {
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
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      window.open(`/api/landlord/bookings/export/data?${params}`, '_blank');
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const viewBookingDetails = async (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      propertyUid: '',
      period: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // ============================================
  // UTILITIES
  // ============================================
  
  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
      'confirmed': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle, label: 'Confirmed' },
      'active': { color: 'bg-green-100 text-green-800 border-green-200', icon: Home, label: 'Active' },
      'completed': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Check, label: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Cancelled' }
    };
    return badges[status] || badges.pending;
  };

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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (loading && bookings.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-1">Manage and respond to booking requests</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Pending Requests Badge */}
          {(pendingRequests.extensions?.length > 0 || pendingRequests.cancellations?.length > 0) && (
            <button
              onClick={() => setActiveTab('pending')}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">{pendingRequests.extensions.length + pendingRequests.cancellations.length} Pending</span>
            </button>
          )}
          
          {/* Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" style={{ color: colors.primary }} />
            <span className="text-gray-700">Analytics</span>
          </button>
          
          {/* Export Button */}
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" style={{ color: colors.primary }} />
            <span className="text-gray-700">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_bookings || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <Calendar className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.pending_bookings || 0} pending
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Stays</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_bookings || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <Home className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              {stats.confirmed_bookings || 0} upcoming
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <DollarSign className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              This month: {formatCurrency(stats.monthly_revenue)}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unique_tenants || 0}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <User className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Avg. booking: {formatCurrency(stats.average_booking_value)}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Stay</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_stay_duration || 0} days</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: colors.secondary }}>
                <Clock className="h-5 w-5" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {stats.completed_bookings || 0} completed
            </div>
          </div>
        </div>
      )}

      {/* Analytics Section */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Booking Analytics</h2>
            <button
              onClick={() => setShowAnalytics(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4" style={{ color: colors.primary }} />
                Bookings by Status
              </h3>
              <div className="space-y-2">
                {analytics.by_status?.map(item => {
                  const badge = getStatusBadge(item.status);
                  const Icon = badge.icon;
                  return (
                    <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${badge.color}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(item.total_revenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Top Properties */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Home className="h-4 w-4" style={{ color: colors.primary }} />
                Top Performing Properties
              </h3>
              <div className="space-y-2">
                {analytics.by_property?.slice(0, 5).map(property => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {property.cover_image ? (
                        <img 
                          src={property.cover_image} 
                          alt={property.title}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                          {property.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {property.total_bookings} bookings · {formatCurrency(property.total_revenue)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      {property.occupancy_rate || 0}% occupied
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Upcoming Check-ins */}
          {analytics.upcoming_checkins?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" style={{ color: colors.primary }} />
                Upcoming Check-ins (Next 7 Days)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.upcoming_checkins.map(checkin => (
                  <div key={checkin.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      {checkin.tenant_avatar ? (
                        <img 
                          src={checkin.tenant_avatar} 
                          alt={checkin.tenant_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{checkin.tenant_name}</p>
                        <p className="text-xs text-gray-600">{checkin.property_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blue-700">Check-in: {formatDate(checkin.start_date)}</span>
                      <span className="font-medium text-blue-800">{formatCurrency(checkin.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by booking ID, tenant name, property..."
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
              onClick={fetchBookings}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {showFilterMenu && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Property</label>
              <select
                value={filters.propertyUid}
                onChange={(e) => setFilters(prev => ({ ...prev, propertyUid: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              >
                <option value="">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.property_uid}>
                    {property.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking Period</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              >
                <option value="">All Periods</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="nightly">Nightly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, offset: 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:outline-none"
                style={{ focusRingColor: colors.primary }}
              />
            </div>
            
            <div className="md:col-span-3 lg:col-span-5 flex justify-end">
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
        <nav className="flex -mb-px space-x-6 overflow-x-auto">
          {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(tab => {
            const badge = getStatusBadge(tab);
            const Icon = badge.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab
                    ? 'border-[#BC8BBC] text-[#BC8BBC]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab !== 'all' && <Icon className="h-4 w-4" />}
                <span className="capitalize">{tab}</span>
                {tab === 'pending' && pendingRequests.extensions?.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                    {pendingRequests.extensions.length + pendingRequests.cancellations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="h-12 w-12 text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
                      <p className="text-gray-600">Try adjusting your filters or check back later</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map(booking => {
                  const statusBadge = getStatusBadge(booking.status);
                  const StatusIcon = statusBadge.icon;
                  const hasPendingExtension = booking.extensions?.pending > 0;
                  
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            #{booking.booking_uid.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(booking.created_at)}
                          </span>
                          {hasPendingExtension && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full w-fit">
                              <Clock className="h-3 w-3" />
                              Extension requested
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {booking.tenant.avatar ? (
                            <img 
                              src={booking.tenant.avatar} 
                              alt={booking.tenant.full_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.tenant.full_name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {booking.tenant.is_verified && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Shield className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {booking.property.cover_image ? (
                            <img 
                              src={booking.property.cover_image} 
                              alt={booking.property.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Home className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                              {booking.property.title}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.property.district || booking.property.sector || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {formatDate(booking.start_date)}
                          </span>
                          <span className="text-xs text-gray-500">
                            → {formatDate(booking.end_date)}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {booking.duration} {booking.booking_period}
                            {booking.duration > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(booking.total_amount)}
                          </span>
                          {booking.payment?.status === 'paid' ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Paid
                            </span>
                          ) : (
                            <span className="text-xs text-yellow-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {booking.payment?.status || 'Pending'}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewBookingDetails(booking)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setStatusAction('confirmed');
                                  setShowStatusModal(true);
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Confirm Booking"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setStatusAction('cancelled');
                                  setShowStatusModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancel Booking"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {booking.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setStatusAction('completed');
                                setShowStatusModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as Completed"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowMessageModal(true);
                            }}
                            className="p-1.5 text-[#BC8BBC] hover:bg-purple-50 rounded-lg transition-colors"
                            title="Send Message"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          
                          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + bookings.length, pagination.total)} of {pagination.total} bookings
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={!pagination.hasMore}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== MODALS ========== */}

      {/* Booking Details Modal */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setShowBookingDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedBooking.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                selectedBooking.status === 'confirmed' ? 'bg-blue-50 border border-blue-200' :
                selectedBooking.status === 'active' ? 'bg-green-50 border border-green-200' :
                selectedBooking.status === 'completed' ? 'bg-gray-50 border border-gray-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getStatusBadge(selectedBooking.status).icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        Booking {selectedBooking.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reference: {selectedBooking.booking_uid}
                      </p>
                    </div>
                  </div>
                  {selectedBooking.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowBookingDetails(false);
                          setStatusAction('confirmed');
                          setShowStatusModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => {
                          setShowBookingDetails(false);
                          setStatusAction('cancelled');
                          setShowStatusModal(true);
                        }}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Booking Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: colors.primary }} />
                      Stay Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Check-in</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(selectedBooking.start_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Check-out</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(selectedBooking.end_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Duration</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedBooking.duration} {selectedBooking.booking_period}
                          {selectedBooking.duration > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" style={{ color: colors.primary }} />
                      Payment Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(selectedBooking.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Payment Status</span>
                        <span className={`text-sm font-medium ${
                          selectedBooking.payment?.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {selectedBooking.payment?.status || 'Pending'}
                        </span>
                      </div>
                      {selectedBooking.payment?.method && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Payment Method</span>
                          <span className="text-sm text-gray-900 capitalize">
                            {selectedBooking.payment.method.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBooking.special_requests && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Special Requests</h3>
                      <p className="text-sm text-gray-600">{selectedBooking.special_requests}</p>
                    </div>
                  )}
                </div>

                {/* Right Column - Tenant Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" style={{ color: colors.primary }} />
                      Tenant Information
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      {selectedBooking.tenant.avatar ? (
                        <img 
                          src={selectedBooking.tenant.avatar} 
                          alt={selectedBooking.tenant.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedBooking.tenant.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedBooking.tenant.is_verified && (
                            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              <Shield className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                      {selectedBooking.tenant.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{selectedBooking.tenant.phone}</span>
                        </div>
                      )}
                      {selectedBooking.tenant.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{selectedBooking.tenant.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Home className="h-4 w-4" style={{ color: colors.primary }} />
                      Property Information
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                      {selectedBooking.property.cover_image ? (
                        <img 
                          src={selectedBooking.property.cover_image} 
                          alt={selectedBooking.property.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Home className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedBooking.property.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {selectedBooking.property.address || `${selectedBooking.property.district || ''}, ${selectedBooking.property.province || ''}`}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/property/${selectedBooking.property.uid}`}
                      className="mt-2 inline-flex items-center gap-1 text-sm"
                      style={{ color: colors.primary }}
                    >
                      View Property <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {selectedBooking.extensions?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Extension Requests</h3>
                      {selectedBooking.extensions.map(ext => (
                        <div key={ext.id} className="border-b last:border-0 border-gray-200 py-2 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              +{ext.additional_periods} {selectedBooking.booking_period}(s)
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              ext.status === 'approved' ? 'bg-green-100 text-green-800' :
                              ext.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {ext.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            New end date: {formatDate(ext.new_end_date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBookingDetails(false);
                    setSelectedBooking(selectedBooking);
                    setShowMessageModal(true);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-full mb-4 ${
                  statusAction === 'confirmed' ? 'bg-green-100' :
                  statusAction === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {statusAction === 'confirmed' && <CheckCircle className="h-6 w-6 text-green-600" />}
                  {statusAction === 'cancelled' && <XCircle className="h-6 w-6 text-red-600" />}
                  {statusAction === 'completed' && <Check className="h-6 w-6 text-blue-600" />}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {statusAction === 'confirmed' && 'Confirm Booking'}
                  {statusAction === 'cancelled' && 'Cancel Booking'}
                  {statusAction === 'completed' && 'Mark as Completed'}
                </h3>
                <p className="text-gray-600">
                  {statusAction === 'confirmed' && 'Are you sure you want to confirm this booking?'}
                  {statusAction === 'cancelled' && 'This action cannot be undone. The tenant will be notified.'}
                  {statusAction === 'completed' && 'Mark this booking as completed?'}
                </p>
              </div>

              {(statusAction === 'cancelled' || statusAction === 'rejected') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Please provide a reason..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                    style={{ focusRingColor: colors.primary }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.id, statusAction)}
                  disabled={processingId === selectedBooking.id}
                  className={`flex-1 py-3 rounded-lg font-medium text-white ${
                    statusAction === 'confirmed' ? 'bg-green-600 hover:bg-green-700' :
                    statusAction === 'cancelled' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processingId === selectedBooking.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    'Confirm'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusReason('');
                    setStatusAction(null);
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedBooking && (
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
                    To: {selectedBooking.tenant.full_name}
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
                  onClick={() => handleSendMessage(selectedBooking.id)}
                  disabled={!messageText.trim() || processingId === selectedBooking.id}
                  className="flex-1 py-3 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: colors.primary,
                    hover: { backgroundColor: colors.primaryDark }
                  }}
                >
                  {processingId === selectedBooking.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageText('');
                  }}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extension Request Modal */}
      {showExtensionModal && selectedExtension && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-full bg-yellow-100 mb-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Extension Request
                </h3>
                <p className="text-gray-600">
                  Tenant wants to extend stay by {selectedExtension.additional_periods} {selectedExtension.booking_period}(s)
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current end date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedExtension.current_end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">New end date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedExtension.new_end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Additional amount</span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(selectedExtension.additional_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Note (Optional)
                </label>
                <textarea
                  value={extensionResponse.note}
                  onChange={(e) => setExtensionResponse(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note to the tenant..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  style={{ focusRingColor: colors.primary }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleExtensionResponse(selectedExtension.id, 'approved')}
                  disabled={processingId === selectedExtension.id}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleExtensionResponse(selectedExtension.id, 'rejected')}
                  disabled={processingId === selectedExtension.id}
                  className="flex-1 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;