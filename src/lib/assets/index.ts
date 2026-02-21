/**
 * Asset Library - Usage tracking, collections, and sharing
 */

// Usage Tracker
export { UsageTracker } from './UsageTracker';
export type {
  UsageEntityType,
  UsageFieldType,
  AssetUsageLocation,
  AssetUsageSummary,
  OrphanAsset,
  UsageAnalytics,
} from './UsageTracker';

export {
  useAssetUsage,
  useTrackUsage,
  useOrphanDetection,
  useUsageAnalytics,
  useDeleteSafety,
  useReferenceCount,
  useUsageLocations,
  useBulkTracker,
} from './useUsageTracker';

// Smart Grouper & Collections
export { SmartGrouper } from './SmartGrouper';
export type {
  GroupingStrategy,
  SmartGroup,
  Collection,
  Folder,
  CollectionTemplate,
} from './SmartGrouper';

export {
  useSmartGroups,
  useCollections,
  useCollectionTemplates,
  useCreateFromTemplate,
  useFolders,
  useCollectionSharing,
  useSharedCollections,
  useCollectionCounts,
} from './useSmartGrouper';

// Sharing Engine
export { SharingEngine } from './SharingEngine';
export type {
  SharedAssetLink,
  ProjectAssetPermission,
  SharedCollection,
  SharingStats,
} from './SharingEngine';

export {
  useAssetSharing,
  useProjectSharedAssets,
  useAssetSharingInfo,
  useIsAssetShared,
  useCollectionSharing as useSharingCollectionSharing,
  useSharedCollectionInfo,
  useCollectionsSharedWithProject,
  useSharingStats,
  useLinkedProjects,
  useCollectionPermission,
} from './useSharingEngine';

// Asset Analyzer
export { assetAnalyzer, AssetAnalyzer } from './AssetAnalyzer';
export type {
  AnalysisOptions,
  TagSuggestion,
  ColorAnalysis,
  QualityAssessment,
  ContentAnalysis,
  DetectedObject,
  DetectedFace,
  DetectedText,
  GeneratedMetadata,
  FullAnalysisResult,
  StyleAnalysis,
} from './AssetAnalyzer';

// Content Extractor
export { contentExtractor, ContentExtractor } from './ContentExtractor';
export type {
  ExtractionOptions,
  ExtractedElement,
  BoundingBox,
  SceneClassification,
  ExtractionResult,
} from './ContentExtractor';

// Analysis Hooks
export {
  useAssetAnalysis,
  useContentExtraction,
  useTagSuggestions,
  useColorAnalysis,
  useQualityAssessment,
  useMetadataGeneration,
} from './useAssetAnalysis';
