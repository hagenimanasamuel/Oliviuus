import React, { useState, useCallback, useEffect } from 'react';
import { 
  UserCheck,
  Camera,
  FileText,
  Shield,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
  Upload,
  File,
  Image,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Loader2,
  Key,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCw
} from 'lucide-react';
import api from '../../../../../../api/axios';

const VerificationSection = ({ 
  isanzureUser, 
  verificationStatus, 
  rejectionReason, 
  refreshIsanzureUser,
  showNotification
}) => {
  const [verificationData, setVerificationData] = useState({
    nationalIdFront: null,
    nationalIdBack: null,
    passportPhoto: null,
    verificationLetter: null,
    verificationReason: '',
  });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState({
    nationalIdFront: null,
    nationalIdBack: null,
    passportPhoto: null,
    verificationLetter: null
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [documentUrls, setDocumentUrls] = useState({
    nationalIdFront: null,
    nationalIdBack: null,
    passportPhoto: null,
    verificationLetter: null
  });
  
  // Enhanced preview state
  const [activePreview, setActivePreview] = useState(null);
  const [previewMode, setPreviewMode] = useState('gallery'); // 'gallery' or 'fullscreen'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Load verification details from user data
  useEffect(() => {
    if (isanzureUser?.verification) {
      console.log('Verification data from isanzureUser:', isanzureUser.verification);
      setVerificationDetails(isanzureUser.verification);
      
      // Extract document URLs for preview
      setDocumentUrls({
        nationalIdFront: isanzureUser.verification.national_id_front_url,
        nationalIdBack: isanzureUser.verification.national_id_back_url,
        passportPhoto: isanzureUser.verification.passport_photo_url,
        verificationLetter: isanzureUser.verification.verification_letter_url
      });
    }
  }, [isanzureUser]);

  // File validation
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Please upload JPG, PNG, WebP, or PDF files only' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    return { valid: true, error: null };
  };

  // Handle file selection via file input
  const handleFileUpload = (file, field) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      showNotification(validation.error, 'error');
      return;
    }

    setVerificationData(prev => ({ ...prev, [field]: file }));
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF files, show PDF icon
      setPreviewImages(prev => ({ ...prev, [field]: 'pdf' }));
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file, field);
    }
  };

  const removeFile = (field) => {
    setVerificationData(prev => ({ ...prev, [field]: null }));
    setPreviewImages(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!verificationData.nationalIdFront || !verificationData.nationalIdBack) {
      showNotification('Please upload both front and back of your National ID', 'error');
      return;
    }
    
    if (!verificationData.passportPhoto) {
      showNotification('Please upload your passport photo', 'error');
      return;
    }
    
    if (!verificationData.verificationReason.trim()) {
      showNotification('Please provide a reason for verification request', 'error');
      return;
    }

    if (verificationData.verificationReason.trim().length < 10) {
      showNotification('Reason must be at least 10 characters long', 'error');
      return;
    }

    setVerificationLoading(true);
    try {
      const formData = new FormData();
      formData.append('verificationReason', verificationData.verificationReason.trim());
      formData.append('documentType', 'national_id');
      formData.append('nationalIdFront', verificationData.nationalIdFront);
      formData.append('nationalIdBack', verificationData.nationalIdBack);
      formData.append('passportPhoto', verificationData.passportPhoto);
      if (verificationData.verificationLetter) {
        formData.append('verificationLetter', verificationData.verificationLetter);
      }

      const response = await api.post('/isanzure/settings/submit-verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        showNotification('Verification request submitted successfully! It will be processed within 24-48 hours.', 'success');
        await refreshIsanzureUser();
        setVerificationData({
          nationalIdFront: null,
          nationalIdBack: null,
          passportPhoto: null,
          verificationLetter: null,
          verificationReason: '',
        });
        setPreviewImages({
          nationalIdFront: null,
          nationalIdBack: null,
          passportPhoto: null,
          verificationLetter: null
        });
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to submit verification request', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Delete verification request
  const handleDeleteVerification = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/isanzure/settings/cancel-verification');
      
      if (response.data.success) {
        showNotification('Verification request cancelled successfully', 'success');
        setShowDeleteConfirm(false);
        await refreshIsanzureUser();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete verification request', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Enhanced document preview functions
  const openDocumentPreview = (url, title) => {
    setActivePreview({ url, title });
    setPreviewMode('gallery');
    setZoomLevel(1);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    setPreviewMode(previewMode === 'gallery' ? 'fullscreen' : 'gallery');
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  // File preview component for uploads
  const FilePreview = ({ field, label }) => {
    const preview = previewImages[field];
    const file = verificationData[field];
    
    if (!preview) return null;

    return (
      <div className="relative group">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {preview === 'pdf' ? (
                <File className="w-10 h-10 text-red-500" />
              ) : (
                <img 
                  src={preview} 
                  alt={label}
                  className="w-10 h-10 object-cover rounded border border-gray-200"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeFile(field)}
              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced document preview component
  const EnhancedDocumentPreview = ({ url, title, type = 'image' }) => {
    if (!url) return null;

    const isPDF = url.toLowerCase().endsWith('.pdf') || type === 'pdf';

    const handlePreview = () => {
      openDocumentPreview(url, title);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-900 truncate">{title}</h5>
            <button
              onClick={handlePreview}
              className="text-gray-400 hover:text-[#BC8BBC] transition-colors p-1"
              title="Preview document"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          {isPDF ? (
            <div 
              onClick={handlePreview}
              className="text-center py-8 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            >
              <File className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">PDF Document</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A573A5] transition-colors">
                <Eye className="w-4 h-4" />
                Preview Document
              </div>
            </div>
          ) : (
            <div 
              onClick={handlePreview}
              className="cursor-pointer group-hover:opacity-90 transition-opacity"
            >
              <div className="relative overflow-hidden rounded border border-gray-200">
                <img 
                  src={url} 
                  alt={title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                Click to preview
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced preview modal
  const EnhancedPreviewModal = () => {
    if (!activePreview) return null;

    const isPDF = activePreview.url.toLowerCase().endsWith('.pdf');
    const transformStyle = {
      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
      transition: 'transform 0.2s ease-in-out'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className={`${previewMode === 'fullscreen' ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'} bg-black relative`}>
          {/* Header with controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setActivePreview(null);
                    setPreviewMode('gallery');
                    resetView();
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-white font-medium truncate max-w-md">
                  {activePreview.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                {!isPDF && (
                  <>
                    <button
                      onClick={zoomOut}
                      disabled={zoomLevel <= 0.5}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-50"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={zoomIn}
                      disabled={zoomLevel >= 3}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors disabled:opacity-50"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={rotateImage}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                      <RotateCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={resetView}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  {previewMode === 'fullscreen' ? 
                    <Minimize2 className="w-5 h-5" /> : 
                    <Maximize2 className="w-5 h-5" />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Document content */}
          <div className="h-full w-full flex items-center justify-center p-4">
            {isPDF ? (
              <div className="w-full h-full">
                <iframe
                  src={activePreview.url}
                  className="w-full h-full border-0"
                  title={activePreview.title}
                />
              </div>
            ) : (
              <div className="overflow-auto max-w-full max-h-full">
                <div style={transformStyle}>
                  <img
                    src={activePreview.url}
                    alt={activePreview.title}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation for gallery mode */}
          {previewMode === 'gallery' && !isPDF && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => {
                  const documents = Object.entries(documentUrls)
                    .filter(([_, url]) => url)
                    .map(([type, url]) => ({
                      url,
                      title: type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    }));
                  
                  const currentIndex = documents.findIndex(doc => doc.url === activePreview.url);
                  const prevIndex = (currentIndex - 1 + documents.length) % documents.length;
                  setActivePreview(documents[prevIndex]);
                  resetView();
                }}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-1">
                {Object.entries(documentUrls).map(([type, url], index) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (url) {
                        setActivePreview({
                          url,
                          title: type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                        });
                        resetView();
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      url === activePreview.url 
                        ? 'bg-white scale-125' 
                        : url ? 'bg-white/50' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => {
                  const documents = Object.entries(documentUrls)
                    .filter(([_, url]) => url)
                    .map(([type, url]) => ({
                      url,
                      title: type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                    }));
                  
                  const currentIndex = documents.findIndex(doc => doc.url === activePreview.url);
                  const nextIndex = (currentIndex + 1) % documents.length;
                  setActivePreview(documents[nextIndex]);
                  resetView();
                }}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Delete confirmation modal
  const DeleteConfirmationModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Cancel Verification Request?
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to cancel your verification request? 
              This action cannot be undone. Your verification status will be reset to "Not Submitted".
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleDeleteVerification}
                disabled={isDeleting}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Yes, Cancel Verification
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                No, Keep Verification
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              You can submit a new verification request anytime after cancellation
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Upload area component
  const UploadArea = ({ field, label, required = false, instructions }) => {
    const preview = previewImages[field];

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">
            {label}
          </label>
          <span className={`text-xs ${required ? 'text-red-500' : 'text-gray-500'}`}>
            {required ? 'Required' : 'Optional'}
          </span>
        </div>

        {preview ? (
          <FilePreview field={field} label={label} />
        ) : (
          <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-xl p-8 text-center transition-all">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileChange(e, field)}
              className="hidden"
              id={field}
              required={required}
            />
            <label 
              htmlFor={field} 
              className="cursor-pointer w-full h-full flex flex-col items-center justify-center space-y-4"
            >
              <div className="p-4 rounded-full bg-gray-100">
                {field === 'verificationLetter' ? (
                  <FileText className="w-8 h-8 text-gray-400" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Upload {label}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  {instructions || 'Click to browse files'}
                </p>
                <p className="text-xs text-gray-400">
                  JPG, PNG, PDF • Max 5MB
                </p>
              </div>
              
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Browse Files
              </div>
            </label>
          </div>
        )}
      </div>
    );
  };

  // Preview modal for verification details
  const PreviewModal = () => {
    if (!verificationDetails) return null;

    const hasDocuments = documentUrls.nationalIdFront || 
                        documentUrls.nationalIdBack || 
                        documentUrls.passportPhoto || 
                        documentUrls.verificationLetter;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Verification Details</h3>
              <p className="text-gray-600 text-sm mt-1">
                {verificationDetails.verification_submitted_at ? 
                  `Submitted on ${new Date(verificationDetails.verification_submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}` : 
                  'Verification details'}
              </p>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Status Badge */}
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
              verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {verificationStatus === 'approved' ? <CheckCircle2 className="w-4 h-4 mr-2" /> :
               verificationStatus === 'pending' ? <Clock className="w-4 h-4 mr-2" /> :
               verificationStatus === 'rejected' ? <XCircle className="w-4 h-4 mr-2" /> :
               <AlertCircle className="w-4 h-4 mr-2" />}
              {verificationStatus === 'approved' ? 'Verified' :
               verificationStatus === 'pending' ? 'Pending Review' :
               verificationStatus === 'rejected' ? 'Rejected' : 'Not Submitted'}
            </div>

            {/* Verification Reason */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Verification Reason</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700">{verificationDetails.verification_reason || 'No reason provided'}</p>
              </div>
            </div>

            {/* Submitted Documents */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 text-lg">Submitted Documents</h4>
                <span className="text-sm text-gray-500">
                  {hasDocuments ? 'Click on any document to preview' : 'No documents available'}
                </span>
              </div>
              
              {hasDocuments ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EnhancedDocumentPreview 
                    url={documentUrls.nationalIdFront}
                    title="National ID - Front"
                  />
                  
                  <EnhancedDocumentPreview 
                    url={documentUrls.nationalIdBack}
                    title="National ID - Back"
                  />
                  
                  <EnhancedDocumentPreview 
                    url={documentUrls.passportPhoto}
                    title="Passport Photo"
                  />
                  
                  <EnhancedDocumentPreview 
                    url={documentUrls.verificationLetter}
                    title="Verification Letter"
                    type={documentUrls.verificationLetter?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'}
                  />
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h5 className="text-lg font-medium text-gray-700 mb-2">No Documents Available</h5>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Document URLs are not available in the verification data.
                  </p>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {verificationStatus === 'rejected' && verificationDetails.rejection_reason && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
                    <p className="text-red-700">{verificationDetails.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              {verificationStatus === 'pending' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Cancel Verification Request
                </button>
              )}
              
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Approved status view
  if (verificationStatus === 'approved') {
    const verifiedDate = verificationDetails?.verification_processed_at || verificationDetails?.id_verified_at;
    
    return (
      <>
        <div className="max-w-2xl">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 border-8 border-white shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Account Verified</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {verifiedDate ? (
                <>Your account has been verified on {new Date(verifiedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}.</>
              ) : (
                'Your account has been verified.'
              )}
              You now have access to all verified landlord benefits.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-green-50 text-green-800 rounded-full text-sm font-medium border border-green-200 mb-6">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              ✓ Verified Landlord Badge Active
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-3 bg-white border-2 border-[#BC8BBC] text-[#BC8BBC] rounded-lg font-semibold hover:bg-[#BC8BBC] hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Eye className="w-5 h-5" />
                View Verification Details
              </button>
              
              <p className="text-sm text-gray-500">
                You can review your submitted documents anytime
              </p>
            </div>
          </div>
        </div>
        
        {showPreview && <PreviewModal />}
        {activePreview && <EnhancedPreviewModal />}
        {showDeleteConfirm && <DeleteConfirmationModal />}
      </>
    );
  }

  // Pending status view
  if (verificationStatus === 'pending') {
    const submittedDate = verificationDetails?.verification_submitted_at;
    
    return (
      <>
        <div className="max-w-2xl">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6 border-8 border-white shadow-lg">
              <Clock className="w-12 h-12 text-yellow-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Verification Pending</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {submittedDate ? (
                <>Your verification request was submitted on {new Date(submittedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}.</>
              ) : (
                'Your verification request has been submitted.'
              )}
              This usually takes 24-48 hours. You'll be notified once the verification is complete.
            </p>
            <div className="inline-flex items-center px-6 py-3 bg-yellow-50 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200 animate-pulse mb-6">
              <Clock className="w-5 h-5 mr-2" />
              ⏳ Verification in Progress
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-3 bg-white border-2 border-[#BC8BBC] text-[#BC8BBC] rounded-lg font-semibold hover:bg-[#BC8BBC] hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Eye className="w-5 h-5" />
                Review Submitted Documents
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <Trash2 className="w-5 h-5" />
                Cancel Verification Request
              </button>
              
              <p className="text-sm text-gray-500">
                You cannot submit a new request while this one is pending
              </p>
            </div>
            
            <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200 max-w-md mx-auto">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">What happens next?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Our team reviews your documents</li>
                    <li>• You'll receive an email notification</li>
                    <li>• Status updates in your dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {showPreview && <PreviewModal />}
        {showDeleteConfirm && <DeleteConfirmationModal />}
        {activePreview && <EnhancedPreviewModal />}
      </>
    );
  }

  // Rejected status view
  if (verificationStatus === 'rejected') {
    const rejectedDate = verificationDetails?.verification_processed_at;
    
    return (
      <>
        <div className="max-w-2xl py-8">
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 mx-auto">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Verification Rejected</h3>
          
          {rejectedDate && (
            <p className="text-center text-gray-600 mb-6">
              Rejected on {new Date(rejectedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
          
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setShowPreview(true)}
              className="px-6 py-3 bg-white border-2 border-[#BC8BBC] text-[#BC8BBC] rounded-lg font-semibold hover:bg-[#BC8BBC] hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <Eye className="w-5 h-5" />
              View Rejection Details
            </button>
            
            <p className="text-sm text-gray-500 text-center">
              Review why your verification was rejected before resubmitting
            </p>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-8">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-2">How to Resubmit:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Address the reason for rejection mentioned above</li>
                  <li>• Ensure all documents are clear and readable</li>
                  <li>• Make sure your ID is not expired</li>
                  <li>• Provide complete information in your reason</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Once you've addressed the issues, you can resubmit your verification request
            </p>
            <button
              onClick={() => {
                setVerificationData({
                  nationalIdFront: null,
                  nationalIdBack: null,
                  passportPhoto: null,
                  verificationLetter: null,
                  verificationReason: '',
                });
                setPreviewImages({
                  nationalIdFront: null,
                  nationalIdBack: null,
                  passportPhoto: null,
                  verificationLetter: null
                });
              }}
              className="px-8 py-3 bg-[#BC8BBC] text-white rounded-lg font-semibold hover:bg-[#A573A5] transition-colors"
            >
              Resubmit Verification Request
            </button>
            <p className="text-sm text-gray-500 mt-3">
              You can resubmit with corrected documents anytime
            </p>
          </div>
        </div>
        
        {showPreview && <PreviewModal />}
        {activePreview && <EnhancedPreviewModal />}
        {showDeleteConfirm && <DeleteConfirmationModal />}
      </>
    );
  }

  // Not submitted - show verification form
  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmitVerification}>
        <div className="space-y-8">
          {/* Verification Info Banner */}
          <div className="bg-gradient-to-r from-[#BC8BBC] to-[#9c6b9c] p-6 rounded-xl text-white">
            <div className="flex items-start">
              <CheckCircle2 className="w-6 h-6 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-lg mb-2">Free Account Verification</h4>
                <p className="mb-3 opacity-90">
                  Verification is completely free and helps build trust with tenants. 
                  All documents are processed within 24-48 hours.
                </p>
                <div className="text-sm opacity-80">
                  <p className="font-medium mb-1">Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Clear photos of National ID (front & back)</li>
                    <li>Recent passport photo</li>
                    <li>Reason for verification request (min. 10 characters)</li>
                    <li>Verification letter (optional, but recommended)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* National ID Front & Back */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UploadArea 
              field="nationalIdFront"
              label="National ID - Front"
              required={true}
              instructions="Clear photo showing your photo and ID number"
            />
            
            <UploadArea 
              field="nationalIdBack"
              label="National ID - Back"
              required={true}
              instructions="Clear photo showing expiry date and other details"
            />
          </div>

          {/* Passport Photo */}
          <UploadArea 
            field="passportPhoto"
            label="Passport Photo"
            required={true}
            instructions="Recent passport-sized photo for identification"
          />

          {/* Verification Reason */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Reason for Verification Request
              </label>
              <span className="text-xs text-red-500">Required • Min. 10 characters</span>
            </div>
            <textarea
              value={verificationData.verificationReason}
              onChange={(e) => setVerificationData({...verificationData, verificationReason: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50 min-h-[100px]"
              placeholder="Please explain why you're requesting verification. For example: 'I want to become a verified landlord to build trust with potential tenants and access premium features.'"
              required
            />
            <div className="flex justify-between mt-1">
              <p className="text-sm text-gray-600">
                Briefly explain why you want to become a verified landlord
              </p>
              <p className={`text-xs ${verificationData.verificationReason.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
                {verificationData.verificationReason.length}/10 characters
              </p>
            </div>
          </div>

          {/* Verification Letter (Optional) */}
          <UploadArea 
            field="verificationLetter"
            label="Verification Letter"
            required={false}
            instructions="Letter from authorities or proof of property ownership"
          />

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={verificationLoading || verificationData.verificationReason.length < 10}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all relative overflow-hidden ${
                verificationLoading || verificationData.verificationReason.length < 10
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#BC8BBC] to-[#9c6b9c] hover:from-[#A573A5] hover:to-[#8a5a8a] text-white hover:shadow-lg transform hover:scale-[1.02] transition-all'
              }`}
            >
              {verificationLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  Submitting Request...
                </span>
              ) : (
                'Submit Verification Request'
              )}
            </button>
            
            <div className="text-center mt-4 space-y-2">
              <p className="text-gray-600 text-sm">
                📄 Verification is free and processed within 24-48 hours
              </p>
              <p className="text-xs text-gray-500">
                ⚡ You'll receive an email notification when your status changes
              </p>
            </div>
          </div>
        </div>
      </form>
      
      {/* Modals */}
      {showPreview && <PreviewModal />}
      {showDeleteConfirm && <DeleteConfirmationModal />}
      {activePreview && <EnhancedPreviewModal />}
    </div>
  );
};

export default VerificationSection;