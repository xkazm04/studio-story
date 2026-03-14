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

// Registry
export { createRegistry, serializeRegistry } from './registry';
export type {
  PanelDefinition,
  PanelRegistry,
  SerializedPanel,
  SerializedRegistry,
} from './registry';
