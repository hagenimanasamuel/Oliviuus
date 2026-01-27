// src/pages/Booking/components/ConfirmPaymentStep.jsx
import React from 'react';
import { Check, Calendar, CreditCard, Shield } from 'lucide-react';

const ConfirmPaymentStep = ({
  property,
  bookingData,
  periodInfo,
  onBackStep,
  onPayment,
  formatPrice,
  calculateTotal,
  getCustomizationTotal,
  totalAmount,
  paymentProcessing
}) => {
  const customizationTotal = getCustomizationTotal();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Check className="h-6 w-6 text-[#BC8BBC]" />
        Confirm & Pay
      </h3>
      
      <div className="space-y-6">
        {/* Booking Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Booking Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{property.title}</span>
              <span className="font-medium text-gray-900">{periodInfo?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Start Date</span>
              <span className="font-medium text-gray-900">
                {new Date(bookingData.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium text-gray-900">
                {bookingData.duration} {periodInfo?.unit}
              </span>
            </div>
            {bookingData.guests > 1 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Guests</span>
                <span className="font-medium text-gray-900">{bookingData.guests} guests</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{periodInfo?.label} Rate × {bookingData.duration}</span>
              <span className="font-medium text-gray-900">{formatPrice(calculateTotal())}</span>
            </div>
            {customizationTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Additional Services</span>
                <span className="font-medium text-gray-900">{formatPrice(customizationTotal)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-[#BC8BBC]">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              {bookingData.paymentMethod === 'mtn' && <span className="text-2xl">🟡</span>}
              {bookingData.paymentMethod === 'airtel' && <span className="text-2xl">🔴</span>}
              {bookingData.paymentMethod === 'card' && <CreditCard className="h-5 w-5 text-gray-600" />}
              <span className="font-medium text-gray-900">
                {bookingData.paymentMethod === 'mtn' && 'MTN Mobile Money'}
                {bookingData.paymentMethod === 'airtel' && 'Airtel Money'}
                {bookingData.paymentMethod === 'card' && 'Credit/Debit Card'}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree to the Terms & Conditions and understand that my booking is subject to host approval.
              I authorize the charge for the total amount shown above.
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBackStep}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onPayment}
          disabled={paymentProcessing}
          className="flex-1 py-3 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paymentProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : (
            `Pay ${formatPrice(totalAmount)}`
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfirmPaymentStep;