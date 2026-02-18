import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandlordProfileCard = ({ landlord, propertyUid }) => {
  const navigate = useNavigate();

  // Get landlord name from SSO profile or fallback
  const getLandlordName = () => {
    if (!landlord) return "Property Host";
    
    // Check if we have SSO profile data
    if (landlord.sso_profile?.full_name) {
      return landlord.sso_profile.full_name;
    }
    
    if (landlord.sso_profile?.first_name) {
      return landlord.sso_profile.first_name;
    }
    
    if (landlord.sso_profile?.username) {
      return landlord.sso_profile.username;
    }
    
    // Fallback to basic info
    return "Property Host";
  };

  // Get landlord initials for avatar fallback
  const getLandlordInitials = () => {
    const name = getLandlordName();
    if (name === "Property Host") return "🏠";
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Get user type display
  const getUserTypeDisplay = () => {
    if (!landlord?.user_type) return "Host";
    
    return landlord.user_type === 'property_manager' ? 'Property Manager' : 
           landlord.user_type === 'agent' ? 'Real Estate Agent' : 'Landlord';
  };

  // Check if landlord is verified
  const isVerified = () => {
    return landlord?.is_verified === true || 
           landlord?.id_verified === 1 || 
           landlord?.verification_status === 'approved';
  };

  // Handle profile click
  const handleViewProfile = () => {
    if (landlord?.user_uid) {
      navigate(`/host/${landlord.user_uid}`);
    } else if (landlord?.id) {
      navigate(`/host/${landlord.id}`);
    }
  };

  // ========== NAVIGATE TO IN-APP MESSAGING ==========
  const handleInAppMessage = (e) => {
    e.stopPropagation();
    
    if (!landlord?.user_uid) {
      console.error('Landlord UUID is missing');
      return;
    }

    // Create a professional message
    let defaultMessage = `Hi ${getLandlordName()}, I'm interested in `;
    
    // Add property reference if available
    if (propertyUid) {
      defaultMessage += `property @${propertyUid}`;
    } else {
      defaultMessage += `your properties`;
    }
    
    defaultMessage += `. Can you provide more information?`;
    
    const encodedMessage = encodeURIComponent(defaultMessage);
    
    // Navigate to messages with landlord UUID and draft
    navigate(`/account/messages?landlord=${landlord.user_uid}&draft=${encodedMessage}`);
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove spaces and special characters, keep only digits
    return phone.replace(/\D/g, '');
  };

  // Handle WhatsApp message
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    
    const phone = landlord.public_phone || landlord.sso_profile?.phone;
    if (!phone) return;
    
    const whatsappNumber = formatPhoneForWhatsApp(phone);
    if (!whatsappNumber) return;
    
    let message = `Hi ${getLandlordName()}, I'm interested in `;
    
    if (propertyUid) {
      message += `property @${propertyUid}`;
    } else {
      message += `your properties`;
    }
    
    message += `. Can you provide more information?`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Get available contact options
  const getContactOptions = () => {
    if (!landlord) return [];
    
    const options = [];
    
    // In-App Messaging (Always show)
    options.push({
      type: 'inapp',
      icon: '💬',
      label: 'Message',
      color: 'bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 border border-[#BC8BBC]/30 text-[#8A5A8A] hover:from-[#BC8BBC]/30 hover:to-[#8A5A8A]/30',
      action: handleInAppMessage
    });
    
    // WhatsApp (Icon only)
    const phone = landlord.public_phone || landlord.sso_profile?.phone;
    if (phone) {
      const whatsappNumber = formatPhoneForWhatsApp(phone);
      if (whatsappNumber) {
        options.push({
          type: 'whatsapp',
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.523 5.87L.044 23.91l6.068-1.521C7.812 23.194 9.856 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.593-.504-5.097-1.382l-.365-.212-3.604.904.96-3.541-.23-.388C2.584 15.74 2 13.918 2 12 2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
            </svg>
          ),
          label: '',
          color: 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300',
          action: handleWhatsApp
        });
      }
    }
    
    // Phone Call
    if (phone) {
      options.push({
        type: 'phone',
        icon: '📞',
        label: '',
        color: 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300',
        action: (e) => {
          e.stopPropagation();
          window.location.href = `tel:${phone}`;
        }
      });
    }
    
    // Email
    const email = landlord.public_email || landlord.sso_profile?.email;
    if (email) {
      options.push({
        type: 'email',
        icon: '📧',
        label: '',
        color: 'bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 hover:border-purple-300',
        action: (e) => {
          e.stopPropagation();
          const subject = `Inquiry about your property`;
          let body = `Hi ${getLandlordName()},\n\n`;
          
          if (propertyUid) {
            body += `I would like to know more about property @${propertyUid}.`;
          } else {
            body += `I would like to know more about your properties.`;
          }
          
          window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
      });
    }
    
    return options;
  };

  const contactOptions = getContactOptions();
  const landlordName = getLandlordName();
  const userTypeDisplay = getUserTypeDisplay();
  const isLandlordVerified = isVerified();
  const landlordAvatar = landlord?.sso_profile?.profile_avatar_url;

  return (
    <div 
      onClick={handleViewProfile}
      className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-[#BC8BBC] hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-[#BC8BBC]/10 to-transparent rounded-bl-full -z-10"></div>
      
      {/* Header with Avatar and Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar Container */}
          <div className="relative">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#BC8BBC]/20 to-[#8A5A8A]/20 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
              {landlordAvatar ? (
                <img 
                  src={landlordAvatar} 
                  alt={landlordName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#BC8BBC]/20 to-[#8A5A8A]/20">
                        <span class="text-lg font-bold text-[#BC8BBC]">${getLandlordInitials()}</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-lg font-bold text-[#BC8BBC]">{getLandlordInitials()}</span>
                </div>
              )}
            </div>
            
            {/* Verification Badge - Updated to use your brand colors */}
            {isLandlordVerified && (
              <div className="absolute -bottom-1 -right-1">
                <div className="w-6 h-6 bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Online Indicator */}
            <div className="absolute top-0 right-0">
              <div className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
          </div>
          
          {/* Name and Type */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm leading-tight">
              {landlordName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {/* User Type Badge */}
              <span className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 text-[#8A5A8A] rounded-full">
                {userTypeDisplay}
              </span>
            </div>
          </div>
        </div>
        
        {/* View Profile Arrow */}
        <div className="text-gray-400 group-hover:text-[#BC8BBC] transition-colors transform group-hover:translate-x-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Contact Buttons - In-App Messaging always first, WhatsApp icon only */}
      {contactOptions.length > 0 && (
        <div className="mb-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {contactOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg 
                  ${option.color} transition-all duration-200 text-sm font-medium
                  ${option.type === 'inapp' ? 'flex-1' : ''}
                  ${option.type === 'whatsapp' ? 'px-3' : ''}
                `}
                title={option.type === 'whatsapp' ? 'WhatsApp' : option.type === 'phone' ? 'Call' : option.type === 'email' ? 'Email' : ''}
              >
                {typeof option.icon === 'string' ? (
                  <span className="text-base">{option.icon}</span>
                ) : (
                  option.icon
                )}
                {option.label && <span>{option.label}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar - Clean and minimal */}
      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">Available for inquiries</span>
          </div>
          
          {/* Quick Stats - Updated to use your brand colors */}
          <div className="text-xs text-gray-500 font-medium">
            {isLandlordVerified && (
              <span className="flex items-center gap-1 text-[#8A5A8A]">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified Host
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Click Hint */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-center gap-1 text-xs text-[#BC8BBC] font-medium">
          <span>View full profile</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#BC8BBC]/0 to-[#BC8BBC]/0 group-hover:from-[#BC8BBC]/5 group-hover:to-[#BC8BBC]/0 transition-all duration-300 rounded-xl -z-10"></div>
    </div>
  );
};

export default LandlordProfileCard;