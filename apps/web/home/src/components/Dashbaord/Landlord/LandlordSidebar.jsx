// src/pages/Dashboard/Landlord/components/LandlordSidebar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  DollarSign, 
  Users, 
  Settings, 
  BarChart,
  Calendar,
  MessageSquare,
  Shield,
  Wallet,
  Bell
} from 'lucide-react';
import api from '../../../api/axios';

export default function LandlordSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // State for notification counts
  const [notifications, setNotifications] = useState({
    sidebar: {
      messages: { count: 0, hasUnread: false, dotColor: '#EF4444' },
      bookings: { count: 0, hasUnread: false, dotColor: '#EAB308' },
      payments: { count: 0, hasUnread: false, dotColor: '#22C55E' },
      settings: { count: 0, hasUnread: false, dotColor: '#A855F7' },
      tenants: { count: 0, hasUnread: false, dotColor: '#3B82F6' },
      system: { count: 0, hasUnread: false, dotColor: '#6B7280' }
    },
    summary: {
      totalUnread: 0,
      totalPending: 0
    },
    lastUpdated: null
  });

  const [loading, setLoading] = useState(true);

  // Fetch all notification counts in one API call
  const fetchNotificationCounts = async () => {
    try {
      const response = await api.get('/notifications/counts/all');
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      
      // Fallback: try individual endpoints if the all-in-one fails
      fetchIndividualCounts();
    } finally {
      setLoading(false);
    }
  };

  // Fallback: fetch individual counts
  const fetchIndividualCounts = async () => {
    try {
      const [
        messagesRes,
        bookingsRes,
        paymentsRes,
        verificationsRes,
        tenantsRes,
        systemRes
      ] = await Promise.allSettled([
        api.get('/notifications/counts/messages'),
        api.get('/notifications/counts/bookings'),
        api.get('/notifications/counts/payments'),
        api.get('/notifications/counts/verifications'),
        api.get('/notifications/counts/tenants'),
        api.get('/notifications/counts/system')
      ]);

      setNotifications(prev => ({
        ...prev,
        sidebar: {
          messages: { 
            ...prev.sidebar.messages, 
            count: messagesRes.value?.data?.data?.count || 0,
            hasUnread: (messagesRes.value?.data?.data?.count || 0) > 0
          },
          bookings: { 
            ...prev.sidebar.bookings, 
            count: bookingsRes.value?.data?.data?.count || 0,
            hasUnread: (bookingsRes.value?.data?.data?.count || 0) > 0
          },
          payments: { 
            ...prev.sidebar.payments, 
            count: paymentsRes.value?.data?.data?.count || 0,
            hasUnread: (paymentsRes.value?.data?.data?.count || 0) > 0
          },
          settings: { 
            ...prev.sidebar.settings, 
            count: verificationsRes.value?.data?.data?.count || 0,
            hasUnread: (verificationsRes.value?.data?.data?.count || 0) > 0
          },
          tenants: { 
            ...prev.sidebar.tenants, 
            count: tenantsRes.value?.data?.data?.count || 0,
            hasUnread: (tenantsRes.value?.data?.data?.count || 0) > 0
          },
          system: { 
            ...prev.sidebar.system, 
            count: systemRes.value?.data?.data?.count || 0,
            hasUnread: (systemRes.value?.data?.data?.count || 0) > 0
          }
        },
        summary: {
          totalUnread: (messagesRes.value?.data?.data?.count || 0) + (systemRes.value?.data?.data?.count || 0),
          totalPending: (bookingsRes.value?.data?.data?.count || 0) + 
                       (paymentsRes.value?.data?.data?.count || 0) + 
                       (verificationsRes.value?.data?.data?.count || 0) + 
                       (tenantsRes.value?.data?.data?.count || 0)
        },
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching individual counts:', error);
    }
  };

  // Set up polling
  useEffect(() => {
    fetchNotificationCounts();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchNotificationCounts, 30000);
    
    // Listen for WebSocket updates (if available)
    const handleNotificationUpdate = (event) => {
      if (event.detail) {
        setNotifications(prev => ({
          ...prev,
          sidebar: {
            ...prev.sidebar,
            ...event.detail
          },
          lastUpdated: new Date().toISOString()
        }));
      }
    };
    
    window.addEventListener('notification-update', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-update', handleNotificationUpdate);
    };
  }, []);

  const sidebarItems = [
    { 
      label: 'Overview', 
      icon: <Home size={20} />, 
      path: '', 
      exact: true 
    },
    { 
      label: 'My Properties', 
      icon: <Home size={20} />, 
      path: 'properties' 
    },
    { 
      label: 'Add Property', 
      icon: <PlusCircle size={20} />, 
      path: 'add-property' 
    },
    { 
      label: 'Bookings', 
      icon: <Calendar size={20} />, 
      path: 'bookings',
      notification: notifications.sidebar.bookings
    },
    { 
      label: 'Tenants', 
      icon: <Users size={20} />, 
      path: 'tenants',
      notification: notifications.sidebar.tenants
    },
    { 
      label: 'Payments', 
      icon: <DollarSign size={20} />, 
      path: 'payments',
      notification: notifications.sidebar.payments
    },
    { 
      label: 'Analytics', 
      icon: <BarChart size={20} />, 
      path: 'analytics' 
    },
    { 
      label: 'Messages', 
      icon: <MessageSquare size={20} />, 
      path: 'messages',
      notification: notifications.sidebar.messages
    },
    { 
      label: 'Settings', 
      icon: <Settings size={20} />, 
      path: 'settings',
      notification: notifications.sidebar.settings
    },
  ];

  const isActive = (itemPath, exact = false) => {
    const currentPath = location.pathname;
    
    if (exact) {
      return currentPath === `/landlord/dashboard${itemPath ? `/${itemPath}` : ''}` ||
             currentPath === `/landlord${itemPath ? `/${itemPath}` : ''}`;
    }
    
    return currentPath.startsWith(`/landlord/dashboard/${itemPath}`) ||
           currentPath.startsWith(`/landlord/${itemPath}`);
  };

  // Mark notification as read when clicked
  const handleNavClick = async (item) => {
    // Navigate first
    navigate(`/landlord/dashboard/${item.path}`);
    
    // Then mark notifications as read (if any)
    if (item.notification?.hasUnread && item.notification?.count > 0) {
      try {
        // Mark all of this type as read
        let type = '';
        if (item.label === 'Messages') type = 'messages';
        else if (item.label === 'Bookings') type = 'bookings';
        else if (item.label === 'Payments') type = 'payments';
        else if (item.label === 'Settings') type = 'verifications';
        else if (item.label === 'Tenants') type = 'tenants';
        
        if (type) {
          await api.put(`/notifications/${type}/mark-all-read`);
          
          // Update local state
          setNotifications(prev => ({
            ...prev,
            sidebar: {
              ...prev.sidebar,
              [type === 'messages' ? 'messages' : 
               type === 'bookings' ? 'bookings' :
               type === 'payments' ? 'payments' :
               type === 'verifications' ? 'settings' : 'tenants']: {
                ...prev.sidebar[type === 'messages' ? 'messages' : 
                               type === 'bookings' ? 'bookings' :
                               type === 'payments' ? 'payments' :
                               type === 'verifications' ? 'settings' : 'tenants'],
                count: 0,
                hasUnread: false
              }
            }
          }));
        }
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 overflow-hidden flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center mb-8">
          <Shield className="h-6 w-6" style={{ color: '#BC8BBC' }} />
          <h2 className="ml-3 text-lg font-semibold text-gray-900">Landlord Tools</h2>
          
          {/* Small indicator if there are any notifications */}
          {notifications.summary.totalUnread + notifications.summary.totalPending > 0 && (
            <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </div>
        
        <nav className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {sidebarItems.map((item) => {
            const active = isActive(item.path, item.exact);
            const notification = item.notification;
            const showNotification = notification?.hasUnread && notification?.count > 0;
            
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${
                  active 
                    ? 'bg-[#f4eaf4] text-[#8A5A8A] border-l-4 border-[#BC8BBC] pl-3' 
                    : 'text-gray-700 hover:bg-[#f9f3f9] hover:text-[#8A5A8A]'
                }`}
              >
                <div className={active ? 'text-[#BC8BBC]' : 'text-gray-500'}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                
                {/* Notification Dot/Badge */}
                {showNotification && (
                  <>
                    {/* Small dot for 1-2 notifications */}
                    {notification.count <= 2 ? (
                      <span 
                        className="absolute right-3 w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: notification.dotColor }}
                        title={`${notification.count} unread`}
                      ></span>
                    ) : (
                      /* Number badge for 3+ notifications */
                      <span 
                        className="absolute right-3 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white rounded-full min-w-[20px]"
                        style={{ backgroundColor: notification.dotColor }}
                      >
                        {notification.count > 9 ? '9+' : notification.count}
                      </span>
                    )}
                  </>
                )}
                
                {active && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#BC8BBC] animate-pulse"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Balance Section at bottom of sidebar */}
      <div className="mt-auto p-6 border-t border-gray-200">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Wallet Balance</span>
            <Wallet className="h-4 w-4 text-[#8A5A8A]" />
          </div>
          <div className="text-lg font-bold text-gray-900">RWF 100</div>
          <button
            onClick={() => navigate('/landlord/dashboard/payments')}
            className="mt-3 w-full text-sm text-[#8A5A8A] hover:text-[#BC8BBC] font-medium"
          >
            View Details →
          </button>
        </div>
        
        {/* Last updated time (for debugging, can remove in production) */}
        {notifications.lastUpdated && (
          <p className="mt-2 text-[10px] text-gray-400 text-center">
            Updated: {new Date(notifications.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    </aside>
  );
}