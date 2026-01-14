import React, { useState } from "react";
import { X, User, Lock, Check } from "lucide-react";
import api from "../../api/axios";

const CustomAccountModal = ({ onClose, redirectUrl }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Username, 2: Password, 3: Complete

  const validateUsername = (username) => {
    if (username.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return "Only letters, numbers, dots, hyphens, and underscores allowed";
    if (username.length > 20) return "Username must be less than 20 characters";
    return "";
  };

  const handleNext = async () => {
    if (step === 1) {
      const validationError = validateUsername(username);
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setLoading(true);
      try {
        const res = await api.post("/auth/check-username", { username });
        if (res.data.available) {
          setError("");
          setStep(2);
        } else {
          setError("This Oliviuus ID is already taken. Please choose another.");
        }
      } catch (err) {
        setError("Unable to check username availability. Please try again.");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.post("/auth/custom-account", {
          username,
          password,
          redirectUrl: redirectUrl || "/"
        });

        if (response.data.success) {
          if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
          }
          setStep(3);
          setTimeout(() => {
            window.location.href = response.data.redirectUrl || redirectUrl || '/';
          }, 2000);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Account creation failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Create your Oliviuus ID</h2>
              <p className="text-gray-400 text-sm mt-1">
                {step === 1 && "Choose a unique Oliviuus ID"}
                {step === 2 && "Create a secure password"}
                {step === 3 && "Account created successfully"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Choose your Oliviuus ID
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder="e.g., john.doe"
                    disabled={loading}
                  />
                </div>
                <p className="text-gray-500 text-sm mt-3">
                  Your Oliviuus ID will be used to sign in and appear on your profile.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Create a password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Minimum 8 characters"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Re-enter your password"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-800">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Account Created!</h3>
              <p className="text-gray-400">
                Your Oliviuus ID <span className="font-medium text-white">{username}</span> has been created.
              </p>
              <p className="text-gray-500 text-sm mt-6">
                Redirecting you to Oliviuus...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex justify-between">
            {step > 1 && step < 3 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-400 hover:text-white font-medium"
                disabled={loading}
              >
                Back
              </button>
            )}
            <div className={step > 1 ? "ml-auto" : "w-full"}>
              <button
                onClick={handleNext}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-all w-full ${
                  loading
                    ? "bg-purple-800 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {step === 1 ? "Checking..." : "Creating..."}
                  </span>
                ) : (
                  step === 3 ? "Continue to Oliviuus" : "Next"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAccountModal;