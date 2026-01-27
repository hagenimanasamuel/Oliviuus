// src/pages/Dashboard/Landlord/pages/components/modals/ImageManagementModal.jsx
import React, { useRef } from 'react';
import { X, Plus, Star, Trash2, Maximize2 } from 'lucide-react';

const ImageManagementModal = ({ isOpen, onClose, images, propertyTitle }) => {
  const modalRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Manage Images</h3>
            <p className="text-sm text-slate-600">Upload, reorder, or delete property images</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-[#8A5A8A] transition-colors">
                  <img
                    src={img.url}
                    alt={`Property image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end p-3">
                  <div className="flex space-x-2">
                    <button 
                      className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors"
                      title="Set as cover"
                    >
                      <Star size={16} className={img.isCover ? 'text-amber-500 fill-current' : 'text-slate-600'} />
                    </button>
                    <button 
                      className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-slate-600" />
                    </button>
                    <button 
                      className="p-2 bg-white rounded-lg hover:bg-slate-50 transition-colors"
                      title="View fullscreen"
                    >
                      <Maximize2 size={16} className="text-slate-600" />
                    </button>
                  </div>
                </div>
                {img.isCover && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-lg shadow-lg">
                    Cover
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md">
                  {index + 1}
                </div>
              </div>
            ))}
            <button className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-[#8A5A8A] hover:text-[#8A5A8A] transition-colors group">
              <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Image</span>
              <span className="text-xs mt-1">Max 10 images</span>
            </button>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {images.length} of 10 images uploaded
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2.5 bg-gradient-to-r from-[#8A5A8A] to-[#BC8BBC] text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageManagementModal;