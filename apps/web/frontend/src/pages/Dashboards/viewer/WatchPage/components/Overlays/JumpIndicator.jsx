import React from 'react';
import { FastForward, Rewind } from 'lucide-react';

const JumpIndicator = ({ jumpIndicator, consecutiveSkips }) => {
  if (!jumpIndicator.show) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
      <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 transform animate-scale-in">
        <div className="flex items-center gap-3 text-white text-xl font-bold">
          {jumpIndicator.direction === 'forward' ? (
            <FastForward className="w-8 h-8 text-green-400" />
          ) : (
            <Rewind className="w-8 h-8 text-yellow-400" />
          )}
          <span>{jumpIndicator.time}s</span>
          {consecutiveSkips > 1 && (
            <span className="text-sm text-gray-300 ml-2">(x{consecutiveSkips})</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JumpIndicator;