'use client';

import { ReactNode, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: string;
  position?: TooltipPosition;
  children: ReactNode;
  className?: string;
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowPositionStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 -mt-[1px] border-l border-b border-slate-700/50 bg-slate-900/90',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-r border-t border-slate-700/50 bg-slate-900/90',
  left: 'left-full top-1/2 -translate-y-1/2 -ml-[1px] border-t border-r border-slate-700/50 bg-slate-900/90',
  right: 'right-full top-1/2 -translate-y-1/2 -mr-[1px] border-b border-l border-slate-700/50 bg-slate-900/90',
};

export function Tooltip({
  content,
  position = 'top',
  children,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-md shadow-lg whitespace-nowrap pointer-events-none',
              positionStyles[position]
            )}
            role="tooltip"
          >
            {content}
            <div className={cn('absolute w-2 h-2 rotate-45', arrowPositionStyles[position])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
