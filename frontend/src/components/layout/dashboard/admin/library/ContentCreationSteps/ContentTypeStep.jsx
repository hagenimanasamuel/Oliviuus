import React, { useState } from "react";
import { Film, Tv, FileText, Globe, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

const CONTENT_TYPES = [
  { 
    id: 'movie', 
    label: 'Movie', 
    icon: Film, 
    description: 'Single video content',
    features: ['Single video file', 'Theatrical release', 'Standalone story'],
    details: 'Perfect for feature films, indie movies, and cinematic content that tells a complete story in one sitting.'
  },
  { 
    id: 'series', 
    label: 'TV Series', 
    icon: Tv, 
    description: 'Series with seasons and episodes',
    features: ['Multiple episodes', 'Season structure', 'Ongoing storylines'],
    details: 'Ideal for TV shows, web series, and episodic content that unfolds across multiple episodes and seasons.'
  },
  { 
    id: 'documentary', 
    label: 'Documentary', 
    icon: FileText, 
    description: 'Educational or factual content',
    features: ['Fact-based', 'Educational', 'Real-world focus'],
    details: 'Great for educational content, factual programming, and real-world storytelling with informational value.'
  },
  { 
    id: 'short_film', 
    label: 'Short Film', 
    icon: Film, 
    description: 'Shorter format content',
    features: ['Under 40 minutes', 'Film festivals', 'Compact storytelling'],
    details: 'Designed for short films, experimental content, and compact storytelling under 40 minutes.'
  },
  { 
    id: 'live_event', 
    label: 'Live Event', 
    icon: Globe, 
    description: 'Live streaming events',
    features: ['Real-time streaming', 'Interactive', 'Time-sensitive'],
    details: 'Perfect for live streams, webinars, concerts, and real-time events with interactive elements.'
  }
];

export default function ContentTypeStep({ formData, updateFormData, errors = [] }) {
  const [expandedType, setExpandedType] = useState(null);
  const hasErrors = errors.length > 0;

  const toggleExpand = (typeId) => {
    setExpandedType(expandedType === typeId ? null : typeId);
  };

  const handleSelect = (typeId) => {
    updateFormData({ contentType: typeId });
    setExpandedType(null); // Collapse after selection
  };

  return (
    <div className="space-y-4">
      {/* Header Section - More Compact */}
      <div className="text-center">
        <div className={clsx(
          "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300",
          hasErrors 
            ? "bg-red-500 animate-pulse" 
            : formData.contentType
            ? "bg-green-500"
            : "bg-[#BC8BBC]"
        )}>
          {hasErrors ? (
            <AlertCircle className="w-5 h-5 text-white" />
          ) : (
            <Film className="w-5 h-5 text-white" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Select Content Type
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs max-w-md mx-auto">
          Choose your content format. Click on any type for more details.
        </p>
        
        {/* Error Message - Compact */}
        {hasErrors && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-1.5 text-red-700 dark:text-red-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">{errors[0]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Type List - Compact FAQ Style */}
      <div className="space-y-2 max-w-md mx-auto">
        {CONTENT_TYPES.map((type) => {
          const isSelected = formData.contentType === type.id;
          const isExpanded = expandedType === type.id;
          
          return (
            <div key={type.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Header - Always Visible */}
              <button
                onClick={() => toggleExpand(type.id)}
                className={clsx(
                  "w-full p-3 flex items-center justify-between text-left transition-colors duration-200",
                  "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  isSelected
                    ? "bg-[#BC8BBC]/10 border-l-4 border-l-[#BC8BBC]"
                    : hasErrors
                    ? "bg-red-50/50 dark:bg-red-900/10"
                    : "bg-white dark:bg-gray-800"
                )}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className={clsx(
                    "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                    isSelected 
                      ? "bg-[#BC8BBC] text-white"
                      : hasErrors
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}>
                    <type.icon className="w-4 h-4" />
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={clsx(
                        "font-semibold text-sm truncate",
                        isSelected 
                          ? "text-[#BC8BBC]"
                          : hasErrors
                          ? "text-red-700 dark:text-red-300"
                          : "text-gray-900 dark:text-white"
                      )}>
                        {type.label}
                      </h4>
                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#BC8BBC] flex-shrink-0" />
                      )}
                    </div>
                    <p className={clsx(
                      "text-xs truncate",
                      hasErrors && !isSelected
                        ? "text-red-600/70 dark:text-red-400/70"
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {type.description}
                    </p>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className={clsx(
                  "text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2",
                  isExpanded ? "rotate-180" : ""
                )}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div className={clsx(
                  "border-t border-gray-100 dark:border-gray-700 p-3",
                  isSelected
                    ? "bg-[#BC8BBC]/5"
                    : "bg-gray-50 dark:bg-gray-800/30"
                )}>
                  {/* Features */}
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Key Features:
                    </h5>
                    <div className="space-y-1">
                      {type.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <div className={clsx(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            isSelected ? "bg-[#BC8BBC]" : "bg-gray-400"
                          )} />
                          <span className="text-gray-600 dark:text-gray-400">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="mb-3">
                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Best For:
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {type.details}
                    </p>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleSelect(type.id)}
                    className={clsx(
                      "w-full py-2 px-3 rounded text-xs font-medium transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]/50",
                      isSelected
                        ? "bg-[#BC8BBC] text-white hover:bg-[#9b69b2]"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#BC8BBC] hover:text-white"
                    )}
                  >
                    {isSelected ? "✓ Selected" : `Select ${type.label}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection Status - Only show when selected */}
      {formData.contentType && (
        <div className={clsx(
          "border rounded-lg p-3 transition-all duration-300 max-w-md mx-auto",
          hasErrors
            ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
            : "bg-[#BC8BBC]/10 border-[#BC8BBC]/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={clsx(
                "text-white p-1.5 rounded",
                hasErrors ? "bg-red-500" : "bg-[#BC8BBC]"
              )}>
                {hasErrors ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <h4 className={clsx(
                  "font-semibold text-sm",
                  hasErrors 
                    ? "text-red-700 dark:text-red-300"
                    : "text-gray-900 dark:text-white"
                )}>
                  {CONTENT_TYPES.find(t => t.id === formData.contentType)?.label} Selected
                </h4>
                <p className={clsx(
                  "text-xs",
                  hasErrors
                    ? "text-red-600/80 dark:text-red-400/80"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  {hasErrors 
                    ? "Fix error to continue"
                    : "Ready for next step"
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => updateFormData({ contentType: '' })}
              className={clsx(
                "text-xs transition-colors whitespace-nowrap px-2 py-1 rounded hover:bg-black/5",
                hasErrors
                  ? "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Quick Tips - Very Compact */}
      <div className={clsx(
        "border rounded-lg p-3 max-w-md mx-auto",
        hasErrors
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      )}>
        <div className="flex items-start space-x-2">
          <div className={clsx(
            "rounded p-1.5 flex-shrink-0 mt-0.5",
            hasErrors
              ? "bg-red-100 dark:bg-red-800"
              : "bg-blue-100 dark:bg-blue-800"
          )}>
            <svg className={clsx(
              "w-3.5 h-3.5",
              hasErrors
                ? "text-red-600 dark:text-red-400"
                : "text-blue-600 dark:text-blue-400"
            )} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={clsx(
              "text-xs leading-relaxed",
              hasErrors
                ? "text-red-700 dark:text-red-300"
                : "text-blue-700 dark:text-blue-300"
            )}>
              <span className="font-semibold">
                {hasErrors ? "Required: " : "Tip: "}
              </span>
              {hasErrors 
                ? "Select a content type to continue."
                : "Click on any type to see details and features before selecting."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}