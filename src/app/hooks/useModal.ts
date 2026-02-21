'use client';

import { useState, useCallback } from 'react';

/**
 * Hook for managing modal state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOpen, open, close, toggle } = useModal();
 *
 *   return (
 *     <>
 *       <button onClick={open}>Open Modal</button>
 *       <Modal isOpen={isOpen} onClose={close}>
 *         Content
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

/**
 * Hook for managing modal state with data
 * Useful for edit/detail modals where you need to track which item is being displayed
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { isOpen, data: selectedUser, openWith, close } = useModalWithData<User>();
 *
 *   return (
 *     <>
 *       {users.map(user => (
 *         <button key={user.id} onClick={() => openWith(user)}>
 *           Edit {user.name}
 *         </button>
 *       ))}
 *
 *       {selectedUser && (
 *         <Modal isOpen={isOpen} onClose={close}>
 *           <UserEditForm user={selectedUser} />
 *         </Modal>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useModalWithData<T = unknown>(initialData?: T) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(initialData);

  const openWith = useCallback((newData: T) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Optional: Clear data after animation completes
    // setTimeout(() => setData(undefined), 300);
  }, []);

  const updateData = useCallback((newData: T | ((prev: T | undefined) => T)) => {
    if (typeof newData === 'function') {
      setData(newData as (prev: T | undefined) => T);
    } else {
      setData(newData);
    }
  }, []);

  return {
    isOpen,
    data,
    openWith,
    close,
    updateData,
    setIsOpen,
  };
}

/**
 * Hook for managing multiple modal states
 * Useful when you have several different modals in a single component
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const modals = useModals(['settings', 'help', 'profile']);
 *
 *   return (
 *     <>
 *       <button onClick={() => modals.open('settings')}>Settings</button>
 *       <button onClick={() => modals.open('help')}>Help</button>
 *
 *       <Modal isOpen={modals.isOpen('settings')} onClose={() => modals.close('settings')}>
 *         <SettingsContent />
 *       </Modal>
 *
 *       <Modal isOpen={modals.isOpen('help')} onClose={() => modals.close('help')}>
 *         <HelpContent />
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */
export function useModals<T extends string>(modalIds: readonly T[]) {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());

  const open = useCallback((modalId: T) => {
    setOpenModals(prev => new Set(prev).add(modalId));
  }, []);

  const close = useCallback((modalId: T) => {
    setOpenModals(prev => {
      const next = new Set(prev);
      next.delete(modalId);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenModals(new Set());
  }, []);

  const toggle = useCallback((modalId: T) => {
    setOpenModals(prev => {
      const next = new Set(prev);
      if (next.has(modalId)) {
        next.delete(modalId);
      } else {
        next.add(modalId);
      }
      return next;
    });
  }, []);

  const isOpen = useCallback((modalId: T) => {
    return openModals.has(modalId);
  }, [openModals]);

  return {
    open,
    close,
    closeAll,
    toggle,
    isOpen,
    openModals,
  };
}

/**
 * Hook for managing a confirmation modal workflow
 * Simplifies the pattern of showing a confirmation dialog before an action
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { isOpen, confirm, cancel, ConfirmationModalProps } = useConfirmation({
 *     title: 'Delete User',
 *     message: 'Are you sure? This cannot be undone.',
 *     type: 'danger',
 *   });
 *
 *   const handleDelete = async (userId: string) => {
 *     const confirmed = await confirm();
 *     if (confirmed) {
 *       await deleteUser(userId);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={() => handleDelete('123')}>Delete</button>
 *       <ConfirmationModal {...ConfirmationModalProps} />
 *     </>
 *   );
 * }
 * ```
 */
export function useConfirmation(options?: {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((): Promise<boolean> => {
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolvePromise?.(true);
    setIsOpen(false);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    resolvePromise?.(false);
    setIsOpen(false);
    setResolvePromise(null);
  }, [resolvePromise]);

  return {
    isOpen,
    confirm,
    cancel: handleCancel,
    ConfirmationModalProps: {
      isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      title: options?.title || 'Confirm',
      message: options?.message || 'Are you sure?',
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type || 'warning',
    },
  };
}
