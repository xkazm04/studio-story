import {
  PenTool,
  Users,
  BookOpen,
  ListChecks,
  MessageSquare,
  Palette,
  Paintbrush,
  Mic,
  Globe,
  ClipboardCheck,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { PanelDirective, WorkspaceLayout } from '../types';

export interface WorkspacePreset {
  id: string;
  icon: ElementType;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  panels: PanelDirective[];
  layout: WorkspaceLayout;
}

export const WORKSPACE_PRESETS: WorkspacePreset[] = [
  {
    id: 'scene-writing',
    icon: PenTool,
    label: 'Scene Writing',
    description: 'Writing desk with scene selector and characters',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    panels: [
      { type: 'writing-desk', role: 'primary' },
      { type: 'character-cards', role: 'secondary' },
      { type: 'scene-list', role: 'sidebar' },
    ],
    layout: 'triptych',
  },
  {
    id: 'character-workshop',
    icon: Users,
    label: 'Character Workshop',
    description: 'Deep character development with detail view and images',
    color: 'text-purple-400',
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    panels: [
      { type: 'character-detail', role: 'primary' },
      { type: 'character-cards', role: 'sidebar' },
    ],
    layout: 'primary-sidebar',
  },
  {
    id: 'story-architecture',
    icon: BookOpen,
    label: 'Story Architecture',
    description: 'Graph visualization with beats and evaluator',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
    panels: [
      { type: 'story-graph', role: 'primary' },
      { type: 'beats-manager', role: 'secondary' },
      { type: 'story-evaluator', role: 'tertiary' },
    ],
    layout: 'split-3',
  },
  {
    id: 'beat-planning',
    icon: ListChecks,
    label: 'Beat Planning',
    description: 'Manage beats with story map and scene details',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    panels: [
      { type: 'beats-manager', role: 'primary' },
      { type: 'story-map', role: 'secondary' },
      { type: 'scene-metadata', role: 'sidebar' },
    ],
    layout: 'split-3',
  },
  {
    id: 'dialogue-studio',
    icon: MessageSquare,
    label: 'Dialogue Studio',
    description: 'Script editor with dialogue view and voice casting',
    color: 'text-violet-400',
    bg: 'bg-violet-500/5',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    panels: [
      { type: 'script-editor', role: 'primary' },
      { type: 'dialogue-view', role: 'secondary' },
      { type: 'voice-casting', role: 'tertiary' },
    ],
    layout: 'split-3',
  },
  {
    id: 'visual-development',
    icon: Palette,
    label: 'Visual Development',
    description: 'Image generator with art style and canvas preview',
    color: 'text-rose-400',
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    panels: [
      { type: 'image-generator', role: 'primary' },
      { type: 'art-style', role: 'secondary' },
      { type: 'image-canvas', role: 'sidebar' },
    ],
    layout: 'split-3',
  },
  {
    id: 'character-appearance',
    icon: Paintbrush,
    label: 'Character Appearance',
    description: 'Character appearance creator with character picker sidebar',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    panels: [
      { type: 'character-creator', role: 'primary' },
      { type: 'character-cards', role: 'sidebar' },
    ],
    layout: 'primary-sidebar',
  },
  {
    id: 'voice-production',
    icon: Mic,
    label: 'Voice Production',
    description: 'Voice management with casting and script reference',
    color: 'text-orange-400',
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    panels: [
      { type: 'voice-manager', role: 'primary' },
      { type: 'voice-casting', role: 'secondary' },
      { type: 'script-editor', role: 'tertiary' },
    ],
    layout: 'split-3',
  },
  {
    id: 'world-building',
    icon: Globe,
    label: 'World Building',
    description: 'Story map, themes, beats, and evaluator in grid',
    color: 'text-teal-400',
    bg: 'bg-teal-500/5',
    border: 'border-teal-500/20 hover:border-teal-500/40',
    panels: [
      { type: 'story-map', role: 'primary' },
      { type: 'theme-manager', role: 'secondary' },
      { type: 'beats-manager', role: 'tertiary' },
      { type: 'story-evaluator', role: 'sidebar' },
    ],
    layout: 'grid-4',
  },
  {
    id: 'review-polish',
    icon: ClipboardCheck,
    label: 'Review & Polish',
    description: 'Evaluator, story graph, and script side by side',
    color: 'text-sky-400',
    bg: 'bg-sky-500/5',
    border: 'border-sky-500/20 hover:border-sky-500/40',
    panels: [
      { type: 'story-evaluator', role: 'primary' },
      { type: 'story-graph', role: 'secondary' },
      { type: 'script-editor', role: 'tertiary' },
    ],
    layout: 'split-3',
  },
];

export const QUICK_PRESET_IDS = [
  'scene-writing',
  'character-workshop',
  'story-architecture',
  'voice-production',
] as const;

export const QUICK_WORKSPACE_PRESETS = WORKSPACE_PRESETS.filter((preset) =>
  QUICK_PRESET_IDS.includes(preset.id as (typeof QUICK_PRESET_IDS)[number])
);
