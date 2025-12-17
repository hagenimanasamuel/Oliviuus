import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Clock, Volume2, VolumeX, Search, Map, Camera, Binoculars, Compass, Zap, Star, Home, Mic, MicOff, Speaker, Volume } from 'lucide-react';

const AnimalSafariGame = ({ onGameEvent, isFullscreen }) => {
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
      name: 'Savannah',
      color: 'from-[#F59E0B] to-[#D97706]',
      bgColor: '#FEF3C7',
      description: 'Hot grassland with few trees',
      emoji: '🌾',
      animals: [
        { id: 1, emoji: '🦁', name: 'Lion', sound: 'Roar!', fact: 'Lions are the only cats that live in groups called prides.', hint: 'King of the jungle, has a big mane', voice: 'I am a lion! I roar loudly!' },
        { id: 2, emoji: '🐘', name: 'Elephant', sound: 'Trumpet!', fact: 'Elephants can recognize themselves in a mirror.', hint: 'Big gray animal with a long trunk', voice: 'I am an elephant! I have a long trunk!' },
        { id: 3, emoji: '🦒', name: 'Giraffe', sound: 'Moo!', fact: 'Giraffes have the same number of neck bones as humans.', hint: 'Very tall with a long neck', voice: 'I am a giraffe! I am the tallest animal!' },
        { id: 4, emoji: '🦓', name: 'Zebra', sound: 'Bray!', fact: 'Each zebra has a unique stripe pattern like fingerprints.', hint: 'Black and white stripes', voice: 'I am a zebra! I have black and white stripes!' },
        { id: 5, emoji: '🦛', name: 'Hippo', sound: 'Grunt!', fact: 'Hippos can run faster than humans on land.', hint: 'Big and lives in water', voice: 'I am a hippo! I love water!' },
      ]
    },
    jungle: {
      name: 'Jungle',
      color: 'from-[#10B981] to-[#059669]',
      bgColor: '#D1FAE5',
      description: 'Rainforest with many trees and vines',
      emoji: '🌴',
      animals: [
        { id: 6, emoji: '🐒', name: 'Monkey', sound: 'Chatter!', fact: 'Monkeys use different sounds to communicate with each other.', hint: 'Climbs trees and loves bananas', voice: 'I am a monkey! I love to climb!' },
        { id: 7, emoji: '🦜', name: 'Parrot', sound: 'Squawk!', fact: 'Parrots can mimic human speech and other sounds.', hint: 'Colorful bird that can talk', voice: 'I am a parrot! I can talk like you!' },
        { id: 8, emoji: '🐯', name: 'Tiger', sound: 'Growl!', fact: 'Tigers have striped skin, not just striped fur.', hint: 'Big cat with orange and black stripes', voice: 'I am a tiger! I have beautiful stripes!' },
        { id: 9, emoji: '🐍', name: 'Snake', sound: 'Hiss!', fact: 'Snakes smell with their tongues and have no eyelids.', hint: 'Long and slithers on the ground', voice: 'I am a snake! I slither on the ground!' },
        { id: 10, emoji: '🦥', name: 'Sloth', sound: '...', fact: 'Sloths sleep up to 20 hours a day and move very slowly.', hint: 'Very slow and hangs from trees', voice: 'I am a sloth! I move very slowly!' },
      ]
    },
    ocean: {
      name: 'Ocean',
      color: 'from-[#0EA5E9] to-[#0284C7]',
      bgColor: '#E0F2FE',
      description: 'Deep blue sea with coral reefs',
      emoji: '🌊',
      animals: [
        { id: 11, emoji: '🐋', name: 'Whale', sound: 'Sing!', fact: 'Blue whales are the largest animals ever to live on Earth.', hint: 'Biggest animal in the ocean', voice: 'I am a whale! I am very big!' },
        { id: 12, emoji: '🐬', name: 'Dolphin', sound: 'Click!', fact: 'Dolphins have names for each other and are very smart.', hint: 'Smart and jumps out of water', voice: 'I am a dolphin! I am very smart!' },
        { id: 13, emoji: '🦈', name: 'Shark', sound: '...', fact: 'Sharks have been around for 400 million years.', hint: 'Has sharp teeth and fins', voice: 'I am a shark! I have sharp teeth!' },
        { id: 14, emoji: '🐢', name: 'Turtle', sound: '...', fact: 'Some turtles can live over 100 years and return to where they were born.', hint: 'Has a hard shell on its back', voice: 'I am a turtle! I carry my house on my back!' },
        { id: 15, emoji: '🦑', name: 'Squid', sound: '...', fact: 'Squids have three hearts and can change color.', hint: 'Has tentacles and ink', voice: 'I am a squid! I have eight arms!' },
      ]
    },
    arctic: {
      name: 'Arctic',
      color: 'from-[#93C5FD] to-[#60A5FA]',
      bgColor: '#DBEAFE',
      description: 'Cold ice and snow land',
      emoji: '❄️',
      animals: [
        { id: 16, emoji: '🐧', name: 'Penguin', sound: 'Honk!', fact: 'Penguins propose to mates with pebbles.', hint: 'Bird that swims but cannot fly', voice: 'I am a penguin! I waddle when I walk!' },
        { id: 17, emoji: '🐻‍❄️', name: 'Polar Bear', sound: 'Growl!', fact: 'Polar bears have black skin under white fur to absorb heat.', hint: 'Big white bear in the snow', voice: 'I am a polar bear! I love the cold!' },
        { id: 18, emoji: '🦭', name: 'Seal', sound: 'Bark!', fact: 'Seals can hold their breath for 2 hours underwater.', hint: 'Swims and barks like a dog', voice: 'I am a seal! I can hold my breath a long time!' },
        { id: 19, emoji: '🦊', name: 'Arctic Fox', sound: 'Yip!', fact: 'Arctic foxes change fur color with seasons for camouflage.', hint: 'Small fox with white fur', voice: 'I am an arctic fox! My fur turns white in winter!' },
        { id: 20, emoji: '🐺', name: 'Wolf', sound: 'Howl!', fact: 'Wolves can run up to 38 miles per hour and live in packs.', hint: 'Looks like a big dog, howls at moon', voice: 'I am a wolf! I howl at the moon!' },
      ]
    }
  };

  const characters = [
    { emoji: '🦁', name: 'Leo', voice: 'I am Leo the Lion! Let\'s find animals!' },
    { emoji: '🐘', name: 'Ellie', voice: 'I am Ellie the Elephant! Ready for safari!' },
    { emoji: '🦒', name: 'Gigi', voice: 'I am Gigi the Giraffe! Let\'s explore!' },
    { emoji: '🐒', name: 'Momo', voice: 'I am Momo the Monkey! Time for adventure!' }
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
      setFeedback("🎤 Listening... Say the animal name!");
    } catch (error) {
      console.error('Speech recognition start error:', error);
      setFeedback("❌ Microphone not available. Please click instead.");
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
        setFeedback(`❌ I didn't hear "${animalToFind?.name}". Try again!`);
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
      setAnimalAnnouncement(`Find the ${firstAnimal.name}! ${firstAnimal.hint}`);
      
      if (voiceEnabled) {
        speakText(`Welcome to the ${habitats[randomHabitat].name}! Find the ${firstAnimal.name}. ${firstAnimal.hint}. Look for ${firstAnimal.emoji}`);
      }
    }
    
    setFeedback(`Explore the ${habitats[randomHabitat].name}! Find ${hiddenAnimals.length} animals.`);
    
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
        question: `What sound does a ${randomAnimal.name} make?`,
        answer: randomAnimal.sound.toLowerCase().replace('!', ''),
        options: generateSoundOptions(randomAnimal)
      },
      {
        type: 'fact',
        question: `Which fact is true about ${randomAnimal.name}s?`,
        answer: randomAnimal.fact.toLowerCase(),
        options: generateFactOptions(randomAnimal)
      },
      {
        type: 'name',
        question: `What animal makes this sound: "${randomAnimal.sound}"?`,
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
    
    const options = [correctAnimal.fact.toLowerCase()];
    
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
        setFeedback(`❌ That's a ${animal.name}. Find the ${animalToFind?.name}!`);
        if (voiceEnabled) speakText(`That's a ${animal.name}. Look for ${animalToFind?.name}. ${animalToFind?.hint}`);
      } else {
        setFeedback(`❌ Hint: ${animalToFind?.hint}`);
        setShowAnimalHint(true);
        if (voiceEnabled) speakText(`Hint: ${animalToFind?.hint}`);
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
    
    const funnyMessages = [
      "🎯 Great Spot! You found it!",
      "📸 Animal Found! Excellent!",
      "🦁 Safari Success! Amazing!",
      "🌟 Wild Discovery! Perfect!",
      "🎪 Nature Explorer! Wonderful!",
      "🏆 Wildlife Pro! Fantastic!"
    ];
    
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
      setAnimalAnnouncement(`Great! Now find the ${nextAnimal.name}! ${nextAnimal.hint}`);
      
      if (voiceEnabled) {
        speakText(`Great job! You found ${animal.name}. Now find ${nextAnimal.name}. ${nextAnimal.hint}. Look for ${nextAnimal.emoji}`);
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
        setFeedback(`❌ Try again! Hint: ${currentQuestion.animal.hint}`);
        if (voiceEnabled) speakText(`Try again. Hint: ${currentQuestion.animal.hint}`);
      } else if (newWrongAttempts === 2) {
        setFeedback(`❌ It's the ${currentQuestion.animal.name}! ${currentQuestion.animal.sound}`);
        if (voiceEnabled) speakText(`It's the ${currentQuestion.animal.name}! ${currentQuestion.animal.sound}`);
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        setWrongAttempts(0);
        
        setFeedback(`❌ The answer is ${currentQuestion.animal.name}: ${currentQuestion.answer}`);
        
        if (voiceEnabled) {
          speakText(`The answer is ${currentQuestion.animal.name}. ${currentQuestion.animal.fact}`);
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
      setFeedback(prev => `${prev} 💖 +1 Heart!`);
      onGameEvent?.({ type: 'heartsUpdate', payload: newLives });
    }
    
    if (voiceEnabled) {
      speakText(`Congratulations! You found all animals in the ${habitats[currentHabitat].name}!`);
    }
    
    setTimeout(() => {
      setLevel(prev => prev + 1);
      setFeedback("🚀 Safari Adventure Complete! Next habitat...");
      initializeGame();
    }, 2000);
  };

  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'binoculars':
        setHintUsed(true);
        setFeedback("🔍 Binoculars reveal hidden animals!");
        if (voiceEnabled) speakText("Using binoculars! Animals are highlighted!");
        setTimeout(() => setHintUsed(false), 5000);
        break;
      case 'camera':
        // Take photo of all visible animals
        const visibleAnimals = animals.filter(a => !a.found);
        if (visibleAnimals.length > 0) {
          const randomAnimal = visibleAnimals[Math.floor(Math.random() * visibleAnimals.length)];
          handleAnimalClick(randomAnimal);
          setFeedback("📸 Camera snap! Found an animal!");
          if (voiceEnabled) speakText(`Camera found ${randomAnimal.name}!`);
        }
        break;
      case 'map':
        // Change to new habitat
        const habitatKeys = Object.keys(habitats);
        const currentIndex = habitatKeys.indexOf(currentHabitat);
        const nextHabitat = habitatKeys[(currentIndex + 1) % habitatKeys.length];
        setCurrentHabitat(nextHabitat);
        setFeedback("🗺️ Map discovered new habitat!");
        if (voiceEnabled) speakText(`New habitat discovered: ${habitats[nextHabitat].name}`);
        initializeGame();
        break;
      case 'hint':
        if (animalToFind) {
          setShowAnimalHint(true);
          setFeedback(`💡 Hint: ${animalToFind.hint}`);
          if (voiceEnabled) speakText(`Hint: ${animalToFind.hint}`);
        }
        break;
      case 'voiceHelp':
        if (animalToFind) {
          speakText(`Find ${animalToFind.name}. ${animalToFind.hint}. Look for ${animalToFind.emoji}. ${animalToFind.voice}`);
          setFeedback("🔊 Voice help activated!");
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
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Safari Complete!</h1>
          <p className="text-gray-300 mb-4 text-sm text-center">You found {foundAnimals.length} animals!</p>
          
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
              <div className="text-lg font-bold text-white text-center">{cameraPhotos.length}</div>
              <div className="text-gray-400 text-xs text-center">Photos</div>
            </div>
          </div>
          
          {foundAnimals.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2 text-center">Animals You Found:</div>
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
            🦁 Start New Safari
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
              <h1 className="text-sm font-bold text-white">Animal Safari</h1>
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
            <div className="bg-[#1A1A2E] px-2 py-1 rounded-lg border border-[#F59E0B]/20">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-white font-bold text-sm">{score}</span>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-[#1A1A2E] border border-[#F59E0B]/20 rounded-lg hover:bg-[#F59E0B]/10 transition-colors"
              title={soundEnabled ? "Sound On" : "Sound Off"}
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
              title={voiceEnabled ? "Voice On" : "Voice Off"}
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
            Explore
          </button>
          <button
            onClick={() => { setGameMode('quiz'); initializeGame(); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'quiz' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Binoculars className="inline w-3 h-3 mr-1" />
            Quiz
          </button>
          <button
            onClick={() => { setGameMode('timed'); setTimeLeft(60); initializeGame(); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${gameMode === 'timed' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white' : 'bg-[#1A1A2E] text-gray-400 hover:text-white'}`}
          >
            <Clock className="inline w-3 h-3 mr-1" />
            Timed
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
              <div className="text-xs text-gray-400">Current Habitat:</div>
              <div className="text-sm font-bold text-white flex items-center gap-1">
                {habitats[currentHabitat].emoji} {habitats[currentHabitat].name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Animals Found:</div>
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
                <div className="text-xs text-gray-400">Find This Animal:</div>
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
                  title="Repeat instructions"
                >
                  <Volume className="w-3 h-3" />
                </button>
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!voiceEnabled}
                  className={`p-1 rounded text-xs font-bold flex items-center gap-1 ${isListening ? 'bg-red-500 text-white animate-pulse' : voiceEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}
                  title={isListening ? "Stop listening" : "Say animal name"}
                >
                  {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </button>
              </div>
            </div>
            {showAnimalHint && (
              <div className="mt-1 text-xs text-blue-300">💡 Hint: {animalToFind.hint}</div>
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
              Click or say the answer
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
              >
                ↑
              </button>
              <div></div>
              <button
                onClick={() => movePlayer('left')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
              >
                ←
              </button>
              <button
                onClick={() => movePlayer('down')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
              >
                ↓
              </button>
              <button
                onClick={() => movePlayer('right')}
                className="p-2 rounded-lg bg-[#1A1A2E] border border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10"
              >
                →
              </button>
            </div>
            
            {/* Animals to Find List */}
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-1">Find These Animals:</div>
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
            title="Get a hint"
          >
            <div className="text-sm">💡</div>
            <div>Hint</div>
            <div className="text-xs text-gray-400">x{powerUps.hint}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('voiceHelp')}
            disabled={powerUps.voiceHelp <= 0 || !voiceEnabled}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.voiceHelp <= 0 || !voiceEnabled ? 'border-gray-600/30 text-gray-500' : 'border-[#4CAF50]/30 text-white hover:bg-[#4CAF50]/10 transition-colors'}`}
            title="Voice assistance"
          >
            <div className="text-sm">🔊</div>
            <div>Voice Help</div>
            <div className="text-xs text-gray-400">x{powerUps.voiceHelp}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('binoculars')}
            disabled={powerUps.binoculars <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.binoculars <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#0EA5E9]/30 text-white hover:bg-[#0EA5E9]/10 transition-colors'}`}
            title="Reveal animals briefly"
          >
            <div className="text-sm">🔍</div>
            <div>Binoculars</div>
            <div className="text-xs text-gray-400">x{powerUps.binoculars}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('camera')}
            disabled={powerUps.camera <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.camera <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#10B981]/30 text-white hover:bg-[#10B981]/10 transition-colors'}`}
            title="Auto-find one animal"
          >
            <div className="text-sm">📸</div>
            <div>Camera</div>
            <div className="text-xs text-gray-400">x{powerUps.camera}</div>
          </button>
          
          <button
            onClick={() => usePowerUp('map')}
            disabled={powerUps.map <= 0}
            className={`flex-shrink-0 p-2 rounded-lg border text-xs ${powerUps.map <= 0 ? 'border-gray-600/30 text-gray-500' : 'border-[#F59E0B]/30 text-white hover:bg-[#F59E0B]/10 transition-colors'}`}
            title="Discover new habitat"
          >
            <div className="text-sm">🗺️</div>
            <div>Map</div>
            <div className="text-xs text-gray-400">x{powerUps.map}</div>
          </button>
        </div>

        {/* Camera Photos */}
        {cameraPhotos.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Recent Photos:</div>
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
              <span>Say animal names</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">💡</span>
              <span>Find the announced animal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🔊</span>
              <span>Turn on voice for help</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg">🏆</span>
              <span>Find animals in order</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalSafariGame;