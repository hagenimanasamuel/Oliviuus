import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Zap, Clock, Users, Star, Target, Medal, Volume2, VolumeX, Crown, SkipForward, RotateCw, RefreshCw, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

const ShapeMatchGame = ({ onGameEvent, isFullscreen }) => {
  const [gameMode, setGameMode] = useState('practice');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(45);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState('🦊');
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedShapes, setSelectedShapes] = useState([]);
  const [board, setBoard] = useState([]);
  const [targetPattern, setTargetPattern] = useState([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [powerUps, setPowerUps] = useState({
    reveal: 2,
    shuffle: 2,
    extraTime: 1
  });
  
  const timerRef = useRef(null);
  const gameContainerRef = useRef(null);

  const shapes = [
    { id: 1, emoji: '🔺', name: 'Triangle', color: '#FF6B6B' },
    { id: 2, emoji: '🔵', name: 'Circle', color: '#4ECDC4' },
    { id: 3, emoji: '🟦', name: 'Square', color: '#45B7D1' },
    { id: 4, emoji: '⭐', name: 'Star', color: '#FFD166' },
    { id: 5, emoji: '❤️', name: 'Heart', color: '#FF6B9D' },
    { id: 6, emoji: '🔶', name: 'Diamond', color: '#A13E97' },
    { id: 7, emoji: '🌙', name: 'Moon', color: '#96CEB4' },
    { id: 8, emoji: '⚡', name: 'Zap', color: '#FFE066' },
  ];

  const characters = [
    { emoji: '🦊', name: 'Foxy' },
    { emoji: '🐼', name: 'Panda' },
    { emoji: '🦁', name: 'Leo' },
    { emoji: '🐨', name: 'Koala' }
  ];

  const generateBoard = (lvl) => {
    const boardSize = Math.min(4 + Math.floor(lvl / 2), 6);
    const shapeCount = Math.min(4 + Math.floor(lvl / 3), 8);
    const availableShapes = shapes.slice(0, shapeCount);
    
    // Create pairs
    let shapePool = [];
    for (let i = 0; i < (boardSize * boardSize) / 2; i++) {
      const shape = availableShapes[i % availableShapes.length];
      shapePool.push({ ...shape, uniqueId: `${shape.id}-${i}-a` });
      shapePool.push({ ...shape, uniqueId: `${shape.id}-${i}-b` });
    }
    
    // Shuffle
    shapePool = shapePool.sort(() => Math.random() - 0.5);
    
    // Create board matrix
    const newBoard = [];
    for (let i = 0; i < boardSize; i++) {
      const row = [];
      for (let j = 0; j < boardSize; j++) {
        const shape = shapePool[i * boardSize + j];
        row.push({
          ...shape,
          row: i,
          col: j,
          isMatched: false,
          isRevealed: false
        });
      }
      newBoard.push(row);
    }
    
    setBoard(newBoard);
    setSelectedShapes([]);
    setMatches(0);
    setMoves(0);
    
    // Generate target pattern for advanced mode
    if (gameMode === 'pattern') {
      generateTargetPattern(availableShapes);
    }
  };

  const generateTargetPattern = (availableShapes) => {
    const patternLength = Math.min(3 + Math.floor(level / 2), 6);
    const pattern = [];
    
    for (let i = 0; i < patternLength; i++) {
      const randomShape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
      pattern.push(randomShape);
    }
    
    setTargetPattern(pattern);
  };

  useEffect(() => {
    generateBoard(level);
  }, [level, gameMode]);

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

  const handleShapeClick = (shape) => {
    if (isProcessing || shape.isMatched || shape.isRevealed) return;
    
    // In practice/timed mode, we're doing matching pairs
    if (gameMode === 'practice' || gameMode === 'timed' || gameMode === 'multiplayer') {
      if (selectedShapes.length >= 2) return;
      
      const newSelected = [...selectedShapes, shape];
      setSelectedShapes(newSelected);
      
      // Reveal the shape
      const newBoard = [...board];
      newBoard[shape.row][shape.col].isRevealed = true;
      setBoard(newBoard);
      
      if (newSelected.length === 2) {
        setIsProcessing(true);
        setTimeout(() => checkMatch(newSelected), 500);
      }
    } 
    // In pattern mode, we're checking against target pattern
    else if (gameMode === 'pattern') {
      if (shape.emoji === targetPattern[matches].emoji) {
        handleCorrectMatch(shape);
      } else {
        handleWrongMatch();
      }
    }
  };

  const checkMatch = (selectedPair) => {
    const [first, second] = selectedPair;
    const isMatch = first.id === second.id;
    
    setMoves(moves + 1);
    
    if (isMatch) {
      handleCorrectMatch(first);
    } else {
      handleWrongMatch();
    }
    
    setIsProcessing(false);
  };

  const handleCorrectMatch = (matchedShape) => {
    const points = level * 15 + streak * 5;
    const newScore = score + (gameMode === 'timed' ? points * 2 : points);
    setScore(newScore);
    
    const newMatches = matches + 1;
    setMatches(newMatches);
    
    setStreak(s => s + 1);
    
    if (streak + 1 >= 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
    
    // Update board to show matched shapes
    const newBoard = [...board];
    selectedShapes.forEach(shape => {
      newBoard[shape.row][shape.col].isMatched = true;
    });
    setBoard(newBoard);
    
    setSelectedShapes([]);
    
    const funnyMessages = [
      "🎉 Perfect Match!",
      "🌟 Shape Master!",
      "✨ Awesome!",
      "🎪 Super Find!",
      "🧩 Pattern Pro!",
      "🎯 Bullseye!"
    ];
    
    setFeedback(`${funnyMessages[Math.floor(Math.random() * funnyMessages.length)]} +${points}`);
    setIsCorrect(true);
    
    // Check if level complete
    const totalPairs = (board.length * board.length) / 2;
    if (newMatches >= totalPairs || (gameMode === 'pattern' && newMatches >= targetPattern.length)) {
      if (streak + 1 >= 5) {
        const newLives = Math.min(lives + 1, 5);
        setLives(newLives);
        setFeedback(prev => `${prev} 🏆 +1 Heart!`);
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
      
      if ((level + 1) % 3 === 0) {
        setLives(prev => Math.min(prev + 1, 5));
      }
      
      setTimeout(() => {
        setLevel(prev => prev + 1);
        setFeedback("🚀 Level Up!");
      }, 1500);
    }
    
    onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
    
    if (gameMode === 'timed') {
      setTimeLeft(prev => prev + 5);
    }
  };

  const handleWrongMatch = () => {
    const newLives = lives - 1;
    setLives(newLives);
    setStreak(0);
    
    setFeedback("❌ Try again!");
    setIsCorrect(false);
    
    // Hide the selected shapes after delay
    setTimeout(() => {
      const newBoard = [...board];
      selectedShapes.forEach(shape => {
        newBoard[shape.row][shape.col].isRevealed = false;
      });
      setBoard(newBoard);
      setSelectedShapes([]);
    }, 1000);
    
    if (newLives <= 0) {
      setTimeout(() => setGameOver(true), 1200);
    }
    
    onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
  };

  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'reveal':
        setShowHint(true);
        setTimeout(() => setShowHint(false), 3000);
        setFeedback("🔍 Hint activated!");
        break;
      case 'shuffle':
        generateBoard(level);
        setFeedback("🌀 Board shuffled!");
        break;
      case 'extraTime':
        setTimeLeft(prev => prev + 15);
        setFeedback("⏰ +15 seconds!");
        break;
    }
  };

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFeedback("");
    setStreak(0);
    setTimeLeft(45);
    setOpponentScore(0);
    setPowerUps({
      reveal: 2,
      shuffle: 2,
      extraTime: 1
    });
    generateBoard(1);
    
    onGameEvent?.({ type: 'scoreUpdate', payload: 0 });
    onGameEvent?.({ type: 'heartsUpdate', payload: 3 });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'r' || e.key === 'R') usePowerUp('shuffle');
    if (e.key === 'h' || e.key === 'H') usePowerUp('reveal');
    if (e.key === ' ') setShowHint(!showHint);
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Game Over Screen
  if (gameOver) {
    return (
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'min-h-[400px]'} p-3 w-full`}>
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#4ECDC4]/30">
          <div className="text-4xl mb-3 text-center">🧩</div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Game Complete!</h1>
          <p className="text-gray-300 mb-4 text-sm text-center">You matched {matches} shapes!</p>
          
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
              <div className="text-lg font-bold text-white text-center">{matches}</div>
              <div className="text-gray-400 text-xs text-center">Matched</div>
            </div>
          </div>
          
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white font-bold hover:opacity-90 text-sm"
          >
            🔄 Play Again
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
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-lg animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {['✨', '🎉'][i % 2]}
            </div>
          ))}
        </div>
      )}

      <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#4ECDC4]/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1]`}>
              <span className="text-lg">{selectedCharacter}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Shape Match</h1>
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
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#4ECDC4]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#4ECDC4]/20 rounded-lg hover:bg-[#4ECDC4]/10 transition-colors"
            >
              {soundEnabled ? 
                <Volume2 className="w-4 h-4 text-green-400" /> : 
                <VolumeX className="w-4 h-4 text-gray-400" />
              }
            </button>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setGameMode('practice')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'practice' ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            Practice
          </button>
          <button
            onClick={() => setGameMode('timed')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'timed' ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Clock className="inline w-3 h-3 mr-1" />
            Timed
          </button>
          <button
            onClick={() => setGameMode('pattern')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'pattern' ? 'bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            Pattern
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
                className="bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] h-1.5 rounded-full transition-all"
                style={{ width: `${(timeLeft / 45) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Pattern Target Display */}
        {gameMode === 'pattern' && targetPattern.length > 0 && (
          <div className="mb-3 bg-gradient-to-r from-[#4ECDC4]/10 to-[#45B7D1]/10 rounded-lg p-2 border border-[#4ECDC4]/20">
            <div className="text-xs text-gray-400 mb-1">Match this pattern:</div>
            <div className="flex items-center justify-center gap-2">
              {targetPattern.map((shape, index) => (
                <div 
                  key={index}
                  className={`p-1.5 rounded-lg ${index < matches ? 'bg-[#4ECDC4]/20' : 'bg-[#1A1A2E]'}`}
                >
                  <span className="text-xl">{shape.emoji}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress & Stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-600'}`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Matches:</span>
              <span className="font-bold text-white">{matches}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Moves:</span>
              <span className="font-bold text-white">{moves}</span>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="mb-3 flex justify-center">
          <div className="grid gap-1.5 p-3 bg-[#1A1A2E]/50 rounded-lg border border-[#4ECDC4]/20"
               style={{ 
                 gridTemplateColumns: `repeat(${board.length}, 1fr)`,
                 maxWidth: 'min(100%, 400px)'
               }}>
            {board.flat().map((cell) => (
              <button
                key={cell.uniqueId}
                onClick={() => handleShapeClick(cell)}
                disabled={cell.isMatched || isProcessing}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl transition-all ${
                  cell.isMatched
                    ? 'bg-gradient-to-br from-[#4ECDC4] to-[#45B7D1]'
                    : cell.isRevealed || showHint
                    ? 'bg-[#16213E] border border-[#4ECDC4]/50'
                    : 'bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#4ECDC4]/30 hover:border-[#FFD166] hover:scale-105'
                } ${selectedShapes.some(s => s.uniqueId === cell.uniqueId) ? 'scale-95 ring-2 ring-yellow-400' : ''}`}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '55px',
                  minWidth: '55px'
                }}
              >
                {cell.isMatched || cell.isRevealed || showHint ? cell.emoji : '?'}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-3 text-center">
          <div className="text-xs text-gray-400">
            {gameMode === 'pattern' 
              ? 'Click shapes in the target pattern order!' 
              : 'Find matching shape pairs!'}
          </div>
        </div>

        {/* Power-ups */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => usePowerUp('reveal')}
            disabled={powerUps.reveal <= 0}
            className={`flex-1 p-2 rounded-lg border text-xs ${powerUps.reveal <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#FFD166]/30 text-white hover:bg-[#FFD166]/10 transition-colors'}`}
          >
            <div className="text-sm">🔍</div>
            <div>Reveal</div>
            <div className="text-xs text-gray-400">x{powerUps.reveal}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('shuffle')}
            disabled={powerUps.shuffle <= 0}
            className={`flex-1 p-2 rounded-lg border text-xs ${powerUps.shuffle <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#FF6B6B]/30 text-white hover:bg-[#FF6B6B]/10 transition-colors'}`}
          >
            <div className="text-sm">🌀</div>
            <div>Shuffle</div>
            <div className="text-xs text-gray-400">x{powerUps.shuffle}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('extraTime')}
            disabled={powerUps.extraTime <= 0 || gameMode !== 'timed'}
            className={`flex-1 p-2 rounded-lg border text-xs ${powerUps.extraTime <= 0 || gameMode !== 'timed' ? 'border-gray-600/30 text-gray-500' : 'border-[#A13E97]/30 text-white hover:bg-[#A13E97]/10 transition-colors'}`}
          >
            <div className="text-sm">⏰</div>
            <div>+15s</div>
            <div className="text-xs text-gray-400">x{powerUps.extraTime}</div>
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-lg p-2 text-center text-sm font-bold mb-2 ${
            isCorrect 
              ? 'bg-gradient-to-r from-[#4ECDC4]/10 to-[#45B7D1]/10 text-[#4ECDC4]'
              : 'bg-gradient-to-r from-[#FF6B6B]/10 to-[#FF6B9D]/10 text-[#FF6B6B]'
          }`}>
            {feedback}
          </div>
        )}

        {/* Controls Info */}
        <div className="mt-3 pt-2 border-t border-[#4ECDC4]/10">
          <div className="grid grid-cols-3 gap-1 text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1">
              <span>🔍</span>
              <span>H = Hint</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span>🌀</span>
              <span>R = Shuffle</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span>🏆</span>
              <span>3-streak</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShapeMatchGame;