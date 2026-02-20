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
  AlertCircle
} from 'lucide-react';
import api from '../../../api/axios';

export default function LandlordSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState({
    sidebar: {
      messages: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      bookingMessages: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      bookings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      activeBookings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      upcomingBookings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      payments: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      settings: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      withdrawalVerification: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      propertyVerifications: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      tenants: { count: 0, hasUnread: false, dotColor: '#BC8BBC' },
      system: { count: 0, hasUnread: false, dotColor: '#BC8BBC' }
    },
    summary: {
      totalUnread: 0,
      totalPending: 0
    },
    lastUpdated: null
  });

  const getNotificationCount = (type) => notifications?.sidebar?.[type]?.count ?? 0;
  const getHasUnread = (type) => notifications?.sidebar?.[type]?.hasUnread ?? false;
  const getItemHasUnread = (types) => types.some(type => notifications?.sidebar?.[type]?.hasUnread ?? false);

  const fetchNotificationCounts = async () => {
    try {
      const response = await api.get('/notifications/counts/all');
      if (response.data.success && response.data.data) {
        setNotifications(prev => ({
          sidebar: { ...prev.sidebar, ...(response.data.data.sidebar || {}) },
          summary: { ...prev.summary, ...(response.data.data.summary || {}) },
          lastUpdated: response.data.data.lastUpdated || new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    const interval = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const sidebarItems = [
    { label: 'Overview', icon: <Home size={20} />, path: '', exact: true },
    { 
      label: 'My Properties', icon: <Home size={20} />, path: 'properties',
      hasUnread: getHasUnread('propertyVerifications'),
      notificationCount: getNotificationCount('propertyVerifications')
    },
    { label: 'Add Property', icon: <PlusCircle size={20} />, path: 'add-property' },
    { 
      label: 'Bookings', icon: <Calendar size={20} />, path: 'bookings',
      hasUnread: getItemHasUnread(['bookings', 'activeBookings', 'upcomingBookings', 'bookingMessages']),
      notificationCount: getNotificationCount('bookings') + getNotificationCount('activeBookings') + 
                        getNotificationCount('upcomingBookings') + getNotificationCount('bookingMessages')
    },
    { 
      label: 'Tenants', icon: <Users size={20} />, path: 'tenants',
      hasUnread: getHasUnread('tenants'),
      notificationCount: getNotificationCount('tenants')
    },
    { 
      label: 'Payments', icon: <DollarSign size={20} />, path: 'payments',
      hasUnread: getHasUnread('payments'),
      notificationCount: getNotificationCount('payments')
    },
    { label: 'Analytics', icon: <BarChart size={20} />, path: 'analytics' },
    { 
      label: 'Messages', icon: <MessageSquare size={20} />, path: 'messages',
      hasUnread: getItemHasUnread(['messages', 'bookingMessages']),
      notificationCount: getNotificationCount('messages') + getNotificationCount('bookingMessages')
    },
    { 
      label: 'Settings', icon: <Settings size={20} />, path: 'settings',
      hasUnread: getItemHasUnread(['settings', 'withdrawalVerification']),
      notificationCount: getNotificationCount('settings') + getNotificationCount('withdrawalVerification')
    },
  ];

  if (getNotificationCount('system') > 0) {
    sidebarItems.push({
      label: 'System Alerts', icon: <AlertCircle size={20} />, path: 'alerts',
      hasUnread: getHasUnread('system'),
      notificationCount: getNotificationCount('system')
    });
  }

  const isActive = (itemPath, exact = false) => {
    const currentPath = location.pathname;
    if (exact) {
      return currentPath === `/landlord/dashboard${itemPath ? `/${itemPath}` : ''}` ||
             currentPath === `/landlord${itemPath ? `/${itemPath}` : ''}`;
    }
    return currentPath.startsWith(`/landlord/dashboard/${itemPath}`) ||
           currentPath.startsWith(`/landlord/${itemPath}`);
  };

  const handleNavClick = async (item) => {
    navigate(`/landlord/dashboard/${item.path}`);
    
    const typesToMark = [];
    if (item.label === 'Messages') typesToMark.push('messages', 'booking_messages');
    else if (item.label === 'Bookings') typesToMark.push('bookings', 'booking_messages');
    else if (item.label === 'Payments') typesToMark.push('payments');
    else if (item.label === 'Settings') typesToMark.push('settings', 'verifications', 'withdrawal_verification');
    else if (item.label === 'Tenants') typesToMark.push('tenants');
    else if (item.label === 'My Properties') typesToMark.push('property_verifications');
    else if (item.label === 'System Alerts') typesToMark.push('system');
    
    for (const type of typesToMark) {
      if (item.hasUnread) {
        try {
          await api.put(`/notifications/${type}/mark-all-read`).catch(() => {});
        } catch (error) {
          console.error(`Error marking ${type} as read:`, error);
        }
      }
    }
    
    setNotifications(prev => {
      const updated = { ...prev };
      typesToMark.forEach(type => {
        const sidebarKey = type === 'booking_messages' ? 'bookingMessages' :
                          type === 'verifications' ? 'settings' :
                          type === 'withdrawal_verification' ? 'withdrawalVerification' :
                          type === 'property_verifications' ? 'propertyVerifications' : type;
        if (updated.sidebar?.[sidebarKey]) {
          updated.sidebar[sidebarKey] = { ...updated.sidebar[sidebarKey], count: 0, hasUnread: false };
        }
      });
      return updated;
    });
  };

  return (
    <>
      <style>{`
        .ll-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          width: 16rem;
          flex-shrink: 0;
        }
        .ll-sidebar-header {
          flex-shrink: 0;
          padding: 1.5rem;
        }
        .ll-sidebar-nav {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding: 0 1rem;
        }
        .ll-sidebar-footer {
          flex-shrink: 0;
          padding: 0.75rem 1rem;
          border-top: 1px solid #f3f4f6;
          background: white;
        }
        .ll-sidebar-nav::-webkit-scrollbar { width: 4px; }
        .ll-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .ll-sidebar-nav::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .ll-sidebar-nav::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes ll-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .ll-pulse { animation: ll-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>

      <aside className="ll-sidebar">
        {/* Fixed Header */}
        <div className="ll-sidebar-header">
          <div className="flex items-center">
            <Shield className="h-6 w-6" style={{ color: '#BC8BBC' }} />
            <h2 className="ml-3 text-lg font-semibold text-gray-900">Landlord Tools</h2>
          </div>
        </div>

        {/* Scrollable Nav — flex:1 + min-height:0 is the key */}
        <nav className="ll-sidebar-nav">
          <div className="space-y-1 pb-2">
            {sidebarItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const showNotification = item.hasUnread && item.notificationCount > 0;
              
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors relative ${
                    active 
                      ? 'bg-[#f4eaf4] text-[#8A5A8A] border-l-4 border-[#BC8BBC] pl-3' 
                      : 'text-gray-700 hover:bg-[#f9f3f9] hover:text-[#8A5A8A]'
                  }`}
                >
                  <div className={`relative ${active ? 'text-[#BC8BBC]' : 'text-gray-500'}`}>
                    {item.icon}
                    {showNotification && item.notificationCount <= 2 && (
                      <span 
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ll-pulse border-2 border-white"
                        style={{ backgroundColor: '#BC8BBC' }}
                      />
                    )}
                  </div>
                  
                  <span className="ml-3 font-medium flex-1 text-left">{item.label}</span>
                  
                  {showNotification && item.notificationCount > 2 && (
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold"
                      style={{ backgroundColor: '#BC8BBC' }}
                    >
                      {item.notificationCount > 9 ? '9+' : item.notificationCount}
                    </span>
                  )}
                  
                  {active && (
                    <div className="ml-2 w-1.5 h-1.5 rounded-full bg-[#BC8BBC] ll-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Fixed Footer — always visible, never pushed off screen */}
        {notifications?.lastUpdated && (
          <div className="ll-sidebar-footer">
            <p className="text-[10px] text-gray-400 text-center">
              Updated: {new Date(notifications.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}