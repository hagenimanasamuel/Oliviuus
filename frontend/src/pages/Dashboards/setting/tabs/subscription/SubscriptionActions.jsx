import React, { useState } from "react";
import api from "../../../../../api/axios";
import { 
  AlertTriangle, 
  RefreshCw, 
  XCircle, 
  CheckCircle, 
  Crown,
  HelpCircle,
  Info,
  Shield,
  Calendar,
  CreditCard,
  Zap,
  Users,
  Star
} from "lucide-react";
import ContactSupport from "../../../../../components/subscription/HelpSupport";
import PlanChangeModal from "./PlanChangeModal";

export default function SubscriptionActions({ subscription, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [activeAction, setActiveAction] = useState(''); // Track which action is loading

  const handleCancelSubscription = async () => {
    if (!window.confirm(
      'Are you sure you want to cancel your subscription?\n\n' +
      'You will continue to have access until the end of your current billing period.'
    )) return;

    setLoading(true);
    setActiveAction('cancel');
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/user-subscriptions/cancel', { subscription_id: subscription.id });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Subscription cancelled successfully' });
        onUpdate();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to cancel subscription'
      });
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    setActiveAction('reactivate');
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/user-subscriptions/reactivate', { subscription_id: subscription.id });
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Subscription reactivated successfully' });
        onUpdate();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to reactivate subscription'
      });
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  const handleChangeAutoRenew = async (autoRenew) => {
    setLoading(true);
    setActiveAction('auto-renew');
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/user-subscriptions/auto-renew', {
        subscription_id: subscription.id,
        auto_renew: autoRenew
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: `Auto-renew ${autoRenew ? 'enabled' : 'disabled'} successfully` });
        onUpdate();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update auto-renew setting'
      });
    } finally {
      setLoading(false);
      setActiveAction('');
    }
  };

  const handleContactSupport = () => {
    setShowContactSupport(true);
    setTimeout(() => {
      document.getElementById('contact-support-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handlePlanChangeSuccess = () => {
    setShowPlanChangeModal(false);
    onUpdate();
  };

  const isActionLoading = (action) => loading && activeAction === action;

  // Determine which actions are available based on subscription status
  const canCancel = subscription?.status === 'active';
  const canReactivate = subscription?.status === 'cancelled';
  const canChangeAutoRenew = subscription?.status === 'active' || subscription?.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-purple-500/10 border border-[#BC8BBC]/20 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-[#BC8BBC] rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#BC8BBC] mb-2">Manage Your Subscription</h3>
            <p className="text-gray-300">
              Make changes to your subscription plan, cancel, reactivate, or modify your billing preferences. 
              All changes take effect immediately or at the end of your billing period.
            </p>
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#BC8BBC]" />
            Current Subscription Status
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Plan</p>
              <p className="text-white font-semibold">{subscription.subscription_name}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className={`font-semibold ${
                subscription.status === 'active' ? 'text-green-400' :
                subscription.status === 'cancelled' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Auto Renew</p>
              <p className={`font-semibold ${subscription.auto_renew ? 'text-green-400' : 'text-yellow-400'}`}>
                {subscription.auto_renew ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">
                {subscription.status === 'cancelled' ? 'Ends On' : 'Renews On'}
              </p>
              <p className="text-white font-semibold">
                {new Date(subscription.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cancel Subscription */}
        <div className={`bg-gray-800 rounded-xl p-6 border transition-all duration-300 ${
          canCancel ? 'border-gray-700 hover:border-red-400' : 'border-gray-600 opacity-60'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Cancel Subscription</h4>
              <p className="text-gray-400 text-sm">Stop automatic renewal</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {canCancel 
              ? `Your subscription will remain active until ${new Date(subscription?.end_date).toLocaleDateString()}. You can reactivate anytime before this date.`
              : 'Your subscription is not active and cannot be cancelled.'
            }
          </p>
          <button
            onClick={handleCancelSubscription}
            disabled={isActionLoading('cancel') || !canCancel}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            {isActionLoading('cancel') ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Cancel Subscription
              </>
            )}
          </button>
        </div>

        {/* Reactivate Subscription */}
        <div className={`bg-gray-800 rounded-xl p-6 border transition-all duration-300 ${
          canReactivate ? 'border-gray-700 hover:border-green-400' : 'border-gray-600 opacity-60'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <RefreshCw className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Reactivate Subscription</h4>
              <p className="text-gray-400 text-sm">Restore your subscription</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {canReactivate
              ? 'Continue enjoying uninterrupted access to all features. Your billing cycle will resume immediately.'
              : 'Your subscription is already active or cannot be reactivated.'
            }
          </p>
          <button
            onClick={handleReactivateSubscription}
            disabled={isActionLoading('reactivate') || !canReactivate}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            {isActionLoading('reactivate') ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reactivate Subscription
              </>
            )}
          </button>
        </div>

        {/* Auto-renew Toggle */}
        <div className={`bg-gray-800 rounded-xl p-6 border transition-all duration-300 ${
          canChangeAutoRenew ? 'border-gray-700 hover:border-[#BC8BBC]' : 'border-gray-600 opacity-60'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#BC8BBC]/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-[#BC8BBC]" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Auto-renew Settings</h4>
              <p className="text-gray-400 text-sm">Manage automatic payments</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {subscription?.auto_renew
              ? 'Your subscription will automatically renew and charge your payment method.'
              : 'You will need to manually renew your subscription before it expires.'
            }
          </p>
          <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
            <div>
              <span className="text-white font-medium block">Auto-renew</span>
              <span className="text-gray-400 text-sm">
                {subscription?.auto_renew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button
              onClick={() => handleChangeAutoRenew(!subscription?.auto_renew)}
              disabled={isActionLoading('auto-renew') || !canChangeAutoRenew}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                subscription?.auto_renew ? 'bg-[#BC8BBC]' : 'bg-gray-600'
              } ${(isActionLoading('auto-renew') || !canChangeAutoRenew) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 ${
                  subscription?.auto_renew ? 'translate-x-6' : 'translate-x-1'
                } ${isActionLoading('auto-renew') ? 'scale-90' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Change Plan */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-[#BC8BBC] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#BC8BBC]/20 rounded-lg">
              <Crown className="w-6 h-6 text-[#BC8BBC]" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Change Plan</h4>
              <p className="text-gray-400 text-sm">Upgrade or downgrade</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Explore different plans to better suit your viewing needs and budget. Changes take effect immediately.
          </p>
          <button 
            onClick={() => setShowPlanChangeModal(true)}
            className="w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-4 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 group"
          >
            <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Browse Available Plans
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-xl border transition-all duration-300 ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Support Section */}
      <div className="bg-gradient-to-r from-[#BC8BBC]/10 to-blue-500/10 border border-[#BC8BBC]/20 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-[#BC8BBC] rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-xl font-bold text-white mb-2">Need Help with Your Subscription?</h3>
            <p className="text-gray-300 mb-4">
              Our support team is here to help with any questions about billing, plan changes, 
              or subscription management.
            </p>
            <button 
              onClick={handleContactSupport}
              className="inline-flex items-center gap-2 bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              Contact Support Team
            </button>
          </div>
        </div>
      </div>

      {/* Security Assurance */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-4">
          <Shield className="w-12 h-12 text-green-400 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Secure Subscription Management</h4>
            <p className="text-gray-300 text-sm">
              All subscription changes are processed securely. Your payment information is protected 
              and we never store sensitive data on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Support Section - Only shown when user clicks Contact Support */}
      {showContactSupport && (
        <div id="contact-support-section" className="scroll-mt-8">
          <ContactSupport 
            title="Subscription Management Support"
            subtitle="Need help with subscription changes, billing questions, or plan upgrades? Our team is here to assist you."
            compact={true}
          />
        </div>
      )}

      {/* Plan Change Modal */}
      {showPlanChangeModal && (
        <PlanChangeModal
          currentSubscription={subscription}
          onClose={() => setShowPlanChangeModal(false)}
          onSuccess={handlePlanChangeSuccess}
        />
      )}
    </div>
  );
}