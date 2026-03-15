'use client';

import { useCallback } from 'react';
import { cn } from '@/app/lib/utils';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  /** Optional label displayed to the left of the value */
  label?: string;
  /** Show +/- sign prefix on the displayed value (default: false) */
  showSign?: boolean;
  /** Color the displayed value: green for positive, red for negative (default: false) */
  colorValue?: boolean;
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = '',
  disabled = false,
  label,
  showSign = false,
  colorValue = false,
}: SliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  // Calculate fill percentage for styling
  const percentage = ((value - min) / (max - min)) * 100;

  const displayValue = showSign && value > 0 ? `+${value}` : value.toString();

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">{label}</span>
          <span className={cn(
            'text-sm font-mono',
            colorValue
              ? value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-400'
              : 'text-slate-400'
          )}>
            {displayValue}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`
          w-full h-1.5 rounded-full appearance-none cursor-pointer
          bg-slate-700
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-cyan-500
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-cyan-500
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:shadow-lg
          [&::-moz-range-thumb]:cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{
          background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${percentage}%, #334155 ${percentage}%, #334155 100%)`,
        }}
      />
    </div>
  );
}

export default Slider;
