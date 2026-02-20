/**
 * Types for Act Description Recommendation System
 */

export type ChangeType = 'add' | 'replace' | 'none';

export interface ActRecommendation {
  act_id: string;
  act_name: string;
  change_type: ChangeType;
  before: string; // exact text to replace (or empty string if adding)
  after: string; // new text to add/replace with
  reason: string; // brief explanation why this change is needed
}

export interface RecommendationResponse {
  recommendations: ActRecommendation[];
  overall_assessment: string;
}

export interface RecommendationContext {
  newBeat: {
    name: string;
    description?: string;
    act_id: string;
  };
  targetAct: {
    id: string;
    name: string;
    description?: string;
  };
  allActs: Array<{
    id: string;
    name: string;
    description?: string;
    order?: number;
  }>;
  existingActBeats?: Record<string, Array<{ name: string; description?: string }>>;
  projectTitle?: string;
  projectDescription?: string;
  storyBeats?: Array<{
    name: string;
    description?: string;
  }>;
  allScenes?: Array<{
    id: string;
    name: string;
    description?: string;
    act_id: string;
  }>;
}
