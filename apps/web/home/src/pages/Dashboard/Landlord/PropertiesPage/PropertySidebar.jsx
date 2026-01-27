// src/pages/Dashboard/Landlord/pages/components/PropertySidebar.jsx
import React from 'react';
import { 
  Tag, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  DollarSign, 
  Printer,
  FileText,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Eye as EyeIcon,
  MessageSquare,
  CalendarDays
} from 'lucide-react';

const PropertySidebar = ({ property, onEditProperty }) => {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const stats = [
    { label: 'Property ID', value: property.property_uid?.substring(0, 8) + '...', icon: FileText },
    { label: 'Created', value: new Date(property.created_at).toLocaleDateString(), icon: CalendarIcon },
    { label: 'Last Updated', value: new Date(property.updated_at).toLocaleDateString(), icon: ClockIcon },
    { label: 'Views', value: '0', icon: EyeIcon },
    { label: 'Inquiries', value: '0', icon: MessageSquare },
    { label: 'Bookings', value: '0', icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      {/* Price Card */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Pricing</h3>
          <Tag className="h-5 w-5 text-[#8A5A8A]" />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <span className="text-slate-600">Monthly</span>
              <p className="text-xs text-slate-500">Most popular</p>
            </div>
            <span className="text-xl font-bold text-slate-900">{formatPrice(property.monthly_price)}</span>
          </div>
          
          {property.weekly_price && (
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600">Weekly</span>
              <span className="font-medium text-slate-900">{formatPrice(property.weekly_price)}</span>
            </div>
          )}
          
          {property.daily_price && (
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600">Daily</span>
              <span className="font-medium text-slate-900">{formatPrice(property.daily_price)}</span>
            </div>
          )}
          
          {property.nightly_price && (
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <span className="text-slate-600">Nightly</span>
              <span className="font-medium text-slate-900">{formatPrice(property.nightly_price)}</span>
            </div>
          )}
          
          <div className="pt-4 space-y-3">
            <button
              onClick={onEditProperty}
              className="w-full py-3.5 bg-gradient-to-r from-[#8A5A8A] via-[#9C6A9C] to-[#BC8BBC] text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Edit Property Details
            </button>
            
            <button className="w-full py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all">
              View Booking Requests
            </button>
          </div>
        </div>
      </div>

      {/* Property Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Property Stats</h3>
          <TrendingUp className="h-5 w-5 text-slate-600" />
        </div>
        
        <div className="space-y-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="flex justify-between items-center group">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-slate-200 transition-colors">
                    <Icon size={14} className="text-slate-600" />
                  </div>
                  <span className="text-slate-600">{stat.label}</span>
                </div>
                <span className="font-medium text-slate-900">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
        
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center px-4 py-3.5 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-all group">
            <Calendar className="mr-3 group-hover:scale-110 transition-transform" size={18} />
            Manage Bookings
          </button>
          
          <button className="w-full flex items-center justify-center px-4 py-3.5 bg-emerald-50 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-100 transition-all group">
            <MessageCircle className="mr-3 group-hover:scale-110 transition-transform" size={18} />
            View Messages
          </button>
          
          <button className="w-full flex items-center justify-center px-4 py-3.5 bg-purple-50 text-purple-600 rounded-xl font-semibold hover:bg-purple-100 transition-all group">
            <DollarSign className="mr-3 group-hover:scale-110 transition-transform" size={18} />
            Payment History
          </button>
          
          <button className="w-full flex items-center justify-center px-4 py-3.5 bg-amber-50 text-amber-600 rounded-xl font-semibold hover:bg-amber-100 transition-all group">
            <Printer className="mr-3 group-hover:scale-110 transition-transform" size={18} />
            Print Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertySidebar;