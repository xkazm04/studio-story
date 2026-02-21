/**
 * AI Story Companion Types
 * Types for the AI-powered story writing assistant
 */

export type AICompanionMode = 'suggest' | 'generate' | 'architect' | 'brainstorm';

export interface GeneratedChoice {
  label: string;
  targetTitle: string;
  targetContent?: string;
}

export interface ContentVariant {
  id: string;
  title: string;
  content: string;
  message?: string | null;
  speaker?: string | null;
  confidence: number;
  reasoning?: string;
  choices?: GeneratedChoice[];
}

export interface NextStepSuggestion {
  id: string;
  title: string;
  content: string;
  choiceLabel: string;
  imagePrompt?: string;
  confidence: number;
  reasoning?: string;
  sourceSceneId?: string;
}

export interface StoryArchitectPlan {
  scenes: Array<{
    id: string;
    title: string;
    content: string;
    type: 'story' | 'ending';
    level: number;
  }>;
  connections: Array<{
    sourceSceneId: string;
    targetSceneId: string;
    label: string;
  }>;
}

export interface StoryArchitectConfig {
  levels: number;
  choicesPerScene: number;
  startFromCurrentScene: boolean;
}

export interface AICompanionState {
  mode: AICompanionMode;
  isGenerating: boolean;
  error: string | null;
  contentVariants: ContentVariant[];
  selectedVariantId: string | null;
  nextStepSuggestions: NextStepSuggestion[];
  architectPlan: StoryArchitectPlan | null;
}

export interface SceneContext {
  id: string;
  name: string;
  content: string;
  description?: string | null;
  message?: string | null;
  speaker?: string | null;
}

export interface StoryContext {
  projectId: string;
  projectName?: string;
  currentScene?: SceneContext;
  predecessors: Array<{ scene: SceneContext; choiceLabel: string }>;
  successors: Array<{ scene: SceneContext; choiceLabel: string }>;
  allScenes: SceneContext[];
  choices: Array<{
    id: string;
    sourceSceneId: string;
    targetSceneId: string | null;
    label: string;
  }>;
}
