// WatchPage/components/Security/SecurityAuditLog.jsx
import React from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  Shield, User, Smartphone, Globe, Lock,
  Calendar, History, Filter, Search
} from 'lucide-react';

const SecurityAuditLog = ({ validationLog }) => {
  if (!validationLog?.steps) return null;

  const getStepIcon = (step, result) => {
    if (!result) return <AlertCircle className="w-4 h-4 text-gray-500" />;
    
    if (result.valid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    switch (step) {
      case 'initial_scan':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'user_validation':
        return <User className="w-4 h-4 text-red-500" />;
      case 'device_geo_validation':
        return <Smartphone className="w-4 h-4 text-red-500" />;
      case 'geo_restricted':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'kid_content':
        return <Lock className="w-4 h-4 text-pink-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="mt-6 bg-gray-900/50 rounded-xl border border-gray-700/30 overflow-hidden">
      <div className="p-4 border-b border-gray-700/30 bg-gray-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h4 className="font-semibold text-gray-300">Security Audit Log</h4>
          </div>
          <div className="text-xs text-gray-500">
            {validationLog.steps.length} checks performed
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Detailed log of all security validation steps
        </p>
      </div>
      
      <div className="divide-y divide-gray-800/50 max-h-64 overflow-y-auto">
        {validationLog.steps.map((step, index) => (
          <div key={index} className="p-4 hover:bg-gray-800/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="pt-1">
                {getStepIcon(step.step, step.result)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white capitalize">
                      {step.step.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      step.result?.valid 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-red-900/30 text-red-400'
                    }`}>
                      {step.result?.valid ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  
                  {step.timestamp && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(step.timestamp)}
                    </div>
                  )}
                </div>
                
                {step.result?.message && (
                  <p className="text-sm text-gray-300 mb-2">
                    {step.result.message}
                  </p>
                )}
                
                {step.result?.details && Object.keys(step.result.details).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-800/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(step.result.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-gray-300 font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {step.result?.scanResults && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Scan Results:</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400">IP Reputation</div>
                        <div className="text-white font-medium">
                          {step.result.scanResults.ipReputation || 'Unknown'}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400">Behavior</div>
                        <div className="text-white font-medium capitalize">
                          {step.result.scanResults.userBehavior || 'Normal'}
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded p-2">
                        <div className="text-gray-400">Score</div>
                        <div className={`font-bold ${
                          step.result.scanResults.overallScore >= 80 ? 'text-green-400' :
                          step.result.scanResults.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {step.result.scanResults.overallScore || 0}/100
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-gray-700/30 bg-gray-900/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Passed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Failed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Info</span>
            </div>
          </div>
          <div>
            Validation ID: {validationLog.userId?.substring(0, 8) || 'Unknown'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditLog;