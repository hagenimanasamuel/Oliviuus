// src/pages/Dashboard/Landlord/pages/components/PropertyHeader.jsx
import React from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye, 
  Share2, 
  MoreVertical,
  Heart,
  Image as ImageIcon
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const PropertyHeader = ({ 
  property, 
  isFavorite, 
  onBack, 
  onFavoriteToggle, 
  onViewPublic, 
  onManageImages, 
  onShare, 
  onEdit, 
  onDelete 
}) => {
  const getLocationString = () => {
    if (!property) return '';
    const parts = [];
    if (property.address) parts.push(property.address);
    if (property.sector) parts.push(property.sector);
    if (property.district) parts.push(property.district);
    if (property.province) parts.push(property.province);
    if (property.country) parts.push(property.country);
    return parts.join(', ');
  };

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            >
              <ArrowLeft size={20} className="text-slate-600 group-hover:text-[#8A5A8A]" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-slate-900 truncate max-w-md">{property.title}</h1>
              <p className="text-sm text-slate-500 truncate">{getLocationString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <StatusBadge status={property.status} />
            
            <button
              onClick={onFavoriteToggle}
              className={`p-2 rounded-lg transition-all ${isFavorite ? 'bg-rose-50 text-rose-500' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
            </button>

            <div className="relative group">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical size={20} className="text-slate-600" />
              </button>
              
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 transform transition-all duration-200 scale-0 origin-top-right group-hover:scale-100">
                <button
                  onClick={onViewPublic}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <Eye size={16} />
                  <span>View Public Page</span>
                </button>
                <button
                  onClick={onManageImages}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <ImageIcon size={16} />
                  <span>Manage Images</span>
                </button>
                <button
                  onClick={onShare}
                  className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <Share2 size={16} />
                  <span>Share Property</span>
                </button>
                <div className="border-t border-slate-100 my-2"></div>
                <button
                  onClick={onEdit}
                  className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 flex items-center gap-3"
                >
                  <Edit size={16} />
                  <span>Edit Property</span>
                </button>
                <button
                  onClick={onDelete}
                  className="w-full px-4 py-3 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                >
                  <Trash2 size={16} />
                  <span>Delete Property</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyHeader;