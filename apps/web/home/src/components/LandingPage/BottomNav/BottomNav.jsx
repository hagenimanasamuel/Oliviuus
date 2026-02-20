// src/components/Navigation/BottomNav.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useIsanzureAuth } from '../../../context/IsanzureAuthContext';
import api from '../../../api/axios';
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
    DollarSign,
    Calendar,
    MessageSquare
} from 'lucide-react';

export default function BottomNav() {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [sheetHeight, setSheetHeight] = useState('70%');
    const sheetRef = useRef(null);
    const dragStartY = useRef(0);
    const startHeight = useRef(0);
    
    // Notification states
    const [notifications, setNotifications] = useState({
        messages: { count: 0, hasUnread: false },
        bookingMessages: { count: 0, hasUnread: false },
        bookings: { count: 0, hasUnread: false },
        activeBookings: { count: 0, hasUnread: false },
        upcomingBookings: { count: 0, hasUnread: false },
        payments: { count: 0, hasUnread: false },
        wishlist: { count: 0, hasUnread: false },
        wishlistActivity: { count: 0, hasUnread: false },
        settings: { count: 0, hasUnread: false },
        withdrawalVerification: { count: 0, hasUnread: false },
        propertyVerifications: { count: 0, hasUnread: false },
        tenants: { count: 0, hasUnread: false }
    });

    const location = useLocation();
    const navigate = useNavigate();
    
    const { user, logoutUser } = useAuth();
    const { userType, isLandlord, isAgent, isTenant } = useIsanzureAuth();

    // Get account center URL from environment
    const ACCOUNT_CENTER_URL = import.meta.env.VITE_ACCOUNT_CENTER_URL || 'https://account.oliviuus.com';

    // Fetch notification counts
    const fetchNotificationCounts = async () => {
        if (!user) return;

        try {
            const response = await api.get('/notifications/counts/all').catch(() => null);
            
            if (response?.data?.success) {
                const data = response.data.data.sidebar;
                setNotifications({
                    messages: data.messages,
                    bookingMessages: data.bookingMessages,
                    bookings: data.bookings,
                    activeBookings: data.activeBookings,
                    upcomingBookings: data.upcomingBookings,
                    payments: data.payments,
                    wishlist: data.wishlist,
                    wishlistActivity: data.wishlistActivity,
                    settings: data.settings,
                    withdrawalVerification: data.withdrawalVerification,
                    propertyVerifications: data.propertyVerifications || { count: 0, hasUnread: false },
                    tenants: data.tenants || { count: 0, hasUnread: false }
                });
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Poll for notifications
    useEffect(() => {
        fetchNotificationCounts();
        const interval = setInterval(fetchNotificationCounts, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Helper to get total count for an item
    const getTotalCount = (types) => {
        return types.reduce((sum, type) => sum + (notifications[type]?.count || 0), 0);
    };

    // Check if item has unread notifications
    const hasUnread = (types) => {
        return types.some(type => notifications[type]?.hasUnread || false);
    };

    // Handle touch/mouse events for bottom sheet dragging
    useEffect(() => {
        if (!isProfileMenuOpen || !sheetRef.current) return;

        const sheet = sheetRef.current;

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            if (touch.clientY > window.innerHeight - 100) return;

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

    const handleNavigation = (path, requiresAuth = false) => {
        if (requiresAuth && !user) {
            window.location.href = getAuthUrl(path);
        } else {
            navigate(path);
        }
    };

    const handleMenuItemClick = (path, requiresAuth = false) => {
        if (requiresAuth && !user) {
            window.location.href = getAuthUrl(path);
        } else {
            navigate(path);
        }
        setIsProfileMenuOpen(false);
    };

    const handleLogout = async () => {
        await logoutUser();
        setIsProfileMenuOpen(false);
        navigate('/');
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

    // Get user initial
    const getUserInitial = () => {
        if (user?.first_name) return user.first_name[0].toUpperCase();
        if (user?.email) return user.email[0].toUpperCase();
        return 'U';
    };

    // Mark notifications as read when viewing section
    const markAsRead = async (type) => {
        try {
            await api.put(`/notifications/${type}/mark-all-read`).catch(() => {});
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleProfileSectionClick = async (item) => {
        if (item.path) {
            navigate(item.path);
            
            // Mark relevant notifications as read
            if (item.label === 'Messages') {
                await markAsRead('messages');
                await markAsRead('booking_messages');
            } else if (item.label === 'Bookings') {
                await markAsRead('bookings');
            } else if (item.label === 'Wishlist') {
                await markAsRead('wishlist');
            } else if (item.label === 'Settings') {
                await markAsRead('settings');
                await markAsRead('withdrawal_verification');
            } else if (item.label === 'Payments') {
                await markAsRead('payments');
            }
        }
        setIsProfileMenuOpen(false);
    };

    // Get profile sections based on user type with notifications
    const getProfileSections = () => {
        const sections = [];

        // Account Section
        sections.push({
            title: user ? 'Account' : 'Welcome',
            items: user ? [
                { 
                    label: 'My Profile', 
                    icon: <User size={20} />, 
                    path: '/account/profile',
                    description: 'View and edit your profile',
                    requiresAuth: true 
                },
                { 
                    label: 'Bookings', 
                    icon: <Calendar size={20} />, 
                    path: '/account/bookings',
                    description: 'Manage your reservations',
                    requiresAuth: true,
                    notificationCount: getTotalCount(['bookings', 'activeBookings', 'upcomingBookings']),
                    hasNotification: hasUnread(['bookings', 'activeBookings', 'upcomingBookings'])
                },
                { 
                    label: 'Wishlist', 
                    icon: <Heart size={20} />, 
                    path: '/account/wishlist',
                    description: 'Your saved properties',
                    requiresAuth: true,
                    notificationCount: getTotalCount(['wishlist', 'wishlistActivity']),
                    hasNotification: hasUnread(['wishlist', 'wishlistActivity'])
                },
                { 
                    label: 'Messages', 
                    icon: <MessageSquare size={20} />, 
                    path: '/account/messages',
                    description: 'Chat with hosts and agents',
                    requiresAuth: true,
                    notificationCount: getTotalCount(['messages', 'bookingMessages']),
                    hasNotification: hasUnread(['messages', 'bookingMessages'])
                },
                { 
                    label: 'Payments', 
                    icon: <DollarSign size={20} />, 
                    path: '/account/payments',
                    description: 'Manage your payments',
                    requiresAuth: true,
                    notificationCount: notifications.payments?.count || 0,
                    hasNotification: notifications.payments?.hasUnread || false
                },
                { 
                    label: 'Settings', 
                    icon: <Settings size={20} />, 
                    path: '/account/settings',
                    description: 'Account preferences',
                    requiresAuth: true,
                    notificationCount: getTotalCount(['settings', 'withdrawalVerification']),
                    hasNotification: hasUnread(['settings', 'withdrawalVerification'])
                },
            ] : [
                { 
                    label: 'Sign In', 
                    icon: <User size={20} />, 
                    action: () => window.location.href = getAuthUrl(),
                    description: 'Access your account',
                    color: 'text-[#BC8BBC]'
                },
            ]
        });

        // Upgrade Options for Tenants
        if (user && isTenant) {
            sections.push({
                title: 'Upgrade Account',
                items: [
                    {
                        label: 'Become a Landlord',
                        icon: <Key size={20} />,
                        path: '/account/become-landlord',
                        description: 'List your property and earn income',
                        color: 'text-green-600',
                        highlight: true,
                        requiresAuth: true
                    },
                    {
                        label: 'Become an Agent',
                        icon: <Briefcase size={20} />,
                        path: '/account/become-agent',
                        description: 'Start a career in real estate',
                        color: 'text-blue-600',
                        highlight: true,
                        requiresAuth: true
                    },
                ]
            });
        }

        // Dashboard Links for Landlords/Agents
        if (user && isLandlord) {
            sections.push({
                title: 'Professional Tools',
                items: [
                    {
                        label: 'Landlord Dashboard',
                        icon: <HomeIcon size={20} />,
                        path: '/landlord/dashboard',
                        description: 'Manage properties, tenants & earnings',
                        color: 'text-[#BC8BBC]',
                        requiresAuth: true,
                        notificationCount: notifications.propertyVerifications?.count || 0,
                        hasNotification: notifications.propertyVerifications?.hasUnread || false
                    },
                    {
                        label: 'Analytics',
                        icon: <TrendingUp size={20} />,
                        path: '/landlord/dashboard/analytics',
                        description: 'View performance metrics',
                        color: 'text-blue-600',
                        requiresAuth: true
                    },
                    {
                        label: 'Tenants',
                        icon: <Users size={20} />,
                        path: '/landlord/dashboard/tenants',
                        description: 'Manage your tenants',
                        color: 'text-purple-600',
                        requiresAuth: true,
                        notificationCount: notifications.tenants?.count || 0,
                        hasNotification: notifications.tenants?.hasUnread || false
                    },
                ]
            });
        }

        if (user && isAgent) {
            sections.push({
                title: 'Professional Tools',
                items: [
                    {
                        label: 'Agent Dashboard',
                        icon: <Briefcase size={20} />,
                        path: '/agent/dashboard',
                        description: 'Manage listings & clients',
                        color: 'text-blue-600',
                        badge: 'Dashboard',
                        requiresAuth: true,
                        notificationCount: notifications.propertyVerifications?.count || 0,
                        hasNotification: notifications.propertyVerifications?.hasUnread || false
                    },
                    {
                        label: 'Commissions',
                        icon: <DollarSign size={20} />,
                        path: '/agent/dashboard/commissions',
                        description: 'Track your earnings',
                        color: 'text-green-600',
                        requiresAuth: true
                    },
                ]
            });
        }

        // Explore Section
        sections.push({
            title: 'Explore',
            items: [
                { 
                    label: 'Featured Properties', 
                    icon: <Star size={20} />, 
                    path: '/featured',
                    description: 'Curated premium listings',
                    color: 'text-yellow-600'
                },
                { 
                    label: 'Verified Listings', 
                    icon: <Shield size={20} />, 
                    path: '/verified',
                    description: 'Trusted and verified properties',
                    badge: 'Trusted',
                    color: 'text-emerald-600'
                },
                { 
                    label: 'Popular Locations', 
                    icon: <MapPin size={20} />, 
                    path: '/locations',
                    description: 'Discover trending destinations',
                    color: 'text-purple-600'
                },
            ]
        });

        // Support Section
        sections.push({
            title: 'Support',
            items: [
                { 
                    label: 'Help Center', 
                    icon: <HelpCircle size={20} />, 
                    path: '/help',
                    description: 'Get help with your account'
                },
                { 
                    label: 'Contact Us', 
                    icon: <Mail size={20} />, 
                    path: '/contact',
                    description: 'Reach out to our team'
                },
                { 
                    label: 'Privacy & Terms', 
                    icon: <Shield size={20} />, 
                    path: '/privacy',
                    description: 'Read our policies'
                },
            ]
        });

        return sections;
    };

    const profileSections = getProfileSections();

    // Main nav items with notification badges
    const mainNavItems = [
        {
            label: 'Explore',
            icon: <Home size={24} />,
            activeIcon: <Home size={24} className="fill-current" />,
            path: '/',
            active: location.pathname === '/',
            requiresAuth: false
        },
        {
            label: 'Wishlist',
            icon: <Heart size={24} />,
            activeIcon: <Heart size={24} className="fill-current" />,
            path: '/account/wishlist',
            active: location.pathname.includes('/account/wishlist'),
            requiresAuth: true,
            notificationCount: getTotalCount(['wishlist', 'wishlistActivity']),
            hasNotification: hasUnread(['wishlist', 'wishlistActivity'])
        },
        {
            label: 'Bookings',
            icon: <Calendar size={24} />,
            activeIcon: <Calendar size={24} />,
            path: '/account/bookings',
            active: location.pathname.includes('/account/bookings'),
            requiresAuth: true,
            notificationCount: getTotalCount(['bookings', 'activeBookings', 'upcomingBookings']),
            hasNotification: hasUnread(['bookings', 'activeBookings', 'upcomingBookings'])
        },
        {
            label: 'Messages',
            icon: <MessageSquare size={24} />,
            activeIcon: <MessageSquare size={24} />,
            path: '/account/messages',
            active: location.pathname.includes('/account/messages'),
            requiresAuth: true,
            notificationCount: getTotalCount(['messages', 'bookingMessages']),
            hasNotification: hasUnread(['messages', 'bookingMessages'])
        },
        {
            label: 'Profile',
            icon: <User size={24} />,
            activeIcon: <User size={24} />,
            isProfile: true,
            active: isProfileMenuOpen,
            notificationCount: getTotalCount(['payments', 'settings', 'withdrawalVerification', 'propertyVerifications', 'tenants']),
            hasNotification: hasUnread(['payments', 'settings', 'withdrawalVerification', 'propertyVerifications', 'tenants'])
        },
    ];

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-2xl py-2 px-2">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    {mainNavItems.map((item, index) => (
                        item.isProfile ? (
                            <button
                                key={index}
                                onClick={() => setIsProfileMenuOpen(true)}
                                className={`
                                    flex flex-col items-center justify-center p-2 rounded-xl transition-all relative
                                    ${isProfileMenuOpen
                                        ? 'text-[#BC8BBC]'
                                        : 'text-gray-500 hover:text-[#BC8BBC]'
                                    }
                                `}
                            >
                                <div className="relative">
                                    {user?.profile_avatar_url ? (
                                        <div className={`
                                            w-7 h-7 rounded-full overflow-hidden border-2 transition-all
                                            ${isProfileMenuOpen 
                                                ? 'border-[#BC8BBC] shadow-lg shadow-[#BC8BBC]/30 scale-110' 
                                                : 'border-gray-300'
                                            }
                                        `}>
                                            <img
                                                src={user.profile_avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`
                                            w-7 h-7 rounded-full flex items-center justify-center transition-all
                                            ${isProfileMenuOpen
                                                ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white scale-110 shadow-lg shadow-[#BC8BBC]/30'
                                                : 'bg-gray-100 text-gray-600'
                                            }
                                        `}>
                                            <User size={16} />
                                        </div>
                                    )}
                                    
                                    {/* Notification dot for profile */}
                                    {item.hasNotification && item.notificationCount > 0 && (
                                        <>
                                            {item.notificationCount <= 2 ? (
                                                <span 
                                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse ring-2 ring-white"
                                                    style={{ backgroundColor: '#BC8BBC' }}
                                                ></span>
                                            ) : (
                                                <span 
                                                    className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold ring-2 ring-white"
                                                    style={{ backgroundColor: '#BC8BBC' }}
                                                >
                                                    {item.notificationCount > 9 ? '9+' : item.notificationCount}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                                <span className={`
                                    text-[11px] mt-1.5 font-medium transition-all
                                    ${isProfileMenuOpen ? 'text-[#BC8BBC] font-semibold' : 'text-gray-500'}
                                `}>
                                    Profile
                                </span>
                            </button>
                        ) : (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.requiresAuth && !user) {
                                        window.location.href = getAuthUrl(item.path);
                                    } else {
                                        navigate(item.path);
                                    }
                                }}
                                className={`
                                    flex flex-col items-center justify-center p-2 rounded-xl transition-all relative
                                    ${item.active
                                        ? 'text-[#BC8BBC]'
                                        : 'text-gray-500 hover:text-[#BC8BBC]'
                                    }
                                `}
                            >
                                <div className="relative">
                                    <div className={`
                                        transition-all duration-300
                                        ${item.active ? 'scale-110' : 'scale-100'}
                                    `}>
                                        {item.active ? (item.activeIcon || item.icon) : item.icon}
                                    </div>
                                    
                                    {/* Notification dot/badge */}
                                    {item.hasNotification && item.notificationCount > 0 && user && (
                                        <>
                                            {item.notificationCount <= 2 ? (
                                                <span 
                                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse ring-2 ring-white"
                                                    style={{ backgroundColor: '#BC8BBC' }}
                                                ></span>
                                            ) : (
                                                <span 
                                                    className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold ring-2 ring-white"
                                                    style={{ backgroundColor: '#BC8BBC' }}
                                                >
                                                    {item.notificationCount > 9 ? '9+' : item.notificationCount}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    
                                    {/* Dot for unauthenticated users */}
                                    {item.requiresAuth && !user && (
                                        <span 
                                            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                                            style={{ backgroundColor: '#BC8BBC' }}
                                        ></span>
                                    )}
                                </div>
                                <span className={`
                                    text-[11px] mt-1.5 font-medium transition-all
                                    ${item.active ? 'text-[#BC8BBC] font-semibold' : 'text-gray-500'}
                                `}>
                                    {item.label}
                                </span>
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
                        className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setIsProfileMenuOpen(false)}
                    />

                    {/* Bottom Sheet */}
                    <div
                        ref={sheetRef}
                        className={`
                            lg:hidden fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl
                            transition-all duration-300 ease-out
                            ${isDragging ? 'transition-none' : ''}
                        `}
                        style={{
                            height: sheetHeight,
                            bottom: 0,
                            transform: `translateY(${isProfileMenuOpen ? '0' : '100%'})`,
                            maxHeight: '90%'
                        }}
                    >
                        {/* Drag Handle */}
                        <div className="pt-4 pb-2 flex justify-center">
                            <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors"></div>
                        </div>

                        {/* Header with Notification Summary */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className={`
                                            w-14 h-14 rounded-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 p-[2px]
                                            ${isDragging ? 'scale-105' : 'scale-100'} transition-transform
                                        `}>
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                                {user?.profile_avatar_url ? (
                                                    <img
                                                        src={user.profile_avatar_url}
                                                        alt="Profile"
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-semibold text-[#BC8BBC]">
                                                        {getUserInitial()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Total notification badge on avatar */}
                                        {user && (getTotalCount(['messages', 'bookingMessages', 'payments', 'settings']) > 0) && (
                                            <span 
                                                className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full text-white font-bold ring-2 ring-white"
                                                style={{ backgroundColor: '#BC8BBC' }}
                                            >
                                                {getTotalCount(['messages', 'bookingMessages', 'payments', 'settings']) > 9 
                                                    ? '9+' 
                                                    : getTotalCount(['messages', 'bookingMessages', 'payments', 'settings'])}
                                            </span>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1">
                                        {user ? (
                                            <>
                                                <h2 className="font-bold text-lg text-gray-900">
                                                    {user.first_name} {user.last_name || ''}
                                                </h2>
                                                <p className="text-sm text-gray-500 truncate max-w-[180px]">
                                                    {user?.email}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-xs px-2 py-0.5 bg-[#BC8BBC]/10 text-[#BC8BBC] rounded-full font-medium">
                                                        {getUserTypeDisplay()}
                                                    </span>
                                                    {user?.created_at && (
                                                        <span className="text-xs text-gray-400">
                                                            Joined {new Date(user.created_at).toLocaleDateString('en-US', { 
                                                                month: 'short', 
                                                                year: 'numeric' 
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="font-bold text-lg text-gray-900">
                                                    Welcome to Oliviuus
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    Sign in to access all features
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsProfileMenuOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content with Notification Badges */}
                        <div className="h-[calc(100%-120px)] overflow-y-auto pb-20">
                            {profileSections.map((section, sectionIndex) => (
                                <div key={sectionIndex} className="px-6 py-5 border-b border-gray-100">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                        {section.title}
                                    </h3>
                                    <div className="space-y-1.5">
                                        {section.items.map((item, itemIndex) => (
                                            <button
                                                key={itemIndex}
                                                onClick={() => {
                                                    if (item.action) {
                                                        item.action();
                                                    } else {
                                                        handleProfileSectionClick(item);
                                                    }
                                                }}
                                                className={`
                                                    w-full flex items-center justify-between p-3.5 rounded-xl
                                                    transition-all duration-300 group relative
                                                    ${item.highlight 
                                                        ? 'bg-gradient-to-r from-[#BC8BBC]/10 to-purple-600/10 hover:from-[#BC8BBC]/20 hover:to-purple-600/20' 
                                                        : 'hover:bg-gray-50'
                                                    }
                                                    ${item.hasNotification ? 'ring-2 ring-[#BC8BBC]/20' : ''}
                                                `}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`
                                                        w-10 h-10 rounded-xl flex items-center justify-center relative
                                                        ${item.highlight 
                                                            ? 'bg-gradient-to-r from-[#BC8BBC]/20 to-purple-600/20' 
                                                            : 'bg-gray-100 group-hover:bg-gray-200'
                                                        }
                                                        transition-colors
                                                    `}>
                                                        <div className={item.color || 'text-gray-600'}>
                                                            {item.icon}
                                                        </div>
                                                        
                                                        {/* Small dot for notification */}
                                                        {item.hasNotification && item.notificationCount <= 2 && (
                                                            <span 
                                                                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse ring-2 ring-white"
                                                                style={{ backgroundColor: '#BC8BBC' }}
                                                            ></span>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-medium text-gray-900">
                                                            {item.label}
                                                        </div>
                                                        {item.description && (
                                                            <div className="text-xs text-gray-500 mt-0.5">
                                                                {item.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    {item.notificationCount > 0 && (
                                                        <>
                                                            {item.notificationCount > 2 ? (
                                                                <span 
                                                                    className="text-xs px-2 py-1 rounded-full text-white font-bold"
                                                                    style={{ backgroundColor: '#BC8BBC' }}
                                                                >
                                                                    {item.notificationCount > 9 ? '9+' : item.notificationCount}
                                                                </span>
                                                            ) : (
                                                                <span 
                                                                    className="w-2 h-2 rounded-full animate-pulse"
                                                                    style={{ backgroundColor: '#BC8BBC' }}
                                                                ></span>
                                                            )}
                                                        </>
                                                    )}
                                                    {item.badge && !item.notificationCount && (
                                                        <span className="text-xs px-2.5 py-1 bg-[#BC8BBC]/10 text-[#BC8BBC] rounded-full font-medium">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    <ChevronRight 
                                                        size={16} 
                                                        className="text-gray-400 group-hover:text-[#BC8BBC] group-hover:translate-x-1 transition-all" 
                                                    />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Logout Button */}
                            {user && (
                                <div className="px-6 py-5">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center p-4 rounded-xl bg-red-50 hover:bg-red-100 active:bg-red-200 transition-all duration-300 group"
                                    >
                                        <LogOut size={20} className="text-red-600 mr-2 group-hover:scale-110 transition-transform" />
                                        <span className="font-medium text-red-600">Log Out</span>
                                    </button>

                                    {/* Member Since */}
                                    {user?.created_at && (
                                        <p className="text-center text-xs text-gray-400 mt-4">
                                            Member since {new Date(user.created_at).toLocaleDateString('en-US', { 
                                                month: 'long', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Add padding to content for bottom nav on mobile */}
            <style>
                {`
                    @media (max-width: 1023px) {
                        body {
                            padding-bottom: 80px;
                        }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.1); }
                    }
                    .animate-pulse {
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                `}
            </style>
        </>
    );
}