/**
 * Hook for managing appearance propagation
 * Provides functionality to trigger and monitor appearance change propagation
 */

import { useState, useCallback } from 'react';
import { logger } from '@/app/utils/logger';

export interface PropagationStatus {
  changeLogId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  targetsProcessed?: number;
  successCount?: number;
  failureCount?: number;
  error?: string;
}

export interface PropagationTarget {
  id: string;
  target_type: string;
  target_id?: string;
  status: string;
  original_content?: string;
  updated_content?: string;
  applied: boolean;
}

export function useAppearancePropagation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [propagationStatus, setPropagationStatus] = useState<PropagationStatus | null>(null);
  const [targets, setTargets] = useState<PropagationTarget[]>([]);

  /**
   * Trigger propagation for a character's appearance change
   */
  const triggerPropagation = useCallback(async (changeLogId: string) => {
    setIsProcessing(true);
    setPropagationStatus(null);

    try {
      const response = await fetch('/api/appearance-propagation/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ change_log_id: changeLogId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to process propagation');
      }

      const data = await response.json();
      setPropagationStatus({
        changeLogId,
        status: 'completed',
        targetsProcessed: data.targetsProcessed,
        successCount: data.successCount,
        failureCount: data.failureCount,
      });

      return data;
    } catch (error) {
      logger.error('Error triggering propagation', error);
      setPropagationStatus({
        changeLogId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Get pending changes for a character
   */
  const getPendingChanges = useCallback(async (characterId: string) => {
    try {
      const response = await fetch(
        `/api/appearance-propagation?character_id=${characterId}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pending changes');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error fetching pending changes', error);
      throw error;
    }
  }, []);

  /**
   * Get propagation targets for a change log
   */
  const getPropagationTargets = useCallback(async (changeLogId: string) => {
    try {
      const response = await fetch(
        `/api/appearance-propagation?change_log_id=${changeLogId}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch propagation targets');
      }

      const data = await response.json();
      setTargets(data);
      return data;
    } catch (error) {
      logger.error('Error fetching propagation targets', error);
      throw error;
    }
  }, []);

  /**
   * Apply updates to story elements
   */
  const applyUpdates = useCallback(async (targetIds: string[]) => {
    try {
      const response = await fetch('/api/appearance-propagation/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_ids: targetIds }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to apply updates');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error applying updates', error);
      throw error;
    }
  }, []);

  /**
   * Apply a single update
   */
  const applySingleUpdate = useCallback(async (targetId: string) => {
    try {
      const response = await fetch('/api/appearance-propagation/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_id: targetId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to apply update');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Error applying single update', error);
      throw error;
    }
  }, []);

  return {
    isProcessing,
    propagationStatus,
    targets,
    triggerPropagation,
    getPendingChanges,
    getPropagationTargets,
    applyUpdates,
    applySingleUpdate,
  };
}
