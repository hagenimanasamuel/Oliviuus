import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";
import api from "../../api/axios";

const CustomIdStep = ({ initialData, onSubmit, onBack, loading, isDarkMode }) => {
  const [customId, setCustomId] = useState(initialData.customId || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  const firstName = initialData.firstName || "";
  const lastName = initialData.lastName || "";
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Generate clean suggestions
    if (firstName) {
      const baseSuggestions = [
        `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}`,
        `${firstName.toLowerCase()}${Math.floor(10 + Math.random() * 90)}`,
        `${firstName.toLowerCase()}_${Math.floor(Math.random() * 100)}`,
      ].filter(s => s.length >= 3);
      setSuggestions(baseSuggestions.slice(0, 3));
    }
  }, [firstName, lastName]);

  // Clean availability check
  const checkAvailability = async (id) => {
    if (!id.trim() || id.length < 3) {
      setIsAvailable(null);
      setError("");
      return;
    }

    setIsChecking(true);
    setError("");

    try {
      const response = await api.post("/auth/check-username", { username: id });

      if (response.data.available) {
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
        // Show only the main error, not multiple ones
        setError(response.data.message || "Not available");
      }
    } catch (err) {
      console.error("Check error:", err);
      
      if (err.response?.data?.error) {
        // Extract just the main error message
        const errorMsg = err.response.data.error;
        // Clean up long error messages
        const cleanError = errorMsg.split('.')[0]; // Take first sentence only
        setError(cleanError);
        setIsAvailable(false);
      } else {
        setError("Unavailable username. Try a different one.");
        setIsAvailable(null);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleIdChange = (value) => {
    // Clean input: lowercase, only allowed chars
    const id = value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setCustomId(id);

    // Reset for new input
    if (id !== customId) {
      setIsAvailable(null);
      setError("");
    }

    // Debounce check
    clearTimeout(debounceRef.current);
    if (id.length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkAvailability(id);
      }, 500);
    } else {
      setIsChecking(false);
      setError("");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCustomId(suggestion);
    setIsAvailable(null);
    setError("");
    setIsChecking(true);
    checkAvailability(suggestion);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customId.length >= 3 && isAvailable === true) {
      onSubmit({ 
        username: customId,
        customId: customId
      });
    }
  };

  const isFormValid = customId.length >= 3 && isAvailable === true;

  // Get border color - minimal feedback
  const getBorderColor = () => {
    if (error && isAvailable === false) return "border-red-500";
    if (isAvailable === true) return "border-green-500";
    if (isFocused) return "border-purple-500";
    return isDarkMode ? "border-gray-700" : "border-gray-300";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Clean Input Field */}
        <div>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={customId}
              onChange={(e) => handleIdChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full py-2.5 sm:py-3 pl-3 sm:pl-4 pr-12 rounded-lg text-sm sm:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 peer border ${
                getBorderColor()
              } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              placeholder=""
              disabled={loading}
              minLength={3}
              maxLength={30}
              autoComplete="off"
              spellCheck="false"
            />
            
            {/* Minimal floating label */}
            <label
              className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-all duration-200 ${
                isDarkMode 
                  ? 'text-gray-400 peer-focus:text-purple-400' 
                  : 'text-gray-500 peer-focus:text-purple-600'
              } ${
                customId || isFocused
                  ? "text-xs -translate-y-6 px-1 left-3" 
                  : "text-sm sm:text-base left-3 sm:left-4"
              }`}
            >
              {customId || isFocused ? "Choose ID (Username)" : "Choose ID(Username)"}
            </label>
            
            {(customId || isFocused) && (
              <div className={`absolute left-3 -top-3 h-3 w-[calc(100%-1.5rem)] ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
              }`}></div>
            )}
            
            {/* Clean Status Indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isChecking ? (
                <Clock className={`w-4 h-4 animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : isAvailable === true ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : isAvailable === false ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
          </div>
          
          {/* Ultra-minimal status messages */}
          <div className="mt-2 min-h-[20px]">
            {customId.length > 0 && customId.length < 3 && (
              <p className="text-xs text-gray-500">3+ chars needed</p>
            )}
            
            {customId.length >= 3 && isChecking && (
              <p className="text-xs text-gray-500">Checking...</p>
            )}
            
            {customId.length >= 3 && !isChecking && isAvailable === true && (
              <p className="text-xs text-green-600 font-medium">Available</p>
            )}
            
            {error && !isChecking && (
              <p className="text-xs text-red-600 font-medium flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
              </p>
            )}
          </div>
          
          {/* Simple character guidelines */}
          {!customId && (
            <p className="text-xs text-gray-500 mt-1">
              Letters, numbers, . _ - only
            </p>
          )}
        </div>

        {/* Clean Suggestions */}
        {firstName && suggestions.length > 0 && customId.length < 3 && (
          <div>
            <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Try these:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  @{suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clean Preview */}
        {customId.length >= 3 && !isChecking && (
          <div className={`p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
          } border ${
            isAvailable === true ? 'border-green-500/30' : 
            isAvailable === false ? 'border-red-500/30' : 'border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  @{customId}
                </span>
                {isAvailable === true && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                    ✓ Ready
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {customId.length}/30
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean Buttons */}
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
          className={`flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-sm sm:text-base transition-all duration-200 flex items-center justify-center ${
            (!isFormValid || loading) ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Securing...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
      
      {/* Only show critical errors */}
      {error && error.includes("reserved") && (
        <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Choose a different ID</span>
          </div>
        </div>
      )}
    </form>
  );
};

export default CustomIdStep;