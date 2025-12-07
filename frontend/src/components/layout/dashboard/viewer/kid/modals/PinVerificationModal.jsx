// src/components/modals/PinVerificationModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, X, Shield, Key } from "lucide-react";
import api from "../../../../../../api/axios";
import { useTranslation } from "react-i18next"; // Add translation hook

export default function PinVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "", // Remove default, will use translation
  description = "", // Remove default, will use translation
  actionType = "exit_kid_mode",
  triggerButtonRef
}) {
  const { t } = useTranslation(); // Initialize translation hook
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [animationStage, setAnimationStage] = useState("initial");
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const fakeInputRef = useRef(null);

  // Get translated strings with fallback to action-specific defaults
  const getTranslatedTitle = () => {
    if (title) return title; // Use custom title if provided
    
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
    if (description) return description; // Use custom description if provided
    
    switch(actionType) {
      case "exit_kid_mode":
        return t('kidDashboard.pinModal.description', "Enter your family PIN to exit kid mode and return to parent dashboard");
      case "parental_controls":
        return t('settings.parental.pinModal.description', "Enter your family PIN to access parental controls settings");
      default:
        return t('pinModal.defaultDescription', "Enter your family PIN to continue");
    }
  };

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
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

  // Calculate modal position for animation
  const calculateModalPosition = () => {
    if (!triggerButtonRef?.current) {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2, width: 0, height: 0 };
    }
    
    const rect = triggerButtonRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    };
  };

  const [triggerPosition, setTriggerPosition] = useState(() => calculateModalPosition());

  // Update trigger position when modal opens
  useEffect(() => {
    if (isOpen) {
      setTriggerPosition(calculateModalPosition());
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
    }
  }, [isOpen]);

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
      
      const response = await api.post("/family/pin/verify", { pin });
      
      if (response.data.verified) {
        setSuccess(t('pinModal.success.verified', "PIN verified successfully!"));
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      const errorMessage = error.response?.data?.error || 
                         t('pinModal.errors.invalidPin', "Invalid PIN. Please try again.");
      setError(errorMessage);
      setPin("");
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

  const handleBlockActions = (e) => {
    e.preventDefault();
    return false;
  };

  const handleInput = (e) => {
    const input = e.target.value;
    const numbersOnly = input.replace(/\D/g, '');
    
    if (input !== numbersOnly) {
      e.target.value = numbersOnly;
    }
    
    setPin(numbersOnly.slice(0, 4));
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

  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;
  const translateX = viewportCenterX - triggerPosition.x;
  const translateY = viewportCenterY - triggerPosition.y;

  const isAnimationComplete = animationStage === "complete";
  const isExiting = isClosing;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
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
      
      {/* Backdrop with transition */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen && !isClosing ? 'opacity-70' : 'opacity-0'
        }`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998
        }}
      />
      
      {/* Modal Container with Perfect Zoom Animation */}
      <div 
        ref={modalRef}
        className={`relative bg-gray-900 rounded-2xl border-2 border-purple-500/30 shadow-2xl w-full max-w-md transform transition-all duration-300 z-[10000] ${
          isAnimationComplete ? 'scale-100 opacity-100 rotate-0' : 
          isExiting ? 'scale-0 opacity-0 -rotate-90' : 
          'scale-0 opacity-0 rotate-90'
        }`}
        style={{
          background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
          transform: isAnimationComplete 
            ? 'translate(0, 0) scale(1) rotate(0)' 
            : isExiting
            ? `translate(${translateX}px, ${translateY}px) scale(0) rotate(-90deg)`
            : `translate(${translateX}px, ${translateY}px) scale(0) rotate(90deg)`,
          transformOrigin: 'center center',
          position: 'relative',
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-purple-500/20 rounded-lg transform transition-all duration-500 ${
              isAnimationComplete ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              <Shield className="text-purple-400" size={24} />
            </div>
            <div className="overflow-hidden">
              <h2 className={`text-xl font-bold text-white transform transition-all duration-500 delay-100 ${
                isAnimationComplete ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}>
                {getTranslatedTitle()}
              </h2>
              <p className={`text-gray-400 text-sm mt-1 transform transition-all duration-500 delay-150 ${
                isAnimationComplete ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}>
                {getTranslatedDescription()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 text-gray-400 hover:text-white transform ${
              isAnimationComplete ? 'scale-100' : 'scale-0'
            } hover:scale-110 active:scale-95`}
            aria-label={t('pinModal.buttons.close', "Close modal")}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* PIN Input */}
          <div className="space-y-3">
            <label className={`block text-sm font-medium text-gray-300 text-center transform transition-all duration-500 delay-200 ${
              isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              {t('pinModal.labels.enterPin', "Enter Family PIN")}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={handlePinChange}
                onInput={handleInput}
                onKeyPress={handleKeyPress}
                onPaste={handleBlockActions}
                onCopy={handleBlockActions}
                onCut={handleBlockActions}
                placeholder={t('pinModal.placeholders.enterPin', "Enter 4-digit PIN")}
                className={`w-full px-6 py-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-center text-2xl tracking-widest font-semibold transition-all duration-500 transform ${
                  isAnimationComplete ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                } focus:scale-105`}
                maxLength={4}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="numeric"
                pattern="[0-9]*"
                name="pin-verification"
                id="pin-verification-input"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore="true"
                data-browser-autocomplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-500 delay-300 p-1 ${
                  isAnimationComplete ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                } hover:scale-110 active:scale-95`}
                aria-label={showPin ? 
                  t('pinModal.buttons.hidePin', "Hide PIN") : 
                  t('pinModal.buttons.showPin', "Show PIN")
                }
                onMouseDown={(e) => e.preventDefault()}
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className={`text-xs text-gray-500 text-center transition-all duration-500 delay-400 ${
              isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              {pin.length}/4 {t('pinModal.labels.digits', "digits")}
            </p>
          </div>

          {/* Messages */}
          <div className={`transform transition-all duration-500 delay-500 ${
            isAnimationComplete ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 transform transition-all duration-300 animate-shake">
                <p className="text-red-400 text-sm text-center">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 transform transition-all duration-300 scale-105 animate-pulseSuccess">
                <p className="text-green-400 text-sm text-center">
                  {success}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`flex space-x-3 transform transition-all duration-500 delay-600 ${
            isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95"
            >
              <span>{t('pinModal.buttons.cancel', "Cancel")}</span>
            </button>
            <button
              onClick={handleVerifyPin}
              disabled={loading || pin.length !== 4}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Key size={18} className="transform transition-transform duration-200 hover:scale-110" />
              )}
              <span>
                {loading ? 
                  t('pinModal.buttons.verifying', "Verifying...") : 
                  t('pinModal.buttons.verify', "Verify")
                }
              </span>
            </button>
          </div>

          {/* Security Note */}
          <div className={`text-center transform transition-all duration-500 delay-700 ${
            isAnimationComplete ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <p className="text-xs text-gray-500">
              {t('pinModal.securityNote', "This PIN protects your family settings and parental controls")}
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
        
        .pin-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
        }
        
        .pin-modal-container {
          position: relative !important;
          z-index: 10000 !important;
        }
        
        input::-webkit-credentials-auto-fill-button,
        input::-webkit-contacts-auto-fill-button,
        input::-webkit-credit-card-auto-fill-button {
          visibility: hidden;
          display: none !important;
          pointer-events: none;
          position: absolute;
          right: 0;
        }
        
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #1F2937 inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
        
        input::-webkit-caps-lock-indicator,
        input::-webkit-credentials-auto-fill-button,
        input::-webkit-contacts-auto-fill-button {
          display: none !important;
        }
      `}</style>
    </div>
  );
}