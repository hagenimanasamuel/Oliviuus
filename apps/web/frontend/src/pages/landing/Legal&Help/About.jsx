import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import Header from "../Header.jsx";
import Footer from "../../../components/Footer";
import { Play, Film, Globe, Users, Award, Heart, Star, ChevronRight, Sparkles, ArrowRight, ArrowLeft, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import "./about.css";

const About = () => {
  const { t } = useTranslation();
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const storyContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // SEO meta data
  const seoTitle = t("aboutPage.seo.title");
  const seoDescription = t("aboutPage.seo.description");
  const seoKeywords = t("aboutPage.seo.keywords");
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

  // Get founders from translations
  const getFounders = () => {
    return getTranslatedArray("aboutPage.founders");
  };

  const founders = getFounders();

  // Get story chapters from translations
  const getStoryChapters = () => {
    const chapters = getTranslatedArray("aboutPage.storyChapters");
    return chapters.length > 0 ? chapters : [
      {
        id: 1,
        title: "A Dream Rooted in Rwanda",
        subtitle: "The Beginning of a Vision",
        emoji: "💭",
        content: "Oliviuus began as a dream shaped by passion, loss, resilience, and the belief that Rwandan stories deserve a global stage.",
        background: "from-[#BC8BBC]/10 to-purple-600/10",
        color: "text-[#BC8BBC]",
        highlight: "A dream rooted in Rwanda"
      },
      // ... default chapters
    ];
  };

  const storyChapters = getStoryChapters();

  // Get stats from translations
  const getStats = () => {
    const stats = getTranslatedArray("aboutPage.stats");
    return stats.length > 0 ? stats : [
      { number: "10K+", label: "Active Users", icon: "Users" },
      { number: "10+", label: "Movies & Series", icon: "Film" },
      { number: "10+", label: "Local Partners", icon: "Globe" },
      { number: "24/7", label: "Dedicated Support", icon: "Award" },
    ];
  };

  const stats = getStats();

  // Handle horizontal scroll
  const handleScroll = (e) => {
    if (!storyContainerRef.current || isScrolling) return;
    
    const container = storyContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const storyWidth = container.scrollWidth / storyChapters.length;
    
    const newIndex = Math.round(scrollLeft / storyWidth);
    
    if (newIndex !== currentStoryIndex) {
      setIsScrolling(true);
      setCurrentStoryIndex(newIndex);
      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  // Scroll to specific story chapter
  const scrollToChapter = (index) => {
    if (!storyContainerRef.current || isScrolling) return;
    
    setIsScrolling(true);
    const container = storyContainerRef.current;
    const storyWidth = container.scrollWidth / storyChapters.length;
    
    container.scrollTo({
      left: storyWidth * index,
      behavior: 'smooth'
    });
    
    setCurrentStoryIndex(index);
    setTimeout(() => setIsScrolling(false), 500);
  };

  // Initialize scroll position
  useEffect(() => {
    if (storyContainerRef.current) {
      storyContainerRef.current.addEventListener('scroll', handleScroll);
      return () => storyContainerRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [currentStoryIndex, isScrolling]);

  // Auto-advance story (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isScrolling) return;
      const nextIndex = (currentStoryIndex + 1) % storyChapters.length;
      scrollToChapter(nextIndex);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [currentStoryIndex, isScrolling]);

  // Get icon component
  const getIconComponent = (iconName) => {
    const iconMap = {
      Users: Users,
      Film: Film,
      Globe: Globe,
      Award: Award,
      Heart: Heart,
      Star: Star,
      Sparkles: Sparkles,
      ChevronRight: ChevronRight,
      Play: Play
    };
    return iconMap[iconName] || Play;
  };

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
            "@type": "AboutPage",
            "name": seoTitle,
            "description": seoDescription,
            "publisher": {
              "@type": "Organization",
              "name": "Oliviuus",
              "url": "https://oliviuus.com",
              "founder": founders.map(founder => ({
                "@type": "Person",
                "name": founder.name,
                "jobTitle": founder.role
              }))
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
        <meta name="author" content="Oliviuus Team" />
        <link rel="canonical" href={window.location.href} />
        
        {/* Multilingual alternate links for SEO */}
        <link rel="alternate" hreflang="en" href={`${window.location.origin}/about`} />
        <link rel="alternate" hreflang="x-default" href={`${window.location.origin}/about`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" lang={currentLanguage}>
        <Header />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#BC8BBC]/10 via-transparent to-purple-600/10"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-2xl mb-8 shadow-2xl shadow-purple-500/25 animate-pulse">
                <Play className="w-10 h-10 text-white" fill="currentColor" />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                {t("aboutPage.hero.title")} <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">{t("aboutPage.hero.highlight")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t("aboutPage.hero.subtitle")}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {stats.map((stat, index) => {
                const IconComponent = getIconComponent(stat.icon);
                return (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 text-center hover:border-[#BC8BBC]/50 transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-xl flex items-center justify-center">
                        <div className="text-white">
                          <IconComponent className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className="text-gray-400 font-medium">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Immersive Horizontal Story Section */}
        <section className="py-20 px-0 bg-gradient-to-b from-black/80 to-gray-900/50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-2xl mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {t("aboutPage.story.title")} <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">{t("aboutPage.story.highlight")}</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
                {t("aboutPage.story.scrollHint")}
              </p>
              
              {/* Story Navigation Dots */}
              <div className="flex justify-center gap-3 mb-8">
                {storyChapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => scrollToChapter(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentStoryIndex === index 
                        ? 'bg-[#BC8BBC] w-10 scale-125' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    aria-label={`${t("aboutPage.story.goToChapter")} ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Horizontal Scroll Container */}
          <div 
            ref={storyContainerRef}
            className="relative h-[600px] md:h-[700px] overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
            style={{ scrollBehavior: isScrolling ? 'smooth' : 'auto' }}
          >
            <div className="flex h-full">
              {storyChapters.map((chapter, index) => {
                const currentChapter = storyChapters[currentStoryIndex];
                return (
                  <div 
                    key={chapter.id}
                    className="relative flex-shrink-0 w-full h-full snap-center"
                    style={{ minWidth: '100vw' }}
                  >
                    {/* Parallax Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${chapter.background || 'from-[#BC8BBC]/10 to-purple-600/10'} transition-all duration-1000`} />
                    
                    {/* Content Container */}
                    <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
                      <div className="max-w-5xl mx-auto w-full">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                          {/* Left Side - Story Content */}
                          <div className={`space-y-8 transform transition-all duration-1000 ${
                            currentStoryIndex === index ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-70'
                          }`}>
                            <div className="inline-flex items-center space-x-4">
                              <div className="text-6xl animate-bounce-slow">{chapter.emoji}</div>
                              <div>
                                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                                  {t("aboutPage.story.chapter")} {chapter.id}
                                </span>
                                <h3 className="text-4xl md:text-5xl font-bold mt-2">
                                  {chapter.title}
                                </h3>
                                <p className={`text-lg font-medium mt-2 ${chapter.color || 'text-[#BC8BBC]'}`}>
                                  {chapter.subtitle}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-6">
                              <p className="text-xl md:text-2xl leading-relaxed text-gray-200">
                                {chapter.content}
                              </p>
                              
                              {/* Highlight Box */}
                              <div className="bg-gradient-to-r from-gray-900/50 to-black/50 rounded-2xl p-6 border-l-4 border-[#BC8BBC]">
                                <div className="flex items-start">
                                  <Quote className="w-8 h-8 text-[#BC8BBC] mr-4 flex-shrink-0" />
                                  <p className="text-lg md:text-xl italic text-gray-300">
                                    {chapter.highlight}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Navigation Arrows */}
                            <div className="flex items-center space-x-4 pt-8">
                              <button
                                onClick={() => scrollToChapter(Math.max(0, index - 1))}
                                disabled={index === 0}
                                className={`p-3 rounded-xl border ${
                                  index === 0 
                                    ? 'border-gray-800 text-gray-700 cursor-not-allowed' 
                                    : 'border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white'
                                } transition-all duration-300`}
                              >
                                <ArrowLeft className="w-6 h-6" />
                              </button>
                              
                              <span className="text-gray-400">
                                {index + 1} / {storyChapters.length}
                              </span>
                              
                              <button
                                onClick={() => scrollToChapter(Math.min(storyChapters.length - 1, index + 1))}
                                disabled={index === storyChapters.length - 1}
                                className={`p-3 rounded-xl border ${
                                  index === storyChapters.length - 1
                                    ? 'border-gray-800 text-gray-700 cursor-not-allowed' 
                                    : 'border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white'
                                } transition-all duration-300`}
                              >
                                <ArrowRight className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Right Side - Visual Element */}
                          <div className={`transform transition-all duration-1000 delay-300 ${
                            currentStoryIndex === index ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-70'
                          }`}>
                            <div className="relative">
                              {/* Animated Floating Elements */}
                              <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 rounded-full blur-3xl animate-pulse-slow" />
                              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-gradient-to-r from-purple-600/20 to-blue-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
                              
                              {/* Main Visual Card */}
                              <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50">
                                <div className="text-center">
                                  <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-2xl mb-8 animate-float">
                                    <span className="text-6xl">{chapter.emoji}</span>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
                                      {t("aboutPage.story.chapter")} {chapter.id}
                                    </div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                      {chapter.title}
                                    </div>
                                    <div className="h-1 w-24 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto rounded-full" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* Progress Indicator */}
                              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                                <div className="flex items-center space-x-1">
                                  {storyChapters.map((_, idx) => (
                                    <div 
                                      key={idx}
                                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        idx === index 
                                          ? 'w-8 bg-gradient-to-r from-[#BC8BBC] to-purple-600' 
                                          : 'bg-gray-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-gray-400 text-sm mb-2 animate-bounce">
              {t("aboutPage.story.scrollIndicator")}
            </div>
            <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 transition-all duration-300"
                style={{ width: `${((currentStoryIndex + 1) / storyChapters.length) * 100}%` }}
              />
            </div>
          </div>
        </section>

        {/* Founders Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t("aboutPage.foundersSection.title")} <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">{t("aboutPage.foundersSection.highlight")}</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                {t("aboutPage.foundersSection.subtitle")}
              </p>
            </div>
            
            {/* Founders */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {founders.map((founder, index) => (
                <div 
                  key={index}
                  className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border-2 border-gray-700 hover:border-[#BC8BBC] transition-all duration-500 transform hover:scale-[1.02] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#BC8BBC]/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-2xl flex items-center justify-center text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                      {founder.emoji}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{founder.name}</h3>
                    <div className="inline-block bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                      {founder.role}
                    </div>
                    <p className="text-gray-400 leading-relaxed">{founder.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final Quote Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black/50 to-gray-900/50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              {/* Animated background elements */}
              <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 rounded-full blur-3xl animate-pulse-slow" />
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-r from-purple-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
              
              {/* Main quote card */}
              <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm rounded-3xl p-12 border border-gray-700/50">
                <div className="text-7xl mb-8 animate-float">{t("aboutPage.quoteSection.emoji")}</div>
                <div className="space-y-8">
                  <h3 className="text-3xl md:text-4xl font-bold italic leading-relaxed">
                    {t("aboutPage.quoteSection.quote")}
                  </h3>
                  <div className="h-1 w-32 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto rounded-full" />
                  <p className="text-xl text-gray-400">
                    {t("aboutPage.quoteSection.promise")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20 rounded-3xl p-12 border border-[#BC8BBC]/30">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t("aboutPage.cta.title")}
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                {t("aboutPage.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/auth"
                  className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                >
                  {t("aboutPage.cta.buttons.startNow")}
                </Link>
                <Link
                  to="/"
                  className="border-2 border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  {t("aboutPage.cta.buttons.exploreCinema")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Breadcrumb Navigation for SEO */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8" aria-label="Breadcrumb">
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
              {t("aboutPage.breadcrumb")}
            </li>
          </ol>
        </nav>

        <Footer />
      </div>
    </>
  );
};

export default About;