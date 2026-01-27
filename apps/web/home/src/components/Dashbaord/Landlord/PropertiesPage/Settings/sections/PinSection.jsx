import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info,
  LockKeyhole,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import api from '../../../../../../api/axios';

const PinSection = ({ isanzureUser, showNotification, refreshAllData }) => {
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState({ type: '', text: '' });
  const [pinLocked, setPinLocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPinVerified, setCurrentPinVerified] = useState(false);

  // Extract PIN status from isanzureUser
  const userHasPin = isanzureUser?.security?.has_pin || false;
  const pinAttempts = isanzureUser?.security?.pin_attempts || 0;
  const isLocked = isanzureUser?.security?.is_locked || false;
  const pinSetAt = isanzureUser?.security?.pin_set_at;

  // Update local state when isanzureUser changes
  useEffect(() => {
    setPinLocked(isLocked);
    setRemainingAttempts(5 - pinAttempts);
    // Reset verification state when user changes
    setCurrentPinVerified(false);
    setIsVerifying(false);
  }, [isanzureUser, pinAttempts, isLocked]);

  // Verify current PIN first
  const handleVerifyCurrentPin = async (e) => {
    e.preventDefault();
    
    if (!pinData.currentPin) {
      setPinMessage({ type: 'error', text: 'Please enter your current PIN' });
      return;
    }

    if (pinData.currentPin.length !== 4 || !/^\d{4}$/.test(pinData.currentPin)) {
      setPinMessage({ type: 'error', text: 'Current PIN must be 4 digits' });
      return;
    }

    setIsVerifying(true);
    setPinMessage({ type: '', text: '' });

    try {
      // Use verify PIN endpoint
      const response = await api.post('/isanzure/settings/verify-pin', {
        pin: pinData.currentPin
      });
      
      if (response.data.success) {
        setCurrentPinVerified(true);
        setPinMessage({ 
          type: 'success', 
          text: 'Current PIN verified successfully. You can now set a new PIN.' 
        });
        showNotification('PIN verified successfully', 'success');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to verify PIN';
      setPinMessage({ type: 'error', text: errorMessage });
      
      // Update lock status
      if (errorMessage.includes('locked') || error.response?.status === 423) {
        setPinLocked(true);
      }
      
      // Update remaining attempts
      const attemptsMatch = errorMessage.match(/(\d+)\s+attempts remaining/);
      if (attemptsMatch) {
        setRemainingAttempts(parseInt(attemptsMatch[1]));
      } else if (error.response?.data?.data?.remaining_attempts) {
        setRemainingAttempts(error.response.data.data.remaining_attempts);
      }
      
      showNotification(errorMessage, 'error');
      
      // Clear current PIN on failed attempt
      setPinData({ ...pinData, currentPin: '' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPin = async (e) => {
    e.preventDefault();
    
    // If user has PIN and hasn't verified it yet, verify first
    if (userHasPin && !currentPinVerified) {
      await handleVerifyCurrentPin(e);
      return;
    }
    
    // Clear previous messages
    setPinMessage({ type: '', text: '' });

    // Validation
    if (!pinData.newPin) {
      setPinMessage({ type: 'error', text: 'New PIN is required' });
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      setPinMessage({ type: 'error', text: 'New PINs do not match' });
      return;
    }

    if (pinData.newPin.length !== 4 || !/^\d{4}$/.test(pinData.newPin)) {
      setPinMessage({ type: 'error', text: 'PIN must be exactly 4 digits' });
      return;
    }

    // Check if PIN is locked
    if (pinLocked) {
      setPinMessage({ 
        type: 'error', 
        text: 'PIN is locked due to too many failed attempts. Please reset attempts first.' 
      });
      return;
    }

    setPinLoading(true);
    try {
      // Prepare data to send
      const dataToSend = {
        newPin: pinData.newPin,
        confirmPin: pinData.confirmPin
      };
      
      // Include current PIN if user has PIN
      if (userHasPin && pinData.currentPin) {
        dataToSend.currentPin = pinData.currentPin;
      }
      
      console.log('Setting new PIN with data:', dataToSend);
      
      const response = await api.post('/isanzure/settings/set-pin', dataToSend);
      
      if (response.data.success) {
        setPinMessage({ 
          type: 'success', 
          text: response.data.message || 'Security PIN updated successfully' 
        });
        
        // Reset form and verification state
        setPinData({ currentPin: '', newPin: '', confirmPin: '' });
        setCurrentPinVerified(false);
        
        // Show notification
        showNotification(
          userHasPin ? 'PIN updated successfully' : 'PIN set successfully', 
          'success'
        );
        
        // Refresh data
        if (refreshAllData) {
          await refreshAllData();
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update PIN';
      setPinMessage({ type: 'error', text: errorMessage });
      
      // Update PIN lock status based on error
      if (errorMessage.includes('locked') || errorMessage.includes('423')) {
        setPinLocked(true);
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setPinLoading(false);
    }
  };

  // Reset verification
  const handleResetVerification = () => {
    setCurrentPinVerified(false);
    setPinData({ ...pinData, newPin: '', confirmPin: '' });
    setPinMessage({ type: '', text: '' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-xl">
      {/* PIN Status Overview */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* PIN Status Card */}
          <div className={`p-4 rounded-lg border ${pinLocked 
            ? 'bg-red-50 border-red-200' 
            : userHasPin 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${pinLocked 
                  ? 'bg-red-100 text-red-600' 
                  : userHasPin 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {pinLocked ? <LockKeyhole className="w-5 h-5" /> : 
                   userHasPin ? <CheckCircle className="w-5 h-5" /> : 
                   <Lock className="w-5 h-5" />}
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">PIN Status</h4>
                  <p className={`text-sm ${pinLocked 
                    ? 'text-red-700' 
                    : userHasPin 
                      ? 'text-green-700' 
                      : 'text-yellow-700'
                  }`}>
                    {pinLocked ? 'Locked' : 
                     userHasPin ? 'Active' : 'Not Set'}
                  </p>
                  {userHasPin && pinSetAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Set on {formatDate(pinSetAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Info Card */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <h4 className="font-semibold text-blue-800">Security Level</h4>
                <p className="text-sm text-blue-700">
                  {userHasPin ? 'Enhanced Security' : 'Basic Security'}
                </p>
                {remainingAttempts < 5 && !pinLocked && (
                  <p className="text-xs text-blue-600 mt-1">
                    {remainingAttempts} attempts remaining
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PIN Set Time Info */}
        {userHasPin && pinSetAt && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700">
                  Your PIN was set on <span className="font-medium">{formatDate(pinSetAt)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  It's recommended to update your PIN every 90 days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Required Notice */}
        {userHasPin && !currentPinVerified && !pinLocked && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Verification Required</h4>
                <p className="text-sm text-yellow-700">
                  Please verify your current PIN before changing to a new one.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verified Success Message */}
        {currentPinVerified && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 mb-1">PIN Verified ✓</h4>
                <p className="text-sm text-green-700">
                  You can now set a new PIN. The form below is now active.
                </p>
              </div>
              <button
                onClick={handleResetVerification}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSetPin}>
        <div className="space-y-6">
          {/* Current PIN (always shown if user has PIN) */}
          {userHasPin && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Current PIN
                </label>
                <span className="text-xs text-gray-500">Required</span>
              </div>
              <div className="relative">
                <input
                  type={showCurrentPin ? "text" : "password"}
                  value={pinData.currentPin}
                  onChange={(e) => setPinData({...pinData, currentPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
                  placeholder="Enter current 4-digit PIN"
                  maxLength="4"
                  inputMode="numeric"
                  disabled={pinLocked || currentPinVerified}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {currentPinVerified 
                  ? '✓ Current PIN verified' 
                  : 'Enter your existing 4-digit PIN to verify your identity'}
              </p>
              
              {/* Verify Current PIN Button (only show if not verified yet) */}
              {!currentPinVerified && pinData.currentPin.length === 4 && !pinLocked && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleVerifyCurrentPin}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A573A5] transition-colors flex items-center gap-2"
                  >
                    {isVerifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Current PIN
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* New PIN (always shown) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                New PIN (4 digits)
              </label>
              <span className="text-xs text-gray-500">Required</span>
            </div>
            <div className="relative">
              <input
                type={showNewPin ? "text" : "password"}
                value={pinData.newPin}
                onChange={(e) => setPinData({...pinData, newPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                  userHasPin && !currentPinVerified
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-[#BC8BBC] bg-gray-50'
                }`}
                placeholder="Enter new 4-digit PIN"
                maxLength="4"
                inputMode="numeric"
                required
                disabled={pinLocked || (userHasPin && !currentPinVerified)}
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {userHasPin && !currentPinVerified
                ? 'Verify current PIN first to enable this field'
                : 'Create a new 4-digit PIN using numbers only (0-9)'}
            </p>
          </div>

          {/* Confirm PIN (always shown) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Confirm New PIN
              </label>
              <span className="text-xs text-gray-500">Required</span>
            </div>
            <div className="relative">
              <input
                type={showConfirmPin ? "text" : "password"}
                value={pinData.confirmPin}
                onChange={(e) => setPinData({...pinData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                  userHasPin && !currentPinVerified
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-[#BC8BBC] bg-gray-50'
                }`}
                placeholder="Confirm new 4-digit PIN"
                maxLength="4"
                inputMode="numeric"
                required
                disabled={pinLocked || (userHasPin && !currentPinVerified)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {userHasPin && !currentPinVerified
                ? 'Verify current PIN first to enable this field'
                : 'Re-enter your new PIN exactly as above'}
            </p>
          </div>

          {/* PIN Message */}
          {pinMessage.text && (
            <div className={`p-4 rounded-lg ${pinMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center">
                {pinMessage.type === 'success' ? 
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /> : 
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                }
                <span>{pinMessage.text}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={pinLoading || pinLocked || (userHasPin && !currentPinVerified)}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
              pinLoading || pinLocked || (userHasPin && !currentPinVerified)
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-[#BC8BBC] hover:bg-[#A573A5] text-white hover:shadow-md'
            }`}
          >
            {pinLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {userHasPin ? 'Updating PIN...' : 'Setting PIN...'}
              </span>
            ) : pinLocked ? (
              <span className="flex items-center justify-center">
                <LockKeyhole className="w-5 h-5 mr-2" />
                PIN Locked - Reset Required
              </span>
            ) : userHasPin && !currentPinVerified ? (
              <span className="flex items-center justify-center">
                <Lock className="w-5 h-5 mr-2" />
                Verify Current PIN First
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Shield className="w-5 h-5 mr-2" />
                {userHasPin ? 'Update Security PIN' : 'Set Security PIN'}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PinSection;