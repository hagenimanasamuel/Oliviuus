import React from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import Header from "./landing/Header.jsx";
import HeroSection from "./landing/HeroSection";
import TrendingSection from "./landing/TrendingSection";
import FeaturesSection from "./landing/FeaturesSection";
import FAQSection from "./landing/FAQSection";
import Footer from "../components/Footer";
import "./landingpage.css";

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;

  // SEO content based on language
  const seoContent = {
    en: {
      title: "Oliviuus - Unlimited Entertainment | African Stories on Global Stage",
      description: "Stream Rwandan movies, & international content. Affordable plans from RWF 3,000. Start your free trial today!",
      keywords: "streaming Rwanda, Rwandan movies, African cinema, Netflix Rwanda alternative, online movies Rwanda, Kigali streaming, Musanze streaming",
      ogTitle: "Oliviuus: Where African Stories Meet Global Stage",
      ogDescription: "Experience unlimited entertainment with exclusive Rwandan content and global hits. Starting at RWF 3,000/month."
    },
    rw: {
      "title": "Oliviuus - Imyidagaduro itagira umupaka | Inkuru z’Abanyafurika ku Isi Hose",
      "description": "Reba filime nyarwanda n’iz’amahanga. Paketi ku giciro cyiza kuva kuri RWF 3,000. Tangira igerageza ryawe rya ubuntu uyumunsi!",
      "keywords": "streaming Rwanda, filime nyarwanda, sinema nyarwanda, uburyo bwa Netflix mu Rwanda, filime kuri internet Rwanda, Kigali streaming, Musanze streaming",
      "ogTitle": "Oliviuus: Aho Inkuru z’Abanyafurika Zihurira n’Isi",
      "ogDescription": "Wiyumvemo ibidagijwe bitagira umupaka n’ibiganiro byihariye nyarwanda n’iby’isi. Uhereye kuri RWF 3,000 ku kwezi."
    },
    fr: {
      "title": "Oliviuus - Divertissement Illimité | Histoires Africaines sur la Scène Mondiale",
      "description": "Regardez des films rwandais et du contenu international. Abonnement dès 3 000 RWF. Commencez votre essai gratuit aujourd’hui !",
      "keywords": "streaming Rwanda, films rwandais, cinéma africain, alternative Netflix Rwanda, films en ligne Rwanda, streaming Kigali, streaming Musanze",
      "ogTitle": "Oliviuus : Là où les Histoires Africaines rencontrent le Monde",
      "ogDescription": "Découvrez un divertissement illimité avec du contenu rwandais exclusif et des succès mondiaux. À partir de 3 000 RWF/mois."
    },
    sw: {
      "title": "Oliviuus - Burudani Bila Kikomo | Hadithi za Kiafrika kwenye Jukwaa la Dunia",
      "description": "Tazama filamu za Rwanda na maudhui ya kimataifa. Vifurushi nafuu kuanzia RWF 3,000. Anza jaribio lako la bure leo!",
      "keywords": "streaming Rwanda, filamu za Rwanda, sinema ya Afrika, mbadala wa Netflix Rwanda, filamu mtandaoni Rwanda, streaming Kigali, streaming Musanze",
      "ogTitle": "Oliviuus: Ambapo Hadithi za Kiafrika Hukutana na Dunia",
      "ogDescription": "Furahia burudani isiyo na kikomo yenye maudhui ya kipekee ya Rwanda na vipindi bora vya kimataifa. Kuanzia RWF 3,000 kwa mwezi."
    }
  };

  // Get SEO content based on current language
  const currentSeo = seoContent[currentLang] || seoContent.en;

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{currentSeo.title}</title>
        <meta name="description" content={currentSeo.description} />
        <meta name="keywords" content={currentSeo.keywords} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content={currentLang} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://oliviuus.com/" />
        <meta property="og:title" content={currentSeo.ogTitle} />
        <meta property="og:description" content={currentSeo.ogDescription} />
        <meta property="og:image" content="https://oliviuus.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Oliviuus Streaming Platform" />
        <meta property="og:site_name" content="Oliviuus" />
        <meta property="og:locale" content={currentLang} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@oliviuus_rw" />
        <meta name="twitter:creator" content="@oliviuus_rw" />
        <meta name="twitter:title" content={currentSeo.ogTitle} />
        <meta name="twitter:description" content={currentSeo.ogDescription} />
        <meta name="twitter:image" content="https://oliviuus.com/twitter-image.jpg" />

        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="Oliviuus" />
        <meta name="copyright" content="Oliviuus" />

        {/* Geo tags for Rwanda/East Africa */}
        <meta name="geo.region" content="RW" />
        <meta name="geo.placename" content="Kigali, Rwanda" />
        <meta name="geo.position" content="-1.9441;30.0619" />
        <meta name="ICBM" content="-1.9441, 30.0619" />

        {/* Language Alternates */}
        <link rel="alternate" href="https://oliviuus.com/" hreflang="x-default" />
        <link rel="alternate" href="https://oliviuus.com/rw" hreflang="rw" />
        <link rel="alternate" href="https://oliviuus.com/en" hreflang="en" />
        <link rel="alternate" href="https://oliviuus.com/fr" hreflang="fr" />
        <link rel="alternate" href="https://oliviuus.com/sw" hreflang="sw" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://oliviuus.com/" />

        {/* Structured Data / JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Oliviuus",
            "url": "https://oliviuus.com",
            "logo": "https://oliviuus.com/logo.png",
            "description": currentSeo.description,
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "RW",
              "addressRegion": "Kigali",
              "addressLocality": "Kigali City"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "support@oliviuus.com",
              "availableLanguage": ["en", "rw", "fr", "sw"]
            },
            "sameAs": [
              "https://twitter.com/oliviuus_rw",
              "https://facebook.com/oliviuus",
              "https://instagram.com/oliviuusoriginal"
            ]
          })}
        </script>

        {/* Streaming Service Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "Oliviuus Streaming Platform",
            "description": currentSeo.description,
            "thumbnailUrl": "https://oliviuus.com/thumbnail.jpg",
            "uploadDate": "2024-01-01T00:00:00+00:00",
            "contentUrl": "https://oliviuus.com",
            "embedUrl": "https://oliviuus.com/embed",
            "interactionCount": "1000000",
            "regionsAllowed": "RW, KE, TZ, UG",
            "inLanguage": currentLang,
            "offers": {
              "@type": "Offer",
              "price": "3000",
              "priceCurrency": "RWF",
              "availability": "https://schema.org/InStock",
              "validFrom": "2024-01-01T00:00:00+00:00"
            }
          })}
        </script>

        {/* App Links */}
        <meta property="al:ios:url" content="oliviuus://" />
        <meta property="al:ios:app_store_id" content="123456789" />
        <meta property="al:ios:app_name" content="Oliviuus" />
        <meta property="al:android:url" content="oliviuus://" />
        <meta property="al:android:app_name" content="Oliviuus" />
        <meta property="al:android:package" content="com.oliviuus.app" />
        <meta property="al:web:url" content="https://oliviuus.com" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <Header />

        <main>
          <HeroSection />
          <TrendingSection />
          <FeaturesSection />
          <FAQSection />
        </main>

        <Footer />
      </div>
    </>
  );
}