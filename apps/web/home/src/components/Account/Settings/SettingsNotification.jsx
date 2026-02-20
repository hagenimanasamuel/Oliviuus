import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function SettingsNotification({ notification, setNotification, onCloseNotification }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onCloseNotification();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onCloseNotification]);

  if (!notification) return null;

  const { message, type } = notification;

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  }[type] || 'bg-gray-50 border-gray-200';

  const Icon = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  }[type] || AlertCircle;

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500'
  }[type] || 'text-gray-500';

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full rounded-lg border p-4 shadow-lg ${bgColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="flex-1 text-sm text-gray-700">{message}</p>
        <button
          onClick={onCloseNotification}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}