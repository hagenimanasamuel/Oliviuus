import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Clock, Volume2, VolumeX, Search, Map, Camera, Binoculars, Compass, Zap, Star, Home, Mic, MicOff, Speaker, Volume } from 'lucide-react';
import { useTranslation } from "react-i18next";

const AnimalSafariGame = ({ onGameEvent, isFullscreen }) => {
  const { t } = useTranslation(); // Initialize translation hook
  
  const [gameMode, setGameMode] = useState('explore');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('🦁');
  
  const [currentHabitat, setCurrentHabitat] = useState('savannah');
  const [animals, setAnimals] = useState([]);
  const [foundAnimals, setFoundAnimals] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playerPosition, setPlayerPosition] = useState({ x: 50, y: 50 });
  const [cameraPhotos, setCameraPhotos] = useState([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [animalToFind, setAnimalToFind] = useState(null);
  const [animalAnnouncement, setAnimalAnnouncement] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showAnimalHint, setShowAnimalHint] = useState(false);
  const [customAnimals, setCustomAnimals] = useState([]);
  
  const [powerUps, setPowerUps] = useState({
    binoculars: 2,
    camera: 3,
    map: 1,
    hint: 2,
    voiceHelp: 3
  });
  
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const gameContainerRef = useRef(null);

  const habitats = {
    savannah: {
      name: t('animalSafariGame.habitat.savannah.name'),
      color: 'from-[#F59E0B] to-[#D97706]',
      bgColor: '#FEF3C7',
      description: t('animalSafariGame.habitat.savannah.description'),
      emoji: '🌾',
      animals: [
        { id: 1, emoji: '🦁', name: t('animalSafariGame.animals.lion.name'), sound: t('animalSafariGame.animals.lion.sound'), hint: t('animalSafariGame.animals.lion.hint'), voice: t('animalSafariGame.animals.lion.voice') },
        { id: 2, emoji: '🐘', name: t('animalSafariGame.animals.elephant.name'), sound: t('animalSafariGame.animals.elephant.sound'), hint: t('animalSafariGame.animals.elephant.hint'), voice: t('animalSafariGame.animals.elephant.voice') },
        { id: 3, emoji: '🦒', name: t('animalSafariGame.animals.giraffe.name'), sound: t('animalSafariGame.animals.giraffe.sound'), hint: t('animalSafariGame.animals.giraffe.hint'), voice: t('animalSafariGame.animals.giraffe.voice') },
        { id: 4, emoji: '🦓', name: t('animalSafariGame.animals.zebra.name'), sound: t('animalSafariGame.animals.zebra.sound'), hint: t('animalSafariGame.animals.zebra.hint'), voice: t('animalSafariGame.animals.zebra.voice') },
        { id: 5, emoji: '🦛', name: t('animalSafariGame.animals.hippo.name'), sound: t('animalSafariGame.animals.hippo.sound'), hint: t('animalSafariGame.animals.hippo.hint'), voice: t('animalSafariGame.animals.hippo.voice') },
      ]
    },
    jungle: {
      name: t('animalSafariGame.habitat.jungle.name'),
      color: 'from-[#10B981] to-[#059669]',
      bgColor: '#D1FAE5',
      description: t('animalSafariGame.habitat.jungle.description'),
      emoji: '🌴',
      animals: [
        { id: 6, emoji: '🐒', name: t('animalSafariGame.animals.monkey.name'), sound: t('animalSafariGame.animals.monkey.sound'), hint: t('animalSafariGame.animals.monkey.hint'), voice: t('animalSafariGame.animals.monkey.voice') },
        { id: 7, emoji: '🦜', name: t('animalSafariGame.animals.parrot.name'), sound: t('animalSafariGame.animals.parrot.sound'), hint: t('animalSafariGame.animals.parrot.hint'), voice: t('animalSafariGame.animals.parrot.voice') },
        { id: 8, emoji: '🐯', name: t('animalSafariGame.animals.tiger.name'), sound: t('animalSafariGame.animals.tiger.sound'), hint: t('animalSafariGame.animals.tiger.hint'), voice: t('animalSafariGame.animals.tiger.voice') },
        { id: 9, emoji: '🐍', name: t('animalSafariGame.animals.snake.name'), sound: t('animalSafariGame.animals.snake.sound'), hint: t('animalSafariGame.animals.snake.hint'), voice: t('animalSafariGame.animals.snake.voice') },
        { id: 10, emoji: '🦥', name: t('animalSafariGame.animals.sloth.name'), sound: t('animalSafariGame.animals.sloth.sound'), hint: t('animalSafariGame.animals.sloth.hint'), voice: t('animalSafariGame.animals.sloth.voice') },
      ]
    },
    ocean: {
      name: t('animalSafariGame.habitat.ocean.name'),
      color: 'from-[#0EA5E9] to-[#0284C7]',
      bgColor: '#E0F2FE',
      description: t('animalSafariGame.habitat.ocean.description'),
      emoji: '🌊',
      animals: [
        { id: 11, emoji: '🐋', name: t('animalSafariGame.animals.whale.name'), sound: t('animalSafariGame.animals.whale.sound'), hint: t('animalSafariGame.animals.whale.hint'), voice: t('animalSafariGame.animals.whale.voice') },
        { id: 12, emoji: '🐬', name: t('animalSafariGame.animals.dolphin.name'), sound: t('animalSafariGame.animals.dolphin.sound'), hint: t('animalSafariGame.animals.dolphin.hint'), voice: t('animalSafariGame.animals.dolphin.voice') },
        { id: 13, emoji: '🦈', name: t('animalSafariGame.animals.shark.name'), sound: t('animalSafariGame.animals.shark.sound'), hint: t('animalSafariGame.animals.shark.hint'), voice: t('animalSafariGame.animals.shark.voice') },
        { id: 14, emoji: '🐢', name: t('animalSafariGame.animals.turtle.name'), sound: t('animalSafariGame.animals.turtle.sound'), hint: t('animalSafariGame.animals.turtle.hint'), voice: t('animalSafariGame.animals.turtle.voice') },
        { id: 15, emoji: '🦑', name: t('animalSafariGame.animals.squid.name'), sound: t('animalSafariGame.animals.squid.sound'), hint: t('animalSafariGame.animals.squid.hint'), voice: t('animalSafariGame.animals.squid.voice') },
      ]
    },
    arctic: {
      name: t('animalSafariGame.habitat.arctic.name'),
      color: 'from-[#93C5FD] to-[#60A5FA]',
      bgColor: '#DBEAFE',
      description: t('animalSafariGame.habitat.arctic.description'),
      emoji: '❄️',
      animals: [
        { id: 16, emoji: '🐧', name: t('animalSafariGame.animals.penguin.name'), sound: t('animalSafariGame.animals.penguin.sound'), hint: t('animalSafariGame.animals.penguin.hint'), voice: t('animalSafariGame.animals.penguin.voice') },
        { id: 17, emoji: '🐻‍❄️', name: t('animalSafariGame.animals.polarBear.name'), sound: t('animalSafariGame.animals.polarBear.sound'), hint: t('animalSafariGame.animals.polarBear.hint'), voice: t('animalSafariGame.animals.polarBear.voice') },
        { id: 18, emoji: '🦭', name: t('animalSafariGame.animals.seal.name'), sound: t('animalSafariGame.animals.seal.sound'), hint: t('animalSafariGame.animals.seal.hint'), voice: t('animalSafariGame.animals.seal.voice') },
        { id: 19, emoji: '🦊', name: t('animalSafariGame.animals.arcticFox.name'), sound: t('animalSafariGame.animals.arcticFox.sound'), hint: t('animalSafariGame.animals.arcticFox.hint'), voice: t('animalSafariGame.animals.arcticFox.voice') },
        { id: 20, emoji: '🐺', name: t('animalSafariGame.animals.wolf.name'), sound: t('animalSafariGame.animals.wolf.sound'), hint: t('animalSafariGame.animals.wolf.hint'), voice: t('animalSafariGame.animals.wolf.voice') },
      ]
    }
  };

  const characters = [
    { emoji: '🦁', name: t('animalSafariGame.characters.leo.name'), voice: t('animalSafariGame.characters.leo.voice') },
    { emoji: '🐘', name: t('animalSafariGame.characters.ellie.name'), voice: t('animalSafariGame.characters.ellie.voice') },
    { emoji: '🦒', name: t('animalSafariGame.characters.gigi.name'), voice: t('animalSafariGame.characters.gigi.voice') },
    { emoji: '🐒', name: t('animalSafariGame.characters.momo.name'), voice: t('animalSafariGame.characters.momo.voice') }
  ];

  // Translated funny messages
  const funnyMessages = [
    t('animalSafariGame.feedback.correct.greatSpot'),
    t('animalSafariGame.feedback.correct.animalFound'),
    t('animalSafariGame.feedback.correct.safariSuccess'),
    t('animalSafariGame.feedback.correct.wildDiscovery'),
    t('animalSafariGame.feedback.correct.natureExplorer'),
    t('animalSafariGame.feedback.correct.wildlifePro')
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
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
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
      setFeedback(t('animalSafariGame.feedback.listening'));
    } catch (error) {
      console.error('Speech recognition start error:', error);
      setFeedback(t('animalSafariGame.feedback.microphoneError'));
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
    
    if (gameMode === 'explore') {
      // Find animal by name
      const foundAnimal = animals.find(animal => 
        !animal.found && animal.name.toLowerCase() === spokenText
      );
      
      if (foundAnimal) {
        handleAnimalClick(foundAnimal);
      } else if (animalToFind && animalToFind.name.toLowerCase() === spokenText) {
        // Find the specific animal we're looking for
        const targetAnimal = animals.find(a => a.id === animalToFind.id && !a.found);
        if (targetAnimal) {
          handleAnimalClick(targetAnimal);
        }
      } else {
        setFeedback(t('animalSafariGame.feedback.voiceNotHeard', { animal: animalToFind?.name }));
        if (voiceEnabled) {
          speakText(`Try saying ${animalToFind?.name}`);
        }
      }
    } else if (gameMode === 'quiz' && currentQuestion) {
      handleQuestionAnswer(spokenText);
    }
  };

  const initializeGame = () => {
    const habitatKeys = Object.keys(habitats);
    const randomHabitat = habitatKeys[Math.floor(Math.random() * habitatKeys.length)];
    setCurrentHabitat(randomHabitat);
    
    // Select 3-5 animals based on level
    const availableAnimals = habitats[randomHabitat].animals;
    const animalCount = Math.min(3 + Math.floor(level / 2), 5);
    const selectedAnimals = [];
    
    // Create a custom set of animals for this level
    for (let i = 0; i < animalCount; i++) {
      const animal = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
      if (!selectedAnimals.find(a => a.id === animal.id)) {
        selectedAnimals.push(animal);
      }
    }
    
    setCustomAnimals(selectedAnimals);
    
    // Create hidden animals
    const hiddenAnimals = selectedAnimals.map(animal => ({
      ...animal,
      found: false,
      position: {
        x: Math.random() * 70 + 15,
        y: Math.random() * 60 + 20
      }
    }));
    
    setAnimals(hiddenAnimals);
    setFoundAnimals([]);
    setWrongAttempts(0);
    setShowAnimalHint(false);
    
    // Announce first animal to find
    if (hiddenAnimals.length > 0) {
      const firstAnimal = hiddenAnimals[0];
      setAnimalToFind(firstAnimal);
      setAnimalAnnouncement(t('animalSafariGame.feedback.welcomeHabitat', {
        habitat: habitats[randomHabitat].name,
        animal: firstAnimal.name,
        hint: firstAnimal.hint,
        emoji: firstAnimal.emoji
      }));
      
      if (voiceEnabled) {
        speakText(t('animalSafariGame.feedback.welcomeHabitat', {
          habitat: habitats[randomHabitat].name,
          animal: firstAnimal.name,
          hint: firstAnimal.hint,
          emoji: firstAnimal.emoji
        }));
      }
    }
    
    setFeedback(t('animalSafariGame.labels.explorationComplete', {
      habitat: habitats[randomHabitat].name,
      count: hiddenAnimals.length
    }));
    
    // Generate a question about animals
    if (gameMode === 'quiz') {
      generateAnimalQuestion(availableAnimals);
    }
    
    setPlayerPosition({ x: 50, y: 50 });
    setCameraPhotos([]);
    setHintUsed(false);
  };

  const generateAnimalQuestion = (availableAnimals) => {
    const randomAnimal = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
    const questionTypes = [
      {
        type: 'sound',
        question: t('animalSafariGame.questions.sound', { animal: randomAnimal.name }),
        answer: randomAnimal.sound.toLowerCase().replace('!', ''),
        options: generateSoundOptions(randomAnimal)
      },
      {
        type: 'fact',
        question: t('animalSafariGame.questions.fact', { animal: randomAnimal.name }),
        answer: randomAnimal.fact?.toLowerCase() || '',
        options: generateFactOptions(randomAnimal)
      },
      {
        type: 'name',
        question: t('animalSafariGame.questions.name', { sound: randomAnimal.sound }),
        answer: randomAnimal.name.toLowerCase(),
        options: generateNameOptions(randomAnimal)
      }
    ];
    
    const randomQuestion = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    setCurrentQuestion({
      ...randomQuestion,
      animal: randomAnimal
    });
    
    if (voiceEnabled) {
      speakText(randomQuestion.question);
    }
  };

  const generateSoundOptions = (correctAnimal) => {
    const allSounds = ['roar', 'trumpet', 'moo', 'bray', 'grunt', 'chatter', 'squawk', 'growl', 'hiss', 'sing', 'click', 'honk', 'bark', 'yip', 'howl'];
    const options = [correctAnimal.sound.toLowerCase().replace('!', '')];
    
    while (options.length < 4) {
      const randomSound = allSounds[Math.floor(Math.random() * allSounds.length)];
      if (!options.includes(randomSound)) {
        options.push(randomSound);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const generateFactOptions = (correctAnimal) => {
    const allFacts = [
      'they sleep standing up.',
      'they can recognize themselves in mirrors.',
      'they have blue blood.',
      'they can fly backwards.',
      'they change color with mood.',
      'they have striped skin.',
      'they use tools to eat.',
      'they can hold breath for 2 hours.',
      'they have three hearts.',
      'they propose with pebbles.'
    ];
    
    const options = [correctAnimal.fact?.toLowerCase() || 'they are unique animals.'];
    
    while (options.length < 4) {
      const randomFact = allFacts[Math.floor(Math.random() * allFacts.length)];
      if (!options.includes(randomFact)) {
        options.push(randomFact);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const generateNameOptions = (correctAnimal) => {
    const allAnimals = [...habitats.savannah.animals, ...habitats.jungle.animals, ...habitats.ocean.animals, ...habitats.arctic.animals];
    const options = [correctAnimal.name.toLowerCase()];
    
    while (options.length < 4) {
      const randomAnimal = allAnimals[Math.floor(Math.random() * allAnimals.length)];
      if (!options.includes(randomAnimal.name.toLowerCase())) {
        options.push(randomAnimal.name.toLowerCase());
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
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

  const handleAnimalClick = (animal) => {
    if (animal.found) return;
    
    // Check if this is the animal we're supposed to find
    const isTargetAnimal = animalToFind && animal.id === animalToFind.id;
    
    if (!isTargetAnimal) {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      
      if (newWrongAttempts === 1) {
        setFeedback(t('animalSafariGame.feedback.incorrect.wrongAnimal', {
          animal: animal.name,
          targetAnimal: animalToFind?.name
        }));
        if (voiceEnabled) speakText(t('animalSafariGame.feedback.incorrect.wrongAnimal', {
          animal: animal.name,
          targetAnimal: animalToFind?.name
        }));
      } else {
        setFeedback(t('animalSafariGame.feedback.incorrect.tryAgainHint', { hint: animalToFind?.hint }));
        setShowAnimalHint(true);
        if (voiceEnabled) speakText(t('animalSafariGame.feedback.incorrect.tryAgainHint', { hint: animalToFind?.hint }));
      }
      return;
    }
    
    // Mark animal as found
    const updatedAnimals = animals.map(a => 
      a.id === animal.id ? { ...a, found: true } : a
    );
    setAnimals(updatedAnimals);
    
    const newFoundAnimals = [...foundAnimals, animal];
    setFoundAnimals(newFoundAnimals);
    setWrongAttempts(0);
    setShowAnimalHint(false);
    
    // Award points
    const points = level * 20 + streak * 5;
    const newScore = score + points;
    setScore(newScore);
    setStreak(prev => prev + 1);
    
    if (streak + 1 >= 3) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
    
    const message = `${funnyMessages[Math.floor(Math.random() * funnyMessages.length)]} Found ${animal.name} ${animal.emoji} +${points}`;
    setFeedback(message);
    
    // Take a photo
    const newPhoto = {
      id: cameraPhotos.length + 1,
      animal: animal,
      habitat: currentHabitat,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setCameraPhotos(prev => [newPhoto, ...prev.slice(0, 4)]);
    
    // Set next animal to find
    const nextAnimal = updatedAnimals.find(a => !a.found);
    if (nextAnimal) {
      setAnimalToFind(nextAnimal);
      setAnimalAnnouncement(t('animalSafariGame.feedback.welcomeHabitat', {
        habitat: habitats[currentHabitat].name,
        animal: nextAnimal.name,
        hint: nextAnimal.hint,
        emoji: nextAnimal.emoji
      }));
      
      if (voiceEnabled) {
        speakText(t('animalSafariGame.feedback.welcomeHabitat', {
          habitat: habitats[currentHabitat].name,
          animal: nextAnimal.name,
          hint: nextAnimal.hint,
          emoji: nextAnimal.emoji
        }));
      }
    }
    
    // Check if all animals found
    if (newFoundAnimals.length >= animals.length) {
      handleLevelComplete();
    }
    
    onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
  };

  const handleQuestionAnswer = (answer) => {
    if (!currentQuestion) return;
    
    const isCorrect = answer.toLowerCase() === currentQuestion.answer.toLowerCase();
    
    if (isCorrect) {
      const points = level * 25 + streak * 8;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      
      setFeedback(`✅ Correct! ${currentQuestion.animal.fact} +${points}`);
      
      if (streak + 1 >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
      
      if (voiceEnabled) {
        speakText(`Correct! ${currentQuestion.animal.fact}`);
      }
      
      // Move to next question
      setTimeout(() => {
        const availableAnimals = habitats[currentHabitat].animals;
        generateAnimalQuestion(availableAnimals);
      }, 1500);
      
      onGameEvent?.({ type: 'scoreUpdate', payload: newScore });
      
    } else {
      const newWrongAttempts = wrongAttempts + 1;
      setWrongAttempts(newWrongAttempts);
      setStreak(0);
      
      if (newWrongAttempts === 1) {
        setFeedback(t('animalSafariGame.feedback.incorrect.tryAgainHint', { hint: currentQuestion.animal.hint }));
        if (voiceEnabled) speakText(t('animalSafariGame.feedback.incorrect.tryAgainHint', { hint: currentQuestion.animal.hint }));
      } else if (newWrongAttempts === 2) {
        setFeedback(t('animalSafariGame.feedback.incorrect.itsAnimal', {
          animal: currentQuestion.animal.name,
          sound: currentQuestion.animal.sound
        }));
        if (voiceEnabled) speakText(t('animalSafariGame.feedback.incorrect.itsAnimal', {
          animal: currentQuestion.animal.name,
          sound: currentQuestion.animal.sound
        }));
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setWrongAttempts(0);
        
        setFeedback(t('animalSafariGame.feedback.incorrect.answerIs', {
          animal: currentQuestion.animal.name,
          answer: currentQuestion.answer
        }));
        
        if (voiceEnabled) {
          speakText(t('animalSafariGame.feedback.incorrect.answerIs', {
            animal: currentQuestion.animal.name,
            answer: currentQuestion.answer
          }));
        }
        
        if (newLives <= 0) {
          setTimeout(() => setGameOver(true), 1200);
        }
        
        onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
      }
    }
  };

  const handleLevelComplete = () => {
    if (streak + 1 >= 5) {
      const newLives = Math.min(lives + 1, 5);
      setLives(newLives);
      setFeedback(prev => `${prev} ${t('animalSafariGame.feedback.bonusHeart')}`);
      onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
    }
    
    if (voiceEnabled) {
      speakText(`Congratulations! You found all animals in the ${habitats[currentHabitat].name}!`);
    }
    
    setTimeout(() => {
      setLevel(prev => prev + 1);
      setFeedback(t('animalSafariGame.feedback.levelUp'));
      initializeGame();
    }, 2000);
  };

  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'binoculars':
        setHintUsed(true);
        setFeedback(t('animalSafariGame.powerUps.binoculars.feedback'));
        if (voiceEnabled) speakText("Using binoculars! Animals are highlighted!");
        setTimeout(() => setHintUsed(false), 5000);
        break;
      case 'camera':
        // Take photo of all visible animals
        const visibleAnimals = animals.filter(a => !a.found);
        if (visibleAnimals.length > 0) {
          const randomAnimal = visibleAnimals[Math.floor(Math.random() * visibleAnimals.length)];
          handleAnimalClick(randomAnimal);
          setFeedback(t('animalSafariGame.powerUps.camera.feedback'));
          if (voiceEnabled) speakText(`Camera found ${randomAnimal.name}!`);
        }
        break;
      case 'map':
        // Change to new habitat
        const habitatKeys = Object.keys(habitats);
        const currentIndex = habitatKeys.indexOf(currentHabitat);
        const nextHabitat = habitatKeys[(currentIndex + 1) % habitatKeys.length];
        setCurrentHabitat(nextHabitat);
        setFeedback(t('animalSafariGame.powerUps.map.feedback'));
        if (voiceEnabled) speakText(t('animalSafariGame.powerUps.map.feedback'));
        initializeGame();
        break;
      case 'hint':
        if (animalToFind) {
          setShowAnimalHint(true);
          setFeedback(t('animalSafariGame.powerUps.hint.feedback', { hint: animalToFind.hint }));
          if (voiceEnabled) speakText(t('animalSafariGame.powerUps.hint.feedback', { hint: animalToFind.hint }));
        }
        break;
      case 'voiceHelp':
        if (animalToFind) {
          speakText(`Find ${animalToFind.name}. ${animalToFind.hint}. Look for ${animalToFind.emoji}. ${animalToFind.voice}`);
          setFeedback(t('animalSafariGame.powerUps.voiceHelp.feedback'));
        }
        break;
    }
  };

  const movePlayer = (direction) => {
    const moveAmount = 10;
    setPlayerPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch(direction) {
        case 'up': newY = Math.max(10, prev.y - moveAmount); break;
        case 'down': newY = Math.min(90, prev.y + moveAmount); break;
        case 'left': newX = Math.max(10, prev.x - moveAmount); break;
        case 'right': newX = Math.min(90, prev.x + moveAmount); break;
      }
      
      // Check if player found an animal
      animals.forEach(animal => {
        if (!animal.found && Math.abs(animal.position.x - newX) < 15 && Math.abs(animal.position.y - newY) < 15) {
          handleAnimalClick(animal);
        }
      });
      
      return { x: newX, y: newY };
    });
  };

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setFeedback("");
    setStreak(0);
    setTimeLeft(60);
    setPowerUps({
      binoculars: 2,
      camera: 3,
      map: 1,
      hint: 2,
      voiceHelp: 3
    });
    initializeGame();
    
    onGameEvent?.({ type: 'scoreUpdate', payload: 0 });
    onGameEvent?.({ type: 'heartsUpdate', payload: 3 });
  };

  const speakCurrentAnimal = () => {
    if (animalToFind && voiceEnabled) {
      speakText(`Find ${animalToFind.name}. ${animalToFind.hint}. ${animalToFind.voice}`);
    }
  };

  // Game Over Screen
  if (gameOver) {
    return (
      <div className={`flex items-center justify-center ${isFullscreen ? 'h-full' : 'min-h-[400px]'} p-3 w-full`}>
        <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#F59E0B]/30">
          <div className="text-4xl mb-3 text-center">🦁</div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {t('animalSafariGame.gameOver.title')}
          </h1>
          <p className="text-gray-300 mb-4 text-sm text-center">
            {t('animalSafariGame.gameOver.subtitle', { count: foundAnimals.length })}
          </p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{score}</div>
              <div className="text-gray-400 text-xs text-center">
                {t('animalSafariGame.gameOver.score')}
              </div>
            </div>
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{level}</div>
              <div className="text-gray-400 text-xs text-center">
                {t('animalSafariGame.gameOver.level')}
              </div>
            </div>
            <div className="bg-[#1A1A2E]/50 rounded-lg p-3">
              <div className="text-lg font-bold text-white text-center">{cameraPhotos.length}</div>
              <div className="text-gray-400 text-xs text-center">
                {t('animalSafariGame.gameOver.photos')}
              </div>
            </div>
          </div>
          
          {foundAnimals.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2 text-center">
                {t('animalSafariGame.gameOver.animalsFound')}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {foundAnimals.map(animal => (
                  <div key={animal.id} className="p-2 bg-[#1A1A2E]/50 rounded-lg border border-[#F59E0B]/20">
                    <div className="text-2xl text-center">{animal.emoji}</div>
                    <div className="text-xs text-white text-center">{animal.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onClick={resetGame}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-bold hover:opacity-90 text-sm"
          >
            {t('animalSafariGame.gameOver.startNewSafari')}
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
              {['✨', '🎯', '🌟', '📸'][i % 4]}
            </div>
          ))}
        </div>
      )}

      <div className="w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl shadow-lg p-4 border border-[#F59E0B]/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#D97706]`}>
              <span className="text-lg">{selectedCharacter}</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">
                {t('animalSafariGame.gameHeader.title')}
              </h1>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">
                  {t('animalSafariGame.gameHeader.level', { level })}
                </span>
                {streak > 0 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs text-yellow-400">
                      {t('animalSafariGame.gameHeader.streak', { streak })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#F59E0B]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#F59E0B]/20 rounded-lg hover:bg-[#F59E0B]/10 transition-colors"
              title={soundEnabled ? t('animalSafariGame.buttons.soundOn') : t('animalSafariGame.buttons.soundOff')}
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
              className={`p-1.5 bg-[#1A1A2E] border ${voiceEnabled ? 'border-green-500/30 text-green-400' : 'border-[#F59E0B]/20 text-gray-400'} rounded-lg hover:bg-[#F59E0B]/10 transition-colors`}
              title={voiceEnabled ? t('animalSafariGame.buttons.voiceOn') : t('animalSafariGame.buttons.voiceOff')}
            >
              <Speaker className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Mode Selector */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => { setGameMode('explore'); initializeGame(); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'explore' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Search className="inline w-3 h-3 mr-1" />
            {t('animalSafariGame.gameModes.explore')}
          </button>
          <button
            onClick={() => { setGameMode('quiz'); initializeGame(); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'quiz' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Binoculars className="inline w-3 h-3 mr-1" />
            {t('animalSafariGame.gameModes.quiz')}
          </button>
          <button
            onClick={() => { setGameMode('timed'); setTimeLeft(60); initializeGame(); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'timed' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Clock className="inline w-3 h-3 mr-1" />
            {t('animalSafariGame.gameModes.timed')}
          </button>
        </div>

        {/* Timed Mode Timer */}
        {gameMode === 'timed' && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">
                {t('animalSafariGame.timer.timeLeft')}
              </span>
              <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>
                {t('animalSafariGame.timer.seconds', { time: timeLeft })}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] h-1.5 rounded-full transition-all"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Habitat Info */}
        <div className={`mb-3 p-2 rounded-lg bg-gradient-to-r ${habitats[currentHabitat].color}/20 border ${habitats[currentHabitat].color.replace('from-', 'border-')}/30`}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs text-gray-400">
                {t('animalSafariGame.habitat.currentHabitat')}
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                {habitats[currentHabitat].emoji} {habitats[currentHabitat].name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">
                {t('animalSafariGame.habitat.animalsFound')}
              </div>
              <div className="text-sm font-bold text-white">{foundAnimals.length}/{animals.length}</div>
            </div>
          </div>
          <div className="text-xs text-gray-300">{habitats[currentHabitat].description}</div>
        </div>

        {/* Animal Announcement */}
        {animalToFind && (
          <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 border border-[#10B981]/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">
                  {t('animalSafariGame.animalAnnouncement.findThisAnimal')}
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-xl">{animalToFind.emoji}</span>
                  {animalToFind.name}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={speakCurrentAnimal}
                  disabled={!voiceEnabled}
                  className={`p-1 rounded ${voiceEnabled ? 'bg-[#10B981] text-white' : 'bg-gray-700 text-gray-400'}`}
                  title={t('animalSafariGame.animalAnnouncement.repeatInstructions')}
                >
                  <Volume className="w-3 h-3" />
                </button>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!voiceEnabled}
                  className={`p-1 rounded text-xs font-bold flex items-center gap-1 ${isListening ? 'bg-red-500 text-white animate-pulse' : voiceEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                  title={isListening ? t('animalSafariGame.animalAnnouncement.stopListening') : t('animalSafariGame.animalAnnouncement.sayAnimalName')}
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
              </div>
            </div>
            {showAnimalHint && (
              <div className="mt-1 text-xs text-blue-300">
                {t('animalSafariGame.animalAnnouncement.hint', { hint: animalToFind.hint })}
              </div>
            )}
          </div>
        )}

        {/* Lives */}
        <div className="flex items-center justify-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 ${i < lives ? 'text-red-400 fill-red-400' : 'text-gray-600'}`}
            />
          ))}
        </div>

        {/* Main Game Area */}
        {gameMode === 'quiz' && currentQuestion ? (
          // Quiz Mode
          <div className="mb-3">
            <div className="bg-[#1A1A2E]/50 rounded-lg p-4 border border-[#F59E0B]/20 mb-3">
              <div className="text-center mb-3">
                <div className="text-lg font-bold text-white mb-2">{currentQuestion.question}</div>
                {currentQuestion.type === 'name' && (
                  <div className="text-4xl mb-2">🔊</div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionAnswer(option)}
                    className="p-3 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white text-sm hover:bg-[#F59E0B]/10 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              {t('animalSafariGame.questions.instructions')}
            </div>
          </div>
        ) : (
          // Explore Mode (Safari Map)
          <div className="mb-3">
            <div className="relative h-64 rounded-lg border-2 border-[#F59E0B]/30 overflow-hidden mb-3" 
                 style={{ backgroundColor: habitats[currentHabitat].bgColor + '20' }}>
              
              {/* Player */}
              <div 
                className="absolute w-8 h-8 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold transition-all duration-300"
                style={{ 
                  left: `${playerPosition.x}%`,
                  top: `${playerPosition.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {selectedCharacter}
              </div>
              
              {/* Animals - Only show target animal with hint */}
              {animals.map(animal => (
                <button
                  key={animal.id}
                  onClick={() => handleAnimalClick(animal)}
                  className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all ${hintUsed || (animalToFind && animal.id === animalToFind.id) ? 'animate-pulse' : ''} ${animal.found ? 'opacity-30' : 'hover:scale-125'} ${animalToFind && animal.id === animalToFind.id ? 'ring-2 ring-yellow-400' : ''}`}
                  style={{ 
                    left: `${animal.position.x}%`,
                    top: `${animal.position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  title={animal.found ? `${animal.name} (Found)` : `Find ${animal.name}`}
                >
                  {animal.emoji}
                  {animal.found && <div className="absolute -top-1 -right-1 text-green-500">✓</div>}
                  {animalToFind && animal.id === animalToFind.id && !animal.found && (
                    <div className="absolute -top-1 -right-1 text-yellow-400">!</div>
                  )}
                </button>
              ))}
              
              {/* Habitat decorations */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-green-900/30 to-transparent"></div>
              <div className="absolute top-4 left-4 text-3xl">🌴</div>
              <div className="absolute top-8 right-8 text-3xl">🌳</div>
              <div className="absolute bottom-8 left-10 text-3xl">🪨</div>
              <div className="absolute bottom-4 right-4 text-3xl">🌿</div>
            </div>
            
            {/* Movement Controls */}
            <div className="grid grid-cols-3 gap-1 mb-3">
              <div></div>
              <button
                onClick={() => movePlayer('up')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
                aria-label={t('animalSafariGame.labels.movementControls') + " - Up"}
              >
                ↑
              </button>
              <div></div>
              <button
                onClick={() => movePlayer('left')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
                aria-label={t('animalSafariGame.labels.movementControls') + " - Left"}
              >
                ←
              </button>
              <button
                onClick={() => movePlayer('down')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
                aria-label={t('animalSafariGame.labels.movementControls') + " - Down"}
              >
                ↓
              </button>
              <button
                onClick={() => movePlayer('right')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
                aria-label={t('animalSafariGame.labels.movementControls') + " - Right"}
              >
                →
              </button>
            </div>
            
            {/* Animals to Find List */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">
                {t('animalSafariGame.labels.findTheseAnimals')}
              </div>
              <div className="flex flex-wrap gap-1">
                {customAnimals.map(animal => (
                  <div
                    key={animal.id}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${foundAnimals.some(f => f.id === animal.id) ? 'bg-green-500/20 text-green-400' : animalToFind?.id === animal.id ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#1A1A2E] text-gray-400'}`}
                  >
                    <span>{animal.emoji}</span>
                    <span>{animal.name}</span>
                    {foundAnimals.some(f => f.id === animal.id) && <span>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Power-ups */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => usePowerUp('hint')}
            disabled={powerUps.hint <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.hint <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#FF9800]/30 text-white hover:bg-[#FF9800]/10 transition-colors'}`}
            title={t('animalSafariGame.powerUps.hint.description')}
          >
            <div className="text-sm">💡</div>
            <div>{t('animalSafariGame.powerUps.hint.name')}</div>
            <div className="text-xs text-gray-400">x{powerUps.hint}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('voiceHelp')}
            disabled={powerUps.voiceHelp <= 0 || !voiceEnabled}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.voiceHelp <= 0 || !voiceEnabled ? 'border-gray-600/30 text-gray-500' : 'border-[#4CAF50]/30 text-white hover:bg-[#4CAF50]/10 transition-colors'}`}
            title={t('animalSafariGame.powerUps.voiceHelp.description')}
          >
            <div className="text-sm">🔊</div>
            <div>{t('animalSafariGame.powerUps.voiceHelp.name')}</div>
            <div className="text-xs text-gray-400">x{powerUps.voiceHelp}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('binoculars')}
            disabled={powerUps.binoculars <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.binoculars <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#0EA5E9]/30 text-white hover:bg-[#0EA5E9]/10 transition-colors'}`}
            title={t('animalSafariGame.powerUps.binoculars.description')}
          >
            <div className="text-sm">🔍</div>
            <div>{t('animalSafariGame.powerUps.binoculars.name')}</div>
            <div className="text-xs text-gray-400">x{powerUps.binoculars}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('camera')}
            disabled={powerUps.camera <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.camera <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#10B981]/30 text-white hover:bg-[#10B981]/10 transition-colors'}`}
            title={t('animalSafariGame.powerUps.camera.description')}
          >
            <div className="text-sm">📸</div>
            <div>{t('animalSafariGame.powerUps.camera.name')}</div>
            <div className="text-xs text-gray-400">x{powerUps.camera}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('map')}
            disabled={powerUps.map <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.map <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10 transition-colors'}`}
            title={t('animalSafariGame.powerUps.map.description')}
          >
            <div className="text-sm">🗺️</div>
            <div>{t('animalSafariGame.powerUps.map.name')}</div>
            <div className="text-xs text-gray-400">x{powerUps.map}</div>
          </button>
        </div>

        {/* Camera Photos */}
        {cameraPhotos.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">
              {t('animalSafariGame.labels.recentPhotos')}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {cameraPhotos.map(photo => (
                <div key={photo.id} className="flex-shrink-0 p-2 bg-[#1A1A2E]/50 rounded-lg border border-[#F59E0B]/20">
                  <div className="text-2xl text-center">{photo.animal.emoji}</div>
                  <div className="text-xs text-white text-center">{photo.animal.name}</div>
                  <div className="text-[10px] text-gray-400 text-center">{photo.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`rounded-lg p-2 text-center text-sm font-bold mb-2 ${
            feedback.includes('+') || feedback.includes('Found') || feedback.includes('✅')
              ? 'bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/10 text-[#F59E0B]'
              : feedback.includes('❌')
              ? 'bg-gradient-to-r from-[#EF4444]/10 to-[#DC2626]/10 text-[#EF4444]'
              : feedback.includes('💡') || feedback.includes('🔊')
              ? 'bg-gradient-to-r from-[#2196F3]/10 to-[#03A9F4]/10 text-[#2196F3]'
              : 'bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 text-[#10B981]'
          }`}>
            {feedback}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-3 pt-2 border-t border-[#F59E0B]/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-lg">🎤</span>
              <span>{t('animalSafariGame.instructions.sayAnimalNames')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">💡</span>
              <span>{t('animalSafariGame.instructions.findAnnouncedAnimal')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🔊</span>
              <span>{t('animalSafariGame.instructions.turnOnVoice')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🏆</span>
              <span>{t('animalSafariGame.instructions.findInOrder')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalSafariGame;