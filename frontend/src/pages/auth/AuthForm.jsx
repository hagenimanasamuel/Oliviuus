import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";

import EmailStep from "./EmailStep";
import CodeStep from "./CodeStep";
import PasswordStep from "./PasswordStep";
import UserInfoStep from "./UserInfoStep"; // ✅ new import
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
  const params = new URLSearchParams(location.search);
  const savedState = decodeState(params.get("state")) || {};

  const [step, setStep] = useState(savedState.step || "email"); // "email" | "code" | "password" | "userInfo"
  const [email, setEmail] = useState(savedState.email || "");
  const [isExistingUser, setIsExistingUser] = useState(savedState.isExistingUser || false);
  const [code, setCode] = useState(savedState.code || "");
  const [password, setPassword] = useState(savedState.password || "");
  const [loading, setLoading] = useState(false);

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
    }, 400); // simulate slight delay for loader
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

  return (
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
  );
};

export default AuthForm;
