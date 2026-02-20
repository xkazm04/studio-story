'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { focusRing } from '@/app/utils/focusRing';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px] gap-1',
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2',
  lg: 'px-4.5 py-2.5 text-base gap-2.5',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  xs: '[&>svg]:w-3 [&>svg]:h-3',
  sm: '[&>svg]:w-3.5 [&>svg]:h-3.5',
  md: '[&>svg]:w-4 [&>svg]:h-4',
  lg: '[&>svg]:w-5 [&>svg]:h-5',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-cyan-500 to-blue-500
    hover:from-cyan-400 hover:to-blue-400
    text-white
    shadow-md shadow-cyan-500/25
    border border-cyan-400/20
    disabled:from-gray-700 disabled:to-gray-800 disabled:shadow-none disabled:border-gray-700/40
  `,
  secondary: `
    bg-slate-900/40
    hover:bg-slate-900/70
    text-slate-100
    border border-slate-700/80
    hover:border-cyan-500/40
    disabled:bg-slate-900/30 disabled:border-slate-700/60
  `,
  ghost: `
    bg-transparent
    hover:bg-slate-800/70
    text-slate-300
    hover:text-slate-50
    border border-transparent
    disabled:bg-transparent disabled:text-slate-600
  `,
  danger: `
    bg-red-500/10
    hover:bg-red-500/20
    text-red-400
    border border-red-500/30
    hover:border-red-500/50
    disabled:bg-red-500/5 disabled:border-red-500/20
  `,
  link: `
    bg-transparent
    hover:bg-transparent
    text-cyan-400
    hover:text-cyan-300
    underline-offset-4
    hover:underline
    border-0
    p-0
    disabled:text-cyan-600 disabled:no-underline
  `,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      size = 'md',
      variant = 'primary',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const showIcon = icon || loading;
    const iconElement = loading ? (
      <Loader2 className={clsx('shrink-0', size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5', 'animate-spin')} />
    ) : (
      icon && <span className={clsx('shrink-0 flex items-center justify-center', iconSizeClasses[size])}>{icon}</span>
    );

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: variant === 'link' ? 1 : 1.01 } : {}}
        whileTap={!isDisabled ? { scale: variant === 'link' ? 1 : 0.99 } : {}}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all outline-none whitespace-nowrap',
          'focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-0',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {showIcon && iconPosition === 'left' && iconElement}
        {children && <span>{children}</span>}
        {showIcon && iconPosition === 'right' && iconElement}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Icon-only variant for compact UIs
interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', variant = 'ghost', className, ...props }, ref) => {
    const iconOnlyClasses: Record<ButtonSize, string> = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-2.5',
    };

    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        className={clsx(iconOnlyClasses[size], 'aspect-square', className)}
        {...props}
      >
        <span className={clsx('shrink-0 flex items-center justify-center', iconSizeClasses[size])}>{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
