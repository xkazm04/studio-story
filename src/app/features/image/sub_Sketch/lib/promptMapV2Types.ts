/**
 * Claude Prompt Map V2 - Type Definitions
 * Type definitions for the enhanced prompt system with visual metadata
 */

export type ClaudePromptDimension = 'theme' | 'scene' | 'character';

export interface VisualMetadata {
  gradient: string; // CSS gradient
  icon: string; // Emoji
  color: string; // Primary color
  particles?: string[]; // Particle emojis for effects
  mood?: number; // 0-100 mood intensity
  energy?: number; // 0-100 energy level
}

export interface ClaudePromptOptionV2 {
  id: string;
  label: string;
  description: string;
  tags: string[];
  visual: VisualMetadata;
  keywords: string[]; // For smart composition
  weight?: number; // Influence in final prompt
}

export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  emoji: string;
  selections: {
    theme: string;
    scene: string;
    character: string;
  };
}

export interface ClaudePromptColumnV2 {
  id: ClaudePromptDimension;
  label: string;
  icon: string;
  description: string;
  gradient: string;
}
