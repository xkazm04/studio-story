/**
 * Agents — Public API
 */

export { AdvisorClient } from './AdvisorClient';
export { GeminiLiveClient } from './GeminiLiveClient';
export { AudioIOManager } from './AudioIOManager';
export { useAdvisor } from './useAdvisor';
export { useAdvisorVoice } from './useAdvisorVoice';
export { useMultimodalInput } from './useMultimodalInput';
export type { InteractionContext, InteractionFragment } from './useMultimodalInput';
export { useAgentStore } from './store/agentStore';
export type {
  ConnectionState,
  AgentMessage,
  AgentSuggestion,
} from './types';
