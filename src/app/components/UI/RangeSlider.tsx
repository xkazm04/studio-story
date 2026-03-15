'use client';

import { useCallback, useRef } from 'react';
import { cn } from '@/app/lib/utils';

export interface RangeSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** ARIA label for the slider (required for accessibility) */
  'aria-label': string;
  /** Optional unit suffix for the value display (e.g. 'px', '%') */
  unit?: string;
  /** Accent color for the filled track. Defaults to cyan. */
  accentColor?: 'cyan' | 'purple' | 'blue' | 'pink' | 'yellow' | 'orange' | 'green' | 'red';
  /** If true, display value as percentage (value * 100) for 0-1 ranges */
  showAsPercent?: boolean;
  /** Show the value display. Defaults to true. */
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

const ACCENT_FILL: Record<string, string> = {
  cyan: '#06b6d4',
  purple: '#a855f7',
  blue: '#3b82f6',
  pink: '#ec4899',
  yellow: '#eab308',
  orange: '#f97316',
  green: '#22c55e',
  red: '#ef4444',
};

const ACCENT_RING: Record<string, string> = {
  cyan: 'focus-visible:ring-cyan-500/30',
  purple: 'focus-visible:ring-purple-500/30',
  blue: 'focus-visible:ring-blue-500/30',
  pink: 'focus-visible:ring-pink-500/30',
  yellow: 'focus-visible:ring-yellow-500/30',
  orange: 'focus-visible:ring-orange-500/30',
  green: 'focus-visible:ring-green-500/30',
  red: 'focus-visible:ring-red-500/30',
};

/**
 * Accessible range slider with ARIA attributes, 44px touch target,
 * keyboard support (Arrow keys + Shift for 10x steps), and visual fill track.
 */
export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  'aria-label': ariaLabel,
  unit = '',
  accentColor = 'cyan',
  showAsPercent = false,
  showValue = true,
  disabled = false,
  className,
}: RangeSliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!e.shiftKey) return;
      const bigStep = step * 10;
      let next = value;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        next = Math.min(value + bigStep, max);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        next = Math.max(value - bigStep, min);
      } else {
        return;
      }

      e.preventDefault();
      // Round to step precision to avoid floating-point drift
      const precision = step < 1 ? String(step).split('.')[1]?.length || 0 : 0;
      onChange(parseFloat(next.toFixed(precision)));
    },
    [value, min, max, step, onChange]
  );

  const percentage = ((value - min) / (max - min)) * 100;
  const fill = ACCENT_FILL[accentColor] || ACCENT_FILL.cyan;
  const ring = ACCENT_RING[accentColor] || ACCENT_RING.cyan;

  const displayValue = showAsPercent
    ? `${Math.round(value * 100)}%`
    : `${max <= 1 && step < 1 ? Math.round(value * 100) : Math.round(value)}${unit}`;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1 flex items-center h-11">
        <input
          ref={inputRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={displayValue}
          className={cn(
            'w-full h-1.5 rounded-lg appearance-none cursor-pointer',
            // Thumb: 44px touch target (w-5 h-5 = 20px visible, padded to 44px via touch-action)
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-300',
            '[&::-webkit-slider-thumb]:hover:border-cyan-400 [&::-webkit-slider-thumb]:transition-colors',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            // Firefox thumb
            '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-slate-300 [&::-moz-range-thumb]:hover:border-cyan-400',
            '[&::-moz-range-thumb]:cursor-pointer',
            // Focus ring
            'focus-visible:outline-none focus-visible:ring-2',
            ring,
            'focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{
            background: `linear-gradient(to right, ${fill} 0%, ${fill} ${percentage}%, #475569 ${percentage}%, #475569 100%)`,
          }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-mono text-slate-300 w-10 text-right flex-shrink-0 select-none">
          {displayValue}
        </span>
      )}
    </div>
  );
}

export default RangeSlider;
