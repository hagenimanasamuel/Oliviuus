import React from 'react';
import { AlertTriangle } from 'lucide-react';

const WithdrawalConfirmation = ({ withdrawalData, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
          <h3 className="text-lg font-bold text-gray-900">Confirm Withdrawal Account</h3>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
          <p className="text-sm text-yellow-800 font-medium mb-2">Please double-check these details:</p>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">Method:</span>
              <span>
                {withdrawalData.method === 'bk' ? 'Bank of Kigali' : 
                 withdrawalData.method === 'equity' ? 'Equity Bank' :
                 withdrawalData.method === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Account Name:</span>
              <span>{withdrawalData.accountName}</span>
            </div>
            {withdrawalData.method === 'bk' || withdrawalData.method === 'equity' ? (
              <div className="flex justify-between">
                <span className="font-medium">Account Number:</span>
                <span>{withdrawalData.accountNumber}</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="font-medium">Phone Number:</span>
                <span>{withdrawalData.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Incorrect account details may delay or prevent withdrawals. Are you sure these details are correct?
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Go Back & Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#A573A5]"
          >
            Yes, Save Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalConfirmation;