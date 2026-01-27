import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const SettingsNotification = ({ notification, setNotification }) => {
  if (!notification) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md animate-fade-in-down ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 
      notification.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="p-4 rounded-lg shadow-lg">
        <div className="flex items-center">
          {notification.type === 'success' ? 
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" /> :
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
          }
          <p className="text-sm font-medium text-gray-900 flex-1">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsNotification;