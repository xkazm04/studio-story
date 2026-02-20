export interface FactionBranding {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  emblem_style: 'shield' | 'crest' | 'sigil' | 'custom';
  banner_template: 'standard' | 'ornate' | 'minimal' | 'custom';
  custom_logo_url?: string;
  theme_tier: 'free' | 'premium';
}

export interface Faction {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  logo_url?: string;
  color?: string;
  media?: FactionMedia[];
  branding?: FactionBranding;
}

export interface FactionMedia {
  id: string;
  faction_id: string;
  type: 'logo' | 'banner' | 'emblem' | 'screenshot' | 'lore';
  url: string;
  uploaded_at: string;
  uploader_id: string;
  description?: string;
}

export interface FactionRelationship {
  id: string;
  faction_a_id: string;
  faction_b_id: string;
  description: string;
  relationship_type?: string;
}

export interface FactionEvent {
  id: string;
  faction_id: string;
  title: string;
  description: string;
  date: string;
  event_type: 'founding' | 'battle' | 'alliance' | 'discovery' | 'ceremony' | 'conflict' | 'achievement';
  created_by: string;
  created_at?: string;
}

export interface FactionAchievement {
  id: string;
  faction_id: string;
  title: string;
  description: string;
  icon_url?: string;
  earned_date: string;
  members: string[]; // Array of character IDs who earned this achievement
  created_at?: string;
}

export interface FactionLore {
  id: string;
  faction_id: string;
  title: string;
  content: string;
  category: 'history' | 'culture' | 'conflicts' | 'notable-figures';
  summary?: string; // AI-generated summary (bullet points)
  tags?: string[]; // AI-extracted tags for searchability
  ai_generated_at?: string; // Timestamp when AI analysis was generated
  created_at: string;
  updated_at?: string;
  updated_by: string;
}

// AI-Generated Faction Types
export interface AIGeneratedFaction {
  name: string;
  description: string;
  type: 'guild' | 'family' | 'nation' | 'corporation' | 'cult' | 'military' | 'academic' | 'criminal' | 'religious' | 'other';
  branding: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    emblem_style: 'shield' | 'crest' | 'sigil' | 'custom';
    banner_template: 'standard' | 'ornate' | 'minimal' | 'custom';
  };
  lore: Array<{
    title: string;
    content: string;
    category: 'history' | 'culture' | 'conflicts' | 'notable-figures';
  }>;
  timeline_events: Array<{
    title: string;
    description: string;
    date: string;
    event_type: 'founding' | 'battle' | 'alliance' | 'discovery' | 'ceremony' | 'conflict' | 'achievement';
  }>;
  achievements: Array<{
    title: string;
    description: string;
    earned_date: string;
  }>;
  emblem_design_prompt: string;
  member_archetypes: Array<{
    role: string;
    description: string;
  }>;
}

export interface FactionWizardPrompt {
  prompt: string;
  faction_type?: 'guild' | 'family' | 'nation' | 'corporation' | 'cult' | 'military' | 'academic' | 'criminal' | 'religious' | 'other';
  project_id: string;
}

export interface FactionWizardResponse {
  faction: AIGeneratedFaction;
  metadata: {
    generated_at: string;
    model_used: string;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

// Semantic Search Types
export interface SemanticSearchResult {
  id: string;
  content: string;
  title: string;
  type: 'lore' | 'media' | 'relationship' | 'achievement' | 'event';
  category?: string;
  similarity_score: number;
  metadata: {
    faction_id: string;
    faction_name: string;
    created_at?: string;
    url?: string;
    event_type?: string;
  };
}

export interface SemanticSearchRequest {
  query: string;
  faction_id: string;
  limit?: number;
  threshold?: number;
  types?: Array<'lore' | 'media' | 'relationship' | 'achievement' | 'event'>;
}

// Faction Summary (Aggregated Data)
export interface FactionSummary {
  faction: Faction;
  members: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    faction_id?: string;
    faction_role?: string;
    faction_rank?: number;
  }>;
  relationships: FactionRelationship[];
  media: FactionMedia[];
  lore: FactionLore[];
  achievements: FactionAchievement[];
  events: FactionEvent[];
}
