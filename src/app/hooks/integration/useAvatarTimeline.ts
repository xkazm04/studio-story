/**
 * useAvatarTimeline Hook
 *
 * Manages avatar evolution throughout the story timeline:
 * - Timeline-based avatar history with story point markers
 * - Age progression tracking
 * - Transformation tracking (injuries, visual changes)
 * - Links avatars to scenes/acts
 * - Auto-suggestions based on narrative events
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Appearance } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

export type TransformationType =
  | 'initial'
  | 'natural_aging'
  | 'injury'
  | 'healing'
  | 'magical'
  | 'costume_change'
  | 'emotional'
  | 'custom';

export type AgeStage =
  | 'child'
  | 'teen'
  | 'young_adult'
  | 'adult'
  | 'middle_aged'
  | 'elderly';

export interface VisualChange {
  attribute: string;
  from?: string;
  to: string;
  reason?: string;
}

export interface AvatarHistoryEntry {
  id: string;
  character_id: string;
  avatar_url: string;
  thumbnail_url?: string;
  prompt_used?: string;
  style?: string;
  appearance_snapshot?: Partial<Appearance>;
  scene_id?: string;
  scene?: {
    id: string;
    title: string;
    scene_number?: number;
  };
  act_id?: string;
  act?: {
    id: string;
    title: string;
    act_number?: number;
  };
  narrative_context?: string;
  transformation_type: TransformationType;
  transformation_trigger?: string;
  visual_changes: VisualChange[];
  age_stage?: AgeStage;
  estimated_age?: number;
  is_milestone: boolean;
  milestone_label?: string;
  notes?: string;
  generation_params?: Record<string, unknown>;
  timeline_order?: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at?: string;
}

export interface AvatarEvolutionSummary {
  character_id: string;
  total_entries: number;
  total_transformations: number;
  current_age_stage?: AgeStage;
  first_appearance?: string;
  last_change?: string;
  injury_count: number;
  milestone_count: number;
  scenes_covered: number;
  acts_covered: number;
}

export interface TimelineFilter {
  transformationType?: TransformationType;
  ageStage?: AgeStage;
  actId?: string;
  startDate?: string;
  endDate?: string;
  milestonesOnly?: boolean;
}

export interface AgeProgressionConfig {
  currentAge: AgeStage;
  targetAge: AgeStage;
  preserveFeatures: string[];
  ageSpecificChanges?: Record<string, string>;
}

export interface TransformationConfig {
  type: TransformationType;
  changes: VisualChange[];
  narrativeContext: string;
  sceneId?: string;
  isMilestone?: boolean;
  milestoneLabel?: string;
}

export interface ComparisonPair {
  before: AvatarHistoryEntry;
  after: AvatarHistoryEntry;
  changesSummary: VisualChange[];
  timeDelta: string;
}

// ============================================================================
// API Functions
// ============================================================================

const API_BASE = '/api/avatar-timeline';

async function fetchTimeline(characterId: string): Promise<AvatarHistoryEntry[]> {
  const response = await fetch(`${API_BASE}?characterId=${characterId}`);
  if (!response.ok) throw new Error('Failed to fetch avatar timeline');
  return response.json();
}

async function fetchEvolutionSummary(characterId: string): Promise<AvatarEvolutionSummary> {
  const response = await fetch(`${API_BASE}/summary?characterId=${characterId}`);
  if (!response.ok) throw new Error('Failed to fetch evolution summary');
  return response.json();
}

async function createTimelineEntry(data: Partial<AvatarHistoryEntry>): Promise<AvatarHistoryEntry> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create timeline entry');
  return response.json();
}

async function updateTimelineEntry(
  entryId: string,
  data: Partial<AvatarHistoryEntry>
): Promise<AvatarHistoryEntry> {
  const response = await fetch(`${API_BASE}/${entryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update timeline entry');
  return response.json();
}

async function deleteTimelineEntry(entryId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${entryId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete timeline entry');
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_TIMELINE: AvatarHistoryEntry[] = [
  {
    id: 'mock-entry-1',
    character_id: 'mock-char-1',
    avatar_url: 'https://picsum.photos/seed/avatar1/512/512',
    thumbnail_url: 'https://picsum.photos/seed/avatar1/128/128',
    prompt_used: 'Young adventurer, hopeful expression, simple clothes',
    style: 'portrait',
    scene_id: 'mock-scene-1',
    scene: { id: 'mock-scene-1', title: 'The Beginning', scene_number: 1 },
    act_id: 'mock-act-1',
    act: { id: 'mock-act-1', title: 'Act 1: Origins', act_number: 1 },
    narrative_context: 'Character introduction - first appearance in the story',
    transformation_type: 'initial',
    transformation_trigger: 'Story begins',
    visual_changes: [],
    age_stage: 'young_adult',
    estimated_age: 25,
    is_milestone: true,
    milestone_label: 'Story Beginning',
    notes: 'First appearance of the character',
    timeline_order: 0,
    start_time: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock-entry-2',
    character_id: 'mock-char-1',
    avatar_url: 'https://picsum.photos/seed/avatar2/512/512',
    thumbnail_url: 'https://picsum.photos/seed/avatar2/128/128',
    prompt_used: 'Battle-scarred adventurer, determined expression, worn armor',
    style: 'portrait',
    scene_id: 'mock-scene-5',
    scene: { id: 'mock-scene-5', title: 'The Battle', scene_number: 5 },
    act_id: 'mock-act-2',
    act: { id: 'mock-act-2', title: 'Act 2: Trials', act_number: 2 },
    narrative_context: 'After the first major battle - received facial scar',
    transformation_type: 'injury',
    transformation_trigger: 'Battle wound from enemy sword',
    visual_changes: [
      { attribute: 'face', from: 'unmarked', to: 'scar across left cheek', reason: 'Battle wound' },
    ],
    age_stage: 'young_adult',
    estimated_age: 26,
    is_milestone: true,
    milestone_label: 'First Battle Scar',
    notes: 'Received scar during the decisive battle',
    timeline_order: 1,
    start_time: '2024-03-15T00:00:00Z',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 'mock-entry-3',
    character_id: 'mock-char-1',
    avatar_url: 'https://picsum.photos/seed/avatar3/512/512',
    thumbnail_url: 'https://picsum.photos/seed/avatar3/128/128',
    prompt_used: 'Mature hero, weathered face, grey streaks in hair, wise eyes',
    style: 'portrait',
    scene_id: 'mock-scene-20',
    scene: { id: 'mock-scene-20', title: 'Years Later', scene_number: 20 },
    act_id: 'mock-act-3',
    act: { id: 'mock-act-3', title: 'Act 3: Legacy', act_number: 3 },
    narrative_context: 'Time skip - 15 years have passed',
    transformation_type: 'natural_aging',
    transformation_trigger: '15 year time skip',
    visual_changes: [
      { attribute: 'age', from: 'Young Adult', to: 'Middle-aged', reason: '15 year time skip' },
      { attribute: 'hair_color', from: 'brown', to: 'brown with grey streaks', reason: 'Natural greying' },
      { attribute: 'features', from: 'scar across left cheek', to: 'scar across left cheek, crow\'s feet', reason: 'Age lines' },
    ],
    age_stage: 'middle_aged',
    estimated_age: 41,
    is_milestone: true,
    milestone_label: 'Time Skip',
    notes: 'Major time skip showing aging',
    timeline_order: 2,
    start_time: '2039-01-01T00:00:00Z',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
];

const MOCK_SUMMARY: AvatarEvolutionSummary = {
  character_id: 'mock-char-1',
  total_entries: 3,
  total_transformations: 2,
  current_age_stage: 'middle_aged',
  first_appearance: '2024-01-01T00:00:00Z',
  last_change: '2024-06-01T00:00:00Z',
  injury_count: 1,
  milestone_count: 3,
  scenes_covered: 3,
  acts_covered: 3,
};

// ============================================================================
// Helper Functions
// ============================================================================

export function calculateVisualChanges(
  oldAppearance: Partial<Appearance>,
  newAppearance: Partial<Appearance>
): VisualChange[] {
  const changes: VisualChange[] = [];

  const compareFields = (
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    prefix = ''
  ) => {
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    allKeys.forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];

      if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal && newVal) {
        compareFields(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          fullKey
        );
      } else if (String(oldVal || '') !== String(newVal || '')) {
        changes.push({
          attribute: fullKey,
          from: String(oldVal || ''),
          to: String(newVal || ''),
        });
      }
    });
  };

  compareFields(
    oldAppearance as Record<string, unknown>,
    newAppearance as Record<string, unknown>
  );

  return changes;
}

export function getAgeStageFromString(age: string): AgeStage {
  const lowerAge = age.toLowerCase();
  if (lowerAge.includes('child')) return 'child';
  if (lowerAge.includes('teen')) return 'teen';
  if (lowerAge.includes('young')) return 'young_adult';
  if (lowerAge.includes('middle')) return 'middle_aged';
  if (lowerAge.includes('elder') || lowerAge.includes('old')) return 'elderly';
  return 'adult';
}

export function getAgeProgressionPromptModifier(from: AgeStage, to: AgeStage): string {
  const modifiers: Record<AgeStage, string> = {
    child: 'young child, round face, soft features, innocent eyes',
    teen: 'teenager, youthful appearance, slightly awkward proportions',
    young_adult: 'young adult, mature features, clear skin, bright eyes',
    adult: 'adult, fully mature features, confident appearance',
    middle_aged: 'middle-aged, some grey hair, fine lines around eyes, weathered appearance',
    elderly: 'elderly, white or grey hair, wrinkled skin, wise eyes, aged features',
  };

  return modifiers[to] || modifiers['adult'];
}

export function getTransformationPromptModifier(type: TransformationType, changes: VisualChange[]): string {
  const changeDescriptions = changes.map(c => c.reason || `${c.attribute}: ${c.to}`);

  const typeModifiers: Record<TransformationType, string> = {
    initial: '',
    natural_aging: 'naturally aged appearance',
    injury: 'visible scars and wounds',
    healing: 'healed but marked',
    magical: 'magically transformed',
    costume_change: 'different attire',
    emotional: 'emotional transformation visible in expression',
    custom: '',
  };

  return [typeModifiers[type], ...changeDescriptions].filter(Boolean).join(', ');
}

export function filterTimeline(
  entries: AvatarHistoryEntry[],
  filter: TimelineFilter
): AvatarHistoryEntry[] {
  return entries.filter(entry => {
    if (filter.transformationType && entry.transformation_type !== filter.transformationType) {
      return false;
    }
    if (filter.ageStage && entry.age_stage !== filter.ageStage) {
      return false;
    }
    if (filter.actId && entry.act_id !== filter.actId) {
      return false;
    }
    if (filter.milestonesOnly && !entry.is_milestone) {
      return false;
    }
    if (filter.startDate && entry.start_time && new Date(entry.start_time) < new Date(filter.startDate)) {
      return false;
    }
    if (filter.endDate && entry.start_time && new Date(entry.start_time) > new Date(filter.endDate)) {
      return false;
    }
    return true;
  });
}

export function createComparisonPairs(entries: AvatarHistoryEntry[]): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];

  for (let i = 1; i < entries.length; i++) {
    const before = entries[i - 1];
    const after = entries[i];

    const beforeDate = new Date(before.start_time || before.created_at);
    const afterDate = new Date(after.start_time || after.created_at);
    const diffMs = afterDate.getTime() - beforeDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let timeDelta: string;
    if (diffDays < 1) timeDelta = 'Same day';
    else if (diffDays < 7) timeDelta = `${diffDays} days`;
    else if (diffDays < 30) timeDelta = `${Math.floor(diffDays / 7)} weeks`;
    else if (diffDays < 365) timeDelta = `${Math.floor(diffDays / 30)} months`;
    else timeDelta = `${Math.floor(diffDays / 365)} years`;

    pairs.push({
      before,
      after,
      changesSummary: after.visual_changes,
      timeDelta,
    });
  }

  return pairs;
}

// ============================================================================
// Transformation Type Config
// ============================================================================

export const TRANSFORMATION_TYPES: Record<TransformationType, {
  label: string;
  description: string;
  color: string;
  icon: string;
}> = {
  initial: {
    label: 'Initial',
    description: 'First appearance in the story',
    color: 'text-blue-400 bg-blue-600/20',
    icon: 'star',
  },
  natural_aging: {
    label: 'Aging',
    description: 'Natural passage of time',
    color: 'text-amber-400 bg-amber-600/20',
    icon: 'clock',
  },
  injury: {
    label: 'Injury',
    description: 'Physical damage or wounds',
    color: 'text-red-400 bg-red-600/20',
    icon: 'alert-triangle',
  },
  healing: {
    label: 'Healing',
    description: 'Recovery from injury',
    color: 'text-green-400 bg-green-600/20',
    icon: 'heart',
  },
  magical: {
    label: 'Magical',
    description: 'Supernatural transformation',
    color: 'text-purple-400 bg-purple-600/20',
    icon: 'sparkles',
  },
  costume_change: {
    label: 'Costume',
    description: 'Change in attire or equipment',
    color: 'text-cyan-400 bg-cyan-600/20',
    icon: 'shirt',
  },
  emotional: {
    label: 'Emotional',
    description: 'Expression or demeanor change',
    color: 'text-pink-400 bg-pink-600/20',
    icon: 'smile',
  },
  custom: {
    label: 'Custom',
    description: 'User-defined transformation',
    color: 'text-gray-400 bg-gray-600/20',
    icon: 'edit',
  },
};

export const AGE_STAGES: Record<AgeStage, {
  label: string;
  ageRange: string;
}> = {
  child: { label: 'Child', ageRange: '0-12' },
  teen: { label: 'Teenager', ageRange: '13-19' },
  young_adult: { label: 'Young Adult', ageRange: '20-35' },
  adult: { label: 'Adult', ageRange: '36-50' },
  middle_aged: { label: 'Middle-aged', ageRange: '51-65' },
  elderly: { label: 'Elderly', ageRange: '65+' },
};

// ============================================================================
// Main Hook
// ============================================================================

export function useAvatarTimeline(characterId: string | null) {
  const queryClient = useQueryClient();

  // Fetch timeline
  const timelineQuery = useQuery({
    queryKey: ['avatarTimeline', characterId],
    queryFn: () => fetchTimeline(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
    placeholderData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
      ? MOCK_TIMELINE.filter(e => e.character_id === characterId || characterId === 'mock-char-1')
      : undefined,
  });

  // Fetch summary
  const summaryQuery = useQuery({
    queryKey: ['avatarTimelineSummary', characterId],
    queryFn: () => fetchEvolutionSummary(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
    placeholderData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ? MOCK_SUMMARY : undefined,
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (data: Partial<AvatarHistoryEntry>) =>
      createTimelineEntry({ ...data, character_id: characterId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarTimeline', characterId] });
      queryClient.invalidateQueries({ queryKey: ['avatarTimelineSummary', characterId] });
    },
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AvatarHistoryEntry> }) =>
      updateTimelineEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarTimeline', characterId] });
      queryClient.invalidateQueries({ queryKey: ['avatarTimelineSummary', characterId] });
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: deleteTimelineEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarTimeline', characterId] });
      queryClient.invalidateQueries({ queryKey: ['avatarTimelineSummary', characterId] });
    },
  });

  // Derived data
  const timeline = timelineQuery.data || [];
  const milestones = timeline.filter(e => e.is_milestone);
  const latestEntry = timeline.length > 0 ? timeline[timeline.length - 1] : null;
  const comparisonPairs = createComparisonPairs(timeline);

  // Helper to record a transformation
  const recordTransformation = (config: TransformationConfig) => {
    return createEntryMutation.mutateAsync({
      transformation_type: config.type,
      visual_changes: config.changes,
      narrative_context: config.narrativeContext,
      scene_id: config.sceneId,
      is_milestone: config.isMilestone || false,
      milestone_label: config.milestoneLabel,
      start_time: new Date().toISOString(),
    });
  };

  // Helper for age progression
  const recordAgeProgression = (
    avatarUrl: string,
    fromAge: AgeStage,
    toAge: AgeStage,
    context: string,
    sceneId?: string
  ) => {
    return createEntryMutation.mutateAsync({
      avatar_url: avatarUrl,
      transformation_type: 'natural_aging',
      age_stage: toAge,
      visual_changes: [{
        attribute: 'age',
        from: AGE_STAGES[fromAge].label,
        to: AGE_STAGES[toAge].label,
        reason: `Aged from ${AGE_STAGES[fromAge].label} to ${AGE_STAGES[toAge].label}`,
      }],
      narrative_context: context,
      scene_id: sceneId,
      is_milestone: true,
      milestone_label: `Age Progression: ${AGE_STAGES[toAge].label}`,
      start_time: new Date().toISOString(),
    });
  };

  return {
    // Data
    timeline,
    summary: summaryQuery.data,
    milestones,
    latestEntry,
    comparisonPairs,

    // Loading states
    isLoading: timelineQuery.isLoading || summaryQuery.isLoading,
    isLoadingTimeline: timelineQuery.isLoading,
    isLoadingSummary: summaryQuery.isLoading,

    // Mutations
    createEntry: createEntryMutation.mutate,
    updateEntry: (id: string, data: Partial<AvatarHistoryEntry>) =>
      updateEntryMutation.mutate({ id, data }),
    deleteEntry: deleteEntryMutation.mutate,

    // Mutation states
    isCreating: createEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending,

    // Helpers
    recordTransformation,
    recordAgeProgression,
    filterTimeline: (filter: TimelineFilter) => filterTimeline(timeline, filter),

    // Constants
    transformationTypes: TRANSFORMATION_TYPES,
    ageStages: AGE_STAGES,

    // Utilities
    calculateVisualChanges,
    getAgeProgressionPromptModifier,
    getTransformationPromptModifier,
  };
}

export default useAvatarTimeline;
