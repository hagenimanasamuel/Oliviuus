import React from "react";
import { Shield, Globe, AlertTriangle, Info, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'fr', label: 'French' },
  { value: 'sw', label: 'Kiswahili' }
];

const AGE_RATING_GUIDELINES = [
  { range: 'All Ages', description: 'Suitable for viewers of all ages including children' },
  { range: '7+', description: 'May contain mild cartoon violence or fantasy themes' },
  { range: '13+', description: 'May contain moderate violence, mild language, or suggestive themes' },
  { range: '16+', description: 'May contain intense violence, strong language, or sexual content' },
  { range: '18+', description: 'Contains adult content, intense violence, or explicit material' }
];

const CONTENT_WARNINGS = [
  'None',
  'Violence',
  'Graphic Violence',
  'Strong Language',
  'Profanity',
  'Nudity',
  'Partial Nudity',
  'Sexual Content',
  'Sexual Themes',
  'Sexual Violence',
  'Drug Use',
  'Substance Abuse',
  'Alcohol Use',
  'Smoking',
  'Flashing Lights',
  'Strobe Effects',
  'Gore',
  'Body Horror',
  'Jump Scares',
  'Psychological Horror',
  'Horror Themes',
  'Thematic Elements',
  'Mature Themes',
  'Disturbing Content',
  'Emotional Distress',
  'Suicide Themes',
  'Self-Harm',
  'Abuse',
  'Domestic Violence',
  'Child Abuse',
  'Animal Cruelty',
  'Animal Death',
  'Death',
  'Grief',
  'War Violence',
  'Torture',
  'Kidnapping',
  'Stalking',
  'Bullying',
  'Discrimination',
  'Racism',
  'Sexism',
  'Homophobia',
  'Transphobia',
  'Religious Themes',
  'Political Themes',
  'Conspiracy Theories',
  'Legal Issues',
  'Crime',
  'Criminal Behavior',
  'Weapons',
  'Gun Violence',
  'Knife Violence',
  'Explosions',
  'Car Accidents',
  'Natural Disasters',
  'Medical Procedures',
  'Illness',
  'Pandemic Themes',
  'Body Transformation',
  'Eating Disorders',
  'Mental Health Issues',
  'Abandonment',
  'Betrayal',
  'Revenge',
  'Revenge Porn',
  'Sex Trafficking',
  'Human Trafficking',
  'Terrorism',
  'Extremism',
  'Cult Themes',
  'Occult Themes',
  'Supernatural Violence',
  'Paranormal Activity',
  'Exorcism',
  'Witchcraft',
  'Satanic Themes',
  'Religious Violence',
  'Blasphemy',
  'Sacrilege'
];

export default function ClassificationStep({ formData, updateFormData, errors = [] }) {
  const hasErrors = errors.length > 0;
  const [expandedSections, setExpandedSections] = React.useState({
    ageRating: true,
    languages: false,
    contentWarnings: false
  });

  // FIXED: Create a combined languages array for validation
  const languagesArray = React.useMemo(() => {
    const languages = new Set();
    
    // Add primary language if exists
    if (formData.primaryLanguage) {
      languages.add(formData.primaryLanguage);
    }
    
    // Add all subtitle languages
    if (formData.subtitles && Array.isArray(formData.subtitles)) {
      formData.subtitles.forEach(lang => languages.add(lang));
    }
    
    return Array.from(languages);
  }, [formData.primaryLanguage, formData.subtitles]);

  // FIXED: Update formData to include languages array for validation
  React.useEffect(() => {
    if (languagesArray.length > 0 && JSON.stringify(formData.languages) !== JSON.stringify(languagesArray)) {
      updateFormData({ languages: languagesArray });
    }
  }, [languagesArray, formData.languages, updateFormData]);

  // FIXED: More specific field error detection
  const getFieldError = (fieldKey) => {
    return errors.find(error => {
      const errorLower = error.toLowerCase();
      
      switch (fieldKey) {
        case 'ageRating':
          return errorLower.includes('age rating') || errorLower.includes('age_rating');
        case 'primaryLanguage':
          return errorLower.includes('primary language') || errorLower.includes('primary_language');
        case 'languages':
          return errorLower.includes('language') && errorLower.includes('at least');
        case 'contentWarnings':
          return errorLower.includes('content warning') || errorLower.includes('content_warning');
        case 'subtitles':
          return errorLower.includes('subtitle');
        default:
          return false;
      }
    });
  };

  // Check if specific fields have values
  const hasAgeRating = formData.ageRating && formData.ageRating.trim() !== '';
  const hasPrimaryLanguage = formData.primaryLanguage && formData.primaryLanguage.trim() !== '';
  const hasContentWarnings = formData.contentWarnings && formData.contentWarnings.length > 0;
  const hasLanguages = languagesArray.length > 0;

  const handlePrimaryLanguageChange = (value) => {
    updateFormData({ primaryLanguage: value });
  };

  const handleSubtitlesChange = (selectedSubtitles) => {
    updateFormData({ subtitles: selectedSubtitles });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleContentWarningChange = (warning, checked) => {
    let newWarnings;
    
    if (warning === 'None') {
      // If "None" is selected, clear all other warnings
      newWarnings = checked ? ['None'] : [];
    } else {
      // If any other warning is selected, remove "None" and update the list
      const currentWarnings = formData.contentWarnings || [];
      
      if (checked) {
        newWarnings = [...currentWarnings.filter(w => w !== 'None'), warning];
      } else {
        newWarnings = currentWarnings.filter(w => w !== warning);
      }
    }
    
    updateFormData({ contentWarnings: newWarnings });
  };

  const renderSectionHeader = (title, fieldKey, required = false, color = "red") => (
    <button
      onClick={() => toggleSection(fieldKey)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
    >
      <div className="flex items-center space-x-2">
        <div className={clsx(
          "w-1.5 h-4 rounded-full",
          getFieldError(fieldKey) ? "bg-red-500" : 
          color === "blue" ? "bg-blue-500" :
          color === "orange" ? "bg-orange-500" : "bg-red-500"
        )}></div>
        <h4 className={clsx(
          "font-semibold text-sm",
          getFieldError(fieldKey) ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
        )}>{title}</h4>
        {required && (
          <span className={clsx(
            "text-xs px-1.5 py-0.5 rounded",
            getFieldError(fieldKey)
              ? "text-red-700 bg-red-100 dark:bg-red-900/30"
              : "text-gray-500 bg-gray-100 dark:bg-gray-700"
          )}>
            Required
          </span>
        )}
      </div>
      <ChevronDown className={clsx(
        "w-4 h-4 text-gray-500 transition-transform",
        expandedSections[fieldKey] && "rotate-180"
      )} />
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Header - More Compact */}
      <div className="text-center">
        <div className={clsx(
          "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300",
          hasErrors 
            ? "bg-red-500 animate-pulse" 
            : "bg-[#BC8BBC]"
        )}>
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-white" />
          ) : (
            <Shield className="w-5 h-5 text-white" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Content Classification
        </h3>
        <p className={clsx(
          "text-xs",
          hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
        )}>
          {hasErrors ? "Please fix validation errors to continue." : "Set age ratings, content warnings, and language information."}
        </p>
        
        {/* Error Summary */}
        {hasErrors && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-1.5 text-red-700 dark:text-red-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">Fix these issues:</span>
            </div>
            <ul className="text-red-600 dark:text-red-400 text-xs mt-1 list-disc list-inside space-y-0.5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Age Rating Section - Expandable on Mobile */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {renderSectionHeader("Age Rating", "ageRating", true)}
        
        {expandedSections.ageRating && (
          <div className="p-3 bg-white dark:bg-gray-800 space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Shield className="w-3.5 h-3.5 text-[#BC8BBC]" />
                <span>Age Rating</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ageRating || ''}
                  onChange={(e) => updateFormData({ ageRating: e.target.value })}
                  placeholder="e.g., 13+, 16+, All Ages, 18+"
                  className={clsx(
                    "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none transition-all duration-200 text-sm",
                    "focus:ring-2 focus:ring-[#BC8BBC] focus:border-[#BC8BBC]",
                    getFieldError('ageRating') && !hasAgeRating
                      ? "border-red-300 dark:border-red-600 pr-10"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                />
                {getFieldError('ageRating') && !hasAgeRating && (
                  <div className="absolute right-3 top-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              {getFieldError('ageRating') && !hasAgeRating ? (
                <p className="text-red-500 text-xs flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{getFieldError('ageRating')}</span>
                </p>
              ) : hasAgeRating ? (
                <p className="text-green-600 dark:text-green-400 text-xs">
                  ✓ Age rating set to: {formData.ageRating}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter age rating following guidelines
                </p>
              )}
            </div>

            {/* Age Rating Guidelines - Compact */}
            <div className={clsx(
              "border rounded-lg p-3 transition-colors duration-300",
              getFieldError('ageRating')
                ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            )}>
              <div className="flex items-center space-x-2 mb-2">
                <Info className={clsx(
                  "w-3.5 h-3.5",
                  getFieldError('ageRating') ? "text-red-500" : "text-blue-600 dark:text-blue-400"
                )} />
                <h5 className={clsx(
                  "text-xs font-medium",
                  getFieldError('ageRating') ? "text-red-900 dark:text-red-100" : "text-blue-900 dark:text-blue-100"
                )}>
                  Age Rating Guidelines
                </h5>
              </div>
              <div className="space-y-1.5">
                {AGE_RATING_GUIDELINES.map((guideline, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className={clsx(
                      "text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0 min-w-10 text-center",
                      getFieldError('ageRating')
                        ? "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300"
                        : "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
                    )}>
                      {guideline.range}
                    </div>
                    <p className={clsx(
                      "text-xs flex-1 leading-tight",
                      getFieldError('ageRating')
                        ? "text-red-700 dark:text-red-300"
                        : "text-blue-700 dark:text-blue-300"
                    )}>
                      {guideline.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Language Section - Expandable on Mobile */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {renderSectionHeader("Language Settings", "languages", false, "blue")}
        
        {expandedSections.languages && (
          <div className="p-3 bg-white dark:bg-gray-800 space-y-4">
            {/* FIXED: Languages validation guidance */}
            {getFieldError('languages') && !hasLanguages && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-red-600 dark:text-red-400 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Please set both a primary language and available subtitles</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Primary Language */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe className="w-3.5 h-3.5 text-[#BC8BBC]" />
                  <span>Primary Language *</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.primaryLanguage || ''}
                    onChange={(e) => handlePrimaryLanguageChange(e.target.value)}
                    className={clsx(
                      "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none transition-all duration-200 text-sm",
                      "focus:ring-2 focus:ring-[#BC8BBC] focus:border-[#BC8BBC]",
                      (getFieldError('primaryLanguage') || getFieldError('languages')) && !hasPrimaryLanguage
                        ? "border-red-300 dark:border-red-600 pr-10"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <option value="">Select Primary Language</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                  {(getFieldError('primaryLanguage') || getFieldError('languages')) && !hasPrimaryLanguage && (
                    <div className="absolute right-3 top-2 text-red-500 pointer-events-none">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {(getFieldError('primaryLanguage') || getFieldError('languages')) && !hasPrimaryLanguage ? (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>Primary language is required</span>
                  </p>
                ) : hasPrimaryLanguage ? (
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    ✓ Primary language set to: {LANGUAGES.find(l => l.value === formData.primaryLanguage)?.label}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Main language spoken in the content
                  </p>
                )}
              </div>

              {/* Available Subtitles */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Globe className="w-3.5 h-3.5 text-[#BC8BBC]" />
                  <span>Available Subtitles *</span>
                </label>
                <div className="relative">
                  <select
                    multiple
                    value={formData.subtitles || []}
                    onChange={(e) => handleSubtitlesChange(Array.from(e.target.selectedOptions, option => option.value))}
                    className={clsx(
                      "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none transition-all duration-200 text-sm",
                      "focus:ring-2 focus:ring-[#BC8BBC] focus:border-[#BC8BBC]",
                      getFieldError('languages') && (!formData.subtitles || formData.subtitles.length === 0)
                        ? "border-red-300 dark:border-red-600 pr-10"
                        : "border-gray-300 dark:border-gray-600"
                    )}
                    size="3"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                  {getFieldError('languages') && (!formData.subtitles || formData.subtitles.length === 0) && (
                    <div className="absolute right-3 top-2 text-red-500 pointer-events-none">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>
                {getFieldError('languages') && (!formData.subtitles || formData.subtitles.length === 0) ? (
                  <p className="text-red-500 text-xs flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>At least one subtitle language is required</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Hold Ctrl/Cmd to select multiple languages
                  </p>
                )}
                {formData.subtitles?.length > 0 && (
                  <p className="text-green-600 dark:text-green-400 text-xs">
                    ✓ {formData.subtitles.length} subtitle language(s) selected
                  </p>
                )}
              </div>
            </div>

            {/* FIXED: Combined languages status */}
            {hasLanguages && !getFieldError('languages') && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <p className="text-green-700 dark:text-green-300 text-xs">
                  ✓ Languages configured: Primary ({LANGUAGES.find(l => l.value === formData.primaryLanguage)?.label}) + {formData.subtitles?.length || 0} subtitle(s)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Warnings Section - Expandable on Mobile */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {renderSectionHeader("Content Warnings", "contentWarnings", false, "orange")}
        
        {expandedSections.contentWarnings && (
          <div className="p-3 bg-white dark:bg-gray-800 space-y-4">
            <div className={clsx(
              "border rounded-lg p-3 transition-colors duration-300",
              getFieldError('contentWarnings')
                ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
            )}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className={clsx(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  getFieldError('contentWarnings') ? "text-red-500" : "text-orange-600 dark:text-orange-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className={clsx(
                    "text-xs leading-relaxed",
                    getFieldError('contentWarnings') ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"
                  )}>
                    {getFieldError('contentWarnings') 
                      ? 'Please address the validation errors. Content warnings help viewers make informed decisions.'
                      : 'Select all content warnings that apply. Choose "None" if no content warnings are applicable.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
              {CONTENT_WARNINGS.map(warning => (
                <label 
                  key={warning}
                  className={clsx(
                    "flex items-center space-x-2 p-2 rounded border cursor-pointer transition-all duration-200 text-xs",
                    "hover:scale-102 hover:shadow-sm",
                    formData.contentWarnings?.includes(warning)
                      ? warning === 'None' 
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-[#BC8BBC] bg-[#BC8BBC]/10"
                      : getFieldError('contentWarnings')
                      ? "border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10 hover:border-red-300"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#BC8BBC]/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={formData.contentWarnings?.includes(warning) || false}
                    onChange={(e) => handleContentWarningChange(warning, e.target.checked)}
                    className={clsx(
                      "rounded focus:ring-1 focus:ring-[#BC8BBC] scale-90",
                      getFieldError('contentWarnings')
                        ? "border-red-300 text-red-500"
                        : warning === 'None'
                        ? "border-green-300 text-green-500"
                        : "border-gray-300 text-[#BC8BBC]"
                    )}
                  />
                  <span className={clsx(
                    "font-medium truncate",
                    getFieldError('contentWarnings')
                      ? "text-red-700 dark:text-red-300"
                      : warning === 'None'
                      ? "text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-300"
                  )}>
                    {warning}
                  </span>
                </label>
              ))}
            </div>
            
            {getFieldError('contentWarnings') && !hasContentWarnings ? (
              <p className="text-red-500 text-xs flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{getFieldError('contentWarnings')}</span>
              </p>
            ) : hasContentWarnings ? (
              <p className="text-green-600 dark:text-green-400 text-xs">
                ✓ {formData.contentWarnings.length} content warning(s) selected
                {formData.contentWarnings.includes('None') && ' • "None" selected - no content warnings'}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Pro Tips Section - Compact */}
      <div className={clsx(
        "border rounded-lg p-3 transition-colors duration-300",
        hasErrors
          ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : "bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 border-[#BC8BBC]/20"
      )}>
        <div className="flex items-start space-x-2">
          <Info className={clsx(
            "w-4 h-4 mt-0.5 flex-shrink-0",
            hasErrors ? "text-red-500" : "text-[#BC8BBC]"
          )} />
          <div className="flex-1 min-w-0">
            <h5 className={clsx(
              "text-sm font-semibold mb-1",
              hasErrors ? "text-red-700 dark:text-red-300" : "text-[#BC8BBC]"
            )}>
              {hasErrors ? 'Important Guidelines' : 'Pro Tips'}
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-1.5">
                <div className={clsx(
                  "w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0",
                  hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
                )}></div>
                <div>
                  <span className={clsx(
                    "font-medium",
                    hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"
                  )}>Age Ratings: </span>
                  <span className={clsx(
                    hasErrors ? "text-red-600/80 dark:text-red-400/80" : "text-gray-600 dark:text-gray-400"
                  )}>
                    Use clear formats like "13+", "16+", "All Ages"
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-1.5">
                <div className={clsx(
                  "w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0",
                  hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
                )}></div>
                <div>
                  <span className={clsx(
                    "font-medium",
                    hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"
                  )}>Content Warnings: </span>
                  <span className={clsx(
                    hasErrors ? "text-red-600/80 dark:text-red-400/80" : "text-gray-600 dark:text-gray-400"
                  )}>
                    Select "None" if no warnings apply. Choose specific warnings for accuracy.
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-1.5">
                <div className={clsx(
                  "w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0",
                  hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
                )}></div>
                <div>
                  <span className={clsx(
                    "font-medium",
                    hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"
                  )}>Languages: </span>
                  <span className={clsx(
                    hasErrors ? "text-red-600/80 dark:text-red-400/80" : "text-gray-600 dark:text-gray-400"
                  )}>
                    Include Kinyarwanda subtitles for local accessibility
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Preview - Compact */}
      {(hasAgeRating || hasPrimaryLanguage || hasContentWarnings) && (
        <div className={clsx(
          "border rounded-lg p-3 transition-colors duration-300",
          hasErrors
            ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
        )}>
          <h5 className={clsx(
            "text-sm font-semibold mb-2",
            hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
          )}>
            {hasErrors ? 'Current Classification' : 'Classification Summary'}
          </h5>
          <div className="space-y-1 text-xs">
            {hasAgeRating && (
              <div className="flex items-center space-x-2">
                <Shield className={clsx(
                  "w-3.5 h-3.5",
                  hasErrors ? "text-red-500" : "text-[#BC8BBC]"
                )} />
                <span className={clsx(
                  hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                )}>Age Rating:</span>
                <span className={clsx(
                  "font-medium",
                  hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
                )}>{formData.ageRating}</span>
              </div>
            )}
            {hasPrimaryLanguage && (
              <div className="flex items-center space-x-2">
                <Globe className={clsx(
                  "w-3.5 h-3.5",
                  hasErrors ? "text-red-500" : "text-[#BC8BBC]"
                )} />
                <span className={clsx(
                  hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                )}>Language:</span>
                <span className={clsx(
                  "font-medium",
                  hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
                )}>
                  {LANGUAGES.find(l => l.value === formData.primaryLanguage)?.label}
                </span>
              </div>
            )}
            {hasContentWarnings && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className={clsx(
                  "w-3.5 h-3.5",
                  hasErrors ? "text-red-500" : "text-[#BC8BBC]"
                )} />
                <span className={clsx(
                  hasErrors ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                )}>Warnings:</span>
                <span className={clsx(
                  "font-medium",
                  hasErrors ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"
                )}>
                  {formData.contentWarnings.includes('None') 
                    ? 'None' 
                    : `${formData.contentWarnings.length} selected`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}