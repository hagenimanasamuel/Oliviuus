// src/pages/Dashboards/viewer/ContentDetailPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import PageNavigation from "./ontentDetailModal/PageNavigation";
import HeroSection from "./ontentDetailModal/HeroSection";
import TabNavigation from "./ontentDetailModal/TabNavigation";
import TabContent from "./ontentDetailModal/TabContent";
import TrendingSection from "../../../../../pages/landing/TrendingSection";
import { useAuth } from "../../../../../context/AuthContext";
import api from "../../../../../api/axios";

const ContentDetailPage = ({
  content,
  onPlay,
  onAddToList
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [contentData, setContentData] = useState(content);
  const [similarContent, setSimilarContent] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [borderGlow, setBorderGlow] = useState(false);

  const scrollContainerRef = useRef(null);
  const previousPathRef = useRef('/');
  const cameFromExternalRef = useRef(false);

  // SEO Meta Data
  const getSeoMetadata = () => {
    const siteName = t("contentdetail.seo.siteName", "Oliviuus");
    const defaultTitle = t("contentdetail.seo.defaultTitle", "Stream Movies & TV Shows");
    
    if (contentData) {
      return {
        title: `${contentData.title} | ${siteName}`,
        description: contentData.short_description || contentData.description || t("contentdetail.seo.defaultDescription", "Watch this content on Oliviuus"),
        image: contentData.primary_image_url || contentData.media_assets?.[0]?.url,
        canonical: window.location.href,
        language: i18n.language,
        contentType: contentData.content_type === 'movie' ? 'video.movie' : 'video.tv_show',
        duration: contentData.duration_minutes,
        releaseDate: contentData.release_date,
        rating: contentData.current_rating || contentData.average_rating
      };
    }

    return {
      title: defaultTitle,
      description: t("contentdetail.seo.defaultDescription", "Watch this content on Oliviuus"),
      canonical: window.location.href,
      language: i18n.language
    };
  };

  const seoMetadata = getSeoMetadata();

  // FIXED: Fetch trending content with proper error handling
  const fetchTrendingContent = async () => {
    try {
      // Try to fetch trending content from API
      const response = await api.get('/viewer/content/trending', {
        params: { limit: 12 }
      });
      
      if (response.data.success) {
        setTrendingContent(response.data.data.contents || []);
      }
    } catch (error) {
      // Log the error but don't crash the app
      console.log('Trending content not available, using fallback');
      
      // Fallback to empty array or mock data
      setTrendingContent([]);
      
      // Optionally, you could set some mock trending data here
      // setTrendingContent(getMockTrendingContent());
    }
  };

  // Fetch detailed content data
const fetchContentDetails = async (contentId) => {
  if (!contentId) return;
  
  setIsLoading(true);
  try {
    const response = await api.get(`/viewer/content/${contentId}`);
    
    if (response.data.success) {
      const contentData = response.data.data;
      
      // Check if user is authenticated based on response
      const isAuthenticated = response.data.is_authenticated;
      
      // You can use this to conditionally show/hide certain UI elements
      console.log('User authenticated:', isAuthenticated);
      
      setContentData(contentData);
      fetchSimilarContent(contentData);
    } else {
      console.error('Failed to fetch content:', response.data.error);
    }
  } catch (error) {
    console.error('Error fetching content details:', error);
    
    // The error should be 404 now, not 401
    if (error.response?.status === 404) {
      // Handle content not found
    }
  } finally {
    setIsLoading(false);
  }
};

  // Fetch similar content with proper error handling
  const fetchSimilarContent = async (content) => {
    if (!content) return;

    try {
      const strategies = [];
      
      if (content.genres && content.genres.length > 0) {
        const genreIds = content.genres.map(g => g.id).join(',');
        strategies.push(`genres=${genreIds}`);
      }
      
      if (content.categories && content.categories.length > 0) {
        const categoryIds = content.categories.map(c => c.id).join(',');
        strategies.push(`categories=${categoryIds}`);
      }
      
      strategies.push(`type=${content.content_type}`);
      
      for (let strategy of strategies) {
        try {
          const response = await api.get(`/viewer/content`, {
            params: { 
              [strategy.split('=')[0]]: strategy.split('=')[1],
              limit: 8 
            }
          });
          
          if (response.data.success && response.data.data.contents && response.data.data.contents.length > 0) {
            const filtered = response.data.data.contents
              .filter(item => item && item.id !== content.id)
              .slice(0, 6);
            
            if (filtered.length > 0) {
              setSimilarContent(filtered);
              return;
            }
          }
        } catch (error) {
          continue;
        }
      }
      
      // Fallback - recent content
      try {
        const response = await api.get('/viewer/content', { params: { limit: 6 } });
        if (response.data.success && response.data.data.contents) {
          const filtered = response.data.data.contents
            .filter(item => item && item.id !== content.id)
            .slice(0, 6);
          setSimilarContent(filtered);
        }
      } catch (fallbackError) {
        setSimilarContent([]);
      }
    } catch (error) {
      setSimilarContent([]);
    }
  };

  // SMART: Enhanced navigation logic
  const handleSmartGoBack = () => {
    const navigationState = window.history.state;
    
    if (navigationState?.usr?.modal || navigationState?.usr?.previousPath) {
      navigate(-1);
    } else if (previousPathRef.current && previousPathRef.current !== location.pathname) {
      navigate(previousPathRef.current, { 
        replace: true,
        state: { restoreScroll: true }
      });
    } else if (window.history.length > 1 && !cameFromExternalRef.current) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  // Track navigation origin
  useEffect(() => {
    if (id) {
      const referrer = document.referrer;
      const isExternal = !referrer.includes(window.location.origin);
      cameFromExternalRef.current = isExternal;

      if (location.state?.previousPath) {
        previousPathRef.current = location.state.previousPath;
      } else if (window.history.length > 1 && !isExternal) {
        previousPathRef.current = document.referrer;
      } else {
        previousPathRef.current = '/';
      }
    }
  }, [id, location.state]);

  // Update previous path when location changes
  useEffect(() => {
    if (location.pathname !== `/title/${contentData?.id}`) {
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname, contentData?.id]);

  // Initialize content data and fetch trending
  useEffect(() => {
    if (id && (!content || Object.keys(content).length < 10)) {
      fetchContentDetails(id);
    } else if (content) {
      setContentData(content);
      fetchSimilarContent(content);
    }
    
    // Fetch trending content
    fetchTrendingContent();
  }, [id, content]);

  // Border glow effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setBorderGlow(true);
    }, 600);

    return () => {
      setBorderGlow(false);
      clearTimeout(timer);
    };
  }, []);

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <>
      <Helmet>
        <title>{t('contentdetail.seo.siteName', 'Oliviuus')} - {t('contentdetail.seo.defaultTitle', 'Stream Movies & TV Shows')}</title>
        <meta name="description" content={t('contentdetail.seo.defaultDescription', 'Watch this content on Oliviuus')} />
      </Helmet>
      <div className="min-h-screen bg-gray-900">
        {/* Background Glow Skeleton */}
        <div className="fixed inset-0 opacity-0" />
        
        <div className="relative z-10">
          {/* Navigation Skeleton */}
          <div className="fixed top-4 right-4 z-50">
            <div className="animate-pulse">
              <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
            </div>
          </div>
          
          {/* Hero Section Skeleton */}
          <div className="relative h-[70vh] bg-gray-800 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent z-10" />
            
            <div className="relative z-20 h-full flex items-end">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
                  <div className="h-12 bg-gray-700 rounded w-3/4 mb-6"></div>
                  <div className="flex space-x-4">
                    <div className="h-12 bg-gray-700 rounded w-32"></div>
                    <div className="h-12 bg-gray-700 rounded w-32"></div>
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-2/3 mt-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Tab Navigation Skeleton */}
            <div className="animate-pulse mb-8">
              <div className="flex space-x-8 border-b border-gray-700">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-8 bg-gray-700 rounded w-20"></div>
                ))}
              </div>
            </div>
            
            {/* Tab Content Skeleton */}
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-4 bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 bg-gray-700 rounded w-1/3"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-4 bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Similar Content Skeleton */}
              <div className="mt-12">
                <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="animate-pulse">
                      <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!contentData) {
    return (
      <>
        <Helmet>
          <title>{t('contentdetail.errors.error', 'Error')} - {t('contentdetail.seo.siteName', 'Oliviuus')}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">{t('contentdetail.errors.contentNotFound', 'Content not found')}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoMetadata.title}</title>
        <meta name="description" content={seoMetadata.description} />
        <meta name="keywords" content={contentData.genres?.map(genre => genre.name).join(', ') || t('contentdetail.seo.keywords', 'movies, tv shows, streaming')} />
        <link rel="canonical" href={seoMetadata.canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoMetadata.title} />
        <meta property="og:description" content={seoMetadata.description} />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content={seoMetadata.canonical} />
        {seoMetadata.image && <meta property="og:image" content={seoMetadata.image} />}
        <meta property="og:locale" content={seoMetadata.language} />
        <meta property="og:site_name" content={t('contentdetail.seo.siteName', 'Oliviuus')} />
        
        {/* Video-specific OG tags */}
        {seoMetadata.releaseDate && (
          <meta property="video:release_date" content={seoMetadata.releaseDate} />
        )}
        {seoMetadata.duration && (
          <meta property="video:duration" content={seoMetadata.duration * 60} />
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoMetadata.title} />
        <meta name="twitter:description" content={seoMetadata.description} />
        {seoMetadata.image && <meta name="twitter:image" content={seoMetadata.image} />}
        
        {/* Additional Meta */}
        <meta name="language" content={seoMetadata.language} />
        <meta name="robots" content="index, follow" />
        
        {/* Structured Data */}
        {contentData && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": seoMetadata.contentType || "VideoObject",
              "name": contentData.title,
              "description": contentData.short_description || contentData.description,
              "thumbnailUrl": seoMetadata.image,
              "uploadDate": contentData.release_date,
              "duration": contentData.duration_minutes ? `PT${contentData.duration_minutes}M` : undefined,
              "contentRating": contentData.age_rating,
              "genre": contentData.genres?.map(genre => genre.name)?.join(", "),
              "inLanguage": i18n.language
            })}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen bg-gray-900">
        <div 
          ref={scrollContainerRef}
          className="w-full h-full bg-gray-900 overflow-y-auto custom-scrollbar"
        >
          {/* Background Glow Effect */}
          <div className={`fixed inset-0 transition-all duration-1000 ${
            borderGlow ? 'opacity-100' : 'opacity-0'
          }`} style={{
            background: 'linear-gradient(45deg, rgba(188, 139, 188, 0.15), rgba(188, 139, 188, 0.1), rgba(188, 139, 188, 0.05))'
          }} />

          <div className="relative z-10">
            {/* Navigation positioned at the top */}
            <div className="fixed top-4 right-4 z-50">
              <PageNavigation 
                onGoBack={handleSmartGoBack}
                onGoHome={handleGoHome}
                contentData={contentData}
              />
            </div>
            
            <HeroSection 
              contentData={contentData}
              onPlay={onPlay}
              onAddToList={onAddToList}
              onGoBack={handleSmartGoBack}
            />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <TabNavigation 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                contentData={contentData}
                similarContent={similarContent}
              />
              
              <TabContent 
                activeTab={activeTab}
                contentData={contentData}
                similarContent={similarContent}
              />

              {/* Trending Section - Always shown at the bottom */}
              <div className="mt-16 pt-8 border-t border-gray-700/50">
                <TrendingSection 
                  content={trendingContent}
                  title={user ? t('contentdetail.trending.title', 'Trending Now') : t('contentdetail.trending.titleGuest', 'Popular on Oliviuus')}
                  subtitle={user ? t('contentdetail.trending.subtitle', 'What others are watching') : t('contentdetail.trending.subtitleGuest', 'Start your free trial to watch')}
                  maxItems={12}
                  showViewAll={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContentDetailPage;