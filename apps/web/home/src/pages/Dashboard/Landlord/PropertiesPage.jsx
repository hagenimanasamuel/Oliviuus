// src/pages/Dashboard/Landlord/pages/PropertiesPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MapPin as MapPinIcon,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Shield,
  Calendar,
  BarChart3,
  Copy,
  Download,
  Grid,
  List,
  Moon,
  MoreHorizontal
} from 'lucide-react';
import api from '../../../api/axios';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import BulkStatusModal from '../../../components/Dashbaord/Landlord/PropertiesPage/BulkStatusModal';
import PropertyAnalyticsModal from '../../../components/Dashbaord/Landlord/PropertiesPage/PropertyAnalyticsModal';
import ExportPropertiesModal from '../../../components/Dashbaord/Landlord/PropertiesPage/ExportPropertiesModal';

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Active' },
    draft: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Draft' },
    rented: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Users, label: 'Rented' },
    inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, label: 'Inactive' },
    under_maintenance: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Maintenance' },
    deleted: { color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle, label: 'Deleted' }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
      <Icon size={8} className="mr-1" />
      {config.label}
    </span>
  );
};

// ============================================
// PROPERTY TYPE BADGE COMPONENT
// ============================================
const PropertyTypeBadge = ({ type }) => {
  const typeConfig = {
    apartment: 'bg-purple-100 text-purple-800',
    house: 'bg-blue-100 text-blue-800',
    villa: 'bg-emerald-100 text-emerald-800',
    condo: 'bg-amber-100 text-amber-800',
    studio: 'bg-pink-100 text-pink-800',
    ghetto: 'bg-gray-100 text-gray-800',
  };

  const bgClass = typeConfig[type] || 'bg-gray-100 text-gray-800';
  const displayType = type?.split('_')[0] || type;

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${bgClass}`}>
      {displayType}
    </span>
  );
};

// ============================================
// PRICE DISPLAY COMPONENT - Enhanced with multiple periods
// ============================================
const PropertyPriceDisplay = ({ property }) => {
  const [showAllPrices, setShowAllPrices] = useState(false);
  
  const getPriceOptions = (property) => {
    const options = [];
    
    if (property.accept_monthly && property.monthly_price > 0) {
      options.push({
        amount: property.monthly_price,
        period: 'month',
        label: 'Monthly',
        icon: <Calendar size={10} />,
        primary: true
      });
    }
    
    if (property.accept_nightly && property.nightly_price > 0) {
      options.push({
        amount: property.nightly_price,
        period: 'night',
        label: 'Nightly',
        icon: <Moon size={10} />
      });
    }
    
    if (property.accept_weekly && property.weekly_price > 0) {
      options.push({
        amount: property.weekly_price,
        period: 'week',
        label: 'Weekly',
        icon: <Calendar size={10} />
      });
    }
    
    if (property.accept_daily && property.daily_price > 0) {
      options.push({
        amount: property.daily_price,
        period: 'day',
        label: 'Daily',
        icon: <Calendar size={10} />
      });
    }
    
    return options;
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(price).replace('RWF', 'RF');
  };

  const priceOptions = getPriceOptions(property);
  const primaryOption = priceOptions.find(opt => opt.primary) || priceOptions[0];
  const secondaryOption = priceOptions.length > 1 ? priceOptions[1] : null;

  if (priceOptions.length === 0) {
    return (
      <div className="text-center py-1">
        <span className="text-[10px] text-gray-500">Contact for pricing</span>
      </div>
    );
  }

  return (
    <div className="space-y-1 relative">
      {/* Primary Price */}
      {primaryOption && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">{primaryOption.icon}</span>
            <span className="text-[9px] text-gray-500">{primaryOption.label}</span>
          </div>
          <div className="font-bold text-gray-900 text-xs">
            {formatPrice(primaryOption.amount)}
          </div>
        </div>
      )}

      {/* Secondary Price (shown by default) */}
      {secondaryOption && !showAllPrices && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">{secondaryOption.icon}</span>
            <span className="text-[9px] text-gray-500">{secondaryOption.label}</span>
          </div>
          <div className="font-medium text-gray-700 text-xs">
            {formatPrice(secondaryOption.amount)}
          </div>
        </div>
      )}

      {/* All additional prices (when expanded) */}
      {showAllPrices && priceOptions.slice(2).map((option, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">{option.icon}</span>
            <span className="text-[9px] text-gray-500">{option.label}</span>
          </div>
          <div className="font-medium text-gray-700 text-xs">
            {formatPrice(option.amount)}
          </div>
        </div>
      ))}

      {/* Show more/less button */}
      {priceOptions.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowAllPrices(!showAllPrices);
          }}
          className="w-full flex items-center justify-center pt-0.5 text-[8px] text-[#BC8BBC] hover:text-[#8A5A8A]"
        >
          {showAllPrices ? (
            <span>Show less</span>
          ) : (
            <span className="flex items-center gap-0.5">
              <MoreHorizontal size={8} />
              +{priceOptions.length - 2} more
            </span>
          )}
        </button>
      )}
    </div>
  );
};

// ============================================
// DROPDOWN MENU COMPONENT - Fixed to display over everything
// ============================================
const PropertyDropdownMenu = ({ property, onClose, onView, onEdit, onDuplicate, onDelete, onAnalytics, position }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to ensure menu stays within viewport
  const getAdjustedPosition = () => {
    if (!position) return { top: 0, right: 16 };
    
    const menuWidth = 192; // w-48 = 192px
    const menuHeight = 240; // approximate height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = position.top;
    let right = viewportWidth - position.left;
    
    // Adjust if menu would go off screen
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight - 10;
    }
    
    if (right + menuWidth > viewportWidth) {
      right = 16;
    }
    
    return { top, right };
  };

  const adjustedPos = getAdjustedPosition();

  return (
    <>
      {/* Backdrop to ensure clicks outside close the menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown menu - fixed positioning */}
      <div 
        ref={menuRef}
        className="fixed z-50 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
        style={{
          top: adjustedPos.top,
          right: adjustedPos.right
        }}
      >
        <button
          onClick={() => { onView(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye size={16} className="text-gray-500" />
          View Details
        </button>
        <button
          onClick={() => { onEdit(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit size={16} className="text-gray-500" />
          Edit Property
        </button>
        <button
          onClick={() => { onAnalytics(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <BarChart3 size={16} className="text-gray-500" />
          Analytics
        </button>
        <button
          onClick={() => { onDuplicate(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <Copy size={16} className="text-gray-500" />
          Duplicate
        </button>
        <div className="border-t border-gray-100 my-1"></div>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
        >
          <Trash2 size={16} />
          Delete Property
        </button>
      </div>
    </>
  );
};

// ============================================
// REGISTER AS LANDLORD COMPONENT
// ============================================
const RegisterAsLandlord = ({ onRegister, loading }) => (
  <div className="max-w-2xl mx-auto py-8 px-4">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield className="h-8 w-8 text-[#8A5A8A]" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Register as a Landlord</h1>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
        To manage properties on iSanzure, you need to register as a landlord.
      </p>
      
      <button
        onClick={onRegister}
        disabled={loading}
        className="w-full max-w-sm mx-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Registering...
          </>
        ) : (
          <>
            <Shield className="mr-2" size={18} />
            Register as Landlord
          </>
        )}
      </button>
    </div>
  </div>
);

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyState = ({ onAddProperty }) => (
  <div className="text-center py-12 px-4">
    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] rounded-full flex items-center justify-center mb-4">
      <Home className="h-8 w-8 text-[#8A5A8A]" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">No Properties Yet</h3>
    <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm">
      Start by adding your first property to list it on iSanzure.
    </p>
    <button
      onClick={onAddProperty}
      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm"
    >
      <Plus className="mr-2" size={16} />
      Add First Property
    </button>
  </div>
);

// ============================================
// PROPERTY CARD SKELETON
// ============================================
const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-pulse">
    <div className="h-24 bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-2 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between">
        <div className="h-2 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-12" />
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [analyticsProperty, setAnalyticsProperty] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Check if user is a landlord
  const isLandlord = userType === 'landlord';

  // Get the correct user ID
  const getLandlordId = () => {
    if (!isanzureUser) return null;
    return isanzureUser.isanzure_user_id || isanzureUser.id;
  };

  const landlordId = getLandlordId();

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('RWF', 'RF');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getLocationString = (property) => {
    if (!property) return 'Location N/A';
    
    if (property.sector && property.district) {
      return `${property.sector}, ${property.district}`;
    }
    if (property.district) {
      return property.district;
    }
    if (property.province) {
      return property.province;
    }
    if (property.address) {
      return property.address.length > 25 
        ? property.address.substring(0, 25) + '...' 
        : property.address;
    }
    return 'Location N/A';
  };

  // ============================================
  // API FUNCTIONS
  // ============================================
  const handleRegisterAsLandlord = async () => {
    setRegistering(true);
    try {
      const response = await api.post('/isanzure/create-landlord');
      
      if (response.data.success) {
        await refreshIsanzureUser();
        alert('Successfully registered as a landlord!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const fetchProperties = useCallback(async () => {
    if (!isLandlord || !landlordId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('propertyType', typeFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      
      const response = await api.get(`/properties/landlord/${landlordId}?${params.toString()}`);
      
      if (response.data.success) {
        // Fetch view counts for each property
        const propertiesWithViews = await Promise.all(
          (response.data.data || []).map(async (property) => {
            try {
              const viewsRes = await api.get(`/views/property/${property.property_uid}/stats`);
              return {
                ...property,
                view_count: viewsRes.data.data?.summary?.total_views || 0
              };
            } catch {
              return { ...property, view_count: 0 };
            }
          })
        );
        setProperties(propertiesWithViews);
      }
    } catch (err) {
      setError('Failed to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [landlordId, isLandlord, statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDeleteProperty = async (propertyUid) => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await api.delete(`/properties/${propertyUid}`);
      setProperties(prev => prev.filter(p => p.property_uid !== propertyUid));
      setActiveDropdown(null);
    } catch (err) {
      alert('Failed to delete property');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateProperty = async (propertyUid) => {
    try {
      await api.post(`/properties/${propertyUid}/duplicate`, { copyImages: true });
      fetchProperties();
      setActiveDropdown(null);
    } catch (err) {
      alert('Failed to duplicate property');
    }
  };

  const handleBulkStatusUpdate = async (status, reason) => {
    if (selectedProperties.length === 0) return;

    try {
      await api.post('/properties/bulk-update-status', {
        propertyUids: selectedProperties,
        status,
        reason
      });
      setSelectedProperties([]);
      fetchProperties();
      setShowBulkModal(false);
    } catch (err) {
      alert('Failed to update properties');
    }
  };

  const handleStatusChange = async (propertyUid, newStatus) => {
    try {
      await api.patch(`/properties/${propertyUid}/status`, { status: newStatus });
      fetchProperties();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const togglePropertySelection = (propertyUid) => {
    setSelectedProperties(prev =>
      prev.includes(propertyUid)
        ? prev.filter(id => id !== propertyUid)
        : [...prev, propertyUid]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(properties.map(p => p.property_uid));
    }
  };

  // ============================================
  // STATS CALCULATION
  // ============================================
  const stats = {
    total: properties.length,
    active: properties.filter(p => p.status === 'active').length,
    rented: properties.filter(p => p.status === 'rented').length,
    draft: properties.filter(p => p.status === 'draft').length,
    inactive: properties.filter(p => p.status === 'inactive').length,
    under_maintenance: properties.filter(p => p.status === 'under_maintenance').length,
    totalViews: properties.reduce((sum, p) => sum + (p.view_count || 0), 0),
    totalRevenue: properties
      .filter(p => p.status === 'rented' && p.monthly_price)
      .reduce((sum, p) => sum + (p.monthly_price || 0), 0)
  };

  // ============================================
  // RENDER
  // ============================================
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-[#8A5A8A] animate-spin" />
      </div>
    );
  }

  if (!isLandlord) {
    return <RegisterAsLandlord onRegister={handleRegisterAsLandlord} loading={registering} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-600 mt-0.5">Manage your rental properties</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedProperties.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center"
            >
              <Filter size={14} className="mr-1" />
              Bulk ({selectedProperties.length})
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Download size={14} className="mr-1" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => navigate('/landlord/dashboard/add-property')}
            className="px-3 py-1.5 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-lg text-sm font-medium hover:shadow-md flex items-center"
          >
            <Plus size={14} className="mr-1" />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Compact Grid */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <div className="text-[10px] text-gray-500">Total</div>
            <div className="text-sm font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <div className="text-[10px] text-gray-500">Active</div>
            <div className="text-sm font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <div className="text-[10px] text-gray-500">Rented</div>
            <div className="text-sm font-bold text-blue-600">{stats.rented}</div>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <div className="text-[10px] text-gray-500">Draft</div>
            <div className="text-sm font-bold text-yellow-600">{stats.draft}</div>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200 hidden sm:block">
            <div className="text-[10px] text-gray-500">Views</div>
            <div className="text-sm font-bold text-purple-600">{stats.totalViews}</div>
          </div>
          <div className="bg-white p-2 rounded-lg border border-gray-200 hidden lg:block">
            <div className="text-[10px] text-gray-500">Revenue</div>
            <div className="text-sm font-bold text-amber-600 truncate">{formatPrice(stats.totalRevenue)}</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#BC8BBC] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden p-2 border border-gray-300 rounded-lg"
          >
            <Filter size={16} className="text-gray-600" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#BC8BBC] min-w-[100px]"
            >
              <option value="all">All Status ({stats.total})</option>
              <option value="active">Active ({stats.active})</option>
              <option value="draft">Draft ({stats.draft})</option>
              <option value="rented">Rented ({stats.rented})</option>
              <option value="inactive">Inactive ({stats.inactive})</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#BC8BBC] min-w-[100px]"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="villa">Villa</option>
              <option value="studio">Studio</option>
              <option value="ghetto">Ghetto</option>
            </select>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-[#BC8BBC] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-[#BC8BBC] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Filters */}
        {showMobileFilters && (
          <div className="mt-3 space-y-2 sm:hidden">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="all">All Status ({stats.total})</option>
              <option value="active">Active ({stats.active})</option>
              <option value="draft">Draft ({stats.draft})</option>
              <option value="rented">Rented ({stats.rented})</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
            </select>
            <div className="flex justify-end">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Properties Content */}
      {properties.length === 0 && !loading ? (
        <EmptyState onAddProperty={() => navigate('/landlord/dashboard/add-property')} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Select All Bar */}
          {properties.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-2 mb-3 flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProperties.length === properties.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-[#BC8BBC] border-gray-300 rounded focus:ring-[#BC8BBC]"
                />
                <span className="text-xs text-gray-700">
                  {selectedProperties.length === 0 
                    ? 'Select all' 
                    : `${selectedProperties.length} selected`}
                </span>
              </label>
              {selectedProperties.length > 0 && (
                <button
                  onClick={() => setSelectedProperties([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Properties Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {properties.map((property) => (
                <div 
                  key={property.id} 
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all relative group"
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.property_uid)}
                      onChange={() => togglePropertySelection(property.property_uid)}
                      className="w-4 h-4 text-[#BC8BBC] border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Image */}
                  <div 
                    className="h-24 bg-gray-100 relative cursor-pointer"
                    onClick={() => navigate(`/landlord/dashboard/properties/${property.property_uid}`)}
                  >
                    {property.cover_image ? (
                      <img 
                        src={property.cover_image} 
                        alt={property.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <PropertyTypeBadge type={property.property_type} />
                    </div>
                    {property.view_count > 0 && (
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center">
                        <Eye size={6} className="mr-0.5" />
                        {property.view_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-2">
                    <div className="flex items-start justify-between mb-1">
                      <StatusBadge status={property.status} />
                      <span className="text-[9px] text-gray-400">{formatDate(property.created_at)}</span>
                    </div>
                    
                    <h3 
                      className="text-xs font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-[#8A5A8A] mb-1"
                      onClick={() => navigate(`/landlord/dashboard/properties/${property.property_uid}`)}
                    >
                      {property.title || 'Untitled Property'}
                    </h3>
                    
                    <div className="flex items-center text-[9px] text-gray-500 mb-2">
                      <MapPinIcon size={8} className="mr-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{getLocationString(property)}</span>
                    </div>

                    {/* Price Display - Enhanced */}
                    <PropertyPriceDisplay property={property} />

                    {/* Action Buttons */}
                    <div className="mt-2 flex gap-1">
                      {property.status !== 'rented' && (
                        <button
                          onClick={() => handleStatusChange(property.property_uid, 'rented')}
                          className="flex-1 text-[8px] py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          Rent
                        </button>
                      )}
                      {property.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(property.property_uid, 'inactive')}
                          className="flex-1 text-[8px] py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                        >
                          Hide
                        </button>
                      )}
                      {property.status === 'inactive' && (
                        <button
                          onClick={() => handleStatusChange(property.property_uid, 'active')}
                          className="flex-1 text-[8px] py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                        >
                          Show
                        </button>
                      )}
                    </div>

                    {/* Three dots menu */}
                    <div className="absolute bottom-2 right-2 z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveDropdown({
                            id: property.property_uid,
                            position: {
                              top: rect.bottom + window.scrollY,
                              left: rect.left + window.scrollX
                            }
                          });
                        }}
                        className="p-1 hover:bg-gray-100 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm"
                      >
                        <MoreVertical size={12} />
                      </button>
                      
                      {activeDropdown?.id === property.property_uid && (
                        <PropertyDropdownMenu
                          property={property}
                          onClose={() => setActiveDropdown(null)}
                          onView={() => navigate(`/landlord/dashboard/properties/${property.property_uid}`)}
                          onEdit={() => navigate(`/landlord/dashboard/properties/${property.property_uid}/edit`)}
                          onDuplicate={() => handleDuplicateProperty(property.property_uid)}
                          onDelete={() => handleDeleteProperty(property.property_uid)}
                          onAnalytics={() => {
                            setAnalyticsProperty(property);
                            setShowAnalyticsModal(true);
                            setActiveDropdown(null);
                          }}
                          position={activeDropdown?.position}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <div key={property.id} className="p-3 hover:bg-gray-50 flex items-center gap-3 relative">
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.property_uid)}
                      onChange={() => togglePropertySelection(property.property_uid)}
                      className="w-4 h-4 text-[#BC8BBC] border-gray-300 rounded flex-shrink-0"
                    />
                    
                    <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                      {property.cover_image ? (
                        <img src={property.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{property.title}</h4>
                        <StatusBadge status={property.status} />
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPinIcon size={10} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{getLocationString(property)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {property.monthly_price ? formatPrice(property.monthly_price) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">{property.view_count || 0} views</div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveDropdown({
                            id: property.property_uid,
                            position: {
                              top: rect.bottom + window.scrollY,
                              left: rect.left + window.scrollX
                            }
                          });
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {activeDropdown?.id === property.property_uid && (
                        <PropertyDropdownMenu
                          property={property}
                          onClose={() => setActiveDropdown(null)}
                          onView={() => navigate(`/landlord/dashboard/properties/${property.property_uid}`)}
                          onEdit={() => navigate(`/landlord/dashboard/properties/${property.property_uid}/edit`)}
                          onDuplicate={() => handleDuplicateProperty(property.property_uid)}
                          onDelete={() => handleDeleteProperty(property.property_uid)}
                          onAnalytics={() => {
                            setAnalyticsProperty(property);
                            setShowAnalyticsModal(true);
                            setActiveDropdown(null);
                          }}
                          position={activeDropdown?.position}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <BulkStatusModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkStatusUpdate}
        selectedCount={selectedProperties.length}
      />

      <PropertyAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        property={analyticsProperty}
      />

      <ExportPropertiesModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={(format) => window.open(`/api/properties/export?format=${format}&landlordId=${landlordId}`, '_blank')}
        propertyCount={properties.length}
      />
    </div>
  );
}