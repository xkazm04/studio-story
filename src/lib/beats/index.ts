/**
 * Beats Module
 * Beat type taxonomy, emotional markers, function tags, classification system,
 * dependency management, and centralized API constants
 */

export * from './TaxonomyLibrary';
export { default as TaxonomyLibrary } from './TaxonomyLibrary';

export * from './DependencyManager';
export { DependencyManager } from './DependencyManager';

export { BEAT_URLS } from './api';

export {
  BEAT_TYPE_VALUES,
  beatTypeSchema,
  beatGetParamsSchema,
  beatCreateSchema,
  beatUpdateSchema,
  DEPENDENCY_TYPE_VALUES,
  DEPENDENCY_STRENGTH_VALUES,
  dependencyTypeSchema,
  dependencyStrengthSchema,
  dependencyGetParamsSchema,
  dependencyCreateSchema,
  PACING_SUGGESTION_TYPE_VALUES,
  pacingSuggestionTypeSchema,
  pacingGetParamsSchema,
  pacingCreateSchema,
  MAPPING_STATUS_VALUES,
  mappingStatusSchema,
  beatSceneMappingCreateSchema,
  beatSceneMappingUpdateSchema,
} from './schemas';
