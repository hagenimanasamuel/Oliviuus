import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import CryptoJS from "crypto-js";
import EmailInput from "./EmailInput";
import { useTranslation } from "react-i18next";

const SECRET_KEY = import.meta.env.VITE_EMAIL_STATE_SECRET;

const encodeState = (data) => {
  const str = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { currentSubscription } = useSubscription();
  const { t } = useTranslation();

  const handleEmailSubmit = ({ email: enteredEmail, isExistingUser }) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const nextStep = isExistingUser ? "password" : "code";

      const stateData = {
        step: nextStep,
        email: enteredEmail,
        isExistingUser: isExistingUser
      };

      const hash = encodeState(stateData);
      navigate(`/auth?state=${hash}`);
    }, 400);
  };

  const handleRestartMembership = () => {
    navigate("/subscription");
  };

  // If user is logged in but has no subscription
  if (user && !currentSubscription) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background elements remain the same */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
        <div className="absolute inset-0 bg-grid-large opacity-30"></div>
        <div className="absolute inset-0 bg-grid-small opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-radial-hero"></div>
        <div className="absolute inset-0 bg-gradient-radial-corner"></div>

        {/* Content for logged-in users without subscription */}
        <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto animate-scale-in">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            <span className="text-gradient-enhanced bg-gradient-to-r from-white via-[#BC8BBC] to-purple-600">
              {t("landingPage.hero.welcomeBack")}
            </span>
          </h1>

          <h2 className="text-lg md:text-2xl font-bold mb-6 text-gradient-primary-enhanced animate-slide-up animation-delay-200">
            {t("landingPage.hero.continueJourney")}
          </h2>

          {/* Enhanced Pricing Section */}
          <div className="mb-8 animate-fade-in animation-delay-400">
            <div className="inline-flex items-center gap-4 bg-black/30 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/10">
              <p className="text-base md:text-lg text-gray-200">
                {t("landingPage.hero.startingAt")} <span className="text-[#BC8BBC] font-bold">RWF 3,000</span>
              </p>
              <div className="w-1 h-4 bg-white/20"></div>
              <p className="text-sm text-gray-300">
                {t("landingPage.hero.cancelAnytime")}
              </p>
            </div>
          </div>

          {/* Enhanced CTA Section for returning users */}
          <div className="animate-fade-in animation-delay-600">
            <p className="text-base md:text-lg text-gray-200 mb-6 font-light">
              {t("landingPage.hero.restartDescription")}
            </p>

            <button
              onClick={handleRestartMembership}
              className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#a87aa8] hover:to-purple-500 text-white px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              {t("landingPage.hero.restartMembership")}
            </button>
          </div>
        </div>

        {/* Simple Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#BC8BBC] rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#BC8BBC] rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  // Original content for non-logged in users
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background elements remain the same */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
      <div className="absolute inset-0 bg-grid-large opacity-30"></div>
      <div className="absolute inset-0 bg-grid-small opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-radial-hero"></div>
      <div className="absolute inset-0 bg-gradient-radial-corner"></div>

      {/* Floating Stars & Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}

        {[...Array(15)].map((_, i) => (
          <div
            key={`medium-star-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle-slow"
            style={{
              left: `${5 + Math.random() * 90}%`,
              top: `${5 + Math.random() * 90}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${4 + Math.random() * 5}s`
            }}
          />
        ))}

        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-0.5 h-0.5 bg-[#BC8BBC] rounded-full animate-float-in"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 12}s`
            }}
          />
        ))}

        {[...Array(6)].map((_, i) => (
          <div
            key={`float-${i}`}
            className="absolute w-4 h-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full opacity-20 animate-float-3d"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${20 + Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      {/* Light Beams */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#BC8BBC]/5 rounded-full blur-3xl animate-pulse-slower"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto animate-scale-in">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
          <span className="text-gradient-enhanced bg-gradient-to-r from-white via-[#BC8BBC] to-purple-600">
            {t("landingPage.hero.title")}
          </span>
          <br />
          <span className="text-gradient-enhanced bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            {t("landingPage.hero.subtitle")}
          </span>
        </h1>

        <h2 className="text-lg md:text-2xl font-bold mb-6 text-gradient-primary-enhanced animate-slide-up animation-delay-200">
          {t("landingPage.hero.tagline")}
        </h2>

        {/* Enhanced Pricing Section */}
        <div className="mb-8 animate-fade-in animation-delay-400">
          <div className="inline-flex items-center gap-4 bg-black/30 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/10">
            <p className="text-base md:text-lg text-gray-200">
              {t("landingPage.hero.startingAt")} <span className="text-[#BC8BBC] font-bold">RWF 3,000</span>
            </p>
            <div className="w-1 h-4 bg-white/20"></div>
            <p className="text-sm text-gray-300">
              {t("landingPage.hero.cancelAnytime")}
            </p>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="animate-fade-in animation-delay-600">
          <p className="text-xs md:text-sm text-gray-300 mb-4 font-light">
            {t("landingPage.hero.ctaDescription")}
          </p>

          <EmailInput onSubmit={handleEmailSubmit} isLoading={isLoading} />
        </div>
      </div>

      {/* Simple Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-[#BC8BBC] rounded-full flex justify-center">
          <div className="w-1 h-3 bg-[#BC8BBC] rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;