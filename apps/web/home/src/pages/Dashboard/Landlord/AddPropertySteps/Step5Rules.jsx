// src/pages/Dashboard/Landlord/pages/AddPropertySteps/Step5Rules.jsx
import React, { useState } from 'react';
import { Check, Info, AlertCircle, Clock, Calendar, DollarSign, Users, Home, Key } from 'lucide-react';

export default function Step5Rules({ formData, setFormData, errors, setErrors }) {
  const [expandedPolicy, setExpandedPolicy] = useState(null);

const cancellationPolicies = [
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'Best for tenants – short notice friendly',
    details: {
      shortDesc: 'Tenant-friendly for quick bookings',
      landlordProtection: 'Low',
      tenantFlexibility: 'Very High',
      refundTimeline:
        'Full refund if cancelled at least 24 hours before check-in',
      platformFeeNote:
        'Guest service fee is non-refundable. Accommodation amount follows this policy.'
    }
  },

  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced for both landlord and tenant',
    details: {
      shortDesc: 'Recommended for most local rentals',
      landlordProtection: 'Medium',
      tenantFlexibility: 'Medium',
      refundTimeline:
        'Full refund 48+ hours before check-in, 50% refund within 24–48 hours, no refund within 24 hours',
      platformFeeNote:
        'Guest service fee is non-refundable. Refund applies only to accommodation amount.'
    }
  },

  {
    value: 'strict',
    label: 'Strict',
    description: 'Best for landlords – protects daily income',
    details: {
      shortDesc: 'Landlord-protective for short stays',
      landlordProtection: 'High',
      tenantFlexibility: 'Low',
      refundTimeline:
        '50% refund if cancelled 48+ hours before check-in, no refund within 48 hours',
      platformFeeNote:
        'Guest service fee is non-refundable. Late cancellations protect landlord earnings.'
    }
  }
];


  // Boolean rules
  const booleanRules = [
    {
      id: 'smokingAllowed',
      name: 'Smoking Allowed',
      icon: '🚭',
      description: 'Can tenants smoke inside the property?',
      value: formData.smokingAllowed || false,
    },
    {
      id: 'petsAllowed',
      name: 'Pets Allowed',
      icon: '🐕',
      description: 'Are pets permitted in the property?',
      value: formData.petsAllowed || false,
    },
    {
      id: 'eventsAllowed',
      name: 'Events/Parties Allowed',
      icon: '🎉',
      description: 'Can tenants host events or parties?',
      value: formData.eventsAllowed || false,
    },
    {
      id: 'guestsAllowed',
      name: 'Overnight Guests Allowed',
      icon: '👥',
      description: 'Can tenants have overnight visitors?',
      value: formData.guestsAllowed || false,
    },
  ];

  // Payment rules
  const paymentRules = [
    {
      id: 'latePaymentFee',
      name: 'Late Payment Fee',
      description: 'Additional charge for late rent payments',
      value: formData.latePaymentFee || 0,
      type: 'percentage',
      options: [0, 5, 10, 15]
    },
    {
      id: 'gracePeriodDays',
      name: 'Grace Period',
      description: 'Days allowed after due date before late fee applies',
      value: formData.gracePeriodDays || 3,
      type: 'days',
      options: [0, 1, 2, 3, 5, 7]
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleToggleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

const calculateRefundExample = (policy) => {
  // For Rwanda short-stay, show a nightly example (more realistic than monthly)
  const totalPayment = 50000; // Example total booking amount (e.g. 1–2 nights)
  const serviceFeeRate = 0.10; // 10% guest service fee (non-refundable)
  const serviceFee = totalPayment * serviceFeeRate;

  // "Accommodation amount" is what can be refunded to guest (depends on policy)
  const accommodationAmount = totalPayment - serviceFee;

  const money = (n) => `${Math.max(0, Math.round(n)).toLocaleString()} RWF`;

  switch (policy) {
    case 'flexible':
      return {
        tenantCancels: '24+ hours before check-in',
        tenantReceives: money(accommodationAmount),
        landlordReceives: money(0),
        platformKeeps: money(serviceFee)
      };

    case 'moderate':
      return {
        // Show the “middle case” (most confusing) so landlords understand it
        tenantCancels: '24–48 hours before check-in',
        tenantReceives: money(accommodationAmount * 0.50),
        landlordReceives: money(accommodationAmount * 0.50),
        platformKeeps: money(serviceFee)
      };

    case 'strict':
      return {
        tenantCancels: '48+ hours before check-in',
        tenantReceives: money(accommodationAmount * 0.50),
        landlordReceives: money(accommodationAmount * 0.50),
        platformKeeps: money(serviceFee)
      };

    default:
      return {};
  }
};


  return (
    <div className="p-6">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Rules & Policies</h3>
        <p className="text-gray-600">Set clear rules for tenants and define your policies</p>
      </div>
      
      <div className="space-y-8">
        {/* Check-in/Check-out Times */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-600" />
            Check-in & Check-out Times
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check-in Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in Time *
              </label>
              <input
                type="time"
                name="checkInTime"
                value={formData.checkInTime || '14:00'}
                onChange={handleInputChange}
                className={`
                  w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent
                  ${errors.checkInTime ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                required
              />
              {errors.checkInTime && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.checkInTime}
                </div>
              )}
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info size={14} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Check-in Time:</span> The earliest time a new tenant can access the property. 
                    For example, if set to 2:00 PM and booking starts on January 1st, tenant can enter starting from 2:00 PM on January 1st.
                  </div>
                </div>
              </div>
            </div>

            {/* Check-out Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out Time *
              </label>
              <input
                type="time"
                name="checkOutTime"
                value={formData.checkOutTime || '11:00'}
                onChange={handleInputChange}
                className={`
                  w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent
                  ${errors.checkOutTime ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
                required
              />
              {errors.checkOutTime && (
                <div className="flex items-center mt-1 text-red-600 text-sm">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.checkOutTime}
                </div>
              )}
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info size={14} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Check-out Time:</span> The latest time a departing tenant must leave the property. 
                    For example, if set to 11:00 AM and booking ends on January 31st, tenant must be completely out by 11:00 AM on January 31st.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cleaning Window Notice */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start">
              <div className="bg-amber-100 p-2 rounded-lg mr-4">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Cleaning Window</h5>
                <p className="text-sm text-gray-700">
                  The gap between check-out and next check-in creates a "cleaning window" for preparing the property for new tenants. 
                  Standard practice is 3-5 hours between tenants for cleaning and inspection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Policies */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-600" />
            Cancellation Policy *
          </h4>
          
          <div className="space-y-4">
            {cancellationPolicies.map((policy) => {
              const isSelected = formData.cancellationPolicy === policy.value;
              const refundExample = calculateRefundExample(policy.value);
              
              return (
                <div key={policy.value}>
                  <label className={`
                    flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-sm
                    ${isSelected 
                      ? 'border-[#BC8BBC] bg-gradient-to-br from-[#f4eaf4] to-[#f9f0f9]' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}>
                    <input
                      type="radio"
                      name="cancellationPolicy"
                      value={policy.value}
                      checked={isSelected}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {policy.label}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {policy.description}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedPolicy(expandedPolicy === policy.value ? null : policy.value)}
                          className="text-sm text-[#8A5A8A] hover:text-[#7a4a7a] flex items-center"
                        >
                          {expandedPolicy === policy.value ? 'Show Less' : 'Details'}
                          {expandedPolicy === policy.value ? (
                            <span className="ml-1">↑</span>
                          ) : (
                            <span className="ml-1">↓</span>
                          )}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {expandedPolicy === policy.value && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Policy Details */}
                            <div>
                              <h6 className="font-medium text-gray-900 mb-3">Policy Details</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Landlord Protection:</span>
                                  <span className="font-medium">{policy.details.landlordProtection}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tenant Flexibility:</span>
                                  <span className="font-medium">{policy.details.tenantFlexibility}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Refund Deadline:</span>
                                  <span className="font-medium">{policy.details.refundTimeline}</span>
                                </div>
                              </div>
                            </div>

                            {/* Refund Example */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-3">Example: 50,000 RWF Monthly Rent</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">If tenant cancels:</span>
                                  <span className="font-medium">{refundExample.tenantCancels}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tenant receives:</span>
                                  <span className="font-medium text-green-600">{refundExample.tenantReceives}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">You receive:</span>
                                  <span className="font-medium">{refundExample.landlordReceives}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Platform keeps (10% fee):</span>
                                  <span className="font-medium text-amber-600">{refundExample.platformKeeps}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Important Notes */}
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Important:</span> {policy.details.platformFeeNote}
                              {policy.value === 'strict' && ' If calculated refund is negative, tenant receives 0 RWF.'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                  
                  {/* Policy Description Summary */}
                  {!expandedPolicy && isSelected && (
                    <div className="mt-2 ml-7 text-sm text-gray-600">
                      {policy.details.shortDesc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Policy Comparison */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-500" />
              How to Choose Your Policy
            </h5>
            <div className="text-sm text-gray-700 space-y-2">
              <p><span className="font-medium">Flexible:</span> Best for attracting more tenants, but higher risk of last-minute cancellations.</p>
              <p><span className="font-medium">Moderate:</span> Balanced approach for both tenant flexibility and landlord protection.</p>
              <p><span className="font-medium">Strict:</span> Maximum income protection, but may reduce booking appeal.</p>
            </div>
          </div>
        </div>

        {/* Boolean Rules (Yes/No Rules) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Home className="h-5 w-5 mr-2 text-gray-600" />
            Property Rules
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {booleanRules.map((rule) => (
              <div key={rule.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">{rule.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{rule.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{rule.description}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange(rule.id, !formData[rule.id])}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${formData[rule.id] 
                        ? 'bg-[#BC8BBC]' 
                        : 'bg-gray-200'
                      }
                    `}
                  >
                    <span className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${formData[rule.id] ? 'translate-x-6' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {formData[rule.id] ? (
                    <span className="text-green-600">✓ Allowed - Tenants can do this</span>
                  ) : (
                    <span className="text-red-600">✗ Not Allowed - Prohibited for tenants</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Rules */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-gray-600" />
            Payment Rules (Optional)
          </h4>
          
          <div className="space-y-6">
            {/* Grace Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grace Period for Late Payments
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Number of days allowed after rent due date before late fee applies
              </p>
              <div className="flex flex-wrap gap-2">
                {paymentRules[1].options.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleNumberChange('gracePeriodDays', days)}
                    className={`
                      px-4 py-2 rounded-lg border transition-all
                      ${formData.gracePeriodDays === days
                        ? 'bg-[#f4eaf4] border-[#BC8BBC] text-[#8A5A8A] font-medium'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }
                    `}
                  >
                    {days} {days === 1 ? 'day' : 'days'}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Example:</span> If rent is due on the 1st and grace period is 3 days, 
                  tenant can pay until the 4th without penalty.
                </div>
              </div>
            </div>

            {/* Late Payment Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Payment Fee (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Additional percentage charged for late rent payments after grace period
              </p>
              <div className="flex flex-wrap gap-2">
                {paymentRules[0].options.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => handleNumberChange('latePaymentFee', percent)}
                    className={`
                      px-4 py-2 rounded-lg border transition-all
                      ${formData.latePaymentFee === percent
                        ? 'bg-[#f4eaf4] border-[#BC8BBC] text-[#8A5A8A] font-medium'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }
                    `}
                  >
                    {percent}% {percent === 0 && '(No fee)'}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Example:</span> For 50,000 RWF rent with 10% late fee after grace period: 
                  50,000 × 10% = 5,000 RWF additional charge.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* House Rules Text Area */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-6 flex items-center">
            <Key className="h-5 w-5 mr-2 text-gray-600" />
            Additional House Rules (Optional)
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Rules & Important Information
            </label>
            <textarea
              name="houseRules"
              value={formData.houseRules || ''}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
              placeholder="Add any specific rules not covered above, such as:
• Noise restrictions (quiet hours from 10 PM to 7 AM)
• Garbage disposal procedures
• Maintenance request procedures
• Key/lock policies
• Visitor registration requirements
• Any neighborhood-specific rules"
            />
            <p className="text-xs text-gray-500 mt-2">
              These rules will be displayed to tenants before booking. Be clear and specific.
            </p>
          </div>

          {/* Example Rules */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h5 className="font-medium text-gray-900 mb-3">Example Rules You Could Add:</h5>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Please conserve water and electricity</li>
              <li>• Report any maintenance issues within 24 hours</li>
              <li>• Keep common areas clean and tidy</li>
              <li>• No loud music after 10 PM</li>
              <li>• Visitors must leave by 11 PM unless arranged in advance</li>
            </ul>
          </div>
        </div>

        {/* Rules Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900">Your Rules Summary</h5>
              <p className="text-sm text-gray-600">Review your selected rules and policies</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3">📅 Timing Rules</div>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center">
                  <Clock size={14} className="mr-2 text-gray-400" />
                  <span>Check-in: {formData.checkInTime || '14:00'}</span>
                </li>
                <li className="flex items-center">
                  <Clock size={14} className="mr-2 text-gray-400" />
                  <span>Check-out: {formData.checkOutTime || '11:00'}</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3">🛡️ Cancellation Policy</div>
              <div className="text-sm text-gray-700">
                {formData.cancellationPolicy ? (
                  <div className="space-y-1">
                    <div className="font-medium">{formData.cancellationPolicy.charAt(0).toUpperCase() + formData.cancellationPolicy.slice(1)}</div>
                    <div className="text-xs text-gray-500">
                      {cancellationPolicies.find(p => p.value === formData.cancellationPolicy)?.description}
                    </div>
                  </div>
                ) : (
                  <span className="text-amber-600">Not selected yet</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3">✅ Allowed Activities</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {booleanRules.map(rule => (
                  formData[rule.id] && (
                    <li key={rule.id} className="flex items-center">
                      <Check size={12} className="text-green-500 mr-2" />
                      {rule.name}
                    </li>
                  )
                ))}
                {booleanRules.filter(rule => formData[rule.id]).length === 0 && (
                  <li className="text-gray-500">No specific allowances set</li>
                )}
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="text-sm font-medium text-green-700 mb-3">🚫 Restricted Activities</div>
              <ul className="text-sm text-gray-700 space-y-1">
                {booleanRules.map(rule => (
                  !formData[rule.id] && (
                    <li key={rule.id} className="flex items-center">
                      <span className="text-red-500 mr-2">✗</span>
                      {rule.name}
                    </li>
                  )
                ))}
                {booleanRules.filter(rule => !formData[rule.id]).length === 0 && (
                  <li className="text-gray-500">No specific restrictions set</li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white border border-green-100 rounded-lg">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Payment Rules:</span> 
              {' '}{formData.gracePeriodDays || 0}-day grace period, 
              {' '}{formData.latePaymentFee || 0}% late fee after grace period
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}