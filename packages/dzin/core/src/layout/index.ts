// @dzin/core layout module public API

// Types
export type {
  LayoutTemplateId,
  SlotSpec,
  LayoutTemplate,
  PanelDirective,
  SlotAssignment,
  ResolvedLayout,
} from './types';

// Templates
export { LAYOUT_TEMPLATES, LAYOUT_ORDER, getTemplate } from './templates';

// Hungarian algorithm
export { hungarianSolve } from './hungarian';

// Scoring
export { scorePanelForSlot, scoreTemplateForDirectives } from './scoring';

// Assignment
export { assignPanelsToSlots } from './assignment';
