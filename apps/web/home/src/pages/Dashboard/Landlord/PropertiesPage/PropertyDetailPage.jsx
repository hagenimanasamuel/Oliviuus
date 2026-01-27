// src/pages/Dashboard/Landlord/pages/PropertyDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../../../../api/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import sub-components
import PropertyHeader from '../../../../components/Dashbaord/Landlord/PropertiesPage/PropertyHeader';
import PropertyGallery from './PropertyGallery';
import PropertyTabs from './PropertyTabs';
import PropertySidebar from './PropertySidebar';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import ImageManagementModal from './modals/ImageManagementModal';
import FullscreenImageModal from './modals/FullscreenImageModal';

const PropertyDetailPage = () => {
  const { propertyUid } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch property data
  useEffect(() => {
    fetchProperty();
  }, [propertyUid]);

const fetchProperty = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await api.get(`/properties/${propertyUid}`);
    
    if (response.data.success) {
      console.log('Property data structure:', response.data.data);
      console.log('Rooms:', response.data.data?.rooms);
      console.log('Equipment:', response.data.data?.equipment);
      console.log('Amenities:', response.data.data?.amenities);
      setProperty(response.data.data);
    } else {
      setError(response.data.message || 'Property not found');
      toast.error(response.data.message || 'Failed to load property');
    }
  } catch (err) {
    const errorMessage = 
      err.response?.data?.message || 
      err.response?.data?.error || 
      err.message || 
      'Failed to load property details';
    
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteProperty = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(`/properties/${propertyUid}`);
      
      if (response.data.success) {
        toast.success('Property deleted successfully!');
        setTimeout(() => navigate('/landlord/dashboard/properties'), 1500);
      } else {
        throw new Error(response.data.message || 'Failed to delete property');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete property. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleEditProperty = () => {
    navigate(`/landlord/dashboard/properties/${propertyUid}/edit`);
  };

  const handleViewPublic = () => {
    window.open(`/properties/${propertyUid}`, '_blank');
  };

  const handleShareProperty = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: `Check out this property: ${property?.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleImageSelect = (index) => {
    setSelectedImageIndex(index);
  };

  const handleNextImage = () => {
    if (!property?.images) return;
    setSelectedImageIndex(prev => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    if (!property?.images) return;
    setSelectedImageIndex(prev => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-[#8A5A8A] animate-spin mx-auto" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
            </div>
            <p className="text-slate-600 font-medium animate-pulse">Loading property details...</p>
            <p className="text-sm text-slate-400">Fetching your property information</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-rose-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full animate-ping opacity-75"></div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Property Not Found</h2>
            <p className="text-slate-600">{error}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/landlord/dashboard/properties')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#8A5A8A] to-[#BC8BBC] text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Back to Properties
            </button>
            <button
              onClick={fetchProperty}
              className="w-full px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <ToastContainer position="top-right" theme="colored" />
      
      {/* Header */}
      <PropertyHeader 
        property={property}
        isFavorite={isFavorite}
        onBack={() => navigate('/landlord/dashboard/properties')}
        onFavoriteToggle={() => setIsFavorite(!isFavorite)}
        onViewPublic={handleViewPublic}
        onManageImages={() => setShowImageModal(true)}
        onShare={handleShareProperty}
        onEdit={handleEditProperty}
        onDelete={() => setShowDeleteModal(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Header */}
        <div className="md:hidden mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{property.title}</h1>
          <p className="text-slate-600">{property.address}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <PropertyGallery 
              images={property.images || []}
              selectedIndex={selectedImageIndex}
              onSelect={handleImageSelect}
              onNext={handleNextImage}
              onPrev={handlePrevImage}
              onFullscreen={() => setShowFullscreenModal(true)}
              onAddImages={() => setShowImageModal(true)}
            />

            {/* Property Details Tabs */}
            <PropertyTabs 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              property={property}
            />
          </div>

          {/* Right Column - Sidebar */}
          <PropertySidebar 
            property={property}
            onEditProperty={handleEditProperty}
          />
        </div>
      </div>

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProperty}
        propertyTitle={property.title}
        deleting={deleting}
      />

      <ImageManagementModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={property.images || []}
        propertyTitle={property.title}
      />

      <FullscreenImageModal
        isOpen={showFullscreenModal}
        onClose={() => setShowFullscreenModal(false)}
        images={property.images || []}
        selectedIndex={selectedImageIndex}
        onSelect={handleImageSelect}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
      />
    </div>
  );
};

export default PropertyDetailPage;