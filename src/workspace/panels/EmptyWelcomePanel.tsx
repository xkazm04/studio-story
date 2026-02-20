'use client';

import React from 'react';
import {
  Terminal,
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
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { PanelDirective, WorkspaceLayout } from '../types';

interface WorkspacePresetCard {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  panels: PanelDirective[];
  layout: WorkspaceLayout;
}

const WORKSPACE_PRESETS: WorkspacePresetCard[] = [
  {
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

export default function EmptyWelcomePanel() {
  const replaceAllPanels = useWorkspaceStore((s) => s.replaceAllPanels);

  return (
    <div className="flex flex-col items-center h-full p-6 overflow-auto select-none">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 mt-2">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800/50 flex items-center justify-center">
            <Terminal className="w-6 h-6 text-slate-500" />
          </div>
          <div className="absolute inset-0 w-12 h-12 rounded-xl border border-cyan-500/20 animate-pulse" />
        </div>
        <h2 className="text-sm font-semibold text-slate-200 mb-0.5">Studio Story</h2>
        <p className="text-[11px] text-slate-500 text-center max-w-[320px]">
          Pick a workspace to get started, or describe what you want in the terminal below.
          The AI will compose the perfect workspace for your task.
        </p>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[640px]">
        {WORKSPACE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => replaceAllPanels(preset.panels, preset.layout)}
            className={cn(
              'flex items-start gap-3 px-3.5 py-3 rounded-lg border transition-all cursor-pointer text-left group',
              preset.bg,
              preset.border
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
              'bg-slate-900/60 border border-slate-800/40 group-hover:border-slate-700/60 transition-colors'
            )}>
              <preset.icon className={cn('w-4 h-4', preset.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 mb-0.5">{preset.label}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{preset.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
