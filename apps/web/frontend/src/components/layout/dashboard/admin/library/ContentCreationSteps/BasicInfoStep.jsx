import React, { useState, useEffect } from "react";
import { Calendar, Clock, Tag, MapPin, Tv, Globe, Users, Building, FileText, Award, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import api from "../../../../../../api/axios";

const CONTENT_TYPE_CONFIG = {
  movie: {
    title: "Movie Details",
    description: "Enter the essential information about your movie.",
    fields: {
      duration: { label: "Duration (minutes)", type: "number", icon: Clock, required: true, min: 1 },
      productionCompany: { label: "Production Company", type: "text", icon: Building, optional: true },
      budget: { label: "Budget (USD)", type: "number", icon: Award, optional: true, min: 0 }
    }
  },
  series: {
    title: "Series Details", 
    description: "Set up your TV series with seasons and episodes.",
    fields: {
      totalSeasons: { label: "Number of Seasons", type: "number", icon: Tv, required: true, min: 1 },
      episodesPerSeason: { label: "Episodes per Season", type: "number", icon: Tv, required: true, min: 1 },
      episodeDuration: { label: "Episode Duration (minutes)", type: "number", icon: Clock, required: true, min: 1 },
      productionCompany: { label: "Production Company", type: "text", icon: Building, optional: true }
    }
  },
  documentary: {
    title: "Documentary Details",
    description: "Provide information about your documentary content.",
    fields: {
      duration: { label: "Duration (minutes)", type: "number", icon: Clock, required: true, min: 1 },
      subject: { label: "Documentary Subject", type: "text", icon: FileText, required: true },
      location: { label: "Primary Location", type: "text", icon: MapPin, optional: true }
    }
  },
  short_film: {
    title: "Short Film Details",
    description: "Enter details specific to your short film.",
    fields: {
      duration: { label: "Duration (minutes)", type: "number", icon: Clock, required: true, min: 1, max: 40 },
      festival: { label: "Film Festival", type: "text", icon: Award, optional: true },
      productionCompany: { label: "Production Company", type: "text", icon: Building, optional: true }
    }
  },
  live_event: {
    title: "Live Event Details", 
    description: "Configure your live streaming event.",
    fields: {
      eventDate: { label: "Event Date & Time", type: "datetime-local", icon: Calendar, required: true },
      duration: { label: "Expected Duration (hours)", type: "number", icon: Clock, required: true, min: 0.1, step: 0.5 },
      eventLocation: { label: "Event Location", type: "text", icon: MapPin, required: true },
      expectedAudience: { label: "Expected Audience", type: "number", icon: Users, optional: true, min: 1 }
    }
  }
};

export default function BasicInfoStep({ formData, updateFormData, tags, errors = [] }) {
  const contentType = formData.contentType;
  const config = CONTENT_TYPE_CONFIG[contentType] || CONTENT_TYPE_CONFIG.movie;
  const hasErrors = errors.length > 0;
  const [expandedSection, setExpandedSection] = useState(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // State for server data
  const [genres, setGenres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  // Check screen size for responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch genres and categories from server
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setDataError("");
        
        // Fetch genres and categories in parallel
        const [genresResponse, categoriesResponse] = await Promise.all([
          api.get("/genres/public"),
          api.get("/categories/public")
        ]);

        if (genresResponse.data.success) {
          setGenres(genresResponse.data.data);
        } else {
          throw new Error("Failed to load genres");
        }

        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data);
        } else {
          throw new Error("Failed to load categories");
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setDataError("Failed to load genres and categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Common fields that apply to all content types - now using server data
  const commonFields = {
    title: { label: "Title", type: "text", icon: FileText, required: true, maxLength: 255 },
    description: { label: "Description", type: "textarea", icon: FileText, required: true, minLength: 10 },
    genre: { 
      label: "Genre", 
      type: "select", 
      icon: Tag, 
      options: genres, 
      required: true,
      loading: loading && genres.length === 0
    },
    releaseDate: { label: "Release Date", type: "date", icon: Calendar, optional: true },
    categories: { 
      label: "Categories", 
      type: "multiselect", 
      icon: Tag, 
      options: categories, 
      optional: true,
      loading: loading && categories.length === 0
    },
    director: { label: "Director", type: "text", icon: Users, optional: true }
  };

  const allFields = { ...commonFields, ...config.fields };

  // Group fields by importance for mobile accordion
  const importantFields = ['title', 'description', 'genre'];
  const otherFields = Object.keys(allFields).filter(key => !importantFields.includes(key));

  // Get field-specific errors
  const getFieldError = (fieldKey) => {
    return errors.find(error => 
      error.toLowerCase().includes(fieldKey.toLowerCase()) ||
      error.toLowerCase().includes(allFields[fieldKey]?.label.toLowerCase().replace('*', '').trim())
    );
  };

  const renderField = (fieldKey, fieldConfig) => {
    const value = formData[fieldKey] || (fieldConfig.type === 'multiselect' ? [] : '');
    const Icon = fieldConfig.icon;
    const fieldError = getFieldError(fieldKey);
    const hasError = !!fieldError;
    
    const baseClasses = "w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200 text-sm";
    const focusClasses = "focus:ring-2 focus:ring-[#BC8BBC] focus:border-[#BC8BBC]";
    const borderClasses = hasError 
      ? "border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500" 
      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500";

    const fieldProps = {
      value: fieldConfig.type === 'multiselect' ? (Array.isArray(value) ? value : []) : value,
      onChange: (e) => updateFormData({ [fieldKey]: e.target.value }),
      className: clsx(baseClasses, focusClasses, borderClasses, hasError && "pr-10"),
      placeholder: fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase().replace('*', '').trim()}`,
      required: fieldConfig.required,
      disabled: fieldConfig.loading
    };

    if (fieldConfig.type === 'number') {
      fieldProps.min = fieldConfig.min;
      fieldProps.max = fieldConfig.max;
      fieldProps.step = fieldConfig.step;
    }

    if (fieldConfig.type === 'text' && fieldConfig.maxLength) {
      fieldProps.maxLength = fieldConfig.maxLength;
    }

    // Show loading state for select fields
    if (fieldConfig.loading) {
      return (
        <div className="relative">
          <select {...fieldProps} className={clsx(fieldProps.className, "text-gray-400")}>
            <option value="">Loading {fieldConfig.label.toLowerCase()}...</option>
          </select>
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#BC8BBC]"></div>
          </div>
        </div>
      );
    }

    // Show error state for data loading failures
    if (dataError && (fieldKey === 'genre' || fieldKey === 'categories')) {
      return (
        <div className="relative">
          <select {...fieldProps} className={clsx(fieldProps.className, "text-red-400")}>
            <option value="">Failed to load {fieldConfig.label.toLowerCase()}</option>
          </select>
          <div className="absolute right-3 top-2.5 text-red-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      );
    }

    switch (fieldConfig.type) {
      case "textarea":
        return (
          <div className="relative">
            <textarea
              {...fieldProps}
              rows={3}
              className={clsx(fieldProps.className, "resize-none", hasError && "pr-10")}
            />
            {fieldConfig.maxLength && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {value.length}/{fieldConfig.maxLength}
              </div>
            )}
            {hasError && (
              <div className="absolute right-3 top-2.5 text-red-500">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <div className="relative">
            <select {...fieldProps}>
              <option value="">Select {fieldConfig.label.replace('*', '').trim()}</option>
              {fieldConfig.options?.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            {hasError && (
              <div className="absolute right-3 top-2.5 text-red-500 pointer-events-none">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        );

      case "multiselect":
        return (
          <div className="relative">
            <select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => updateFormData({ 
                [fieldKey]: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className={clsx(baseClasses, focusClasses, borderClasses, hasError && "pr-10")}
              size="3"
            >
              {fieldConfig.options?.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            {hasError && (
              <div className="absolute right-3 top-2.5 text-red-500 pointer-events-none">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {value.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {value.length} selected
              </div>
            )}
          </div>
        );

      case "datetime-local":
        return (
          <div className="relative">
            <input {...fieldProps} type="datetime-local" />
            {hasError && (
              <div className="absolute right-3 top-2.5 text-red-500 pointer-events-none">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        );

      case "number":
        return (
          <div className="relative">
            <input {...fieldProps} type="number" />
            {hasError && (
              <div className="absolute right-3 top-2.5 text-red-500 pointer-events-none">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="relative">
            <input {...fieldProps} type="text" />
            {fieldConfig.maxLength && (
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {value.length}/{fieldConfig.maxLength}
              </div>
            )}
            {hasError && (
              <div className="absolute right-3 top-2.5 text-red-500 pointer-events-none">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        );
    }
  };

  const renderFieldItem = ([key, fieldConfig]) => {
    const fieldError = getFieldError(key);
    const hasError = !!fieldError;
    
    return (
      <div key={key} className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium">
          <fieldConfig.icon className={clsx(
            "w-3.5 h-3.5 flex-shrink-0",
            hasError ? "text-red-500" : "text-[#BC8BBC]"
          )} />
          <span className={hasError ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"}>
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
            {fieldConfig.optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
          </span>
        </label>
        {renderField(key, fieldConfig)}
        {fieldError && (
          <p className="text-red-500 text-xs flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{fieldError}</span>
          </p>
        )}
        {fieldConfig.max && !hasError && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum: {fieldConfig.max} minutes
          </p>
        )}
        {fieldConfig.maxLength && !hasError && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formData[key]?.length || 0}/{fieldConfig.maxLength} characters
          </p>
        )}
      </div>
    );
  };

  const renderFieldGroup = (fields, title = null, isExpandable = false) => (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
          {isExpandable && (
            <button
              onClick={() => setExpandedSection(expandedSection === title ? null : title)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ChevronDown className={clsx("w-4 h-4 transition-transform", expandedSection === title && "rotate-180")} />
            </button>
          )}
        </div>
      )}
      
      <div className={clsx("space-y-4", isExpandable && expandedSection !== title && "hidden md:block")}>
        {fields.map(renderFieldItem)}
      </div>
    </div>
  );

  if (!contentType) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Select Content Type First
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
          Please go back and select a content type to continue with basic information setup.
        </p>
      </div>
    );
  }

  // Prepare field groups
  const fieldEntries = Object.entries(allFields);
  const importantFieldEntries = fieldEntries.filter(([key]) => importantFields.includes(key));
  const otherFieldEntries = fieldEntries.filter(([key]) => !importantFields.includes(key));

  // Single source of truth for rendering fields
  const renderFormFields = () => {
    // Use two-column layout only on large screens with enough fields
    if (isLargeScreen && fieldEntries.length > 3) {
      const midPoint = Math.ceil(fieldEntries.length / 2);
      const leftFields = fieldEntries.slice(0, midPoint);
      const rightFields = fieldEntries.slice(midPoint);

      return (
        <div className="grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-4">
            {leftFields.map(renderFieldItem)}
          </div>
          <div className="space-y-4">
            {rightFields.map(renderFieldItem)}
          </div>
        </div>
      );
    }

    // Mobile and tablet layout - single column with expandable sections
    return (
      <div className="space-y-6">
        {/* Always visible important fields */}
        {renderFieldGroup(importantFieldEntries, "Essential Information")}

        {/* Other fields - Expandable on mobile */}
        {otherFieldEntries.length > 0 && (
          <>
            {/* Mobile expandable section */}
            <div className="md:hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
                className={clsx(
                  "w-full flex items-center justify-between p-3 border rounded-lg transition-colors",
                  expandedSection === 'details' 
                    ? "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                )}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Additional Details
                </span>
                <ChevronDown className={clsx(
                  "w-4 h-4 text-gray-500 transition-transform",
                  expandedSection === 'details' && "rotate-180"
                )} />
              </button>
              
              {expandedSection === 'details' && (
                <div className="mt-3 space-y-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  {otherFieldEntries.map(renderFieldItem)}
                </div>
              )}
            </div>

            {/* Desktop layout for other fields */}
            <div className="hidden md:block">
              {renderFieldGroup(otherFieldEntries, "Additional Details")}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header - More Compact */}
      <div className="text-center">
        <div className={clsx(
          "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-all duration-300",
          hasErrors || dataError
            ? "bg-red-500 animate-pulse" 
            : "bg-[#BC8BBC]"
        )}>
          {hasErrors || dataError ? (
            <AlertCircle className="w-5 h-5 text-white" />
          ) : (
            <FileText className="w-5 h-5 text-white" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {config.title}
        </h3>
        <p className={clsx(
          "text-xs",
          hasErrors || dataError ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
        )}>
          {hasErrors || dataError 
            ? "Please fix validation errors to continue" 
            : config.description
          }
        </p>
        
        {/* Data Loading Error */}
        {dataError && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-1.5 text-red-700 dark:text-red-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-medium">Data Loading Error</span>
            </div>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
              {dataError}
            </p>
          </div>
        )}

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

      {/* Content Type Badge */}
      <div className="flex justify-center">
        <div className={clsx(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300",
          hasErrors || dataError
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-[#BC8BBC]/10 text-[#BC8BBC]"
        )}>
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            hasErrors || dataError ? "bg-red-500" : "bg-[#BC8BBC]"
          )}></span>
          {contentType.charAt(0).toUpperCase() + contentType.slice(1).replace('_', ' ')} Content
        </div>
      </div>

      {/* Cast & Crew Notice - Compact */}
      <div className={clsx(
        "border rounded-lg p-3 transition-colors duration-300",
        hasErrors || dataError
          ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      )}>
        <div className="flex items-start space-x-2">
          <Users className={clsx(
            "w-4 h-4 mt-0.5 flex-shrink-0",
            hasErrors || dataError
              ? "text-red-500"
              : "text-blue-500"
          )} />
          <div className="flex-1 min-w-0">
            <p className={clsx(
              "text-xs leading-relaxed",
              hasErrors || dataError
                ? "text-red-700 dark:text-red-300"
                : "text-blue-700 dark:text-blue-300"
            )}>
              <span className="font-semibold">Cast & Crew: </span>
              {hasErrors || dataError
                ? "Complete basic info first"
                : "Will be managed in dedicated section"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields - Single source of truth */}
      {renderFormFields()}

      {/* Help Text - Compact */}
      <div className={clsx(
        "border rounded-lg p-3 transition-colors duration-300",
        hasErrors || dataError
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      )}>
        <div className="flex items-start space-x-2">
          <svg className={clsx(
            "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
            hasErrors || dataError
              ? "text-red-500"
              : "text-green-500"
          )} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className={clsx(
              "text-xs leading-relaxed",
              hasErrors || dataError
                ? "text-red-700 dark:text-red-300"
                : "text-green-700 dark:text-green-300"
            )}>
              <span className="font-semibold">
                {hasErrors || dataError ? 'Required: ' : 'Tip: '}
              </span>
              {hasErrors || dataError 
                ? 'Complete all required fields marked with *'
                : contentType === 'series' 
                ? 'Set seasons & episodes first. Add details in media section.'
                : 'Fill required fields first. Add production details later.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}