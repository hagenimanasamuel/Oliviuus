// src/pages/Dashboards/viewer/content/components/TabNavigation.jsx
import React from 'react';

const TabNavigation = ({ activeTab, onTabChange, contentData, similarContent }) => {
  const getSeasons = () => {
    return contentData?.seasons || [];
  };

  const getAwards = () => {
    return contentData?.awards || [];
  };

  const getMediaAssets = (type) => {
    if (!contentData?.media_assets) return [];
    return contentData.media_assets.filter(asset => asset.asset_type === type);
  };

  const tabs = [
    'overview',
    'cast',
    'details',
    'media',
    // Always show seasons tab for series content type (even if no seasons yet)
    ...(contentData?.content_type === 'series' ? ['seasons'] : []),
    ...(getAwards().length > 0 ? ['awards'] : []),
    // Always show similar tab regardless of similar content
    'similar'
  ];

  return (
    <div className="flex border-b border-gray-700/50 mb-8 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-6 py-4 font-semibold text-lg transition-all duration-200 border-b-2 whitespace-nowrap ${
            activeTab === tab
              ? 'border-white text-white bg-white/5'
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
          {tab === 'cast' && contentData?.cast_count && (
            <span className="ml-2 text-xs bg-[#BC8BBC] text-white rounded-full px-2 py-1">
              {contentData.cast_count}
            </span>
          )}
          {tab === 'media' && getMediaAssets('behind_scenes').length > 0 && (
            <span className="ml-2 text-xs bg-blue-500 text-white rounded-full px-2 py-1">
              {getMediaAssets('behind_scenes').length}
            </span>
          )}
          {tab === 'awards' && getAwards().length > 0 && (
            <span className="ml-2 text-xs bg-yellow-500 text-white rounded-full px-2 py-1">
              {getAwards().length}
            </span>
          )}
          {tab === 'seasons' && getSeasons().length > 0 && (
            <span className="ml-2 text-xs bg-green-500 text-white rounded-full px-2 py-1">
              {getSeasons().length}
            </span>
          )}
          {tab === 'similar' && similarContent.length > 0 && (
            <span className="ml-2 text-xs bg-purple-500 text-white rounded-full px-2 py-1">
              {similarContent.length}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;