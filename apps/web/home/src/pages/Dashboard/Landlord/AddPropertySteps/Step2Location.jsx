// src/pages/Dashboard/Landlord/pages/AddPropertySteps/Step2Location.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Globe, Building, Home, Map, AlertCircle, Check, ChevronDown, Search, Plus, X } from 'lucide-react';
import rwandaLocationData from '../../../../data/rwandaGeoData.json';

export default function Step2Location({ formData, setFormData, errors, setErrors }) {
  const [showProvincesDropdown, setShowProvincesDropdown] = useState(false);
  const [showDistrictsDropdown, setShowDistrictsDropdown] = useState(false);
  const [showSectorsDropdown, setShowSectorsDropdown] = useState(false);
  const [showCellsDropdown, setShowCellsDropdown] = useState(false);
  const [showVillagesDropdown, setShowVillagesDropdown] = useState(false);
  const [showLandmarksDropdown, setShowLandmarksDropdown] = useState(false);
  const [customLandmark, setCustomLandmark] = useState('');
  const [searchLandmark, setSearchLandmark] = useState('');
  const landmarksSearchRef = useRef(null);
  const dropdownsRef = useRef(null);

  // Rwanda provinces from JSON
  const provinces = Object.keys(rwandaLocationData || {});
  
  // Districts based on selected province
  const districts = formData.province && rwandaLocationData[formData.province] 
    ? Object.keys(rwandaLocationData[formData.province]) 
    : [];
  
  // Sectors based on selected district
  const sectors = formData.province && formData.district && rwandaLocationData[formData.province]?.[formData.district]
    ? Object.keys(rwandaLocationData[formData.province][formData.district])
    : [];
  
  // Cells based on selected sector
  const cells = formData.province && formData.district && formData.sector && 
                rwandaLocationData[formData.province]?.[formData.district]?.[formData.sector]
    ? Object.keys(rwandaLocationData[formData.province][formData.district][formData.sector])
    : [];
  
  // Villages based on selected cell
  const villages = formData.province && formData.district && formData.sector && formData.cell &&
                   rwandaLocationData[formData.province]?.[formData.district]?.[formData.sector]?.[formData.cell]
    ? rwandaLocationData[formData.province][formData.district][formData.sector][formData.cell]
    : [];

  // Rwanda landmarks (simplified for dropdown)
  const rwandaLandmarks = [
    // National Parks & Nature
    'Volcanoes National Park', 'Akagera National Park', 'Nyungwe National Park', 
    'Lake Kivu Beach', 'Mount Karisimbi', 'Gishwati-Mukura National Park', 'SABYINYO',
    // Kigali City
    'Kigali Genocide Memorial', 'Kigali Convention Centre', 'Kimironko Market',
    'Kigali Heights', 'Kigali City Tower', 'Kigali International Airport',
    // Popular Areas
    'Kwa Nyirangarama', 'Kwa Kirenge', 'Kwa Sina', 'Kwa Rubangura',
    'Kwa Gatare', 'Kwa Gikondo', 'Kwa Remera', 'Kwa Kimihurura', 'kwamakuza',
    // Major Markets
    'Nyabugogo Market', 'Gikondo Market', 'Kicukiro Market', 'Remera Market',
    'Gisozi Market', 'Kwa Mutangana (Downtown Market)',
    // Historical Sites
    'Nyanza King\'s Palace', 'Inema Arts Center', 'Kandt House Museum',
    'Ethnographic Museum (Butare)', 'National Museum of Rwanda',
    // Education
    'University of Rwanda (Kigali)', 'University of Rwanda (Huye)',
    'Kigali Independent University (ULK)', 'Carnegie Mellon University Africa', 'INES Ruhengeri', 'UR', 'IPRC TUMBA', 'IPRC MUSANZE', 'IPRC', 'IPRC KARONGI', 'CST',
    // Sports & Recreation
    'Rwanda National Stadium', 'Kigali Arena', 'Kigali Golf Club',
    'Gisenyi Beach', 'Rubavu Beach', 'Kivu Belt Marina',
    // Hospitals
    'King Faisal Hospital', 'Rwanda Military Hospital', 'CHUK Hospital',
    'Kibagabaga Hospital', 'Muhima Hospital',
    // Transport
    'Nyabugogo Bus Station', 'Kigali Central Taxi Park', 'Gikondo Taxi Park',
    'Kimironko Taxi Park', 'Kicukiro Taxi Park',
    // Business
    'Kigali Business Centre', 'Kigali Industrial Zone', 'Gikondo Expo Grounds',
    'Kigali Special Economic Zone', 'Fatima hotel', 'Grand Legacy Hotel',
    'Hotel des Mille Collines', 'Radisson Blu Hotel Kigali', 'Marriott Hotel Kigali', 
    'Ubumwe Grande Hotel', 'Serena Hotel Kigali', 'hiltop hotel', 'Heaven Boutique Hotel',
    // Others
    'Amahoro National Stadium', 'Rwanda Cultural Village', 'Caplaki Craft Village',
    'Nyamirambo Women\'s Center', 'Kigali Public Library', 'Rwanda Art Museum'
  ];

  // Filter landmarks based on search
  const filteredLandmarks = searchLandmark
    ? rwandaLandmarks.filter(landmark =>
        landmark.toLowerCase().includes(searchLandmark.toLowerCase())
      ).slice(0, 10)
    : rwandaLandmarks.slice(0, 10); // Show top 10 when no search

  // Validation
  useEffect(() => {
    if (formData.province || formData.district || formData.address) {
      const newErrors = {};
      
      if (!formData.address?.trim()) {
        newErrors.address = 'Address is required';
      }
      
      if (!formData.province) {
        newErrors.province = 'Province is required';
      }
      
      if (!formData.district) {
        newErrors.district = 'District is required';
      }
      
      if (!formData.sector) {
        newErrors.sector = 'Sector is required';
      }
      
      if (!formData.cell) {
        newErrors.cell = 'Cell is required';
      }
      
      if (!formData.village) {
        newErrors.village = 'Village is required';
      }
      
      setErrors(newErrors);
    }
  }, [formData, setErrors]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownsRef.current && !dropdownsRef.current.contains(event.target)) {
        setShowProvincesDropdown(false);
        setShowDistrictsDropdown(false);
        setShowSectorsDropdown(false);
        setShowCellsDropdown(false);
        setShowVillagesDropdown(false);
        setShowLandmarksDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle landmark search focus
  useEffect(() => {
    if (showLandmarksDropdown && landmarksSearchRef.current) {
      landmarksSearchRef.current.focus();
    }
  }, [showLandmarksDropdown]);

  const handleProvinceChange = (province) => {
    setFormData(prev => ({
      ...prev,
      province,
      district: '',
      sector: '',
      cell: '',
      village: ''
    }));
    setErrors(prev => ({ ...prev, province: '', district: '', sector: '', cell: '', village: '' }));
    setShowProvincesDropdown(false);
    setShowDistrictsDropdown(true);
  };

  const handleDistrictChange = (district) => {
    setFormData(prev => ({
      ...prev,
      district,
      sector: '',
      cell: '',
      village: ''
    }));
    setErrors(prev => ({ ...prev, district: '', sector: '', cell: '', village: '' }));
    setShowDistrictsDropdown(false);
    setShowSectorsDropdown(true);
  };

  const handleSectorChange = (sector) => {
    setFormData(prev => ({
      ...prev,
      sector,
      cell: '',
      village: ''
    }));
    setErrors(prev => ({ ...prev, sector: '', cell: '', village: '' }));
    setShowSectorsDropdown(false);
    setShowCellsDropdown(true);
  };

  const handleCellChange = (cell) => {
    setFormData(prev => ({
      ...prev,
      cell,
      village: ''
    }));
    setErrors(prev => ({ ...prev, cell: '', village: '' }));
    setShowCellsDropdown(false);
    setShowVillagesDropdown(true);
  };

  const handleVillageChange = (village) => {
    setFormData(prev => ({
      ...prev,
      village
    }));
    setErrors(prev => ({ ...prev, village: '' }));
    setShowVillagesDropdown(false);
  };

  const handleLandmarkSelect = (landmark) => {
    if (!formData.nearbyAttractions?.includes(landmark)) {
      setFormData(prev => ({
        ...prev,
        nearbyAttractions: [...(prev.nearbyAttractions || []), landmark]
      }));
    }
    setShowLandmarksDropdown(false);
    setSearchLandmark('');
  };

  const handleRemoveLandmark = (landmark) => {
    setFormData(prev => ({
      ...prev,
      nearbyAttractions: prev.nearbyAttractions?.filter(a => a !== landmark) || []
    }));
  };

  const handleAddCustomLandmark = () => {
    if (customLandmark.trim() && !formData.nearbyAttractions?.includes(customLandmark)) {
      setFormData(prev => ({
        ...prev,
        nearbyAttractions: [...(prev.nearbyAttractions || []), customLandmark.trim()]
      }));
      setCustomLandmark('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">📍 Property Location</h3>
        <p className="text-gray-600">Where is your property located in Rwanda?</p>
      </div>
      
      <div className="space-y-8" ref={dropdownsRef}>
        {/* Fixed Country */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-3 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-700">Country</div>
                <div className="text-sm text-gray-500">Rwanda</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-white border border-gray-300 rounded-lg">
              <span className="text-sm font-medium text-gray-900">🇷🇼 Rwanda</span>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6">Location Details</h4>
          
          <div className="space-y-6">
            {/* Province */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProvincesDropdown(!showProvincesDropdown)}
                  className={`
                    w-full px-4 py-3 rounded-lg flex items-center justify-between
                    border transition-all relative
                    ${formData.province
                      ? 'bg-white border-blue-500 text-gray-900'
                      : errors.province
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Building size={16} className="mr-2 text-gray-400" />
                    <span>{formData.province || 'Select Province'}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showProvincesDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {provinces.map((province) => (
                      <button
                        key={province}
                        type="button"
                        onClick={() => handleProvinceChange(province)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <span>{province}</span>
                        {formData.province === province && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.province && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.province}
                </div>
              )}
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => formData.province && setShowDistrictsDropdown(!showDistrictsDropdown)}
                  disabled={!formData.province}
                  className={`
                    w-full px-4 py-3 rounded-lg flex items-center justify-between
                    border transition-all relative
                    ${!formData.province
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : formData.district
                      ? 'bg-white border-blue-500 text-gray-900'
                      : errors.district
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    <span>{formData.district || 'Select District'}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showDistrictsDropdown && districts.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {districts.map((district) => (
                      <button
                        key={district}
                        type="button"
                        onClick={() => handleDistrictChange(district)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <span>{district}</span>
                        {formData.district === district && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.district && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.district}
                </div>
              )}
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sector *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => formData.district && setShowSectorsDropdown(!showSectorsDropdown)}
                  disabled={!formData.district}
                  className={`
                    w-full px-4 py-3 rounded-lg flex items-center justify-between
                    border transition-all
                    ${!formData.district
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : formData.sector
                      ? 'bg-white border-blue-500 text-gray-900'
                      : errors.sector
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Map size={16} className="mr-2 text-gray-400" />
                    <span>{formData.sector || 'Select Sector'}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showSectorsDropdown && sectors.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {sectors.map((sector) => (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => handleSectorChange(sector)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <span>{sector}</span>
                        {formData.sector === sector && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.sector && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.sector}
                </div>
              )}
            </div>

            {/* Cell */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cell *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => formData.sector && setShowCellsDropdown(!showCellsDropdown)}
                  disabled={!formData.sector}
                  className={`
                    w-full px-4 py-3 rounded-lg flex items-center justify-between
                    border transition-all
                    ${!formData.sector
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : formData.cell
                      ? 'bg-white border-blue-500 text-gray-900'
                      : errors.cell
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Home size={16} className="mr-2 text-gray-400" />
                    <span>{formData.cell || 'Select Cell'}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showCellsDropdown && cells.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {cells.map((cell) => (
                      <button
                        key={cell}
                        type="button"
                        onClick={() => handleCellChange(cell)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <span>{cell}</span>
                        {formData.cell === cell && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.cell && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.cell}
                </div>
              )}
            </div>

            {/* Village */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => formData.cell && setShowVillagesDropdown(!showVillagesDropdown)}
                  disabled={!formData.cell}
                  className={`
                    w-full px-4 py-3 rounded-lg flex items-center justify-between
                    border transition-all
                    ${!formData.cell
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : formData.village
                      ? 'bg-white border-blue-500 text-gray-900'
                      : errors.village
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-400" />
                    <span>{formData.village || 'Select Village'}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {showVillagesDropdown && villages.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {villages.map((village) => (
                      <button
                        key={village}
                        type="button"
                        onClick={() => handleVillageChange(village)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <span>{village}</span>
                        {formData.village === village && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.village && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.village}
                </div>
              )}
            </div>

            {/* Isibo/Agace (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Isibo/Agace (Optional)
              </label>
              <input
                type="text"
                name="isibo"
                value={formData.isibo || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Isibo cya Kabuga"
              />
            </div>
          </div>

          {/* Selected Location Summary */}
          {formData.village && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-gray-700 mb-1">Location:</div>
              <div className="font-medium text-gray-900">
                {formData.village}, {formData.cell}, {formData.sector}, {formData.district}
              </div>
            </div>
          )}
        </div>

        {/* Street Address */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Street Address</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              House Details *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                rows={3}
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-all duration-200
                  ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}
                `}
                placeholder="e.g., House Number 123, KN 45 Street"
                required
              />
            </div>
            {errors.address && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle size={12} className="mr-1" />
                {errors.address}
              </div>
            )}
          </div>
        </div>

        {/* Nearby Landmarks - Optional */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Nearby Landmarks (Optional)</h4>
            <p className="text-sm text-gray-500">Add landmarks to help guests find your property</p>
          </div>

          {/* Selected Landmarks Display */}
          {(formData.nearbyAttractions || []).length > 0 && (
            <div className="mb-6">
              <div className="text-sm text-gray-700 mb-2">
                Selected ({formData.nearbyAttractions.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.nearbyAttractions.map((landmark) => (
                  <div
                    key={landmark}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center text-sm"
                  >
                    <span>{landmark}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLandmark(landmark)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Landmark Search */}
          <div className="relative">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                ref={landmarksSearchRef}
                type="text"
                value={searchLandmark}
                onChange={(e) => {
                  setSearchLandmark(e.target.value);
                  if (!showLandmarksDropdown) {
                    setShowLandmarksDropdown(true);
                  }
                }}
                onFocus={() => setShowLandmarksDropdown(true)}
                placeholder="Search landmarks..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Landmarks Dropdown - Fixed positioning */}
            {showLandmarksDropdown && (
              <div className="absolute z-40 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredLandmarks.map((landmark) => (
                  <button
                    key={landmark}
                    type="button"
                    onClick={() => handleLandmarkSelect(landmark)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm">{landmark}</span>
                    {(formData.nearbyAttractions || []).includes(landmark) && (
                      <Check size={14} className="text-blue-500" />
                    )}
                  </button>
                ))}
                {filteredLandmarks.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No landmarks found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add Custom Landmark */}
          <div className="mt-6">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={customLandmark}
                  onChange={(e) => setCustomLandmark(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomLandmark()}
                  placeholder="Add a custom landmark"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomLandmark}
                disabled={!customLandmark.trim()}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-1">
                Complete location helps guests find you
              </div>
              <p className="text-xs text-gray-600">
                Fill all required fields for better property visibility
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}