/**
 * useCharacterOutfits Hook
 *
 * Provides comprehensive wardrobe management including:
 * - Multiple outfit CRUD operations
 * - Accessory management
 * - Context-based outfit recommendations
 * - Outfit history/timeline tracking
 * - AI prompt generation for outfits
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createMockableQuery } from './queryHelpers';

// ============================================================================
// Types
// ============================================================================

export type OutfitType =
  | 'default'
  | 'casual'
  | 'formal'
  | 'combat'
  | 'work'
  | 'sleep'
  | 'disguise'
  | 'ceremonial'
  | 'athletic'
  | 'travel'
  | 'weather'
  | 'custom';

export type AccessoryState = 'worn' | 'stored' | 'lost' | 'given' | 'destroyed';

export type AccessoryCategory =
  | 'jewelry'
  | 'weapon'
  | 'tool'
  | 'bag'
  | 'magical_item'
  | 'personal_item'
  | 'companion'
  | 'vehicle'
  | 'document'
  | 'currency'
  | 'other';

export type OverallCondition = 'pristine' | 'worn' | 'damaged' | 'tattered';
export type Formality = 'casual' | 'smart_casual' | 'business' | 'formal' | 'ceremonial';

export interface ClothingPiece {
  item: string;
  material?: string;
  color?: string;
  pattern?: string;
  condition?: OverallCondition;
}

export interface ClothingDetails {
  top?: ClothingPiece;
  bottom?: ClothingPiece;
  footwear?: ClothingPiece;
  outerwear?: ClothingPiece;
  headwear?: ClothingPiece;
  handwear?: ClothingPiece;
  style_notes?: string;
  overall_condition?: OverallCondition;
  formality?: Formality;
}

export interface Outfit {
  id: string;
  character_id: string;
  name: string;
  outfit_type: OutfitType;
  description?: string;
  is_default: boolean;
  clothing: ClothingDetails;
  context_tags: string[];
  suitable_locations: string[];
  suitable_weather: string[];
  suitable_time_of_day: string[];
  reference_image_url?: string;
  thumbnail_url?: string;
  prompt_fragment?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Accessory {
  id: string;
  character_id: string;
  name: string;
  category: AccessoryCategory;
  description?: string;
  material?: string;
  color?: string;
  attributes: Record<string, unknown>;
  is_signature: boolean;
  story_significance?: string;
  acquired_scene_id?: string;
  current_state: AccessoryState;
  state_changed_at?: string;
  state_changed_scene_id?: string;
  reference_image_url?: string;
  prompt_fragment?: string;
  created_at: string;
  updated_at: string;
}

export interface OutfitAccessoryLink {
  id: string;
  outfit_id: string;
  accessory_id: string;
  usage_type: 'worn' | 'carried' | 'attached' | 'hidden';
  position?: string;
  is_visible: boolean;
  created_at: string;
}

export interface OutfitHistoryEntry {
  id: string;
  character_id: string;
  outfit_id: string;
  scene_id?: string;
  start_time: string;
  end_time?: string;
  scene_title?: string;
  scene_description?: string;
  narrative_reason?: string;
  modifications: Record<string, unknown>;
  created_at: string;
}

export interface SceneContext {
  location?: string;
  weather?: string;
  timeOfDay?: string;
  tags?: string[];
  mood?: string;
  activityType?: string;
}

export interface OutfitRecommendation {
  outfit: Outfit;
  score: number;
  matchReasons: string[];
}

// ============================================================================
// API Functions
// ============================================================================

const API_BASE = '/api/character-outfits';

// Outfit API
async function fetchOutfits(characterId: string): Promise<Outfit[]> {
  const response = await fetch(`${API_BASE}?characterId=${characterId}`);
  if (!response.ok) throw new Error('Failed to fetch outfits');
  return response.json();
}

async function fetchOutfit(outfitId: string): Promise<Outfit> {
  const response = await fetch(`${API_BASE}/${outfitId}`);
  if (!response.ok) throw new Error('Failed to fetch outfit');
  return response.json();
}

async function createOutfit(data: Partial<Outfit>): Promise<Outfit> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create outfit');
  return response.json();
}

async function updateOutfit(outfitId: string, data: Partial<Outfit>): Promise<Outfit> {
  const response = await fetch(`${API_BASE}/${outfitId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update outfit');
  return response.json();
}

async function deleteOutfit(outfitId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${outfitId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete outfit');
}

// Accessory API
async function fetchAccessories(characterId: string): Promise<Accessory[]> {
  const response = await fetch(`${API_BASE}/accessories?characterId=${characterId}`);
  if (!response.ok) throw new Error('Failed to fetch accessories');
  return response.json();
}

async function createAccessory(data: Partial<Accessory>): Promise<Accessory> {
  const response = await fetch(`${API_BASE}/accessories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create accessory');
  return response.json();
}

async function updateAccessory(accessoryId: string, data: Partial<Accessory>): Promise<Accessory> {
  const response = await fetch(`${API_BASE}/accessories/${accessoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update accessory');
  return response.json();
}

async function deleteAccessory(accessoryId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/accessories/${accessoryId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete accessory');
}

// Outfit-Accessory Links API
async function linkAccessoryToOutfit(
  outfitId: string,
  accessoryId: string,
  config: Partial<OutfitAccessoryLink>
): Promise<OutfitAccessoryLink> {
  const response = await fetch(`${API_BASE}/${outfitId}/accessories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessoryId, ...config }),
  });
  if (!response.ok) throw new Error('Failed to link accessory to outfit');
  return response.json();
}

async function unlinkAccessoryFromOutfit(outfitId: string, accessoryId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${outfitId}/accessories/${accessoryId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to unlink accessory from outfit');
}

// History API
async function fetchOutfitHistory(characterId: string): Promise<OutfitHistoryEntry[]> {
  const response = await fetch(`${API_BASE}/history?characterId=${characterId}`);
  if (!response.ok) throw new Error('Failed to fetch outfit history');
  return response.json();
}

async function recordOutfitChange(data: Partial<OutfitHistoryEntry>): Promise<OutfitHistoryEntry> {
  const response = await fetch(`${API_BASE}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to record outfit change');
  return response.json();
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_OUTFITS: Outfit[] = [
  {
    id: 'mock-outfit-1',
    character_id: 'mock-char-1',
    name: 'Everyday Attire',
    outfit_type: 'default',
    description: 'Character\'s signature everyday look',
    is_default: true,
    clothing: {
      top: { item: 'Linen shirt', material: 'linen', color: 'white', condition: 'worn' },
      bottom: { item: 'Leather trousers', material: 'leather', color: 'brown', condition: 'worn' },
      footwear: { item: 'Boots', material: 'leather', color: 'dark brown', condition: 'worn' },
      overall_condition: 'worn',
      formality: 'casual',
    },
    context_tags: ['outdoor', 'travel', 'day'],
    suitable_locations: ['village', 'road', 'tavern', 'forest'],
    suitable_weather: ['sunny', 'cloudy'],
    suitable_time_of_day: ['morning', 'afternoon'],
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-outfit-2',
    character_id: 'mock-char-1',
    name: 'Combat Gear',
    outfit_type: 'combat',
    description: 'Battle-ready armor and equipment',
    is_default: false,
    clothing: {
      top: { item: 'Chainmail', material: 'steel', color: 'silver', condition: 'pristine' },
      bottom: { item: 'Padded leggings', material: 'leather', color: 'black', condition: 'worn' },
      footwear: { item: 'Steel-toed boots', material: 'leather/steel', color: 'black', condition: 'worn' },
      outerwear: { item: 'Cloak', material: 'wool', color: 'dark green', condition: 'worn' },
      overall_condition: 'worn',
      formality: 'casual',
    },
    context_tags: ['combat', 'outdoor', 'dangerous'],
    suitable_locations: ['battlefield', 'dungeon', 'wilderness'],
    suitable_weather: ['any'],
    suitable_time_of_day: ['any'],
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_ACCESSORIES: Accessory[] = [
  {
    id: 'mock-acc-1',
    character_id: 'mock-char-1',
    name: 'Family Sword',
    category: 'weapon',
    description: 'Ancestral blade passed down through generations',
    material: 'Steel with gold inlay',
    color: 'Silver and gold',
    attributes: { type: 'longsword', enchanted: false },
    is_signature: true,
    story_significance: 'Inherited from father before his death',
    current_state: 'worn',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-acc-2',
    character_id: 'mock-char-1',
    name: 'Silver Pendant',
    category: 'jewelry',
    description: 'A simple silver pendant with a moonstone',
    material: 'Silver',
    color: 'Silver with blue moonstone',
    attributes: { gemstone: 'moonstone' },
    is_signature: false,
    current_state: 'worn',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================================
// Context Matching Engine
// ============================================================================

const CONTEXT_TAG_MAPPINGS: Record<string, string[]> = {
  // Location mappings
  castle: ['indoor', 'formal', 'social'],
  tavern: ['indoor', 'casual', 'social', 'night'],
  forest: ['outdoor', 'travel', 'nature'],
  battlefield: ['outdoor', 'combat', 'dangerous'],
  court: ['indoor', 'formal', 'social', 'ceremonial'],
  dungeon: ['indoor', 'dangerous', 'combat'],
  ship: ['outdoor', 'travel', 'work'],
  temple: ['indoor', 'ceremonial', 'peaceful'],
  market: ['outdoor', 'social', 'casual'],

  // Weather mappings
  rainy: ['wet', 'cold'],
  snowy: ['cold', 'outdoor'],
  sunny: ['warm', 'outdoor'],
  stormy: ['wet', 'dangerous'],
  foggy: ['low_visibility', 'mysterious'],

  // Time mappings
  morning: ['day', 'early'],
  afternoon: ['day'],
  evening: ['transitional', 'social'],
  night: ['dark', 'late'],

  // Activity mappings
  celebration: ['social', 'formal', 'festive'],
  negotiation: ['social', 'formal', 'tense'],
  stealth: ['quiet', 'dark', 'subtle'],
  investigation: ['observant', 'casual'],
  rest: ['comfortable', 'casual', 'indoor'],
};

function expandContextTags(context: SceneContext): string[] {
  const tags: Set<string> = new Set();

  if (context.location) {
    const locationTags = CONTEXT_TAG_MAPPINGS[context.location.toLowerCase()] || [];
    locationTags.forEach(t => tags.add(t));
    tags.add(context.location.toLowerCase());
  }

  if (context.weather) {
    const weatherTags = CONTEXT_TAG_MAPPINGS[context.weather.toLowerCase()] || [];
    weatherTags.forEach(t => tags.add(t));
    tags.add(context.weather.toLowerCase());
  }

  if (context.timeOfDay) {
    const timeTags = CONTEXT_TAG_MAPPINGS[context.timeOfDay.toLowerCase()] || [];
    timeTags.forEach(t => tags.add(t));
    tags.add(context.timeOfDay.toLowerCase());
  }

  if (context.activityType) {
    const activityTags = CONTEXT_TAG_MAPPINGS[context.activityType.toLowerCase()] || [];
    activityTags.forEach(t => tags.add(t));
    tags.add(context.activityType.toLowerCase());
  }

  if (context.tags) {
    context.tags.forEach(t => tags.add(t.toLowerCase()));
  }

  return Array.from(tags);
}

function calculateOutfitScore(outfit: Outfit, context: SceneContext): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const expandedTags = expandContextTags(context);

  // Location match
  if (context.location && outfit.suitable_locations.length > 0) {
    if (outfit.suitable_locations.includes(context.location.toLowerCase())) {
      score += 30;
      reasons.push(`Suitable for ${context.location}`);
    }
  }

  // Weather match
  if (context.weather && outfit.suitable_weather.length > 0) {
    if (outfit.suitable_weather.includes(context.weather.toLowerCase()) ||
        outfit.suitable_weather.includes('any')) {
      score += 25;
      reasons.push(`Appropriate for ${context.weather} weather`);
    }
  }

  // Time of day match
  if (context.timeOfDay && outfit.suitable_time_of_day.length > 0) {
    if (outfit.suitable_time_of_day.includes(context.timeOfDay.toLowerCase()) ||
        outfit.suitable_time_of_day.includes('any')) {
      score += 20;
      reasons.push(`Suitable for ${context.timeOfDay}`);
    }
  }

  // Context tag overlap
  const tagOverlap = outfit.context_tags.filter(t => expandedTags.includes(t.toLowerCase()));
  if (tagOverlap.length > 0) {
    score += tagOverlap.length * 10;
    reasons.push(`Matches context: ${tagOverlap.join(', ')}`);
  }

  // Bonus for default outfit when no strong context match
  if (outfit.is_default && score < 30) {
    score += 15;
    reasons.push('Default outfit (fallback)');
  }

  // Outfit type bonus
  if (context.activityType) {
    const typeMap: Record<string, OutfitType[]> = {
      combat: ['combat'],
      celebration: ['formal', 'ceremonial'],
      rest: ['sleep', 'casual'],
      travel: ['travel', 'casual'],
      work: ['work'],
      stealth: ['disguise', 'casual'],
    };
    const preferredTypes = typeMap[context.activityType.toLowerCase()] || [];
    if (preferredTypes.includes(outfit.outfit_type)) {
      score += 25;
      reasons.push(`${outfit.outfit_type} suitable for ${context.activityType}`);
    }
  }

  return { score, reasons };
}

export function getOutfitRecommendations(
  outfits: Outfit[],
  context: SceneContext
): OutfitRecommendation[] {
  return outfits
    .map(outfit => {
      const { score, reasons } = calculateOutfitScore(outfit, context);
      return { outfit, score, matchReasons: reasons };
    })
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// Prompt Generation
// ============================================================================

export function generateOutfitPrompt(outfit: Outfit, accessories: Accessory[] = []): string {
  const parts: string[] = [];

  // Build clothing description
  if (outfit.clothing.top?.item) {
    let topDesc = outfit.clothing.top.item;
    if (outfit.clothing.top.color) topDesc = `${outfit.clothing.top.color} ${topDesc}`;
    if (outfit.clothing.top.material) topDesc = `${outfit.clothing.top.material} ${topDesc}`;
    parts.push(`wearing ${topDesc.toLowerCase()}`);
  }

  if (outfit.clothing.bottom?.item) {
    let bottomDesc = outfit.clothing.bottom.item;
    if (outfit.clothing.bottom.color) bottomDesc = `${outfit.clothing.bottom.color} ${bottomDesc}`;
    parts.push(bottomDesc.toLowerCase());
  }

  if (outfit.clothing.footwear?.item) {
    let footDesc = outfit.clothing.footwear.item;
    if (outfit.clothing.footwear.color) footDesc = `${outfit.clothing.footwear.color} ${footDesc}`;
    parts.push(footDesc.toLowerCase());
  }

  if (outfit.clothing.outerwear?.item) {
    let outerDesc = outfit.clothing.outerwear.item;
    if (outfit.clothing.outerwear.color) outerDesc = `${outfit.clothing.outerwear.color} ${outerDesc}`;
    parts.push(`with ${outerDesc.toLowerCase()}`);
  }

  if (outfit.clothing.headwear?.item) {
    let headDesc = outfit.clothing.headwear.item;
    if (outfit.clothing.headwear.color) headDesc = `${outfit.clothing.headwear.color} ${headDesc}`;
    parts.push(headDesc.toLowerCase());
  }

  // Add visible accessories
  const visibleAccessories = accessories.filter(a => a.current_state === 'worn');
  if (visibleAccessories.length > 0) {
    const accParts = visibleAccessories.map(a => {
      let desc = a.name;
      if (a.material) desc = `${a.material} ${desc}`;
      return desc.toLowerCase();
    });
    parts.push(`with ${accParts.join(', ')}`);
  }

  // Add style notes
  if (outfit.clothing.style_notes) {
    parts.push(outfit.clothing.style_notes.toLowerCase());
  }

  // Add condition
  if (outfit.clothing.overall_condition && outfit.clothing.overall_condition !== 'pristine') {
    parts.push(`(${outfit.clothing.overall_condition} condition)`);
  }

  return parts.join(', ');
}

// ============================================================================
// Default Outfit Templates
// ============================================================================

export const OUTFIT_TEMPLATES: Record<OutfitType, Partial<Outfit>> = {
  default: {
    name: 'Default Outfit',
    outfit_type: 'default',
    context_tags: ['versatile'],
    suitable_locations: [],
    suitable_weather: [],
    suitable_time_of_day: [],
    clothing: { formality: 'casual' },
  },
  casual: {
    name: 'Casual Attire',
    outfit_type: 'casual',
    context_tags: ['casual', 'relaxed', 'everyday'],
    suitable_locations: ['home', 'tavern', 'village', 'market'],
    suitable_weather: ['sunny', 'cloudy'],
    suitable_time_of_day: ['morning', 'afternoon', 'evening'],
    clothing: { formality: 'casual' },
  },
  formal: {
    name: 'Formal Attire',
    outfit_type: 'formal',
    context_tags: ['formal', 'social', 'elegant'],
    suitable_locations: ['castle', 'court', 'ball', 'ceremony'],
    suitable_weather: ['indoor'],
    suitable_time_of_day: ['evening', 'night'],
    clothing: { formality: 'formal' },
  },
  combat: {
    name: 'Combat Gear',
    outfit_type: 'combat',
    context_tags: ['combat', 'battle', 'dangerous', 'protective'],
    suitable_locations: ['battlefield', 'dungeon', 'wilderness'],
    suitable_weather: ['any'],
    suitable_time_of_day: ['any'],
    clothing: { formality: 'casual' },
  },
  work: {
    name: 'Work Attire',
    outfit_type: 'work',
    context_tags: ['work', 'practical', 'professional'],
    suitable_locations: ['workshop', 'office', 'shop'],
    suitable_weather: ['indoor'],
    suitable_time_of_day: ['morning', 'afternoon'],
    clothing: { formality: 'smart_casual' },
  },
  sleep: {
    name: 'Sleepwear',
    outfit_type: 'sleep',
    context_tags: ['sleep', 'rest', 'night', 'comfortable'],
    suitable_locations: ['bedroom', 'inn', 'camp'],
    suitable_weather: ['indoor'],
    suitable_time_of_day: ['night'],
    clothing: { formality: 'casual' },
  },
  disguise: {
    name: 'Disguise',
    outfit_type: 'disguise',
    context_tags: ['stealth', 'undercover', 'incognito'],
    suitable_locations: [],
    suitable_weather: [],
    suitable_time_of_day: [],
    clothing: { formality: 'casual' },
  },
  ceremonial: {
    name: 'Ceremonial Garb',
    outfit_type: 'ceremonial',
    context_tags: ['ceremonial', 'religious', 'ritual', 'formal'],
    suitable_locations: ['temple', 'church', 'sacred_site'],
    suitable_weather: ['indoor'],
    suitable_time_of_day: [],
    clothing: { formality: 'ceremonial' },
  },
  athletic: {
    name: 'Athletic Wear',
    outfit_type: 'athletic',
    context_tags: ['athletic', 'training', 'exercise', 'active'],
    suitable_locations: ['training_ground', 'arena', 'outdoors'],
    suitable_weather: ['sunny', 'cloudy'],
    suitable_time_of_day: ['morning', 'afternoon'],
    clothing: { formality: 'casual' },
  },
  travel: {
    name: 'Travel Gear',
    outfit_type: 'travel',
    context_tags: ['travel', 'journey', 'outdoor', 'practical'],
    suitable_locations: ['road', 'wilderness', 'mountains'],
    suitable_weather: ['any'],
    suitable_time_of_day: ['any'],
    clothing: { formality: 'casual' },
  },
  weather: {
    name: 'Weather Protection',
    outfit_type: 'weather',
    context_tags: ['weather', 'protection', 'outdoor'],
    suitable_locations: [],
    suitable_weather: ['rainy', 'snowy', 'stormy', 'cold'],
    suitable_time_of_day: [],
    clothing: { formality: 'casual' },
  },
  custom: {
    name: 'Custom Outfit',
    outfit_type: 'custom',
    context_tags: [],
    suitable_locations: [],
    suitable_weather: [],
    suitable_time_of_day: [],
    clothing: {},
  },
};

// ============================================================================
// Main Hook
// ============================================================================

export function useCharacterOutfits(characterId: string | null) {
  const queryClient = useQueryClient();

  // Fetch all outfits for character
  const outfitsQuery = useQuery({
    queryKey: ['characterOutfits', characterId],
    queryFn: () => fetchOutfits(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
    // Use mock data in development
    placeholderData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
      ? MOCK_OUTFITS.filter(o => o.character_id === characterId || characterId === 'mock-char-1')
      : undefined,
  });

  // Fetch all accessories for character
  const accessoriesQuery = useQuery({
    queryKey: ['characterAccessories', characterId],
    queryFn: () => fetchAccessories(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
    placeholderData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
      ? MOCK_ACCESSORIES.filter(a => a.character_id === characterId || characterId === 'mock-char-1')
      : undefined,
  });

  // Fetch outfit history
  const historyQuery = useQuery({
    queryKey: ['outfitHistory', characterId],
    queryFn: () => fetchOutfitHistory(characterId!),
    enabled: !!characterId,
    staleTime: 1000 * 60 * 5,
  });

  // Mutations
  const createOutfitMutation = useMutation({
    mutationFn: (data: Partial<Outfit>) => createOutfit({ ...data, character_id: characterId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterOutfits', characterId] });
    },
  });

  const updateOutfitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Outfit> }) => updateOutfit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterOutfits', characterId] });
    },
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: deleteOutfit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterOutfits', characterId] });
    },
  });

  const createAccessoryMutation = useMutation({
    mutationFn: (data: Partial<Accessory>) => createAccessory({ ...data, character_id: characterId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterAccessories', characterId] });
    },
  });

  const updateAccessoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Accessory> }) => updateAccessory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterAccessories', characterId] });
    },
  });

  const deleteAccessoryMutation = useMutation({
    mutationFn: deleteAccessory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characterAccessories', characterId] });
    },
  });

  const recordOutfitChangeMutation = useMutation({
    mutationFn: recordOutfitChange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfitHistory', characterId] });
    },
  });

  // Get default outfit
  const defaultOutfit = outfitsQuery.data?.find(o => o.is_default);

  // Get worn accessories
  const wornAccessories = accessoriesQuery.data?.filter(a => a.current_state === 'worn') || [];

  return {
    // Data
    outfits: outfitsQuery.data || [],
    accessories: accessoriesQuery.data || [],
    history: historyQuery.data || [],
    defaultOutfit,
    wornAccessories,

    // Loading states
    isLoading: outfitsQuery.isLoading || accessoriesQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,

    // Outfit mutations
    createOutfit: createOutfitMutation.mutate,
    updateOutfit: (id: string, data: Partial<Outfit>) => updateOutfitMutation.mutate({ id, data }),
    deleteOutfit: deleteOutfitMutation.mutate,
    isCreatingOutfit: createOutfitMutation.isPending,
    isUpdatingOutfit: updateOutfitMutation.isPending,

    // Accessory mutations
    createAccessory: createAccessoryMutation.mutate,
    updateAccessory: (id: string, data: Partial<Accessory>) => updateAccessoryMutation.mutate({ id, data }),
    deleteAccessory: deleteAccessoryMutation.mutate,
    isCreatingAccessory: createAccessoryMutation.isPending,
    isUpdatingAccessory: updateAccessoryMutation.isPending,

    // History
    recordOutfitChange: recordOutfitChangeMutation.mutate,

    // Recommendations
    getRecommendations: (context: SceneContext) =>
      getOutfitRecommendations(outfitsQuery.data || [], context),

    // Prompt generation
    generatePrompt: (outfit: Outfit) =>
      generateOutfitPrompt(outfit, accessoriesQuery.data?.filter(a => a.current_state === 'worn') || []),

    // Templates
    templates: OUTFIT_TEMPLATES,
  };
}

// ============================================================================
// Accessory Manager Hook
// ============================================================================

export function useAccessoryManager(characterId: string | null) {
  const { accessories, updateAccessory, createAccessory, deleteAccessory, isUpdatingAccessory } =
    useCharacterOutfits(characterId);

  const changeState = (accessoryId: string, newState: AccessoryState, sceneId?: string) => {
    updateAccessory(accessoryId, {
      current_state: newState,
      state_changed_scene_id: sceneId,
    });
  };

  const getByCategory = (category: AccessoryCategory) =>
    accessories.filter(a => a.category === category);

  const getSignatureItems = () => accessories.filter(a => a.is_signature);

  const getByState = (state: AccessoryState) => accessories.filter(a => a.current_state === state);

  return {
    accessories,
    changeState,
    getByCategory,
    getSignatureItems,
    getByState,
    createAccessory,
    deleteAccessory,
    isUpdating: isUpdatingAccessory,
  };
}
