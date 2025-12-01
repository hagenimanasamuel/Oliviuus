// src/pages/Dashboards/viewer/content/components/ModalNavigation.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Film, ArrowLeft, Home, X } from 'lucide-react';

const ModalNavigation = ({ onClose, contentData }) => {
  const { t } = useTranslation();

  const getTrailer = () => {
    return contentData?.trailer || contentData?.media_assets?.find(asset => asset.asset_type === 'trailer');
  };

  const handleGoHome = () => {
    // Navigation logic here
    onClose?.();
  };

  const handleGoBack = () => {
    // Navigation logic here
    onClose?.();
  };

  const trailer = getTrailer();

  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
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
        onClick={handleGoBack}
        className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
        title={t('contentdetail.actions.goBack', 'Go Back')}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={handleGoHome}
        className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 group shadow-lg"
        title={t('contentdetail.actions.goToHomepage', 'Go to Homepage')}
      >
        <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      <button
        onClick={onClose}
        className="bg-black/80 hover:bg-[#BC8BBC] text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 hover:rotate-90 group shadow-lg"
        title={t('contentdetail.actions.close', 'Close')}
      >
        <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );
};

export default ModalNavigation;