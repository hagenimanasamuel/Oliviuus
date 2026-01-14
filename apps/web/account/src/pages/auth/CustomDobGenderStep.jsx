import React, { useState, useEffect, useRef } from "react";

// Months data
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

// Gender options
const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" }
];

const CustomDobGenderStep = ({ initialData, onSubmit, onBack, loading, isDarkMode }) => {
  const [month, setMonth] = useState(initialData.dateOfBirth ? initialData.dateOfBirth.split('-')[1] : "");
  const [day, setDay] = useState(initialData.dateOfBirth ? initialData.dateOfBirth.split('-')[2] : "");
  const [year, setYear] = useState(initialData.dateOfBirth ? initialData.dateOfBirth.split('-')[0] : "");
  const [gender, setGender] = useState(initialData.gender || "");
  const [errors, setErrors] = useState({});
  
  // Focus states for floating labels
  const [monthFocused, setMonthFocused] = useState(false);
  const [dayFocused, setDayFocused] = useState(false);
  const [yearFocused, setYearFocused] = useState(false);
  const [genderFocused, setGenderFocused] = useState(false);
  
  // Modal states
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  
  // Refs
  const monthModalRef = useRef(null);
  const genderModalRef = useRef(null);
  const monthButtonRef = useRef(null);
  const genderButtonRef = useRef(null);
  const dayInputRef = useRef(null);
  const yearInputRef = useRef(null);
  const containerRef = useRef(null);

  // Click outside handler for month modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMonthModal && 
          monthModalRef.current && 
          !monthModalRef.current.contains(event.target) &&
          monthButtonRef.current && 
          !monthButtonRef.current.contains(event.target)) {
        setShowMonthModal(false);
        setMonthFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthModal]);

  // Click outside handler for gender modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGenderModal && 
          genderModalRef.current && 
          !genderModalRef.current.contains(event.target) &&
          genderButtonRef.current && 
          !genderButtonRef.current.contains(event.target)) {
        setShowGenderModal(false);
        setGenderFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showGenderModal]);

  // Close modals when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (showMonthModal) setShowMonthModal(false);
      if (showGenderModal) setShowGenderModal(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMonthModal, showGenderModal]);

  // Scroll to modal on mobile when it opens
  useEffect(() => {
    if (showMonthModal && monthButtonRef.current && monthModalRef.current) {
      setTimeout(() => {
        monthButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [showMonthModal]);

  useEffect(() => {
    if (showGenderModal && genderButtonRef.current && genderModalRef.current) {
      setTimeout(() => {
        genderButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [showGenderModal]);

  const validate = () => {
    const newErrors = {};
    
    if (!month) {
      newErrors.month = "Month is required";
    }
    
    if (!day) {
      newErrors.day = "Day is required";
    } else if (!/^\d{1,2}$/.test(day) || parseInt(day) < 1 || parseInt(day) > 31) {
      newErrors.day = "Enter a valid day (1-31)";
    }
    
    if (!year) {
      newErrors.year = "Year is required";
    } else if (!/^\d{4}$/.test(year)) {
      newErrors.year = "Enter a valid 4-digit year";
    } else {
      const currentYear = new Date().getFullYear();
      const age = currentYear - parseInt(year);
      if (age < 13) {
        newErrors.year = "You must be at least 13 years old";
      }
      if (age > 120) {
        newErrors.year = "Please enter a valid year";
      }
    }
    
    if (!gender) {
      newErrors.gender = "Please select a gender";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDayChange = (value) => {
    const numValue = value.replace(/\D/g, '');
    if (numValue === '' || (parseInt(numValue) >= 1 && parseInt(numValue) <= 31)) {
      setDay(numValue.slice(0, 2));
      if (errors.day) setErrors({...errors, day: null});
    }
  };

  const handleYearChange = (value) => {
    const numValue = value.replace(/\D/g, '');
    if (numValue === '' || numValue.length <= 4) {
      setYear(numValue);
      if (errors.year) setErrors({...errors, year: null});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      onSubmit({ dateOfBirth, gender });
    }
  };

  const handleMonthSelect = (monthValue) => {
    setMonth(monthValue);
    setShowMonthModal(false);
    setMonthFocused(false);
    if (errors.month) setErrors({...errors, month: null});
    // Focus on day input after selecting month
    setTimeout(() => {
      if (dayInputRef.current) dayInputRef.current.focus();
    }, 100);
  };

  const handleGenderSelect = (genderValue) => {
    setGender(genderValue);
    setShowGenderModal(false);
    setGenderFocused(false);
    if (errors.gender) setErrors({...errors, gender: null});
  };

  const isFormValid = month && day && year && gender;

  // Get selected month name
  const selectedMonthName = MONTHS.find(m => m.value === month)?.label || "";

  // Get modal position - ALWAYS show below on mobile for visibility
  const getModalPosition = () => {
    // On mobile, ALWAYS show below to ensure visibility
    if (window.innerWidth < 640) {
      return 'below';
    }
    
    // On larger screens, we can be smarter about positioning
    return 'below';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" ref={containerRef}>
      <style jsx>{`
        .modal-container {
          z-index: 9999 !important;
        }
        @media (max-width: 639px) {
          .modal-container {
            position: fixed !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 90vw !important;
            max-width: 300px !important;
            max-height: 60vh !important;
            top: auto !important;
            bottom: auto !important;
            margin-top: 8px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          }
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: 9998;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Date of Birth Section */}
        <div>
          <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Date of Birth
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Month Input with Modal */}
            <div className="relative">
              <button
                ref={monthButtonRef}
                type="button"
                onClick={() => {
                  setShowMonthModal(!showMonthModal);
                  setMonthFocused(true);
                  // Close gender modal if open
                  if (showGenderModal) setShowGenderModal(false);
                }}
                onFocus={() => setMonthFocused(true)}
                onBlur={() => {
                  if (!showMonthModal) setMonthFocused(false);
                }}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 border text-left peer ${
                  isDarkMode 
                    ? 'border border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800' 
                    : 'border border-gray-300 text-gray-900 focus:border-purple-500 hover:bg-gray-50'
                } ${errors.month ? 'border-red-500' : ''} ${showMonthModal ? 'ring-2 ring-purple-500' : ''}`}
                disabled={loading}
              >
                <div className="flex items-center justify-between">
                  <span className={`${month ? '' : 'opacity-0'} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedMonthName || "Placeholder"}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showMonthModal ? 'rotate-180' : ''} ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {/* Floating label */}
              <label
                className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 peer-focus:text-purple-400' 
                    : 'text-gray-500 peer-focus:text-purple-600'
                } ${
                  month || monthFocused || showMonthModal
                    ? "text-xs -translate-y-6 px-1" 
                    : "text-sm sm:text-base"
                }`}
              >
                {month || monthFocused || showMonthModal ? "Month" : "Month"}
              </label>
              {(month || monthFocused || showMonthModal) && (
                <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}></div>
              )}
              
              {/* Month Modal - ALWAYS visible on mobile */}
              {showMonthModal && (
                <>
                  {/* Backdrop for mobile */}
                  {window.innerWidth < 640 && (
                    <div 
                      className="modal-backdrop"
                      onClick={() => {
                        setShowMonthModal(false);
                        setMonthFocused(false);
                      }}
                    />
                  )}
                  
                  <div 
                    ref={monthModalRef}
                    className={`modal-container rounded-lg shadow-lg border max-h-60 overflow-y-auto ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-300'
                    } ${window.innerWidth < 640 ? 'fixed' : 'absolute'} z-50`}
                    style={
                      window.innerWidth < 640 
                        ? {
                            // Mobile: Fixed in center of screen
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90vw',
                            maxWidth: '300px',
                            maxHeight: '60vh'
                          }
                        : {
                            // Desktop: Below button
                            top: '100%',
                            left: '0',
                            width: '100%',
                            marginTop: '4px'
                          }
                    }
                  >
                    <div className="py-1">
                      {MONTHS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => handleMonthSelect(m.value)}
                          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base transition-colors ${
                            month === m.value
                              ? isDarkMode
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-50 text-purple-700'
                              : isDarkMode
                                ? 'text-gray-300 hover:bg-gray-700'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {errors.month && (
                <p className="mt-1 text-sm text-red-500">{errors.month}</p>
              )}
            </div>

            {/* Day Input */}
            <div className="relative">
              <input
                ref={dayInputRef}
                type="text"
                value={day}
                onChange={(e) => handleDayChange(e.target.value)}
                onFocus={() => {
                  setDayFocused(true);
                  if (errors.day) setErrors({...errors, day: null});
                }}
                onBlur={() => setDayFocused(false)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 border text-center peer ${
                  isDarkMode 
                    ? 'border border-gray-700 text-white focus:border-purple-500' 
                    : 'border border-gray-300 text-gray-900 focus:border-purple-500'
                } ${errors.day ? 'border-red-500' : ''}`}
                placeholder=""
                disabled={loading}
                maxLength={2}
              />
              
              <label
                className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 peer-focus:text-purple-400' 
                    : 'text-gray-500 peer-focus:text-purple-600'
                } ${
                  day || dayFocused
                    ? "text-xs -translate-y-6 px-1" 
                    : "text-sm sm:text-base"
                }`}
              >
                {day || dayFocused ? "Day" : "Day"}
              </label>
              {(day || dayFocused) && (
                <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] text-center ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}></div>
              )}
              
              {errors.day && (
                <p className="mt-1 text-sm text-red-500">{errors.day}</p>
              )}
            </div>

            {/* Year Input */}
            <div className="relative">
              <input
                ref={yearInputRef}
                type="text"
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                onFocus={() => {
                  setYearFocused(true);
                  if (errors.year) setErrors({...errors, year: null});
                }}
                onBlur={() => setYearFocused(false)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 border text-center peer ${
                  isDarkMode 
                    ? 'border border-gray-700 text-white focus:border-purple-500' 
                    : 'border border-gray-300 text-gray-900 focus:border-purple-500'
                } ${errors.year ? 'border-red-500' : ''}`}
                placeholder=""
                disabled={loading}
                maxLength={4}
              />
              
              <label
                className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 peer-focus:text-purple-400' 
                    : 'text-gray-500 peer-focus:text-purple-600'
                } ${
                  year || yearFocused
                    ? "text-xs -translate-y-6 px-1" 
                    : "text-sm sm:text-base"
                }`}
              >
                {year || yearFocused ? "Year" : "Year"}
              </label>
              {(year || yearFocused) && (
                <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] text-center ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}></div>
              )}
              
              {errors.year && (
                <p className="mt-1 text-sm text-red-500">{errors.year}</p>
              )}
            </div>
          </div>
          
          <p className={`mt-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            You need to be at least 13 years old to create an account
          </p>
        </div>

        {/* Gender Section */}
        <div>
          <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Gender
          </h3>
          
          <div className="relative">
            <button
              ref={genderButtonRef}
              type="button"
              onClick={() => {
                setShowGenderModal(!showGenderModal);
                setGenderFocused(true);
                // Close month modal if open
                if (showMonthModal) setShowMonthModal(false);
              }}
              onFocus={() => setGenderFocused(true)}
              onBlur={() => {
                if (!showGenderModal) setGenderFocused(false);
              }}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 border text-left peer ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500 hover:bg-gray-50'
              } ${errors.gender ? 'border-red-500' : ''} ${showGenderModal ? 'ring-2 ring-purple-500' : ''}`}
              disabled={loading}
            >
              <div className="flex items-center justify-between">
                <span className={`${gender ? '' : 'opacity-0'} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {GENDERS.find(g => g.value === gender)?.label || "Placeholder"}
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showGenderModal ? 'rotate-180' : ''} ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                gender || genderFocused || showGenderModal
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {gender || genderFocused || showGenderModal ? "Gender" : "Gender"}
            </label>
            {(gender || genderFocused || showGenderModal) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}
            
            {/* Gender Modal - ALWAYS visible on mobile */}
            {showGenderModal && (
              <>
                {/* Backdrop for mobile */}
                {window.innerWidth < 640 && (
                  <div 
                    className="modal-backdrop"
                    onClick={() => {
                      setShowGenderModal(false);
                      setGenderFocused(false);
                    }}
                  />
                )}
                
                <div 
                  ref={genderModalRef}
                  className={`modal-container rounded-lg shadow-lg border max-h-60 overflow-y-auto ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-300'
                  } ${window.innerWidth < 640 ? 'fixed' : 'absolute'} z-50`}
                  style={
                    window.innerWidth < 640 
                      ? {
                          // Mobile: Fixed in center of screen
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '90vw',
                          maxWidth: '300px',
                          maxHeight: '60vh'
                        }
                      : {
                          // Desktop: Below button
                          top: '100%',
                          left: '0',
                          width: '100%',
                          marginTop: '4px'
                        }
                  }
                >
                  <div className="py-1">
                    {GENDERS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => handleGenderSelect(g.value)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left text-sm sm:text-base transition-colors ${
                          gender === g.value
                            ? isDarkMode
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-50 text-purple-700'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {errors.gender && (
              <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
            )}
          </div>
          
          <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This helps us personalize your experience
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium border transition-colors ${
            isDarkMode
              ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 ${
            (!isFormValid || loading) ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Continuing..." : "Continue"}
        </button>
      </div>
    </form>
  );
};

export default CustomDobGenderStep;