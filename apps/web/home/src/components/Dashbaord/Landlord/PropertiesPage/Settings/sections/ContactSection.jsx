import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Info,
  CheckCircle,
  Edit2,
  Save,
  X,
  History
} from 'lucide-react';
import api from '../../../../../../api/axios';

const ContactSection = ({ showNotification, accountSettings, refreshAllData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactHistory, setContactHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [initialData, setInitialData] = useState(null);
  
  const [contactData, setContactData] = useState({
    phone: '',
    email: '',
  });

  // Initialize data from accountSettings
  useEffect(() => {
    if (accountSettings?.contact) {
      const contact = accountSettings.contact;
      const initialContact = {
        phone: contact.public_phone || '',
        email: contact.public_email || '',
      };
      
      setContactData(initialContact);
      setInitialData(initialContact);
    }
  }, [accountSettings]);

  // Load contact history
  const loadContactHistory = async () => {
    try {
      const response = await api.get('/isanzure/settings/contact-history');
      if (response.data.success) {
        setContactHistory(response.data.data.history || []);
      }
    } catch (error) {
      console.error('Error loading contact history:', error);
    }
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return `+${cleaned}`;
    if (cleaned.length <= 6) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)}`;
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    // Limit to Rwandan format
    if (formatted.length <= 17) { // +250 7XX XXX XXX format length
      setContactData({...contactData, phone: formatted});
    }
  };

  const handleSaveContact = async () => {
    const phoneRegex = /^\+250[0-9]{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const cleanedPhone = contactData.phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      showNotification('Please enter a valid Rwandan phone number (e.g., +250 7XX XXX XXX)', 'error');
      return;
    }
    
    if (!emailRegex.test(contactData.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    setContactLoading(true);
    try {
      // Use update endpoint for existing contact, save for new
      const endpoint = initialData?.phone || initialData?.email 
        ? '/isanzure/settings/update-contact'
        : '/isanzure/settings/save-contact';
      
      const response = await api.post(endpoint, {
        phone: cleanedPhone,
        email: contactData.email,
      });
      
      if (response.data.success) {
        showNotification('Contact information updated successfully', 'success');
        setIsEditing(false);
        await refreshAllData();
        await loadContactHistory();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Failed to save contact information', 
        'error'
      );
      console.error('Error saving contact information:', error);
    } finally {
      setContactLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (initialData) {
      setContactData(initialData);
    }
    setIsEditing(false);
  };

  const hasContactInfo = accountSettings?.contact?.public_phone || accountSettings?.contact?.public_email;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl">
      {!isEditing && hasContactInfo ? (
        // Display Mode - Show current contact information
        <div className="space-y-6">
          {/* Header with Edit button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Public Contact Information</h3>
              <p className="text-sm text-gray-600 mt-1">Visible to tenants for inquiries</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadContactHistory().then(() => setShowHistory(!showHistory))}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <History className="w-4 h-4" />
                {showHistory ? 'Hide History' : 'View History'}
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray bg-[#BC8BBC] bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit Information
              </button>
            </div>
          </div>

          {/* Contact History Panel */}
          {showHistory && contactHistory.length > 0 && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Contact History
              </h4>
              <div className="space-y-3">
                {contactHistory.map((record, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {record.public_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{record.public_phone}</span>
                          </div>
                        )}
                        {record.public_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{record.public_email}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(record.changed_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Card */}
            {accountSettings.contact.public_phone && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Phone Number</h4>
                      <p className="text-sm text-gray-600">For calls and WhatsApp</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                </div>
                <div className="ml-11">
                  <p className="text-lg font-bold text-gray-900">
                    {accountSettings.contact.public_phone}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Available for tenant inquiries
                  </p>
                </div>
              </div>
            )}

            {/* Email Card */}
            {accountSettings.contact.public_email && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email Address</h4>
                      <p className="text-sm text-gray-600">For formal inquiries</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                </div>
                <div className="ml-11">
                  <p className="text-lg font-bold text-gray-900">
                    {accountSettings.contact.public_email}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Checked regularly for inquiries
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* No Contact Info Message */}
          {!accountSettings.contact.public_phone && !accountSettings.contact.public_email && (
            <div className="text-center py-8 border border-gray-200 rounded-xl bg-gray-50">
              <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Contact Information Set</h4>
              <p className="text-gray-600 mb-4">Add your contact details so tenants can reach you</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-[#BC8BBC] text-white rounded-lg hover:bg-[#A573A5] transition-colors"
              >
                Add Contact Information
              </button>
            </div>
          )}

          {/* Last Updated */}
          {accountSettings.contact?.public_phone && accountSettings.audit?.last_settings_update && (
            <div className="text-sm text-gray-500 text-center pt-4 border-t border-gray-200">
              Last updated: {formatDate(accountSettings.audit.last_settings_update)}
            </div>
          )}
        </div>
      ) : (
        // Edit Mode - Form to update contact information
        <div className="space-y-8">
          {/* Header with Save/Cancel buttons */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {hasContactInfo ? 'Edit Contact Information' : 'Set Up Contact Information'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {hasContactInfo ? 'Update your public contact details' : 'Set your public contact details for tenants'}
              </p>
            </div>
            {hasContactInfo && (
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Phone Number
              </label>
              <span className="text-xs text-gray-500">Required</span>
            </div>
            <input
              type="tel"
              value={contactData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
              placeholder="+250 7XX XXX XXX"
            />
            <p className="mt-2 text-sm text-gray-600 flex items-center">
              <Info className="w-4 h-4 mr-1 flex-shrink-0" />
              This phone number will be visible to interested tenants for inquiries
            </p>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">
                Contact Email
              </label>
              <span className="text-xs text-gray-500">Required</span>
            </div>
            <input
              type="email"
              value={contactData.email}
              onChange={(e) => setContactData({...contactData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BC8BBC] focus:border-transparent bg-gray-50"
              placeholder="contact@example.com"
            />
            <p className="mt-2 text-sm text-gray-600 flex items-center">
              <Info className="w-4 h-4 mr-1 flex-shrink-0" />
              Tenants can contact you via email for formal inquiries
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSaveContact}
              disabled={contactLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                contactLoading 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-[#BC8BBC] hover:bg-[#A573A5] text-white hover:shadow-md'
              }`}
            >
              {contactLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {hasContactInfo ? 'Update Contact Information' : 'Save Contact Information'}
                </>
              )}
            </button>
            
            {hasContactInfo && (
              <button
                onClick={handleCancelEdit}
                disabled={contactLoading}
                className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSection;