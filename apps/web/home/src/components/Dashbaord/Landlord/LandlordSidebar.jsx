// src/pages/Dashboard/Landlord/components/LandlordSidebar.jsx
import React from 'react';
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
  Shield
} from 'lucide-react';

export default function LandlordSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems = [
    { label: 'Overview', icon: <Home size={20} />, path: '', exact: true },
    { label: 'My Properties', icon: <Home size={20} />, path: 'properties' },
    { label: 'Add Property', icon: <PlusCircle size={20} />, path: 'add-property' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: 'bookings' },
    { label: 'Tenants', icon: <Users size={20} />, path: 'tenants' },
    { label: 'Payments', icon: <DollarSign size={20} />, path: 'payments' },
    { label: 'Analytics', icon: <BarChart size={20} />, path: 'analytics' },
    { label: 'Messages', icon: <MessageSquare size={20} />, path: 'messages' },
    { label: 'Settings', icon: <Settings size={20} />, path: 'settings' },
  ];

  // Helper function to check if a route is active
  const isActive = (itemPath, exact = false) => {
    const currentPath = location.pathname;
    
    if (exact) {
      return currentPath === `/landlord/dashboard${itemPath ? `/${itemPath}` : ''}` ||
             currentPath === `/landlord${itemPath ? `/${itemPath}` : ''}`;
    }
    
    return currentPath.startsWith(`/landlord/dashboard/${itemPath}`) ||
           currentPath.startsWith(`/landlord/${itemPath}`);
  };

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 overflow-hidden flex flex-col">
      <div className="p-6 flex-shrink-0">
        <div className="flex items-center mb-8">
          <Shield className="h-6 w-6" style={{ color: '#BC8BBC' }} />
          <h2 className="ml-3 text-lg font-semibold text-gray-900">Landlord Tools</h2>
        </div>
        
        <nav className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {sidebarItems.map((item) => {
            const active = isActive(item.path, item.exact);
            
            return (
              <button
                key={item.label}
                onClick={() => navigate(`/landlord/dashboard/${item.path}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active 
                    ? 'bg-[#f4eaf4] text-[#8A5A8A] border-l-4 border-[#BC8BBC] pl-3' 
                    : 'text-gray-700 hover:bg-[#f9f3f9] hover:text-[#8A5A8A]'
                }`}
              >
                <div className={active ? 'text-[#BC8BBC]' : 'text-gray-500'}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
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
      </div>
    </aside>
  );
}

// You'll need to import Wallet icon in the original sidebar file
import { Wallet } from 'lucide-react';