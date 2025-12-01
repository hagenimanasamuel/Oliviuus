import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionIndicator = ({ showConnectionMessage, isOnline }) => {
  if (!showConnectionMessage) return null;

  return (
    <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 animate-scale-in ${isOnline
      ? 'bg-green-500/20 border-green-500/30 text-green-400'
      : 'bg-red-500/20 border-red-500/30 text-red-400'
      }`}
    >
      <div className="flex items-center gap-2 font-semibold">
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span>Internet connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span>Internet connection lost</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionIndicator;