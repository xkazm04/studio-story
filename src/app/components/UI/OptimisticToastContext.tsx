'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ToastData {
  id: string;
  message: string;
  type: 'optimistic' | 'success' | 'error' | 'info';
  duration?: number;
  onUndo?: () => void;
  canUndo?: boolean;
}

interface ToastContextValue {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdCounter = useRef(0);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = `toast-${++toastIdCounter.current}-${Date.now()}`;
    const newToast: ToastData = {
      id,
      ...toast,
      duration: toast.duration ?? 3000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration (unless undo is available)
    if (!toast.canUndo && newToast.duration) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  );
};
