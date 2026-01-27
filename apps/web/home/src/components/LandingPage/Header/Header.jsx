// Header.js
import { Menu, ChevronDown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import AccountMenu from './AccountMenu';
import Logo from '../../ui/Logo';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm w-full">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo - Hidden on mobile, shown on desktop */}
          {!isMobile && (
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              <Logo />
            </div>
          )}
          
          {/* Search Area - Takes full width on mobile, centered on desktop */}
          <div className={`${isMobile ? 'flex-1 mx-0' : 'flex-1 max-w-2xl mx-8'}`}>
            <SearchBar />
          </div>
          
          {/* Account Dropdown - Only on desktop */}
          {!isMobile && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full border border-gray-300 hover:shadow-md transition-shadow hover:bg-gray-50"
              >
                <Menu size={20} className="text-gray-600" />
                <AccountAvatar user={user} />
                <ChevronDown 
                  size={16} 
                  className={`text-gray-500 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isAccountMenuOpen && (
                <AccountMenu 
                  onClose={() => setIsAccountMenuOpen(false)} 
                  user={user}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// AccountAvatar Component
function AccountAvatar({ user }) {
  const [avatarError, setAvatarError] = useState(false);

  // If no user is logged in, show default icon
  if (!user) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
        <User className="w-4 h-4 text-gray-600" />
      </div>
    );
  }

  // If user has an avatar URL, try to load it
  if (user.profile_avatar_url && !avatarError) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
        <img 
          src={user.profile_avatar_url} 
          alt={`${user.first_name}'s avatar`} 
          className="w-full h-full object-cover"
          onError={() => setAvatarError(true)}
        />
      </div>
    );
  }

  // Fallback to initials for logged in users without avatar
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    } else if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BC8BBC]/20 to-purple-100 border border-[#BC8BBC]/30 flex items-center justify-center">
      <span className="text-sm font-semibold text-[#BC8BBC]">
        {getInitials()}
      </span>
    </div>
  );
}