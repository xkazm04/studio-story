/**
 * Mock Beats Data
 * Story beats with dependencies and pacing
 */

export interface Beat {
  id: string;
  project_id: string;
  act_id: string;
  name: string;
  type: string;
  description: string;
  order: number;
  paragraph_id?: string;
  paragraph_title?: string;
  completed: boolean;
  default_flag: boolean;
  duration?: number;
  estimated_duration?: number;
  pacing_score?: number;
  x_position?: number;
  y_position?: number;
  created_at: string;
  updated_at: string;
}

export interface BeatDependency {
  id: string;
  source_beat_id: string;
  target_beat_id: string;
  dependency_type: 'sequential' | 'parallel' | 'causal';
  strength: 'required' | 'suggested' | 'optional';
  created_at: string;
  updated_at: string;
}

export interface BeatPacingSuggestion {
  id: string;
  project_id: string;
  beat_id: string;
  suggestion_type: 'reorder' | 'adjust_duration' | 'merge' | 'split';
  suggested_order?: number;
  suggested_duration?: number;
  reasoning: string;
  confidence: number;
  applied: boolean;
  created_at: string;
}

export interface BeatSceneMapping {
  id: string;
  beat_id: string;
  scene_id: string | null;
  project_id: string;
  status: 'suggested' | 'accepted' | 'rejected' | 'modified';
  suggested_scene_name?: string;
  suggested_scene_description?: string;
  suggested_scene_script?: string;
  suggested_location?: string;
  semantic_similarity_score?: number;
  reasoning?: string;
  ai_model?: string;
  confidence_score?: number;
  user_feedback?: string;
  user_modified: boolean;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  rejected_at?: string;
}

// Beat types based on story structure
const BEAT_TYPES = [
  'opening',
  'inciting_incident',
  'rising_action',
  'turning_point',
  'climax',
  'falling_action',
  'resolution',
  'character_moment',
  'action_sequence',
  'dialogue',
  'exposition',
  'transition',
];

export const mockBeats: Beat[] = [
  // Act 1 Beats
  {
    id: 'beat-1',
    project_id: 'proj-1',
    act_id: 'act-1',
    name: 'World Introduction',
    type: 'opening',
    description: 'Establish the fantasy realm and its current state of peace',
    order: 1,
    paragraph_id: 'p-1',
    paragraph_title: 'The Calm Before',
    completed: true,
    default_flag: false,
    duration: 180,
    estimated_duration: 200,
    pacing_score: 0.7,
    x_position: 100,
    y_position: 100,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'beat-2',
    project_id: 'proj-1',
    act_id: 'act-1',
    name: 'Knight\'s Oath Ceremony',
    type: 'character_moment',
    description: 'Aldric takes his sacred oath to protect the realm',
    order: 2,
    paragraph_id: 'p-2',
    paragraph_title: 'The Oath',
    completed: true,
    default_flag: false,
    duration: 240,
    estimated_duration: 220,
    pacing_score: 0.8,
    x_position: 200,
    y_position: 100,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'beat-3',
    project_id: 'proj-1',
    act_id: 'act-1',
    name: 'Shadow Guild Mission',
    type: 'action_sequence',
    description: 'Lyra completes a dangerous assassination contract',
    order: 3,
    paragraph_id: 'p-3',
    paragraph_title: 'Shadows Move',
    completed: true,
    default_flag: false,
    duration: 300,
    estimated_duration: 280,
    pacing_score: 0.9,
    x_position: 300,
    y_position: 100,
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  },
  {
    id: 'beat-4',
    project_id: 'proj-1',
    act_id: 'act-1',
    name: 'Dragon Sighting',
    type: 'inciting_incident',
    description: 'Theron witnesses the return of dragons to the northern mountains',
    order: 4,
    paragraph_id: 'p-4',
    paragraph_title: 'Wings of Fire',
    completed: false,
    default_flag: true,
    duration: 200,
    estimated_duration: 200,
    pacing_score: 0.95,
    x_position: 400,
    y_position: 100,
    created_at: '2024-01-15T11:30:00Z',
    updated_at: '2024-01-15T11:30:00Z',
  },
  // Act 2 Beats
  {
    id: 'beat-5',
    project_id: 'proj-1',
    act_id: 'act-2',
    name: 'Forced Alliance',
    type: 'turning_point',
    description: 'Knight and assassin must work together despite their differences',
    order: 1,
    completed: false,
    default_flag: false,
    duration: 320,
    estimated_duration: 300,
    pacing_score: 0.85,
    x_position: 100,
    y_position: 200,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'beat-6',
    project_id: 'proj-1',
    act_id: 'act-2',
    name: 'Journey North',
    type: 'rising_action',
    description: 'The group travels through dangerous territory toward the dragon mountains',
    order: 2,
    completed: false,
    default_flag: false,
    duration: 400,
    estimated_duration: 450,
    pacing_score: 0.75,
    x_position: 200,
    y_position: 200,
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
  },
  {
    id: 'beat-7',
    project_id: 'proj-1',
    act_id: 'act-2',
    name: 'Discovery of Fortress',
    type: 'revelation',
    description: 'The hidden enemy fortress is revealed in the volcanic wasteland',
    order: 3,
    completed: false,
    default_flag: false,
    duration: 250,
    estimated_duration: 240,
    pacing_score: 0.9,
    x_position: 300,
    y_position: 200,
    created_at: '2024-01-16T12:00:00Z',
    updated_at: '2024-01-16T12:00:00Z',
  },
  // Act 3 Beats
  {
    id: 'beat-8',
    project_id: 'proj-1',
    act_id: 'act-3',
    name: 'Battle Preparation',
    type: 'rising_action',
    description: 'The heroes prepare their final assault on the fortress',
    order: 1,
    completed: false,
    default_flag: false,
    duration: 200,
    estimated_duration: 180,
    pacing_score: 0.8,
    x_position: 100,
    y_position: 300,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'beat-9',
    project_id: 'proj-1',
    act_id: 'act-3',
    name: 'Epic Confrontation',
    type: 'climax',
    description: 'The final battle between the heroes and the dragon lord',
    order: 2,
    completed: false,
    default_flag: false,
    duration: 600,
    estimated_duration: 550,
    pacing_score: 1.0,
    x_position: 200,
    y_position: 300,
    created_at: '2024-01-17T11:00:00Z',
    updated_at: '2024-01-17T11:00:00Z',
  },
  {
    id: 'beat-10',
    project_id: 'proj-1',
    act_id: 'act-3',
    name: 'Victory and Sacrifice',
    type: 'resolution',
    description: 'The realm is saved, but at great cost',
    order: 3,
    completed: false,
    default_flag: false,
    duration: 300,
    estimated_duration: 320,
    pacing_score: 0.85,
    x_position: 300,
    y_position: 300,
    created_at: '2024-01-17T12:00:00Z',
    updated_at: '2024-01-17T12:00:00Z',
  },
  // Star Wars: Ashes of the Outer Rim — Act 1
  {
    id: 'beat-11',
    project_id: 'proj-4',
    act_id: 'act-4',
    name: 'Approach and Arrival',
    type: 'opening',
    description: 'The Republic shuttle descends to Jakku. Kael senses pain and darkness through the Force while Sera prepares for action.',
    order: 1,
    paragraph_id: 'p-11',
    paragraph_title: 'Descent to Jakku',
    completed: false,
    default_flag: false,
    duration: 120,
    estimated_duration: 120,
    pacing_score: 0.75,
    x_position: 100,
    y_position: 400,
    created_at: '2024-04-01T09:30:00Z',
    updated_at: '2024-04-01T09:30:00Z',
  },
  {
    id: 'beat-12',
    project_id: 'proj-4',
    act_id: 'act-4',
    name: 'Walking the Ruins',
    type: 'exposition',
    description: 'Kael and Sera explore the devastated village. Kael uses psychometry to sense the victims\' final moments. The destruction is far beyond conventional weapons.',
    order: 2,
    paragraph_id: 'p-12',
    paragraph_title: 'Ash and Glass',
    completed: false,
    default_flag: false,
    duration: 240,
    estimated_duration: 250,
    pacing_score: 0.85,
    x_position: 200,
    y_position: 400,
    created_at: '2024-04-01T09:45:00Z',
    updated_at: '2024-04-01T09:45:00Z',
  },
  {
    id: 'beat-13',
    project_id: 'proj-4',
    act_id: 'act-4',
    name: 'Dark Side Revelation',
    type: 'inciting_incident',
    description: 'Kael confirms the dark side was involved — focused and ritualistic, not a rogue user. Sera discovers beskar alloy fragments, linking the attack to Mandalorian resources.',
    order: 3,
    paragraph_id: 'p-13',
    paragraph_title: 'Cold Signatures',
    completed: false,
    default_flag: true,
    duration: 200,
    estimated_duration: 200,
    pacing_score: 0.95,
    x_position: 300,
    y_position: 400,
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2024-04-01T10:00:00Z',
  },
  {
    id: 'beat-14',
    project_id: 'proj-4',
    act_id: 'act-4',
    name: 'The Descent',
    type: 'turning_point',
    description: 'Kael senses pre-Republic structures beneath the village and realizes the villagers were collateral — someone came to awaken something ancient. The Jedi ignite their lightsabers and drop into the darkness below.',
    order: 4,
    paragraph_id: 'p-14',
    paragraph_title: 'Into the Dark',
    completed: false,
    default_flag: false,
    duration: 160,
    estimated_duration: 150,
    pacing_score: 0.9,
    x_position: 400,
    y_position: 400,
    created_at: '2024-04-01T10:15:00Z',
    updated_at: '2024-04-01T10:15:00Z',
  },
];

export const mockBeatDependencies: BeatDependency[] = [
  {
    id: 'dep-1',
    source_beat_id: 'beat-1',
    target_beat_id: 'beat-2',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'dep-2',
    source_beat_id: 'beat-2',
    target_beat_id: 'beat-4',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'dep-3',
    source_beat_id: 'beat-3',
    target_beat_id: 'beat-5',
    dependency_type: 'causal',
    strength: 'required',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'dep-4',
    source_beat_id: 'beat-4',
    target_beat_id: 'beat-5',
    dependency_type: 'causal',
    strength: 'required',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'dep-5',
    source_beat_id: 'beat-5',
    target_beat_id: 'beat-6',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'dep-6',
    source_beat_id: 'beat-6',
    target_beat_id: 'beat-7',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'dep-7',
    source_beat_id: 'beat-7',
    target_beat_id: 'beat-8',
    dependency_type: 'causal',
    strength: 'required',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'dep-8',
    source_beat_id: 'beat-8',
    target_beat_id: 'beat-9',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'dep-9',
    source_beat_id: 'beat-9',
    target_beat_id: 'beat-10',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  // Star Wars: Ashes of the Outer Rim
  {
    id: 'dep-10',
    source_beat_id: 'beat-11',
    target_beat_id: 'beat-12',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-04-01T09:30:00Z',
    updated_at: '2024-04-01T09:30:00Z',
  },
  {
    id: 'dep-11',
    source_beat_id: 'beat-12',
    target_beat_id: 'beat-13',
    dependency_type: 'sequential',
    strength: 'required',
    created_at: '2024-04-01T09:30:00Z',
    updated_at: '2024-04-01T09:30:00Z',
  },
  {
    id: 'dep-12',
    source_beat_id: 'beat-13',
    target_beat_id: 'beat-14',
    dependency_type: 'causal',
    strength: 'required',
    created_at: '2024-04-01T09:30:00Z',
    updated_at: '2024-04-01T09:30:00Z',
  },
];

export const mockBeatPacingSuggestions: BeatPacingSuggestion[] = [
  {
    id: 'pacing-1',
    project_id: 'proj-1',
    beat_id: 'beat-6',
    suggestion_type: 'adjust_duration',
    suggested_duration: 350,
    reasoning: 'The journey sequence feels too long for Act 2 pacing. Consider shortening or adding more action beats.',
    confidence: 0.85,
    applied: false,
    created_at: '2024-01-18T10:00:00Z',
  },
  {
    id: 'pacing-2',
    project_id: 'proj-1',
    beat_id: 'beat-3',
    suggestion_type: 'split',
    reasoning: 'Consider splitting this action sequence into two beats: the infiltration and the escape.',
    confidence: 0.72,
    applied: false,
    created_at: '2024-01-18T10:30:00Z',
  },
  {
    id: 'pacing-3',
    project_id: 'proj-1',
    beat_id: 'beat-9',
    suggestion_type: 'adjust_duration',
    suggested_duration: 480,
    reasoning: 'The climax beat could benefit from more time to build tension before the resolution.',
    confidence: 0.9,
    applied: false,
    created_at: '2024-01-18T11:00:00Z',
  },
];

export const mockBeatSceneMappings: BeatSceneMapping[] = [
  {
    id: 'mapping-1',
    beat_id: 'beat-2',
    scene_id: 'scene-1',
    project_id: 'proj-1',
    status: 'accepted',
    semantic_similarity_score: 0.95,
    reasoning: 'Direct match - both cover the knight oath ceremony',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.98,
    user_modified: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    accepted_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'mapping-2',
    beat_id: 'beat-3',
    scene_id: 'scene-2',
    project_id: 'proj-1',
    status: 'accepted',
    semantic_similarity_score: 0.88,
    reasoning: 'Scene covers Lyra\'s mission in the shadows',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.92,
    user_modified: false,
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
    accepted_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'mapping-3',
    beat_id: 'beat-4',
    scene_id: 'scene-3',
    project_id: 'proj-1',
    status: 'accepted',
    semantic_similarity_score: 0.82,
    reasoning: 'Scene involves Theron bringing dragon-related news',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.85,
    user_modified: false,
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    accepted_at: '2024-01-15T12:30:00Z',
  },
  {
    id: 'mapping-4',
    beat_id: 'beat-5',
    scene_id: 'scene-4',
    project_id: 'proj-1',
    status: 'suggested',
    suggested_scene_name: 'The Reluctant Alliance',
    suggested_scene_description: 'Aldric and Lyra are forced to team up despite their conflicting worldviews',
    semantic_similarity_score: 0.91,
    reasoning: 'This beat about forced alliance maps well to the Unlikely Alliance scene',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.88,
    user_modified: false,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'mapping-5',
    beat_id: 'beat-7',
    scene_id: 'scene-5',
    project_id: 'proj-1',
    status: 'suggested',
    semantic_similarity_score: 0.94,
    reasoning: 'Direct match - fortress discovery beat maps to Hidden Fortress scene',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.96,
    user_modified: false,
    created_at: '2024-01-16T12:00:00Z',
    updated_at: '2024-01-16T12:00:00Z',
  },
  {
    id: 'mapping-6',
    beat_id: 'beat-9',
    scene_id: 'scene-6',
    project_id: 'proj-1',
    status: 'suggested',
    semantic_similarity_score: 0.97,
    reasoning: 'Epic confrontation beat directly matches the Battle for the Realm scene',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.98,
    user_modified: false,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
  // Star Wars: Ashes of the Outer Rim
  {
    id: 'mapping-7',
    beat_id: 'beat-12',
    scene_id: 'scene-7',
    project_id: 'proj-4',
    status: 'accepted',
    semantic_similarity_score: 0.93,
    reasoning: 'The ruins exploration beat maps directly to the village investigation scene',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.95,
    user_modified: false,
    created_at: '2024-04-01T09:30:00Z',
    updated_at: '2024-04-01T09:30:00Z',
    accepted_at: '2024-04-01T10:00:00Z',
  },
  {
    id: 'mapping-8',
    beat_id: 'beat-13',
    scene_id: 'scene-7',
    project_id: 'proj-4',
    status: 'accepted',
    semantic_similarity_score: 0.91,
    reasoning: 'The dark side revelation occurs within the same village investigation scene',
    ai_model: 'claude-3-sonnet',
    confidence_score: 0.93,
    user_modified: false,
    created_at: '2024-04-01T09:30:00Z',
    updated_at: '2024-04-01T09:30:00Z',
    accepted_at: '2024-04-01T10:00:00Z',
  },
];
