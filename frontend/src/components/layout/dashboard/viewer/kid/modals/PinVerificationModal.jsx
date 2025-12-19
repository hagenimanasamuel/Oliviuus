// src/components/modals/PinVerificationModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, X, Shield, Key, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PinVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onPinVerify, // Optional prop for security logging
  title = "",
  description = "",
  actionType = "exit_kid_mode",
  triggerButtonRef
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [animationStage, setAnimationStage] = useState("initial");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lastFailedTime, setLastFailedTime] = useState(null);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const fakeInputRef = useRef(null);

  // Get translated strings with fallback to action-specific defaults
  const getTranslatedTitle = () => {
    if (title) return title;
    
    switch(actionType) {
      case "exit_kid_mode":
        return t('kidDashboard.pinModal.title', "Verify PIN to Exit Kid Mode");
      case "parental_controls":
        return t('settings.parental.pinModal.title', "Verify PIN to Access Parental Controls");
      default:
        return t('pinModal.defaultTitle', "PIN Verification Required");
    }
  };

  const getTranslatedDescription = () => {
    if (description) return description;
    
    switch(actionType) {
      case "exit_kid_mode":
        return t('kidDashboard.pinModal.description', "Enter your family PIN to exit kid mode and return to parent dashboard");
      case "parental_controls":
        return t('settings.parental.pinModal.description', "Enter your family PIN to access parental controls settings");
      default:
        return t('pinModal.defaultDescription', "Enter your family PIN to continue");
    }
  };

  // Security warning messages
  const getSecurityWarningMessage = () => {
    if (failedAttempts === 2) {
      return t('kidDashboard.pinModal.securityWarning.twoAttempts', 
        "Multiple incorrect PIN attempts detected. This attempt will be logged.");
    } else if (failedAttempts === 3) {
      return t('kidDashboard.pinModal.securityWarning.threeAttempts', 
        "Multiple failed attempts detected. Parent will be notified.");
    } else if (failedAttempts >= 4) {
      return t('kidDashboard.pinModal.securityWarning.multipleAttempts', 
        { count: failedAttempts }, 
        `${failedAttempts} failed attempts detected. Security alert has been sent to parent.`);
    }
    return "";
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Focus fake input first to prevent browser autocomplete
  useEffect(() => {
    if (isOpen && fakeInputRef.current) {
      fakeInputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    }
  }, [isOpen]);

  // Handle modal open/close with animation timing
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setAnimationStage("initial");
      
      setTimeout(() => {
        setAnimationStage("animating");
        
        setTimeout(() => {
          setAnimationStage("complete");
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 300);
      }, 10);
    } else {
      if (shouldRender) {
        setIsClosing(true);
        setAnimationStage("animating");
        
        const timer = setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
          setAnimationStage("initial");
          // Reset state when closing
          setPin("");
          setError("");
          setSuccess("");
          setFailedAttempts(0);
          setShowSecurityWarning(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, shouldRender]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setSuccess("");
      setShowPin(false);
      setFailedAttempts(0);
      setShowSecurityWarning(false);
    }
  }, [isOpen]);

  // Check if we should show security warning
  useEffect(() => {
    if (failedAttempts >= 2) {
      setShowSecurityWarning(true);
    }
  }, [failedAttempts]);

  // Handle digit button click
  const handleDigitClick = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => handleVerifyPin(), 100);
      }
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError("");
    }
  };

  // Handle clear
  const handleClear = () => {
    setPin("");
    setError("");
  };

  // Enhanced PIN verification with backward compatibility
  const handleVerifyPin = async () => {
    if (!pin) {
      setError(t('pinModal.errors.emptyPin', "Please enter your PIN"));
      return;
    }

    if (pin.length !== 4) {
      setError(t('pinModal.errors.invalidLength', "PIN must be exactly 4 digits"));
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      if (onPinVerify) {
        // Use security-enhanced verification if provided
        const result = await onPinVerify(pin);
        
        if (result.success) {
          // Successful verification
          setSuccess(t('pinModal.success.verified', "PIN verified successfully!"));
          setFailedAttempts(0);
          setShowSecurityWarning(false);
          
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else {
          // Failed verification
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          setLastFailedTime(new Date());
          
          setError(result.error || t('pinModal.errors.invalidPin', "Invalid PIN. Please try again."));
          setPin("");
          
          // Show alert for multiple failed attempts
          if (result.shouldShowAlert) {
            setShowSecurityWarning(true);
          }
        }
      } else {
        // Fallback to original API call for backward compatibility
        const response = await fetch("/api/family/pin/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ pin })
        });
        
        const data = await response.json();
        
        if (data.verified || data.success) {
          // Successful verification (both formats supported)
          setSuccess(t('pinModal.success.verified', "PIN verified successfully!"));
          setFailedAttempts(0);
          
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else {
          // Failed verification
          const newFailedAttempts = failedAttempts + 1;
          setFailedAttempts(newFailedAttempts);
          setLastFailedTime(new Date());
          
          setError(data.error || data.message || t('pinModal.errors.invalidPin', "Invalid PIN. Please try again."));
          setPin("");
          
          // Show security warning after multiple attempts
          if (newFailedAttempts >= 2) {
            setShowSecurityWarning(true);
          }
        }
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      
      // Increment attempt counter on error
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      setLastFailedTime(new Date());
      
      const errorMessage = error.message || t('pinModal.errors.verificationFailed', "Verification failed. Please try again.");
      setError(errorMessage);
      setPin("");
      
      // Show security warning after multiple errors
      if (newFailedAttempts >= 2) {
        setShowSecurityWarning(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerifyPin();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    setError("");
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const isAnimationComplete = animationStage === "complete";
  const isExiting = isClosing;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {/* Hidden fake input to trick browser autocomplete */}
      <input
        ref={fakeInputRef}
        type="text"
        style={{
          opacity: 0,
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          pointerEvents: 'none'
        }}
        autoComplete="new-password"
        readOnly
        tabIndex={-1}
      />
      
      {/* Modal Container with Perfect Zoom Animation */}
      <div 
        ref={modalRef}
        className={`relative bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-purple-500/30 shadow-2xl w-full max-w-xs sm:max-w-sm md:max-w-md transform transition-all duration-300 z-[10000] mx-2 sm:mx-4 ${
          isAnimationComplete ? 'scale-100 opacity-100 rotate-0' : 
          isExiting ? 'scale-0 opacity-0 -rotate-90' : 
          'scale-0 opacity-0 rotate-90'
        }`}
        style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
          transformOrigin: 'center center',
          position: 'relative',
          zIndex: 10000,
          pointerEvents: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className={`p-1.5 sm:p-2 bg-purple-500/20 rounded-lg transform transition-all duration-500 flex-shrink-0 ${
              isAnimationComplete ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              <Shield className="text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <h2 className={`text-lg sm:text-xl font-bold text-white truncate transform transition-all duration-500 delay-100 ${
                isAnimationComplete ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}>
                {getTranslatedTitle()}
              </h2>
              <p className={`text-gray-400 text-xs sm:text-sm mt-0.5 truncate transform transition-all duration-500 delay-150 ${
                isAnimationComplete ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}>
                {getTranslatedDescription()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-400 hover:text-white transform flex-shrink-0 ml-2 ${
              isAnimationComplete ? 'scale-100' : 'scale-0'
            } hover:scale-110 active:scale-95`}
            aria-label={t('pinModal.buttons.close', "Close modal")}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Security Warning - Only show after 2+ failed attempts */}
        {showSecurityWarning && (
          <div className={`px-4 sm:px-6 py-2 sm:py-3 bg-red-500/10 border-y border-red-500/30 transform transition-all duration-500 delay-200 ${
            isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base truncate">
                {t('kidDashboard.pinModal.securityWarning.title', "Security Alert")}
              </span>
            </div>
            <p className="text-red-300 text-xs sm:text-sm mt-1">
              {getSecurityWarningMessage()}
            </p>
          </div>
        )}

        {/* Failed Attempts Counter */}
        {failedAttempts > 0 && (
          <div className={`px-4 sm:px-6 py-1.5 sm:py-2 bg-yellow-500/10 border-b border-yellow-500/20 transform transition-all duration-500 delay-150 ${
            isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-yellow-400">
                {t('kidDashboard.pinModal.attempts', { count: failedAttempts }, `Attempts: ${failedAttempts}`)}
              </span>
              {lastFailedTime && (
                <span className="text-xs text-yellow-300 hidden xs:block">
                  {t('kidDashboard.pinModal.lastAttempt', "Last")}: {lastFailedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* PIN Input */}
          <div className="space-y-2 sm:space-y-3">
            <label className={`block text-sm font-medium text-gray-300 text-center transform transition-all duration-500 delay-200 ${
              isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              {t('kidDashboard.pinModal.enterPin', "Enter 4-digit PIN")}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={handlePinChange}
                onKeyPress={handleKeyPress}
                placeholder={t('pinModal.placeholders.enterPin', "Enter 4-digit PIN")}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-center text-xl sm:text-2xl tracking-widest font-semibold transition-all duration-500 transform ${
                  isAnimationComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                } focus:scale-105`}
                maxLength={4}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-500 delay-300 p-1 ${
                  isAnimationComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                } hover:scale-110 active:scale-95`}
                aria-label={showPin ? 
                  t('pinModal.buttons.hidePin', "Hide PIN") : 
                  t('pinModal.buttons.showPin', "Show PIN")
                }
                onMouseDown={(e) => e.preventDefault()}
              >
                {showPin ? <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Eye className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <p className={`text-xs text-gray-500 transition-all duration-500 delay-400 ${
                isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                {pin.length}/4 {t('kidDashboard.pinModal.digits', "digits")}
              </p>
              <button
                type="button"
                onClick={handleClear}
                className={`text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 ${
                  isAnimationComplete ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {t('kidDashboard.pinModal.clear', "Clear")}
              </button>
            </div>
          </div>

          {/* Numeric Keypad - Responsive */}
          <div className={`mb-4 sm:mb-6 transform transition-all duration-500 delay-400 ${
            isAnimationComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num.toString())}
                  disabled={loading}
                  className="bg-gray-800 hover:bg-gray-700 text-white text-lg sm:text-xl font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleDigitClick("0")}
                disabled={loading}
                className="bg-gray-800 hover:bg-gray-700 text-white text-lg sm:text-xl font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={loading || pin.length === 0}
                className="bg-gray-800 hover:bg-gray-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`transform transition-all duration-500 delay-500 ${
            isAnimationComplete ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4 transform transition-all duration-300 animate-shake">
                <p className="text-red-400 text-xs sm:text-sm text-center">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 transform transition-all duration-300 scale-105 animate-pulseSuccess">
                <p className="text-green-400 text-xs sm:text-sm text-center">
                  {success}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons - Responsive */}
          <div className={`flex flex-col xs:flex-row gap-2 sm:gap-3 transform transition-all duration-500 delay-600 ${
            isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200 flex items-center justify-center transform hover:scale-105 active:scale-95"
            >
              <span className="text-sm sm:text-base">{t('kidDashboard.pinModal.cancel', "Cancel")}</span>
            </button>
            <button
              onClick={handleVerifyPin}
              disabled={loading || pin.length !== 4}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 transform hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="text-sm sm:text-base">
                    {t('kidDashboard.pinModal.verifying', "Verifying...")}
                  </span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-200 hover:scale-110" />
                  <span className="text-sm sm:text-base">
                    {t('kidDashboard.pinModal.verify', "Verify PIN")}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className={`text-center transform transition-all duration-500 delay-700 ${
            isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <p className="text-xs text-gray-500">
              {t('kidDashboard.pinModal.securityNote', "For security, all PIN attempts are logged")}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes pulseSuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-pulseSuccess {
          animation: pulseSuccess 0.6s ease-in-out;
        }
        
        /* Responsive breakpoints */
        @media (max-width: 640px) {
          .pin-modal-container {
            margin: 0.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .pin-modal-container {
            max-width: 95vw;
          }
        }
        
        @media (max-width: 360px) {
          .pin-modal-container {
            max-width: 100vw;
            margin: 0;
            border-radius: 0;
          }
        }
        
        /* Touch-friendly targets */
        @media (hover: none) and (pointer: coarse) {
          button {
            min-height: 44px;
          }
          
          input, button {
            font-size: 16px; /* Prevents iOS zoom on focus */
          }
        }
        
        /* Prevent text selection on buttons */
        button {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        /* Better scrolling on mobile */
        @media (max-height: 600px) {
          .modal-container {
            max-height: 85vh;
          }
        }
      `}</style>
    </div>
  );
}