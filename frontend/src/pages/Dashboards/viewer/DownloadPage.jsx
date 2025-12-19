// src/components/layout/dashboard/kid/DownloadPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Download, Home, CheckCircle, Clock, Smartphone, Tablet, Laptop } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DownloadPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: Clock,
      title: t('download.features.offline', 'Watch Offline'),
      description: t('download.features.offlineDesc', 'Download your favorite shows and movies to watch without internet')
    },
    {
      icon: Smartphone,
      title: t('download.features.mobile', 'Mobile Friendly'),
      description: t('download.features.mobileDesc', 'Download content to your phone for on-the-go viewing')
    },
    {
      icon: Tablet,
      title: t('download.features.tablet', 'Tablet Optimized'),
      description: t('download.features.tabletDesc', 'Perfect viewing experience on tablets')
    },
    {
      icon: Laptop,
      title: t('download.features.computer', 'Computer Ready'),
      description: t('download.features.computerDesc', 'Download to your computer for big-screen enjoyment')
    }
  ];

  const comingSoonFeatures = [
    t('download.comingSoon.hd', 'HD & 4K Quality Downloads'),
    t('download.comingSoon.unlimited', 'Unlimited Downloads'),
    t('download.comingSoon.expire', 'No Expiry Dates'),
    t('download.comingSoon.sync', 'Cross-Device Sync')
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Main Container */}
      <div className="relative max-w-4xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-[#BC8BBC]/20 to-purple-500/20 rounded-3xl mb-6">
            <Download className="w-16 h-16 text-[#BC8BBC]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#BC8BBC] via-purple-300 to-[#BC8BBC] bg-clip-text text-transparent">
            {t('download.title', 'Downloads')}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('download.subtitle', 'Download your favorite content and watch offline anytime, anywhere')}
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-[#BC8BBC]/20 via-purple-500/20 to-[#BC8BBC]/20 rounded-2xl p-6 md:p-8 mb-10 border-2 border-[#BC8BBC]/30">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 bg-[#BC8BBC]/10 rounded-2xl">
                <Clock className="w-12 h-12 text-[#BC8BBC] animate-pulse" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {t('download.comingSoon.title', 'Downloads Coming Soon!')}
              </h2>
              <p className="text-lg text-gray-300 mb-4">
                {t('download.comingSoon.message', 'We\'re excited to announce that the download feature is currently in development. Soon you\'ll be able to save content for offline viewing!')}
              </p>
              
              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">{t('download.progress', 'Development Progress')}</span>
                  <span className="text-[#BC8BBC] font-bold">85%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#BC8BBC] to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>

              {/* Coming Soon Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comingSoonFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#BC8BBC] flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-[#BC8BBC]/30 transition-all duration-300 hover:scale-105"
            >
              <div className="p-3 bg-[#BC8BBC]/10 rounded-xl w-fit mb-4">
                <feature.icon className="w-8 h-8 text-[#BC8BBC]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="group px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 border-2 border-gray-700/50 hover:border-[#BC8BBC]/50"
          >
            <Home className="w-5 h-5 group-hover:text-[#BC8BBC] transition-colors" />
            <span>{t('download.buttons.home', 'Back to Home')}</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:from-[#BC8BBC]/90 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#BC8BBC]/20"
          >
            <Download className="w-5 h-5" />
            <span>{t('download.buttons.check', 'Check for Updates')}</span>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            {t('download.footer', 'Download feature expected to launch Soon. Stay tuned for updates!')}
          </p>
        </div>
      </div>
    </div>
  );
}