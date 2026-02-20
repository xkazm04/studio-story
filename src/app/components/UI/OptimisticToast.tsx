'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, Loader, Undo2, X } from 'lucide-react';
import { useToast, ToastData } from './OptimisticToastContext';

const UNDO_WINDOW_MS = 3000;

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [undoTimeLeft, setUndoTimeLeft] = useState(UNDO_WINDOW_MS);
  const [isUndoAvailable, setIsUndoAvailable] = useState(toast.canUndo ?? false);

  useEffect(() => {
    if (!isUndoAvailable) return;

    const interval = setInterval(() => {
      setUndoTimeLeft((prev) => {
        const newTime = prev - 100;
        if (newTime <= 0) {
          setIsUndoAvailable(false);
          clearInterval(interval);
          // Auto-dismiss after undo window closes
          setTimeout(() => onDismiss(toast.id), 200);
          return 0;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isUndoAvailable, toast.id, onDismiss]);

  const handleUndo = () => {
    if (toast.onUndo) {
      toast.onUndo();
      onDismiss(toast.id);
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'optimistic':
        return <Loader size={18} className="animate-spin text-blue-400" />;
      case 'success':
        return <Check size={18} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-400" />;
      case 'info':
        return <Info size={18} className="text-blue-400" />;
      default:
        return <Info size={18} className="text-gray-400" />;
    }
  };

  const getBackgroundClass = () => {
    switch (toast.type) {
      case 'optimistic':
        return 'bg-blue-900/40 border-blue-500/50';
      case 'success':
        return 'bg-green-900/40 border-green-500/50';
      case 'error':
        return 'bg-red-900/40 border-red-500/50';
      case 'info':
        return 'bg-gray-900/40 border-gray-500/50';
      default:
        return 'bg-gray-900/40 border-gray-500/50';
    }
  };

  const undoPercentage = (undoTimeLeft / UNDO_WINDOW_MS) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative min-w-[320px] max-w-md p-4 rounded-lg border backdrop-blur-sm ${getBackgroundClass()} shadow-lg`}
    >
      {/* Undo progress bar */}
      {isUndoAvailable && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-lg"
          initial={{ width: '100%' }}
          animate={{ width: `${undoPercentage}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">{toast.message}</p>
          {isUndoAvailable && (
            <p className="text-xs text-gray-400 mt-1">
              Undo available for {Math.ceil(undoTimeLeft / 1000)}s
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isUndoAvailable && toast.onUndo && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              title="Undo"
            >
              <Undo2 size={14} />
            </motion.button>
          )}

          {!isUndoAvailable && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const OptimisticToast: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={hideToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OptimisticToast;
