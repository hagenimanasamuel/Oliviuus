import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const Alert = ({ 
  type = "info", 
  message, 
  onClose, 
  duration = 5000,
  position = "top-right"
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const alertRef = useRef(null);
  
  const positionClasses = {
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
    "top-center": "top-6 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "bottom-center": "bottom-6 left-1/2 transform -translate-x-1/2"
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-gradient-to-r from-green-900/95 to-green-800/90 backdrop-blur-sm",
      borderColor: "border-green-700/50",
      textColor: "text-green-100",
      iconColor: "text-green-400",
      glowColor: "shadow-[0_0_20px_rgba(34,197,94,0.15)]"
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-gradient-to-r from-red-900/95 to-red-800/90 backdrop-blur-sm",
      borderColor: "border-red-700/50",
      textColor: "text-red-100",
      iconColor: "text-red-400",
      glowColor: "shadow-[0_0_20px_rgba(239,68,68,0.15)]"
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-gradient-to-r from-yellow-900/95 to-amber-800/90 backdrop-blur-sm",
      borderColor: "border-yellow-700/50",
      textColor: "text-yellow-100",
      iconColor: "text-yellow-400",
      glowColor: "shadow-[0_0_20px_rgba(234,179,8,0.15)]"
    },
    info: {
      icon: Info,
      bgColor: "bg-gradient-to-r from-blue-900/95 to-blue-800/90 backdrop-blur-sm",
      borderColor: "border-blue-700/50",
      textColor: "text-blue-100",
      iconColor: "text-blue-400",
      glowColor: "shadow-[0_0_20px_rgba(59,130,246,0.15)]"
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  useEffect(() => {
    // Prevent body scroll when alert is visible
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      ref={alertRef}
      className={`
        fixed ${positionClasses[position]} z-[9999]
        min-w-[320px] max-w-[420px]
        border ${config.borderColor} ${config.bgColor} ${config.glowColor}
        rounded-xl p-5
        transform transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]
        ${isExiting 
          ? 'opacity-0 scale-95 translate-y-[-10px]' 
          : 'opacity-100 scale-100'
        }
        select-none
      `}
      style={{
        pointerEvents: 'auto',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${config.bgColor} bg-opacity-30`}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium leading-snug ${config.textColor}`}>
            {message}
          </p>
          
          {duration > 0 && (
            <div className="mt-3 flex items-center">
              <div className="flex-1 h-[2px] bg-gray-700/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${config.borderColor.replace('border-', 'bg-')} rounded-full`}
                  style={{
                    animation: `shrink ${duration}ms linear forwards`,
                    animationPlayState: isExiting ? 'paused' : 'running'
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleClose}
          className={`
            ml-2 p-1.5 rounded-lg transition-all duration-200
            hover:bg-white/10 active:scale-95
            ${config.textColor} hover:text-white
            focus:outline-none focus:ring-2 focus:ring-white/20
          `}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .alert-enter {
          animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
      `}</style>
      
      <style jsx global>{`
        /* Prevent scrolling when alert is open */
        body.alert-open {
          overflow: hidden !important;
          position: fixed;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Alert;

// Optional: Alert Manager for handling multiple alerts
export const AlertManager = {
  alerts: [],
  listeners: [],
  
  show({ type, message, duration = 5000, position = 'top-right' }) {
    const id = Date.now().toString();
    const alert = { id, type, message, duration, position };
    
    this.alerts.push(alert);
    this.notifyListeners();
    
    return id;
  },
  
  close(id) {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.notifyListeners();
  },
  
  closeAll() {
    this.alerts = [];
    this.notifyListeners();
  },
  
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  notifyListeners() {
    this.listeners.forEach(listener => listener([...this.alerts]));
  }
};