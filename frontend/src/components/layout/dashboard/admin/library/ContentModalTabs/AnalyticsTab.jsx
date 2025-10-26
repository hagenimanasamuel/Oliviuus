import React, { useState } from "react";
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Monitor,
  Calendar,
  Download,
  Filter
} from "lucide-react";

const AnalyticsTab = ({ content }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('views');

  // Mock analytics data - replace with real data from your API
  const analyticsData = {
    overview: {
      totalViews: 12543,
      uniqueViewers: 8421,
      avgWatchTime: '12:34',
      completionRate: 68
    },
    metrics: {
      views: [120, 190, 300, 500, 200, 300, 450],
      engagement: [45, 52, 38, 65, 72, 58, 68],
      revenue: [120, 190, 300, 500, 200, 300, 450]
    },
    demographics: [
      { country: 'United States', viewers: 3245, percentage: 38.5 },
      { country: 'United Kingdom', viewers: 1842, percentage: 21.8 },
      { country: 'Canada', viewers: 942, percentage: 11.2 },
      { country: 'Australia', viewers: 756, percentage: 9.0 },
      { country: 'Germany', viewers: 543, percentage: 6.4 }
    ],
    devices: [
      { device: 'Desktop', percentage: 45 },
      { device: 'Mobile', percentage: 38 },
      { device: 'Tablet', percentage: 12 },
      { device: 'TV', percentage: 5 }
    ],
    hourly: [
      { hour: '00:00', views: 45 },
      { hour: '04:00', views: 32 },
      { hour: '08:00', views: 156 },
      { hour: '12:00', views: 289 },
      { hour: '16:00', views: 342 },
      { hour: '20:00', views: 421 }
    ]
  };

  const metrics = [
    { id: 'views', label: 'Views', value: analyticsData.overview.totalViews, icon: Eye, color: 'text-blue-400' },
    { id: 'viewers', label: 'Unique Viewers', value: analyticsData.overview.uniqueViewers, icon: Users, color: 'text-green-400' },
    { id: 'watchtime', label: 'Avg Watch Time', value: analyticsData.overview.avgWatchTime, icon: Clock, color: 'text-purple-400' },
    { id: 'completion', label: 'Completion Rate', value: `${analyticsData.overview.completionRate}%`, icon: TrendingUp, color: 'text-yellow-400' }
  ];

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const SimpleBarChart = ({ data, color = '#BC8BBC' }) => {
    const maxValue = Math.max(...data);
    
    return (
      <div className="flex items-end justify-between h-32 gap-1 pt-4">
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full rounded-t transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(value / maxValue) * 80}%`,
                backgroundColor: color,
                minHeight: '2px'
              }}
            />
            <div className="text-gray-400 text-xs mt-1">{index}</div>
          </div>
        ))}
      </div>
    );
  };

  const DemographicRow = ({ country, viewers, percentage, maxPercentage }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 flex-1">
        <MapPin className="w-4 h-4 text-gray-400" />
        <span className="text-white text-sm flex-1">{country}</span>
      </div>
      <div className="flex items-center gap-3 w-48">
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-[#BC8BBC] h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-right text-white text-sm w-16">
          {viewers.toLocaleString()}
        </div>
        <div className="text-gray-400 text-sm w-12">
          {percentage}%
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-white text-xl font-semibold">Content Analytics</h2>
          <p className="text-gray-400">Performance metrics and viewer insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range.value
                    ? 'bg-[#BC8BBC] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-gray-400 text-sm">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Metric Chart */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">View Trends</h3>
            <div className="flex items-center gap-2">
              {['views', 'engagement', 'revenue'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-3 py-1 text-sm rounded capitalize ${
                    activeMetric === metric
                      ? 'bg-[#BC8BBC] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <SimpleBarChart data={analyticsData.metrics[activeMetric]} />
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Viewer Locations</h3>
            <MapPin className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            {analyticsData.demographics.map((demo, index) => (
              <DemographicRow
                key={index}
                {...demo}
                maxPercentage={Math.max(...analyticsData.demographics.map(d => d.percentage))}
              />
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6">Device Usage</h3>
          <div className="space-y-4">
            {analyticsData.devices.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <span className="text-white text-sm">{device.device}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-[#BC8BBC] h-2 rounded-full" 
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-sm w-8">{device.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-6">Peak Viewing Times</h3>
          <SimpleBarChart 
            data={analyticsData.hourly.map(h => h.views)} 
            color="#4F46E5" 
          />
          <div className="flex justify-between text-gray-400 text-xs mt-2">
            {analyticsData.hourly.map((hour, index) => (
              <span key={index}>{hour.hour}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">24%</div>
            <div className="text-gray-400 text-sm">Above Platform Average</div>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">3.2x</div>
            <div className="text-gray-400 text-sm">Social Shares</div>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">42%</div>
            <div className="text-gray-400 text-sm">Return Viewers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;