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

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove spaces and special characters, keep only digits
    return phone.replace(/\D/g, '');
  };

  // Get available contact options
  const getContactOptions = () => {
    if (!landlord) return [];
    
    const options = [];
    
    // WhatsApp
    const phone = landlord.public_phone || landlord.sso_profile?.phone;
    if (phone) {
      const whatsappNumber = formatPhoneForWhatsApp(phone);
      if (whatsappNumber) {
        options.push({
          type: 'whatsapp',
          icon: '💬',
          label: 'Message',
          color: 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300',
          action: (e) => {
            e.stopPropagation();
            const message = `Hello ${getLandlordName()}, I'm interested in this property!`;
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
          }
        });
      }
    }
    
    // Phone Call
    if (phone) {
      options.push({
        type: 'phone',
        icon: '📞',
        label: 'Call',
        color: 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
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
        label: 'Email',
        color: 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300',
        action: (e) => {
          e.stopPropagation();
          const subject = `Inquiry about your property`;
          const body = `Hello ${getLandlordName()},\n\nI would like to know more about your property.`;
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

      {/* Contact Buttons - Only show if available */}
      {contactOptions.length > 0 && (
        <div className="mb-3 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            {contactOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg ${option.color} transition-all duration-200 text-xs font-medium`}
              >
                <span className="text-sm">{option.icon}</span>
                <span>{option.label}</span>
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