/**
 * Agents — Public API
 */

export { GeminiLiveClient } from './GeminiLiveClient';
export { WorkspaceObserver } from './WorkspaceObserver';
export { ADVISOR_TOOLS, ADVISOR_SYSTEM_INSTRUCTION } from './advisorTools';
export { useAdvisor } from './useAdvisor';
export { useAgentStore } from './store/agentStore';
export type {
  ConnectionState,
  AgentConfig,
  AgentMessage,
  AgentSuggestion,
  WorkspaceStateSnapshot,
  GeminiFunctionCall,
} from './types';
