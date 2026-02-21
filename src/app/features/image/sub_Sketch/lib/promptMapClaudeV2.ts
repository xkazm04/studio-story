/**
 * Claude Prompt Map V2 - Enhanced with Visual Metadata
 * Experimental UI/UX with richer data for innovative interactions
 *
 * This file re-exports all modules for backwards compatibility.
 * For better maintainability, import directly from the specific modules:
 * - promptMapV2Types.ts - Type definitions
 * - promptMapV2Columns.ts - Column configurations
 * - promptMapV2Themes.ts - Theme options
 * - promptMapV2Scenes.ts - Scene options
 * - promptMapV2Characters.ts - Character options
 * - promptMapV2Presets.ts - Pre-configured presets
 * - promptMapV2Utils.ts - Utility functions
 */

// Re-export types
export type {
  ClaudePromptDimension,
  VisualMetadata,
  ClaudePromptOptionV2,
  PromptPreset,
  ClaudePromptColumnV2,
} from './promptMapV2Types';

// Re-export columns
export { CLAUDE_COLUMNS_V2 } from './promptMapV2Columns';

// Re-export options
export { THEME_OPTIONS_V2 } from './promptMapV2Themes';
export { SCENE_OPTIONS_V2 } from './promptMapV2Scenes';
export { CHARACTER_OPTIONS_V2 } from './promptMapV2Characters';

// Re-export presets
export { PROMPT_PRESETS } from './promptMapV2Presets';

// Re-export utilities
export {
  dimensionOptionsV2,
  composePromptV2,
  getOptionById,
  calculateVibes,
} from './promptMapV2Utils';
