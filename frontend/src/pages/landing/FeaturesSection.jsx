import React from "react";
import { useTranslation } from "react-i18next";

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      key: "streamDevices",
      icon: "🖥️"
    },
    {
      key: "downloadOffline", 
      icon: "💾"
    },
    {
      key: "watchAcrossScreens",
      icon: "📲"
    },
    {
      key: "kidsExperience",
      icon: "🎨"
    },
    {
      key: "premiumAudio",
      icon: "🔊"
    },
    {
      key: "ultraHd",
      icon: "✨"
    }
  ];

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-black to-gray-900 border-t-8 border-[#BC8BBC]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simplified Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            {t("landingPage.features.title")} <span className="text-gradient-enhanced">{t("landingPage.features.titleHighlight")}</span>
          </h2>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
            {t("landingPage.features.subtitle")}
          </p>
        </div>
        
        {/* Optimized Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-[#BC8BBC]/40 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-[#BC8BBC]/5"
            >
              {/* Highlight Badge */}
              <div className="absolute -top-2 left-4">
                <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  {t(`landingPage.features.${feature.key}.highlight`)}
                </span>
              </div>

              {/* Icon Container */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#BC8BBC]/20 to-purple-600/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#BC8BBC] transition-colors duration-300">
                  {t(`landingPage.features.${feature.key}.title`)}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {t(`landingPage.features.${feature.key}.description`)}
                </p>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#BC8BBC]/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Simplified Bottom Section */}
        <div className="text-center mt-12 md:mt-16">
          <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 border border-[#BC8BBC]/20 rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
              {t("landingPage.features.ctaTitle")}
            </h3>
            <p className="text-gray-300 text-base max-w-xl mx-auto">
              {t("landingPage.features.ctaDescription")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;