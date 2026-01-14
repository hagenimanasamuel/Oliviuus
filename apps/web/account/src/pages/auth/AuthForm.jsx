import React, { useState, useCallback, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";
import api from "../../api/axios.js";

// Google OAuth
import { useGoogleOneTapLogin } from '@react-oauth/google';

// Components
import Logo from "../../components/Logo";
import EmailStep from "./EmailStep";
import CodeStep from "./CodeStep";
import PasswordStep from "./PasswordStep";
import UserNameStep from "./UserNameStep";
import UserPasswordStep from "./UserPasswordStep";
import CustomNameStep from "./CustomNameStep";
import CustomDobGenderStep from "./CustomDobGenderStep";
import CustomIdStep from "./CustomIdStep";
import CustomPasswordStep from "./CustomPasswordStep";
import EditableEmail from "../../components/auth/ui/EditableEmail.jsx";

// Utils
import { encodeState, decodeState, getRedirectUrl, generateGuestModeParam, decodeGuestModeParam } from "../../utils/authUtils";

const AuthForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const savedState = decodeState(params.get("state")) || {};
  const redirectUrl = getRedirectUrl(params);
  const guestModeParam = decodeGuestModeParam(params.get("guest"));

  // State management
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [identifierType, setIdentifierType] = useState("email");
  const [identifier, setIdentifier] = useState("");
  
  // Guest mode state (default false, from URL param if exists)
  const [guestMode, setGuestMode] = useState(guestModeParam.guestMode || false);

  // Custom Account State
  const [customAccountData, setCustomAccountData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    customId: "",
    password: "",
    confirmPassword: ""
  });

  // User Info Data for email/phone registration (2-step process)
  const [userInfoData, setUserInfoData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: ""
  });

  // Initialize from saved state on component mount
  useEffect(() => {
    if (savedState.step) {
      setStep(savedState.step);
    }
    if (savedState.email) {
      setEmail(savedState.email);
    }
    if (savedState.isExistingUser !== undefined) {
      setIsExistingUser(savedState.isExistingUser);
    }
    if (savedState.code) {
      setCode(savedState.code);
    }
    if (savedState.password) {
      setPassword(savedState.password);
    }
    if (savedState.identifierType) {
      setIdentifierType(savedState.identifierType);
    }
    if (savedState.identifier) {
      setIdentifier(savedState.identifier);
    }
    // Initialize custom account data
    if (savedState.customAccountData) {
      setCustomAccountData(savedState.customAccountData);
    }
    // Initialize user info data for email registration
    if (savedState.userInfoData) {
      setUserInfoData(savedState.userInfoData);
    }
  }, []); // Run only once on mount

  // Get current language
  const getCurrentLanguage = () => {
    try {
      const lang = localStorage.getItem("lang");
      return lang || "en";
    } catch {
      return "en";
    }
  };

  // Detect device theme
  useEffect(() => {
    const detectTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    };

    detectTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectTheme);

    return () => mediaQuery.removeEventListener('change', detectTheme);
  }, []);

  // SEO content
  const seoContent = {
    email: {
      title: guestMode ? "Sign in privately - Oliviuus Guest Mode" : "Sign in - Oliviuus",
      description: guestMode ? "Sign in to Oliviuus in guest mode. Your session will end when you close the browser." : "Sign in to your Oliviuus account to access premium content.",
    },
    code: {
      title: "Verify your email - Oliviuus",
      description: "Enter the verification code sent to your email.",
    },
    password: {
      title: "Enter your password - Oliviuus",
      description: "Enter your password to access your Oliviuus account.",
    },
    userName: {
      title: "Create your Oliviuus account - Enter Name",
      description: "Enter your name to create your Oliviuus account"
    },
    userPassword: {
      title: "Create your Oliviuus account - Set Password",
      description: "Set a secure password for your Oliviuus account"
    },
    customName: {
      title: "Create Oliviuus ID - Enter Name",
      description: "Enter your name to create your Oliviuus ID"
    },
    customDobGender: {
      title: "Create Oliviuus ID - Date of Birth & Gender",
      description: "Enter your date of birth and gender for your Oliviuus account"
    },
    customId: {
      title: "Create Oliviuus ID - Choose Your ID",
      description: "Choose a unique Oliviuus ID for your account"
    },
    customPassword: {
      title: "Create Oliviuus ID - Set Password",
      description: "Set a secure password for your Oliviuus account"
    }
  };

  // Add/remove auth-page class for scroll control
  useEffect(() => {
    document.body.classList.add('auth-page');
    document.documentElement.classList.add('auth-page');

    return () => {
      document.body.classList.remove('auth-page');
      document.documentElement.classList.remove('auth-page');
    };
  }, []);

  // Handle Google Sign-In Success
  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    if (!credentialResponse.credential) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/google", {
        token: credentialResponse.credential,
        redirectUrl: redirectUrl,
        guestMode: guestMode
      });

      if (response.data?.success) {
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        window.location.href = response.data.redirectUrl || redirectUrl || '/';
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [redirectUrl, guestMode]);

  const handleGoogleError = useCallback(() => {
    console.error('Google One-Tap login failed');
    setLoading(false);
  }, []);

  // Google One-Tap Login - AUTOMATIC
  useGoogleOneTapLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    disabled: step !== "email",
    cancel_on_tap_outside: true,
    prompt_parent_id: 'google-one-tap-container',
    context: 'signin',
    ux_mode: 'popup',
    auto_select: true,
    itp_support: true,
  });

  // Handle guest mode toggle
  const handleGuestModeToggle = useCallback(() => {
    const newGuestMode = !guestMode;
    setGuestMode(newGuestMode);
    
    // Update URL with guest mode parameter
    const guestParam = generateGuestModeParam(newGuestMode);
    const merged = {
      step,
      email,
      isExistingUser,
      code,
      password,
      identifierType,
      identifier,
      customAccountData,
      userInfoData,
      ...savedState,
      timestamp: Date.now()
    };
    const hash = encodeState(merged);
    navigate(`/auth?state=${hash}&redirect=${encodeURIComponent(redirectUrl)}&guest=${guestParam}`, { replace: true });
  }, [guestMode, step, email, isExistingUser, code, password, identifierType, identifier, customAccountData, userInfoData, savedState, navigate, redirectUrl]);

  // Update URL state with guest mode
  const updateUrlState = useCallback((newState) => {
    const merged = {
      step,
      email,
      isExistingUser,
      code,
      password,
      identifierType,
      identifier,
      customAccountData,
      userInfoData,
      guestMode,
      ...savedState,
      ...newState,
      timestamp: Date.now()
    };
    const hash = encodeState(merged);
    const guestParam = generateGuestModeParam(guestMode);
    navigate(`/auth?state=${hash}&redirect=${encodeURIComponent(redirectUrl)}&guest=${guestParam}`, { replace: true });
  }, [step, email, isExistingUser, code, password, identifierType, identifier, customAccountData, userInfoData, guestMode, savedState, navigate, redirectUrl]);

  // Handle Custom Account Start
  const handleCustomAccountStart = useCallback(() => {
    const newStep = "customName";
    setStep(newStep);
    updateUrlState({
      step: newStep,
      customAccountData: {}
    });
  }, [updateUrlState]);

  // Handle Edit Email for Custom Account Steps
  const handleEditCustomAccount = useCallback((targetStep) => {
    setStep(targetStep);
    updateUrlState({ step: targetStep });
  }, [updateUrlState]);

  // Handle Back Navigation for Custom Account Steps
  const handleCustomAccountBack = useCallback(() => {
    if (step === "customDobGender") {
      handleEditCustomAccount("customName");
    } else if (step === "customId") {
      handleEditCustomAccount("customDobGender");
    } else if (step === "customPassword") {
      handleEditCustomAccount("customId");
    } else {
      handleEditEmail();
    }
  }, [step, handleEditCustomAccount]);

  // Handle Back Navigation for User Steps
  const handleUserStepBack = useCallback(() => {
    if (step === "userPassword") {
      const newStep = "userName";
      setStep(newStep);
      updateUrlState({ step: newStep });
    } else if (step === "userName") {
      handleEditEmail();
    }
  }, [step, updateUrlState]);

  // Custom Account Step Handlers with proper loading
  const handleCustomNameSubmit = useCallback((data) => {
    setLoading(true);
    setTimeout(() => {
      const newData = { ...customAccountData, ...data };
      const newStep = "customDobGender";

      setCustomAccountData(newData);
      setStep(newStep);
      updateUrlState({
        step: newStep,
        customAccountData: newData
      });
      setLoading(false);
    }, 300);
  }, [customAccountData, updateUrlState]);

  const handleCustomDobGenderSubmit = useCallback((data) => {
    setLoading(true);
    setTimeout(() => {
      const newData = { ...customAccountData, ...data };
      const newStep = "customId";

      setCustomAccountData(newData);
      setStep(newStep);
      updateUrlState({
        step: newStep,
        customAccountData: newData
      });
      setLoading(false);
    }, 300);
  }, [customAccountData, updateUrlState]);

  const handleCustomIdSubmit = useCallback((data) => {
    setLoading(true);
    setTimeout(() => {
      // Ensure both username and customId are saved
      const newData = {
        ...customAccountData,
        username: data.username,
        customId: data.username // Save customId as well
      };
      const newStep = "customPassword";

      setCustomAccountData(newData);
      setStep(newStep);
      updateUrlState({
        step: newStep,
        customAccountData: newData
      });
      setLoading(false);
    }, 300);
  }, [customAccountData, updateUrlState]);

  const handleCustomPasswordSubmit = useCallback(async (data) => {
    setLoading(true);

    try {
      // Create a complete data object with all fields
      const finalData = {
        firstName: customAccountData.firstName || "",
        lastName: customAccountData.lastName || "",
        dateOfBirth: customAccountData.dateOfBirth || "",
        gender: customAccountData.gender || "",
        username: customAccountData.username || customAccountData.customId || "",
        password: data.password || "",
        redirectUrl: redirectUrl,
        device_name: 'Unknown',
        device_type: 'web',
        user_agent: navigator.userAgent || 'Unknown',
        language: 'en',
        guestMode: guestMode
      };

      console.log("Sending complete data to backend:", finalData);

      const res = await api.post("/auth/create-custom-account", finalData);

      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('auth_token', res.data.token);
        }

        // Clear custom account data
        setCustomAccountData({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          gender: "",
          customId: "",
          username: "",
          password: "",
          confirmPassword: ""
        });

        // Redirect after successful registration
        setTimeout(() => {
          window.location.href = res.data.redirectUrl || redirectUrl || '/';
        }, 800);
      }
    } catch (err) {
      console.error("Custom account creation error:", err);
      // Log the actual error response
      if (err.response) {
        console.error("Server response:", err.response.data);
        console.error("Server error details:", err.response);
      }
      setLoading(false);
    }
  }, [customAccountData, redirectUrl, guestMode]);

  // Step handlers - with proper loading
  const handleEmailSubmit = useCallback(async ({ email: enteredEmail, isExistingUser: userExists }) => {
    setLoading(true);

    try {
      const language = getCurrentLanguage();
      const res = await api.post("/auth/check-identifier", {
        identifier: enteredEmail,
        language
      });

      setEmail(enteredEmail);

      const { exists, isVerified, identifierType, nextStep, user } = res.data;

      setIsExistingUser(exists);
      setIdentifierType(identifierType);

      let nextStepToSet = "code";
      if (nextStep === "password") {
        nextStepToSet = "password";
      } else if (nextStep === "code") {
        nextStepToSet = "code";
      } else {
        nextStepToSet = exists && isVerified ? "password" : "code";
      }

      // Simulate loading before moving to next step
      setTimeout(() => {
        setStep(nextStepToSet);
        updateUrlState({
          step: nextStepToSet,
          email: enteredEmail,
          isExistingUser: exists,
          identifierType: identifierType,
          user: user
        });
        setLoading(false);
      }, 300);

    } catch (err) {
      console.error("Error checking identifier:", err);
      setLoading(false);
    }
  }, [updateUrlState]);

  const handleCodeSubmit = useCallback(async (enteredCode, responseData = null) => {
    setLoading(true);

    try {
      let res;
      if (!responseData) {
        // If response data not provided (from auto-submit), make the API call
        res = await api.post("/auth/verify-code", {
          identifier: email,
          code: enteredCode,
          identifierType: identifierType
        });
      } else {
        // Use the response data from auto-submit
        res = { data: responseData };
      }

      if (res.data.verified && res.data.success) {
        setCode(enteredCode);
        const nextStep = "userName"; // Changed from "userInfo" to "userName" for 2-step process

        setTimeout(() => {
          setStep(nextStep);
          updateUrlState({
            step: nextStep,
            code: enteredCode,
            userExists: res.data.userExists,
            user: res.data.user,
            requiresPasswordSetup: res.data.requiresPasswordSetup,
            userInfoData: {} // Initialize empty user info data
          });
          setLoading(false);
        }, 300);
      } else {
        console.error("Invalid verification code:", res.data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error verifying code:", err);
      setLoading(false);
    }
  }, [email, identifierType, updateUrlState]);

  const handlePasswordSubmit = useCallback(async (enteredPassword) => {
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        identifier: email,
        password: enteredPassword,
        redirectUrl: redirectUrl,
        guestMode: guestMode,
        device_name: navigator.userAgentData?.brands?.[0]?.brand || 'Unknown',
        device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'web',
        user_agent: navigator.userAgent
      });

      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('auth_token', res.data.token);
        }

        setPassword(enteredPassword);
        updateUrlState({ password: enteredPassword });

        setTimeout(() => {
          window.location.href = res.data.redirectUrl || redirectUrl || '/';
        }, 800);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  }, [email, updateUrlState, redirectUrl, guestMode]);

  // User Name Step Handler
  const handleUserNameSubmit = useCallback((data) => {
    setLoading(true);
    setTimeout(() => {
      const newData = { ...userInfoData, ...data };
      const newStep = "userPassword";

      setUserInfoData(newData);
      setStep(newStep);
      updateUrlState({
        step: newStep,
        userInfoData: newData
      });
      setLoading(false);
    }, 300);
  }, [userInfoData, updateUrlState]);

  // User Password Step Handler
  const handleUserPasswordSubmit = useCallback(async (data) => {
    setLoading(true);

    try {
      const finalData = {
        email,
        code,
        firstName: userInfoData.firstName || "",
        lastName: userInfoData.lastName || "",
        password: data.password || "",
        confirmPassword: data.confirmPassword || "",
        redirectUrl: redirectUrl,
        guestMode: guestMode
      };

      const res = await api.post("/auth/complete-registration", finalData);

      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('auth_token', res.data.token);
        }

        // Clear user info data
        setUserInfoData({
          firstName: "",
          lastName: "",
          password: "",
          confirmPassword: ""
        });

        // Redirect after successful registration
        setTimeout(() => {
          window.location.href = res.data.redirectUrl || redirectUrl || '/';
        }, 800);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setLoading(false);
    }
  }, [email, code, userInfoData, redirectUrl, guestMode]);

  const handleEditEmail = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("email");
      updateUrlState({ step: "email" });
    }, 300);
  }, [updateUrlState]);

  // Get current SEO content
  const currentSeo = seoContent[step] || seoContent.email;

  // Function to render current step component
  const renderStep = () => {
    const customStepProps = {
      loading,
      isDarkMode,
      onBack: handleCustomAccountBack
    };

    const userStepProps = {
      loading,
      isDarkMode,
      onBack: handleUserStepBack
    };

    switch (step) {
      case "email":
        return (
          <EmailStep
            onSubmit={handleEmailSubmit}
            redirectUrl={redirectUrl}
            onCustomAccountClick={handleCustomAccountStart}
            guestMode={guestMode}
            onGuestModeToggle={handleGuestModeToggle}
            {...customStepProps}
          />
        );
      case "code":
        return (
          <CodeStep
            email={email}
            onSubmit={handleCodeSubmit}
            onEditEmail={handleEditEmail}
            guestMode={guestMode}
            {...customStepProps}
          />
        );
      case "password":
        return (
          <PasswordStep
            email={email}
            isExistingUser={isExistingUser}
            onSubmit={handlePasswordSubmit}
            redirectUrl={redirectUrl}
            onEditEmail={handleEditEmail}
            guestMode={guestMode}
            onGuestModeToggle={handleGuestModeToggle}
            {...customStepProps}
          />
        );
      case "userName":
        return (
          <UserNameStep
            initialData={userInfoData}
            onSubmit={handleUserNameSubmit}
            guestMode={guestMode}
            {...userStepProps}
          />
        );
      case "userPassword":
        return (
          <UserPasswordStep
            initialData={userInfoData}
            email={email}
            onSubmit={handleUserPasswordSubmit}
            guestMode={guestMode}
            {...userStepProps}
          />
        );
      case "customName":
        return (
          <CustomNameStep
            initialData={customAccountData}
            onSubmit={handleCustomNameSubmit}
            guestMode={guestMode}
            {...customStepProps}
          />
        );
      case "customDobGender":
        return (
          <CustomDobGenderStep
            initialData={customAccountData}
            onSubmit={handleCustomDobGenderSubmit}
            guestMode={guestMode}
            {...customStepProps}
          />
        );
      case "customId":
        return (
          <CustomIdStep
            initialData={customAccountData}
            onSubmit={handleCustomIdSubmit}
            guestMode={guestMode}
            {...customStepProps}
          />
        );
      case "customPassword":
        return (
          <CustomPasswordStep
            initialData={customAccountData}
            onSubmit={handleCustomPasswordSubmit}
            redirectUrl={redirectUrl}
            guestMode={guestMode}
            {...customStepProps}
          />
        );
      default:
        return (
          <EmailStep
            onSubmit={handleEmailSubmit}
            redirectUrl={redirectUrl}
            onCustomAccountClick={handleCustomAccountStart}
            guestMode={guestMode}
            onGuestModeToggle={handleGuestModeToggle}
            {...customStepProps}
          />
        );
    }
  };

  // Function to render left panel content based on step
  const renderLeftPanelContent = () => {
    const guestModeIndicator = guestMode ? (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium mb-4 border ${isDarkMode 
        ? 'bg-purple-900/20 text-purple-300 border-purple-700/50' 
        : 'bg-purple-50 text-purple-700 border-purple-200'
      }`}>
        <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Guest Mode • Sign in privately
      </div>
    ) : null;

    switch (step) {
      case "email":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Sign in {guestMode ? "privately" : ""}
            </h1>
            <p className="text-lg mb-10 opacity-80">
              to continue to Oliviuus
            </p>
          </>
        );
      case "code":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Verify your email
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Enter the code sent to
            </p>
            <div className="mt-3">
              <EditableEmail email={email} onClick={handleEditEmail} />
            </div>
          </>
        );
      case "password":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Welcome back
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Enter your password for
            </p>
            <div className="mt-3">
              <EditableEmail email={email} onClick={handleEditEmail} />
            </div>
          </>
        );
      case "userName":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Create your account
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Complete your information
            </p>
            <div className="mt-3">
              <EditableEmail email={email} onClick={handleEditEmail} />
            </div>
          </>
        );
      case "userPassword":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Create your account
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Set your password
            </p>
            <div className="mt-3">
              <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
                ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
                : 'bg-gray-100 border border-gray-300 text-gray-700'
                }`}>
                <span className="font-medium">
                  {userInfoData.firstName} {userInfoData.lastName}
                </span>
              </div>
            </div>
          </>
        );
      case "customName":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Create Oliviuus ID
            </h1>
            <p className="text-lg mb-10 opacity-80">
              No email or phone required
            </p>
          </>
        );
      case "customDobGender":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Create Oliviuus ID
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Tell us about yourself
            </p>
            <div className="mt-3">
              <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
                ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
                : 'bg-gray-100 border border-gray-300 text-gray-700'
                }`}>
                <span className="font-medium">
                  {customAccountData.firstName} {customAccountData.lastName}
                </span>
              </div>
            </div>
          </>
        );
      case "customId":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Create Oliviuus ID
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Choose your unique ID
            </p>
            <div className="mt-3">
              <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
                ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
                : 'bg-gray-100 border border-gray-300 text-gray-700'
                }`}>
                <span className="font-medium">
                  {customAccountData.firstName} {customAccountData.lastName}
                </span>
              </div>
            </div>
          </>
        );
      case "customPassword":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Create Oliviuus ID
            </h1>
            <p className="text-lg mb-3 opacity-80">
              Set your password
            </p>
            <div className="mt-3">
              <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
                ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
                : 'bg-gray-100 border border-gray-300 text-gray-700'
                }`}>
                <span className="font-medium">
                  @{customAccountData.customId || customAccountData.username || "yourid"}
                </span>
              </div>
            </div>
          </>
        );
      default:
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-3xl lg:text-4xl font-normal mb-3">
              Sign in {guestMode ? "privately" : ""}
            </h1>
            <p className="text-lg mb-10 opacity-80">
              to continue to Oliviuus
            </p>
          </>
        );
    }
  };

  // Function to render mobile header based on step
  const renderMobileHeader = () => {
    const guestModeIndicator = guestMode ? (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium mb-3 ${isDarkMode 
        ? 'bg-purple-900/20 text-purple-300 border border-purple-700/50' 
        : 'bg-purple-50 text-purple-700 border border-purple-200'
      }`}>
        <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        Guest Mode
      </div>
    ) : null;

    switch (step) {
      case "email":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-1 sm:mb-2">Sign in {guestMode ? "privately" : ""}</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80">to continue to Oliviuus</p>
          </>
        );
      case "code":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Verify your email</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Enter the code sent to</p>
            <EditableEmail email={email} onClick={handleEditEmail} />
          </>
        );
      case "password":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Welcome back</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Enter your password for</p>
            <EditableEmail email={email} onClick={handleEditEmail} />
          </>
        );
      case "userName":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Create your account</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Complete your information</p>
            <EditableEmail email={email} onClick={handleEditEmail} />
          </>
        );
      case "userPassword":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Create your account</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Set your password</p>
            <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
              ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
              : 'bg-gray-100 border border-gray-300 text-gray-700'
              }`}>
              <span className="font-medium">
                {userInfoData.firstName} {userInfoData.lastName}
              </span>
            </div>
          </>
        );
      case "customName":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Create Oliviuus ID</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80">No email or phone required</p>
          </>
        );
      case "customDobGender":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Create Oliviuus ID</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Tell us about yourself</p>
            <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
              ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
              : 'bg-gray-100 border border-gray-300 text-gray-700'
              }`}>
              <span className="font-medium">
                {customAccountData.firstName} {customAccountData.lastName}
              </span>
            </div>
          </>
        );
      case "customId":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Create Oliviuus ID</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Choose your unique ID</p>
            <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
              ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
              : 'bg-gray-100 border border-gray-300 text-gray-700'
              }`}>
              <span className="font-medium">
                {customAccountData.firstName} {customAccountData.lastName}
              </span>
            </div>
          </>
        );
      case "customPassword":
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-2">Create Oliviuus ID</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80 mb-3">Set your password</p>
            <div className={`inline-flex items-center px-4 py-2.5 rounded-lg ${isDarkMode
              ? 'bg-gray-800/50 border border-gray-700 text-gray-300'
              : 'bg-gray-100 border border-gray-300 text-gray-700'
              }`}>
              <span className="font-medium">
                @{customAccountData.customId || customAccountData.username || "yourid"}
              </span>
            </div>
          </>
        );
      default:
        return (
          <>
            {guestModeIndicator}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal mb-1 sm:mb-2">Sign in {guestMode ? "privately" : ""}</h1>
            <p className="text-sm sm:text-base md:text-lg opacity-80">to continue to Oliviuus</p>
          </>
        );
    }
  };

  // Guest mode information section for desktop
  const renderGuestModeInfoDesktop = () => {
    if (step !== "email") return null;

    return (
      <div className="mt-10 pt-10 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="font-medium">Not your computer?</span> Use Guest mode to sign in privately. Your session will end when you close the browser.
          </p>
          
          {guestMode ? (
            <div className={`p-3 rounded-lg text-sm ${isDarkMode 
              ? 'bg-purple-900/20 border border-purple-700/50 text-purple-300' 
              : 'bg-purple-50 border border-purple-200 text-purple-700'
            }`}>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-medium">Guest Mode Active</span> – Your session will end when you close the browser or after 1 hour maximum.
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGuestModeToggle}
              className={`w-full py-2.5 border rounded-lg text-sm hover:opacity-90 transition-colors font-medium ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              Use Guest mode
            </button>
          )}
        </div>
      </div>
    );
  };

  // Guest mode information section for mobile
  const renderGuestModeInfoMobile = () => {
    if (step !== "email") return null;

    return (
      <div className="lg:hidden mt-6 sm:mt-8">
        <div className={`p-4 sm:p-6 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
          <div className="space-y-3 sm:space-y-4">
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Not your computer?</span> Use Guest mode to sign in privately. Your session will end when you close the browser.
            </p>
            
            {guestMode ? (
              <div className={`p-3 rounded-lg text-xs ${isDarkMode 
                ? 'bg-purple-900/20 border border-purple-700/50 text-purple-300' 
                : 'bg-purple-50 border border-purple-200 text-purple-700'
              }`}>
                <div className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-medium">Guest Mode Active</span> – Session ends when browser closes or after 1 hour.
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGuestModeToggle}
                className={`w-full px-4 sm:px-6 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm hover:opacity-90 transition-colors font-medium ${isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}>
                Use Guest mode
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>{currentSeo.title}</title>
        <meta name="description" content={currentSeo.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://oliviuus.com/auth" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </Helmet>

      <div className={`min-h-screen w-full flex flex-col ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <style>{`
          body.auth-page {
            overflow: hidden;
            background: ${isDarkMode ? '#030712' : '#f9fafb'};
          }
          html.auth-page {
            overflow: hidden;
          }
          body, html {
            max-width: 100vw;
            overflow-x: hidden;
            width: 100%;
          }
          @media (max-width: 640px) {
            body, html {
              width: 100vw;
              height: 100vh;
              position: fixed;
              overscroll-behavior: none;
            }
          }
          #credential_picker_container {
            margin: 0 auto 16px !important;
            border-radius: 12px !important;
            overflow: hidden !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            max-width: 100% !important;
            width: 100% !important;
            background-color: ${isDarkMode ? '#1f2937' : 'white'} !important;
            position: relative !important;
            z-index: 100 !important;
          }
          #credential_picker_iframe {
            border-radius: 12px !important;
            border: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
            width: 100% !important;
          }
          
          /* LOADING BAR - Your system's loader */
          .auth-loading-bar {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: transparent;
            overflow: hidden;
            z-index: 9999;
          }
          .auth-loading-bar-progress {
            height: 100%;
            background: linear-gradient(90deg, #9333ea 0%, #a855f7 50%, #c084fc 100%);
            width: 0%;
            animation: loading-bar-animation 2s ease-in-out infinite;
            box-shadow: 0 0 10px rgba(147, 51, 234, 0.6);
          }
          @keyframes loading-bar-animation {
            0% { 
              width: 0%; 
              margin-left: 0%;
            }
            50% { 
              width: 75%; 
              margin-left: 0%;
            }
            100% { 
              width: 0%; 
              margin-left: 100%;
            }
          }
          
          .auth-input:-webkit-autofill,
          .auth-input:-webkit-autofill:hover,
          .auth-input:-webkit-autofill:focus,
          .auth-input:-webkit-autofill:active {
            -webkit-text-fill-color: ${isDarkMode ? '#f9fafb' : '#111827'};
            -webkit-box-shadow: 0 0 0px 1000px ${isDarkMode ? '#1f2937' : 'white'} inset !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
        `}</style>

        {/* Main Container */}
        <div className="flex-1 w-full flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
          <div className={`w-full h-full sm:h-auto sm:max-w-6xl sm:rounded-2xl sm:shadow-xl relative overflow-hidden ${isDarkMode
            ? 'bg-gray-900 sm:border sm:border-gray-800'
            : 'bg-white sm:border sm:border-gray-200'
            }`}>

            {/* LOADING BAR - Your system's loader */}
            {loading && (
              <div className="auth-loading-bar">
                <div className="auth-loading-bar-progress"></div>
              </div>
            )}

            {/* FORM CONTAINER */}
            <div className="flex flex-col lg:flex-row min-h-full sm:min-h-[600px]">
              {/* Left Panel - Logo and Info (Desktop only) */}
              <div className="hidden lg:flex lg:w-2/5 p-8 lg:p-12 flex-col justify-center">
                <div className="w-full">
                  {/* Logo */}
                  <div className="mb-10">
                    <Logo />
                  </div>

                  {/* Step-specific header for desktop */}
                  {renderLeftPanelContent()}

                  {/* Guest Mode Info - Desktop only (only show for email step) */}
                  {renderGuestModeInfoDesktop()}
                </div>
              </div>

              {/* Right Panel - Auth Form */}
              <div className={`w-full lg:w-3/5 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}>
                <div className="w-full max-w-md mx-auto px-2 sm:px-0">
                  {/* Mobile Header for all steps */}
                  <div className="lg:hidden mb-6 sm:mb-8">
                    <div className="flex flex-col items-center text-center px-2">
                      {/* Show Logo for ALL steps on mobile */}
                      <div className="mb-4 sm:mb-6">
                        <Logo />
                      </div>

                      {/* Step-specific headers */}
                      {renderMobileHeader()}
                    </div>
                  </div>

                  {/* Google One-Tap Container - Mobile */}
                  <div className="lg:hidden mb-4">
                    <div id="google-one-tap-container"></div>
                  </div>

                  {/* Step Components */}
                  <div className={`space-y-4 sm:space-y-6 md:space-y-8 ${loading ? "pointer-events-none opacity-70" : ""}`}>
                    {renderStep()}
                  </div>

                  {/* Guest Mode Info - Mobile only (only show for email step) */}
                  {renderGuestModeInfoMobile()}

                  {/* Footer Links - Mobile (Only show for email step) */}
                  {step === "email" && (
                    <div className="lg:hidden mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        {/* Legal Links */}
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <a
                            href="https://oliviuus.com/help"
                            className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 px-1"
                          >
                            Help
                          </a>
                          <a
                            href="https://oliviuus.com/privacy"
                            className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 px-1"
                          >
                            Privacy
                          </a>
                          <a
                            href="https://oliviuus.com/terms"
                            className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 px-1"
                          >
                            Terms
                          </a>
                        </div>

                        {/* Language Selector */}
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 sm:mt-0">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                          </svg>
                          <select className={`bg-transparent border-none focus:outline-none cursor-pointer text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <option>English (United States)</option>
                            <option>Français</option>
                            <option>Kinyarwanda</option>
                            <option>Swahili</option>
                          </select>
                        </div>
                      </div>

                      {/* Copyright */}
                      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Oliviuus Ltd.
                      </div>
                    </div>
                  )}

                  {/* Footer Links - Desktop (Only show for email step) */}
                  {step === "email" && (
                    <div className="hidden lg:block mt-6 sm:mt-8 lg:mt-12 pt-4 sm:pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        {/* Legal Links */}
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <a
                            href="https://oliviuus.com/help"
                            className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 px-1"
                          >
                            Help
                          </a>
                          <a
                            href="https://oliviuus.com/privacy"
                            className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 px-1"
                          >
                            Privacy
                          </a>
                          <a
                            href="https://oliviuus.com/terms"
                            className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 px-1"
                          >
                            Terms
                          </a>
                        </div>

                        {/* Language Selector */}
                        <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                          </svg>
                          <select className={`bg-transparent border-none focus:outline-none cursor-pointer text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <option>English (United States)</option>
                            <option>Français</option>
                            <option>Kinyarwanda</option>
                            <option>Swahili</option>
                          </select>
                        </div>
                      </div>

                      {/* Copyright */}
                      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        © {new Date().getFullYear()} Oliviuus Ltd.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthForm;