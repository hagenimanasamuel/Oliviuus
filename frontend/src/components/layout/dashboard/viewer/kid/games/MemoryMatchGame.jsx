import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Clock, Volume2, VolumeX, Brain, Star, Zap, RotateCw, RefreshCw, Eye, EyeOff } from 'lucide-react';

const MemoryMatchGame = ({ onGameEvent, isFullscreen }) => {
  const [gameMode, setGameMode] = useState('animals');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState('🧠');
  
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [gameTheme, setGameTheme] = useState('animals');
  const [difficulty, setDifficulty] = useState(4); // 2x2 grid
  
  const timerRef = useRef(null);
  const gameContainerRef = useRef(null);

  const themes = {
    animals: {
      name: 'Animals',
      cards: [
        { id: 1, emoji: '🐱', name: 'Cat' },
        { id: 2, emoji: '🐶', name: 'Dog' },
        { id: 3, emoji: '🦁', name: 'Lion' },
        { id: 4, emoji: '🐯', name: 'Tiger' },
        { id: 5, emoji: '🦊', name: 'Fox' },
        { id: 6, emoji: '🐼', name: 'Panda' },
        { id: 7, emoji: '🐨', name: 'Koala' },
        { id: 8, emoji: '🦄', name: 'Unicorn' },
        { id: 9, emoji: '🐸', name: 'Frog' },
        { id: 10, emoji: '🐙', name: 'Octopus' },
      ]
    },
    fruits: {
      name: 'Fruits',
      cards: [
        { id: 1, emoji: '🍎', name: 'Apple' },
        { id: 2, emoji: '🍌', name: 'Banana' },
        { id: 3, emoji: '🍇', name: 'Grapes' },
        { id: 4, emoji: '🍓', name: 'Strawberry' },
        { id: 5, emoji: '🍊', name: 'Orange' },
        { id: 6, emoji: '🍍', name: 'Pineapple' },
        { id: 7, emoji: '🥭', name: 'Mango' },
        { id: 8, emoji: '🍉', name: 'Watermelon' },
        { id: 9, emoji: '🍒', name: 'Cherry' },
        { id: 10, emoji: '🥝', name: 'Kiwi' },
      ]
    },
    vehicles: {
      name: 'Vehicles',
      cards: [
        { id: 1, emoji: '🚗', name: 'Car' },
        { id: 2, emoji: '🚌', name: 'Bus' },
        { id: 3, emoji: '✈️', name: 'Airplane' },
        { id: 4, emoji: '🚂', name: 'Train' },
        { id: 5, emoji: '🚁', name: 'Helicopter' },
        { id: 6, emoji: '🚢', name: 'Ship' },
        { id: 7, emoji: '🚀', name: 'Rocket' },
        { id: 8, emoji: '🛸', name: 'UFO' },
        { id: 9, emoji: '🚜', name: 'Tractor' },
        { id: 10, emoji: '🏎️', name: 'Race Car' },
      ]
    },
    shapes: {
      name: 'Shapes',
      cards: [
        { id: 1, emoji: '🔺', name: 'Triangle' },
        { id: 2, emoji: '🔵', name: 'Circle' },
        { id: 3, emoji: '🟦', name: 'Square' },
        { id: 4, emoji: '⭐', name: 'Star' },
        { id: 5, emoji: '❤️', name: 'Heart' },
        { id: 6, emoji: '🔶', name: 'Diamond' },
        { id: 7, emoji: '🌙', name: 'Moon' },
        { id: 8, emoji: '⚡', name: 'Lightning' },
        { id: 9, emoji: '❄️', name: 'Snowflake' },
        { id: 10, emoji: '🎈', name: 'Balloon' },
      ]
    }
  };

  const characters = [
    { emoji: '🧠', name: 'Brainy' },
    { emoji: '🦉', name: 'Wise Owl' },
    { emoji: '🐘', name: 'Elephant' },
    { emoji: '🦋', name: 'Butterfly' }
  ];

  // Initialize game board
  useEffect(() => {
    initializeGame();
  }, [level, gameTheme]);

  const initializeGame = () => {
    // Calculate grid size based on level
    const gridSize = Math.min(4 + Math.floor(level / 2), 6); // 2x2 to 6x6
    const totalPairs = Math.min((gridSize * gridSize) / 2, themes[gameTheme].cards.length);
    
    // Select cards for this round
    const selectedCards = themes[gameTheme].cards.slice(0, totalPairs);
    
    // Create pairs
    let cardPairs = [];
    selectedCards.forEach(card => {
      cardPairs.push({ ...card, pairId: card.id * 2 - 1 });
      cardPairs.push({ ...card, pairId: card.id * 2 });
    });
    
    // Shuffle cards
    cardPairs = cardPairs
      .map(card => ({ ...card, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((card, index) => ({
        ...card,
        id: index,
        flipped: false,
        matched: false,
        row: Math.floor(index / gridSize),
        col: index % gridSize
      }));
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setShowAllCards(true);
    setDifficulty(gridSize);
    
    // Show all cards briefly at start
    setTimeout(() => {
      setShowAllCards(false);
      setCards(prev => prev.map(card => ({ ...card, flipped: false })));
    }, 2000);
  };

  // Handle card click
  const handleCardClick = (card) => {
    if (isProcessing || card.flipped || card.matched || flippedCards.length >= 2) return;
    
    // Flip the card
    const newCards = [...cards];
    newCards[card.id].flipped = true;
    setCards(newCards);
    
    const newFlippedCards = [...flippedCards, card];
    setFlippedCards(newFlippedCards);
    
    // If two cards are flipped, check for match
    if (newFlippedCards.length === 2) {
      setIsProcessing(true);
      setMoves(prev => prev + 1);
      
      setTimeout(() => {
        checkMatch(newFlippedCards);
      }, 800);
    }
  };

  const checkMatch = (flippedPair) => {
    const [card1, card2] = flippedPair;
    const isMatch = card1.pairId === card2.pairId || card1.emoji === card2.emoji;
    
    if (isMatch) {
      // Match found
      const newCards = [...cards];
      newCards[card1.id].matched = true;
      newCards[card2.id].matched = true;
      setCards(newCards);
      
      const newMatchedPairs = [...matchedPairs, card1.id, card2.id];
      setMatchedPairs(newMatchedPairs);
      
      // Award points
      const points = Math.max(100 - moves * 2, 20) + level * 10 + streak * 5;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      const funnyMessages = [
        "🧠 Memory Master!",
        "🌟 Super Match!",
        "🎯 Perfect Recall!",
        "✨ Amazing Memory!",
        "🏆 Brain Power!",
        "🎉 Match Found!"
      ];
      
      setFeedback(`${funnyMessages[Math.floor(Math.random() * funnyMessages.length)]} +${points}`);
      
      // Check if level complete
      if (newMatchedPairs.length >= cards.length) {
        handleLevelComplete();
      }
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
    } else {
      // No match - flip cards back
      const newCards = [...cards];
      newCards[card1.id].flipped = false;
      newCards[card2.id].flipped = false;
      setCards(newCards);
      
      setStreak(0);
      
      // Lose a life occasionally on higher levels
      if (level >= 3 && moves % 5 === 0 && flippedCards.length === 2) {
        const newLives = lives - 1;
        setLives(newLives);
        setFeedback("❌ Try to remember better! -1 Heart");
        
        if (newLives <= 0) {
          setTimeout(() => setGameOver(true), 1200);
        }
        
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      } else {
        setFeedback("❌ Not a match! Try again!");
      }
    }
    
    setFlippedCards([]);
    setIsProcessing(false);
  };

  const handleLevelComplete = () => {
    if (streak + 1 >= 5) {
      const newLives = Math.min(lives + 1, 5);
      setLives(newLives);
      setFeedback(prev => `${prev} 💖 +1 Heart!`);
      onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
    }
    
    setTimeout(() => {
      if (level % 3 === 0) {
        // Change theme every 3 levels
        const themeKeys = Object.keys(themes);
        const currentIndex = themeKeys.indexOf(gameTheme);
        const nextTheme = themeKeys[(currentIndex + 1) % themeKeys.length];
        setGameTheme(nextTheme);
      }
      
      setLevel(prev => prev + 1);
      setFeedback("🚀 Level Up!");
      initializeGame();
    }, 1500);
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

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFeedback("");
    setStreak(0);
    setTimeLeft(90);
    setGameTheme('animals');
    initializeGame();
    
    onGameEvent?.({ type: 'scoreUpdate', payload: 0 });
    onGameEvent?.({ type: 'heartsUpdate', payload: 3 });
  };

  const showHint = () => {
    setShowAllCards(true);
    setTimeout(() => {
      setShowAllCards(false);
    }, 1500);
  };

  // Game Over Screen
  if (gameOver) {
    return (
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'min-h-[400px]'} p-3 w-full`}>
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#8B5CF6]/30">
          <div className="text-4xl mb-3 text-center">🧠</div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Memory Game Over!</h1>
          <p className="text-gray-300 mb-4 text-sm text-center">You found {matchedPairs.length / 2} pairs!</p>
          
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
              <div className="text-lg font-bold text-white text-center">{moves}</div>
              <div className="text-gray-400 text-xs text-center">Moves</div>
            </div>
          </div>
          
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white font-bold hover:opacity-90 text-sm"
          >
            🧠 Play Again
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
              className="absolute text-xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {['✨', '🧠', '🌟', '🎯'][i % 4]}
            </div>
          ))}
        </div>
      )}

      <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#8B5CF6]/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]`}>
              <span className="text-lg">{selectedCharacter}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Memory Match</h1>
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
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#8B5CF6]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#8B5CF6]/20 rounded-lg hover:bg-[#8B5CF6]/10 transition-colors"
            >
              {soundEnabled ? 
                <Volume2 className="w-4 h-4 text-green-400" /> : 
                <VolumeX className="w-4 h-4 text-gray-400" />
              }
            </button>
          </div>
        </div>

        {/* Game Mode & Theme Selector */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="flex gap-1">
            <button
              onClick={() => setGameMode('animals')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'animals' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
            >
              Practice
            </button>
            <button
              onClick={() => { setGameMode('timed'); setTimeLeft(90); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'timed' ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
            >
              <Clock className="inline w-3 h-3 mr-1" />
              Timed
            </button>
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-1">
            {Object.keys(themes).map(themeKey => (
              <button
                key={themeKey}
                onClick={() => { setGameTheme(themeKey); initializeGame(); }}
                className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameTheme === themeKey ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
              >
                {themes[themeKey].name}
              </button>
            ))}
          </div>
        </div>

        {/* Timed Mode Timer */}
        {gameMode === 'timed' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Time Left:</span>
              <span className={`text-sm font-bold ${timeLeft <= 20 ? 'text-red-400' : 'text-green-400'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] h-1.5 rounded-full transition-all"
                style={{ width: `${(timeLeft / 90) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-600'}`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" />
              <span className="text-gray-400">Moves:</span>
              <span className="font-bold text-white">{moves}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-gray-400">Pairs:</span>
              <span className="font-bold text-white">{matchedPairs.length / 2}/{cards.length / 2}</span>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="mb-3 flex justify-center">
          <div className="text-center mb-2 w-full">
            <div className="text-sm text-gray-400">
              {themes[gameTheme].name} Memory • {difficulty}x{difficulty} Grid
            </div>
            <div className="text-xs text-gray-500">
              Find matching {themes[gameTheme].name.toLowerCase()} pairs!
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mb-3">
          <div 
            className="grid gap-1.5 p-3 bg-[#1A1A2E]/50 rounded-lg border border-[#8B5CF6]/20"
            style={{ 
              gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
              maxWidth: 'min(100%, 500px)'
            }}
          >
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.matched || isProcessing || showAllCards}
                className={`aspect-square rounded-lg flex items-center justify-center text-xl md:text-2xl transition-all duration-300 ${
                  card.flipped || card.matched || showAllCards
                    ? 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] transform rotate-0'
                    : 'bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#8B5CF6]/30 hover:border-[#8B5CF6] hover:scale-105'
                } ${card.matched ? 'opacity-50' : ''}`}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '45px',
                  minWidth: '45px'
                }}
              >
                {card.flipped || card.matched || showAllCards ? (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl md:text-3xl">{card.emoji}</span>
                    <span className="text-[8px] md:text-[10px] text-white/70 mt-0.5">{card.name}</span>
                  </div>
                ) : (
                  <div className="text-lg">?</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <button
            onClick={showHint}
            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-sm font-bold flex items-center justify-center gap-1 hover:opacity-90"
          >
            <Eye className="w-4 h-4" />
            Show All Cards
          </button>
          <button
            onClick={initializeGame}
            className="px-3 py-2 rounded-lg bg-[#1A1A2E] border border-gray-700 text-gray-400 text-sm flex items-center justify-center gap-1 hover:text-white hover:border-gray-600"
          >
            <RotateCw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-lg p-2 text-center text-sm font-bold mb-2 ${
            feedback.includes('+') 
              ? 'bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 text-[#8B5CF6]'
              : 'bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/10 text-[#F59E0B]'
          }`}>
            {feedback}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round((matchedPairs.length / cards.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] h-2 rounded-full transition-all"
              style={{ width: `${(matchedPairs.length / cards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3 pt-2 border-t border-[#8B5CF6]/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-lg">🧠</span>
              <span>Remember card positions</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🎯</span>
              <span>Click two matching cards</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🚀</span>
              <span>Fewer moves = more points</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🏆</span>
              <span>Complete all pairs to level up</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryMatchGame;