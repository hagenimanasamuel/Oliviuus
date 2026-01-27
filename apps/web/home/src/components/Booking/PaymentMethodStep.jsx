// src/pages/Booking/components/PaymentMethodStep.jsx
import React from 'react';
import { CreditCard, Smartphone, Shield } from 'lucide-react';

const PaymentMethodStep = ({
  bookingData,
  onUpdateBookingData,
  onNextStep,
  onBackStep,
  formatPrice
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-[#BC8BBC]" />
        Select Payment Method
      </h3>
      
      <div className="space-y-4">
        {/* Mobile Money Options */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Mobile Money</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateBookingData({...bookingData, paymentMethod: 'mtn'})}
              className={`p-4 border rounded-lg text-center transition-all ${
                bookingData.paymentMethod === 'mtn'
                  ? 'border-[#BC8BBC] bg-[#BC8BBC]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🟡</div>
              <div className="font-medium text-gray-900">MTN Mobile Money</div>
              <div className="text-xs text-gray-500 mt-1">Pay with your MTN number</div>
            </button>
            <button
              onClick={() => onUpdateBookingData({...bookingData, paymentMethod: 'airtel'})}
              className={`p-4 border rounded-lg text-center transition-all ${
                bookingData.paymentMethod === 'airtel'
                  ? 'border-[#BC8BBC] bg-[#BC8BBC]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-medium text-gray-900">Airtel Money</div>
              <div className="text-xs text-gray-500 mt-1">Pay with your Airtel number</div>
            </button>
          </div>
        </div>

        {/* Card Payment */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Card Payment</span>
          </div>
          <button
            onClick={() => onUpdateBookingData({...bookingData, paymentMethod: 'card'})}
            className={`w-full p-4 border rounded-lg text-left transition-all ${
              bookingData.paymentMethod === 'card'
                ? 'border-[#BC8BBC] bg-[#BC8BBC]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Credit/Debit Card</div>
                <div className="text-sm text-gray-500">Visa, Mastercard, or other cards</div>
              </div>
            </div>
          </button>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Secure Payment</h4>
              <p className="text-sm text-blue-700">
                Your payment is processed securely through our encrypted payment gateway.
                Your card details are never stored on our servers.
              </p>
            </div>
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
          onClick={onNextStep}
          disabled={!bookingData.paymentMethod}
          className={`flex-1 py-3 rounded-lg font-medium transition-all ${
            bookingData.paymentMethod
              ? 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:shadow-lg'
              : 'bg-gray-200 cursor-not-allowed text-gray-500'
          }`}
        >
          Review & Confirm
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodStep;