import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gift, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

// Components
import SubscriptionHeader from "../../components/subscription/SubscriptionHeader.jsx";
import SubscriptionCard from "../../components/subscription/SubscriptionCard.jsx";
import PlanComparison from "../../components/subscription/PlanComparison.jsx";
import FAQAccordion from "../../components/subscription/FAQAccordion.jsx";
import HelpSupport from "../../components/subscription/HelpSupport.jsx";
import api from "../../api/axios";
import { useSubscription } from "../../context/SubscriptionContext";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currentSubscription, getTimeRemaining } = useSubscription();
  
  // Free Plans State
  const [availablePlans, setAvailablePlans] = useState([]);
  const [userActivePlans, setUserActivePlans] = useState([]);
  const [freePlansLoading, setFreePlansLoading] = useState(false);
  const [showFreePlansExpanded, setShowFreePlansExpanded] = useState(false);
  const [freePlansError, setFreePlansError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const freePlansRef = useRef();

  // Subscription Plans State
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
  const helpSupportRef = useRef(null);

  // Debug logging helper
  const logDebug = useCallback((message, data = null, type = 'info') => {
    const timestamp = new Date().toISOString();
    console.log(`[FREE-PLANS][${timestamp}] ${type.toUpperCase()}: ${message}`, data || '');
  }, []);

  // Get current language
  const currentLang = i18n.language;

  // ==================== SUBSCRIPTION ACCESS CHECK ====================
  useEffect(() => {
    if (currentSubscription && currentSubscription.real_time_status === 'active') {
      navigate("/", { replace: true });
    }
  }, [currentSubscription, navigate]);

  if (currentSubscription && currentSubscription.real_time_status === 'active') {
    return <Navigate to="/" replace />;
  }

  // ==================== FREE PLANS FUNCTIONALITIES ====================
  
  // Fetch user's active free plans
  const fetchUserActivePlans = useCallback(async () => {
    try {
      logDebug('Fetching user active plans...');
      const response = await api.get('/admin/subscriptions/free-plans/user/active');

      if (response.data.success) {
        const activePlans = response.data.data || [];
        logDebug(`User has ${activePlans.length} active free plans`);
        setUserActivePlans(activePlans);
      } else {
        logDebug('No active plans found');
        setUserActivePlans([]);
      }
    } catch (error) {
      logDebug('Error fetching user active plans', error.message);
      setUserActivePlans([]);
    }
  }, [logDebug]);

  // Fetch eligible free plans
  const fetchAvailableFreePlans = useCallback(async () => {
    try {
      setFreePlansLoading(true);
      setFreePlansError(null);
      
      logDebug('Fetching available free plans...');
      const response = await api.get('/admin/subscriptions/free-plans/eligible');

      if (response.data.success) {
        let plansData = [];
        
        if (response.data.available_schedules && Array.isArray(response.data.available_schedules)) {
          plansData = response.data.available_schedules;
        } 
        else if (response.data.data && response.data.data.available_schedules && Array.isArray(response.data.data.available_schedules)) {
          plansData = response.data.data.available_schedules;
        }
        else if (response.data.data && Array.isArray(response.data.data)) {
          plansData = response.data.data;
        }
        else if (Array.isArray(response.data)) {
          plansData = response.data;
        }
        
        logDebug(`Found ${plansData.length} available free plans`);
        setAvailablePlans(plansData);
        setFreePlansError(null);
        
        // Auto-expand if there are available plans
        if (plansData.length > 0) {
          setShowFreePlansExpanded(true);
        }
      } else {
        logDebug('No free plans available');
        setFreePlansError(response.data.message || t('subscriptionPage.freePlans.noPlans'));
        setAvailablePlans([]);
      }
    } catch (error) {
      logDebug('Error fetching free plans', error.message);
      setFreePlansError(error.response?.data?.message || error.message || t('subscriptionPage.freePlans.networkError'));
      setAvailablePlans([]);
    } finally {
      setFreePlansLoading(false);
    }
  }, [logDebug, t]);

  // Initial data fetch
  useEffect(() => {
    let isMounted = true;
    
    const initFreePlans = async () => {
      if (!isMounted) return;
      
      logDebug('Initializing free plans...');
      try {
        await Promise.all([
          fetchAvailableFreePlans(),
          fetchUserActivePlans()
        ]);
      } catch (error) {
        logDebug('Initialization error', error);
      } finally {
        if (isMounted) {
          setHasInitialized(true);
        }
      }
    };

    initFreePlans();

    return () => {
      isMounted = false;
    };
  }, [fetchAvailableFreePlans, fetchUserActivePlans, logDebug]);

  // Activate a free plan
  const activateFreePlan = async (scheduleId, planName) => {
    try {
      logDebug(`Activating free plan: ${planName}`);
      
      const response = await api.post(`/admin/subscriptions/free-plans/${scheduleId}/activate`);
      
      if (response.data.success) {
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slideIn';
        notification.innerHTML = `
          <div class="flex items-center gap-2">
            <CheckCircle class="w-5 h-5" />
            <span>${response.data.message || t('subscriptionPage.freePlans.activateSuccess')}</span>
          </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove notification after 2 seconds
        setTimeout(() => {
          notification.classList.add('animate-slideOut');
          setTimeout(() => notification.remove(), 300);
        }, 2000);
        
        // Wait for notification to show, then redirect
        setTimeout(() => {
          // Redirect to home page
          navigate("/", { replace: true });
        }, 1500);
        
      } else {
        alert(response.data.message || t('subscriptionPage.freePlans.activationError'));
      }
    } catch (error) {
      logDebug('Activation error', error);
      alert(error.response?.data?.message || t('subscriptionPage.freePlans.activationError'));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format time remaining
  const formatTimeRemaining = (endDate) => {
    try {
      if (!endDate) return 'N/A';
      
      const now = new Date();
      const end = new Date(endDate);
      
      if (isNaN(end.getTime())) return t('subscriptionPage.freePlans.invalidDate');
      
      const diffMs = end - now;
      
      if (diffMs <= 0) return t('subscriptionPage.freePlans.expired');
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 30) {
        const months = Math.floor(diffDays / 30);
        return t('subscriptionPage.freePlans.timeFormats.months', { count: months });
      } else if (diffDays > 7) {
        const weeks = Math.floor(diffDays / 7);
        return t('subscriptionPage.freePlans.timeFormats.weeks', { count: weeks });
      } else if (diffDays > 0) {
        return t('subscriptionPage.freePlans.timeFormats.days', { count: diffDays });
      } else if (diffHours > 0) {
        return t('subscriptionPage.freePlans.timeFormats.hours', { count: diffHours });
      } else if (diffMinutes > 0) {
        return t('subscriptionPage.freePlans.timeFormats.minutes', { count: diffMinutes });
      } else {
        return t('subscriptionPage.freePlans.timeFormats.lessThanMinute');
      }
    } catch (error) {
      return 'N/A';
    }
  };

  // Check if user has active free plan
  const hasActiveFreePlan = userActivePlans.length > 0;

  // Check if we should show free plans section at all
  const shouldShowFreePlansSection = () => {
    if (!hasInitialized && freePlansLoading) return true; // Show loading state
    if (freePlansError && availablePlans.length === 0) return false; // Hide on error with no plans
    if (availablePlans.length > 0) return true; // Show if we have plans
    if (hasActiveFreePlan) return true; // Show if user has active plan
    return false; // Otherwise hide
  };

  // ==================== SUBSCRIPTION PLANS FUNCTIONALITIES ====================
  
  // SEO content based on language
  const seoContent = {
    en: {
      title: "Oliviuus Subscription Plans - Choose Your Streaming Plan",
      description: "Browse Oliviuus subscription plans starting from RWF 3,000. Choose between Basic, Standard, Mobile, and Family plans. Cancel anytime.",
      keywords: "Oliviuus subscription, streaming plans Rwanda, Rwandan streaming service, affordable streaming Rwanda, Netflix alternative Rwanda",
      ogTitle: "Choose Your Oliviuus Subscription Plan",
      ogDescription: "Unlimited streaming of Rwandan movies and global content. Plans from RWF 3,000/month."
    },
    rw: {
      "title": "Amafatabuguzi ya Oliviuus - Hitamo ifatabuguzi Ushaka",
      "description": "Reba ifatabuguzi za Oliviuus zitangira kuri RWF 3,000. Hitamo hagati ya Basic, Standard, Mobile, na Family. Ushobora guhagarika igihe icyo ari cyo cyose.",
      "keywords": "ifatabuguzi za Oliviuus, streaming Rwanda, serivisi za streaming mu Rwanda, streaming ihendutse Rwanda, alternative ya Netflix Rwanda",
      "ogTitle": "Hitamo ifatabuguzi ya Oliviuus",
      "ogDescription": "Streaming idafite umupaka ya filime nyarwanda n'ibirimo by'isi. ifatabuguzi zitangira kuri RWF 3,000 buri kwezi."
    },
    fr: {
      "title": "Plans d'Abonnement Oliviuus - Choisissez Votre Plan de Streaming",
      "description": "Découvrez les plans d'abonnement Oliviuus à partir de 3 000 RWF. Choisissez entre Basic, Standard, Mobile et Family. Annulez à tout moment.",
      "keywords": "abonnement Oliviuus, plans de streaming Rwanda, service de streaming rwandais, streaming abordable Rwanda, alternative Netflix Rwanda",
      "ogTitle": "Choisissez Votre Plan d'Abonnement Oliviuus",
      "ogDescription": "Streaming illimité de films rwandais et contenus mondiaux. Plans dès 3 000 RWF/mois."
    },
    sw: {
      "title": "Mipango ya Usajili Oliviuus - Chagua Mpango Wako wa Streaming",
      "description": "Tazama mipango ya usajili ya Oliviuus kuanzia RWF 3,000. Chagua kati ya Basic, Standard, Mobile, na Family. Futa wakati wowote.",
      "keywords": "usajili Oliviuus, mipango ya streaming Rwanda, huduma ya streaming Rwanda, streaming nafuu Rwanda, mbadala wa Netflix Rwanda",
      "ogTitle": "Chagua Mpango Wako wa Usajili Oliviuus",
      "ogDescription": "Streaming isiyo na kikomo ya filamu za Rwanda na maudhui ya kimataifa. Mipango kuanzia RWF 3,000/kwa mwezi."
    }
  };

  // Get SEO content based on current language
  const currentSeo = seoContent[currentLang] || seoContent.en;

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

  // Check if there's a pending future subscription
  const hasPendingSubscription = currentSubscription &&
    currentSubscription.real_time_status === 'scheduled';

  // Get time remaining for pending subscription
  const getPendingSubscriptionInfo = () => {
    if (!hasPendingSubscription) return null;

    const timeRemaining = getTimeRemaining();
    const startDate = currentSubscription?.start_date
      ? new Date(currentSubscription.start_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      : null;

    return {
      days: timeRemaining.days,
      startDate,
      planName: currentSubscription.subscription_name,
      formattedTime: timeRemaining.formatted
    };
  };

  const pendingInfo = getPendingSubscriptionInfo();

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

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          const backendPlans = response.data.data.map(backendPlan => {
            return {
              ...backendPlan,
              gradient: getGradient(backendPlan.type, backendPlan.popular),
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

          setPlans(backendPlans);
          setShowCurrency(true);
        } else {
          setError(t('subscriptionPage.fetchError'));
          setPlans([]);
        }
      } catch (err) {
        setError(t('subscriptionPage.fetchError'));
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
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
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

  // Scroll to help section
  const scrollToHelp = () => {
    helpSupportRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      if (!plan) {
        throw new Error('Plan not found');
      }

      navigate("/payment", {
        state: {
          plan: plan,
          currency,
          calculatedPrice: calculatePrice(plan.price)
        }
      });

    } catch (err) {
      setError(t('subscriptionPage.selectError'));
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
      <>
        <Helmet>
          <title>{currentSeo.title}</title>
          <meta name="description" content={currentSeo.description} />
        </Helmet>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#BC8BBC] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg text-center">
              {t('subscriptionPage.loading')}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Add CSS animations for notifications
  const NotificationStyles = () => (
    <style>{`
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .animate-slideIn {
        animation: slideIn 0.3s ease-out forwards;
      }
      
      .animate-slideOut {
        animation: slideOut 0.3s ease-in forwards;
      }
    `}</style>
  );

  return (
    <>
      <Helmet>
        <title>{currentSeo.title}</title>
        <meta name="description" content={currentSeo.description} />
        <meta name="keywords" content={currentSeo.keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content={currentLang} />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://oliviuus.com/subscription" />
        <meta property="og:title" content={currentSeo.ogTitle} />
        <meta property="og:description" content={currentSeo.ogDescription} />
        <meta property="og:image" content="https://oliviuus.com/subscription-og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Oliviuus Subscription Plans" />
        <meta property="og:site_name" content="Oliviuus" />
        <meta property="og:locale" content={currentLang} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@oliviuus_rw" />
        <meta name="twitter:creator" content="@oliviuus_rw" />
        <meta name="twitter:title" content={currentSeo.ogTitle} />
        <meta name="twitter:description" content={currentSeo.ogDescription} />
        <meta name="twitter:image" content="https://oliviuus.com/subscription-twitter-image.jpg" />
        <link rel="canonical" href="https://oliviuus.com/subscription" />
        <link rel="alternate" href="https://oliviuus.com/subscription" hreflang="x-default" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": currentSeo.title,
            "description": currentSeo.description,
            "url": "https://oliviuus.com/subscription",
            "inLanguage": currentLang,
            "isPartOf": {
              "@type": "WebSite",
              "name": "Oliviuus",
              "url": "https://oliviuus.com",
              "description": "Streaming platform for Rwandan and international content"
            }
          })}
        </script>
      </Helmet>
      <NotificationStyles />

      <div className="min-h-screen bg-gray-900 flex flex-col">
        <SubscriptionHeader
          currency={currency}
          setCurrency={setCurrency}
          showCurrency={showCurrency}
        />

        <main className="flex-1 flex flex-col items-center py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
          {/* Pending Subscription Banner */}
          {hasPendingSubscription && pendingInfo && (
            <div className="w-full max-w-4xl mb-6 sm:mb-8 px-2">
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-300">
                    Subscription Scheduled
                  </h3>
                </div>

                <p className="text-blue-200 text-sm sm:text-base mb-2">
                  Your <span className="font-semibold text-white">{pendingInfo.planName}</span> plan starts in{" "}
                  <span className="font-bold text-white">{pendingInfo.days} days</span>
                </p>

                <p className="text-blue-300 text-xs sm:text-sm">
                  Starting on <span className="font-semibold">{pendingInfo.startDate}</span>
                </p>
              </div>
            </div>
          )}

          {/* ==================== FREE PLANS SECTION (Compact Header) ==================== */}
          {shouldShowFreePlansSection() && (
            <div className="w-full max-w-4xl mb-4 sm:mb-6 px-2" ref={freePlansRef}>
              {/* Compact Header - Always Visible */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFreePlansExpanded(!showFreePlansExpanded)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    showFreePlansExpanded 
                      ? 'bg-gradient-to-r from-purple-900/30 to-[#BC8BBC]/20 border border-purple-700/50' 
                      : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {freePlansLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                    ) : hasActiveFreePlan ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : availablePlans.length > 0 ? (
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Gift className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="text-sm font-medium text-white">
                      {freePlansLoading 
                        ? t('subscriptionPage.freePlans.checking')
                        : hasActiveFreePlan 
                          ? t('subscriptionPage.freePlans.activePlan')
                          : availablePlans.length > 0 
                            ? t('subscriptionPage.freePlans.availablePlansCount', { 
                                count: availablePlans.length,
                                s: availablePlans.length !== 1 ? 's' : ''
                              })
                            : t('subscriptionPage.freePlans.header')}
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {showFreePlansExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {!freePlansLoading && availablePlans.length > 0 && !showFreePlansExpanded && (
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">
                      {t('subscriptionPage.freePlans.clickToView')}
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Content - Only shown when expanded */}
              {showFreePlansExpanded && (
                <div className="mt-3 bg-gradient-to-r from-purple-900/10 to-[#BC8BBC]/5 border border-purple-700/30 rounded-xl p-4 sm:p-5 transition-all duration-200">
                  {freePlansLoading ? (
                    <div className="py-4 flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                      <p className="text-gray-400 text-sm">{t('subscriptionPage.freePlans.loading')}</p>
                    </div>
                  ) : freePlansError ? (
                    <div className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-gray-400 text-sm">
                          {freePlansError}
                        </p>
                      </div>
                    </div>
                  ) : availablePlans.length === 0 ? (
                    <div className="py-4 text-center">
                      <Gift className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">
                        {hasActiveFreePlan 
                          ? t('subscriptionPage.freePlans.alreadyActive')
                          : t('subscriptionPage.freePlans.noPlans')}
                      </p>
                      {hasActiveFreePlan && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <p className="text-gray-500 text-xs">
                            {t('subscriptionPage.freePlans.checkBackLater')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* User's Active Free Plans */}
                      {hasActiveFreePlan && (
                        <div className="mb-4 pb-4 border-b border-gray-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <h4 className="text-green-300 font-medium text-sm">
                              {t('subscriptionPage.freePlans.yourActivePlan')}
                            </h4>
                          </div>
                          {userActivePlans.map((plan, index) => (
                            <div key={index} className="ml-6 text-xs text-gray-400">
                              {t('subscriptionPage.freePlans.planInfo', {
                                name: plan.plan_name || 'Free Plan',
                                days: formatTimeRemaining(plan.expires_at)
                              })}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Available Free Plans */}
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {availablePlans.map((plan) => (
                          <div
                            key={plan.id || plan.schedule_id}
                            className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 hover:bg-gray-800/60 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2 mb-2">
                                  <h4 className="text-white font-medium text-sm truncate">
                                    {plan.schedule_name || plan.name || 'Free Plan'}
                                  </h4>
                                  {plan.is_trial && (
                                    <span className="flex-shrink-0 bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded-full">
                                      {t('subscriptionPage.freePlans.trialBadge')}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                  <span>{plan.plan_name || 'Premium Plan'}</span>
                                  <span className="text-gray-600">•</span>
                                  <span>{plan.duration_days || plan.plan_duration_days || 7} {t('subscriptionPage.freePlans.timeFormats.days', { count: plan.duration_days || plan.plan_duration_days || 7 })}</span>
                                </div>
                                
                                {(plan.ends_at || plan.end_date) && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {t('subscriptionPage.freePlans.timeRemaining', { time: formatTimeRemaining(plan.ends_at || plan.end_date) })}
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => activateFreePlan(plan.id, plan.schedule_name || plan.name)}
                                disabled={freePlansLoading}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {t('subscriptionPage.freePlans.activate')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== SUBSCRIPTION PLANS SECTION ==================== */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12 w-full max-w-4xl px-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {t('subscriptionPage.title')}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-2">
              {t('subscriptionPage.subtitle')}
            </p>

            {showCurrency && plans.length > 0 && (
              <div className="bg-gray-800/80 rounded-lg sm:rounded-xl p-3 sm:p-4 inline-block border border-gray-700 max-w-full">
                <p className="text-gray-300 text-xs sm:text-sm text-center">
                  {t('subscriptionPage.pricesIn')} <span className="text-[#BC8BBC] font-semibold">{currencySymbols[currency]}</span>
                  {currency !== "RWF" && (
                    <span className="text-gray-400 text-xs ml-1 sm:ml-2 block sm:inline mt-1 sm:mt-0">
                      ({t('subscriptionPage.convertedFromRWF')})
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

          {/* Help Button for Subscription Issues */}
          <div className="w-full max-w-4xl mb-6 px-2">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-300 text-sm mb-3">
                {t('subscriptionPage.helpSection.title')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/account/settings#subscription')}
                  className="bg-[#BC8BBC] hover:bg-[#a56ba5] text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200"
                >
                  {t('subscriptionPage.helpSection.checkStatus')}
                </button>
                <button
                  onClick={scrollToHelp}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200"
                >
                  {t('subscriptionPage.helpSection.contactSupport')}
                </button>
              </div>
            </div>
          </div>

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
                {t('subscriptionPage.noPlans')}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                {t('subscriptionPage.checkBackLater')}
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

          <div ref={helpSupportRef} className="w-full max-w-4xl mt-8 sm:mt-12 lg:mt-16 px-2 sm:px-4">
            <HelpSupport />
          </div>
        </main>
      </div>
    </>
  );
};

export default SubscriptionPage;