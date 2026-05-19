'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TYPOGRAPHY, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';

export interface ToggleSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  title: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

export function ToggleSection({
  isOpen,
  onToggle,
  icon,
  title,
  badge,
  children,
  className = 'border-b border-slate-800',
  headerClassName = 'w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors',
}: ToggleSectionProps) {
  return (
    <div className={className}>
      <button onClick={onToggle} className={headerClassName}>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          {icon}
          {typeof title === 'string' ? (
            <span className={TYPOGRAPHY.h2}>{title}</span>
          ) : (
            title
          )}
        </div>
        {badge}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...FM_VARIANTS.collapse}
            transition={FM_TRANSITION.slow}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
