// src/pages/account/tabs/ParentalControls.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useSubscription } from "../../../../context/SubscriptionContext";
import api from "../../../../api/axios";
import { 
  Shield, 
  Key, 
  History, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  Edit3,
  RotateCcw,
  LogOut,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Custom Modal Component
const MessageModal = ({ type, title, message, onClose, isVisible }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000); // Auto-close after 4 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const config = {
    success: {
      bgColor: "bg-green-500/10 border-green-500/30",
      textColor: "text-green-400",
      icon: <CheckCircle size={24} className="text-green-400" />,
      title: t('parentalControls.modal.success')
    },
    error: {
      bgColor: "bg-red-500/10 border-red-500/30",
      textColor: "text-red-400",
      icon: <AlertTriangle size={24} className="text-red-400" />,
      title: t('parentalControls.modal.error')
    },
    warning: {
      bgColor: "bg-yellow-500/10 border-yellow-500/30",
      textColor: "text-yellow-400",
      icon: <AlertTriangle size={24} className="text-yellow-400" />,
      title: t('parentalControls.modal.warning')
    }
  };

  const { bgColor, textColor, icon, title: defaultTitle } = config[type] || config.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 pointer-events-none">
      <div className="relative">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity pointer-events-auto" onClick={onClose} />
        
        {/* Modal */}
        <div className={`relative ${bgColor} border rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl transform transition-all duration-300 pointer-events-auto ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold ${textColor} mb-1`}>
                {title || defaultTitle}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                type === 'success' ? 'bg-green-400' : 
                type === 'error' ? 'bg-red-400' : 
                'bg-yellow-400'
              } transition-all duration-4000 ease-linear`}
              style={{ 
                width: isVisible ? '0%' : '100%',
                transition: 'width 4s linear'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ParentalControls({ user, isFamilyOwner, isFamilyMember, memberRole, familyMemberData }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("pin");
  const [loading, setLoading] = useState(false);
  const [pinStatus, setPinStatus] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // PIN Management States
  const [currentPin, setCurrentPin] = useState(""); // For verifying existing PIN
  const [newPin, setNewPin] = useState(""); // For setting new PIN
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [verificationStep, setVerificationStep] = useState("none"); // "none", "verifying", "verified", "changing", "resetting"

  // Message Modal States
  const [modal, setModal] = useState({
    isVisible: false,
    type: "success", // "success", "error", "warning"
    title: "",
    message: ""
  });

  const { currentSubscription, isFamilyPlanAccess } = useSubscription();

  const tabs = [
    { id: "pin", label: t('parentalControls.tabs.pinManagement'), icon: <Key size={16} /> },
    { id: "logs", label: t('parentalControls.tabs.securityLogs'), icon: <History size={16} /> }
  ];

  // Enhanced role validation
  const canManagePins = (isFamilyOwner || (isFamilyMember && memberRole === 'parent')) && 
                       (currentSubscription?.plan_type === 'family' || isFamilyPlanAccess);

  // Show message modal
  const showMessage = (type, title, message) => {
    setModal({
      isVisible: true,
      type,
      title,
      message
    });
  };

  // Hide message modal
  const hideMessage = () => {
    setModal(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (canManagePins) {
      loadPinStatus();
    }
  }, [canManagePins]);

  useEffect(() => {
    if (activeTab === "logs" && canManagePins) {
      loadSecurityLogs();
    }
  }, [activeTab, canManagePins]);

  const loadPinStatus = async () => {
    if (!canManagePins) return;
    
    try {
      setLoading(true);
      const response = await api.get("/family/pin/status");
      setPinStatus(response.data);
    } catch (error) {
      console.error("Error loading PIN status:", error);
      showMessage("error", t('parentalControls.errors.loadFailed'), t('parentalControls.errors.loadPinStatus'));
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    if (!canManagePins) return;
    
    try {
      setLogsLoading(true);
      const response = await api.get("/family/security-logs");
      setSecurityLogs(response.data.logs || []);
    } catch (error) {
      console.error("Error loading security logs:", error);
      showMessage("error", t('parentalControls.errors.loadFailed'), t('parentalControls.errors.loadSecurityLogs'));
    } finally {
      setLogsLoading(false);
    }
  };

  const validatePin = (pin) => {
    if (!/^\d{4}$/.test(pin)) {
      return t('parentalControls.pinValidation.mustBe4Digits');
    }

    // Common weak PINs
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
    if (weakPins.includes(pin)) {
      return t('parentalControls.pinValidation.tooCommon');
    }

    // Sequential check
    const digits = pin.split('').map(Number);
    let sequentialUp = true;
    let sequentialDown = true;
    
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i-1] + 1) sequentialUp = false;
      if (digits[i] !== digits[i-1] - 1) sequentialDown = false;
    }
    
    if (sequentialUp || sequentialDown) {
      return t('parentalControls.pinValidation.sequentialNotAllowed');
    }

    return null;
  };

  const verifyCurrentPin = async () => {
    if (!currentPin) {
      showMessage("error", t('parentalControls.errors.pinRequired'), t('parentalControls.errors.enterCurrentPin'));
      return;
    }

    try {
      setVerificationStep("verifying");
      // Verify the current PIN
      await api.post("/family/pin/verify", { pin: currentPin });
      
      setVerificationStep("verified");
      showMessage("success", t('parentalControls.success.pinVerified'), t('parentalControls.success.pinVerifiedDesc'));
      setCurrentPin("");
    } catch (error) {
      console.error("Error verifying PIN:", error);
      const errorMessage = error.response?.data?.error || t('parentalControls.errors.invalidPin');
      showMessage("error", t('parentalControls.errors.verificationFailed'), errorMessage);
      setVerificationStep("none");
    }
  };

  const handleSetNewPin = async () => {
    if (!newPin) {
      showMessage("error", t('parentalControls.errors.pinRequired'), t('parentalControls.errors.enterNewPin'));
      return;
    }

    const validationError = validatePin(newPin);
    if (validationError) {
      showMessage("error", t('parentalControls.errors.invalidPin'), validationError);
      return;
    }

    try {
      setLoading(true);
      await api.post("/family/pin/master/set", { pin: newPin });
      
      setNewPin("");
      setVerificationStep("none");
      showMessage("success", t('parentalControls.success.pinSet'), t('parentalControls.success.pinSetDesc'));
      await loadPinStatus();
    } catch (error) {
      console.error("Error setting master PIN:", error);
      const errorMessage = error.response?.data?.error || t('parentalControls.errors.setPinFailed');
      showMessage("error", t('parentalControls.errors.setupFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!newPin) {
      showMessage("error", t('parentalControls.errors.pinRequired'), t('parentalControls.errors.enterNewPin'));
      return;
    }

    const validationError = validatePin(newPin);
    if (validationError) {
      showMessage("error", t('parentalControls.errors.invalidPin'), validationError);
      return;
    }

    try {
      setLoading(true);
      await api.post("/family/pin/master/set", { pin: newPin });
      
      setNewPin("");
      setVerificationStep("none");
      showMessage("success", t('parentalControls.success.pinChanged'), t('parentalControls.success.pinChangedDesc'));
      await loadPinStatus();
    } catch (error) {
      console.error("Error changing master PIN:", error);
      const errorMessage = error.response?.data?.error || t('parentalControls.errors.changePinFailed');
      showMessage("error", t('parentalControls.errors.changeFailed'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetMasterPin = async () => {
    if (verificationStep === "resetting") {
      try {
        setLoading(true);
        // Send empty PIN to reset (remove PIN protection)
        await api.post("/family/pin/master/set", { pin: "" });
        
        setVerificationStep("none");
        setCurrentPin("");
        showMessage("success", t('parentalControls.success.pinReset'), t('parentalControls.success.pinResetDesc'));
        await loadPinStatus();
      } catch (error) {
        console.error("Error resetting master PIN:", error);
        const errorMessage = error.response?.data?.error || t('parentalControls.errors.resetPinFailed');
        showMessage("error", t('parentalControls.errors.resetFailed'), errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      // For reset action, we need to verify PIN first
      setVerificationStep("resetting");
      setCurrentPin("");
      setNewPin("");
    }
  };

  const cancelVerification = () => {
    setVerificationStep("none");
    setCurrentPin("");
    setNewPin("");
  };

  if (!canManagePins) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700 text-center">
          <Shield size={64} className="mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{t('parentalControls.accessRestricted.title')}</h3>
          <p className="text-gray-400 mb-4">
            {t('parentalControls.accessRestricted.description')}
          </p>
        </div>
      </div>
    );
  }

  if (loading && !pinStatus) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
      </div>
    );
  }

  const hasActivePin = pinStatus?.master_pin_set;

  return (
    <>
      {/* Message Modal */}
      <MessageModal
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={hideMessage}
        isVisible={modal.isVisible}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="text-[#BC8BBC]" size={32} />
                {t('parentalControls.title')}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                {t('parentalControls.subtitle')}
              </p>
            </div>
            
            {/* Role Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#BC8BBC]/20 border border-[#BC8BBC]/30 text-[#BC8BBC] text-sm font-medium">
              <Shield size={14} className="mr-2" />
              {isFamilyOwner ? t('parentalControls.roles.familyOwner') : t('parentalControls.roles.familyParent')}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-6 sm:mb-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-300 whitespace-nowrap min-w-[140px] text-center flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-[#BC8BBC] text-white shadow-lg transform scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800 transform hover:scale-105"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-700">
          {/* PIN Management Tab */}
          {activeTab === "pin" && (
            <div className="space-y-6">
              {/* Master PIN Section */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#BC8BBC]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    {hasActivePin ? (
                      <Lock className="text-[#BC8BBC]" size={32} />
                    ) : (
                      <Unlock className="text-[#BC8BBC]" size={32} />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {hasActivePin ? t('parentalControls.pinSection.activeTitle') : t('parentalControls.pinSection.setupTitle')}
                  </h3>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    {hasActivePin 
                      ? t('parentalControls.pinSection.activeDescription')
                      : t('parentalControls.pinSection.setupDescription')
                    }
                  </p>
                </div>

                {/* PIN Status Display */}
                {hasActivePin && verificationStep === "none" && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
                    <p className="text-green-400 text-sm flex items-center gap-2 justify-center">
                      <CheckCircle size={16} />
                      {t('parentalControls.pinSection.activeStatus')}
                    </p>
                  </div>
                )}

                {/* Step 1: Initial State - No PIN verification in progress */}
                {verificationStep === "none" && (
                  <div className="max-w-md mx-auto space-y-4">
                    {!hasActivePin ? (
                      // First-time PIN setup
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                            {t('parentalControls.pinSection.createPin')}
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPin ? "text" : "password"}
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder={t('parentalControls.pinSection.enterPinPlaceholder')}
                              className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] focus:ring-0 text-center text-2xl tracking-widest font-semibold"
                              maxLength={4}
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPin(!showNewPin)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                              {showNewPin ? <EyeOff size={24} /> : <Eye size={24} />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {newPin.length}/4 {t('parentalControls.pinSection.digits')}
                          </p>
                        </div>

                        <button
                          onClick={handleSetNewPin}
                          disabled={loading || newPin.length !== 4}
                          className="w-full px-6 py-4 bg-[#BC8BBC] text-white rounded-xl font-semibold text-lg hover:bg-[#a87ba8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                        >
                          {loading ? (
                            <RefreshCw size={20} className="animate-spin" />
                          ) : (
                            <Lock size={20} />
                          )}
                          {loading ? t('parentalControls.actions.settingPin') : t('parentalControls.actions.setMasterPin')}
                        </button>
                      </div>
                    ) : (
                      // PIN is active - show action buttons
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => setVerificationStep("changing")}
                          className="px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                          <Edit3 size={20} />
                          {t('parentalControls.actions.changePin')}
                        </button>

                        <button
                          onClick={() => setVerificationStep("resetting")}
                          className="px-6 py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                          <RotateCcw size={20} />
                          {t('parentalControls.actions.resetPin')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: PIN Verification Required */}
                {(verificationStep === "changing" || verificationStep === "resetting") && (
                  <div className="max-w-sm mx-auto space-y-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {t('parentalControls.verification.title')}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {t('parentalControls.verification.description')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                        {t('parentalControls.verification.currentPin')}
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPin ? "text" : "password"}
                          value={currentPin}
                          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder={t('parentalControls.verification.enterCurrentPin')}
                          className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] focus:ring-0 text-center text-2xl tracking-widest font-semibold"
                          maxLength={4}
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPin(!showCurrentPin)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showCurrentPin ? <EyeOff size={24} /> : <Eye size={24} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {currentPin.length}/4 {t('parentalControls.pinSection.digits')}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={verifyCurrentPin}
                        disabled={verificationStep === "verifying" || currentPin.length !== 4}
                        className="flex-1 px-6 py-4 bg-[#BC8BBC] text-white rounded-xl font-semibold hover:bg-[#a87ba8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        {verificationStep === "verifying" ? (
                          <RefreshCw size={20} className="animate-spin" />
                        ) : (
                          <Key size={20} />
                        )}
                        {verificationStep === "verifying" ? t('parentalControls.actions.verifying') : t('parentalControls.actions.verifyPin')}
                      </button>
                      <button
                        onClick={cancelVerification}
                        className="px-6 py-4 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        <LogOut size={20} />
                        {t('parentalControls.actions.cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: PIN Verified - Show New PIN Input for Change */}
                {verificationStep === "verified" && (
                  <div className="max-w-sm mx-auto space-y-6">
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {t('parentalControls.newPin.title')}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {t('parentalControls.newPin.description')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                        {t('parentalControls.newPin.newPin')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPin ? "text" : "password"}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder={t('parentalControls.newPin.enterNewPin')}
                          className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] focus:ring-0 text-center text-2xl tracking-widest font-semibold"
                          maxLength={4}
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showNewPin ? <EyeOff size={24} /> : <Eye size={24} />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {newPin.length}/4 {t('parentalControls.pinSection.digits')}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleChangePin}
                        disabled={loading || newPin.length !== 4}
                        className="flex-1 px-6 py-4 bg-[#BC8BBC] text-white rounded-xl font-semibold hover:bg-[#a87ba8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <RefreshCw size={20} className="animate-spin" />
                        ) : (
                          <Key size={20} />
                        )}
                        {loading ? t('parentalControls.actions.updating') : t('parentalControls.actions.updatePin')}
                      </button>
                      <button
                        onClick={cancelVerification}
                        className="px-6 py-4 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        <LogOut size={20} />
                        {t('parentalControls.actions.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Family Members Section */}
              {pinStatus?.family_members && pinStatus.family_members.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('parentalControls.familyMembers.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pinStatus.family_members.map((member) => (
                      <div key={member.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white truncate">{member.email}</h4>
                          <span className="text-xs text-gray-400 capitalize">{t(`family.roles.${member.role}`, member.role)}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">{t('parentalControls.familyMembers.status')}:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              member.is_active 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {member.is_active ? t('parentalControls.familyMembers.active') : t('parentalControls.familyMembers.inactive')}
                            </span>
                          </div>
                          {member.pin_security?.is_locked && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">{t('parentalControls.familyMembers.pinStatus')}:</span>
                              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
                                {t('parentalControls.familyMembers.locked')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              {logsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
                </div>
              ) : securityLogs.length > 0 ? (
                <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {t('parentalControls.securityLogs.action')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {t('parentalControls.securityLogs.dateTime')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {securityLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white capitalize">
                                  {log.action.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History size={48} className="mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">{t('parentalControls.securityLogs.noLogs')}</h3>
                  <p className="text-gray-500 text-sm">
                    {t('parentalControls.securityLogs.noLogsDescription')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}