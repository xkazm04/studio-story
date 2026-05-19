/**
 * AI Writing Types — Canonical type definitions for the AI writing domain.
 *
 * All AI companion, brainstorm, and prompt composer types live here.
 * Sub-modules re-export from this file to maintain backwards compatibility.
 */

// ============================================================================
// AI Companion Mode & State
// ============================================================================

export type AICompanionMode = 'suggest' | 'generate' | 'architect' | 'brainstorm';

export interface AICompanionState {
  mode: AICompanionMode;
  isGenerating: boolean;
  error: string | null;
  contentVariants: ContentVariant[];
  selectedVariantId: string | null;
  nextStepSuggestions: NextStepSuggestion[];
  architectPlan: StoryArchitectPlan | null;
}

// ============================================================================
// Content Generation
// ============================================================================

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

// ============================================================================
// Story Architect
// ============================================================================

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

// ============================================================================
// Scene & Story Context (AI Companion)
// ============================================================================

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

// ============================================================================
// Brainstorm Context & Idea Types
// ============================================================================

export interface BrainstormStoryContext {
  currentSceneTitle?: string;
  currentSceneSummary?: string;
  characters?: Array<{
    id: string;
    name: string;
    role?: string;
    traits?: string[];
  }>;
  recentEvents?: string[];
  activeConflicts?: string[];
  themes?: string[];
  genre?: string;
  mood?: string;
}

export type IdeaType =
  | 'plot-direction'
  | 'character-decision'
  | 'conflict-escalation'
  | 'twist'
  | 'what-if'
  | 'theme-exploration'
  | 'setting-change'
  | 'relationship-shift';

export type IdeaImpact = 'minor' | 'moderate' | 'major' | 'transformative';

export type IdeaTone =
  | 'dramatic'
  | 'comedic'
  | 'tragic'
  | 'romantic'
  | 'mysterious'
  | 'action'
  | 'contemplative';

export interface GeneratedIdea {
  id: string;
  type: IdeaType;
  title: string;
  description: string;
  impact: IdeaImpact;
  tone: IdeaTone;
  relevantCharacters?: string[];
  potentialConsequences?: string[];
  followUpQuestions?: string[];
  explorationPrompts?: string[];
  createdAt: number;
  explored: boolean;
  saved: boolean;
  rating?: 1 | 2 | 3 | 4 | 5;
  templateKey?: string;
}

export interface WhatIfScenario {
  id: string;
  premise: string;
  description: string;
  possibleOutcomes: Array<{
    outcome: string;
    likelihood: 'likely' | 'possible' | 'unlikely';
    tone: IdeaTone;
  }>;
  affectedCharacters: string[];
  storyImplications: string[];
  explorationDepth: number;
  parentScenarioId?: string;
  childScenarioIds: string[];
  createdAt: number;
}

export interface ConflictEscalation {
  id: string;
  originalConflict: string;
  escalationLevel: 1 | 2 | 3 | 4 | 5;
  escalatedDescription: string;
  newStakes: string[];
  characterReactions: Array<{
    characterName: string;
    reaction: string;
  }>;
  potentialResolutions: string[];
  createdAt: number;
}

export interface PlotTwist {
  id: string;
  twistType: 'revelation' | 'betrayal' | 'reversal' | 'discovery' | 'arrival' | 'departure';
  title: string;
  description: string;
  setup: string;
  payoff: string;
  foreshadowingHints: string[];
  affectedCharacters: string[];
  impact: IdeaImpact;
  createdAt: number;
}

export interface BrainstormSession {
  id: string;
  name: string;
  context: BrainstormStoryContext;
  ideas: GeneratedIdea[];
  scenarios: WhatIfScenario[];
  escalations: ConflictEscalation[];
  twists: PlotTwist[];
  savedIdeas: string[];
  createdAt: number;
  updatedAt: number;
}

export interface GenerationOptions {
  count?: number;
  types?: IdeaType[];
  tones?: IdeaTone[];
  minImpact?: IdeaImpact;
  focusCharacters?: string[];
  avoidClichés?: boolean;
}

// ============================================================================
// Prompt Composer
// ============================================================================

export type ComposerMode = 'image' | 'context' | 'templates' | 'pins';

export type PromptDimension = 'style' | 'setting' | 'mood';

export interface PromptOption {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  prompt: string;
  isCustom?: boolean;
}

export interface PromptColumn {
  id: PromptDimension;
  label: string;
  icon: string;
  description: string;
  options: PromptOption[];
}

export type SelectionState = Partial<Record<PromptDimension, PromptOption>>;

export const MAX_PROMPT_LENGTH = 1500;
