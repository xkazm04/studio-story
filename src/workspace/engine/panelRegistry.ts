/**
 * Panel Registry — Re-exports from the unified panelDefinitions.
 *
 * All panel data is now defined once in panelDefinitions.ts.
 * This file exists for backward compatibility with existing imports.
 */

export {
  PANEL_REGISTRY,
  type WorkspacePanelType,
  type PanelRegistryEntry,
  getPanelEntry,
} from './panelDefinitions';
