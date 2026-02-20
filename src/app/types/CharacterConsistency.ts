/**
 * Character Consistency Types
 * Types for character consistency checking and analysis
 */

export type ConsistencyIssueType =
  | 'personality_conflict'
  | 'motivation_conflict'
  | 'speech_pattern_conflict'
  | 'behavior_conflict'
  | 'trait_conflict';

export type ConsistencySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ConsistencyIssue {
  id: string;
  character_id: string;
  issue_type: ConsistencyIssueType;
  severity: ConsistencySeverity;
  description: string;
  conflicting_text_1: string;
  conflicting_text_2: string;
  source_1: {
    type: 'beat' | 'scene' | 'trait' | 'backstory';
    id: string;
    name: string;
    context: string;
  };
  source_2: {
    type: 'beat' | 'scene' | 'trait' | 'backstory';
    id: string;
    name: string;
    context: string;
  };
  similarity_score: number;
  suggested_resolution?: string;
  ai_reasoning: string;
  confidence_score: number;
  resolved: boolean;
  user_feedback?: string;
  created_at: Date;
  resolved_at?: Date;
}

export interface CharacterConsistencyReport {
  character_id: string;
  character_name: string;
  total_issues: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  consistency_score: number; // 0-100
  issues: ConsistencyIssue[];
  analyzed_sources: {
    beats_count: number;
    scenes_count: number;
    traits_count: number;
  };
  last_analyzed_at: Date;
}

export interface ConsistencyCheckRequest {
  character_id: string;
  project_id: string;
  include_beats?: boolean;
  include_scenes?: boolean;
  include_traits?: boolean;
}

export interface ConsistencyResolveRequest {
  issue_id: string;
  resolution_type: 'accept_suggestion' | 'custom_edit' | 'ignore';
  custom_resolution?: string;
  user_feedback?: string;
}
