import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";

export default function LandingPage() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleActionClick = (e) => {
    e.preventDefault();
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const features = [
    {
      icon: "🎬",
      title: "Premium Content Library",
      description: "Curated collection of movies, TV shows, and exclusive originals from around the world"
    },
    {
      icon: "🇷🇼",
      title: "Rwandan Cinema Hub",
      description: "Dedicated platform showcasing and enhancing local Rwandan movies and film distribution"
    },
    {
      icon: "📱",
      title: "Multi-Device Streaming",
      description: "Seamless experience across all your devices - phones, tablets, computers, and smart TVs"
    },
    {
      icon: "🎭",
      title: "Personalized Profiles",
      description: "AI-powered recommendations and custom profiles for each viewer's unique taste"
    },
    {
      icon: "💫",
      title: "Premium Quality",
      description: "Exceptional streaming with immersive audio and crystal-clear visual quality"
    },
    {
      icon: "🚀",
      title: "Watch Anywhere",
      description: "Download your favorites and enjoy entertainment without internet limitations"
    }
  ];

  const faqs = [
    {
      question: "What makes Oliviuus different from other streaming platforms?",
      answer: "Oliviuus combines global premium content with a strong focus on African cinema, particularly Rwandan films, creating a unique platform that celebrates local storytelling while offering international entertainment."
    },
    {
      question: "When exactly will Oliviuus launch?",
      answer: "We're targeting 2026 for our official launch. Join our waitlist to get exclusive early access and updates about our release timeline."
    },
    {
      question: "How will Oliviuus support Rwandan filmmakers?",
      answer: "We're building partnerships with local production houses, offering better distribution channels, and creating funding opportunities for Rwandan filmmakers to showcase their work globally."
    },
    {
      question: "What type of content will be available?",
      answer: "From international blockbusters to Rwandan cinematic gems, documentaries, series, and exclusive Oliviuus Originals - we're curating a diverse library for all tastes."
    },
    {
      question: "Will there be regional pricing?",
      answer: "Yes, we're committed to making premium entertainment accessible with competitive pricing plans tailored for different markets."
    },
    {
      question: "Can I request specific movies or shows?",
      answer: "Absolutely! Our content team actively considers viewer requests to ensure we're bringing the content our community wants to see."
    },
    {
      question: "How many devices can stream simultaneously?",
      answer: "We're designing flexible plans that allow multiple simultaneous streams so your whole family can enjoy their favorite content."
    },
    {
      question: "Will there be a free trial?",
      answer: "Yes, we plan to offer a generous free trial period at launch so you can experience everything Oliviuus has to offer."
    }
  ];

  const highlights = [
    { icon: "⭐", label: "Curated Content Collection" },
    { icon: "🎭", label: "Rwandan Films Showcase" },
    { icon: "🌍", label: "Multi-Region Launch" },
    { icon: "⚡", label: "Premium Streaming Quality" }
  ];

  // Internal Footer Component
  const Footer = () => (
    <footer className="w-full bg-[#1a1a1a] text-white border-t border-gray-800 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center justify-center gap-6 text-sm">
        
        {/* Top section with logo */}
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-4 w-full">
          <div className="flex items-center space-x-2">
            <Logo />
            <span className="text-xl font-bold text-[#BC8BBC]">OLIVIUUS</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <button onClick={handleActionClick} className="text-gray-400 hover:text-[#BC8BBC] transition-colors">
              Twitter
            </button>
            <button onClick={handleActionClick} className="text-gray-400 hover:text-[#BC8BBC] transition-colors">
              Instagram
            </button>
            <button onClick={handleActionClick} className="text-gray-400 hover:text-[#BC8BBC] transition-colors">
              LinkedIn
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-4">
          <button
            onClick={handleActionClick}
            className="text-gray-300 hover:text-[#BC8BBC] transition-all duration-300 hover:underline"
          >
            Terms of Service
          </button>
          <button
            onClick={handleActionClick}
            className="text-gray-300 hover:text-[#BC8BBC] transition-all duration-300 hover:underline"
          >
            Privacy Policy
          </button>
          <button
            onClick={handleActionClick}
            className="text-gray-300 hover:text-[#BC8BBC] transition-all duration-300 hover:underline"
          >
            Help Center
          </button>
          <button
            onClick={handleActionClick}
            className="text-gray-300 hover:text-[#BC8BBC] transition-all duration-300 hover:underline"
          >
            Feedback
          </button>
          <button
            onClick={handleActionClick}
            className="text-gray-300 hover:text-[#BC8BBC] transition-all duration-300 hover:underline"
          >
            Contact Us
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center w-full mt-6 text-gray-400 border-t border-gray-800 pt-6">
          <p>&copy; {new Date().getFullYear()} Oliviuus Inc. All rights reserved.</p>
          <p className="mt-2 text-xs">Launching 2026 - The Future of African Streaming</p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <div className="avatar-container mx-auto mb-6">
              <div className="avatar animate-bounce-soft">
                🎬
              </div>
            </div>
            <h3 className="text-gradient-primary text-2xl md:text-3xl font-bold mb-4 animate-scale-in">
              Coming Soon!
            </h3>
            <p className="text-white mb-6 text-base md:text-lg leading-relaxed animate-fade-in animation-delay-200">
              Oliviuus is launching in 2026 with a revolutionary streaming experience. 
              Stay tuned for the future of entertainment!
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="btn-premium w-full max-w-xs mx-auto animate-scale-in animation-delay-400 text-base md:text-lg"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'header-scroll py-3 md:py-4' : 'bg-transparent py-6 md:py-8'}`}>
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2 md:space-x-3 animate-slide-down">
            <Logo />
            <span className="text-xl md:text-2xl font-black text-white">
              OLIVIUUS
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <a href="#features" className="text-white hover:text-[#BC8BBC] transition-all duration-300 font-medium hover:scale-110 text-sm lg:text-base">Features</a>
            <a href="#content" className="text-white hover:text-[#BC8BBC] transition-all duration-300 font-medium hover:scale-110 text-sm lg:text-base">Content</a>
            <a href="#faq" className="text-white hover:text-[#BC8BBC] transition-all duration-300 font-medium hover:scale-110 text-sm lg:text-base">FAQ</a>
            <button
              onClick={handleActionClick}
              className="btn-premium text-sm lg:text-base"
            >
              Get Early Access
            </button>
          </nav>

          <button className="md:hidden text-white hover:text-[#BC8BBC] transition-colors animate-slide-down">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 md:pt-32 pb-16 md:pb-20">
        <div className="absolute inset-0 bg-grid animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-gradient-radial"></div>
        
        {/* Floating Particles */}
        {!isMobile && (
          <>
            <div className="particle floating-element" style={{top: '20%', left: '10%', width: '4px', height: '4px'}}></div>
            <div className="particle floating-element" style={{top: '60%', left: '80%', width: '6px', height: '6px'}}></div>
            <div className="particle floating-element" style={{top: '40%', left: '90%', width: '3px', height: '3px'}}></div>
          </>
        )}
        
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 md:mb-8 animate-fade-in">
              <span className="bg-[#BC8BBC] bg-opacity-20 text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-xs md:text-sm font-semibold border border-[#BC8BBC]/30 backdrop-blur-sm animate-pulse-slow inline-block">
                🚀 Launching 2026 - Revolutionizing African Streaming
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-6 md:mb-8 animate-scale-in">
              <span className="text-white">
                OLIVIUUS
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-200 px-4">
              Where <span className="text-[#BC8BBC] font-bold">Rwandan Cinema</span> Meets Global Entertainment
            </p>

            <p className="text-base md:text-xl text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto animate-fade-in animation-delay-400 px-4">
              Experience streaming reimagined for the African continent and beyond. 
              Join the revolution in digital entertainment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center animate-slide-up animation-delay-600 px-4">
              <button
                onClick={handleActionClick}
                className="btn-premium group w-full sm:w-auto text-base md:text-lg"
              >
                <span>Join The Revolution</span>
              </button>
              
              <button
                onClick={handleActionClick}
                className="btn-secondary group w-full sm:w-auto text-base md:text-lg"
              >
                <span className="flex items-center gap-2 md:gap-3 justify-center">
                  Explore Content 
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </button>
            </div>

            {/* Highlights Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 mt-12 md:mt-20 max-w-4xl mx-auto animate-fade-in animation-delay-800 px-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="feature-card p-4 md:p-6 text-center">
                  <div className="text-2xl md:text-3xl mb-2 md:mb-4 animate-bounce-soft text-white">{highlight.icon}</div>
                  <div className="text-white text-xs md:text-sm font-medium leading-tight">{highlight.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-32 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-20 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white">
              Why Oliviuus Stands Out
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              We're building more than a streaming platform - we're creating a cultural hub for African storytelling and global entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="feature-card p-6 md:p-8 scroll-reveal"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="text-4xl md:text-5xl mb-4 md:mb-6 transform group-hover:scale-110 transition-transform duration-300 floating-element text-white">
                  {feature.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-white group-hover:text-[#BC8BBC] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rwandan Cinema Focus Section */}
      <section id="content" className="py-16 md:py-32 bg-gradient-to-r from-gray-900 to-black relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div className="scroll-reveal">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 text-white">
                Elevating <span className="text-[#BC8BBC]">Rwandan Cinema</span> Worldwide
              </h2>
              <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed">
                We're passionate about bringing the rich stories and talented filmmakers of Rwanda to a global audience. 
                Oliviuus will be the premier platform for Rwandan movies, documentaries, and series.
              </p>
              <div className="space-y-3 md:space-y-4">
                {[
                  "Exclusive distribution partnerships with local studios",
                  "Funding and production support for new projects",
                  "Global marketing and promotion of Rwandan content",
                  "Cultural exchange programs with international filmmakers"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 md:gap-4 text-white animate-fade-in" style={{animationDelay: `${index * 200}ms`}}>
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-[#BC8BBC] rounded-full flex items-center justify-center animate-scale-in flex-shrink-0" style={{animationDelay: `${index * 200}ms`}}>
                      <span className="text-white text-xs md:text-sm">✓</span>
                    </div>
                    <span className="text-sm md:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative scroll-reveal">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-gradient-to-br from-[#BC8BBC]/20 to-purple-600/20 rounded-xl md:rounded-2xl aspect-video flex items-center justify-center border border-[#BC8BBC]/30 backdrop-blur-sm feature-card">
                    <span className="text-2xl md:text-4xl floating-element text-white" style={{animationDelay: `${item * 0.5}s`}}>🎭</span>
                  </div>
                ))}
              </div>
              <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 rounded-2xl md:rounded-3xl blur-xl -z-10 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-32 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-20 scroll-reveal">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-base md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Everything you need to know about the Oliviuus revolution.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="faq-item scroll-reveal"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="faq-question w-full text-left flex justify-between items-center hover:text-[#BC8BBC] transition-colors px-4 md:px-8 py-4 md:py-6"
                >
                  <span className="text-base md:text-xl font-semibold text-white pr-4 text-left">
                    {faq.question}
                  </span>
                  <span className={`text-[#BC8BBC] text-xl md:text-2xl transition-transform duration-500 flex-shrink-0 ${activeFAQ === index ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div className={`faq-answer ${activeFAQ === index ? 'open' : ''}`}>
                  <p className="text-gray-300 text-sm md:text-lg leading-relaxed px-4 md:px-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/10 via-purple-600/10 to-[#BC8BBC]/10 animate-pulse-slow"></div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="scroll-reveal">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 text-white">
              Ready for the <span className="text-[#BC8BBC]">Streaming Revolution</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto px-4">
              Join the movement and be among the first to experience Oliviuus when we launch in 2026.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
              <button
                onClick={handleActionClick}
                className="btn-premium group w-full sm:w-auto text-base md:text-xl"
              >
                <span>Secure Your Early Access</span>
              </button>
            </div>
            <p className="text-gray-400 mt-6 md:mt-8 text-sm md:text-lg animate-pulse-slow">
              Limited exclusive spots available for our founding members
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}