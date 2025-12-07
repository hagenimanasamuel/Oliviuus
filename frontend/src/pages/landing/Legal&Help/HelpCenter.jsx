import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import Header from "../Header.jsx";
import Footer from "../../../components/Footer";
import ContactSupport from "../../../components/subscription/HelpSupport";
import { Mail, Phone, Clock, MessageSquare, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import api from "../../../api/axios";

const HelpCenter = () => {
  const { t } = useTranslation();
  
  // State for FAQ sections
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestions, setOpenQuestions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  // Contact info state
  const [contactInfo, setContactInfo] = useState({
    email: "oliviuusteam@gmail.com",
    phone: "+250 788 880 266",
    supportHours: "8:00 AM – 8:00 PM (CAT)",
    days: "Monday - Sunday"
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

  // Refs for scrolling
  const sectionRefs = useRef({});
  const contactFormRef = useRef(null);
  const searchInputRef = useRef(null);

  // SEO meta data
  const seoTitle = t("helpCenter.seo.title");
  const seoDescription = t("helpCenter.seo.description");
  const seoKeywords = t("helpCenter.seo.keywords");
  const currentLanguage = document.documentElement.lang || 'en';

  // Sample search questions database (localized)
  const getSearchDatabase = () => [
    // Account & Login
    { question: t("helpCenter.search.popularTags.0"), category: "account", keyword: ["password", "reset", "forgot", "change password"] },
    { question: t("helpCenter.categories.account.questions.0.question"), category: "account", keyword: ["create", "sign up", "register", "new account"] },
    { question: t("helpCenter.categories.account.questions.1.question"), category: "account", keyword: ["password", "forgot", "reset", "security"] },
    { question: t("helpCenter.categories.account.questions.2.question"), category: "account", keyword: ["verify", "email", "confirmation", "activate"] },
    
    // Payment & Subscriptions
    { question: t("helpCenter.search.popularTags.1"), category: "payment", keyword: ["payment", "failed", "charge", "billing"] },
    { question: t("helpCenter.categories.payment.questions.0.question"), category: "payment", keyword: ["pay", "methods", "card", "mobile money"] },
    { question: t("helpCenter.categories.payment.questions.2.question"), category: "payment", keyword: ["update", "change", "payment method", "card"] },
    { question: t("helpCenter.categories.payment.questions.3.question"), category: "payment", keyword: ["cancel", "stop", "subscription", "end"] },
    
    // Watching & Streaming
    { question: t("helpCenter.search.popularTags.2"), category: "watching", keyword: ["stream", "buffer", "slow", "quality"] },
    { question: t("helpCenter.categories.watching.questions.1.question"), category: "watching", keyword: ["buffer", "loading", "slow", "lag"] },
    { question: t("helpCenter.categories.watching.questions.2.question"), category: "watching", keyword: ["download", "offline", "save", "watch later"] },
    { question: t("helpCenter.categories.watching.questions.3.question"), category: "watching", keyword: ["audio", "sound", "playback", "video"] },
    
    // Technical Support
    { question: t("helpCenter.search.popularTags.3"), category: "technical", keyword: ["app", "crash", "freeze", "not working"] },
    { question: t("helpCenter.categories.technical.questions.0.question"), category: "technical", keyword: ["crash", "freeze", "app", "not responding"] },
    { question: t("helpCenter.categories.technical.questions.1.question"), category: "technical", keyword: ["website", "load", "page", "error"] },
    { question: t("helpCenter.categories.technical.questions.2.question"), category: "technical", keyword: ["cache", "clear", "storage", "data"] },
    
    // Security
    { question: t("helpCenter.search.popularTags.4"), category: "security", keyword: ["security", "hack", "protection", "account"] },
    { question: t("helpCenter.categories.security.questions.0.question"), category: "security", keyword: ["security", "password", "protection", "safe"] },
    { question: t("helpCenter.categories.security.questions.1.question"), category: "security", keyword: ["data", "privacy", "secure", "protection"] },
    { question: t("helpCenter.categories.security.questions.2.question"), category: "security", keyword: ["report", "abuse", "suspicious", "concern"] },
  ];

  // Get localized FAQ data
  const getFAQData = () => ({
    account: {
      title: t("helpCenter.categories.account.title"),
      icon: "👤",
      questions: t("helpCenter.categories.account.questions", { returnObjects: true })
    },
    payment: {
      title: t("helpCenter.categories.payment.title"),
      icon: "💳",
      questions: t("helpCenter.categories.payment.questions", { returnObjects: true })
    },
    watching: {
      title: t("helpCenter.categories.watching.title"),
      icon: "🎬",
      questions: t("helpCenter.categories.watching.questions", { returnObjects: true })
    },
    technical: {
      title: t("helpCenter.categories.technical.title"),
      icon: "🔧",
      questions: t("helpCenter.categories.technical.questions", { returnObjects: true })
    },
    security: {
      title: t("helpCenter.categories.security.title"),
      icon: "🔒",
      questions: t("helpCenter.categories.security.questions", { returnObjects: true })
    }
  });

  const faqData = getFAQData();
  const searchDatabase = getSearchDatabase();

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

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      const query = searchQuery.toLowerCase();
      const suggestions = searchDatabase
        .filter(item => 
          item.question.toLowerCase().includes(query) ||
          item.keyword.some(keyword => keyword.toLowerCase().includes(query))
        )
        .slice(0, 5)
        .map(item => item.question);
      
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  // Handle direct message click with auto-scroll
  const handleDirectMessageClick = () => {
    const newState = !showContactForm;
    setShowContactForm(newState);
    
    if (newState && contactFormRef.current) {
      setTimeout(() => {
        contactFormRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  };

  // Toggle category
  const toggleCategory = (category) => {
    const isOpening = openCategory !== category;
    setOpenCategory(isOpening ? category : null);
    
    if (isOpening && sectionRefs.current[category]) {
      setTimeout(() => {
        sectionRefs.current[category].scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  };

  // Toggle individual question
  const toggleQuestion = (category, questionIndex) => {
    const key = `${category}-${questionIndex}`;
    setOpenQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Enhanced search function with fuzzy matching
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];
    
    // Search through database
    searchDatabase.forEach(item => {
      const questionMatch = item.question.toLowerCase().includes(query);
      const keywordMatch = item.keyword.some(keyword => keyword.toLowerCase().includes(query));
      const fuzzyMatch = query.split(' ').some(word => 
        item.question.toLowerCase().includes(word) || 
        item.keyword.some(keyword => keyword.toLowerCase().includes(word))
      );

      if (questionMatch || keywordMatch || fuzzyMatch) {
        // Find corresponding answer in FAQ data
        const faqAnswer = getFAQAnswer(item.category, item.question);
        results.push({
          question: item.question,
          category: getCategoryTitle(item.category),
          categoryKey: item.category,
          answer: faqAnswer || t("helpCenter.results.defaultAnswer"),
          relevance: calculateRelevance(item, query)
        });
      }
    });

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    setSearchResults(results.slice(0, 10));
    setOpenCategory(null);
  };

  // Helper function to get FAQ answer
  const getFAQAnswer = (categoryKey, questionText) => {
    const category = faqData[categoryKey];
    if (!category) return null;
    
    const foundQuestion = category.questions.find(q => 
      q.question.toLowerCase().includes(questionText.toLowerCase()) ||
      questionText.toLowerCase().includes(q.question.toLowerCase())
    );
    
    return foundQuestion ? foundQuestion.answer : null;
  };

  // Helper function to get category title
  const getCategoryTitle = (categoryKey) => {
    return faqData[categoryKey]?.title || categoryKey;
  };

  // Calculate search relevance score
  const calculateRelevance = (item, query) => {
    let score = 0;
    const queryWords = query.toLowerCase().split(' ');
    
    // Exact question match
    if (item.question.toLowerCase().includes(query)) score += 100;
    
    // Keyword matches
    item.keyword.forEach(keyword => {
      queryWords.forEach(word => {
        if (keyword.toLowerCase().includes(word)) score += 50;
        if (word.includes(keyword.toLowerCase())) score += 30;
      });
    });
    
    // Question word matches
    queryWords.forEach(word => {
      if (item.question.toLowerCase().includes(word)) score += 20;
    });
    
    return score;
  };

  // Get popular tags for search
  const popularTags = t("helpCenter.search.popularTags", { returnObjects: true });

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
        
        {/* Schema.org markup for Google (FAQPage) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "name": seoTitle,
            "description": seoDescription,
            "mainEntity": Object.entries(faqData).flatMap(([categoryKey, category]) =>
              category.questions.map((faq, index) => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            ),
            "inLanguage": currentLanguage,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${window.location.origin}/help-center?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="revisit-after" content="7 days" />
        <meta name="language" content={currentLanguage} />
        <meta name="author" content="Oliviuus Support Team" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Multilingual alternate links for SEO */}
        <link rel="alternate" hreflang="en" href={`${window.location.origin}/help-center`} />
        <link rel="alternate" hreflang="fr" href={`${window.location.origin}/fr/help-center`} />
        <link rel="alternate" hreflang="rw" href={`${window.location.origin}/rw/help-center`} />
        <link rel="alternate" hreflang="x-default" href={`${window.location.origin}/help-center`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" lang={currentLanguage}>
        <Header />
        
        {/* Main Content */}
        <main className="pt-28 pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">
                {t("helpCenter.title")}
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                {t("helpCenter.subtitle")}
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto mt-8 rounded-full"></div>
            </div>

            {/* Professional Search Section */}
            <div className="mb-20">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    {/* Professional Input Field with 50% border radius */}
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("helpCenter.search.placeholder")}
                      className="w-full px-8 py-5 text-lg bg-gray-900/80 border-2 border-gray-700 rounded-[50px] text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300 shadow-xl"
                    />
                    
                    {/* Search Suggestions */}
                    {searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSearchQuery(suggestion);
                              searchInputRef.current.focus();
                            }}
                            className="w-full text-left px-6 py-4 hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                          >
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-200">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Clear Button */}
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults(null);
                          setSearchSuggestions([]);
                        }}
                        className="absolute right-28 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-200"
                        title={t("helpCenter.search.clear")}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    
                    {/* Search Button */}
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] px-8 py-3 rounded-[30px] font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center gap-3"
                    >
                      <Search className="w-5 h-5" />
                      {t("helpCenter.search.button")}
                    </button>
                  </div>
                  
                  {/* Popular Search Tags */}
                  <div className="flex flex-wrap gap-3 mt-6 justify-center">
                    {popularTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(tag)}
                        className="px-4 py-2 text-sm bg-gray-800/60 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 border border-gray-700"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            </div>

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="mb-16 bg-gray-900/60 rounded-2xl p-8 border border-gray-800 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {t("helpCenter.results.title")}
                    </h3>
                    <p className="text-gray-400">
                      {t("helpCenter.results.found", { 
                        count: searchResults.length, 
                        query: searchQuery,
                        s: searchResults.length !== 1 ? 's' : ''
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSearchResults(null)}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  {searchResults.map((result, idx) => (
                    <div 
                      key={idx}
                      className="bg-gray-800/40 hover:bg-gray-800/60 rounded-xl p-6 transition-all duration-300 hover:scale-[1.01] border border-gray-700/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">
                            {result.categoryKey === 'account' ? '👤' :
                             result.categoryKey === 'payment' ? '💳' :
                             result.categoryKey === 'watching' ? '🎬' :
                             result.categoryKey === 'technical' ? '🔧' : '🔒'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="inline-block text-[#BC8BBC] font-semibold text-xs bg-[#BC8BBC]/10 px-3 py-1 rounded-full mb-3">
                            {result.category}
                          </span>
                          <h4 className="text-xl font-bold text-white mb-3">
                            {result.question}
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {result.answer}
                          </p>
                          <button
                            onClick={() => {
                              setOpenCategory(result.categoryKey);
                              setSearchResults(null);
                              setTimeout(() => {
                                // Find the exact question index
                                const categoryQuestions = faqData[result.categoryKey]?.questions || [];
                                const questionIndex = categoryQuestions.findIndex(q => 
                                  q.question.toLowerCase().includes(result.question.toLowerCase()) ||
                                  result.question.toLowerCase().includes(q.question.toLowerCase())
                                );
                                if (questionIndex !== -1) {
                                  const questionKey = `${result.categoryKey}-${questionIndex}`;
                                  setOpenQuestions(prev => ({...prev, [questionKey]: true}));
                                }
                              }, 300);
                            }}
                            className="mt-4 text-[#BC8BBC] hover:text-purple-400 font-medium flex items-center gap-2 text-sm"
                          >
                            {t("helpCenter.results.viewInCategory")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Search Results */}
            {searchResults && searchResults.length === 0 && (
              <div className="mb-16 text-center">
                <div className="bg-gray-900/60 rounded-2xl p-10 border border-gray-800 max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {t("helpCenter.search.noResults.title", { query: searchQuery })}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {t("helpCenter.search.noResults.description")}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <button
                      onClick={() => setSearchResults(null)}
                      className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 text-sm"
                    >
                      {t("helpCenter.search.noResults.clear")}
                    </button>
                    <button
                      onClick={() => handleDirectMessageClick()}
                      className="border border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 text-sm"
                    >
                      {t("helpCenter.search.noResults.contact")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Section */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold mb-10 text-center">{t("helpCenter.categories.title")}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(faqData).map(([key, category]) => (
                  <div 
                    key={key}
                    ref={el => sectionRefs.current[key] = el}
                    className={`bg-gray-900/40 rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                      openCategory === key 
                        ? 'border-[#BC8BBC] shadow-lg shadow-[#BC8BBC]/20' 
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                    onClick={() => toggleCategory(key)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 ${
                          openCategory === key ? 'scale-110' : ''
                        }`}>
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{category.title}</h3>
                          <p className="text-gray-400 text-sm">
                            {t("helpCenter.categories.questions", { 
                              count: category.questions.length 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`transition-transform duration-300 ${
                        openCategory === key ? 'rotate-180' : ''
                      }`}>
                        <ChevronDown className="w-5 h-5 text-[#BC8BBC]" />
                      </div>
                    </div>
                    
                    {openCategory === key && (
                      <div className="mt-6 pt-6 border-t border-gray-800 space-y-4 animate-fadeIn">
                        {category.questions.map((item, idx) => {
                          const questionKey = `${key}-${idx}`;
                          return (
                            <div key={idx} className="group">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleQuestion(key, idx);
                                }}
                                className="w-full text-left flex items-center justify-between p-4 bg-gray-800/40 hover:bg-gray-800 rounded-xl transition-all duration-200"
                              >
                                <span className="text-gray-300 text-sm font-medium group-hover:text-white pr-4">
                                  {item.question}
                                </span>
                                <div className="flex-shrink-0">
                                  {openQuestions[questionKey] ? (
                                    <ChevronUp className="w-4 h-4 text-[#BC8BBC]" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#BC8BBC]" />
                                  )}
                                </div>
                              </button>
                              
                              {openQuestions[questionKey] && (
                                <div className="mt-3 ml-3 pl-3 border-l-2 border-[#BC8BBC]/30 animate-slideDown">
                                  <p className="text-gray-300 text-sm leading-relaxed p-3 bg-gray-900/50 rounded-lg">
                                    {item.answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Support Card */}
                <div className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 rounded-2xl p-6 border-2 border-purple-700/30">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{t("helpCenter.categories.support.title")}</h3>
                      <p className="text-gray-400 text-sm">
                        {t("helpCenter.categories.support.subtitle")}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-6">
                    {t("helpCenter.categories.support.description")}
                  </p>
                  <div className="space-y-3">
                    <a 
                      href={`mailto:${contactInfo.email}`}
                      className="block bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                    >
                      <Mail className="w-4 h-4" />
                      {t("helpCenter.categories.support.email")}
                    </a>
                    <button
                      onClick={handleDirectMessageClick}
                      className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {t("helpCenter.categories.support.directMessage")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div ref={contactFormRef}>
              {showContactForm && (
                <div className="mb-16">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {t("helpCenter.contact.directMessage.title")}
                      </h3>
                      <p className="text-gray-400">
                        {t("helpCenter.contact.directMessage.subtitle")}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowContactForm(false)}
                      className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t("helpCenter.contact.directMessage.close")}
                    </button>
                  </div>
                  <div className="bg-gray-900/60 rounded-2xl p-8 border border-gray-800">
                    <ContactSupport 
                      compact={false}
                      showSupportMethods={false}
                      title=""
                      description={t("helpCenter.contact.directMessage.description")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-gray-900/40 rounded-2xl p-10 border border-gray-800">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-8">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">
                    {t("helpCenter.contact.title")}
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {/* Email Support */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white">{t("helpCenter.contact.email.title")}</h3>
                    {loadingContactInfo ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-28 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <a 
                          href={`mailto:${contactInfo.email}`} 
                          className="text-[#BC8BBC] hover:text-purple-400 transition-colors font-medium block mb-2"
                        >
                          {contactInfo.email}
                        </a>
                        <p className="text-gray-400 text-sm">{t("helpCenter.contact.email.response")}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Phone Support */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white">{t("helpCenter.contact.phone.title")}</h3>
                    {loadingContactInfo ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-28 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <a 
                          href={`tel:${contactInfo.phone}`} 
                          className="text-[#BC8BBC] hover:text-purple-400 transition-colors font-medium block mb-2"
                        >
                          {contactInfo.phone}
                        </a>
                        <p className="text-gray-400 text-sm">{t("helpCenter.contact.phone.description")}</p>
                      </>
                    )}
                  </div>
                  
                  {/* Support Hours */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-3 text-white">{t("helpCenter.contact.hours.title")}</h3>
                    {loadingContactInfo ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300 font-medium mb-2">
                          {contactInfo.supportHours}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {t("helpCenter.contact.hours.days")}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Contact Buttons */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-3"
                  >
                    <Mail className="w-4 h-4" />
                    {t("helpCenter.contact.buttons.sendEmail")}
                  </a>
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="border border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-3"
                  >
                    <Phone className="w-4 h-4" />
                    {t("helpCenter.contact.buttons.callNow")}
                  </a>
                  <button
                    onClick={handleDirectMessageClick}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-3"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t("helpCenter.contact.buttons.directMessage")}
                  </button>
                </div>
                
                <p className="text-gray-400 text-sm mt-8 pt-6 border-t border-gray-800 max-w-2xl mx-auto">
                  {t("helpCenter.contact.responseTime")}
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Breadcrumb Navigation for SEO */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8" aria-label="Breadcrumb">
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
              {t("helpCenter.title")}
            </li>
          </ol>
        </nav>

        <Footer />
      </div>
    </>
  );
};

export default HelpCenter;