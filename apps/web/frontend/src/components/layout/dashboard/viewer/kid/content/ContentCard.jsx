// src/pages/Dashboards/viewer/content/ContentCard.jsx
import React, { useState, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Clapperboard, Video } from "lucide-react";
import HoverModal from "./HoverModal.jsx";

const ContentCard = memo(({ content, size = "medium", onMoreInfo }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [modalPosition, setModalPosition] = useState({ left: 0, top: 0 });
  const [cardRect, setCardRect] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const cardRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  // Updated card sizes with proper aspect ratio [2/3]
  const cardSizes = {
    small: "w-32 aspect-[2/3]",
    medium: "w-40 aspect-[2/3]", 
    large: "w-48 aspect-[2/3]"
  };

  // Memoize image URL calculation
  const imageUrl = React.useMemo(() => {
    if (content.media_assets && content.media_assets.length > 0) {
      const primaryAsset = content.media_assets.find(asset => 
        asset.url && !asset.url.includes('null') && asset.url !== '/api/placeholder/300/450'
      );
      if (primaryAsset?.url) return primaryAsset.url;
    }
    
    if (content.primary_image_url && !content.primary_image_url.includes('null')) {
      return content.primary_image_url;
    }
    
    return null;
  }, [content.media_assets, content.primary_image_url]);

  const hasImage = imageUrl && !imageError;

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const getContentIcon = useCallback(() => {
    if (content.content_type === 'series') {
      return <Clapperboard className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" />;
    }
    return <Film className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" />;
  }, [content.content_type]);

  const calculateModalPosition = useCallback((rect) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Responsive modal size
    let modalWidth, modalHeight;
    
    if (viewportWidth < 640) { // Mobile
      modalWidth = Math.min(280, viewportWidth - 40);
      modalHeight = Math.min(modalWidth * 1.4, viewportHeight * 0.6) + 120;
    } else if (viewportWidth < 768) { // Tablet
      modalWidth = Math.min(300, viewportWidth - 40);
      modalHeight = Math.min(modalWidth * 1.4, viewportHeight * 0.6) + 130;
    } else { // Desktop
      modalWidth = Math.min(320, viewportWidth - 40);
      modalHeight = Math.min(modalWidth * 1.4, viewportHeight * 0.6) + 140;
    }

    // Calculate horizontal position - center aligned with card
    let targetLeft = rect.left + (rect.width / 2) - (modalWidth / 2);
    
    // Calculate vertical position - prefer above, but check available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    
    let targetTop;
    
    // If there's more space above, position above the card
    if (spaceAbove >= modalHeight + 10 || spaceAbove >= spaceBelow) {
      targetTop = rect.top - modalHeight - 10; // 10px gap above card
    } else {
      // Otherwise position below the card
      targetTop = rect.bottom + 10; // 10px gap below card
    }

    // Ensure modal stays within viewport boundaries with proper margins
    const margin = 20;
    
    // Horizontal boundaries - keep modal within viewport
    if (targetLeft < margin) {
      targetLeft = margin;
    } else if (targetLeft + modalWidth > viewportWidth - margin) {
      targetLeft = viewportWidth - modalWidth - margin;
    }
    
    // Vertical boundaries - ensure modal doesn't go off screen
    if (targetTop < margin) {
      targetTop = margin;
    } else if (targetTop + modalHeight > viewportHeight - margin) {
      targetTop = viewportHeight - modalHeight - margin;
    }

    // Final adjustment to ensure modal is properly positioned relative to card
    // If modal is positioned below but would be cut off, try to position above
    if (targetTop === margin && spaceAbove > modalHeight * 0.5) {
      targetTop = rect.top - modalHeight - 10;
    }

    return { 
      left: Math.max(margin, Math.min(targetLeft, viewportWidth - modalWidth - margin)),
      top: Math.max(margin, Math.min(targetTop, viewportHeight - modalHeight - margin)),
      modalWidth,
      modalHeight
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      if (cardRef.current && !redirecting) {
        const rect = cardRef.current.getBoundingClientRect();
        setCardRect(rect);
        const position = calculateModalPosition(rect);
        setModalPosition(position);
        setIsHovered(true);
      }
    }, 300);
  }, [calculateModalPosition, redirecting]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  }, []);

  const handleModalMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
  }, []);

  const handleModalMouseLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 100);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Enhanced click handler with zoom animation
  const handleCardClick = useCallback(() => {
    // Close the hover modal first if it's open
    setIsHovered(false);
    
    // Clear any pending hover timers
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    
    // Start redirect animation
    setRedirecting(true);
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      // Navigate to WatchPage with the content ID
      if (content?.id) {
        navigate(`/watch/${content.id}`);
      }
    }, 500);
  }, [content?.id, navigate]);

  // Memoize the card content to prevent unnecessary re-renders
  const cardContent = React.useMemo(() => {
    return (
      <div 
        className={`relative w-full h-full rounded-lg overflow-hidden bg-gray-800 transition-all duration-300 ${
          redirecting ? 'scale-150 z-50 opacity-0' : 
          isHovered ? 'scale-105 sm:scale-110 z-40 brightness-110' : 'scale-100'
        }`}
        onClick={handleCardClick}
      >
        
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
                <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={content.title}
              className="w-full h-full object-cover transition-all duration-300 cursor-pointer"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              key={imageUrl}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 p-2 sm:p-3 md:p-4 cursor-pointer">
            {getContentIcon()}
            <div className="mt-2 sm:mt-3 text-center">
              <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 mb-1">
                {content.title}
              </h3>
              <p className="text-gray-400 text-xs">
                {content.content_type === 'series' ? 'TV Series' : 'Movie'}
              </p>
            </div>
          </div>
        )}

        {!imageLoaded && hasImage && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
            <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 animate-pulse" />
          </div>
        )}

        {isHovered && !redirecting && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-all duration-300" />
        )}

        {/* Zoom animation overlay */}
        {redirecting && (
          <div className="absolute inset-0 bg-black/30 transition-all duration-500" />
        )}
      </div>
    );
  }, [
    isHovered, 
    redirecting,
    hasImage, 
    imageLoaded, 
    imageUrl, 
    content.title, 
    content.content_type, 
    handleImageLoad, 
    handleImageError, 
    getContentIcon,
    handleCardClick
  ]);

  return (
    <>
      <div
        ref={cardRef}
        className={`relative ${cardSizes[size]} flex-shrink-0 transition-all duration-300 cursor-pointer ${
          redirecting ? 'z-50' : ''
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {cardContent}
      </div>

      {isHovered && !redirecting && (
        <HoverModal
          content={content}
          position={modalPosition}
          cardRect={cardRect}
          onClose={handleCloseModal}
          onMoreInfo={onMoreInfo}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
        />
      )}
    </>
  );
});

// Add display name for better debugging
ContentCard.displayName = 'ContentCard';

export default ContentCard;