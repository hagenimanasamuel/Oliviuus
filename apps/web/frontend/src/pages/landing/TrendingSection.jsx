import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import PublicContentCard from "./PublicContentCard";
import ContentDetailModal from "./ContentDetailModal";
import api from "../../api/axios";

const TrendingSection = () => {
  const { t } = useTranslation();
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentScroll, setCurrentScroll] = useState(0);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/trending/movies?limit=12`);
      
      if (response.data.success) {
        setTrendingData(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching trending data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const scrollLeft = () => {
    const container = document.getElementById('trending-content');
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScroll = Math.max(0, currentScroll - scrollAmount);
      container.scrollTo({ left: newScroll, behavior: 'smooth' });
      setCurrentScroll(newScroll);
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('trending-content');
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const newScroll = Math.min(maxScroll, currentScroll + scrollAmount);
      container.scrollTo({ left: newScroll, behavior: 'smooth' });
      setCurrentScroll(newScroll);
    }
  };

  const handleContentClick = (content) => {
    setSelectedContent(content);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContent(null);
  };

  return (
    <>
      <section className="relative overflow-hidden">
        {/* Fantasy Top Border - Curved Design */}
        <div className="absolute top-0 left-0 right-0 h-12 transform -translate-y-6">
          {/* Main Curved Line */}
          <div className="absolute top-0 left-1/4 right-1/4 h-8 bg-gradient-to-r from-transparent via-[#BC8BBC] to-transparent rounded-full blur-sm"></div>
          
          {/* Floating Orbs */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute top-2 w-3 h-3 bg-purple-400 rounded-full animate-bounce"
              style={{
                left: `${15 + (i * 20)}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '2s'
              }}
            />
          ))}
          
          {/* Swirl Patterns */}
          <div className="absolute top-1 left-10 w-8 h-8 border-2 border-[#BC8BBC] border-t-transparent border-r-transparent rounded-full opacity-40 animate-spin-slow"></div>
          <div className="absolute top-1 right-10 w-6 h-6 border-2 border-purple-400 border-b-transparent border-l-transparent rounded-full opacity-40 animate-spin-slow-reverse"></div>
        </div>

        {/* Main Section Content */}
        <div className="py-12 bg-gradient-to-b from-gray-900 to-black relative">
          {/* Fantasy Background Elements */}
          <div className="absolute inset-0 bg-grid-large opacity-10"></div>
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#BC8BBC]/5 rounded-full blur-3xl"></div>

          {/* Side Border Curves */}
          <div className="absolute left-0 top-1/4 bottom-1/4 w-6">
            <div className="absolute left-0 top-0 w-6 h-20 bg-gradient-to-b from-[#BC8BBC] to-transparent rounded-r-full opacity-30"></div>
            <div className="absolute left-0 bottom-0 w-6 h-20 bg-gradient-to-t from-[#BC8BBC] to-transparent rounded-r-full opacity-30"></div>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-[#BC8BBC] rounded-full opacity-20"></div>
          </div>

          <div className="absolute right-0 top-1/4 bottom-1/4 w-6">
            <div className="absolute right-0 top-0 w-6 h-20 bg-gradient-to-b from-purple-600 to-transparent rounded-l-full opacity-30"></div>
            <div className="absolute right-0 bottom-0 w-6 h-20 bg-gradient-to-t from-purple-600 to-transparent rounded-l-full opacity-30"></div>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-1 h-32 bg-purple-600 rounded-full opacity-20"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header - Single */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-lg rounded-xl px-6 py-3 border border-[#BC8BBC]/30 shadow-2xl mb-4 relative overflow-hidden">
                {/* Header Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 rounded-xl"></div>
                
                <div className="p-2 bg-gradient-to-r from-purple-600 to-[#BC8BBC] rounded-lg shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <Sparkles className="w-5 h-5 text-[#BC8BBC] animate-pulse" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {t('landingPage.trending.title', 'Trending Now')}
                </h2>
                <Sparkles className="w-5 h-5 text-[#BC8BBC] animate-pulse" />
              </div>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-light">
                {t('landingPage.trending.subtitle', 'Discover what everyone is watching right now')}
              </p>
            </div>

            {/* Content Section with Curved Container */}
            <div className="relative">
              {/* Curved Content Container */}
              <div className="relative bg-gradient-to-r from-gray-800/20 to-gray-900/20 rounded-2xl border border-gray-700/30 backdrop-blur-sm p-4 shadow-2xl">
                {/* Container Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#BC8BBC]/5 to-purple-600/5 blur-xl -z-10"></div>
                
                {/* Navigation Arrows - Only show when we have content */}
                {!loading && trendingData.length > 0 && (
                  <>
                    <button
                      onClick={scrollLeft}
                      disabled={currentScroll === 0}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 rounded-full shadow-2xl border border-gray-700 hover:border-[#BC8BBC] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={scrollRight}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-2 rounded-full shadow-2xl border border-gray-700 hover:border-[#BC8BBC] transition-all duration-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Content Grid */}
                <div
                  id="trending-content"
                  className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-1"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {loading ? (
                    // Skeleton Loading - Show 8 skeleton cards
                    [...Array(8)].map((_, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-40 sm:w-48 md:w-56"
                      >
                        {/* Rank Badge Skeleton */}
                        <div className="absolute -top-2 -left-2 z-20 w-10 h-10 rounded-xl bg-gray-700 animate-pulse flex items-center justify-center shadow-2xl border-2 border-gray-600">
                          <div className="w-6 h-3 bg-gray-600 rounded"></div>
                        </div>

                        {/* Content Card Skeleton */}
                        <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-gray-700/50 animate-pulse">
                          {/* Image Container Skeleton */}
                          <div className="relative aspect-[2/3] overflow-hidden bg-gray-700">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800"></div>
                          </div>
                          
                          {/* Title Skeleton */}
                          <div className="p-3">
                            <div className="h-4 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : trendingData.length > 0 ? (
                    // Real Content
                    trendingData.map((content, index) => (
                      <PublicContentCard
                        key={content.id}
                        content={content}
                        rank={index + 1}
                        onContentClick={handleContentClick}
                      />
                    ))
                  ) : (
                    // Empty State - Show skeleton instead of error
                    [...Array(8)].map((_, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-40 sm:w-48 md:w-56"
                      >
                        {/* Rank Badge Skeleton */}
                        <div className="absolute -top-2 -left-2 z-20 w-10 h-10 rounded-xl bg-gray-700 animate-pulse flex items-center justify-center shadow-2xl border-2 border-gray-600">
                          <div className="w-6 h-3 bg-gray-600 rounded"></div>
                        </div>

                        {/* Content Card Skeleton */}
                        <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-2xl border border-gray-700/50 animate-pulse">
                          {/* Image Container Skeleton */}
                          <div className="relative aspect-[2/3] overflow-hidden bg-gray-700">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800"></div>
                          </div>
                          
                          {/* Title Skeleton */}
                          <div className="p-3">
                            <div className="h-4 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Progress Indicator - Only show when we have real content */}
            {!loading && trendingData.length > 0 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-2">
                  {[0, 1, 2].map((dot) => (
                    <div
                      key={dot}
                      className={`w-2 h-1 rounded-full transition-all duration-300 ${
                        Math.floor(currentScroll / 300) % 3 === dot
                          ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-6 shadow-lg shadow-[#BC8BBC]/30'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fantasy Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-12 transform translate-y-6">
          {/* Wavy Line */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-transparent via-[#BC8BBC] to-transparent opacity-40 rounded-t-full"></div>
          
          {/* Floating Particles */}
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-3 w-2 h-2 bg-purple-300 rounded-full animate-float-slow"
              style={{
                left: `${10 + (i * 15)}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '4s'
              }}
            />
          ))}
        </div>
      </section>

      {/* Content Detail Modal */}
      <ContentDetailModal
        content={selectedContent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default TrendingSection;