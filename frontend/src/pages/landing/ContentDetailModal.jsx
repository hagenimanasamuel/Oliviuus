import React, { useState, useEffect } from "react";
import { X, Calendar, Sparkles, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";

const ContentDetailModal = ({ content, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentSubscription } = useSubscription();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      setClosing(false);
      // Staggered animations
      setTimeout(() => setShowContent(true), 300);
    } else {
      setShowContent(false);
      setClosing(true);
      setTimeout(() => {
        setShowModal(false);
        setClosing(false);
      }, 500);
    }
  }, [isOpen]);

  const handleGetStarted = () => {
    const button = document.getElementById('get-started-btn');
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => {
        button.classList.remove('animate-pulse');
        
        // Simple redirect logic
        if (!user) {
          // Not logged in - go to auth
          navigate('/auth');
        } else if (user && !currentSubscription) {
          // Logged in but no subscription - go to subscription
          navigate('/subscription');
        } else if (user && currentSubscription) {
          // Logged in with subscription - go to dashboard
          navigate('/');
        }
      }, 300);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setClosing(true);
    setShowContent(false);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 500);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(true);
  };

  const getAgeRatingColor = (rating) => {
    const ratingMap = {
      'G': 'bg-green-500',
      'PG': 'bg-yellow-500',
      'PG-13': 'bg-orange-500',
      'R': 'bg-red-500',
      'NC-17': 'bg-red-600'
    };
    return ratingMap[rating] || 'bg-gray-500';
  };

  if (!showModal || !content) return null;

  // Get all genres and categories
  const allGenres = content.genres || [];
  const allCategories = content.categories || [];
  const allTags = [...allGenres, ...allCategories];

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
        isOpen && !closing
          ? 'bg-black/80 backdrop-blur-sm opacity-100' 
          : 'bg-black/0 backdrop-blur-0 opacity-0 pointer-events-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div 
        className={`relative bg-gray-900 rounded-xl w-full max-w-2xl max-h-[calc(100vh-10px)] overflow-y-auto overflow-x-hidden border border-gray-700 shadow-lg transform transition-all duration-300 ${
          isOpen && !closing
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-0 opacity-0 translate-y-0'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full transition-all duration-200 hover:scale-110 hover:rotate-90 group shadow-lg border border-gray-600"
          aria-label={t("landingPage.contentModal.close", "Close")}
        >
          <X className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
        </button>

        {/* Banner Image with Title Inside */}
        <div className="relative bg-gray-800 overflow-hidden">
          {/* Skeleton Loading */}
          {!imageLoaded && (
            <div className="relative aspect-[2/1] bg-gray-800 animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Banner Image with Title Inside */}
          <div className={`relative aspect-[2/1] transition-all duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          }`}>
            <img
              src={content.primary_image_url || '/api/placeholder/800/400'}
              alt={content.title}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Dark Gradient Overlay with Title Inside */}
            <div className={`absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/50 to-transparent transition-all duration-300 ${
              showContent ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* Title positioned at bottom inside the image */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className={`transform transition-all duration-300 delay-200 ${
                  showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                    {content.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Dark shadow for title contrast - matches footer */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Content Details Below Image */}
        <div className={`bg-gray-900 px-6 pb-6 transform transition-all duration-300 delay-200 ${
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 mb-4 pt-4">
            {/* Release Year */}
            {content.release_date && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {new Date(content.release_date).getFullYear()}
                </span>
              </div>
            )}

            {/* Age Rating */}
            {content.age_rating && (
              <div className={`px-3 py-1 rounded-full text-white text-sm font-bold ${
                getAgeRatingColor(content.age_rating)
              }`}>
                {content.age_rating}
              </div>
            )}

            {/* All Genres & Categories */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag, index) => (
                    <span
                      key={`${tag.id || tag.name}-${index}`}
                      className={`bg-gray-800 text-gray-200 px-3 py-1 rounded-full text-sm font-medium border border-gray-700 transform transition-all duration-300 ${
                        showContent 
                          ? 'scale-100 opacity-100 translate-y-0' 
                          : 'scale-50 opacity-0 translate-y-2'
                      }`}
                      style={{
                        transitionDelay: `${300 + (index * 50)}ms`
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {content.description && (
            <div className={`mb-6 transform transition-all duration-300 delay-300 ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <p className="text-gray-300 text-base leading-relaxed bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                {content.description}
              </p>
            </div>
          )}

          {/* Additional Content Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Duration if available */}
            {content.duration && (
              <div className={`transform transition-all duration-300 delay-400 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <h4 className="text-sm font-medium text-gray-400 mb-1">
                  {t("landingPage.contentModal.duration", "Duration")}
                </h4>
                <p className="text-white font-medium">{content.duration}</p>
              </div>
            )}

            {/* Language if available */}
            {content.language && (
              <div className={`transform transition-all duration-300 delay-450 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <h4 className="text-sm font-medium text-gray-400 mb-1">
                  {t("landingPage.contentModal.language", "Language")}
                </h4>
                <p className="text-white font-medium">{content.language}</p>
              </div>
            )}
          </div>

          {/* Get Started Button - Simple design */}
          <div className={`transform transition-all duration-300 delay-500 ${
            showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            <button
              id="get-started-btn"
              onClick={handleGetStarted}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-base transition-all duration-200 transform hover:scale-[1.02] shadow-lg border border-gray-700 flex items-center justify-center gap-2"
            >
              <span className="text-lg font-bold">›</span>
              {t("landingPage.contentModal.getStarted", "Get Started")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetailModal;