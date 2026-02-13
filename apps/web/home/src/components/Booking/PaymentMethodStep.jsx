// src/pages/Booking/components/PaymentMethodStep.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Shield, Wallet, TrendingUp, AlertCircle, Check, X, Info } from 'lucide-react';

const PaymentMethodStep = ({
  bookingData,
  onUpdateBookingData,
  onNextStep,
  onBackStep,
  formatPrice,
  userBalance = 0, // User's iSanzure balance
  userLoanLimit = 0, // User's available loan limit
  userLoanEligible = false, // Whether user is eligible for loan
  totalAmount // Total booking amount
}) => {
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Calculate if user has enough balance (only when they select it)
  const hasEnoughBalance = userBalance >= totalAmount;
  const hasEnoughLoanLimit = userLoanLimit >= totalAmount;
  const balanceShortfall = totalAmount - userBalance;
  const loanLimitShortfall = totalAmount - userLoanLimit;

  // Validate payment method when user tries to continue
  const validatePaymentMethod = () => {
    setValidationError('');
    
    if (!bookingData.paymentMethod) {
      setValidationError('Please select a payment method');
      return false;
    }
    
    // Validate balance payment
    if (bookingData.paymentMethod === 'balance') {
      if (userBalance === 0) {
        setValidationError('Your iSanzure balance is 0. Please add funds or choose another payment method.');
        return false;
      }
      if (!hasEnoughBalance) {
        setValidationError(`Insufficient balance. You need ${formatPrice(balanceShortfall)} more.`);
        return false;
      }
    }
    
    // Validate loan payment
    if (bookingData.paymentMethod === 'loan') {
      if (!userLoanEligible) {
        setValidationError('You are not eligible for loan payment. Please choose another payment method.');
        return false;
      }
      if (!hasEnoughLoanLimit) {
        setValidationError(`Insufficient loan limit. You need ${formatPrice(loanLimitShortfall)} more limit.`);
        return false;
      }
    }
    
    return true;
  };

  // Handle next step with validation
  const handleNext = () => {
    if (validatePaymentMethod()) {
      onNextStep();
    }
  };

  // Clear validation error when payment method changes
  useEffect(() => {
    if (validationError && bookingData.paymentMethod) {
      setValidationError('');
    }
  }, [bookingData.paymentMethod]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-[#BC8BBC]" />
        Select Payment Method
      </h3>
      
      <div className="space-y-6">
        {/* Mobile Money and Card Payment on same line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mobile Money - Simple selection like card */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Mobile Money</span>
            </div>
            
            <button
              onClick={() => onUpdateBookingData({...bookingData, paymentMethod: 'mobile_money'})}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                bookingData.paymentMethod === 'mobile_money'
                  ? 'border-[#BC8BBC] bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-yellow-100 to-red-100 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="text-lg">🟡</div>
                    <div className="text-lg">🔴</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Mobile Money</div>
                  <div className="text-sm text-gray-500">Pay with MTN or Airtel Money</div>
                </div>
                {bookingData.paymentMethod === 'mobile_money' && (
                  <div className="text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
            </button>
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
                  ? 'border-[#BC8BBC] bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                {bookingData.paymentMethod === 'card' && (
                  <div className="text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* iSanzure Balance and Loan on same line */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* iSanzure Balance Payment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-[#BC8BBC]" />
              <span className="font-medium text-gray-900">Pay with iSanzure Balance</span>
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Balance: {userBalance > 0 ? formatPrice(userBalance) : 'Contact for price'}
              </span>
            </div>
            
            <button
              onClick={() => {
                onUpdateBookingData({...bookingData, paymentMethod: 'balance'});
                setShowBalanceDetails(true);
              }}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                bookingData.paymentMethod === 'balance'
                  ? 'border-[#BC8BBC] bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10'
                  : 'border-gray-200 hover:border-[#BC8BBC] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    bookingData.paymentMethod === 'balance'
                      ? 'bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20' 
                      : 'bg-gray-100'
                  }`}>
                    <Wallet className={`h-6 w-6 ${
                      bookingData.paymentMethod === 'balance' ? 'text-[#BC8BBC]' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Pay with Balance</div>
                    <div className="text-sm text-gray-500">
                      Use your iSanzure wallet balance
                    </div>
                  </div>
                </div>
                
                {bookingData.paymentMethod === 'balance' && (
                  <div className="text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
            </button>
            
            {/* Balance Details - Automatically shown when selected */}
            {bookingData.paymentMethod === 'balance' && showBalanceDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                {userBalance === 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">No Balance Available</div>
                        <p className="text-xs text-gray-600 mt-1">
                          Your iSanzure wallet balance is currently 0. Please add funds to use this payment method.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !hasEnoughBalance ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Insufficient Balance</div>
                        <p className="text-xs text-gray-600 mt-1">
                          You need {formatPrice(balanceShortfall)} more to complete this booking.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-green-600">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Sufficient Balance</div>
                        <p className="text-xs text-gray-600 mt-1">
                          Your balance of {formatPrice(userBalance)} covers the booking amount.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* iSanzure Loan Payment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-[#BC8BBC]" />
              <span className="font-medium text-gray-900">Pay with iSanzure Loan</span>
              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Limit: {userLoanLimit > 0 ? formatPrice(userLoanLimit) : 'Contact for price'}
              </span>
            </div>
            
            <button
              onClick={() => {
                onUpdateBookingData({...bookingData, paymentMethod: 'loan'});
                setShowLoanDetails(true);
              }}
              className={`w-full p-4 border rounded-lg text-left transition-all ${
                bookingData.paymentMethod === 'loan'
                  ? 'border-[#BC8BBC] bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10'
                  : 'border-gray-200 hover:border-[#BC8BBC] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    bookingData.paymentMethod === 'loan'
                      ? 'bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20' 
                      : 'bg-gray-100'
                  }`}>
                    <TrendingUp className={`h-6 w-6 ${
                      bookingData.paymentMethod === 'loan' ? 'text-[#BC8BBC]' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Pay with Loan</div>
                    <div className="text-sm text-gray-500">
                      Use your available loan limit
                    </div>
                  </div>
                </div>
                
                {bookingData.paymentMethod === 'loan' && (
                  <div className="text-green-600">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </div>
            </button>
            
            {/* Loan Details - Automatically shown when selected */}
            {bookingData.paymentMethod === 'loan' && showLoanDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                {!userLoanEligible ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Not Eligible for Loan</div>
                        <p className="text-xs text-gray-600 mt-1">
                          Use iSanzure frequently to increase your loan limit and unlock more benefits.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : !hasEnoughLoanLimit ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Increase Your Loan Limit</div>
                        <p className="text-xs text-gray-600 mt-1">
                          You need {formatPrice(loanLimitShortfall)} more limit. 
                          Pay more using our system to increase your loan eligibility.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-green-600">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Loan Available</div>
                        <p className="text-xs text-gray-600 mt-1">
                          Your loan limit of {formatPrice(userLoanLimit)} covers the booking amount.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                {validationError}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBackStep}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
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