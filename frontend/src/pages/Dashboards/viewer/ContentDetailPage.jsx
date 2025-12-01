// src/pages/ContentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ContentDetailModal from '../../../components/layout/dashboard/viewer/content/ContentDetailModal.jsx';
import api from '../../../api/axios';

const ContentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // SEO Meta Data
  const getSeoMetadata = () => {
    const siteName = t("contentdetail.seo.siteName", "Oliviuus");
    const defaultTitle = t("contentdetail.seo.defaultTitle", "Stream Movies & TV Shows");
    
    if (content) {
      return {
        title: `${content.title} | ${siteName}`,
        description: content.short_description || content.description || t("contentdetail.seo.defaultDescription", "Watch this content on Oliviuus"),
        image: content.primary_image_url || content.media_assets?.[0]?.url,
        canonical: window.location.href,
        language: i18n.language,
        contentType: content.content_type === 'movie' ? 'video.movie' : 'video.tv_show',
        duration: content.duration_minutes,
        releaseDate: content.release_date,
        rating: content.current_rating || content.average_rating
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

  // Structured Data for SEO
  const getStructuredData = () => {
    if (!content) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": seoMetadata.contentType || "VideoObject",
      "name": content.title,
      "description": content.short_description || content.description,
      "thumbnailUrl": seoMetadata.image,
      "uploadDate": content.release_date,
      "duration": content.duration_minutes ? `PT${content.duration_minutes}M` : undefined,
      "contentRating": content.age_rating,
      "genre": content.genres?.map(genre => genre.name)?.join(", "),
      "actor": content.cast?.map(actor => actor.full_name || actor.display_name)?.join(", "),
      "director": content.directors?.map(director => director.name)?.join(", "),
      "inLanguage": i18n.language,
      "potentialAction": {
        "@type": "WatchAction",
        "target": window.location.href
      }
    };

    return JSON.stringify(structuredData);
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/viewer/content/${id}`);
        setContent(response.data.data);
      } catch (err) {
        setError(t('contentdetail.errors.contentNotFound', 'Content not found'));
        console.error('Error fetching content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContent();
    }
  }, [id, t]);

  const handleClose = () => {
    navigate(-1);
  };

  const handlePlay = (content) => {
    navigate(`/watch/${content.id}`);
  };

  const handleAddToList = (content) => {
    console.log('Add to list:', content);
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>{t('contentdetail.seo.siteName', 'Oliviuus')} - {t('contentdetail.seo.defaultTitle', 'Stream Movies & TV Shows')}</title>
          <meta name="description" content={t('contentdetail.seo.defaultDescription', 'Watch this content on Oliviuus')} />
        </Helmet>
        <style>
          {`
            .skeleton {
              background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }

            @keyframes loading {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
          `}
        </style>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="w-full max-w-4xl p-6">
            {/* Poster skeleton */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="skeleton h-96 w-full rounded-lg"></div>
              </div>
              
              {/* Content skeleton */}
              <div className="w-full md:w-2/3">
                <div className="skeleton h-8 w-3/4 mb-4"></div>
                <div className="skeleton h-4 w-1/2 mb-6"></div>
                
                <div className="flex gap-4 mb-6">
                  <div className="skeleton h-10 w-32 rounded"></div>
                  <div className="skeleton h-10 w-32 rounded"></div>
                </div>
                
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-2/3 mb-6"></div>
                
                <div className="skeleton h-4 w-1/4 mb-2"></div>
                <div className="skeleton h-4 w-1/3 mb-2"></div>
                <div className="skeleton h-4 w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !content) {
    return (
      <>
        <Helmet>
          <title>{t('contentdetail.errors.error', 'Error')} - {t('contentdetail.seo.siteName', 'Oliviuus')}</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">{t('contentdetail.errors.contentNotFound', 'Content Not Found')}</h2>
            <button 
              onClick={() => navigate('/')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              {t('contentdetail.actions.goHome', 'Go Home')}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoMetadata.title}</title>
        <meta name="description" content={seoMetadata.description} />
        <meta name="keywords" content={content.genres?.map(genre => genre.name).join(', ') || t('contentdetail.seo.keywords', 'movies, tv shows, streaming')} />
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
        {content && (
          <script type="application/ld+json">
            {getStructuredData()}
          </script>
        )}
      </Helmet>

      <ContentDetailModal
        content={content}
        isOpen={true}
        onClose={handleClose}
        onPlay={handlePlay}
        onAddToList={handleAddToList}
      />
    </>
  );
};

export default ContentDetailPage;