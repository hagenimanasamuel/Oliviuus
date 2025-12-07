// src/pages/Dashboards/kid/KidGamesPage.jsx
import React from "react";
import { Helmet } from "react-helmet";
import { Gamepad2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function KidGamesPage() {
  const { t } = useTranslation(); // Initialize translation hook

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      <Helmet>
        <title>{t('games.seo.title')}</title>
        <meta name="description" content={t('games.seo.description')} />
      </Helmet>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#FF5722]/20 to-[#FF9800]/20 border-b border-[#FF5722]/30 pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF5722]/10 to-[#FF9800]/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="p-4 bg-gradient-to-r from-[#FF5722] to-[#FF9800] rounded-2xl shadow-2xl mb-6">
              <Gamepad2 className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              {t('games.header.title')}
              <span className="block text-[#FFD166] text-2xl sm:text-3xl md:text-4xl mt-4">
                {t('games.header.subtitle')}
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg sm:text-xl mb-8">
              {t('games.header.description')}
            </p>
            
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] rounded-2xl p-8 border border-[#FF5722]/30 shadow-xl max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-8 h-8 text-[#FFD166]" />
                <h3 className="text-white text-xl font-bold">
                  {t('games.features.title')}
                </h3>
              </div>
              
              <ul className="space-y-3 text-gray-300 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-[#FFD166] text-lg">🎮</span>
                  <span>{t('games.features.funEducational')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#FFD166] text-lg">🧩</span>
                  <span>{t('games.features.puzzles')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#FFD166] text-lg">🎯</span>
                  <span>{t('games.features.skillBuilding')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#FFD166] text-lg">🏆</span>
                  <span>{t('games.features.safeContent')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-[#1A1A2E]/80 to-[#16213E]/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-[#FF5722]/30">
          <div className="text-center">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('games.construction.title')}
            </h2>
            <p className="text-gray-300 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
              {t('games.construction.description')}
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF5722] to-[#FF9800] text-white rounded-xl font-bold">
              <Sparkles className="w-5 h-5" />
              {t('games.buttons.comingSoon')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}