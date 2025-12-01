import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  Monitor, 
  Zap, 
  PictureInPicture, 
  Volume2, 
  Sun, 
  Contrast, 
  Palette,
  Moon,
  RotateCcw,
  ChevronDown,
  Check
} from 'lucide-react';

const SettingsPanel = ({ 
  playbackRate, 
  quality, 
  onPlaybackRateChange, 
  onQualityChange, 
  onClose,
  videoRef,
  onTogglePip,
  onToggleSleepTimer,
  onVolumeBoost,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange
}) => {
  const [activeTab, setActiveTab] = useState(null);
  const [volumeBoost, setVolumeBoost] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [audioPreset, setAudioPreset] = useState('default');
  const settingsRef = useRef(null);

  const settingsTabs = [
    {
      id: 'speed',
      label: 'Playback Speed',
      icon: <Gauge className="w-4 h-4" />,
      options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    },
    {
      id: 'quality',
      label: 'Quality',
      icon: <Monitor className="w-4 h-4" />,
      options: ['Auto'] // Only Auto remains
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <Zap className="w-4 h-4" />,
      options: ['pip', 'sleeptimer'] // Removed screenshot and casting
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: <Volume2 className="w-4 h-4" />,
      options: ['volumeBoost', 'audioPresets']
    },
    {
      id: 'video',
      label: 'Video',
      icon: <Palette className="w-4 h-4" />,
      options: ['brightness', 'contrast', 'saturation', 'reset']
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: <Zap className="w-4 h-4" />
    }
  ];

  const shortcuts = [
    { key: 'Space / K', action: 'Play/Pause' },
    { key: 'F', action: 'Fullscreen' },
    { key: 'M', action: 'Mute' },
    { key: '← / →', action: 'Seek 5s' },
    { key: '↑ / ↓', action: 'Volume' },
    { key: ', / .', action: 'Speed' },
    { key: 'S', action: 'Settings' }
  ];

  const audioPresets = [
    { id: 'default', name: 'Default', description: 'Original audio' },
    { id: 'movie', name: 'Movie', description: 'Enhanced dialogue' },
    { id: 'music', name: 'Music', description: 'Balanced frequencies' },
    { id: 'speech', name: 'Speech', description: 'Clear vocals' },
    { id: 'bass', name: 'Bass Boost', description: 'Enhanced low frequencies' }
  ];

  // Sleep timer options with dark mode styling
  const sleepTimerOptions = [
    { minutes: 0, label: 'Off' },
    { minutes: 5, label: '5 minutes' },
    { minutes: 15, label: '15 minutes' },
    { minutes: 30, label: '30 minutes' },
    { minutes: 45, label: '45 minutes' },
    { minutes: 60, label: '1 hour' }
  ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleTabClick = (tabId) => {
    setActiveTab(activeTab === tabId ? null : tabId);
  };

  const handleSpeedChange = (rate) => {
    onPlaybackRateChange(rate);
    setActiveTab(null);
  };

  const handleQualityChange = (newQuality) => {
    onQualityChange(newQuality);
    setActiveTab(null);
  };

  // Volume boost handler
  const handleVolumeBoostChange = (value) => {
    setVolumeBoost(value);
    if (onVolumeBoost) {
      onVolumeBoost(value);
    }
  };

  // Audio preset handler
  const handleAudioPresetChange = (presetId) => {
    setAudioPreset(presetId);
    // Apply audio preset filters
    switch(presetId) {
      case 'movie':
        if (onVolumeBoost) onVolumeBoost(1.2);
        break;
      case 'music':
        if (onVolumeBoost) onVolumeBoost(1.3);
        break;
      case 'speech':
        if (onVolumeBoost) onVolumeBoost(1.1);
        break;
      case 'bass':
        if (onVolumeBoost) onVolumeBoost(1.5);
        break;
      default:
        if (onVolumeBoost) onVolumeBoost(1);
        break;
    }
  };

  // Reset video enhancements
  const resetVideoEnhancements = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setVolumeBoost(1);
    setAudioPreset('default');
    
    if (onBrightnessChange) onBrightnessChange(100);
    if (onContrastChange) onContrastChange(100);
    if (onSaturationChange) onSaturationChange(100);
    if (onVolumeBoost) onVolumeBoost(1);
  };

  const renderTabContent = (tab) => {
    switch(tab.id) {
      case 'speed':
        return (
          <div className="grid grid-cols-2 gap-1 md:gap-2">
            {tab.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSpeedChange(option)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  playbackRate === option
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                {option === 1 ? 'Normal' : `${option}x`}
              </button>
            ))}
          </div>
        );

      case 'quality':
        return (
          <div className="grid grid-cols-1 gap-2">
            {tab.options.map((option) => (
              <button
                key={option}
                onClick={() => handleQualityChange(option)}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  quality === option
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {quality === option && <Check className="w-4 h-4" />}
                </div>
                <div className="text-xs opacity-70 mt-1">Best quality available</div>
              </button>
            ))}
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-3">
            <button
              onClick={onTogglePip}
              className="w-full flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <PictureInPicture className="w-4 h-4" />
              <span>Picture-in-Picture</span>
            </button>
            
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Sleep Timer</label>
              <select 
                onChange={(e) => onToggleSleepTimer(parseInt(e.target.value))}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none transition-colors"
              >
                {sleepTimerOptions.map(option => (
                  <option 
                    key={option.minutes} 
                    value={option.minutes}
                    className="bg-gray-800 text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400">
                Video will automatically pause when timer ends
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex justify-between">
                <span>Volume Boost</span>
                <span className="text-purple-400">{Math.round(volumeBoost * 100)}%</span>
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={volumeBoost}
                onChange={(e) => handleVolumeBoostChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Normal</span>
                <span>Max Boost</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Audio Presets</label>
              <div className="space-y-1">
                {audioPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleAudioPresetChange(preset.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      audioPreset === preset.id
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs opacity-70">{preset.description}</div>
                    </div>
                    {audioPreset === preset.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex justify-between">
                <span className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  Brightness
                </span>
                <span className="text-purple-400">{brightness}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setBrightness(value);
                  onBrightnessChange(value);
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex justify-between">
                <span className="flex items-center gap-2">
                  <Contrast className="w-4 h-4" />
                  Contrast
                </span>
                <span className="text-purple-400">{contrast}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setContrast(value);
                  onContrastChange(value);
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Saturation
                </span>
                <span className="text-purple-400">{saturation}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setSaturation(value);
                  onSaturationChange(value);
                }}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <button
              onClick={resetVideoEnhancements}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Enhancements
            </button>
          </div>
        );

      case 'shortcuts':
        return (
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between text-sm text-gray-300 py-2">
                <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono border border-gray-600">
                  {shortcut.key}
                </kbd>
                <span>{shortcut.action}</span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      ref={settingsRef}
      className="absolute bottom-full right-0 mb-3 w-80 bg-black/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/10 z-50"
    >
      <div className="space-y-2">
        {settingsTabs.map((tab) => (
          <div key={tab.id} className="space-y-2">
            <button
              onClick={() => handleTabClick(tab.id)}
              className="flex items-center justify-between w-full p-3 text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            >
              <div className="flex items-center gap-3">
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'rotate-180' : ''}`} />
            </button>

            {activeTab === tab.id && (
              <div className="pl-4 space-y-3 animate-slide-down">
                {renderTabContent(tab)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPanel;