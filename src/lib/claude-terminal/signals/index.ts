/**
 * Signals Module — CLI self-improvement feedback loop + predictive intent engine.
 *
 * Re-exports all signal-related types and functions.
 */

export type {
  SignalType,
  Severity,
  Category,
  Signal,
  Pattern,
  ImprovementRecord,
  IntentSignal,
  IntentPattern,
} from './signal-types';

export { SEVERITY_WEIGHT, SIGNAL_CATEGORY_MAP, SIGNAL_SEVERITY_MAP } from './signal-types';

export { analyzeEvent } from './signal-analyzer';

export type { SignalHealth } from './signal-store';

export {
  appendSignal,
  getSignals,
  getPatterns,
  savePatterns,
  markPatternsResolved,
  appendImprovement,
  getImprovements,
  appendIntentSignal,
  getIntentSignals,
  getIntentPatterns,
  saveIntentPatterns,
  getSignalHealth,
  flushSignalBuffers,
  shutdownSignalStore,
} from './signal-store';

export { detectPatterns } from './pattern-detector';

export { IntentChainTracker } from './intent-analyzer';

export { detectIntentPatterns, suggestNextActions } from './intent-detector';

export { buildImprovementPrompt } from './improvement-prompt';
