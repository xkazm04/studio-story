/**
 * Shared workspace theme tokens for accent colors, spacing, and motion.
 *
 * Single source of truth consumed by all 7 panel primitives and their adapters.
 * Change a value here and every panel updates simultaneously.
 */

// ---------------------------------------------------------------------------
// Accent colors
// ---------------------------------------------------------------------------

export type AccentColor = 'cyan' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'violet';

export interface AccentStyle {
  /** Flat tinted background for list-item highlighting */
  bg: string;
  /** Border color at reduced opacity */
  border: string;
  /** Solid dot / badge color */
  dot: string;
  /** Left-border accent for list items */
  leftBorder: string;
  /** Box-shadow ring for combined selection states */
  ring: string;
  /** Gradient header background */
  headerBg: string;
  /** Icon tint inside headers */
  headerIcon: string;
  /** Corner glow pseudo-element */
  headerGlow: string;
}

/**
 * Canonical accent palette.
 * PanelFrame headers, DataList highlights, and any adapter badge
 * should all derive from this single map.
 */
export const WORKSPACE_ACCENTS: Record<AccentColor, AccentStyle> = {
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-400',
    leftBorder: 'border-l-cyan-500/40',
    ring: 'shadow-[0_0_0_2px_rgba(6,182,212,0.25)]',
    headerBg: 'bg-gradient-to-r from-cyan-500/[0.08] to-transparent',
    headerIcon: 'text-cyan-400/80',
    headerGlow: 'before:bg-cyan-500',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-400',
    leftBorder: 'border-l-indigo-500/40',
    ring: 'shadow-[0_0_0_2px_rgba(99,102,241,0.25)]',
    headerBg: 'bg-gradient-to-r from-indigo-500/[0.08] to-transparent',
    headerIcon: 'text-indigo-400/80',
    headerGlow: 'before:bg-indigo-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    leftBorder: 'border-l-amber-500/40',
    ring: 'shadow-[0_0_0_2px_rgba(245,158,11,0.25)]',
    headerBg: 'bg-gradient-to-r from-amber-500/[0.08] to-transparent',
    headerIcon: 'text-amber-400/80',
    headerGlow: 'before:bg-amber-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    leftBorder: 'border-l-emerald-500/40',
    ring: 'shadow-[0_0_0_2px_rgba(16,185,129,0.25)]',
    headerBg: 'bg-gradient-to-r from-emerald-500/[0.08] to-transparent',
    headerIcon: 'text-emerald-400/80',
    headerGlow: 'before:bg-emerald-500',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    leftBorder: 'border-l-rose-500/40',
    ring: 'shadow-[0_0_0_2px_rgba(244,63,94,0.25)]',
    headerBg: 'bg-gradient-to-r from-rose-500/[0.08] to-transparent',
    headerIcon: 'text-rose-400/80',
    headerGlow: 'before:bg-rose-500',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-400',
    leftBorder: 'border-l-violet-500/40',
    ring: 'shadow-[0_0_0_2px_rgba(139,92,246,0.25)]',
    headerBg: 'bg-gradient-to-r from-violet-500/[0.08] to-transparent',
    headerIcon: 'text-violet-400/80',
    headerGlow: 'before:bg-violet-500',
  },
};

/** Helper: look up an accent safely with fallback to cyan. */
export function getAccent(name?: string): AccentStyle {
  if (name && name in WORKSPACE_ACCENTS) return WORKSPACE_ACCENTS[name as AccentColor];
  return WORKSPACE_ACCENTS.cyan;
}

// ---------------------------------------------------------------------------
// Semantic color tokens
// ---------------------------------------------------------------------------

/**
 * Five semantic color sets with consistent opacity levels:
 *   bg      — 15% opacity background
 *   border  — 30% opacity border
 *   text    — 400-level text color
 *   hover   — 20% opacity hover background
 *   dot     — solid dot / badge color
 *
 * Use these instead of hardcoding color/opacity combos like
 * `bg-purple-600/20` or `bg-purple-600/10` ad hoc.
 */
export type SemanticColor = 'brand' | 'accent' | 'success' | 'warning' | 'danger';

export interface SemanticColorSet {
  /** 15% opacity background, e.g. selected states, badges */
  bg: string;
  /** 30% opacity border */
  border: string;
  /** 400-level foreground text */
  text: string;
  /** 20% opacity hover background */
  hover: string;
  /** Solid dot / indicator color */
  dot: string;
}

export const SEMANTIC_COLORS: Record<SemanticColor, SemanticColorSet> = {
  brand: {
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hover: 'hover:bg-purple-500/20',
    dot: 'bg-purple-500',
  },
  accent: {
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    hover: 'hover:bg-cyan-500/20',
    dot: 'bg-cyan-500',
  },
  success: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    hover: 'hover:bg-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    hover: 'hover:bg-amber-500/20',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-400',
    hover: 'hover:bg-red-500/20',
    dot: 'bg-red-500',
  },
};

/** Helper: build a combined bg+border+text class string for a semantic color. */
export function semanticBadge(color: SemanticColor): string {
  const s = SEMANTIC_COLORS[color];
  return `${s.bg} ${s.border} ${s.text}`;
}

/** Helper: build a bg+hover+text class string for interactive elements. */
export function semanticInteractive(color: SemanticColor): string {
  const s = SEMANTIC_COLORS[color];
  return `${s.bg} ${s.text} ${s.hover}`;
}

// ---------------------------------------------------------------------------
// Framer Motion variant presets
// ---------------------------------------------------------------------------

/**
 * Shared transition speeds. All use the same cubic-bezier(0.4, 0, 0.2, 1).
 *
 *   fast     — 0.15s — micro interactions, dropdowns, badge pops
 *   normal   — 0.2s  — tab switches, card enters, toggles
 *   slow     — 0.3s  — panel slides, page transitions, expand/collapse
 */
const EASE = [0.4, 0, 0.2, 1] as const;

export const FM_TRANSITION = {
  fast: { duration: 0.15, ease: EASE },
  normal: { duration: 0.2, ease: EASE },
  slow: { duration: 0.3, ease: EASE },
} as const;

/**
 * Four canonical Framer Motion variant sets. Each has initial/animate/exit.
 *
 *   fadeIn       — opacity only, for cards and list items
 *   slideInLeft  — enter from left (x:-10), exit right (x:10), for tab content
 *   slideInDown  — enter from above (y:-8), for dropdowns and menus
 *   scaleIn      — scale from 0.95, for modals and overlays
 *   collapse     — height:0 ↔ auto, for collapsible sections
 */
export const FM_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
  },
  slideInDown: {
    initial: { opacity: 0, y: -8, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.95 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95, y: -20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  },
  collapse: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto' as const, opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
} as const;

/** Stagger delay helper for card/list entrances. */
export const fmStagger = (index: number) => ({ delay: Math.min(index, 10) * 0.05 });

// ---------------------------------------------------------------------------
// Beat type badge colors (used by BeatsSidebarAdapter and friends)
// ---------------------------------------------------------------------------

export const BEAT_TYPE_COLORS: Record<string, string> = {
  setup: 'bg-blue-500/20 text-blue-400',
  conflict: 'bg-red-500/20 text-red-400',
  resolution: 'bg-green-500/20 text-green-400',
  climax: 'bg-amber-500/20 text-amber-400',
  transition: 'bg-slate-500/20 text-slate-400',
  reveal: 'bg-violet-500/20 text-violet-400',
  action: 'bg-orange-500/20 text-orange-400',
};

export const BEAT_TYPE_FALLBACK = 'bg-slate-500/20 text-slate-400';

// ---------------------------------------------------------------------------
// Spacing tokens
// ---------------------------------------------------------------------------

export const SPACING = {
  /** Panel body padding */
  panelPadding: 'p-2',
  /** Compact panel body padding */
  panelPaddingCompact: 'p-1.5',
  /** Gap between items in a list */
  itemGap: 'gap-1.5',
  /** Vertical spacing between sections */
  sectionGap: 'space-y-2',
  /** Smaller vertical spacing for tight lists */
  listGap: 'space-y-0.5',
  /** Inline spacing between icon and text */
  inlineGap: 'gap-1',
  /** Horizontal padding inside a list row */
  rowPx: 'px-2',
  /** Vertical padding inside a list row */
  rowPy: 'py-1',
  /** Grid gap for card grids */
  gridGap: 'gap-2',
  /** Grid gap compact */
  gridGapCompact: 'gap-1.5',
  /** Tree indent */
  treeIndent: 'ml-3',
} as const;

// ---------------------------------------------------------------------------
// Animation / motion tokens
// ---------------------------------------------------------------------------

export const MOTION = {
  /** Standard hover/focus transition */
  hoverDuration: 'duration-200',
  /** Stagger delay per item, clamped to first 10 */
  stagger: (index: number) => Math.min(index, 10) * 0.05,
  /** Expand/collapse (tree, accordion) */
  expandDuration: 0.25,
  expandEase: [0.4, 0, 0.2, 1] as readonly number[],
  /** List item entrance (small y-offset) */
  listEnter: { opacity: 0, y: 4 } as const,
  /** Card entrance (larger y-offset) */
  cardEnter: { opacity: 0, y: 8 } as const,
  /** Conversation line entrance */
  lineEnter: { opacity: 0, y: 6 } as const,
  /** Standard animate-to state */
  show: { opacity: 1, y: 0 } as const,
  /** Shimmer keyframe speed */
  shimmerSpeed: '1.5s',
  /** Image load fade-in */
  fadeInDuration: 'duration-300',
} as const;

// ---------------------------------------------------------------------------
// Beat animation presets (Framer Motion)
// ---------------------------------------------------------------------------

/**
 * Standardised Framer-Motion durations for the beats / story UI.
 *
 * Four tiers share one easing curve so every animation feels part of the
 * same family.  Use these instead of hard-coding `duration: 0.3` etc.
 *
 *   micro    — hover, focus, badge pop
 *   quick    — click feedback, toggles, small reveals
 *   standard — panel slides, card enters, expand/collapse
 *   slow     — progress bars, page-level transitions
 */
export const BEAT_ANIMATIONS = {
  /** Shared easing — matches MOTION.expandEase */
  ease: [0.4, 0, 0.2, 1] as readonly number[],

  /** 0.15 s — hover / focus / badge pop */
  micro: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as const,
  /** 0.2 s  — click feedback, toggles, small reveals */
  quick: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as const,
  /** 0.3 s  — panel slides, card enters, expand/collapse */
  standard: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as const,
  /** 0.5 s  — progress bars, page-level transitions */
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as const,

  /** Stagger delay per item (clamped to first 10) */
  stagger: (index: number) => Math.min(index, 10) * 0.05,
} as const;

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------

/**
 * Semantic typography tokens.
 *
 * 5-level scale that replaces the flat text-sm-everywhere pattern:
 *   h1  — panel titles / top-level headings
 *   h2  — section headers within a panel
 *   h3  — card titles, item titles, form group labels
 *   body — default content text
 *   caption — metadata, timestamps, helper text
 *
 * Each entry is a single class-string ready for `cn()`.
 */
export const TYPOGRAPHY = {
  /** Panel title — text-base font-semibold text-slate-100 */
  h1: 'text-base font-semibold text-slate-100',
  /** Section header — text-sm font-semibold text-slate-200 */
  h2: 'text-sm font-semibold text-slate-200',
  /** Card / item title — text-sm font-medium text-slate-200 */
  h3: 'text-sm font-medium text-slate-200',
  /** Body text — text-sm text-slate-300 */
  body: 'text-sm text-slate-300',
  /** Caption / metadata — text-xs text-slate-400 */
  caption: 'text-xs text-slate-400',
} as const;

// ---------------------------------------------------------------------------
// Interactive state classes
// ---------------------------------------------------------------------------

/**
 * Standardized interactive states for beats UI.
 *
 * Use these instead of inventing ad-hoc hover/focus/active combos.
 * Each preset is a single string you can spread into `cn()`.
 */
export const INTERACTIVE = {
  /** Base transition shared by all interactive presets */
  transition: 'transition-all duration-200',

  /** Row hover — table rows, list items, sidebar entries */
  row: 'transition-colors duration-200 hover:bg-slate-800/30',

  /** Card hover — beat cards, suggestion cards, selection panels */
  card: 'transition-all duration-200 hover:bg-slate-800/30 hover:border-slate-700/60 active:scale-[0.98]',

  /** Clickable control — small buttons, icon buttons, filter chips */
  control: 'transition-colors duration-200 hover:bg-slate-700/50 hover:text-slate-200',

  /** Focus-visible ring — add to any focusable element */
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50',

  /** Accent hover for primary actions (cyan tint) */
  accentHover: 'hover:bg-cyan-500/15 hover:border-cyan-500/30',

  /** Danger hover for destructive actions */
  dangerHover: 'hover:bg-red-500/15 hover:text-red-400',

  /** Ghost button — text-only hover, no background change */
  ghost: 'transition-colors duration-200 hover:text-slate-200',

  /** Drag-active state for draggable rows */
  dragActive: 'bg-slate-800 shadow-lg shadow-cyan-500/20 rounded-lg border border-cyan-500/50 scale-[1.02]',
} as const;
