import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Wallet,
  Eye,
  EyeOff,
  X,
  Loader,
  CheckCircle,
  AlertTriangle,
  Building,
  CreditCard,
  KeyRound,
  EyeIcon,
  Shield,
  Settings,
  ArrowRight,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import toast from 'react-hot-toast';

// Toast functions
const showError = (title, message, details = null) => {
  toast.error(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-800">{title}</p>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          {details && (
            <p className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded">
              {details}
            </p>
          )}
        </div>
      </div>
    </div>,
    {
      duration: 6000,
      style: {
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

const showSuccess = (title, message) => {
  toast.success(
    <div className="w-full">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-800">{title}</p>
          <p className="text-sm text-green-700 mt-1">{message}</p>
        </div>
      </div>
    </div>,
    {
      duration: 5000,
      style: {
        background: '#dcfce7',
        border: '1px solid #bbf7d0',
        borderRadius: '12px',
        padding: '16px'
      },
      icon: null
    }
  );
};

export default function WithdrawalModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  maxAmount, 
  withdrawalAccount,
  formatFullAmount,
  formatCurrency,
  formatPhoneNumber
}) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [showBalance, setShowBalance] = useState(false);
  const [revealedAccount, setRevealedAccount] = useState(null);
  const [revealingPin, setRevealingPin] = useState('');
  const [showRevealPin, setShowRevealPin] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const navigate = useNavigate();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setAmount('');
      setNotes('');
      setPin('');
      setPinError('');
      setAmountError('');
      setRevealedAccount(null);
      setRevealingPin('');
      setShowRevealPin(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getMethodDisplay = (method) => {
    switch (method) {
      case 'bk': return 'Bank of Kigali (BK)';
      case 'equity': return 'Equity Bank';
      case 'mtn': return 'MTN Mobile Money';
      case 'airtel': return 'Airtel Money';
      default: return method;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'bk':
      case 'equity':
        return <Building className="w-5 h-5" />;
      case 'mtn':
      case 'airtel':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  // FIXED: Prevents typing amounts exceeding balance
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      setAmount('');
      setAmountError('');
    } else {
      const numValue = parseInt(value);

      // Check if exceeds balance
      if (numValue > maxAmount) {
        // Don't update the amount - block the input
        setAmountError(`Maximum withdrawal is ${formatFullAmount(maxAmount)}`);
        return; // Don't set amount
      }

      setAmount(numValue.toString());
      setAmountError('');
    }
  };

  const handleRevealAccount = async () => {
    if (!revealingPin || revealingPin.length !== 4) {
      setPinError('Please enter your 4-digit PIN');
      return;
    }

    setRevealing(true);
    setPinError('');

    try {
      const response = await api.post('/isanzure/settings/reveal-withdrawal-data', {
        pin: revealingPin
      });

      if (response.data.success) {
        setRevealedAccount(response.data.data.current);
        setShowRevealPin(false);
        setRevealingPin('');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setPinError('Invalid PIN. Please try again.');
      } else {
        setPinError('Failed to reveal account details');
      }
    } finally {
      setRevealing(false);
    }
  };

  const validateAmount = () => {
    const numAmount = parseInt(amount);

    if (!amount || amount === '') {
      setAmountError('Please enter an amount');
      return false;
    }

    if (numAmount < 1000) {
      setAmountError('Minimum withdrawal is 1,000 RWF');
      return false;
    }

    if (numAmount > maxAmount) {
      setAmountError(`Amount exceeds available balance of ${formatFullAmount(maxAmount)}`);
      return false;
    }

    return true;
  };

  const validatePin = () => {
    if (!pin || pin.length !== 4) {
      setPinError('Please enter your 4-digit PIN');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateAmount()) {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3); // Go to summary step
    } else if (step === 3) {
      setStep(4); // Go to PIN step
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!validatePin()) return;

    setLoading(true);
    setPinError('');

    try {
      const response = await api.post('/isanzure/balance/withdraw', {
        amount: parseInt(amount),
        pin: pin,
        notes: notes || null
      });

      if (response.data.success) {
        showSuccess(
          'Withdrawal Request Submitted!',
          `Amount: ${formatFullAmount(amount)}`
        );

        onSuccess();
        onClose();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setPinError('Invalid PIN. Please try again.');
      } else if (error.response?.status === 400) {
        if (error.response.data?.code === 'INSUFFICIENT_BALANCE') {
          // Go back to amount step with error
          setAmountError(`Insufficient balance. Available: ${formatCurrency(error.response.data.available)}`);
          setStep(1);
        } else if (error.response.data?.code === 'NO_WITHDRAWAL_ACCOUNT') {
          showError(
            'No Withdrawal Account',
            'Please set up a withdrawal account first'
          );
          onClose();
          navigate('/landlord/dashboard/settings/withdrawal');
        } else {
          showError(
            'Withdrawal Failed',
            error.response.data?.message || 'Failed to process withdrawal'
          );
        }
      } else {
        showError(
          'Withdrawal Failed',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/landlord/dashboard/settings/withdrawal');
  };

  // Calculate fee (10% at withdrawal)
  const calculateFee = () => {
    const numAmount = parseInt(amount) || 0;
    const fee = Math.round(numAmount * 0.1); // 10% fee
    const youReceive = numAmount - fee;
    return { fee, youReceive };
  };

  const { fee, youReceive } = calculateFee();

  // Step names for progress bar
  const getStepProgress = () => {
    if (!withdrawalAccount) return 0;
    return (step / 4) * 100;
  };

  // Check if quick amount is valid
  const isQuickAmountValid = (quickAmount) => {
    return quickAmount <= maxAmount;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#BC8BBC]" />
              Withdraw Funds
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {withdrawalAccount ? `Step ${step} of 4` : 'Set up your withdrawal account first'}
          </p>
        </div>

        {/* Progress Bar */}
        {withdrawalAccount && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            ></div>
          </div>
        )}

        <div className="p-6">
          {/* NO WITHDRAWAL ACCOUNT */}
          {!withdrawalAccount && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Wallet className="h-10 w-10 text-gray-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Withdrawal Account Found
              </h3>

              <p className="text-gray-600 mb-6">
                You need to set up a withdrawal account before you can withdraw funds.
              </p>

              <button
                onClick={handleGoToSettings}
                className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#8A5A8A] transition-colors inline-flex items-center gap-2"
              >
                <Settings size={18} />
                Go to Withdrawal Settings
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* HAS WITHDRAWAL ACCOUNT */}
          {withdrawalAccount && (
            <>
              {/* Step 1: Enter Amount */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Balance
                    </label>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-[#BC8BBC]" />
                          <button
                            onClick={() => setShowBalance(!showBalance)}
                            className="text-gray-400 hover:text-[#BC8BBC]"
                          >
                            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {showBalance ? formatFullAmount(maxAmount) : 'RWF •••••••'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Withdraw <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        RWF
                      </span>
                      <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className={`w-full pl-16 pr-4 py-4 border ${amountError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          } rounded-xl focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent text-2xl font-bold`}
                      />
                    </div>

                    {/* Error shows only when validation fails */}
                    {amountError && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{amountError}</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Minimum withdrawal: 1,000 RWF
                    </p>
                  </div>

                  {/* Quick Amount Selector */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Quick select:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[5000, 10000, 25000, 50000, 100000, 250000].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => {
                            if (quickAmount <= maxAmount) {
                              setAmount(quickAmount.toString());
                              setAmountError('');
                            }
                          }}
                          disabled={!isQuickAmountValid(quickAmount)}
                          className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                            !isQuickAmountValid(quickAmount)
                              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'border-gray-300 hover:border-[#BC8BBC] hover:bg-[#f4eaf4]'
                          }`}
                          title={!isQuickAmountValid(quickAmount) ? `Exceeds balance of ${formatFullAmount(maxAmount)}` : ''}
                        >
                          {formatCurrency(quickAmount, false)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Withdrawal Account */}
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="font-medium text-gray-700">Confirm Withdrawal Account</h3>

                  {/* Account Card */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        withdrawalAccount.method === 'bk' ? 'bg-blue-100' :
                        withdrawalAccount.method === 'equity' ? 'bg-purple-100' :
                        withdrawalAccount.method === 'mtn' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {getMethodIcon(withdrawalAccount.method)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getMethodDisplay(withdrawalAccount.method)}
                        </h4>
                        <StatusBadge
                          status={withdrawalAccount.verified ? 'verified' : 'pending_verification'}
                        />
                      </div>
                    </div>

                    {/* Account Details - Masked */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Name</span>
                        <span className="font-medium text-gray-900">
                          {revealedAccount?.accountName || '••••••••'}
                        </span>
                      </div>

                      {withdrawalAccount.method === 'bk' || withdrawalAccount.method === 'equity' ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-900">
                              {revealedAccount?.accountNumber || '••••••••'}
                            </span>
                            {!revealedAccount && (
                              <button
                                onClick={() => setShowRevealPin(true)}
                                className="text-gray-500 hover:text-[#BC8BBC]"
                                title="Show account number (PIN required)"
                              >
                                <KeyRound size={14} />
                                <EyeIcon size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Phone Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-900">
                              {revealedAccount?.phoneNumber ? formatPhoneNumber(revealedAccount.phoneNumber) : '•••• •••• •••'}
                            </span>
                            {!revealedAccount && (
                              <button
                                onClick={() => setShowRevealPin(true)}
                                className="text-gray-500 hover:text-[#BC8BBC]"
                                title="Show phone number (PIN required)"
                              >
                                <KeyRound size={14} />
                                <EyeIcon size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PIN Reveal Input */}
                    {showRevealPin && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700 mb-2">
                          Enter PIN to reveal account details
                        </p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="password"
                              value={revealingPin}
                              onChange={(e) => {
                                setRevealingPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                                setPinError('');
                              }}
                              className={`w-full px-3 py-2 border ${pinError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#BC8BBC]`}
                              placeholder="• • • •"
                              maxLength="4"
                            />
                          </div>
                          <button
                            onClick={handleRevealAccount}
                            disabled={revealing || revealingPin.length !== 4}
                            className="px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A] disabled:opacity-50"
                          >
                            {revealing ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify'}
                          </button>
                        </div>
                        {pinError && (
                          <p className="mt-1 text-xs text-red-600">{pinError}</p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <Shield size={12} />
                      Your account details are encrypted. Enter PIN to view.
                    </p>
                  </div>

                  {/* Change Account Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Want to use a different account?
                    </p>
                    <button
                      onClick={handleGoToSettings}
                      className="text-[#BC8BBC] hover:text-[#8A5A8A] text-sm font-medium"
                    >
                      Change withdrawal account in settings
                    </button>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information..."
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#BC8BBC] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Summary - PROFESSIONAL NOTES DISPLAY */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Review Withdrawal</h3>
                    <p className="text-sm text-gray-600">Please confirm your withdrawal details</p>
                  </div>

                  {/* Withdrawal Summary Card */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                    <h4 className="font-medium text-purple-800 mb-4 text-center">Withdrawal Summary</h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-purple-700">Amount to withdraw:</span>
                        <span className="font-bold text-purple-900 text-lg">{formatFullAmount(amount)}</span>
                      </div>

                      {/* Professional Description - shows right after amount */}
                      {notes && notes.trim() !== '' && (
                        <div className="flex justify-between items-center py-2 border-b border-purple-200">
                          <span className="text-purple-700">Description:</span>
                          <span className="font-medium text-purple-900 text-right max-w-[60%] break-words">
                            {notes}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 border-b border-purple-200">
                        <span className="text-purple-700">Fee (10%):</span>
                        <span className="font-medium text-purple-900">{formatFullAmount(fee)}</span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-purple-800">You'll receive:</span>
                        <span className="font-bold text-green-600 text-xl">{formatFullAmount(youReceive)}</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-purple-100/50 rounded-lg">
                      <p className="text-xs text-purple-700 text-center">
                        Fee is deducted at withdrawal. No other fees apply.
                      </p>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Account Details
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium text-gray-900">
                          {getMethodDisplay(withdrawalAccount.method)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Name:</span>
                        <span className="font-medium text-gray-900">
                          {revealedAccount?.accountName || '••••••••'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: PIN Verification */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <KeyRound className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800">Confirm Withdrawal</h4>
                        <p className="text-sm text-purple-700">
                          Enter your PIN to complete the withdrawal
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        4-Digit PIN <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? "text" : "password"}
                          value={pin}
                          onChange={(e) => {
                            setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError('');
                          }}
                          className={`w-full px-4 py-3 border ${pinError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-[#BC8BBC] text-center text-2xl tracking-widest`}
                          placeholder="• • • •"
                          maxLength="4"
                          autoFocus
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
                    </div>
                  </div>

                  {/* Quick Summary */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-gray-900">{formatFullAmount(amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">You receive:</span>
                      <span className="font-medium text-green-600">{formatFullAmount(youReceive)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {withdrawalAccount && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-2.5 bg-[#BC8BBC] text-white rounded-xl font-medium hover:bg-[#8A5A8A] transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !pin}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirm Withdrawal
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// Status Badge Component
const StatusBadge = ({ status }) => {
  const configs = {
    verified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verified' },
    pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
  };

  const config = configs[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};