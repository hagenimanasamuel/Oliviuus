// src/pages/Dashboard/Landlord/pages/components/modals/FullscreenImageModal.jsx
import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const FullscreenImageModal = ({ 
  isOpen, 
  onClose, 
  images, 
  selectedIndex, 
  onSelect, 
  onNext, 
  onPrev 
}) => {
  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
        >
          <X size={24} />
        </button>
        
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors backdrop-blur-sm"
        >
          <ChevronLeft size={28} />
        </button>
        
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors backdrop-blur-sm"
        >
          <ChevronRight size={28} />
        </button>
        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-3 h-3 rounded-full transition-all ${selectedIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
        
        <img
          src={images[selectedIndex]?.url}
          alt={`Fullscreen view ${selectedIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
        
        <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
          <p className="text-sm">
            {selectedIndex + 1} / {images.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullscreenImageModal;