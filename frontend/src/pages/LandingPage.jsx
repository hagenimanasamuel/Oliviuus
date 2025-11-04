// LandingPage.jsx
import React, { useState, useEffect } from "react";
import Logo from "../components/Logo";

export default function LandingPage() {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);

  // SEO Metadata - We'll add this to index.html or use a different approach
  const pageTitle = "Oliviuus - Streaming Platform for Rwandan Cinema & Global Entertainment | Launching 2026";
  const pageDescription = "Oliviuus is the future of streaming - combining premium global content with Rwandan cinema. Experience African storytelling meets international entertainment.";

  useEffect(() => {
    // Update page title and meta description
    document.title = pageTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = pageDescription;

    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "StreamingService",
      "name": "Oliviuus",
      "description": pageDescription,
      "url": "https://oliviuus.com",
      "offers": {
        "@type": "Offer",
        "description": "Streaming service launching in 2026"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      
      // Scroll reveal animation
      const elements = document.querySelectorAll('.scroll-reveal');
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('revealed');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Cleanup function
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.head.removeChild(script);
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
      question: "What type of content will be available on Oliviuus?",
      answer: "From international blockbusters to Rwandan cinematic gems, documentaries, series, and exclusive Oliviuus Originals - we're curating a diverse library for all tastes."
    },
    {
      question: "Will there be regional pricing for Oliviuus?",
      answer: "Yes, we're committed to making premium entertainment accessible with competitive pricing plans tailored for different markets."
    },
    {
      question: "Can I request specific movies or shows on Oliviuus?",
      answer: "Absolutely! Our content team actively considers viewer requests to ensure we're bringing the content our community wants to see."
    },
    {
      question: "How many devices can stream simultaneously on Oliviuus?",
      answer: "We're designing flexible plans that allow multiple simultaneous streams so your whole family can enjoy their favorite content."
    },
    {
      question: "Will there be a free trial for Oliviuus?",
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
    <footer className="w-full bg-gray-900 text-white border-t border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6 text-sm">
          
          {/* Top section with logo */}
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10">
                <Logo />
              </div>
              <span className="text-xl font-bold text-[#BC8BBC]">OLIVIUUS</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <button onClick={handleActionClick} className="text-gray-400 hover:text-[#BC8BBC] transition-colors duration-300">
                Twitter
              </button>
              <button onClick={handleActionClick} className="text-gray-400 hover:text-[#BC8BBC] transition-colors duration-300">
                Instagram
              </button>
              <button onClick={handleActionClick} className="text-gray-400 hover:text-[#BC8BBC] transition-colors duration-300">
                LinkedIn
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
            {["Terms of Service", "Privacy Policy", "Help Center", "Feedback", "Contact Us"].map((item) => (
              <button
                key={item}
                onClick={handleActionClick}
                className="text-gray-300 hover:text-[#BC8BBC] transition-all duration-300 hover:underline text-sm"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center w-full mt-6 text-gray-400 border-t border-gray-700 pt-6">
            <p>&copy; {new Date().getFullYear()} Oliviuus Inc. All rights reserved.</p>
            <p className="mt-2 text-xs">Launching 2026 - The Future of African Streaming</p>
          </div>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-lg flex items-center justify-center z-50 p-4 modal-overlay">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-[#BC8BBC] rounded-2xl p-8 max-w-md w-full modal-content relative">
            <div className="flex justify-center mb-6">
              <div className="avatar animate-bounce-soft">
                🎬
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-center text-[#BC8BBC] animate-scale-in">
              Coming Soon!
            </h1>
            <p className="text-gray-300 mb-6 text-center text-lg leading-relaxed">
              Oliviuus is launching in 2026 with a revolutionary streaming experience. 
              Stay tuned for the future of entertainment!
            </p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-[#a87aa8] hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Continue Exploring
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed w-full z-40 transition-all duration-500 ${isScrolled ? 'header-scroll py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3 animate-slide-down">
            <div className="w-10 h-10">
              <Logo />
            </div>
            <h1 className="text-2xl font-black text-white">OLIVIUUS</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white hover:text-[#BC8BBC] transition-all duration-300 font-medium hover:scale-110">Features</a>
            <a href="#content" className="text-white hover:text-[#BC8BBC] transition-all duration-300 font-medium hover:scale-110">Content</a>
            <a href="#faq" className="text-white hover:text-[#BC8BBC] transition-all duration-300 font-medium hover:scale-110">FAQ</a>
            <button
              onClick={handleActionClick}
              className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-[#a87aa8] hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get Early Access
            </button>
          </nav>

          <button className="md:hidden text-white hover:text-[#BC8BBC] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16">
        <div className="absolute inset-0 bg-grid"></div>
        <div className="absolute inset-0 bg-gradient-radial"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <span className="bg-[#BC8BBC] bg-opacity-20 text-[#BC8BBC] px-6 py-3 rounded-full text-sm font-semibold border border-[#BC8BBC] border-opacity-30 backdrop-blur-sm">
                🚀 Launching 2026 - Revolutionizing African Streaming
              </span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black mb-8 text-white animate-scale-in">
              OLIVIUUS
            </h1>
            
            <h2 className="text-2xl md:text-4xl text-white mb-8 max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-200">
              Where <span className="text-[#BC8BBC] font-bold">Rwandan Cinema</span> Meets Global Entertainment
            </h2>

            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in animation-delay-400">
              Experience streaming reimagined for the African continent and beyond. 
              Join the revolution in digital entertainment.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up animation-delay-600">
              <button
                onClick={handleActionClick}
                className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-[#a87aa8] hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg btn-premium relative overflow-hidden"
              >
                Join The Revolution
              </button>
              
              <button
                onClick={handleActionClick}
                className="border-2 border-[#BC8BBC] text-[#BC8BBC] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#BC8BBC] hover:bg-opacity-10 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  Explore Content 
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </button>
            </div>

            {/* Highlights Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto animate-fade-in animation-delay-800">
              {highlights.map((highlight, index) => (
                <div key={index} className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-6 text-center backdrop-blur-sm feature-card relative overflow-hidden">
                  <div className="text-3xl mb-4 animate-bounce-soft">{highlight.icon}</div>
                  <div className="text-white text-sm font-semibold">{highlight.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Why Oliviuus Stands Out
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              We're building more than a streaming platform - we're creating a cultural hub for African storytelling and global entertainment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm hover:border-[#BC8BBC] transition-all duration-300 feature-card relative overflow-hidden scroll-reveal"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="text-5xl mb-6 transform transition-transform duration-300 animate-float">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rwandan Cinema Focus Section */}
      <section id="content" className="py-20 bg-gradient-to-r from-gray-900 to-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="scroll-reveal">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
                Elevating <span className="text-[#BC8BBC]">Rwandan Cinema</span> Worldwide
              </h2>
              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                We're passionate about bringing the rich stories and talented filmmakers of Rwanda to a global audience. 
                Oliviuus will be the premier platform for Rwandan movies, documentaries, and series.
              </p>
              <div className="space-y-4">
                {[
                  "Exclusive distribution partnerships with local studios",
                  "Funding and production support for new projects",
                  "Global marketing and promotion of Rwandan content",
                  "Cultural exchange programs with international filmmakers"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 text-white">
                    <div className="w-8 h-8 bg-[#BC8BBC] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative scroll-reveal">
              <div className="grid grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-[#BC8BBC] bg-opacity-20 rounded-2xl aspect-video flex items-center justify-center border border-[#BC8BBC] border-opacity-30 backdrop-blur-sm">
                    <span className="text-4xl animate-float" style={{animationDelay: `${item * 0.5}s`}}>🎭</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to know about the Oliviuus revolution.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-2xl overflow-hidden backdrop-blur-sm scroll-reveal"
                style={{animationDelay: `${index * 100}ms`}}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-6 text-left flex justify-between items-center hover:bg-gray-700 hover:bg-opacity-50 transition-colors duration-300"
                >
                  <span className="text-lg font-semibold text-white pr-4 text-left">
                    {faq.question}
                  </span>
                  <span className={`text-[#BC8BBC] text-xl transition-transform duration-500 flex-shrink-0 ${activeFAQ === index ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                <div className={`faq-answer ${activeFAQ === index ? 'open' : ''}`}>
                  <p className="text-gray-300 text-lg leading-relaxed px-6">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="scroll-reveal">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
              Ready for the <span className="text-[#BC8BBC]">Streaming Revolution</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Join the movement and be among the first to experience Oliviuus when we launch in 2026.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={handleActionClick}
                className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white px-12 py-6 rounded-xl text-xl font-semibold hover:from-[#a87aa8] hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg btn-premium relative overflow-hidden"
              >
                Secure Your Early Access
              </button>
            </div>
            <p className="text-gray-400 mt-8 text-lg">
              Limited exclusive spots available for our founding members
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}