// WatchPage/components/Security/SecurityStatusBadge.jsx
import React from 'react';
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldOff, 
  Cpu, Smartphone, Users, Globe, Clock,
  Battery, Wifi, Zap, Lock, Verified, AlertTriangle
} from 'lucide-react';

const SecurityStatusBadge = ({ 
  securityData, 
  showSecurityPanel, 
  setShowSecurityPanel,
  deviceType 
}) => {
  if (!securityData) return null;

  const getSecurityIcon = () => {
    const level = securityData.securityLevel;
    const fraudScore = securityData.fraudScore;
    
    if (fraudScore > 70) return <ShieldAlert className="w-5 h-5 text-red-500" />;
    if (fraudScore > 40) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    
    switch (level) {
      case 'enterprise': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'strict': return <Shield className="w-5 h-5 text-blue-500" />;
      case 'enhanced': return <Shield className="w-5 h-5 text-purple-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSecurityText = () => {
    const level = securityData.securityLevel;
    const fraudScore = securityData.fraudScore;
    
    if (fraudScore > 70) return 'High Risk';
    if (fraudScore > 40) return 'Medium Risk';
    
    switch (level) {
      case 'enterprise': return 'Enterprise Security';
      case 'strict': return 'Strict Security';
      case 'enhanced': return 'Enhanced Security';
      default: return 'Basic Security';
    }
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Smartphone className="w-4 h-4" />;
      case 'smarttv': return <Tv className="w-4 h-4" />;
      case 'console': return <Cpu className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="absolute top-4 left-4 z-50">
      <button
        onClick={() => setShowSecurityPanel(!showSecurityPanel)}
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
          securityData.fraudScore > 70 
            ? 'bg-red-900/30 border-red-700/50 hover:bg-red-800/40' 
            : securityData.fraudScore > 40
            ? 'bg-yellow-900/30 border-yellow-700/50 hover:bg-yellow-800/40'
            : 'bg-green-900/30 border-green-700/50 hover:bg-green-800/40'
        }`}
        title="View Security Details"
      >
        <div className="flex items-center gap-2">
          {getSecurityIcon()}
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-semibold ${
                securityData.fraudScore > 70 ? 'text-red-300' :
                securityData.fraudScore > 40 ? 'text-yellow-300' : 'text-green-300'
              }`}>
                {getSecurityText()}
              </span>
              {securityData.is_family_shared && (
                <Users className="w-3 h-3 text-blue-300" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-300">
              {getDeviceIcon()}
              <span className="capitalize">{deviceType}</span>
              {securityData.streams && (
                <span className="flex items-center gap-0.5">
                  <span className="mx-1">•</span>
                  <span>{securityData.streams.currentStreams}/{securityData.streams.maxStreams} streams</span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-1 ml-2">
          {securityData.device?.trustLevel === 'high' && (
            <Verified className="w-3 h-3 text-green-400" />
          )}
          {securityData.subscription?.is_family_plan && (
            <Users className="w-3 h-3 text-blue-400" />
          )}
          {securityData.kid?.is_kid_mode && (
            <Lock className="w-3 h-3 text-pink-400" />
          )}
        </div>
        
        {/* Hover Indicator */}
        <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className={`w-2 h-2 rounded-full ${
            showSecurityPanel ? 'bg-white' : 'bg-gray-300'
          }`} />
        </div>
      </button>
      
      {/* Connection Status */}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <div className={`w-2 h-2 rounded-full ${
          navigator.onLine ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
        
        {navigator.connection && (
          <>
            <span className="mx-1">•</span>
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              {navigator.connection.effectiveType}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityStatusBadge;