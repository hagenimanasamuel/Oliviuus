// src/components/Account/AccountHeader.jsx
import React from 'react';
import { Menu, Search, Bell, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountHeader({ 
  user, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed 
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
      <div className="flex items-center justify-between h-20 px-4 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex w-10 h-10 rounded-lg hover:bg-gray-100 items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page Indicator */}
          <span className="hidden lg:block text-sm text-gray-500">
            Account Center
          </span>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search your bookings, properties..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/20 transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Badge */}
          <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 flex items-center justify-center">
              {user?.profile_avatar_url ? (
                <img 
                  src={user.profile_avatar_url} 
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </header>
  );
}