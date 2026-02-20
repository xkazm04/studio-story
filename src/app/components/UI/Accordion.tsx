'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

export interface AccordionItemData {
  id: string;
  title: string;
  icon?: ReactNode;
  badge?: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  defaultOpen?: string[];
  multiple?: boolean;
  variant?: 'default' | 'bordered' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
  'data-testid'?: string;
}

const variantClasses = {
  default: 'border border-slate-800/60 rounded-lg bg-slate-900/40',
  bordered: 'border border-slate-700/50 rounded-lg bg-slate-900/60',
  ghost: 'border-l-2 border-cyan-500/30',
};

export function Accordion({
  items,
  defaultOpen = [],
  multiple = false,
  variant = 'default',
  size = 'md',
  className,
  'data-testid': testId,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-slate-800/50', className)} data-testid={testId}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        return (
          <div key={item.id} className={cn(variantClasses[variant], variant !== 'ghost' && 'mb-1')}>
            <button
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className={cn(
                'w-full flex items-center justify-between transition-colors text-left',
                size === 'sm' ? 'px-3 py-2' : 'px-4 py-3',
                'hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-2">
                {item.icon && (
                  <span className="[&>svg]:w-4 [&>svg]:h-4 text-slate-400 shrink-0">{item.icon}</span>
                )}
                <span className={cn('font-medium text-slate-200', size === 'sm' ? 'text-xs' : 'text-sm')}>
                  {item.title}
                </span>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500">
                    {item.badge}
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-500 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    'border-t border-slate-800/50',
                    size === 'sm' ? 'px-3 py-2' : 'px-4 py-3',
                  )}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
