import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Shield, 
  Lock, 
  Smartphone, 
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  EyeOff,
  TrendingUp,
  Clock,
  UserCheck
} from "lucide-react";
import ContactSupport from "../../../../../components/subscription/HelpSupport";

export default function PaymentMethods({ subscription, t }) {
  const { t: translate } = useTranslation();
  const tFunc = t || translate;
  
  const [loading, setLoading] = useState(true);
  const [showContactSupport, setShowContactSupport] = useState(false);

  useEffect(() => {
    // Simulate loading to show the security message
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleContactSupport = () => {
    setShowContactSupport(true);
    // Scroll to support section after a brief delay to ensure component is rendered
    setTimeout(() => {
      document.getElementById('contact-support-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BC8BBC]"></div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {tFunc('paymentMethods.loading')}
          </h3>
          <p className="text-gray-400">{tFunc('paymentMethods.checkingSettings')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-4">
          {tFunc('paymentMethods.title')}
        </h3>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {tFunc('paymentMethods.subtitle')}
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">
            {tFunc('paymentMethods.noStoredData.title')}
          </h4>
          <p className="text-gray-400 text-sm">
            {tFunc('paymentMethods.noStoredData.description')}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">
            {tFunc('paymentMethods.fastPayments.title')}
          </h4>
          <p className="text-gray-400 text-sm">
            {tFunc('paymentMethods.fastPayments.description')}
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">
            {tFunc('paymentMethods.instantProcessing.title')}
          </h4>
          <p className="text-gray-400 text-sm">
            {tFunc('paymentMethods.instantProcessing.description')}
          </p>
        </div>
      </div>

      {/* Main Security Message */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <EyeOff className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white mb-3">
              {tFunc('paymentMethods.enhancedSecurity.title')}
            </h3>
            <p className="text-blue-200 text-lg mb-4">
              {tFunc('paymentMethods.enhancedSecurity.description')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>{tFunc('paymentMethods.enhancedSecurity.points.freshAuthorization')}</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>{tFunc('paymentMethods.enhancedSecurity.points.eliminateRisk')}</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>{tFunc('paymentMethods.enhancedSecurity.points.poweredBy')}</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>{tFunc('paymentMethods.enhancedSecurity.points.financialData')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        <h4 className="text-xl font-bold text-white mb-6 text-center">
          {tFunc('paymentMethods.howItWorks.title')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">1</span>
            </div>
            <h5 className="text-white font-semibold mb-2">
              {tFunc('paymentMethods.howItWorks.steps.choosePlan')}
            </h5>
            <p className="text-gray-400 text-sm">
              {tFunc('paymentMethods.howItWorks.descriptions.choosePlan')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <h5 className="text-white font-semibold mb-2">
              {tFunc('paymentMethods.howItWorks.steps.enterPhone')}
            </h5>
            <p className="text-gray-400 text-sm">
              {tFunc('paymentMethods.howItWorks.descriptions.enterPhone')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <h5 className="text-white font-semibold mb-2">
              {tFunc('paymentMethods.howItWorks.steps.confirmPayment')}
            </h5>
            <p className="text-gray-400 text-sm">
              {tFunc('paymentMethods.howItWorks.descriptions.confirmPayment')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">4</span>
            </div>
            <h5 className="text-white font-semibold mb-2">
              {tFunc('paymentMethods.howItWorks.steps.instantAccess')}
            </h5>
            <p className="text-gray-400 text-sm">
              {tFunc('paymentMethods.howItWorks.descriptions.instantAccess')}
            </p>
          </div>
        </div>
      </div>

      {/* Supported Payment Methods */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        <h4 className="text-xl font-bold text-white mb-6 text-center">
          {tFunc('paymentMethods.supportedProviders.title')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="text-center p-6 bg-gray-750 rounded-xl border border-gray-600">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">
              {tFunc('paymentMethods.supportedProviders.mtn.title')}
            </p>
            <p className="text-gray-400">
              {tFunc('paymentMethods.supportedProviders.mtn.description')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {tFunc('paymentMethods.supportedProviders.instantProcessing')}
              </span>
            </div>
          </div>
          
          <div className="text-center p-6 bg-gray-750 rounded-xl border border-gray-600">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">
              {tFunc('paymentMethods.supportedProviders.airtel.title')}
            </p>
            <p className="text-gray-400">
              {tFunc('paymentMethods.supportedProviders.airtel.description')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 text-red-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {tFunc('paymentMethods.supportedProviders.instantProcessing')}
              </span>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="text-center mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h5 className="text-blue-400 font-semibold mb-2">
            {tFunc('paymentMethods.comingSoon.title')}
          </h5>
          <p className="text-blue-300 text-sm">
            {tFunc('paymentMethods.comingSoon.description')}
          </p>
        </div>
      </div>

      {/* Technology Partners */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h4 className="text-2xl font-bold text-white mb-2">
            {tFunc('paymentMethods.technologyPartners.title')}
          </h4>
          <p className="text-purple-300">
            {tFunc('paymentMethods.technologyPartners.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-600">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
            <h5 className="text-white font-semibold text-lg mb-2">
              {tFunc('paymentMethods.technologyPartners.lmbTech.title')}
            </h5>
            <p className="text-gray-400">
              {tFunc('paymentMethods.technologyPartners.lmbTech.description')}
            </p>
            <p className="text-green-400 text-sm mt-2">
              {tFunc('paymentMethods.technologyPartners.lmbTech.role')}
            </p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-600">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <h5 className="text-white font-semibold text-lg mb-2">
              {tFunc('paymentMethods.technologyPartners.intouch.title')}
            </h5>
            <p className="text-gray-400">
              {tFunc('paymentMethods.technologyPartners.intouch.description')}
            </p>
            <p className="text-blue-400 text-sm mt-2">
              {tFunc('paymentMethods.technologyPartners.intouch.role')}
            </p>
          </div>
        </div>
      </div>

      {/* Security Assurance */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <Shield className="w-12 h-12 text-green-400 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-green-400 mb-2">
              {tFunc('paymentMethods.securityAssurance.title')}
            </h4>
            <p className="text-green-300">
              {tFunc('paymentMethods.securityAssurance.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <p className="text-gray-400 mb-4">
          {tFunc('paymentMethods.contactSupport.description')}
        </p>
        <button 
          onClick={handleContactSupport}
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
        >
          <Info className="w-4 h-4" />
          {tFunc('paymentMethods.contactSupport.button')}
        </button>
      </div>

      {/* Contact Support Section - Only shown when user clicks Contact Support */}
      {showContactSupport && (
        <div id="contact-support-section" className="scroll-mt-8">
          <ContactSupport 
            title={tFunc('paymentMethods.contactSupport.title')}
            subtitle={tFunc('paymentMethods.contactSupport.subtitle')}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}