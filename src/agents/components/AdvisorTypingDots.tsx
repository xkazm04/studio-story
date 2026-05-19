'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import type { AdvisorVariant } from './AdvisorMessageBubble';

const dotVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] },
};

interface AdvisorTypingDotsProps {
  variant?: AdvisorVariant;
  /** Optional status text shown above the dots (overlay only) */
  status?: string | null;
}

export function AdvisorTypingDots({ variant = 'overlay', status }: AdvisorTypingDotsProps) {
  const dotSize = variant === 'overlay' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <motion.div
      className={cn('flex flex-col items-start gap-1', variant === 'overlay' && 'px-1')}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
    >
      {status && variant === 'overlay' && (
        <span className="text-xs text-slate-400 px-2">{status}</span>
      )}
      <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('rounded-full bg-slate-400', dotSize)}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
