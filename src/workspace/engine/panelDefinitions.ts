/**
 * Unified Panel Definitions — Single source of truth for all workspace panels.
 *
 * Each panel is declared ONCE with every property (component import, icon,
 * layout metadata, AND manifest description/capabilities/inputs/outputs).
 *
 * PANEL_REGISTRY and PANEL_MANIFESTS are derived from this single source,
 * eliminating the class of bugs where properties silently drift between files.
 *
 * To add a new panel:
 *   1. Add a new entry to _PANEL_DEFS below
 *   2. That's it — registry, manifests, and type union update automatically
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
  Network,
  ScrollText,
  History,
} from 'lucide-react';
import type { PanelRole, PanelSizeClass, PanelComplexity, SkillDomain, PanelDensity } from '../types';
import type { PanelManifest, PanelInputSchema, PanelOutput } from '@/manifest/types';

// ─── Unified Definition Interface ────────────────────────────────────────────

interface UnifiedPanelDef {
  // --- Core (shared by registry + manifest) ---
  type: string;
  label: string;
  icon: LucideIcon;
  iconName: string;
  defaultRole: PanelRole;
  sizeClass: PanelSizeClass;
  minWidth?: number;
  domains: SkillDomain[];
  complexity: PanelComplexity;

  // --- Registry-only ---
  importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;

  // --- Manifest fields (optional — panels without these are excluded from PANEL_MANIFESTS) ---
  description?: string;
  capabilities?: string[];
  inputSchema?: PanelInputSchema;
  outputs?: PanelOutput[];
  useCases?: string[];
  suggestedCompanions?: string[];
  entityHint?: { entity: string; defaultView: string };
  densityModes?: {
    [K in PanelDensity]?: {
      minWidth: number;
      minHeight: number;
      description: string;
    };
  };
  dataSliceExamples?: Array<{
    scenario: string;
    dataSlice: {
      entityId?: string;
      filter?: string;
      view?: string;
      highlight?: string[];
      sort?: string;
    };
  }>;
}

// ─── Panel Definitions ───────────────────────────────────────────────────────

const _PANEL_DEFS = {
  // ─── Scene ───────────────────────────────────────
  'scene-editor': {
    type: 'scene-editor',
    label: 'Scene Editor',
    icon: FileText,
    iconName: 'FileText',
    importFn: () => import('../panels/scene/SceneEditorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['scene'],
    complexity: 'high',
    description: 'Block-based editor for composing scenes with screenplay formatting, supporting scene headers, action, dialogue, direction, and beat blocks.',
    capabilities: [
      'Edit scene content with structured block syntax',
      'Select speakers from project characters for dialogue blocks',
      'Link beat references to story beats',
      'Auto-save content to database',
      'Context menu for adding new block types',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string' as const, description: 'Scene to edit. Falls back to store selection.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [
      { name: 'referencedSpeakers', type: 'string[]', description: 'Character names used in dialogue blocks' },
      { name: 'referencedBeats', type: 'string[]', description: 'Beat IDs referenced in beat blocks' },
    ],
    useCases: [
      'User wants to write or edit a scene',
      'User wants to compose dialogue for characters',
      'User is working on screenplay or script formatting',
      'CLI generated scene content that needs manual editing',
    ],
    suggestedCompanions: ['scene-metadata', 'scene-list', 'character-cards'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full block editor with toolbar, context menu, and all formatting options' },
      compact: { minWidth: 280, minHeight: 200, description: 'Simplified editor with basic formatting, collapsed toolbar' },
      micro: { minWidth: 120, minHeight: 48, description: 'Scene name badge with word count indicator' },
    },
    dataSliceExamples: [
      { scenario: 'Edit a specific scene', dataSlice: { entityId: 'scene-123' } },
      { scenario: 'Edit scene and highlight dialogue', dataSlice: { entityId: 'scene-123', view: 'dialogue' } },
    ],
  },

  'scene-metadata': {
    type: 'scene-metadata',
    label: 'Scene Details',
    icon: Info,
    iconName: 'Info',
    importFn: () => import('../panels/primitives/adapters/SceneMetadataAdapter'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 240,
    domains: ['scene'],
    complexity: 'low',
    description: 'Displays and edits scene metadata including name, location, time of day, weather, mood, and description.',
    capabilities: [
      'View and edit scene name and location',
      'Set time of day and weather conditions',
      'Edit scene description and mood',
      'View assigned characters and beats',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string' as const, description: 'Scene to display metadata for.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [
      { name: 'sceneLocation', type: 'string', description: 'Current scene location' },
    ],
    useCases: [
      'User wants to see or edit scene properties',
      'User needs to set location or mood for a scene',
      'Companion panel alongside scene editor for context',
    ],
    suggestedCompanions: ['scene-editor'],
    entityHint: { entity: 'scene', defaultView: 'detail-view' },
    densityModes: {
      full: { minWidth: 240, minHeight: 200, description: 'All metadata fields editable with labels' },
      compact: { minWidth: 180, minHeight: 120, description: 'Key fields only: name, location, mood' },
      micro: { minWidth: 100, minHeight: 48, description: 'Location + mood as inline badges' },
    },
    dataSliceExamples: [
      { scenario: 'Show metadata for specific scene', dataSlice: { entityId: 'scene-123' } },
    ],
  },

  'dialogue-view': {
    type: 'dialogue-view',
    label: 'Dialogue',
    icon: MessageCircle,
    iconName: 'MessageCircle',
    importFn: () => import('../panels/primitives/adapters/DialogueViewAdapter'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['scene'],
    complexity: 'medium',
    description: 'Focused view of scene dialogue with character avatars, showing conversation flow in a chat-like format.',
    capabilities: [
      'Display dialogue lines with character attribution',
      'Show character avatars alongside dialogue',
      'Filter dialogue by character',
      'Export dialogue as text',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string' as const, description: 'Scene to show dialogue from.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to review conversation flow',
      'User is focused on dialogue quality',
      'User wants to see character interactions',
    ],
    suggestedCompanions: ['scene-editor', 'character-cards'],
    entityHint: { entity: 'scene', defaultView: 'conversation-view' },
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full chat view with avatars, filters, and export' },
      compact: { minWidth: 200, minHeight: 150, description: 'Condensed dialogue lines without avatars' },
      micro: { minWidth: 100, minHeight: 48, description: 'Line count badge with last speaker name' },
    },
    dataSliceExamples: [
      { scenario: 'Show dialogue for specific scene', dataSlice: { entityId: 'scene-123' } },
      { scenario: 'Filter to one character dialogue', dataSlice: { entityId: 'scene-123', filter: 'character:char-456' } },
    ],
  },

  'scene-list': {
    type: 'scene-list',
    label: 'Scene List',
    icon: FileText,
    iconName: 'FileText',
    importFn: () => import('../panels/primitives/adapters/SceneListAdapter'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 220,
    domains: ['scene'],
    complexity: 'low',
    description: 'Sidebar list of all scenes in the current act, with selection, reordering, and quick creation.',
    capabilities: [
      'List all scenes in the selected act',
      'Select scene to open in other panels',
      'Create new scenes',
      'Reorder scenes via drag and drop',
      'Show scene completion status',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'actId', type: 'string' as const, description: 'Act to filter scenes.', source: 'store:projectSlice.selectedAct' },
      ],
    },
    outputs: [
      { name: 'selectedSceneId', type: 'string', description: 'Currently selected scene ID' },
    ],
    useCases: [
      'User needs to navigate between scenes',
      'User is working on scene organization',
      'Sidebar companion for scene editor',
    ],
    suggestedCompanions: ['scene-editor', 'scene-metadata'],
    entityHint: { entity: 'scene', defaultView: 'data-list' },
    densityModes: {
      full: { minWidth: 220, minHeight: 200, description: 'Full scene list with drag handles, status dots, and add button' },
      compact: { minWidth: 160, minHeight: 120, description: 'Scene names only with selection highlight' },
      micro: { minWidth: 80, minHeight: 48, description: 'Scene count badge (e.g. "8 scenes")' },
    },
    dataSliceExamples: [
      { scenario: 'Show scenes for specific act', dataSlice: { filter: 'act:act-123' } },
      { scenario: 'Highlight a specific scene', dataSlice: { highlight: ['scene-456'] } },
    ],
  },

  'scene-gallery': {
    type: 'scene-gallery',
    label: 'Scene Gallery',
    icon: Film,
    iconName: 'Film',
    importFn: () => import('../panels/primitives/adapters/SceneGalleryAdapter'),
    defaultRole: 'secondary',
    sizeClass: 'compact',
    minWidth: 400,
    domains: ['scene'],
    complexity: 'low',
    description: 'Visual gallery of scene images and thumbnails for the current project or act.',
    capabilities: [
      'Display scene images in a grid',
      'View image details and prompts',
      'Navigate to scene from image',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants a visual overview of scenes',
      'User is reviewing scene imagery',
      'Companion panel in studio layout',
    ],
    suggestedCompanions: ['scene-editor', 'image-generator'],
    entityHint: { entity: 'scene', defaultView: 'card-grid' },
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Image grid with thumbnails, names, and prompts' },
      compact: { minWidth: 200, minHeight: 150, description: 'Smaller thumbnail grid, no text' },
      micro: { minWidth: 100, minHeight: 48, description: 'Image count badge with tiny preview' },
    },
  },

  // ─── Character ───────────────────────────────────
  'character-cards': {
    type: 'character-cards',
    label: 'Characters',
    icon: Users,
    iconName: 'Users',
    importFn: () => import('../panels/primitives/adapters/CharacterCardsAdapter'),
    defaultRole: 'secondary',
    sizeClass: 'compact',
    minWidth: 280,
    domains: ['character'],
    complexity: 'low',
    description: 'Grid or list of all project characters with avatars, types, and faction badges. Click to select for detail view.',
    capabilities: [
      'Display all characters in the project',
      'Filter by faction or character type',
      'Select character for detail editing',
      'Show character avatars and brief info',
      'Create new characters',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string' as const, description: 'Project to load characters from.', source: 'store:projectSlice.selectedProject' },
      ],
    },
    outputs: [
      { name: 'selectedCharacterId', type: 'string', description: 'Currently selected character ID' },
    ],
    useCases: [
      'User wants to browse project characters',
      'User needs to select a character for editing',
      'Overview panel alongside character detail',
      'User is managing the cast of characters',
    ],
    suggestedCompanions: ['character-detail'],
    entityHint: { entity: 'character', defaultView: 'card-grid' },
    densityModes: {
      full: { minWidth: 280, minHeight: 250, description: 'Character cards with avatars, type badges, faction info, and filters' },
      compact: { minWidth: 180, minHeight: 120, description: 'Avatar + name list with selection' },
      micro: { minWidth: 80, minHeight: 48, description: 'Character count badge (e.g. "12 characters")' },
    },
    dataSliceExamples: [
      { scenario: 'Show all characters', dataSlice: {} },
      { scenario: 'Filter by faction', dataSlice: { filter: 'faction:faction-123' } },
      { scenario: 'Highlight scene participants', dataSlice: { filter: 'scene-participants', highlight: ['char-1', 'char-2'] } },
    ],
  },

  'character-detail': {
    type: 'character-detail',
    label: 'Character Detail',
    icon: User,
    iconName: 'User',
    importFn: () => import('../panels/primitives/adapters/CharacterDetailAdapter'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['character'],
    complexity: 'high',
    description: 'Full character profile editor with backstory, traits, appearance, voice, faction role, and relationships.',
    capabilities: [
      'View and edit character name, type, and backstory',
      'Manage character traits and personality',
      'Edit appearance descriptions',
      'Set voice and speaking style',
      'View and edit faction membership and role',
      'See character relationships',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'characterId', type: 'string' as const, description: 'Character to display.', source: 'store:characterSlice.selectedCharacter' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to create or edit a character in depth',
      'User wants to review character backstory or traits',
      'CLI generated character data that needs review',
      'User is developing character personality',
    ],
    suggestedCompanions: ['character-cards'],
    entityHint: { entity: 'character', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Complete character profile with all tabs: backstory, traits, appearance, voice, relationships' },
      compact: { minWidth: 250, minHeight: 180, description: 'Avatar + name + key stats (type, faction) with single active tab' },
      micro: { minWidth: 120, minHeight: 48, description: 'Avatar thumbnail + character name badge' },
    },
    dataSliceExamples: [
      { scenario: 'Show specific character', dataSlice: { entityId: 'char-123' } },
      { scenario: 'Show character traits tab', dataSlice: { entityId: 'char-123', view: 'traits' } },
      { scenario: 'Show character relationships', dataSlice: { entityId: 'char-123', view: 'relationships' } },
    ],
  },

  'character-creator': {
    type: 'character-creator',
    label: 'Character Creator',
    icon: Paintbrush,
    iconName: 'Paintbrush',
    importFn: () => import('../panels/character/CharacterCreatorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 560,
    domains: ['character'],
    complexity: 'high',
    description: 'Visual character design tool with category-based options for body, face, clothing, and environment selection.',
    capabilities: [
      'Visual character appearance builder',
      'Category-based option selection (body, face, clothing)',
      'Preview character design',
      'Generate character images from design',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'characterId', type: 'string' as const, description: 'Character to design for.' },
      ],
    },
    outputs: [
      { name: 'designPrompt', type: 'string', description: 'Generated image prompt from design choices' },
    ],
    useCases: [
      'User wants to visually design a character appearance',
      'User is creating character art direction',
      'User wants to explore visual options for a character',
    ],
    suggestedCompanions: ['character-cards', 'image-generator'],
    densityModes: {
      full: { minWidth: 560, minHeight: 400, description: 'Full visual builder with category panels, preview, and generation' },
      compact: { minWidth: 300, minHeight: 200, description: 'Simplified options with small preview' },
    },
  },

  'relationship-map': {
    type: 'relationship-map',
    label: 'Relationship Map',
    icon: Network,
    iconName: 'Network',
    importFn: () => import('../panels/character/RelationshipMapPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['character'],
    complexity: 'high',
    description: 'Interactive visual graph of character relationships and faction dynamics using ReactFlow. Shows character nodes grouped by faction with colored edges for relationship types. Read-only -- relationships are created via chat.',
    capabilities: [
      'Visualize character connections',
      'Show faction clusters',
      'Filter by relationship type',
      'Pan and zoom navigation',
      'Click to focus character',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string' as const, description: 'Project to show relationships for.', source: 'store:projectSlice.selectedProject' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to see character connections',
      'User asks about faction dynamics',
      'User wants to understand relationship networks',
    ],
    suggestedCompanions: ['character-detail', 'character-cards'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full interactive map with filters, zoom, pan, and stats' },
      compact: { minWidth: 250, minHeight: 180, description: 'Map without filter bar' },
      micro: { minWidth: 100, minHeight: 48, description: 'Relationship count badge' },
    },
    dataSliceExamples: [
      { scenario: 'Show project relationships', dataSlice: {} },
      { scenario: 'Highlight specific character', dataSlice: { entityId: 'char-123' } },
    ],
  },

  'cast-sidebar': {
    type: 'cast-sidebar',
    label: 'Cast',
    icon: Users,
    iconName: 'Users',
    importFn: () => import('../panels/primitives/adapters/CastSidebarAdapter'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 200,
    domains: ['character', 'scene'],
    complexity: 'low',
    description: 'Compact character list sidebar showing cast members relevant to the current scene or context.',
    capabilities: [
      'Display scene-relevant characters',
      'Quick character selection',
      'Show character roles and avatars',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [
      { name: 'selectedCharacterId', type: 'string', description: 'Selected character ID' },
    ],
    useCases: [
      'Sidebar companion during scene writing',
      'Quick cast reference in studio layout',
      'Character selection for dialogue',
    ],
    suggestedCompanions: ['scene-editor', 'audio-production'],
    entityHint: { entity: 'character', defaultView: 'data-list' },
    densityModes: {
      full: { minWidth: 200, minHeight: 150, description: 'Character list with avatars, roles, and selection' },
      compact: { minWidth: 140, minHeight: 100, description: 'Avatar + name rows, compact spacing' },
      micro: { minWidth: 60, minHeight: 48, description: 'Cast count chip (e.g. "4 cast")' },
    },
    dataSliceExamples: [
      { scenario: 'Show cast for specific scene', dataSlice: { filter: 'scene-participants' } },
      { scenario: 'Highlight active speaker', dataSlice: { highlight: ['char-123'] } },
    ],
  },

  // ─── Story ───────────────────────────────────────
  'story-map': {
    type: 'story-map',
    label: 'Story Map',
    icon: Map,
    iconName: 'Map',
    importFn: () => import('../panels/primitives/adapters/StoryMapAdapter'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['story'],
    complexity: 'medium',
    description: 'Visual overview of story structure showing acts and their scenes in a hierarchical tree or timeline view.',
    capabilities: [
      'Visualize act/scene hierarchy',
      'Navigate to acts and scenes',
      'See story progression overview',
      'Identify gaps in story structure',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants to see the overall story structure',
      'User is planning story arc and pacing',
      'User needs a high-level overview of their project',
    ],
    suggestedCompanions: ['beats-manager', 'story-evaluator'],
    entityHint: { entity: 'act', defaultView: 'tree-view' },
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full tree view with act/scene hierarchy, expandable nodes' },
      compact: { minWidth: 180, minHeight: 120, description: 'Collapsed tree showing acts as rows with scene counts' },
      micro: { minWidth: 100, minHeight: 48, description: 'Act count + total scene count badge' },
    },
    dataSliceExamples: [
      { scenario: 'Highlight current act', dataSlice: { highlight: ['act-123'] } },
      { scenario: 'Show specific act expanded', dataSlice: { entityId: 'act-123' } },
    ],
  },

  'beats-manager': {
    type: 'beats-manager',
    label: 'Beats',
    icon: ListChecks,
    iconName: 'ListChecks',
    importFn: () => import('../panels/story/BeatsManagerPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['story'],
    complexity: 'high',
    description: 'Full beat management with creation, editing, ordering, type assignment, and completion tracking for narrative beats.',
    capabilities: [
      'Create, edit, and delete story beats',
      'Assign beat types (setup, conflict, resolution, climax, transition, reveal, action)',
      'Reorder beats via drag and drop',
      'Mark beats as complete',
      'Link beats to scenes',
      'View beat descriptions and dependencies',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'actId', type: 'string' as const, description: 'Act to manage beats for.', source: 'store:projectSlice.selectedAct' },
      ],
    },
    outputs: [
      { name: 'selectedBeatId', type: 'string', description: 'Currently selected beat ID' },
    ],
    useCases: [
      'User wants to plan or edit story beats',
      'User is structuring narrative flow',
      'User wants to track story progress by beats',
      'CLI generated beats that need organization',
    ],
    suggestedCompanions: ['story-map', 'story-evaluator'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full beat table with drag-reorder, type badges, descriptions, and completion toggles' },
      compact: { minWidth: 250, minHeight: 150, description: 'Beat list with type color dots and names only' },
      micro: { minWidth: 100, minHeight: 48, description: 'Beat progress bar (e.g. "5/12 complete")' },
    },
    dataSliceExamples: [
      { scenario: 'Show beats for specific act', dataSlice: { filter: 'act:act-123' } },
      { scenario: 'Show only incomplete beats', dataSlice: { filter: 'incomplete' } },
      { scenario: 'Sort by type', dataSlice: { sort: 'type' } },
    ],
  },

  'story-evaluator': {
    type: 'story-evaluator',
    label: 'Evaluator',
    icon: BarChart3,
    iconName: 'BarChart3',
    importFn: () => import('../panels/story/StoryEvaluatorPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 350,
    domains: ['story'],
    complexity: 'medium',
    description: 'Story quality analysis showing pacing scores, theme consistency, character arc coverage, and structural completeness.',
    capabilities: [
      'Analyze story pacing and rhythm',
      'Check theme consistency across acts',
      'Evaluate character arc completeness',
      'Score structural balance',
      'Provide improvement suggestions',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants to evaluate story quality',
      'User is reviewing story for weaknesses',
      'User wants AI analysis of their narrative',
    ],
    suggestedCompanions: ['story-map', 'beats-manager'],
    densityModes: {
      full: { minWidth: 350, minHeight: 250, description: 'Full evaluation dashboard with pacing graph, scores, and suggestions' },
      compact: { minWidth: 200, minHeight: 120, description: 'Summary scores with color-coded ratings' },
      micro: { minWidth: 80, minHeight: 48, description: 'Overall score badge (e.g. "B+")' },
    },
  },

  'story-graph': {
    type: 'story-graph',
    label: 'Story Graph',
    icon: GitBranch,
    iconName: 'GitBranch',
    importFn: () => import('../panels/story/StoryGraphPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['story'],
    complexity: 'high',
    description: 'Interactive node-based graph visualization of story elements using ReactFlow, showing relationships between beats, scenes, and characters.',
    capabilities: [
      'Interactive node graph of story elements',
      'Visualize connections between beats, scenes, characters',
      'Zoom and pan navigation',
      'Click nodes to navigate to elements',
      'Auto-layout with dagre algorithm',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants to visualize story connections',
      'User is analyzing narrative dependencies',
      'User wants a visual story architecture view',
    ],
    suggestedCompanions: ['beats-manager', 'story-map'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full interactive ReactFlow graph with zoom, pan, and clickable nodes' },
      compact: { minWidth: 250, minHeight: 180, description: 'Static minimap view of the graph, no interaction' },
      micro: { minWidth: 100, minHeight: 48, description: 'Node count badge (e.g. "24 nodes, 38 edges")' },
    },
  },

  'script-editor': {
    type: 'script-editor',
    label: 'Script',
    icon: FileText,
    iconName: 'FileText',
    importFn: () => import('../panels/story/ScriptEditorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['scene', 'story'],
    complexity: 'high',
    description: 'Rich text script editor with TipTap, supporting screenplay format with speaker attribution and stage directions.',
    capabilities: [
      'Rich text editing with TipTap',
      'Screenplay formatting support',
      'Speaker attribution',
      'Stage direction blocks',
      'Auto-save',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string' as const, description: 'Scene to edit script for.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to write formatted screenplay content',
      'User prefers rich text over block-based editing',
      'User is writing stage directions and dialogue',
    ],
    suggestedCompanions: ['scene-metadata', 'character-cards'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full TipTap editor with formatting toolbar and speaker selection' },
      compact: { minWidth: 280, minHeight: 180, description: 'Editor with minimal toolbar, no speaker panel' },
      micro: { minWidth: 120, minHeight: 48, description: 'Word count + scene name badge' },
    },
    dataSliceExamples: [
      { scenario: 'Edit script for specific scene', dataSlice: { entityId: 'scene-123' } },
    ],
  },

  'theme-manager': {
    type: 'theme-manager',
    label: 'Themes',
    icon: Sparkles,
    iconName: 'Sparkles',
    importFn: () => import('../panels/story/ThemeManagerPanel'),
    defaultRole: 'secondary',
    sizeClass: 'compact',
    minWidth: 280,
    domains: ['story'],
    complexity: 'medium',
    description: 'Manage story themes, motifs, and symbols with tracking of how they appear across acts and scenes.',
    capabilities: [
      'Create and edit story themes',
      'Track theme presence across scenes',
      'Manage motifs and symbols',
      'View theme coverage analysis',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants to manage story themes',
      'User is tracking motifs and symbolism',
      'User wants thematic consistency analysis',
    ],
    suggestedCompanions: ['story-evaluator', 'story-map'],
    densityModes: {
      full: { minWidth: 280, minHeight: 200, description: 'Theme list with coverage charts and scene links' },
      compact: { minWidth: 180, minHeight: 120, description: 'Theme names with color-coded coverage dots' },
      micro: { minWidth: 80, minHeight: 48, description: 'Theme count badge' },
    },
  },

  'beats-sidebar': {
    type: 'beats-sidebar',
    label: 'Beats',
    icon: ListChecks,
    iconName: 'ListChecks',
    importFn: () => import('../panels/primitives/adapters/BeatsSidebarAdapter'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 200,
    domains: ['story', 'scene'],
    complexity: 'low',
    description: 'Compact beat list sidebar for quick navigation and beat selection while working in other panels.',
    capabilities: [
      'Compact beat list for navigation',
      'Select beat for other panels',
      'View beat status at a glance',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [
      { name: 'selectedBeatId', type: 'string', description: 'Selected beat ID' },
    ],
    useCases: [
      'Sidebar companion for scene editing',
      'Quick beat navigation while writing',
      'Studio layout beat reference',
    ],
    suggestedCompanions: ['scene-editor', 'script-editor'],
    entityHint: { entity: 'beat', defaultView: 'data-list' },
    densityModes: {
      full: { minWidth: 200, minHeight: 150, description: 'Scrollable beat list with type badges and selection' },
      compact: { minWidth: 140, minHeight: 100, description: 'Beat names only, single-line rows' },
      micro: { minWidth: 60, minHeight: 48, description: 'Beat progress chip (e.g. "3/8")' },
    },
  },

  // ─── Art & Image ─────────────────────────────────
  'art-style': {
    type: 'art-style',
    label: 'Art Style',
    icon: Palette,
    iconName: 'Palette',
    importFn: () => import('../panels/image/ArtStylePanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['image'],
    complexity: 'medium',
    description: 'Art style reference panel for defining and previewing the visual style of the project.',
    capabilities: [
      'Define project art style and references',
      'Preview style settings',
      'Set color palettes and visual direction',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User is setting up visual direction for the project',
      'User wants to define art style for image generation',
      'Companion for image generation workflow',
    ],
    suggestedCompanions: ['image-generator', 'image-canvas'],
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full style editor with color palette, reference images, and settings' },
      compact: { minWidth: 180, minHeight: 120, description: 'Style preview thumbnail with palette strip' },
      micro: { minWidth: 80, minHeight: 48, description: 'Style name badge with color dot' },
    },
  },

  'image-canvas': {
    type: 'image-canvas',
    label: 'Image Canvas',
    icon: Image,
    iconName: 'Image',
    importFn: () => import('../panels/primitives/adapters/ImageCanvasAdapter'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['image'],
    complexity: 'medium',
    description: 'Image viewing and comparison canvas for reviewing generated images side by side.',
    capabilities: [
      'Display generated images',
      'Side-by-side comparison',
      'Zoom and pan on images',
      'Image selection for further editing',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'imageUrl', type: 'string' as const, description: 'Initial image to display.' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to review generated images',
      'User is comparing image variations',
      'Image display alongside generator',
    ],
    suggestedCompanions: ['image-generator', 'art-style'],
    entityHint: { entity: 'scene', defaultView: 'media-viewer' },
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full image viewer with zoom, pan, comparison mode' },
      compact: { minWidth: 180, minHeight: 150, description: 'Single image display with basic zoom' },
      micro: { minWidth: 80, minHeight: 48, description: 'Tiny image thumbnail' },
    },
    dataSliceExamples: [
      { scenario: 'Display specific image', dataSlice: { entityId: 'image-url-here' } },
    ],
  },

  'image-generator': {
    type: 'image-generator',
    label: 'Image Generator',
    icon: ImagePlus,
    iconName: 'ImagePlus',
    importFn: () => import('../panels/image/ImageGeneratorPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['image'],
    complexity: 'high',
    description: 'AI image generation interface with prompt editing, aspect ratio control, and generation history.',
    capabilities: [
      'Generate images from text prompts',
      'Set aspect ratios and dimensions',
      'View generation history',
      'Edit and refine prompts',
      'Use Gemini or Leonardo for generation',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'initialPrompt', type: 'string' as const, description: 'Pre-filled image prompt.' },
        { name: 'sourceImageUrl', type: 'string' as const, description: 'Source image for transformation.' },
      ],
    },
    outputs: [
      { name: 'generatedImageUrl', type: 'string', description: 'URL of the generated image' },
    ],
    useCases: [
      'User wants to generate character or scene images',
      'User is creating visual assets for the story',
      'User wants to visualize a scene or character',
    ],
    suggestedCompanions: ['image-canvas', 'art-style'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full generator with prompt editor, settings, history, and preview' },
      compact: { minWidth: 250, minHeight: 180, description: 'Prompt input + generate button with small preview' },
      micro: { minWidth: 100, minHeight: 48, description: 'Generate button badge with last image thumbnail' },
    },
    dataSliceExamples: [
      { scenario: 'Pre-fill prompt for character', dataSlice: { entityId: 'char-123', view: 'character-portrait' } },
    ],
  },

  'storyboard': {
    type: 'storyboard',
    label: 'Storyboard',
    icon: Film,
    iconName: 'Film',
    importFn: () => import('../panels/image/StoryboardPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 320,
    domains: ['image', 'scene'],
    complexity: 'medium',
    description: 'Visual storyboard showing scene images in sequence for visual narrative planning.',
    capabilities: [
      'Display scene images in narrative sequence',
      'Visual story flow overview',
      'Navigate to scenes from thumbnails',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants a visual narrative overview',
      'User is planning visual story flow',
      'Companion for scene editing with visual reference',
    ],
    suggestedCompanions: ['scene-editor', 'image-generator'],
    densityModes: {
      full: { minWidth: 320, minHeight: 250, description: 'Sequential storyboard with thumbnails and scene labels' },
      compact: { minWidth: 200, minHeight: 120, description: 'Filmstrip view with small thumbnails' },
      micro: { minWidth: 80, minHeight: 48, description: 'Frame count badge' },
    },
  },

  // ─── Reader ─────────────────────────────────────
  'reader-view': {
    type: 'reader-view',
    label: 'Reader View',
    icon: BookOpen,
    iconName: 'BookOpen',
    importFn: () => import('../panels/story/ReaderViewPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 400,
    domains: ['story'],
    complexity: 'medium',
    description: 'Interactive story simulation panel for walking through branching narratives as a reader. Shows scene text with clickable choices, evaluates conditions, tracks variables with localStorage persistence, and supports full path rewind.',
    capabilities: [
      'Branching story simulation from reader perspective',
      'Clickable choice buttons with condition evaluation',
      'Variable state tracking with localStorage persistence',
      'Path history with rewind to any previous choice point',
      'Dead-end and ending detection',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string' as const, description: 'Project to simulate. Falls back to store selection.', source: 'store:projectSlice.selectedProject' },
      ],
    },
    outputs: [
      { name: 'currentSceneId', type: 'string', description: 'Currently displayed scene in simulation' },
      { name: 'pathHistory', type: 'PathStep[]', description: 'Full path history of the simulation run' },
    ],
    useCases: [
      'User wants to experience their branching story as a reader',
      'User wants to test all story paths and choices',
      'User wants to verify branching logic and conditions work correctly',
      'User wants to playtest story pacing and flow',
    ],
    suggestedCompanions: ['story-graph', 'beats-sidebar'],
    densityModes: {
      full: { minWidth: 500, minHeight: 400, description: 'Full reading experience with scene text, choices, variable sidebar, and path history' },
      compact: { minWidth: 300, minHeight: 250, description: 'Scene text with choice buttons, no variable sidebar' },
      micro: { minWidth: 80, minHeight: 40, description: 'Current scene name badge' },
    },
  },

  // ─── Narrative Intelligence ─────────────────────
  'narrative-suggestions': {
    type: 'narrative-suggestions',
    label: 'Narrative Suggestions',
    icon: Sparkles,
    iconName: 'Sparkles',
    importFn: () => import('../panels/story/NarrativeSuggestionsPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 240,
    domains: ['story'],
    complexity: 'low',
    description: 'AI-driven narrative suggestion sidebar showing prioritized insight cards from the StoryAnalyzer. Detects relationship tensions, plot gaps, pacing issues, and continuity problems without LLM calls.',
    capabilities: [
      'AI-driven narrative suggestions based on story data analysis',
      'Relationship tension detection between rival/enemy characters',
      'Plot gap detection for acts without beats',
      'Pacing analysis for flat narrative stretches',
      'One-click workspace composition from insight actions',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string' as const, description: 'Project to analyze. Falls back to store selection.', source: 'store:projectSlice.selectedProject' },
      ],
    },
    outputs: [
      { name: 'insights', type: 'MuseInsight[]', description: 'Prioritized narrative insights with actionable suggestions' },
    ],
    useCases: [
      'User wants creative suggestions for their story',
      'User wants to find narrative gaps or issues',
      'User wants AI-powered story analysis without explicit prompting',
      'User wants to discover character relationship opportunities',
    ],
    suggestedCompanions: ['scene-editor', 'character-cards', 'beats-manager'],
    densityModes: {
      full: { minWidth: 280, minHeight: 400, description: 'Full suggestion cards with category badges, priority indicators, and apply/dismiss actions' },
      compact: { minWidth: 200, minHeight: 200, description: 'Condensed insight list with titles and priority dots' },
      micro: { minWidth: 80, minHeight: 40, description: 'Suggestion count badge' },
    },
  },

  // ─── Voice ───────────────────────────────────────
  'voice-manager': {
    type: 'voice-manager',
    label: 'Voices',
    icon: Mic,
    iconName: 'Mic',
    importFn: () => import('../panels/primitives/adapters/VoiceManagerAdapter'),
    defaultRole: 'primary',
    sizeClass: 'standard',
    minWidth: 300,
    domains: ['voice'],
    complexity: 'medium',
    description: 'Voice profile management for characters with voice description, sample references, and TTS configuration.',
    capabilities: [
      'Manage character voice profiles',
      'Define voice descriptions and characteristics',
      'Configure TTS settings per character',
      'Preview voice samples',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants to define character voices',
      'User is setting up voice production',
      'User wants to manage audio casting',
    ],
    suggestedCompanions: ['voice-casting', 'character-cards'],
    entityHint: { entity: 'voice', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full voice profile list with settings, samples, and TTS config' },
      compact: { minWidth: 200, minHeight: 120, description: 'Voice name list with character assignment' },
      micro: { minWidth: 80, minHeight: 48, description: 'Voice count badge' },
    },
  },

  'voice-casting': {
    type: 'voice-casting',
    label: 'Voice Casting',
    icon: Users,
    iconName: 'Users',
    importFn: () => import('../panels/audio/VoiceCastingPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 350,
    domains: ['voice'],
    complexity: 'medium',
    description: 'Match characters to voice profiles with audition comparison and casting decisions.',
    capabilities: [
      'Assign voice profiles to characters',
      'Compare voice options per character',
      'Manage casting decisions',
      'Preview voice matches',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User is assigning voices to characters',
      'User wants to audition voices for roles',
      'Voice production casting workflow',
    ],
    suggestedCompanions: ['voice-manager', 'character-cards'],
    densityModes: {
      full: { minWidth: 350, minHeight: 250, description: 'Casting grid with character-voice pairings, audition buttons' },
      compact: { minWidth: 220, minHeight: 120, description: 'Simple assignment list: character \u2192 voice' },
      micro: { minWidth: 80, minHeight: 48, description: 'Cast progress badge (e.g. "6/10 cast")' },
    },
  },

  'audio-production': {
    type: 'audio-production',
    label: 'Audio Production',
    icon: AudioLines,
    iconName: 'AudioLines',
    importFn: () => import('../panels/audio/AudioProductionPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 450,
    domains: ['voice', 'scene'],
    complexity: 'high',
    description: 'Unified audio production panel for script dialogue and narration. Use dataSlice.view="script" for script-focused mode or dataSlice.view="performance" (default) for narration with voice performance controls.',
    capabilities: [
      'Display scene script with dialogue markup',
      'Add voice direction annotations',
      'Edit narration text for scenes',
      'Preview narration audio with voice performance tuning',
      'Manage narration timing and pacing',
      'Speaker-attributed line display',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string' as const, description: 'Scene for script view.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User is preparing script for voice recording',
      'User wants dialogue with voice direction notes',
      'User is writing or editing narration',
      'User wants to add voice-over to scenes',
      'Audio production narration workflow',
    ],
    suggestedCompanions: ['voice-manager', 'voice-performance'],
    densityModes: {
      full: { minWidth: 450, minHeight: 300, description: 'Full script/narration editor with voice controls and speaker markers' },
      compact: { minWidth: 280, minHeight: 180, description: 'Script lines with speaker names, basic playback' },
      micro: { minWidth: 100, minHeight: 48, description: 'Audio production status badge' },
    },
    dataSliceExamples: [
      { scenario: 'Script-focused mode for voice recording prep', dataSlice: { view: 'script' } },
      { scenario: 'Narration mode with performance controls', dataSlice: { view: 'performance' } },
      { scenario: 'Script for a specific scene', dataSlice: { entityId: 'scene-123', view: 'script' } },
    ],
  },

  'voice-performance': {
    type: 'voice-performance',
    label: 'Voice Performance',
    icon: SlidersHorizontal,
    iconName: 'SlidersHorizontal',
    importFn: () => import('../panels/audio/VoicePerformancePanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 260,
    domains: ['voice'],
    complexity: 'low',
    description: 'Voice performance controls for adjusting delivery parameters like pace, emotion, emphasis, and style.',
    capabilities: [
      'Adjust voice delivery parameters',
      'Set emotion and emphasis levels',
      'Control speaking pace and pauses',
      'Preview performance adjustments',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User is fine-tuning voice delivery',
      'User wants to control narration performance',
      'Sidebar for voice production refinement',
    ],
    suggestedCompanions: ['audio-production', 'voice-manager'],
    entityHint: { entity: 'voice', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 260, minHeight: 200, description: 'Full slider controls for pace, emotion, emphasis, and preview' },
      compact: { minWidth: 160, minHeight: 100, description: 'Key sliders (pace, emotion) only' },
      micro: { minWidth: 80, minHeight: 48, description: 'Current emotion badge' },
    },
  },

  'audio-toolbar': {
    type: 'audio-toolbar',
    label: 'Audio',
    icon: AudioLines,
    iconName: 'AudioLines',
    importFn: () => import('../panels/primitives/adapters/AudioToolbarAdapter'),
    defaultRole: 'tertiary',
    sizeClass: 'compact',
    minWidth: 400,
    domains: ['sound'],
    complexity: 'low',
    description: 'Compact audio stats dashboard showing clip count, total duration, voice assignments, and export status with quick actions.',
    capabilities: [
      'Audio production stats (clips, duration, voice assignments, exports)',
      'Quick-action buttons to open narration and export audio',
      'Density-aware rendering (micro badge, compact 2-pill, full 4-pill + actions)',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'At-a-glance audio production status',
      'Quick access to narration and export workflows',
      'Compact audio overview in studio layout',
    ],
    suggestedCompanions: ['audio-production', 'voice-manager'],
    entityHint: { entity: 'voice', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 400, minHeight: 80, description: 'All 4 stat pills (clips, duration, voices, exports) plus quick-action buttons' },
      compact: { minWidth: 200, minHeight: 48, description: '2 stat pills (clips + duration)' },
      micro: { minWidth: 60, minHeight: 36, description: 'Clip count badge only' },
    },
  },

  // ─── Combined / Composite ──────────────────────────
  'writing-desk': {
    type: 'writing-desk',
    label: 'Writing Desk',
    icon: FileText,
    iconName: 'FileText',
    importFn: () => import('../panels/story/WritingDeskPanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    minWidth: 500,
    domains: ['scene', 'story'],
    complexity: 'high',
    description: 'Multi-tab workspace combining content editor, block editor, and image view in a tabbed interface.',
    capabilities: [
      'Tabbed interface: Content, Blocks, Image',
      'Full content editing in content tab',
      'Block-based editing in blocks tab',
      'Image preview and management in image tab',
    ],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string' as const, description: 'Scene to work on.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants a comprehensive writing environment',
      'User prefers tabbed editing over multiple panels',
      'All-in-one scene creation workflow',
    ],
    suggestedCompanions: ['scene-list', 'character-cards'],
    densityModes: {
      full: { minWidth: 500, minHeight: 300, description: 'Full tabbed workspace with all three tabs and editing tools' },
      compact: { minWidth: 300, minHeight: 200, description: 'Single active tab with minimal toolbar' },
      micro: { minWidth: 120, minHeight: 48, description: 'Scene name + word count badge' },
    },
    dataSliceExamples: [
      { scenario: 'Open writing desk for specific scene', dataSlice: { entityId: 'scene-123' } },
      { scenario: 'Open to image tab', dataSlice: { entityId: 'scene-123', view: 'image' } },
    ],
  },

  // ─── Agent ───────────────────────────────────────
  'advisor': {
    type: 'advisor',
    label: 'Advisor',
    icon: Bot,
    iconName: 'Bot',
    importFn: () => import('../panels/assistant/AdvisorPanel'),
    defaultRole: 'sidebar',
    sizeClass: 'compact',
    minWidth: 280,
    domains: [] as SkillDomain[],
    complexity: 'low',
    description: 'AI advisor panel with Gemini Live chat, proactive workspace suggestions, and creative guidance. Observes workspace state and offers contextual help.',
    capabilities: [
      'Chat with Gemini Live AI advisor',
      'Receive proactive workspace composition suggestions',
      'Get creative writing tips and guidance',
      'Toggle workspace observation on/off',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants AI guidance or creative suggestions',
      'User wants proactive workspace arrangement advice',
      'User wants a persistent AI assistant in the sidebar',
    ],
    suggestedCompanions: ['scene-editor', 'character-detail', 'story-map'],
    densityModes: {
      full: { minWidth: 280, minHeight: 200, description: 'Full chat interface with message history and observation toggle' },
      compact: { minWidth: 180, minHeight: 100, description: 'Last message + input field only' },
      micro: { minWidth: 60, minHeight: 48, description: 'AI status indicator dot (connected/disconnected)' },
    },
  },

  // ─── System ──────────────────────────────────────
  'audit-log': {
    type: 'audit-log',
    label: 'Audit Log',
    icon: ScrollText,
    iconName: 'ScrollText',
    importFn: () => import('../panels/system/AuditLogPanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 320,
    domains: ['utility'],
    complexity: 'low',
    description: 'Browseable audit trail of all MCP tool invocations with full inputs, outputs, timing, and success/failure status. Supports filtering by tool name and status, session replay, and pagination.',
    capabilities: [
      'Browse all MCP tool call history',
      'Filter by tool name and success/failure',
      'View full input parameters and output data',
      'View timing and duration for each call',
      'Paginate through large histories',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [],
    useCases: [
      'User wants to review what MCP tools were called',
      'User wants to debug failed tool calls',
      'User wants to replay a previous tool call sequence',
      'User wants to see tool call timing and performance',
    ],
    suggestedCompanions: ['advisor'],
    densityModes: {
      full: { minWidth: 320, minHeight: 250, description: 'Full audit log with filters, expandable entries, and pagination' },
      compact: { minWidth: 200, minHeight: 120, description: 'Recent entries list with status badges' },
      micro: { minWidth: 80, minHeight: 48, description: 'Call count badge with success/fail ratio' },
    },
  },

  'creative-timeline': {
    type: 'creative-timeline',
    label: 'Creative Timeline',
    icon: History,
    iconName: 'History',
    importFn: () => import('../panels/story/CreativeTimelinePanel'),
    defaultRole: 'secondary',
    sizeClass: 'standard',
    minWidth: 280,
    domains: ['story'] as SkillDomain[],
    complexity: 'medium',
    description: 'Time-lapse of the creative process showing how the story was built over time. Browse event history, scrub through timeline, and watch the narrative structure graph evolve.',
    capabilities: [
      'Browse full creative history of the project',
      'See chronological events: character created, scene added, beat linked, etc.',
      'Scrub through timeline to see story structure at any point in time',
      'Replay the creative process as an animation',
      'Live dependency graph visualization showing entity relationships',
      'Day-grouped event list with entity type filtering',
    ],
    inputSchema: { required: [], optional: [] },
    outputs: [
      { name: 'selectedEventIndex', type: 'number', description: 'Currently scrubbed event index' },
    ],
    useCases: [
      'User wants to see how their story was built over time',
      'User wants to review the creative process',
      'User wants to see story structure evolution',
      'User wants to compare current vs earlier story graph state',
    ],
    suggestedCompanions: ['story-map', 'story-evaluator', 'beats-manager'],
    densityModes: {
      full: { minWidth: 280, minHeight: 300, description: 'Timeline list + dependency graph + scrubber controls' },
      compact: { minWidth: 200, minHeight: 150, description: 'Timeline event list without graph' },
      micro: { minWidth: 80, minHeight: 48, description: 'Event count badge with entity type breakdown' },
    },
    dataSliceExamples: [
      { scenario: 'View full creative history', dataSlice: {} },
      { scenario: 'Focus on character events', dataSlice: { filter: 'entity:character' } },
    ],
  },

  'empty-welcome': {
    type: 'empty-welcome',
    label: 'Welcome',
    icon: Sparkles,
    iconName: 'Sparkles',
    importFn: () => import('../panels/shared/EmptyWelcomePanel'),
    defaultRole: 'primary',
    sizeClass: 'wide',
    domains: [] as SkillDomain[],
    complexity: 'low',
    // No manifest fields — excluded from PANEL_MANIFESTS
  },
} satisfies Record<string, UnifiedPanelDef>;

// ─── Derived Type ────────────────────────────────────────────────────────────

/** All panel type identifiers, derived from the unified definitions */
export type WorkspacePanelType = keyof typeof _PANEL_DEFS;

// ─── Manifest Derivation ─────────────────────────────────────────────────────

function toManifest(d: UnifiedPanelDef): PanelManifest | undefined {
  if (!d.description) return undefined;
  return {
    type: d.type,
    label: d.label,
    description: d.description,
    capabilities: d.capabilities ?? [],
    domains: d.domains as string[],
    inputSchema: d.inputSchema ?? { required: [], optional: [] },
    outputs: d.outputs ?? [],
    useCases: d.useCases ?? [],
    layout: {
      defaultRole: d.defaultRole,
      sizeClass: d.sizeClass,
      minWidth: d.minWidth ?? 200,
    },
    complexity: d.complexity,
    icon: d.iconName,
    ...(d.suggestedCompanions && { suggestedCompanions: d.suggestedCompanions }),
    ...(d.entityHint && { entityHint: d.entityHint }),
    ...(d.densityModes && { densityModes: d.densityModes }),
    ...(d.dataSliceExamples && { dataSliceExamples: d.dataSliceExamples }),
  };
}

/** Panel manifests derived from unified definitions — for LLM composition */
const _allDefs: UnifiedPanelDef[] = Object.values(_PANEL_DEFS);
export const PANEL_MANIFESTS: PanelManifest[] = _allDefs
  .filter((d): d is UnifiedPanelDef & { description: string } => !!d.description)
  .map(d => toManifest(d)!);

// ─── Registry Derivation ─────────────────────────────────────────────────────

/** Public registry entry — backward-compatible with the old PanelRegistryEntry */
export interface PanelRegistryEntry {
  type: WorkspacePanelType;
  label: string;
  icon: LucideIcon;
  importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
  defaultRole: PanelRole;
  sizeClass: PanelSizeClass;
  minWidth?: number;
  domains: SkillDomain[];
  complexity: PanelComplexity;
  manifest?: PanelManifest;
}

/** Typed registry derived from unified definitions */
export const PANEL_REGISTRY: Record<WorkspacePanelType, PanelRegistryEntry> = Object.fromEntries(
  _allDefs.map(d => [d.type, {
    type: d.type as WorkspacePanelType,
    label: d.label,
    icon: d.icon,
    importFn: d.importFn,
    defaultRole: d.defaultRole,
    sizeClass: d.sizeClass,
    minWidth: d.minWidth,
    domains: d.domains,
    complexity: d.complexity,
    manifest: toManifest(d),
  }]),
) as Record<WorkspacePanelType, PanelRegistryEntry>;

export function getPanelEntry(type: WorkspacePanelType): PanelRegistryEntry | undefined {
  return PANEL_REGISTRY[type];
}
