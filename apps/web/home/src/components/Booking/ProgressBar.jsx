// src/pages/Booking/components/ProgressBar.jsx
import React from 'react';
import { ChevronLeft } from 'lucide-react';

const ProgressBar = ({ step, onBackStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackStep}
          className="flex items-center gap-2 text-gray-600 hover:text-[#BC8BBC] transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        <div className="text-sm font-medium text-gray-700">
          Step {step} of {steps.length}
        </div>
      </div>
      
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] transition-all duration-300"
          style={{ width: `${(step / steps.length) * 100}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between mt-2">
        {steps.map((stepLabel, index) => (
          <div 
            key={index}
            className={`text-xs font-medium ${step >= index + 1 ? 'text-[#BC8BBC]' : 'text-gray-400'}`}
          >
            {index + 1}. {stepLabel}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;