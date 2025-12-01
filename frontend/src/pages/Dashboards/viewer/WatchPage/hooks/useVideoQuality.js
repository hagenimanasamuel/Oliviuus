import { useState, useEffect, useCallback } from 'react';

export const useVideoQuality = (videoRef, contentId) => {
  const [quality, setQuality] = useState('Auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentCDN, setCurrentCDN] = useState('origin');
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [cdnStatus, setCdnStatus] = useState('active');
  const [isSwitchingQuality, setIsSwitchingQuality] = useState(false);

  // Simple quality profiles for UI only
  const QUALITY_PROFILES = {
    'Auto': {
      bitrate: 'auto',
      label: 'Auto (Recommended)',
      description: 'Original video quality',
      bandwidth: 0
    },
    'Best Quality': {
      bitrate: 'original',
      label: 'Original Quality',
      description: 'Original video • Best available',
      bandwidth: 25
    },
    'Balanced': {
      bitrate: 'original',
      label: 'Original Quality', 
      description: 'Original video • Great quality',
      bandwidth: 8
    },
    'Data Saver': {
      bitrate: 'original',
      label: 'Original Quality',
      description: 'Original video • Efficient streaming',
      bandwidth: 4
    }
  };

  // Safe Network Speed Detection - No external calls
  const detectNetworkSpeed = useCallback(async () => {
    try {
      // Use browser's built-in connection API
      if (navigator.connection && navigator.connection.downlink) {
        const speed = navigator.connection.downlink;
        setNetworkSpeed(Math.round(speed * 10) / 10);
        return speed;
      }
      
      // Fallback: Simulate good network speed
      const simulatedSpeed = 15;
      setNetworkSpeed(simulatedSpeed);
      return simulatedSpeed;
      
    } catch (error) {
      console.warn('Network speed detection failed:', error);
      setNetworkSpeed(10);
      return 10;
    }
  }, []);

  // Simple quality change - Only updates UI state, doesn't change video source
  const changeQuality = useCallback(async (newQuality, currentVideoSource) => {
    if (isSwitchingQuality) return;
    
    try {
      setIsSwitchingQuality(true);
      
      // Simply update the quality state for UI
      setQuality(newQuality);
      
      console.log(`[Quality UI] User selected: ${newQuality}`);
      console.log(`[Video Source] Still using original: ${currentVideoSource}`);
      
      // Note: We're NOT changing the video source
      // All quality options use the original video file
      
    } catch (error) {
      console.error('Quality change failed:', error);
    } finally {
      setIsSwitchingQuality(false);
    }
  }, [isSwitchingQuality]);

  // Generate URL - Always returns original URL (no CDN quality switching)
  const generateVideoUrl = useCallback(async (contentPath, selectedQuality = quality) => {
    // Always return the original content path
    // No CDN URL generation until you have multiple quality files
    console.log(`[Video URL] Using original source for ${selectedQuality}: ${contentPath}`);
    return contentPath;
  }, [quality]);

  // Load optimal quality - Just returns original URL
  const loadOptimalQuality = useCallback(async (contentPath) => {
    console.log('[Quality] Loading original video quality');
    return contentPath;
  }, []);

  // Initialize - No external calls
  useEffect(() => {
    const initialize = async () => {
      await detectNetworkSpeed();
      
      // Set available qualities for UI
      // All options use the same original video source
      setAvailableQualities(['Auto', 'Best Quality', 'Balanced', 'Data Saver']);
      setCdnStatus('active');
      setCurrentCDN('origin');
    };

    initialize();
  }, [detectNetworkSpeed]);

  return {
    // State
    quality,                    // Current selected quality (UI only)
    availableQualities,         // Available quality options
    currentCDN,                 // Always 'origin'
    networkSpeed,               // Estimated network speed
    cdnStatus,                  // Always 'active'
    isSwitchingQuality,         // UI loading state
    
    // Functions
    changeQuality,              // Update UI quality state
    generateVideoUrl,           // Always returns original URL
    loadOptimalQuality,         // Always returns original URL
    
    // Constants
    QUALITY_PROFILES            // Quality descriptions for UI
  };
};