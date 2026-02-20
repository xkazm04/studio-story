'use client';

import { forwardRef, TextareaHTMLAttributes, useId } from 'react';
import { clsx } from 'clsx';
import { useFocusRing } from '@/app/utils/focusRing';

export type TextareaSize = 'sm' | 'md' | 'lg';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxCharCount?: number;
}

const sizeClasses: Record<TextareaSize, string> = {
  sm: 'px-2 py-1.5 text-xs min-h-[60px]',
  md: 'px-3 py-2 text-sm min-h-[80px]',
  lg: 'px-4 py-2.5 text-base min-h-[120px]',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      error,
      label,
      helperText,
      fullWidth = true,
      showCharCount = false,
      maxCharCount,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const reactId = useId();
    const hasError = !!error;
    const focusClasses = useFocusRing(hasError, "input");
    const textareaId = id || `textarea-${reactId}`;
    const charCount = value ? String(value).length : 0;
    const showCount = showCharCount || maxCharCount;

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="text-sm font-medium text-gray-300"
            >
              {label}
              {props.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {showCount && (
              <span className="text-xs text-gray-500">
                {charCount}
                {maxCharCount && ` / ${maxCharCount}`}
              </span>
            )}
          </div>
        )}
        <div
          className={clsx(
            'rounded-lg border bg-slate-950/60',
            'transition-all outline-none text-white placeholder-gray-500',
            'focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/60',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasError
              ? 'border-red-500/60 focus-within:border-red-500/60 focus-within:ring-red-500/60'
              : 'border-slate-700/70',
            fullWidth && 'w-full'
          )}
        >
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            className={clsx(
              'bg-transparent border-none outline-none resize-y w-full',
              sizeClasses[size],
              className
            )}
            {...props}
          />
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

Textarea.displayName = 'Textarea';
