import React from "react";
import { useTranslation } from "react-i18next";

const PlanComparison = ({ plans, currencySymbol, calculatePrice }) => {
  const { t } = useTranslation();

  // Enhanced formatter that properly replaces placeholders
  const getFeatureValue = (plan, featureKey, featureType = "text") => {
    const value = plan[featureKey];
    
    if (featureType === 'boolean') {
      return Boolean(value);
    }
    
    // Handle specific feature formatting with proper placeholder replacement
    switch (featureKey) {
      case "deviceLimit":
        const devicesText = value === 1 ? 
          t('subscriptionPage.device', 'Device') : 
          t('subscriptionPage.devices', 'Devices');
        return t('subscriptionPage.comparison.devices', '{count} {devices}')
          .replace('{count}', value)
          .replace('{devices}', devicesText);
      
      case "video_quality":
        return t(`subscriptionPage.quality.${value}`, value);
      
      case "max_downloads":
        if (value === -1) return t('subscriptionPage.comparison.unlimited', 'Unlimited');
        if (value === 0 || !value) return t('subscriptionPage.comparison.notAvailable', 'Not Available');
        return t('subscriptionPage.comparison.downloadItems', '{count} items')
          .replace('{count}', value);
      
      case "download_quality":
        if (!value || value === 'undefined') return t('subscriptionPage.comparison.notAvailable', 'Not Available');
        return t(`subscriptionPage.quality.${value}`, value);
      
      case "supported_platforms":
        if (!value) return t('subscriptionPage.comparison.allPlatforms', 'All platforms');
        try {
          const platforms = JSON.parse(value);
          if (platforms.length <= 2) return platforms.join(', ');
          return t('subscriptionPage.comparison.platformsCount', '{count} platforms')
            .replace('{count}', platforms.length);
        } catch {
          return t('subscriptionPage.comparison.allPlatforms', 'All platforms');
        }
      
      case "max_devices_registered":
        if (!value) return t('subscriptionPage.comparison.notAvailable', 'Not Available');
        return t('subscriptionPage.comparison.registeredDevices', '{count} devices')
          .replace('{count}', value);
      
      case "simultaneous_downloads":
        if (!value) return t('subscriptionPage.comparison.notAvailable', 'Not Available');
        return t('subscriptionPage.comparison.downloadsAtOnce', '{count} at once')
          .replace('{count}', value);
      
      case "download_expiry_days":
        if (!value || value === 0) return t('subscriptionPage.comparison.neverExpires', 'Never expires');
        return t('subscriptionPage.comparison.expiryDays', '{days} days')
          .replace('{days}', value);
      
      case "max_video_bitrate":
        if (!value) return t('subscriptionPage.comparison.notAvailable', 'Not Available');
        const bitrateValue = value >= 1000 ? (value / 1000).toFixed(0) : value;
        const bitrateTranslation = value >= 1000 ? 
          t('subscriptionPage.comparison.mbps', '{value} Mbps') : 
          t('subscriptionPage.comparison.kbps', '{value} kbps');
        return bitrateTranslation.replace('{value}', bitrateValue);
      
      default:
        return value || t('subscriptionPage.comparison.notAvailable', 'Not Available');
    }
  };

  // Features configuration - reduced for mobile
  const mobileFeatures = [
    { 
      name: t('subscriptionPage.comparison.simultaneousStreams', 'Streams'), 
      key: "deviceLimit", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.videoQuality', 'Quality'), 
      key: "video_quality", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.offlineDownloads', 'Downloads'), 
      key: "offline_downloads", 
      type: "boolean" 
    },
    { 
      name: t('subscriptionPage.comparison.downloadLimit', 'Download Limit'), 
      key: "max_downloads", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.hdrSupport', 'HDR'), 
      key: "hdr_support", 
      type: "boolean" 
    },
    { 
      name: t('subscriptionPage.comparison.parentalControls', 'Parental'), 
      key: "parental_controls", 
      type: "boolean" 
    }
  ];

  const desktopFeatures = [
    { 
      name: t('subscriptionPage.comparison.simultaneousStreams', 'Simultaneous Streams'), 
      key: "deviceLimit", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.videoQuality', 'Video Quality'), 
      key: "video_quality", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.offlineDownloads', 'Offline Downloads'), 
      key: "offline_downloads", 
      type: "boolean" 
    },
    { 
      name: t('subscriptionPage.comparison.downloadLimit', 'Download Limit'), 
      key: "max_downloads", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.downloadQuality', 'Download Quality'), 
      key: "download_quality", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.hdrSupport', 'HDR Support'), 
      key: "hdr_support", 
      type: "boolean" 
    },
    { 
      name: t('subscriptionPage.comparison.parentalControls', 'Parental Controls'), 
      key: "parental_controls", 
      type: "boolean" 
    },
    { 
      name: t('subscriptionPage.comparison.supportedPlatforms', 'Supported Platforms'), 
      key: "supported_platforms", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.maxRegisteredDevices', 'Max Registered Devices'), 
      key: "max_devices_registered", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.simultaneousDownloads', 'Simultaneous Downloads'), 
      key: "simultaneous_downloads", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.downloadExpiry', 'Download Expiry'), 
      key: "download_expiry_days", 
      type: "text"
    },
    { 
      name: t('subscriptionPage.comparison.videoBitrate', 'Video Bitrate'), 
      key: "max_video_bitrate", 
      type: "text"
    }
  ];

  return (
    <div className="mt-8 sm:mt-12 lg:mt-16 w-full max-w-6xl px-2 sm:px-4">
      <div className="text-center mb-6 sm:mb-8 lg:mb-10">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">
          {t('subscriptionPage.comparePlans', 'Compare Plans')}
        </h2>
        <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
          {t('subscriptionPage.compareSubtitle', 'Find the perfect plan for your entertainment needs')}
        </p>
      </div>
      
      {/* Mobile Cards View - Horizontal Scroll */}
      <div className="block lg:hidden">
        <div className="overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex space-x-4 min-w-max">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg w-64 flex-shrink-0"
              >
                <div className={`p-4 border-b ${plan.popular ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600' : 'bg-gray-900'} border-gray-700 rounded-t-xl`}>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg mb-1">
                      {t(`subscriptionPage.plans.${plan.type}.title`, plan.type)}
                    </h3>
                    {plan.popular && (
                      <span className="text-xs text-white bg-black bg-opacity-20 px-2 py-1 rounded-full mb-2 inline-block">
                        {t('subscriptionPage.mostPopular', 'MOST POPULAR')}
                      </span>
                    )}
                    <div className="text-white font-bold text-xl">
                      {currencySymbol}{calculatePrice(plan.price).toLocaleString()}
                      <span className="text-white text-opacity-80 text-sm font-normal ml-1">
                        {t('subscriptionPage.perMonth', '/month')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    {mobileFeatures.map((feature) => {
                      const value = getFeatureValue(plan, feature.key, feature.type);
                      return (
                        <div key={feature.key} className="flex justify-between items-center py-1">
                          <span className="text-gray-300 text-xs font-medium flex-1 pr-2 truncate">
                            {feature.name}
                          </span>
                          <div className="flex-shrink-0">
                            {feature.type === 'boolean' ? (
                              value ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </div>
                              )
                            ) : (
                              <span className="text-white text-xs font-medium bg-gray-700 px-2 py-1 rounded text-center min-w-[60px] block truncate">
                                {value}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* View More Features Indicator */}
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <p className="text-[#BC8BBC] text-xs text-center">
                      +{desktopFeatures.length - mobileFeatures.length} more features
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="flex justify-center mt-4 space-x-1">
          {plans.map((_, index) => (
            <div 
              key={index} 
              className="w-2 h-2 bg-gray-600 rounded-full"
            ></div>
          ))}
        </div>
        
        {/* Mobile Instructions */}
        <p className="text-gray-400 text-xs text-center mt-3">
          ← Scroll horizontally to compare all plans →
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="text-left p-4 sm:p-6 text-gray-300 font-semibold text-base sm:text-lg">
                  {t('subscriptionPage.comparison.features', 'Features')}
                </th>
                {plans.map(plan => (
                  <th key={plan.id} className="p-4 sm:p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-white font-bold text-lg sm:text-xl mb-2">
                        {t(`subscriptionPage.plans.${plan.type}.title`, plan.type)}
                      </span>
                      <span className="text-[#BC8BBC] font-bold text-xl sm:text-2xl">
                        {currencySymbol}{calculatePrice(plan.price).toLocaleString()}
                        <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1">
                          {t('subscriptionPage.perMonth', '/month')}
                        </span>
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {desktopFeatures.map((feature, index) => (
                <tr 
                  key={feature.name} 
                  className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} transition-colors hover:bg-gray-700`}
                >
                  <td className="p-4 sm:p-6 text-gray-300 font-medium text-sm sm:text-base border-r border-gray-700">
                    {feature.name}
                  </td>
                  {plans.map(plan => {
                    const value = getFeatureValue(plan, feature.key, feature.type);
                    return (
                      <td key={`${plan.id}-${feature.key}`} className="p-4 sm:p-6 text-center">
                        {feature.type === 'boolean' ? (
                          value ? (
                            <div className="flex justify-center">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="text-white font-medium text-sm sm:text-base bg-gray-700 px-3 py-2 rounded-lg inline-block min-w-[100px]">
                            {value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlanComparison;