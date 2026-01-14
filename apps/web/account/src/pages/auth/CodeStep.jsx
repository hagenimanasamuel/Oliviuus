import React, { useState, useEffect, useRef } from "react";
import Alert from "../../components/auth/ui/Alert.jsx";
import api from "../../api/axios";

const RESEND_DELAY = 60; // 1 minute for resend
const MAX_ATTEMPTS = 5; // Maximum failed attempts allowed
const BLOCK_DURATION = 3600; // 1 hour block duration in seconds

const CodeStep = ({ email, onSubmit, loading: parentLoading, isDarkMode }) => {
  const [code, setCode] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS);
  const [blockTimer, setBlockTimer] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load attempts and block status from localStorage on mount
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const saved = localStorage.getItem(`failed_attempts_${email}`);
    return saved ? parseInt(saved) : 0;
  });

  const [blockUntil, setBlockUntil] = useState(() => {
    const saved = localStorage.getItem(`block_until_${email}`);
    return saved ? parseInt(saved) : 0;
  });

  // Resend state with localStorage persistence
  const [resendTimer, setResendTimer] = useState(() => {
    const saved = localStorage.getItem(`resend_timer_${email}`);
    const savedTime = saved ? parseInt(saved) : RESEND_DELAY;
    const savedTimestamp = localStorage.getItem(`resend_timestamp_${email}`);

    if (savedTimestamp) {
      const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
      const remaining = Math.max(0, savedTime - elapsed);
      return remaining;
    }
    return RESEND_DELAY;
  });

  const [canResend, setCanResend] = useState(resendTimer === 0);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const blockTimerRef = useRef(null);
  const submittedCodeRef = useRef("");
  const attemptResetTimerRef = useRef(null);

  // Check if user is blocked on component mount
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    
    if (blockUntil > now) {
      // User is still blocked
      setIsBlocked(true);
      const remaining = blockUntil - now;
      setBlockTimer(remaining);
      
      // Start countdown for block timer
      if (remaining > 0) {
        blockTimerRef.current = setInterval(() => {
          setBlockTimer(prev => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(blockTimerRef.current);
              setIsBlocked(false);
              setFailedAttempts(0);
              setRemainingAttempts(MAX_ATTEMPTS);
              localStorage.removeItem(`failed_attempts_${email}`);
              localStorage.removeItem(`block_until_${email}`);
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }
    } else {
      // Block expired or never existed
      localStorage.removeItem(`block_until_${email}`);
      setIsBlocked(false);
    }
  }, [email, blockUntil]);

  // Save attempts and block status to localStorage
  useEffect(() => {
    if (failedAttempts > 0) {
      localStorage.setItem(`failed_attempts_${email}`, failedAttempts.toString());
    } else {
      localStorage.removeItem(`failed_attempts_${email}`);
    }
  }, [failedAttempts, email]);

  useEffect(() => {
    if (blockUntil > 0) {
      localStorage.setItem(`block_until_${email}`, blockUntil.toString());
    } else {
      localStorage.removeItem(`block_until_${email}`);
    }
  }, [blockUntil, email]);

  // Save timer to localStorage
  useEffect(() => {
    if (resendTimer > 0 && resendTimer < RESEND_DELAY) {
      localStorage.setItem(`resend_timer_${email}`, resendTimer.toString());
      localStorage.setItem(`resend_timestamp_${email}`, Date.now().toString());
    } else if (resendTimer === 0) {
      localStorage.removeItem(`resend_timer_${email}`);
      localStorage.removeItem(`resend_timestamp_${email}`);
    }
  }, [resendTimer, email]);

  // Countdown for resend with localStorage persistence
  useEffect(() => {
    if (!canResend && resendTimer > 0) {
      timerRef.current = setTimeout(() => {
        setResendTimer(prev => {
          const newTime = prev - 1;
          if (newTime === 0) {
            setCanResend(true);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [resendTimer, canResend]);

  // Reset attempts after successful verification or 24 hours
  useEffect(() => {
    // Reset attempts every 24 hours
    const resetAttemptsAfter24h = () => {
      const now = Date.now();
      const lastReset = localStorage.getItem(`attempts_reset_${email}`);
      
      if (!lastReset || (now - parseInt(lastReset)) > 24 * 60 * 60 * 1000) {
        setFailedAttempts(0);
        setRemainingAttempts(MAX_ATTEMPTS);
        localStorage.setItem(`attempts_reset_${email}`, now.toString());
      }
    };

    resetAttemptsAfter24h();
    
    // Set up 24-hour reset timer
    const twentyFourHours = 24 * 60 * 60 * 1000;
    attemptResetTimerRef.current = setTimeout(resetAttemptsAfter24h, twentyFourHours);

    return () => {
      if (attemptResetTimerRef.current) {
        clearTimeout(attemptResetTimerRef.current);
      }
    };
  }, [email]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (blockTimerRef.current) {
        clearInterval(blockTimerRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current && !isBlocked) {
      inputRef.current.focus();
    }
  }, [isBlocked]);

  // Fixed auto-submit - only submit when 6 digits AND not already submitted this code
  useEffect(() => {
    // Only auto-submit if:
    // 1. Code is exactly 6 digits
    // 2. Not currently loading
    // 3. Not blocked
    // 4. Not already submitted this exact code
    // 5. Has not already submitted in this session
    if (code.length === 6 && 
        !localLoading && 
        !isBlocked && 
        code !== submittedCodeRef.current && 
        !hasSubmitted) {
      handleSubmit();
    }
  }, [code, localLoading, isBlocked, hasSubmitted]);

  // Handle code input with validation
  const handleCodeChange = (value) => {
    // Only allow digits, max 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    
    // If user is typing after a failed attempt, reset submission state
    if (hasSubmitted && digits.length < 6) {
      setHasSubmitted(false);
    }
    
    setCode(digits);

    // Clear error when user types
    if (alert && !alert.persistent) {
      setAlert(null);
    }
  };

  // Handle paste for auto-complete
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pasteData.length === 6) {
      // Reset submission state when pasting new code
      setHasSubmitted(false);
      submittedCodeRef.current = "";
      setCode(pasteData);
    }
  };

  // Handle auto-complete from browser/form fill
  const handleAutoComplete = (e) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 6) {
      // Reset submission state for auto-filled code
      setHasSubmitted(false);
      submittedCodeRef.current = "";
      setCode(digits);
    }
  };

  // Increment failed attempts and check if should block
  const incrementFailedAttempts = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    setRemainingAttempts(MAX_ATTEMPTS - newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
      // Block the user
      const now = Math.floor(Date.now() / 1000);
      const blockEnd = now + BLOCK_DURATION;
      
      setBlockUntil(blockEnd);
      setIsBlocked(true);
      setBlockTimer(BLOCK_DURATION);
      
      // Start countdown for block timer
      if (blockTimerRef.current) {
        clearInterval(blockTimerRef.current);
      }
      
      blockTimerRef.current = setInterval(() => {
        setBlockTimer(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(blockTimerRef.current);
            setIsBlocked(false);
            setFailedAttempts(0);
            setRemainingAttempts(MAX_ATTEMPTS);
            localStorage.removeItem(`failed_attempts_${email}`);
            localStorage.removeItem(`block_until_${email}`);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
  };

  // Reset attempts on successful verification
  const resetFailedAttempts = () => {
    setFailedAttempts(0);
    setRemainingAttempts(MAX_ATTEMPTS);
    localStorage.removeItem(`failed_attempts_${email}`);
    localStorage.removeItem(`block_until_${email}`);
    localStorage.setItem(`attempts_reset_${email}`, Date.now().toString());
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (isBlocked) {
      setAlert({
        type: "error",
        message: `Verification blocked. Please try again in ${formatTime(blockTimer)}.`,
        persistent: true
      });
      return;
    }

    if (!code.trim() || code.length !== 6) {
      setAlert({ type: "error", message: "Please enter the complete 6-digit code" });
      return;
    }

    // Prevent duplicate submission of same code
    if (code === submittedCodeRef.current) {
      return;
    }

    setLocalLoading(true);
    setAlert(null);
    setHasSubmitted(true);
    submittedCodeRef.current = code;

    try {
      const res = await api.post("/auth/verify-code", {
        identifier: email,
        code: code,
        identifierType: "email"
      });

      if (res.data.verified) {
        // Success - reset attempts and proceed
        resetFailedAttempts();
        onSubmit(code, res.data);
      } else {
        // Handle error gracefully
        const errorMsg = res.data.error || "Invalid verification code";
        
        // Increment failed attempts
        incrementFailedAttempts();

        // Show error with attempts remaining
        const attemptsLeft = MAX_ATTEMPTS - (failedAttempts + 1);
        setAlert({
          type: "error",
          message: `${errorMsg} ${attemptsLeft > 0 ? `(${attemptsLeft} attempts remaining)` : ''}`
        });

        // Clear code to prevent auto-submit loop
        setCode("");
        submittedCodeRef.current = "";
        setHasSubmitted(false);
        
        // Focus input for correction
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    } catch (err) {
      console.error("Verification error:", err);

      // Increment failed attempts on network/validation errors too
      incrementFailedAttempts();

      // Clear code on error to prevent auto-submit loop
      setCode("");
      submittedCodeRef.current = "";
      setHasSubmitted(false);

      if (err.response?.status === 400 || err.response?.status === 404) {
        // Invalid or expired code - show error gracefully
        const attemptsLeft = MAX_ATTEMPTS - (failedAttempts + 1);
        setAlert({
          type: "error",
          message: `${err.response?.data?.error || "Invalid or expired verification code"} ${attemptsLeft > 0 ? `(${attemptsLeft} attempts remaining)` : ''}`
        });
      } else if (err.response?.status === 429) {
        // Rate limited - sync with backend
        const attemptsLeft = MAX_ATTEMPTS - (failedAttempts + 1);
        setAlert({
          type: "error",
          message: `Too many attempts. Please wait before trying again. ${attemptsLeft > 0 ? `(${attemptsLeft} attempts remaining)` : ''}`
        });
      } else {
        const attemptsLeft = MAX_ATTEMPTS - (failedAttempts + 1);
        setAlert({
          type: "error",
          message: `Something went wrong. Please try again. ${attemptsLeft > 0 ? `(${attemptsLeft} attempts remaining)` : ''}`
        });
      }
      
      // Focus input for correction
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isBlocked || localLoading) return;

    try {
      setLocalLoading(true);
      setAlert(null);

      // Use resend-verification endpoint
      const res = await api.post("/auth/resend-verification", {
        identifier: email,
        identifierType: "email",
        language: 'en'
      });

      if (res.data.success) {
        // Reset timer
        setCanResend(false);
        setResendTimer(res.data.resendDelay || 30);

        // Clear code input and submission state
        setCode("");
        submittedCodeRef.current = "";
        setHasSubmitted(false);

        setAlert({
          type: "success",
          message: res.data.message || "New verification code sent successfully!"
        });

        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error("Resend error:", err);

      if (err.response?.status === 429) {
        const errorData = err.response.data;

        if (errorData.blocked) {
          // Blocked due to 5+ attempts
          setIsBlocked(true);
          setBlockTimer(errorData.blockedFor || 3600);
          setAlert({
            type: "error",
            message: `Too many verification attempts. Please try again in ${formatTime(errorData.blockedFor || 3600)}.`,
            persistent: true
          });
        } else if (errorData.cooldown) {
          // Cooldown active
          setCanResend(false);
          setResendTimer(errorData.cooldown);
          setAlert({
            type: "error",
            message: `Please wait ${errorData.cooldown} seconds before requesting a new code.`
          });
        } else {
          setAlert({
            type: "error",
            message: errorData.error || "Please wait before requesting a new code."
          });
        }
      } else {
        setAlert({
          type: "error",
          message: err.response?.data?.error || "Failed to send verification code. Please try again."
        });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setShowMoreOptions(false);
  };

  const handleSendOTP = () => {
    setShowMoreOptions(false);
    console.log("Send OTP option clicked");
  };

  const isLoading = parentLoading || localLoading;
  const isSubmitDisabled = isLoading || isBlocked || code.length !== 6 || hasSubmitted;

  // Format time display for timers
  const formatTime = (seconds) => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    } else if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format timer display for resend (short format)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {/* Loading bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden rounded-t">
          <div className={`h-1 w-1/3 ${isDarkMode ? 'bg-[#BC8BBC]' : 'bg-purple-600'
            } animate-loader`}></div>
        </div>
      )}

      {/* Alert for errors/success */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={alert.persistent ? null : () => setAlert(null)}
          isDarkMode={isDarkMode}
          persistent={alert.persistent}
        />
      )}

      {/* Attempts warning */}
      {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < MAX_ATTEMPTS && !isBlocked && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}>
          ⚠️ {remainingAttempts} attempt{remainingAttempts > 1 ? 's' : ''} remaining
        </div>
      )}

      {/* Blocked notice */}
      {isBlocked && (
        <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/30 text-red-300 border border-red-700'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Verification Temporarily Blocked</p>
              <p className="text-sm mt-1 opacity-90">
                Too many failed attempts. Please wait <strong>{formatTime(blockTimer)}</strong> before trying again.
              </p>
              <div className="mt-2 text-xs">
                <div className="flex items-center">
                  <div className={`flex-1 h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-1 rounded-full transition-all duration-1000 ${isDarkMode ? 'bg-red-500' : 'bg-red-600'}`}
                      style={{ width: `${((BLOCK_DURATION - blockTimer) / BLOCK_DURATION) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2">{formatTime(blockTimer)} remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className={`space-y-6 ${isLoading || isBlocked ? "pointer-events-none opacity-70" : ""}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Single Code Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              onInput={handleAutoComplete}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full px-4 py-3 rounded-lg text-center text-2xl tracking-widest bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer ${isDarkMode
                  ? 'border border-gray-700 text-white focus:border-purple-500'
                  : 'border border-gray-300 text-gray-900 focus:border-purple-500'
                } ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              disabled={isBlocked}
              aria-label="Verification code"
            />

            {/* Floating Label */}
            <label
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${isDarkMode
                  ? 'text-gray-400 peer-focus:text-purple-400'
                  : 'text-gray-500 peer-focus:text-purple-600'
                } ${code || isFocused
                  ? "text-xs -translate-y-6 px-1 bg-gradient-to-b from-transparent to-transparent peer-focus:bg-gradient-to-b peer-focus:from-transparent peer-focus:to-transparent"
                  : "text-base"
                }`}
            >
              {code || isFocused ? "Verification Code" : "Enter 6-digit code"}
            </label>

            {/* Background for label when floating */}
            {(code || isFocused) && (
              <div className={`absolute left-3 -top-3 h-3 w-[calc(100%-1.5rem)] text-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}></div>
            )}

            {/* Character counter */}
            <div className={`absolute top-3 right-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {code.length}/6
            </div>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg ${isSubmitDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {isLoading ? "Verifying..." : isBlocked ? `Blocked (${formatTime(blockTimer)})` : "Verify Code"}
          </button>
        </form>

        {/* Resend Code Section */}
        <div className={`text-center p-4 rounded-lg border ${isDarkMode
            ? 'bg-gray-800/30 border-gray-700'
            : 'bg-gray-50/50 border-gray-300'
          }`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            {canResend
              ? "Didn't receive the code?"
              : `You can request a new code in ${formatTimer(resendTimer)}`
            }
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={!canResend || isLoading || isBlocked}
            className={`text-sm font-medium hover:underline ${isDarkMode
                ? 'text-purple-400 hover:text-purple-300'
                : 'text-purple-600 hover:text-purple-800'
              } ${(!canResend || isLoading || isBlocked) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? "Sending..." : canResend ? "Send a new code" : `Resend in ${formatTimer(resendTimer)}`}
          </button>
        </div>

        {/* More Ways to Sign In - Dropdown */}
        {!isBlocked && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className={`w-full py-2.5 px-4 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 border ${isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              <div className="flex items-center justify-center">
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 ${showMoreOptions ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                More ways to verify
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMoreOptions && (
              <div className={`absolute z-50 w-full mt-2 rounded-lg shadow-lg border ${isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-300'
                }`}>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    className={`w-full flex items-start px-4 py-3 text-sm transition-colors duration-200 ${isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Continue with Google</div>
                      <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Use your Google account
                      </div>
                    </div>
                  </button>

                  <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className={`w-full flex items-start px-4 py-3 text-sm transition-colors duration-200 ${isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Send OTP to phone</div>
                      <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Receive code via SMS
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loader animation CSS */}
      <style>
        {`
          @keyframes loader-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(500%); }
          }
          .animate-loader {
            animation: loader-move 1.5s linear infinite;
          }
          
          /* Hide number input spinners */
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
          
          /* Auto-complete styles */
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-text-fill-color: ${isDarkMode ? '#f9fafb' : '#111827'};
            -webkit-box-shadow: 0 0 0px 1000px ${isDarkMode ? '#1f2937' : 'white'} inset !important;
            border-color: ${isDarkMode ? '#8b5cf6' : '#8b5cf6'} !important;
          }
        `}
      </style>
    </div>
  );
};

export default CodeStep;