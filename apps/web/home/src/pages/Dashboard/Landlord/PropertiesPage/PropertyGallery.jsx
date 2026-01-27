// src/pages/Dashboard/Landlord/pages/components/PropertyGallery.jsx
import React, { useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Maximize2,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

const PropertyGallery = ({ 
  images, 
  selectedIndex, 
  onSelect, 
  onNext, 
  onPrev, 
  onFullscreen,
  onAddImages 
}) => {
  const galleryRef = useRef(null);
  const [imageLoading, setImageLoading] = useState({});

  const scrollGallery = (direction) => {
    if (!galleryRef.current) return;
    
    const scrollAmount = 300;
    const currentScroll = galleryRef.current.scrollLeft;
    galleryRef.current.scrollTo({
      left: currentScroll + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    });
  };

  const handleImageLoad = (index) => {
    setImageLoading(prev => ({ ...prev, [index]: false }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
      {/* Main Image */}
      <div className="relative">
        <div className="h-80 sm:h-96 bg-gradient-to-br from-slate-100 to-slate-200 relative">
          {images.length > 0 ? (
            <>
              <img
                src={images[selectedIndex]?.url}
                alt="Property main view"
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading[selectedIndex] ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => handleImageLoad(selectedIndex)}
                loading="lazy"
              />
              {imageLoading[selectedIndex] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-[#8A5A8A] animate-spin" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="h-20 w-20 mb-4" />
              <p className="text-lg font-medium">No images available</p>
              <button
                onClick={onAddImages}
                className="mt-4 px-4 py-2 text-sm bg-[#8A5A8A] text-white rounded-lg hover:bg-[#7a4a7a] transition-colors"
              >
                Add Images
              </button>
            </div>
          )}
          
          {/* Image Count Badge */}
          {images.length > 0 && (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all hover:scale-110 backdrop-blur-sm"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          
          {/* Fullscreen Button */}
          {images.length > 0 && (
            <button
              onClick={onFullscreen}
              className="absolute top-4 left-4 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-lg transition-all hover:scale-110 backdrop-blur-sm"
            >
              <Maximize2 size={20} />
            </button>
          )}
        </div>
        
        {/* Image Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => onSelect(index)}
                className={`w-3 h-3 rounded-full transition-all ${selectedIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 0 && (
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Gallery</h3>
            <span className="text-sm text-slate-500">{images.length} photos</span>
          </div>
          
          <div className="relative">
            {images.length > 5 && (
              <>
                <button
                  onClick={() => scrollGallery('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white border border-slate-200 text-slate-600 p-1.5 rounded-full shadow-lg z-10 hover:bg-slate-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scrollGallery('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white border border-slate-200 text-slate-600 p-1.5 rounded-full shadow-lg z-10 hover:bg-slate-50"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
            
            <div
              ref={galleryRef}
              className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {images.map((img, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <button
                    onClick={() => onSelect(index)}
                    className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${selectedIndex === index ? 'border-[#8A5A8A] ring-2 ring-[#8A5A8A]/20' : 'border-transparent hover:border-slate-300'}`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                  {img.isCover && (
                    <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-md">
                      Cover
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={onAddImages}
                className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-[#8A5A8A] hover:text-[#8A5A8A] transition-colors group"
              >
                <Plus size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs">Add Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;