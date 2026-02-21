/**
 * Real-Time Collaborative Project Workspaces
 *
 * Export all collaboration components, hooks, and utilities
 */

// Components
export { CollaborationPanel } from './components/CollaborationPanel';
export { CollaborationChat } from './components/CollaborationChat';
export {
  PresenceIndicator,
  CompactPresence,
  UserPresenceBadge,
} from './components/PresenceIndicator';

// Utilities
export {
  transform,
  applyOperation,
  compose,
  createOperation,
  OperationalTransformEngine,
} from './lib/operationalTransform';

export type {
  TextOperation,
  TransformedOperation,
} from './lib/operationalTransform';
