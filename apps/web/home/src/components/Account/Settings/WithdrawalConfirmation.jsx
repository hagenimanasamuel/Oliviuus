import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function WithdrawalConfirmation({ withdrawalData, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Withdrawal Account</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Please review your withdrawal account details before saving.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-6">
          <p><span className="font-medium">Method:</span> {withdrawalData?.method}</p>
          {withdrawalData?.accountName && <p><span className="font-medium">Account Name:</span> {withdrawalData.accountName}</p>}
          {withdrawalData?.accountNumber && <p><span className="font-medium">Account Number:</span> {withdrawalData.accountNumber}</p>}
          {withdrawalData?.phoneNumber && <p><span className="font-medium">Phone:</span> {withdrawalData.phoneNumber}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A] flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}