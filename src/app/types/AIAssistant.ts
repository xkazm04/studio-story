export type SuggestionType = 'scene_hook' | 'beat_outline' | 'dialogue_snippet' | 'character_action' | 'plot_twist' | 'world_building';

export type SuggestionDepth = 'brief' | 'moderate' | 'detailed';

export interface AISuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  content: string;
  context: string;
  genre?: string;
  confidence: number;
  reasoning?: string;
  created_at: Date;
}

export interface AIAssistantRequest {
  project_id: string;
  context_type: 'act' | 'beat' | 'character' | 'scene' | 'general';
  context_id?: string;
  suggestion_types?: SuggestionType[];
  genre?: string;
  depth?: SuggestionDepth;
  max_suggestions?: number;
}

export interface AIAssistantResponse {
  suggestions: AISuggestion[];
  context_summary: string;
  model_used: string;
  processing_time?: number;
}

export interface AIAssistantSettings {
  enabled: boolean;
  auto_suggest: boolean;
  suggestion_types: SuggestionType[];
  genre_filter?: string;
  depth: SuggestionDepth;
  max_suggestions: number;
}

export const defaultAssistantSettings: AIAssistantSettings = {
  enabled: true,
  auto_suggest: false,
  suggestion_types: ['scene_hook', 'beat_outline', 'dialogue_snippet'],
  depth: 'moderate',
  max_suggestions: 5,
};
