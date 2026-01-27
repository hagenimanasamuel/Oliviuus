// src/pages/Dashboard/Landlord/pages/AddPropertySteps/Step3Details.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bed, Bath, Square, Users, Check, Wifi, Car, Droplets, 
  Tv, Utensils, Dumbbell, Wind, Shield, Key, Thermometer,
  Coffee, Waves, Home, Building, Droplet, Sofa, Mic, MapPin,
  AlertCircle, Info, Moon, Sun, Calendar, Square as Chair, Layers, 
  Clock, Battery, Zap, Fan, Square as Couch, Refrigerator, Microwave,
  Square as Washer, Square as Iron, Square as Vacuum, Trash2, Square as Pillow, Lamp, Router, Speaker,
  Camera, Printer, Table, Shirt, Eye, Container, Armchair,
  HardDrive, VenetianMask
} from 'lucide-react';

export default function Step3Details({ formData, setFormData, errors, setErrors }) {
  // Room configuration with default values
  const [rooms, setRooms] = useState({
    bedrooms: 0,
    bathrooms: 0,
    livingRooms: 0,
    diningRooms: 0,
    kitchen: 0,
    storage: 0,
    balcony: 0,
    otherRooms: 0
  });

  // House equipment/essentials
  const [equipment, setEquipment] = useState({
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
  });

  // Custom guest input
  const [customGuests, setCustomGuests] = useState(formData.maxGuests || 2);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Initialize rooms from formData
  useEffect(() => {
    if (formData.rooms) {
      setRooms(formData.rooms);
    }
  }, []);

  // Update form data when rooms or equipment change
  useEffect(() => {
    const totalRooms = Object.values(rooms).reduce((sum, count) => sum + count, 0);
    setFormData(prev => ({
      ...prev,
      rooms: { ...rooms },
      equipment: { ...equipment },
      totalRooms: totalRooms
    }));
  }, [rooms, equipment]);

  // Update max guests when custom input changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      maxGuests: customGuests
    }));
  }, [customGuests]);

  // Rwanda-specific amenities
  const rwandaAmenities = [
    // Basic Infrastructure
    { id: 'electricity_24_7', name: '24/7 Electricity', icon: <Zap size={16} />, category: 'infrastructure', common: true },
    { id: 'running_water', name: 'Running Water', icon: <Droplet size={16} />, category: 'infrastructure', common: true },
    { id: 'wifi', name: 'WiFi Internet', icon: <Wifi size={16} />, category: 'infrastructure', common: true },
    { id: 'borehole', name: 'Borehole Water', icon: <Droplet size={16} />, category: 'infrastructure', common: true },
    { id: 'solar_power', name: 'Solar Power', icon: <Sun size={16} />, category: 'infrastructure', common: true },
    { id: 'generator', name: 'Generator Backup', icon: <Battery size={16} />, category: 'infrastructure', common: false },
    
    // Security Features
    { id: 'compound_security', name: 'Compound Security', icon: <Shield size={16} />, category: 'security', common: true },
    { id: 'watchman', name: 'Watchman/Guard', icon: <Moon size={16} />, category: 'security', common: true },
    { id: 'cctv', name: 'CCTV Cameras', icon: <Camera size={16} />, category: 'security', common: false },
    { id: 'alarm', name: 'Security Alarm', icon: <Shield size={16} />, category: 'security', common: false },
    { id: 'gate', name: 'Electric Gate', icon: <Key size={16} />, category: 'security', common: false },
    
    // Comfort & Climate
    { id: 'air_conditioning', name: 'Air Conditioning', icon: <Wind size={16} />, category: 'comfort', common: false },
    { id: 'ceiling_fans', name: 'Ceiling Fans', icon: <Fan size={16} />, category: 'comfort', common: true },
    { id: 'heating', name: 'Water Heating', icon: <Thermometer size={16} />, category: 'comfort', common: false },
    { id: 'fireplace', name: 'Fireplace', icon: <Thermometer size={16} />, category: 'comfort', common: false },
    
    // Entertainment & Electronics
    { id: 'television', name: 'Television', icon: <Tv size={16} />, category: 'entertainment', common: true },
    { id: 'dstv', name: 'DSTV/Freeview', icon: <Tv size={16} />, category: 'entertainment', common: true },
    { id: 'sound_system', name: 'Sound System', icon: <Speaker size={16} />, category: 'entertainment', common: false },
    { id: 'smart_tv', name: 'Smart TV', icon: <Tv size={16} />, category: 'entertainment', common: false },
    
    // Kitchen Facilities
    { id: 'fridge', name: 'Refrigerator', icon: <Refrigerator size={16} />, category: 'kitchen', common: true },
    { id: 'oven', name: 'Oven/Stove', icon: <Utensils size={16} />, category: 'kitchen', common: true },
    { id: 'microwave', name: 'Microwave', icon: <Microwave size={16} />, category: 'kitchen', common: false },
    { id: 'dishwasher', name: 'Dishwasher', icon: <Droplets size={16} />, category: 'kitchen', common: false },
    { id: 'kitchen_utensils', name: 'Kitchen Utensils', icon: <Utensils size={16} />, category: 'kitchen', common: true },
    
    // Laundry & Cleaning
    { id: 'washing_machine', name: 'Washing Machine', icon: <Washer size={16} />, category: 'laundry', common: false },
    { id: 'dryer', name: 'Clothes Dryer', icon: <Washer size={16} />, category: 'laundry', common: false },
    { id: 'iron', name: 'Iron & Board', icon: <Iron size={16} />, category: 'laundry', common: true },
    { id: 'vacuum', name: 'Vacuum Cleaner', icon: <Vacuum size={16} />, category: 'laundry', common: false },
    
    // Outdoor & Recreational
    { id: 'parking', name: 'Parking Space', icon: <Car size={16} />, category: 'outdoor', common: true },
    { id: 'garden', name: 'Garden/Yard', icon: <Sun size={16} />, category: 'outdoor', common: false },
    { id: 'balcony', name: 'Balcony/Veranda', icon: <Sun size={16} />, category: 'outdoor', common: true },
    { id: 'swimming_pool', name: 'Swimming Pool', icon: <Waves size={16} />, category: 'outdoor', common: false },
    { id: 'bbq_area', name: 'BBQ Area', icon: <Utensils size={16} />, category: 'outdoor', common: false },
    
    // Fitness & Wellness
    { id: 'gym', name: 'Home Gym', icon: <Dumbbell size={16} />, category: 'fitness', common: false },
    { id: 'yoga_space', name: 'Yoga Space', icon: <Dumbbell size={16} />, category: 'fitness', common: false },
    
    // Business & Work
    { id: 'workspace', name: 'Workspace/Desk', icon: <Home size={16} />, category: 'work', common: true },
    { id: 'high_speed_wifi', name: 'High-Speed WiFi', icon: <Wifi size={16} />, category: 'work', common: false },
    { id: 'printer', name: 'Printer/Scanner', icon: <Printer size={16} />, category: 'work', common: false },
    
    // Accessibility
    { id: 'elevator', name: 'Elevator', icon: <Building size={16} />, category: 'accessibility', common: false },
    { id: 'ramp', name: 'Wheelchair Ramp', icon: <Building size={16} />, category: 'accessibility', common: false },
    
    // Additional Features
    { id: 'storage', name: 'Storage Space', icon: <Layers size={16} />, category: 'additional', common: true },
    { id: 'backup_power', name: 'Power Backup', icon: <Battery size={16} />, category: 'additional', common: false },
    { id: 'rainwater', name: 'Rainwater Tank', icon: <Droplets size={16} />, category: 'additional', common: true },
    { id: 'water_filter', name: 'Water Filter', icon: <Droplet size={16} />, category: 'additional', common: false }
  ];

  // House equipment items
  const equipmentItems = [
    { id: 'beds', name: 'Beds', icon: <Bed size={16} />, field: 'beds' },
    { id: 'mattresses', name: 'Mattresses', icon: <Pillow size={16} />, field: 'mattresses' },
    { id: 'sofas', name: 'Sofas', icon: <Couch size={16} />, field: 'sofas' },
    { id: 'chairs', name: 'Chairs', icon: <Chair size={16} />, field: 'chairs' },
    { id: 'tables', name: 'Tables', icon: <Table size={16} />, field: 'tables' },
    { id: 'wardrobes', name: 'Wardrobes', icon: <Shirt size={16} />, field: 'wardrobes' },
    { id: 'shelves', name: 'Shelves', icon: <Layers size={16} />, field: 'shelves' },
    { id: 'lamps', name: 'Lamps', icon: <Lamp size={16} />, field: 'lamps' },
    { id: 'curtains', name: 'Curtains', icon: <VenetianMask size={16} />, field: 'curtains' },
    { id: 'mirrors', name: 'Mirrors', icon: <Eye size={16} />, field: 'mirrors' }
  ];

  // Validation
  const validateStep = () => {
    const newErrors = {};
    
    // Check if total rooms is at least 1
    const totalRooms = Object.values(rooms).reduce((sum, count) => sum + count, 0);
    if (totalRooms < 1) {
      newErrors.rooms = 'Property must have at least 1 room';
    }
    
    if (customGuests < 1) {
      newErrors.maxGuests = 'At least 1 guest is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-validate
  useEffect(() => {
    if (customGuests || Object.values(rooms).some(count => count > 0)) {
      validateStep();
    }
  }, [customGuests, rooms]);

  const handleRoomChange = (roomType, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setRooms(prev => ({
      ...prev,
      [roomType]: newValue
    }));
  };

  const handleEquipmentChange = (equipmentType, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setEquipment(prev => ({
      ...prev,
      [equipmentType]: newValue
    }));
  };

  const toggleAmenity = (id) => {
    setFormData(prev => {
      const isSelected = prev.amenities?.includes(id);
      return {
        ...prev,
        amenities: isSelected 
          ? prev.amenities.filter(a => a !== id)
          : [...(prev.amenities || []), id]
      };
    });
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

  const handleCustomGuestsChange = (value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    setCustomGuests(newValue);
  };

  // Group amenities by category
  const amenitiesByCategory = rwandaAmenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {});

  // Calculate total rooms
  const totalRooms = Object.values(rooms).reduce((sum, count) => sum + count, 0);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Property Details</h3>
        <p className="text-gray-600">Describe rooms, size, and available amenities</p>
      </div>
      
      <div className="space-y-8">
        {/* Property Measurements */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Square className="h-5 w-5 mr-2 text-gray-600" />
            Property Measurements
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Area - Not Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Area (m²)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="area"
                  value={formData.area || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                  placeholder="e.g., 120"
                />
                <div className="absolute right-3 top-3.5 text-gray-500">m²</div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total property area in square meters
              </p>
            </div>

            {/* Max Guests - Custom Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Guests *
              </label>
              
              {showCustomInput ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={customGuests}
                      onChange={(e) => handleCustomGuestsChange(e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    />
                    <div className="absolute right-3 top-3.5 text-gray-500">guests</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="text-sm text-[#8A5A8A] hover:text-[#BC8BBC]"
                  >
                    ← Use quick select instead
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden mb-2">
                    <button
                      type="button"
                      onClick={() => handleCustomGuestsChange(customGuests - 1)}
                      className="px-4 py-3 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-medium py-3">
                      {customGuests} {customGuests === 1 ? 'guest' : 'guests'}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCustomGuestsChange(customGuests + 1)}
                      className="px-4 py-3 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="text-sm text-[#8A5A8A] hover:text-[#BC8BBC] w-full text-center"
                  >
                    Enter custom number →
                  </button>
                </div>
              )}
              
              {errors.maxGuests && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.maxGuests}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Including children
              </p>
            </div>

            {/* Total Rooms Display */}
            <div className={`p-4 rounded-lg border ${totalRooms < 1 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="text-sm font-medium text-gray-700 mb-1">Total Rooms</div>
              <div className={`text-2xl font-bold ${totalRooms < 1 ? 'text-red-700' : 'text-blue-700'}`}>
                {totalRooms}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {totalRooms < 1 ? 'Add at least 1 room' : 'Sum of all room types'}
              </div>
            </div>
          </div>
          {errors.rooms && (
            <div className="flex items-center mt-3 text-red-600 text-sm">
              <AlertCircle size={12} className="mr-1" />
              {errors.rooms}
            </div>
          )}
        </div>

        {/* Room Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Room Configuration</h4>
            <p className="text-gray-600 text-sm">Specify the number of each room type</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Bedrooms */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Bed className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Bedrooms</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('bedrooms', rooms.bedrooms - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.bedrooms}
                  onChange={(e) => handleRoomChange('bedrooms', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('bedrooms', rooms.bedrooms + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bathrooms with Toilet Note */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Bath className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Bathrooms</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('bathrooms', rooms.bathrooms - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.bathrooms}
                  onChange={(e) => handleRoomChange('bathrooms', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('bathrooms', rooms.bathrooms + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Includes toilet & shower
              </div>
            </div>

            {/* Living Rooms */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Sofa className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Living Rooms</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('livingRooms', rooms.livingRooms - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.livingRooms}
                  onChange={(e) => handleRoomChange('livingRooms', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('livingRooms', rooms.livingRooms + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Dining Room (Salon de Manger) */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Utensils className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Dining Room</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('diningRooms', rooms.diningRooms - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.diningRooms}
                  onChange={(e) => handleRoomChange('diningRooms', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('diningRooms', rooms.diningRooms + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Kitchen */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Utensils className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Kitchen</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('kitchen', rooms.kitchen - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.kitchen}
                  onChange={(e) => handleRoomChange('kitchen', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('kitchen', rooms.kitchen + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Storage */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Layers className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Storage</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('storage', rooms.storage - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.storage}
                  onChange={(e) => handleRoomChange('storage', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('storage', rooms.storage + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Balcony */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Sun className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Balcony</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('balcony', rooms.balcony - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.balcony}
                  onChange={(e) => handleRoomChange('balcony', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('balcony', rooms.balcony + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* Other Rooms */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Home className="h-5 w-5 text-gray-500 mr-2" />
                <label className="text-sm font-medium text-gray-700">Other Rooms</label>
              </div>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleRoomChange('otherRooms', rooms.otherRooms - 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  -
                </button>
                <input
                  type="number"
                  value={rooms.otherRooms}
                  onChange={(e) => handleRoomChange('otherRooms', e.target.value)}
                  className="w-full text-center font-medium py-2 border-0 focus:ring-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => handleRoomChange('otherRooms', rooms.otherRooms + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Total Rooms Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#f4eaf4] to-[#f0f4ff] border border-[#BC8BBC] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Total Rooms</div>
                <div className="text-2xl font-bold text-[#8A5A8A]">{totalRooms}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Room Breakdown</div>
                <div className="text-xs text-gray-500">
                  {rooms.bedrooms} bedrooms • {rooms.bathrooms} bathrooms • {rooms.livingRooms} living rooms
                </div>
                <div className="text-xs text-gray-500">
                  {rooms.diningRooms} dining • {rooms.kitchen} kitchen • {rooms.storage} storage
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* House Equipment & Essentials */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">House Equipment & Essentials</h4>
            <p className="text-gray-600 text-sm">Specify available furniture and equipment</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {equipmentItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <div className="text-gray-500 mr-2">{item.icon}</div>
                  <label className="text-sm font-medium text-gray-700">{item.name}</label>
                </div>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleEquipmentChange(item.field, equipment[item.field] - 1)}
                    className="px-2 py-1 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={equipment[item.field]}
                    onChange={(e) => handleEquipmentChange(item.field, e.target.value)}
                    className="w-full text-center font-medium py-1 border-0 focus:ring-0 text-sm"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => handleEquipmentChange(item.field, equipment[item.field] + 1)}
                    className="px-2 py-1 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Equipment Summary */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Equipment Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {equipmentItems
                .filter(item => equipment[item.field] > 0)
                .map((item) => (
                  <div key={item.id} className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-1">{equipment[item.field]}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Amenities & Features</h4>
            <p className="text-gray-600 text-sm">Select amenities available in your property</p>
          </div>

          {/* Amenities by Category */}
          <div className="space-y-8">
            {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
              <div key={category}>
                <h5 className="font-medium text-gray-900 mb-4 capitalize">
                  {category === 'infrastructure' ? '🏗️ Infrastructure' : 
                   category === 'security' ? '🔒 Security' :
                   category === 'comfort' ? '💆 Comfort' :
                   category === 'entertainment' ? '📺 Entertainment' :
                   category === 'kitchen' ? '🍳 Kitchen' :
                   category === 'laundry' ? '👕 Laundry' :
                   category === 'outdoor' ? '🌳 Outdoor' :
                   category === 'fitness' ? '💪 Fitness' :
                   category === 'work' ? '💼 Work' :
                   category === 'accessibility' ? '♿ Accessibility' : '✨ Additional Features'}
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenities.map((amenity) => {
                    const isSelected = formData.amenities?.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`
                          p-3 border rounded-lg flex items-center justify-between transition-all text-sm
                          ${isSelected
                            ? 'border-[#BC8BBC] bg-[#f4eaf4] text-[#8A5A8A]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center">
                          <div className={`mr-2 ${isSelected ? 'text-[#8A5A8A]' : 'text-gray-400'}`}>
                            {amenity.icon}
                          </div>
                          <span className="text-left font-medium">{amenity.name}</span>
                        </div>
                        {isSelected && (
                          <Check size={14} className="text-[#BC8BBC] flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Selected Amenities Summary */}
          {(formData.amenities || []).length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-gray-900">
                  Selected Amenities ({formData.amenities.length})
                </h5>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map(amenityId => {
                  const amenity = rwandaAmenities.find(a => a.id === amenityId);
                  if (!amenity) return null;
                  return (
                    <div
                      key={amenityId}
                      className="px-3 py-2 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-lg flex items-center text-sm"
                    >
                      <span className="mr-1">{amenity.icon}</span>
                      <span>{amenity.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleAmenity(amenityId)}
                        className="ml-2 text-white hover:text-gray-200"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
              <Info className="h-6 w-6 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900">Property Details Tips</h5>
              <p className="text-sm text-gray-600">Make your listing more attractive</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">📊 Room Configuration</div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Include all room types for accuracy</li>
                <li>• Bathrooms include toilet & shower</li>
                <li>• Specify shared vs private facilities</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">🏠 Equipment Value</div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• List all available furniture</li>
                <li>• Include essential appliances</li>
                <li>• Guests can choose their own capacity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}