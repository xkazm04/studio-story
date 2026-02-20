/**
 * Centralized focus ring utilities for consistent keyboard navigation
 * Provides WCAG-compliant focus indicators across all interactive elements
 */

/**
 * Base focus ring classes for interactive elements
 * Uses cyan accent color with subtle opacity and respects reduced motion preferences
 */
export const focusRing = {
  /**
   * Default focus ring for buttons, links, and clickable elements
   * - 2px ring with cyan accent
   * - Ring offset for better visibility
   * - Reduced motion support
   */
  default: [
    'outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-cyan-500/60',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-slate-950',
    'motion-reduce:focus-visible:ring-offset-0',
  ].join(' '),

  /**
   * Focus ring for input containers (used by Input, Select, Textarea)
   * - 1px ring with border transition
   * - Uses focus-within for container elements
   */
  input: [
    'outline-none',
    'focus-within:border-cyan-500/60',
    'focus-within:ring-1',
    'focus-within:ring-cyan-500/60',
    'motion-reduce:focus-within:transition-none',
  ].join(' '),

  /**
   * Focus ring for input containers with error state
   */
  inputError: [
    'outline-none',
    'focus-within:border-red-500/60',
    'focus-within:ring-1',
    'focus-within:ring-red-500/60',
    'motion-reduce:focus-within:transition-none',
  ].join(' '),

  /**
   * Focus ring for card-like elements that are interactive
   * - Subtle ring without offset for card contexts
   */
  card: [
    'outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-cyan-500/50',
    'focus-visible:ring-offset-1',
    'focus-visible:ring-offset-slate-900',
    'motion-reduce:focus-visible:ring-offset-0',
  ].join(' '),

  /**
   * Focus ring for navigation items and tabs
   * - Slightly thicker ring for navigation context
   */
  nav: [
    'outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-cyan-400/70',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-slate-950',
    'motion-reduce:focus-visible:ring-offset-0',
  ].join(' '),

  /**
   * Minimal focus ring for compact UI elements
   * - Thinner ring, no offset
   */
  compact: [
    'outline-none',
    'focus-visible:ring-1',
    'focus-visible:ring-cyan-500/60',
    'motion-reduce:focus-visible:transition-none',
  ].join(' '),
} as const;

/**
 * Custom hook for managing focus ring classes with dynamic error states
 * @param hasError - Whether the element is in an error state
 * @param variant - The focus ring variant to use
 * @returns The appropriate focus ring classes
 */
export function useFocusRing(
  hasError?: boolean,
  variant: keyof typeof focusRing = 'default'
): string {
  if (variant === 'input' && hasError) {
    return focusRing.inputError;
  }
  return focusRing[variant];
}

/**
 * Utility to combine focus ring with custom classes
 * @param customClasses - Additional classes to append
 * @param variant - The focus ring variant to use
 * @returns Combined class string
 */
export function withFocusRing(
  customClasses: string = '',
  variant: keyof typeof focusRing = 'default'
): string {
  return `${focusRing[variant]} ${customClasses}`.trim();
}
