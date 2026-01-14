// src/pages/Dashboards/kid/KidSongsMusicPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Play,
  Info,
  Search,
  Filter,
  X,
  Loader2,
  Music,
  Headphones,
  Mic,
  Disc,
  Clock,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  ChevronDown,
  Sparkles,
  Heart,
  Volume2,
  Guitar,
  Drum,
  Piano,
  Music2,
  User as Dance,
  Users,
  Award,
  Zap,
  Flame,
  AlertCircle,
  BookmarkPlus,
  Calendar,
  Repeat,
  Shuffle,
  Radio
} from "lucide-react";
import api from "../../../../api/axios";
import { useContentDetail } from '../../../../hooks/useContentDetail';
import ContentDetailPage from '../ContentDetailPage';
import { useTranslation } from "react-i18next";

export default function KidSongsMusicPage({ kidProfile }) {
  const { t } = useTranslation(); // Initialize translation hook
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    detailModal,
    openDetailModal,
    closeDetailModal
  } = useContentDetail();
  
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [sortOptions, setSortOptions] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'popular');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const contentFetchedRef = useRef(false);
  const searchInputRef = useRef(null);
  const filtersRef = useRef(null);

  // Music category icons mapping
  const categoryIcons = {
    'Music': <Music className="w-4 h-4 text-[#FF6B8B]" />,
    'Musical': <Music2 className="w-4 h-4 text-[#9D4EDD]" />,
    'Concert': <Volume2 className="w-4 h-4 text-[#FFD166]" />,
    'Performance': <Users className="w-4 h-4 text-[#4ECDC4]" />,
    'Dance': <Dance className="w-4 h-4 text-[#EF476F]" />,
    'Rhythm': <Drum className="w-4 h-4 text-[#7209B7]" />,
    'Singing': <Mic className="w-4 h-4 text-[#F72585]" />,
    'Karaoke': <Mic className="w-4 h-4 text-[#3A86FF]" />,
    'Instrumental': <Guitar className="w-4 h-4 text-[#FB5607]" />,
    'Classical': <Piano className="w-4 h-4 text-[#8338EC]" />,
    'Kids Music': <Music className="w-4 h-4 text-[#06D6A0]" />,
    'Nursery Rhymes': <Music className="w-4 h-4 text-[#FF9E6D]" />,
    'Children Songs': <Music className="w-4 h-4 text-[#38B000]" />,
    'Educational Music': <Music className="w-4 h-4 text-[#118AB2]" />,
    'default': <Music className="w-4 h-4 text-[#BC8BBC]" />
  };

  // Music type icons
  const musicTypeIcons = {
    'song': <Mic className="w-4 h-4 text-[#FF6B8B]" />,
    'music': <Headphones className="w-4 h-4 text-[#4ECDC4]" />,
    'dance': <Dance className="w-4 h-4 text-[#FFD166]" />,
    'instrumental': <Guitar className="w-4 h-4 text-[#9D4EDD]" />,
    'concert': <Volume2 className="w-4 h-4 text-[#EF476F]" />,
    'karaoke': <Mic className="w-4 h-4 text-[#3A86FF]" />,
    'default': <Music className="w-4 h-4 text-[#BC8BBC]" />
  };

  // Get music score badge color
  const getMusicScoreColor = (score) => {
    if (score >= 3) return 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white';
    if (score === 2) return 'bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white';
    if (score === 1) return 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  // Get music score label
  const getMusicScoreLabel = (score) => {
    if (score >= 3) return t('songsMusic.badges.topMusic');
    if (score === 2) return t('songsMusic.badges.greatMusic');
    if (score === 1) return t('songsMusic.badges.musicFun');
    return t('songsMusic.badges.awesomeSong');
  };

  // Fetch songs and music content
  const fetchSongsMusicContent = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      contentFetchedRef.current = true;

      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedType) params.set('type', selectedType);
      if (selectedSort) params.set('sort', selectedSort);
      params.set('page', page);
      params.set('limit', viewMode === 'grid' ? 20 : 15);

      const response = await api.get(`/kid/songs-music?${params.toString()}`);
      const data = response.data.data;

      setContents(data.contents || []);
      setTotalResults(data.pagination?.total || 0);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
      
      setCategories(data.filters?.categories || []);
      setGenres(data.filters?.genres || []);
      setContentTypes(data.filters?.content_types || []);
      setSortOptions(data.filters?.sort_options || []);
      setPopularCategories(data.popular_categories || []);

      setSearchParams(params, { replace: true });

    } catch (err) {
      console.error('Songs & music content loading error:', err);
      setError(t('songsMusic.errors.loading'));
      contentFetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedGenre, selectedType, selectedSort, viewMode, setSearchParams, t]);

  // Initial load
  useEffect(() => {
    fetchSongsMusicContent(1);
  }, [fetchSongsMusicContent]);

  // Handle click outside filters
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle play content
  const handlePlayContent = useCallback((content) => {
    if (content?.id) {
      navigate(`/watch/${content.id}`);
    }
  }, [navigate]);

  // Handle more info
  const handleMoreInfo = useCallback((content, cardRect) => {
    openDetailModal(content, cardRect);
  }, [openDetailModal]);

  // Handle search
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    fetchSongsMusicContent(1);
  }, [fetchSongsMusicContent]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value) => {
    switch (filterType) {
      case 'category':
        setSelectedCategory(value === selectedCategory ? '' : value);
        break;
      case 'genre':
        setSelectedGenre(value === selectedGenre ? '' : value);
        break;
      case 'type':
        setSelectedType(value === selectedType ? '' : value);
        break;
      case 'sort':
        setSelectedSort(value);
        break;
    }
  }, [selectedCategory, selectedGenre, selectedType]);

  // Apply filters
  const applyFilters = useCallback(() => {
    setShowFilters(false);
    fetchSongsMusicContent(1);
  }, [fetchSongsMusicContent]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedCategory('');
    setSelectedGenre('');
    setSelectedType('');
    setSelectedSort('popular');
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setShowFilters(false);
    fetchSongsMusicContent(1);
  }, [fetchSongsMusicContent]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      fetchSongsMusicContent(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages, fetchSongsMusicContent]);

  // Get age rating color
  const getAgeRatingColor = (rating) => {
    const ratingMap = {
      'all': 'bg-gradient-to-r from-green-500 to-emerald-500',
      '3+': 'bg-gradient-to-r from-blue-400 to-blue-600',
      '4+': 'bg-gradient-to-r from-blue-400 to-blue-600',
      '5+': 'bg-gradient-to-r from-blue-400 to-blue-600',
      '6+': 'bg-gradient-to-r from-purple-400 to-purple-600',
      '7+': 'bg-gradient-to-r from-purple-400 to-purple-600',
      '8+': 'bg-gradient-to-r from-pink-400 to-pink-600',
      '9+': 'bg-gradient-to-r from-pink-400 to-pink-600',
      '10+': 'bg-gradient-to-r from-orange-400 to-orange-600',
      '11+': 'bg-gradient-to-r from-orange-400 to-orange-600',
      '12+': 'bg-gradient-to-r from-red-400 to-red-600',
      'G': 'bg-gradient-to-r from-green-500 to-emerald-500',
      'TV-Y': 'bg-gradient-to-r from-green-400 to-green-600',
      'TV-Y7': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      'PG': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      'default': 'bg-gradient-to-r from-gray-500 to-gray-600'
    };
    return ratingMap[rating] || ratingMap.default;
  };

  // Loading skeleton
  const ContentGridSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {[...Array(12)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 rounded-xl aspect-[2/3] mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-[#9D4EDD]/20 to-[#7B2CBF]/20 rounded mb-1"></div>
          <div className="h-3 bg-gradient-to-r from-[#9D4EDD]/20 to-[#7B2CBF]/20 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  );

  // If detail modal is open, show the ContentDetailPage
  if (detailModal.isOpen) {
    return (
      <ContentDetailPage 
        content={detailModal.content}
        onPlay={handlePlayContent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] via-[#1A1A2E] to-[#16213E] pb-12">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{t('songsMusic.seo.title')}</title>
        <meta name="description" content={t('songsMusic.seo.description')} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:title" content={t('songsMusic.seo.title')} />
        <meta property="og:description" content={t('songsMusic.seo.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content="/images/kids-music-og.jpg" />
      </Helmet>

      {/* ✅ COMPACT: Hero Header in single line */}
      <div className="relative bg-gradient-to-r from-[#9D4EDD]/20 to-[#7B2CBF]/20 border-b border-[#9D4EDD]/30 pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#9D4EDD]/10 to-[#7B2CBF]/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] rounded-lg shadow-lg">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#FFD166] font-bold text-xs sm:text-sm">
                  {t('songsMusic.header.title')}
                </span>
              </div>
              
              <span className="text-white font-bold text-base sm:text-lg mx-2">|</span>
              
              <h1 className="text-white font-bold text-base sm:text-lg md:text-xl">
                {t('songsMusic.header.subtitle')}
              </h1>
              
              <span className="text-white font-bold text-base sm:text-lg mx-2">|</span>
              
              <div className="flex items-center gap-2">
                <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD166]" />
                <span className="text-white font-semibold text-xs sm:text-sm">
                  {t('songsMusic.header.popular')}
                </span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          {popularCategories.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {popularCategories.map((category, index) => (
                  <button
                    key={category.name}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      fetchSongsMusicContent(1);
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs transition-all ${selectedCategory === category.name ? 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white shadow-lg' : 'bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30'}`}
                  >
                    {categoryIcons[category.name] || categoryIcons.default}
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Search and Filter Bar */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0F0F23] to-[#1A1A2E]/95 backdrop-blur-sm border-b border-[#9D4EDD]/30 pt-14">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto">
              <div className="relative max-w-xl">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('songsMusic.search.placeholder')}
                  defaultValue={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 backdrop-blur-sm border border-[#9D4EDD]/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD166] focus:border-transparent text-sm sm:text-base"
                />
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#9D4EDD]" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      if (searchInputRef.current) {
                        searchInputRef.current.value = '';
                      }
                    }}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 backdrop-blur-sm rounded-lg p-1 border border-[#9D4EDD]/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#9D4EDD]/30'}`}
                  title={t('songsMusic.buttons.gridView')}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#9D4EDD] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#9D4EDD]/30'}`}
                  title={t('songsMusic.buttons.listView')}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all shadow-lg ${showFilters || selectedCategory || selectedGenre || selectedType || selectedSort !== 'popular' ? 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white' : 'bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 backdrop-blur-sm text-gray-300 hover:text-white border border-[#9D4EDD]/30'}`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium">{t('songsMusic.buttons.filters')}</span>
                {(selectedCategory || selectedGenre || selectedType || selectedSort !== 'popular') && (
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters Bar */}
          {(selectedCategory || selectedGenre || selectedType || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 animate-in slide-in-from-top duration-300">
              <span className="text-gray-400 text-xs sm:text-sm">
                {t('songsMusic.activeFilters')}:
              </span>
              
              {searchQuery && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#4ECDC4]/20 to-[#44A08D]/20 text-[#4ECDC4] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#4ECDC4]/30">
                  <Search className="w-3 h-3" />
                  "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {selectedCategory && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#9D4EDD]/20 to-[#7B2CBF]/20 text-[#9D4EDD] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#9D4EDD]/30">
                  {categoryIcons[selectedCategory] || categoryIcons.default}
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {selectedGenre && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#FF6B8B]/20 to-[#FF8E53]/20 text-[#FF6B8B] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#FF6B8B]/30">
                  <Music className="w-3 h-3" />
                  {selectedGenre}
                  <button
                    onClick={() => setSelectedGenre('')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {selectedType && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#FFD166]/20 to-[#FFB347]/20 text-[#FFD166] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#FFD166]/30">
                  {musicTypeIcons[selectedType] || musicTypeIcons.default}
                  {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                  <button
                    onClick={() => setSelectedType('')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[#9D4EDD] hover:text-[#FFD166] text-xs sm:text-sm underline transition-colors font-medium"
              >
                {t('songsMusic.buttons.clearAll')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* ✅ REMOVED: Results Header with counting */}

        {/* Filters Panel */}
        {showFilters && (
          <div 
            ref={filtersRef}
            className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 animate-in slide-in-from-top duration-300 border border-[#9D4EDD]/30 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#9D4EDD]" />
                {t('songsMusic.filterPanel.title')}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('songsMusic.filterPanel.sortBy')}
                </label>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sort', option.value)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedSort === option.value ? 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white shadow-lg' : 'bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30'}`}
                    >
                      {option.value === 'popular' && <Flame className="w-4 h-4" />}
                      {option.value === 'recent' && <Calendar className="w-4 h-4" />}
                      {option.value === 'rating' && <Star className="w-4 h-4" />}
                      {option.value === 'trending' && <TrendingUp className="w-4 h-4" />}
                      {option.value === 'featured' && <Sparkles className="w-4 h-4" />}
                      {option.value === 'alphabetical' && <span className="text-lg font-bold">A</span>}
                      {option.value === 'duration' && <Clock className="w-4 h-4" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('songsMusic.filterPanel.musicTypes')}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {categories.slice(0, 8).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange('category', category.name)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedCategory === category.name ? 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white shadow-lg' : 'bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30'}`}
                    >
                      {categoryIcons[category.name] || categoryIcons.default}
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('songsMusic.filterPanel.musicStyles')}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {genres.slice(0, 8).map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleFilterChange('genre', genre.name)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedGenre === genre.name ? 'bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white shadow-lg' : 'bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30'}`}
                    >
                      <Music className="w-4 h-4" />
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('songsMusic.filterPanel.contentType')}
                </label>
                <div className="space-y-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('type', type)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedType === type ? 'bg-gradient-to-r from-[#FFD166] to-[#FFB347] text-white shadow-lg' : 'bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30'}`}
                    >
                      {type === 'movie' && '🎬'}
                      {type === 'series' && '📺'}
                      {type === 'short_film' && '⏱️'}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#9D4EDD]/30">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 text-gray-400 hover:text-[#FFD166] text-sm transition-colors"
              >
                {t('songsMusic.filterPanel.clearAllFilters')}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors"
                >
                  {t('songsMusic.filterPanel.cancel')}
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] hover:from-[#7B2CBF] hover:to-[#9D4EDD] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-[#9D4EDD]/20"
                >
                  {t('songsMusic.filterPanel.applyFilters')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <ContentGridSkeleton />
          </div>
        ) : error ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#FF6B8B]/20 to-[#FF8E53]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF6B8B]" />
            </div>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
              {t('songsMusic.errors.title')}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchSongsMusicContent(1)}
              className="bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] hover:from-[#7B2CBF] hover:to-[#9D4EDD] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              {t('songsMusic.buttons.tryAgain')}
            </button>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-[#9D4EDD]" />
            </div>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
              {t('songsMusic.noContent.title')}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
              {t('songsMusic.noContent.description')}
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] hover:from-[#7B2CBF] hover:to-[#9D4EDD] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              {t('songsMusic.buttons.clearAllFilters')}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {contents.map((content) => (
              <div
                key={content.id}
                className="group relative bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#9D4EDD]/20 hover:border-[#FFD166] transition-all duration-300 hover:shadow-xl hover:shadow-[#9D4EDD]/10 transform hover:-translate-y-1"
              >
                {/* Music Score Badge */}
                {content.music_score > 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`${getMusicScoreColor(content.music_score)} text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                      <Award className="w-3 h-3" />
                      {getMusicScoreLabel(content.music_score)}
                    </div>
                  </div>
                )}

                {/* Age Rating Badge */}
                {content.age_rating && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-gradient-to-r from-[#118AB2] to-[#073B4C] text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-lg">
                      {content.age_rating}
                    </div>
                  </div>
                )}

                {/* Content Image */}
                <div 
                  className="aspect-[2/3] bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 overflow-hidden cursor-pointer"
                  onClick={() => handleMoreInfo(content)}
                >
                  {content.primary_image_url ? (
                    <img
                      src={content.primary_image_url}
                      alt={content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 p-4">
                      <Music className="w-8 h-8 sm:w-12 sm:h-12 text-[#9D4EDD]/50 mb-2" />
                      <span className="text-[#9D4EDD]/50 text-xs text-center">{content.title}</span>
                    </div>
                  )}
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayContent(content);
                        }}
                        className="bg-gradient-to-r from-[#FFD166] to-[#FFB347] hover:from-[#FFB347] hover:to-[#FFD166] text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-3 sm:p-4">
                  <h3 
                    className="text-white font-bold text-sm sm:text-base mb-1 line-clamp-1 cursor-pointer hover:text-[#FFD166] transition-colors"
                    onClick={() => handleMoreInfo(content)}
                  >
                    {content.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#4ECDC4]" />
                      {content.duration_minutes ? 
                        `${Math.floor(content.duration_minutes / 60)}h ${content.duration_minutes % 60}m` : 
                        t('songsMusic.metadata.durationNA')
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <Music className="w-3 h-3 text-[#9D4EDD]" />
                      <span>{t('songsMusic.metadata.musicVideo')}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  {content.categories && content.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {content.categories.slice(0, 2).map((cat, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-0.5 bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 text-gray-300 rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#9D4EDD]/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayContent(content);
                      }}
                      className="flex items-center gap-1 text-[#FFD166] hover:text-[#FFB347] text-xs font-bold transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      {t('songsMusic.buttons.playNow')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoreInfo(content);
                      }}
                      className="text-gray-400 hover:text-white text-xs transition-colors"
                    >
                      {t('songsMusic.buttons.details')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3 sm:space-y-4">
            {contents.map((content) => (
              <div
                key={content.id}
                className="group bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#9D4EDD]/20 hover:border-[#FFD166] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div 
                    className="w-full sm:w-48 h-40 sm:h-32 bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 relative cursor-pointer"
                    onClick={() => handleMoreInfo(content)}
                  >
                    {content.primary_image_url ? (
                      <img
                        src={content.primary_image_url}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10">
                        <Music className="w-8 h-8 text-[#9D4EDD]/50" />
                      </div>
                    )}
                    
                    {/* Music Score Badge */}
                    {content.music_score > 0 && (
                      <div className="absolute top-2 left-2">
                        <div className={`${getMusicScoreColor(content.music_score)} text-xs font-bold px-2 py-1 rounded-full`}>
                          {getMusicScoreLabel(content.music_score)}
                        </div>
                      </div>
                    )}
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayContent(content);
                        }}
                        className="bg-gradient-to-r from-[#FFD166] to-[#FFB347] hover:from-[#FFB347] hover:to-[#FFD166] text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="flex-1 p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="text-white font-bold text-base sm:text-lg cursor-pointer hover:text-[#FFD166] transition-colors"
                            onClick={() => handleMoreInfo(content)}
                          >
                            {content.title}
                          </h3>
                          {content.age_rating && (
                            <span className="bg-gradient-to-r from-[#118AB2] to-[#073B4C] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {content.age_rating}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-2 sm:mb-3 line-clamp-2">
                          {content.description || t('songsMusic.metadata.noDescription')}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#4ECDC4]" />
                            {content.duration_minutes ? 
                              `${Math.floor(content.duration_minutes / 60)}h ${content.duration_minutes % 60}m` : 
                              t('songsMusic.metadata.durationNAFull')
                            }
                          </div>
                          <div className="flex items-center gap-1">
                            <Music className="w-3 h-3 sm:w-4 sm:h-4 text-[#9D4EDD]" />
                            <span>{t('songsMusic.metadata.musicVideo')}</span>
                          </div>
                        </div>
                        
                        {/* Categories & Genres */}
                        <div className="flex flex-wrap gap-2">
                          {content.categories && content.categories.slice(0, 3).map((cat, index) => (
                            <span 
                              key={index} 
                              className="text-xs px-2 py-1 bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 text-gray-300 rounded-full flex items-center gap-1"
                            >
                              {categoryIcons[cat] || categoryIcons.default}
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => handlePlayContent(content)}
                          className="flex items-center gap-2 bg-gradient-to-r from-[#FFD166] to-[#FFB347] hover:from-[#FFB347] hover:to-[#FFD166] text-white px-3 sm:px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap shadow-lg"
                        >
                          <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                          {t('songsMusic.buttons.playNow')}
                        </button>
                        <button
                          onClick={() => handleMoreInfo(content)}
                          className="flex items-center gap-2 bg-gradient-to-br from-[#9D4EDD]/20 to-[#7B2CBF]/20 hover:from-[#9D4EDD]/40 hover:to-[#7B2CBF]/40 text-white px-3 sm:px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap"
                        >
                          <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                          {t('songsMusic.buttons.details')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && contents.length > 0 && (
          <div className="flex items-center justify-center mt-6 sm:mt-8">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30 text-gray-300 disabled:text-gray-500 disabled:hover:from-[#9D4EDD]/10 disabled:hover:to-[#7B2CBF]/10 rounded-lg transition-all disabled:cursor-not-allowed border border-[#9D4EDD]/30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('songsMusic.pagination.previous')}</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === pageNum ? 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white shadow-lg' : 'bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="text-gray-500 px-2">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30 rounded-lg transition-all"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#9D4EDD]/10 to-[#7B2CBF]/10 hover:from-[#9D4EDD]/30 hover:to-[#7B2CBF]/30 text-gray-300 disabled:text-gray-500 disabled:hover:from-[#9D4EDD]/10 disabled:hover:to-[#7B2CBF]/10 rounded-lg transition-all disabled:cursor-not-allowed border border-[#9D4EDD]/30"
              >
                <span className="hidden sm:inline">{t('songsMusic.pagination.next')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}