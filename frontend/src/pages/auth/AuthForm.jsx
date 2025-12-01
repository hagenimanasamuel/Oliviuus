import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CryptoJS from "crypto-js";

import EmailStep from "./EmailStep";
import CodeStep from "./CodeStep";
import PasswordStep from "./PasswordStep";
import UserInfoStep from "./UserInfoStep";
import Logo from "../../components/Logo";
import Footer from "../../components/Footer";

// Load secret from .env
const SECRET_KEY = import.meta.env.VITE_EMAIL_STATE_SECRET;

// Utility functions
const encodeState = (data) => {
  const str = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  return encodeURIComponent(encrypted);
};

const decodeState = (hash) => {
  if (!hash) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(hash), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
};

const AuthForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const params = new URLSearchParams(location.search);
  const savedState = decodeState(params.get("state")) || {};

  const [step, setStep] = useState(savedState.step || "email"); // "email" | "code" | "password" | "userInfo"
  const [email, setEmail] = useState(savedState.email || "");
  const [isExistingUser, setIsExistingUser] = useState(savedState.isExistingUser || false);
  const [code, setCode] = useState(savedState.code || "");
  const [password, setPassword] = useState(savedState.password || "");
  const [loading, setLoading] = useState(false);

  // Get current language
  const currentLang = i18n.language;

  // SEO content based on language and step
  const getSeoContent = () => {
    const baseContent = {
      en: {
        default: {
          title: "Sign In to Oliviuus - Stream Unlimited Entertainment",
          description: "Login to Oliviuus and access Rwandan movies, global content, and exclusive streaming. Start your journey today.",
          keywords: "Oliviuus login, sign up Oliviuus, streaming Rwanda, Rwandan movies, African streaming"
        },
        email: {
          title: "Enter Email - Oliviuus Authentication",
          description: "Enter your email to sign in or create a new Oliviuus account. Access unlimited streaming."
        },
        code: {
          title: "Verify Email - Oliviuus Authentication",
          description: "Enter verification code sent to your email to continue with Oliviuus account setup."
        },
        password: {
          title: "Enter Password - Oliviuus Authentication",
          description: "Enter your password to access your Oliviuus account and start streaming."
        },
        userInfo: {
          title: "Complete Profile - Oliviuus Registration",
          description: "Complete your Oliviuus profile setup to personalize your streaming experience."
        }
      },
      rw: {
        "default": {
          "title": "Injira kuri Oliviuus - Reba Imyidagaduro Itagira Umupaka",
          "description": "Injira kuri Oliviuus ubone filime nyarwanda, ibirimo by’isi, n’iyindi streaming yihariye. Tangira urugendo rwawe uyu munsi.",
          "keywords": "Oliviuus login, kwiyandikisha Oliviuus, streaming Rwanda, filime nyarwanda, streaming Afurika"
        },
        "email": {
          "title": "Andika Email - Kwemeza Oliviuus",
          "description": "Andika email yawe winjire cyangwa wiyandikishe kuri Oliviuus. Fata amahirwe yo kureba nta nkomyi."
        },
        "code": {
          "title": "Emeza Email - Kwemeza Oliviuus",
          "description": "Andika kode yo kwemeza yoherejwe kuri email yawe kugira ngo ukomeze gushiraho konti ya Oliviuus."
        },
        "password": {
          "title": "Andika Ijambo ry'Ibanga - Kwemeza Oliviuus",
          "description": "Andika ijambo ry’ibanga ryawe kugira ngo winjire muri konti ya Oliviuus utangire kureba."
        },
        "userInfo": {
          "title": "Zuza Profayili - Kwiyandikisha Oliviuus",
          "description": "Zuza profayili yawe kuri Oliviuus kugira ngo uhindure uburambe bwawe bwo kureba."
        }
      },
      fr: {
        "default": {
          "title": "Connectez-vous à Oliviuus - Streaming Illimité",
          "description": "Connectez-vous à Oliviuus et accédez aux films rwandais, contenus mondiaux et streaming exclusif. Commencez votre parcours aujourd’hui.",
          "keywords": "connexion Oliviuus, inscription Oliviuus, streaming Rwanda, films rwandais, streaming africain"
        },
        "email": {
          "title": "Entrez l’Email - Authentification Oliviuus",
          "description": "Entrez votre email pour vous connecter ou créer un nouveau compte Oliviuus. Accédez au streaming illimité."
        },
        "code": {
          "title": "Vérifiez Email - Authentification Oliviuus",
          "description": "Entrez le code de vérification envoyé à votre email pour continuer la configuration de votre compte Oliviuus."
        },
        "password": {
          "title": "Entrez le Mot de Passe - Authentification Oliviuus",
          "description": "Entrez votre mot de passe pour accéder à votre compte Oliviuus et commencer le streaming."
        },
        "userInfo": {
          "title": "Complétez le Profil - Inscription Oliviuus",
          "description": "Complétez votre profil Oliviuus pour personnaliser votre expérience de streaming."
        }
      },
      sw: {
        "default": {
          "title": "Ingia kwenye Oliviuus - Burudani Bila Kikomo",
          "description": "Ingia kwenye Oliviuus upate filamu za Rwanda, maudhui ya kimataifa, na streaming ya kipekee. Anza safari yako leo.",
          "keywords": "kuingia Oliviuus, jiandikishe Oliviuus, streaming Rwanda, filamu za Rwanda, streaming Afrika"
        },
        "email": {
          "title": "Andika Barua Pepe - Uthibitishaji Oliviuus",
          "description": "Andika barua pepe yako kuingia au kuunda akaunti mpya ya Oliviuus. Pata upatikanaji wa streaming bila kikomo."
        },
        "code": {
          "title": "Thibitisha Barua Pepe - Uthibitishaji Oliviuus",
          "description": "Andika nambari ya uthibitisho iliyotumwa kwenye barua pepe yako ili kuendelea na usanidi wa akaunti ya Oliviuus."
        },
        "password": {
          "title": "Andika Neno la Siri - Uthibitishaji Oliviuus",
          "description": "Andika neno lako la siri kufikia akaunti yako ya Oliviuus na kuanza kutazama."
        },
        "userInfo": {
          "title": "Kamilisha Profaili - Usajili Oliviuus",
          "description": "Kamilisha usanidi wa profaili yako ya Oliviuus kubinafsisha uzoefu wako wa kutazama."
        }
      }
    };

    const langContent = baseContent[currentLang] || baseContent.en;
    return langContent[step] || langContent.default;
  };

  // Update URL state
  const updateUrlState = (newState) => {
    const merged = { ...savedState, ...newState };
    const hash = encodeState(merged);
    navigate(`/auth?state=${hash}`, { replace: true });
  };

  // Handle email submission
  const handleEmailSubmit = ({ email: enteredEmail, isExistingUser }) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail(enteredEmail);
      setIsExistingUser(isExistingUser);
      const nextStep = isExistingUser ? "password" : "code";
      setStep(nextStep);
      updateUrlState({ step: nextStep, email: enteredEmail, isExistingUser });
    }, 400);
  };

  // Handle code verification submission
  const handleCodeSubmit = (enteredCode) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCode(enteredCode);
      setStep("userInfo");
      updateUrlState({ step: "userInfo", code: enteredCode });
    }, 400);
  };

  // Handle password submission
  const handlePasswordSubmit = (enteredPassword) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPassword(enteredPassword);
      updateUrlState({ password: enteredPassword });
      console.log("Password submitted:", enteredPassword, "for email:", email);
    }, 400);
  };

  // Handle editing email from code step
  const handleEditEmail = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("email");
      updateUrlState({ step: "email" });
    }, 400);
  };

  const seoContent = getSeoContent();

  return (
    <>
      <Helmet>
        {/* Dynamic title based on step and language */}
        <title>{seoContent.title}</title>
        <meta name="description" content={seoContent.description} />
        {seoContent.keywords && <meta name="keywords" content={seoContent.keywords} />}

        {/* Language meta */}
        <meta httpEquiv="Content-Language" content={currentLang} />

        {/* ALLOW INDEXING - Removed noindex, nofollow */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content={seoContent.title} />
        <meta property="og:description" content={seoContent.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://oliviuus.com/auth`} />
        <meta property="og:site_name" content="Oliviuus" />
        <meta property="og:locale" content={currentLang} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@oliviuus_rw" />
        <meta name="twitter:title" content={seoContent.title} />
        <meta name="twitter:description" content={seoContent.description} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://oliviuus.com/auth`} />

        {/* Language alternates */}
        <link rel="alternate" href="https://oliviuus.com/auth" hreflang="x-default" />
        <link rel="alternate" href="https://oliviuus.com/rw/auth" hreflang="rw" />
        <link rel="alternate" href="https://oliviuus.com/en/auth" hreflang="en" />
        <link rel="alternate" href="https://oliviuus.com/fr/auth" hreflang="fr" />
        <link rel="alternate" href="https://oliviuus.com/sw/auth" hreflang="sw" />

        {/* Structured Data for Sign In Action */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": seoContent.title,
            "description": seoContent.description,
            "url": "https://oliviuus.com/auth",
            "inLanguage": currentLang,
            "isPartOf": {
              "@type": "WebSite",
              "name": "Oliviuus",
              "url": "https://oliviuus.com",
              "description": "Streaming platform for Rwandan and international content",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://oliviuus.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://oliviuus.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Sign In",
                  "item": "https://oliviuus.com/auth"
                }
              ]
            }
          })}
        </script>

        {/* Additional structured data for authentication page */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AuthenticationPage",
            "name": "Oliviuus Authentication",
            "description": "Sign in or create an account to access Oliviuus streaming service",
            "url": "https://oliviuus.com/auth",
            "inLanguage": currentLang,
            "mainEntity": {
              "@type": "Action",
              "name": "SignIn",
              "description": "Sign in to Oliviuus account",
              "url": "https://oliviuus.com/auth"
            }
          })}
        </script>
      </Helmet>

      <div className="flex flex-col min-h-screen bg-[#121212] text-white">
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-10">
          <Logo />

          <div className="w-full max-w-md mt-8 bg-[#1f1f1f] p-6 rounded-xl shadow-lg relative">
            {/* Loader for all steps */}
            {loading && (
              <div className="absolute top-0 left-0 w-full h-1 overflow-hidden rounded-t-md bg-[#BC8BBC]">
                <div
                  className="h-full bg-white"
                  style={{
                    width: "30%",
                    animation: "moveRight 1s linear infinite",
                  }}
                />
              </div>
            )}

            {step === "email" && <EmailStep onSubmit={handleEmailSubmit} />}
            {step === "code" && (
              <CodeStep
                email={email}
                onSubmit={handleCodeSubmit}
                onEditEmail={handleEditEmail}
              />
            )}
            {step === "password" && (
              <PasswordStep
                email={email}
                isExistingUser={isExistingUser}
                onSubmit={handlePasswordSubmit}
              />
            )}
            {step === "userInfo" && (
              <UserInfoStep
                onSubmit={(userData) => {
                  console.log("User info submitted:", userData);
                }}
              />
            )}
          </div>
        </div>

        <Footer />

        {/* Loader animation keyframes */}
        <style>
          {`
            @keyframes moveRight {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(200%); }
              100% { transform: translateX(-100%); }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default AuthForm;