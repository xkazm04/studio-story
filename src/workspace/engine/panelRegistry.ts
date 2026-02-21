/**
 * Panel Registry — Maps panel types to their component imports, metadata, and manifests.
 *
 * All panel imports are lazy for code-splitting.
 * Enhanced with manifest references for LLM-driven composition.
 */

import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Users,
  Map,
  Info,
  MessageCircle,
  Image,
  Sparkles,
  User,
  ListChecks,
  BarChart3,
  GitBranch,
  Palette,
  Mic,
  ImagePlus,
  Paintbrush,
  BookOpen,
  AudioLines,
  SlidersHorizontal,
  Film,
  Bot,
} from 'lucide-react';
import type { WorkspacePanelType, PanelRole, PanelSizeClass, SkillDomain } from '../types';
import type { PanelManifest } from '@/manifest/types';
import { getManifest } from '@/manifest';

export interface PanelRegistryEntry {
  type: WorkspacePanelType;
  label: string;
  icon: LucideIcon;
  importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
  defaultRole: PanelRole;
  sizeClass: PanelSizeClass;
  minWidth?: number;
  domains: SkillDomain[];
  /** Linked manifest for LLM-driven composition */
  manifest?: PanelManifest;
}

export const PANEL_REGISTRY: Record<WorkspacePanelType, PanelRegistryEntry> = {
  // ─── Scene ───────────────────────────────────────
  'scene-editor': {
    type: 'scene-editor',
    label: 'Scene Editor',
    icon: FileText,
    importFn: () => import('../panels/scene/SceneEditorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['scene'],
    manifest: getManifest('scene-editor'),
  },
  'scene-metadata': {
    type: 'scene-metadata',
    label: 'Scene Details',
    icon: Info,
    importFn: () => import('../panels/scene/SceneMetadataPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 240,
    domains: ['scene'],
    manifest: getManifest('scene-metadata'),
  },
  'dialogue-view': {
    type: 'dialogue-view',
    label: 'Dialogue',
    icon: MessageCircle,
    importFn: () => import('../panels/scene/DialogueViewPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['scene'],
    manifest: getManifest('dialogue-view'),
  },

  // ─── Character ───────────────────────────────────
  'character-cards': {
    type: 'character-cards',
    label: 'Characters',
    icon: Users,
    importFn: () => import('../panels/character/CharacterCardsPanel'),
    defaultRole: 'secondary',
    sizeClass: 'compact',
    minWidth: 280,
    domains: ['character'],
    manifest: getManifest('character-cards'),
  },
  'character-detail': {
    type: 'character-detail',
    label: 'Character Detail',
    icon: User,
    importFn: () => import('../panels/character/CharacterDetailPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['character'],
    manifest: getManifest('character-detail'),
  },

  // ─── Story ───────────────────────────────────────
  'story-map': {
    type: 'story-map',
    label: 'Story Map',
    icon: Map,
    importFn: () => import('../panels/story/StoryMapPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['story'],
    manifest: getManifest('story-map'),
  },
  'beats-manager': {
    type: 'beats-manager',
    label: 'Beats',
    icon: ListChecks,
    importFn: () => import('../panels/story/BeatsManagerPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['story'],
    manifest: getManifest('beats-manager'),
  },
  'story-evaluator': {
    type: 'story-evaluator',
    label: 'Evaluator',
    icon: BarChart3,
    importFn: () => import('../panels/story/StoryEvaluatorPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 350,
    domains: ['story'],
    manifest: getManifest('story-evaluator'),
  },
  'story-graph': {
    type: 'story-graph',
    label: 'Story Graph',
    icon: GitBranch,
    importFn: () => import('../panels/story/StoryGraphPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['story'],
    manifest: getManifest('story-graph'),
  },
  'script-editor': {
    type: 'script-editor',
    label: 'Script',
    icon: FileText,
    importFn: () => import('../panels/story/ScriptEditorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['scene', 'story'],
    manifest: getManifest('script-editor'),
  },
  'theme-manager': {
    type: 'theme-manager',
    label: 'Themes',
    icon: Sparkles,
    importFn: () => import('../panels/story/ThemeManagerPanel'),
    defaultRole: 'secondary',
    sizeClass: 'compact',
    minWidth: 280,
    domains: ['story'],
    manifest: getManifest('theme-manager'),
  },

  // ─── Art & Image ─────────────────────────────────
  'art-style': {
    type: 'art-style',
    label: 'Art Style',
    icon: Palette,
    importFn: () => import('../panels/image/ArtStylePanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['image'],
    manifest: getManifest('art-style'),
  },
  'image-canvas': {
    type: 'image-canvas',
    label: 'Image Canvas',
    icon: Image,
    importFn: () => import('../panels/image/ImageCanvasPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['image'],
    manifest: getManifest('image-canvas'),
  },
  'image-generator': {
    type: 'image-generator',
    label: 'Image Generator',
    icon: ImagePlus,
    importFn: () => import('../panels/image/ImageGeneratorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['image'],
    manifest: getManifest('image-generator'),
  },

  // ─── Voice ───────────────────────────────────────
  'voice-manager': {
    type: 'voice-manager',
    label: 'Voices',
    icon: Mic,
    importFn: () => import('../panels/audio/VoiceManagerPanel'),
    defaultRole: 'primary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['utility'],
    manifest: getManifest('voice-manager'),
  },
  'voice-casting': {
    type: 'voice-casting',
    label: 'Voice Casting',
    icon: Users,
    importFn: () => import('../panels/audio/VoiceCastingPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 350,
    domains: ['utility'],
    manifest: getManifest('voice-casting'),
  },
  'script-dialog': {
    type: 'script-dialog',
    label: 'Script & Dialog',
    icon: BookOpen,
    importFn: () => import('../panels/audio/ScriptDialogPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 450,
    domains: ['utility', 'scene'],
    manifest: getManifest('script-dialog'),
  },
  'narration': {
    type: 'narration',
    label: 'Narration',
    icon: AudioLines,
    importFn: () => import('../panels/audio/NarrationPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 500,
    domains: ['utility'],
    manifest: getManifest('narration'),
  },
  'voice-performance': {
    type: 'voice-performance',
    label: 'Voice Performance',
    icon: SlidersHorizontal,
    importFn: () => import('../panels/audio/VoicePerformancePanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 260,
    domains: ['utility'],
    manifest: getManifest('voice-performance'),
  },

  // ─── Combined / Composite ──────────────────────────
  'scene-list': {
    type: 'scene-list',
    label: 'Scene List',
    icon: FileText,
    importFn: () => import('../panels/scene/SceneListPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 220,
    domains: ['scene'],
    manifest: getManifest('scene-list'),
  },
  'writing-desk': {
    type: 'writing-desk',
    label: 'Writing Desk',
    icon: FileText,
    importFn: () => import('../panels/story/WritingDeskPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 500,
    domains: ['scene', 'story'],
    manifest: getManifest('writing-desk'),
  },
  'character-creator': {
    type: 'character-creator',
    label: 'Character Creator',
    icon: Paintbrush,
    importFn: () => import('../panels/character/CharacterCreatorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 560,
    domains: ['character'],
    manifest: getManifest('character-creator'),
  },

  // ─── Studio ──────────────────────────────────────
  'beats-sidebar': {
    type: 'beats-sidebar',
    label: 'Beats',
    icon: ListChecks,
    importFn: () => import('../panels/story/BeatsSidebarPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 200,
    domains: ['story', 'scene'],
    manifest: getManifest('beats-sidebar'),
  },
  'cast-sidebar': {
    type: 'cast-sidebar',
    label: 'Cast',
    icon: Users,
    importFn: () => import('../panels/character/CastSidebarPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 200,
    domains: ['character', 'scene'],
    manifest: getManifest('cast-sidebar'),
  },
  'scene-gallery': {
    type: 'scene-gallery',
    label: 'Scene Gallery',
    icon: Film,
    importFn: () => import('../panels/scene/SceneGalleryPanel'),
    defaultRole: 'secondary',
    sizeClass: 'compact',
    minWidth: 400,
    domains: ['scene'],
    manifest: getManifest('scene-gallery'),
  },
  'audio-toolbar': {
    type: 'audio-toolbar',
    label: 'Audio',
    icon: AudioLines,
    importFn: () => import('../panels/audio/AudioToolbarPanel'),
    defaultRole: 'tertiary',
    sizeClass: 'compact',
    minWidth: 400,
    domains: ['sound'],
    manifest: getManifest('audio-toolbar'),
  },

  // ─── Agent ───────────────────────────────────────
  'advisor': {
    type: 'advisor',
    label: 'Advisor',
    icon: Bot,
    importFn: () => import('../panels/assistant/AdvisorPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 280,
    domains: [],
    manifest: getManifest('advisor'),
  },

  // ─── System ──────────────────────────────────────
  'empty-welcome': {
    type: 'empty-welcome',
    label: 'Welcome',
    icon: Sparkles,
    importFn: () => import('../panels/shared/EmptyWelcomePanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    domains: [],
  },
};

export function getPanelEntry(type: WorkspacePanelType): PanelRegistryEntry | undefined {
  return PANEL_REGISTRY[type];
}
