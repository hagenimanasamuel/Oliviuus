import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, AlertCircle, User, CheckCircle } from "lucide-react";

const UserPasswordStep = ({ initialData, email, onSubmit, loading, isDarkMode, onBack }) => {
  const [password, setPassword] = useState(initialData.password || "");
  const [confirmPassword, setConfirmPassword] = useState(initialData.confirmPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

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

    onSubmit({
      password,
      confirmPassword
    });
  };

  const isFormValid = password && confirmPassword && strength >= 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Password Input */}
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
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500'
              } ${errors.password ? 'border-red-500' : ''}`}
              autoComplete="new-password"
              disabled={loading}
            />
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                password || passwordFocused
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {password || passwordFocused ? "Create a password" : "Create a password"}
            </label>
            
            {(password || passwordFocused) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}

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
            
            {errors.password && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>

          {errors.password && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              {errors.password}
            </div>
          )}

          {/* Password Strength Meter */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Password strength:
              </span>
              <span className={`text-xs font-medium ${
                strength >= 4 ? 'text-green-500' :
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
                className={`h-full transition-all duration-300 ${
                  strength >= 4 ? 'bg-green-500 w-full' :
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
                {requirements.length ? (
                  <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0 text-green-500" />
                ) : (
                  <div className="w-3 h-3 mr-1 flex-shrink-0 rounded-full border border-gray-400"></div>
                )}
                At least 8 characters
              </div>
              <div className={`flex items-center text-xs ${requirements.uppercase ? 'text-green-500' : 'text-gray-500'}`}>
                {requirements.uppercase ? (
                  <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0 text-green-500" />
                ) : (
                  <div className="w-3 h-3 mr-1 flex-shrink-0 rounded-full border border-gray-400"></div>
                )}
                One uppercase letter
              </div>
              <div className={`flex items-center text-xs ${requirements.lowercase ? 'text-green-500' : 'text-gray-500'}`}>
                {requirements.lowercase ? (
                  <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0 text-green-500" />
                ) : (
                  <div className="w-3 h-3 mr-1 flex-shrink-0 rounded-full border border-gray-400"></div>
                )}
                One lowercase letter
              </div>
              <div className={`flex items-center text-xs ${requirements.number ? 'text-green-500' : 'text-gray-500'}`}>
                {requirements.number ? (
                  <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0 text-green-500" />
                ) : (
                  <div className="w-3 h-3 mr-1 flex-shrink-0 rounded-full border border-gray-400"></div>
                )}
                One number
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password Input */}
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
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500'
              } ${errors.confirmPassword ? 'border-red-500' : ''}`}
              autoComplete="new-password"
              disabled={loading}
            />
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                confirmPassword || confirmPasswordFocused
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {confirmPassword || confirmPasswordFocused ? "Confirm password" : "Confirm password"}
            </label>
            
            {(confirmPassword || confirmPasswordFocused) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}

            {confirmPassword && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                  isDarkMode 
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
            
            {errors.confirmPassword && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
          
          {errors.confirmPassword && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              {errors.confirmPassword}
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion Reminder */}
      <div className={`p-4 rounded-lg border ${isDarkMode 
        ? 'bg-gray-800/30 border-gray-700' 
        : 'bg-purple-50/50 border-purple-200'
      }`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className={`p-2 rounded-full ${isDarkMode 
              ? 'bg-purple-900/50 text-purple-300' 
              : 'bg-purple-100 text-purple-600'
            }`}>
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-medium mb-1 flex items-center ${isDarkMode 
              ? 'text-gray-200' 
              : 'text-gray-800'
            }`}>
              Complete Your Profile
              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                Recommended
              </span>
            </h4>
            <p className={`text-xs ${isDarkMode 
              ? 'text-gray-400' 
              : 'text-gray-600'
            }`}>
              After signing up, customize your Oliviuus profile.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Notice */}
      <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        By creating an account, you agree to Oliviuus's Terms of Service and Privacy Policy
      </p>

      {/* Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onBack}
          className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium border transition-colors ${
            isDarkMode
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
          className={`flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 ${
            (!isFormValid || loading) ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </div>
    </form>
  );
};

export default UserPasswordStep;