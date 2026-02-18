// src/components/LandingPage/property/ContactSection.jsx
import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Shield, 
  User,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
  Send,
  Building,
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactSection({ property, landlord }) {
  const navigate = useNavigate();
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showSupportSection, setShowSupportSection] = useState(false);
  const [showHostInfo, setShowHostInfo] = useState(false);
  const [showDirectContact, setShowDirectContact] = useState(false);
  const [isCopied, setIsCopied] = useState({ phone: false, email: false });
  const [isExpanded, setIsExpanded] = useState(true);

  // Format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
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
      phone: landlord?.public_phone || 
             landlord?.sso_profile?.phone || 
             property?.owner_phone || 
             '+250 788 880 266',
      email: landlord?.public_email || 
             landlord?.sso_profile?.email || 
             property?.owner_email || 
             'contact@oliviuus.com',
      supportPhone: '+250 788 880 266',
      supportEmail: 'support@isanzure.com'
    };

    return {
      ...contact,
      formattedPhone: formatPhoneNumber(contact.phone)
    };
  };

  const contactInfo = getContactInfo();

  // ========== PROFESSIONAL NAVIGATE TO MESSAGES WITH UUIDs ONLY ==========
  const navigateToMessages = () => {
    if (!property?.property_uid) {
      console.error('Property UUID is missing');
      return;
    }

    // Use landlord UUID, NOT numeric ID
    const landlordUid = landlord?.user_uid || '';
    const propertyUid = property.property_uid;
    
    // Professional message with @mention using UUID
    const defaultMessage = `Hi, I'm interested in @${propertyUid}. Can you provide more information?`;
    
    const encodedMessage = encodeURIComponent(defaultMessage);
    
    // Professional URL with UUIDs ONLY - no numeric IDs
    navigate(`/account/messages?landlord=${landlordUid}&property=${propertyUid}&draft=${encodedMessage}`);
  };

  // Navigate to host profile using UUID
  const navigateToHostProfile = () => {
    if (landlord?.user_uid) {
      navigate(`/host/${landlord.user_uid}`);
    } else if (landlord?.id) {
      // Fallback to numeric ID only if UUID is missing (should not happen)
      navigate(`/host/${landlord.id}`);
    }
  };

  // Get landlord name with fallbacks
  const getLandlordName = () => {
    if (!landlord) return 'Property Host';
    
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

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied({ ...isCopied, [type]: true });
      setTimeout(() => setIsCopied({ ...isCopied, [type]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] p-px group">
                <button 
                  onClick={navigateToMessages}
                  className="w-full bg-white py-4 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#BC8BBC]/5 to-[#8A5A8A]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <MessageCircle className="h-5 w-5 text-[#BC8BBC]" />
                  <span>💬 Message Host</span>
                  <Send className="h-3 w-3 text-[#BC8BBC]" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </div>

              {/* Direct Contact Toggle Button */}
              <button
                onClick={() => setShowDirectContact(!showDirectContact)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">📞 Direct Contact Options</span>
                {showDirectContact ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
              </button>

              {/* Direct Contact Section - Collapsed by default */}
              {showDirectContact && (
                <div className="space-y-3 pl-2 animate-fadeIn">
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
                              <Copy className="h-5 w-5" />
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
                              <Copy className="h-5 w-5" />
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

                  {/* Security Note - Now inside direct contact section */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
              )}
            </div>

            {/* Host Information */}
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
                          <Shield className="h-4 w-4 text-green-600" />
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
                        <Building className="h-3 w-3" />
                        <span>iSanzure Verified Host</span>
                      </div>
                      
                      {/* Show Host UUID for reference (optional) */}
                      {landlord.user_uid && (
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          ID: {landlord.user_uid.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Message Button */}
                  <button
                    onClick={navigateToMessages}
                    className="w-full mt-4 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 border border-purple-200"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message {getLandlordName().split(' ')[0]}
                  </button>
                </div>

                {/* View Profile Button - Uses UUID */}
                <button 
                  onClick={navigateToHostProfile}
                  className="w-full mt-4 py-3 border border-[#BC8BBC] text-[#BC8BBC] rounded-xl font-medium hover:bg-[#BC8BBC]/5 transition-colors flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  View Full Host Profile
                </button>
              </div>
            )}

            {/* Support Section */}
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
                      <User className="h-6 w-6 text-blue-600" />
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

            {/* Section Toggle Buttons */}
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
          // Collapsed View - Shows quick actions
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
                className="px-6 py-2.5 bg-[#BC8BBC] text-white rounded-lg font-medium hover:bg-[#9A6A9A] transition-colors flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Message Host
                <Send className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                View All Options
              </button>
            </div>
            {property?.property_uid && (
              <p className="text-xs text-gray-400 mt-3">
                Message will include: <span className="font-mono">@{property.property_uid}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}