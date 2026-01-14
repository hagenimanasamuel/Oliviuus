import React, { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

const UserNameStep = ({ initialData, onSubmit, loading, isDarkMode, onBack }) => {
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [errors, setErrors] = useState({});
  
  const firstNameRef = useRef(null);

  useEffect(() => {
    if (firstNameRef.current) {
      firstNameRef.current.focus();
    }
  }, []);

  // Blocked names list (case-insensitive) - same as CustomNameStep
  const BLOCKED_NAMES = [
    'oliviuus', 'oliviu', 'oliviuusteam', 'oliviuusapp', 'oliviuusweb',
    'olivius', 'oliviusapp', 'admin', 'administrator', 'superadmin', 'root', 
    'system', 'sysadmin', 'moderator', 'support', 'help', 'customer', 
    'client', 'user', 'users', 'official', 'team', 'staff', 'employee',
    'test', 'testing', 'tester', 'demo', 'sample', 'sampling', 'sampler',
    'example', 'exemplar', 'specimen', 'guest', 'visitor', 'anonymous', 
    'anon', 'unknown', 'fake', 'dummy', 'placeholder', 'temp', 'temporary',
    'john', 'jane', 'doe', 'smith', 'user1', 'user2', 'user3',
    'firstname', 'lastname', 'fullname', 'name', 'username',
    'superman', 'batman', 'spiderman', 'ironman', 'captain',
    'celebrity', 'famous', 'star', 'stupid', 'idiot', 'dumb', 
    'fakeuser', 'bogus', 'bot', 'robot', 'ai', 'assistant', 'chatbot', 'automation'
  ];

  // Validate name for blocked/suspicious patterns
  const validateName = (name, fieldName) => {
    if (!name.trim()) {
      if (fieldName === 'firstName') return "First name is required";
      if (fieldName === 'lastName') return "Last name is required";
      return "";
    }
    
    if (name.trim().length < 2) {
      return `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
    }
    
    if (name.trim().length > 50) {
      return `${fieldName === 'firstName' ? 'First' : 'Last'} name is too long`;
    }
    
    // Check for blocked names (case-insensitive)
    const nameLower = name.trim().toLowerCase();
    for (const blockedName of BLOCKED_NAMES) {
      if (nameLower === blockedName || 
          nameLower.includes(blockedName) ||
          blockedName.includes(nameLower)) {
        return "This name is not allowed";
      }
    }
    
    // Check for suspicious patterns
    if (/^[0-9]+$/.test(nameLower)) {
      return "Name cannot be only numbers";
    }
    
    if (/[^a-zA-Z\s\-'`\.]/.test(nameLower)) {
      return "Name contains invalid characters";
    }
    
    // Check for repeated characters (aaa, bbb, etc)
    if (/(.)\1\1/.test(nameLower)) {
      return "Name contains suspicious pattern";
    }
    
    // Check for common placeholder patterns
    const placeholderPatterns = [
      /^test/i,
      /^demo/i,
      /^sample/i,
      /^example/i,
      /^fake/i,
      /^dummy/i,
      /^temp/i,
      /^user\d+/i,
      /^guest\d*/i,
      /^admin/i,
      /^moderator/i,
      /^support/i
    ];
    
    for (const pattern of placeholderPatterns) {
      if (pattern.test(nameLower)) {
        return "This name is not allowed";
      }
    }
    
    return "";
  };

  const validate = () => {
    const newErrors = {};
    
    const firstNameError = validateName(firstName, 'firstName');
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateName(lastName, 'lastName');
    if (lastNameError) newErrors.lastName = lastNameError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim()
      });
    }
  };

  // Form is valid only when both names have at least 2 characters
  const isFormValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

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
                if (errors.firstName) setErrors({...errors, firstName: null});
              }}
              onFocus={() => setFirstNameFocused(true)}
              onBlur={() => setFirstNameFocused(false)}
              className={`w-full py-2.5 sm:py-3 pl-3 sm:pl-4 pr-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500'
              } ${errors.firstName ? 'border-red-500' : ''}`}
              autoComplete="given-name"
              disabled={loading}
              maxLength={50}
            />
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                firstName || firstNameFocused
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {firstName || firstNameFocused ? "First name *" : "First name *"}
            </label>
            
            {(firstName || firstNameFocused) && (
              <div className={`absolute left-3 -top-3 h-3 w-[calc(100%-1.5rem)] ${
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
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors({...errors, lastName: null});
              }}
              onFocus={() => setLastNameFocused(true)}
              onBlur={() => setLastNameFocused(false)}
              className={`w-full py-2.5 sm:py-3 pl-3 sm:pl-4 pr-3 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-purple-500' 
                  : 'border-gray-300 text-gray-900 focus:border-purple-500'
              } ${errors.lastName ? 'border-red-500' : ''}`}
              autoComplete="family-name"
              disabled={loading}
              maxLength={50}
            />
            
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                lastName || lastNameFocused
                  ? "text-xs -translate-y-6 px-1" 
                  : "text-sm sm:text-base"
              }`}
            >
              {lastName || lastNameFocused ? "Last name *" : "Last name *"}
            </label>
            
            {(lastName || lastNameFocused) && (
              <div className={`absolute left-3 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}
            
            {errors.lastName && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
          
          {errors.lastName && (
            <div className="mt-2 flex items-center text-xs text-red-500">
              <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
              {errors.lastName}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 sm:py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
          {loading ? "Continuing..." : "Continue"}
        </button>
      </div>

      {/* Help Text */}
      <p className={`text-xs text-center mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Use your real first and last name
      </p>
    </form>
  );
};

export default UserNameStep;