import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          confirmText: 'text-white'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          confirmText: 'text-white'
        };
      case 'info':
        return {
          icon: ToggleRight,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          confirmText: 'text-white'
        };
      default:
        return {
          icon: AlertTriangle,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          confirmButton: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
          confirmText: 'text-white'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm" showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} mb-4`}>
          <Icon className={`h-6 w-6 ${styles.iconColor}`} />
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2 font-cormorant">
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-satoshi">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed font-satoshi"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium ${styles.confirmText} ${styles.confirmButton} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-satoshi flex items-center space-x-2`}
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;