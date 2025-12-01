import React, { useState, useEffect } from "react";
import { Globe, Calendar, Clock, Lock, Download, Share2, Crown, AlertCircle, Info } from "lucide-react";
import clsx from "clsx";

const REGIONS = [
  // Local specific regions
  { value: 'rwanda', label: 'Rwanda', countries: ['RW'], local: true },
  { value: 'uganda', label: 'Uganda', countries: ['UG'], local: true },
  { value: 'kenya', label: 'Kenya', countries: ['KE'], local: true },
  { value: 'tanzania', label: 'Tanzania', countries: ['TZ'], local: true },
  { value: 'burundi', label: 'Burundi', countries: ['BI'], local: true },
  
  // Regional groupings
  { value: 'east-africa', label: 'East Africa', countries: ['RW', 'KE', 'TZ', 'UG', 'BI', 'SS', 'ET', 'ER', 'DJ', 'SO'] },
  { value: 'west-africa', label: 'West Africa', countries: ['NG', 'GH', 'CI', 'SN', 'ML', 'GN', 'BF', 'NE', 'TG', 'BJ'] },
  { value: 'southern-africa', label: 'Southern Africa', countries: ['ZA', 'ZM', 'ZW', 'MW', 'BW', 'NA', 'LS', 'SZ', 'AO', 'MZ'] },
  { value: 'central-africa', label: 'Central Africa', countries: ['CD', 'CG', 'CM', 'GA', 'CF', 'GQ', 'ST', 'TD'] },
  { value: 'north-africa', label: 'North Africa', countries: ['EG', 'MA', 'TN', 'DZ', 'LY', 'SD', 'MR'] },
  { value: 'europe', label: 'Europe', countries: ['All EU Countries'] },
  { value: 'north-america', label: 'North America', countries: ['US', 'CA', 'MX'] },
  { value: 'asia', label: 'Asia', countries: ['All Asian Countries'] },
  { value: 'global', label: 'Global', countries: ['Worldwide'] }
];

const LICENSE_TYPES = [
  { 
    value: 'exclusive', 
    label: 'Exclusive License', 
    description: 'Sole rights for distribution',
    duration: 'Time-bound',
    icon: Crown,
    color: 'text-purple-600'
  },
  { 
    value: 'non-exclusive', 
    label: 'Non-Exclusive License', 
    description: 'Multiple distributors allowed',
    duration: 'Time-bound',
    icon: Globe,
    color: 'text-blue-600'
  },
  { 
    value: 'limited', 
    label: 'Limited Time License', 
    description: 'Fixed duration with renewal options',
    duration: 'Time-bound',
    icon: Clock,
    color: 'text-orange-600'
  },
  { 
    value: 'perpetual', 
    label: 'Perpetual License', 
    description: 'Lifetime rights without expiration',
    duration: 'Lifetime',
    icon: Lock,
    color: 'text-green-600'
  }
];

const LICENSE_DURATIONS = [
  { value: '1-year', label: '1 Year', months: 12 },
  { value: '2-years', label: '2 Years', months: 24 },
  { value: '3-years', label: '3 Years', months: 36 },
  { value: '5-years', label: '5 Years', months: 60 },
  { value: '10-years', label: '10 Years', months: 120 },
  { value: 'custom', label: 'Custom Duration', months: null }
];

export default function RightsDistributionStep({ formData, updateFormData, errors = [] }) {
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [dateErrors, setDateErrors] = useState({});
  const selectedLicense = LICENSE_TYPES.find(license => license.value === formData.licenseType);
  const hasErrors = errors.length > 0;

  // Get field-specific errors
  const getFieldError = (fieldKey) => {
    return errors.find(error => 
      error.toLowerCase().includes(fieldKey.toLowerCase()) ||
      error.toLowerCase().includes('license') && fieldKey === 'licenseType' ||
      error.toLowerCase().includes('region') && fieldKey === 'regions' ||
      error.toLowerCase().includes('date') && (fieldKey === 'startDate' || fieldKey === 'endDate')
    );
  };

  // Auto-calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.licenseType === 'perpetual') {
      updateFormData({ 
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: '2999-12-31' // Far future date for perpetual
      });
      setDateErrors({});
    } else if (formData.startDate && formData.licenseDuration && formData.licenseDuration !== 'custom') {
      const duration = LICENSE_DURATIONS.find(d => d.value === formData.licenseDuration);
      if (duration?.months) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate.setMonth(startDate.getMonth() + duration.months));
        updateFormData({ endDate: endDate.toISOString().split('T')[0] });
        setDateErrors({});
      }
    }
  }, [formData.startDate, formData.licenseDuration, formData.licenseType]);

  // Validate dates
  useEffect(() => {
    const errors = {};
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }
      
      if (start < new Date().setHours(0, 0, 0, 0)) {
        errors.startDate = 'Start date cannot be in the past';
      }
    }
    
    if (formData.licenseType !== 'perpetual') {
      if (!formData.startDate && formData.endDate) {
        errors.startDate = 'Start date is required when end date is set';
      }
      if (formData.startDate && !formData.endDate) {
        errors.endDate = 'End date is required when start date is set';
      }
    }
    
    setDateErrors(errors);
  }, [formData.startDate, formData.endDate, formData.licenseType]);

  const handleLicenseTypeChange = (licenseType) => {
    updateFormData({ licenseType });
    if (licenseType === 'perpetual') {
      updateFormData({ 
        licenseDuration: null,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        endDate: '2999-12-31'
      });
      setShowCustomDuration(false);
    }
  };

  const calculateRemainingTime = () => {
    if (!formData.startDate || !formData.endDate) return null;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    
    if (end <= today) return { status: 'expired', days: 0 };
    
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return { status: 'expiring', days: diffDays };
    return { status: 'active', days: diffDays };
  };

  const timeRemaining = calculateRemainingTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className={clsx(
          "bg-gradient-to-r w-12 h-12 rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-3 transition-all duration-300",
          hasErrors 
            ? "from-red-500 to-red-600 animate-pulse" 
            : "from-[#BC8BBC] to-purple-600"
        )}>
          {hasErrors ? (
            <AlertCircle className="w-6 h-6 text-white" />
          ) : (
            <Globe className="w-6 h-6 text-white" />
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Rights & Distribution
          {hasErrors && <span className="text-red-500 ml-2">- Validation Required</span>}
        </h3>
        <p className={clsx(
          "text-sm sm:text-base",
          hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
        )}>
          {hasErrors ? "Please fix the validation errors below to continue." : "Configure licensing terms, distribution regions, and usage rights for your content."}
        </p>
        
        {/* Error Summary */}
        {hasErrors && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Please fix the following issues:</span>
            </div>
            <ul className="text-red-600 dark:text-red-400 text-sm mt-2 list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* License Type Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={clsx(
            "w-1 h-6 rounded-full",
            hasErrors ? "bg-red-500" : "bg-purple-500"
          )}></div>
          <h4 className={clsx(
            "font-semibold",
            hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
          )}>License Type *</h4>
          <span className={clsx(
            "text-xs px-2 py-1 rounded",
            hasErrors
              ? "text-red-700 bg-red-100 dark:bg-red-900/30"
              : "text-gray-500 bg-gray-100 dark:bg-gray-800"
          )}>
            Required
          </span>
        </div>

        {getFieldError('licenseType') && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{getFieldError('licenseType')}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LICENSE_TYPES.map((license) => {
            const isSelected = formData.licenseType === license.value;
            const Icon = license.icon;
            
            return (
              <button
                key={license.value}
                onClick={() => handleLicenseTypeChange(license.value)}
                className={clsx(
                  "group relative p-4 border-2 rounded-xl text-left transition-all duration-300",
                  "hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]",
                  isSelected
                    ? "border-[#BC8BBC] bg-gradient-to-br from-[#BC8BBC]/5 to-purple-600/5 shadow-lg"
                    : hasErrors && getFieldError('licenseType')
                    ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]/50"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300",
                    isSelected
                      ? "bg-[#BC8BBC] text-white"
                      : hasErrors && getFieldError('licenseType')
                      ? "bg-red-100 dark:bg-red-800 text-red-500 dark:text-red-400 group-hover:bg-red-200"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-[#BC8BBC]/10 group-hover:text-[#BC8BBC]"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className={clsx(
                        "font-semibold text-sm transition-colors duration-300",
                        isSelected 
                          ? "text-[#BC8BBC]"
                          : hasErrors && getFieldError('licenseType')
                          ? "text-red-700 dark:text-red-300"
                          : "text-gray-900 dark:text-white"
                      )}>
                        {license.label}
                      </h5>
                      <span className={clsx(
                        "text-xs px-2 py-1 rounded-full",
                        license.duration === 'Lifetime' 
                          ? hasErrors && getFieldError('licenseType')
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : hasErrors && getFieldError('licenseType')
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      )}>
                        {license.duration}
                      </span>
                    </div>
                    <p className={clsx(
                      "text-xs",
                      isSelected 
                        ? "text-[#BC8BBC]/80"
                        : hasErrors && getFieldError('licenseType')
                        ? "text-red-600/80 dark:text-red-400/80"
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {license.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* License Duration - Hidden for Perpetual */}
      {formData.licenseType && formData.licenseType !== 'perpetual' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className={clsx(
              "w-1 h-6 rounded-full",
              hasErrors ? "bg-red-500" : "bg-blue-500"
            )}></div>
            <h4 className={clsx(
              "font-semibold",
              hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
            )}>License Duration</h4>
            {hasErrors && (
              <span className={clsx(
                "text-xs px-2 py-1 rounded",
                "text-red-700 bg-red-100 dark:bg-red-900/30"
              )}>
                Action Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LICENSE_DURATIONS.map((duration) => (
              <button
                key={duration.value}
                onClick={() => {
                  if (duration.value === 'custom') {
                    setShowCustomDuration(true);
                    updateFormData({ licenseDuration: 'custom', endDate: '' });
                  } else {
                    setShowCustomDuration(false);
                    updateFormData({ licenseDuration: duration.value });
                  }
                }}
                className={clsx(
                  "p-3 border-2 rounded-lg text-center transition-all duration-200",
                  "hover:scale-105 hover:shadow-md",
                  formData.licenseDuration === duration.value
                    ? "border-[#BC8BBC] bg-[#BC8BBC]/10 text-[#BC8BBC]"
                    : hasErrors && (getFieldError('startDate') || getFieldError('endDate'))
                    ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 text-red-700 dark:text-red-300 hover:border-red-300"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#BC8BBC]/50"
                )}
              >
                <div className="font-semibold text-sm">{duration.label}</div>
                {duration.months && (
                  <div className={clsx(
                    "text-xs mt-1",
                    formData.licenseDuration === duration.value
                      ? "text-[#BC8BBC]/80"
                      : hasErrors && (getFieldError('startDate') || getFieldError('endDate'))
                      ? "text-red-600/80 dark:text-red-400/80"
                      : "text-gray-500 dark:text-gray-400"
                  )}>
                    {duration.months} months
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {(showCustomDuration || formData.licenseDuration === 'custom') && (
            <div className={clsx(
              "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border transition-colors duration-300",
              hasErrors && (getFieldError('startDate') || getFieldError('endDate'))
                ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            )}>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-[#BC8BBC]" />
                  <span>License Start Date *</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => updateFormData({ startDate: e.target.value })}
                    className={clsx(
                      "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none transition-all duration-200",
                      "focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent",
                      dateErrors.startDate || getFieldError('startDate')
                        ? "border-red-300 dark:border-red-600 pr-10"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  />
                  {(dateErrors.startDate || getFieldError('startDate')) && (
                    <div className="absolute right-3 top-2 text-red-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {(dateErrors.startDate || getFieldError('startDate')) && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{dateErrors.startDate || getFieldError('startDate')}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-[#BC8BBC]" />
                  <span>License End Date *</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => updateFormData({ endDate: e.target.value })}
                    min={formData.startDate}
                    className={clsx(
                      "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none transition-all duration-200",
                      "focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent",
                      dateErrors.endDate || getFieldError('endDate')
                        ? "border-red-300 dark:border-red-600 pr-10"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  />
                  {(dateErrors.endDate || getFieldError('endDate')) && (
                    <div className="absolute right-3 top-2 text-red-500">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {(dateErrors.endDate || getFieldError('endDate')) && (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{dateErrors.endDate || getFieldError('endDate')}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Time Remaining Display */}
          {timeRemaining && formData.startDate && formData.endDate && !dateErrors.startDate && !dateErrors.endDate && (
            <div className={clsx(
              "p-3 rounded-lg border text-sm font-medium",
              timeRemaining.status === 'expired' && "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
              timeRemaining.status === 'expiring' && "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300",
              timeRemaining.status === 'active' && "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
            )}>
              {timeRemaining.status === 'expired' && '⚠️ License has expired'}
              {timeRemaining.status === 'expiring' && `⚠️ License expires in ${timeRemaining.days} days`}
              {timeRemaining.status === 'active' && `✅ License active for ${timeRemaining.days} more days`}
            </div>
          )}
        </div>
      )}

      {/* Perpetual License Notice */}
      {formData.licenseType === 'perpetual' && (
        <div className={clsx(
          "border rounded-xl p-4 transition-colors duration-300",
          hasErrors
            ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        )}>
          <div className="flex items-start space-x-3">
            <Lock className={clsx(
              "w-5 h-5 mt-0.5 flex-shrink-0",
              hasErrors ? "text-red-500" : "text-green-600 dark:text-green-400"
            )} />
            <div className="flex-1 min-w-0">
              <h5 className={clsx(
                "text-sm font-medium mb-1",
                hasErrors ? "text-red-900 dark:text-red-100" : "text-green-900 dark:text-green-100"
              )}>
                {hasErrors ? 'License Configuration Required' : 'Perpetual License Activated'}
              </h5>
              <p className={clsx(
                "text-xs",
                hasErrors ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"
              )}>
                {hasErrors 
                  ? 'Please complete the license configuration above to proceed.'
                  : 'This license grants lifetime distribution rights without expiration. The content can be distributed indefinitely under the agreed terms.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Regions */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={clsx(
            "w-1 h-6 rounded-full",
            hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
          )}></div>
          <h4 className={clsx(
            "font-semibold",
            hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
          )}>Distribution Regions</h4>
          <span className={clsx(
            "text-xs px-2 py-1 rounded",
            hasErrors
              ? "text-red-700 bg-red-100 dark:bg-red-900/30"
              : "text-gray-500 bg-gray-100 dark:bg-gray-800"
          )}>
            Multiple selection
          </span>
        </div>

        {getFieldError('regions') && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{getFieldError('regions')}</span>
            </p>
          </div>
        )}

        {/* Local Regions Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Local & Border Regions</h5>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">
              Recommended
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REGIONS.filter(region => region.local).map((region) => {
              const isSelected = formData.regions?.includes(region.value);
              
              return (
                <label
                  key={region.value}
                  className={clsx(
                    "relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 group",
                    "hover:scale-105 hover:shadow-md",
                    isSelected
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : hasErrors && getFieldError('regions')
                      ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newRegions = e.target.checked
                        ? [...(formData.regions || []), region.value]
                        : (formData.regions || []).filter(r => r !== region.value);
                      updateFormData({ regions: newRegions });
                    }}
                    className="absolute top-2 right-2 rounded border-gray-300 text-green-500 focus:ring-green-500"
                  />
                  <div className="pr-6">
                    <div className="flex items-center space-x-1 mb-1">
                      <h5 className={clsx(
                        "font-semibold text-sm",
                        isSelected
                          ? "text-green-700 dark:text-green-300"
                          : hasErrors && getFieldError('regions')
                          ? "text-red-700 dark:text-red-300"
                          : "text-gray-900 dark:text-white"
                      )}>
                        {region.label}
                      </h5>
                      {region.value === 'rwanda' && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300 rounded">
                          Local
                        </span>
                      )}
                    </div>
                    <p className={clsx(
                      "text-xs",
                      isSelected
                        ? "text-green-600/80 dark:text-green-400/80"
                        : hasErrors && getFieldError('regions')
                        ? "text-red-600/80 dark:text-red-400/80"
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {region.countries.join(', ')}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Regional & Global Sections */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Regional & Global Distribution</h5>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REGIONS.filter(region => !region.local).map((region) => {
              const isSelected = formData.regions?.includes(region.value);
              
              return (
                <label
                  key={region.value}
                  className={clsx(
                    "relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:scale-105 hover:shadow-md",
                    isSelected
                      ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
                      : hasErrors && getFieldError('regions')
                      ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newRegions = e.target.checked
                        ? [...(formData.regions || []), region.value]
                        : (formData.regions || []).filter(r => r !== region.value);
                      updateFormData({ regions: newRegions });
                    }}
                    className="absolute top-2 right-2 rounded border-gray-300 text-[#BC8BBC] focus:ring-[#BC8BBC]"
                  />
                  <div className="pr-6">
                    <h5 className={clsx(
                      "font-semibold text-sm mb-1",
                      hasErrors && getFieldError('regions') && !isSelected
                        ? "text-red-700 dark:text-red-300"
                        : "text-gray-900 dark:text-white"
                    )}>
                      {region.label}
                    </h5>
                    <p className={clsx(
                      "text-xs",
                      hasErrors && getFieldError('regions') && !isSelected
                        ? "text-red-600/80 dark:text-red-400/80"
                        : "text-gray-600 dark:text-gray-400"
                    )}>
                      {region.countries.join(', ')}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        
        {formData.regions?.length > 0 && !getFieldError('regions') && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">
              ✓ {formData.regions.length} region(s) selected for distribution
              {formData.regions.includes('rwanda') && " • Includes local Rwandan market"}
            </p>
          </div>
        )}
      </div>

      {/* Usage Rights */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={clsx(
            "w-1 h-6 rounded-full",
            hasErrors ? "bg-red-500" : "bg-orange-500"
          )}></div>
          <h4 className={clsx(
            "font-semibold",
            hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
          )}>Usage Rights</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className={clsx(
            "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
            "hover:scale-105 hover:shadow-md",
            formData.exclusive
              ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
              : hasErrors
              ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]/50"
          )}>
            <Crown className={clsx(
              "w-5 h-5",
              formData.exclusive 
                ? "text-[#BC8BBC]"
                : hasErrors
                ? "text-red-400"
                : "text-gray-400"
            )} />
            <div className="flex-1">
              <div className={clsx(
                "font-semibold text-sm",
                hasErrors && !formData.exclusive
                  ? "text-red-700 dark:text-red-300"
                  : "text-gray-900 dark:text-white"
              )}>
                Exclusive Rights
              </div>
              <div className={clsx(
                "text-xs",
                hasErrors && !formData.exclusive
                  ? "text-red-600/80 dark:text-red-400/80"
                  : "text-gray-600 dark:text-gray-400"
              )}>
                Sole distribution rights
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.exclusive}
              onChange={(e) => updateFormData({ exclusive: e.target.checked })}
              className={clsx(
                "rounded focus:ring-2 focus:ring-[#BC8BBC]",
                hasErrors ? "border-red-300 text-red-500" : "border-gray-300 text-[#BC8BBC]"
              )}
            />
          </label>

          <label className={clsx(
            "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
            "hover:scale-105 hover:shadow-md",
            formData.downloadable
              ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
              : hasErrors
              ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]/50"
          )}>
            <Download className={clsx(
              "w-5 h-5",
              formData.downloadable 
                ? "text-[#BC8BBC]"
                : hasErrors
                ? "text-red-400"
                : "text-gray-400"
            )} />
            <div className="flex-1">
              <div className={clsx(
                "font-semibold text-sm",
                hasErrors && !formData.downloadable
                  ? "text-red-700 dark:text-red-300"
                  : "text-gray-900 dark:text-white"
              )}>
                Offline Downloads
              </div>
              <div className={clsx(
                "text-xs",
                hasErrors && !formData.downloadable
                  ? "text-red-600/80 dark:text-red-400/80"
                  : "text-gray-600 dark:text-gray-400"
              )}>
                Allow download for offline viewing
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.downloadable}
              onChange={(e) => updateFormData({ downloadable: e.target.checked })}
              className={clsx(
                "rounded focus:ring-2 focus:ring-[#BC8BBC]",
                hasErrors ? "border-red-300 text-red-500" : "border-gray-300 text-[#BC8BBC]"
              )}
            />
          </label>

          <label className={clsx(
            "flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200",
            "hover:scale-105 hover:shadow-md",
            formData.shareable
              ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
              : hasErrors
              ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]/50"
          )}>
            <Share2 className={clsx(
              "w-5 h-5",
              formData.shareable 
                ? "text-[#BC8BBC]"
                : hasErrors
                ? "text-red-400"
                : "text-gray-400"
            )} />
            <div className="flex-1">
              <div className={clsx(
                "font-semibold text-sm",
                hasErrors && !formData.shareable
                  ? "text-red-700 dark:text-red-300"
                  : "text-gray-900 dark:text-white"
              )}>
                Social Sharing
              </div>
              <div className={clsx(
                "text-xs",
                hasErrors && !formData.shareable
                  ? "text-red-600/80 dark:text-red-400/80"
                  : "text-gray-600 dark:text-gray-400"
              )}>
                Allow sharing on social media
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.shareable}
              onChange={(e) => updateFormData({ shareable: e.target.checked })}
              className={clsx(
                "rounded focus:ring-2 focus:ring-[#BC8BBC]",
                hasErrors ? "border-red-300 text-red-500" : "border-gray-300 text-[#BC8BBC]"
              )}
            />
          </label>
        </div>
      </div>

      {/* Pro Tips */}
      <div className={clsx(
        "border rounded-xl p-5 transition-colors duration-300",
        hasErrors
          ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : "bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 border-[#BC8BBC]/20"
      )}>
        <div className="flex items-start space-x-3">
          <div className={clsx(
            "text-white p-2 rounded-lg flex-shrink-0",
            hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
          )}>
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className={clsx(
              "text-sm font-semibold mb-2",
              hasErrors ? "text-red-700 dark:text-red-300" : "text-[#BC8BBC]"
            )}>
              {hasErrors ? 'Important Guidelines - Action Required' : 'Licensing Best Practices'}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={clsx(
                    "w-2 h-2 rounded-full",
                    hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
                  )}></div>
                  <span className={clsx(
                    "font-medium",
                    hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"
                  )}>Regional Strategy:</span>
                </div>
                <ul className={clsx(
                  "space-y-1 ml-4",
                  hasErrors ? "text-red-600/80 dark:text-red-400/80" : "text-gray-600 dark:text-gray-400"
                )}>
                  <li>• <strong>Start with Rwanda</strong> for local market testing</li>
                  <li>• Expand to <strong>border countries</strong> (Uganda, Kenya, Tanzania, Burundi)</li>
                  <li>• Then move to <strong>East Africa region</strong> for broader reach</li>
                  <li>• Consider <strong>global rights</strong> for maximum revenue</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={clsx(
                    "w-2 h-2 rounded-full",
                    hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
                  )}></div>
                  <span className={clsx(
                    "font-medium",
                    hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"
                  )}>License Types:</span>
                </div>
                <ul className={clsx(
                  "space-y-1 ml-4",
                  hasErrors ? "text-red-600/80 dark:text-red-400/80" : "text-gray-600 dark:text-gray-400"
                )}>
                  <li>• <strong>Exclusive</strong>: Highest value, single distributor</li>
                  <li>• <strong>Non-Exclusive</strong>: Multiple revenue streams</li>
                  <li>• <strong>Perpetual</strong>: Lifetime rights, premium pricing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}