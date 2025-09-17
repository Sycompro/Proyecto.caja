import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, FileText, UserCheck } from 'lucide-react';
import { notificationService, ToastNotification } from '../services/notificationService';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToToasts((toast) => {
      setToasts(prev => [...prev, toast]);

      // Auto-remove toast after duration
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastIcon = (type: string) => {
    const iconMap = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
      request: FileText,
      approval: UserCheck
    };
    return iconMap[type as keyof typeof iconMap] || Info;
  };

  const getToastColors = (type: string) => {
    const colorMap = {
      success: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-900 dark:text-green-100',
        message: 'text-green-700 dark:text-green-200'
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-200 dark:border-red-700',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-900 dark:text-red-100',
        message: 'text-red-700 dark:text-red-200'
      },
      warning: {
        bg: 'bg-orange-50 dark:bg-orange-900/30',
        border: 'border-orange-200 dark:border-orange-700',
        icon: 'text-orange-600 dark:text-orange-400',
        title: 'text-orange-900 dark:text-orange-100',
        message: 'text-orange-700 dark:text-orange-200'
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-200 dark:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        title: 'text-blue-900 dark:text-blue-100',
        message: 'text-blue-700 dark:text-blue-200'
      },
      request: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        border: 'border-purple-200 dark:border-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        title: 'text-purple-900 dark:text-purple-100',
        message: 'text-purple-700 dark:text-purple-200'
      },
      approval: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-green-200 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        title: 'text-green-900 dark:text-green-100',
        message: 'text-green-700 dark:text-green-200'
      }
    };
    return colorMap[type as keyof typeof colorMap] || colorMap.info;
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = getToastIcon(toast.type);
        const colors = getToastColors(toast.type);
        
        return (
          <div
            key={toast.id}
            className={`${colors.bg} ${colors.border} border rounded-xl p-4 shadow-lg backdrop-blur-xl transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${colors.icon}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold ${colors.title}`}>
                  {toast.title}
                </h4>
                <p className={`text-sm mt-1 ${colors.message}`}>
                  {toast.message}
                </p>
              </div>
              
              <button
                onClick={() => removeToast(toast.id)}
                className={`flex-shrink-0 ${colors.icon} hover:opacity-70 transition-opacity`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className={`mt-3 h-1 ${colors.border} rounded-full overflow-hidden`}>
              <div 
                className={`h-full ${colors.icon.replace('text-', 'bg-')} transition-all ease-linear`}
                style={{
                  animation: `toast-progress ${toast.duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        );
      })}
      
      <style jsx>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
        
        .slide-in-from-right-full {
          animation: animate-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;