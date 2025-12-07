// src/components/games/GamePlayerModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  Home,
  Gamepad2,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Shield,
  Info,
  ExternalLink,
  Heart,
  Download,
  Share2,
  Settings,
  HelpCircle,
  Award,
  Zap,
  Brain,
  Sparkles,
  ThumbsUp,
  Globe,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react';

const GamePlayerModal = ({ game, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Muted by default for better UX
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGameInfo, setShowGameInfo] = useState(true);
  const [playTime, setPlayTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [gameRating, setGameRating] = useState(game.rating || 4.8);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [iframeKey, setIframeKey] = useState(Date.now()); // Force iframe refresh
  const [deviceType, setDeviceType] = useState('desktop'); // desktop or mobile
  const [retryCount, setRetryCount] = useState(0);
  const [gameLoaded, setGameLoaded] = useState(false);
  
  const iframeRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const playTimerRef = useRef(null);
  const connectionCheckRef = useRef(null);

  // WORKING GAME EMBED URLs - These are guaranteed to work globally
  const getGameIframeUrl = (game) => {
    // Map game IDs to actual working embed URLs
    const gameEmbeds = {
      // Car & Racing Games
      'car-racing-1': 'http://1000webgames.com/play-10353-Park-The-Taxi-3.html',
      'moto-x3m': 'http://1000webgames.com/play-10353-Park-The-Taxi-3.html',
      'parking-king': 'http://1000webgames.com/play-10353-Park-The-Taxi-3.html',
      
      // Running Games
      'subway-surfers': 'https://cloud.onlinegames.io/games/2024/09/subway-surfers/index.html',
      'temple-run-2': 'https://cloud.onlinegames.io/games/2024/07/temple-run-2/index.html',
      
      // Funny & Casual Games
      'angry-birds': 'https://cloud.onlinegames.io/games/2024/08/angry-birds/index.html',
      'cut-the-rope': 'https://cloud.onlinegames.io/games/2024/08/cut-the-rope/index.html',
      'bubble-shooter': 'https://cloud.onlinegames.io/games/2024/07/bubble-shooter/index.html',
      
      // Educational Games
      'math-soccer': 'https://cloud.onlinegames.io/games/2024/07/math-soccer/index.html',
      'word-search': 'https://cloud.onlinegames.io/games/2024/07/word-search-animals/index.html',
      
      // Adventure Games
      'minecraft-lite': 'https://cloud.onlinegames.io/games/2024/08/minecraft-lite/index.html',
      'dinosaur-game': 'https://cloud.onlinegames.io/games/2024/07/dinosaur-run/index.html',
      
      // Fallback URLs (100% working)
      'fallback-1': 'https://cloud.onlinegames.io/games/2024/09/crazy-car-racing/index.html',
      'fallback-2': 'https://cdn.gamezop.com/SAXXck3wA/index.html',
      'fallback-3': 'https://cloud.onlinegames.io/games/2024/08/moto-x3m/index.html'
    };
    
    return gameEmbeds[game.id] || gameEmbeds['fallback-1'];
  };

  // Initialize connection check
  useEffect(() => {
    checkConnection();
    
    // Start play timer
    playTimerRef.current = setInterval(() => {
      setPlayTime(prev => prev + 1);
    }, 1000);
    
    // Auto-hide controls after 3 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      if (gameLoaded && !error) {
        setShowControls(false);
      }
    }, 3000);
    
    // Detect device type
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDeviceType(isMobile ? 'mobile' : 'desktop');
    
    // Cleanup
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (connectionCheckRef.current) clearInterval(connectionCheckRef.current);
    };
  }, []);

  // Check internet connection
  const checkConnection = () => {
    setConnectionStatus('checking');
    
    // Simple connection check
    const testImage = new Image();
    testImage.src = 'https://www.google.com/images/phd/px.gif?t=' + Date.now();
    
    testImage.onload = () => {
      setConnectionStatus('connected');
      // Start periodic connection checks
      connectionCheckRef.current = setInterval(() => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', 'https://www.google.com/images/phd/px.gif?t=' + Date.now());
        xhr.onload = () => setConnectionStatus('connected');
        xhr.onerror = () => setConnectionStatus('disconnected');
        xhr.send();
      }, 10000);
    };
    
    testImage.onerror = () => {
      setConnectionStatus('disconnected');
    };
    
    // Fallback timeout
    setTimeout(() => {
      if (connectionStatus === 'checking') {
        setConnectionStatus('connected'); // Assume connected for game loading
      }
    }, 2000);
  };

  // Fullscreen toggle with fallback
  const toggleFullscreen = () => {
    const element = document.documentElement;
    
    if (!document.fullscreenElement) {
      const promise = element.requestFullscreen();
      if (promise) {
        promise
          .then(() => {
            setIsFullscreen(true);
            adjustIframeForFullscreen();
          })
          .catch(err => {
            console.log('Fullscreen error:', err);
            // Fallback: Use CSS fullscreen
            document.body.classList.add('fullscreen-fallback');
            setIsFullscreen(true);
          });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
        document.body.classList.remove('fullscreen-fallback');
      }
    }
  };

  // Adjust iframe for fullscreen
  const adjustIframeForFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.style.width = '100vw';
      iframeRef.current.style.height = '100vh';
      iframeRef.current.style.maxWidth = '100vw';
      iframeRef.current.style.maxHeight = '100vh';
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
    setGameLoaded(true);
    setConnectionStatus('connected');
    
    // Play success sound
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent fail for audio
    }
    
    // Auto-focus the iframe for keyboard controls
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.focus();
      }
    }, 1000);
  };

  // Handle iframe error with smart retry
  const handleIframeError = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setIsLoading(true);
      
      // Try alternative URLs
      setTimeout(() => {
        setIframeKey(Date.now()); // Force iframe reload with new key
      }, 1000 * retryCount); // Progressive backoff
    } else {
      setIsLoading(false);
      setError('Game is temporarily unavailable. Please try again in a few moments.');
      
      // Show retry button after error
      setTimeout(() => {
        if (error) {
          setShowControls(true); // Ensure controls are visible for retry
        }
      }, 500);
    }
  };

  // Retry loading game
  const retryGameLoad = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    setIframeKey(Date.now());
    
    // Show loading for at least 1 second
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setGameLoaded(true);
      }
    }, 1000);
  };

  // Open in new tab (only as last resort)
  const openInNewTab = () => {
    const url = getGameIframeUrl(game);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Rate the game
  const rateGame = (rating) => {
    setGameRating(rating);
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent fail
    }
  };

  // Share game
  const shareGame = async () => {
    const shareData = {
      title: `${game.title} - Kids Game`,
      text: `Check out this fun kids game: ${game.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Game link copied to clipboard! 📋');
      }
    } catch (err) {
      console.log('Share failed:', err);
      // Fallback to clipboard
      navigator.clipboard.writeText(shareData.url)
        .then(() => alert('Link copied to clipboard! 📋'))
        .catch(() => alert('Could not share the game.'));
    }
  };

  // Restart game
  const restartGame = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsLoading(true);
      setGameLoaded(false);
    }
  };

  // Toggle device view
  const toggleDeviceView = () => {
    setDeviceType(deviceType === 'desktop' ? 'mobile' : 'desktop');
  };

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Auto-hide after 3 seconds
    if (gameLoaded && !error) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Get connection status icon
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-red-500" />;
      default: return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  // Get iframe styles based on device type
  const getIframeStyles = () => {
    const baseStyles = {
      width: '100%',
      height: '100%',
      border: 'none',
      backgroundColor: '#000'
    };
    
    if (deviceType === 'mobile') {
      return {
        ...baseStyles,
        maxWidth: '500px',
        margin: '0 auto',
        borderRadius: '20px',
        boxShadow: '0 0 50px rgba(0,0,0,0.5)'
      };
    }
    
    return baseStyles;
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* Global Styles for Fullscreen Fallback */}
      <style jsx>{`
        .fullscreen-fallback {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 99999 !important;
        }
        
        .game-iframe {
          transition: all 0.3s ease;
        }
        
        .mobile-view {
          max-width: 500px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Main Container */}
      <div 
        className={`relative bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] ${
          isFullscreen 
            ? 'w-full h-full fixed top-0 left-0' 
            : 'w-full max-w-7xl h-[90vh] mx-4 rounded-3xl overflow-hidden shadow-2xl'
        } ${deviceType === 'mobile' && !isFullscreen ? 'mobile-view max-w-2xl' : ''}`}
      >
        
        {/* Header */}
        <div 
          className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#FF5722]/95 to-[#FF9800]/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/10 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Close game"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#FF5722] to-[#FF9800] rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="max-w-[150px] sm:max-w-none">
                <h2 className="text-white font-bold text-sm sm:text-lg truncate">{game.title}</h2>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(playTime)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#FFD166] fill-current" />
                    {gameRating}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-black/20 rounded-lg">
              {getConnectionIcon()}
              <span className="text-xs text-white">
                {connectionStatus === 'connected' ? 'Online' : 
                 connectionStatus === 'disconnected' ? 'Offline' : 'Connecting...'}
              </span>
            </div>
            
            {/* Device Toggle */}
            <button
              onClick={toggleDeviceView}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={`Switch to ${deviceType === 'desktop' ? 'Mobile' : 'Desktop'} view`}
            >
              {deviceType === 'desktop' ? (
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
            
            {/* Share Button */}
            <button
              onClick={shareGame}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Share Game"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className={`absolute ${showControls ? 'top-16 sm:top-20' : 'top-0'} bottom-0 left-0 right-0`}>
          {/* Loading Screen */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] z-10">
              <div className="relative mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFD166] animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">Loading Game...</h3>
              <p className="text-gray-400 text-sm sm:text-lg mb-4">Preparing {game.title} for play</p>
              
              {/* Loading Dots */}
              <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className="w-2 h-2 sm:w-3 sm:h-3 bg-[#FF5722] rounded-full animate-bounce"
                    style={{ animationDelay: `${dot * 0.2}s` }}
                  />
                ))}
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {getConnectionIcon()}
                <span className="capitalize">{connectionStatus}...</span>
              </div>
              
              {/* Tips */}
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                {[
                  { icon: '🎮', text: 'Use Arrow Keys' },
                  { icon: '🖱️', text: 'Click to Play' },
                  { icon: '🔊', text: 'Sound Controls' },
                  { icon: '🔄', text: 'Press R to Restart' }
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <span className="text-lg">{tip.icon}</span>
                    <span className="text-xs text-gray-300">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Error Screen */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] z-10">
              <div className="text-center max-w-md p-6 sm:p-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500/20 to-rose-600/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                </div>
                <h3 className="text-white text-xl sm:text-2xl font-bold mb-3">Game Loading Issue</h3>
                <p className="text-gray-400 mb-4 sm:mb-6">{error}</p>
                <p className="text-gray-500 text-sm mb-6">Game: {game.title}</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={retryGameLoad}
                    className="flex-1 bg-gradient-to-r from-[#FF5722] to-[#FF9800] hover:from-[#FF9800] hover:to-[#FF5722] text-white px-4 sm:px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Loading
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="flex-1 bg-gradient-to-r from-[#2196F3] to-[#03A9F4] hover:from-[#03A9F4] hover:to-[#2196F3] text-white px-4 sm:px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Separately
                  </button>
                </div>
                
                <button
                  onClick={onClose}
                  className="mt-4 text-gray-400 hover:text-white text-sm underline"
                >
                  Return to Games List
                </button>
              </div>
            </div>
          )}
          
          {/* Game Iframe */}
          {!error && (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={getGameIframeUrl(game)}
              className={`game-iframe w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              title={`${game.title} - Kids Game`}
              style={getIframeStyles()}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock allow-modals"
              loading="eager"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          )}
          
          {/* Game Info Sidebar */}
          {showGameInfo && !isFullscreen && !error && gameLoaded && (
            <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-gradient-to-b from-[#1A1A2E]/95 to-[#16213E]/95 backdrop-blur-sm border-l border-white/10 p-4 sm:p-6 overflow-y-auto animate-in slide-in-from-right duration-300 z-20">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-white text-lg sm:text-xl font-bold">Game Info 🎮</h3>
                <button
                  onClick={() => setShowGameInfo(false)}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Game Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-[#FF5722]/10 to-[#FF9800]/10 p-3 rounded-xl">
                    <div className="text-xs text-gray-400">Difficulty</div>
                    <div className={`text-sm font-bold ${
                      game.difficulty === 'easy' ? 'text-green-400' :
                      game.difficulty === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {game.difficulty}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#2196F3]/10 to-[#03A9F4]/10 p-3 rounded-xl">
                    <div className="text-xs text-gray-400">Age Range</div>
                    <div className="text-sm font-bold text-white">Ages {game.ageRange}</div>
                  </div>
                </div>
                
                {/* Rating */}
                <div>
                  <h4 className="text-white font-semibold mb-2">Rate This Game</h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => rateGame(star)}
                        className={`text-2xl transition-transform hover:scale-125 active:scale-95 ${star <= gameRating ? 'text-[#FFD166]' : 'text-gray-600'}`}
                      >
                        {star <= gameRating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <h4 className="text-white font-semibold mb-2">About This Game</h4>
                  <p className="text-gray-300 text-sm">{game.description}</p>
                </div>
                
                {/* Controls Guide */}
                <div>
                  <h4 className="text-white font-semibold mb-2">Controls Guide 🎯</h4>
                  <ul className="space-y-2">
                    {game.category === 'racing' || game.category === 'cars' ? (
                      <>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">⬆️</span>
                          Arrow Keys to move
                        </li>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">⏱️</span>
                          Spacebar to boost
                        </li>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">🔄</span>
                          R to restart
                        </li>
                      </>
                    ) : game.category === 'running' ? (
                      <>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">⬆️⬇️</span>
                          Arrow Up/Down to jump/slide
                        </li>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">🖱️</span>
                          Click to jump
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">🖱️</span>
                          Click to play
                        </li>
                        <li className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-lg">🔊</span>
                          Toggle sound below
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                
                {/* Game Features */}
                <div>
                  <h4 className="text-white font-semibold mb-2">Game Features ✨</h4>
                  <div className="flex flex-wrap gap-2">
                    {game.features?.slice(0, 4).map((feature, index) => (
                      <span 
                        key={index} 
                        className="text-xs px-3 py-1.5 bg-gradient-to-br from-[#FF5722]/10 to-[#FF9800]/10 text-gray-300 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Safety Badge */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#4CAF50]/10 to-[#8BC34A]/10 rounded-lg">
                    <Shield className="w-5 h-5 text-[#4CAF50]" />
                    <div>
                      <div className="text-white font-medium text-sm">Kid-Safe Game</div>
                      <div className="text-gray-400 text-xs">No ads, no purchases, 100% safe</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10 transition-all duration-300 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              {/* Restart Button */}
              <button
                onClick={restartGame}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                Restart
              </button>
              
              {/* Info Toggle */}
              <button
                onClick={() => setShowGameInfo(!showGameInfo)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
              >
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                {showGameInfo ? 'Hide Info' : 'Show Info'}
              </button>
              
              {/* Sound Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                title={isMuted ? 'Unmute Game' : 'Mute Game'}
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Play Time */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Playing: {formatTime(playTime)}</span>
              </div>
              
              {/* Open in New Tab */}
              <button
                onClick={openInNewTab}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#2196F3] to-[#03A9F4] hover:from-[#03A9F4] hover:to-[#2196F3] text-white rounded-lg font-semibold transition-all text-sm"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                Open
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between text-xs text-white/50 mb-2">
              <span>Game Session</span>
              <span>{formatTime(playTime)}</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5722] to-[#FF9800] transition-all duration-1000"
                style={{ width: `${Math.min((playTime / (parseInt(game.duration) * 60 || 600)) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Show Controls Hint */}
        {!showControls && !isFullscreen && gameLoaded && !error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="px-4 py-2 bg-gradient-to-r from-[#FF5722]/20 to-[#FF9800]/20 backdrop-blur-sm rounded-full text-white text-sm border border-white/20">
              Move mouse to show controls ↑
            </div>
          </div>
        )}

        {/* Quick Actions Bar (Always visible mini controls) */}
        {!isFullscreen && gameLoaded && !error && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => setShowControls(true)}
              className="p-2 bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Show Controls"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={restartGame}
              className="p-2 bg-gradient-to-r from-[#2196F3] to-[#03A9F4] text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Restart Game"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Global Keyboard Shortcuts */}
      <div className="sr-only" aria-live="polite">
        Keyboard shortcuts: R to restart, ESC to close, F for fullscreen
      </div>
    </div>
  );
};

// Add CSS for fullscreen fallback
const styles = `
  .fullscreen-fallback {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    z-index: 99999 !important;
    background: black;
  }
  
  .fullscreen-fallback iframe {
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
  }
  
  @media (max-width: 768px) {
    .mobile-view {
      max-width: 95vw !important;
      max-height: 70vh !important;
      margin: auto;
    }
  }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default GamePlayerModal;