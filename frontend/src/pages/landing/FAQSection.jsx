import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import EmailInput from "./EmailInput";
import ContactSupport from "../../components/subscription/HelpSupport";
import api from "../../api/axios"; 
import { useTranslation } from "react-i18next";

const FAQSection = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: "support@oliviuus.com",
    phone: "+250 788 880 266"
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(true);

  // Fetch contact info from server (same as ContactSupport component)
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await api.get('/contact/info');
        if (response.data.success) {
          setContactInfo(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setLoadingContactInfo(false);
      }
    };

    fetchContactInfo();
  }, []);

  const faqKeys = [
    "difference",
    "cost",
    "multipleDevices",
    "rwandanContent",
    "changeSubscription",
    "paymentMethods",
    "downloadOffline",
    "outsideRwanda",
    "videoQuality",
    "supportFilmmakers"
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleEmailSubmit = (email) => {
    // Handle email submission for FAQ section
    console.log("FAQ email submission:", email);
  };

  const handleContactToggle = () => {
    setShowContact(!showContact);
    setShowContactForm(false);
  };

  const handleContactFormToggle = () => {
    setShowContactForm(!showContactForm);
    setShowContact(false);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-black to-gray-900 border-t-8 border-[#BC8BBC]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            {t("landingPage.faq.title")} <span className="text-gradient-enhanced">{t("landingPage.faq.titleHighlight")}</span>
          </h2>
          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto">
            {t("landingPage.faq.subtitle")}
          </p>
        </div>
        
        {/* Enhanced FAQ Accordion */}
        <div className="space-y-3 mb-12">
          {faqKeys.map((key, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-gray-900/50 to-black/70 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-600/50"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center text-white font-semibold hover:bg-gray-800/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-opacity-50"
              >
                <span className="text-lg md:text-xl pr-4 text-left">
                  {t(`landingPage.faq.questions.${key}.question`)}
                </span>
                <div className="flex-shrink-0">
                  {activeIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-[#BC8BBC]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#BC8BBC]" />
                  )}
                </div>
              </button>
              
              {activeIndex === index && (
                <div className="px-6 pb-5 border-t border-gray-700/50">
                  <p className="text-gray-300 leading-relaxed pt-4 text-base md:text-lg">
                    {t(`landingPage.faq.questions.${key}.answer`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 border border-[#BC8BBC]/20 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              {t("landingPage.faq.ctaTitle")}
            </h3>
            <p className="text-gray-300 text-base mb-6">
              {t("landingPage.faq.ctaDescription")}
            </p>
            <EmailInput onSubmit={handleEmailSubmit} isLoading={false} />
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleContactToggle}
              className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-[#a87aa8] hover:to-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              {showContact ? t("landingPage.faq.closeContact") : t("landingPage.faq.contactSupport")}
            </button>
            
            <button
              onClick={handleContactFormToggle}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
            >
              {showContactForm ? t("landingPage.faq.closeForm") : t("landingPage.faq.directMessage")}
            </button>
            
            <Link
              to="/help"
              className="border-2 border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {t("landingPage.faq.visitHelpCenter")}
            </Link>
          </div>

          {/* Contact Options Toggle */}
          {showContact && (
            <div className="mt-8 bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-sm border border-[#BC8BBC]/30 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-white">
                  {t("landingPage.faq.contactTeam")}
                </h4>
                <button
                  onClick={handleContactToggle}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-300 mb-6 text-center">
                {t("landingPage.faq.contactDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="bg-[#BC8BBC] hover:bg-[#a87aa8] text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
                >
                  {loadingContactInfo ? t("landingPage.faq.loading") : t("landingPage.faq.emailSupport", { email: contactInfo.email })}
                </a>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="border-2 border-[#BC8BBC] text-[#BC8BBC] hover:bg-[#BC8BBC] hover:text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
                >
                  {loadingContactInfo ? t("landingPage.faq.loading") : t("landingPage.faq.callSupport", { phone: contactInfo.phone })}
                </a>
              </div>
            </div>
          )}

          {/* Contact Form Toggle */}
          {showContactForm && (
            <div className="mt-8 bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-sm border border-[#BC8BBC]/30 rounded-xl p-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-white">
                  {t("landingPage.faq.sendMessageTitle")}
                </h4>
                <button
                  onClick={handleContactFormToggle}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-300 mb-6 text-center">
                {t("landingPage.faq.sendMessageDescription")}
              </p>
              <ContactSupport 
                compact={true}
                showSupportMethods={false}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;