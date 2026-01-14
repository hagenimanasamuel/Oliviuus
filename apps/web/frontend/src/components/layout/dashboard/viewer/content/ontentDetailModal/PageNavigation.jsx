// src/pages/Dashboards/viewer/content/components/PageNavigation.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Film, ArrowLeft, Home } from 'lucide-react';

const PageNavigation = ({ onGoBack, onGoHome, contentData }) => {
  const { t } = useTranslation();

  const getTrailer = () => {
    return contentData?.trailer || contentData?.media_assets?.find(asset => asset.asset_type === 'trailer');
  };

  const trailer = getTrailer();

  return (
    <div className="flex gap-2">
      {trailer && (
        <button
          onClick={() => console.log('Toggle floating trailer')}
          className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
          title={t('contentdetail.actions.openFloatingTrailer', 'Open Floating Trailer')}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(188, 139, 188, 0.3)'
          }}
        >
          <Film className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      <button
        onClick={onGoBack}
        className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
        title={t('contentdetail.actions.goBack', 'Go Back')}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={onGoHome}
        className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
        title={t('contentdetail.actions.goToHomepage', 'Go to Homepage')}
      >
        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};

export default PageNavigation;