import type { IntentType } from '@dzin/core';

// ---------------------------------------------------------------------------
// Pattern Trigger Types
// ---------------------------------------------------------------------------

export interface EntityCreatedTrigger {
  type: 'entity-created';
  /** Matches IntentEvent where intent payload action === entityType */
  entityType: string;
}

export interface IdleTrigger {
  type: 'idle';
  /** Fire after this many ms of no IntentBus events */
  afterMs: number;
  /** Additional condition that must be true (e.g. workspace has few panels) */
  condition: (panelCount: number) => boolean;
}

export interface SequenceEvent {
  intentType: IntentType;
  action: string;
}

export interface SequenceTrigger {
  type: 'sequence';
  /** Ordered list of events to match */
  events: SequenceEvent[];
  /** All events must occur within this time window (ms) */
  withinMs: number;
}

export type PatternTrigger = EntityCreatedTrigger | IdleTrigger | SequenceTrigger;

// ---------------------------------------------------------------------------
// Suggestion Template
// ---------------------------------------------------------------------------

export interface SuggestionTemplate {
  id: string;
  text: string;
  intentToDispatch: {
    type: IntentType;
    payload: unknown;
  };
}

// ---------------------------------------------------------------------------
// Workflow Pattern
// ---------------------------------------------------------------------------

export interface WorkflowPattern {
  id: string;
  name: string;
  trigger: PatternTrigger;
  suggestion: SuggestionTemplate;
  /** Minimum ms before this pattern can fire again. Default 300000 (5 min). */
  cooldownMs: number;
}

// ---------------------------------------------------------------------------
// Default Patterns
// ---------------------------------------------------------------------------

export const DEFAULT_PATTERNS: WorkflowPattern[] = [
  {
    id: 'character-created',
    name: 'Character Created',
    trigger: {
      type: 'entity-created',
      entityType: 'open',
    },
    suggestion: {
      id: 'suggest-character-traits',
      text: 'Add character traits and backstory',
      intentToDispatch: {
        type: 'compose',
        payload: { action: 'open', panelType: 'character-detail' },
      },
    },
    cooldownMs: 300_000,
  },
  {
    id: 'scene-opened',
    name: 'Scene Opened',
    trigger: {
      type: 'entity-created',
      entityType: 'swap',
    },
    suggestion: {
      id: 'suggest-character-alongside',
      text: 'Show character panel alongside',
      intentToDispatch: {
        type: 'compose',
        payload: { action: 'open', panelType: 'character-cards' },
      },
    },
    cooldownMs: 300_000,
  },
  {
    id: 'story-setup-complete',
    name: 'Story Setup Complete',
    trigger: {
      type: 'sequence',
      events: [
        { intentType: 'compose', action: 'open' },
        { intentType: 'compose', action: 'open' },
        { intentType: 'compose', action: 'open' },
      ],
      withinMs: 60_000,
    },
    suggestion: {
      id: 'suggest-story-beats',
      text: 'Create story beats for your acts',
      intentToDispatch: {
        type: 'compose',
        payload: { action: 'open', panelType: 'beats-manager' },
      },
    },
    cooldownMs: 300_000,
  },
  {
    id: 'idle-empty-workspace',
    name: 'Idle Empty Workspace',
    trigger: {
      type: 'idle',
      afterMs: 30_000,
      condition: (panelCount: number) => panelCount < 2,
    },
    suggestion: {
      id: 'suggest-get-started',
      text: 'Get started: open a story setup panel',
      intentToDispatch: {
        type: 'compose',
        payload: { action: 'open', panelType: 'story-setup' },
      },
    },
    cooldownMs: 300_000,
  },
];
