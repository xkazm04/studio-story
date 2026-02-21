/**
 * Image Generation Library
 *
 * Provides intelligent scene-to-image capabilities with automatic
 * prompt generation from story context.
 */

export { SceneParser, sceneParser } from './SceneParser';
export type {
  VisualElement,
  DetectedMood,
  DetectedSetting,
  CharacterPresence,
  ParsedSceneContext,
} from './SceneParser';

export { PromptGenerator, promptGenerator } from './PromptGenerator';
export type {
  GeneratedPrompt,
  MultiShotResult,
  ShotType,
  FocusArea,
  PromptGeneratorOptions,
} from './PromptGenerator';
