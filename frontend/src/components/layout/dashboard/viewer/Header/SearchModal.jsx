import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Play, Film, Loader, Zap, Sparkles, Gift, TrendingUp, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Enhanced quick searches with icons
  const quickSearches = [
    { label: "Action Movies", icon: <Zap size={16} className="text-yellow-400" />, type: "movie" },
    { label: "Comedy Shows", icon: <Sparkles size={16} className="text-purple-400" />, type: "tv" },
    { label: "New Releases", icon: <Gift size={16} className="text-pink-400" />, type: "new" },
    { label: "Top Rated", icon: <TrendingUp size={16} className="text-green-400" />, type: "top" },
    { label: "Drama Series", icon: <Film size={16} className="text-blue-400" />, type: "tv" },
    { label: "Family Movies", icon: <Heart size={16} className="text-red-400" />, type: "movie" },
  ];

  // Mock search results for demonstration
  const mockSearchResults = [
    { id: 1, title: "Demon Slayer", type: "movie", year: "2024", rating: "4.8", image: "🎬", genre: "Action", color: "from-red-500/20 to-orange-500/20" },
    { id: 2, title: "Stranger Things", type: "tv", year: "2023", rating: "4.9", image: "📺", genre: "Sci-Fi", color: "from-blue-500/20 to-purple-500/20" },
    { id: 3, title: "The Witcher", type: "tv", year: "2023", rating: "4.7", image: "⚔️", genre: "Fantasy", color: "from-gray-500/20 to-yellow-500/20" },
    { id: 4, title: "Black Mirror", type: "tv", year: "2023", rating: "4.6", image: "🔮", genre: "Drama", color: "from-purple-500/20 to-pink-500/20" },
  ];

  // Enhanced search function with animations
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    
    // Simulate API call with timeout for better UX
    setTimeout(() => {
      const results = mockSearchResults.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setSearchLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Enhanced search modal handlers
  const handleSearchClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setSearchQuery("");
      setSearchResults([]);
      setIsClosing(false);
    }, 300);
  };

  // Enhanced ESC key handler for search
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen && !isClosing) {
      handleSearchClose();
    }
  }, [isOpen, isClosing]);

  // Enhanced backdrop click with ripple
  const handleBackdropClick = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target) && !isClosing) {
      handleSearchClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus input after animation
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 400);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Quick search handler
  const handleQuickSearch = (searchTerm) => {
    setSearchQuery(searchTerm);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Search result item component
  const SearchResultItem = ({ result, index }) => (
    <div
      className={`group p-4 rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-r ${result.color} border border-gray-600/30 backdrop-blur-sm`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
      onClick={() => {
        navigate(`/watch/${result.id}`);
        handleSearchClose();
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center text-2xl backdrop-blur-sm border border-gray-600/50">
            {result.image}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-lg truncate group-hover:text-[#BC8BBC] transition-colors">
              {result.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-sm font-bold bg-yellow-400/10 px-2 py-1 rounded-full">
                ⭐ {result.rating}
              </span>
              <Play size={16} className="text-[#BC8BBC] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <Film size={14} />
              {result.type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
            <span>•</span>
            <span>{result.year}</span>
            <span>•</span>
            <span className="text-[#BC8BBC] font-medium">{result.genre}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <style jsx>{`
        @keyframes searchModalEnter {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
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
            transform: scale(0.8) translateY(-20px);
          }
        }

        .backdrop-blur-ultra {
          backdrop-filter: blur(40px);
        }

        .search-input-glow:focus {
          box-shadow: 0 0 30px rgba(188, 139, 188, 0.3);
        }
      `}</style>

      <div 
        className="fixed inset-0 z-[100] flex items-start justify-center pt-8 pb-8 px-4 transition-all duration-300"
        onClick={handleBackdropClick}
      >
        {/* Enhanced Backdrop with blur and visibility */}
        <div className={`absolute inset-0 transition-all duration-300 ${
          isClosing 
            ? 'bg-black/50 backdrop-blur-ultra' 
            : 'bg-black/70 backdrop-blur-ultra'
        }`} />
        
        {/* Search Modal Content */}
        <div 
          ref={searchRef}
          className={`relative w-full max-w-4xl bg-gray-900/80 backdrop-blur-ultra border border-gray-600/30 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
            isClosing 
              ? 'animate-searchModalExit' 
              : 'animate-searchModalEnter'
          }`}
          style={{
            animation: isClosing ? 'searchModalExit 0.3s ease-in-out both' : 'searchModalEnter 0.4s ease-out both'
          }}
        >
          {/* Search Header */}
          <div className="p-6 border-b border-gray-600/30 bg-gradient-to-r from-gray-800/90 to-gray-900/90">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#BC8BBC]/20 rounded-2xl backdrop-blur-sm border border-[#BC8BBC]/30">
                <Search size={28} className="text-[#BC8BBC]" />
              </div>
              <input 
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, TV shows, and more..."
                className="flex-1 bg-transparent text-white placeholder-gray-400 text-2xl font-light outline-none search-input-glow border-none"
                autoFocus
              />
              <button 
                onClick={handleSearchClose}
                className="p-3 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-2xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-gray-600/30"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Search Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            {searchQuery ? (
              <div className="p-6">
                {/* Search Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {searchLoading ? "Searching..." : `Results for "${searchQuery}"`}
                  </h3>
                  {searchResults.length > 0 && (
                    <span className="text-gray-400 text-sm bg-gray-700/50 px-3 py-1 rounded-full">
                      {searchResults.length} found
                    </span>
                  )}
                </div>

                {/* Loading State */}
                {searchLoading && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader size={48} className="text-[#BC8BBC] animate-spin mb-4" />
                    <p className="text-gray-400 text-lg">Searching our library...</p>
                  </div>
                )}

                {/* Search Results */}
                {!searchLoading && searchResults.length > 0 && (
                  <div className="grid gap-4">
                    {searchResults.map((result, index) => (
                      <SearchResultItem key={result.id} result={result} index={index} />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!searchLoading && searchQuery && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="p-6 bg-gray-800/50 rounded-3xl mb-6 backdrop-blur-sm border border-gray-600/30">
                      <Search size={64} className="opacity-50 text-[#BC8BBC]" />
                    </div>
                    <p className="text-2xl font-bold text-white mb-3">No results found</p>
                    <p className="text-gray-300 text-center max-w-sm text-lg">
                      Try different keywords or browse our categories below
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Quick Searches */
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Quick Searches</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickSearches.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(item.label)}
                      className="flex items-center gap-4 p-4 text-left bg-gray-800/50 hover:bg-gray-700/50 rounded-2xl transition-all duration-300 transform hover:scale-105 border border-gray-600/30 hover:border-[#BC8BBC]/30 group backdrop-blur-sm"
                    >
                      <div className="p-3 bg-gray-700/50 rounded-xl group-hover:bg-[#BC8BBC]/20 transition-colors">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-white font-semibold group-hover:text-[#BC8BBC] transition-colors">
                          {item.label}
                        </p>
                        <p className="text-gray-400 text-sm capitalize">{item.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search Footer */}
          <div className="p-4 border-t border-gray-600/30 bg-gradient-to-r from-gray-800/80 to-gray-900/80">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-4">
                <span>Press ESC to close</span>
                <span>•</span>
                <span>↑↓ to navigate</span>
              </div>
              <span>Enter to select</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchModal;