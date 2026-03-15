'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { PanelSizeVariant } from '../../types';

interface PanelSizeState {
  width: number;
  height: number;
  variant: PanelSizeVariant;
  isCompact: boolean;
  isNarrow: boolean;
}

const BREAKPOINTS: { max: number; variant: PanelSizeVariant }[] = [
  { max: 256, variant: 'xs' },
  { max: 384, variant: 'sm' },
  { max: 512, variant: 'md' },
  { max: 640, variant: 'lg' },
  { max: Infinity, variant: 'xl' },
];

function getVariant(width: number): PanelSizeVariant {
  for (const bp of BREAKPOINTS) {
    if (width < bp.max) return bp.variant;
  }
  return 'xl';
}

const DEFAULT_STATE: PanelSizeState = {
  width: 0,
  height: 0,
  variant: 'md',
  isCompact: false,
  isNarrow: false,
};

const PanelSizeContext = createContext<PanelSizeState>(DEFAULT_STATE);

export function usePanelSize(): PanelSizeState {
  return useContext(PanelSizeContext);
}

export function PanelSizeProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PanelSizeState>(DEFAULT_STATE);
  const prevVariantRef = useRef<PanelSizeVariant>('md');
  const rafRef = useRef<number>(0);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      const variant = getVariant(width);

      // Only update state if variant actually changed (or first measurement)
      if (variant !== prevVariantRef.current || state.width === 0) {
        prevVariantRef.current = variant;
        setState({
          width,
          height,
          variant,
          isCompact: variant === 'xs' || variant === 'sm',
          isNarrow: variant === 'xs',
        });
      }
    });
  }, [state.width]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(handleResize);
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleResize]);

  return (
    <PanelSizeContext.Provider value={state}>
      <div ref={containerRef} className="h-full min-h-0 @container">
        {children}
      </div>
    </PanelSizeContext.Provider>
  );
}
