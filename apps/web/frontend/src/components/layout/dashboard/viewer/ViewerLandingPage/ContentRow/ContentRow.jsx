// src/pages/Dashboards/viewer/sections/ContentRow.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from '../../content/ContentCard';

const ContentRow = React.memo(({
  title,
  subtitle,
  items,
  sectionKey,
  icon: Icon,
  showExplore = true,
  onPlay,
  onAddToList,
  onMoreInfo,
  onExploreMore
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const containerRef = useRef(null);
  const cardRefs = useRef({});

  // Memoized scroll handlers
  const handleScrollLeft = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollPos = container.scrollLeft - scrollAmount;
      container.scrollTo({ left: newScrollPos, behavior: 'smooth' });
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollPos = container.scrollLeft + scrollAmount;
      container.scrollTo({ left: newScrollPos, behavior: 'smooth' });
    }
  }, []);

  const handleSectionExplore = useCallback(() => {
    onExploreMore?.(sectionKey);
  }, [sectionKey, onExploreMore]);

  const handleCardHover = useCallback((contentId, isHovering) => {
    setHoveredCard(isHovering ? contentId : null);
  }, []);

  // Enhanced scroll state detection
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const updateScrollState = () => {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
          container.scrollLeft < (container.scrollWidth - container.clientWidth - 10)
        );
      };

      updateScrollState();
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);

      return () => {
        container.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, []);

  // Close hover modal on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const handleScroll = () => {
        setHoveredCard(null);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const hasMoreContent = items.length >= 5;

  return (
    <section className="relative mb-8 sm:mb-12" itemScope itemType="https://schema.org/ItemList">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {Icon && (
            <div className="p-1 sm:p-2 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white" itemProp="name">{title}</h2>
            {subtitle && <p className="text-gray-400 text-xs sm:text-sm mt-1" itemProp="description">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scroll buttons - hidden on mobile, visible on sm and up */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full transition-all ${canScrollLeft
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              className={`p-2 rounded-full transition-all ${canScrollRight
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Explore More Button */}
          {showExplore && hasMoreContent && (
            <button
              onClick={handleSectionExplore}
              className="hidden sm:flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm"
            >
              View All
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* Mobile scroll indicators */}
        <div className="sm:hidden flex justify-center gap-2 mb-3 px-4">
          <div className="text-xs text-gray-500">
            Swipe to browse →
          </div>
        </div>

        {/* Content container with proper hover handling */}
        <div
          ref={containerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 scroll-smooth py-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          itemScope
          itemType="https://schema.org/ItemList"
        >
          {items.map((content, index) => (
            <div 
              key={content.id} 
              className="flex-shrink-0"
              ref={el => cardRefs.current[content.id] = el}
              itemProp="itemListElement" 
              itemScope 
              itemType="https://schema.org/ListItem"
            >
              <meta itemProp="position" content={index + 1} />
              <div className="w-40 sm:w-48 md:w-56">
                <ContentCard
                  content={content}
                  size="medium"
                  onPlay={onPlay}
                  onAddToList={onAddToList}
                  onMoreInfo={onMoreInfo}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

ContentRow.displayName = 'ContentRow';

export default ContentRow;