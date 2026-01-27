// src/pages/Dashboard/Landlord/pages/AddPropertyPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import Step1BasicInfo from './AddPropertySteps/Step1BasicInfo';
import Step2Location from './AddPropertySteps/Step2Location';
import Step3Details from './AddPropertySteps/Step3Details';
import Step4Pricing from './AddPropertySteps/Step4Pricing';
import Step5Rules from './AddPropertySteps/Step5Rules';
import Step6Review from './AddPropertySteps/Step6Review';
import api from '../../../api/axios';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';

// Validation functions remain the same
const validateStep = (step, formData) => {
  const errors = {};
  
  switch(step) {
    case 1:
      if (!formData.title.trim()) errors.title = 'Property title is required';
      else if (formData.title.length < 10) errors.title = 'Title should be at least 10 characters';
      
      if (!formData.description.trim()) errors.description = 'Description is required';
      else if (formData.description.length < 50) errors.description = 'Description should be at least 50 characters';
      
      if (formData.images.length < 3) errors.images = 'At least 3 photos are required';
      break;
      
    case 2:
      if (!formData.address.trim()) errors.address = 'Address is required';
      break;
      
    case 3:
      const totalRooms = (formData.rooms?.bedrooms || 0) + 
                         (formData.rooms?.bathrooms || 0) + 
                         (formData.rooms?.livingRooms || 0) + 
                         (formData.rooms?.diningRooms || 0) + 
                         (formData.rooms?.kitchen || 0) + 
                         (formData.rooms?.storage || 0) + 
                         (formData.rooms?.balcony || 0) + 
                         (formData.rooms?.otherRooms || 0);
      
      if (totalRooms < 1) errors.rooms = 'Property must have at least 1 room';
      if (formData.maxGuests < 1) errors.maxGuests = 'At least 1 guest is required';
      break;
      
    case 4:
      const paymentTypes = formData.paymentTypes || ['monthly'];
      const hasValidPrice = paymentTypes.some(type => {
        switch(type) {
          case 'monthly':
            return formData.monthlyPrice && formData.monthlyPrice >= 1000;
          case 'weekly':
            return formData.weeklyPrice && formData.weeklyPrice >= 250;
          case 'daily':
            return formData.dailyPrice && formData.dailyPrice >= 34;
          case 'nightly':
            return formData.nightlyPrice && formData.nightlyPrice >= 34;
          case 'quarterly':
          case 'semester':
          case 'yearly':
            return formData.monthlyPrice && formData.monthlyPrice >= 1000;
          default:
            return false;
        }
      });

      if (!hasValidPrice) {
        if (paymentTypes.includes('monthly') || 
            paymentTypes.includes('quarterly') || 
            paymentTypes.includes('semester') || 
            paymentTypes.includes('yearly')) {
          if (!formData.monthlyPrice) {
            errors.monthlyPrice = 'Monthly price is required for selected payment periods';
          } else if (formData.monthlyPrice < 1000) {
            errors.monthlyPrice = 'Monthly price must be at least 1000 RWF';
          }
        }
        
        if (paymentTypes.includes('weekly') && (!formData.weeklyPrice || formData.weeklyPrice < 250)) {
          errors.weeklyPrice = 'Weekly price must be at least 250 RWF';
        }
        
        if (paymentTypes.includes('daily') && (!formData.dailyPrice || formData.dailyPrice < 34)) {
          errors.dailyPrice = 'Daily price must be at least 34 RWF';
        }
        
        if (paymentTypes.includes('nightly') && (!formData.nightlyPrice || formData.nightlyPrice < 34)) {
          errors.nightlyPrice = 'Nightly price must be at least 34 RWF';
        }
        
        if (Object.keys(errors).length === 0) {
          errors.general = 'Please set prices for at least one selected payment period';
        }
      }
      
      if (!paymentTypes || paymentTypes.length === 0) {
        errors.paymentTypes = 'Please select at least one payment period';
      }
      break;
      
    case 5:
      if (!formData.checkInTime) errors.checkInTime = 'Check-in time is required';
      if (!formData.checkOutTime) errors.checkOutTime = 'Check-out time is required';
      break;
      
    case 6:
      break;
  }
  
  return errors;
};

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { 
    isanzureUser, 
    userType, 
    loading: authLoading,
    refreshIsanzureUser 
  } = useIsanzureAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Refs for scrolling
  const formContainerRef = useRef(null);
  const stepHeaderRef = useRef(null);

  // Scroll to top when step changes
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (formContainerRef.current) {
        const formTop = formContainerRef.current.offsetTop;
        window.scrollTo({ top: formTop - 20, behavior: 'smooth' });
        formContainerRef.current.scrollTop = 0;
      }
      if (stepHeaderRef.current) {
        stepHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    const timer = setTimeout(scrollToTop, 150);
    return () => clearTimeout(timer);
  }, [step]);

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'ghetto',
    images: [],
    address: '',
    province: '',
    district: '',
    sector: '',
    cell: '',
    village: '',
    isibo: '',
    country: 'Rwanda',
    nearbyAttractions: [],
    area: '',
    maxGuests: 2,
    amenities: [],
    rooms: {
      bedrooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      diningRooms: 0,
      kitchen: 0,
      storage: 0,
      balcony: 0,
      otherRooms: 0
    },
    equipment: {
      beds: 0,
      mattresses: 0,
      sofas: 0,
      chairs: 0,
      tables: 0,
      wardrobes: 0,
      shelves: 0,
      lamps: 0,
      curtains: 0,
      mirrors: 0
    },
    monthlyPrice: '',
    weeklyPrice: '',
    dailyPrice: '',
    nightlyPrice: '',
    paymentTypes: ['monthly'],
    maxAdvanceMonths: 3,
    maxSinglePaymentMonths: 6,
    utilitiesMin: '',
    utilitiesMax: '',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'flexible',
    houseRules: '',
    smokingAllowed: false,
    petsAllowed: false,
    eventsAllowed: false,
    guestsAllowed: false,
    latePaymentFee: 0,
    gracePeriodDays: 3,
  });

  const steps = [
    { number: 1, title: 'Basic Info', icon: '📝' },
    { number: 2, title: 'Location', icon: '📍' },
    { number: 3, title: 'Details', icon: '🏠' },
    { number: 4, title: 'Pricing', icon: '💰' },
    { number: 5, title: 'Rules', icon: '📋' },
    { number: 6, title: 'Review', icon: '👁️' },
  ];

  const handleNext = (e) => {
    e.preventDefault();
    const stepErrors = validateStep(step, formData);
    setErrors(stepErrors);
    
    if (Object.keys(stepErrors).length === 0) {
      setStep(prev => Math.min(prev + 1, 6));
    } else {
      const fieldsToTouch = Object.keys(stepErrors).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(prev => ({ ...prev, ...fieldsToTouch }));
      
      setTimeout(() => {
        const firstErrorField = document.querySelector('.border-red-300, .text-red-600');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // Check if user is registered as landlord in iSanzure
  useEffect(() => {
    if (!authLoading && isanzureUser && userType !== 'landlord') {
      alert('You need to register as a landlord before adding properties');
      navigate('/landlord/dashboard/become-landlord');
    }
  }, [authLoading, isanzureUser, userType, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps
    let allErrors = {};
    for (let i = 1; i <= 6; i++) {
      const stepErrors = validateStep(i, formData);
      allErrors = { ...allErrors, ...stepErrors };
    }
    
    setErrors(allErrors);
    
    if (Object.keys(allErrors).length > 0) {
      alert('Please fix all errors before submitting');
      return;
    }
    
    // Verify iSanzure user exists and is a landlord
    if (authLoading) {
      alert('Please wait while we verify your account...');
      return;
    }
    
    if (!isanzureUser) {
      alert('Your iSanzure account is not set up. Please register as a landlord first.');
      navigate('/landlord/dashboard/become-landlord');
      return;
    }
    
    if (userType !== 'landlord') {
      alert('You must be registered as a landlord to add properties.');
      navigate('/landlord/dashboard/become-landlord');
      return;
    }
    
    // Get the correct landlord ID from iSanzure user
    const landlordId = isanzureUser.id || isanzureUser.isanzure_user_id;
    
    if (!landlordId) {
      alert('Unable to retrieve your landlord ID. Please refresh the page or contact support.');
      await refreshIsanzureUser();
      return;
    }
    
    console.log('🔑 Using landlord ID for property creation:', landlordId);
    
    setLoading(true);
    
    try {
      // Prepare FormData
      const formDataToSend = new FormData();
      
      // Calculate total rooms
      const totalRooms = (formData.rooms?.bedrooms || 0) + 
                         (formData.rooms?.bathrooms || 0) + 
                         (formData.rooms?.livingRooms || 0) + 
                         (formData.rooms?.diningRooms || 0) + 
                         (formData.rooms?.kitchen || 0) + 
                         (formData.rooms?.storage || 0) + 
                         (formData.rooms?.balcony || 0) + 
                         (formData.rooms?.otherRooms || 0);
      
      // Step 1: Basic Info
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      
      // Step 2: Location
      formDataToSend.append('address', formData.address);
      formDataToSend.append('province', formData.province);
      formDataToSend.append('district', formData.district);
      formDataToSend.append('sector', formData.sector);
      formDataToSend.append('cell', formData.cell);
      formDataToSend.append('village', formData.village);
      formDataToSend.append('isibo', formData.isibo);
      formDataToSend.append('country', formData.country || 'Rwanda');
      
      // Nearby attractions
      formDataToSend.append('nearbyAttractions', JSON.stringify(formData.nearbyAttractions || []));
      
      // Step 3: Details
      formDataToSend.append('area', formData.area || '');
      formDataToSend.append('maxGuests', formData.maxGuests || 2);
      formDataToSend.append('amenities', JSON.stringify(formData.amenities || []));
      formDataToSend.append('rooms', JSON.stringify(formData.rooms || {}));
      formDataToSend.append('equipment', JSON.stringify(formData.equipment || {}));
      formDataToSend.append('totalRooms', totalRooms);
      
      // Step 4: Pricing
      formDataToSend.append('monthlyPrice', formData.monthlyPrice);
      
      const weeklyPrice = formData.weeklyPrice || 
                         (formData.monthlyPrice ? Math.round(formData.monthlyPrice / 4) : '');
      const dailyPrice = formData.dailyPrice || 
                        (formData.monthlyPrice ? Math.round(formData.monthlyPrice / 30) : '');
      const nightlyPrice = formData.nightlyPrice || 
                          (formData.monthlyPrice ? Math.round(formData.monthlyPrice / 30) : '');
      
      if (weeklyPrice) formDataToSend.append('weeklyPrice', weeklyPrice);
      if (dailyPrice) formDataToSend.append('dailyPrice', dailyPrice);
      if (nightlyPrice) formDataToSend.append('nightlyPrice', nightlyPrice);
      
      formDataToSend.append('paymentTypes', JSON.stringify(formData.paymentTypes || ['monthly']));
      formDataToSend.append('maxAdvanceMonths', formData.maxAdvanceMonths || 3);
      formDataToSend.append('maxSinglePaymentMonths', formData.maxSinglePaymentMonths || 6);
      
      if (formData.utilitiesMin) formDataToSend.append('utilitiesMin', formData.utilitiesMin);
      if (formData.utilitiesMax) formDataToSend.append('utilitiesMax', formData.utilitiesMax);
      
      // Step 5: Rules
      formDataToSend.append('checkInTime', formData.checkInTime || '14:00');
      formDataToSend.append('checkOutTime', formData.checkOutTime || '11:00');
      formDataToSend.append('cancellationPolicy', formData.cancellationPolicy || 'flexible');
      formDataToSend.append('houseRules', formData.houseRules || '');
      formDataToSend.append('smokingAllowed', formData.smokingAllowed ? 'true' : 'false');
      formDataToSend.append('petsAllowed', formData.petsAllowed ? 'true' : 'false');
      formDataToSend.append('eventsAllowed', formData.eventsAllowed ? 'true' : 'false');
      formDataToSend.append('guestsAllowed', formData.guestsAllowed ? 'true' : 'false');
      formDataToSend.append('latePaymentFee', formData.latePaymentFee || 0);
      formDataToSend.append('gracePeriodDays', formData.gracePeriodDays || 3);
      
      // ✅ CORRECT LANDLORD ID - This is the iSanzure database user ID
      formDataToSend.append('landlordId', landlordId);
      
      // Add images
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image.file);
      });
      
      // Debug logging
      console.log('📤 Submitting property with:', {
        landlordId,
        userType,
        title: formData.title,
        monthlyPrice: formData.monthlyPrice,
        imageCount: formData.images.length
      });
      
      // Make API call
      const response = await api.post('/properties', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      
      if (response.data.success) {
        alert('🎉 Property added successfully!');
        navigate('/landlord/dashboard/properties');
      } else {
        throw new Error(response.data.message || 'Failed to create property');
      }
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      
      let errorMessage = 'Error adding property. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        console.error('Server response:', error.response.data);
        
        if (error.response.status === 400) {
          if (error.response.data.details) {
            errorMessage = error.response.data.details;
          } else if (error.response.data.missingFields) {
            errorMessage = `Missing: ${error.response.data.missingFields.join(', ')}`;
          }
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#8A5A8A] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your account information...</p>
        </div>
      </div>
    );
  }

  // If not a landlord yet
  if (!isanzureUser || userType !== 'landlord') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🏠</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Register as a Landlord</h2>
          <p className="text-gray-600 mb-6">
            You need to register as a landlord before you can list properties on iSanzure.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/landlord/dashboard/become-landlord')}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Register as Landlord
            </button>
            <button
              onClick={() => navigate('/landlord/dashboard')}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = Math.round((step / 6) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-gray-600 mt-2">List your property and start earning today</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/landlord/dashboard/properties')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              View Properties
            </button>
            <button
              onClick={() => navigate('/landlord/dashboard')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Save & Exit
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-[#8A5A8A]">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="relative">
          <div className="hidden lg:block absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {steps.map((stepItem) => (
              <div key={stepItem.number} className="relative">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                    transition-all duration-300 z-10
                    ${step === stepItem.number 
                      ? 'bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] text-white shadow-lg scale-110' 
                      : step > stepItem.number 
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                    }
                  `}>
                    {step > stepItem.number ? <Check size={20} /> : stepItem.icon}
                  </div>
                  <span className={`
                    mt-3 text-sm font-medium text-center
                    ${step === stepItem.number ? 'text-[#8A5A8A]' : 'text-gray-500'}
                  `}>
                    {stepItem.title}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Step {stepItem.number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center text-red-700 font-medium mb-2">
            <AlertCircle size={18} className="mr-2" />
            Please fix the following errors to continue:
          </div>
          <ul className="text-sm text-red-600 space-y-1">
            {Object.entries(errors).map(([key, error]) => (
              error && <li key={key}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form Container */}
      <div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        ref={formContainerRef}
      >
        <form onSubmit={handleSubmit}>
          {/* Step Header */}
          <div 
            className="border-b border-gray-200 p-6 bg-gradient-to-r from-gray-50 to-white"
            ref={stepHeaderRef}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {steps[step - 1].title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {step === 1 && 'Start with basic information about your property'}
                  {step === 2 && 'Tell guests where your property is located'}
                  {step === 3 && 'Add details about rooms, size, and amenities'}
                  {step === 4 && 'Set your rental prices and payment preferences'}
                  {step === 5 && 'Define house rules and policies'}
                  {step === 6 && 'Review and publish your listing'}
                </p>
              </div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Step {step} of 6
              </div>
            </div>
          </div>

          {/* Step Components */}
          <div className="p-6">
            {step === 1 && (
              <Step1BasicInfo 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {step === 2 && (
              <Step2Location 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {step === 3 && (
              <Step3Details 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {step === 4 && (
              <Step4Pricing 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {step === 5 && (
              <Step5Rules 
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {step === 6 && (
              <Step6Review 
                formData={formData}
                errors={errors}
                setErrors={setErrors}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Fields marked with * are required
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1}
                  className={`
                    px-6 py-3 rounded-xl font-medium transition-all border border-gray-300
                    ${step === 1 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                    }
                  `}
                >
                  Back
                </button>

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5 min-w-[140px]"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Publishing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Check className="mr-2" size={18} />
                        Publish Property
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {/* Step Validation Status */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-4 flex items-center text-red-600 text-sm">
                <AlertCircle size={16} className="mr-2" />
                Please fix all errors before continuing
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}