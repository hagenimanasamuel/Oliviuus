// src/pages/Dashboards/kid/KidLearningPage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Play,
  Plus,
  Info,
  Search,
  Filter,
  X,
  Loader2,
  BookOpen,
  GraduationCap,
  Clock,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  ChevronDown,
  Sparkles,
  Music,
  Palette,
  Calculator,
  Globe,
  Atom,
  History,
  Target,
  AlertCircle,
  Zap,
  Flame,
  BarChart3,
  Brain,
  Microscope,
  Book,
  Languages,
  Award,
  Video,
  Youtube,
  School,
  Baby
} from "lucide-react";
import api from "../../../../api/axios";
import userPreferencesApi from "../../../../api/userPreferencesApi";
import ContentCard from "../../../../components/layout/dashboard/viewer/kid/content/ContentCard";
import { useContentDetail } from '../../../../hooks/useContentDetail';
import ContentDetailPage from '../ContentDetailPage';
import { useTranslation } from "react-i18next";

export default function KidLearningPage({ kidProfile }) {
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
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(searchParams.get('age') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'popular');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const contentFetchedRef = useRef(false);
  const searchInputRef = useRef(null);
  const filtersRef = useRef(null);

  // Educational category icons mapping with kid-friendly colors
  const categoryIcons = {
    'Educational': <BookOpen className="w-4 h-4 text-[#BC8BBC]" />,
    'Documentary': <GraduationCap className="w-4 h-4 text-[#FF6B8B]" />,
    'Science': <Atom className="w-4 h-4 text-[#4ECDC4]" />,
    'History': <History className="w-4 h-4 text-[#FFD166]" />,
    'Nature': <Globe className="w-4 h-4 text-[#06D6A0]" />,
    'Technology': <Target className="w-4 h-4 text-[#118AB2]" />,
    'Mathematics': <Calculator className="w-4 h-4 text-[#EF476F]" />,
    'Art': <Palette className="w-4 h-4 text-[#FF9E6D]" />,
    'Music': <Music className="w-4 h-4 text-[#9D4EDD]" />,
    'Sports': <Target className="w-4 h-4 text-[#FF6B6B]" />,
    'Physics': <Atom className="w-4 h-4 text-[#7209B7]" />,
    'Chemistry': <Microscope className="w-4 h-4 text-[#F72585]" />,
    'Biology': <Brain className="w-4 h-4 text-[#4CC9F0]" />,
    'Geography': <Globe className="w-4 h-4 text-[#4361EE]" />,
    'Language': <Languages className="w-4 h-4 text-[#38B000]" />,
    'Literature': <Book className="w-4 h-4 text-[#8338EC]" />,
    'Crafts': <Palette className="w-4 h-4 text-[#FF006E]" />,
    'Cooking': <Sparkles className="w-4 h-4 text-[#FB5607]" />,
    'default': <Sparkles className="w-4 h-4 text-[#BC8BBC]" />
  };

  // Age groups for kids with emojis - Translated
  const ageGroups = [
    { value: '3-5', label: t('learning.ageGroups.preschool'), icon: <Baby className="w-4 h-4" /> },
    { value: '6-8', label: t('learning.ageGroups.earlyElementary'), icon: <School className="w-4 h-4" /> },
    { value: '9-11', label: t('learning.ageGroups.upperElementary'), icon: <BookOpen className="w-4 h-4" /> },
    { value: '12-14', label: t('learning.ageGroups.middleSchool'), icon: <GraduationCap className="w-4 h-4" /> }
  ];

  // Fetch learning content
  const fetchLearningContent = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      contentFetchedRef.current = true;

      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedType) params.set('type', selectedType);
      if (selectedAgeGroup) params.set('age', selectedAgeGroup);
      if (selectedSort) params.set('sort', selectedSort);
      params.set('page', page);
      params.set('limit', viewMode === 'grid' ? 20 : 15);

      const response = await api.get(`/kid/learning?${params.toString()}`);
      const data = response.data.data;

      setContents(data.contents || []);
      setTotalResults(data.pagination?.total || 0);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
      
      setCategories(data.filters?.categories || []);
      setGenres(data.filters?.genres || []);
      setContentTypes(data.filters?.content_types || []);
      setSortOptions(data.filters?.sort_options || []);

      setSearchParams(params, { replace: true });

    } catch (err) {
      console.error('Learning content loading error:', err);
      setError(t('learning.errors.loading'));
      contentFetchedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedGenre, selectedType, selectedAgeGroup, selectedSort, viewMode, setSearchParams, t]);

  // Initial load
  useEffect(() => {
    fetchLearningContent(1);
  }, [fetchLearningContent]);

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
    fetchLearningContent(1);
  }, [fetchLearningContent]);

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
      case 'age':
        setSelectedAgeGroup(value === selectedAgeGroup ? '' : value);
        break;
      case 'sort':
        setSelectedSort(value);
        break;
    }
  }, [selectedCategory, selectedGenre, selectedType, selectedAgeGroup]);

  // Apply filters
  const applyFilters = useCallback(() => {
    setShowFilters(false);
    fetchLearningContent(1);
  }, [fetchLearningContent]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedCategory('');
    setSelectedGenre('');
    setSelectedType('');
    setSelectedAgeGroup('');
    setSelectedSort('popular');
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setShowFilters(false);
    fetchLearningContent(1);
  }, [fetchLearningContent]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      fetchLearningContent(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages, fetchLearningContent]);

  // Get educational score badge color
  const getEducationalScoreColor = (score) => {
    if (score >= 3) return 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white';
    if (score === 2) return 'bg-gradient-to-r from-[#FFD166] to-[#FFB347] text-white';
    if (score === 1) return 'bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  // Get educational score label
  const getEducationalScoreLabel = (score) => {
    if (score >= 3) return t('learning.badges.superSmart');
    if (score === 2) return t('learning.badges.learningTime');
    if (score === 1) return t('learning.badges.funLearning');
    return t('learning.badges.awesomeContent');
  };

  // Get age group color
  const getAgeGroupColor = (age) => {
    switch (age) {
      case '3-5': return 'bg-gradient-to-r from-[#FF9E6D] to-[#FF7EB3] text-white';
      case '6-8': return 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white';
      case '9-11': return 'bg-gradient-to-r from-[#FFD166] to-[#FFB347] text-white';
      case '12-14': return 'bg-gradient-to-r from-[#118AB2] to-[#073B4C] text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  // Loading skeleton
  const ContentGridSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {[...Array(12)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 rounded-xl aspect-[2/3] mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 rounded mb-1"></div>
          <div className="h-3 bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 rounded w-2/3"></div>
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
        <title>{t('learning.seo.title')}</title>
        <meta name="description" content={t('learning.seo.description')} />
        <link rel="canonical" href={window.location.href} />
        <meta property="og:title" content={t('learning.seo.title')} />
        <meta property="og:description" content={t('learning.seo.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content="/images/kids-learning-og.jpg" />
      </Helmet>

      {/* ✅ COMPACT: Hero Header in single line */}
      <div className="relative bg-gradient-to-r from-[#BC8BBC]/20 to-[#9A679A]/20 border-b border-[#BC8BBC]/30 pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/10 to-[#9A679A]/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] rounded-lg shadow-lg">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="text-[#FFD166] font-bold text-xs sm:text-sm">
                  {t('learning.header.title')}
                </span>
              </div>
              
              <span className="text-white font-bold text-base sm:text-lg mx-2">|</span>
              
              <h1 className="text-white font-bold text-base sm:text-lg md:text-xl">
                {t('learning.header.subtitle')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: Search and Filter Bar with proper spacing */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-[#0F0F23] to-[#1A1A2E]/95 backdrop-blur-sm border-b border-[#BC8BBC]/30 pt-14">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto">
              <div className="relative max-w-xl">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('learning.search.placeholder')}
                  defaultValue={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 backdrop-blur-sm border border-[#BC8BBC]/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD166] focus:border-transparent text-sm sm:text-base"
                />
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#BC8BBC]" />
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
              <div className="flex items-center gap-1 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 backdrop-blur-sm rounded-lg p-1 border border-[#BC8BBC]/30">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#BC8BBC] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#BC8BBC]/30'}`}
                  title={t('learning.buttons.gridView')}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#BC8BBC] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-[#BC8BBC]/30'}`}
                  title={t('learning.buttons.listView')}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all shadow-lg ${showFilters || selectedCategory || selectedGenre || selectedType || selectedAgeGroup || selectedSort !== 'popular' ? 'bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] text-white' : 'bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 backdrop-blur-sm text-gray-300 hover:text-white border border-[#BC8BBC]/30'}`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-medium">{t('learning.buttons.filters')}</span>
                {(selectedCategory || selectedGenre || selectedType || selectedAgeGroup || selectedSort !== 'popular') && (
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters Bar */}
          {(selectedCategory || selectedGenre || selectedType || selectedAgeGroup || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4 animate-in slide-in-from-top duration-300">
              <span className="text-gray-400 text-xs sm:text-sm">
                {t('learning.activeFilters')}:
              </span>
              
              {searchQuery && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#118AB2]/20 to-[#073B4C]/20 text-[#4ECDC4] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#118AB2]/30">
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
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#4ECDC4]/20 to-[#44A08D]/20 text-[#4ECDC4] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#4ECDC4]/30">
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
                  <BookOpen className="w-3 h-3" />
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
                  {selectedType === 'movie' && '🎬'}
                  {selectedType === 'series' && '📺'}
                  {selectedType === 'documentary' && '🎥'}
                  {selectedType === 'short_film' && '⏱️'}
                  {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                  <button
                    onClick={() => setSelectedType('')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              
              {selectedAgeGroup && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-[#9D4EDD]/20 to-[#7B2CBF]/20 text-[#9D4EDD] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-[#9D4EDD]/30">
                  {ageGroups.find(a => a.value === selectedAgeGroup)?.icon}
                  {ageGroups.find(a => a.value === selectedAgeGroup)?.label}
                  <button
                    onClick={() => setSelectedAgeGroup('')}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[#BC8BBC] hover:text-[#FFD166] text-xs sm:text-sm underline transition-colors font-medium"
              >
                {t('learning.buttons.clearAll')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ FIXED: Main Content with proper spacing */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* ✅ REMOVED: Results Header with counting and empty spacing */}

        {/* Filters Panel */}
        {showFilters && (
          <div 
            ref={filtersRef}
            className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 animate-in slide-in-from-top duration-300 border border-[#BC8BBC]/30 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#BC8BBC]" />
                {t('learning.filterPanel.title')}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('learning.filterPanel.sortBy')}
                </label>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sort', option.value)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedSort === option.value ? 'bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] text-white shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
                    >
                      {option.value === 'popular' && <Flame className="w-4 h-4" />}
                      {option.value === 'recent' && <Clock className="w-4 h-4" />}
                      {option.value === 'rating' && <Star className="w-4 h-4" />}
                      {option.value === 'trending' && <TrendingUp className="w-4 h-4" />}
                      {option.value === 'featured' && <Sparkles className="w-4 h-4" />}
                      {option.value === 'alphabetical' && <span className="text-lg font-bold">A</span>}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('learning.filterPanel.ageGroup')}
                </label>
                <div className="space-y-2">
                  {ageGroups.map((age) => (
                    <button
                      key={age.value}
                      onClick={() => handleFilterChange('age', age.value)}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedAgeGroup === age.value ? getAgeGroupColor(age.value) + ' shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
                    >
                      <div className="flex items-center gap-2">
                        {age.icon}
                        <span>{age.label.split(' ')[0]}</span>
                      </div>
                      {selectedAgeGroup === age.value && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('learning.filterPanel.subjects')}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {categories.slice(0, 6).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleFilterChange('category', category.name)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedCategory === category.name ? 'bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
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
                  {t('learning.filterPanel.learningStyles')}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {genres.slice(0, 6).map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleFilterChange('genre', genre.name)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedGenre === genre.name ? 'bg-gradient-to-r from-[#FF6B8B] to-[#FF8E53] text-white shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
                    >
                      <BookOpen className="w-4 h-4" />
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Types */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('learning.filterPanel.contentType')}
                </label>
                <div className="space-y-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('type', type)}
                      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${selectedType === type ? 'bg-gradient-to-r from-[#FFD166] to-[#FFB347] text-white shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
                    >
                      {type === 'movie' && '🎬'}
                      {type === 'series' && '📺'}
                      {type === 'documentary' && '🎥'}
                      {type === 'short_film' && '⏱️'}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#BC8BBC]/30">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2.5 text-gray-400 hover:text-[#FFD166] text-sm transition-colors"
              >
                {t('learning.filterPanel.clearAllFilters')}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors"
                >
                  {t('learning.filterPanel.cancel')}
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] hover:from-[#9A679A] hover:to-[#BC8BBC] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-[#BC8BBC]/20"
                >
                  {t('learning.filterPanel.applyFilters')}
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
              {t('learning.errors.title')}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchLearningContent(1)}
              className="bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] hover:from-[#9A679A] hover:to-[#BC8BBC] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              {t('learning.buttons.tryAgain')}
            </button>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-[#BC8BBC]" />
            </div>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
              {t('learning.noContent.title')}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
              {t('learning.noContent.description')}
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] hover:from-[#9A679A] hover:to-[#BC8BBC] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              {t('learning.buttons.clearAllFilters')}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {contents.map((content) => (
              <div
                key={content.id}
                className="group relative bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#BC8BBC]/20 hover:border-[#FFD166] transition-all duration-300 hover:shadow-xl hover:shadow-[#BC8BBC]/10 transform hover:-translate-y-1"
              >
                {/* Educational Score Badge */}
                {content.educational_score > 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`${getEducationalScoreColor(content.educational_score)} text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg`}>
                      <Award className="w-3 h-3" />
                      {getEducationalScoreLabel(content.educational_score)}
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
                  className="aspect-[2/3] bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 overflow-hidden cursor-pointer"
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 p-4">
                      <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-[#BC8BBC]/50 mb-2" />
                      <span className="text-[#BC8BBC]/50 text-xs text-center">{content.title}</span>
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
                        t('learning.metadata.durationNA')
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#FFD166]" />
                      <span>{t('learning.metadata.kidSafe')}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  {content.categories && content.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {content.categories.slice(0, 2).map((cat, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-0.5 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 text-gray-300 rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#BC8BBC]/20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayContent(content);
                      }}
                      className="flex items-center gap-1 text-[#FFD166] hover:text-[#FFB347] text-xs font-bold transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      {t('learning.buttons.watch')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoreInfo(content);
                      }}
                      className="text-gray-400 hover:text-white text-xs transition-colors"
                    >
                      {t('learning.buttons.details')}
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
                className="group bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#BC8BBC]/20 hover:border-[#FFD166] transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div 
                    className="w-full sm:w-48 h-40 sm:h-32 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 relative cursor-pointer"
                    onClick={() => handleMoreInfo(content)}
                  >
                    {content.primary_image_url ? (
                      <img
                        src={content.primary_image_url}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10">
                        <BookOpen className="w-8 h-8 text-[#BC8BBC]/50" />
                      </div>
                    )}
                    
                    {/* Educational Score Badge */}
                    {content.educational_score > 0 && (
                      <div className="absolute top-2 left-2">
                        <div className={`${getEducationalScoreColor(content.educational_score)} text-xs font-bold px-2 py-1 rounded-full`}>
                          {getEducationalScoreLabel(content.educational_score)}
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
                          {content.description || t('learning.metadata.noDescription')}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-[#4ECDC4]" />
                            {content.duration_minutes ? 
                              `${Math.floor(content.duration_minutes / 60)}h ${content.duration_minutes % 60}m` : 
                              t('learning.metadata.durationNAFull')
                            }
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-[#FFD166]" />
                            <span>{t('learning.metadata.educational')}</span>
                          </div>
                        </div>
                        
                        {/* Categories & Genres */}
                        <div className="flex flex-wrap gap-2">
                          {content.categories && content.categories.slice(0, 3).map((cat, index) => (
                            <span 
                              key={index} 
                              className="text-xs px-2 py-1 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 text-gray-300 rounded-full flex items-center gap-1"
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
                          {t('learning.buttons.watchNow')}
                        </button>
                        <button
                          onClick={() => handleMoreInfo(content)}
                          className="flex items-center gap-2 bg-gradient-to-br from-[#BC8BBC]/20 to-[#9A679A]/20 hover:from-[#BC8BBC]/40 hover:to-[#9A679A]/40 text-white px-3 sm:px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap"
                        >
                          <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                          {t('learning.buttons.details')}
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
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30 text-gray-300 disabled:text-gray-500 disabled:hover:from-[#BC8BBC]/10 disabled:hover:to-[#9A679A]/10 rounded-lg transition-all disabled:cursor-not-allowed border border-[#BC8BBC]/30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('learning.pagination.previous')}</span>
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
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition-all ${currentPage === pageNum ? 'bg-gradient-to-r from-[#BC8BBC] to-[#9A679A] text-white shadow-lg' : 'bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30'}`}
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
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 text-gray-300 hover:bg-gradient-to-r hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30 rounded-lg transition-all"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gradient-to-br from-[#BC8BBC]/10 to-[#9A679A]/10 hover:from-[#BC8BBC]/30 hover:to-[#9A679A]/30 text-gray-300 disabled:text-gray-500 disabled:hover:from-[#BC8BBC]/10 disabled:hover:to-[#9A679A]/10 rounded-lg transition-all disabled:cursor-not-allowed border border-[#BC8BBC]/30"
              >
                <span className="hidden sm:inline">{t('learning.pagination.next')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}