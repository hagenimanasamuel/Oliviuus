import React from 'react';
import { NavLink } from 'react-router-dom';
import { KeyRound, Phone, Wallet } from 'lucide-react';

export default function SettingsNav() {
  const tabs = [
    { path: 'pin', label: 'PIN & Security', icon: KeyRound },
    { path: 'contact', label: 'Contact Info', icon: Phone },
    { path: 'wallet', label: 'Wallet & Refunds', icon: Wallet }, // Renamed to be more descriptive
  ];

  return (
    <nav className="flex overflow-x-auto border-b border-gray-200 bg-white px-2 md:px-4">
      {tabs.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={`/account/settings/${path}`}
          className={({ isActive }) => `
            flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
            ${isActive 
              ? 'border-[#BC8BBC] text-[#BC8BBC]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}