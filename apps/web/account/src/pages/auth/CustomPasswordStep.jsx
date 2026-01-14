import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";

const CustomPasswordStep = ({ initialData, onSubmit, onBack, loading, isDarkMode, redirectUrl }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  // Focus states for floating labels
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const passwordRef = useRef(null);

  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Check password strength
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };

    setRequirements(checks);

    // Calculate strength score
    const score = Object.values(checks).filter(Boolean).length;
    setStrength(score);
  }, [password]);

  const validate = () => {
    const newErrors = {};

    // Check password strength
    if (strength < 3) {
      newErrors.password = "Password is too weak. Please meet all requirements.";
    }

    // Check match
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  const finalData = {
    ...initialData,
    password,
    username: initialData.customId || initialData.username,
    language: 'en',
    device_name: 'Unknown',
    device_type: 'web',
    user_agent: navigator.userAgent || 'Unknown',
    // Explicitly include all fields that backend expects
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "", // This is crucial
    dateOfBirth: initialData.dateOfBirth || "",
    gender: initialData.gender || "",
    customId: initialData.customId || initialData.username || ""
  };

  // Remove any undefined values
  Object.keys(finalData).forEach(key => {
    if (finalData[key] === undefined) {
      delete finalData[key];
    }
  });

  onSubmit(finalData);
};

  const isFormValid = password && confirmPassword && strength >= 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Password Input with floating label */}
        <div>
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer ${isDarkMode
                  ? 'border border-gray-700 text-white focus:border-purple-500'
                  : 'border border-gray-300 text-gray-900 focus:border-purple-500'
                } ${errors.password ? 'border-red-500' : ''}`}
              autoComplete="new-password"
              disabled={loading}
            />
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${isDarkMode
                  ? 'text-gray-400 peer-focus:text-purple-400'
                  : 'text-gray-500 peer-focus:text-purple-600'
                } ${password || passwordFocused
                  ? "text-xs -translate-y-6 px-1"
                  : "text-sm sm:text-base"
                }`}
            >
              {password || passwordFocused ? "Create a password" : "Create a password"}
            </label>
            {(password || passwordFocused) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-2.5rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}></div>
            )}

            {/* Show/Hide Password Button */}
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${isDarkMode
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
          </div>

          {/* Password Strength Meter */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Password strength:
              </span>
              <span className={`text-xs font-medium ${strength >= 4 ? 'text-green-500' :
                  strength >= 3 ? 'text-yellow-500' :
                    strength >= 2 ? 'text-orange-500' :
                      'text-red-500'
                }`}>
                {strength >= 4 ? 'Strong' :
                  strength >= 3 ? 'Good' :
                    strength >= 2 ? 'Fair' : 'Weak'}
              </span>
            </div>
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength >= 4 ? 'bg-green-500 w-full' :
                    strength >= 3 ? 'bg-yellow-500 w-3/4' :
                      strength >= 2 ? 'bg-orange-500 w-1/2' :
                        'bg-red-500 w-1/4'
                  }`}
              />
            </div>
          </div>

          {/* Password Requirements */}
          <div className="mt-3">
            <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Must meet all requirements:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center text-xs ${requirements.length ? 'text-green-500' : 'text-gray-500'}`}>
                <svg className={`w-3 h-3 mr-1 flex-shrink-0 ${requirements.length ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  {requirements.length ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                At least 8 characters
              </div>
              <div className={`flex items-center text-xs ${requirements.uppercase ? 'text-green-500' : 'text-gray-500'}`}>
                <svg className={`w-3 h-3 mr-1 flex-shrink-0 ${requirements.uppercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  {requirements.uppercase ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                One uppercase letter
              </div>
              <div className={`flex items-center text-xs ${requirements.lowercase ? 'text-green-500' : 'text-gray-500'}`}>
                <svg className={`w-3 h-3 mr-1 flex-shrink-0 ${requirements.lowercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  {requirements.lowercase ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                One lowercase letter
              </div>
              <div className={`flex items-center text-xs ${requirements.number ? 'text-green-500' : 'text-gray-500'}`}>
                <svg className={`w-3 h-3 mr-1 flex-shrink-0 ${requirements.number ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                  {requirements.number ? (
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                One number
              </div>
            </div>
          </div>

          {errors.password && (
            <p className="mt-2 text-sm text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password Input with floating label */}
        <div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
              }}
              onFocus={() => setConfirmPasswordFocused(true)}
              onBlur={() => setConfirmPasswordFocused(false)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer ${isDarkMode
                  ? 'border border-gray-700 text-white focus:border-purple-500'
                  : 'border border-gray-300 text-gray-900 focus:border-purple-500'
                } ${errors.confirmPassword ? 'border-red-500' : ''}`}
              autoComplete="new-password"
              disabled={loading}
            />
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${isDarkMode
                  ? 'text-gray-400 peer-focus:text-purple-400'
                  : 'text-gray-500 peer-focus:text-purple-600'
                } ${confirmPassword || confirmPasswordFocused
                  ? "text-xs -translate-y-6 px-1"
                  : "text-sm sm:text-base"
                }`}
            >
              {confirmPassword || confirmPasswordFocused ? "Confirm password" : "Confirm password"}
            </label>
            {(confirmPassword || confirmPasswordFocused) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-2.5rem)] ${isDarkMode ? 'bg-gray-900' : 'bg-white'
                }`}></div>
            )}

            {/* Show/Hide Confirm Password Button */}
            {confirmPassword && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${isDarkMode
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            )}
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Account Summary */}
      <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Your Oliviuus ID will be:
        </h4>
        <p className="font-mono text-lg text-purple-600 dark:text-purple-400 mb-1">
          @{initialData.customId || initialData.username || "yourid"}
        </p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          You can use this ID to sign in without email or phone
        </p>
      </div>


      {/* Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onBack}
          className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium border transition-colors ${isDarkMode
              ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 ${(!isFormValid || loading) ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-500 text-center">{errors.submit}</p>
      )}
    </form>
  );
};

export default CustomPasswordStep;