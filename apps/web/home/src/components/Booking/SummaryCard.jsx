// src/components/Booking/SummaryCard.jsx
import React from 'react';
import { Home, Shield, Calendar, Clock, Check } from 'lucide-react';

const SummaryCard = ({
  property,
  bookingData,
  periodInfo,
  formatPrice,
  calculateTotal,
  getCustomizationTotal,
  totalAmount,
  paymentSchedule,
  firstPayment,
  utilitiesInfo
}) => {
  const customizationTotal = getCustomizationTotal();
  const baseTotal = calculateTotal();
  const hasPricing = baseTotal > 0;
  const currentPayment = paymentSchedule?.[0];
  const isMonthlyBooking = bookingData.period === 'monthly';

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
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-gray-900">{periodInfo?.label} Booking</div>
              <div className="text-sm font-bold text-[#BC8BBC]">
                {hasPricing ? formatPrice(baseTotal / bookingData.duration) : 'Contact'}
              </div>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Starting {new Date(bookingData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="text-xs text-gray-600 flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              <span>{bookingData.duration} {periodInfo?.unit}</span>
            </div>
          </div>

          {/* First Payment */}
          {currentPayment && (
            <div className="p-3 bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 rounded-lg border border-[#BC8BBC]/30">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">First Payment</div>
                <div className="text-xl font-bold text-[#BC8BBC]">
                  {formatPrice(currentPayment.amount)}
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {currentPayment.description}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rent Amount</span>
              <span className="font-medium text-gray-900">
                {hasPricing ? formatPrice(baseTotal) : 'Contact for pricing'}
              </span>
            </div>
            
            {customizationTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Additional Services</span>
                <span className="font-medium text-gray-900">{formatPrice(customizationTotal)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between font-bold">
                <span>Total Amount</span>
                <span className="text-lg text-[#BC8BBC]">
                  {hasPricing ? formatPrice(totalAmount) : 'Contact Host'}
                </span>
              </div>
            </div>
          </div>

          {/* Utilities Note - Only for monthly */}
          {isMonthlyBooking && utilitiesInfo && !utilitiesInfo.included && utilitiesInfo.min > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-700">
              <div className="flex items-start gap-1">
                <div className="mt-0.5 flex-shrink-0">💡</div>
                <div>
                  Utilities (electricity, water) are paid separately based on actual usage.
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Check className="h-3 w-3 text-green-500" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Check className="h-3 w-3 text-green-500" />
              <span>Flexible cancellation options</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Check className="h-3 w-3 text-green-500" />
              <span>24/7 customer support</span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;