import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  BookOpen,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIsanzureAuth  } from '../../context/IsanzureAuthContext';
import api from '../../api/axios';
import Logo from '../../components/ui/Logo';

export default function BecomeLandlordPage() {
  const { user, refreshAuth } = useAuth();
  const { isLandlord, refreshIsanzureUser } = useIsanzureAuth ();
  
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    agreeTerms: false,
    agreePrivacy: false,
    agreeGuidelines: false
  });

  // Set checking status based on iSanzureAuth loading
  useEffect(() => {
    if (user) {
      // Small delay to ensure context is loaded
      const timer = setTimeout(() => {
        setCheckingStatus(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCheckingStatus(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLandlord) {
      showNotification('You are already registered as a landlord!', 'success');
    }
  }, [isLandlord]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleBecomeLandlord = async () => {
    if (!user) {
      showNotification('Please log in to become a landlord', 'error');
      return;
    }

    // Check if all agreements are accepted
    if (!formData.agreeTerms || !formData.agreePrivacy || !formData.agreeGuidelines) {
      showNotification('Please accept all terms, privacy policy, and guidelines', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/isanzure/create-landlord');

      if (response.data.success) {
        // Refresh auth to get updated user data
        await refreshAuth();
        
        // Refresh iSanzure user data
        await refreshIsanzureUser();

        // Show success notification
        showNotification(response.data.message || 'Congratulations! You are now a landlord!', 'success');

        // Show additional info after delay
        setTimeout(() => {
          showNotification('You can now list your properties and start earning!', 'info');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to create landlord account');
      }
    } catch (error) {
      console.error('Error becoming landlord:', error);
      showNotification(
        error.response?.data?.message || error.message || 'Failed to become landlord',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = () => {
    window.location.href = '/landlord/dashboard';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const allAgreementsAccepted = formData.agreeTerms && formData.agreePrivacy && formData.agreeGuidelines;

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your account status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Custom Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-out ${notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Shield className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setNotification(null)}
                    className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
                  >
                    <span className="sr-only">Dismiss</span>
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-40 h-40">
              <Logo className="w-full h-full" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {isLandlord ? 'Welcome, Landlord!' : 'Become a Landlord'}
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {isLandlord
              ? 'You are already registered as a landlord. Manage your properties and start earning!'
              : 'Register as a landlord to list and manage your properties.'
            }
          </p>

          {/* User info banner */}
          {user && (
            <div className="mt-6 inline-flex items-center bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600">Account</p>
                  <p className="font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="ml-6 pl-6 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  {isLandlord ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">Landlord</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">Not a Landlord</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        {isLandlord ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You're Already a Landlord!
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You have full access to all landlord features. Start managing your properties and welcoming tenants.
            </p>

            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={handleViewDashboard}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center"
              >
                Go to Landlord Center
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
              <button
                onClick={handleGoHome}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Registration Requirements
            </h2>

            <div className="space-y-6 mb-8">
              {/* Terms and Conditions */}
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Terms and Conditions</h3>
                      <a
                        href="/terms/landlord"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Read Full Terms
                      </a>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      By becoming a landlord, you agree to our Terms and Conditions. This includes your responsibilities as a property owner, payment terms, dispute resolution procedures, and platform usage guidelines.
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                        I have read and agree to the Terms and Conditions
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Policy */}
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Lock className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Privacy Policy</h3>
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Read Privacy Policy
                      </a>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      We respect your privacy and are committed to protecting your personal information. Our Privacy Policy explains how we collect, use, and safeguard your data when you use our platform as a landlord.
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="agreePrivacy"
                        checked={formData.agreePrivacy}
                        onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="agreePrivacy" className="text-sm text-gray-700">
                        I have read and agree to the Privacy Policy
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landlord Guidelines */}
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-600 mt-1" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">Landlord Guidelines</h3>
                      <a
                        href="/guidelines/landlord"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Read Guidelines
                      </a>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      As a landlord, you must follow our guidelines for property listings, tenant interactions, maintenance standards, and community rules to ensure a safe and positive experience for everyone.
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="agreeGuidelines"
                        checked={formData.agreeGuidelines}
                        onChange={(e) => setFormData({ ...formData, agreeGuidelines: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="agreeGuidelines" className="text-sm text-gray-700">
                        I agree to follow the Landlord Guidelines
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Button */}
            <div className="pt-6 border-t border-gray-200">
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">You need to be logged in to become a landlord</p>
                  <button
                    onClick={() => window.location.href = '/login?redirect=/become-landlord'}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Login to Continue
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBecomeLandlord}
                  disabled={loading || !allAgreementsAccepted}
                  className={`w-full py-4 text-white rounded-lg transition-colors font-semibold text-lg ${loading || !allAgreementsAccepted
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Registration...
                    </span>
                  ) : !allAgreementsAccepted ? (
                    'Accept All Agreements to Continue'
                  ) : (
                    'Register as Landlord'
                  )}
                </button>
              )}

              <p className="text-center text-gray-500 text-sm mt-4">
                Registration is free. You can list your properties immediately after registration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}