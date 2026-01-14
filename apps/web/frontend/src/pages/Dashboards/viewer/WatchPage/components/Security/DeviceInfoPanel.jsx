// WatchPage/components/Security/DeviceInfoPanel.jsx
import React from 'react';
import { 
  X, Smartphone, Cpu, MemoryStick, HardDrive, 
  Globe, MapPin, Wifi, Battery, Shield, Users,
  Clock, Calendar, User, Lock, Verified, AlertTriangle,
  Monitor, Tablet, Tv, GamepadIcon as Gamepad,
  Download, Upload, Database, Network, Zap
} from 'lucide-react';

const DeviceInfoPanel = ({ securityData, deviceInfo, deviceType, onClose }) => {
  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-6 h-6" />;
      case 'tablet': return <Tablet className="w-6 h-6" />;
      case 'smarttv': return <Tv className="w-6 h-6" />;
      case 'console': return <Gamepad className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden animate-slideInRight">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-900 to-black">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-lg">
              {getDeviceIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-white">Security Dashboard</h3>
              <p className="text-xs text-gray-400">Active Session Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Security Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
          securityData.fraudScore > 70 ? 'bg-red-900/50' :
          securityData.fraudScore > 40 ? 'bg-yellow-900/50' : 'bg-green-900/50'
        }`}>
          <Shield className="w-4 h-4" />
          <span className={`text-sm font-medium ${
            securityData.fraudScore > 70 ? 'text-red-300' :
            securityData.fraudScore > 40 ? 'text-yellow-300' : 'text-green-300'
          }`}>
            {securityData.securityLevel?.toUpperCase() || 'SECURE'}
          </span>
          <span className="text-xs text-gray-400">
            Score: {securityData.fraudScore || 0}/100
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {/* Device Info */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Device Information
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Device ID</div>
              <div className="text-sm text-white font-mono truncate">
                {deviceInfo.deviceId?.substring(0, 16)}...
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Type</div>
              <div className="text-sm text-white capitalize">{deviceType}</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Trust Level</div>
              <div className="text-sm text-white">
                {securityData.device?.trustLevel || 'Unknown'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">New Device</div>
              <div className="text-sm text-white">
                {securityData.device?.isNewDevice ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        {securityData.subscription && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Subscription
            </h4>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {securityData.subscription.is_family_plan ? (
                    <Users className="w-5 h-5 text-blue-400" />
                  ) : (
                    <User className="w-5 h-5 text-purple-400" />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      {securityData.subscription.plan_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {securityData.subscription.type} Plan
                    </div>
                  </div>
                </div>
                {securityData.subscription.is_family_shared && (
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                    Family Shared
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {securityData.streams?.currentStreams || 0}
                  </div>
                  <div className="text-xs text-gray-400">Active Streams</div>
                  <div className="text-xs text-gray-500">
                    Max: {securityData.streams?.maxStreams || 3}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {securityData.device?.usageCount || 1}
                  </div>
                  <div className="text-xs text-gray-400">Device Usage</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {securityData.subscription.days_remaining || '∞'}
                  </div>
                  <div className="text-xs text-gray-400">Days Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Location & Network
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-blue-400" />
                <div className="text-xs text-gray-400">Connection</div>
              </div>
              <div className="text-sm text-white">
                {navigator.connection?.effectiveType || 'Unknown'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Network className="w-4 h-4 text-green-400" />
                <div className="text-xs text-gray-400">Status</div>
              </div>
              <div className="text-sm text-white">
                {navigator.onLine ? 'Online' : 'Offline'}
              </div>
            </div>
            {navigator.connection && (
              <>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-purple-400" />
                    <div className="text-xs text-gray-400">Downlink</div>
                  </div>
                  <div className="text-sm text-white">
                    {navigator.connection.downlink || '?'} Mbps
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Upload className="w-4 h-4 text-yellow-400" />
                    <div className="text-xs text-gray-400">RTT</div>
                  </div>
                  <div className="text-sm text-white">
                    {navigator.connection.rtt || '?'} ms
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security Checks */}
        {securityData.validationLog?.steps && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Checks
            </h4>
            <div className="space-y-2">
              {securityData.validationLog.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    step.result?.valid ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm text-white capitalize">
                      {step.step.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {step.result?.valid ? 'Passed' : step.result?.message || 'Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hardware Info */}
        {deviceInfo.fingerprint && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Hardware Profile
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <div className="text-xs text-gray-400">CPU Cores</div>
                </div>
                <div className="text-sm text-white">
                  {deviceInfo.fingerprint.hardwareConcurrency || 'Unknown'}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MemoryStick className="w-4 h-4 text-green-400" />
                  <div className="text-xs text-gray-400">Memory</div>
                </div>
                <div className="text-sm text-white">
                  {deviceInfo.fingerprint.deviceMemory || 'Unknown'} GB
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-purple-400" />
                  <div className="text-xs text-gray-400">Storage</div>
                </div>
                <div className="text-sm text-white">
                  {deviceInfo.fingerprint.localStorage ? 'Available' : 'Unavailable'}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <div className="text-xs text-gray-400">Class</div>
                </div>
                <div className="text-sm text-white capitalize">
                  {deviceInfo.fingerprint.deviceClass || 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>Session ID: {securityData.session?.sessionId?.substring(0, 12)}...</div>
          <div>{new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default DeviceInfoPanel;