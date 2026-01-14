// src/pages/Dashboards/kid/KidLandingPage/KidLandingPageContents.jsx
import React, { useRef, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronLeft, Star, BookOpen, GamepadIcon, Sparkles, Check } from "lucide-react";
import ContentCard from "../../../../components/layout/dashboard/viewer/content/ContentCard";

const KidLandingPageContents = ({
  featuredContent = [],
  educationalContent = [],
  funContent = [],
  recentContent = [],
  onPlay,
  onAddToList,
  onMoreInfo,
  redirecting = false
}) => {
  const { t } = useTranslation(); // Initialize translation hook
  
  const sectionRefs = useRef({
    featured: null,
    educational: null,
    fun: null,
    recent: null
  });

  const [showLeftArrow, setShowLeftArrow] = useState({
    featured: false,
    educational: false,
    fun: false,
    recent: false
  });
  const [showRightArrow, setShowRightArrow] = useState({
    featured: true,
    educational: true,
    fun: true,
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

  // Section configurations for kids with translations
  const sections = [
    {
      key: 'featured',
      title: t('kidLanding.sections.featured.title', 'Featured Shows'),
      subtitle: t('kidLanding.sections.featured.subtitle', 'Popular picks for kids'),
      icon: Star,
      content: featuredContent,
      color: 'from-[#BC8BBC] to-[#9A679A]'
    },
    {
      key: 'educational',
      title: t('kidLanding.sections.educational.title', 'Learning Fun'),
      subtitle: t('kidLanding.sections.educational.subtitle', 'Educational and fun content'),
      icon: BookOpen,
      content: educationalContent,
      color: 'from-[#8B9ABC] to-[#677A9A]'
    },
    {
      key: 'fun',
      title: t('kidLanding.sections.fun.title', 'Fun & Games'),
      subtitle: t('kidLanding.sections.fun.subtitle', 'Entertaining adventures'),
      icon: GamepadIcon,
      content: funContent,
      color: 'from-[#BCBC8B] to-[#9A9A67]'
    },
    {
      key: 'recent',
      title: t('kidLanding.sections.recent.title', 'New Arrivals'),
      subtitle: t('kidLanding.sections.recent.subtitle', 'Fresh content just added'),
      icon: Sparkles,
      content: recentContent,
      color: 'from-[#8BBC8B] to-[#679A67]'
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
                    aria-label={t('kidLanding.actions.scrollLeft', { section: section.title }, `Scroll ${section.title} left`)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                
                {/* Right Arrow - Show on mobile when needed, always on desktop */}
                {(showRightArrow[section.key] || window.innerWidth >= 1024) && (
                  <button
                    onClick={() => scrollSection(section.key, 'right')}
                    className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-700 hover:border-gray-600 lg:flex"
                    aria-label={t('kidLanding.actions.scrollRight', { section: section.title }, `Scroll ${section.title} right`)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Container */}
            <div className="relative">
              {/* Scrollable Content */}
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
                    const hasMediaAssets = content.media_assets && Array.isArray(content.media_assets) && content.media_assets.length > 0;
                    const hasPrimaryImage = content.primary_image_url && !content.primary_image_url.includes('null');
                    
                    const enhancedContent = !hasMediaAssets && hasPrimaryImage ? {
                      ...content,
                      media_assets: [{
                        url: content.primary_image_url,
                        asset_type: 'thumbnail',
                        is_primary: true,
                        upload_status: 'completed'
                      }]
                    } : content;

                    return (
                      <div
                        key={content.id}
                        className="flex-shrink-0 w-32 xs:w-36 sm:w-40 md:w-44 lg:w-48 xl:w-52 relative"
                      >
                        {/* Age rating badge */}
                        {content.age_rating && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 border border-[#BC8BBC]/30">
                              <span className="text-xs font-medium text-white">
                                {content.age_rating}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Kid-safe badge for parent-approved content */}
                        {content.parentApproved && (
                          <div className="absolute top-12 right-2 z-10">
                            <div className="flex items-center gap-1 bg-green-800/90 backdrop-blur-sm rounded-full px-2 py-1 border border-green-500/30">
                              <span className="text-xs font-medium text-white flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {t('kidLanding.badges.approved', 'Approved')}
                              </span>
                            </div>
                          </div>
                        )}

                        <ContentCard
                          content={enhancedContent}
                          onMoreInfo={onMoreInfo}
                          size="medium"
                        />
                      </div>
                    );
                  })
                ) : (
                  // Compact empty state
                  <div className="flex flex-col items-center justify-center w-full py-8 lg:py-10 text-center">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                      <section.icon className="w-6 h-6 lg:w-7 lg:h-7 text-gray-500" />
                    </div>
                    <h3 className="text-white text-base lg:text-lg font-semibold mb-1.5">
                      {t('kidLanding.errors.noContent', 'No content available')}
                    </h3>
                    <p className="text-gray-400 text-xs lg:text-sm max-w-xs">
                      {t('kidLanding.errors.checkBackLater', 'Check back later for new additions.')}
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile scroll indicators */}
              <div className="lg:hidden pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-900 to-transparent z-10" />
              <div className="lg:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-900 to-transparent z-10" />
            </div>
          </section>
        ))}
      </div>

      {/* Minimal bottom spacing */}
      <div className="h-4 lg:h-6"></div>

      {/* Global CSS */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default KidLandingPageContents;