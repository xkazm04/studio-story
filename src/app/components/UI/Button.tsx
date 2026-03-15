'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

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
      <Loader2 className="shrink-0 animate-spin" />
    ) : (
      icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>
    );

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        data-variant={variant}
        data-size={size}
        whileHover={!isDisabled ? { scale: variant === 'link' ? 1 : 1.01 } : {}}
        whileTap={!isDisabled ? { scale: variant === 'link' ? 1 : 0.99 } : {}}
        className={clsx(
          'ms-button',
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
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        className={className}
        data-icon-only=""
        {...props}
      >
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
