// src/pages/Property/components/PriceBreakdown.jsx
import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function PriceBreakdown({ property }) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact for price';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const paymentOptions = [
    { 
      id: 'monthly',
      label: 'Monthly', 
      price: property.monthly_price, 
      accepted: property.accept_monthly,
      period: 'month',
      icon: '📅'
    },
    { 
      id: 'weekly',
      label: 'Weekly', 
      price: property.weekly_price, 
      accepted: property.accept_weekly,
      period: 'week',
      icon: '📅'
    },
    { 
      id: 'daily',
      label: 'Daily', 
      price: property.daily_price, 
      accepted: property.accept_daily,
      period: 'day',
      icon: '📅'
    },
    { 
      id: 'nightly',
      label: 'Nightly', 
      price: property.nightly_price, 
      accepted: property.accept_nightly,
      period: 'night',
      icon: '🌙'
    },
  ].filter(option => option.accepted && option.price > 0);

  const selectedOption = paymentOptions.find(opt => opt.id === selectedPeriod) || paymentOptions[0];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4">💰 Pricing Details</h3>
      
      {/* Period Selector */}
      {paymentOptions.length > 1 && (
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {paymentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedPeriod(option.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedPeriod === option.id
                  ? 'bg-[#BC8BBC] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Selected Price */}
      <div className="text-center mb-6">
        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          {formatPrice(selectedOption?.price)}
        </div>
        <div className="text-gray-500">per {selectedOption?.period}</div>
      </div>

      {/* All Payment Options */}
      <div className="space-y-4">
        {paymentOptions.map((option, index) => (
          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#BC8BBC]/10 rounded-lg">
                <span className="text-xl">{option.icon}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{option.label}</h4>
                <p className="text-sm text-gray-500">Per {option.period}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900">
                {formatPrice(option.price)}
              </div>
              {option.label === 'Monthly' && property.utilities_included && (
                <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Utilities included
                </div>
              )}
            </div>
          </div>
        ))}

        {property.utilities_min || property.utilities_max ? (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">⚡ Utilities Estimate</h4>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Monthly cost</span>
              <span className="font-medium text-gray-900">
                {formatPrice(property.utilities_min || 0)}
                {property.utilities_max && property.utilities_max !== property.utilities_min 
                  ? ` - ${formatPrice(property.utilities_max)}`
                  : ''
                }
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {property.utilities_included ? '✅ Included in monthly rent' : '➕ Additional monthly cost'}
            </div>
          </div>
        ): null}
      </div>
    </div>
  );
}