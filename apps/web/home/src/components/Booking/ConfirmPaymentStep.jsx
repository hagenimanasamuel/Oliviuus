// src/components/Booking/ConfirmPaymentStep.jsx
import React, { useState } from 'react';
import { 
  Check, 
  AlertCircle, 
  ArrowLeft
} from 'lucide-react';
import PaymentModal from './PaymentModal';

const ConfirmPaymentStep = ({
  property,
  propertyUid,
  bookingData,
  periodInfo,
  onBackStep,
  onPayment,
  formatPrice,
  calculateTotal,
  getCustomizationTotal,
  totalAmount,
  paymentProcessing,
  userBalance = 0,
  userLoanLimit = 0
}) => {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const customizationTotal = getCustomizationTotal();

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleOpenPaymentModal = () => {
    if (!agreeToTerms) {
      setTermsError(true);
      return;
    }
    setTermsError(false);
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Check className="h-6 w-6 text-[#BC8BBC]" />
          Confirm & Finish
        </h3>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Booking Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Property</span>
                  <span className="text-sm font-medium text-gray-900 truncate ml-2" title={property.title}>
                    {property.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Period</span>
                  <span className="text-sm font-medium text-gray-900">{periodInfo?.label}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Start Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDisplayDate(bookingData.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Duration</span>
                  <span className="text-sm font-medium text-gray-900">
                    {bookingData.duration} {periodInfo?.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Price Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600">{periodInfo?.label} Rate</span>
                  <span className="text-xs text-gray-500 ml-1">× {bookingData.duration}</span>
                </div>
                <span className="font-medium text-gray-900">{formatPrice(calculateTotal())}</span>
              </div>
              
              {customizationTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Additional Services</span>
                  <span className="font-medium text-gray-900">{formatPrice(customizationTotal)}</span>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-300 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-[#BC8BBC]">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${termsError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (termsError && e.target.checked) {
                    setTermsError(false);
                  }
                }}
                className="mt-0.5 h-4 w-4 text-[#BC8BBC] focus:ring-[#BC8BBC] border-gray-300 rounded"
              />
              <label htmlFor="terms" className="text-xs text-gray-700 flex-1">
                I agree to the Terms & Conditions and understand that my booking is subject to host approval.
                I authorize the charge for the total amount shown above.
              </label>
            </div>
            
            {termsError && (
              <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>Please agree to the terms and conditions to proceed</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onBackStep}
            disabled={paymentProcessing}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={handleOpenPaymentModal}
            disabled={paymentProcessing}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              paymentProcessing
                ? 'bg-gray-200 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            Finish Payment
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          bookingData={bookingData}
          totalAmount={totalAmount}
          userBalance={userBalance}
          userLoanLimit={userLoanLimit}
          formatPrice={formatPrice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={onPayment}
          propertyUid={propertyUid}
          startDate={bookingData.startDate}
          duration={bookingData.duration}
          bookingPeriod={bookingData.period}
        />
      )}
    </>
  );
};

export default ConfirmPaymentStep;