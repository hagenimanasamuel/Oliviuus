// src/pages/Dashboard/Landlord/pages/AddPropertySteps/Step1BasicInfo.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Home, Upload, Trash2, X, Camera, AlertCircle, Check } from 'lucide-react';

export default function Step1BasicInfo({ formData, setFormData, errors, setErrors }) {
  const fileInputRef = useRef(null);
  const [imageErrors, setImageErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Rwanda-specific property types
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'villa', label: 'Villa', icon: '🏡' },
    { value: 'condo', label: 'Condo', icon: '🏘️' },
    { value: 'studio', label: 'Studio', icon: '🏢' },
    { value: 'penthouse', label: 'Penthouse', icon: '🏢' },
    { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
    { value: 'ghetto', label: 'Ghetto House', icon: '🏠', description: 'Affordable housing' },
    { value: 'living_house', label: 'Living House', icon: '🏠', description: 'Residential house' },
    { value: 'upmarket', label: 'Upmarket House', icon: '🏡', description: 'Luxury residence' },
    { value: 'service_apartment', label: 'Service Apartment', icon: '🏢', description: 'Serviced living' },
    { value: 'guest_house', label: 'Guest House', icon: '🏠', description: 'Tourist accommodation' },
    { value: 'bungalow', label: 'Bungalow', icon: '🏠', description: 'Single-story house' },
    { value: 'commercial', label: 'Commercial Building', icon: '🏢', description: 'Business property' },
    { value: 'hostel', label: 'Hostel', icon: '🏢', description: 'Shared accommodation' },
  ];

  // Validation rules
  const validateStep = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Property title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title should be at least 10 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description should be at least 50 characters';
    }
    
    if (formData.images.length < 3) {
      newErrors.images = 'At least 3 photos are required';
    } else if (formData.images.length > 10) {
      newErrors.images = 'Maximum 10 photos allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-validate on changes
  useEffect(() => {
    if (formData.title || formData.description || formData.images.length > 0) {
      validateStep();
    }
  }, [formData.title, formData.description, formData.images.length]);

  const validateImage = (file) => {
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}. Please upload JPEG, PNG, or WebP.`);
    }
    
    if (file.size > maxSize) {
      errors.push(`File too large: ${(file.size / (1024*1024)).toFixed(2)}MB. Max size is 5MB.`);
    }
    
    return errors;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setImageErrors([]);
    
    const newErrors = [];
    const validFiles = [];
    
    // Check total files won't exceed limit
    if (formData.images.length + files.length > 10) {
      newErrors.push(`Cannot upload ${files.length} files. Maximum 10 images total.`);
      setImageErrors(newErrors);
      setUploading(false);
      return;
    }
    
    // Validate each file
    files.forEach((file, index) => {
      const fileErrors = validateImage(file);
      if (fileErrors.length > 0) {
        newErrors.push(`${file.name}: ${fileErrors.join(', ')}`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (newErrors.length > 0) {
      setImageErrors(newErrors);
    }
    
    // Process valid files with simulated upload progress
    if (validFiles.length > 0) {
      const newImages = await Promise.all(
        validFiles.map(async (file, index) => {
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, index * 100));
          
          // Create preview with optimized image
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                // Create canvas for resizing (optional)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (max 1200px width)
                const maxWidth = 1200;
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                  height = (height * maxWidth) / width;
                  width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const optimizedPreview = canvas.toDataURL('image/jpeg', 0.8);
                
                resolve({
                  file,
                  preview: optimizedPreview,
                  id: Date.now() + Math.random(),
                  name: file.name,
                  size: (file.size / (1024*1024)).toFixed(2) + 'MB',
                  uploaded: true
                });
              };
              img.src = e.target.result;
            };
            reader.readAsDataURL(file);
          });
        })
      );
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
    
    setUploading(false);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };

  const setCoverImage = (index) => {
    const newImages = [...formData.images];
    const [coverImage] = newImages.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      images: [coverImage, ...newImages]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const totalImageSize = formData.images.reduce((total, img) => total + (img.file?.size || 0), 0);
  const totalSizeMB = (totalImageSize / (1024 * 1024)).toFixed(2);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h3>
        <p className="text-gray-600">Start by providing basic details about your property</p>
      </div>
      
      <div className="space-y-8">
        {/* Title with validation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Property Title *
            </label>
            <span className="text-xs text-gray-500">
              {formData.title.length}/100 characters
            </span>
          </div>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            maxLength={100}
            className={`
              w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent
              transition-all duration-200
              ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
            `}
            placeholder="e.g., Beautiful 3-Bedroom Apartment in Kigali Heights"
          />
          {errors.title && (
            <div className="flex items-center mt-2 text-red-600 text-sm">
              <AlertCircle size={14} className="mr-1" />
              {errors.title}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Be descriptive to attract more guests
          </p>
        </div>

        {/* Description with validation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Description *
            </label>
            <span className="text-xs text-gray-500">
              {formData.description.length}/2000 characters
            </span>
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={6}
            maxLength={2000}
            className={`
              w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent
              transition-all duration-200
              ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
            `}
            placeholder="Describe your property in detail. Include unique features, nearby attractions, and what makes it special..."
          />
          {errors.description && (
            <div className="flex items-center mt-2 text-red-600 text-sm">
              <AlertCircle size={14} className="mr-1" />
              {errors.description}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Include details about rooms, views, amenities, and local attractions
          </p>
        </div>

        {/* Property Type - Rwanda specific */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Property Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {propertyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, propertyType: type.value }))}
                className={`
                  p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all
                  hover:shadow-md transform hover:-translate-y-0.5
                  ${formData.propertyType === type.value 
                    ? 'border-[#BC8BBC] bg-gradient-to-br from-[#f4eaf4] to-[#f9f0f9] text-[#8A5A8A] shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                  }
                `}
              >
                <span className="text-2xl mb-2">{type.icon}</span>
                <span className="text-sm font-semibold text-center">{type.label}</span>
                {type.description && (
                  <span className="text-xs text-gray-500 mt-1 text-center">{type.description}</span>
                )}
                {formData.propertyType === type.value && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#BC8BBC] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload - Professional Version */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Property Photos *
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Upload high-quality photos. First image will be the cover photo.
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{formData.images.length}/10</span> images • 
              <span className="ml-2">{totalSizeMB}MB/50MB</span>
            </div>
          </div>

          {/* Upload Area */}
          <div className={`
            border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
            ${uploading ? 'border-[#BC8BBC] bg-[#f4eaf4]' : 'border-gray-300 hover:border-[#BC8BBC] hover:bg-[#f9f0f9]'}
            ${errors.images ? 'border-red-300 bg-red-50' : ''}
          `}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading || formData.images.length >= 10}
            />
            
            <div className="max-w-md mx-auto">
              {uploading ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 mx-auto border-4 border-[#BC8BBC] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600">Uploading and optimizing images...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] rounded-full flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <label className="cursor-pointer">
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {formData.images.length === 0 
                        ? 'Upload Property Photos' 
                        : 'Add More Photos'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Drag & drop or click to browse
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={formData.images.length >= 10}
                      className={`
                        px-6 py-2 rounded-lg font-medium transition-all
                        ${formData.images.length >= 10
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#BC8BBC] text-white hover:bg-[#8A5A8A]'
                        }
                      `}
                    >
                      {formData.images.length >= 10 ? 'Maximum Reached' : 'Select Files'}
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 mt-4">
                    High-resolution JPEG, PNG, or WebP • Max 5MB per image • 10 images maximum
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Error Messages */}
          {imageErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center text-red-700 font-medium mb-2">
                <AlertCircle size={16} className="mr-2" />
                Upload Errors
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {imageErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {errors.images && (
            <div className="flex items-center mt-2 text-red-600 text-sm">
              <AlertCircle size={14} className="mr-1" />
              {errors.images}
            </div>
          )}

          {/* Image Gallery */}
          {formData.images.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-700">Uploaded Photos</h4>
                <div className="text-sm text-gray-500">
                  {formData.images.length} photo{formData.images.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200"
                  >
                    {/* Cover Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white text-xs font-medium rounded-lg shadow-sm">
                        Cover Photo
                      </div>
                    )}
                    
                    {/* Image */}
                    <img
                      src={image.preview}
                      alt={`Property ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    
                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-xs truncate">{image.name}</div>
                      <div className="text-xs opacity-75">{image.size}</div>
                    </div>
                    
                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center space-x-2">
                      {/* Set as Cover Button (not for first image) */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => setCoverImage(index)}
                          className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all px-3 py-1.5 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100"
                        >
                          Set Cover
                        </button>
                      )}
                      
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {/* Upload Success Badge */}
                    {image.uploaded && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add More Button */}
                {formData.images.length < 10 && (
                  <label className={`
                    aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center
                    cursor-pointer transition-all hover:border-[#BC8BBC] hover:bg-[#f4eaf4]
                    border-gray-300
                  `}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Add More</span>
                    <span className="text-xs text-gray-400 mt-1">
                      {10 - formData.images.length} left
                    </span>
                  </label>
                )}
              </div>
              
              {/* Image Tips */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Camera className="h-4 w-4 mr-2 text-blue-500" />
                  Photo Tips for Better Results
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use natural light for brighter, clearer photos</li>
                  <li>• Take wide shots to show room dimensions</li>
                  <li>• Include photos of unique features and amenities</li>
                  <li>• Show exterior, living areas, bedrooms, and bathrooms</li>
                  <li>• Keep photos recent and accurate</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}