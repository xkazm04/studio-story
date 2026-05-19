export const BEAT_TYPES = {
    setup: 'setup',
    conflict: 'conflict',
    resolution: 'resolution',
    climax: 'climax',
    transition: 'transition',
    reveal: 'reveal',
    action: 'action',
} as const;

export type BeatType = typeof BEAT_TYPES[keyof typeof BEAT_TYPES];

export const BEAT_TYPE_VALUES = Object.values(BEAT_TYPES);

export const BEAT_TYPE_LABELS: Record<BeatType, string> = {
    setup: 'Setup',
    conflict: 'Conflict',
    resolution: 'Resolution',
    climax: 'Climax',
    transition: 'Transition',
    reveal: 'Reveal',
    action: 'Action',
};

export const BEAT_TYPE_COLORS: Record<BeatType, string> = {
    setup: '#10B981',
    conflict: '#EF4444',
    resolution: '#3B82F6',
    climax: '#F59E0B',
    transition: '#6B7280',
    reveal: '#8B5CF6',
    action: '#F97316',
};

export type Beat = {
    id: string;
    act_id?: string;
    project_id?: string;
    name: string;
    type: string;
    order?: number;
    description?: string;
    paragraph_id?: string;
    paragraph_title?: string;
    completed: boolean;
    created_at: Date;
    updated_at?: Date;
    default_flag?: boolean;
    duration?: number;
    estimated_duration?: number;
    pacing_score?: number;
    x_position?: number;
    y_position?: number;
};

export type BeatDependency = {
    id: string;
    source_beat_id: string;
    target_beat_id: string;
    dependency_type: 'sequential' | 'parallel' | 'causal';
    strength: 'required' | 'suggested' | 'optional';
    created_at: Date;
    updated_at?: Date;
};

export type BeatPacingSuggestion = {
    id: string;
    project_id: string;
    beat_id: string;
    suggestion_type: 'reorder' | 'adjust_duration' | 'merge' | 'split';
    suggested_order?: number;
    suggested_duration?: number;
    reasoning: string;
    confidence: number;
    applied: boolean;
    created_at: Date;
};

export type BeatSceneMapping = {
    id: string;
    beat_id: string;
    scene_id?: string;
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
    created_at: Date;
    updated_at?: Date;
    accepted_at?: Date;
    rejected_at?: Date;
};

export interface BeatSummary {
    id: string;
    title: string;
    order: number;
    type?: string;
    sceneId?: string;
    sceneName?: string;
}

export type BeatSceneSuggestion = {
    mapping_id?: string;
    scene_id?: string;
    scene_name: string;
    scene_description: string;
    scene_script?: string;
    location?: string;
    similarity_score: number;
    confidence_score: number;
    reasoning: string;
    is_new_scene: boolean;
};

