/**
 * Agents — Public API
 */

export { AdvisorClient } from './AdvisorClient';
export { GeminiLiveClient, AudioIOManager } from '@dzin/voice';
export { useAdvisor } from './useAdvisor';
export { useAdvisorVoice } from './useAdvisorVoice';
export { useMultimodalInput } from './useMultimodalInput';
export type { InteractionContext, InteractionFragment } from './useMultimodalInput';
export { useAgentStore } from './store/agentStore';
export type {
  CLIToolEvent,
  ConnectionState,
  AgentMessage,
  AgentSuggestion,
  EffectRecord,
  EffectTriggerSource,
  EffectWorkspaceSnapshot,
} from './types';
export { summarizeToolInput } from './types';
export { EffectTimeline, useEffectAttribution } from './components';
