'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export type OverlayPosition = 'center' | 'bottom' | 'top-right';

export interface OverlayActionsProps {
  position?: OverlayPosition;
  children: ReactNode;
  visible?: boolean;
  className?: string;
  'data-testid'?: string;
}

const positionClasses: Record<OverlayPosition, string> = {
  center: 'absolute inset-0 flex items-center justify-center gap-2 bg-black/60 backdrop-blur-md',
  bottom: 'absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-3 bg-gradient-to-t from-black/70 to-transparent backdrop-blur-md',
  'top-right': 'absolute top-2 right-2 flex items-center gap-1 bg-transparent',
};

export function OverlayActions({
  position = 'center',
  children,
  visible,
  className,
  'data-testid': testId,
}: OverlayActionsProps) {
  return (
    <div
      className={cn(
        positionClasses[position],
        'transition-opacity duration-200 z-10',
        visible === undefined
          ? 'opacity-0 group-hover:opacity-100'
          : visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
