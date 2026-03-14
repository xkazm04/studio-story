/**
 * Panel Manifests — Machine-readable descriptions of all workspace panels.
 *
 * The LLM reads these to decide which panels to compose for the user's request.
 * Each manifest describes capabilities, inputs, outputs, and use cases in natural
 * language that an LLM can reason about.
 */

import type { PanelManifest } from './types';

export const PANEL_MANIFESTS: PanelManifest[] = [
  // ─── Scene Domain ───────────────────────────────────────
  {
    type: 'scene-editor',
    label: 'Scene Editor',
    description: 'Block-based editor for composing scenes with screenplay formatting, supporting scene headers, action, dialogue, direction, and beat blocks.',
    capabilities: [
      'Edit scene content with structured block syntax',
      'Select speakers from project characters for dialogue blocks',
      'Link beat references to story beats',
      'Auto-save content to database',
      'Context menu for adding new block types',
    ],
    domains: ['scene'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string', description: 'Scene to edit. Falls back to store selection.', source: 'store:projectSlice.selectedScene' },
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
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'FileText',
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
  {
    type: 'scene-metadata',
    label: 'Scene Details',
    description: 'Displays and edits scene metadata including name, location, time of day, weather, mood, and description.',
    capabilities: [
      'View and edit scene name and location',
      'Set time of day and weather conditions',
      'Edit scene description and mood',
      'View assigned characters and beats',
    ],
    domains: ['scene'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string', description: 'Scene to display metadata for.', source: 'store:projectSlice.selectedScene' },
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
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 240 },
    complexity: 'low',
    icon: 'Info',
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
  {
    type: 'dialogue-view',
    label: 'Dialogue',
    description: 'Focused view of scene dialogue with character avatars, showing conversation flow in a chat-like format.',
    capabilities: [
      'Display dialogue lines with character attribution',
      'Show character avatars alongside dialogue',
      'Filter dialogue by character',
      'Export dialogue as text',
    ],
    domains: ['scene'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string', description: 'Scene to show dialogue from.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to review conversation flow',
      'User is focused on dialogue quality',
      'User wants to see character interactions',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 300 },
    complexity: 'medium',
    icon: 'MessageCircle',
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
  {
    type: 'scene-list',
    label: 'Scene List',
    description: 'Sidebar list of all scenes in the current act, with selection, reordering, and quick creation.',
    capabilities: [
      'List all scenes in the selected act',
      'Select scene to open in other panels',
      'Create new scenes',
      'Reorder scenes via drag and drop',
      'Show scene completion status',
    ],
    domains: ['scene'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'actId', type: 'string', description: 'Act to filter scenes.', source: 'store:projectSlice.selectedAct' },
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
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 220 },
    complexity: 'low',
    icon: 'FileText',
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
  {
    type: 'scene-gallery',
    label: 'Scene Gallery',
    description: 'Visual gallery of scene images and thumbnails for the current project or act.',
    capabilities: [
      'Display scene images in a grid',
      'View image details and prompts',
      'Navigate to scene from image',
    ],
    domains: ['scene'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants a visual overview of scenes',
      'User is reviewing scene imagery',
      'Companion panel in studio layout',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'compact', minWidth: 400 },
    complexity: 'low',
    icon: 'Film',
    suggestedCompanions: ['scene-editor', 'image-generator'],
    entityHint: { entity: 'scene', defaultView: 'card-grid' },
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Image grid with thumbnails, names, and prompts' },
      compact: { minWidth: 200, minHeight: 150, description: 'Smaller thumbnail grid, no text' },
      micro: { minWidth: 100, minHeight: 48, description: 'Image count badge with tiny preview' },
    },
  },

  // ─── Character Domain ───────────────────────────────────
  {
    type: 'character-cards',
    label: 'Characters',
    description: 'Grid or list of all project characters with avatars, types, and faction badges. Click to select for detail view.',
    capabilities: [
      'Display all characters in the project',
      'Filter by faction or character type',
      'Select character for detail editing',
      'Show character avatars and brief info',
      'Create new characters',
    ],
    domains: ['character'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string', description: 'Project to load characters from.', source: 'store:projectSlice.selectedProject' },
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
    layout: { defaultRole: 'secondary', sizeClass: 'compact', minWidth: 280 },
    complexity: 'low',
    icon: 'Users',
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
  {
    type: 'character-detail',
    label: 'Character Detail',
    description: 'Full character profile editor with backstory, traits, appearance, voice, faction role, and relationships.',
    capabilities: [
      'View and edit character name, type, and backstory',
      'Manage character traits and personality',
      'Edit appearance descriptions',
      'Set voice and speaking style',
      'View and edit faction membership and role',
      'See character relationships',
    ],
    domains: ['character'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'characterId', type: 'string', description: 'Character to display.', source: 'store:characterSlice.selectedCharacter' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to create or edit a character in depth',
      'User wants to review character backstory or traits',
      'CLI generated character data that needs review',
      'User is developing character personality',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'User',
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
  {
    type: 'character-creator',
    label: 'Character Creator',
    description: 'Visual character design tool with category-based options for body, face, clothing, and environment selection.',
    capabilities: [
      'Visual character appearance builder',
      'Category-based option selection (body, face, clothing)',
      'Preview character design',
      'Generate character images from design',
    ],
    domains: ['character'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'characterId', type: 'string', description: 'Character to design for.' },
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
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 560 },
    complexity: 'high',
    icon: 'Paintbrush',
    suggestedCompanions: ['character-cards', 'image-generator'],
    densityModes: {
      full: { minWidth: 560, minHeight: 400, description: 'Full visual builder with category panels, preview, and generation' },
      compact: { minWidth: 300, minHeight: 200, description: 'Simplified options with small preview' },
    },
  },

  {
    type: 'relationship-map',
    label: 'Relationship Map',
    description: 'Interactive visual graph of character relationships and faction dynamics using ReactFlow. Shows character nodes grouped by faction with colored edges for relationship types. Read-only -- relationships are created via chat.',
    capabilities: [
      'Visualize character connections',
      'Show faction clusters',
      'Filter by relationship type',
      'Pan and zoom navigation',
      'Click to focus character',
    ],
    domains: ['character'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string', description: 'Project to show relationships for.', source: 'store:projectSlice.selectedProject' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to see character connections',
      'User asks about faction dynamics',
      'User wants to understand relationship networks',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'Network',
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

  // ─── Story Domain ───────────────────────────────────────
  {
    type: 'story-map',
    label: 'Story Map',
    description: 'Visual overview of story structure showing acts and their scenes in a hierarchical tree or timeline view.',
    capabilities: [
      'Visualize act/scene hierarchy',
      'Navigate to acts and scenes',
      'See story progression overview',
      'Identify gaps in story structure',
    ],
    domains: ['story'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants to see the overall story structure',
      'User is planning story arc and pacing',
      'User needs a high-level overview of their project',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 300 },
    complexity: 'medium',
    icon: 'Map',
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
  {
    type: 'beats-manager',
    label: 'Beats',
    description: 'Full beat management with creation, editing, ordering, type assignment, and completion tracking for narrative beats.',
    capabilities: [
      'Create, edit, and delete story beats',
      'Assign beat types (setup, conflict, resolution, climax, transition)',
      'Reorder beats via drag and drop',
      'Mark beats as complete',
      'Link beats to scenes',
      'View beat descriptions and dependencies',
    ],
    domains: ['story'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'actId', type: 'string', description: 'Act to manage beats for.', source: 'store:projectSlice.selectedAct' },
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
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'ListChecks',
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
  {
    type: 'story-evaluator',
    label: 'Evaluator',
    description: 'Story quality analysis showing pacing scores, theme consistency, character arc coverage, and structural completeness.',
    capabilities: [
      'Analyze story pacing and rhythm',
      'Check theme consistency across acts',
      'Evaluate character arc completeness',
      'Score structural balance',
      'Provide improvement suggestions',
    ],
    domains: ['story'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants to evaluate story quality',
      'User is reviewing story for weaknesses',
      'User wants AI analysis of their narrative',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 350 },
    complexity: 'medium',
    icon: 'BarChart3',
    suggestedCompanions: ['story-map', 'beats-manager'],
    densityModes: {
      full: { minWidth: 350, minHeight: 250, description: 'Full evaluation dashboard with pacing graph, scores, and suggestions' },
      compact: { minWidth: 200, minHeight: 120, description: 'Summary scores with color-coded ratings' },
      micro: { minWidth: 80, minHeight: 48, description: 'Overall score badge (e.g. "B+")' },
    },
  },
  {
    type: 'story-graph',
    label: 'Story Graph',
    description: 'Interactive node-based graph visualization of story elements using ReactFlow, showing relationships between beats, scenes, and characters.',
    capabilities: [
      'Interactive node graph of story elements',
      'Visualize connections between beats, scenes, characters',
      'Zoom and pan navigation',
      'Click nodes to navigate to elements',
      'Auto-layout with dagre algorithm',
    ],
    domains: ['story'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants to visualize story connections',
      'User is analyzing narrative dependencies',
      'User wants a visual story architecture view',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'GitBranch',
    suggestedCompanions: ['beats-manager', 'story-map'],
    densityModes: {
      full: { minWidth: 400, minHeight: 300, description: 'Full interactive ReactFlow graph with zoom, pan, and clickable nodes' },
      compact: { minWidth: 250, minHeight: 180, description: 'Static minimap view of the graph, no interaction' },
      micro: { minWidth: 100, minHeight: 48, description: 'Node count badge (e.g. "24 nodes, 38 edges")' },
    },
  },
  {
    type: 'script-editor',
    label: 'Script',
    description: 'Rich text script editor with TipTap, supporting screenplay format with speaker attribution and stage directions.',
    capabilities: [
      'Rich text editing with TipTap',
      'Screenplay formatting support',
      'Speaker attribution',
      'Stage direction blocks',
      'Auto-save',
    ],
    domains: ['scene', 'story'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string', description: 'Scene to edit script for.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to write formatted screenplay content',
      'User prefers rich text over block-based editing',
      'User is writing stage directions and dialogue',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'FileText',
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
  {
    type: 'theme-manager',
    label: 'Themes',
    description: 'Manage story themes, motifs, and symbols with tracking of how they appear across acts and scenes.',
    capabilities: [
      'Create and edit story themes',
      'Track theme presence across scenes',
      'Manage motifs and symbols',
      'View theme coverage analysis',
    ],
    domains: ['story'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants to manage story themes',
      'User is tracking motifs and symbolism',
      'User wants thematic consistency analysis',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'compact', minWidth: 280 },
    complexity: 'medium',
    icon: 'Sparkles',
    suggestedCompanions: ['story-evaluator', 'story-map'],
    densityModes: {
      full: { minWidth: 280, minHeight: 200, description: 'Theme list with coverage charts and scene links' },
      compact: { minWidth: 180, minHeight: 120, description: 'Theme names with color-coded coverage dots' },
      micro: { minWidth: 80, minHeight: 48, description: 'Theme count badge' },
    },
  },
  {
    type: 'beats-sidebar',
    label: 'Beats Sidebar',
    description: 'Compact beat list sidebar for quick navigation and beat selection while working in other panels.',
    capabilities: [
      'Compact beat list for navigation',
      'Select beat for other panels',
      'View beat status at a glance',
    ],
    domains: ['story', 'scene'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [
      { name: 'selectedBeatId', type: 'string', description: 'Selected beat ID' },
    ],
    useCases: [
      'Sidebar companion for scene editing',
      'Quick beat navigation while writing',
      'Studio layout beat reference',
    ],
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 200 },
    complexity: 'low',
    icon: 'ListChecks',
    suggestedCompanions: ['scene-editor', 'script-editor'],
    entityHint: { entity: 'beat', defaultView: 'data-list' },
    densityModes: {
      full: { minWidth: 200, minHeight: 150, description: 'Scrollable beat list with type badges and selection' },
      compact: { minWidth: 140, minHeight: 100, description: 'Beat names only, single-line rows' },
      micro: { minWidth: 60, minHeight: 48, description: 'Beat progress chip (e.g. "3/8")' },
    },
  },

  // ─── Image Domain ───────────────────────────────────────
  {
    type: 'art-style',
    label: 'Art Style',
    description: 'Art style reference panel for defining and previewing the visual style of the project.',
    capabilities: [
      'Define project art style and references',
      'Preview style settings',
      'Set color palettes and visual direction',
    ],
    domains: ['image'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User is setting up visual direction for the project',
      'User wants to define art style for image generation',
      'Companion for image generation workflow',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 300 },
    complexity: 'medium',
    icon: 'Palette',
    suggestedCompanions: ['image-generator', 'image-canvas'],
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full style editor with color palette, reference images, and settings' },
      compact: { minWidth: 180, minHeight: 120, description: 'Style preview thumbnail with palette strip' },
      micro: { minWidth: 80, minHeight: 48, description: 'Style name badge with color dot' },
    },
  },
  {
    type: 'image-canvas',
    label: 'Image Canvas',
    description: 'Image viewing and comparison canvas for reviewing generated images side by side.',
    capabilities: [
      'Display generated images',
      'Side-by-side comparison',
      'Zoom and pan on images',
      'Image selection for further editing',
    ],
    domains: ['image'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'imageUrl', type: 'string', description: 'Initial image to display.' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants to review generated images',
      'User is comparing image variations',
      'Image display alongside generator',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 300 },
    complexity: 'medium',
    icon: 'Image',
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
  {
    type: 'image-generator',
    label: 'Image Generator',
    description: 'AI image generation interface with prompt editing, aspect ratio control, and generation history.',
    capabilities: [
      'Generate images from text prompts',
      'Set aspect ratios and dimensions',
      'View generation history',
      'Edit and refine prompts',
      'Use Gemini or Leonardo for generation',
    ],
    domains: ['image'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'initialPrompt', type: 'string', description: 'Pre-filled image prompt.' },
        { name: 'sourceImageUrl', type: 'string', description: 'Source image for transformation.' },
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
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 400 },
    complexity: 'high',
    icon: 'ImagePlus',
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

  // ─── Voice Domain ───────────────────────────────────────
  {
    type: 'voice-manager',
    label: 'Voices',
    description: 'Voice profile management for characters with voice description, sample references, and TTS configuration.',
    capabilities: [
      'Manage character voice profiles',
      'Define voice descriptions and characteristics',
      'Configure TTS settings per character',
      'Preview voice samples',
    ],
    domains: ['voice'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants to define character voices',
      'User is setting up voice production',
      'User wants to manage audio casting',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'standard', minWidth: 300 },
    complexity: 'medium',
    icon: 'Mic',
    suggestedCompanions: ['voice-casting', 'character-cards'],
    entityHint: { entity: 'voice', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 300, minHeight: 250, description: 'Full voice profile list with settings, samples, and TTS config' },
      compact: { minWidth: 200, minHeight: 120, description: 'Voice name list with character assignment' },
      micro: { minWidth: 80, minHeight: 48, description: 'Voice count badge' },
    },
  },
  {
    type: 'voice-casting',
    label: 'Voice Casting',
    description: 'Match characters to voice profiles with audition comparison and casting decisions.',
    capabilities: [
      'Assign voice profiles to characters',
      'Compare voice options per character',
      'Manage casting decisions',
      'Preview voice matches',
    ],
    domains: ['voice'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User is assigning voices to characters',
      'User wants to audition voices for roles',
      'Voice production casting workflow',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 350 },
    complexity: 'medium',
    icon: 'Users',
    suggestedCompanions: ['voice-manager', 'character-cards'],
    densityModes: {
      full: { minWidth: 350, minHeight: 250, description: 'Casting grid with character-voice pairings, audition buttons' },
      compact: { minWidth: 220, minHeight: 120, description: 'Simple assignment list: character → voice' },
      micro: { minWidth: 80, minHeight: 48, description: 'Cast progress badge (e.g. "6/10 cast")' },
    },
  },
  {
    type: 'script-dialog',
    label: 'Script & Dialog',
    description: 'Script and dialogue panel combining scene script view with voice direction annotations.',
    capabilities: [
      'Display scene script with dialogue markup',
      'Add voice direction annotations',
      'Mark up dialogue delivery notes',
      'Speaker-attributed line display',
    ],
    domains: ['voice', 'scene'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string', description: 'Scene for script view.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User is preparing script for voice recording',
      'User wants dialogue with voice direction notes',
      'Voice production script review',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 450 },
    complexity: 'high',
    icon: 'BookOpen',
    suggestedCompanions: ['voice-manager', 'voice-performance'],
    densityModes: {
      full: { minWidth: 450, minHeight: 300, description: 'Full script view with direction annotations and speaker markers' },
      compact: { minWidth: 280, minHeight: 180, description: 'Script lines with speaker names, no direction UI' },
      micro: { minWidth: 100, minHeight: 48, description: 'Line count badge' },
    },
    dataSliceExamples: [
      { scenario: 'Show script for specific scene', dataSlice: { entityId: 'scene-123' } },
    ],
  },
  {
    type: 'narration',
    label: 'Narration',
    description: 'Narration editor and player for managing voice-over narration across scenes with timing control.',
    capabilities: [
      'Edit narration text for scenes',
      'Preview narration audio',
      'Manage narration timing and pacing',
      'Link narration to scene beats',
    ],
    domains: ['voice'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User is writing or editing narration',
      'User wants to add voice-over to scenes',
      'Audio production narration workflow',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 500 },
    complexity: 'high',
    icon: 'AudioLines',
    suggestedCompanions: ['voice-manager', 'scene-editor'],
    densityModes: {
      full: { minWidth: 500, minHeight: 300, description: 'Full narration editor with timing controls, audio preview, beat links' },
      compact: { minWidth: 300, minHeight: 180, description: 'Text editor with basic playback controls' },
      micro: { minWidth: 100, minHeight: 48, description: 'Narration status badge with duration' },
    },
  },
  {
    type: 'voice-performance',
    label: 'Voice Performance',
    description: 'Voice performance controls for adjusting delivery parameters like pace, emotion, emphasis, and style.',
    capabilities: [
      'Adjust voice delivery parameters',
      'Set emotion and emphasis levels',
      'Control speaking pace and pauses',
      'Preview performance adjustments',
    ],
    domains: ['voice'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User is fine-tuning voice delivery',
      'User wants to control narration performance',
      'Sidebar for voice production refinement',
    ],
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 260 },
    complexity: 'low',
    icon: 'SlidersHorizontal',
    suggestedCompanions: ['narration', 'voice-manager'],
    entityHint: { entity: 'voice', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 260, minHeight: 200, description: 'Full slider controls for pace, emotion, emphasis, and preview' },
      compact: { minWidth: 160, minHeight: 100, description: 'Key sliders (pace, emotion) only' },
      micro: { minWidth: 80, minHeight: 48, description: 'Current emotion badge' },
    },
  },

  // ─── Composite/Studio ───────────────────────────────────
  {
    type: 'writing-desk',
    label: 'Writing Desk',
    description: 'Multi-tab workspace combining content editor, block editor, and image view in a tabbed interface.',
    capabilities: [
      'Tabbed interface: Content, Blocks, Image',
      'Full content editing in content tab',
      'Block-based editing in blocks tab',
      'Image preview and management in image tab',
    ],
    domains: ['scene', 'story'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'sceneId', type: 'string', description: 'Scene to work on.', source: 'store:projectSlice.selectedScene' },
      ],
    },
    outputs: [],
    useCases: [
      'User wants a comprehensive writing environment',
      'User prefers tabbed editing over multiple panels',
      'All-in-one scene creation workflow',
    ],
    layout: { defaultRole: 'primary', sizeClass: 'wide', minWidth: 500 },
    complexity: 'high',
    icon: 'FileText',
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
  {
    type: 'cast-sidebar',
    label: 'Cast',
    description: 'Compact character list sidebar showing cast members relevant to the current scene or context.',
    capabilities: [
      'Display scene-relevant characters',
      'Quick character selection',
      'Show character roles and avatars',
    ],
    domains: ['character', 'scene'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [
      { name: 'selectedCharacterId', type: 'string', description: 'Selected character ID' },
    ],
    useCases: [
      'Sidebar companion during scene writing',
      'Quick cast reference in studio layout',
      'Character selection for dialogue',
    ],
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 200 },
    complexity: 'low',
    icon: 'Users',
    suggestedCompanions: ['scene-editor', 'script-dialog'],
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
  {
    type: 'audio-toolbar',
    label: 'Audio',
    description: 'Compact audio control toolbar for playback, recording, and audio direction in studio layout.',
    capabilities: [
      'Audio playback controls',
      'Recording management',
      'Audio direction settings',
      'Transport controls (play, pause, stop)',
    ],
    domains: ['sound'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'Audio production workflow',
      'Top bar in studio layout for audio control',
      'Music and sound management',
    ],
    layout: { defaultRole: 'tertiary', sizeClass: 'compact', minWidth: 400 },
    complexity: 'low',
    icon: 'AudioLines',
    suggestedCompanions: ['narration', 'voice-manager'],
    entityHint: { entity: 'voice', defaultView: 'lazy-container' },
    densityModes: {
      full: { minWidth: 400, minHeight: 80, description: 'Full transport bar with play/pause/stop, timeline, and volume' },
      compact: { minWidth: 200, minHeight: 48, description: 'Play/pause + timeline, no volume' },
      micro: { minWidth: 60, minHeight: 36, description: 'Play/pause button only' },
    },
  },

  // ─── Storyboard ─────────────────────────────────────
  {
    type: 'storyboard',
    label: 'Storyboard',
    description: 'Visual storyboard showing scene images in sequence for visual narrative planning.',
    capabilities: [
      'Display scene images in narrative sequence',
      'Visual story flow overview',
      'Navigate to scenes from thumbnails',
    ],
    domains: ['image', 'scene'],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants a visual narrative overview',
      'User is planning visual story flow',
      'Companion for scene editing with visual reference',
    ],
    layout: { defaultRole: 'secondary', sizeClass: 'standard', minWidth: 320 },
    complexity: 'medium',
    icon: 'Film',
    suggestedCompanions: ['scene-editor', 'image-generator'],
    densityModes: {
      full: { minWidth: 320, minHeight: 250, description: 'Sequential storyboard with thumbnails and scene labels' },
      compact: { minWidth: 200, minHeight: 120, description: 'Filmstrip view with small thumbnails' },
      micro: { minWidth: 80, minHeight: 48, description: 'Frame count badge' },
    },
  },

  // ─── Agent ────────────────────────────────────────────
  {
    type: 'advisor',
    label: 'Advisor',
    description: 'AI advisor panel with Gemini Live chat, proactive workspace suggestions, and creative guidance. Observes workspace state and offers contextual help.',
    capabilities: [
      'Chat with Gemini Live AI advisor',
      'Receive proactive workspace composition suggestions',
      'Get creative writing tips and guidance',
      'Toggle workspace observation on/off',
    ],
    domains: [],
    inputSchema: {
      required: [],
      optional: [],
    },
    outputs: [],
    useCases: [
      'User wants AI guidance or creative suggestions',
      'User wants proactive workspace arrangement advice',
      'User wants a persistent AI assistant in the sidebar',
    ],
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 280 },
    complexity: 'low',
    icon: 'Bot',
    suggestedCompanions: ['scene-editor', 'character-detail', 'story-map'],
    densityModes: {
      full: { minWidth: 280, minHeight: 200, description: 'Full chat interface with message history and observation toggle' },
      compact: { minWidth: 180, minHeight: 100, description: 'Last message + input field only' },
      micro: { minWidth: 60, minHeight: 48, description: 'AI status indicator dot (connected/disconnected)' },
    },
  },

  // ─── Narrative Intelligence ─────────────────────
  {
    type: 'narrative-suggestions',
    label: 'Narrative Suggestions',
    description: 'AI-driven narrative suggestion sidebar showing prioritized insight cards from the StoryAnalyzer. Detects relationship tensions, plot gaps, pacing issues, and continuity problems without LLM calls.',
    capabilities: [
      'AI-driven narrative suggestions based on story data analysis',
      'Relationship tension detection between rival/enemy characters',
      'Plot gap detection for acts without beats',
      'Pacing analysis for flat narrative stretches',
      'One-click workspace composition from insight actions',
    ],
    domains: ['story'],
    inputSchema: {
      required: [],
      optional: [
        { name: 'projectId', type: 'string', description: 'Project to analyze. Falls back to store selection.', source: 'store:projectSlice.selectedProject' },
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
    layout: { defaultRole: 'sidebar', sizeClass: 'compact', minWidth: 240 },
    complexity: 'low',
    icon: 'Sparkles',
    suggestedCompanions: ['scene-editor', 'character-cards', 'beats-manager'],
    densityModes: {
      full: { minWidth: 280, minHeight: 400, description: 'Full suggestion cards with category badges, priority indicators, and apply/dismiss actions' },
      compact: { minWidth: 200, minHeight: 200, description: 'Condensed insight list with titles and priority dots' },
      micro: { minWidth: 80, minHeight: 40, description: 'Suggestion count badge' },
    },
  },
];
