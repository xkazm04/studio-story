'use client';

import { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Modal, ModalSize } from './Modal';
import { Button } from './Button';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  size?: ModalSize;
  isLoading?: boolean;
}

const typeConfig: Record<
  ConfirmationType,
  {
    icon: ReactNode;
    confirmVariant: 'primary' | 'danger';
    iconColor: string;
  }
> = {
  danger: {
    icon: <XCircle className="w-5 h-5" />,
    confirmVariant: 'danger',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    confirmVariant: 'primary',
    iconColor: 'text-yellow-400',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    confirmVariant: 'primary',
    iconColor: 'text-blue-400',
  },
  success: {
    icon: <CheckCircle className="w-5 h-5" />,
    confirmVariant: 'primary',
    iconColor: 'text-green-400',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  size = 'sm',
  isLoading = false,
}: ConfirmationModalProps) {
  const config = typeConfig[type];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={title}
      icon={config.icon}
      closeOnBackdropClick={!isLoading}
      showCloseButton={!isLoading}
      ariaLabel={`${type} confirmation dialog`}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            data-testid="confirmation-cancel-btn"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            data-testid="confirmation-confirm-btn"
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        {typeof message === 'string' ? (
          <p className="text-sm text-gray-300" data-testid="confirmation-message">
            {message}
          </p>
        ) : (
          <div data-testid="confirmation-message">{message}</div>
        )}
      </div>
    </Modal>
  );
}
