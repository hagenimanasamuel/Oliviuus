import React, { useState } from 'react';
import { KeyRound, Loader, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../../../api/axios';

export default function PinSection({ isanzureUser, showNotification, refreshAllData }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasPin = isanzureUser?.security?.has_pin;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      showNotification('PIN must be exactly 4 digits', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showNotification('New PINs do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/isanzure/settings/tenant/pin', {
        currentPin: hasPin ? currentPin : undefined,
        newPin,
        confirmPin
      });

      if (response.data.success) {
        showNotification(response.data.message, 'success');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        await refreshAllData();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to update PIN', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {hasPin ? 'Change PIN' : 'Set Up PIN'}
        </h3>
        <p className="text-sm text-gray-600">
          {hasPin 
            ? 'Your 4-digit PIN protects sensitive actions like withdrawals.'
            : 'Set a 4-digit PIN to secure your account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {hasPin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current PIN</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] text-center text-xl tracking-widest"
                placeholder="• • • •"
                maxLength="4"
                required={hasPin}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] text-center text-xl tracking-widest"
              placeholder="• • • •"
              maxLength="4"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New PIN</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] text-center text-xl tracking-widest"
              placeholder="• • • •"
              maxLength="4"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#8A5A8A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            hasPin ? 'Update PIN' : 'Set PIN'
          )}
        </button>
      </form>

      {hasPin && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700">
              Never share your PIN with anyone. iSanzure will never ask for your PIN.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}