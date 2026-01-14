import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "../Logo.jsx";
import ProfileMenu from "../ui/ProfileMenu.jsx";

const SubscriptionHeader = ({ currency, setCurrency, showCurrency = true }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef();
  
  const currencySymbols = {
    RWF: "FRw",
    USD: "$",
    BIF: "FBu",
    CDF: "FC",
    TZS: "TSh"
  };

  // Close currency dropdown when clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const handleCurrencySelect = (curr) => {
    setCurrency(curr);
    setCurrencyOpen(false);
  };

  return (
    <header className="w-full flex justify-between items-center px-3 sm:px-4 lg:px-6 py-3 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      {/* Logo */}
      <div 
        className="flex items-center cursor-pointer group flex-shrink-0"
        onClick={() => navigate("/")}
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform group-hover:scale-105">
          <Logo className="w-full h-full text-[#BC8BBC]" />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
        {/* Currency Selector - Responsive Design */}
        {showCurrency && (
          <div className="relative" ref={currencyRef}>
            {/* Desktop: Horizontal buttons */}
            <div className="hidden md:flex items-center space-x-1 bg-gray-800 rounded-lg p-1 border border-gray-600">
              {["RWF", "USD", "BIF", "CDF", "TZS"].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    currency === curr
                      ? 'bg-[#BC8BBC] text-white shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Mobile & Tablet: Dropdown */}
            <div className="md:hidden">
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg border border-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-opacity-50"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{currency}</span>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-200 ${
                    currencyOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Currency Dropdown Menu */}
              {currencyOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
                  <div className="p-2 border-b border-gray-700">
                    <p className="text-gray-400 text-xs font-medium px-2 py-1">
                      {t('subscriptionPage.selectCurrency', 'Select Currency')}
                    </p>
                  </div>
                  <div className="p-1">
                    {["RWF", "USD", "BIF", "CDF", "TZS"].map((curr) => (
                      <button
                        key={curr}
                        onClick={() => handleCurrencySelect(curr)}
                        className={`w-full flex items-center justify-between px-3 py-3 text-sm rounded-lg transition-all duration-200 ${
                          currency === curr
                            ? 'bg-[#BC8BBC] text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span>{curr}</span>
                        <span className="text-xs opacity-80">
                          {currencySymbols[curr]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Profile Menu */}
        <div className="flex-shrink-0">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default SubscriptionHeader;