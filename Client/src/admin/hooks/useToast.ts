import { useState, useCallback } from 'react';
import { Toast } from '../components/Toast';

interface UseToastReturn {
  toasts: Toast[];
  showToast: (
    type: Toast['type'],
    title: string,
    message?: string,
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = (): string => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const showToast = useCallback(
    (
      type: Toast['type'],
      title: string,
      message?: string,
      duration?: number
    ) => {
      const newToast: Toast = {
        id: generateId(),
        type,
        title,
        message,
        duration: duration || 5000,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
};