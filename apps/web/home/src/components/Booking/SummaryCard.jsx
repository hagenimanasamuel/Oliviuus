// src/pages/Booking/components/SummaryCard.jsx
import React from 'react';
import { Home, Shield } from 'lucide-react';

const SummaryCard = ({
  property,
  bookingData,
  periodInfo,
  formatPrice,
  calculateTotal,
  getCustomizationTotal,
  totalAmount
}) => {
  const customizationTotal = getCustomizationTotal();

  return (
    <div className="sticky top-24">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Home className="h-5 w-5 text-[#BC8BBC]" />
          Booking Summary
        </h4>
        
        <div className="space-y-4">
          {/* Property Info */}
          <div className="flex items-start gap-3">
            {property.cover_image ? (
              <img 
                src={property.cover_image} 
                alt={property.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                <Home className="h-8 w-8 text-[#BC8BBC]/50" />
              </div>
            )}
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 text-sm line-clamp-2">{property.title}</h5>
              <p className="text-xs text-gray-500 mt-1">
                {property.district || 'Location'} • {property.sector || 'Area'}
              </p>
            </div>
          </div>

          {/* Booking Period */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-1">{periodInfo?.label} Booking</div>
            <div className="text-xs text-gray-600">
              {bookingData.duration} {periodInfo?.unit} • Starting {new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Price</span>
              <span className="font-medium text-gray-900">{formatPrice(calculateTotal())}</span>
            </div>
            {customizationTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Services</span>
                <span className="font-medium text-gray-900">{formatPrice(customizationTotal)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-lg text-[#BC8BBC]">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Secure Payment Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;