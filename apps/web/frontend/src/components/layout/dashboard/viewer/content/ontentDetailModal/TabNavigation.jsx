// src/pages/Dashboards/viewer/content/components/TabNavigation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';

const TabNavigation = ({ activeTab, onTabChange, contentData, similarContent }) => {
  const { t } = useTranslation();
  
  const [visibleTabs, setVisibleTabs] = useState([]);
  const [overflowTabs, setOverflowTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const moreButtonRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Get translated tab labels
  const getTabLabel = (tab) => {
    const tabLabels = {
      'overview': t('contentdetail.tabs.overview', 'Overview'),
      'cast': t('contentdetail.tabs.cast', 'Cast & Crew'),
      'details': t('contentdetail.tabs.details', 'Details'),
      'media': t('contentdetail.tabs.media', 'Media'),
      'seasons': t('contentdetail.tabs.seasons', 'Seasons'),
      'awards': t('contentdetail.tabs.awards', 'Awards'),
      'similar': t('contentdetail.tabs.similar', 'Similar')
    };
    return tabLabels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  // Build tabs array
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
  ].map(tab => ({
    id: tab,
    label: getTabLabel(tab),
    badge: getTabBadge(tab)
  }));

  // Get badge for tab
  function getTabBadge(tab) {
    switch (tab) {
      case 'cast':
        return contentData?.cast_count ? {
          count: contentData.cast_count,
          color: 'bg-[#BC8BBC]'
        } : null;
      case 'media':
        const behindScenesCount = getMediaAssets('behind_scenes').length;
        return behindScenesCount > 0 ? {
          count: behindScenesCount,
          color: 'bg-blue-500'
        } : null;
      case 'awards':
        const awardsCount = getAwards().length;
        return awardsCount > 0 ? {
          count: awardsCount,
          color: 'bg-yellow-500'
        } : null;
      case 'seasons':
        const seasonsCount = getSeasons().length;
        return seasonsCount > 0 ? {
          count: seasonsCount,
          color: 'bg-green-500'
        } : null;
      case 'similar':
        return similarContent.length > 0 ? {
          count: similarContent.length,
          color: 'bg-purple-500'
        } : null;
      default:
        return null;
    }
  }

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 5,
        left: rect.right - 192, // 192px is 48 * 4 (w-48 = 192px)
        width: '192px'
      });
    }
  };

  // Update dropdown position when showMore changes
  useEffect(() => {
    if (showMore) {
      updateDropdownPosition();
      // Re-calculate on window resize when dropdown is open
      window.addEventListener('resize', updateDropdownPosition);
      return () => window.removeEventListener('resize', updateDropdownPosition);
    }
  }, [showMore]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMore &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowMore(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMore]);

  // Measure overflow on resize and when tabs change
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      let usedWidth = 0;
      const newVisible = [];
      const newOverflow = [];

      // Reset to measure all buttons
      tabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(
          `button[data-tab="${tab.id}"]`
        );
        if (!btn) return;
        btn.style.display = 'flex';
      });

      // Calculate visible tabs with space for "More" button
      tabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(
          `button[data-tab="${tab.id}"]`
        );
        if (!btn) return;

        const btnWidth = btn.offsetWidth + 8;
        if (usedWidth + btnWidth < containerWidth - 80) {
          newVisible.push(tab);
          usedWidth += btnWidth;
        } else {
          newOverflow.push(tab);
        }
      });

      // Hide overflowed tabs
      tabs.forEach((tab) => {
        const btn = containerRef.current.querySelector(
          `button[data-tab="${tab.id}"]`
        );
        if (!btn) return;
        const isVisible = newVisible.find((t) => t.id === tab.id);
        btn.style.display = isVisible ? 'flex' : 'none';
      });

      setVisibleTabs(newVisible);
      setOverflowTabs(newOverflow);
    };

    // Use setTimeout to ensure DOM is updated
    setTimeout(handleResize, 0);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tabs, contentData, similarContent]);

  return (
    <div className="border-b border-gray-700/50 mb-8 overflow-hidden relative">
      <div className="flex items-center relative" ref={containerRef}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-4 font-semibold text-lg transition-all duration-200 border-b-2 whitespace-nowrap flex items-center ${
              activeTab === tab.id
                ? 'border-white text-white bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className={`ml-2 text-xs text-white rounded-full px-2 py-1 ${tab.badge.color}`}>
                {tab.badge.count}
              </span>
            )}
          </button>
        ))}

        {overflowTabs.length > 0 && (
          <div className="ml-auto relative" ref={moreButtonRef}>
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 rounded-full hover:bg-gray-800 transition flex items-center gap-1 text-gray-400 hover:text-white"
            >
              <MoreHorizontal size={20} />
              <span>{t('settings.more', 'More')}</span>
            </button>
            
            {/* FIXED POSITION DROPDOWN - Won't shrink inside containers */}
            {showMore && (
              <div
                className="fixed bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50"
                ref={dropdownRef}
                style={dropdownStyle}
              >
                {overflowTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setShowMore(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm transition flex items-center justify-between ${
                      activeTab === tab.id
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`text-xs text-white rounded-full px-2 py-1 ${tab.badge.color}`}>
                        {tab.badge.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabNavigation;