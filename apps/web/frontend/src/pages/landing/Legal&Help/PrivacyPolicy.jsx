import React from "react";
import { Helmet } from "react-helmet";
import { useTranslation, Trans } from "react-i18next";
import Header from "../Header.jsx";
import Footer from "../../../components/Footer";
import { LEGAL_DATES } from "../../../constants/legal";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const lastUpdatedDate = LEGAL_DATES.PRIVACY_LAST_UPDATED;

  // SEO meta data
  const seoTitle = t("privacyPolicy.seo.title");
  const seoDescription = t("privacyPolicy.seo.description");
  const seoKeywords = t("privacyPolicy.seo.keywords");

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
              "url": "https://oliviuus.com",
              "foundingDate": "2024",
              "founder": {
                "@type": "Person",
                "name": "Oliviuus Team"
              }
            },
            "about": {
              "@type": "Thing",
              "name": "Privacy Policy"
            },
            "dateModified": lastUpdatedDate,
            "inLanguage": document.documentElement.lang || 'en',
            "potentialAction": {
              "@type": "ReadAction",
              "target": window.location.href
            }
          })}
        </script>

        {/* Additional privacy-related meta tags */}
        <meta name="robots" content="index, follow" />
        <meta name="revisit-after" content="7 days" />
        <meta name="language" content={document.documentElement.lang || 'English'} />
        <meta name="author" content="Oliviuus Streaming Platform" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white" lang={document.documentElement.lang}>
        <Header />

        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">
                {t("privacyPolicy.title")}
              </h1>
              <p className="text-gray-400">
                {t("privacyPolicy.lastUpdated")}: {lastUpdatedDate}
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto mt-6"></div>
            </div>

            {/* Introduction */}
            <div className="mb-10 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
              <p className="text-lg">
                {t("privacyPolicy.introduction")}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              {/* Section 1: Information We Collect */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    1
                  </span>
                  {t("privacyPolicy.sections.informationWeCollect.title")}
                </h2>

                <div className="space-y-6 text-gray-300">
                  {/* Information you provide */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#BC8BBC]">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.informationYouProvide.title")}
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.informationYouProvide.points", { returnObjects: true }).map((point, index) => (
                        <li key={`provided-info-${index}`}>{point}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-gray-400 italic">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.informationYouProvide.note")}
                    </p>
                  </div>

                  {/* Information collected automatically */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#BC8BBC]">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.informationCollectedAutomatically.title")}
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.informationCollectedAutomatically.points", { returnObjects: true }).map((point, index) => (
                        <li key={`auto-collected-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Cookies & Tracking */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#BC8BBC]">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.cookiesTracking.title")}
                    </h3>
                    <p>{t("privacyPolicy.sections.informationWeCollect.subsections.cookiesTracking.description")}</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      {t("privacyPolicy.sections.informationWeCollect.subsections.cookiesTracking.points", { returnObjects: true }).map((point, index) => (
                        <li key={`cookies-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2: How We Use Your Information */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    2
                  </span>
                  {t("privacyPolicy.sections.howWeUseYourInformation.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <p>{t("privacyPolicy.sections.howWeUseYourInformation.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {t("privacyPolicy.sections.howWeUseYourInformation.points", { returnObjects: true }).map((point, index) => (
                      <li key={`usage-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <p className="mt-4 font-medium text-[#BC8BBC]">
                    {t("privacyPolicy.sections.howWeUseYourInformation.importantNote")}
                  </p>
                </div>
              </section>

              {/* Section 3: Sharing Your Information */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    3
                  </span>
                  {t("privacyPolicy.sections.sharingYourInformation.title")}
                </h2>

                <div className="space-y-6 text-gray-300">
                  {/* Service providers */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#BC8BBC]">
                      {t("privacyPolicy.sections.sharingYourInformation.subsections.serviceProviders.title")}
                    </h3>
                    <ul className="list-disc pl-6 space-y-2">
                      {t("privacyPolicy.sections.sharingYourInformation.subsections.serviceProviders.points", { returnObjects: true }).map((point, index) => (
                        <li key={`service-provider-${index}`}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Legal requirements */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-[#BC8BBC]">
                      {t("privacyPolicy.sections.sharingYourInformation.subsections.legalRequirements.title")}
                    </h3>
                    <p>{t("privacyPolicy.sections.sharingYourInformation.subsections.legalRequirements.description")}</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      {t("privacyPolicy.sections.sharingYourInformation.subsections.legalRequirements.points", { returnObjects: true }).map((point, index) => (
                        <li key={`legal-${index}`}>{point}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-gray-400">
                      {t("privacyPolicy.sections.sharingYourInformation.subsections.legalRequirements.note")}
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4: Data Storage & Security */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    4
                  </span>
                  {t("privacyPolicy.sections.dataStorageSecurity.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <p>{t("privacyPolicy.sections.dataStorageSecurity.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {t("privacyPolicy.sections.dataStorageSecurity.points", { returnObjects: true }).map((point, index) => (
                      <li key={`security-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <p className="mt-4">
                    {t("privacyPolicy.sections.dataStorageSecurity.warning")}
                  </p>
                  <p className="font-medium text-[#BC8BBC]">
                    {t("privacyPolicy.sections.dataStorageSecurity.recommendation")}
                  </p>
                </div>
              </section>

              {/* Section 5: Your Rights */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    5
                  </span>
                  {t("privacyPolicy.sections.yourRights.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <p>{t("privacyPolicy.sections.yourRights.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {t("privacyPolicy.sections.yourRights.points", { returnObjects: true }).map((point, index) => (
                      <li key={`rights-${index}`}>{point}</li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                    <p className="font-medium">{t("privacyPolicy.sections.yourRights.requestTitle")}</p>
                    <a
                      href={`mailto:${t("privacyPolicy.sections.yourRights.email")}`}
                      className="text-[#BC8BBC] hover:text-purple-400 transition-colors"
                    >
                      {t("privacyPolicy.sections.yourRights.email")}
                    </a>
                  </div>
                </div>
              </section>

              {/* Section 6: Data Retention */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    6
                  </span>
                  {t("privacyPolicy.sections.dataRetention.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <p>{t("privacyPolicy.sections.dataRetention.description")}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    {t("privacyPolicy.sections.dataRetention.points", { returnObjects: true }).map((point, index) => (
                      <li key={`retention-${index}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Section 7: Children's Privacy */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    7
                  </span>
                  {t("privacyPolicy.sections.childrensPrivacy.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <p>{t("privacyPolicy.sections.childrensPrivacy.description1")}</p>
                  <p>{t("privacyPolicy.sections.childrensPrivacy.description2")}</p>
                </div>
              </section>

              {/* Section 8: Changes to Policy */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    8
                  </span>
                  {t("privacyPolicy.sections.changesToPolicy.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <p>{t("privacyPolicy.sections.changesToPolicy.description")}</p>
                  <p className="font-medium text-[#BC8BBC]">
                    {t("privacyPolicy.sections.changesToPolicy.notification")}
                  </p>
                </div>
              </section>

              {/* Section 9: Contact Information */}
              <section className="bg-gray-900/30 rounded-xl p-6 border border-gray-800 hover:border-[#BC8BBC]/30 transition-all duration-300">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center">
                  <span className="bg-gradient-to-r from-[#BC8BBC] to-purple-600 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                    9
                  </span>
                  {t("privacyPolicy.sections.contactInformation.title")}
                </h2>

                <div className="space-y-4 text-gray-300">
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
                    <p className="flex items-center mb-2">
                      <span className="text-[#BC8BBC] mr-3">📧</span>
                      <a
                        href={`mailto:${t("privacyPolicy.sections.contactInformation.email")}`}
                        className="hover:text-[#BC8BBC] transition-colors"
                      >
                        {t("privacyPolicy.sections.contactInformation.email")}
                      </a>
                    </p>
                    <p className="flex items-center">
                      <span className="text-[#BC8BBC] mr-3">📍</span>
                      {t("privacyPolicy.sections.contactInformation.location")}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <p className="mt-2 text-sm">
              {t("privacyPolicy.footer.effectiveDate", { date: lastUpdatedDate })}
            </p>
          </div>
        </main>

        {/* Breadcrumb for SEO */}
        <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-400">
            <li>
              <a href="/" className="hover:text-[#BC8BBC] transition-colors">
                {t("common.home")}
              </a>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-[#BC8BBC]">
              {t("privacyPolicy.title")}
            </li>
          </ol>
        </nav>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;