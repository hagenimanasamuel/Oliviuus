// src/pages/Dashboard/Landlord/pages/PropertiesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Home,
  DollarSign,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Shield
} from 'lucide-react';
import api from '../../../api/axios';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    draft: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    rented: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Users },
    inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
    under_maintenance: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon size={12} className="mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

// Property type badge component
const PropertyTypeBadge = ({ type }) => {
  const typeConfig = {
    apartment: 'bg-purple-100 text-purple-800',
    house: 'bg-blue-100 text-blue-800',
    villa: 'bg-emerald-100 text-emerald-800',
    condo: 'bg-amber-100 text-amber-800',
    studio: 'bg-pink-100 text-pink-800',
    penthouse: 'bg-rose-100 text-rose-800',
    townhouse: 'bg-indigo-100 text-indigo-800',
    ghetto: 'bg-gray-100 text-gray-800',
    living_house: 'bg-teal-100 text-teal-800',
    upmarket: 'bg-cyan-100 text-cyan-800',
    service_apartment: 'bg-orange-100 text-orange-800',
    guest_house: 'bg-lime-100 text-lime-800',
    bungalow: 'bg-violet-100 text-violet-800',
    commercial: 'bg-red-100 text-red-800',
    hostel: 'bg-fuchsia-100 text-fuchsia-800'
  };

  const bgClass = typeConfig[type] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${bgClass}`}>
      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </span>
  );
};

// Register as landlord component
const RegisterAsLandlord = ({ onRegister, loading }) => (
  <div className="max-w-2xl mx-auto py-16 px-4">
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield className="h-10 w-10 text-[#8A5A8A]" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Register as a Landlord</h1>
      <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
        To manage properties on iSanzure, you need to register as a landlord. This will create your landlord account and give you access to property management tools.
      </p>
      
      <div className="bg-gradient-to-br from-[#f9f3f9] to-[#f4eaf4] rounded-2xl p-8 mb-8 border border-[#e8d4e8]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits of registering as a landlord:</h2>
        <ul className="text-left space-y-3 text-gray-700 mb-6">
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            List unlimited properties for rent
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            Manage bookings and tenants
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            Receive payments securely
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            Access landlord tools and analytics
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            Get verified landlord badge
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <button
          onClick={onRegister}
          disabled={loading}
          className="w-full max-w-md mx-auto flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Shield className="mr-2" size={20} />
              Register as Landlord
            </>
          )}
        </button>
        <p className="text-sm text-gray-500">
          Registration is free and takes less than a minute
        </p>
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ onAddProperty }) => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] rounded-full flex items-center justify-center mb-6">
      <Home className="h-12 w-12 text-[#8A5A8A]" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">No Properties Yet</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Start your property management journey by adding your first property. List it on iSanzure and reach potential tenants.
    </p>
    <button
      onClick={onAddProperty}
      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5"
    >
      <Plus className="mr-2" size={20} />
      Add First Property
    </button>
  </div>
);

// Property card skeleton for loading
const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-6 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
);

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { 
    isanzureUser, 
    userType, 
    loading: authLoading, 
    refreshIsanzureUser 
  } = useIsanzureAuth();
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Check if user is a landlord
  const isLandlord = userType === 'landlord';

  // Get the correct user ID - use isanzure_user_id from the API response
  const getLandlordId = () => {
    if (!isanzureUser) return null;
    
    // Try different possible ID fields
    return isanzureUser.isanzure_user_id || isanzureUser.id;
  };

  const landlordId = getLandlordId();

  // Register as landlord
  const handleRegisterAsLandlord = async () => {
    setRegistering(true);
    try {
      const response = await api.post('/isanzure/create-landlord');
      
      if (response.data.success) {
        await refreshIsanzureUser();
        alert('Successfully registered as a landlord! You can now add properties.');
      } else {
        throw new Error(response.data.message || 'Failed to register as landlord');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register as landlord. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    if (!isLandlord || !landlordId) {
      setLoading(false);
      setError(!isLandlord ? 'Please register as a landlord first' : null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        params.append('propertyType', typeFilter);
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const queryString = params.toString();
      const url = queryString 
        ? `/properties/landlord/${landlordId}?${queryString}`
        : `/properties/landlord/${landlordId}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setProperties(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch properties');
        setProperties([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [landlordId, isLandlord, statusFilter, typeFilter, searchTerm]);

  // Fetch properties when dependencies change
  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Handle property deletion
  const handleDeleteProperty = async (propertyUid) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await api.delete(`/properties/${propertyUid}`);
      
      if (response.data.success) {
        setProperties(prev => prev.filter(prop => prop.property_uid !== propertyUid));
        alert('Property deleted successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to delete property');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete property. Please try again.');
    } finally {
      setDeleting(false);
      setSelectedProperty(null);
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get location string
  const getLocationString = (property) => {
    const parts = [];
    if (property.sector) parts.push(property.sector);
    if (property.district) parts.push(property.district);
    if (property.province) parts.push(property.province);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  // Calculate property stats
  const calculateStats = () => {
    const stats = {
      total: properties.length,
      active: properties.filter(p => p.status === 'active').length,
      rented: properties.filter(p => p.status === 'rented').length,
      draft: properties.filter(p => p.status === 'draft').length,
      inactive: properties.filter(p => p.status === 'inactive').length,
      under_maintenance: properties.filter(p => p.status === 'under_maintenance').length
    };
    
    const totalRevenue = properties
      .filter(p => p.status === 'rented' && p.monthly_price)
      .reduce((sum, p) => sum + (p.monthly_price || 0), 0);
    
    return { ...stats, totalRevenue };
  };

  const stats = calculateStats();

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', count: stats.active },
    { value: 'draft', label: 'Draft', count: stats.draft },
    { value: 'rented', label: 'Rented', count: stats.rented },
    { value: 'inactive', label: 'Inactive', count: stats.inactive },
    { value: 'under_maintenance', label: 'Maintenance', count: stats.under_maintenance }
  ];

  // Property type options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'studio', label: 'Studio' },
    { value: 'ghetto', label: 'Ghetto' },
    { value: 'living_house', label: 'Living House' },
    { value: 'service_apartment', label: 'Service Apartment' }
  ];

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  // Check if any filter is active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || typeFilter !== 'all';

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#8A5A8A] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your account information...</p>
        </div>
      </div>
    );
  }

  // Show registration screen if not a landlord
  if (!isLandlord) {
    return <RegisterAsLandlord onRegister={handleRegisterAsLandlord} loading={registering} />;
  }

  // Show loading while fetching properties
  if (loading && properties.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-600 mt-2">Loading your properties...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Properties</h1>
            <p className="text-gray-600 mt-2">Manage and track all your rental properties</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/landlord/dashboard/add-property')}
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="mr-2" size={20} />
              Add New Property
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft Properties</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.draft}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Properties Content */}
      {properties.length === 0 && !loading ? (
        <EmptyState onAddProperty={() => navigate('/landlord/dashboard/add-property')} />
      ) : (
        <>
          {/* Filters and Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search properties by title, address, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-white min-w-[140px]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} {option.count !== undefined ? `(${option.count})` : ''}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>

                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-white min-w-[140px]"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Home className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-300"
                  >
                    Reset Filters
                  </button>
                )}

                <button
                  onClick={fetchProperties}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Loader2 className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center text-red-700">
                <AlertCircle className="mr-2" size={20} />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchProperties()}
                className="mt-3 px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Properties Grid */}
          {properties.length > 0 && (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
                {hasActiveFilters && ' (filtered)'}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Property Image */}
                    <div 
                      className="h-48 bg-gray-100 relative cursor-pointer"
                      onClick={() => navigate(`/landlord/dashboard/properties/${property.property_uid}`)}
                    >
                      {property.cover_image ? (
                        <img 
                          src={property.cover_image} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Home className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <StatusBadge status={property.status} />
                      </div>
                      <div className="absolute top-3 right-3">
                        <PropertyTypeBadge type={property.property_type} />
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 
                          className="font-semibold text-gray-900 hover:text-[#8A5A8A] cursor-pointer line-clamp-1"
                          onClick={() => navigate(`/landlord/dashboard/properties/${property.property_uid}`)}
                        >
                          {property.title || 'Untitled Property'}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin size={14} className="mr-1" />
                          <span className="line-clamp-1">{getLocationString(property)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Price</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatPrice(property.monthly_price)}
                          </p>
                        </div>
                        {property.image_count > 0 && (
                          <div className="text-sm text-gray-500">
                            {property.image_count} photo{property.image_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-3">
                        <div className="truncate">
                          <span className="hidden sm:inline">Added </span>
                          {formatDate(property.created_at)}
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProperty(
                                selectedProperty?.property_uid === property.property_uid ? null : property
                              );
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical size={18} />
                          </button>
                          
                          {selectedProperty?.property_uid === property.property_uid && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setSelectedProperty(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/properties/${property.property_uid}`);
                                    setSelectedProperty(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Eye size={16} className="mr-2" />
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/landlord/dashboard/properties/${property.property_uid}/edit`);
                                    setSelectedProperty(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Edit size={16} className="mr-2" />
                                  Edit Property
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProperty(null);
                                    handleDeleteProperty(property.property_uid);
                                  }}
                                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                                  disabled={deleting}
                                >
                                  {deleting ? (
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 size={16} className="mr-2" />
                                  )}
                                  Delete Property
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}