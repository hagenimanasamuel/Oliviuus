import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Clock, Volume2, VolumeX, Palette, Brush, Droplets, Sparkles, Target, Zap, RotateCw, RefreshCw } from 'lucide-react';

const ColorQuestGame = ({ onGameEvent, isFullscreen }) => {
  const [gameMode, setGameMode] = useState('identify');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState('🎨');
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [colorOptions, setColorOptions] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorObjects, setColorObjects] = useState([]);
  const [mixResult, setMixResult] = useState(null);
  const [bucketColor, setBucketColor] = useState('');
  const [drops, setDrops] = useState([]);
  const [paintSplats, setPaintSplats] = useState([]);
  
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const gameContainerRef = useRef(null);

  const colorPalette = [
    { name: 'Red', hex: '#FF6B6B', emoji: '🔴', lightHex: '#FFB3B3' },
    { name: 'Blue', hex: '#4ECDC4', emoji: '🔵', lightHex: '#A6E3E9' },
    { name: 'Yellow', hex: '#FFD166', emoji: '🟡', lightHex: '#FFE8A5' },
    { name: 'Green', hex: '#06D6A0', emoji: '🟢', lightHex: '#8CFFE1' },
    { name: 'Purple', hex: '#A13E97', emoji: '🟣', lightHex: '#D9A8D9' },
    { name: 'Orange', hex: '#FF9A76', emoji: '🟠', lightHex: '#FFC8B4' },
    { name: 'Pink', hex: '#FF6B9D', emoji: '💖', lightHex: '#FFB8D9' },
    { name: 'Brown', hex: '#8B4513', emoji: '🟤', lightHex: '#D2691E' },
  ];

  const colorMixes = {
    'Red + Blue': 'Purple',
    'Blue + Yellow': 'Green',
    'Red + Yellow': 'Orange',
    'Red + White': 'Pink',
    'Blue + White': 'Light Blue',
    'Yellow + Blue + Red': 'Brown',
  };

  const colorObjectsList = [
    { color: 'Red', items: ['🍎', '🚗', '❤️', '🎈', '🍓'] },
    { color: 'Blue', items: ['🌊', '🐳', '💙', '🦋', '🔵'] },
    { color: 'Yellow', items: ['🌻', '🍋', '⭐', '🌞', '🦆'] },
    { color: 'Green', items: ['🌿', '🐸', '🍏', '🐢', '🥦'] },
    { color: 'Purple', items: ['🍇', '👑', '🟣', '🍆', '🌂'] },
    { color: 'Orange', items: ['🍊', '🎃', '🦊', '🔥', '🧡'] },
  ];

  const characters = [
    { emoji: '🎨', name: 'Arty' },
    { emoji: '🦄', name: 'Rainbow' },
    { emoji: '🐙', name: 'Inky' },
    { emoji: '🦚', name: 'Peacock' }
  ];

  // Initialize game based on mode
  useEffect(() => {
    initializeGame();
  }, [level, gameMode]);

  const initializeGame = () => {
    setSelectedColor(null);
    setFeedback("");
    setIsCorrect(null);
    setMixResult(null);
    setBucketColor('');
    setDrops([]);
    setPaintSplats([]);

    switch(gameMode) {
      case 'identify':
        generateColorQuestion();
        break;
      case 'mix':
        generateMixingQuestion();
        break;
      case 'sort':
        generateSortingObjects();
        break;
      case 'paint':
        generatePaintQuestion();
        break;
    }
  };

  const generateColorQuestion = () => {
    const availableColors = colorPalette.slice(0, Math.min(3 + level, 8));
    const correctColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    
    // Create options (correct + random incorrect)
    const options = [correctColor];
    while(options.length < 4) {
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      if (!options.find(opt => opt.name === randomColor.name)) {
        options.push(randomColor);
      }
    }
    
    // Shuffle options
    setColorOptions(options.sort(() => Math.random() - 0.5));
    setCurrentQuestion({
      type: 'identify',
      targetColor: correctColor,
      question: `What color is this?`,
      colorHex: correctColor.hex
    });
  };

  const generateMixingQuestion = () => {
    const mixKeys = Object.keys(colorMixes);
    const randomMix = mixKeys[Math.floor(Math.random() * mixKeys.length)];
    const result = colorMixes[randomMix];
    
    const [color1, color2] = randomMix.split(' + ');
    const color1Obj = colorPalette.find(c => c.name === color1);
    const color2Obj = colorPalette.find(c => c.name === color2);
    const resultObj = colorPalette.find(c => c.name === result) || { name: result, hex: '#FFFFFF' };
    
    setCurrentQuestion({
      type: 'mix',
      color1: color1Obj,
      color2: color2Obj,
      result: resultObj,
      question: `What do ${color1} and ${color2} make?`
    });
    
    // Generate options
    const options = [resultObj];
    while(options.length < 4) {
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      if (!options.find(opt => opt.name === randomColor.name)) {
        options.push(randomColor);
      }
    }
    setColorOptions(options.sort(() => Math.random() - 0.5));
  };

  const generateSortingObjects = () => {
    const targetColor = colorObjectsList[Math.floor(Math.random() * colorObjectsList.length)];
    const objects = [];
    
    // Add correct objects
    targetColor.items.forEach(item => {
      objects.push({ item, correct: true, color: targetColor.color });
    });
    
    // Add incorrect objects from other colors
    const otherColors = colorObjectsList.filter(c => c.color !== targetColor.color);
    for(let i = 0; i < 3; i++) {
      const randomColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      const randomItem = randomColor.items[Math.floor(Math.random() * randomColor.items.length)];
      objects.push({ item: randomItem, correct: false, color: randomColor.color });
    }
    
    // Shuffle objects
    setColorObjects(objects.sort(() => Math.random() - 0.5));
    setCurrentQuestion({
      type: 'sort',
      targetColor: targetColor,
      question: `Find all ${targetColor.color.toLowerCase()} items!`
    });
  };

  const generatePaintQuestion = () => {
    const targetColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    setBucketColor(targetColor.hex);
    
    // Generate random drops
    const newDrops = [];
    const dropColors = colorPalette.filter(c => c.name !== targetColor.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    dropColors.forEach((color, index) => {
      newDrops.push({
        id: index,
        color: color.hex,
        emoji: color.emoji,
        x: 20 + (index * 25),
        y: 50
      });
    });
    
    setDrops(newDrops);
    setCurrentQuestion({
      type: 'paint',
      targetColor: targetColor,
      question: `Paint with ${targetColor.name.toLowerCase()}!`
    });
  };

  // Timer
  useEffect(() => {
    if (gameMode === 'timed' && !gameOver && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, gameOver, timeLeft]);

  const handleColorSelect = (color) => {
    if (isCorrect !== null) return;
    
    setSelectedColor(color);
    
    let isCorrectAnswer = false;
    switch(gameMode) {
      case 'identify':
        isCorrectAnswer = color.name === currentQuestion.targetColor.name;
        break;
      case 'mix':
        isCorrectAnswer = color.name === currentQuestion.result.name;
        break;
    }
    
    checkAnswer(isCorrectAnswer, color);
  };

  const handleObjectSelect = (object, index) => {
    if (isCorrect !== null) return;
    
    const isCorrectAnswer = object.correct;
    checkAnswer(isCorrectAnswer);
    
    // Visual feedback
    const newSplats = [...paintSplats];
    newSplats.push({
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      color: object.correct ? '#06D6A0' : '#FF6B6B',
      emoji: object.correct ? '✅' : '❌'
    });
    setPaintSplats(newSplats);
    
    // Remove object from list if correct
    if (isCorrectAnswer) {
      const newObjects = [...colorObjects];
      newObjects.splice(index, 1);
      setColorObjects(newObjects);
    }
  };

  const handleDropSelect = (drop) => {
    if (isCorrect !== null) return;
    
    const isCorrectAnswer = drop.color === bucketColor;
    checkAnswer(isCorrectAnswer);
    
    // Animate drop
    const newDrops = drops.map(d => 
      d.id === drop.id ? { ...d, y: 80, falling: true } : d
    );
    setDrops(newDrops);
    
    // Reset after animation
    setTimeout(() => {
      if (isCorrectAnswer) {
        initializeGame();
      }
    }, 500);
  };

  const checkAnswer = (correct, selectedColor = null) => {
    setIsCorrect(correct);
    
    if (correct) {
      const points = level * 10 + streak * 5;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      const funnyMessages = [
        "🎨 Color Genius!",
        "🌈 Perfect Match!",
        "✨ You're a Rainbow!",
        "🖌️ Master Painter!",
        "🌟 Color Wizard!",
        "🎯 Bullseye!"
      ];
      
      setFeedback(`${funnyMessages[Math.floor(Math.random() * funnyMessages.length)]} +${points}`);
      
      if (streak + 1 >= 5) {
        const newLives = Math.min(lives + 1, 5);
        setLives(newLives);
        setFeedback(prev => `${prev} 💖 +1 Heart!`);
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
      
      if ((score + 1) % 5 === 0) {
        setLevel(prev => {
          const newLevel = prev + 1;
          setFeedback(prev => `${prev} 🚀 Level Up!`);
          return newLevel;
        });
      }
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
      if (gameMode === 'timed') {
        setTimeLeft(prev => prev + 5);
      }
      
      // Move to next question after delay
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedColor(null);
        initializeGame();
      }, 1500);
      
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      
      setFeedback(`❌ Try again! ${selectedColor ? `It's ${currentQuestion.targetColor.name}!` : ''}`);
      
      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 1200);
      }
      
      onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      
      // Reset after delay
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedColor(null);
      }, 1500);
    }
  };

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFeedback("");
    setStreak(0);
    setTimeLeft(60);
    initializeGame();
    
    onGameEvent?.({ type: 'scoreUpdate', payload: 0 });
    onGameEvent?.({ type: 'heartsUpdate', payload: 3 });
  };

  // Game Over Screen
  if (gameOver) {
    return (
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'min-h-[400px]'} p-3 w-full`}>
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#FF6B9D]/30">
          <div className="text-4xl mb-3 text-center">🌈</div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Color Quest Complete!</h1>
          <p className="text-gray-300 mb-4 text-sm text-center">You're a color master!</p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{score}</div>
              <div className="text-gray-400 text-xs text-center">Score</div>
            </div>
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{level}</div>
              <div className="text-gray-400 text-xs text-center">Level</div>
            </div>
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{streak}</div>
              <div className="text-gray-400 text-xs text-center">Streak</div>
            </div>
          </div>
          
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76] text-white font-bold hover:opacity-90 text-sm"
          >
            🎨 Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gameContainerRef}
      className={`${isFullscreen ? 'h-full overflow-auto' : 'min-h-[450px]'} p-2 w-full`}
    >
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.05}s`,
                color: colorPalette[i % colorPalette.length].hex
              }}
            >
              {'🌈✨🎨🖌️🎯'[i % 5]}
            </div>
          ))}
        </div>
      )}

      <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#FF6B9D]/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76]`}>
              <span className="text-lg">{selectedCharacter}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Color Quest</h1>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Lvl {level}</span>
                {streak > 0 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-yellow-400">{streak}🔥</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#FF6B9D]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#FF6B9D]/20 rounded-lg hover:bg-[#FF6B9D]/10 transition-colors"
            >
              {soundEnabled ? 
                <Volume2 className="w-4 h-4 text-green-400" /> : 
                <VolumeX className="w-4 h-4 text-gray-400" />
              }
            </button>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => { setGameMode('identify'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'identify' ? 'bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Palette className="inline w-3 h-3 mr-1" />
            Identify
          </button>
          <button
            onClick={() => { setGameMode('mix'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'mix' ? 'bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Droplets className="inline w-3 h-3 mr-1" />
            Mix
          </button>
          <button
            onClick={() => { setGameMode('sort'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'sort' ? 'bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Sparkles className="inline w-3 h-3 mr-1" />
            Sort
          </button>
          <button
            onClick={() => { setGameMode('paint'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'paint' ? 'bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Brush className="inline w-3 h-3 mr-1" />
            Paint
          </button>
        </div>

        {/* Timed Mode Timer */}
        {gameMode === 'timed' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Time Left:</span>
              <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-[#FF6B9D] to-[#FF9A76] h-1.5 rounded-full transition-all"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Lives */}
        <div className="flex items-center justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-600'}`}
            />
          ))}
        </div>

        {/* Main Game Area */}
        <div className="space-y-4">
          {/* Question Display */}
          {currentQuestion && (
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold text-white mb-1">
                {currentQuestion.question}
              </h2>
              
              {/* Color Display for Identify Mode */}
              {gameMode === 'identify' && currentQuestion.colorHex && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 mb-3">
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-white/20 shadow-lg"
                    style={{ backgroundColor: currentQuestion.colorHex }}
                  ></div>
                  <div className="text-center md:text-left">
                    <div className="text-sm text-gray-400">Color Sample</div>
                    <div className="text-white font-bold">{currentQuestion.targetColor.name}</div>
                  </div>
                </div>
              )}
              
              {/* Color Mix Display */}
              {gameMode === 'mix' && currentQuestion.color1 && currentQuestion.color2 && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-2 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: currentQuestion.color1.hex }}
                    title={currentQuestion.color1.name}
                  ></div>
                  <div className="text-2xl">+</div>
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                    style={{ backgroundColor: currentQuestion.color2.hex }}
                    title={currentQuestion.color2.name}
                  ></div>
                  <div className="text-2xl">=</div>
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-white/20 border-dashed"
                    style={{ backgroundColor: isCorrect !== null ? currentQuestion.result.hex : '#2D3047' }}
                    title={isCorrect !== null ? currentQuestion.result.name : '?'}
                  >
                    {isCorrect !== null && (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        {currentQuestion.result.emoji}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Paint Bucket Display */}
              {gameMode === 'paint' && bucketColor && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Paint Bucket</div>
                    <div 
                      className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-4 border-white/20 relative overflow-hidden mx-auto"
                      style={{ backgroundColor: bucketColor }}
                    >
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gray-800/30"></div>
                      {drops.map(drop => drop.falling && (
                        <div
                          key={drop.id}
                          className="absolute w-4 h-4 rounded-full animate-bounce"
                          style={{
                            backgroundColor: drop.color,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            animationDuration: '0.5s'
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Color Drops</div>
                    <div className="flex gap-2 justify-center">
                      {drops.map(drop => (
                        <button
                          key={drop.id}
                          onClick={() => handleDropSelect(drop)}
                          disabled={isCorrect !== null}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-lg hover:scale-110 transition-transform"
                          style={{ backgroundColor: drop.color }}
                        >
                          {drop.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Game Content */}
          {gameMode === 'identify' || gameMode === 'mix' ? (
            // Color Options Grid
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {colorOptions.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleColorSelect(color)}
                  disabled={isCorrect !== null}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    selectedColor?.name === color.name
                      ? isCorrect === true
                        ? 'border-green-500 bg-green-500/10'
                        : isCorrect === false
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-[#FF6B9D] bg-[#FF6B9D]/10'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full border border-white/30"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <span className="text-white font-bold text-sm">{color.name}</span>
                  <span className="text-lg">{color.emoji}</span>
                </button>
              ))}
            </div>
          ) : gameMode === 'sort' ? (
            // Sorting Objects Grid
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-3">
              {colorObjects.map((obj, index) => (
                <button
                  key={index}
                  onClick={() => handleObjectSelect(obj, index)}
                  disabled={isCorrect !== null}
                  className={`p-3 rounded-lg border-2 transition-all text-2xl hover:scale-105 ${
                    obj.correct
                      ? 'border-[#06D6A0]/50 bg-[#06D6A0]/10 hover:bg-[#06D6A0]/20'
                      : 'border-gray-700 bg-gray-800/30 hover:bg-gray-700/50'
                  }`}
                >
                  {obj.item}
                </button>
              ))}
            </div>
          ) : null}

          {/* Paint Splats Animation */}
          {paintSplats.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {paintSplats.map((splat, index) => (
                <div
                  key={index}
                  className="absolute text-2xl animate-ping"
                  style={{
                    left: `${splat.x}%`,
                    top: `${splat.y}%`,
                    color: splat.color,
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {splat.emoji}
                </div>
              ))}
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`rounded-lg p-2 text-center text-sm font-bold mb-2 ${
              isCorrect === true
                ? 'bg-gradient-to-r from-[#06D6A0]/10 to-[#4ECDC4]/10 text-[#06D6A0]'
                : isCorrect === false
                ? 'bg-gradient-to-r from-[#FF6B6B]/10 to-[#FF6B9D]/10 text-[#FF6B6B]'
                : 'bg-gradient-to-r from-[#FFD166]/10 to-[#FF9A76]/10 text-[#FFD166]'
            }`}>
              {feedback}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={initializeGame}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white text-sm font-bold hover:opacity-90"
            >
              🔄 New Color
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setLevel(prev => Math.max(1, prev - 1))}
                className="flex-1 py-2 rounded-lg bg-[#1A1A2E] border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-600"
              >
                ⬇️ Easier
              </button>
              <button
                onClick={() => setLevel(prev => prev + 1)}
                className="flex-1 py-2 rounded-lg bg-[#1A1A2E] border border-gray-700 text-gray-400 text-sm hover:text-white hover:border-gray-600"
              >
                ⬆️ Harder
              </button>
            </div>
          </div>

          {/* Color Palette Guide */}
          <div className="mt-4 pt-3 border-t border-[#FF6B9D]/10">
            <div className="text-xs text-gray-400 mb-2 text-center">Color Palette:</div>
            <div className="flex flex-wrap gap-1 justify-center">
              {colorPalette.slice(0, 6).map(color => (
                <div
                  key={color.name}
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/20 tooltip"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorQuestGame;