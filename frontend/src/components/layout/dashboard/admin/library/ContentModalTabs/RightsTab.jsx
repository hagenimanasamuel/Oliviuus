import React, { useState } from "react";
import { 
  Globe, 
  Download, 
  Share2, 
  Clock, 
  Calendar,
  MapPin,
  Lock,
  Unlock,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import clsx from "clsx";

const RightsTab = ({ content }) => {
  const [editingField, setEditingField] = useState(null);

  // Default rights data structure
  const rightsData = content.rights || {
    license_type: 'limited',
    allowed_regions: ['US', 'CA', 'GB', 'AU'],
    start_date: content.created_at,
    end_date: null,
    exclusive: false,
    downloadable: true,
    shareable: true
  };

  const licenseTypes = [
    { value: 'perpetual', label: 'Perpetual', description: 'Permanent license with no expiration' },
    { value: 'limited', label: 'Limited Time', description: 'License valid for a specific period' },
    { value: 'subscription', label: 'Subscription', description: 'License tied to subscription period' },
    { value: 'rental', label: 'Rental', description: 'Temporary access for a fixed period' }
  ];

  const regions = [
    { code: 'US', name: 'United States', enabled: true },
    { code: 'CA', name: 'Canada', enabled: true },
    { code: 'GB', name: 'United Kingdom', enabled: true },
    { code: 'AU', name: 'Australia', enabled: true },
    { code: 'DE', name: 'Germany', enabled: false },
    { code: 'FR', name: 'France', enabled: false },
    { code: 'JP', name: 'Japan', enabled: false },
    { code: 'BR', name: 'Brazil', enabled: false }
  ];

  const getLicenseConfig = (type) => {
    switch (type) {
      case 'perpetual':
        return { color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle };
      case 'limited':
        return { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Clock };
      case 'subscription':
        return { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Calendar };
      case 'rental':
        return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Clock };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: AlertTriangle };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const LicenseBadge = ({ type }) => {
    const config = getLicenseConfig(type);
    const Icon = config.icon;
    const license = licenseTypes.find(l => l.value === type);
    
    return (
      <div className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
        config.bg,
        config.color
      )}>
        <Icon className="w-4 h-4" />
        {license?.label || type}
      </div>
    );
  };

  const PermissionToggle = ({ icon: Icon, label, enabled, description, onToggle }) => (
    <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={clsx(
          "p-2 rounded-lg",
          enabled ? "bg-green-400/10 text-green-400" : "bg-gray-600 text-gray-400"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-white font-medium">{label}</div>
          <div className="text-gray-400 text-sm">{description}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={clsx(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-green-500" : "bg-gray-600"
        )}
      >
        <span
          className={clsx(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* License Overview */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">License Information</h3>
          <button className="flex items-center gap-2 px-3 py-1 text-[#BC8BBC] hover:text-[#9b69b2] transition-colors">
            <Edit className="w-4 h-4" />
            Edit License
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">License Type</div>
            <LicenseBadge type={rightsData.license_type} />
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Start Date</div>
            <div className="text-white font-medium">
              {formatDate(rightsData.start_date)}
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">End Date</div>
            <div className="text-white font-medium">
              {rightsData.end_date ? formatDate(rightsData.end_date) : 'No expiration'}
            </div>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Exclusivity</div>
            <div className={clsx(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm",
              rightsData.exclusive 
                ? "bg-red-400/10 text-red-400" 
                : "bg-green-400/10 text-green-400"
            )}>
              {rightsData.exclusive ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {rightsData.exclusive ? 'Exclusive' : 'Non-exclusive'}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400">
          {licenseTypes.find(l => l.value === rightsData.license_type)?.description}
        </div>
      </div>

      {/* Distribution Regions */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Distribution Regions</h3>
          <span className="text-gray-400 text-sm">
            {rightsData.allowed_regions?.length || 0} regions enabled
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {regions.map((region) => {
            const isEnabled = rightsData.allowed_regions?.includes(region.code);
            
            return (
              <div
                key={region.code}
                className={clsx(
                  "border rounded-lg p-3 transition-all cursor-pointer",
                  isEnabled
                    ? "border-[#BC8BBC] bg-[#BC8BBC]/10"
                    : "border-gray-700 bg-gray-700/30 opacity-50"
                )}
                onClick={() => {
                  // Toggle region logic would go here
                  console.log('Toggle region:', region.code);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <MapPin className={clsx(
                    "w-4 h-4",
                    isEnabled ? "text-[#BC8BBC]" : "text-gray-500"
                  )} />
                  {isEnabled ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className={clsx(
                  "font-medium text-sm",
                  isEnabled ? "text-white" : "text-gray-400"
                )}>
                  {region.name}
                </div>
                <div className={clsx(
                  "text-xs",
                  isEnabled ? "text-[#BC8BBC]" : "text-gray-500"
                )}>
                  {region.code}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Permissions */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Usage Permissions</h3>
        
        <div className="space-y-3">
          <PermissionToggle
            icon={Download}
            label="Downloadable"
            enabled={rightsData.downloadable}
            description="Allow users to download this content for offline viewing"
            onToggle={() => console.log('Toggle download')}
          />
          
          <PermissionToggle
            icon={Share2}
            label="Shareable"
            enabled={rightsData.shareable}
            description="Allow users to share this content with others"
            onToggle={() => console.log('Toggle share')}
          />
          
          <PermissionToggle
            icon={Globe}
            label="Public Access"
            enabled={content.visibility === 'public'}
            description="Make this content publicly accessible"
            onToggle={() => console.log('Toggle public access')}
          />
        </div>
      </div>

      {/* Rights Management */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">Rights Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-gray-400 text-sm mb-3">License Compliance</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Territory Compliance</span>
                <span className="text-green-400">Compliant</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Time Restrictions</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Usage Tracking</span>
                <span className="text-yellow-400">Limited</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-gray-400 text-sm mb-3">Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-[#BC8BBC] hover:bg-[#BC8BBC]/10 rounded transition-colors">
                Export Rights Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-[#BC8BBC] hover:bg-[#BC8BBC]/10 rounded transition-colors">
                View License Agreement
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded transition-colors">
                Terminate License
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-400 font-semibold mb-1">License Expiration Notice</h4>
            <p className="text-yellow-300 text-sm">
              This content's distribution license will expire in 45 days. 
              Consider renewing the license to avoid service interruption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightsTab;