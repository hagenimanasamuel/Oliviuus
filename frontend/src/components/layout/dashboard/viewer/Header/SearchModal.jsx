import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, X, Play, Film, Loader, Zap, Sparkles, Gift, TrendingUp, Heart, Mic, MicOff, Volume2, Eye, Command, HelpCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import api from "../../../../../api/axios"; 
import ContentCard from "../content/ContentCard.jsx"; 

const SearchModal = ({ isOpen, onClose, isPage = false }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [highContrast, setHighContrast] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [relatedContent, setRelatedContent] = useState([]);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const resultsRef = useRef([]);
  const abortControllerRef = useRef(null);

  // Handle different modes: modal vs page
  const effectiveIsOpen = isPage ? true : isOpen;
  const effectiveOnClose = isPage ? () => navigate(-1) : onClose;

  // Skeleton loading items
  const skeletonItems = useMemo(() => Array(12).fill(0), []);

  // Memoized quick searches to prevent unnecessary re-renders
  const quickSearches = useMemo(() => [
    { label: t("search.modal.quickSearches.actionMovies"), icon: <Zap size={16} className="text-yellow-400" />, type: "movie" },
    { label: t("search.modal.quickSearches.comedyShows"), icon: <Sparkles size={16} className="text-purple-400" />, type: "tv" },
    { label: t("search.modal.quickSearches.newReleases"), icon: <Gift size={16} className="text-pink-400" />, type: "new" },
    { label: t("search.modal.quickSearches.topRated"), icon: <TrendingUp size={16} className="text-green-400" />, type: "top" },
    { label: t("search.modal.quickSearches.dramaSeries"), icon: <Film size={16} className="text-blue-400" />, type: "tv" },
    { label: t("search.modal.quickSearches.familyMovies"), icon: <Heart size={16} className="text-red-400" />, type: "movie" },
  ], [t]);

  // Update URL when search query changes
  useEffect(() => {
    if (searchQuery && searchQuery !== urlQuery) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('q', searchQuery);
      setSearchParams(newParams, { replace: true });
    } else if (!searchQuery && urlQuery) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchQuery, urlQuery, searchParams, setSearchParams]);

  // Initialize search from URL on component mount
  useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, []); // Empty dependency array - only run on mount

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Cleanup function for aborting requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch related content when no results are found
  const fetchRelatedContent = useCallback(async () => {
    try {
      const response = await api.get('/viewer/content', {
        params: {
          limit: 6,
          sort: 'popular'
        }
      });

      if (response.data.success) {
        setRelatedContent(response.data.data.contents || []);
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Failed to fetch related content:', error);
        setRelatedContent([]);
      }
    }
  }, []);

  // Enhanced search function with backend integration and cleanup
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchSuggestions([]);
      setSelectedIndex(-1);
      setSearchError(null);
      setShowHelp(false);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setSearchLoading(true);
    setSearchError(null);
    setShowHelp(false);
    
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          limit: 20,
          lang: 'en'
        },
        signal: abortControllerRef.current.signal
      });

      if (response.data.success) {
        const searchData = response.data.data;
        setSearchResults(searchData.results || []);
        setSearchSuggestions(searchData.suggestions || []);
        resultsRef.current = searchData.results || [];
        
        // If no results found, fetch related content
        if (searchData.results.length === 0) {
          fetchRelatedContent();
        }
      } else {
        throw new Error(response.data.error || 'Search failed');
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Search API error:', error);
        setSearchError('Search failed. Please try again.');
        setSearchResults([]);
        setSearchSuggestions([]);
        // Fetch related content on error too
        fetchRelatedContent();
      }
    } finally {
      setSearchLoading(false);
    }
  }, [fetchRelatedContent]);

  // Quick search for autocomplete suggestions
  const performQuickSearch = useCallback(async (query) => {
    if (!query || query.length < 2) return;

    try {
      const response = await api.get('/search/quick', {
        params: { q: query, limit: 5 },
        signal: abortControllerRef.current?.signal
      });

      if (response.data.success) {
        setSearchSuggestions(response.data.data.suggestions || []);
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error('Quick search error:', error);
      }
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else if (searchQuery.length > 0) {
        performQuickSearch(searchQuery);
      } else {
        setSearchResults([]);
        setSearchSuggestions([]);
        setShowHelp(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current && searchQuery.length < 2) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchQuery, performSearch, performQuickSearch]);

  // Voice search handlers
  const startVoiceSearch = () => {
    if (speechSupported && recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Enhanced search modal handlers with URL cleanup
  const handleSearchClose = () => {
    if (isPage) {
      navigate(-1);
      return;
    }

    setIsClosing(true);
    setTimeout(() => {
      effectiveOnClose();
      setSearchQuery("");
      setSearchResults([]);
      setSearchSuggestions([]);
      setSelectedIndex(-1);
      setIsClosing(false);
      setIsListening(false);
      setSearchError(null);
      setShowHelp(false);
      setRelatedContent([]);
      
      // Clean up URL when closing
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }, 300);
  };

  // Handle page reload behavior - redirect to search page
  const handleFullPageRedirect = useCallback(() => {
    if (searchQuery) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`, { replace: true });
    }
  }, [searchQuery, navigate]);

  // Enhanced keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && effectiveIsOpen && !isClosing) {
      handleSearchClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxIndex = searchResults.length - 1 + (searchSuggestions.length > 0 ? 1 : 0);
      const nextIndex = selectedIndex < maxIndex ? selectedIndex + 1 : 0;
      setSelectedIndex(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const maxIndex = searchResults.length - 1 + (searchSuggestions.length > 0 ? 1 : 0);
      const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : maxIndex;
      setSelectedIndex(prevIndex);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (selectedIndex < searchResults.length) {
        const selectedResult = searchResults[selectedIndex];
        if (selectedResult) {
          navigate(`/watch/${selectedResult.id}`);
          handleSearchClose();
        }
      } else if (selectedIndex === searchResults.length && searchSuggestions.length > 0) {
        setSearchQuery(searchSuggestions[0]);
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    } else if (e.altKey && e.key === 'v') {
      e.preventDefault();
      if (speechSupported) {
        if (isListening) {
          stopVoiceSearch();
        } else {
          startVoiceSearch();
        }
      }
    } else if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
      e.preventDefault();
      handleFullPageRedirect();
    }
  }, [effectiveIsOpen, isClosing, selectedIndex, searchResults, searchSuggestions, navigate, speechSupported, isListening, handleFullPageRedirect]);

  // Enhanced backdrop click with ripple
  const handleBackdropClick = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target) && !isClosing) {
      handleSearchClose();
    }
  };

  useEffect(() => {
    if (effectiveIsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      if (!isPage) {
        document.body.style.overflow = 'hidden';
      }
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 400);
    } else {
      if (!isPage) {
        document.body.style.overflow = 'unset';
      }
      if (isListening) {
        stopVoiceSearch();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (!isPage) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [effectiveIsOpen, handleKeyDown, isListening, isPage]);

  // Quick search handler
  const handleQuickSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle content card click
  const handleContentClick = (content) => {
    navigate(`/watch/${content.id}`);
    if (!isPage) {
      handleSearchClose();
    }
  };

  // Handle more info for content card - FIXED to prevent hover modal issues
  const handleMoreInfo = useCallback((content, cardRect) => {
    console.log('More info for:', content.title);
    // This prevents the hover modal from interfering with layout
  }, []);

  // Toggle help instructions on mobile
  const toggleHelp = () => {
    setShowHelp(!showHelp);
  };

  // Memoized SearchResultItem to prevent unnecessary re-renders
  const SearchResultItem = useMemo(() => ({ result, index }) => (
    <div
      className={`rounded-xl transition-all duration-300 cursor-pointer ${
        selectedIndex === index 
          ? highContrast 
            ? 'ring-2 ring-white' 
            : 'ring-2 ring-[#BC8BBC]'
          : ''
      }`}
      onClick={() => handleContentClick(result)}
      onMouseEnter={() => setSelectedIndex(index)}
      role="option"
      aria-selected={selectedIndex === index}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleContentClick(result);
        }
      }}
    >
      <ContentCard
        content={result}
        size="medium"
        onMoreInfo={handleMoreInfo}
        showHoverModal={true}
        // Added container constraints to prevent hover modal layout issues
        containerClassName="relative"
      />
    </div>
  ), [selectedIndex, highContrast, handleContentClick, handleMoreInfo]);

  // Memoized Related content item component
  const RelatedContentItem = useMemo(() => ({ content, index }) => (
    <div
      className="rounded-xl transition-all duration-300 cursor-pointer"
      onClick={() => handleContentClick(content)}
      role="option"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleContentClick(content);
        }
      }}
    >
      <ContentCard
        content={content}
        size="medium"
        onMoreInfo={handleMoreInfo}
        showHoverModal={true}
        containerClassName="relative"
      />
    </div>
  ), [handleContentClick, handleMoreInfo]);

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="rounded-xl bg-gray-800/50 animate-pulse">
      <div className="aspect-[2/3] bg-gray-700 rounded-xl"></div>
      <div className="p-3">
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  );

  // Don't return null when used as page
  if (!isPage && !effectiveIsOpen && !isClosing) return null;

  // SEO-friendly page title
  const pageTitle = searchQuery 
    ? `${searchQuery} - Search Results` 
    : 'Search Library - Discover Amazing Content';

  // Different container styles for modal vs page
  const containerClass = isPage 
    ? "fixed inset-0 z-50 bg-gray-900" 
    : "fixed inset-0 z-[100] flex items-start justify-center p-0 sm:p-0 transition-all duration-300 w-full h-full";

  const modalClass = isPage
    ? "relative w-full h-full max-w-none bg-gray-900 border-0 border-gray-600/30 rounded-none sm:rounded-none shadow-2xl overflow-hidden flex flex-col"
    : `relative w-full h-full max-w-none bg-gray-900/95 backdrop-blur-ultra border-0 border-gray-600/30 rounded-none sm:rounded-none shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col ${
        highContrast ? 'high-contrast' : ''
      } ${
        isClosing 
          ? 'animate-searchModalExit' 
          : 'animate-searchModalEnter'
      }`;

  return (
    <>
      {/* SEO Optimization with Helmet */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Search for ${searchQuery || 'amazing content'} in our library. Find movies, TV shows, and more.`} />
        <meta name="keywords" content={`search, ${searchQuery}, movies, tv shows, entertainment`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={`Search results for ${searchQuery || 'discover amazing content'}`} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <style jsx>{`
        @keyframes searchModalEnter {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes searchModalExit {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.9) translateY(-10px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
          }
        }

        .backdrop-blur-ultra {
          backdrop-filter: blur(40px);
        }

        .search-input-glow:focus {
          box-shadow: 0 0 30px rgba(188, 139, 188, 0.3);
        }

        .listening-animation {
          animation: pulse-glow 1s ease-in-out infinite;
        }

        .high-contrast {
          filter: contrast(1.5) brightness(1.1);
        }

        /* Ensure hover modals don't cause layout shifts */
        .content-card-container {
          position: relative;
          isolation: isolate;
        }

        .hover-modal-fix {
          position: absolute;
          z-index: 1000;
          pointer-events: none;
        }
      `}</style>

      {/* Different container for modal vs page */}
      <div 
        className={containerClass}
        onClick={isPage ? undefined : handleBackdropClick}
        role={isPage ? "main" : "dialog"}
        aria-modal={!isPage}
        aria-label={isPage ? "Search page" : "Search dialog"}
      >
        {/* Backdrop only for modal mode */}
        {!isPage && (
          <div className={`absolute inset-0 transition-all duration-300 w-full h-full ${
            isClosing 
              ? 'bg-black/50 backdrop-blur-ultra' 
              : 'bg-black/70 backdrop-blur-ultra'
          }`} />
        )}
        
        {/* Main content */}
        <div 
          ref={searchRef}
          className={modalClass}
          style={!isPage ? {
            animation: isClosing ? 'searchModalExit 0.3s ease-in-out both' : 'searchModalEnter 0.4s ease-out both',
          } : undefined}
        >
          {/* Search Header */}
          <div className="relative p-4 sm:p-6 border-b border-gray-600/30 bg-gradient-to-br from-gray-800/95 via-gray-900/95 to-gray-800/95 backdrop-blur-ultra flex-shrink-0">
            <div className="relative z-10">
              {/* Top Row - Logo and Close */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-[#BC8BBC] to-purple-600 rounded-xl sm:rounded-2xl shadow-lg shadow-purple-500/20">
                    <Search size={18} className="sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {t("search.modal.title")}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400">{t("search.modal.subtitle")}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Mobile Help Button */}
                  <button 
                    onClick={toggleHelp}
                    className="sm:hidden p-2 text-gray-400 hover:text-white transition-all duration-300 bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-600/30"
                    aria-label={t("search.modal.actions.showHelp")}
                  >
                    <HelpCircle size={16} />
                  </button>
                  
                  <button 
                    onClick={handleSearchClose}
                    className="p-2 sm:p-3 text-gray-400 hover:text-white transition-all duration-300 bg-gray-800/50 hover:bg-red-500/20 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-gray-600/30 hover:border-red-400/30"
                    aria-label={t("search.modal.actions.close")}
                  >
                    <X size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Search Input Area */}
              <div className="relative">
                <div className="relative flex items-center gap-3">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input 
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("search.modal.inputPlaceholder")}
                      className="relative w-full bg-gray-800/80 backdrop-blur-lg text-white placeholder-gray-400 text-base sm:text-lg font-medium outline-none border-2 border-gray-600/50 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 focus:border-[#BC8BBC]/50 focus:bg-gray-800/90 focus:shadow-2xl focus:shadow-[#BC8BBC]/20"
                      autoFocus
                      aria-label="Search input"
                    />

                    {/* Keyboard Shortcut Badge - Only on desktop */}
                    <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                      <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-700/80 border border-gray-600/50 rounded text-xs text-gray-300">
                        <Command size={10} />
                        <span>K</span>
                      </kbd>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* High Contrast Toggle */}
                    <button 
                      onClick={() => setHighContrast(!highContrast)}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 backdrop-blur-sm border ${
                        highContrast 
                          ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' 
                          : 'bg-gray-800/50 border-gray-600/30 text-gray-400 hover:text-white hover:border-[#BC8BBC]/30'
                      }`}
                      aria-label={t("search.modal.actions.highContrast")}
                    >
                      <Eye size={16} className="sm:w-5 sm:h-5" />
                    </button>

                    {/* Voice Search Button */}
                    {speechSupported && (
                      <button
                        onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 backdrop-blur-sm border ${
                          isListening 
                            ? 'bg-red-500/20 border-red-400/50 text-red-400 listening-animation' 
                            : 'bg-gray-800/50 border-gray-600/30 text-gray-400 hover:text-white hover:border-[#BC8BBC]/30'
                        }`}
                        aria-label={isListening ? t("search.modal.actions.stopVoice") : t("search.modal.actions.voiceSearch")}
                      >
                        {isListening ? <MicOff size={16} className="sm:w-5 sm:h-5" /> : <Mic size={16} className="sm:w-5 sm-h-5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Instructions - Responsive */}
                <div id="search-instructions" className={`mt-3 transition-all duration-300 ${
                  searchQuery ? 'hidden' : 'block'
                } ${
                  showHelp ? 'block' : 'hidden sm:flex'
                }`}>
                  <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-gray-600/30">
                      <span>✨</span>
                      <span>{t("search.modal.instructions.tryExamples")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-gray-600/30">
                      <span>🎤</span>
                      <span>{t("search.modal.instructions.voiceSearch")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-gray-600/30">
                      <span>👁️</span>
                      <span>{t("search.modal.instructions.highContrast")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FIXED: Search Content with proper height calculation */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {searchQuery ? (
              <div className="p-4 sm:p-6">
                {/* Search Results Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {searchLoading 
                      ? t("search.modal.results.searching")
                      : t("search.modal.results.resultsFor", { query: searchQuery })
                    }
                  </h3>
                  {!searchLoading && searchResults.length > 0 && (
                    <span className="text-gray-400 text-xs sm:text-sm bg-gray-700/50 px-2 sm:px-3 py-1 rounded-full">
                      {t("search.modal.results.found", { count: searchResults.length })}
                    </span>
                  )}
                </div>

                {/* Loading State with Skeleton */}
                {searchLoading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {skeletonItems.map((_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </div>
                )}

                {/* Error State */}
                {!searchLoading && searchError && (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-400">
                    <div className="p-4 sm:p-6 bg-red-500/10 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 backdrop-blur-sm border border-red-500/20">
                      <Search size={32} className="sm:w-12 sm:h-12 opacity-50 text-red-400" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 text-center">
                      {t("search.modal.errors.searchFailed")}
                    </p>
                    <p className="text-gray-300 text-center max-w-sm text-sm sm:text-base mb-4">
                      {searchError}
                    </p>
                    <button
                      onClick={() => performSearch(searchQuery)}
                      className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                      {t("search.modal.errors.tryAgain")}
                    </button>
                  </div>
                )}

                {/* Search Results */}
                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <div 
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 content-card-container"
                    role="listbox"
                    aria-label="Search results"
                  >
                    {searchResults.map((result, index) => (
                      <SearchResultItem key={result.id} result={result} index={index} />
                    ))}
                  </div>
                )}

                {/* No Results with Related Content */}
                {!searchLoading && !searchError && searchQuery && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-400">
                    <div className="p-4 sm:p-6 bg-gray-800/50 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 backdrop-blur-sm border border-gray-600/30">
                      <Search size={32} className="sm:w-12 sm:h-12 opacity-50 text-[#BC8BBC]" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 text-center">
                      {t("search.modal.results.noResults")}
                    </p>
                    <p className="text-gray-300 text-center max-w-sm text-sm sm:text-base mb-6">
                      {t("search.modal.results.noResultsMessage")}
                    </p>

                    {/* Search Suggestions */}
                    {searchSuggestions.length > 0 && (
                      <div className="w-full max-w-md mb-6 sm:mb-8">
                        <h4 className="text-white font-semibold mb-3 sm:mb-4 text-center text-sm sm:text-base">
                          {t("search.modal.results.suggestionsTitle")}
                        </h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {searchSuggestions.slice(0, 6).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-200 text-xs sm:text-sm border border-gray-600/30 hover:border-[#BC8BBC]/30"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Content */}
                    {relatedContent.length > 0 && (
                      <div className="w-full mt-4 sm:mt-6">
                        <h4 className="text-white font-semibold mb-3 sm:mb-4 text-center text-sm sm:text-base">
                          {t("search.modal.results.relatedContentTitle")}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 content-card-container">
                          {relatedContent.slice(0, 6).map((content, index) => (
                            <RelatedContentItem key={content.id} content={content} index={index} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Quick Searches */
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
                  {t("search.modal.quickSearches.title")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {quickSearches.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(item.label)}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left bg-gray-800/50 hover:bg-gray-700/50 rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 border border-gray-600/30 hover:border-[#BC8BBC]/30 group backdrop-blur-sm"
                    >
                      <div className="p-2 sm:p-3 bg-gray-700/50 rounded-lg sm:rounded-xl group-hover:bg-[#BC8BBC]/20 transition-colors">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base group-hover:text-[#BC8BBC] transition-colors">
                          {item.label}
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm capitalize">{item.type}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Popular Searches */}
                <div className="mt-8 sm:mt-12">
                  <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                    {t("search.modal.popularSearches.title")}
                  </h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {t("search.modal.popularSearches.items", { returnObjects: true }).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickSearch(search)}
                        className="bg-gray-800/50 hover:bg-[#BC8BBC]/20 text-gray-300 hover:text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full transition-all duration-200 border border-gray-600/30 hover:border-[#BC8BBC]/30 text-xs sm:text-sm"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="p-3 sm:p-4 border-t border-gray-600/30 bg-gradient-to-r from-gray-800/80 to-gray-900/80 flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-400 gap-2">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <span>{t("search.modal.footer.pressEsc")}</span>
                <span>•</span>
                <span>{t("search.modal.footer.navigate")}</span>
                <span>•</span>
                <span>{t("search.modal.footer.select")}</span>
                {speechSupported && (
                  <>
                    <span>•</span>
                    <span>{t("search.modal.footer.voiceSearch")}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {speechSupported && (
                  <>
                    <Mic size={12} className="sm:w-3 sm:h-3" />
                    <span>{t("search.modal.footer.voiceAvailable")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;