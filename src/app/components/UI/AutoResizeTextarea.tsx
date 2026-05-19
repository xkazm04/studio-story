'use client';

import {
  forwardRef,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/app/lib/utils';

interface AutoResizeTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'> {
  /** Maximum number of visible lines before scrolling (default: 3) */
  maxLines?: number;
}

/**
 * Chat-style textarea that auto-grows from 1 line up to `maxLines`,
 * with a smooth height transition. Collapses back on value clear.
 */
export const AutoResizeTextarea = forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ maxLines = 3, className, onChange, value, ...props }, ref) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current!);

  const adjustHeight = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    // Reset to single row to measure scrollHeight correctly
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Adjust on value change (covers controlled updates like clear-on-submit)
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    },
    [onChange, adjustHeight],
  );

  // line-height 1.25rem (text-sm leading-5) × maxLines = max-height
  const maxHeight = `${maxLines * 1.25}rem`;

  return (
    <textarea
      ref={innerRef}
      rows={1}
      value={value}
      onChange={handleChange}
      className={cn(
        'resize-none overflow-y-auto transition-[height] duration-150 ease-out',
        className,
      )}
      style={{ maxHeight }}
      {...props}
    />
  );
});

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
