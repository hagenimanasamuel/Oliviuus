import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const SubscriptionCard = ({
  plan,
  onSelect,
  loading,
  isSelected,
  currencySymbol,
  calculatedPrice,
  isMobile
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Generate features based on plan data - using subscriptionPage namespace
  const generateFeatures = () => {
    const features = [];

    // Device feature
    features.push(
      t('subscriptionPage.watchOn', 'Watch on {count} {devices} simultaneously')
        .replace('{count}', plan.deviceLimit)
        .replace('{devices}', plan.deviceLimit === 1
          ? t('subscriptionPage.device', 'device')
          : t('subscriptionPage.devices', 'devices'))
    );

    // Quality feature
    features.push(
      `${t(`subscriptionPage.quality.${plan.video_quality}`, plan.video_quality)} ${t('subscriptionPage.videoQuality', 'video quality')}`
    );

    // Download features
    if (plan.offline_downloads) {
      if (plan.max_downloads === -1) {
        features.push(t('subscriptionPage.unlimitedDownloads', 'Unlimited downloads for offline viewing'));
      } else if (plan.max_downloads > 0) {
        features.push(
          t('subscriptionPage.downloadLimit', 'Download {count} items for offline viewing')
            .replace('{count}', plan.max_downloads)
        );
      }
      if (plan.simultaneous_downloads > 1) {
        features.push(
          t('subscriptionPage.simultaneousDownloads', '{count} simultaneous downloads')
            .replace('{count}', plan.simultaneous_downloads)
        );
      }
      if (plan.download_expiry_days > 0) {
        features.push(
          t('subscriptionPage.downloadExpiry', 'Downloads expire after {days} days')
            .replace('{days}', plan.download_expiry_days)
        );
      }
    } else {
      features.push(t('subscriptionPage.noDownloads', 'No downloads available'));
    }

    // Additional features
    if (plan.hdr_support) {
      features.push(t('subscriptionPage.hdrSupport', 'HDR support for enhanced visuals'));
    }

    features.push(t('subscriptionPage.adFree', 'Ad-free streaming experience'));
    features.push(t('subscriptionPage.fullLibrary', 'Access to entire content library'));
    features.push(t('subscriptionPage.prioritySupport', 'Priority customer support'));

    if (plan.parental_controls) {
      features.push(t('subscriptionPage.parentalControls', 'Parental controls for family safety'));
    }

    return features;
  };

  const features = generateFeatures();
  const maxFeatures = isMobile ? 6 : 8;
  const visibleFeatures = features.slice(0, maxFeatures);
  const hasMoreFeatures = features.length > maxFeatures;
  const remainingFeatures = features.length - maxFeatures;

  // 🆕 Enhanced plan selection handler
  const handlePlanSelect = async () => {
    try {
      // Just call onSelect - the navigation happens in SubscriptionPage
      await onSelect(plan.id);
    } catch (error) {
      console.error('Plan selection failed:', error);
      // Error handling is already done in onSelect
    }
  };

  return (
    <div
      className={`relative bg-gradient-to-br ${plan.gradient} p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${plan.popular ? 'border-[#BC8BBC] ring-1 sm:ring-2 ring-[#BC8BBC] ring-opacity-50' : 'border-transparent'
        } ${isSelected ? 'ring-2 sm:ring-4 ring-[#BC8BBC] ring-opacity-70' : ''} ${isMobile ? 'h-[580px]' : 'h-[640px] lg:h-[680px]'
        }`}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-[#BC8BBC] text-white px-3 py-1 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
            {t('subscriptionPage.mostPopular', 'MOST POPULAR')}
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-white mb-1 sm:mb-2 leading-tight">
          {t(`subscriptionPage.plans.${plan.type}.title`, plan.type)}
        </h2>
        <p className="text-[#BC8BBC] text-xs sm:text-sm font-semibold mb-2 sm:mb-3 line-clamp-1">
          {t(`subscriptionPage.plans.${plan.type}.tagline`, 'Premium streaming experience')}
        </p>
        <p className="text-gray-300 text-xs mb-3 sm:mb-4 leading-relaxed line-clamp-2">
          {t(`subscriptionPage.plans.${plan.type}.description`, 'Enjoy premium streaming with this plan.')}
        </p>

        {/* Price Display */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-baseline justify-center space-x-1 sm:space-x-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              {currencySymbol}{calculatedPrice.toLocaleString()}
            </span>
            <span className="text-gray-400 text-xs sm:text-sm">
              {t('subscriptionPage.perMonth', '/month')}
            </span>
          </div>
        </div>

        {/* Device & Quality Badges */}
        <div className="flex justify-center space-x-2 mb-3 sm:mb-4">
          <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            {plan.deviceLimit} {plan.deviceLimit === 1
              ? t('subscriptionPage.device', 'Device')
              : t('subscriptionPage.devices', 'Devices')}
          </span>
          <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            {t(`subscriptionPage.quality.${plan.video_quality}`, plan.video_quality)}
          </span>
        </div>
      </div>

      {/* Features List - Fixed height with scroll if needed */}
      <div className="flex-1 mb-4 sm:mb-6 min-h-0"> {/* min-h-0 allows flex child to shrink */}
        <div className="h-full flex flex-col">
          <ul className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto"> {/* flex-1 + overflow for scroll */}
            {visibleFeatures.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#BC8BBC] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span className="text-gray-300 text-xs sm:text-sm leading-tight flex-1">
                  {feature}
                </span>
              </li>
            ))}

            {/* Add empty space if fewer features */}
            {visibleFeatures.length < maxFeatures && (
              Array.from({ length: maxFeatures - visibleFeatures.length }).map((_, index) => (
                <li key={`empty-${index}`} className="flex items-start space-x-2 sm:space-x-3 opacity-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0 mt-0.5">
                    {/* Invisible placeholder */}
                  </div>
                  <span className="text-gray-300 text-xs sm:text-sm leading-tight flex-1">
                    {/* Empty text for spacing */}
                  </span>
                </li>
              ))
            )}
          </ul>

          {/* More features indicator */}
          {hasMoreFeatures && (
            <div className="pt-2 border-t border-gray-600 mt-2">
              <p className="text-[#BC8BBC] text-xs font-semibold text-center">
                +{remainingFeatures} {t('subscriptionPage.moreFeatures', 'more features')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Fixed at bottom */}
      <div className="mt-auto"> {/* mt-auto pushes this to bottom */}
        {/* Ideal For */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <p className="text-gray-400 text-xs text-center">
            <span className="font-semibold text-[#BC8BBC]">
              {t('subscriptionPage.perfectFor', 'Perfect for')}:
            </span> {t(`subscriptionPage.plans.${plan.type}.idealFor`, 'All types of users')}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePlanSelect}
          disabled={loading}
          className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 ${plan.popular
              ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#9b69b2] hover:to-purple-500 text-white shadow-lg'
              : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
            } ${isSelected ? 'ring-2 sm:ring-4 ring-[#BC8BBC] ring-opacity-50' : ''
            } disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm sm:text-base">
                {t('subscriptionPage.processing', 'Processing...')}
              </span>
            </div>
          ) : (
            t('subscriptionPage.getPlan', 'Get {{plan}}', { plan: t(`subscriptionPage.plans.${plan.type}.title`, plan.type) })
          )}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCard;