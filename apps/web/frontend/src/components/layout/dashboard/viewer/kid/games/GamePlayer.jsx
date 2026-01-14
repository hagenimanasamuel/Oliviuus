import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Volume2, Volume1, VolumeX, Music, ChevronUp,
  ChevronDown, Pause, Play, HelpCircle, RotateCcw, Clock,
  Gamepad2, Eye, EyeOff, Trophy, Heart, Maximize2, Minimize2
} from 'lucide-react';
import api from '../../../../../../api/axios';

// Import audio files directly
import track1 from '../../../../../../../public/sound/kid_games/kid_games (1).mp3';
import track2 from '../../../../../../../public/sound/kid_games/kid_games (2).mp3';
import track3 from '../../../../../../../public/sound/kid_games/kid_games (3).mp3';
import track4 from '../../../../../../../public/sound/kid_games/kid_games (4).mp3';

const GamePlayer = ({ gameId, gameTitle, gameComponent, onClose, sessionId, onGameEvent }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [audioError, setAudioError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameStats, setGameStats] = useState({
    timePlayed: 0,
    questionsAnswered: 0,
    streak: 0
  });
  const [lastScoreSent, setLastScoreSent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Refs
  const backgroundAudioRef = useRef(null);
  const gameContainerRef = useRef(null);
  const fullscreenRef = useRef(null);
  const userInteractedRef = useRef(false);
  const timerRef = useRef(null);
  const scoreDebounceRef = useRef(null);

  // Imported audio tracks
  const backgroundTracks = [track1, track2, track3, track4];

  // Initialize everything
  useEffect(() => {
    checkMobile();
    setupFullscreen();
    startGameTimer();
    initAudio();

    return () => {
      cleanup();
    };
  }, []);

  // Check if mobile device
  const checkMobile = () => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (mobile) {
      setShowControls(true);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Submit score to backend
  const submitScoreToBackend = useCallback(async (newScore, level = 1, metrics = {}) => {
    if (!sessionId) {
      console.log('No session ID, skipping score submission');
      return;
    }

    // Debounce score submissions to avoid too many API calls
    if (scoreDebounceRef.current) {
      clearTimeout(scoreDebounceRef.current);
    }

    scoreDebounceRef.current = setTimeout(async () => {
      try {
        const response = await api.post(`/games/kids/games/${gameId}/score`, {
          session_id: sessionId,
          score: newScore,
          level: level,
          moves: 0,
          time_taken: gameStats.timePlayed,
          accuracy: 100,
          metrics: {
            ...metrics,
            hearts: hearts,
            streak: gameStats.streak,
            questions_answered: gameStats.questionsAnswered
          }
        });

        if (response.data.success) {
          setLastScoreSent(newScore);
          console.log('Score submitted successfully:', response.data);
        }
      } catch (error) {
        console.error('Failed to submit score:', error);
        // Continue game even if score submission fails
      }
    }, 1000); // Debounce for 1 second
  }, [sessionId, gameId, gameStats, hearts]);

  // Save game progress to backend
  const saveGameProgress = useCallback(async (saveState, level = 1) => {
    if (!sessionId) {
      console.log('No session ID, skipping progress save');
      return;
    }

    try {
      setIsSaving(true);
      const response = await api.post(`/games/kids/games/${gameId}/save`, {
        save_state: saveState,
        level: level
      });

      if (response.data.success) {
        setSaveMessage('Progress saved!');
        setTimeout(() => setSaveMessage(null), 2000);
        console.log('Game progress saved:', response.data);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
      setSaveMessage('Failed to save progress');
      setTimeout(() => setSaveMessage(null), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, gameId]);

  // Load game progress from backend
  const loadGameProgress = useCallback(async () => {
    if (!sessionId) {
      console.log('No session ID, skipping progress load');
      return;
    }

    try {
      const response = await api.get(`/games/kids/games/${gameId}/progress`);
      
      if (response.data.success && response.data.has_progress) {
        const progress = response.data.progress;
        
        // Update game state with loaded progress
        if (progress.save_state) {
          // Pass loaded progress to game component via onGameEvent
          if (onGameEvent) {
            onGameEvent({
              type: 'loadProgress',
              payload: progress.save_state
            });
          }
          
          if (progress.last_level_played) {
            // You might want to set level here
          }
          
          if (progress.highest_score) {
            setScore(progress.highest_score);
          }
          
          console.log('Game progress loaded:', progress);
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  }, [sessionId, gameId, onGameEvent]);

  // Handle game events from the actual game component
  const handleGameEvent = useCallback((event) => {
    switch (event.type) {
      case 'scoreUpdate':
        const newScore = event.payload;
        setScore(newScore);
        
        // Only submit if score increased significantly or is a high score
        if (!lastScoreSent || newScore > lastScoreSent + 10) {
          submitScoreToBackend(newScore, event.level || 1, event.metrics || {});
        }
        
        setGameStats(prev => ({ 
          ...prev, 
          questionsAnswered: prev.questionsAnswered + 1 
        }));
        break;
        
      case 'heartsUpdate':
        setHearts(event.payload);
        break;
        
      case 'streakUpdate':
        setGameStats(prev => ({ ...prev, streak: event.payload }));
        break;
        
      case 'saveRequest':
        saveGameProgress(event.payload, event.level || 1);
        break;
        
      case 'levelComplete':
        submitScoreToBackend(score, event.level, {
          level_completed: true,
          time_taken: event.timeTaken,
          moves_used: event.movesUsed
        });
        break;
        
      default:
        console.log('Unhandled game event:', event);
    }
  }, [lastScoreSent, score, submitScoreToBackend, saveGameProgress]);

  // Load progress when component mounts
  useEffect(() => {
    loadGameProgress();
  }, [loadGameProgress]);

  // Auto-save progress periodically (every 30 seconds)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (onGameEvent) {
        onGameEvent({
          type: 'autoSaveRequest',
          payload: { timestamp: Date.now() }
        });
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [onGameEvent]);

  useEffect(() => {
  if (!sessionId) return;
  
  // Update session activity every 30 seconds
  const activityInterval = setInterval(() => {
    try {
      api.post(`/games/kids/session/${sessionId}/activity`);
    } catch (error) {
      console.log('Failed to update session activity:', error);
    }
  }, 30000);
  
  return () => clearInterval(activityInterval);
}, [sessionId]);

  // Professional audio initialization with imported files
  const initAudio = useCallback(async () => {
    try {
      console.log('Initializing audio with imported tracks:', backgroundTracks);

      // Create audio element if not exists
      if (!backgroundAudioRef.current) {
        backgroundAudioRef.current = new Audio();
        backgroundAudioRef.current.loop = true;
        backgroundAudioRef.current.volume = 0; // Start muted
        backgroundAudioRef.current.preload = 'metadata';

        backgroundAudioRef.current.addEventListener('error', (e) => {
          console.error('Audio element error:', e);
          setAudioError(true);
        });

        backgroundAudioRef.current.addEventListener('canplaythrough', () => {
          console.log('Audio can play through');
        });
      }

      // Shuffle tracks for random playback
      const shuffledTracks = [...backgroundTracks].sort(() => Math.random() - 0.5);
      setTracks(shuffledTracks);

      // Set initial track
      if (shuffledTracks.length > 0) {
        const initialTrack = shuffledTracks[0];
        setCurrentTrack(initialTrack);
        backgroundAudioRef.current.src = initialTrack;

        console.log('Audio source set to:', initialTrack);

        // Preload the audio
        try {
          await backgroundAudioRef.current.load();
          console.log('Audio preloaded successfully');
        } catch (loadError) {
          console.log('Audio preload error (non-critical):', loadError.message);
        }
      }

    } catch (error) {
      console.error('Audio initialization error:', error);
      setAudioError(true);
    }
  }, [soundEnabled, isMusicPlaying]);

  const attemptAudioPlay = async () => {
    if (!backgroundAudioRef.current) return;

    try {
      console.log('Attempting to play audio...');

      if (backgroundAudioRef.current.readyState < 2) {
        console.log('Audio not loaded yet, waiting...');
        await new Promise(resolve => {
          const canPlayHandler = () => {
            backgroundAudioRef.current.removeEventListener('canplay', canPlayHandler);
            resolve();
          };
          backgroundAudioRef.current.addEventListener('canplay', canPlayHandler);
          setTimeout(resolve, 500);
        });
      }

      backgroundAudioRef.current.volume = volume;
      console.log('Playing audio with volume:', volume);
      
      const playPromise = backgroundAudioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Audio playback started successfully');
        setAudioError(false);
      }
    } catch (error) {
      console.log('Audio play attempt failed:', error.message);
      if (error.name === 'NotAllowedError') {
        console.log('Autoplay prevented - waiting for user interaction');
      } else if (error.name === 'NotSupportedError') {
        console.log('Audio format not supported');
        setAudioError(true);
      }
    }
  };

  // Handle user interaction to unlock audio
  const handleUserInteraction = useCallback(() => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      console.log('User interaction detected, attempting to play audio...');

      if (backgroundAudioRef.current && soundEnabled && isMusicPlaying) {
        backgroundAudioRef.current.currentTime = 0;
        backgroundAudioRef.current.volume = volume;

        backgroundAudioRef.current.play().then(() => {
          console.log('Audio started after user interaction');
          setAudioError(false);
        }).catch(error => {
          console.error('Failed to play after user interaction:', error);
          setAudioError(true);
        });
      }
    }
  }, [soundEnabled, isMusicPlaying, volume]);

  // Volume management
  useEffect(() => {
    if (backgroundAudioRef.current) {
      const actualVolume = soundEnabled && isMusicPlaying ? volume : 0;
      backgroundAudioRef.current.volume = actualVolume;
    }
  }, [volume, soundEnabled, isMusicPlaying]);

  const setupFullscreen = () => {
    fullscreenRef.current = document.documentElement;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      setIsFullscreen(!!isCurrentlyFullscreen);
    };

    const fullscreenEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ];

    fullscreenEvents.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    return () => {
      fullscreenEvents.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange);
      });
    };
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenEnabled) return;

    if (!isFullscreen) {
      const element = fullscreenRef.current;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  const startGameTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setGameStats(prev => ({
          ...prev,
          timePlayed: prev.timePlayed + 1
        }));
      }
    }, 1000);
  };

  const toggleMusic = () => {
    const newState = !isMusicPlaying;
    setIsMusicPlaying(newState);

    if (newState && backgroundAudioRef.current && soundEnabled) {
      if (backgroundAudioRef.current.paused && userInteractedRef.current) {
        backgroundAudioRef.current.play();
      }
      backgroundAudioRef.current.volume = volume;
    } else if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = 0;
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);

    if (backgroundAudioRef.current) {
      if (newState && isMusicPlaying) {
        backgroundAudioRef.current.volume = volume;
        if (backgroundAudioRef.current.paused && userInteractedRef.current) {
          backgroundAudioRef.current.play();
        }
      } else {
        backgroundAudioRef.current.volume = 0;
      }
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (backgroundAudioRef.current && soundEnabled && isMusicPlaying) {
      backgroundAudioRef.current.volume = newVolume;
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    e.stopPropagation();

    if (!userInteractedRef.current) {
      handleUserInteraction();
    }

    switch (e.key.toLowerCase()) {
      case 'escape':
        if (showHelp) {
          setShowHelp(false);
        } else if (showVolumeSlider) {
          setShowVolumeSlider(false);
        } else {
          onClose();
        }
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'm':
        toggleSound();
        break;
      case ' ':
        e.preventDefault();
        setIsPaused(!isPaused);
        break;
      case 'arrowup':
        e.preventDefault();
        handleVolumeChange(Math.min(volume + 0.1, 1));
        break;
      case 'arrowdown':
        e.preventDefault();
        handleVolumeChange(Math.max(volume - 0.1, 0));
        break;
      case 'h':
        setShowHelp(!showHelp);
        break;
      case 'p':
        setIsPaused(!isPaused);
        break;
      case 'c':
        setShowControls(!showControls);
        break;
      case 's':
        // Manual save shortcut
        if (onGameEvent) {
          onGameEvent({ type: 'saveRequest' });
        }
        break;
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        const num = parseInt(e.key);
        handleVolumeChange(num / 10);
        break;
    }
  }, [volume, isPaused, showHelp, showVolumeSlider, toggleFullscreen, onClose, handleUserInteraction, onGameEvent]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup on unmount
  const cleanup = () => {
    console.log('Cleaning up GamePlayer...');
    
    // Save final progress before closing
    if (onGameEvent) {
      onGameEvent({ 
        type: 'finalSave', 
        payload: { 
          score, 
          timePlayed: gameStats.timePlayed,
          questionsAnswered: gameStats.questionsAnswered 
        } 
      });
    }
    
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
      backgroundAudioRef.current.src = '';
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (scoreDebounceRef.current) {
      clearTimeout(scoreDebounceRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const volumePercent = Math.round(volume * 100);

  // Render volume icon
  const getVolumeIcon = () => {
    if (!soundEnabled) return <VolumeX className="w-5 h-5 text-red-400" />;
    if (volume === 0) return <VolumeX className="w-5 h-5 text-gray-400" />;
    if (volume < 0.3) return <Volume1 className="w-5 h-5 text-yellow-400" />;
    return <Volume2 className="w-5 h-5 text-green-400" />;
  };

  // Control toggle button - always visible
  const ControlToggleButton = () => (
    <button
      onClick={() => setShowControls(!showControls)}
      className={`fixed ${isMobile ? 'top-4 left-20' : 'top-4 left-20'} z-50 p-2 rounded-full bg-gradient-to-r from-[#FF5722]/20 to-[#FF9800]/20 backdrop-blur-sm border border-[#FF5722]/30 hover:bg-gradient-to-r hover:from-[#FF5722]/30 hover:to-[#FF9800]/30 transition-all shadow-lg`}
      title={`${showControls ? 'Hide Controls' : 'Show Controls'} (C)`}
      onMouseDown={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {showControls ? (
        <EyeOff className="w-4 h-4 md:w-5 md:h-5 text-white" />
      ) : (
        <Eye className="w-4 h-4 md:w-5 md:h-5 text-white" />
      )}
    </button>
  );

  // Save status indicator
  const SaveStatusIndicator = () => {
    if (!saveMessage) return null;
    
    return (
      <div className={`fixed ${isMobile ? 'top-16 right-4' : 'top-16 right-4'} z-40 px-3 py-1.5 bg-gradient-to-r ${isSaving ? 'from-[#FF9800]/20 to-[#FF5722]/20 border-[#FF9800]/30' : 'from-[#4CAF50]/20 to-[#8BC34A]/20 border-[#4CAF50]/30'} backdrop-blur-sm border rounded-lg transition-all duration-300 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          )}
          <span className="text-xs text-white">{saveMessage}</span>
        </div>
      </div>
    );
  };

  // Mobile quick controls
  const MobileQuickControls = () => (
    <div className={`fixed bottom-4 right-4 z-40 flex flex-col gap-2 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="p-3 rounded-full bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] shadow-lg"
        onTouchStart={handleUserInteraction}
      >
        {isPaused ? (
          <Play className="w-5 h-5 text-white" />
        ) : (
          <Pause className="w-5 h-5 text-white" />
        )}
      </button>
      <button
        onClick={toggleFullscreen}
        className="p-3 rounded-full bg-gradient-to-r from-[#2196F3] to-[#03A9F4] shadow-lg"
        onTouchStart={handleUserInteraction}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-white" />
        ) : (
          <Maximize2 className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );

  return (
    <div
      ref={gameContainerRef}
      className={`fixed inset-0 bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] z-50 overflow-hidden ${isFullscreen ? 'p-0' : 'p-1 md:p-2'}`}
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* Control Toggle Button */}
      <ControlToggleButton />
      
      {/* Save Status Indicator */}
      <SaveStatusIndicator />

      {/* Mobile Quick Controls */}
      {isMobile && <MobileQuickControls />}

      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 h-12 md:h-14 bg-gradient-to-r from-[#FF5722]/30 to-[#FF9800]/30 backdrop-blur-lg border-b border-[#FF5722]/40 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
        <div className="h-full px-2 md:px-4 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white rounded-lg md:rounded-xl hover:opacity-90 active:scale-95 transition-all font-bold text-xs md:text-sm shadow-lg"
              onMouseDown={handleUserInteraction}
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>

          {/* Center Section */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-[#FF5722]/30 via-[#FF9800]/30 to-[#FF5722]/30 rounded-lg md:rounded-xl border border-[#FF5722]/40 backdrop-blur-sm max-w-[200px] md:max-w-none">
              <h1 className="text-white font-bold text-sm md:text-lg tracking-wide flex items-center gap-1 md:gap-2 truncate">
                <Gamepad2 className="w-3 h-3 md:w-5 md:h-5 flex-shrink-0" />
                <span className="truncate">{gameTitle}</span>
              </h1>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Audio Controls */}
            <div className="relative flex items-center gap-1 md:gap-2">
              <button
                onClick={toggleMusic}
                className={`p-1.5 md:p-2 rounded-lg md:rounded-xl border transition-all ${isMusicPlaying ? 'bg-[#4CAF50]/20 border-[#4CAF50]/40 text-green-400' : 'bg-[#1A1A2E] border-[#FF5722]/40 text-gray-400'}`}
                onMouseDown={handleUserInteraction}
              >
                <Music className="w-3 h-3 md:w-4 md:h-4" />
              </button>

              {/* Volume Control */}
              <div className="relative">
                <button
                  onClick={toggleSound}
                  className="p-1.5 md:p-2 bg-[#1A1A2E] border border-[#FF5722]/40 rounded-lg md:rounded-xl hover:bg-[#16213E] transition-all relative"
                  onMouseDown={handleUserInteraction}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isMobile) setShowVolumeSlider(!showVolumeSlider);
                  }}
                >
                  {getVolumeIcon()}
                  <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-gradient-to-r from-[#FF5722] to-[#FF9800] rounded-full flex items-center justify-center text-[8px] md:text-xs font-bold text-white shadow">
                    {volumePercent}
                  </div>
                </button>

                {/* Volume Slider (Desktop) */}
                {showVolumeSlider && !isMobile && (
                  <div className="absolute bottom-full mb-2 right-0 w-36 md:w-48 p-3 md:p-4 bg-gradient-to-b from-[#1A1A2E] to-[#16213E] border border-[#FF5722]/40 rounded-xl shadow-2xl backdrop-blur-lg z-50">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm text-gray-300 font-medium">Volume</span>
                        <span className="text-white font-bold text-sm md:text-base">{volumePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume * 100}
                        onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                        className="w-full h-1.5 md:h-2 bg-gradient-to-r from-[#1A1A2E] to-[#FF5722] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 md:h-4 [&::-webkit-slider-thumb]:w-3 md:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#FF5722]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-1 md:gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-[#1A1A2E]/80 rounded-lg border border-[#FF5722]/30">
                <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                <span className="text-white font-bold text-sm md:text-base">{hearts}</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 bg-[#1A1A2E]/80 rounded-lg border border-[#FF5722]/30">
                <Trophy className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm md:text-base">{score}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className={`absolute ${isMobile ? 'top-12' : 'top-12 md:top-14'} bottom-0 left-0 right-0`}>
        <div className="w-full h-full overflow-auto p-1">
          <div className="w-full h-full flex items-start md:items-center justify-center">
            <div className="w-full max-w-4xl p-1 md:p-2">
              {React.cloneElement(gameComponent, {
                onGameEvent: handleGameEvent,
                isFullscreen: true,
                isPaused: isPaused
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Bottom Controls */}
      {!isMobile && (
        <div className={`absolute bottom-0 left-0 right-0 h-12 md:h-14 bg-gradient-to-r from-[#FF5722]/30 to-[#FF9800]/30 backdrop-blur-lg border-t border-[#FF5722]/40 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
          <div className="h-full px-3 md:px-4 flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] text-white rounded-lg md:rounded-xl hover:opacity-90 transition-all font-bold text-xs md:text-sm"
                onMouseDown={handleUserInteraction}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </button>
            </div>

            {/* Center Info */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                <span className="text-white font-mono">{formatTime(gameStats.timePlayed)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-[#2196F3] to-[#03A9F4] text-white rounded-lg md:rounded-xl hover:opacity-90 transition-all font-bold text-xs md:text-sm"
                onMouseDown={handleUserInteraction}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Exit FS</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4" onClick={() => setShowHelp(false)}>
          <div className="w-full max-w-sm md:max-w-md bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl md:rounded-2xl border-2 border-[#FF5722]/40 shadow-2xl p-4 md:p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white">Controls</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1.5 md:p-2 hover:bg-[#FF5722]/20 rounded-lg"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {[
                  { key: 'ESC', label: 'Exit Game' },
                  { key: 'F', label: 'Fullscreen' },
                  { key: 'M', label: 'Mute Sound' },
                  { key: 'Space', label: 'Pause/Play' },
                  { key: 'C', label: 'Toggle Controls' },
                  { key: 'S', label: 'Save Progress' },
                  { key: '0-9', label: 'Volume Levels' },
                ].map((item) => (
                  <div key={item.key} className="bg-[#1A1A2E]/50 rounded-lg p-2 md:p-3">
                    <div className="flex items-center gap-1 md:gap-2 mb-1">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-[#FF5722]/20 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs md:text-sm">{item.key}</span>
                      </div>
                      <span className="text-white font-medium text-xs md:text-sm">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 md:py-3 bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white rounded-lg md:rounded-xl font-bold hover:opacity-90 transition-all text-sm md:text-base"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlayer;