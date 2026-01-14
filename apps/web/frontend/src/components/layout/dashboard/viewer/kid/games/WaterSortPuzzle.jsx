import React, { useState, useEffect } from "react";
import { RotateCcw, Trophy, Sparkles, Droplets, RefreshCw, X, ArrowRight, HelpCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

const COLORS = [
  { name: "crimson", value: "#DC143C", shadow: "#8B0000", bubble: "#FF6B6B" },
  { name: "ocean", value: "#1E90FF", shadow: "#00008B", bubble: "#4ECDC4" },
  { name: "emerald", value: "#50C878", shadow: "#006400", bubble: "#96CEB4" },
  { name: "gold", value: "#FFD700", shadow: "#B8860B", bubble: "#FFE066" },
  { name: "purple", value: "#9370DB", shadow: "#4B0082", bubble: "#A13E97" },
  { name: "orange", value: "#FF8C00", shadow: "#8B4513", bubble: "#FF9E6D" },
];

const TUBE_CAPACITY = 4;

// LocalStorage keys
const TUTORIAL_COMPLETED_KEY = 'water_sort_tutorial_completed';
const CURRENT_LEVEL_KEY = 'water_sort_current_level';
const HIGHEST_LEVEL_KEY = 'water_sort_highest_level';

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

export default function WaterSortGame() {
  const { t } = useTranslation();
  
  // Load initial state from localStorage
  const [level, setLevel] = useState(() => {
    const savedLevel = localStorage.getItem(CURRENT_LEVEL_KEY);
    return savedLevel ? parseInt(savedLevel) : 1;
  });
  
  const [tubes, setTubes] = useState([]);
  const [selectedTube, setSelectedTube] = useState(null);
  const [moves, setMoves] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [pourAnimation, setPourAnimation] = useState({ active: false, from: null, to: null, color: null });
  const [lastMove, setLastMove] = useState({ from: null, to: null });
  const [completedTubes, setCompletedTubes] = useState(new Set());
  const [showVictory, setShowVictory] = useState(false);
  const [particleEffect, setParticleEffect] = useState(null);
  const [history, setHistory] = useState([]);
  const [liquidSplash, setLiquidSplash] = useState([]);
  const [rippleEffect, setRippleEffect] = useState(null);
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(() => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    return tutorialCompleted !== 'true'; // Show tutorial if not completed
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialTubes, setTutorialTubes] = useState([]);
  const [tutorialSelectedTube, setTutorialSelectedTube] = useState(null);
  const [showTutorialHighlight, setShowTutorialHighlight] = useState(false);
  const [loadingTutorialState, setLoadingTutorialState] = useState(false);

  // Load highest level from localStorage
  const [highestLevel, setHighestLevel] = useState(() => {
    const savedHighest = localStorage.getItem(HIGHEST_LEVEL_KEY);
    return savedHighest ? parseInt(savedHighest) : 1;
  });

  // Initialize tutorial or game level
  useEffect(() => {
    if (showTutorial) {
      initializeTutorial();
    } else {
      initLevel();
    }
  }, [showTutorial, level]);

  useEffect(() => {
    if (!showTutorial) {
      checkVictory();
    }
  }, [tubes, showTutorial]);

  const initLevel = () => {
    const numColors = Math.min(3 + Math.floor(level / 2), 6);
    const newTubes = generateLevel(numColors, TUBE_CAPACITY);
    setTubes(newTubes);
    setMoves(0);
    setSelectedTube(null);
    setCompletedTubes(new Set());
    setShowVictory(false);
    setHistory([]);
    setLiquidSplash([]);
    setTutorialStep(0);
  };

  const initializeTutorial = () => {
    // Create simple tutorial tubes for step 1
    const tutorialSetup = [
      [{ name: "ocean", value: "#1E90FF", shadow: "#00008B", bubble: "#4ECDC4" }],
      [{ name: "ocean", value: "#1E90FF", shadow: "#00008B", bubble: "#4ECDC4" }],
      [],
      []
    ];
    setTutorialTubes(tutorialSetup);
    setTutorialSelectedTube(null);
    setShowTutorialHighlight(false);
    setTutorialStep(0);
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
      setTimeout(() => setShowVictory(true), 800);
    }
  };

  // Save current level to localStorage
  const saveLevelToStorage = (newLevel) => {
    localStorage.setItem(CURRENT_LEVEL_KEY, newLevel.toString());
    
    // Update highest level if needed
    if (newLevel > highestLevel) {
      setHighestLevel(newLevel);
      localStorage.setItem(HIGHEST_LEVEL_KEY, newLevel.toString());
    }
  };

  // Save tutorial completion to localStorage
  const saveTutorialCompletion = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  };

  // ========== MAIN GAME LOGIC ==========
  const handleMainGameTubeClick = (index) => {
    if (isPouring || showVictory) return;
    
    if (selectedTube === null) {
      if (tubes[index].length > 0) {
        setSelectedTube(index);
        setRippleEffect({ tube: index, type: 'select' });
        setTimeout(() => setRippleEffect(null), 300);
      }
    } else if (selectedTube === index) {
      setSelectedTube(null);
    } else {
      pourLiquid(selectedTube, index);
    }
  };

  // ========== TUTORIAL LOGIC ==========
  const handleTutorialTubeClick = (index) => {
    if (isPouring) return;
    
    if (tutorialStep === 0) {
      // Step 1: Select first tube
      if (index === 0) {
        setTutorialSelectedTube(0);
        setTutorialStep(1);
        setShowTutorialHighlight(true);
        setRippleEffect({ tube: 0, type: 'select' });
        setTimeout(() => setRippleEffect(null), 300);
      }
    } else if (tutorialStep === 1 && tutorialSelectedTube === 0) {
      // Step 2: Pour to empty tube
      if (index === 2 || index === 3) {
        simulateTutorialPour(0, index);
        setTutorialStep(2);
        setShowTutorialHighlight(false);
      }
    }
  };

  const canPourInMainGame = (from, to) => {
    const fromTube = tubes[from];
    const toTube = tubes[to];
    
    if (fromTube.length === 0) return false;
    if (toTube.length >= TUBE_CAPACITY) return false;
    if (toTube.length === 0) return true;
    
    const topColorFrom = fromTube[fromTube.length - 1];
    const topColorTo = toTube[toTube.length - 1];
    
    return topColorFrom.name === topColorTo.name;
  };

  const canPourInTutorial = (from, to) => {
    const fromTube = tutorialTubes[from];
    const toTube = tutorialTubes[to];
    
    if (fromTube.length === 0) return false;
    if (toTube.length >= TUBE_CAPACITY) return false;
    if (toTube.length === 0) return true;
    
    const topColorFrom = fromTube[fromTube.length - 1];
    const topColorTo = toTube[toTube.length - 1];
    
    return topColorFrom.name === topColorTo.name;
  };

  const simulateTutorialPour = (from, to) => {
    setIsPouring(true);
    setPourAnimation({ active: true, from, to, color: tutorialTubes[from][0] });
    
    setTimeout(() => {
      const newTubes = [...tutorialTubes];
      const color = newTubes[from].pop();
      newTubes[to].push(color);
      setTutorialTubes(newTubes);
      setTutorialSelectedTube(null);
      
      setPourAnimation({ active: false, from: null, to: null, color: null });
      setIsPouring(false);
      
      const newSplash = {
        id: Date.now(),
        from,
        to,
        color: color.value,
        count: 1
      };
      setLiquidSplash(prev => [...prev, newSplash]);
      
      setRippleEffect({ tube: to, type: 'pour' });
      setTimeout(() => setRippleEffect(null), 300);
    }, 600);
  };

  const pourLiquid = (from, to) => {
    const canPour = showTutorial ? canPourInTutorial(from, to) : canPourInMainGame(from, to);
    
    if (!canPour) {
      setSelectedTube(null);
      setTutorialSelectedTube(null);
      return;
    }
    
    setIsPouring(true);
    setLastMove({ from, to });
    
    const currentTubes = showTutorial ? tutorialTubes : tubes;
    const fromTube = currentTubes[from];
    const toTube = currentTubes[to];
    const colorToPour = fromTube[fromTube.length - 1];
    
    setPourAnimation({ active: true, from, to, color: colorToPour });
    
    setTimeout(() => {
      const newTubes = currentTubes.map(t => [...t]);
      const updatedFromTube = newTubes[from];
      const updatedToTube = newTubes[to];
      
      let poured = 0;
      while (
        updatedFromTube.length > 0 &&
        updatedToTube.length < TUBE_CAPACITY &&
        updatedFromTube[updatedFromTube.length - 1].name === colorToPour.name
      ) {
        updatedToTube.push(updatedFromTube.pop());
        poured++;
      }
      
      if (poured > 0) {
        const newSplash = {
          id: Date.now(),
          from,
          to,
          color: colorToPour.value,
          count: poured
        };
        setLiquidSplash(prev => [...prev, newSplash]);
        
        setRippleEffect({ tube: to, type: 'pour' });
      }
      
      if (!showTutorial) {
        setHistory([...history, tubes]);
        setTubes(newTubes);
        setMoves(moves + 1);
      } else {
        setTutorialTubes(newTubes);
      }
      
      setTimeout(() => {
        setPourAnimation({ active: false, from: null, to: null, color: null });
        setIsPouring(false);
        setSelectedTube(null);
        setTutorialSelectedTube(null);
        setLastMove({ from: null, to: null });
        
        if (!showTutorial && updatedToTube.length === TUBE_CAPACITY && 
            updatedToTube.every(c => c.name === updatedToTube[0].name)) {
          setParticleEffect(to);
          setTimeout(() => setParticleEffect(null), 1200);
        }
      }, 600);
    }, 200);
  };

  const undo = () => {
    if (showTutorial || history.length === 0 || isPouring) return;
    const prevState = history[history.length - 1];
    setTubes(prevState);
    setHistory(history.slice(0, -1));
    setMoves(Math.max(0, moves - 1));
    setSelectedTube(null);
  };

  const reset = () => {
    if (isPouring) return;
    if (showTutorial) {
      setTutorialTubes([
        [{ name: "ocean", value: "#1E90FF", shadow: "#00008B", bubble: "#4ECDC4" }],
        [{ name: "ocean", value: "#1E90FF", shadow: "#00008B", bubble: "#4ECDC4" }],
        [],
        []
      ]);
      setTutorialStep(0);
      setTutorialSelectedTube(null);
      setShowTutorialHighlight(false);
    } else {
      initLevel();
    }
  };

  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    saveLevelToStorage(newLevel);
  };

  const skipTutorial = () => {
    saveTutorialCompletion();
    setShowTutorial(false);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
      if (tutorialStep === 1) {
        setShowTutorialHighlight(true);
      }
    } else {
      saveTutorialCompletion();
      setShowTutorial(false);
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
      if (tutorialStep === 2) {
        setShowTutorialHighlight(true);
      } else if (tutorialStep === 1) {
        setShowTutorialHighlight(false);
      }
    }
  };

  const goBackToLevel = (targetLevel) => {
    if (isPouring) return;
    setLevel(targetLevel);
    saveLevelToStorage(targetLevel);
  };

  const getTubePosition = (index) => {
    const tubeWidth = 80;
    const gap = 24;
    return index * (tubeWidth + gap);
  };

  const handleTubeClick = (index) => {
    if (showTutorial) {
      handleTutorialTubeClick(index);
    } else {
      handleMainGameTubeClick(index);
    }
  };

  const currentTubes = showTutorial ? tutorialTubes : tubes;
  const currentSelectedTube = showTutorial ? tutorialSelectedTube : selectedTube;

  const shouldHighlightTube = (index) => {
    if (!showTutorial) return false;
    
    if (tutorialStep === 0 && index === 0) {
      return true;
    }
    
    if (tutorialStep === 1 && showTutorialHighlight && currentSelectedTube === 0) {
      return index === 2 || index === 3;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl border-2 border-[#00B4D8]/30 shadow-2xl p-6 animate-scaleIn relative">
            <button
              onClick={skipTutorial}
              className="absolute top-4 right-4 p-2 bg-[#1A1A2E] border border-[#00B4D8]/30 rounded-lg hover:bg-[#16213E] transition-colors"
              aria-label={t('waterSortGame.tutorial.skipTutorial')}
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#0077B6] mb-3">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {t('waterSortGame.tutorial.title')}
              </h3>
              <p className="text-gray-300">
                {t('waterSortGame.tutorial.subtitle')}
              </p>
              
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((step) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full ${tutorialStep >= step ? 'bg-[#00B4D8]' : 'bg-gray-600'}`}
                    aria-label={`${t('waterSortGame.tutorial.progress')} ${step + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="min-h-[200px] flex flex-col justify-center">
              {tutorialStep === 0 && (
                <div className="space-y-4">
                  <p className="text-white text-lg font-semibold">
                    {t('waterSortGame.tutorial.steps.step1.title')}
                  </p>
                  <p className="text-white/90">
                    {t('waterSortGame.tutorial.steps.step1.description')}
                  </p>
                  <p className="text-white/80 text-sm">
                    {t('waterSortGame.tutorial.steps.step1.hint')}
                  </p>
                  <div className="flex items-center justify-center mt-4">
                    <div className="relative">
                      <div className="w-20 h-64 rounded-3xl border-4 border-yellow-400 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl shadow-yellow-400/50 flex flex-col-reverse">
                        <div className="h-16 w-full rounded-t-2xl bg-gradient-to-b from-[#1E90FF] to-[#00008B]" />
                      </div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-yellow-300 font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
                        {t('waterSortGame.tutorial.steps.step1.clickHint')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {tutorialStep === 1 && (
                <div className="space-y-4">
                  <p className="text-white text-lg font-semibold">
                    {t('waterSortGame.tutorial.steps.step2.title')}
                  </p>
                  <p className="text-white/90">
                    {t('waterSortGame.tutorial.steps.step2.description')}
                  </p>
                  <p className="text-white/80 text-sm">
                    {t('waterSortGame.tutorial.steps.step2.hint')}
                  </p>
                  <div className="flex items-center justify-center mt-4 gap-6">
                    <div className="relative">
                      <div className="w-20 h-64 rounded-3xl border-4 border-yellow-400 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl shadow-yellow-400/50 flex flex-col-reverse">
                        <div className="h-16 w-full rounded-t-2xl bg-gradient-to-b from-[#1E90FF] to-[#00008B]" />
                      </div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-yellow-300 font-bold text-sm">
                        {t('waterSortGame.tutorial.steps.step2.selectedLabel')}
                      </div>
                    </div>
                    <ArrowRight className="text-white animate-pulse" size={32} />
                    <div className="relative">
                      <div className="w-20 h-64 rounded-3xl border-4 border-green-400 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl shadow-green-400/50 flex flex-col-reverse">
                        {/* Empty tube */}
                      </div>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-green-300 font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
                        {t('waterSortGame.tutorial.steps.step2.clickHint')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {tutorialStep === 2 && (
                <div className="space-y-4">
                  <p className="text-white text-lg font-semibold">
                    {t('waterSortGame.tutorial.steps.step3.title')}
                  </p>
                  <p className="text-white/90">
                    {t('waterSortGame.tutorial.steps.step3.description')}
                  </p>
                  <p className="text-white/80 text-sm">
                    {t('waterSortGame.tutorial.steps.step3.hint')}
                  </p>
                  <div className="flex flex-col items-center justify-center mt-4 gap-4">
                    <div className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] p-6 rounded-lg shadow-2xl">
                      <span className="text-4xl">🎮</span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {t('waterSortGame.tutorial.steps.step3.noHints')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={prevTutorialStep}
                disabled={tutorialStep === 0}
                className="flex-1 py-2.5 bg-[#1A1A2E] border border-[#00B4D8]/30 text-white rounded-lg hover:bg-[#16213E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} />
                {t('waterSortGame.tutorial.previous')}
              </button>
              <button
                onClick={nextTutorialStep}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] text-white font-bold rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
              >
                {tutorialStep === 2 
                  ? t('waterSortGame.tutorial.startRealGame') 
                  : t('waterSortGame.tutorial.next')}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Selector Modal */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => {
            const modal = document.getElementById('levelSelectorModal');
            if (modal) modal.showModal();
          }}
          className="bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white px-4 py-2 rounded-full font-bold hover:opacity-90 shadow-lg flex items-center gap-2"
        >
          <span>📊</span>
          <span>{t('waterSortGame.levelSelector.open')}</span>
        </button>
      </div>

      {/* Level Selector Dialog */}
      <dialog id="levelSelectorModal" className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl border-2 border-[#FF5722]/30 shadow-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            {t('waterSortGame.levelSelector.title')}
          </h3>
          <p className="text-gray-300">
            {t('waterSortGame.levelSelector.subtitle')}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white">{t('waterSortGame.levelSelector.currentLevel')}:</span>
            <span className="text-yellow-300 font-bold text-lg">Level {level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white">{t('waterSortGame.levelSelector.highestReached')}:</span>
            <span className="text-green-300 font-bold text-lg">Level {highestLevel}</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6 max-h-60 overflow-y-auto">
          {[...Array(Math.max(highestLevel, 10))].map((_, i) => {
            const levelNum = i + 1;
            const isCurrent = levelNum === level;
            const isUnlocked = levelNum <= highestLevel;
            
            return (
              <button
                key={levelNum}
                onClick={() => {
                  if (isUnlocked && !isPouring) {
                    goBackToLevel(levelNum);
                    document.getElementById('levelSelectorModal').close();
                  }
                }}
                disabled={!isUnlocked || isPouring}
                className={`h-12 rounded-lg flex flex-col items-center justify-center transition-all ${
                  isCurrent 
                    ? 'bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white shadow-lg' 
                    : isUnlocked
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="text-sm font-bold">{levelNum}</span>
                {isCurrent && (
                  <div className="w-1 h-1 bg-white rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => document.getElementById('levelSelectorModal').close()}
            className="flex-1 py-2.5 bg-[#1A1A2E] border border-[#FF5722]/30 text-white rounded-lg hover:bg-[#16213E]"
          >
            {t('waterSortGame.levelSelector.close')}
          </button>
        </div>
      </dialog>

      {/* Animated background bubbles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-white/10 to-white/5 animate-float"
            style={{
              width: Math.random() * 80 + 40 + "px",
              height: Math.random() * 80 + 40 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animationDelay: Math.random() * 5 + "s",
              animationDuration: Math.random() * 8 + 8 + "s",
            }}
            aria-label={t('waterSortGame.animations.float')}
          />
        ))}
      </div>

      {/* Floating droplets animation */}
      {liquidSplash.map(splash => (
        <div key={splash.id} className="absolute pointer-events-none">
          {[...Array(Math.min(splash.count, 5))].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-droplet"
              style={{
                width: "10px",
                height: "10px",
                background: splash.color,
                left: getTubePosition(splash.from) + 35 + Math.random() * 10 + "px",
                top: "50%",
                animationDelay: i * 0.1 + "s",
              }}
              aria-label={t('waterSortGame.animations.droplet')}
            />
          ))}
        </div>
      ))}

      {/* Pouring liquid animation */}
      {pourAnimation.active && (
        <div className="absolute pointer-events-none z-20">
          <div
            className="absolute rounded-lg animate-pour"
            style={{
              width: "30px",
              height: "40px",
              background: `linear-gradient(to bottom, ${pourAnimation.color.value}dd, ${pourAnimation.color.value})`,
              left: getTubePosition(pourAnimation.from) + 25 + "px",
              top: "40%",
              borderRadius: "15px 15px 5px 5px",
            }}
            aria-label={t('waterSortGame.animations.pour')}
          />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Droplets className="text-white/80 animate-pulse" size={32} />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">
            {t('waterSortGame.header.title')}
          </h1>
          {showTutorial && (
            <span className="px-3 py-1 bg-gradient-to-r from-[#00B4D8] to-[#0077B6] text-white text-sm font-bold rounded-full">
              {t('waterSortGame.header.tutorialBadge')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-4 justify-center items-center text-white text-sm md:text-lg">
          <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full border border-white/20 flex items-center gap-2">
            <span className="text-yellow-300">🏆</span>
            <span className="font-semibold">
              {showTutorial 
                ? t('waterSortGame.header.tutorialBadge')
                : t('waterSortGame.header.level', { level })}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full border border-white/20 flex items-center gap-2">
            <span className="text-blue-300">↻</span>
            <span className="font-semibold">
              {t('waterSortGame.header.moves', { moves: showTutorial ? tutorialStep : moves })}
            </span>
          </div>
          {!showTutorial && (
            <div className="bg-white/10 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full border border-white/20 flex items-center gap-2">
              <span className="text-green-300">⭐</span>
              <span className="font-semibold">
                {t('waterSortGame.header.highestLevel', { highestLevel })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="relative z-10 flex flex-wrap justify-center gap-4 md:gap-6 mb-6 md:mb-8 max-w-4xl">
        {currentTubes.map((tube, i) => {
          const isSelected = currentSelectedTube === i;
          const isCompleted = completedTubes.has(i) && !showTutorial;
          const shouldHighlight = shouldHighlightTube(i);
          const hasParticles = particleEffect === i;
          const hasRipple = rippleEffect?.tube === i;
          
          return (
            <div key={i} className="relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm font-semibold">
                {t('waterSortGame.tube.label', { number: i + 1 })}
              </div>

              {hasRipple && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className={`absolute inset-0 rounded-3xl animate-ripple ${
                    rippleEffect.type === 'select' ? 'bg-yellow-400/40' : 'bg-blue-400/40'
                  }`} 
                  aria-label={t('waterSortGame.animations.ripple')}
                  />
                </div>
              )}

              {hasParticles && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, pi) => (
                    <Sparkles
                      key={pi}
                      className="absolute text-yellow-300 animate-sparkle"
                      style={{
                        left: Math.random() * 100 + "%",
                        top: Math.random() * 100 + "%",
                        animationDelay: Math.random() * 0.5 + "s",
                      }}
                      size={16}
                      aria-label={t('waterSortGame.animations.sparkle')}
                    />
                  ))}
                </div>
              )}
              
              <div
                onClick={() => handleTubeClick(i)}
                className={`relative cursor-pointer transition-all duration-300 ${
                  isSelected ? "transform scale-110 -translate-y-2 md:-translate-y-4" : ""
                } ${shouldHighlight ? "transform scale-105" : ""}`}
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-3xl blur-xl bg-yellow-400/50 animate-pulse-glow" />
                )}
                
                {shouldHighlight && (
                  <div className="absolute inset-0 rounded-3xl blur-xl bg-green-400/50 animate-pulse-glow" />
                )}
                
                <div
                  className={`relative w-16 md:w-20 h-48 md:h-64 rounded-3xl flex flex-col-reverse overflow-hidden transition-all duration-300 ${
                    isSelected
                      ? "border-3 md:border-4 border-yellow-400 shadow-2xl shadow-yellow-400/50"
                      : shouldHighlight
                      ? "border-3 md:border-4 border-green-400 shadow-2xl shadow-green-400/50"
                      : isCompleted
                      ? "border-3 md:border-4 border-green-400 shadow-2xl shadow-green-400/50"
                      : "border-3 md:border-4 border-white/30 shadow-xl"
                  }`}
                  style={{
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {tube.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden">
                      <div 
                        className="h-full animate-wave"
                        style={{
                          background: `linear-gradient(90deg, ${tube[tube.length-1].value}aa, ${tube[tube.length-1].shadow}aa, ${tube[tube.length-1].value}aa)`,
                        }}
                      />
                    </div>
                  )}

                  {[...Array(TUBE_CAPACITY)].map((_, slotIdx) => {
                    const color = tube[slotIdx];
                    const isEmpty = !color;
                    const isPouringFrom = lastMove.from === i && isPouring;
                    const isPouringTo = lastMove.to === i && isPouring;
                    const isTopLayer = slotIdx === tube.length - 1;
                    
                    return (
                      <div
                        key={slotIdx}
                        className={`h-12 md:h-16 w-full relative transition-all duration-500 ${
                          slotIdx === TUBE_CAPACITY - 1 ? "rounded-t-2xl" : ""
                        } ${isEmpty ? "" : (isPouringFrom || isPouringTo) ? "animate-liquid-shake" : ""}`}
                        style={{
                          backgroundColor: isEmpty ? "transparent" : color.value,
                          boxShadow: isEmpty ? "none" : `inset 0 -4px 12px ${color.shadow}80, inset 0 2px 4px ${color.bubble}40`,
                          borderBottom: isEmpty ? "1px solid rgba(255,255,255,0.1)" : "none",
                          animationDelay: slotIdx * 0.1 + "s",
                        }}
                      >
                        {isEmpty && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <div className="w-6 md:w-8 h-0.5 bg-white rounded-full" />
                          </div>
                        )}
                        
                        {!isEmpty && (
                          <>
                            <div
                              className="absolute inset-0 opacity-40 animate-shine"
                              style={{
                                background: "linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
                              }}
                              aria-label={t('waterSortGame.animations.shine')}
                            />
                            
                            {isTopLayer && (
                              <div
                                className="absolute top-0 left-0 right-0 h-2 opacity-60"
                                style={{
                                  background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)",
                                }}
                              />
                            )}
                            
                            {[...Array(3)].map((_, bi) => (
                              <div
                                key={bi}
                                className="absolute rounded-full bg-white/20 animate-bubble"
                                style={{
                                  width: Math.random() * 6 + 4 + "px",
                                  height: Math.random() * 6 + 4 + "px",
                                  left: Math.random() * 80 + 10 + "%",
                                  top: Math.random() * 80 + 10 + "%",
                                  animationDelay: Math.random() * 2 + "s",
                                  animationDuration: Math.random() * 3 + 2 + "s",
                                }}
                                aria-label={t('waterSortGame.animations.bubble')}
                              />
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                  
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="animate-bounce">
                        <Trophy className="text-yellow-300" size={20} 
                          aria-label={t('waterSortGame.tube.completionCrown')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-wrap gap-3 justify-center">
        {!showTutorial && (
          <button
            onClick={undo}
            disabled={history.length === 0 || isPouring}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 border border-white/30 shadow-xl"
          >
            <RotateCcw size={18} />
            {t('waterSortGame.controls.undo')}
          </button>
        )}
        <button
          onClick={reset}
          disabled={isPouring}
          className="bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105 border border-white/30 shadow-xl"
        >
          <RefreshCw size={18} />
          {showTutorial 
            ? t('waterSortGame.controls.restartTutorial')
            : t('waterSortGame.controls.restartLevel')}
        </button>
        {showTutorial && (
          <button
            onClick={skipTutorial}
            className="bg-gradient-to-r from-[#00B4D8] to-[#0077B6] text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
          >
            {t('waterSortGame.tutorial.skipTutorial')}
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="relative z-10 mt-4 text-center text-white/70 text-sm max-w-md px-4">
        {showTutorial ? (
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
            <p className="font-bold text-white mb-1">
              {tutorialStep === 0 && t('waterSortGame.instructions.tutorial.step0')}
              {tutorialStep === 1 && t('waterSortGame.instructions.tutorial.step1')}
              {tutorialStep === 2 && t('waterSortGame.instructions.tutorial.step2')}
            </p>
            <p className="text-xs text-white/50">
              {tutorialStep < 2 
                ? t('waterSortGame.instructions.tutorial.followHints')
                : t('waterSortGame.instructions.tutorial.noHints')}
            </p>
          </div>
        ) : (
          <>
            <p className="font-bold text-white">
              {t('waterSortGame.instructions.mainGame.title')}
            </p>
            <p className="text-xs mt-1 text-white/50">
              {t('waterSortGame.instructions.mainGame.description')}
            </p>
          </>
        )}
      </div>

      {/* Victory Modal */}
      {showVictory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 md:p-12 rounded-3xl shadow-2xl text-center transform animate-in zoom-in duration-500 border-4 border-white/30 mx-4">
            <div className="mb-4 md:mb-6">
              {[...Array(5)].map((_, i) => (
                <Trophy
                  key={i}
                  className="inline-block text-yellow-300 animate-bounce mx-1 md:mx-2"
                  size={30}
                  style={{ animationDelay: i * 0.1 + "s" }}
                />
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4">
              {t('waterSortGame.victory.title')}
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-6 md:mb-8">
              <Trans 
                i18nKey="waterSortGame.victory.completedIn"
                values={{ moves }}
                components={{ 1: <span className="font-bold text-yellow-300" /> }}
              />
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
              <button
                onClick={reset}
                className="bg-white/20 text-white px-6 md:px-8 py-3 rounded-full font-bold hover:bg-white/30 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('waterSortGame.controls.playAgain')}
              </button>
              <button
                onClick={nextLevel}
                className="bg-white text-purple-600 px-6 md:px-10 py-3 rounded-full font-bold hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-2xl"
              >
                {t('waterSortGame.controls.nextLevel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pour {
          0% { transform: translateY(0) scaleY(0.2); opacity: 0; }
          30% { transform: translateY(-60px) scaleY(1); opacity: 1; }
          70% { transform: translateY(60px) scaleY(0.8); opacity: 0.8; }
          100% { transform: translateY(100px) scaleY(0.2); opacity: 0; }
        }
        
        @keyframes droplet {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { 
            transform: translate(
              ${getTubePosition(0) - getTubePosition(3)}px, 
              100px
            ) scale(0.5); 
            opacity: 0; 
          }
        }
        
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes liquid-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        @keyframes bubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.5; }
          100% { transform: translateY(-20px) scale(0.5); opacity: 0; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-pour {
          animation: pour 0.8s ease-in-out;
        }
        
        .animate-droplet {
          animation: droplet 0.6s ease-in-out forwards;
        }
        
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
        
        .animate-sparkle {
          animation: sparkle 1s ease-in-out infinite;
        }
        
        .animate-liquid-shake {
          animation: liquid-shake 0.3s ease-in-out;
        }
        
        .animate-bubble {
          animation: bubble 3s ease-in infinite;
        }
        
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}