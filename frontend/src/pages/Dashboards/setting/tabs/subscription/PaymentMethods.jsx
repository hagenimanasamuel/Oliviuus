import React, { useState, useEffect } from "react";
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

export default function PaymentMethods({ subscription }) {
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
          <h3 className="text-lg font-semibold text-white mb-2">Loading Payment Information</h3>
          <p className="text-gray-400">Checking your payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Payment Security</h3>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Your security is our top priority. We've implemented enhanced protection for your payment information.
        </p>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">No Stored Payment Data</h4>
          <p className="text-gray-400 text-sm">
            We never store your mobile money details on our servers for maximum security.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">Fast Mobile Payments</h4>
          <p className="text-gray-400 text-sm">
            Powered by LMB Tech & Intouch for instant mobile money processing.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <h4 className="text-white font-semibold mb-2">Instant Processing</h4>
          <p className="text-gray-400 text-sm">
            Secure real-time payment processing with immediate subscription activation.
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
              Enhanced Security First Approach
            </h3>
            <p className="text-blue-200 text-lg mb-4">
              For your security and peace of mind, we do not store payment methods on our platform.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Each transaction requires fresh payment authorization</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Eliminates risk of stored payment data breaches</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Powered by LMB Tech & Intouch Communications</span>
              </div>
              <div className="flex items-center gap-3 text-blue-100">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Your financial data remains with trusted mobile networks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        <h4 className="text-xl font-bold text-white mb-6 text-center">How Mobile Money Payment Works</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">1</span>
            </div>
            <h5 className="text-white font-semibold mb-2">Choose Plan</h5>
            <p className="text-gray-400 text-sm">Select your preferred subscription plan</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">2</span>
            </div>
            <h5 className="text-white font-semibold mb-2">Enter Phone</h5>
            <p className="text-gray-400 text-sm">Provide your mobile money number</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">3</span>
            </div>
            <h5 className="text-white font-semibold mb-2">Confirm Payment</h5>
            <p className="text-gray-400 text-sm">Authorize payment on your phone</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">4</span>
            </div>
            <h5 className="text-white font-semibold mb-2">Instant Access</h5>
            <p className="text-gray-400 text-sm">Get immediate subscription access</p>
          </div>
        </div>
      </div>

      {/* Supported Payment Methods */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
        <h4 className="text-xl font-bold text-white mb-6 text-center">Supported Mobile Money Providers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="text-center p-6 bg-gray-750 rounded-xl border border-gray-600">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">MTN Mobile Money</p>
            <p className="text-gray-400">Fast and secure payments via MTN</p>
            <div className="flex items-center justify-center gap-2 mt-3 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Instant Processing</span>
            </div>
          </div>
          
          <div className="text-center p-6 bg-gray-750 rounded-xl border border-gray-600">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">Airtel Money</p>
            <p className="text-gray-400">Secure payments via Airtel</p>
            <div className="flex items-center justify-center gap-2 mt-3 text-red-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Instant Processing</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="text-center mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h5 className="text-blue-400 font-semibold mb-2">More Payment Options Coming Soon</h5>
          <p className="text-blue-300 text-sm">
            We're working on adding more payment methods to serve you better
          </p>
        </div>
      </div>

      {/* Technology Partners */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h4 className="text-2xl font-bold text-white mb-2">Powered by Trusted Technology Partners</h4>
          <p className="text-purple-300">Secure payment processing through our trusted partners</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-600">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
            <h5 className="text-white font-semibold text-lg mb-2">LMB Tech</h5>
            <p className="text-gray-400">Link Mobile Technology Ltd</p>
            <p className="text-green-400 text-sm mt-2">Payment Technology Partner</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-600">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <h5 className="text-white font-semibold text-lg mb-2">Intouch Communications</h5>
            <p className="text-gray-400">Mobile Money Infrastructure</p>
            <p className="text-blue-400 text-sm mt-2">Payment Processing Partner</p>
          </div>
        </div>
      </div>

      {/* Security Assurance */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <Shield className="w-12 h-12 text-green-400 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-green-400 mb-2">Your Security is Guaranteed</h4>
            <p className="text-green-300">
              We prioritize your financial security above all else. By not storing payment methods, 
              we eliminate the risk of payment data breaches while maintaining seamless subscription 
              management through secure, real-time mobile money processing powered by LMB Tech and Intouch Communications.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="text-center">
        <p className="text-gray-400 mb-4">
          Have questions about our payment security or mobile money payments?
        </p>
        <button 
          onClick={handleContactSupport}
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
        >
          <Info className="w-4 h-4" />
          Contact Support
        </button>
      </div>

      {/* Contact Support Section - Only shown when user clicks Contact Support */}
      {showContactSupport && (
        <div id="contact-support-section" className="scroll-mt-8">
          <ContactSupport 
            title="Payment & Billing Support"
            subtitle="Need help with mobile money payments, billing questions, or payment security? Our support team is here to help."
            compact={true}
          />
        </div>
      )}
    </div>
  );
}