import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw,
  Minimize2,
  Download,
  Share2,
  MapPin
} from 'lucide-react';

export default function ImageGallery({ images, propertyTitle, property }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  // Get full location string
  const getFullLocation = () => {
    if (!property) return '';
    
    const parts = [];
    if (property.province) parts.push(property.province);
    if (property.district) parts.push(property.district);
    if (property.sector) parts.push(property.sector);
    if (property.cell) parts.push(property.cell);
    if (property.village) parts.push(property.village);
    
    return parts.join(', ');
  };

  const location = getFullLocation();

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
    resetView();
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    resetView();
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    
    setTouchStart(null);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const toggleFullscreenMode = () => {
    setIsFullscreenMode(!isFullscreenMode);
  };

  const handleFullscreenOpen = () => {
    setShowFullscreen(true);
    resetView();
    document.body.style.overflow = 'hidden';
  };

  const handleFullscreenClose = () => {
    setShowFullscreen(false);
    setIsFullscreenMode(false);
    document.body.style.overflow = 'auto';
  };

  const downloadImage = async () => {
    try {
      const imageUrl = images[selectedImageIndex].image_url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${propertyTitle.replace(/\s+/g, '_')}_${selectedImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: `Check out this property: ${propertyTitle}`,
          url: images[selectedImageIndex].image_url,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(images[selectedImageIndex].image_url);
      alert('Image URL copied to clipboard!');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showFullscreen) return;
      
      switch (e.key) {
        case 'Escape':
          handleFullscreenClose();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) zoomIn();
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) zoomOut();
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) resetView();
          break;
        case 'r':
        case 'R':
          rotateImage();
          break;
        case 'f':
        case 'F':
          toggleFullscreenMode();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreen, selectedImageIndex]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!images || images.length === 0) {
    return (
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🏠</div>
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    );
  }

  const transformStyle = {
    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
    transition: 'transform 0.2s ease-in-out'
  };

  return (
    <>
      {/* Main Image */}
      <div 
        className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px] rounded-2xl overflow-hidden cursor-pointer group"
        onClick={handleFullscreenOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[selectedImageIndex].image_url}
          alt={`${propertyTitle} - Image ${selectedImageIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100 lg:opacity-100 hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100 lg:opacity-100 hover:scale-110"
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
          <span className="font-medium">{selectedImageIndex + 1}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-300">{images.length}</span>
        </div>

        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenOpen();
            }}
            className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all hover:scale-110"
            title="Fullscreen"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadImage();
            }}
            className="bg-black/70 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition-all hover:scale-110"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        {/* Property Title - Top Left */}
        <div className="absolute top-4 left-4 bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
          {propertyTitle}
        </div>

        {/* Location - Footer Left (Small) */}
        {location && (
          <div className="absolute bottom-4 left-4 bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs truncate max-w-[180px] sm:max-w-[250px] md:max-w-[350px]">
                {location}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => {
                setSelectedImageIndex(index);
                resetView();
              }}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative group ${
                selectedImageIndex === index
                  ? 'border-[#BC8BBC] ring-2 ring-[#BC8BBC]/20'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image.image_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              />
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                selectedImageIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{index + 1}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Enhanced Fullscreen Modal */}
      {showFullscreen && (
        <div className={`fixed inset-0 bg-black z-50 ${isFullscreenMode ? '' : 'p-4'}`}>
          {/* Top Control Bar */}
          <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/80 to-transparent p-4 z-20 transition-all ${
            isFullscreenMode ? 'opacity-0 hover:opacity-100' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleFullscreenClose}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors hover:scale-110"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="flex flex-col">
                  <h3 className="text-white font-medium truncate max-w-md">
                    {propertyTitle} - Image {selectedImageIndex + 1}
                  </h3>
                  {location && (
                    <div className="flex items-center gap-1.5 text-white/80 text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate max-w-md">{location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-white bg-black/50 px-3 py-1.5 rounded-full text-sm">
                  <span className="font-medium">{selectedImageIndex + 1}</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-gray-300">{images.length}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadImage}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors hover:scale-110"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={shareImage}
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors hover:scale-110"
                    title="Share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div className="relative overflow-auto max-w-full max-h-full">
              <div style={transformStyle}>
                <img
                  src={images[selectedImageIndex].image_url}
                  alt={`${propertyTitle} - Fullscreen`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-4 z-20 transition-all ${
            isFullscreenMode ? 'opacity-0 hover:opacity-100' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="text-white hover:bg-white/20 p-3 rounded-full transition-colors disabled:opacity-50 hover:scale-110"
                  title="Zoom Out (Ctrl + -)"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                
                <div className="bg-black/50 text-white px-4 py-2 rounded-full min-w-[80px] text-center">
                  <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
                </div>
                
                <button
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className="text-white hover:bg-white/20 p-3 rounded-full transition-colors disabled:opacity-50 hover:scale-110"
                  title="Zoom In (Ctrl + +)"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                
                <button
                  onClick={rotateImage}
                  className="text-white hover:bg-white/20 p-3 rounded-full transition-colors hover:scale-110"
                  title="Rotate (R)"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
                
                <button
                  onClick={resetView}
                  className="text-white hover:bg-white/20 p-3 rounded-full transition-colors hover:scale-110"
                  title="Reset View (Ctrl + 0)"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreenMode}
                  className="text-white hover:bg-white/20 p-3 rounded-full transition-colors hover:scale-110"
                  title={isFullscreenMode ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                >
                  {isFullscreenMode ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className={`absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all hover:scale-110 ${
                  isFullscreenMode ? 'opacity-0 hover:opacity-100' : ''
                }`}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
              
              <button
                onClick={nextImage}
                className={`absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all hover:scale-110 ${
                  isFullscreenMode ? 'opacity-0 hover:opacity-100' : ''
                }`}
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            </>
          )}

          {/* Thumbnails in Fullscreen */}
          {images.length > 1 && !isFullscreenMode && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <div className="flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-xl">
                {images.map((image, index) => (
                  <button
                    key={image.id || index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      resetView();
                    }}
                    className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-[#BC8BBC] ring-1 ring-[#BC8BBC]'
                        : 'border-transparent hover:border-white/50'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Helper */}
          {!isFullscreenMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                <span className="hidden sm:inline">Use ← → to navigate, +/- to zoom, R to rotate, F for fullscreen</span>
                <span className="sm:hidden">Swipe to navigate, pinch to zoom</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}