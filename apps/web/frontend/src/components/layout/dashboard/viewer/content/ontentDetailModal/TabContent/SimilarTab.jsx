// src/pages/Dashboards/viewer/content/components/TabContent/SimilarTab.jsx
import React, { useState, useEffect } from 'react';
import { Star, Clock, Users, Film, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../../../../../api/axios'; 
import ContentCard from '../../ContentCard'; 

const SimilarTab = ({ similarContent, contentData }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [displayContent, setDisplayContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced fallback content fetching with your axios API
  const fetchFallbackContent = async () => {
    if (similarContent.length > 0) return similarContent;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Multiple fallback strategies using your axios API
      const strategies = [
        // Strategy 1: Same content type
        { url: '/viewer/content', params: { type: contentData?.content_type, limit: 6, sort: 'recent' } },
        // Strategy 2: Popular content
        { url: '/viewer/content', params: { limit: 6, sort: 'popular' } },
        // Strategy 3: Recent content
        { url: '/viewer/content', params: { limit: 6, sort: 'recent' } },
        // Strategy 4: Trending content
        { url: '/viewer/content', params: { limit: 6, sort: 'trending' } },
        // Strategy 5: Any published content
        { url: '/viewer/content', params: { limit: 6 } }
      ];

      for (let strategy of strategies) {
        try {
          const response = await api.get(strategy.url, { params: strategy.params });
          
          // Check if response is valid JSON and has the expected structure
          if (response.data && response.data.success && response.data.data && response.data.data.contents) {
            const filtered = response.data.data.contents
              .filter(item => item && item.id !== contentData?.id)
              .slice(0, 6);
            
            if (filtered.length > 0) {
              console.log(`✅ Found ${filtered.length} items from ${strategy.url}`);
              return filtered;
            }
          }
        } catch (error) {
          // Check if it's a JSON parse error (HTML response)
          if (error.message.includes('Unexpected token') || error.response?.status >= 400) {
            console.warn(`⚠️ API returned HTML/error for ${strategy.url}:`, error.response?.status);
            continue; // Skip to next strategy
          }
          console.warn(`⚠️ Strategy failed for ${strategy.url}:`, error.message);
          continue;
        }
      }
      
      console.warn('❌ All fallback strategies failed');
      return [];
    } catch (error) {
      console.error('❌ Error in fetchFallbackContent:', error);
      setError(t('contentdetail.errors.failedToLoad', 'Failed to load similar content'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      // If we already have similar content, use it
      if (similarContent.length > 0) {
        setDisplayContent(similarContent);
        return;
      }

      // Otherwise try to fetch fallback content
      const fallbackContent = await fetchFallbackContent();
      setDisplayContent(fallbackContent);
    };

    loadContent();
  }, [similarContent, contentData?.id]);

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return t('contentdetail.metadata.durationHours', '{{hours}}h {{mins}}m', { hours, mins });
    }
    return t('contentdetail.metadata.durationMinutes', '{{mins}}m', { mins });
  };

  const getContentBadge = (item) => {
    if (item.content_type === 'series') {
      return { label: t('contentdetail.metadata.series', 'Series'), color: 'bg-purple-500' };
    } else if (item.content_type === 'movie') {
      return { label: t('contentdetail.metadata.movie', 'Movie'), color: 'bg-blue-500' };
    } else if (item.content_type === 'documentary') {
      return { label: t('contentdetail.metadata.documentary', 'Documentary'), color: 'bg-green-500' };
    } else {
      return { label: t('contentdetail.metadata.content', 'Content'), color: 'bg-gray-500' };
    }
  };

  // Skeleton loader for loading state
  const SkeletonLoader = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="animate-pulse">
          <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-1"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  // Retry loading content
  const handleRetry = async () => {
    setError(null);
    const fallbackContent = await fetchFallbackContent();
    setDisplayContent(fallbackContent);
  };

  const handleMoreInfo = (content) => {
    navigate(`/title/${content.id}`);
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <RefreshCw className="w-5 h-5 text-[#BC8BBC] animate-spin" />
          <h3 className="text-xl font-bold text-white">
            {t('contentdetail.sections.findingSimilar', 'Finding Similar Content...')}
          </h3>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          {t('contentdetail.errors.unableToLoad', 'Unable to Load Content')}
        </h3>
        <p className="text-gray-400 mb-6">
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a87ba8] transition-colors mr-4"
        >
          {t('contentdetail.actions.tryAgain', 'Try Again')}
        </button>
        <button
          onClick={() => navigate('/browse')}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          {t('contentdetail.actions.browseAll', 'Browse All')}
        </button>
      </div>
    );
  }

  if (displayContent.length === 0) {
    return (
      <div className="text-center py-12">
        <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          {t('contentdetail.errors.noSimilarContent', 'No Similar Content Found')}
        </h3>
        <p className="text-gray-400 mb-6">
          {t('contentdetail.messages.addingMoreContent', 'We\'re working on adding more content that matches your interests.')}
        </p>
        <button
          onClick={() => navigate('/browse')}
          className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#a87ba8] transition-colors"
        >
          {t('contentdetail.actions.browseAllContent', 'Browse All Content')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">
            {t('contentdetail.sections.youMightAlsoLike', 'You Might Also Like')}
          </h3>
        </div>
      </div>

      {/* Using ContentCard component */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {displayContent.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex-shrink-0">
            <ContentCard 
              content={item}
              size="medium"
              onMoreInfo={() => handleMoreInfo(item)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarTab;