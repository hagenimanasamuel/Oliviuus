// src/pages/Host/HostProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

// Import components
import MainHeader from '../../components/LandingPage/Header/Header';
import BottomNav from '../../components/LandingPage/BottomNav/BottomNav';
import Footer from '../../components/ui/Footer';

const HostProfilePage = () => {
  const { hostUid } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState(null);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    verifiedProperties: 0,
    activeProperties: 0
  });

  // Auto scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchHostProfile();
  }, [hostUid]);

  const fetchHostProfile = async () => {
    try {
      setLoading(true);
      
      // First try the host endpoint (for UUIDs)
      try {
        const hostResponse = await api.get(`/public/properties/host/${hostUid}`);
        
        if (hostResponse.data.success) {
          const hostData = hostResponse.data.data;
          setHost(hostData);
          
          // Update stats from host data
          if (hostData.stats) {
            setStats({
              totalProperties: hostData.stats.total_properties || 0,
              verifiedProperties: hostData.stats.verified_properties || 0,
              activeProperties: hostData.stats.active_properties || 0
            });
          }
          
          // Set properties if available
          if (hostData.properties && hostData.properties.length > 0) {
            setProperties(hostData.properties);
          } else if (hostData.id) {
            // Fetch properties separately
            const propsResponse = await api.get(`/public/properties/landlord/${hostData.id}/properties?limit=20`);
            if (propsResponse.data.success) {
              setProperties(propsResponse.data.data.properties || []);
            }
          }
          return; // Success, exit early
        }
      } catch (hostError) {
        console.log('Host endpoint failed, trying landlord endpoint...');
      }
      
      // If host endpoint failed, try landlord endpoint (for numeric IDs)
      const landlordResponse = await api.get(`/public/properties/landlord/${hostUid}`);
      
      if (landlordResponse.data.success) {
        const hostData = landlordResponse.data.data;
        setHost(hostData);
        
        // Update stats
        if (hostData.stats) {
          setStats({
            totalProperties: hostData.stats.total_properties || 0,
            verifiedProperties: hostData.stats.verified_properties || 0,
            activeProperties: hostData.stats.active_properties || 0
          });
        }
        
        // Fetch properties
        const propsResponse = await api.get(`/public/properties/landlord/${hostUid}/properties?limit=20`);
        if (propsResponse.data.success) {
          setProperties(propsResponse.data.data.properties || []);
        }
      }
    } catch (error) {
      console.error('Error fetching host profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0 || price === '0') return 'Contact';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Format property type
  const formatPropertyType = (type) => {
    if (!type) return '';
    const typeMap = {
      'apartment': 'APARTMENT',
      'house': 'HOUSE',
      'villa': 'VILLA',
      'condo': 'CONDO',
      'studio': 'STUDIO',
      'ghetto': 'GHETTO',
      'living_house': 'LIVING HOUSE',
      'service_apartment': 'SERVICE APT',
      'guest_house': 'GUEST HOUSE',
      'bungalow': 'BUNGALOW',
      'commercial': 'COMMERCIAL',
      'hostel': 'HOSTEL',
      'penthouse': 'PENTHOUSE',
      'townhouse': 'TOWNHOUSE',
      'upmarket': 'UP MARKET'
    };
    return typeMap[type] || type.toUpperCase().replace('_', ' ');
  };

  // Get host full name
  const getHostFullName = () => {
    if (!host) return "Host";
    
    // First check SSO profile
    if (host.sso_profile?.full_name) {
      return host.sso_profile.full_name;
    }
    
    if (host.sso_profile?.first_name && host.sso_profile?.last_name) {
      return `${host.sso_profile.first_name} ${host.sso_profile.last_name}`;
    }
    
    if (host.sso_profile?.first_name) {
      return host.sso_profile.first_name;
    }
    
    if (host.sso_profile?.username) {
      return host.sso_profile.username;
    }
    
    // Fallback to any available name
    if (host.first_name && host.last_name) {
      return `${host.first_name} ${host.last_name}`;
    }
    
    if (host.first_name) {
      return host.first_name;
    }
    
    if (host.username) {
      return host.username;
    }
    
    return "Host";
  };

  // Get host initials for avatar
  const getHostInitials = () => {
    const name = getHostFullName();
    if (name === "Host") return "🏠";
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Get host type display
  const getHostTypeDisplay = () => {
    if (!host?.user_type) return "Host";
    
    switch(host.user_type) {
      case 'property_manager': return 'Property Manager';
      case 'agent': return 'Real Estate Agent';
      case 'landlord': return 'Landlord';
      default: return 'Host';
    }
  };

  // Check if host is verified
  const isVerified = () => {
    if (!host) return false;
    
    // Check multiple verification indicators
    return host.is_verified === true || 
           host.id_verified === 1 || 
           host.verification_status === 'approved';
  };

  // Get host avatar URL
  const getHostAvatar = () => {
    if (host?.sso_profile?.profile_avatar_url) {
      return host.sso_profile.profile_avatar_url;
    }
    return null;
  };

  // Get contact phone
  const getContactPhone = () => {
    return host?.public_phone || host?.sso_profile?.phone || null;
  };

  // Get contact email
  const getContactEmail = () => {
    return host?.public_email || host?.sso_profile?.email || null;
  };

  // Get price options like in property listing
  const getPriceOptions = (property) => {
    const options = [];
    
    // Only show if price is valid and property accepts that period
    if (property.accept_monthly && property.monthly_price > 0) {
      options.push({
        amount: property.monthly_price,
        period: 'month',
        label: 'Monthly',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        primary: true
      });
    }
    
    if (property.accept_nightly && property.nightly_price > 0) {
      options.push({
        amount: property.nightly_price,
        period: 'night',
        label: 'Nightly',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )
      });
    }
    
    if (property.accept_weekly && property.weekly_price > 0) {
      options.push({
        amount: property.weekly_price,
        period: 'week',
        label: 'Weekly',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      });
    }
    
    if (property.accept_daily && property.daily_price > 0) {
      options.push({
        amount: property.daily_price,
        period: 'day',
        label: 'Daily',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      });
    }
    
    return options;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            {/* Properties skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col">
                  <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                    <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative"></div>
                    <div className="p-3">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded mb-3 w-full"></div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
        <Footer />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Host Not Found</h2>
          <p className="text-gray-600 mb-6">This host profile is no longer available.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Browse Properties
          </button>
        </div>
        <BottomNav />
        <Footer />
      </div>
    );
  }

  const hostFullName = getHostFullName();
  const hostTypeDisplay = getHostTypeDisplay();
  const hostVerified = isVerified();
  const hostAvatar = getHostAvatar();
  const contactPhone = getContactPhone();
  const contactEmail = getContactEmail();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Host Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#BC8BBC]/20 to-[#8A5A8A]/20 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {hostAvatar ? (
                  <img 
                    src={hostAvatar} 
                    alt={hostFullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <span class="text-2xl font-bold text-[#BC8BBC]">${getHostInitials()}</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#BC8BBC]">{getHostInitials()}</span>
                  </div>
                )}
              </div>
              
              {/* Verification Badge - Updated to use your color */}
              {hostVerified && (
                <div className="absolute -bottom-2 -right-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Online Status */}
              <div className="absolute top-0 right-0">
                <div className="w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
              </div>
            </div>
            
            {/* Host Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {hostFullName}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm px-3 py-1 bg-gradient-to-r from-[#BC8BBC]/10 to-[#8A5A8A]/10 text-[#8A5A8A] rounded-full font-medium">
                      {hostTypeDisplay}
                    </span>
                    
                    {hostVerified && (
                      <span className="text-sm px-3 py-1 bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 text-[#8A5A8A] rounded-full font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified Host
                      </span>
                    )}
                    
                    {/* Property Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-gray-900">{stats.totalProperties || properties.length}</span>
                        <span>Properties</span>
                      </span>
                      {stats.verifiedProperties > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="font-bold text-[#8A5A8A]">{stats.verifiedProperties}</span>
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Message/Chat Button - Updated to use isanzure's internal chat */}
                <button
                  onClick={() => navigate('/tenant/messages')}
                  className="bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Host
                </button>
              </div>
              
              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-gray-100">
                {contactPhone && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                      <span className="text-[#8A5A8A]">📞</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <a 
                        href={`tel:${contactPhone}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#BC8BBC] transition-colors"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>
                )}
                
                {contactEmail && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                      <span className="text-[#8A5A8A]">📧</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <a 
                        href={`mailto:${contactEmail}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#BC8BBC] transition-colors"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Always show In-App Messaging */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                    <span className="text-[#8A5A8A]">💬</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Messaging</div>
                    <button
                      onClick={() => navigate('/tenant/messages')}
                      className="text-sm font-medium text-gray-900 hover:text-[#BC8BBC] transition-colors"
                    >
                      In-App Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section - Updated layout to match property listings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Properties ({properties.length})
              </h2>
              {properties.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Showing {properties.length} properties available for rent
                </p>
              )}
            </div>
            
            {properties.length > 0 && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-medium text-gray-700">{properties.length}</span> properties found
              </div>
            )}
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
              <div className="text-5xl mb-4 text-gray-300">🏠</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No Properties Available</h3>
              <p className="text-gray-600 mb-6">This host doesn't have any active properties at the moment.</p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 bg-[#BC8BBC] text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Browse Other Properties
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {properties.map((property) => {
                const priceOptions = getPriceOptions(property);
                const primaryOption = priceOptions[0];
                const secondaryOption = priceOptions[1];
                
                return (
                  <div 
                    key={property.id}
                    onClick={() => {
                      // Scroll to top before navigating
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => navigate(`/property/${property.property_uid}`), 100);
                    }}
                    className="group cursor-pointer flex flex-col"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-[#BC8BBC] hover:shadow-lg transition-all duration-300 flex-1 flex flex-col">
                      {/* Property Image */}
                      <div className="h-40 relative overflow-hidden flex-shrink-0">
                        {property.cover_image ? (
                          <img 
                            src={property.cover_image} 
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#f4eaf4] to-[#e8d4e8] flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-4xl text-[#BC8BBC]/50">🏠</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                        
                        {/* Property Type Badge */}
                        <div className="absolute top-3 left-3">
                          <div className="px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full">
                            <span className="text-[10px] font-bold text-[#BC8BBC] leading-tight tracking-tight">
                              {formatPropertyType(property.property_type).length > 15 ? 
                                formatPropertyType(property.property_type).substring(0, 15) + '...' : 
                                formatPropertyType(property.property_type)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Favorite Button */}
                        <button 
                          className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle favorite logic here
                          }}
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        
                        {/* Verified Badge */}
                        {property.is_verified && (
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-full">
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Featured Badge */}
                        {property.is_featured && (
                          <div className="absolute bottom-3 right-3">
                            <span className="text-[10px] font-medium px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded shadow-sm">
                              ⭐ Featured
                            </span>
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        {property.status === 'rented' && (
                          <div className="absolute top-3 left-12">
                            <span className="text-[10px] font-medium px-2 py-1 bg-red-500 text-white rounded shadow-sm">
                              🔒 Rented
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Property Info */}
                      <div className="p-3 flex-1 flex flex-col">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                          {property.title || 'Beautiful Property'}
                        </h3>
                        
                        {/* Location */}
                        <div className="flex items-start gap-1.5 mb-2 flex-grow">
                          <svg className="w-3 h-3 text-[#BC8BBC] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {property.sector || property.district ? 
                              `${property.sector || ''}${property.sector && property.district ? ', ' : ''}${property.district || ''}` 
                              : 'Location not specified'}
                          </span>
                        </div>
                        
                        {/* Property Features - Updated to remove max guests display */}
                        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                          {property.area > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="text-gray-700">📏</span>
                              <span>{property.area}m²</span>
                            </span>
                          )}
                          {property.bedrooms > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="text-gray-700">🛏️</span>
                              <span>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Price Options - Updated to match property listing */}
                        <div className="pt-2 border-t border-gray-100 mt-auto">
                          {primaryOption ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {primaryOption.icon}
                                  <span className="text-xs text-gray-500">{primaryOption.label}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900 text-sm">
                                    {formatPrice(primaryOption.amount)}
                                  </div>
                                </div>
                              </div>
                              
                              {secondaryOption && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {secondaryOption.icon}
                                    <span className="text-xs text-gray-500">{secondaryOption.label}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium text-gray-700 text-sm">
                                      {formatPrice(secondaryOption.amount)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {priceOptions.length > 2 && (
                                <div className="flex items-center justify-center pt-1">
                                  <div className="flex items-center gap-1 text-xs text-[#BC8BBC]">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    <span>+{priceOptions.length - 2} more options</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-sm text-gray-500">Contact for pricing</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Host Information Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">About This Host</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                  <span className="text-[#BC8BBC]">📞</span>
                </div>
                <span>Contact Information</span>
              </h4>
              
              <div className="space-y-4">
                {contactPhone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                      <span className="text-[#8A5A8A] text-lg">📞</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                      <div className="flex items-center justify-between">
                        <a 
                          href={`tel:${contactPhone}`}
                          className="font-medium text-gray-900 hover:text-[#BC8BBC] transition-colors"
                        >
                          {contactPhone}
                        </a>
                        <button
                          onClick={() => navigate('/tenant/messages')}
                          className="text-xs px-3 py-1.5 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded hover:opacity-90 transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {contactEmail && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                      <span className="text-[#8A5A8A] text-lg">📧</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Email Address</div>
                      <a 
                        href={`mailto:${contactEmail}`}
                        className="font-medium text-gray-900 hover:text-[#BC8BBC] transition-colors"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {/* Preferred Contact Methods - Always include In-App Messaging */}
                <div className="p-3 bg-gradient-to-r from-[#BC8BBC]/5 to-[#8A5A8A]/5 rounded-lg border border-[#BC8BBC]/10">
                  <div className="text-sm font-medium text-gray-700 mb-2">Contact Methods</div>
                  <div className="flex flex-wrap gap-2">
                    {/* Always show In-App Messaging */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
                      <span className="text-[#BC8BBC]">💬</span> In-App Messaging
                    </span>
                    
                    {/* Show other preferred methods from host */}
                    {host.preferred_contact_methods && host.preferred_contact_methods.map((method, index) => (
                      <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm">
                        {method === 'whatsapp' && '💬 WhatsApp'}
                        {method === 'phone' && '📞 Phone Call'}
                        {method === 'email' && '📧 Email'}
                        {method === 'sms' && '📱 SMS'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Host Stats & Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                  <span className="text-[#BC8BBC]">📊</span>
                </div>
                <span>Host Information</span>
              </h4>
              
              <div className="space-y-4">
                {/* Property Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-[#BC8BBC]/10 to-[#8A5A8A]/10 rounded-xl border border-[#BC8BBC]/20 text-center">
                    <div className="text-2xl font-bold text-[#8A5A8A]">{stats.totalProperties || properties.length}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Properties</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#BC8BBC]/10 to-[#8A5A8A]/10 rounded-xl border border-[#BC8BBC]/20 text-center">
                    <div className="text-2xl font-bold text-[#8A5A8A]">{stats.verifiedProperties}</div>
                    <div className="text-sm text-gray-600 mt-1">Verified Properties</div>
                  </div>
                </div>
                
                {/* Verification Status */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-900">Verification Status</div>
                    {hostVerified ? (
                      <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 text-[#8A5A8A] rounded-full font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified Identity
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full font-medium">
                        Not Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {hostVerified 
                      ? "This host has completed identity verification and is a trusted member of iSanzure."
                      : "This host hasn't completed identity verification yet. Contact them directly for more information."}
                  </p>
                </div>
                
                {/* Host Type */}
                <div className="p-4 bg-gradient-to-r from-[#BC8BBC]/5 to-[#8A5A8A]/5 rounded-xl border border-[#BC8BBC]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#BC8BBC]/20 to-[#8A5A8A]/20 flex items-center justify-center">
                      <span className="text-[#8A5A8A] text-lg">👤</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Host Type</div>
                      <div className="text-sm text-gray-600">{getHostTypeDisplay()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Properties Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:border-[#BC8BBC] hover:text-[#BC8BBC] transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Properties
          </button>
        </div>
      </main>
      
      <BottomNav />
      <Footer />
    </div>
  );
};

export default HostProfilePage;