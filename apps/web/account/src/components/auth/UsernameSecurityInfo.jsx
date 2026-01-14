import React from 'react';
import { Shield, Lock, AlertCircle, CheckCircle, Info } from 'lucide-react';

const UsernameSecurityInfo = ({ username, strength, strengthCategory, validationErrors, isDarkMode }) => {
  const getSecurityTips = () => {
    const tips = [];
    
    if (username.length < 8) {
      tips.push("Use at least 8 characters for better security");
    }
    
    if (!/\d/.test(username)) {
      tips.push("Add numbers to increase uniqueness");
    }
    
    if (!/[._-]/.test(username)) {
      tips.push("Consider using dots, underscores, or hyphens");
    }
    
    const uniqueChars = new Set(username).size;
    if (uniqueChars / username.length < 0.6) {
      tips.push("Avoid repeating characters");
    }
    
    if (/^[a-z]+$/.test(username)) {
      tips.push("Mixing letters with numbers makes it stronger");
    }
    
    return tips.slice(0, 3); // Return top 3 tips
  };

  return (
    <div className={`rounded-lg border p-4 ${isDarkMode 
      ? 'bg-gray-800/50 border-gray-700' 
      : 'bg-blue-50 border-blue-200'}`}>
      
      <div className="flex items-start mb-3">
        <Shield className={`w-5 h-5 mt-0.5 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <div>
          <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Username Security
          </h4>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Strong usernames protect against impersonation
          </p>
        </div>
      </div>

      {/* Strength Meter */}
      {strength && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Strength:
            </span>
            <span className={`text-xs font-medium ${
              strengthCategory.level === 'strong' ? 'text-green-500' :
              strengthCategory.level === 'good' ? 'text-blue-500' :
              strengthCategory.level === 'fair' ? 'text-yellow-500' :
              strengthCategory.level === 'weak' ? 'text-orange-500' :
              'text-red-500'
            }`}>
              {strengthCategory.label} ({strength}%)
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                strengthCategory.level === 'strong' ? 'bg-green-500' :
                strengthCategory.level === 'good' ? 'bg-blue-500' :
                strengthCategory.level === 'fair' ? 'bg-yellow-500' :
                strengthCategory.level === 'weak' ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Issues found:
            </span>
          </div>
          <ul className="space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-xs text-red-600 dark:text-red-400 flex items-start">
                <span className="mr-1">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security Tips */}
      {username && username.length >= 3 && (
        <div>
          <div className="flex items-center mb-2">
            <Info className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tips for stronger username:
            </span>
          </div>
          <ul className="space-y-1">
            {getSecurityTips().map((tip, index) => (
              <li key={index} className={`text-xs flex items-start ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <CheckCircle className="w-3 h-3 mr-1 mt-0.5 text-green-500 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pro Tips */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Lock className="w-4 h-4 text-purple-500 mr-2" />
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            Pro Tips:
          </span>
        </div>
        <ul className="mt-1 space-y-1">
          <li className="text-xs text-gray-500 dark:text-gray-400">
            • Avoid personal info (birth year, phone numbers)
          </li>
          <li className="text-xs text-gray-500 dark:text-gray-400">
            • Don't use common dictionary words
          </li>
          <li className="text-xs text-gray-500 dark:text-gray-400">
            • Mix letters, numbers, and special characters
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UsernameSecurityInfo;