'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { IconButton } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  // ARIA attributes
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export function Modal({
  isOpen,
  onClose,
  size = 'md',
  title,
  subtitle,
  icon,
  children,
  footer,
  closeOnBackdropClick = true,
  showCloseButton = true,
  className,
  ariaLabel,
  ariaDescribedBy,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap: Get all focusable elements
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(selector))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus the modal after it's rendered
      setTimeout(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      // Return focus to the element that triggered the modal
      previousActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, getFocusableElements]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap: Handle Tab key navigation
  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: Move backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Move forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [isOpen, getFocusableElements]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          data-testid="modal-overlay"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdropClick ? onClose : undefined}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            data-testid="modal-backdrop"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-label={ariaLabel || title || 'Modal dialog'}
            aria-describedby={ariaDescribedBy}
            tabIndex={-1}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260, mass: 0.8 }}
            className={clsx(
              'relative w-full max-h-[90vh] bg-slate-950/90',
              'border border-slate-800/80 rounded-xl shadow-xl shadow-black/40',
              'flex flex-col',
              sizeClasses[size],
              className
            )}
            data-testid="modal-container"
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70 flex-shrink-0"
                data-testid="modal-header"
              >
                <div className="flex items-center gap-2.5">
                  {icon && (
                    <div
                      className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/30"
                      aria-hidden="true"
                    >
                      <span className="w-4 h-4 text-cyan-400 flex items-center justify-center">
                        {icon}
                      </span>
                    </div>
                  )}
                  {title && (
                    <div>
                      <h2
                        id="modal-title"
                          className="text-sm font-semibold text-slate-50"
                        data-testid="modal-title"
                      >
                        {title}
                      </h2>
                      {subtitle && (
                        <p
                          className="text-xs text-slate-400 mt-0.5"
                          data-testid="modal-subtitle"
                        >
                          {subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {showCloseButton && (
                  <IconButton
                    icon={<X />}
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    aria-label="Close modal"
                    data-testid="modal-close-btn"
                  />
                )}
              </div>
            )}

            {/* Scrollable Content */}
            <div
              className="flex-1 overflow-y-auto p-4 text-sm text-slate-200"
              data-testid="modal-content"
            >
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="flex items-center justify-between px-4 py-3 border-t border-slate-800/70 bg-slate-900/60 flex-shrink-0"
                data-testid="modal-footer"
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
