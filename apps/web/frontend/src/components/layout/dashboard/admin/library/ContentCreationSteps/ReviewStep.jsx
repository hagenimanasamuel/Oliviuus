import React from "react";
import { 
  CheckCircle, FileText, Calendar, Clock, User, Shield, MapPin, Film, 
  AlertTriangle, Eye, Globe, Download, Share2, Crown, Lock, Info,
  Image, Video, Tv, Tag, Award, Users, Star, Play
} from "lucide-react";
import clsx from "clsx";

const CONTENT_TYPES = [
  { id: 'movie', label: 'Movie', icon: Film },
  { id: 'series', label: 'TV Series', icon: Tv },
  { id: 'documentary', label: 'Documentary', icon: FileText },
  { id: 'short_film', label: 'Short Film', icon: Film },
  { id: 'live_event', label: 'Live Event', icon: Globe }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'fr', label: 'French' },
  { value: 'sw', label: 'Kiswahili' }
];

const LICENSE_TYPES = {
  exclusive: { label: 'Exclusive License', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: Crown },
  'non-exclusive': { label: 'Non-Exclusive License', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Globe },
  limited: { label: 'Limited Time License', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: Clock },
  perpetual: { label: 'Perpetual License', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: Lock }
};

const REGIONS = [
  { value: 'east-africa', label: 'East Africa', countries: ['RW', 'KE', 'TZ', 'UG', 'BI'] },
  { value: 'west-africa', label: 'West Africa', countries: ['NG', 'GH', 'CI', 'SN'] },
  { value: 'southern-africa', label: 'Southern Africa', countries: ['ZA', 'ZM', 'ZW', 'MW'] },
  { value: 'central-africa', label: 'Central Africa', countries: ['CD', 'CG', 'CM', 'GA'] },
  { value: 'north-africa', label: 'North Africa', countries: ['EG', 'MA', 'TN', 'DZ'] },
  { value: 'europe', label: 'Europe', countries: ['All EU'] },
  { value: 'north-america', label: 'North America', countries: ['US', 'CA'] },
  { value: 'asia', label: 'Asia', countries: ['All Asia'] },
  { value: 'global', label: 'Global', countries: ['Worldwide'] }
];

export default function ReviewStep({ formData, categories, genres }) {
  const getContentTypeLabel = (typeId) => {
    return CONTENT_TYPES.find(t => t.id === typeId)?.label || 'Not set';
  };

  const getRegionLabels = (regionValues) => {
    return regionValues?.map(value => 
      REGIONS.find(r => r.value === value)?.label || value
    ).join(', ') || 'Not set';
  };

  const getCategoryNames = (categoryIds) => {
    return categoryIds?.map(id => 
      categories?.find(c => c.id === id)?.name || id
    ).join(', ') || 'Not set';
  };

  const getGenreName = (genreId) => {
    return genres?.find(g => g.id === genreId)?.name || 'Not set';
  };

  const getLanguageLabel = (langCode) => {
    return LANGUAGES.find(l => l.value === langCode)?.label || langCode;
  };

  const calculateLicenseDuration = () => {
    if (formData.licenseType === 'perpetual') return 'Lifetime';
    if (!formData.startDate || !formData.endDate) return 'Not set';
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  };

  // FIXED: More comprehensive required fields check
  const getMissingRequiredFields = () => {
    const missing = [];
    if (!formData.contentType) missing.push('Content Type');
    if (!formData.title) missing.push('Title');
    if (!formData.description) missing.push('Description');
    if (!formData.genre) missing.push('Genre');
    if (!formData.ageRating) missing.push('Age Rating');
    if (!formData.primaryLanguage) missing.push('Primary Language');
    if (!formData.licenseType) missing.push('License Type');
    if (!formData.thumbnail) missing.push('Thumbnail');
    
    // FIXED: Different media requirements based on content type
    if (formData.contentType === 'live_event') {
      if (!formData.poster) missing.push('Poster');
    } else {
      if (!formData.mainVideo) missing.push('Main Video');
      if (!formData.poster) missing.push('Poster');
    }
    
    // FIXED: Series-specific requirements
    if (formData.contentType === 'series') {
      if (!formData.totalSeasons) missing.push('Total Seasons');
      if (!formData.episodesPerSeason) missing.push('Episodes per Season');
    }
    
    return missing;
  };

  const missingFields = getMissingRequiredFields();
  const isReadyToPublish = missingFields.length === 0;

  const InfoRow = ({ label, value, icon: Icon, status = 'default' }) => (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        status === 'warning' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
        status === 'error' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {status === 'warning' && (
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          )}
          {status === 'error' && (
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
        </div>
        <p className={clsx(
          "text-sm mt-1",
          status === 'warning' ? "text-orange-700 dark:text-orange-300" :
          status === 'error' ? "text-red-700 dark:text-red-300" :
          "text-gray-900 dark:text-white"
        )}>
          {value || 'Not set'}
        </p>
      </div>
    </div>
  );

  const Section = ({ title, icon: Icon, children, status = 'default' }) => (
    <div className={clsx(
      "rounded-xl border-2 p-5 transition-all duration-200",
      status === 'complete' ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10" :
      status === 'warning' ? "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10" :
      status === 'error' ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10" :
      "border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30"
    )}>
      <div className="flex items-center space-x-3 mb-4">
        <div className={clsx(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          status === 'complete' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
          status === 'warning' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
          status === 'error' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
          "bg-[#BC8BBC]/10 text-[#BC8BBC]"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
          {status === 'complete' && (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-xs mt-1">
              <CheckCircle className="w-3 h-3" />
              <span>Complete</span>
            </div>
          )}
          {status === 'warning' && (
            <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 text-xs mt-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Needs attention</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-xs mt-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Incomplete</span>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  // FIXED: Enhanced media status with content-type awareness
  const MediaStatus = ({ field, label, icon: Icon, required = true }) => {
    const hasFile = formData[field];
    const isRequired = required;
    
    return (
      <div className="text-center group">
        <div className={clsx(
          "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300",
          "group-hover:scale-110 group-hover:shadow-lg",
          hasFile 
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
            : isRequired
            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
        )}>
          {hasFile ? (
            <CheckCircle className="w-7 h-7" />
          ) : (
            <Icon className="w-7 h-7" />
          )}
        </div>
        <p className={clsx(
          "text-xs font-medium mt-2 transition-colors duration-300",
          hasFile 
            ? "text-green-700 dark:text-green-300" 
            : isRequired
            ? "text-red-700 dark:text-red-300"
            : "text-gray-500 dark:text-gray-400"
        )}>
          {label}
        </p>
        {!hasFile && isRequired && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
            Required
          </p>
        )}
        {!hasFile && !isRequired && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Optional
          </p>
        )}
      </div>
    );
  };

  // FIXED: More comprehensive section status calculation
  const getSectionStatus = (section) => {
    const sectionMissingFields = {
      content: ['contentType', 'title', 'description', 'genre'],
      media: ['thumbnail', 'poster'].concat(formData.contentType !== 'live_event' ? ['mainVideo'] : []),
      classification: ['ageRating', 'primaryLanguage'],
      rights: ['licenseType']
    };

    const hasMissingFields = sectionMissingFields[section]?.some(field => 
      !formData[field] || (Array.isArray(formData[field]) && formData[field].length === 0)
    );

    return hasMissingFields ? 'error' : 'complete';
  };

  // FIXED: Get series-specific information
  const getSeriesInfo = () => {
    if (formData.contentType !== 'series') return null;
    
    return {
      seasons: formData.totalSeasons || 0,
      episodes: formData.episodesPerSeason || 0,
      episodeDuration: formData.episodeDuration || 0
    };
  };

  const seriesInfo = getSeriesInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Review & Publish
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Final review of your content before publishing. Ensure all information is accurate and complete.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border-2 border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {4 - missingFields.length}/4
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Sections Complete</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border-2 border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {Object.values(formData).filter(val => val && (!Array.isArray(val) || val.length > 0)).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Fields Filled</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border-2 border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {formData.regions?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Regions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border-2 border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {missingFields.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Required Missing</div>
        </div>
      </div>

      {/* Content Details */}
      <Section 
        title="Content Details" 
        icon={FileText}
        status={getSectionStatus('content')}
      >
        <InfoRow label="Content Type" value={getContentTypeLabel(formData.contentType)} icon={Film} />
        <InfoRow label="Title" value={formData.title} icon={FileText} />
        <InfoRow label="Description" value={formData.description} icon={FileText} />
        <InfoRow label="Genre" value={getGenreName(formData.genre)} icon={Tag} />
        <InfoRow label="Categories" value={getCategoryNames(formData.categories)} icon={Award} />
        
        {/* FIXED: Series-specific information */}
        {seriesInfo && (
          <>
            <InfoRow label="Total Seasons" value={seriesInfo.seasons} icon={Tv} />
            <InfoRow label="Episodes per Season" value={seriesInfo.episodes} icon={Play} />
            <InfoRow label="Episode Duration" value={seriesInfo.episodeDuration ? `${seriesInfo.episodeDuration} minutes` : 'Not set'} icon={Clock} />
          </>
        )}
        
        <InfoRow label="Duration" value={formData.duration ? `${formData.duration} minutes` : 'Not set'} icon={Clock} />
        <InfoRow label="Release Date" value={formData.releaseDate} icon={Calendar} />
        <InfoRow label="Director" value={formData.director} icon={User} />
        
        {/* FIXED: Live event specific fields */}
        {formData.contentType === 'live_event' && (
          <>
            <InfoRow label="Event Date" value={formData.eventDate} icon={Calendar} />
            <InfoRow label="Event Location" value={formData.eventLocation} icon={MapPin} />
            <InfoRow label="Expected Audience" value={formData.expectedAudience ? `${formData.expectedAudience} people` : 'Not set'} icon={Users} />
          </>
        )}
      </Section>

      {/* Media Assets */}
      <Section 
        title="Media Assets" 
        icon={Image}
        status={getSectionStatus('media')}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-4">
          <MediaStatus field="thumbnail" label="Thumbnail" icon={Image} required={true} />
          <MediaStatus field="poster" label="Poster" icon={Image} required={true} />
          <MediaStatus field="trailer" label="Trailer" icon={Video} required={false} />
          {/* FIXED: Different main media requirement for live events */}
          <MediaStatus 
            field="mainVideo" 
            label={formData.contentType === 'live_event' ? 'Event Video' : 'Main Video'} 
            icon={formData.contentType === 'live_event' ? Play : Film} 
            required={formData.contentType !== 'live_event'} 
          />
        </div>
        
        {/* FIXED: Enhanced media requirement messages */}
        {formData.contentType !== 'live_event' && !formData.mainVideo && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Main video file is required for {getContentTypeLabel(formData.contentType)} content</span>
            </div>
          </div>
        )}
        
        {formData.contentType === 'live_event' && !formData.poster && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Poster image is required for live event content</span>
            </div>
          </div>
        )}
      </Section>

      {/* Classification */}
      <Section 
        title="Content Classification" 
        icon={Shield}
        status={getSectionStatus('classification')}
      >
        <InfoRow label="Age Rating" value={formData.ageRating} icon={Shield} />
        <InfoRow label="Primary Language" value={getLanguageLabel(formData.primaryLanguage)} icon={Globe} />
        <div className="flex items-start space-x-3 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Warnings</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.contentWarnings?.length > 0 ? (
                formData.contentWarnings.map(warning => (
                  <span key={warning} className="inline-flex items-center px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                    {warning}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">No content warnings selected</span>
              )}
            </div>
          </div>
        </div>
        <InfoRow label="Available Subtitles" value={formData.subtitles?.map(getLanguageLabel).join(', ') || 'None'} icon={Users} />
      </Section>

      {/* Rights & Distribution */}
      <Section 
        title="Rights & Distribution" 
        icon={Globe}
        status={getSectionStatus('rights')}
      >
        {formData.licenseType && (
          <div className="flex items-center space-x-2 mb-4">
            <div className={clsx("px-3 py-1 rounded-full text-sm font-medium", LICENSE_TYPES[formData.licenseType]?.color)}>
              {LICENSE_TYPES[formData.licenseType]?.label}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {calculateLicenseDuration()}
            </div>
          </div>
        )}
        <InfoRow label="License Type" value={LICENSE_TYPES[formData.licenseType]?.label || 'Not set'} icon={Lock} />
        <InfoRow label="Available Regions" value={getRegionLabels(formData.regions)} icon={MapPin} />
        <InfoRow label="License Period" value={
          formData.startDate && formData.endDate 
            ? `${formData.startDate} to ${formData.endDate}`
            : 'Not set'
        } icon={Calendar} />
        
        <div className="flex items-start space-x-3 py-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usage Rights</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className={clsx(
                "p-3 rounded-lg border text-center transition-all duration-200",
                formData.exclusive
                  ? "border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20"
                  : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50"
              )}>
                <Crown className={clsx("w-5 h-5 mx-auto mb-1", formData.exclusive ? "text-purple-600 dark:text-purple-400" : "text-gray-400")} />
                <div className="text-sm font-medium">{formData.exclusive ? 'Exclusive' : 'Non-Exclusive'}</div>
              </div>
              <div className={clsx(
                "p-3 rounded-lg border text-center transition-all duration-200",
                formData.downloadable
                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                  : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50"
              )}>
                <Download className={clsx("w-5 h-5 mx-auto mb-1", formData.downloadable ? "text-green-600 dark:text-green-400" : "text-gray-400")} />
                <div className="text-sm font-medium">{formData.downloadable ? 'Downloadable' : 'No Downloads'}</div>
              </div>
              <div className={clsx(
                "p-3 rounded-lg border text-center transition-all duration-200",
                formData.shareable
                  ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                  : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50"
              )}>
                <Share2 className={clsx("w-5 h-5 mx-auto mb-1", formData.shareable ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
                <div className="text-sm font-medium">{formData.shareable ? 'Shareable' : 'No Sharing'}</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Publishing Status */}
      <div className={clsx(
        "rounded-xl border-2 p-6 transition-all duration-300",
        isReadyToPublish
          ? "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10"
          : "border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10"
      )}>
        <div className="flex items-center space-x-4">
          <div className={clsx(
            "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
            isReadyToPublish
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          )}>
            {isReadyToPublish ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1">
            <h4 className={clsx(
              "text-xl font-bold mb-2",
              isReadyToPublish
                ? "text-green-800 dark:text-green-300"
                : "text-orange-800 dark:text-orange-300"
            )}>
              {isReadyToPublish ? 'Ready to Publish!' : 'Action Required'}
            </h4>
            <p className={clsx(
              "text-lg",
              isReadyToPublish
                ? "text-green-700 dark:text-green-400"
                : "text-orange-700 dark:text-orange-400"
            )}>
              {isReadyToPublish 
                ? 'All required fields are complete. Your content is ready for publishing.'
                : `Please complete ${missingFields.length} required field(s) before publishing.`
              }
            </p>
            {missingFields.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
                  Missing required fields:
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map(field => (
                    <span key={field} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Final Checklist */}
      <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 border border-[#BC8BBC]/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-[#BC8BBC] text-white p-2 rounded-lg">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-lg font-semibold text-[#BC8BBC]">Final Checklist</h5>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review these points before publishing</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Content meets Rwandan age rating guidelines</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Appropriate content warnings are set</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Kinyarwanda language support included</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">License terms are properly configured</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">Distribution regions are correctly set</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">All media files meet quality standards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}