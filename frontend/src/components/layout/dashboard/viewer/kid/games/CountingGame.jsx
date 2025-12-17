import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Zap, Clock, Users, Star, Target, Medal, Volume2, VolumeX, Crown, SkipForward } from 'lucide-react';

const CountingGame = ({ onGameEvent, isFullscreen }) => {
  const [gameMode, setGameMode] = useState('practice');
  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState({ a: 1, b: 1 });
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState('🐱');
  const [opponentScore, setOpponentScore] = useState(0);
  const [powerUps, setPowerUps] = useState({
    extraTime: 1,
    skipQuestion: 1,
    doublePoints: 1
  });
  const [selectedInputMode, setSelectedInputMode] = useState('numbers');
  const [emojiAnswer, setEmojiAnswer] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const gameContainerRef = useRef(null);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const characters = [
    { emoji: '🐱', name: 'Kitty' },
    { emoji: '🐶', name: 'Puppy' },
    { emoji: '🦊', name: 'Foxy' },
    { emoji: '🐼', name: 'Panda' }
  ];

  const funnyMessages = [
    "🎉 Awesome!",
    "🚀 Great Job!",
    "🌈 Perfect!",
    "🎪 Super!",
    "🧙‍♂️ Amazing!",
    "🦸‍♂️ Excellent!"
  ];

  // Generate question - optimized for screen fit
  const generateQuestion = (lvl) => {
    const max = Math.min(lvl * 5, 20);
    let a, b;
    
    if (lvl <= 3) {
      a = Math.floor(Math.random() * 8) + 1;
      b = Math.floor(Math.random() * 8) + 1;
    } else if (lvl <= 6) {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
    } else {
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * max) + 1;
    }
    
    setQuestion({ a, b });
    setAnswer("");
    setEmojiAnswer("");
    setFeedback("");
    setIsCorrect(null);
    setShowHint(false);
    
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  };

  // Timer for timed mode
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

  // Opponent AI for multiplayer
  useEffect(() => {
    if (gameMode === 'multiplayer' && !gameOver) {
      const interval = setInterval(() => {
        setOpponentScore(prev => {
          if (Math.random() > 0.7) return prev + level * 3;
          return prev;
        });
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [gameMode, gameOver, level]);

  useEffect(() => {
    generateQuestion(level);
    onGameEvent?.({ type: 'scoreUpdate', payload: score });
    onGameEvent?.({ type: 'heartsUpdate', payload: lives });
  }, [level]);

  const checkAnswer = () => {
    if (!answer.trim() && !emojiAnswer.trim()) return;
    
    const correct = question.a + question.b;
    const userAnswer = selectedInputMode === 'emoji' ? emojiAnswer.length : Number(answer);
    
    if (userAnswer === correct) {
      const points = level * 8 + streak * 3;
      const newScore = score + (gameMode === 'timed' ? points * 2 : points);
      setScore(newScore);
      setIsCorrect(true);
      
      setFeedback(`${funnyMessages[Math.floor(Math.random() * funnyMessages.length)]} +${points}`);
      
      setStreak(s => s + 1);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      if (streak + 1 >= 5) {
        const newLives = Math.min(lives + 1, 5);
        setLives(newLives);
        setFeedback(prev => `${prev} 🏆 +1 Heart!`);
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
      
      if ((score + 1) % 5 === 0) {
        setLevel(l => l + 1);
        setFeedback(prev => `${prev} 🚀 Level Up!`);
      } else {
        setTimeout(() => generateQuestion(level), 800);
      }
      
      if (gameMode === 'timed') {
        setTimeLeft(prev => prev + 3);
      }
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setIsCorrect(false);
      setStreak(0);
      setFeedback(`❌ Try again! Answer: ${correct}`);
      
      if (newLives <= 0) {
        setTimeout(() => setGameOver(true), 1200);
      }
      
      onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
    }
  };

  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'extraTime':
        setTimeLeft(prev => prev + 10);
        setFeedback("⏰ +10 seconds!");
        break;
      case 'skipQuestion':
        generateQuestion(level);
        setFeedback("🚀 Skipped!");
        break;
      case 'doublePoints':
        setScore(prev => prev + 50);
        setFeedback("💰 +50 points!");
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
    setTimeLeft(30);
    setOpponentScore(0);
    setPowerUps({
      extraTime: 1,
      skipQuestion: 1,
      doublePoints: 1
    });
    generateQuestion(1);
    
    onGameEvent?.({ type: 'scoreUpdate', payload: 0 });
    onGameEvent?.({ type: 'heartsUpdate', payload: 3 });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') checkAnswer();
    if (e.key === ' ') setShowHint(!showHint);
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [answer, emojiAnswer]);

  // Game Over Screen - Fits perfectly
  if (gameOver) {
    return (
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'min-h-[400px]'} p-3 w-full`}>
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#FF5722]/30">
          <div className="text-4xl mb-3 text-center">🏆</div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Game Over!</h1>
          <p className="text-gray-300 mb-4 text-sm text-center">You did great!</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
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
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">Lvl {level}</div>
              <div className="text-gray-400 text-xs text-center">Reached</div>
            </div>
          </div>
          
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white font-bold hover:opacity-90 text-sm"
          >
            🎮 Play Again
          </button>
        </div>
      </div>
    );
  }

  // Character Selection - Compact
  if (!selectedCharacter && gameMode === 'multiplayer') {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-3 w-full">
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl border border-[#FF5722]/30 p-4">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Pick Your Character!</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {characters.map((char) => (
              <button
                key={char.emoji}
                onClick={() => setSelectedCharacter(char.emoji)}
                className="p-3 rounded-lg bg-[#1A1A2E] border border-[#FF5722]/20 hover:border-[#FF9800] transition-colors"
              >
                <div className="text-2xl mb-1 text-center">{char.emoji}</div>
                <div className="text-white text-xs text-center">{char.name}</div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setSelectedCharacter('🐱')}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] text-white font-bold text-sm"
          >
            Let's Play!
          </button>
        </div>
      </div>
    );
  }

  // Main Game - Optimized for perfect fit
  return (
    <div 
      ref={gameContainerRef}
      className={`${isFullscreen ? 'h-full overflow-auto' : 'min-h-[450px]'} p-2 w-full`}
    >
      {/* Confetti - Minimal */}
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

      <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#FF5722]/30">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${gameMode === 'multiplayer' ? 'bg-gradient-to-r from-[#FF5722]/20 to-[#FF9800]/20' : ''}`}>
              <span className="text-lg">{selectedCharacter}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Counting Game</h1>
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
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#FF5722]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#FF5722]/20 rounded-lg hover:bg-[#FF5722]/10 transition-colors"
            >
              {soundEnabled ? 
                <Volume2 className="w-4 h-4 text-green-400" /> : 
                <VolumeX className="w-4 h-4 text-gray-400" />
              }
            </button>
          </div>
        </div>

        {/* Game Mode Selector - Compact */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setGameMode('practice')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'practice' ? 'bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            Practice
          </button>
          <button
            onClick={() => setGameMode('timed')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'timed' ? 'bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Clock className="inline w-3 h-3 mr-1" />
            Timed
          </button>
          <button
            onClick={() => setGameMode('multiplayer')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'multiplayer' ? 'bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Users className="inline w-3 h-3 mr-1" />
            Vs AI
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
                className="bg-gradient-to-r from-[#4CAF50] to-[#FF9800] h-1.5 rounded-full transition-all"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Multiplayer Scoreboard */}
        {gameMode === 'multiplayer' && (
          <div className="mb-3 bg-gradient-to-r from-[#2196F3]/10 to-[#03A9F4]/10 rounded-lg p-2 border border-[#2196F3]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCharacter}</span>
                <span className="text-xs font-bold text-white">{score}</span>
              </div>
              <span className="text-xs text-gray-400">vs</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{opponentScore}</span>
                <span className="text-lg">🤖</span>
              </div>
            </div>
          </div>
        )}

        {/* Lives Display */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className={`w-5 h-5 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-600'}`}
            />
          ))}
        </div>

        {/* Main Game Area - Stacked on mobile */}
        <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'} items-center`}>
          
          {/* Visual Counting Area */}
          <div className="bg-[#1A1A2E]/50 rounded-lg p-3 border border-[#FF5722]/20">
            <div className="text-center mb-2">
              <div className="text-lg font-bold text-white mb-1">
                {question.a} + {question.b} = ?
              </div>
              <div className="text-xs text-gray-400">Count the items!</div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              {/* First group */}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Group A</div>
                <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
                  {[...Array(Math.min(question.a, 8))].map((_, i) => (
                    <span key={i} className="text-sm">
                      {['🍎', '🍌'][i % 2]}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-xl text-white">+</div>
              
              {/* Second group */}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Group B</div>
                <div className="flex flex-wrap justify-center gap-1 max-w-[80px]">
                  {[...Array(Math.min(question.b, 8))].map((_, i) => (
                    <span key={i} className="text-sm">
                      {['🐱', '🐶'][i % 2]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            {/* Input Mode Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedInputMode('numbers')}
                className={`flex-1 py-1.5 rounded text-xs ${selectedInputMode === 'numbers' ? 'bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
              >
                🔢 Numbers
              </button>
              <button
                onClick={() => setSelectedInputMode('emoji')}
                className={`flex-1 py-1.5 rounded text-xs ${selectedInputMode === 'emoji' ? 'bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
              >
                😀 Emojis
              </button>
            </div>

            {/* Input Field */}
            <div className="relative">
              {selectedInputMode === 'numbers' ? (
                <>
                  <input
                    ref={inputRef}
                    type="number"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type answer..."
                    className="w-full px-3 py-2 text-lg text-center bg-[#16213E] border border-[#FF5722]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9800]"
                    autoFocus
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-lg">
                    🧮
                  </div>
                </>
              ) : (
                <input
                  type="text"
                  value={emojiAnswer}
                  onChange={(e) => setEmojiAnswer(e.target.value.slice(0, 10))}
                  placeholder="Draw emojis..."
                  className="w-full px-3 py-2 text-center bg-[#16213E] border border-[#FF5722]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF9800]"
                />
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={checkAnswer}
              disabled={!answer.trim() && !emojiAnswer.trim()}
              className={`w-full py-2.5 rounded-lg font-bold text-sm ${
                !answer.trim() && !emojiAnswer.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] hover:opacity-90'
              }`}
            >
              🚀 SUBMIT ANSWER
            </button>

            {/* Quick Number Pad */}
            <div className="grid grid-cols-5 gap-1">
              {[1,2,3,4,5,6,7,8,9,0].map((num) => (
                <button
                  key={num}
                  onClick={() => setAnswer(prev => prev + num.toString())}
                  className="p-1.5 bg-[#1A1A2E] border border-[#FF5722]/20 rounded text-white text-sm hover:bg-[#FF5722]/20 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setAnswer("")}
                className="p-1.5 bg-[#FF5722]/20 border border-[#FF5722]/30 rounded text-white text-sm col-span-2 hover:bg-[#FF5722]/30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Power-ups - Horizontal */}
        <div className="flex gap-2 mt-3 mb-3">
          <button
            onClick={() => usePowerUp('extraTime')}
            disabled={powerUps.extraTime <= 0 || gameMode !== 'timed'}
            className={`flex-1 p-2 rounded-lg border text-xs ${powerUps.extraTime <= 0 || gameMode !== 'timed' ? 'border-gray-600/30 text-gray-500' : 'border-[#4CAF50]/30 text-white hover:bg-[#4CAF50]/10 transition-colors'}`}
          >
            <div className="text-sm">⏰</div>
            <div>+10s</div>
            <div className="text-xs text-gray-400">x{powerUps.extraTime}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('skipQuestion')}
            disabled={powerUps.skipQuestion <= 0}
            className={`flex-1 p-2 rounded-lg border text-xs ${powerUps.skipQuestion <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#FF9800]/30 text-white hover:bg-[#FF9800]/10 transition-colors'}`}
          >
            <div className="text-sm">🚀</div>
            <div>Skip</div>
            <div className="text-xs text-gray-400">x{powerUps.skipQuestion}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('doublePoints')}
            disabled={powerUps.doublePoints <= 0}
            className={`flex-1 p-2 rounded-lg border text-xs ${powerUps.doublePoints <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#9C27B0]/30 text-white hover:bg-[#9C27B0]/10 transition-colors'}`}
          >
            <div className="text-sm">💰</div>
            <div>2x</div>
            <div className="text-xs text-gray-400">x{powerUps.doublePoints}</div>
          </button>
        </div>

        {/* Feedback & Hint */}
        <div className="space-y-2">
          {showHint && (
            <div className="bg-gradient-to-r from-[#2196F3]/10 to-[#03A9F4]/10 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-300">
                💡 Hint: {question.a} + {question.b} = {question.a + question.b}
              </p>
            </div>
          )}
          
          {feedback && (
            <div className={`rounded-lg p-2 text-center text-sm font-bold ${
              isCorrect 
                ? 'bg-gradient-to-r from-[#4CAF50]/10 to-[#8BC34A]/10 text-green-400'
                : 'bg-gradient-to-r from-[#F44336]/10 to-[#E91E63]/10 text-red-400'
            }`}>
              {feedback}
            </div>
          )}
        </div>

        {/* Instructions - Tiny */}
        <div className="mt-3 pt-2 border-t border-[#FF5722]/10">
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>⏎</span>
              <span>Enter to submit</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🏆</span>
              <span>5-streak = heart</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountingGame;