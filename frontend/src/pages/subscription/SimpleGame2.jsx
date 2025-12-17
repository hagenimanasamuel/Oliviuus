import React, { useState, useEffect } from "react";
import { RotateCcw, Trophy, Sparkles } from "lucide-react";

const COLORS = [
  { name: "crimson", value: "#DC143C", shadow: "#8B0000" },
  { name: "ocean", value: "#1E90FF", shadow: "#00008B" },
  { name: "emerald", value: "#50C878", shadow: "#006400" },
  { name: "gold", value: "#FFD700", shadow: "#B8860B" },
  { name: "purple", value: "#9370DB", shadow: "#4B0082" },
  { name: "orange", value: "#FF8C00", shadow: "#8B4513" },
];

const TUBE_CAPACITY = 4;

const generateLevel = (numColors, tubesPerColor) => {
  const colors = COLORS.slice(0, numColors);
  const allLiquids = [];
  
  colors.forEach(color => {
    for (let i = 0; i < tubesPerColor; i++) {
      allLiquids.push(color);
    }
  });
  
  // Shuffle
  for (let i = allLiquids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allLiquids[i], allLiquids[j]] = [allLiquids[j], allLiquids[i]];
  }
  
  // Distribute into tubes
  const tubes = [];
  const tubeCount = numColors + 2;
  for (let i = 0; i < tubeCount; i++) {
    tubes.push([]);
  }
  
  let tubeIndex = 0;
  allLiquids.forEach(color => {
    if (tubes[tubeIndex].length === tubesPerColor) {
      tubeIndex++;
    }
    tubes[tubeIndex].push(color);
  });
  
  return tubes;
};

export default function ProWaterSort() {
  const [level, setLevel] = useState(1);
  const [tubes, setTubes] = useState([]);
  const [selectedTube, setSelectedTube] = useState(null);
  const [moves, setMoves] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [lastMove, setLastMove] = useState({ from: null, to: null });
  const [completedTubes, setCompletedTubes] = useState(new Set());
  const [showVictory, setShowVictory] = useState(false);
  const [particleEffect, setParticleEffect] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    initLevel();
  }, [level]);

  useEffect(() => {
    checkVictory();
  }, [tubes]);

  const initLevel = () => {
    const numColors = Math.min(3 + Math.floor(level / 2), 6);
    const newTubes = generateLevel(numColors, TUBE_CAPACITY);
    setTubes(newTubes);
    setMoves(0);
    setSelectedTube(null);
    setCompletedTubes(new Set());
    setShowVictory(false);
    setHistory([]);
  };

  const checkVictory = () => {
    if (tubes.length === 0) return;
    
    const newCompleted = new Set();
    let allComplete = true;
    
    tubes.forEach((tube, idx) => {
      if (tube.length === 0) return;
      
      const allSame = tube.every(c => c.name === tube[0].name);
      const isFull = tube.length === TUBE_CAPACITY;
      
      if (allSame && isFull) {
        newCompleted.add(idx);
      } else {
        allComplete = false;
      }
    });
    
    setCompletedTubes(newCompleted);
    
    if (allComplete && tubes.some(t => t.length > 0)) {
      setTimeout(() => setShowVictory(true), 500);
    }
  };

  const handleTubeClick = (index) => {
    if (isPouring || showVictory) return;
    
    if (selectedTube === null) {
      if (tubes[index].length > 0) {
        setSelectedTube(index);
      }
    } else if (selectedTube === index) {
      setSelectedTube(null);
    } else {
      pourLiquid(selectedTube, index);
    }
  };

  const canPour = (from, to) => {
    const fromTube = tubes[from];
    const toTube = tubes[to];
    
    if (fromTube.length === 0) return false;
    if (toTube.length >= TUBE_CAPACITY) return false;
    if (toTube.length === 0) return true;
    
    const topColorFrom = fromTube[fromTube.length - 1];
    const topColorTo = toTube[toTube.length - 1];
    
    return topColorFrom.name === topColorTo.name;
  };

  const pourLiquid = (from, to) => {
    if (!canPour(from, to)) {
      setSelectedTube(null);
      return;
    }
    
    setIsPouring(true);
    setLastMove({ from, to });
    
    const newTubes = tubes.map(t => [...t]);
    const fromTube = newTubes[from];
    const toTube = newTubes[to];
    const colorToPour = fromTube[fromTube.length - 1];
    
    // Pour all matching colors at once
    let poured = 0;
    while (
      fromTube.length > 0 &&
      toTube.length < TUBE_CAPACITY &&
      fromTube[fromTube.length - 1].name === colorToPour.name
    ) {
      toTube.push(fromTube.pop());
      poured++;
    }
    
    setHistory([...history, tubes]);
    setTubes(newTubes);
    setMoves(moves + 1);
    
    setTimeout(() => {
      setIsPouring(false);
      setSelectedTube(null);
      setLastMove({ from: null, to: null });
      
      // Particle effect for completed tube
      if (toTube.length === TUBE_CAPACITY && toTube.every(c => c.name === toTube[0].name)) {
        setParticleEffect(to);
        setTimeout(() => setParticleEffect(null), 1000);
      }
    }, 400);
  };

  const undo = () => {
    if (history.length === 0 || isPouring) return;
    const prevState = history[history.length - 1];
    setTubes(prevState);
    setHistory(history.slice(0, -1));
    setMoves(Math.max(0, moves - 1));
    setSelectedTube(null);
  };

  const reset = () => {
    if (isPouring) return;
    initLevel();
  };

  const nextLevel = () => {
    setLevel(level + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 100 + 50 + "px",
              height: Math.random() * 100 + 50 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animationDelay: Math.random() * 2 + "s",
              animationDuration: Math.random() * 3 + 2 + "s",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">
          Water Sort Puzzle
        </h1>
        <div className="flex gap-6 justify-center items-center text-white text-lg">
          <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
            <span className="font-semibold">Level {level}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full border border-white/20">
            <span className="font-semibold">Moves: {moves}</span>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="relative z-10 flex flex-wrap justify-center gap-6 mb-8 max-w-4xl">
        {tubes.map((tube, i) => {
          const isSelected = selectedTube === i;
          const isCompleted = completedTubes.has(i);
          const isTarget = selectedTube !== null && selectedTube !== i && canPour(selectedTube, i);
          const hasParticles = particleEffect === i;
          
          return (
            <div key={i} className="relative">
              {/* Particles */}
              {hasParticles && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, pi) => (
                    <Sparkles
                      key={pi}
                      className="absolute text-yellow-300 animate-ping"
                      style={{
                        left: Math.random() * 100 + "%",
                        top: Math.random() * 100 + "%",
                        animationDelay: Math.random() * 0.5 + "s",
                      }}
                      size={16}
                    />
                  ))}
                </div>
              )}
              
              {/* Tube container */}
              <div
                onClick={() => handleTubeClick(i)}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected ? "scale-110 -translate-y-4" : ""
                } ${isTarget ? "scale-105" : ""}`}
              >
                {/* Glow effect */}
                {(isSelected || isTarget) && (
                  <div className={`absolute inset-0 rounded-3xl blur-xl ${
                    isSelected ? "bg-yellow-400/50" : "bg-green-400/50"
                  } animate-pulse`} />
                )}
                
                {/* Tube */}
                <div
                  className={`relative w-20 h-64 rounded-3xl flex flex-col-reverse overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50"
                      : isCompleted
                      ? "border-4 border-green-400 shadow-2xl shadow-green-400/50"
                      : isTarget
                      ? "border-4 border-green-300 shadow-xl shadow-green-300/30"
                      : "border-4 border-white/30 shadow-xl"
                  }`}
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Layer slots - always show 4 slots */}
                  {[...Array(TUBE_CAPACITY)].map((_, slotIdx) => {
                    const color = tube[slotIdx];
                    const isEmpty = !color;
                    const isPouringFrom = lastMove.from === i && isPouring;
                    const isPouringTo = lastMove.to === i && isPouring;
                    const isTopLayer = slotIdx === tube.length - 1;
                    
                    return (
                      <div
                        key={slotIdx}
                        className={`h-16 w-full relative transition-all duration-400 ${
                          slotIdx === TUBE_CAPACITY - 1 ? "rounded-t-2xl" : ""
                        } ${isEmpty ? "" : (isPouringFrom || isPouringTo) ? "animate-pulse" : ""}`}
                        style={{
                          backgroundColor: isEmpty ? "transparent" : color.value,
                          boxShadow: isEmpty ? "none" : `inset 0 -2px 8px ${color.shadow}`,
                          borderBottom: isEmpty ? "1px solid rgba(255,255,255,0.1)" : "none",
                        }}
                      >
                        {/* Empty slot indicator */}
                        {isEmpty && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-0.5 bg-white/10 rounded-full" />
                          </div>
                        )}
                        
                        {/* Liquid effects */}
                        {!isEmpty && (
                          <>
                            {/* Liquid shine */}
                            <div
                              className="absolute inset-0 opacity-40"
                              style={{
                                background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                              }}
                            />
                            
                            {/* Surface reflection on top layer */}
                            {isTopLayer && (
                              <div
                                className="absolute top-0 left-0 right-0 h-2 opacity-60"
                                style={{
                                  background: "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)",
                                }}
                              />
                            )}
                            
                            {/* Bubble effect */}
                            {Math.random() > 0.6 && (
                              <div
                                className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
                                style={{
                                  left: Math.random() * 70 + 10 + "%",
                                  top: Math.random() * 60 + 20 + "%",
                                  animationDuration: Math.random() * 2 + 1 + "s",
                                }}
                              />
                            )}
                            
                            {/* Wave effect on top layer */}
                            {isTopLayer && (
                              <div
                                className="absolute top-0 left-0 right-0 h-1 opacity-50"
                                style={{
                                  background: `linear-gradient(90deg, ${color.value}, ${color.shadow}, ${color.value})`,
                                  animation: "wave 2s ease-in-out infinite",
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Completion sparkle */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 z-10">
                      <Trophy className="text-yellow-300 animate-bounce" size={20} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex gap-4">
        <button
          onClick={undo}
          disabled={history.length === 0 || isPouring}
          className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 border border-white/30 shadow-xl"
        >
          <RotateCcw size={20} />
          Undo
        </button>
        <button
          onClick={reset}
          disabled={isPouring}
          className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 border border-white/30 shadow-xl"
        >
          Restart Level
        </button>
      </div>

      {/* Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-12 rounded-3xl shadow-2xl text-center transform animate-in zoom-in duration-500 border-4 border-white/30">
            <div className="mb-6">
              {[...Array(5)].map((_, i) => (
                <Trophy
                  key={i}
                  className="inline-block text-yellow-300 animate-bounce mx-2"
                  size={40}
                  style={{ animationDelay: i * 0.1 + "s" }}
                />
              ))}
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Level Complete!</h2>
            <p className="text-2xl text-white/90 mb-8">
              Completed in <span className="font-bold text-yellow-300">{moves}</span> moves
            </p>
            <button
              onClick={nextLevel}
              className="bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-yellow-300 transition-all transform hover:scale-110 shadow-2xl"
            >
              Next Level →
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}