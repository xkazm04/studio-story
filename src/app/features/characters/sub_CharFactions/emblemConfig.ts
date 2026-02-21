/**
 * Emblem Designer Configuration
 * Extracted configuration constants for emblem styles and animation modes
 */

import { Shield, Award, Zap, Image as ImageIcon, RotateCw, ArrowBigUpDash, Wind, Move } from 'lucide-react';

export type EmblemStyle = 'shield' | 'crest' | 'sigil' | 'custom';
export type AnimationMode = 'spin' | 'bounce' | 'float' | 'wobble';

export interface EmblemStyleConfig {
  id: EmblemStyle;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

export interface AnimationModeConfig {
  id: AnimationMode;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}

export const EMBLEM_STYLES: EmblemStyleConfig[] = [
  {
    id: 'shield',
    name: 'Shield',
    icon: Shield,
    description: 'Classic protective emblem for defensive factions',
  },
  {
    id: 'crest',
    name: 'Crest',
    icon: Award,
    description: 'Regal emblem for noble and prestigious factions',
  },
  {
    id: 'sigil',
    name: 'Sigil',
    icon: Zap,
    description: 'Mystical emblem for magical or arcane factions',
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: ImageIcon,
    description: 'Upload your own custom emblem image',
  },
];

export const ANIMATION_MODES: AnimationModeConfig[] = [
  {
    id: 'spin',
    name: 'Spin',
    icon: RotateCw,
    description: 'Continuous rotation',
  },
  {
    id: 'bounce',
    name: 'Bounce',
    icon: ArrowBigUpDash,
    description: 'Bouncing motion',
  },
  {
    id: 'float',
    name: 'Float',
    icon: Wind,
    description: 'Gentle floating',
  },
  {
    id: 'wobble',
    name: 'Wobble',
    icon: Move,
    description: 'Wobble effect',
  },
];

// File upload constants
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['image/'];
