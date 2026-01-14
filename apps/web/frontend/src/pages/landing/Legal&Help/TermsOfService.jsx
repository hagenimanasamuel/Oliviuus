import React from "react";
import { Helmet } from "react-helmet";
import { useTranslation, Trans } from "react-i18next";
import Header from "../Header.jsx";
import Footer from "../../../components/Footer";
import { LEGAL_DATES } from "../../../constants/legal";

const TermsOfService = () => {
  const { t } = useTranslation();
  const lastUpdatedDate = LEGAL_DATES.TERMS_LAST_UPDATED;

  // SEO meta data
  const seoTitle = t("termsOfService.seo.title");
  const seoDescription = t("termsOfService.seo.description");
  const seoKeywords = t("termsOfService.seo.keywords");

  // Helper function to safely get translated arrays
  const getTranslatedArray = (key) => {
    const result = t(key, { returnObjects: true });
    return Array.isArray(result) ? result : [];
  };

  // Helper function to safely get translated objects
  const getTranslatedObject = (key) => {
    const result = t(key, { returnObjects: true });
    return typeof result === 'object' && result !== null ? result : {};
  };

  // Get FAQ sections from translations
  const getSections = () => {
    const sections = getTranslatedObject("termsOfService.sections");
    return {
      eligibility: sections.eligibility || {},
      accountRegistration: sections.accountRegistration || {},
      freeTrial: sections.freeTrial || {},
      subscriptionsPayments: sections.subscriptionsPayments || {},
      contentUsageRules: sections.contentUsageRules || {},
      intellectualProperty: sections.intellectualProperty || {},
      thirdPartyIntegrations: sections.thirdPartyIntegrations || {},
      termination: sections.termination || {},
      serviceAvailability: sections.serviceAvailability || {},
      disclaimer: sections.disclaimer || {},
      limitationOfLiability: sections.limitationOfLiability || {},
      changesToTerms: sections.changesToTerms || {},
      contactInformation: sections.contactInformation || {}
    };
  };

  const sections = getSections();

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:locale" content={document.documentElement.lang || 'en'} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* Schema.org markup for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": seoTitle,
            "description": seoDescription,
            "publisher": {
              "@type": "Organization",
              "name": "Oliviuus",
              "url": "https://oliviuus.com"
            },
            "dateModified": lastUpdatedDate,
            "inLanguage": document.documentElement.lang || 'en'
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" lang={document.documentElement.lang}>
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">
                {t("termsOfService.title")}
              </h1>
              <p className="text-gray-400">
                {t("termsOfService.lastUpdated")}: {lastUpdatedDate}
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto mt-6"></div>
            </div>

            {/* Introduction */}
            <div className="mb-10 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-lg">
                {t("termsOfService.welcome")}
              </p>
              <p className="mt-4 text-lg font-medium text-[#BC8BBC]">
                {t("termsOfService.agreementNotice")}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {/* Eligibility */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    1
                  </span>
                  {sections.eligibility.title || t("termsOfService.sections.eligibility.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.eligibility.description || t("termsOfService.sections.eligibility.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.eligibility.points").map((point, index) => (
                      <li key={`eligibility-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Account Registration */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    2
                  </span>
                  {sections.accountRegistration.title || t("termsOfService.sections.accountRegistration.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.accountRegistration.description || t("termsOfService.sections.accountRegistration.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.accountRegistration.points1").map((point, index) => (
                      <li key={`account-reg-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <p className="pt-4">{sections.accountRegistration.separator || t("termsOfService.sections.accountRegistration.separator")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.accountRegistration.points2").map((point, index) => (
                      <li key={`account-not-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Free Trial */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    3
                  </span>
                  {sections.freeTrial.title || t("termsOfService.sections.freeTrial.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.freeTrial.description || t("termsOfService.sections.freeTrial.description")}</p>
                  <p>{sections.freeTrial.duringTrial || t("termsOfService.sections.freeTrial.duringTrial")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.freeTrial.points").map((point, index) => (
                      <li key={`trial-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <p className="pt-4 font-medium text-[#BC8BBC]">
                    {sections.freeTrial.warning || t("termsOfService.sections.freeTrial.warning")}
                  </p>
                </div>
              </section>

              {/* Subscriptions & Payments */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    4
                  </span>
                  {sections.subscriptionsPayments.title || t("termsOfService.sections.subscriptionsPayments.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.subscriptionsPayments.description || t("termsOfService.sections.subscriptionsPayments.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.subscriptionsPayments.points").map((point, index) => (
                      <li key={`subscription-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Content & Usage Rules */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    5
                  </span>
                  {sections.contentUsageRules.title || t("termsOfService.sections.contentUsageRules.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.contentUsageRules.description || t("termsOfService.sections.contentUsageRules.description")}</p>
                  <p>{sections.contentUsageRules.notAllowed || t("termsOfService.sections.contentUsageRules.notAllowed")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.contentUsageRules.points").map((point, index) => (
                      <li key={`content-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <p className="pt-4">{sections.contentUsageRules.deviceLimit || t("termsOfService.sections.contentUsageRules.deviceLimit")}</p>
                </div>
              </section>

              {/* Intellectual Property */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    6
                  </span>
                  {sections.intellectualProperty.title || t("termsOfService.sections.intellectualProperty.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.intellectualProperty.description || t("termsOfService.sections.intellectualProperty.description")}</p>
                  <p>{sections.intellectualProperty.notAllowed || t("termsOfService.sections.intellectualProperty.notAllowed")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.intellectualProperty.points").map((point, index) => (
                      <li key={`ip-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Third-Party Integrations */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    7
                  </span>
                  {sections.thirdPartyIntegrations.title || t("termsOfService.sections.thirdPartyIntegrations.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.thirdPartyIntegrations.description || t("termsOfService.sections.thirdPartyIntegrations.description")}</p>
                  <p>{sections.thirdPartyIntegrations.notResponsible || t("termsOfService.sections.thirdPartyIntegrations.notResponsible")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.thirdPartyIntegrations.points").map((point, index) => (
                      <li key={`third-party-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Termination */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    8
                  </span>
                  {sections.termination.title || t("termsOfService.sections.termination.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.termination.description || t("termsOfService.sections.termination.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.termination.points").map((point, index) => (
                      <li key={`termination-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <p className="pt-4">{sections.termination.userRight || t("termsOfService.sections.termination.userRight")}</p>
                </div>
              </section>

              {/* Service Availability */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    9
                  </span>
                  {sections.serviceAvailability.title || t("termsOfService.sections.serviceAvailability.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.serviceAvailability.description || t("termsOfService.sections.serviceAvailability.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.serviceAvailability.points").map((point, index) => (
                      <li key={`availability-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Disclaimer */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    10
                  </span>
                  {sections.disclaimer.title || t("termsOfService.sections.disclaimer.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.disclaimer.description || t("termsOfService.sections.disclaimer.description")}</p>
                  <p>{sections.disclaimer.notGuarantee || t("termsOfService.sections.disclaimer.notGuarantee")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.disclaimer.points").map((point, index) => (
                      <li key={`disclaimer-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    11
                  </span>
                  {sections.limitationOfLiability.title || t("termsOfService.sections.limitationOfLiability.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.limitationOfLiability.description || t("termsOfService.sections.limitationOfLiability.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {getTranslatedArray("termsOfService.sections.limitationOfLiability.points").map((point, index) => (
                      <li key={`liability-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Changes to Terms */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    12
                  </span>
                  {sections.changesToTerms.title || t("termsOfService.sections.changesToTerms.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.changesToTerms.description || t("termsOfService.sections.changesToTerms.description")}</p>
                  <p className="font-medium text-[#BC8BBC]">
                    {sections.changesToTerms.continuation || t("termsOfService.sections.changesToTerms.continuation")}
                  </p>
                </div>
              </section>

              {/* Contact Information */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    13
                  </span>
                  {sections.contactInformation.title || t("termsOfService.sections.contactInformation.title")}
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>{sections.contactInformation.description || t("termsOfService.sections.contactInformation.description")}</p>
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                    <p className="flex items-center mb-2">
                      <span className="text-[#BC8BBC] mr-3">📧</span>
                      <a 
                        href="mailto:oliviuusteam@gmail.com" 
                        className="hover:text-[#BC8BBC] transition-colors"
                      >
                        {sections.contactInformation.email || t("termsOfService.sections.contactInformation.email")}
                      </a>
                    </p>
                    <p className="flex items-center">
                      <span className="text-[#BC8BBC] mr-3">📍</span>
                      {sections.contactInformation.location || t("termsOfService.sections.contactInformation.location")}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>
                {t("termsOfService.footer", { date: lastUpdatedDate })}
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsOfService;