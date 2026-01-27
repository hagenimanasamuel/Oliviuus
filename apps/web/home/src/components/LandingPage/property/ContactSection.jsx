// src/components/LandingPage/property/ContactSection.jsx
import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Shield, 
  Star, 
  User,
  ChevronDown,
  ChevronUp,
  Globe,
  CheckCircle,
  Info,
  ExternalLink,
  Copy,
  Verified,
  Users,
  HelpCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactSection({ property, landlord }) {
  const navigate = useNavigate();
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showSupportSection, setShowSupportSection] = useState(false); // Hidden by default
  const [showHostInfo, setShowHostInfo] = useState(false); // Hidden by default
  const [isCopied, setIsCopied] = useState({ phone: false, email: false });
  const [isExpanded, setIsExpanded] = useState(false);

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Format: +250 XXX XXX XXX
    if (cleaned.length === 9) {
      return `+250 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('250')) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    return phone;
  };

  // Get contact info from landlord or property
  const getContactInfo = () => {
    const contact = {
      // Priority: public phone > SSO phone > property owner phone
      phone: landlord?.public_phone || 
             landlord?.sso_profile?.phone || 
             property?.owner_phone || 
             '+250 788 880 266',
      
      // Priority: public email > SSO email > property owner email
      email: landlord?.public_email || 
             landlord?.sso_profile?.email || 
             property?.owner_email || 
             'contact@oliviuus.com',
      
      // Support contacts (platform level)
      supportPhone: '+250 788 880 266',
      supportEmail: 'support@isanzure.com'
    };

    return {
      ...contact,
      formattedPhone: formatPhoneNumber(contact.phone)
    };
  };

  const contactInfo = getContactInfo();

  // Get landlord name with fallbacks
  const getLandlordName = () => {
    if (!landlord) return 'Property Host';
    
    // Try SSO profile first
    if (landlord.sso_profile?.full_name) {
      return landlord.sso_profile.full_name;
    }
    
    if (landlord.sso_profile?.first_name && landlord.sso_profile?.last_name) {
      return `${landlord.sso_profile.first_name} ${landlord.sso_profile.last_name}`;
    }
    
    if (landlord.sso_profile?.first_name) {
      return landlord.sso_profile.first_name;
    }
    
    if (landlord.sso_profile?.username) {
      return landlord.sso_profile.username;
    }
    
    // Fallback to basic landlord info
    if (landlord.first_name && landlord.last_name) {
      return `${landlord.first_name} ${landlord.last_name}`;
    }
    
    if (landlord.first_name) {
      return landlord.first_name;
    }
    
    if (landlord.username) {
      return landlord.username;
    }
    
    return 'Property Host';
  };

  // Get landlord avatar/initials
  const getLandlordAvatar = () => {
    if (landlord?.sso_profile?.profile_avatar_url) {
      return (
        <img 
          src={landlord.sso_profile.profile_avatar_url} 
          alt={getLandlordName()}
          className="w-16 h-16 rounded-full object-cover shadow-lg"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                ${getLandlordName().charAt(0).toUpperCase() || '👤'}
              </div>
            `;
          }}
        />
      );
    }
    
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] flex items-center justify-center text-white font-bold text-xl shadow-lg">
        {getLandlordName().charAt(0).toUpperCase() || '👤'}
      </div>
    );
  };

  // Check if landlord is verified
  const isLandlordVerified = () => {
    return landlord?.is_verified === true || 
           landlord?.id_verified === 1 || 
           landlord?.verification_status === 'approved';
  };

  // Get preferred contact methods - ALWAYS include In-App Messaging
  const getPreferredContactMethods = () => {
    const baseMethods = ['in_app_messaging']; // Always include In-App Messaging
    
    if (!landlord?.preferred_contact_methods) {
      return [...baseMethods, 'whatsapp', 'phone', 'email'];
    }
    
    try {
      const methods = Array.isArray(landlord.preferred_contact_methods) 
        ? landlord.preferred_contact_methods 
        : JSON.parse(landlord.preferred_contact_methods);
      
      // Add in-app messaging if not already present
      if (!methods.includes('in_app_messaging')) {
        methods.unshift('in_app_messaging');
      }
      
      return methods;
    } catch (e) {
      return [...baseMethods, 'whatsapp', 'phone', 'email'];
    }
  };

  const preferredMethods = getPreferredContactMethods();

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied({ ...isCopied, [type]: true });
      setTimeout(() => setIsCopied({ ...isCopied, [type]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Navigate to host profile
  const navigateToHostProfile = () => {
    if (landlord?.user_uid) {
      navigate(`/host/${landlord.user_uid}`);
    } else if (landlord?.id) {
      navigate(`/host/${landlord.id}`);
    }
  };

  // Navigate to messages
  const navigateToMessages = () => {
    // Navigate to chat with this landlord
    if (landlord?.id) {
      navigate(`/tenant/messages?landlordId=${landlord.id}&propertyId=${property?.id}`);
    } else {
      navigate('/tenant/messages');
    }
  };

  return (
    <div 
      data-contact-section
      className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="p-6">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-[#BC8BBC]/10 to-[#8A5A8A]/10 rounded-lg">
                <MessageCircle className="h-5 w-5 text-[#BC8BBC]" />
              </div>
              Contact Information
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Connect with the host directly or through our platform
            </p>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {isExpanded ? (
          <>
            {/* Contact Methods */}
            <div className="space-y-4 mb-8">
              {/* Primary Chat Button */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] p-px">
                <button 
                  onClick={navigateToMessages}
                  className="w-full bg-white py-4 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/5 to-[#8A5A8A]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <MessageCircle className="h-5 w-5 text-[#BC8BBC]" />
                  <span>💬 Message Host</span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="px-2 py-1 bg-[#BC8BBC]/10 text-[#BC8BBC] text-xs font-medium rounded-full">
                      Recommended
                    </div>
                  </div>
                </button>
              </div>

              {/* Host's Preferred Contact Methods - Always includes In-App Messaging */}
              <div className="p-3 bg-gradient-to-r from-[#BC8BBC]/5 to-[#8A5A8A]/5 rounded-lg border border-[#BC8BBC]/10">
                <div className="text-sm font-medium text-gray-700 mb-2">Host's Preferred Contact Methods</div>
                <div className="flex flex-wrap gap-2">
                  {preferredMethods.map((method, index) => (
                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
                      {method === 'in_app_messaging' && '💬 In-App Messaging'}
                      {method === 'whatsapp' && '💬 WhatsApp'}
                      {method === 'phone' && '📞 Phone Call'}
                      {method === 'email' && '📧 Email'}
                      {method === 'sms' && '📱 SMS'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Direct Contact Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contactInfo.phone && contactInfo.phone !== '+250 788 880 266' && (
                  <button 
                    onClick={() => setShowPhone(!showPhone)}
                    className={`relative p-4 rounded-xl border transition-all duration-300 ${
                      showPhone 
                        ? 'border-[#BC8BBC] bg-[#BC8BBC]/5 shadow-sm' 
                        : 'border-gray-200 hover:border-[#BC8BBC]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          showPhone ? 'bg-[#BC8BBC] text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Phone className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">Phone Number</div>
                          {showPhone ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-mono text-gray-700">{contactInfo.formattedPhone || contactInfo.phone}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(contactInfo.phone, 'phone');
                                }}
                                className="text-gray-400 hover:text-[#BC8BBC] transition-colors p-1"
                                title="Copy phone number"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">Click to reveal</div>
                          )}
                        </div>
                      </div>
                      {showPhone && (
                        <div className="text-[#BC8BBC]">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    {isCopied.phone && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#BC8BBC] text-white text-xs px-2 py-1 rounded-full">
                        Copied!
                      </div>
                    )}
                  </button>
                )}

                {contactInfo.email && contactInfo.email !== 'contact@oliviuus.com' && (
                  <button 
                    onClick={() => setShowEmail(!showEmail)}
                    className={`relative p-4 rounded-xl border transition-all duration-300 ${
                      showEmail 
                        ? 'border-[#BC8BBC] bg-[#BC8BBC]/5 shadow-sm' 
                        : 'border-gray-200 hover:border-[#BC8BBC]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          showEmail ? 'bg-[#BC8BBC] text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900">Email Address</div>
                          {showEmail ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-700 truncate max-w-[120px]">{contactInfo.email}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(contactInfo.email, 'email');
                                }}
                                className="text-gray-400 hover:text-[#BC8BBC] transition-colors p-1"
                                title="Copy email"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">Click to reveal</div>
                          )}
                        </div>
                      </div>
                      {showEmail && (
                        <div className="text-[#BC8BBC]">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    {isCopied.email && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#BC8BBC] text-white text-xs px-2 py-1 rounded-full">
                        Copied!
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Call to Action */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Secure Communication</h4>
                    <p className="text-sm text-blue-700">
                      For your safety and privacy, we recommend using our messaging system. 
                      All conversations are encrypted and monitored for quality assurance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Host Information - Hidden by default, shown only if user expands */}
            {showHostInfo && landlord && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    Host Profile
                  </h4>
                  <button
                    onClick={() => setShowHostInfo(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
                  >
                    Hide
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Host Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      {getLandlordAvatar()}
                      {isLandlordVerified() && (
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                          <Verified className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-gray-900 text-lg truncate">
                          {getLandlordName()}
                        </h5>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="h-3 w-3" />
                        <span>iSanzure Verified Host</span>
                      </div>
                    </div>
                  </div>

                  {/* Host Tags */}
                  <div className="flex flex-wrap gap-2">
                    {isLandlordVerified() && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                        <Shield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                      <MessageCircle className="h-3 w-3" />
                      Active on iSanzure
                    </span>
                  </div>
                </div>

                {/* View Profile Button */}
                <button 
                  onClick={navigateToHostProfile}
                  className="w-full mt-4 py-3 border border-[#BC8BBC] text-[#BC8BBC] rounded-xl font-medium hover:bg-[#BC8BBC]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Full Host Profile
                </button>
              </div>
            )}

            {/* Support Section - Hidden by default, shown only if user expands */}
            {showSupportSection && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    Need Assistance?
                  </h4>
                  <button
                    onClick={() => setShowSupportSection(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
                  >
                    Hide
                    <X className="h-3 w-3" />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 mb-2">iSanzure Support Team</h5>
                      <p className="text-sm text-gray-600 mb-4">
                        Our dedicated support team is available around the clock to assist you with any questions or concerns.
                      </p>
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <Phone className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Call Support</div>
                            </div>
                          </div>
                          <div className="text-sm font-mono text-gray-700 pl-10">{contactInfo.supportPhone}</div>
                        </div>
                        
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-blue-100 rounded">
                              <Mail className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">Email Support</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 truncate pl-10">{contactInfo.supportEmail}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <span>📞 Available: Monday - Sunday, 8AM - 10PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Toggle Buttons - ALWAYS visible to allow expansion */}
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
              {landlord && !showHostInfo && (
                <button
                  onClick={() => setShowHostInfo(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <User className="h-3 w-3" />
                  Show Host Info
                </button>
              )}
              {!showSupportSection && (
                <button
                  onClick={() => setShowSupportSection(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <HelpCircle className="h-3 w-3" />
                  Show Support Info
                </button>
              )}
            </div>
          </>
        ) : (
          // Collapsed View
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#BC8BBC]/10 to-[#8A5A8A]/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-[#BC8BBC]" />
            </div>
            <h4 className="font-medium text-gray-700 mb-2">Contact Options Available</h4>
            <p className="text-sm text-gray-500 mb-4">
              Click expand to view contact information and host details
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={navigateToMessages}
                className="px-6 py-2.5 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#9A6A9A] transition-colors"
              >
                Message Host
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                View All Options
              </button>
            </div>
          </div>
        )}

        {/* Security Badge */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Secure & Encrypted Communication</span>
            <span className="text-gray-300">•</span>
            <span>Privacy Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}