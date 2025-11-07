// src/pages/Dashboards/viewer/content/ContentCard.jsx
import React, { useState, useRef, useCallback, memo } from "react";
import { Film, Clapperboard, Video } from "lucide-react";
import HoverModal from "./HoverModal.jsx";

const ContentCard = memo(({ content, size = "medium", onMoreInfo }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [modalPosition, setModalPosition] = useState({ left: 0, top: 0 });
  const [cardRect, setCardRect] = useState(null);
  const cardRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  console.log('ContentCard rendering:', content?.id);

  // Updated card sizes with proper aspect ratio [2/3] like your custom cards
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
    const modalWidth = viewportWidth < 640 ? 280 : 320;
    const modalHeight = viewportWidth < 640 ? 300 : 340;

    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;
    
    let targetLeft = cardCenterX - modalWidth / 2;
    let targetTop = cardCenterY - modalHeight / 2;

    const margin = 10;
    if (targetLeft < margin) targetLeft = margin;
    if (targetLeft + modalWidth > viewportWidth - margin) {
      targetLeft = viewportWidth - modalWidth - margin;
    }
    if (targetTop < margin) targetTop = margin;
    if (targetTop + modalHeight > viewportHeight - margin) {
      targetTop = viewportHeight - modalHeight - margin;
    }

    return { left: targetLeft, top: targetTop };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }

    hoverTimerRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setCardRect(rect);
        const position = calculateModalPosition(rect);
        setModalPosition(position);
        setIsHovered(true);
      }
    }, 300);
  }, [calculateModalPosition]);

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

  // Memoize the card content to prevent unnecessary re-renders
  const cardContent = React.useMemo(() => {
    return (
      <div className={`relative w-full h-full rounded-lg overflow-hidden bg-gray-800 transition-all duration-300 ${
        isHovered ? 'scale-105 sm:scale-110 z-40 brightness-110' : 'scale-100'
      }`}>
        
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
              className="w-full h-full object-cover transition-all duration-300"
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              key={imageUrl}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 p-2 sm:p-3 md:p-4">
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

        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-all duration-300" />
        )}
      </div>
    );
  }, [
    isHovered, 
    hasImage, 
    imageLoaded, 
    imageUrl, 
    content.title, 
    content.content_type, 
    handleImageLoad, 
    handleImageError, 
    getContentIcon
  ]);

  return (
    <>
      <div
        ref={cardRef}
        className={`relative ${cardSizes[size]} flex-shrink-0 transition-all duration-300 cursor-pointer`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {cardContent}
      </div>

      {isHovered && (
        <div 
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
        >
          <HoverModal
            content={content}
            position={modalPosition}
            cardRect={cardRect}
            onClose={handleCloseModal}
            onPlay={() => console.log('Play content:', content.title)}
            onAddToList={() => console.log('Add to list:', content.title)}
            onMoreInfo={onMoreInfo}
          />
        </div>
      )}
    </>
  );
});

// Add display name for better debugging
ContentCard.displayName = 'ContentCard';

export default ContentCard;