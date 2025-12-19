import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Gamepad2, Loader2, Globe } from 'lucide-react'; // Added Globe icon
import GamePlayer from '../../../../components/layout/dashboard/viewer/kid/games/GamePlayer';
import CountingGame from '../../../../components/layout/dashboard/viewer/kid/games/CountingGame';
import "../../../../components/layout/dashboard/viewer/kid/games/games.css";
import ShapeMatchGame from '../../../../components/layout/dashboard/viewer/kid/games/ShapeMatchGame';
import ColorQuestGame from '../../../../components/layout/dashboard/viewer/kid/games/ColorQuestGame';
import MemoryMatchGame from '../../../../components/layout/dashboard/viewer/kid/games/MemoryMatchGame';
import AnimalSafariGame from '../../../../components/layout/dashboard/viewer/kid/games/AnimalSafariGame';
import AlphabetRaceGame from '../../../../components/layout/dashboard/viewer/kid/games/AlphabetRaceGame';
import ProRacingChallenge from '../../../../components/layout/dashboard/viewer/kid/games/ProRacingChallenge';
import WaterSortPuzzle from '../../../../components/layout/dashboard/viewer/kid/games/WaterSortPuzzle';
import api from '../../../../api/axios';

// Import i18n
import { useTranslation } from 'react-i18next';

// Language selector component
const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setShowDropdown(false);
    // Save language preference to user profile if needed
    localStorage.setItem('preferredLanguage', lng);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FF5722]/20 to-[#FF9800]/20 backdrop-blur-sm border border-[#FF5722]/30 rounded-lg hover:from-[#FF5722]/30 hover:to-[#FF9800]/30 transition-all"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">{currentLanguage.flag} {currentLanguage.code.toUpperCase()}</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#FF5722]/40 rounded-xl shadow-2xl backdrop-blur-lg z-50 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#FF5722]/10 transition-all ${
                i18n.language === language.code ? 'bg-[#FF5722]/20 text-white' : 'text-gray-300'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium text-white">{language.name}</span>
                <span className="text-xs text-gray-400">{language.code.toUpperCase()}</span>
              </div>
              {i18n.language === language.code && (
                <div className="ml-auto w-2 h-2 bg-gradient-to-r from-[#FF5722] to-[#FF9800] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Component mapping for game_key to component
const GAME_COMPONENTS = {
  'counting_game': CountingGame,
  'shape_match_game': ShapeMatchGame,
  'color_quest_game': ColorQuestGame,
  'memory_match_game': MemoryMatchGame,
  'animal_safari_game': AnimalSafariGame,
  'alphabet_race_game': AlphabetRaceGame,
  'pro_racing_challenge': ProRacingChallenge,
  'water_sort_puzzle': WaterSortPuzzle,
};

// Game translation mapping
const GAME_TRANSLATIONS = {
  'counting_game': {
    title: 'games.gameDetails.counting_adventure',
    description: 'games.gameDetails.counting_desc'
  },
  'shape_match_game': {
    title: 'games.gameDetails.shape_match',
    description: 'games.gameDetails.shape_desc'
  },
  'color_quest_game': {
    title: 'games.gameDetails.color_quest',
    description: 'games.gameDetails.color_desc'
  },
  'memory_match_game': {
    title: 'games.gameDetails.memory_match',
    description: 'games.gameDetails.memory_desc'
  },
  'animal_safari_game': {
    title: 'games.gameDetails.animal_safari',
    description: 'games.gameDetails.animal_desc'
  },
  'alphabet_race_game': {
    title: 'games.gameDetails.alphabet_race',
    description: 'games.gameDetails.alphabet_desc'
  },
  'pro_racing_challenge': {
    title: 'games.gameDetails.pro_racing',
    description: 'games.gameDetails.pro_racing_desc'
  },
  'water_sort_puzzle': {
    title: 'games.gameDetails.water_sort',
    description: 'games.gameDetails.water_sort_desc'
  }
};

export default function KidGamesPage() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [usingOfflineGames, setUsingOfflineGames] = useState(false);
  
  // Initialize translation
  const { t, i18n } = useTranslation();

  // Static games fallback - ALL ARE ACTIVE with translations
  const getStaticGames = () => {
    const staticGamesData = [
      {
        id: 1,
        game_key: 'counting_game',
        title: t('games.gameDetails.counting_adventure'),
        description: t('games.gameDetails.counting_desc'),
        icon: "🎮",
        color: "from-[#FF5722] to-[#FF9800]",
        component: <CountingGame />,
        category: "Math",
        is_active: true,
        age_minimum: 3,
        age_maximum: 8,
        skills_count: 2
      },
      {
        id: 2,
        game_key: 'shape_match_game',
        title: t('games.gameDetails.shape_match'),
        description: t('games.gameDetails.shape_desc'),
        icon: "🔺",
        color: "from-[#2196F3] to-[#03A9F4]",
        component: <ShapeMatchGame />,
        category: "Puzzles",
        is_active: true,
        age_minimum: 3,
        age_maximum: 6,
        skills_count: 2
      },
      {
        id: 3,
        game_key: 'color_quest_game',
        title: t('games.gameDetails.color_quest'),
        description: t('games.gameDetails.color_desc'),
        icon: "🎨",
        color: "from-[#9C27B0] to-[#E91E63]",
        component: <ColorQuestGame />,
        category: "Colors",
        is_active: true,
        age_minimum: 2,
        age_maximum: 5,
        skills_count: 2
      },
      {
        id: 4,
        game_key: 'memory_match_game',
        title: t('games.gameDetails.memory_match'),
        description: t('games.gameDetails.memory_desc'),
        icon: "🧠",
        color: "from-[#4CAF50] to-[#8BC34A]",
        component: <MemoryMatchGame />,
        category: "Memory",
        is_active: true,
        age_minimum: 4,
        age_maximum: 8,
        skills_count: 2
      },
      {
        id: 5,
        game_key: 'animal_safari_game',
        title: t('games.gameDetails.animal_safari'),
        description: t('games.gameDetails.animal_desc'),
        icon: "🦁",
        color: "from-[#FF9800] to-[#FFC107]",
        component: <AnimalSafariGame />,
        category: "Science",
        is_active: true,
        age_minimum: 3,
        age_maximum: 7,
        skills_count: 1
      },
      {
        id: 6,
        game_key: 'alphabet_race_game',
        title: t('games.gameDetails.alphabet_race'),
        description: t('games.gameDetails.alphabet_desc'),
        icon: "🚗",
        color: "from-[#3F51B5] to-[#2196F3]",
        component: <AlphabetRaceGame />,
        category: "Language",
        is_active: true,
        age_minimum: 3,
        age_maximum: 6,
        skills_count: 2
      },
      {
        id: 7,
        game_key: 'pro_racing_challenge',
        title: t('games.gameDetails.pro_racing'),
        description: t('games.gameDetails.pro_racing_desc'),
        icon: "🏎️",
        color: "from-[#FF0000] to-[#FF8800]",
        component: <ProRacingChallenge />,
        category: "Racing",
        is_active: true,
        age_minimum: 5,
        age_maximum: 10,
        skills_count: 2
      },
      {
        id: 8,
        game_key: 'water_sort_puzzle',
        title: t('games.gameDetails.water_sort'),
        description: t('games.gameDetails.water_sort_desc'),
        icon: "💧",
        color: "from-[#2196F3] to-[#03A9F4]",
        component: <WaterSortPuzzle />,
        category: "Logic",
        is_active: true,
        age_minimum: 5,
        age_maximum: 12,
        skills_count: 2
      }
    ];
    
    return staticGamesData;
  };

  // Fetch available games from backend
  const fetchAvailableGames = async () => {
    try {
      setLoading(true);
      setUsingOfflineGames(false);
      
      // Fetch available games (age-filtered for the kid)
      const response = await api.get('/games/kids/available');
      
      if (response.data.success) {
        const gamesFromDb = response.data.games || [];
        
        // Transform DB games to frontend format with translations
        const transformedGames = gamesFromDb.map(game => {
          const gameKey = game.game_key || game.key;
          const GameComponent = GAME_COMPONENTS[gameKey];
          
          // Get translated title and description
          const gameTranslations = GAME_TRANSLATIONS[gameKey] || {};
          const gameTitle = gameTranslations.title ? t(gameTranslations.title) : game.title;
          const gameDescription = gameTranslations.description ? t(gameTranslations.description) : game.description;
          
          return {
            id: game.id,
            game_key: gameKey,
            title: gameTitle,
            description: gameDescription,
            icon: game.icon_emoji || '🎮',
            color: game.color_gradient || 'from-[#FF5722] to-[#FF9800]',
            component: GameComponent ? <GameComponent /> : null,
            category: t(`games.categories.${game.category}`) || game.category,
            age_minimum: game.age_minimum,
            age_maximum: game.age_maximum,
            metadata: game.metadata || {},
            progress: game.progress || null,
            skills_count: game.skills_count || 0,
            is_active: game.is_active !== false
          };
        });
        
        // Filter out games without components
        const filteredGames = transformedGames.filter(game => game.component && game.is_active);
        
        setGames(filteredGames);
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setUsingOfflineGames(true);
      
      // Fallback to static games if API fails
      const staticGames = getStaticGames();
      setGames(staticGames);
    } finally {
      setLoading(false);
    }
  };

  // Refetch games when language changes
  useEffect(() => {
    fetchAvailableGames();
  }, [i18n.language]); // Re-fetch when language changes

  const handleGameSelect = async (game) => {
    if (!game.is_active) return;
    
    try {
      // Start game session on backend (only if not using offline)
      if (!usingOfflineGames) {
        const response = await api.post(`/games/kids/games/${game.id}/start`);
        
        if (response.data.success) {
          setSessionId(response.data.session.session_token);
          setSelectedGame({
            ...game,
            session_id: response.data.session.session_token,
            session_data: response.data.session
          });
          return;
        }
      }
      
      // For offline mode or if API fails
      setSelectedGame(game);
    } catch (err) {
      console.error('Error starting game session:', err);
      // Continue with local selection
      setSelectedGame(game);
    }
  };

  const handlePlayGame = async () => {
    if (!selectedGame) return;
    setActiveGame(selectedGame);
    setSelectedGame(null);
  };

  const handleCloseGame = async () => {
    setActiveGame(null);
    setSessionId(null);
  };

  // Handle game events from GamePlayer
  const handleGameEvent = async (event) => {
    if (!activeGame || !sessionId || usingOfflineGames) return;

    try {
      switch (event.type) {
        case 'scoreUpdate':
          // Submit score to backend
          await api.post(`/games/kids/games/${activeGame.id}/score`, {
            session_id: sessionId,
            score: event.payload,
            level: event.level || 1,
            metrics: event.metrics || {}
          });
          break;

        case 'saveProgress':
          // Save game progress
          await api.post(`/games/kids/games/${activeGame.id}/save`, {
            save_state: event.payload,
            level: event.level || 1
          });
          break;

        default:
          console.log('Unhandled game event:', event);
      }
    } catch (err) {
      console.error('Error handling game event:', err);
    }
  };

  const renderLoadingState = () => (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#FF5722] animate-spin mx-auto mb-4" />
        <h2 className="text-xl text-white font-semibold">{t('games.loading')}</h2>
        <p className="text-gray-400 mt-2">{t('games.loadingDesc')}</p>
      </div>
    </div>
  );

  if (loading) return renderLoadingState();

  return (
    <>
      <Helmet>
        <title>{t('games.title')} - Oliviuus</title>
        <meta name="description" content={t('games.gameDetails.counting_desc')} />
        <html lang={i18n.language} />
      </Helmet>

      {/* Game Player - Fullscreen */}
      {activeGame && (
        <GamePlayer
          gameId={activeGame.id}
          gameTitle={activeGame.title}
          gameComponent={activeGame.component}
          onClose={handleCloseGame}
          onGameEvent={handleGameEvent}
          sessionId={sessionId}
        />
      )}

      {/* Game Selection Modal */}
      {selectedGame && !activeGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl border-2 border-[#FF5722]/30 shadow-2xl p-6 animate-scaleIn">
            <div className="text-center mb-6">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${selectedGame.color} mb-3`}>
                <span className="text-3xl">{selectedGame.icon}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{selectedGame.title}</h3>
              <p className="text-gray-300 text-sm">{selectedGame.description}</p>
              <div className="inline-block mt-2 px-3 py-1 bg-[#FF5722]/20 text-[#FFD166] rounded-full text-xs">
                {selectedGame.category}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{t('games.skill')}:</span>
                <span className="text-white">{selectedGame.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{t('games.type')}:</span>
                <span className="text-white">Educational</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{t('games.age')}:</span>
                <span className="text-white">{selectedGame.age_minimum || 3}-{selectedGame.age_maximum || 8} {t('common.years')}</span>
              </div>
              {selectedGame.skills_count > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('games.skills')}:</span>
                  <span className="text-white">{selectedGame.skills_count}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedGame(null);
                  setSessionId(null);
                }}
                className="flex-1 py-2.5 bg-[#1A1A2E] border border-[#FF5722]/30 text-white rounded-lg hover:bg-[#16213E] text-sm"
              >
                {t('games.back')}
              </button>
              <button
                onClick={handlePlayGame}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white font-bold rounded-lg hover:opacity-90 text-sm"
              >
                {t('games.playNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page - Clean & Compact */}
      <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
        {/* Minimal Header */}
        <div className="container mx-auto px-4 pt-8 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-[#FF5722] to-[#FF9800] rounded-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('games.title')}</h1>
                <p className="text-gray-400 text-sm">
                  {t('games.subtitle', { count: games.length })}
                </p>
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
          </div>
          
          {/* Mobile Language Selector */}
          <div className="mt-4 sm:hidden">
            <LanguageSelector />
          </div>
        </div>

        {/* Games Grid - Clean and Simple */}
        <div className="container mx-auto px-4 pb-8">
          {games.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('games.noGames')}</h3>
              <p className="text-gray-400 mb-6">{t('games.noGamesDesc')}</p>
              <button
                onClick={fetchAvailableGames}
                className="bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90"
              >
                {t('games.refresh')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-xl border border-[#FF5722]/30 p-4 cursor-pointer hover:border-[#FF9800] hover:scale-[1.02] hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${game.color}`}>
                      <span className="text-xl">{game.icon}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{game.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{game.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">{game.category}</span>
                      {game.skills_count > 0 && (
                        <span className="text-xs text-blue-400 ml-2">
                        </span>
                      )}
                    </div>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white rounded-lg text-xs font-bold hover:opacity-90">
                      {t('games.play')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}