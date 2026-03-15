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
    <div className={cn('space-y-1.5', className)}>
      <label className={cn(
        'block font-mono text-xs uppercase tracking-wider text-slate-300',
        required && 'pl-2 border-l-2 border-cyan-500/30'
      )}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {description && (
        <p className="text-sm text-slate-400">{description}</p>
      )}
      {children}
    </div>
  );
}
