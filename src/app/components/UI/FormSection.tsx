'use client';

import { ReactNode } from 'react';
import { cn } from '@/app/lib/utils';

export interface FormSectionProps {
  label: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  label,
  description,
  required,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className={cn(
        'block font-mono text-[10px] uppercase tracking-wider text-slate-400',
        required && 'pl-2 border-l-2 border-cyan-500/30'
      )}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-[10px] text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
}
