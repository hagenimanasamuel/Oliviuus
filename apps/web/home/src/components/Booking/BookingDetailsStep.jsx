// src/pages/Booking/components/BookingDetailsStep.jsx
import React from 'react';
import { Calendar, Users, Check, Package } from 'lucide-react';

const BookingDetailsStep = ({
  property,
  bookingData,
  periodInfo,
  onUpdateBookingData,
  onNextStep,
  formatPrice,
  getCustomizationOptions,
  onCustomizationToggle,
  getGuestOptions,
  getPropertyType,
  propertyUid,
  navigate,
  basePrice
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calendar className="h-6 w-6 text-[#BC8BBC]" />
        Booking Details
      </h3>
      
      <div className="space-y-6">
        {/* Selected Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selected Period
          </label>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900 text-lg">{periodInfo?.label}</div>
                <div className="text-sm text-gray-600">{formatPrice(basePrice)} per {periodInfo?.unit?.slice(0, -1)}</div>
              </div>
              <button
                onClick={() => navigate(`/property/${propertyUid}`)}
                className="text-sm text-[#BC8BBC] hover:underline"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={bookingData.startDate}
            onChange={(e) => onUpdateBookingData({...bookingData, startDate: e.target.value})}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 outline-none transition-all"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration ({periodInfo?.unit})
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onUpdateBookingData({...bookingData, duration: Math.max(1, bookingData.duration - 1)})}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:border-[#BC8BBC] hover:text-[#BC8BBC] transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-900">{bookingData.duration}</div>
              <div className="text-sm text-gray-500">{periodInfo?.unit}</div>
            </div>
            <button
              onClick={() => onUpdateBookingData({...bookingData, duration: bookingData.duration + 1})}
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:border-[#BC8BBC] hover:text-[#BC8BBC] transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Guests */}
        {(getPropertyType() === 'guest_house' || getPropertyType() === 'hotel' || getPropertyType() === 'hostel') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of Guests
            </label>
            <select
              value={bookingData.guests}
              onChange={(e) => onUpdateBookingData({...bookingData, guests: parseInt(e.target.value)})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 outline-none transition-all"
            >
              {getGuestOptions().map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customizations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Additional Services (Optional)
          </label>
          <div className="space-y-3">
            {getCustomizationOptions().map(option => (
              <div
                key={option.id}
                onClick={() => onCustomizationToggle(option.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  bookingData.customizations.includes(option.id)
                    ? 'border-[#BC8BBC] bg-[#BC8BBC]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      bookingData.customizations.includes(option.id)
                        ? 'bg-[#BC8BBC] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{formatPrice(option.price)}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    bookingData.customizations.includes(option.id)
                      ? 'bg-[#BC8BBC] border-[#BC8BBC]'
                      : 'border-gray-300'
                  }`}>
                    {bookingData.customizations.includes(option.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            value={bookingData.specialRequests}
            onChange={(e) => onUpdateBookingData({...bookingData, specialRequests: e.target.value})}
            placeholder="Any special requirements or requests..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 outline-none transition-all resize-none"
          />
        </div>
      </div>

      <button
        onClick={onNextStep}
        className="w-full mt-6 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-lg font-medium hover:shadow-lg transition-all"
      >
        Continue to Payment
      </button>
    </div>
  );
};

export default BookingDetailsStep;