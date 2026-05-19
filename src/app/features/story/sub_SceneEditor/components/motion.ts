import type { Variants } from 'framer-motion';

/**
 * Shared expand/collapse variants for scene editor panels.
 * Uses spring physics for height (physically responsive feel)
 * and timed easing for opacity (smooth fade).
 */
export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2, ease: 'easeIn' },
    },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.25, ease: 'easeOut' },
    },
  },
};
