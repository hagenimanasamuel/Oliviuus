import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import Footer from '../components/Footer.jsx'; // Uncomment if you want to include footer

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-[#1f1f1f] text-gray-200">
      
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-7xl font-bold text-[#9b69b2] mb-4 sm:text-6xl">404</h1>
        <h2 className="text-2xl font-semibold text-gray-200 mb-2 sm:text-xl">
          {t('notfound.title')}
        </h2>
        <p className="text-gray-400 mb-6 sm:text-sm">
          {t('notfound.description')}
        </p>
        <Link
          to="/"
          className="inline-block bg-[#BC8BBC] hover:bg-[#ffffff] text-white text-sm font-medium px-6 py-3 rounded-full transition sm:px-4 sm:py-2"
        >
          {t('notfound.home_button')}
        </Link>
      </main>

      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
};

export default NotFound;
