// src/pages/Dashboard/Landlord/pages/components/PropertyAnalyticsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Eye, TrendingUp, Calendar, MapPin, Users, Clock, Loader2 } from 'lucide-react';
import api from '../../../../api/axios';

export default function PropertyAnalyticsModal({ isOpen, onClose, property }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    if (isOpen && property) {
      fetchAnalytics();
    }
  }, [isOpen, property, period]);

  const fetchAnalytics = async () => {
    if (!property) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/views/property/${property.property_uid}/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Property Analytics</h3>
            <p className="text-sm text-gray-600">{property?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#8A5A8A] animate-spin" />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Period Selector */}
              <div className="flex gap-2">
                {['7days', '30days', '90days', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      period === p
                        ? 'bg-[#8A5A8A] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p === '7days' ? '7 Days' :
                     p === '30days' ? '30 Days' :
                     p === '90days' ? '90 Days' : 'Year'}
                  </button>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <span className="text-xs text-gray-500">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.total_views}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <span className="text-xs text-gray-500">Unique</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.unique_viewers}</p>
                  <p className="text-xs text-gray-500">visitors</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span className="text-xs text-gray-500">Avg Time</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.avg_time_spent}s</p>
                  <p className="text-xs text-gray-500">per visit</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    <span className="text-xs text-gray-500">Today</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.today_views}</p>
                  <p className="text-xs text-gray-500">views</p>
                </div>
              </div>

              {/* Views Over Time Chart */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-4">Views Over Time</h4>
                <div className="h-48 flex items-end gap-1">
                  {stats.over_time.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div 
                          className="bg-gradient-to-t from-[#BC8BBC] to-[#8A5A8A] rounded-t-lg transition-all group-hover:opacity-80"
                          style={{ 
                            height: `${Math.max(4, (day.views / Math.max(...stats.over_time.map(d => d.views)) * 100))}px`,
                            minHeight: '4px'
                          }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                          {day.views} views
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">Devices</h4>
                  {stats.by_device.map((device, index) => (
                    <div key={index} className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 capitalize">{device.device_type}</span>
                      <span className="text-sm font-medium text-gray-900">{device.count}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">Top Countries</h4>
                  {stats.by_country.map((country, index) => (
                    <div key={index} className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">{country.country || 'Unknown'}</span>
                      <span className="text-sm font-medium text-gray-900">{country.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No analytics data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}