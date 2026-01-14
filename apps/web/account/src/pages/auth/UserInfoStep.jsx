import React, { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, AlertCircle, User, CheckCircle } from "lucide-react";

const UserInfoStep = ({ 
  email, 
  code, 
  onSubmit, 
  redirectUrl, 
  loading, 
  isDarkMode 
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedFields, setFocusedFields] = useState({
    firstName: false,
    lastName: false,
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState({});
  const [strength, setStrength] = useState(0);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false
  });

  const firstNameRef = useRef(null);

  useEffect(() => {
    if (firstNameRef.current) {
      firstNameRef.current.focus();
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

  const handleFocus = (field) => {
    setFocusedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setFocusedFields(prev => ({ ...prev, [field]: false }));
  };

  const validate = () => {
    const newErrors = {};

    // Check first name
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

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

    // Prepare user data for submission
    const userData = {
      email,
      code,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      redirectUrl: redirectUrl || "/"
    };

    onSubmit(userData);
  };

  const isFormValid = firstName && password && confirmPassword && strength >= 3;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* First Name Input */}
        <div>
          <div className="relative">
            <input
              ref={firstNameRef}
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors({ ...errors, firstName: null });
              }}
              onFocus={() => handleFocus('firstName')}
              onBlur={() => handleBlur('firstName')}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500'
              } ${errors.firstName ? 'border-red-500' : ''}`}
              autoComplete="given-name"
              disabled={loading}
            />
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                firstName || focusedFields.firstName
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {firstName || focusedFields.firstName ? "First name" : "First name"}
            </label>
            
            {(firstName || focusedFields.firstName) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}

            {errors.firstName && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>

          {errors.firstName && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              {errors.firstName}
            </div>
          )}
        </div>

        {/* Last Name Input */}
        <div>
          <div className="relative">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onFocus={() => handleFocus('lastName')}
              onBlur={() => handleBlur('lastName')}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500'
              }`}
              autoComplete="family-name"
              disabled={loading}
            />
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                lastName || focusedFields.lastName
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {lastName || focusedFields.lastName ? "Last name (optional)" : "Last name (optional)"}
            </label>
            
            {(lastName || focusedFields.lastName) && (
              <div className={`absolute left-3 sm:left-4 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}
          </div>
        </div>

        {/* Password Input */}
        <div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
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
                password || focusedFields.password
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {password || focusedFields.password ? "Create a password" : "Create a password"}
            </label>
            
            {(password || focusedFields.password) && (
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
              onFocus={() => handleFocus('confirmPassword')}
              onBlur={() => handleBlur('confirmPassword')}
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
                confirmPassword || focusedFields.confirmPassword
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {confirmPassword || focusedFields.confirmPassword ? "Confirm password" : "Confirm password"}
            </label>
            
            {(confirmPassword || focusedFields.confirmPassword) && (
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

      {/* Profile Info */}
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
            <h4 className={`text-sm font-medium mb-1 ${isDarkMode 
              ? 'text-gray-200' 
              : 'text-gray-800'
            }`}>
              Almost there!
            </h4>
            <p className={`text-xs ${isDarkMode 
              ? 'text-gray-400' 
              : 'text-gray-600'
            }`}>
              Your Oliviuus ID will be auto-generated. You can customize your profile after registration.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Notice */}
      <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        By creating an account, you agree to Oliviuus's Terms of Service and Privacy Policy
      </p>

      {/* Create Account Button */}
      <button
        type="submit"
        disabled={!isFormValid || loading}
        className={`w-full py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 ${
          (!isFormValid || loading) ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
};

export default UserInfoStep;