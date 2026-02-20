'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: (id: string) => void;
}

const Toast = ({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'border-l-4';
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500 bg-green-950/50`;
      case 'error':
        return `${baseStyles} border-red-500 bg-red-950/50`;
      case 'warning':
        return `${baseStyles} border-yellow-500 bg-yellow-950/50`;
      case 'info':
      default:
        return `${baseStyles} border-blue-500 bg-blue-950/50`;
    }
  };

  return (
    <div
      data-testid={`toast-${type}`}
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm
        ${getStyles()}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        min-w-[300px] max-w-[500px]
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 text-sm text-gray-200">
        {message}
      </div>
      <button
        onClick={handleClose}
        data-testid="toast-close-btn"
        className="flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
