import React, { useState, useEffect } from 'react';
import { Phone, Mail, Save, Loader, CheckCircle } from 'lucide-react';
import api from '../../../../api/axios';

export default function ContactSection({ accountSettings, showNotification, refreshAllData }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accountSettings?.contact) {
      setPhone(accountSettings.contact.public_phone || '');
      setEmail(accountSettings.contact.public_email || '');
    }
  }, [accountSettings]);

  const validateRwandanPhone = (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    return /^\+250[0-9]{9}$/.test(cleaned);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (phone && !validateRwandanPhone(phone)) {
      showNotification('Please enter a valid Rwandan phone number (e.g., +250 7XX XXX XXX)', 'error');
      return;
    }
    if (email && !validateEmail(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/isanzure/settings/tenant/contact', { phone, email });
      if (response.data.success) {
        showNotification('Contact information updated', 'success');
        await refreshAllData();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to update contact', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
        <p className="text-sm text-gray-600">
          Landlords will use these details to contact you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Rwanda)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 7XX XXX XXX"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +250...)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#8A5A8A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Contact Info
            </>
          )}
        </button>
      </form>
    </div>
  );
}