// src/components/LandingPage/BottomNav/BottomNav.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import {
    Home,
    Heart,
    User,
    Building,
    Briefcase,
    Key,
    LogOut,
    Settings,
    BookOpen,
    Star,
    MapPin,
    ChevronRight,
    Shield,
    Mail,
    HelpCircle,
    X,
    Home as HomeIcon,
    Users,
    TrendingUp,
    DollarSign
} from 'lucide-react';

export default function BottomNav() {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [sheetHeight, setSheetHeight] = useState('70%');
    const sheetRef = useRef(null);
    const dragStartY = useRef(0);
    const startHeight = useRef(0);

    const { user, logoutUser } = useAuth();
    const { userType, isLandlord, isAgent, isTenant } = useIsanzureAuth();

    // Get account center URL from environment
    const ACCOUNT_CENTER_URL = import.meta.env.VITE_ACCOUNT_CENTER_URL || 'https://account.oliviuus.com';

    // Handle touch/mouse events for bottom sheet dragging
    useEffect(() => {
        if (!isProfileMenuOpen || !sheetRef.current) return;

        const sheet = sheetRef.current;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            if (touch.clientY > window.innerHeight - 100) return; // Only drag from top area

            setIsDragging(true);
            dragStartY.current = touch.clientY;
            startHeight.current = parseFloat(sheetHeight);
            e.preventDefault();
        };

        const handleMouseStart = (e) => {
            if (e.clientY > window.innerHeight - 100) return;

            setIsDragging(true);
            dragStartY.current = e.clientY;
            startHeight.current = parseFloat(sheetHeight);
        };

        const handleMove = (clientY) => {
            if (!isDragging) return;

            const deltaY = dragStartY.current - clientY;
            const newHeight = Math.min(Math.max(50, startHeight.current + (deltaY / window.innerHeight) * 100), 90);
            setSheetHeight(`${newHeight}%`);
        };

        const handleTouchMove = (e) => {
            handleMove(e.touches[0].clientY);
        };

        const handleMouseMove = (e) => {
            handleMove(e.clientY);
        };

        const handleEnd = () => {
            if (!isDragging) return;
            setIsDragging(false);

            const heightValue = parseFloat(sheetHeight);
            if (heightValue < 60) {
                setIsProfileMenuOpen(false);
                setSheetHeight('70%');
            }
        };

        sheet.addEventListener('touchstart', handleTouchStart, { passive: false });
        sheet.addEventListener('mousedown', handleMouseStart);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('mouseup', handleEnd);

        return () => {
            sheet.removeEventListener('touchstart', handleTouchStart);
            sheet.removeEventListener('mousedown', handleMouseStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('mouseup', handleEnd);
        };
    }, [isProfileMenuOpen, isDragging, sheetHeight]);

    // Generate auth URL with redirect parameter
    const getAuthUrl = (redirectPath = null) => {
        const redirectUrl = redirectPath ? `${window.location.origin}${redirectPath}` : window.location.href;
        const encodedRedirect = encodeURIComponent(redirectUrl);
        return `${ACCOUNT_CENTER_URL}/auth?redirect=${encodedRedirect}`;
    };

    const handleMenuItemClick = (path, requiresAuth = false) => {
        if (requiresAuth && !user) {
            window.location.href = getAuthUrl(path);
        } else {
            window.location.href = path;
        }
        setIsProfileMenuOpen(false);
    };

    const handleLogout = () => {
        logoutUser();
        setIsProfileMenuOpen(false);
        window.location.href = '/';
    };

    // Get user type display
    const getUserTypeDisplay = () => {
        if (!user) return 'Guest';
        switch (userType) {
            case 'landlord':
                return 'Landlord';
            case 'agent':
                return 'Agent';
            case 'property_manager':
                return 'Property Manager';
            default:
                return 'Tenant';
        }
    };

    // Get profile sections based on user type
    const getProfileSections = () => {
        const sections = [];

        // Always show Account section
        sections.push({
            title: user ? 'Account' : 'Welcome',
            items: user ? [
                { label: 'Profile', icon: <User size={20} />, path: '/profile', requiresAuth: true },
                { label: 'Bookings', icon: <BookOpen size={20} />, path: '/bookings', requiresAuth: true },
                { label: 'Wishlist', icon: <Heart size={20} />, path: '/wishlist', requiresAuth: true, badge: '12' },
                { label: 'Settings', icon: <Settings size={20} />, path: '/settings', requiresAuth: true },
            ] : [
                { label: 'Sign In', icon: <User size={20} />, action: () => window.location.href = getAuthUrl() },
            ]
        });

        // Show different sections based on user type
        if (!user) {
            // For guests - show growth opportunities
            sections.push({
                title: 'Growth Opportunities',
                items: [
                    {
                        label: 'Become a Landlord',
                        icon: <Key size={20} />,
                        path: '/become-landlord',
                        requiresAuth: true,
                        description: 'Generate income from your property',
                        color: 'text-green-600'
                    },
                    {
                        label: 'Become an Agent',
                        icon: <Briefcase size={20} />,
                        path: '/agent',
                        requiresAuth: true,
                        description: 'Build a career in real estate',
                        color: 'text-blue-600'
                    },
                ]
            });
        } else if (isTenant) {
            // For tenants - show upgrade options
            sections.push({
                title: 'Upgrade Your Account',
                items: [
                    {
                        label: 'Become a Landlord',
                        icon: <Key size={20} />,
                        path: '/landlord',
                        requiresAuth: true,
                        description: 'List your property and earn',
                        color: 'text-green-600'
                    },
                    {
                        label: 'Become an Agent',
                        icon: <Briefcase size={20} />,
                        path: '/agent',
                        requiresAuth: true,
                        description: 'Start a professional career',
                        color: 'text-blue-600'
                    },
                ]
            });
        } else if (isLandlord) {
            // For landlords - show Landlord Center that redirects to dashboard
            sections.push({
                title: 'Landlord',
                items: [
                    {
                        label: 'Landlord Center',
                        icon: <HomeIcon size={20} />,
                        path: '/landlord/dashboard',
                        requiresAuth: true,
                        description: 'Manage properties, tenants & earnings',
                        color: 'text-[#BC8BBC]',
                        badge: 'Dashboard'
                    },
                ]
            });
        } else if (isAgent) {
            // For agents - show Agent Center that redirects to dashboard
            sections.push({
                title: 'Agent',
                items: [
                    {
                        label: 'Agent Center',
                        icon: <Briefcase size={20} />,
                        path: '/agent/dashboard',
                        requiresAuth: true,
                        description: 'Manage listings, clients & commissions',
                        color: 'text-blue-600',
                        badge: 'Dashboard'
                    },
                ]
            });
        } else if (userType === 'property_manager') {
            // For property managers
            sections.push({
                title: 'Professional',
                items: [
                    {
                        label: 'Property Manager',
                        icon: <Building size={20} />,
                        path: '/property-manager/dashboard',
                        requiresAuth: true,
                        description: 'Manage multiple properties',
                        color: 'text-purple-600',
                        badge: 'Dashboard'
                    },
                ]
            });
        }

        // Always show Explore section
        sections.push({
            title: 'Explore',
            items: [
                { label: 'Featured Properties', icon: <Star size={20} />, path: '/featured' },
                { label: 'Verified Listings', icon: <Shield size={20} />, path: '/verified', badge: 'Verified' },
                { label: 'Popular Locations', icon: <MapPin size={20} />, path: '/locations' },
            ]
        });

        // Always show Help section
        sections.push({
            title: 'Support',
            items: [
                { label: 'Help Center', icon: <HelpCircle size={20} />, path: '/help' },
                { label: 'Contact Us', icon: <Mail size={20} />, path: '/contact' },
                { label: 'Terms & Privacy', icon: <Shield size={20} />, path: '/privacy' },
            ]
        });

        return sections;
    };

    const profileSections = getProfileSections();

    // Main nav items - Home, Saved, Profile
    const mainNavItems = [
        {
            label: 'Home',
            icon: <Home size={24} />,
            path: '/',
            active: window.location.pathname === '/'
        },
        {
            label: 'Saved',
            icon: <Heart size={24} />,
            path: '/wishlist',
            requiresAuth: true
        },
        {
            label: 'Profile',
            icon: <User size={24} />,
            isProfile: true
        },
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg py-2">
                <div className="flex items-center justify-around">
                    {mainNavItems.map((item, index) => (
                        item.isProfile ? (
                            <button
                                key={index}
                                onClick={() => setIsProfileMenuOpen(true)}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${isProfileMenuOpen
                                        ? 'bg-[#BC8BBC]/10 text-[#BC8BBC]'
                                        : 'text-gray-600 hover:text-[#BC8BBC]'
                                    }`}
                            >
                                <div className="relative">
                                    {user?.profile_avatar_url ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#BC8BBC]/30">
                                            <img
                                                src={user.profile_avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#BC8BBC]/20 flex items-center justify-center">
                                            <User size={20} className="text-[#BC8BBC]" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs mt-1 font-medium">Profile</span>
                            </button>
                        ) : (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.requiresAuth && !user) {
                                        window.location.href = getAuthUrl(item.path);
                                    } else {
                                        window.location.href = item.path;
                                    }
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${item.active
                                        ? 'text-[#BC8BBC]'
                                        : 'text-gray-600 hover:text-[#BC8BBC]'
                                    }`}
                            >
                                {item.icon}
                                <span className="text-xs mt-1 font-medium">{item.label}</span>
                                {item.requiresAuth && !user && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#BC8BBC] rounded-full"></div>
                                )}
                            </button>
                        )
                    ))}
                </div>
            </nav>

            {/* Bottom Sheet Modal */}
            {isProfileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsProfileMenuOpen(false)}
                    />

                    {/* Bottom Sheet */}
                    <div
                        ref={sheetRef}
                        className={`md:hidden fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${isDragging ? 'transition-none' : ''
                            }`}
                        style={{
                            height: sheetHeight,
                            bottom: 0,
                            transform: `translateY(${isProfileMenuOpen ? '0' : '100%'})`,
                            maxHeight: '90%'
                        }}
                    >
                        {/* Drag Handle */}
                        <div className="pt-3 pb-2 flex justify-center">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {user?.profile_avatar_url ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-[#BC8BBC]/30">
                                            <img
                                                src={user.profile_avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#BC8BBC] to-purple-600 flex items-center justify-center">
                                            <User size={24} className="text-white" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        {user ? (
                                            <>
                                                <h2 className="font-bold text-lg text-gray-900">
                                                    {user.first_name} {user.last_name || ''}
                                                </h2>
                                                <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs px-2 py-0.5 bg-[#BC8BBC]/10 text-[#BC8BBC] rounded-full">
                                                        {getUserTypeDisplay()}
                                                    </span>
                                                    {user.created_at && (
                                                        <span className="text-xs text-gray-400">
                                                            Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="font-bold text-lg text-gray-900">Welcome to Oliviuus</h2>
                                                <p className="text-sm text-gray-500">Sign in to access all features</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsProfileMenuOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="h-[calc(100%-85px)] overflow-y-auto pb-20">
                            {profileSections.map((section, sectionIndex) => (
                                <div key={sectionIndex} className="px-6 py-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {section.items.map((item, itemIndex) => (
                                            <button
                                                key={itemIndex}
                                                onClick={() => {
                                                    if (item.action) {
                                                        item.action();
                                                    } else {
                                                        handleMenuItemClick(item.path, item.requiresAuth);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color ? `${item.color.replace('text', 'bg')}/10` : 'bg-gray-100'
                                                        }`}>
                                                        <div className={item.color || 'text-gray-600'}>
                                                            {item.icon}
                                                        </div>
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-medium text-gray-900">{item.label}</div>
                                                        {item.description && (
                                                            <div className="text-xs text-gray-500">{item.description}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {item.badge && (
                                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Logout Section for logged-in users */}
                            {user && (
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center p-3 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors"
                                    >
                                        <LogOut size={20} className="text-red-600 mr-2" />
                                        <span className="font-medium text-red-600">Log Out</span>
                                    </button>
                                </div>
                            )}

                            {/* App Info */}
                            <div className="px-6 py-4 border-t border-gray-100">
                                <div className="text-center text-xs text-gray-400">
                                    <p>© {new Date().getFullYear()} Oliviuus Ltd. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Add padding to content for bottom nav */}
            <style>
                {`
          @media (max-width: 767px) {
            body {
              padding-bottom: 70px;
            }
          }
        `}
            </style>
        </>
    );
}