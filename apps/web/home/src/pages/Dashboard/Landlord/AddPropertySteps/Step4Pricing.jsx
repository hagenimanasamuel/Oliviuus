// src/pages/Dashboard/Landlord/pages/AddPropertySteps/Step4Pricing.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign, Calendar, Moon, Sun, TrendingUp,
  Clock, Shield, CreditCard, AlertCircle, Info,
  Check, Percent, Receipt, Wallet, Banknote,
  Zap, Home, Building, Users, Crown,
  ChevronDown, ChevronUp, Maximize2, Minus, Plus
} from 'lucide-react';

export default function Step4Pricing({ formData, setFormData, errors, setErrors }) {
  // Payment types (multiple selection)
  const paymentTypes = [
    { id: 'monthly', name: 'Monthly', icon: <Calendar size={18} />, description: 'Pay per month' },
    { id: 'quarterly', name: 'Quarterly', icon: <TrendingUp size={18} />, description: '3 months at once' },
    { id: 'semester', name: 'Semester', icon: <Sun size={18} />, description: '6 months advance' },
    { id: 'yearly', name: 'Yearly', icon: <Calendar size={18} />, description: 'Full year payment' },
    { id: 'weekly', name: 'Weekly', icon: <Clock size={18} />, description: 'Pay per week' },
    { id: 'daily', name: 'Daily', icon: <Moon size={18} />, description: 'Pay per day' },
    { id: 'nightly', name: 'Nightly', icon: <Moon size={18} />, description: 'Pay per night' },
  ];

  // Initialize payment types from form data
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState(
    formData.paymentTypes || ['monthly']
  );

  // Maximum periods
  const [maxAdvanceMonths, setMaxAdvanceMonths] = useState(formData.maxAdvanceMonths || 3);
  const [maxSinglePaymentMonths, setMaxSinglePaymentMonths] = useState(formData.maxSinglePaymentMonths || 6);

  // Commission explanation
  const commissionRate = 10; // 10% platform fee

  // Validation
  const validateStep = () => {
    const newErrors = {};

    if (!formData.monthlyPrice || formData.monthlyPrice < 1000) {
      newErrors.monthlyPrice = 'Monthly price is required (minimum 1000 RWF)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-validate
  useEffect(() => {
    if (formData.monthlyPrice) {
      validateStep();
    }
  }, [formData.monthlyPrice]);

  // Update form data when payment types change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      paymentTypes: selectedPaymentTypes,
      maxAdvanceMonths: maxAdvanceMonths,
      maxSinglePaymentMonths: maxSinglePaymentMonths,

      // Calculate derived prices if not set
      weeklyPrice: prev.weeklyPrice || (prev.monthlyPrice ? Math.round(prev.monthlyPrice / 4) : ''),
      nightlyPrice: prev.nightlyPrice || (prev.monthlyPrice ? Math.round(prev.monthlyPrice / 30) : ''),
      dailyPrice: prev.dailyPrice || (prev.monthlyPrice ? Math.round(prev.monthlyPrice / 30) : ''),
    }));
  }, [selectedPaymentTypes, maxAdvanceMonths, maxSinglePaymentMonths]);

  const handlePaymentTypeToggle = (paymentId) => {
    setSelectedPaymentTypes(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const handlePriceChange = (name, value) => {
    const numericValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const handleMaxAdvanceChange = (months) => {
    const newMonths = Math.max(1, Math.min(months, 24));
    setMaxAdvanceMonths(newMonths);
  };

  const handleMaxSinglePaymentChange = (months) => {
    const newMonths = Math.max(1, Math.min(months, 36));
    setMaxSinglePaymentMonths(newMonths);
  };

  // Calculate amounts
  const calculateCommission = () => {
    const monthlyPrice = formData.monthlyPrice || 0;
    return Math.round(monthlyPrice * (commissionRate / 100));
  };

  const calculateLandlordReceives = () => {
    const monthlyPrice = formData.monthlyPrice || 0;
    const commission = calculateCommission();
    return monthlyPrice - commission;
  };

  // Check if payment type is selected
  const isPaymentTypeSelected = (typeId) => selectedPaymentTypes.includes(typeId);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Pricing & Payment Terms</h3>
        <p className="text-gray-600">Set your rental prices and payment preferences</p>
      </div>

      <div className="space-y-8">
        {/* Payment Type Selection - Multiple */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
            Accepted Payment Periods
          </h4>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select all payment periods you accept *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {paymentTypes.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePaymentTypeToggle(option.id)}
                  className={`
                    p-4 border-2 rounded-xl flex flex-col items-center justify-center transition-all
                    hover:shadow-md transform hover:-translate-y-0.5 relative
                    ${isPaymentTypeSelected(option.id)
                      ? 'border-[#BC8BBC] bg-gradient-to-br from-[#f4eaf4] to-[#f9f0f9] text-[#8A5A8A] shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }
                  `}
                >
                  <div className="mb-2 text-gray-600">
                    {option.icon}
                  </div>
                  <span className="text-sm font-semibold text-center">{option.name}</span>
                  <span className="text-xs text-gray-500 mt-1 text-center">{option.description}</span>
                  {isPaymentTypeSelected(option.id) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#BC8BBC] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info size={14} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                Select all payment periods you're willing to accept. Tenants will see these options when booking.
              </div>
            </div>
          </div>
        </div>

        {/* Main Pricing Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
            Set Your Prices
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Monthly Price - Always shown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Price (RWF) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-500">RWF</span>
                <input
                  type="number"
                  value={formData.monthlyPrice || ''}
                  onChange={(e) => handlePriceChange('monthlyPrice', e.target.value)}
                  className={`
                    w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent
                    ${errors.monthlyPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="e.g., 50000"
                  min="1000"
                  required
                />
              </div>
              {errors.monthlyPrice && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.monthlyPrice}
                </div>
              )}
            </div>

            {/* Weekly Price - Show if weekly selected */}
            {isPaymentTypeSelected('weekly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Price (RWF)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500">RWF</span>
                  <input
                    type="number"
                    value={formData.weeklyPrice || ''}
                    onChange={(e) => handlePriceChange('weeklyPrice', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    placeholder="Auto: Monthly ÷ 4"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Set custom weekly price
                </p>
              </div>
            )}

            {/* Daily Price - Show if daily selected */}
            {isPaymentTypeSelected('daily') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Price (RWF)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500">RWF</span>
                  <input
                    type="number"
                    value={formData.dailyPrice || ''}
                    onChange={(e) => handlePriceChange('dailyPrice', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    placeholder="Auto: Monthly ÷ 30"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Set custom daily price
                </p>
              </div>
            )}

            {/* Nightly Price - Show if nightly selected */}
            {isPaymentTypeSelected('nightly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nightly Price (RWF)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-500">RWF</span>
                  <input
                    type="number"
                    value={formData.nightlyPrice || ''}
                    onChange={(e) => handlePriceChange('nightlyPrice', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                    placeholder="Auto: Monthly ÷ 30"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Set custom nightly price
                </p>
              </div>
            )}
          </div>

          {/* Price Guidance */}
          {(isPaymentTypeSelected('weekly') || isPaymentTypeSelected('daily') || isPaymentTypeSelected('nightly')) && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Auto-calculation:</span> If left empty, prices auto-calculate based on monthly rate.
                You can override with custom amounts.
              </div>
            </div>
          )}
        </div>

        {/* Maximum Periods Configuration */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Maximize2 className="h-5 w-5 mr-2 text-gray-600" />
            Payment Period Limits
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Maximum Advance Period */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Advance Period (Months)
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Maximum months tenant can pay as advance before moving in
                </p>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleMaxAdvanceChange(maxAdvanceMonths - 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-medium py-3">
                    {maxAdvanceMonths} {maxAdvanceMonths === 1 ? 'month' : 'months'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMaxAdvanceChange(maxAdvanceMonths + 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Example:</span> If set to 3 months, tenants can pay up to
                  <span className="font-bold text-[#8A5A8A] ml-1">
                    RWF {(formData.monthlyPrice || 0) * maxAdvanceMonths}
                  </span> as advance payment.
                </div>
              </div>
            </div>

            {/* Maximum Single Payment Period */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Single Payment Period
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Maximum months tenant can pay at once (anytime during stay)
                </p>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleMaxSinglePaymentChange(maxSinglePaymentMonths - 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center font-medium py-3">
                    {maxSinglePaymentMonths} {maxSinglePaymentMonths === 1 ? 'month' : 'months'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMaxSinglePaymentChange(maxSinglePaymentMonths + 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Tenants cannot pay more than {maxSinglePaymentMonths} months at once.</span>
                  This applies to any payment during their stay.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Utilities Information - Optional Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-gray-600" />
                Utilities Information (Optional)
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  showUtilitiesSection: !prev.showUtilitiesSection
                }))}
                className="text-sm text-[#8A5A8A] font-medium hover:text-[#7a4a7a] flex items-center"
              >
                {formData.showUtilitiesSection ? 'Hide Section' : 'Add Utilities Info'}
                {formData.showUtilitiesSection ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </button>
            </h4>
            <p className="text-gray-600 text-sm">
              {formData.showUtilitiesSection
                ? "Inform tenants about utility payments"
                : "Click 'Add Utilities Info' if tenants will pay additional utilities"
              }
            </p>
          </div>

          {formData.showUtilitiesSection && (
            <>
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-start">
                  <div className="bg-amber-100 p-2 rounded-lg mr-4">
                    <Info className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Utility Payments Notice</h5>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        <span className="font-medium">Important:</span> Utility payments (electricity, water, etc.) are separate from rent
                        and are paid directly by the tenant based on actual usage.
                      </p>
                      <p>
                        Tenants will receive utility bills monthly and must settle them directly with service providers
                        or through the arrangement you specify upon moving in.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Utilities Estimate */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Monthly Utilities (Optional)
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Provide tenants with an estimated utility cost range (this is not included in rent)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Minimum Estimate (RWF)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-500">RWF</span>
                      <input
                        type="number"
                        value={formData.utilitiesMin || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, utilitiesMin: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                        placeholder="e.g., 10000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Maximum Estimate (RWF)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-500">RWF</span>
                      <input
                        type="number"
                        value={formData.utilitiesMax || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, utilitiesMax: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                        placeholder="e.g., 20000"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is only an estimate to help tenants budget. Actual costs may vary.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Platform Commission */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Percent className="h-5 w-5 mr-2 text-gray-600" />
              Platform Commission
            </h4>
            <p className="text-gray-600 text-sm">Payment processing and platform fee structure</p>
          </div>

          <div className="bg-gradient-to-r from-[#f4eaf4] to-[#f0f4ff] border border-[#BC8BBC] rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-700 mb-1">Tenant Pays Monthly</div>
                <div className="text-2xl font-bold text-[#8A5A8A]">
                  RWF {formData.monthlyPrice || '0'}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-700 mb-1">Platform Fee ({commissionRate}%)</div>
                <div className="text-2xl font-bold text-amber-600">
                  - RWF {calculateCommission()}
                </div>
                <div className="text-xs text-gray-500 mt-1">For system maintenance & support</div>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-700 mb-1">You Receive Monthly</div>
                <div className="text-2xl font-bold text-green-600">
                  RWF {calculateLandlordReceives()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Net monthly payment to you</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-start">
                <Info size={16} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Platform Fee Details:</span> The {commissionRate}% commission covers secure payment processing,
                  platform maintenance, customer support, and continuous system improvements. This fee is deducted from each
                  successful payment before funds are transferred to you.
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mt-6 border border-gray-200 rounded-xl p-6">
            <h5 className="font-medium text-gray-900 mb-4">Payment Summary</h5>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-gray-600">Monthly Rent</div>
                <div className="font-medium">RWF {formData.monthlyPrice || '0'}</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-gray-600">Platform Fee ({commissionRate}%)</div>
                <div className="font-medium">- RWF {calculateCommission()}</div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-300 pt-3">
                <div className="font-semibold text-gray-900">You Receive Monthly</div>
                <div className="text-xl font-bold text-green-600">
                  RWF {calculateLandlordReceives()}
                </div>
              </div>

              {isPaymentTypeSelected('weekly') && formData.weeklyPrice && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="text-gray-600">Weekly Option</div>
                  <div className="font-medium">RWF {formData.weeklyPrice}</div>
                </div>
              )}

              {(isPaymentTypeSelected('daily') && formData.dailyPrice) && (
                <div className="flex justify-between items-center">
                  <div className="text-gray-600">Daily Option</div>
                  <div className="font-medium">RWF {formData.dailyPrice}</div>
                </div>
              )}

              {(isPaymentTypeSelected('nightly') && formData.nightlyPrice) && (
                <div className="flex justify-between items-center">
                  <div className="text-gray-600">Nightly Option</div>
                  <div className="font-medium">RWF {formData.nightlyPrice}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900">Your Pricing Summary</h5>
              <p className="text-sm text-gray-600">Review your pricing configuration</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">📅 Accepted Payments</div>
              <div className="text-sm text-gray-700">
                {selectedPaymentTypes.map(typeId => {
                  const type = paymentTypes.find(t => t.id === typeId);
                  return (
                    <div key={typeId} className="flex items-center mb-1">
                      <Check size={12} className="text-green-500 mr-2" />
                      {type?.name} - {type?.description}
                    </div>
                  );
                }).slice(0, 4)}
                {selectedPaymentTypes.length > 4 && (
                  <div className="text-xs text-gray-500 mt-1">
                    + {selectedPaymentTypes.length - 4} more options
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-2">⚖️ Payment Limits</div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Max advance: {maxAdvanceMonths} months</li>
                <li>• Max single payment: {maxSinglePaymentMonths} months</li>
                <li>• Utilities: Separate from rent</li>
                <li>• Platform fee: {commissionRate}% per transaction</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white border border-green-100 rounded-lg">
            <div className="flex items-center">
              <Banknote size={16} className="text-[#8A5A8A] mr-2" />
              <div className="text-sm text-gray-700">
                <span className="font-medium">Monthly Breakdown:</span> Tenant pays
                <span className="font-bold text-[#8A5A8A] mx-1">RWF {formData.monthlyPrice || '0'}</span>
                → You receive
                <span className="font-bold text-green-600 ml-1">RWF {calculateLandlordReceives()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}