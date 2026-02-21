import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';

/**
 * Configuration for optimistic mutations
 */
export interface UseOptimisticMutationOptions<TData, TVariables, TError = Error> {
  /**
   * The mutation function to execute
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Query keys that should be invalidated after successful mutation
   * Example: [['factions', projectId], ['characters', projectId]]
   */
  affectedQueryKeys: (string | number | undefined)[][];

  /**
   * Optional success callback
   */
  onSuccess?: (data: TData, variables: TVariables) => void;

  /**
   * Optional error callback
   */
  onError?: (error: TError, variables: TVariables) => void;

  /**
   * Optional settled callback (runs on success or error)
   */
  onSettled?: () => void;

  /**
   * Whether to show optimistic updates immediately
   * @default true
   */
  enableOptimisticUpdate?: boolean;

  /**
   * Whether to show toast notifications
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom toast message for optimistic update
   */
  toastMessage?: string;

  /**
   * Whether to enable undo functionality (requires showToast)
   * @default true
   */
  enableUndo?: boolean;
}

/**
 * Return type for useOptimisticMutation hook
 */
export interface UseOptimisticMutationResult<TData, TVariables, TError = Error> {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: TError | null;
  rollbackError: string | null;
  undoAvailable: boolean;
  manualUndo: () => void;
}

/**
 * Custom hook that provides optimistic updates and automatic query invalidation
 * for mutations. Eliminates the need for manual refetch() calls.
 *
 * Features:
 * - Optimistic updates with automatic rollback on error
 * - Toast notifications with undo capability (3-second window)
 * - Automatic query invalidation
 * - Type-safe error handling
 *
 * @example
 * ```typescript
 * const { mutate, isLoading, rollbackError, undoAvailable } = useOptimisticMutation({
 *   mutationFn: (data) => factionApi.createFaction(data),
 *   affectedQueryKeys: [
 *     ['factions', projectId],
 *     ['characters', projectId]
 *   ],
 *   toastMessage: 'Creating faction...',
 *   enableUndo: true,
 *   onSuccess: () => console.log('Faction created!'),
 *   onError: (error) => console.error('Failed:', error)
 * });
 *
 * await mutate({ name: 'New Faction', project_id: '123' });
 * ```
 */
export function useOptimisticMutation<TData = unknown, TVariables = unknown, TError = Error>({
  mutationFn,
  affectedQueryKeys,
  onSuccess,
  onError,
  onSettled,
  enableOptimisticUpdate = true,
  showToast = true,
  toastMessage,
  enableUndo = true,
}: UseOptimisticMutationOptions<TData, TVariables, TError>): UseOptimisticMutationResult<TData, TVariables, TError> {
  const queryClient = useQueryClient();
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const toastIdRef = useRef<string | null>(null);
  const snapshotRef = useRef<any>(null);

  // We'll handle toast integration through a custom hook pattern
  // This allows the hook to work without requiring ToastProvider
  const showToastRef = useRef<((toast: any) => string) | null>(null);
  const hideToastRef = useRef<((id: string) => void) | null>(null);

  // Try to access toast context if available
  // Note: This is a soft dependency - hook works without toast provider
  try {
    // Dynamic import to avoid hard dependency
    const ToastContext = require('../components/UI/OptimisticToastContext');
    const { useToast } = ToastContext;
    const toastContext = useToast();
    showToastRef.current = toastContext?.showToast;
    hideToastRef.current = toastContext?.hideToast;
  } catch {
    // Toast context not available - continue without toast
  }

  // Manual undo function for external use
  const manualUndo = useCallback(() => {
    if (snapshotRef.current) {
      try {
        snapshotRef.current.forEach(({ queryKey, data }: any) => {
          queryClient.setQueryData(queryKey, data);
        });
        setUndoAvailable(false);
        setRollbackError(null);

        // Hide toast if present
        if (toastIdRef.current && hideToastRef.current) {
          hideToastRef.current(toastIdRef.current);
          toastIdRef.current = null;
        }

        // Show success toast
        if (showToast && showToastRef.current) {
          showToastRef.current({
            message: 'Changes reverted successfully',
            type: 'info',
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('Failed to undo changes:', error);
        setRollbackError('Failed to undo changes. Please refresh the page.');
      }
    }
  }, [queryClient, showToast]);

  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn,

    onMutate: async (variables) => {
      // Clear any previous rollback errors and state
      setRollbackError(null);
      setUndoAvailable(false);

      if (enableOptimisticUpdate) {
        // Cancel any outgoing refetches for affected queries
        // to prevent them from overwriting our optimistic update
        await Promise.all(
          affectedQueryKeys.map(queryKey =>
            queryClient.cancelQueries({ queryKey })
          )
        );

        // Snapshot the previous values for rollback
        const previousData = affectedQueryKeys.map(queryKey => ({
          queryKey,
          data: queryClient.getQueryData(queryKey),
        }));

        // Store snapshot in ref for undo functionality
        snapshotRef.current = previousData;

        // Show optimistic toast with undo capability
        if (showToast && enableUndo && showToastRef.current) {
          const message = toastMessage || 'Processing your request...';
          const toastId = showToastRef.current({
            message,
            type: 'optimistic',
            canUndo: true,
            onUndo: manualUndo,
          });
          toastIdRef.current = toastId;
          setUndoAvailable(true);

          // Auto-commit after undo window (3 seconds)
          setTimeout(() => {
            setUndoAvailable(false);
            snapshotRef.current = null;
          }, 3000);
        }

        // Return context with snapshot for rollback
        return { previousData };
      }
    },

    onSuccess: (data, variables, context) => {
      // Clear undo state on success
      setUndoAvailable(false);
      snapshotRef.current = null;

      // Hide optimistic toast and show success toast
      if (toastIdRef.current && hideToastRef.current) {
        hideToastRef.current(toastIdRef.current);
        toastIdRef.current = null;
      }

      if (showToast && showToastRef.current) {
        showToastRef.current({
          message: 'Changes saved successfully',
          type: 'success',
          duration: 2000,
        });
      }

      // Invalidate and refetch affected queries
      affectedQueryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Call user's success callback
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },

    onError: (error, variables, context: any) => {
      // Clear undo state on error
      setUndoAvailable(false);
      snapshotRef.current = null;

      // Hide optimistic toast and show error toast
      if (toastIdRef.current && hideToastRef.current) {
        hideToastRef.current(toastIdRef.current);
        toastIdRef.current = null;
      }

      // Rollback optimistic updates if they were applied
      if (enableOptimisticUpdate && context?.previousData) {
        try {
          context.previousData.forEach(({ queryKey, data }: any) => {
            queryClient.setQueryData(queryKey, data);
          });
          setRollbackError('Changes have been rolled back due to an error.');

          if (showToast && showToastRef.current) {
            showToastRef.current({
              message: 'Operation failed. Changes rolled back.',
              type: 'error',
              duration: 3000,
            });
          }
        } catch (rollbackErr) {
          console.error('Failed to rollback optimistic update:', rollbackErr);
          setRollbackError('Failed to rollback changes. Please refresh the page.');

          if (showToast && showToastRef.current) {
            showToastRef.current({
              message: 'Critical error. Please refresh the page.',
              type: 'error',
              duration: 5000,
            });
          }
        }
      } else if (showToast && showToastRef.current) {
        // No rollback needed, just show error
        showToastRef.current({
          message: error instanceof Error ? error.message : 'Operation failed',
          type: 'error',
          duration: 3000,
        });
      }

      // Call user's error callback
      if (onError) {
        onError(error, variables);
      }
    },

    onSettled: () => {
      // Call user's settled callback
      if (onSettled) {
        onSettled();
      }
    },
  });

  return {
    mutate: async (variables: TVariables) => {
      await mutation.mutateAsync(variables);
    },
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    rollbackError,
    undoAvailable,
    manualUndo,
  };
}
