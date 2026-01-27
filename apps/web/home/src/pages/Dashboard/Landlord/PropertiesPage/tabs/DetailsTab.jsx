// src/pages/Dashboard/Landlord/pages/components/tabs/DetailsTab.jsx - FIXED IMPORTS
import React from 'react';
import { 
  Bed, 
  Bath, 
  Sofa, 
  Coffee, 
  UtensilsCrossed,
  DoorOpen,
  Package,
  Layers,
  Lamp,
  Armchair,
  Table as TableIcon,
  VenetianMask,
  Warehouse,
  LampFloor,
  Square as Mirror
} from 'lucide-react';

const DetailsTab = ({ rooms = [], equipment = [] }) => {
  // Helper function to get room icon
  const getRoomIcon = (roomType) => {
    if (!roomType) return Layers;
    
    const type = roomType.toLowerCase();
    switch (type) {
      case 'bedroom': return Bed;
      case 'bathroom': return Bath;
      case 'living_room': return Sofa;
      case 'kitchen': return Coffee;
      case 'dining_room': return UtensilsCrossed;
      case 'balcony': return DoorOpen;
      case 'storage': return Package;
      case 'other': return Layers;
      default: return Layers;
    }
  };

  // Helper function to get equipment icon
  const getEquipmentIcon = (type) => {
    if (!type) return Layers;
    
    const equipmentType = type.toLowerCase();
    switch (equipmentType) {
      case 'beds': return Bed;
      case 'chairs': return Armchair;
      case 'tables': return TableIcon;
      case 'sofas': return Sofa;
      case 'wardrobes': return Warehouse;
      case 'shelves': return Warehouse;
      case 'lamps': return LampFloor;
      case 'mattresses': return Bed;
      case 'curtains': return VenetianMask;
      case 'mirrors': return Mirror;
      default: return Layers;
    }
  };

  // Format room type for display
  const formatRoomType = (roomType) => {
    if (!roomType) return 'Unknown';
    return roomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format equipment type for display
  const formatEquipmentType = (type) => {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-8">
      {/* Room Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Room Breakdown</h3>
        {rooms.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {rooms
              .filter(room => room && room.count > 0)
              .map((room, index) => {
                const Icon = getRoomIcon(room.type || room.roomType);
                const roomCount = room.count || 0;
                const roomType = room.type || room.roomType || 'other';
                
                return (
                  <div key={index} className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200 hover:border-[#8A5A8A]/30 transition-colors group">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#8A5A8A]/10 to-[#BC8BBC]/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5 text-[#8A5A8A]" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {formatRoomType(roomType)}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{roomCount}</div>
                    {room.description && (
                      <p className="text-xs text-slate-500 mt-2 truncate">{room.description}</p>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <Layers className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No room information available</p>
          </div>
        )}
      </div>

      {/* Equipment */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Furniture & Equipment</h3>
        {equipment.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {equipment
              .filter(item => item && item.count > 0)
              .map((item, index) => {
                const Icon = getEquipmentIcon(item.type || item.equipmentType);
                const itemCount = item.count || 0;
                const itemType = item.type || item.equipmentType || 'other';
                
                return (
                  <div key={index} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-[#8A5A8A]/30 transition-colors">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-700 block">
                          {formatEquipmentType(itemType)}
                        </span>
                        <span className="text-xs text-slate-500">Count: {itemCount}</span>
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{item.description}</p>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No equipment information available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsTab;