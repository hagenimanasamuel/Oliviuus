// src/pages/Dashboards/viewer/ViewerLandingPage/LandingPageContents.jsx
import React, { useRef, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronLeft, Sparkles, TrendingUp, Clock as ClockIcon } from "lucide-react";
import ContentCard from "../content/ContentCard";

const LandingPageContents = ({
  featuredContent = [],
  trendingContent = [],
  recentContent = [],
  onPlay,
  onAddToList,
  onMoreInfo,
  redirecting = false
}) => {
  const { t } = useTranslation();
  
  const sectionRefs = useRef({
    popular: null,
    trending: null,
    recent: null
  });

  const [showLeftArrow, setShowLeftArrow] = useState({
    popular: false,
    trending: false,
    recent: false
  });
  const [showRightArrow, setShowRightArrow] = useState({
    popular: true,
    trending: true,
    recent: true
  });

  // Check scroll position to show/hide arrows
  const checkScrollPosition = useCallback((sectionKey) => {
    const container = sectionRefs.current[sectionKey];
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(prev => ({ ...prev, [sectionKey]: scrollLeft > 0 }));
      setShowRightArrow(prev => ({ ...prev, [sectionKey]: scrollLeft < scrollWidth - clientWidth - 10 }));
    }
  }, []);

  const scrollSection = useCallback((sectionKey, direction) => {
    const container = sectionRefs.current[sectionKey];
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const newScrollPos = direction === 'right'
        ? container.scrollLeft + scrollAmount
        : container.scrollLeft - scrollAmount;

      container.scrollTo({
        left: newScrollPos,
        behavior: 'smooth'
      });

      // Check position after scroll
      setTimeout(() => checkScrollPosition(sectionKey), 300);
    }
  }, [checkScrollPosition]);

  // Add scroll event listeners
  useEffect(() => {
    const handleScroll = (sectionKey) => {
      checkScrollPosition(sectionKey);
    };

    // Add scroll listeners to each section
    sections.forEach(section => {
      const container = sectionRefs.current[section.key];
      if (container) {
        const scrollHandler = () => handleScroll(section.key);
        container.addEventListener('scroll', scrollHandler);
        return () => container.removeEventListener('scroll', scrollHandler);
      }
    });
  }, [checkScrollPosition]);

  // Section configurations with translations
  const sections = [
    {
      key: 'popular',
      title: t('sections.popularInRwanda', 'Popular in Rwanda'),
      subtitle: t('sections.popularInRwandaSubtitle', 'Top picks loved by Rwandan viewers'),
      icon: Sparkles,
      content: featuredContent,
      color: 'from-purple-500 to-pink-500'
    },
    {
      key: 'trending',
      title: t('sections.trendingNow', 'Trending Now'),
      subtitle: t('sections.trendingNowSubtitle', 'What everyone is watching'),
      icon: TrendingUp,
      content: trendingContent,
      color: 'from-orange-500 to-red-500'
    },
    {
      key: 'recent',
      title: t('sections.newReleases', 'New Releases'),
      subtitle: t('sections.newReleasesSubtitle', 'Fresh content just added'),
      icon: ClockIcon,
      content: recentContent,
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  // Content Card Skeleton for loading states
  const ContentCardSkeleton = () => (
    <div className="w-32 h-48 xs:w-36 xs:h-54 sm:w-40 sm:h-60 md:w-44 md:h-66 lg:w-48 lg:h-72 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600"></div>
    </div>
  );

  // Section Skeleton
  const SectionSkeleton = () => (
    <section className="mb-8 lg:mb-10">
      <div className="flex items-center justify-between mb-4 lg:mb-5 px-3 sm:px-4 lg:px-6">
        <div>
          <div className="h-6 lg:h-7 bg-gray-700 rounded w-40 lg:w-56 mb-1.5 animate-pulse"></div>
          <div className="h-3 lg:h-4 bg-gray-700 rounded w-32 lg:w-44 animate-pulse"></div>
        </div>
        <div className="flex gap-1">
          <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
      <div className="flex gap-3 lg:gap-3 overflow-x-auto px-3 sm:px-4 lg:px-6 py-1 no-scrollbar">
        {[...Array(8)].map((_, index) => (
          <ContentCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );

  if (redirecting) {
    return (
      <div className="bg-gray-900 transition-all duration-500 opacity-50">
        <div className="space-y-8 lg:space-y-10 py-8 lg:py-10">
          {sections.map((section) => (
            <SectionSkeleton key={section.key} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900">
      {/* Reduced vertical spacing */}
      <div className="space-y-8 lg:space-y-10 py-8 lg:py-10">
        {sections.map((section) => (
          <section key={section.key} className="mb-8 lg:mb-10 relative">
            {/* Section Header - Compact */}
            <div className="flex items-end justify-between mb-4 lg:mb-5 px-3 sm:px-4 lg:px-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 lg:gap-3 mb-1.5">
                  <div className={`p-1.5 lg:p-2 bg-gradient-to-r ${section.color} rounded-lg shadow-lg`}>
                    <section.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-white truncate">
                      {section.title}
                    </h2>
                    <p className="text-gray-400 text-xs lg:text-sm mt-0.5 truncate">
                      {section.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows - Always visible on desktop, conditional on mobile */}
              <div className="flex items-center gap-1 ml-4">
                {/* Left Arrow - Show on mobile when needed, always on desktop */}
                {(showLeftArrow[section.key] || window.innerWidth >= 1024) && (
                  <button
                    onClick={() => scrollSection(section.key, 'left')}
                    className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-gray-600 lg:flex"
                    aria-label={`Scroll ${section.title} left`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                
                {/* Right Arrow - Show on mobile when needed, always on desktop */}
                {(showRightArrow[section.key] || window.innerWidth >= 1024) && (
                  <button
                    onClick={() => scrollSection(section.key, 'right')}
                    className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-gray-600 lg:flex"
                    aria-label={`Scroll ${section.title} right`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Container - Better spacing on mobile */}
            <div className="relative">
              {/* Scrollable Content - Increased gap on mobile for better touch */}
              <div
                ref={(el) => (sectionRefs.current[section.key] = el)}
                className="flex gap-3 lg:gap-3 overflow-x-auto px-3 sm:px-4 lg:px-6 py-1 no-scrollbar scroll-smooth"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {section.content.length > 0 ? (
                  section.content.map((content) => {
                    // CRITICAL FIX: Ensure content has the structure HoverModal expects
                    // Check if content has media_assets for hover modal
                    const hasMediaAssets = content.media_assets && Array.isArray(content.media_assets) && content.media_assets.length > 0;
                    const hasPrimaryImage = content.primary_image_url && !content.primary_image_url.includes('null');
                    
                    // If content is missing media_assets but has primary_image_url, create a media_assets array
                    const enhancedContent = !hasMediaAssets && hasPrimaryImage ? {
                      ...content,
                      media_assets: [{
                        url: content.primary_image_url,
                        asset_type: 'thumbnail',
                        is_primary: true,
                        upload_status: 'completed'
                      }]
                    } : content;

                    // Add trending data to content object for hover modal
                    const contentWithTrending = section.key === 'trending' ? {
                      ...enhancedContent,
                      trending_score: content.trending_score,
                      trending_rank: content.trending_rank
                    } : enhancedContent;

                    return (
                      <div
                        key={content.id}
                        // Responsive card sizes with better mobile spacing
                        className="flex-shrink-0 w-32 xs:w-36 sm:w-40 md:w-44 lg:w-48 xl:w-52 relative"
                      >
                        {/* Add trending rank badge for trending section - OUTSIDE ContentCard */}
                        {section.key === 'trending' && content.trending_rank && content.trending_rank <= 3 && (
                          <div className="absolute -top-2 -left-2 z-20 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg border-2 border-white/20 trending-badge">
                            <span className="text-white text-xs font-bold">#{content.trending_rank}</span>
                          </div>
                        )}
                        
                        {/* Add trending score indicator - OUTSIDE ContentCard */}
                        {section.key === 'trending' && content.trending_score && content.trending_score > 0.3 && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 border border-orange-500/30">
                              <TrendingUp className="w-3 h-3 text-orange-400" />
                              <span className="text-xs font-medium text-white">
                                {Math.round(content.trending_score * 100)}%
                              </span>
                            </div>
                          </div>
                        )}

                        <ContentCard
                          content={contentWithTrending}  // Pass the enhanced content with media_assets
                          onMoreInfo={onMoreInfo}
                          size="medium"
                        />
                      </div>
                    );
                  })
                ) : (
                  // Compact empty state with translation
                  <div className="flex flex-col items-center justify-center w-full py-8 lg:py-10 text-center">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                      <section.icon className="w-6 h-6 lg:w-7 lg:h-7 text-gray-500" />
                    </div>
                    <h3 className="text-white text-base lg:text-lg font-semibold mb-1.5">
                      {t('errors.noContent', 'No content available')}
                    </h3>
                    <p className="text-gray-400 text-xs lg:text-sm max-w-xs">
                      {t('errors.checkBackLater', 'Check back later for new additions.')}
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile scroll indicators - subtle gradient overlays */}
              <div className="lg:hidden pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900 to-transparent z-10" />
              <div className="lg:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent z-10" />
            </div>
            
            {/* Add trending section footer with simplified text */}
            {section.key === 'trending' && trendingContent.length > 0 && (
              <div className="mt-2 px-3 sm:px-4 lg:px-6">
                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>{t('newPopular.tabs.trending', 'Top 3 Trending')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-300"></div>
                      <span>{t('common.highScore', 'High Score (>30%)')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Minimal bottom spacing */}
      <div className="h-4 lg:h-6"></div>

      {/* Global CSS to hide scrollbars across all browsers */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Animation for trending badges */
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(249, 115, 22, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(249, 115, 22, 0.8);
          }
        }
        
        .trending-badge {
          animation: pulse-glow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPageContents;