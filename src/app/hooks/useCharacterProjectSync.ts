/**
 * useCharacterProjectSync Hook
 *
 * Ensures character state is properly synced with project changes.
 * Automatically clears character selection and filters when the selected project changes.
 *
 * Usage: Call this hook at the root of your app (e.g., in AppShell or a layout component)
 * to ensure character state is always in sync with the current project.
 */

import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useCharacterStore } from '@/app/store/slices/characterSlice';

export const useCharacterProjectSync = () => {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const clearCharacterState = useCharacterStore((state) => state.clearCharacterState);

  // Track previous project ID to detect changes
  const prevProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentProjectId = selectedProject?.id || null;

    // If project changed (and not initial mount), clear character state
    if (prevProjectIdRef.current !== null && prevProjectIdRef.current !== currentProjectId) {
      console.log('[useCharacterProjectSync] Project changed, clearing character state');
      clearCharacterState();
    }

    // Update previous project ID
    prevProjectIdRef.current = currentProjectId;
  }, [selectedProject?.id, clearCharacterState]);
};

export default useCharacterProjectSync;
