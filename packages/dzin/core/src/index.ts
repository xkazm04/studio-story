// @dzin/core public API

// Types
export type {
  PanelDensity,
  PanelRole,
  PanelSizeClass,
  PanelComplexity,
  DensityConfig,
  PanelPropSchema,
  PanelOutput,
  PanelDataSlice,
  PanelFrameProps,
} from './types';

// Density
export { DensityProvider, useDensity } from './density';
export type { DensityProviderProps } from './density';

// Panel
export { PanelFrame } from './panel';

// Theme
export { DZIN_TOKENS } from './theme';

// Registry
export { createRegistry, serializeRegistry } from './registry';
export type {
  PanelDefinition,
  PanelRegistry,
  SerializedPanel,
  SerializedRegistry,
} from './registry';

// Demo panels
export { DataListPanel, DetailPanel, MediaGridPanel } from './demo';
export { dataListDefinition, detailDefinition, mediaGridDefinition } from './demo';
export { MOCK_LIST_ITEMS, MOCK_DETAIL, MOCK_MEDIA_ITEMS } from './demo';
export type { DataListPanelProps, DetailPanelProps, MediaGridPanelProps } from './demo';
export type { ListItem, DetailEntity, DetailSection, MediaItem } from './demo';

// Layout engine
export {
  // Templates
  LAYOUT_TEMPLATES,
  LAYOUT_ORDER,
  getTemplate,
  // Hungarian
  hungarianSolve,
  // Scoring
  scorePanelForSlot,
  scoreTemplateForDirectives,
  // Assignment
  assignPanelsToSlots,
  // Spatial
  parseGridFractions,
  estimateSlotDimensions,
  computeSpatialBudget,
  // Density
  assignSlotDensity,
  // Viewport
  VIEWPORT_BREAKPOINTS,
  getAllowedLayouts,
  clampLayoutToViewport,
  // Resolver
  resolveLayout,
} from './layout';
export type {
  LayoutTemplateId,
  SlotSpec,
  LayoutTemplate,
  PanelDirective,
  SlotAssignment,
  ResolvedLayout,
  SlotDimensions,
  SpatialOption,
  SpatialBudget,
  ResolveLayoutOptions,
} from './layout';
