import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useIsanzureAuth } from '../../context/IsanzureAuthContext';
import api from '../../api/axios';
import SettingsNav from '../../components/Account/Settings/SettingsNav';
import SettingsNotification from '../../components/Account/Settings/SettingsNotification';
import WithdrawalConfirmation from '../../components/Account/Settings/WithdrawalConfirmation';
import { Settings, Shield, Loader2, RefreshCw } from 'lucide-react';

// Lazy load section components
const PinSection = lazy(() => import('../../components/Account/Settings/sections/PinSection'));
const ContactSection = lazy(() => import('../../components/Account/Settings/sections/ContactSection'));
const WalletSection = lazy(() => import('../../components/Account/Settings/sections/WalletSection'));

// Skeleton loader component
const SettingsSkeleton = () => (
  <div className="animate-pulse">
    {/* Header skeleton */}
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    {/* Navigation skeleton */}
    <div className="flex space-x-4 mb-6 border-b border-gray-200 pb-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-10 w-20 bg-gray-200 rounded"></div>
      ))}
    </div>

    {/* Content skeleton */}
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-32 mx-auto bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-48 mx-auto bg-gray-200 rounded"></div>
        </div>
        
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function SettingsPage() {
  const { isanzureUser, refreshIsanzureUser } = useIsanzureAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notification, setNotification] = useState(null);
  const [accountSettings, setAccountSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawalConfirmation, setShowWithdrawalConfirmation] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current section from URL
  const currentPath = location.pathname;
  const section = currentPath.split('/').pop() || 'pin';

  useEffect(() => {
    fetchAccountSettings();
  }, []);

  const fetchAccountSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/isanzure/settings/tenant');
      if (response.data.success) {
        setAccountSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching account settings:', error);
      
      // Don't show notification for 403, just set error state for skeleton
      if (error.response?.status === 403) {
        setError('You do not have permission to access settings. Please ensure you are logged in as a tenant.');
      } else if (error.response?.status === 401) {
        setError('Please log in to access your settings.');
      } else {
        setError('Failed to load settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await fetchAccountSettings();
      await refreshIsanzureUser();
      showNotification('Data refreshed successfully', 'success');
    } catch (error) {
      showNotification('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSaveWithdrawal = (data) => {
    setWithdrawalData(data);
    setShowWithdrawalConfirmation(true);
  };

  const confirmSaveWithdrawal = async () => {
    setShowWithdrawalConfirmation(false);
    showNotification('Withdrawal account saved successfully', 'success');
    await fetchAccountSettings();
  };

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchAccountSettings();
              }}
              className="px-6 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#8A5A8A] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <SettingsNotification 
        notification={notification} 
        setNotification={setNotification}
        onCloseNotification={() => setNotification(null)}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <Settings className="w-6 h-6 text-[#BC8BBC]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600 text-sm mt-1">Manage your account preferences</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshAllData}
                disabled={refreshing || loading}
                className="p-2 text-gray-600 hover:text-[#BC8BBC] transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                {refreshing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation and Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Content Header - Only for desktop */}
          <div className="hidden md:block px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                section === 'pin' ? 'bg-purple-100' : 
                section === 'contact' ? 'bg-blue-100' : 
                'bg-green-100'
              }`}>
                <Shield className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {section === 'pin' ? 'Account PIN' :
                   section === 'contact' ? 'Contact Information' : 
                   'Wallet & Payments'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {section === 'pin' ? 'Set a 4-digit security PIN for sensitive actions' :
                   section === 'contact' ? 'Manage how landlords can contact you' :
                   'View your balance, transactions, and withdraw funds'}
                </p>
              </div>
            </div>
          </div>

          <SettingsNav />
          
          <Suspense fallback={<SettingsSkeleton />}>
            <Routes>
              {/* IMPORTANT: Use relative paths but with proper nesting */}
              <Route index element={<Navigate to="pin" replace />} />
              <Route path="pin" element={
                <div className="p-6">
                  {loading ? (
                    <SettingsSkeleton />
                  ) : (
                    <PinSection
                      isanzureUser={accountSettings}
                      showNotification={showNotification}
                      refreshAllData={refreshAllData}
                    />
                  )}
                </div>
              } />
              <Route path="contact" element={
                <div className="p-6">
                  {loading ? (
                    <SettingsSkeleton />
                  ) : (
                    <ContactSection
                      showNotification={showNotification}
                      accountSettings={accountSettings}
                      refreshAllData={refreshAllData}
                    />
                  )}
                </div>
              } />
              <Route path="wallet" element={
                <div className="p-6">
                  {loading ? (
                    <SettingsSkeleton />
                  ) : (
                    <WalletSection
                      showNotification={showNotification}
                      refreshAllData={refreshAllData}
                      onSaveWithdrawal={handleSaveWithdrawal}
                      accountSettings={accountSettings}
                    />
                  )}
                </div>
              } />
              <Route path="*" element={<Navigate to="pin" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      {showWithdrawalConfirmation && (
        <WithdrawalConfirmation
          withdrawalData={withdrawalData}
          onConfirm={confirmSaveWithdrawal}
          onCancel={() => setShowWithdrawalConfirmation(false)}
        />
      )}
    </div>
  );
}