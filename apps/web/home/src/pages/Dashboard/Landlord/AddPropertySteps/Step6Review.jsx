// src/pages/Dashboard/Landlord/pages/AddPropertySteps/Step6Review.jsx
import React from 'react';
import { 
  Home, MapPin, Bed, DollarSign, Star, Check, 
  Calendar, Clock, Users, Building, Zap, 
  Shield, AlertCircle, Info, CreditCard, 
  Globe, Phone, Mail, MessageCircle,
  Square, Bath, Sofa, Utensils, Sun, Layers,
  Car, Wifi, Droplet, Tv, Shield as SecurityIcon,
  Wind, Thermometer, Camera, Key, Calendar as CalIcon,
  Moon, Users as GuestsIcon, Percent
} from 'lucide-react';

export default function Step6Review({ formData }) {
  // Property type mapping
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'villa', label: 'Villa', icon: '🏡' },
    { value: 'condo', label: 'Condo', icon: '🏘️' },
    { value: 'studio', label: 'Studio', icon: '🏢' },
    { value: 'penthouse', label: 'Penthouse', icon: '🏢' },
    { value: 'townhouse', label: 'Townhouse', icon: '🏘️' },
    { value: 'ghetto', label: 'Ghetto House', icon: '🏠' },
    { value: 'living_house', label: 'Living House', icon: '🏠' },
    { value: 'upmarket', label: 'Upmarket House', icon: '🏡' },
    { value: 'service_apartment', label: 'Service Apartment', icon: '🏢' },
    { value: 'guest_house', label: 'Guest House', icon: '🏠' },
    { value: 'bungalow', label: 'Bungalow', icon: '🏠' },
    { value: 'commercial', label: 'Commercial Building', icon: '🏢' },
    { value: 'hostel', label: 'Hostel', icon: '🏢' },
  ];

  // Cancellation policy mapping
  const cancellationPolicies = [
    { value: 'flexible', label: 'Flexible', description: 'Full refund 1 day before arrival' },
    { value: 'moderate', label: 'Moderate', description: 'Full refund 5 days before arrival' },
    { value: 'strict', label: 'Strict', description: '50% refund up to 1 week before arrival' },
  ];

  // Payment types mapping
  const paymentTypes = [
    { id: 'monthly', name: 'Monthly' },
    { id: 'quarterly', name: 'Quarterly' },
    { id: 'semester', name: 'Semester' },
    { id: 'yearly', name: 'Yearly' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'daily', name: 'Daily' },
    { id: 'nightly', name: 'Nightly' },
  ];

  // Calculate total rooms
  const calculateTotalRooms = () => {
    return (formData.rooms?.bedrooms || 0) + 
           (formData.rooms?.bathrooms || 0) + 
           (formData.rooms?.livingRooms || 0) + 
           (formData.rooms?.diningRooms || 0) + 
           (formData.rooms?.kitchen || 0) + 
           (formData.rooms?.storage || 0) + 
           (formData.rooms?.balcony || 0) + 
           (formData.rooms?.otherRooms || 0);
  };

  // Format currency
  const formatRWF = (amount) => {
    if (!amount && amount !== 0) return 'Not set';
    return amount.toLocaleString('en-RW') + ' RWF';
  };

  // Get selected payment type names
  const getSelectedPaymentTypes = () => {
    return (formData.paymentTypes || ['monthly'])
      .map(typeId => {
        const type = paymentTypes.find(t => t.id === typeId);
        return type ? type.name : typeId;
      })
      .join(', ');
  };

  // Get property type label
  const getPropertyTypeLabel = () => {
    const type = propertyTypes.find(t => t.value === formData.propertyType);
    return type ? type.label : formData.propertyType;
  };

  // Calculate platform commission (10%)
  const calculateCommission = (price) => {
    return price ? Math.round(price * 0.10) : 0;
  };

  // Calculate landlord receives
  const calculateLandlordReceives = (price) => {
    return price ? price - calculateCommission(price) : 0;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit Property</h3>
        <p className="text-gray-600">Review all information before publishing your property</p>
      </div>
      
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{calculateTotalRooms()}</div>
            <div className="text-sm text-gray-600 mt-1">Total Rooms</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formData.maxGuests || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Max Guests</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#8A5A8A]">{formData.images?.length || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Photos</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {formData.monthlyPrice ? formatRWF(formData.monthlyPrice) : 'Not set'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Monthly Price</div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Home className="h-5 w-5 mr-2 text-[#BC8BBC]" />
            Step 1: Basic Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Property Title</label>
                <p className="font-semibold text-gray-900 mt-1">{formData.title || 'Not set'}</p>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Property Type</label>
                <p className="font-semibold text-gray-900 mt-1">{getPropertyTypeLabel()}</p>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-700 mt-1 line-clamp-3">{formData.description || 'No description'}</p>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Photos Uploaded</label>
                <p className="font-semibold text-gray-900 mt-1">{formData.images?.length || 0} images</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Location Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-[#BC8BBC]" />
            Step 2: Location Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Full Address</label>
                <p className="font-semibold text-gray-900 mt-1">{formData.address || 'Not set'}</p>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Location Hierarchy</label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Country:</span> {formData.country || 'Rwanda'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Province:</span> {formData.province || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">District:</span> {formData.district || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Sector:</span> {formData.sector || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Cell:</span> {formData.cell || 'Not set'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Village:</span> {formData.village || 'Not set'}
                  </p>
                  {formData.isibo && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Isibo/Agace:</span> {formData.isibo}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600">Nearby Attractions</label>
                <div className="mt-2">
                  {(formData.nearbyAttractions || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.nearbyAttractions.map((attraction, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                          {attraction}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No attractions specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Property Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Building className="h-5 w-5 mr-2 text-[#BC8BBC]" />
            Step 3: Property Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Property Measurements</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Area:</span>
                    <span className="font-medium">{formData.area || '0'} m²</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Maximum Guests:</span>
                    <span className="font-medium">{formData.maxGuests || 0} guests</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Rooms:</span>
                    <span className="font-medium">{calculateTotalRooms()} rooms</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Room Configuration</h5>
                <div className="grid grid-cols-2 gap-3">
                  {formData.rooms?.bedrooms > 0 && (
                    <div className="flex items-center">
                      <Bed size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.bedrooms} Bedrooms</span>
                    </div>
                  )}
                  {formData.rooms?.bathrooms > 0 && (
                    <div className="flex items-center">
                      <Bath size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.bathrooms} Bathrooms</span>
                    </div>
                  )}
                  {formData.rooms?.livingRooms > 0 && (
                    <div className="flex items-center">
                      <Sofa size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.livingRooms} Living Rooms</span>
                    </div>
                  )}
                  {formData.rooms?.diningRooms > 0 && (
                    <div className="flex items-center">
                      <Utensils size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.diningRooms} Dining Rooms</span>
                    </div>
                  )}
                  {formData.rooms?.kitchen > 0 && (
                    <div className="flex items-center">
                      <Utensils size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.kitchen} Kitchen</span>
                    </div>
                  )}
                  {formData.rooms?.storage > 0 && (
                    <div className="flex items-center">
                      <Layers size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.storage} Storage</span>
                    </div>
                  )}
                  {formData.rooms?.balcony > 0 && (
                    <div className="flex items-center">
                      <Sun size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.balcony} Balcony</span>
                    </div>
                  )}
                  {formData.rooms?.otherRooms > 0 && (
                    <div className="flex items-center">
                      <Home size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm">{formData.rooms.otherRooms} Other Rooms</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">House Equipment</h5>
                <div className="grid grid-cols-2 gap-3">
                  {formData.equipment?.beds > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.beds} Beds
                    </div>
                  )}
                  {formData.equipment?.mattresses > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.mattresses} Mattresses
                    </div>
                  )}
                  {formData.equipment?.sofas > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.sofas} Sofas
                    </div>
                  )}
                  {formData.equipment?.chairs > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.chairs} Chairs
                    </div>
                  )}
                  {formData.equipment?.tables > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.tables} Tables
                    </div>
                  )}
                  {formData.equipment?.wardrobes > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.wardrobes} Wardrobes
                    </div>
                  )}
                  {formData.equipment?.shelves > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.shelves} Shelves
                    </div>
                  )}
                  {formData.equipment?.lamps > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.lamps} Lamps
                    </div>
                  )}
                  {formData.equipment?.curtains > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.curtains} Curtains
                    </div>
                  )}
                  {formData.equipment?.mirrors > 0 && (
                    <div className="text-sm text-gray-700">
                      {formData.equipment.mirrors} Mirrors
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-4">Amenities Selected</h5>
                <div className="flex flex-wrap gap-2">
                  {(formData.amenities || []).length > 0 ? (
                    formData.amenities.slice(0, 8).map((amenity, index) => (
                      <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        {amenity.replace(/_/g, ' ')}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No amenities selected</p>
                  )}
                  {(formData.amenities || []).length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{formData.amenities.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Pricing & Payment */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-[#BC8BBC]" />
            Step 4: Pricing & Payment
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Accepted Payment Periods</h5>
                <p className="font-semibold text-gray-900">{getSelectedPaymentTypes()}</p>
              </div>
              
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Payment Limits</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Maximum Advance:</span>
                    <span className="font-medium">{formData.maxAdvanceMonths || 3} months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Single Payment:</span>
                    <span className="font-medium">{formData.maxSinglePaymentMonths || 6} months</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-900 mb-4">Pricing Details</h5>
              <div className="space-y-3">
                {formData.monthlyPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Price:</span>
                    <span className="font-semibold text-gray-900">{formatRWF(formData.monthlyPrice)}</span>
                  </div>
                )}
                {formData.weeklyPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Weekly Price:</span>
                    <span className="font-semibold text-gray-900">{formatRWF(formData.weeklyPrice)}</span>
                  </div>
                )}
                {formData.dailyPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Daily Price:</span>
                    <span className="font-semibold text-gray-900">{formatRWF(formData.dailyPrice)}</span>
                  </div>
                )}
                {formData.nightlyPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nightly Price:</span>
                    <span className="font-semibold text-gray-900">{formatRWF(formData.nightlyPrice)}</span>
                  </div>
                )}
                
                {/* Calculated Prices */}
                {formData.monthlyPrice > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">Calculated Prices:</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Quarterly (3 months):</span>
                        <span>{formatRWF(formData.monthlyPrice * 3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Semester (6 months):</span>
                        <span>{formatRWF(formData.monthlyPrice * 6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yearly (12 months):</span>
                        <span>{formatRWF(formData.monthlyPrice * 12)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Utilities Information */}
          {formData.showUtilitiesSection && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h5 className="font-medium text-gray-900 mb-4">Utilities Information</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Monthly Utilities:</span>
                  <span className="font-medium">
                    {formData.utilitiesMin ? formatRWF(formData.utilitiesMin) : 'Not set'} - {formData.utilitiesMax ? formatRWF(formData.utilitiesMax) : 'Not set'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Note: Utilities are separate from rent and paid directly by tenant based on usage.
                </p>
              </div>
            </div>
          )}
          
          {/* Platform Commission */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h5 className="font-medium text-gray-900 mb-4">Platform Commission (10%)</h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tenant Pays Monthly:</span>
                <span className="font-semibold text-gray-900">{formatRWF(formData.monthlyPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform Fee (10%):</span>
                <span className="font-semibold text-amber-600">- {formatRWF(calculateCommission(formData.monthlyPrice))}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600 font-medium">You Receive Monthly:</span>
                <span className="font-bold text-green-600">{formatRWF(calculateLandlordReceives(formData.monthlyPrice))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Rules & Policies */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-[#BC8BBC]" />
            Step 5: Rules & Policies
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Check-in & Check-out</h5>
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{formData.checkInTime || '14:00'}</div>
                    <div className="text-sm text-gray-500">Check-in Time</div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{formData.checkOutTime || '11:00'}</div>
                    <div className="text-sm text-gray-500">Check-out Time</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Cancellation Policy</h5>
                <div>
                  <div className="font-semibold text-gray-900">
                    {cancellationPolicies.find(p => p.value === formData.cancellationPolicy)?.label || 'Flexible'}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {cancellationPolicies.find(p => p.value === formData.cancellationPolicy)?.description}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-6">
                <h5 className="font-medium text-gray-900 mb-4">Payment Rules</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Grace Period:</span>
                    <span className="font-medium">{formData.gracePeriodDays || 3} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Late Payment Fee:</span>
                    <span className="font-medium">{formData.latePaymentFee || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-4">Property Rules</h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {formData.smokingAllowed ? (
                      <Check size={16} className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-red-500 mr-2">✗</span>
                    )}
                    <span className="text-sm text-gray-700">Smoking {formData.smokingAllowed ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                  <div className="flex items-center">
                    {formData.petsAllowed ? (
                      <Check size={16} className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-red-500 mr-2">✗</span>
                    )}
                    <span className="text-sm text-gray-700">Pets {formData.petsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                  <div className="flex items-center">
                    {formData.eventsAllowed ? (
                      <Check size={16} className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-red-500 mr-2">✗</span>
                    )}
                    <span className="text-sm text-gray-700">Events/Parties {formData.eventsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                  <div className="flex items-center">
                    {formData.guestsAllowed ? (
                      <Check size={16} className="text-green-500 mr-2" />
                    ) : (
                      <span className="text-red-500 mr-2">✗</span>
                    )}
                    <span className="text-sm text-gray-700">Overnight Guests {formData.guestsAllowed ? 'Allowed' : 'Not Allowed'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* House Rules */}
          {formData.houseRules && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h5 className="font-medium text-gray-900 mb-4">Additional House Rules</h5>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">{formData.houseRules}</p>
              </div>
            </div>
          )}
        </div>

        {/* Final Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-4">Property Summary</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-sm font-medium text-green-700 mb-3">🏠 Property Details</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex justify-between">
                      <span>Property Type:</span>
                      <span className="font-medium">{getPropertyTypeLabel()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Total Rooms:</span>
                      <span className="font-medium">{calculateTotalRooms()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Max Guests:</span>
                      <span className="font-medium">{formData.maxGuests || 0}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Total Area:</span>
                      <span className="font-medium">{formData.area || '0'} m²</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-sm font-medium text-green-700 mb-3">💰 Pricing Summary</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex justify-between">
                      <span>Monthly Rent:</span>
                      <span className="font-medium">{formatRWF(formData.monthlyPrice)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Payment Periods:</span>
                      <span className="font-medium">{getSelectedPaymentTypes()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span className="font-medium">10%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>You Receive:</span>
                      <span className="font-bold text-green-600">{formatRWF(calculateLandlordReceives(formData.monthlyPrice))}</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-sm font-medium text-green-700 mb-3">📍 Location</div>
                  <p className="text-sm text-gray-700 truncate">{formData.address || 'Not set'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {[formData.village, formData.cell, formData.sector, formData.district].filter(Boolean).join(', ')}
                  </p>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="text-sm font-medium text-green-700 mb-3">📋 Rules Summary</div>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>Check-in: {formData.checkInTime || '14:00'}</li>
                    <li>Check-out: {formData.checkOutTime || '11:00'}</li>
                    <li>Cancellation: {formData.cancellationPolicy || 'flexible'}</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Info size={16} className="text-amber-500 mr-2" />
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Ready to publish:</span> Your property listing contains all information from all 5 steps. Click "Publish Property" to make it live.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}