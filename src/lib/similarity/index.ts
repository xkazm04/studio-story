/**
 * Similarity library exports
 */

// SimilarityEngine
export {
  similarityEngine,
  SimilarityEngine,
  type ImageFingerprint,
  type SimilarityMatch,
  type DuplicateResult,
  type SimilaritySearchOptions,
  type RecommendationResult,
} from './SimilarityEngine';

// StyleGrouper
export {
  styleGrouper,
  StyleGrouper,
  type StyleGroup,
  type StyleCentroid,
  type StyleCharacteristics,
  type ClusteringOptions,
  type StyleAnalysis,
} from './StyleGrouper';

// Hooks
export {
  useDuplicateCheck,
  useVisualSearch,
  useSimilarAssets,
  useRecommendations,
  useFingerprint,
  useSimilarityStats,
  useStyleGroups,
  useStyleAnalysis,
  useSimilarStyle,
  useAssetStyleGroup,
} from './useSimilarity';
