// src/pages/Dashboard/Landlord/pages/components/StatusBadge.jsx
import React from 'react';
import { CheckCircle, Clock, Users, X, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { 
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
      icon: CheckCircle, 
      label: 'Active'
    },
    draft: { 
      color: 'bg-amber-100 text-amber-800 border-amber-200', 
      icon: Clock, 
      label: 'Draft'
    },
    rented: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: Users, 
      label: 'Rented'
    },
    inactive: { 
      color: 'bg-slate-100 text-slate-800 border-slate-200', 
      icon: X, 
      label: 'Inactive'
    },
    under_maintenance: { 
      color: 'bg-rose-100 text-rose-800 border-rose-200', 
      icon: AlertCircle, 
      label: 'Maintenance'
    }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${config.color} transition-all hover:scale-105`}>
      <Icon size={14} className="mr-1.5" />
      {config.label}
    </span>
  );
};

export default StatusBadge;