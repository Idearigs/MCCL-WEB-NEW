import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-500',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          closeColor: 'text-green-400 hover:text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: XCircle,
          iconColor: 'text-red-500',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          closeColor: 'text-red-400 hover:text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: AlertCircle,
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          closeColor: 'text-yellow-400 hover:text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Info,
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          closeColor: 'text-blue-400 hover:text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: Info,
          iconColor: 'text-gray-500',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700',
          closeColor: 'text-gray-400 hover:text-gray-600'
        };
    }
  };

  const styles = getAlertStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        ${styles.bg} ${styles.border} border rounded-lg p-4 shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`h-5 w-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.titleColor} font-satoshi`}>
            {title}
          </p>
          {message && (
            <p className={`text-sm ${styles.messageColor} mt-1 font-satoshi`}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`${styles.closeColor} hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors duration-200`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Alert;