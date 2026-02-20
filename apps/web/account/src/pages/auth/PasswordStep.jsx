import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import Alert from "../../components/auth/ui/Alert.jsx";
import api from "../../api/axios";

const PasswordStep = ({ email, isExistingUser, onSubmit, redirectUrl, loading: parentLoading, isDarkMode, onEditEmail, guestMode, onGuestModeToggle }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

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

  // Auto-hide alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setAlert({ type: "error", message: "Please enter your password" });
      return;
    }

    try {
      setLocalLoading(true);
      
      // Option 1: Try with axios first
      const response = await api.post("/auth/login", {
        identifier: email,
        password,
        redirectUrl: redirectUrl || "/",
        guestMode: guestMode,
        device_name: navigator.userAgentData?.brands?.[0]?.brand || 'Unknown',
        device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'web',
        user_agent: navigator.userAgent
      });

      console.log("✅ Login API response:", response.data);
      
      if (response.data.success) {
        // Store user data in localStorage as immediate fallback
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token);
        }
        
        // Check if cookie was set by trying to fetch user data
        setTimeout(async () => {
          try {
            const meResponse = await api.get('/auth/me');
            if (meResponse.data.success) {
              console.log('✅ Cookie authentication successful');
            }
          } catch (meError) {
            console.log('⚠️ Cookie auth may have failed, using localStorage');
          }
          
          // Redirect after checking
          window.location.href = response.data.redirectUrl || redirectUrl || '/';
        }, 500);
        
        return;
        
      } else {
        setAlert({ 
          type: "error", 
          message: response.data.error || "Login failed" 
        });
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Try fallback with fetch
      try {
        console.log('🔄 Trying fallback login with fetch...');
        const fetchResponse = await fetch('http://localhost:3120/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            identifier: email,
            password,
            redirectUrl: redirectUrl || "/",
            guestMode: guestMode
          })
        });
        
        const data = await fetchResponse.json();
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = data.redirectUrl || redirectUrl || '/';
          return;
        }
      } catch (fetchError) {
        console.error('❌ Fallback also failed:', fetchError);
      }
      
      setAlert({ 
        type: "error", 
        message: "Login failed. Please try again." 
      });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setShowMoreOptions(false);
    // Google One-Tap will handle this automatically
  };

  const handleForgotPassword = () => {
    setShowMoreOptions(false);
    // Implement forgot password flow
    console.log("Forgot password clicked");
    // You can add a modal or redirect here
  };

  const handleUseOTP = () => {
    setShowMoreOptions(false);
    // Implement OTP login flow
    console.log("Use OTP clicked");
  };

  const handleCreateAccount = () => {
    setShowMoreOptions(false);
    // Redirect to create account flow
    console.log("Create account clicked");
  };

  const handleGuestModeToggle = () => {
    setShowMoreOptions(false);
    if (onGuestModeToggle) {
      onGuestModeToggle();
    }
  };

  const handleEditEmailClick = () => {
    if (onEditEmail) {
      onEditEmail();
    }
  };

  const isLoading = parentLoading || localLoading;

  return (
    <div className="w-full">
      {/* Loading bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden rounded-t">
          <div className={`h-1 w-1/3 ${
            isDarkMode ? 'bg-[#BC8BBC]' : 'bg-purple-600'
          } animate-loader`}></div>
        </div>
      )}

      {/* Alert for errors */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Main Form */}
      <div className={`space-y-4 sm:space-y-6 md:space-y-8 ${isLoading ? "pointer-events-none opacity-70" : ""}`}>

        {/* Password Input */}
        <div className="space-y-3 sm:space-y-4">
          {/* Password Input with floating label */}
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer ${
                isDarkMode 
                  ? 'border border-gray-700 text-white focus:border-purple-500' 
                  : 'border border-gray-300 text-gray-900 focus:border-purple-500'
              }`}
              autoComplete="current-password"
              autoFocus
            />
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                password || isFocused
                  ? "text-xs -translate-y-6 px-1 bg-gradient-to-b from-transparent to-transparent peer-focus:bg-gradient-to-b peer-focus:from-transparent peer-focus:to-transparent" 
                  : "text-sm sm:text-base"
              }`}
            >
              {password || isFocused ? "Password" : "Enter your password"}
            </label>
            
            {/* Show/Hide Password Button */}
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            )}
            
            {/* Background for label when floating */}
            {(password || isFocused) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-2.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}
          </div>
          
          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className={`text-sm font-medium hover:underline ${
                isDarkMode 
                  ? 'text-purple-400 hover:text-purple-300' 
                  : 'text-purple-600 hover:text-purple-800'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>
          
          {/* Sign In Button - NO SPINNER */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !password.trim()}
            className={`w-full py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg ${
              (isLoading || !password.trim()) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Signing in..." : guestMode ? "Sign In (Guest Mode)" : "Sign In"}
          </button>
        </div>

        {/* More Ways to Sign In - Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className={`w-full py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 border ${
              isDarkMode 
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
              More ways to sign in
            </div>
          </button>

          {/* Dropdown Menu */}
          {showMoreOptions && (
            <div className={`absolute z-50 w-full mt-1 sm:mt-2 rounded-lg shadow-lg border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-300'
            }`}>
              <div className="py-1">
                {/* Google Sign In Option */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className={`w-full flex items-start px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Sign in with Google</div>
                    <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Use your Google account
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

                {/* Guest Mode Toggle */}
                <button
                  type="button"
                  onClick={handleGuestModeToggle}
                  className={`w-full flex items-start px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">
                      {guestMode ? "Disable Guest Mode" : "Use Guest Mode"}
                    </div>
                    <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {guestMode ? "Switch to regular sign in" : "Sign in privately (session ends when browser closes)"}
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

                {/* Use OTP Option */}
                <button
                  type="button"
                  onClick={handleUseOTP}
                  className={`w-full flex items-start px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Use OTP instead</div>
                    <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Sign in with one-time password
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className={`border-t my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>

                {/* Create Account Option */}
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className={`w-full flex items-start px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-colors duration-200 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Create an account</div>
                    <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Don't have an account yet?
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
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
        `}
      </style>
    </div>
  );
};

export default PasswordStep;