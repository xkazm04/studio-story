/**
 * useAutoCompaction — Runs auto-density compaction on resize and panel/layout changes.
 *
 * When autoCompact is enabled in the workspace store, this hook monitors
 * viewport dimensions and triggers runAutoCompaction() whenever:
 *   - The window is resized (debounced to 200ms)
 *   - Panels or layout change
 *
 * This ensures panels whose density exceeds what the slot can physically
 * fit are automatically downgraded to a supported density level.
 */

import { useEffect, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';

export function useAutoCompaction() {
  const panels = useWorkspaceStore((s) => s.panels);
  const layout = useWorkspaceStore((s) => s.layout);
  const autoCompact = useWorkspaceStore((s) => s.autoCompact);
  const runAutoCompaction = useWorkspaceStore((s) => s.runAutoCompaction);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Run compaction when panels/layout change
  useEffect(() => {
    if (!autoCompact || typeof window === 'undefined') return;
    runAutoCompaction(window.innerWidth, window.innerHeight);
  }, [panels.length, layout, autoCompact, runAutoCompaction]);

  // Run compaction on window resize (debounced 200ms)
  useEffect(() => {
    if (!autoCompact || typeof window === 'undefined') return;

    const onResize = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        runAutoCompaction(window.innerWidth, window.innerHeight);
      }, 200);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timerRef.current);
    };
  }, [autoCompact, runAutoCompaction]);
}
