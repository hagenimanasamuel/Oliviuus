import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building,
  Smartphone,
  AlertTriangle,
  Info,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
  History,
  Clock,
  Lock,
  Key,
  BanknoteIcon,
  Verified,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Save,
  X,
  EyeIcon,
  Fingerprint,
  KeyRound,
  Plus
} from 'lucide-react';
import api from '../../../../api/axios';

export default function WithdrawalAccountSection({ 
  accountSettings, 
  showNotification, 
  refreshAllData,
  onAccountChange 
}) {
  const [withdrawalData, setWithdrawalData] = useState({
    method: '',
    accountName: '',
    accountNumber: '',
    phoneNumber: '',
    pin: ''
  });
  
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [existingWithdrawal, setExistingWithdrawal] = useState(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPinVerification, setShowPinVerification] = useState(false);
  const [revealingData, setRevealingData] = useState(false);
  const [dataTypeToReveal, setDataTypeToReveal] = useState(null);
  const [revealedAccountNumber, setRevealedAccountNumber] = useState(null);
  const [revealedPhoneNumber, setRevealedPhoneNumber] = useState(null);
  const [revealedAccountName, setRevealedAccountName] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const userHasPin = accountSettings?.security?.has_pin || false;
  const isWithdrawalPending = accountSettings?.withdrawal?.requires_verification || false;
  const isWithdrawalVerified = accountSettings?.withdrawal?.verified || false;

  useEffect(() => {
    if (accountSettings?.withdrawal) {
      const withdrawal = accountSettings.withdrawal;
      if (withdrawal.method) {
        setExistingWithdrawal(withdrawal);
        setWithdrawalData({
          method: withdrawal.method || '',
          accountName: withdrawal.account_name || '',
          accountNumber: '',
          phoneNumber: '',
          pin: ''
        });
      }
    }
  }, [accountSettings]);

  useEffect(() => {
    loadWithdrawalHistory();
  }, []);

  const loadWithdrawalHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get('/isanzure/settings/tenant/withdrawal-history');
      if (response.data.success) {
        setWithdrawalHistory(response.data.data.history || []);
      }
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    if (value.includes('+')) {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 3) return `+${cleaned}`;
      if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      if (cleaned.length <= 9) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)}`;
    }
    const strValue = value.toString();
    if (strValue.startsWith('250') && strValue.length === 12) {
      return `+250 ${strValue.slice(3, 6)} ${strValue.slice(6, 9)} ${strValue.slice(9)}`;
    }
    return value;
  };

  const getMethodDisplay = (method) => {
    switch(method) {
      case 'bk': return 'Bank of Kigali';
      case 'equity': return 'Equity Bank';
      case 'mtn': return 'MTN Mobile Money';
      case 'airtel': return 'Airtel Money';
      default: return method;
    }
  };

  const getMethodIcon = (method) => {
    switch(method) {
      case 'bk':
      case 'equity':
        return <Building className="w-6 h-6" />;
      case 'mtn':
      case 'airtel':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <BanknoteIcon className="w-6 h-6" />;
    }
  };

  const getMethodColor = (method) => {
    switch(method) {
      case 'bk': return 'bg-blue-100 text-blue-600';
      case 'equity': return 'bg-purple-100 text-purple-600';
      case 'mtn': return 'bg-yellow-100 text-yellow-600';
      case 'airtel': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const maskSensitiveData = (data, type) => {
    if (!data) return 'Not set';
    if (type === 'account') return '••••••••';
    if (type === 'phone') return '•••• •••• •••';
    if (type === 'name') {
      const parts = data.split(' ');
      if (parts.length > 1) return parts[0] + ' •••••';
      return data;
    }
    return '••••••••';
  };

  const revealSensitiveData = async (dataType) => {
    if (!userHasPin) {
      showNotification('PIN verification is required to view sensitive data', 'error');
      return;
    }

    setDataTypeToReveal(dataType);
    setRevealingData(true);
    setPinError('');
    
    try {
      const response = await api.post('/isanzure/settings/tenant/reveal-withdrawal-data', {
        pin: withdrawalData.pin
      });
      
      if (response.data.success) {
        const revealed = response.data.data.current;
        
        if (dataType === 'account' && revealed.accountNumber) {
          setShowAccountNumber(true);
          setRevealedAccountNumber(revealed.accountNumber);
        } else if (dataType === 'phone' && revealed.phoneNumber) {
          setShowPhoneNumber(true);
          setRevealedPhoneNumber(revealed.phoneNumber);
        }
        
        if (revealed.accountName) {
          setRevealedAccountName(revealed.accountName);
        }
        
        showNotification('Sensitive data revealed successfully', 'success');
        setWithdrawalData({ ...withdrawalData, pin: '' });
        setDataTypeToReveal(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reveal data';
      setPinError(errorMessage);
      
      if (error.response?.data?.requires_pin) {
        showNotification('PIN verification required', 'error');
      }
    } finally {
      setRevealingData(false);
    }
  };

  const resetRevealedData = () => {
    setRevealedAccountNumber(null);
    setRevealedPhoneNumber(null);
    setRevealedAccountName(null);
    setShowAccountNumber(false);
    setShowPhoneNumber(false);
    setDataTypeToReveal(null);
  };

  const validateWithdrawalData = () => {
    setPinError('');

    if (!withdrawalData.method) {
      showNotification('Please select a refund method', 'error');
      return false;
    }

    if (withdrawalData.method === 'bk' || withdrawalData.method === 'equity') {
      if (!withdrawalData.accountName.trim()) {
        showNotification('Please enter account holder name', 'error');
        return false;
      }
      if (!withdrawalData.accountNumber.trim()) {
        showNotification('Please enter account number', 'error');
        return false;
      }
      if (!/^\d+$/.test(withdrawalData.accountNumber.replace(/\s/g, ''))) {
        showNotification('Account number must contain only numbers', 'error');
        return false;
      }
      if (withdrawalData.accountNumber.replace(/\s/g, '').length < 8) {
        showNotification('Account number is too short', 'error');
        return false;
      }
    } else {
      if (!withdrawalData.phoneNumber.trim()) {
        showNotification('Please enter mobile money phone number', 'error');
        return false;
      }
      const cleanedPhone = withdrawalData.phoneNumber.replace(/\s/g, '');
      if (!/^\+250[0-9]{9}$/.test(cleanedPhone)) {
        showNotification('Please enter a valid Rwandan phone number (e.g., +250 7XX XXX XXX)', 'error');
        return false;
      }
      if (!withdrawalData.accountName.trim()) {
        showNotification('Please enter account name', 'error');
        return false;
      }
    }

    if (requiresPin && !withdrawalData.pin) {
      setPinError('PIN is required to update refund account');
      return false;
    }

    if (requiresPin && (withdrawalData.pin.length !== 4 || !/^\d{4}$/.test(withdrawalData.pin))) {
      setPinError('PIN must be 4 digits');
      return false;
    }

    return true;
  };

  const handleSaveWithdrawal = async () => {
    if (!validateWithdrawalData()) return;
    
    if (!userHasPin) {
      showNotification('Please set up your account PIN first before adding a refund account', 'error');
      return;
    }
    
    setWithdrawalLoading(true);
    setPinError('');
    
    try {
      const dataToSend = {
        method: withdrawalData.method,
        accountName: withdrawalData.accountName.trim(),
        accountNumber: withdrawalData.method === 'bk' || withdrawalData.method === 'equity' 
          ? withdrawalData.accountNumber.replace(/\s/g, '')
          : null,
        phoneNumber: withdrawalData.method === 'mtn' || withdrawalData.method === 'airtel'
          ? withdrawalData.phoneNumber.replace(/\s/g, '')
          : null
      };

      if (requiresPin && withdrawalData.pin) {
        dataToSend.pin = withdrawalData.pin;
      }

      const response = await api.post('/isanzure/settings/tenant/withdrawal', dataToSend);
      
      if (response.data.success) {
        showNotification(response.data.message || 'Refund account saved successfully', 'success');
        
        setWithdrawalData({
          method: '',
          accountName: '',
          accountNumber: '',
          phoneNumber: '',
          pin: ''
        });
        
        resetRevealedData();
        
        if (refreshAllData) {
          await refreshAllData();
        }
        
        await loadWithdrawalHistory();
        
        setIsEditing(false);
        setRequiresPin(false);
        setShowPinVerification(false);
        
        if (onAccountChange) {
          onAccountChange();
        }
        
        if (response.data.data?.verificationRequired) {
          showNotification('Your refund account will be verified within 24-48 hours', 'info');
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save refund account';
      
      if (error.response?.data?.requires_pin_setup) {
        showNotification('Please set up your account PIN first', 'error');
      } else if (error.response?.data?.requires_pin) {
        setRequiresPin(true);
        setShowPinVerification(true);
        setPinError('PIN verification required');
        setTimeout(() => {
          document.getElementById('pin-verification-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      } else if (errorMessage.includes('PIN')) {
        setPinError(errorMessage);
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    resetRevealedData();
    
    setWithdrawalData({
      method: existingWithdrawal?.method || '',
      accountName: existingWithdrawal?.account_name || '',
      accountNumber: '',
      phoneNumber: '',
      pin: ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setRequiresPin(false);
    setShowPinVerification(false);
    setPinError('');
    resetRevealedData();
    setWithdrawalData({
      method: '',
      accountName: '',
      accountNumber: '',
      phoneNumber: '',
      pin: ''
    });
  };

  const handleDeleteAccount = async () => {
    if (!userHasPin) {
      showNotification('PIN verification required to delete refund account', 'error');
      setRequiresPin(true);
      setShowPinVerification(true);
      return;
    }

    if (!withdrawalData.pin) {
      setPinError('Please enter PIN to delete account');
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api.delete('/isanzure/settings/tenant/withdrawal', {
        data: { pin: withdrawalData.pin }
      });
      
      if (response.data.success) {
        showNotification('Refund account deleted successfully', 'success');
        setShowDeleteConfirm(false);
        setIsEditing(false);
        setExistingWithdrawal(null);
        setShowPinVerification(false);
        resetRevealedData();
        
        if (refreshAllData) {
          await refreshAllData();
        }
        
        await loadWithdrawalHistory();
        
        if (onAccountChange) {
          onAccountChange();
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete refund account';
      
      if (error.response?.data?.requires_pin) {
        setRequiresPin(true);
        setPinError('PIN verification required');
      } else {
        setPinError(errorMessage);
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDisplayData = (data, type) => {
    if (!data) return 'Not set';
    
    if (type === 'account') {
      if (showAccountNumber && revealedAccountNumber) {
        return revealedAccountNumber;
      }
      return maskSensitiveData(data, 'account');
    }
    
    if (type === 'phone') {
      if (showPhoneNumber && revealedPhoneNumber) {
        return formatPhoneNumber(revealedPhoneNumber);
      }
      return maskSensitiveData(data, 'phone');
    }
    
    if (type === 'name') {
      if (revealedAccountName) {
        return revealedAccountName;
      }
      return data;
    }
    
    return data;
  };

  const calculateVerificationTime = () => {
    if (!existingWithdrawal?.set_at) return '24-48 hours';
    const setDate = new Date(existingWithdrawal.set_at);
    const now = new Date();
    const diffHours = Math.floor((now - setDate) / (1000 * 60 * 60));
    
    if (diffHours < 24) return 'Within 24 hours';
    if (diffHours < 48) return 'Within 48 hours';
    return 'Soon';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Refund Account</h3>
              <p className="text-sm text-gray-600">For refunds and security deposits</p>
            </div>
          </div>
          {existingWithdrawal && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide History' : 'View History'}
              </button>
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#BC8BBC] bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Update
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* PIN Setup Reminder */}
        {!userHasPin && !existingWithdrawal && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Lock className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-800 mb-1">PIN Required</h4>
                <p className="text-sm text-yellow-700">
                  Set up a PIN first to secure your refund account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Account History
            </h4>
            
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#BC8BBC]" />
              </div>
            ) : withdrawalHistory.length > 0 ? (
              <div className="space-y-3">
                {withdrawalHistory.slice(0, 3).map((record, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${getMethodColor(record.withdrawal_method)}`}>
                          {getMethodIcon(record.withdrawal_method)}
                        </div>
                        <span className="font-medium text-gray-700">
                          {getMethodDisplay(record.withdrawal_method)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                        record.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.verification_status || 'pending'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center justify-between mb-1">
                        <span>Account:</span>
                        <span className="font-medium">••••••••</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                      <span>{formatDate(record.changed_at)}</span>
                      {record.is_current && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No history available</p>
            )}
          </div>
        )}

        {/* Existing Account Display */}
        {existingWithdrawal && !isEditing ? (
          <div className="space-y-4">
            {/* Verification Status */}
            {isWithdrawalPending && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-800 mb-1">Verification Pending</h4>
                    <p className="text-sm text-yellow-700">
                      Your refund account is being verified. Expected: {calculateVerificationTime()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isWithdrawalVerified && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Verified className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-800 mb-1">Account Verified</h4>
                    <p className="text-sm text-green-700">
                      Your refund account is verified and ready to receive funds.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Account Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${getMethodColor(existingWithdrawal.method)}`}>
                  {getMethodIcon(existingWithdrawal.method)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{getMethodDisplay(existingWithdrawal.method)}</h4>
                  <p className="text-sm text-gray-600">Primary refund method</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Name</span>
                  <span className="font-medium text-gray-900">
                    {getDisplayData(existingWithdrawal.account_name, 'name')}
                  </span>
                </div>

                {existingWithdrawal.account_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900">
                        {showAccountNumber && revealedAccountNumber ? revealedAccountNumber : '••••••••'}
                      </span>
                      <button
                        onClick={() => revealSensitiveData('account')}
                        disabled={revealingData && dataTypeToReveal === 'account'}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {revealingData && dataTypeToReveal === 'account' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : showAccountNumber ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {existingWithdrawal.phone_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phone Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900">
                        {showPhoneNumber && revealedPhoneNumber ? formatPhoneNumber(revealedPhoneNumber) : '•••• •••• •••'}
                      </span>
                      <button
                        onClick={() => revealSensitiveData('phone')}
                        disabled={revealingData && dataTypeToReveal === 'phone'}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {revealingData && dataTypeToReveal === 'phone' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : showPhoneNumber ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* PIN Reveal Section */}
              {dataTypeToReveal && userHasPin && !showAccountNumber && !showPhoneNumber && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-purple-700 mb-2">
                        Enter PIN to reveal {dataTypeToReveal === 'account' ? 'account number' : 'phone number'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={withdrawalData.pin}
                          onChange={(e) => setWithdrawalData({...withdrawalData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="••••"
                          maxLength="4"
                        />
                        <button
                          onClick={() => revealSensitiveData(dataTypeToReveal)}
                          disabled={!withdrawalData.pin || revealingData}
                          className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A]"
                        >
                          {revealingData ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                      {pinError && <p className="mt-1 text-xs text-red-600">{pinError}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Note */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Shield size={12} />
                  Click the eye icon and enter PIN to view sensitive data
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEditClick}
                className="flex-1 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A] transition-colors font-medium"
              >
                Update Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          // Add/Edit Form
          <div className="space-y-6">
            {/* Method Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Refund Method
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'bk', label: 'Bank of Kigali', icon: Building },
                  { id: 'equity', label: 'Equity Bank', icon: Building },
                  { id: 'mtn', label: 'MTN Mobile Money', icon: Smartphone },
                  { id: 'airtel', label: 'Airtel Money', icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setWithdrawalData({...withdrawalData, method: method.id})}
                    className={`p-4 border rounded-xl text-center transition-all ${
                      withdrawalData.method === method.id 
                        ? 'border-[#BC8BBC] bg-white shadow-sm ring-2 ring-[#BC8BBC] ring-opacity-20' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-3 mx-auto w-12 h-12 flex items-center justify-center ${
                      withdrawalData.method === method.id ? 'bg-[#BC8BBC] bg-opacity-10' : 'bg-gray-100'
                    }`}>
                      <method.icon className={`w-6 h-6 ${
                        withdrawalData.method === method.id ? 'text-[#BC8BBC]' : 'text-gray-500'
                      }`} />
                    </div>
                    <span className={`block text-sm font-medium ${
                      withdrawalData.method === method.id ? 'text-[#BC8BBC]' : 'text-gray-700'
                    }`}>
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            {withdrawalData.method && (
              <div className="space-y-4">
                {(withdrawalData.method === 'bk' || withdrawalData.method === 'equity') ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={withdrawalData.accountName}
                        onChange={(e) => setWithdrawalData({...withdrawalData, accountName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]"
                        placeholder="Full name on account"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={withdrawalData.accountNumber}
                        onChange={(e) => setWithdrawalData({...withdrawalData, accountNumber: e.target.value.replace(/\D/g, '')})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]"
                        placeholder="Bank account number"
                        inputMode="numeric"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={withdrawalData.phoneNumber}
                        onChange={(e) => setWithdrawalData({...withdrawalData, phoneNumber: formatPhoneNumber(e.target.value)})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]"
                        placeholder="+250 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={withdrawalData.accountName}
                        onChange={(e) => setWithdrawalData({...withdrawalData, accountName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]"
                        placeholder="Name on mobile money account"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PIN Verification */}
            {showPinVerification && (
              <div id="pin-verification-section" className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800 mb-1">PIN Required</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Enter your PIN to {isEditing ? 'update' : 'save'} refund account
                    </p>
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={withdrawalData.pin}
                        onChange={(e) => setWithdrawalData({...withdrawalData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#BC8BBC] ${
                          pinError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter 4-digit PIN"
                        maxLength="4"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-2 text-gray-500"
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {pinError && <p className="mt-1 text-xs text-red-600">{pinError}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveWithdrawal}
                disabled={!withdrawalData.method || withdrawalLoading || !userHasPin}
                className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 ${
                  !withdrawalData.method || withdrawalLoading || !userHasPin
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#BC8BBC] text-white hover:bg-[#8A5A8A]'
                }`}
              >
                {withdrawalLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isEditing ? 'Update' : 'Save'} Account
                  </>
                )}
              </button>
              {isEditing && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Remove Refund Account</h3>
                <p className="text-sm text-gray-600">This action requires PIN verification</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {userHasPin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your 4-digit PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={withdrawalData.pin}
                      onChange={(e) => setWithdrawalData({...withdrawalData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                      className={`w-full px-4 py-3 border ${pinError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-red-500`}
                      placeholder="Enter PIN"
                      maxLength="4"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-3 text-gray-500"
                    >
                      {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {pinError && <p className="mt-1 text-sm text-red-600">{pinError}</p>}
                </div>
              )}
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  Removing your refund account will prevent you from receiving refunds until you set up a new one.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={(userHasPin && !withdrawalData.pin) || deleteLoading}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold ${
                    (userHasPin && !withdrawalData.pin) || deleteLoading
                      ? 'bg-red-300 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {deleteLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Removing...
                    </span>
                  ) : 'Confirm Removal'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPinError('');
                    setWithdrawalData({...withdrawalData, pin: ''});
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}