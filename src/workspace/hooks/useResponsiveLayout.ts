/**
 * useResponsiveLayout — Viewport-aware layout enforcement.
 *
 * Monitors window width and automatically clamps the workspace layout
 * to only those permitted at the current breakpoint:
 *
 *   < 768px  → stack or single only
 *   < 1024px → single, split-2, primary-sidebar
 *   < 1280px → above + split-3
 *   ≥ 1280px → all layouts
 *
 * When the viewport shrinks and the current layout is no longer allowed,
 * the hook downgrades to the closest permitted layout.
 */

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { clampLayoutToViewport, getAllowedLayouts } from '../engine/layoutEngine';
import type { WorkspaceLayout } from '../types';

function getWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1920;
}

export function useResponsiveLayout() {
  const layout = useWorkspaceStore((s) => s.layout);
  const setLayout = useWorkspaceStore((s) => s.setLayout);
  const [viewportWidth, setViewportWidth] = useState(getWidth);

  // Track viewport width
  useEffect(() => {
    let rafId: number;
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setViewportWidth(getWidth());
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Enforce layout constraints when viewport changes
  useEffect(() => {
    const allowed = getAllowedLayouts(viewportWidth);
    if (!allowed.has(layout)) {
      setLayout(clampLayoutToViewport(layout, viewportWidth));
    }
  }, [viewportWidth, layout, setLayout]);

  return { viewportWidth, allowedLayouts: getAllowedLayouts(viewportWidth) };
}
