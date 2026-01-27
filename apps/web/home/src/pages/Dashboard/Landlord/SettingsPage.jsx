// src/pages/Dashboard/Landlord/SettingsPage.jsx
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'; // Changed Outlet to Navigate
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import api from '../../../api/axios';
import SettingsNav from '../../../components/Dashbaord/Landlord/PropertiesPage/Settings/SettingsNav';
import SettingsNotification from '../../../components/Dashbaord/Landlord/PropertiesPage/Settings/SettingsNotification';
import WithdrawalConfirmation from '../../../components/Dashbaord/Landlord/PropertiesPage/Settings/WithdrawalConfirmation';
import { 
  Settings, 
  Shield, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

// Lazy load section components
const PinSection = lazy(() => import('../../../components/Dashbaord/Landlord/PropertiesPage/Settings/sections/PinSection'));
const ContactSection = lazy(() => import('../../../components/Dashbaord/Landlord/PropertiesPage/Settings/sections/ContactSection'));
const WithdrawalSection = lazy(() => import('../../../components/Dashbaord/Landlord/PropertiesPage/Settings/sections/WithdrawalSection'));
const VerificationSection = lazy(() => import('../../../components/Dashbaord/Landlord/PropertiesPage/Settings/sections/VerificationSection'));

export default function SettingsPage() {
  const { isanzureUser, refreshIsanzureUser } = useIsanzureAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [notification, setNotification] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    status: 'not_submitted',
    details: null,
    loading: true
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showWithdrawalConfirmation, setShowWithdrawalConfirmation] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);
  const [accountSettings, setAccountSettings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get current section from URL
  const currentPath = location.pathname;
  const section = currentPath.split('/').pop() || 'pin';

  // Fetch verification status and account settings
  useEffect(() => {
    fetchVerificationStatus();
    fetchAccountSettings();
  }, [isanzureUser]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await api.get('/isanzure/settings/verification-status');
      
      if (response.data.success) {
        const { data } = response.data;
        
        setVerificationStatus({
          status: data.verification_status || 'not_submitted',
          details: data,
          loading: false
        });

        if (data.verification_status === 'rejected' || data.rejection_reason) {
          setRejectionReason(data.rejection_reason || 'Verification rejected. Please check requirements and resubmit.');
        }
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setVerificationStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load verification status'
      }));
    }
  };

  const fetchAccountSettings = async () => {
    try {
      const response = await api.get('/isanzure/settings');
      
      if (response.data.success) {
        setAccountSettings(response.data.data);
        
        if (response.data.data?.verification) {
          const verificationData = response.data.data.verification;
          
          setVerificationStatus(prev => ({
            ...prev,
            status: verificationData.verification_status || 'not_submitted',
            details: verificationData,
            loading: false
          }));

          if (verificationData.rejection_reason) {
            setRejectionReason(verificationData.rejection_reason);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching account settings:', error);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchVerificationStatus(),
        fetchAccountSettings(),
        refreshIsanzureUser()
      ]);
      showNotification('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
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

  // Get verification status display
  const getVerificationStatusDisplay = () => {
    const status = verificationStatus.status;
    const details = verificationStatus.details;
    
    switch(status) {
      case 'approved':
        return {
          label: 'Verified Landlord',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle2,
          subtext: details?.id_verified_at ? `Verified on ${new Date(details.id_verified_at).toLocaleDateString()}` : 'Verified'
        };
      case 'pending':
        return {
          label: 'Verification Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          subtext: details?.verification_submitted_at ? `Submitted on ${new Date(details.verification_submitted_at).toLocaleDateString()}` : 'Submitted for review'
        };
      case 'rejected':
        return {
          label: 'Verification Rejected',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          subtext: 'Please resubmit with corrections'
        };
      default:
        return {
          label: 'Not Verified',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertTriangle,
          subtext: 'Verification required for full access'
        };
    }
  };

  const statusDisplay = getVerificationStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  if (verificationStatus.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#BC8BBC] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading account settings...</p>
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
                <p className="text-gray-600 text-sm mt-1">Manage your landlord account settings</p>
              </div>
            </div>
            
            {/* Verification Status Badge */}
            <div className="flex items-center space-x-3">
              <div className={`px-4 py-2 rounded-full border flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2 ${statusDisplay.color}`}>
                <div className="flex items-center space-x-2">
                  <StatusIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{statusDisplay.label}</span>
                </div>
                {statusDisplay.subtext && (
                  <span className="text-xs opacity-80">{statusDisplay.subtext}</span>
                )}
              </div>
              
              <button
                onClick={refreshAllData}
                disabled={refreshing}
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
              <div className={`p-2 rounded-lg ${section === 'pin' ? 'bg-purple-100' : 
                section === 'contact' ? 'bg-blue-100' : 
                section === 'withdrawal' ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Shield className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {section === 'pin' ? 'Account PIN' :
                   section === 'contact' ? 'Public Contact' :
                   section === 'withdrawal' ? 'Withdrawal Account' : 'Account Verification'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {section === 'pin' ? 'Set 4-digit security PIN for sensitive actions' :
                   section === 'contact' ? 'Manage how tenants can contact you' :
                   section === 'withdrawal' ? 'Set up payment methods for receiving funds' : 'Get verified as a landlord'}
                </p>
              </div>
            </div>
          </div>

          {/* IMPORTANT: Update SettingsNav props */}
          <SettingsNav verificationStatus={verificationStatus.status} />
          
          {/* Content Area with Routes - Fixed with proper route structure */}
          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Navigate to="pin" replace />} />
              <Route path="/pin" element={
                <div className="p-6">
                  <PinSection
                    isanzureUser={accountSettings}
                    showNotification={showNotification}
                    refreshAllData={refreshAllData}
                  />
                </div>
              } />
              <Route path="/contact" element={
                <div className="p-6">
                  <ContactSection
                    showNotification={showNotification}
                    accountSettings={accountSettings}
                    refreshAllData={refreshAllData}
                  />
                </div>
              } />
              <Route path="/withdrawal" element={
                <div className="p-6">
                  <WithdrawalSection
                    onSaveWithdrawal={handleSaveWithdrawal}
                    accountSettings={accountSettings}
                    showNotification={showNotification}
                    refreshAllData={refreshAllData}
                  />
                </div>
              } />
              <Route path="/verification" element={
                <div className="p-6">
                  <VerificationSection
                    isanzureUser={accountSettings}
                    verificationStatus={verificationStatus.status}
                    rejectionReason={rejectionReason}
                    refreshIsanzureUser={refreshIsanzureUser}
                    showNotification={showNotification}
                  />
                </div>
              } />
              {/* Add catch-all route for unknown paths */}
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