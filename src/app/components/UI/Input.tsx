'use client';

import { forwardRef, InputHTMLAttributes, useId, ReactNode } from 'react';
import { clsx } from 'clsx';
import { useFocusRing } from '@/app/utils/focusRing';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'mono';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: InputSize;
  variant?: InputVariant;
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-3.5 py-2.5 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error,
      label,
      helperText,
      fullWidth = true,
      className,
      prefix,
      suffix,
      id,
      ...props
    },
    ref
  ) => {
    const reactId = useId();
    const inputId = id || `input-${reactId}`;
    const hasError = !!error;
    const focusClasses = useFocusRing(hasError, "input");

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div
          className={clsx(
            'inline-flex items-center gap-1 rounded-lg border bg-slate-950/60',
            'transition-all outline-none text-white placeholder-gray-500',
            'focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/60',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError
              ? 'border-red-500/60 focus-within:border-red-500/60 focus-within:ring-red-500/60'
              : 'border-slate-700/70',
            fullWidth && 'w-full'
          )}
        >
          {prefix && (
            <span className="pl-2 text-xs text-slate-400 flex items-center gap-1">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'bg-transparent border-none outline-none flex-1 min-w-0',
              variant === 'mono' && 'font-mono',
              sizeClasses[size],
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="pr-2 text-xs text-slate-400 flex items-center gap-1">
              {suffix}
            </span>
          )}
        </div>
        {(error || helperText) && (
          <span
            className={clsx(
              'text-xs',
              hasError ? 'text-red-400' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
