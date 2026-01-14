import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Clock, Volume2, VolumeX, Mic, MicOff, Zap, Star, Target, Flag, Car, Rocket, CheckCircle, XCircle, RotateCw, Speaker, BookOpen } from 'lucide-react';
import { useTranslation } from "react-i18next";

const AlphabetRaceGame = ({ onGameEvent, isFullscreen }) => {
  const { t } = useTranslation(); // Initialize translation hook
  
  const [gameMode, setGameMode] = useState('letters');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('🚗');
  
  const [currentLetter, setCurrentLetter] = useState('A');
  const [letterOptions, setLetterOptions] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [opponentPosition, setOpponentPosition] = useState(0);
  const [raceTrack, setRaceTrack] = useState([]);
  const [wordToSpell, setWordToSpell] = useState('');
  const [spelledWord, setSpelledWord] = useState('');
  const [currentSound, setCurrentSound] = useState('');
  const [letterHint, setLetterHint] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [customLetters, setCustomLetters] = useState(['A', 'B', 'C', 'D']);
  const [isListening, setIsListening] = useState(false);
  const [showLetterHint, setShowLetterHint] = useState(false);
  const [showWordHint, setShowWordHint] = useState(false);
  const [currentPhonics, setCurrentPhonics] = useState('');
  
  const [powerUps, setPowerUps] = useState({
    boost: 2,
    shield: 1,
    slowOpponent: 1,
    hint: 2,
    voiceHelp: 3
  });
  
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const gameContainerRef = useRef(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const alphabetLower = 'abcdefghijklmnopqrstuvwxyz'.split('');
  
  const simpleWords = [
    { word: 'CAT', hint: t('alphabetRaceGame.words.CAT.hint'), emoji: t('alphabetRaceGame.words.CAT.emoji') },
    { word: 'DOG', hint: t('alphabetRaceGame.words.DOG.hint'), emoji: t('alphabetRaceGame.words.DOG.emoji') },
    { word: 'SUN', hint: t('alphabetRaceGame.words.SUN.hint'), emoji: t('alphabetRaceGame.words.SUN.emoji') },
    { word: 'MOON', hint: t('alphabetRaceGame.words.MOON.hint'), emoji: t('alphabetRaceGame.words.MOON.emoji') },
    { word: 'STAR', hint: t('alphabetRaceGame.words.STAR.hint'), emoji: t('alphabetRaceGame.words.STAR.emoji') },
    { word: 'FISH', hint: t('alphabetRaceGame.words.FISH.hint'), emoji: t('alphabetRaceGame.words.FISH.emoji') },
    { word: 'BIRD', hint: t('alphabetRaceGame.words.BIRD.hint'), emoji: t('alphabetRaceGame.words.BIRD.emoji') },
    { word: 'TREE', hint: t('alphabetRaceGame.words.TREE.hint'), emoji: t('alphabetRaceGame.words.TREE.emoji') },
    { word: 'BOOK', hint: t('alphabetRaceGame.words.BOOK.hint'), emoji: t('alphabetRaceGame.words.BOOK.emoji') },
    { word: 'BALL', hint: t('alphabetRaceGame.words.BALL.hint'), emoji: t('alphabetRaceGame.words.BALL.emoji') },
    { word: 'CAKE', hint: t('alphabetRaceGame.words.CAKE.hint'), emoji: t('alphabetRaceGame.words.CAKE.emoji') },
    { word: 'RAIN', hint: t('alphabetRaceGame.words.RAIN.hint'), emoji: t('alphabetRaceGame.words.RAIN.emoji') },
    { word: 'SNOW', hint: t('alphabetRaceGame.words.SNOW.hint'), emoji: t('alphabetRaceGame.words.SNOW.emoji') },
    { word: 'FIRE', hint: t('alphabetRaceGame.words.FIRE.hint'), emoji: t('alphabetRaceGame.words.FIRE.emoji') },
    { word: 'WATER', hint: t('alphabetRaceGame.words.WATER.hint'), emoji: t('alphabetRaceGame.words.WATER.emoji') },
    { word: 'HOUSE', hint: t('alphabetRaceGame.words.HOUSE.hint'), emoji: t('alphabetRaceGame.words.HOUSE.emoji') },
    { word: 'CAR', hint: t('alphabetRaceGame.words.CAR.hint'), emoji: t('alphabetRaceGame.words.CAR.emoji') },
    { word: 'BOAT', hint: t('alphabetRaceGame.words.BOAT.hint'), emoji: t('alphabetRaceGame.words.BOAT.emoji') },
    { word: 'PLANE', hint: t('alphabetRaceGame.words.PLANE.hint'), emoji: t('alphabetRaceGame.words.PLANE.emoji') },
    { word: 'TRAIN', hint: t('alphabetRaceGame.words.TRAIN.hint'), emoji: t('alphabetRaceGame.words.TRAIN.emoji') },
    { word: 'APPLE', hint: t('alphabetRaceGame.words.APPLE.hint'), emoji: t('alphabetRaceGame.words.APPLE.emoji') },
    { word: 'BEAR', hint: t('alphabetRaceGame.words.BEAR.hint'), emoji: t('alphabetRaceGame.words.BEAR.emoji') },
    { word: 'DUCK', hint: t('alphabetRaceGame.words.DUCK.hint'), emoji: t('alphabetRaceGame.words.DUCK.emoji') },
    { word: 'EGG', hint: t('alphabetRaceGame.words.EGG.hint'), emoji: t('alphabetRaceGame.words.EGG.emoji') },
    { word: 'FROG', hint: t('alphabetRaceGame.words.FROG.hint'), emoji: t('alphabetRaceGame.words.FROG.emoji') },
    { word: 'GOAT', hint: t('alphabetRaceGame.words.GOAT.hint'), emoji: t('alphabetRaceGame.words.GOAT.emoji') },
    { word: 'HAT', hint: t('alphabetRaceGame.words.HAT.hint'), emoji: t('alphabetRaceGame.words.HAT.emoji') },
    { word: 'ICE', hint: t('alphabetRaceGame.words.ICE.hint'), emoji: t('alphabetRaceGame.words.ICE.emoji') },
    { word: 'JUMP', hint: t('alphabetRaceGame.words.JUMP.hint'), emoji: t('alphabetRaceGame.words.JUMP.emoji') },
    { word: 'KITE', hint: t('alphabetRaceGame.words.KITE.hint'), emoji: t('alphabetRaceGame.words.KITE.emoji') }
  ];

  const letterSounds = {
    'A': { sound: t('alphabetRaceGame.letterSounds.A.sound'), example: t('alphabetRaceGame.letterSounds.A.example'), phonics: t('alphabetRaceGame.letterSounds.A.phonics') },
    'B': { sound: t('alphabetRaceGame.letterSounds.B.sound'), example: t('alphabetRaceGame.letterSounds.B.example'), phonics: t('alphabetRaceGame.letterSounds.B.phonics') },
    'C': { sound: t('alphabetRaceGame.letterSounds.C.sound'), example: t('alphabetRaceGame.letterSounds.C.example'), phonics: t('alphabetRaceGame.letterSounds.C.phonics') },
    'D': { sound: t('alphabetRaceGame.letterSounds.D.sound'), example: t('alphabetRaceGame.letterSounds.D.example'), phonics: t('alphabetRaceGame.letterSounds.D.phonics') },
    'E': { sound: t('alphabetRaceGame.letterSounds.E.sound'), example: t('alphabetRaceGame.letterSounds.E.example'), phonics: t('alphabetRaceGame.letterSounds.E.phonics') },
    'F': { sound: t('alphabetRaceGame.letterSounds.F.sound'), example: t('alphabetRaceGame.letterSounds.F.example'), phonics: t('alphabetRaceGame.letterSounds.F.phonics') },
    'G': { sound: t('alphabetRaceGame.letterSounds.G.sound'), example: t('alphabetRaceGame.letterSounds.G.example'), phonics: t('alphabetRaceGame.letterSounds.G.phonics') },
    'H': { sound: t('alphabetRaceGame.letterSounds.H.sound'), example: t('alphabetRaceGame.letterSounds.H.example'), phonics: t('alphabetRaceGame.letterSounds.H.phonics') },
    'I': { sound: t('alphabetRaceGame.letterSounds.I.sound'), example: t('alphabetRaceGame.letterSounds.I.example'), phonics: t('alphabetRaceGame.letterSounds.I.phonics') },
    'J': { sound: t('alphabetRaceGame.letterSounds.J.sound'), example: t('alphabetRaceGame.letterSounds.J.example'), phonics: t('alphabetRaceGame.letterSounds.J.phonics') },
    'K': { sound: t('alphabetRaceGame.letterSounds.K.sound'), example: t('alphabetRaceGame.letterSounds.K.example'), phonics: t('alphabetRaceGame.letterSounds.K.phonics') },
    'L': { sound: t('alphabetRaceGame.letterSounds.L.sound'), example: t('alphabetRaceGame.letterSounds.L.example'), phonics: t('alphabetRaceGame.letterSounds.L.phonics') },
    'M': { sound: t('alphabetRaceGame.letterSounds.M.sound'), example: t('alphabetRaceGame.letterSounds.M.example'), phonics: t('alphabetRaceGame.letterSounds.M.phonics') },
    'N': { sound: t('alphabetRaceGame.letterSounds.N.sound'), example: t('alphabetRaceGame.letterSounds.N.example'), phonics: t('alphabetRaceGame.letterSounds.N.phonics') },
    'O': { sound: t('alphabetRaceGame.letterSounds.O.sound'), example: t('alphabetRaceGame.letterSounds.O.example'), phonics: t('alphabetRaceGame.letterSounds.O.phonics') },
    'P': { sound: t('alphabetRaceGame.letterSounds.P.sound'), example: t('alphabetRaceGame.letterSounds.P.example'), phonics: t('alphabetRaceGame.letterSounds.P.phonics') },
    'Q': { sound: t('alphabetRaceGame.letterSounds.Q.sound'), example: t('alphabetRaceGame.letterSounds.Q.example'), phonics: t('alphabetRaceGame.letterSounds.Q.phonics') },
    'R': { sound: t('alphabetRaceGame.letterSounds.R.sound'), example: t('alphabetRaceGame.letterSounds.R.example'), phonics: t('alphabetRaceGame.letterSounds.R.phonics') },
    'S': { sound: t('alphabetRaceGame.letterSounds.S.sound'), example: t('alphabetRaceGame.letterSounds.S.example'), phonics: t('alphabetRaceGame.letterSounds.S.phonics') },
    'T': { sound: t('alphabetRaceGame.letterSounds.T.sound'), example: t('alphabetRaceGame.letterSounds.T.example'), phonics: t('alphabetRaceGame.letterSounds.T.phonics') },
    'U': { sound: t('alphabetRaceGame.letterSounds.U.sound'), example: t('alphabetRaceGame.letterSounds.U.example'), phonics: t('alphabetRaceGame.letterSounds.U.phonics') },
    'V': { sound: t('alphabetRaceGame.letterSounds.V.sound'), example: t('alphabetRaceGame.letterSounds.V.example'), phonics: t('alphabetRaceGame.letterSounds.V.phonics') },
    'W': { sound: t('alphabetRaceGame.letterSounds.W.sound'), example: t('alphabetRaceGame.letterSounds.W.example'), phonics: t('alphabetRaceGame.letterSounds.W.phonics') },
    'X': { sound: t('alphabetRaceGame.letterSounds.X.sound'), example: t('alphabetRaceGame.letterSounds.X.example'), phonics: t('alphabetRaceGame.letterSounds.X.phonics') },
    'Y': { sound: t('alphabetRaceGame.letterSounds.Y.sound'), example: t('alphabetRaceGame.letterSounds.Y.example'), phonics: t('alphabetRaceGame.letterSounds.Y.phonics') },
    'Z': { sound: t('alphabetRaceGame.letterSounds.Z.sound'), example: t('alphabetRaceGame.letterSounds.Z.example'), phonics: t('alphabetRaceGame.letterSounds.Z.phonics') }
  };

  const characters = [
    { emoji: '🚗', name: t('alphabetRaceGame.characters.raceCar.name'), speed: 1.2, voice: t('alphabetRaceGame.characters.raceCar.voice') },
    { emoji: '🚂', name: t('alphabetRaceGame.characters.train.name'), speed: 1.0, voice: t('alphabetRaceGame.characters.train.voice') },
    { emoji: '🚀', name: t('alphabetRaceGame.characters.rocket.name'), speed: 1.5, voice: t('alphabetRaceGame.characters.rocket.voice') },
    { emoji: '🦄', name: t('alphabetRaceGame.characters.unicorn.name'), speed: 1.3, voice: t('alphabetRaceGame.characters.unicorn.voice') }
  ];

  // Translated funny messages
  const funnyMessages = [
    t('alphabetRaceGame.letterRecognition.correct.excellent'),
    t('alphabetRaceGame.letterRecognition.correct.perfect'),
    t('alphabetRaceGame.letterRecognition.correct.amazing'),
    t('alphabetRaceGame.letterRecognition.correct.fantastic'),
    t('alphabetRaceGame.letterRecognition.correct.superb'),
    t('alphabetRaceGame.letterRecognition.correct.greatJob')
  ];

  // Initialize Web Speech API
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toUpperCase().trim();
        handleVoiceInput(transcript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [level, gameMode]);

  const speakText = (text, rate = 0.8) => {
    if (!voiceEnabled || !synthRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.2;
    utterance.volume = 1;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Speak after a short delay
    setTimeout(() => {
      synthRef.current.speak(utterance);
    }, 100);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setFeedback(t('alphabetRaceGame.voiceControls.listeningPrompt'));
    } catch (error) {
      console.error('Speech recognition start error:', error);
      setFeedback(t('alphabetRaceGame.voiceControls.microphoneError'));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceInput = (spokenText) => {
    setIsListening(false);
    
    if (gameMode === 'letters') {
      handleLetterSelect(spokenText.charAt(0));
    } else if (gameMode === 'race') {
      handleRaceInput(spokenText.charAt(0));
    } else if (gameMode === 'spelling') {
      if (spokenText.length === 1) {
        setSpelledWord(prev => prev + spokenText);
      } else if (spokenText === wordToSpell) {
        checkSpelling();
      }
    }
  };

  const initializeGame = () => {
    setFeedback("");
    setSpelledWord("");
    setPlayerPosition(0);
    setOpponentPosition(0);
    setWrongAttempts(0);
    setShowLetterHint(false);
    setShowWordHint(false);
    setLetterHint('');
    
    // Generate custom letters based on level
    const startIndex = Math.min(level - 1, 22);
    const newCustomLetters = alphabet.slice(startIndex, startIndex + 4);
    setCustomLetters(newCustomLetters);
    
    if (gameMode === 'letters') {
      generateLetterQuestion();
    } else if (gameMode === 'race') {
      generateRaceTrack();
    } else if (gameMode === 'spelling') {
      generateSpellingWord();
    }
    
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const generateLetterQuestion = () => {
    const letterIndex = Math.min(level - 1, 25);
    const targetLetter = alphabet[letterIndex];
    setCurrentLetter(targetLetter);
    setCurrentSound(letterSounds[targetLetter].sound);
    setCurrentPhonics(letterSounds[targetLetter].phonics);
    setLetterHint(letterSounds[targetLetter].example);
    
    // Generate options using custom letters
    const options = [targetLetter];
    while (options.length < 4) {
      const randomLetter = customLetters[Math.floor(Math.random() * customLetters.length)];
      if (!options.includes(randomLetter)) {
        options.push(randomLetter);
      }
    }
    setLetterOptions(options.sort(() => Math.random() - 0.5));
    
    // Speak the letter if voice is enabled
    if (voiceEnabled) {
      setTimeout(() => {
        speakText(`Find the letter ${targetLetter}. ${letterSounds[targetLetter].example}`);
      }, 500);
    }
  };

  const generateRaceTrack = () => {
    const trackLength = Math.min(10 + level * 2, 26);
    const trackLetters = alphabet.slice(0, trackLength);
    setRaceTrack(trackLetters);
    
    if (voiceEnabled) {
      speakText(`Race time! Type letters from A to ${trackLetters[trackLetters.length - 1]}`);
    }
  };

  const generateSpellingWord = () => {
    const levelWords = simpleWords.filter(word => word.word.length <= Math.min(3 + Math.floor(level / 2), 6));
    const randomWord = levelWords[Math.floor(Math.random() * levelWords.length)];
    setWordToSpell(randomWord.word);
    setLetterHint(randomWord.hint);
    
    if (voiceEnabled) {
      speakText(`Spell the word: ${randomWord.hint}. The word starts with ${randomWord.word.charAt(0)}`);
    }
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

  // Opponent AI for race mode
  useEffect(() => {
    if (gameMode === 'race' && !gameOver && opponentPosition < raceTrack.length - 1) {
      const interval = setInterval(() => {
        setOpponentPosition(prev => {
          const newPos = prev + (Math.random() * 0.3);
          if (newPos >= raceTrack.length - 1) {
            clearInterval(interval);
            setGameOver(true);
            return raceTrack.length - 1;
          }
          return newPos;
        });
      }, 800 - (level * 50));
      
      return () => clearInterval(interval);
    }
  }, [gameMode, gameOver, opponentPosition, raceTrack.length, level]);

  const handleLetterSelect = (letter) => {
    const isCorrect = letter === currentLetter;
    
    if (isCorrect) {
      const points = level * 15 + streak * 5;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      setWrongAttempts(0);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      const message = `${funnyMessages[Math.floor(Math.random() * funnyMessages.length)]} +${points}`;
      setFeedback(message);
      
      if (voiceEnabled) {
        speakText(`Correct! ${currentLetter} is for ${letterSounds[currentLetter].example.split('is for ')[1]}`);
      }
      
      // Move to next letter
      setTimeout(() => {
        if (level < 26) {
          setLevel(prev => prev + 1);
        }
        generateLetterQuestion();
      }, 1200);
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setStreak(0);
      
      if (newWrongAttempts === 1) {
        // First mistake - give gentle hint
        const hintMessage = t('alphabetRaceGame.letterRecognition.firstMistake', {
          letter,
          hint: letterHint
        });
        setFeedback(`❌ ${hintMessage}`);
        setShowLetterHint(true);
        
        if (voiceEnabled) {
          speakText(`That's ${letter}. Try ${currentLetter}. ${letterHint}`);
        }
      } else if (newWrongAttempts === 2) {
        // Second mistake - show phonics hint
        const phonicsHint = t('alphabetRaceGame.letterRecognition.secondMistake', {
          phonics: currentPhonics
        });
        setFeedback(`❌ ${phonicsHint}`);
        
        if (voiceEnabled) {
          speakText(`The sound is ${currentSound}. ${currentPhonics}`);
        }
      } else {
        // Third mistake - show answer
        const newLives = lives - 1;
        setLives(newLives);
        setWrongAttempts(0);
        
        const exampleWord = letterSounds[currentLetter].example.split('is for ')[1];
        const penaltyText = newLives < lives ? '-1 Heart' : '';
        
        setFeedback(t('alphabetRaceGame.letterRecognition.thirdMistake', {
          letter: currentLetter,
          example: exampleWord,
          penalty: penaltyText
        }));
        
        if (voiceEnabled) {
          speakText(`It's ${currentLetter}. ${letterSounds[currentLetter].example}`);
        }
        
        if (newLives <= 0) {
          setTimeout(() => setGameOver(true), 1200);
        }
        
        // Move to next letter after mistake
        setTimeout(() => {
          if (level < 26) {
            setLevel(prev => prev + 1);
          }
          generateLetterQuestion();
        }, 1500);
        
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (gameMode === 'race') {
      const key = e.key.toUpperCase();
      if (alphabet.includes(key)) {
        handleRaceInput(key);
      }
    } else if (gameMode === 'spelling') {
      if (e.key === 'Enter') {
        checkSpelling();
      } else if (e.key === 'Backspace') {
        setSpelledWord(prev => prev.slice(0, -1));
      } else if (e.key.match(/^[a-zA-Z]$/)) {
        setSpelledWord(prev => prev + e.key.toUpperCase());
      }
    } else if (gameMode === 'letters') {
      const key = e.key.toUpperCase();
      if (alphabet.includes(key)) {
        handleLetterSelect(key);
      }
    }
  };

  const handleRaceInput = (key) => {
    const currentTarget = raceTrack[Math.floor(playerPosition)];
    
    if (key === currentTarget) {
      const newPosition = playerPosition + 1;
      setPlayerPosition(newPosition);
      setWrongAttempts(0);
      
      const points = level * 10;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      setFeedback(t('alphabetRaceGame.raceMode.correct', { letter: key, points }));
      
      if (voiceEnabled) {
        speakText(`${key}! Good job!`);
      }
      
      // Check if race complete
      if (newPosition >= raceTrack.length - 1) {
        handleRaceComplete();
      }
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setStreak(0);
      
      if (newWrongAttempts === 1) {
        setFeedback(t('alphabetRaceGame.raceMode.firstMistake', {
          target: currentTarget,
          pressed: key
        }));
        if (voiceEnabled) {
          speakText(`That's ${key}. Try ${currentTarget}`);
        }
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setWrongAttempts(0);
        
        setFeedback(t('alphabetRaceGame.raceMode.secondMistake', {
          target: currentTarget,
          pressed: key
        }));
        
        if (voiceEnabled) {
          speakText(`It's ${currentTarget}`);
        }
        
        if (newLives <= 0) {
          setTimeout(() => setGameOver(true), 1200);
        }
        
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
    }
  };

  const handleRaceComplete = () => {
    if (streak + 1 >= 5) {
      const newLives = Math.min(lives + 1, 5);
      setLives(newLives);
      setFeedback(prev => `${prev} ${t('alphabetRaceGame.spellingMode.bonusHeart')}`);
      onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
    }
    
    if (voiceEnabled) {
      speakText(t('alphabetRaceGame.raceMode.raceComplete'));
    }
    
    setTimeout(() => {
      setLevel(prev => prev + 1);
      setFeedback(t('alphabetRaceGame.raceMode.nextLevel'));
      initializeGame();
    }, 2000);
  };

  const checkSpelling = () => {
    if (spelledWord.toUpperCase() === wordToSpell) {
      const points = wordToSpell.length * 10 + level * 5;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      setWrongAttempts(0);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      const wordData = simpleWords.find(w => w.word === wordToSpell);
      const emoji = wordData?.emoji || '🔤';
      
      setFeedback(t('alphabetRaceGame.spellingMode.correct', {
        word: wordToSpell,
        emoji,
        points
      }));
      
      if (voiceEnabled) {
        speakText(`Correct! ${wordToSpell}. ${wordData?.hint}`);
      }
      
      setTimeout(() => {
        if (level % 3 === 0) {
          const newLives = Math.min(lives + 1, 5);
          setLives(newLives);
          setFeedback(prev => `${prev} ${t('alphabetRaceGame.spellingMode.bonusHeart')}`);
          onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
        }
        
        setLevel(prev => prev + 1);
        generateSpellingWord();
        setSpelledWord("");
      }, 1500);
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setStreak(0);
      
      if (newWrongAttempts === 1) {
        const wordData = simpleWords.find(w => w.word === wordToSpell);
        setFeedback(t('alphabetRaceGame.spellingMode.firstMistake', { hint: wordData?.hint }));
        setShowWordHint(true);
        
        if (voiceEnabled) {
          speakText(`Try again. Hint: ${wordData?.hint}`);
        }
      } else if (newWrongAttempts === 2) {
        setFeedback(t('alphabetRaceGame.spellingMode.secondMistake', {
          firstLetter: wordToSpell.charAt(0),
          length: wordToSpell.length
        }));
        
        if (voiceEnabled) {
          speakText(`Starts with ${wordToSpell.charAt(0)}. ${wordToSpell.length} letters`);
        }
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setWrongAttempts(0);
        
        const wordData = simpleWords.find(w => w.word === wordToSpell);
        setFeedback(t('alphabetRaceGame.spellingMode.thirdMistake', {
          word: wordToSpell,
          emoji: wordData?.emoji || '🔤'
        }));
        
        if (voiceEnabled) {
          speakText(`It's ${wordToSpell}. ${wordData?.hint}`);
        }
        
        if (newLives <= 0) {
          setTimeout(() => setGameOver(true), 1200);
        }
        
        // Move to next word
        setTimeout(() => {
          setLevel(prev => prev + 1);
          generateSpellingWord();
          setSpelledWord("");
        }, 1500);
        
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
    }
  };

  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'boost':
        if (gameMode === 'race') {
          setPlayerPosition(prev => Math.min(prev + 2, raceTrack.length - 1));
          setFeedback(t('alphabetRaceGame.powerUps.boost.feedback'));
          if (voiceEnabled) speakText("Speed boost!");
        }
        break;
      case 'shield':
        const newLives = Math.min(lives + 1, 5);
        setLives(newLives);
        setFeedback(t('alphabetRaceGame.powerUps.shield.feedback'));
        if (voiceEnabled) speakText("Extra heart!");
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
        break;
      case 'slowOpponent':
        setOpponentPosition(prev => Math.max(prev - 1, 0));
        setFeedback(t('alphabetRaceGame.powerUps.slowOpponent.feedback'));
        if (voiceEnabled) speakText("Opponent slowed!");
        break;
      case 'hint':
        if (gameMode === 'letters') {
          setShowLetterHint(true);
          setFeedback(t('alphabetRaceGame.powerUps.hint.feedback', { hint: letterHint }));
          if (voiceEnabled) speakText(t('alphabetRaceGame.powerUps.hint.feedback', { hint: letterHint }));
        } else if (gameMode === 'spelling') {
          const wordData = simpleWords.find(w => w.word === wordToSpell);
          setShowWordHint(true);
          setFeedback(t('alphabetRaceGame.powerUps.hint.feedback', { hint: wordData?.hint }));
          if (voiceEnabled) speakText(t('alphabetRaceGame.powerUps.hint.feedback', { hint: wordData?.hint }));
        }
        break;
      case 'voiceHelp':
        if (gameMode === 'letters') {
          speakText(`${currentLetter}. ${letterSounds[currentLetter].example}. ${letterSounds[currentLetter].phonics}`);
          setFeedback(t('alphabetRaceGame.powerUps.voiceHelp.feedback'));
        } else if (gameMode === 'spelling') {
          const wordData = simpleWords.find(w => w.word === wordToSpell);
          speakText(`Spell ${wordToSpell}. ${wordData?.hint}. The letters are: ${wordToSpell.split('').join(', ')}`);
          setFeedback(t('alphabetRaceGame.powerUps.voiceHelp.feedback'));
        }
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
    setPowerUps({
      boost: 2,
      shield: 1,
      slowOpponent: 1,
      hint: 2,
      voiceHelp: 3
    });
    initializeGame();
    
    onGameEvent?.({ type: 'scoreUpdate', payload: 0 });
    onGameEvent?.({ type: 'heartsUpdate', payload: 3 });
  };

  const speakCurrentLetter = () => {
    if (gameMode === 'letters') {
      speakText(`${currentLetter}. ${letterSounds[currentLetter].example}. ${letterSounds[currentLetter].phonics}`);
    } else if (gameMode === 'spelling') {
      const wordData = simpleWords.find(w => w.word === wordToSpell);
      speakText(`Spell ${wordToSpell}. ${wordData?.hint}`);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerPosition, spelledWord, gameMode, currentLetter]);

  // Game Over Screen
  if (gameOver) {
    return (
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'min-h-[400px]'} p-3 w-full`}>
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#3F51B5]/30">
          <div className="text-4xl mb-3 text-center">🏁</div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {gameMode === 'race' && opponentPosition >= raceTrack.length - 1 
              ? t('alphabetRaceGame.gameOver.opponentWon') 
              : t('alphabetRaceGame.gameOver.playerWon')}
          </h1>
          <p className="text-gray-300 mb-4 text-sm text-center">
            {gameMode === 'race' 
              ? opponentPosition >= raceTrack.length - 1 
                ? t('alphabetRaceGame.gameOver.raceLost')
                : t('alphabetRaceGame.gameOver.raceWon')
              : t('alphabetRaceGame.gameOver.greatLearning')}
          </p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{score}</div>
              <div className="text-gray-400 text-xs text-center">
                {t('alphabetRaceGame.gameOver.score')}
              </div>
            </div>
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{level}</div>
              <div className="text-gray-400 text-xs text-center">
                {t('alphabetRaceGame.gameOver.level')}
              </div>
            </div>
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{streak}</div>
              <div className="text-gray-400 text-xs text-center">
                {t('alphabetRaceGame.gameOver.bestStreak')}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2 text-center">
              {t('alphabetRaceGame.gameOver.lettersLearned')}
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              {alphabet.slice(0, Math.min(level, 26)).map(letter => (
                <div key={letter} className="w-6 h-6 md:w-8 md:h-8 rounded bg-[#3F51B5] flex items-center justify-center text-white font-bold">
                  {letter}
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#3F51B5] to-[#2196F3] text-white font-bold hover:opacity-90 text-sm"
          >
            {t('alphabetRaceGame.gameOver.playAgain')}
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
              {['✨', '🏆', '🌟', '🎉'][i % 4]}
            </div>
          ))}
        </div>
      )}

      <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#3F51B5]/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r from-[#3F51B5] to-[#2196F3]`}>
              <span className="text-lg">{selectedCharacter}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">
                {t('alphabetRaceGame.gameHeader.title')}
              </h1>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">
                  {t('alphabetRaceGame.gameHeader.level', { level })}
                </span>
                {streak > 0 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-yellow-400">
                      {t('alphabetRaceGame.gameHeader.streak', { streak })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#3F51B5]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#3F51B5]/20 rounded-lg hover:bg-[#3F51B5]/10 transition-colors"
              title={soundEnabled ? t('alphabetRaceGame.buttons.soundOn') : t('alphabetRaceGame.buttons.soundOff')}
            >
              {soundEnabled ? 
                <Volume2 className="w-4 h-4 text-green-400" /> : 
                <VolumeX className="w-4 h-4 text-gray-400" />
              }
            </button>
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (!voiceEnabled && synthRef.current) {
                  speakText("Voice help activated!");
                }
              }}
              className={`p-1.5 bg-[#1A1A2E] border ${voiceEnabled ? 'border-green-500/30 text-green-400' : 'border-[#3F51B5]/20 text-gray-400'} rounded-lg hover:bg-[#3F51B5]/10 transition-colors`}
              title={voiceEnabled ? t('alphabetRaceGame.buttons.voiceOn') : t('alphabetRaceGame.buttons.voiceOff')}
            >
              <Speaker className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => { setGameMode('letters'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'letters' ? 'bg-gradient-to-r from-[#3F51B5] to-[#2196F3] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <BookOpen className="inline w-3 h-3 mr-1" />
            {t('alphabetRaceGame.gameModes.letters')}
          </button>
          <button
            onClick={() => { setGameMode('race'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'race' ? 'bg-gradient-to-r from-[#3F51B5] to-[#2196F3] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Car className="inline w-3 h-3 mr-1" />
            {t('alphabetRaceGame.gameModes.race')}
          </button>
          <button
            onClick={() => { setGameMode('spelling'); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'spelling' ? 'bg-gradient-to-r from-[#3F51B5] to-[#2196F3] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            📝 {t('alphabetRaceGame.gameModes.spelling')}
          </button>
          <button
            onClick={() => { setGameMode('timed'); setTimeLeft(45); initializeGame(); }}
            className={`flex-shrink-0 py-1.5 px-3 rounded-lg text-xs font-bold ${gameMode === 'timed' ? 'bg-gradient-to-r from-[#3F51B5] to-[#2196F3] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Clock className="inline w-3 h-3 mr-1" />
            {t('alphabetRaceGame.gameModes.timed')}
          </button>
        </div>

        {/* Timed Mode Timer */}
        {gameMode === 'timed' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">
                {t('alphabetRaceGame.timer.timeLeft')}
              </span>
              <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                {t('alphabetRaceGame.timer.seconds', { time: timeLeft })}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-[#3F51B5] to-[#2196F3] h-1.5 rounded-full transition-all"
                style={{ width: `${(timeLeft / 45) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-600'}`}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={speakCurrentLetter}
              disabled={!voiceEnabled}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${voiceEnabled ? 'bg-[#3F51B5] text-white' : 'bg-gray-700 text-gray-400'}`}
              title={t('alphabetRaceGame.voiceControls.repeatInstructions')}
            >
              <Speaker className="w-3 h-3" />
              {t('alphabetRaceGame.buttons.repeat')}
            </button>
            
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!voiceEnabled}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${isListening ? 'bg-red-500 text-white animate-pulse' : voiceEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}
              title={isListening ? t('alphabetRaceGame.voiceControls.stopListening') : t('alphabetRaceGame.voiceControls.startVoiceInput')}
            >
              {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {isListening ? t('alphabetRaceGame.voiceControls.listening') : t('alphabetRaceGame.voiceControls.speak')}
            </button>
          </div>
        </div>

        {/* Current Custom Letters */}
        <div className="mb-3 p-2 bg-[#1A1A2E]/50 rounded-lg border border-[#3F51B5]/20">
          <div className="text-xs text-gray-400 mb-1 text-center">
            {t('alphabetRaceGame.practiceLetters.title')}
          </div>
          <div className="flex justify-center gap-2">
            {customLetters.map(letter => (
              <div key={letter} className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-[#3F51B5] to-[#2196F3] flex items-center justify-center text-white font-bold text-lg">
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="space-y-4">
          {gameMode === 'letters' ? (
            // Letter Recognition Mode
            <div className="text-center mb-3">
              <div className="text-6xl font-bold text-white mb-2">{currentLetter}</div>
              <div className="text-sm text-gray-300 mb-1">{currentSound}</div>
              {showLetterHint && (
                <div className="text-xs text-blue-300 mb-2">💡 {letterHint}</div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {letterOptions.map((letter, index) => (
                  <button
                    key={index}
                    onClick={() => handleLetterSelect(letter)}
                    className="p-4 rounded-lg bg-[#1A1A2E] border border-[#3F51B5]/30 text-white text-2xl font-bold hover:bg-[#3F51B5]/20 hover:scale-105 transition-all"
                  >
                    {letter}
                  </button>
                ))}
              </div>
              
              <div className="text-xs text-gray-500">
                {t('alphabetRaceGame.letterRecognition.clickOrSay', { letter: currentLetter })}
              </div>
            </div>
          ) : gameMode === 'race' ? (
            // Race Mode
            <div className="mb-3">
              <div className="relative h-32 rounded-lg border-2 border-[#3F51B5]/30 overflow-hidden mb-3 bg-gradient-to-b from-gray-900 to-gray-800">
                {/* Race Track */}
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-2 bg-gradient-to-r from-yellow-500 to-yellow-300"></div>
                </div>
                
                {/* Track Letters */}
                {raceTrack.map((letter, index) => (
                  <div
                    key={index}
                    className={`absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center ${index <= playerPosition ? 'text-green-400' : 'text-gray-400'}`}
                    style={{ left: `${(index / (raceTrack.length - 1)) * 95 + 2.5}%` }}
                  >
                    <div className={`text-xs ${index <= playerPosition ? 'font-bold' : ''}`}>{letter}</div>
                    {index === Math.floor(playerPosition) && (
                      <div className="text-lg">{selectedCharacter}</div>
                    )}
                  </div>
                ))}
                
                {/* Finish Line */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-r from-transparent via-white/30 to-white/50"></div>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-sm font-bold">
                  🏁
                </div>
                
                {/* Opponent */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ left: `${(opponentPosition / (raceTrack.length - 1)) * 95}%` }}
                >
                  <div className="text-lg">🤖</div>
                </div>
              </div>
              
              <div className="text-center mb-3">
                <div className="text-sm text-gray-400 mb-1">
                  {t('alphabetRaceGame.raceMode.typeOrSay')}
                </div>
                <div className="text-3xl font-bold text-white">
                  {raceTrack[Math.floor(playerPosition)] || '🏁'}
                </div>
              </div>
              
              <input
                ref={inputRef}
                type="text"
                className="w-full p-2 text-center bg-[#16213E] border border-[#3F51B5]/30 rounded-lg text-white text-lg focus:outline-none focus:border-[#2196F3]"
                placeholder={t('alphabetRaceGame.raceMode.nextLetter')}
                autoFocus
                readOnly
              />
            </div>
          ) : gameMode === 'spelling' ? (
            // Spelling Mode
            <div className="text-center mb-3">
              <div className="text-lg font-bold text-white mb-2">
                {t('alphabetRaceGame.spellingMode.title')}
              </div>
              
              {/* Word Image/Emoji */}
              <div className="text-4xl mb-3">
                {simpleWords.find(w => w.word === wordToSpell)?.emoji || '🔤'}
              </div>
              
              {showWordHint && (
                <div className="text-xs text-blue-300 mb-2">💡 {letterHint}</div>
              )}
              
              {/* Word blanks */}
              <div className="flex justify-center gap-1 mb-3">
                {wordToSpell.split('').map((letter, index) => (
                  <div key={index} className="w-8 h-8 md:w-10 md:h-10 border-b-2 border-[#3F51B5] flex items-center justify-center">
                    <span className="text-white font-bold">
                      {spelledWord[index] || '_'}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Current word display */}
              <div className="mb-3">
                <div className="text-sm text-gray-400">
                  {t('alphabetRaceGame.spellingMode.currentWord')}
                </div>
                <div className="text-xl font-bold text-white">
                  {spelledWord || t('alphabetRaceGame.spellingMode.startTyping')}
                </div>
              </div>
              
              {/* Custom Keyboard */}
              <div className="grid grid-cols-7 md:grid-cols-9 gap-1 mb-3">
                {customLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => setSpelledWord(prev => prev + letter)}
                    className="p-2 rounded bg-[#1A1A2E] border border-[#3F51B5]/30 text-white text-sm hover:bg-[#3F51B5]/20"
                  >
                    {letter}
                  </button>
                ))}
                <button
                  onClick={() => setSpelledWord("")}
                  className="p-2 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-sm col-span-2"
                >
                  {t('alphabetRaceGame.spellingMode.clear')}
                </button>
                {alphabet.filter(l => !customLetters.includes(l)).slice(0, 7).map(letter => (
                  <button
                    key={letter}
                    onClick={() => setSpelledWord(prev => prev + letter)}
                    className="p-2 rounded bg-[#1A1A2E] border border-gray-700 text-gray-400 text-sm hover:bg-gray-700/50"
                  >
                    {letter}
                  </button>
                ))}
                <button
                  onClick={checkSpelling}
                  className="p-2 rounded bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold col-span-2"
                >
                  {t('alphabetRaceGame.spellingMode.checkSpelling')}
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                {t('alphabetRaceGame.spellingMode.instructions', { hint: simpleWords.find(w => w.word === wordToSpell)?.hint })}
              </div>
            </div>
          ) : null}

          {/* Power-ups */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => usePowerUp('hint')}
              disabled={powerUps.hint <= 0}
              className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.hint <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#FF9800]/30 text-white hover:bg-[#FF9800]/10 transition-colors'}`}
              title={t('alphabetRaceGame.powerUps.hint.description')}
            >
              <div className="text-sm">💡</div>
              <div>{t('alphabetRaceGame.powerUps.hint.name')}</div>
              <div className="text-xs text-gray-400">x{powerUps.hint}</div>
            </button>
            
            <button
              onClick={() => usePowerUp('voiceHelp')}
              disabled={powerUps.voiceHelp <= 0 || !voiceEnabled}
              className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.voiceHelp <= 0 || !voiceEnabled ? 'border-gray-600/30 text-gray-500' : 'border-[#4CAF50]/30 text-white hover:bg-[#4CAF50]/10 transition-colors'}`}
              title={t('alphabetRaceGame.powerUps.voiceHelp.description')}
            >
              <div className="text-sm">🔊</div>
              <div>{t('alphabetRaceGame.powerUps.voiceHelp.name')}</div>
              <div className="text-xs text-gray-400">x{powerUps.voiceHelp}</div>
            </button>
            
            <button
              onClick={() => usePowerUp('boost')}
              disabled={powerUps.boost <= 0 || gameMode !== 'race'}
              className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.boost <= 0 || gameMode !== 'race' ? 'border-gray-600/30 text-gray-500' : 'border-[#FF9800]/30 text-white hover:bg-[#FF9800]/10 transition-colors'}`}
              title={t('alphabetRaceGame.powerUps.boost.description')}
            >
              <div className="text-sm">🚀</div>
              <div>{t('alphabetRaceGame.powerUps.boost.name')}</div>
              <div className="text-xs text-gray-400">x{powerUps.boost}</div>
            </button>
            
            <button
              onClick={() => usePowerUp('shield')}
              disabled={powerUps.shield <= 0}
              className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.shield <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#4CAF50]/30 text-white hover:bg-[#4CAF50]/10 transition-colors'}`}
              title={t('alphabetRaceGame.powerUps.shield.description')}
            >
              <div className="text-sm">🛡️</div>
              <div>{t('alphabetRaceGame.powerUps.shield.name')}</div>
              <div className="text-xs text-gray-400">x{powerUps.shield}</div>
            </button>
            
            <button
              onClick={() => usePowerUp('slowOpponent')}
              disabled={powerUps.slowOpponent <= 0 || gameMode !== 'race'}
              className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.slowOpponent <= 0 || gameMode !== 'race' ? 'border-gray-600/30 text-gray-500' : 'border-[#9C27B0]/30 text-white hover:bg-[#9C27B0]/10 transition-colors'}`}
              title={t('alphabetRaceGame.powerUps.slowOpponent.description')}
            >
              <div className="text-sm">🐢</div>
              <div>{t('alphabetRaceGame.powerUps.slowOpponent.name')}</div>
              <div className="text-xs text-gray-400">x{powerUps.slowOpponent}</div>
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`rounded-lg p-2 text-center text-sm font-bold mb-2 ${
              feedback.includes('+') || feedback.includes('✅')
                ? 'bg-gradient-to-r from-[#4CAF50]/10 to-[#8BC34A]/10 text-[#4CAF50]'
                : feedback.includes('❌')
                ? 'bg-gradient-to-r from-[#F44336]/10 to-[#E91E63]/10 text-[#F44336]'
                : feedback.includes('💡') || feedback.includes('🔊')
                ? 'bg-gradient-to-r from-[#2196F3]/10 to-[#03A9F4]/10 text-[#2196F3]'
                : 'bg-gradient-to-r from-[#3F51B5]/10 to-[#2196F3]/10 text-[#3F51B5]'
            }`}>
              {feedback}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-3 pt-2 border-t border-[#3F51B5]/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="text-lg">🎤</span>
                <span>{t('alphabetRaceGame.instructions.useVoice')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">💡</span>
                <span>{t('alphabetRaceGame.instructions.hintsAfterMistakes')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">🔊</span>
                <span>{t('alphabetRaceGame.instructions.turnOnVoice')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">🏆</span>
                <span>{t('alphabetRaceGame.instructions.practiceLetters')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlphabetRaceGame;