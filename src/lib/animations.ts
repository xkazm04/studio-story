/**
 * Shared Animation Tokens & Framer Motion Variants
 *
 * Single source of truth for all animation timing and motion patterns.
 * Import from '@/lib/animations' instead of defining inline transitions.
 *
 * Transition presets:
 *   FAST   — 0.15s easeOut  — hover/focus micro-interactions
 *   NORMAL — 0.2s  easeInOut — panel reveals, list items
 *   SLOW   — 0.3s  easeInOut — page-level transitions
 *   SPRING — spring stiffness:300 damping:30 — drag/drop, layout shifts
 *
 * Variant presets:
 *   fadeInUp / fadeIn / scaleIn / collapse / slideInLeft / slideInRight
 *   staggerContainer / staggerItem — for lists and grids
 */

import type { Variants, Transition, TargetAndTransition } from 'framer-motion';

// ─── Easing Curves ───────────────────────────────────────────────────────────

export const EASE = {
  /** Material Design standard — most animations */
  default: [0.4, 0, 0.2, 1] as const,
  /** Ease-out for appearing elements */
  out: [0, 0, 0.2, 1] as const,
  /** Ease-in for disappearing elements */
  in: [0.4, 0, 1, 1] as const,
  /** Expo-out for workspace layout shifts */
  expo: [0.19, 1, 0.22, 1] as const,
};

// ─── Duration Constants ──────────────────────────────────────────────────────

export const DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

// ─── Transition Presets ──────────────────────────────────────────────────────

export const FAST: Transition = {
  duration: DURATION.fast,
  ease: EASE.out,
};

export const NORMAL: Transition = {
  duration: DURATION.normal,
  ease: EASE.default,
};

export const SLOW: Transition = {
  duration: DURATION.slow,
  ease: EASE.default,
};

export const SPRING: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// ─── Animation Variants ─────────────────────────────────────────────────────

/** Fade + slide up. Use for: cards, list items, toasts, content reveals. */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

/** Fade + slide down. Use for: dropdown menus, section headers. */
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Simple opacity fade. Use for: overlays, backdrops, subtle appearances. */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Scale + fade. Use for: modals, popovers, cards, dialogs. */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Height-based expand/collapse. Use for: accordions, collapsible panels. */
export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto' as const, opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

/** Slide from left. Use for: tab content, step wizards. */
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/** Slide from right. Use for: category switches, lateral content. */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ─── Stagger Presets ─────────────────────────────────────────────────────────

/** Parent container for staggered children. Pair with staggerItem. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

/** Child item for staggered animations. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// ─── Interactive States ──────────────────────────────────────────────────────

export const interactive = {
  hoverScale: { scale: 1.02, transition: FAST } as TargetAndTransition,
  tapScale: { scale: 0.98 } as TargetAndTransition,
  hoverScaleLarge: { scale: 1.05, transition: FAST } as TargetAndTransition,
  /** Card-like hover lift — scale + subtle upward shift */
  hoverLift: { scale: 1.02, y: -2, transition: FAST } as TargetAndTransition,
  /** Smaller hover for inline/compact elements */
  hoverSubtle: { scale: 1.01, transition: FAST } as TargetAndTransition,
  /** Press feedback for buttons — slightly smaller than tapScale */
  tapButton: { scale: 0.95 } as TargetAndTransition,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Stagger delay helper — clamps to first 10 items. */
export const staggerDelay = (index: number) => ({
  delay: Math.min(index, 10) * 0.05,
});
