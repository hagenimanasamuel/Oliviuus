import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import Header from "../Header.jsx";
import Footer from "../../../components/Footer";
import { Mail, Send, CheckCircle, AlertCircle, Star, ThumbsUp, ThumbsDown, MessageSquare, User, Type, MapPin, AlertTriangle } from "lucide-react";
import api from "../../../api/axios";

const FeedbackPage = () => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    category: "",
    feedback_type: "DETAILED",
    rating: 0,
    message: "",
    allow_contact: false,
    platform: "WEB"
  });
  
  const [formStatus, setFormStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
    success: false
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [contactInfo, setContactInfo] = useState({
    email: "oliviuusteam@gmail.com",
    phone: "+250 788 880 266"
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(true);

  // SEO meta data
  const seoTitle = t("feedbackPage.seo.title");
  const seoDescription = t("feedbackPage.seo.description");
  const seoKeywords = t("feedbackPage.seo.keywords");
  const currentLanguage = document.documentElement.lang || 'en';

  // Helper functions
  const getTranslatedArray = (key) => {
    const result = t(key, { returnObjects: true });
    return Array.isArray(result) ? result : [];
  };

  const getTranslatedObject = (key) => {
    const result = t(key, { returnObjects: true });
    return typeof result === 'object' && result !== null ? result : {};
  };

  // Get categories from translations
  const getCategories = () => {
    const categories = getTranslatedArray("feedbackPage.categories");
    return categories.length > 0 ? categories : [
      { value: "FEATURE_REQUEST", label: "Feature Request" },
      { value: "BUG_REPORT", label: "Bug Report" },
      { value: "STREAMING_ISSUE", label: "Streaming Issues" },
      { value: "CONTENT_SUGGESTION", label: "Content Suggestions" },
      { value: "ACCOUNT_ISSUE", label: "Account Problems" },
      { value: "PAYMENT_ISSUE", label: "Payment Issues" },
      { value: "WEBSITE_APP_FEEDBACK", label: "Website/App Feedback" },
      { value: "CUSTOMER_SERVICE", label: "Customer Service" },
      { value: "GENERAL_FEEDBACK", label: "General Feedback" }
    ];
  };

  const categories = getCategories();

  // Fetch contact info from server
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await api.get('/contact/info');
        if (response.data.success) {
          setContactInfo(prev => ({
            ...prev,
            ...response.data.data
          }));
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setLoadingContactInfo(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleFeedbackTypeClick = (type) => {
    // Clear all field errors when changing feedback type
    setFieldErrors({});
    
    // For LIKE/DISLIKE, auto-set category to LIKE_DISLIKE
    const newCategory = (type === 'LIKE' || type === 'DISLIKE') ? 'LIKE_DISLIKE' : '';
    
    setFormData(prev => ({
      ...prev,
      feedback_type: type,
      category: newCategory,
      message: type !== 'DETAILED' ? "" : prev.message,
      rating: type !== 'DETAILED' ? 0 : prev.rating
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Clear previous errors
    setFieldErrors({});

    // Validate name
    if (!formData.user_name.trim()) {
      errors.user_name = t("feedbackPage.validation.nameRequired");
      isValid = false;
    } else if (formData.user_name.trim().length < 2) {
      errors.user_name = t("feedbackPage.validation.nameMinLength");
      isValid = false;
    }

    // Validate email
    if (!formData.user_email.trim()) {
      errors.user_email = t("feedbackPage.validation.emailRequired");
      isValid = false;
    } else if (!formData.user_email.includes('@') || !formData.user_email.includes('.')) {
      errors.user_email = t("feedbackPage.validation.emailInvalid");
      isValid = false;
    }

    // Validate category based on feedback type
    if (formData.feedback_type === 'DETAILED' && !formData.category) {
      errors.category = t("feedbackPage.validation.categoryRequired");
      isValid = false;
    }

    // For LIKE/DISLIKE, auto-set category to LIKE_DISLIKE
    if ((formData.feedback_type === 'LIKE' || formData.feedback_type === 'DISLIKE') && !formData.category) {
      // Auto-set the category but don't show error
      setFormData(prev => ({
        ...prev,
        category: 'LIKE_DISLIKE'
      }));
    }

    // Validate message for DETAILED feedback
    if (formData.feedback_type === 'DETAILED') {
      if (!formData.message.trim()) {
        errors.message = t("feedbackPage.validation.messageRequired");
        isValid = false;
      } else if (formData.message.trim().length < 10) {
        errors.message = t("feedbackPage.validation.messageMinLength");
        isValid = false;
      } else if (formData.message.trim().length > 2000) {
        errors.message = t("feedbackPage.validation.messageMaxLength");
        isValid = false;
      }
    }

    // For LIKE/DISLIKE, message should be empty
    if ((formData.feedback_type === 'LIKE' || formData.feedback_type === 'DISLIKE') && formData.message.trim()) {
      errors.message = t("feedbackPage.validation.simpleFeedbackNoMessage");
      isValid = false;
    }

    // Set field errors
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous status
    setFormStatus({
      submitting: false,
      submitted: false,
      error: null,
      success: false
    });

    // Validate form
    if (!validateForm()) {
      setFormStatus({
        submitting: false,
        submitted: true,
        error: t("feedbackPage.validation.fixErrors"),
        success: false
      });
      return;
    }

    setFormStatus({
      submitting: true,
      submitted: false,
      error: null,
      success: false
    });

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Ensure category is set for LIKE/DISLIKE
        category: formData.category || (formData.feedback_type !== 'DETAILED' ? 'LIKE_DISLIKE' : ''),
        // Ensure message is null for LIKE/DISLIKE
        message: formData.feedback_type === 'DETAILED' ? formData.message.trim() : null,
        rating: formData.feedback_type === 'DETAILED' ? formData.rating : null
      };

      const response = await api.post('/feedback/submit', submissionData);
      
      if (response.data.success) {
        setFormStatus({
          submitting: false,
          submitted: true,
          error: null,
          success: true
        });
        
        // Reset form on success
        setFormData({
          user_name: "",
          user_email: "",
          category: "",
          feedback_type: "DETAILED",
          rating: 0,
          message: "",
          allow_contact: false,
          platform: "WEB"
        });

        // Clear field errors
        setFieldErrors({});

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setFormStatus(prev => ({ ...prev, submitted: false }));
        }, 5000);
      } else {
        setFormStatus({
          submitting: false,
          submitted: true,
          error: response.data.message || t("feedbackPage.submission.failed"),
          success: false
        });
      }

    } catch (error) {
      setFormStatus({
        submitting: false,
        submitted: true,
        error: error.response?.data?.message || t("feedbackPage.submission.error"),
        success: false
      });
    }
  };

  const getRatingText = (rating) => {
    const ratings = t("feedbackPage.ratings", { returnObjects: true });
    return ratings[rating] || t("feedbackPage.ratings.0");
  };

  const getFeedbackTypeText = (type) => {
    switch(type) {
      case "LIKE": return t("feedbackPage.feedbackTypes.LIKE");
      case "DISLIKE": return t("feedbackPage.feedbackTypes.DISLIKE");
      case "DETAILED": return t("feedbackPage.feedbackTypes.DETAILED");
      default: return type;
    }
  };

  const getFeedbackTypeDescription = (type) => {
    switch(type) {
      case "LIKE": return t("feedbackPage.feedbackTypeDescriptions.LIKE");
      case "DISLIKE": return t("feedbackPage.feedbackTypeDescriptions.DISLIKE");
      case "DETAILED": return t("feedbackPage.feedbackTypeDescriptions.DETAILED");
      default: return "";
    }
  };

  const getStepDescriptions = () => {
    return getTranslatedArray("feedbackPage.steps");
  };

  const steps = getStepDescriptions();

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:locale" content={currentLanguage} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* Schema.org markup for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": seoTitle,
            "description": seoDescription,
            "publisher": {
              "@type": "Organization",
              "name": "Oliviuus",
              "url": "https://oliviuus.com"
            },
            "inLanguage": currentLanguage,
            "potentialAction": {
              "@type": "ReadAction",
              "target": window.location.href
            }
          })}
        </script>
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="revisit-after" content="7 days" />
        <meta name="language" content={currentLanguage} />
        <meta name="author" content="Oliviuus Feedback Team" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Multilingual alternate links for SEO */}
        <link rel="alternate" hreflang="en" href={`${window.location.origin}/feedback`} />
        <link rel="alternate" hreflang="fr" href={`${window.location.origin}/fr/feedback`} />
        <link rel="alternate" hreflang="rw" href={`${window.location.origin}/rw/feedback`} />
        <link rel="alternate" hreflang="x-default" href={`${window.location.origin}/feedback`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" lang={currentLanguage}>
        <Header />
        
        <main className="pt-28 pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-2xl mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">
                {t("feedbackPage.title")}
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                {t("feedbackPage.subtitle")}
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto mt-8 rounded-full"></div>
            </div>

            {/* Feedback Type Selector */}
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4 text-center">{t("feedbackPage.chooseType")}</h2>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => handleFeedbackTypeClick('LIKE')}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    formData.feedback_type === 'LIKE'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gray-800/60 border border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 ${formData.feedback_type === 'LIKE' ? 'text-white' : 'text-gray-400'}`} />
                  <span>{t("feedbackPage.feedbackTypes.LIKE")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFeedbackTypeClick('DISLIKE')}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    formData.feedback_type === 'DISLIKE'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25'
                      : 'bg-gray-800/60 border border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <ThumbsDown className={`w-5 h-5 ${formData.feedback_type === 'DISLIKE' ? 'text-white' : 'text-gray-400'}`} />
                  <span>{t("feedbackPage.feedbackTypes.DISLIKE")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFeedbackTypeClick('DETAILED')}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    formData.feedback_type === 'DETAILED'
                      ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/60 border border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 ${formData.feedback_type === 'DETAILED' ? 'text-white' : 'text-gray-400'}`} />
                  <span>{t("feedbackPage.feedbackTypes.DETAILED")}</span>
                </button>
              </div>
              <p className="text-gray-500 text-sm text-center mt-4">
                {t("feedbackPage.selected")}: <span className="text-[#BC8BBC] font-medium">{getFeedbackTypeText(formData.feedback_type)}</span>
                {formData.feedback_type === 'LIKE' && ` - ${t("feedbackPage.feedbackTypeDescriptions.LIKE")}`}
                {formData.feedback_type === 'DISLIKE' && ` - ${t("feedbackPage.feedbackTypeDescriptions.DISLIKE")}`}
                {formData.feedback_type === 'DETAILED' && ` - ${t("feedbackPage.feedbackTypeDescriptions.DETAILED")}`}
              </p>
            </div>

            {/* Feedback Form */}
            <div className="bg-gray-900/40 rounded-2xl p-8 border border-gray-800 mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center">
                {formData.feedback_type === 'LIKE' && t("feedbackPage.formTitles.LIKE")}
                {formData.feedback_type === 'DISLIKE' && t("feedbackPage.formTitles.DISLIKE")}
                {formData.feedback_type === 'DETAILED' && t("feedbackPage.formTitles.DETAILED")}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 mb-3 font-medium">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t("feedbackPage.formFields.name.label")} *
                      </div>
                    </label>
                    <input
                      type="text"
                      name="user_name"
                      value={formData.user_name}
                      onChange={handleInputChange}
                      placeholder={t("feedbackPage.formFields.name.placeholder")}
                      className={`w-full px-5 py-3 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300 ${
                        fieldErrors.user_name 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-700 focus:border-[#BC8BBC]'
                      }`}
                      required
                      disabled={formStatus.submitting}
                    />
                    {fieldErrors.user_name && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{fieldErrors.user_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 mb-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t("feedbackPage.formFields.email.label")} *
                      </div>
                    </label>
                    <input
                      type="email"
                      name="user_email"
                      value={formData.user_email}
                      onChange={handleInputChange}
                      placeholder={t("feedbackPage.formFields.email.placeholder")}
                      className={`w-full px-5 py-3 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300 ${
                        fieldErrors.user_email 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-700 focus:border-[#BC8BBC]'
                      }`}
                      required
                      disabled={formStatus.submitting}
                    />
                    {fieldErrors.user_email && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{fieldErrors.user_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category field - Hidden for LIKE/DISLIKE, auto-set to LIKE_DISLIKE */}
                {formData.feedback_type === 'DETAILED' && (
                  <div>
                    <label className="block text-gray-300 mb-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        {t("feedbackPage.formFields.category.label")} *
                      </div>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-5 py-3 bg-gray-800/60 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300 ${
                        fieldErrors.category 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-700 focus:border-[#BC8BBC]'
                      }`}
                      required={formData.feedback_type === 'DETAILED'}
                      disabled={formStatus.submitting}
                    >
                      <option value="">{t("feedbackPage.formFields.category.placeholder")}</option>
                      {categories.map((cat, index) => (
                        <option key={index} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{fieldErrors.category}</span>
                      </div>
                    )}
                    {formData.feedback_type === 'DETAILED' && !fieldErrors.category && (
                      <p className="text-gray-500 text-sm mt-2">
                        {t("feedbackPage.formFields.category.hint")}
                      </p>
                    )}
                  </div>
                )}

                {formData.feedback_type === 'DETAILED' && (
                  <div>
                    <label className="block text-gray-300 mb-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        {t("feedbackPage.formFields.rating.label")}
                      </div>
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingClick(star)}
                            disabled={formStatus.submitting}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                              formData.rating >= star
                                ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white'
                                : 'bg-gray-800/60 border border-gray-700 text-gray-400 hover:border-[#BC8BBC]'
                            } ${formStatus.submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className="text-xl">{star}</span>
                            <Star className={`w-4 h-4 ml-1 ${formData.rating >= star ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                      <div className="text-gray-300 font-medium">
                        {formData.rating > 0 ? (
                          <span className="text-[#BC8BBC]">{getRatingText(formData.rating)}</span>
                        ) : (
                          <span className="text-gray-500">{t("feedbackPage.formFields.rating.hint")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {formData.feedback_type === 'DETAILED' && (
                  <div>
                    <label className="block text-gray-300 mb-3 font-medium">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {t("feedbackPage.formFields.message.label")} *
                      </div>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="6"
                      placeholder={t("feedbackPage.formFields.message.placeholder")}
                      className={`w-full px-5 py-3 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300 resize-none ${
                        fieldErrors.message 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-700 focus:border-[#BC8BBC]'
                      }`}
                      required={formData.feedback_type === 'DETAILED'}
                      disabled={formStatus.submitting}
                    />
                    {fieldErrors.message && (
                      <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{fieldErrors.message}</span>
                      </div>
                    )}
                    {formData.feedback_type === 'DETAILED' && !fieldErrors.message && (
                      <div className="flex justify-between mt-2">
                        <p className="text-gray-500 text-sm">
                          {t("feedbackPage.formFields.message.hint")}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {formData.message.length}/2000 {t("feedbackPage.formFields.message.characters")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Message info for LIKE/DISLIKE - simplified */}
                {(formData.feedback_type === 'LIKE' || formData.feedback_type === 'DISLIKE') && (
                  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-3 text-gray-300">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-[#BC8BBC]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t("feedbackPage.simpleFeedbackMessage", { 
                            type: t(`feedbackPage.feedbackTypes.${formData.feedback_type}`).toLowerCase() 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden allow_contact field */}
                <div className="hidden">
                  <input
                    type="checkbox"
                    name="allow_contact"
                    checked={formData.allow_contact}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>

                {/* Success and Error Messages */}
                {formStatus.submitted && formStatus.success && (
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-2xl p-6">
                    <div className="flex items-start">
                      <CheckCircle className="w-8 h-8 text-green-400 mr-4 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-green-300 mb-2">{t("feedbackPage.success.title")}</h3>
                        <p className="text-green-200">
                          {formData.feedback_type === 'LIKE' 
                            ? t("feedbackPage.success.like")
                            : formData.feedback_type === 'DISLIKE'
                            ? t("feedbackPage.success.dislike")
                            : t("feedbackPage.success.detailed")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {formStatus.submitted && formStatus.error && (
                  <div className="bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-700/50 rounded-2xl p-6">
                    <div className="flex items-start">
                      <AlertCircle className="w-8 h-8 text-red-400 mr-4 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold text-red-300 mb-2">{t("feedbackPage.error.title")}</h3>
                        <p className="text-red-200">{formStatus.error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={formStatus.submitting}
                    className="w-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                  >
                    {formStatus.submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t("feedbackPage.submitting")}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {formData.feedback_type === 'LIKE' && t("feedbackPage.submitButtons.like")}
                        {formData.feedback_type === 'DISLIKE' && t("feedbackPage.submitButtons.dislike")}
                        {formData.feedback_type === 'DETAILED' && t("feedbackPage.submitButtons.detailed")}
                      </>
                    )}
                  </button>
                  <p className="text-gray-500 text-sm text-center mt-4">
                    * {t("feedbackPage.requiredFields")}
                  </p>
                </div>
              </form>
            </div>

            {/* Alternative Contact Methods */}
            <div className="bg-gray-900/40 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-8 text-center">{t("feedbackPage.contactMethods.title")}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{t("feedbackPage.contactMethods.email.title")}</h3>
                  {loadingContactInfo ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <a 
                        href={`mailto:${contactInfo.email}?subject=${t("feedbackPage.contactMethods.email.subject")}`} 
                        className="text-[#BC8BBC] hover:text-purple-400 transition-colors font-medium block mb-2"
                      >
                        {contactInfo.email}
                      </a>
                      <p className="text-gray-400 text-sm">
                        {t("feedbackPage.contactMethods.email.description")}
                      </p>
                      <a 
                        href={`mailto:${contactInfo.email}?subject=${t("feedbackPage.contactMethods.email.subject")}`}
                        className="inline-block mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                      >
                        {t("feedbackPage.contactMethods.email.button")}
                      </a>
                    </>
                  )}
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{t("feedbackPage.contactMethods.phone.title")}</h3>
                  {loadingContactInfo ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <a 
                        href={`tel:${contactInfo.phone}`} 
                        className="text-[#BC8BBC] hover:text-purple-400 transition-colors font-medium block mb-2"
                      >
                        {contactInfo.phone}
                      </a>
                      <p className="text-gray-400 text-sm">
                        {t("feedbackPage.contactMethods.phone.description")}
                      </p>
                      <a 
                        href={`tel:${contactInfo.phone}`}
                        className="inline-block mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                      >
                        {t("feedbackPage.contactMethods.phone.button")}
                      </a>
                    </>
                  )}
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">{t("feedbackPage.contactMethods.location.title")}</h3>
                  <p className="text-gray-300 font-medium mb-2">
                    {t("feedbackPage.contactMethods.location.address")}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t("feedbackPage.contactMethods.location.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold mb-6">{t("feedbackPage.process.title")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                  <div key={index} className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                    <div className="text-3xl font-bold text-[#BC8BBC] mb-2">{index + 1}</div>
                    <h4 className="font-semibold mb-2">{step.title}</h4>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-400 mt-8 max-w-2xl mx-auto">
                {t("feedbackPage.process.description")}
              </p>
            </div>
          </div>
        </main>

        {/* Breadcrumb Navigation for SEO */}
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-400">
            <li>
              <a href="/" className="hover:text-[#BC8BBC] transition-colors">
                {t("common.home")}
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-[#BC8BBC]">
              {t("feedbackPage.title")}
            </li>
          </ol>
        </nav>

        <Footer />
      </div>
    </>
  );
};

export default FeedbackPage;