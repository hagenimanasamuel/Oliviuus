import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  Building,
  Phone as PhoneIcon,
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
  FileCheck,
  Verified,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Save,
  X,
  Bell,
  Calendar,
  ChevronRight,
  EyeIcon,
  Fingerprint,
  KeyRound
} from 'lucide-react';
import api from '../../../../../../api/axios';

const WithdrawalSection = ({ accountSettings, showNotification, refreshAllData }) => {
  const [withdrawalData, setWithdrawalData] = useState({
    method: '', // 'bk', 'equity', 'mtn', 'airtel'
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
  const [revealedData, setRevealedData] = useState(null);
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

  // Check if user has PIN
  const userHasPin = accountSettings?.security?.has_pin || false;
  const isWithdrawalPending = accountSettings?.withdrawal?.requires_verification || false;
  const isWithdrawalVerified = accountSettings?.withdrawal?.verified || false;

  // Initialize from accountSettings
  useEffect(() => {
    if (accountSettings?.withdrawal) {
      const withdrawal = accountSettings.withdrawal;
      
      if (withdrawal.method) {
        setExistingWithdrawal(withdrawal);
        
        // Only set account name for auto-fill, not account number or phone
        setWithdrawalData({
          method: withdrawal.method || '',
          accountName: withdrawal.account_name || '',
          accountNumber: '', // Do NOT auto-fill encrypted data
          phoneNumber: '', // Do NOT auto-fill encrypted data
          pin: ''
        });
      }
    }
  }, [accountSettings]);

  // Load withdrawal history
  useEffect(() => {
    loadWithdrawalHistory();
  }, []);

  const loadWithdrawalHistory = async () => {
    try {
      const response = await api.get('/isanzure/settings/withdrawal-history');
      if (response.data.success) {
        setWithdrawalHistory(response.data.data.history || []);
      }
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    
    // If already formatted, return as is
    if (value.includes('+')) {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 3) return `+${cleaned}`;
      if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      if (cleaned.length <= 9) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)}`;
    }
    
    // If it's a raw number like 250788123456
    const strValue = value.toString();
    if (strValue.startsWith('250') && strValue.length === 12) {
      return `+250 ${strValue.slice(3, 6)} ${strValue.slice(6, 9)} ${strValue.slice(9)}`;
    }
    
    // Return as is if we can't format
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
        return <CreditCard className="w-6 h-6" />;
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
    
    if (type === 'account') {
      return '••••••••';
    }
    if (type === 'phone') {
      return '•••• •••• •••';
    }
    if (type === 'name') {
      const parts = data.split(' ');
      if (parts.length > 1) {
        return parts[0] + ' •••••';
      }
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
      const response = await api.post('/isanzure/settings/reveal-withdrawal-data', {
        pin: withdrawalData.pin
      });
      
      if (response.data.success) {
        const revealed = response.data.data.current;
        setRevealedData(revealed);
        
        // Update the revealed data state
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
    setRevealedData(null);
    setDataTypeToReveal(null);
  };

  const validateWithdrawalData = () => {
    setPinError('');

    if (!withdrawalData.method) {
      showNotification('Please select a withdrawal method', 'error');
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

    // Validate PIN if required
    if (requiresPin && !withdrawalData.pin) {
      setPinError('PIN is required to update withdrawal account');
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
    
    // Check if user has PIN (required for encryption)
    if (!userHasPin) {
      showNotification('Please set up your account PIN first before adding withdrawal accounts', 'error');
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

      // Include PIN if required
      if (requiresPin && withdrawalData.pin) {
        dataToSend.pin = withdrawalData.pin;
      }

      const response = await api.post('/isanzure/settings/save-withdrawal', dataToSend);
      
      if (response.data.success) {
        showNotification(response.data.message || 'Withdrawal account saved successfully', 'success');
        
        // Reset form
        setWithdrawalData({
          method: '',
          accountName: '',
          accountNumber: '',
          phoneNumber: '',
          pin: ''
        });
        
        // Reset revealed data
        resetRevealedData();
        
        // Refresh data
        if (refreshAllData) {
          await refreshAllData();
        }
        
        // Load updated history
        await loadWithdrawalHistory();
        
        // Reset states
        setIsEditing(false);
        setRequiresPin(false);
        setShowPinVerification(false);
        
        // Show success message with verification info
        if (response.data.data?.verificationRequired) {
          showNotification('Your withdrawal account will be verified within 24-48 hours', 'info');
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save withdrawal account';
      
      // Handle PIN errors specifically
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
    
    // Only pre-fill account name, not encrypted data
    setWithdrawalData({
      method: existingWithdrawal?.method || '',
      accountName: existingWithdrawal?.account_name || '',
      accountNumber: '', // DO NOT auto-fill encrypted data
      phoneNumber: '', // DO NOT auto-fill encrypted data
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
      showNotification('PIN verification required to delete withdrawal account', 'error');
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
      const response = await api.delete('/isanzure/settings/delete-withdrawal', {
        data: { pin: withdrawalData.pin }
      });
      
      if (response.data.success) {
        showNotification('Withdrawal account deleted successfully', 'success');
        setShowDeleteConfirm(false);
        setIsEditing(false);
        setExistingWithdrawal(null);
        setShowPinVerification(false);
        resetRevealedData();
        
        if (refreshAllData) {
          await refreshAllData();
        }
        
        await loadWithdrawalHistory();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete withdrawal account';
      
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

  const calculateVerificationTime = () => {
    if (!accountSettings?.withdrawal?.set_at) return '24-48 hours';
    const setDate = new Date(accountSettings.withdrawal.set_at);
    const now = new Date();
    const diffHours = Math.floor((now - setDate) / (1000 * 60 * 60));
    
    if (diffHours < 24) return 'Within 24 hours';
    if (diffHours < 48) return 'Within 48 hours';
    return 'Soon';
  };

  // Get display data based on revealed state
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

  return (
    <div className="max-w-2xl">
      {/* PIN Setup Reminder */}
      {!userHasPin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Lock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 mb-1">Security Notice</h4>
              <p className="text-sm text-yellow-700 mb-2">
                You need to set up a 4-digit account PIN before you can add or view withdrawal account details.
                This PIN encrypts your sensitive data and is required for all security operations.
              </p>
              <button
                onClick={() => {
                  showNotification('Please go to Security Settings to set up your PIN', 'info');
                }}
                className="text-sm font-medium text-yellow-700 hover:text-yellow-800 flex items-center gap-1"
              >
                <KeyRound className="w-4 h-4" />
                Set Up PIN Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Withdrawal Info - Display Mode */}
      {existingWithdrawal && !isEditing && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Withdrawal Account</h3>
              <p className="text-sm text-gray-600 mt-1">Your configured payment method</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadWithdrawalHistory().then(() => setShowHistory(!showHistory))}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide History' : 'View History'}
              </button>
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray bg-[#BC8BBC] bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Update Account
              </button>
            </div>
          </div>

          {/* Verification Status Banner */}
          {isWithdrawalPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-800 mb-1">Verification Pending</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Your withdrawal account is pending verification. You can still use it, but manual review may be required for large withdrawals.
                  </p>
                  <div className="flex items-center text-xs text-yellow-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    Submitted on {formatDate(accountSettings?.withdrawal?.set_at)} • 
                    <span className="ml-2">Expected: {calculateVerificationTime()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verified Status Banner */}
          {isWithdrawalVerified && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <Verified className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 mb-1">Account Verified</h4>
                  <p className="text-sm text-green-700">
                    Your withdrawal account has been verified. You can receive payments without restrictions.
                  </p>
                  {accountSettings?.withdrawal?.verified_at && (
                    <div className="flex items-center text-xs text-green-600 mt-2">
                      <Calendar className="w-3 h-3 mr-1" />
                      Verified on {formatDate(accountSettings.withdrawal.verified_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Withdrawal History Panel */}
          {showHistory && withdrawalHistory.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Account History
              </h4>
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
                        <span className="font-medium"> ••••••••</span>
                      </div>
                      {record.account_number && (
                        <div className="flex items-center justify-between mb-1">
                          <span>Account No:</span>
                          <span className="font-mono">
                            ••••••••
                          </span>
                        </div>
                      )}
                      {record.phone_number && (
                        <div className="flex items-center justify-between">
                          <span>Phone:</span>
                          <span className="font-mono">
                            •••• •••• •••
                          </span>
                        </div>
                      )}
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
              {withdrawalHistory.length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Showing 3 of {withdrawalHistory.length} recent changes
                </p>
              )}
            </div>
          )}

          {/* Current Withdrawal Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getMethodColor(existingWithdrawal.method)}`}>
                  {getMethodIcon(existingWithdrawal.method)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{getMethodDisplay(existingWithdrawal.method)}</h4>
                  <p className="text-sm text-gray-600">Primary withdrawal method</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  isWithdrawalVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isWithdrawalVerified ? (
                    <span className="flex items-center gap-1">
                      <Verified className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Verification Pending
                    </span>
                  )}
                </span>
                {accountSettings?.withdrawal?.set_at && (
                  <span className="text-xs text-gray-500">
                    Set {formatDate(accountSettings.withdrawal.set_at)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-4 ml-11">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          title={showAccountNumber ? "Hide account number" : "Show account number (PIN required)"}
                        >
                          {revealingData && dataTypeToReveal === 'account' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : showAccountNumber ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <>
                              <KeyRound className="w-3 h-3" />
                              <EyeIcon className="w-4 h-4" />
                            </>
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
                          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          title={showPhoneNumber ? "Hide phone number" : "Show phone number (PIN required)"}
                        >
                          {revealingData && dataTypeToReveal === 'phone' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : showPhoneNumber ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <>
                              <KeyRound className="w-3 h-3" />
                              <EyeIcon className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Status
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Data Encryption:</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-gray-900">
                        {accountSettings?.withdrawal?.set_at ? formatDate(accountSettings.withdrawal.set_at) : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">PIN Protection:</span>
                      <span className={userHasPin ? 'text-green-600' : 'text-gray-600'}>
                        {userHasPin ? 'Enabled' : 'Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* PIN Prompt for Data Reveal */}
              {(dataTypeToReveal && userHasPin && !showAccountNumber && !showPhoneNumber) && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <Key className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-800 mb-1">PIN Verification Required</h4>
                      <p className="text-sm text-purple-700 mb-3">
                        Enter your PIN to reveal the {dataTypeToReveal === 'account' ? 'account number' : 'phone number'}.
                      </p>
                      
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type={showPin ? "text" : "password"}
                            value={withdrawalData.pin}
                            onChange={(e) => setWithdrawalData({
                              ...withdrawalData, 
                              pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent"
                            placeholder="Enter 4-digit PIN"
                            maxLength="4"
                            inputMode="numeric"
                          />
                          {pinError && (
                            <p className="mt-1 text-xs text-red-600">{pinError}</p>
                          )}
                        </div>
                        <button
                          onClick={() => revealSensitiveData(dataTypeToReveal)}
                          disabled={!withdrawalData.pin || revealingData}
                          className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A573A5] transition-colors flex items-center gap-2"
                        >
                          {revealingData ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Fingerprint className="w-4 h-4" />
                              Verify
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Security Note */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                  Click the lock icon and enter PIN to reveal sensitive information. All data is securely encrypted.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons for Non-Editing Mode */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleEditClick}
              className="flex-1 px-6 py-3 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A573A5] transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Update Account Details
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Remove Account
            </button>
          </div>

          {/* Update Notice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Need to make changes?</h4>
                <p className="text-sm text-blue-700">
                  Use the "Update Account Details" button above to modify your withdrawal information. 
                  {userHasPin && ' PIN verification will be required for security.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form or New Account Form */}
      {(isEditing || !existingWithdrawal) && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Update Withdrawal Account' : 'Set Up Withdrawal Account'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing ? 'Update your payment method details' : 'Configure how you receive payments'}
              </p>
            </div>
            {isEditing && (
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>

          {/* Warning Notice */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
                <p className="text-sm text-yellow-700">
                  Please double-check all account details before saving. Incorrect information may delay or prevent withdrawals.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  All sensitive data is securely encrypted. {userHasPin && 'PIN verification required for changes.'}
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="space-y-8">
            {/* Withdrawal Method - Only show if no method selected or editing */}
            {(!withdrawalData.method || isEditing) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-900">
                    Select Withdrawal Method
                  </label>
                  <span className="text-xs text-gray-500">Required</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'bk', label: 'Bank of Kigali', icon: Building },
                    { id: 'equity', label: 'Equity Bank', icon: Building },
                    { id: 'mtn', label: 'MTN Mobile Money', icon: CreditCard },
                    { id: 'airtel', label: 'Airtel Money', icon: CreditCard },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setWithdrawalData({...withdrawalData, method: method.id})}
                      className={`p-4 border rounded-xl text-center transition-all ${withdrawalData.method === method.id 
                        ? 'border-[#BC8BBC] bg-white shadow-sm' 
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
                    >
                      <div className={`p-2 rounded-lg mb-3 ${withdrawalData.method === method.id ? 'bg-[#BC8BBC] bg-opacity-10' : 'bg-gray-100'}`}>
                        <method.icon className={`w-6 h-6 mx-auto ${withdrawalData.method === method.id ? 'text-[#BC8BBC]' : 'text-gray-500'}`} />
                      </div>
                      <span className={`block text-sm font-medium ${withdrawalData.method === method.id ? 'text-[#BC8BBC]' : 'text-gray-700'}`}>
                        {method.label}
                      </span>
                      {withdrawalData.method === method.id && (
                        <div className="mt-2 w-3 h-3 bg-[#BC8BBC] rounded-full mx-auto"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Account Details based on selected method */}
            {withdrawalData.method && (
              <div className="space-y-6 border-t pt-6">
                {/* For Banks */}
                {(withdrawalData.method === 'bk' || withdrawalData.method === 'equity') && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Account Holder Name
                        </label>
                        <span className="text-xs text-gray-500">Required</span>
                      </div>
                      <input
                        type="text"
                        value={withdrawalData.accountName}
                        onChange={(e) => setWithdrawalData({...withdrawalData, accountName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
                        placeholder="As shown on your bank account"
                      />
                      <p className="mt-2 text-sm text-gray-600 flex items-center">
                        <Info className="w-4 h-4 mr-1 flex-shrink-0" />
                        Must match the name exactly as it appears on your bank account
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Account Number
                        </label>
                        <span className="text-xs text-gray-500">Required</span>
                      </div>
                      <input
                        type="text"
                        value={withdrawalData.accountNumber}
                        onChange={(e) => setWithdrawalData({...withdrawalData, accountNumber: e.target.value.replace(/\D/g, '')})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
                        placeholder="Bank account number (numbers only)"
                        inputMode="numeric"
                        maxLength="16"
                      />
                      <p className="mt-2 text-sm text-gray-600 flex items-center">
                        <Shield className="w-4 h-4 mr-1 flex-shrink-0" />
                        Your account number will be securely encrypted with your PIN
                      </p>
                    </div>
                  </>
                )}

                {/* For Mobile Money */}
                {(withdrawalData.method === 'mtn' || withdrawalData.method === 'airtel') && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Mobile Money Phone Number
                        </label>
                        <span className="text-xs text-gray-500">Required</span>
                      </div>
                      <input
                        type="tel"
                        value={withdrawalData.phoneNumber}
                        onChange={(e) => setWithdrawalData({...withdrawalData, phoneNumber: formatPhoneNumber(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
                        placeholder="+250 7XX XXX XXX"
                        maxLength="17"
                      />
                      <p className="mt-2 text-sm text-gray-600 flex items-center">
                        <Shield className="w-4 h-4 mr-1 flex-shrink-0" />
                        Your phone number will be securely encrypted with your PIN
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Account Name
                        </label>
                        <span className="text-xs text-gray-500">Required</span>
                      </div>
                      <input
                        type="text"
                        value={withdrawalData.accountName}
                        onChange={(e) => setWithdrawalData({...withdrawalData, accountName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
                        placeholder="Name on mobile money account"
                      />
                      <p className="mt-2 text-sm text-gray-600 flex items-center">
                        <Info className="w-4 h-4 mr-1 flex-shrink-0" />
                        The name registered with your mobile money service
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* PIN Verification Section - Positioned right before the action buttons */}
            {showPinVerification && (
              <div id="pin-verification-section" className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800 mb-1">Security Verification Required</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      You need to verify your PIN to {isEditing ? 'update' : 'set up'} withdrawal account details.
                    </p>
                    
                    {/* PIN Input */}
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your 4-digit PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? "text" : "password"}
                          value={withdrawalData.pin}
                          onChange={(e) => setWithdrawalData({
                            ...withdrawalData, 
                            pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                          })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50 ${
                            pinError ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter 4-digit PIN"
                          maxLength="4"
                          inputMode="numeric"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                        >
                          {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {pinError && (
                        <p className="mt-1 text-sm text-red-600">{pinError}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Your PIN is required to encrypt sensitive account data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveWithdrawal}
                  disabled={!withdrawalData.method || withdrawalLoading || !userHasPin}
                  className={`flex-1 px-8 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    !withdrawalData.method || withdrawalLoading || !userHasPin
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-[#BC8BBC] hover:bg-[#A573A5] text-white hover:shadow-md'
                  }`}
                >
                  {withdrawalLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : showPinVerification ? (
                    <>
                      <Lock className="w-5 h-5" />
                      Verify PIN & {isEditing ? 'Update' : 'Save'}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditing ? 'Update Account' : 'Save Account'}
                    </>
                  )}
                </button>
                
                {isEditing && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteLoading || !userHasPin}
                    className="px-6 py-3 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Remove Account
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Security Assurance */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>All sensitive data is securely encrypted with your PIN</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userHasPin ? 'PIN verification required for account changes' : 'You must set up a PIN first to add withdrawal accounts'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Remove Withdrawal Account</h3>
                <p className="text-sm text-gray-600 mt-1">This action requires PIN verification</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {userHasPin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your 4-digit PIN to confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={withdrawalData.pin}
                      onChange={(e) => setWithdrawalData({
                        ...withdrawalData, 
                        pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                      })}
                      className={`w-full px-4 py-3 border ${pinError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                      placeholder="Enter PIN"
                      maxLength="4"
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pinError && (
                    <p className="mt-1 text-sm text-red-600">{pinError}</p>
                  )}
                </div>
              )}
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> Removing your withdrawal account will prevent you from receiving payments until you set up a new one.
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone and will require PIN verification.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={(userHasPin && !withdrawalData.pin) || deleteLoading}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                    (userHasPin && !withdrawalData.pin) || deleteLoading
                      ? 'bg-red-300 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {deleteLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </span>
                  ) : 'Confirm Removal'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPinError('');
                  }}
                  className="px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-all"
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
};

export default WithdrawalSection;