import React from 'react';
import { Wifi, Cloud, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const CDNIndicator = ({ currentCDN, networkSpeed, quality, cdnStatus, isSwitchingQuality }) => {
  const getSpeedColor = (speed) => {
    if (speed > 20) return 'text-green-400';
    if (speed > 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-400', icon: CheckCircle, label: 'Optimal' };
      case 'optimizing':
        return { color: 'text-blue-400', icon: Clock, label: 'Optimizing' };
      case 'degraded':
        return { color: 'text-yellow-400', icon: AlertCircle, label: 'Degraded' };
      default:
        return { color: 'text-gray-400', icon: Cloud, label: 'Unknown' };
    }
  };

  const getCDNName = (cdn) => {
    const names = {
      'cloudflare': 'Cloudflare CDN',
      'aws-cloudfront': 'AWS CloudFront', 
      'origin': 'Origin Server'
    };
    return names[cdn] || cdn;
  };

  const statusConfig = getStatusConfig(cdnStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 text-white text-xs">
          {/* CDN Status */}
          <div className="flex items-center gap-1.5">
            <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
            <span className="font-medium">{getCDNName(currentCDN)}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${statusConfig.color} bg-white/10`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="w-px h-3 bg-white/20"></div>

          {/* Network Speed */}
          <div className="flex items-center gap-1.5">
            <Wifi className={`w-3 h-3 ${getSpeedColor(networkSpeed)}`} />
            <span className={getSpeedColor(networkSpeed)}>
              {networkSpeed > 0 ? `${networkSpeed} Mbps` : 'Measuring...'}
            </span>
          </div>

          <div className="w-px h-3 bg-white/20"></div>

          {/* Quality */}
          <div className="flex items-center gap-1.5">
            <Zap className={`w-3 h-3 ${isSwitchingQuality ? 'text-yellow-400 animate-pulse' : 'text-purple-400'}`} />
            <span className={isSwitchingQuality ? 'text-yellow-400 animate-pulse' : 'text-purple-300'}>
              {isSwitchingQuality ? 'Switching...' : quality}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDNIndicator;