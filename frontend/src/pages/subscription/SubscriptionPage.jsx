import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Components
import SubscriptionHeader from "../../components/subscription/SubscriptionHeader.jsx";
import SubscriptionCard from "../../components/subscription/SubscriptionCard.jsx";
import PlanComparison from "../../components/subscription/PlanComparison.jsx";
import FAQAccordion from "../../components/subscription/FAQAccordion.jsx";
import HelpSupport from "../../components/subscription/HelpSupport.jsx";
import api from "../../api/axios";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currency, setCurrency] = useState("RWF");
  const [plans, setPlans] = useState([]);
  const [showCurrency, setShowCurrency] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const scrollContainerRef = useRef(null);

  // Currency conversion rates
  const exchangeRates = {
    RWF: 1,
    USD: 0.00081,
    BIF: 1.10,
    CDF: 2.20,
    TZS: 1.88
  };

  const currencySymbols = {
    RWF: "FRw",
    USD: "$",
    BIF: "FBu",
    CDF: "FC",
    TZS: "TSh"
  };

  // Default prices for fallback
  const getDefaultPrice = (planType) => {
    const defaultPrices = {
      mobile: 5000,
      basic: 10000,
      standard: 15000,
      family: 20000
    };
    return defaultPrices[planType] || 10000;
  };

  // Get gradient based on plan type and popularity
  const getGradient = (planType, isPopular) => {
    if (isPopular) return "from-purple-900 to-[#BC8BBC]";
    
    const gradients = {
      mobile: "from-gray-700 to-gray-800",
      basic: "from-gray-700 to-gray-800", 
      standard: "from-gray-700 to-gray-800",
      family: "from-gray-700 to-gray-800"
    };
    return gradients[planType] || "from-gray-700 to-gray-800";
  };

  // Fetch all plan data from backend
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        setPlansLoading(true);
        const response = await api.get("/subscriptions/public");
        
        console.log("Backend response:", response.data);
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          console.log("Backend plans received:", response.data.data);
          
          // Use backend plans directly - add gradient and ensure all fields are present
          const backendPlans = response.data.data.map(backendPlan => {
            return {
              ...backendPlan, // All backend data
              gradient: getGradient(backendPlan.type, backendPlan.popular),
              // Ensure all required fields have fallbacks
              deviceLimit: backendPlan.deviceLimit || backendPlan.max_sessions || 1,
              video_quality: backendPlan.video_quality || 'SD',
              offline_downloads: Boolean(backendPlan.offline_downloads),
              max_downloads: backendPlan.max_downloads || 0,
              download_quality: backendPlan.download_quality || 'SD',
              simultaneous_downloads: backendPlan.simultaneous_downloads || 1,
              download_expiry_days: backendPlan.download_expiry_days || 30,
              hdr_support: Boolean(backendPlan.hdr_support),
              parental_controls: Boolean(backendPlan.parental_controls),
              supported_platforms: backendPlan.supported_platforms || '["web","mobile","tablet"]',
              max_devices_registered: backendPlan.max_devices_registered || 5,
              max_video_bitrate: backendPlan.max_video_bitrate || 2000,
              popular: Boolean(backendPlan.popular)
            };
          });

          console.log("Final plans with dynamic data:", backendPlans);
          setPlans(backendPlans);
          setShowCurrency(true);
        } else {
          console.log("No backend plans, cannot proceed without data");
          setError(t('subscriptionPage.fetchError', 'No subscription plans available at the moment.'));
          setPlans([]);
        }
      } catch (err) {
        console.error("Error fetching plan data:", err);
        setError(t('subscriptionPage.fetchError', 'Failed to load subscription plans. Please try again.'));
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlanData();
  }, [t]);

  // Check scroll position and update arrow visibility
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px tolerance
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Update scroll buttons on mount and when plans change
  useEffect(() => {
    updateScrollButtons();
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [plans]);

  const calculatePrice = (originalPrice) => {
    return Math.round(originalPrice * exchangeRates[currency]);
  };

  const handleSelectPlan = async (planId) => {
    setSelectedPlan(planId);
    setLoading(true);
    setError("");

    try {
      const plan = plans.find(p => p.id === planId);
      const res = await api.post("/subscription/select", { 
        plan: planId,
        currency: currency,
        plan_data: plan
      });
      
      if (res.status === 200) {
        navigate("/payment", { 
          state: { 
            plan: plan, 
            currency,
            calculatedPrice: calculatePrice(plan.price)
          } 
        });
      } else {
        setError(t('subscriptionPage.serverError', 'Server error. Please try again.'));
      }
    } catch (err) {
      console.error(err);
      setError(t('subscriptionPage.selectError', 'Failed to select plan. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to popular plan on mobile
  useEffect(() => {
    const popularPlan = plans.find(plan => plan.popular);
    if (popularPlan && window.innerWidth < 768) {
      const element = document.getElementById(`plan-${popularPlan.id}`);
      setTimeout(() => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 500);
    }
  }, [plans]);

  if (plansLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#BC8BBC] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg text-center">
            {t('subscriptionPage.loading', 'Loading subscription plans...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <SubscriptionHeader 
        currency={currency} 
        setCurrency={setCurrency}
        showCurrency={showCurrency}
      />

      <main className="flex-1 flex flex-col items-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12 w-full max-w-4xl px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            {t('subscriptionPage.title', 'Choose Your Plan')}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-2">
            {t('subscriptionPage.subtitle', 'Unlimited streaming. No commitments. Cancel anytime.')}
          </p>
          
          {showCurrency && plans.length > 0 && (
            <div className="bg-gray-800/80 rounded-lg sm:rounded-xl p-3 sm:p-4 inline-block border border-gray-700 max-w-full">
              <p className="text-gray-300 text-xs sm:text-sm text-center">
                {t('subscriptionPage.pricesIn', 'Prices in')} <span className="text-[#BC8BBC] font-semibold">{currencySymbols[currency]}</span>
                {currency !== "RWF" && (
                  <span className="text-gray-400 text-xs ml-1 sm:ml-2 block sm:inline mt-1 sm:mt-0">
                    ({t('subscriptionPage.convertedFromRWF', 'converted from RWF')})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="w-full max-w-6xl mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/50 border border-red-700 rounded-lg mx-2">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-red-300 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}

        {plans.length > 0 ? (
          <div className="w-full max-w-7xl">
            {/* Mobile: Horizontal scroll with arrows */}
            <div className="block lg:hidden w-full relative">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/90 text-white p-3 rounded-full shadow-lg border border-gray-600 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Scroll left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Scroll Container */}
              <div 
                ref={scrollContainerRef}
                className="flex space-x-4 sm:space-x-6 pb-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {plans.map((plan) => (
                  <div key={plan.id} id={`plan-${plan.id}`} className="flex-none w-80 sm:w-96 snap-center">
                    <SubscriptionCard 
                      plan={plan}
                      currency={currency}
                      currencySymbol={currencySymbols[currency]}
                      calculatedPrice={calculatePrice(plan.price)}
                      isSelected={selectedPlan === plan.id}
                      onSelect={() => handleSelectPlan(plan.id)}
                      loading={loading && selectedPlan === plan.id}
                      isMobile={true}
                    />
                  </div>
                ))}
              </div>

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={scrollRight}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800/80 hover:bg-gray-700/90 text-white p-3 rounded-full shadow-lg border border-gray-600 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Scroll right"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Scroll indicator dots */}
              <div className="flex justify-center space-x-2 mt-4 lg:hidden">
                {plans.map((_, index) => (
                  <div key={index} className="w-2 h-2 bg-gray-600 rounded-full transition-all duration-200"></div>
                ))}
              </div>
            </div>

            {/* Tablet and Desktop: Grid layout */}
            <div className="hidden lg:block w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} id={`plan-${plan.id}`}>
                    <SubscriptionCard 
                      plan={plan}
                      currency={currency}
                      currencySymbol={currencySymbols[currency]}
                      calculatedPrice={calculatePrice(plan.price)}
                      isSelected={selectedPlan === plan.id}
                      onSelect={() => handleSelectPlan(plan.id)}
                      loading={loading && selectedPlan === plan.id}
                      isMobile={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-2">
              {t('subscriptionPage.noPlans', 'No Plans Available')}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
              {t('subscriptionPage.checkBackLater', 'Please check back later for available subscription plans.')}
            </p>
          </div>
        )}

        {plans.length > 0 && (
          <div className="w-full max-w-7xl mt-8 sm:mt-12 lg:mt-16">
            <PlanComparison 
              plans={plans}
              currencySymbol={currencySymbols[currency]}
              calculatePrice={calculatePrice}
            />
          </div>
        )}

        <div className="w-full max-w-4xl mt-8 sm:mt-12 lg:mt-16 px-2 sm:px-4">
          <FAQAccordion />
        </div>

        <div className="w-full max-w-4xl mt-8 sm:mt-12 lg:mt-16 px-2 sm:px-4">
          <HelpSupport />
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPage;