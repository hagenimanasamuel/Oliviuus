import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CryptoJS from "crypto-js";
import api from "../../api/axios";

// Add Google OAuth provider
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';


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
  const googleButtonRef = useRef(null);

  // Get current language
  const currentLang = i18n.language;

  // Handle Google Sign-In Success - USING YOUR API INSTANCE
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    
    try {
      // Use your api instance like EmailStep does
      const response = await api.post("/auth/google", { 
        token: credentialResponse.credential 
      });

      if (response.data && response.data.success) {
        // Handle successful login
        // Simple redirect - will trigger AuthContext to detect user
        window.location.href = '/';
      } else {
        throw new Error(response.data?.error || 'Google authentication failed');
      }
    } catch (error) {
      alert(error.message || "Please try again or use email login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    alert("Google login failed. Please try again or use email login.");
  };

  // Professional Google One-Tap Login (like LinkedIn)
  useGoogleOneTapLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    disabled: step !== "email", // Only show on email step
    promptMomentNotification: (notification) => {
      // You can customize the display moment
      if (notification.getNotDisplayedReason() === 'opt_out_or_no_session') {
        // User opted out or no session, don't show One-Tap
      }
    },
    cancel_on_tap_outside: true,
  });

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
          "description": "Injira kuri Oliviuus ubone filime nyarwanda, ibirimo by'isi, n'iyindi streaming yihariye. Tangira urugendo rwawe uyu munsi.",
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
          "description": "Andika ijambo ry'ibanga ryawe kugira ngo winjire muri konti ya Oliviuus utangire kureba."
        },
        "userInfo": {
          "title": "Zuza Profayili - Kwiyandikisha Oliviuus",
          "description": "Zuza profayili yawe kuri Oliviuus kugira ngo uhindure uburambe bwawe bwo kureba."
        }
      },
      fr: {
        "default": {
          "title": "Connectez-vous à Oliviuus - Streaming Illimité",
          "description": "Connectez-vous à Oliviuus et accédez aux films rwandais, contenus mondiaux et streaming exclusif. Commencez votre parcours aujourd'hui.",
          "keywords": "connexion Oliviuus, inscription Oliviuus, streaming Rwanda, films rwandais, streaming africain"
        },
        "email": {
          "title": "Entrez l'Email - Authentification Oliviuus",
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

            {/* Add Google Sign-In button only on email step */}
            {step === "email" && (
              <>
                <div className="mb-6" ref={googleButtonRef}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false} // We're using One-Tap separately
                    theme="filled_blue"
                    shape="rectangular"
                    size="large"
                    text="signin_with"
                    logo_alignment="left"
                    width="100%"
                    locale={currentLang}
                    ux_mode="popup"
                  />
                </div>
                
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1f1f1f] text-gray-400">
                      {t("auth.or_continue_with_email", "Or continue with email")}
                    </span>
                  </div>
                </div>
              </>
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