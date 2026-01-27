import React, { lazy } from 'react';

// Lazy load section components
const PinSection = lazy(() => import('./sections/PinSection'));
const ContactSection = lazy(() => import('./sections/ContactSection'));
const WithdrawalSection = lazy(() => import('./sections/WithdrawalSection'));
const VerificationSection = lazy(() => import('./sections/VerificationSection'));

const SettingsContent = ({
  activeSection,
  isanzureUser,
  accountSettings,
  verificationStatus,
  rejectionReason,
  refreshIsanzureUser,
  refreshAllData,
  showNotification,
  onSaveWithdrawal
}) => {
  return (
    <div className="p-6">
      {activeSection === 'pin' && (
        <PinSection
          isanzureUser={isanzureUser}
          showNotification={showNotification}
          refreshAllData={refreshAllData}
        />
      )}

      {activeSection === 'contact' && (
        <ContactSection
          showNotification={showNotification}
          accountSettings={accountSettings}
          refreshAllData={refreshAllData}
        />
      )}

      {activeSection === 'withdrawal' && (
        <WithdrawalSection
          onSaveWithdrawal={onSaveWithdrawal}
          accountSettings={accountSettings}
          showNotification={showNotification}
          refreshAllData={refreshAllData}
        />
      )}

      {activeSection === 'verification' && (
        <VerificationSection
          isanzureUser={isanzureUser}
          verificationStatus={verificationStatus}
          rejectionReason={rejectionReason}
          refreshIsanzureUser={refreshIsanzureUser}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

export default SettingsContent;