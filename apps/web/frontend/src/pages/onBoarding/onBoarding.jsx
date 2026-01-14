// src/pages/onboarding/Onboarding.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import Logo from "../../components/Logo";
import { 
  Sparkles, 
  Film,
  Globe,
  Zap,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  Volume2,
  Eye,
  ChevronLeft,
  Languages
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const Onboarding = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && user.id) {
        try {
          const response = await api.get('/user/onboarding/status', {
            withCredentials: true
          });
          
          if (response.data.success && response.data.onboarding_completed) {
            navigate('/', { replace: true });
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(4);
  const [loading, setLoading] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [genres, setGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("rw");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await api.get('/user/genres/list');
        if (response.data?.genres) {
          setAvailableGenres(response.data.genres.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
        setAvailableGenres([
          { id: 1, name: 'Action', description: 'High-energy action' },
          { id: 2, name: 'Comedy', description: 'Funny content' },
          { id: 3, name: 'Drama', description: 'Emotional stories' },
          { id: 4, name: 'Horror', description: 'Scary content' },
          { id: 5, name: 'Romance', description: 'Love stories' },
          { id: 6, name: 'Sci-Fi', description: 'Futuristic stories' },
          { id: 7, name: 'Animation', description: 'Animated content' },
          { id: 8, name: 'Documentary', description: 'Educational content' }
        ]);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.3
    }));

    let animationId;
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.fillStyle = 'rgba(3, 7, 18, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        const twinkle = Math.sin(time * 3 + star.x * 0.01) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();
        
        star.x -= star.speed;
        if (star.x < -10) {
          star.x = canvas.width + 10;
          star.y = Math.random() * canvas.height;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const toggleGenre = (genreId) => {
    setGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleNextStep = useCallback(async () => {
    if (currentStep === totalSteps) {
      await handleCompleteOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleCompleteOnboarding = async () => {
    try {
      setSavingPreferences(true);
      setError("");

      const preferencesData = {
        language: selectedLanguage,
        genres: genres,
        notifications: notificationEnabled,
        subtitles: autoPlay
      };

      await api.put('/user/update-preferences', preferencesData, {
        withCredentials: true
      });

      await api.post('/user/complete-onboarding', {}, {
        withCredentials: true
      });

      window.location.href = '/';
      
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError(t("onboarding.complete_error"));
      setSavingPreferences(false);
    }
  };

  const handleSkipOnboarding = async () => {
    try {
      setLoading(true);
      setError("");

      await api.post('/user/complete-onboarding', {}, {
        withCredentials: true
      });

      window.location.href = '/';
      
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      setError(t("onboarding.skip_error"));
      setLoading(false);
    }
  };

  const languages = [
    { code: 'rw', name: t("preferences.lang_rw"), flag: '🇷🇼' },
    { code: 'en', name: t("preferences.lang_en"), flag: '🇺🇸' },
    { code: 'fr', name: t("preferences.lang_fr"), flag: '🇫🇷' },
    { code: 'sw', name: t("preferences.lang_sw"), flag: '🇹🇿' }
  ];

  // Step 1: Welcome
  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8"
    >
      <div className="text-center max-w-3xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <Logo className="w-40 h-40 mx-auto text-white" />
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            {t("onboarding.welcome_to")}
          </span>
          <br />
          <span className="text-white">Oliviuus</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-300 max-w-2xl mx-auto mb-8"
        >
          {t("onboarding.welcome_subtitle")}
        </motion.p>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center justify-center gap-3 text-purple-400"
        >
          <ChevronRight size={18} />
          <span className="text-lg">{t("onboarding.continue_to_start")}</span>
          <ChevronRight size={18} />
        </motion.div>
      </div>
    </motion.div>
  );

  // Step 2: Genre Selection
  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-8"
    >
      <div className="text-center mb-8">
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="inline-block mb-6"
        >
          <Film className="w-16 h-16 text-purple-400" />
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {t("onboarding.step1_title")}
        </h2>
        <p className="text-gray-300">
          {t("onboarding.step1_subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
        {availableGenres.map((genre, index) => {
          const isSelected = genres.includes(genre.id);
          return (
            <motion.button
              key={genre.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleGenre(genre.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[120px] ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500 shadow-lg shadow-purple-900/20'
                  : 'bg-gray-900/60 border-gray-700 hover:border-purple-500/50'
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CheckCircle size={16} />
                </motion.div>
              )}
              
              <div className="text-4xl mb-2">
                {genre.name === 'Action' && '💥'}
                {genre.name === 'Comedy' && '😂'}
                {genre.name === 'Drama' && '🎭'}
                {genre.name === 'Horror' && '👻'}
                {genre.name === 'Romance' && '❤️'}
                {genre.name === 'Sci-Fi' && '🚀'}
                {genre.name === 'Animation' && '🎨'}
                {!['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Animation'].includes(genre.name) && '🎬'}
              </div>
              <h3 className="font-bold text-white text-sm md:text-base text-center">{genre.name}</h3>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700">
          <Sparkles size={18} className="text-yellow-400" />
          <span className="text-white">
            {t("onboarding.selected_genres", { count: genres.length })}
          </span>
          <Sparkles size={18} className="text-yellow-400" />
        </div>
      </motion.div>
    </motion.div>
  );

  // Step 3: Preferences
  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-8 max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="inline-block mb-6"
        >
          <Globe className="w-16 h-16 text-blue-400" />
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {t("onboarding.step2_title")}
        </h2>
        <p className="text-gray-300">{t("onboarding.step2_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Language Selection */}
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-900/30 rounded-xl">
              <Languages className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{t("onboarding.language")}</h3>
              <p className="text-gray-400">{t("onboarding.language_subtitle")}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLanguage === lang.code
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 bg-gray-800/20 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
          <div className="space-y-6">
            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-900/30 rounded-lg">
                  <Volume2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t("onboarding.notifications")}</h4>
                  <p className="text-gray-400 text-sm">{t("onboarding.notifications_subtitle")}</p>
                </div>
              </div>
              <div 
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${notificationEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                onClick={() => setNotificationEnabled(!notificationEnabled)}
              >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${notificationEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>

            {/* Auto-play */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-900/30 rounded-lg">
                  <PlayCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t("onboarding.auto_play")}</h4>
                  <p className="text-gray-400 text-sm">{t("onboarding.auto_play_subtitle")}</p>
                </div>
              </div>
              <div 
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${autoPlay ? 'bg-yellow-500' : 'bg-gray-700'}`}
                onClick={() => setAutoPlay(!autoPlay)}
              >
                <div className={`bg-white w-4 h-4 rounded-full transition-transform ${autoPlay ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900/40 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t("onboarding.dark_mode")}</h4>
                  <p className="text-purple-300 text-sm">{t("onboarding.dark_mode_subtitle")}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-purple-600 rounded-lg">
                <span className="text-white font-bold text-sm">{t("onboarding.on")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step 4: Completion
  const renderStep4 = () => (
    <motion.div
      key="step4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8"
    >
      <div className="text-center max-w-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-8 relative"
        >
          <Logo className="w-48 h-48 mx-auto text-white" />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 blur-2xl -z-10"
          />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          {t("onboarding.step3_title")}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-300 max-w-2xl mx-auto mb-8"
        >
          {t("onboarding.step3_subtitle")}
        </motion.p>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 mb-8 max-w-md mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-4">{t("onboarding.your_preferences")}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{t("onboarding.selected_genres_label")}</span>
              <span className="text-purple-400 font-bold text-xl">{genres.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{t("onboarding.language_label")}</span>
              <span className="text-white font-medium">
                {languages.find(l => l.code === selectedLanguage)?.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{t("onboarding.notifications_label")}</span>
              <span className={notificationEnabled ? "text-green-400 font-medium" : "text-gray-400"}>
                {notificationEnabled ? t("onboarding.enabled") : t("onboarding.disabled")}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden">
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
      />

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-950/95 to-gray-950 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="w-8 h-8 text-white" />
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      index + 1 === currentStep
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : index + 1 < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {index + 1 < currentStep ? (
                      <CheckCircle size={14} />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`w-6 h-1 transition-all ${
                        index + 1 < currentStep
                          ? 'bg-gradient-to-r from-green-500 to-purple-500'
                          : 'bg-gray-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-700/30 rounded-full flex items-center justify-center">
                  !
                </div>
                <div>
                  <p className="text-red-200 font-medium">{t("onboarding.error")}</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] py-8">
            <div className="w-full max-w-6xl px-4">
              <AnimatePresence mode="wait">
                {steps[currentStep - 1]()}
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Fixed Navigation Footer */}
        <footer className="sticky bottom-0 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 px-4 py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 1
                  ? 'opacity-0 pointer-events-none'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <ChevronLeft size={20} />
              {t("onboarding.previous")}
            </button>

            <div className="flex items-center gap-3">
              {/* Skip button (only show before last step) */}
              {currentStep < totalSteps && (
                <button
                  onClick={handleSkipOnboarding}
                  disabled={loading}
                  className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  {loading ? t("onboarding.skipping") : t("onboarding.skip")}
                </button>
              )}

              {/* Continue/Complete button */}
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                  {t("onboarding.continue")}
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={savingPreferences}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {savingPreferences ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      {t("onboarding.saving")}
                    </>
                  ) : (
                    <>
                      {t("onboarding.start_streaming")}
                      <Zap size={20} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;