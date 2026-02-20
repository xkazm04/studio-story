'use client';

/**
 * CLI Recovery Hook
 *
 * Recovers CLI sessions after browser refresh or navigation.
 */

import { useEffect, useRef, useMemo } from 'react';
import { recoverCLISessions, cleanupAllCLISessions } from './cliExecutionManager';
import { useCLISessionStore } from './cliSessionStore';

/**
 * Hook to recover CLI sessions on mount
 * Should be called once at the top-level CLI component
 */
export function useCLIRecovery(): void {
  const hasRecovered = useRef(false);
  const startRecovery = useCLISessionStore((state) => state.startRecovery);
  const endRecovery = useCLISessionStore((state) => state.endRecovery);

  useEffect(() => {
    if (hasRecovered.current) return;
    hasRecovered.current = true;

    // Enter recovery phase (10 second window)
    startRecovery(10000);

    const timer = setTimeout(() => {
      recoverCLISessions();

      // End recovery phase after recovery completes + buffer
      setTimeout(() => {
        endRecovery();
      }, 5000);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [startRecovery, endRecovery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllCLISessions();
    };
  }, []);
}

/**
 * Hook to get recovery status
 */
export function useCLIRecoveryStatus(): {
  isRecovering: boolean;
  sessionsToRecover: number;
} {
  const sessions = useCLISessionStore((state) => state.sessions);
  const recoveryState = useCLISessionStore((state) => state.recoveryState);

  return useMemo(() => {
    if (!recoveryState.inProgress && Date.now() > recoveryState.endTime) {
      return { isRecovering: false, sessionsToRecover: 0 };
    }

    let count = 0;
    for (const s of Object.values(sessions)) {
      const hasRunningTask = s.queue.some((t) => t.status === 'running');
      const hasPendingTasks = s.queue.some((t) => t.status === 'pending');
      if (hasRunningTask || (hasPendingTasks && s.autoStart)) {
        count++;
      }
    }

    return {
      isRecovering: recoveryState.inProgress && count > 0,
      sessionsToRecover: count,
    };
  }, [sessions, recoveryState]);
}
