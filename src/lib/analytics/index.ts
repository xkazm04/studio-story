/**
 * Analytics Module
 *
 * Comprehensive narrative analysis toolkit for story optimization.
 * Includes structure, pacing, character arc, thematic, and engagement analysis.
 */

// Core analyzers
export { structureAnalyzer, StructureAnalyzerClass, STRUCTURE_TEMPLATES } from './StructureAnalyzer';
export { pacingAnalyzer, PacingAnalyzerClass, PACING_TEMPLATES, BEAT_TYPE_TENSION } from './PacingAnalyzer';
export { characterArcAnalyzer, CharacterArcAnalyzerClass, ARC_PATTERNS } from './CharacterArcAnalyzer';
export { thematicAnalyzer, ThematicAnalyzerClass, THEME_LIBRARY } from './ThematicAnalyzer';
export { engagementSimulator, EngagementSimulatorClass, READER_PROFILES } from './EngagementSimulator';

// Flow simulator
export {
  flowSimulator,
  type SimulationConfig,
  type PlayerBehaviorModel,
  type FlowResult,
  type DropOffPoint,
  type CriticalPath,
  type Bottleneck,
  type CoverageReport,
  type UnreachableScene,
  type RarelyVisitedScene,
  type DecisionDistribution,
  type ChoiceDistribution,
  type HeatmapData,
  type NodeHeat,
  type EdgeHeat,
  type PathStatistics,
} from './FlowSimulator';

// Structure types
export type {
  StructureTemplate,
  ActTarget,
  StructureTemplateDefinition,
  ActAnalysis,
  StructureIssue,
  StructureAnalysisResult,
  BeatDistributionResult,
} from './StructureAnalyzer';

// Pacing types
export type {
  Genre,
  TensionPoint,
  TensionCurve,
  PacingTemplate,
  PacingIssue,
  PacingAnalysisResult,
} from './PacingAnalyzer';

// Character arc types
export type {
  ArcType,
  CharacterAppearance,
  CharacterScreenTime,
  CharacterConsistencyIssue,
  CharacterArc,
  RelationshipArc,
  CharacterAnalysisResult,
} from './CharacterArcAnalyzer';

// Thematic types
export type {
  ThemeCategory,
  Theme,
  ThemePresence,
  ThematicThread,
  ThematicIssue,
  ThematicAnalysisResult,
} from './ThematicAnalyzer';

// Engagement types
export type {
  EngagementConfig,
  ReaderProfile,
  EngagementPoint,
  EngagementFlag,
  DropOffPrediction,
  ConfusionPoint,
  ReaderExperienceReport,
} from './EngagementSimulator';
