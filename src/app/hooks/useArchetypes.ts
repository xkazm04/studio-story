/**
 * useArchetypes Hook
 *
 * Provides archetype data management including:
 * - Loading built-in and custom archetypes
 * - CRUD operations for custom archetypes
 * - Archetype filtering and search
 * - Blending and variation operations
 * - Compatibility scoring
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CharacterArchetype, ArchetypeCategory, ArchetypeGenre } from '@/app/types/Archetype';
import {
  ARCHETYPE_LIBRARY,
  getArchetypesByCategory,
  getArchetypesByGenre,
  searchArchetypes,
  getAllCategories,
  getArchetypeById,
} from '@/app/lib/archetypes/archetypeLibrary';
import {
  HierarchicalArchetype,
  BlendResult,
  BlendSource,
  CompatibilityScore,
  VariationOptions,
  OverrideMask,
  CreateCustomArchetypeInput,
  blendArchetypes,
  generateVariations,
  calculateCompatibility,
  rankByCompatibility,
  createCustomArchetype,
  extractArchetypeFromCharacter,
  suggestBlendCombinations,
  createDefaultOverrideMask,
  countOverrides,
  serializeOverrideMask,
  deserializeOverrideMask,
} from '@/app/features/characters/lib/archetypeEngine';
import { Appearance } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

export interface ArchetypeFilters {
  category?: ArchetypeCategory | 'all';
  genre?: ArchetypeGenre | 'all';
  searchTerm?: string;
  includeCustom?: boolean;
  sortBy?: 'popularity' | 'name' | 'category' | 'compatibility';
}

export interface CustomArchetypeData {
  id: string;
  user_id: string;
  name: string;
  category: ArchetypeCategory;
  data: HierarchicalArchetype;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API Functions (mock-friendly)
// ============================================================================

async function fetchCustomArchetypes(userId: string): Promise<CustomArchetypeData[]> {
  // TODO: Replace with actual API call when backend is ready
  const stored = localStorage.getItem(`custom_archetypes_${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

async function saveCustomArchetype(
  userId: string,
  archetype: HierarchicalArchetype
): Promise<CustomArchetypeData> {
  // TODO: Replace with actual API call
  const existing = await fetchCustomArchetypes(userId);
  const now = new Date().toISOString();

  const data: CustomArchetypeData = {
    id: archetype.id,
    user_id: userId,
    name: archetype.name,
    category: archetype.category,
    data: archetype,
    created_at: now,
    updated_at: now,
  };

  const existingIndex = existing.findIndex(a => a.id === archetype.id);
  if (existingIndex >= 0) {
    existing[existingIndex] = { ...data, created_at: existing[existingIndex].created_at };
  } else {
    existing.push(data);
  }

  localStorage.setItem(`custom_archetypes_${userId}`, JSON.stringify(existing));
  return data;
}

async function deleteCustomArchetype(userId: string, archetypeId: string): Promise<void> {
  // TODO: Replace with actual API call
  const existing = await fetchCustomArchetypes(userId);
  const filtered = existing.filter(a => a.id !== archetypeId);
  localStorage.setItem(`custom_archetypes_${userId}`, JSON.stringify(filtered));
}

// ============================================================================
// Main Hook
// ============================================================================

export function useArchetypes(userId?: string) {
  const queryClient = useQueryClient();

  // Query for custom archetypes
  const customArchetypesQuery = useQuery({
    queryKey: ['customArchetypes', userId],
    queryFn: () => fetchCustomArchetypes(userId || 'anonymous'),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combine built-in and custom archetypes
  const allArchetypes = useMemo((): HierarchicalArchetype[] => {
    const builtIn: HierarchicalArchetype[] = ARCHETYPE_LIBRARY.map(a => ({
      ...a,
      level: 'specific' as const,
    }));

    const custom = customArchetypesQuery.data?.map(c => c.data) || [];

    return [...builtIn, ...custom];
  }, [customArchetypesQuery.data]);

  // Create archetype map for quick lookup
  const archetypeMap = useMemo(() => {
    const map = new Map<string, HierarchicalArchetype>();
    allArchetypes.forEach(a => map.set(a.id, a));
    return map;
  }, [allArchetypes]);

  // Mutation for saving custom archetypes
  const saveArchetypeMutation = useMutation({
    mutationFn: (archetype: HierarchicalArchetype) =>
      saveCustomArchetype(userId || 'anonymous', archetype),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customArchetypes', userId] });
    },
  });

  // Mutation for deleting custom archetypes
  const deleteArchetypeMutation = useMutation({
    mutationFn: (archetypeId: string) =>
      deleteCustomArchetype(userId || 'anonymous', archetypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customArchetypes', userId] });
    },
  });

  return {
    // Data
    archetypes: allArchetypes,
    customArchetypes: customArchetypesQuery.data || [],
    builtInArchetypes: ARCHETYPE_LIBRARY,
    archetypeMap,
    isLoading: customArchetypesQuery.isLoading,

    // Mutations
    saveArchetype: saveArchetypeMutation.mutate,
    deleteArchetype: deleteArchetypeMutation.mutate,
    isSaving: saveArchetypeMutation.isPending,
    isDeleting: deleteArchetypeMutation.isPending,

    // Lookup
    getById: useCallback(
      (id: string) => archetypeMap.get(id) || getArchetypeById(id),
      [archetypeMap]
    ),

    // Categories
    categories: getAllCategories(),
  };
}

// ============================================================================
// Filter Hook
// ============================================================================

export function useArchetypeFilters(archetypes: CharacterArchetype[]) {
  const [filters, setFilters] = useState<ArchetypeFilters>({
    category: 'all',
    genre: 'all',
    searchTerm: '',
    includeCustom: true,
    sortBy: 'popularity',
  });

  const filteredArchetypes = useMemo(() => {
    let result = [...archetypes];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      result = result.filter(a => a.category === filters.category);
    }

    // Filter by genre
    if (filters.genre && filters.genre !== 'all') {
      result = result.filter(
        a => a.genre.includes(filters.genre as ArchetypeGenre) || a.genre.includes('all')
      );
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term) ||
          a.tags.some(t => t.toLowerCase().includes(term))
      );
    }

    // Filter custom archetypes
    if (!filters.includeCustom) {
      result = result.filter(a => !(a as HierarchicalArchetype).isCustom);
    }

    // Sort
    switch (filters.sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'popularity':
      default:
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
    }

    return result;
  }, [archetypes, filters]);

  const updateFilters = useCallback((updates: Partial<ArchetypeFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      category: 'all',
      genre: 'all',
      searchTerm: '',
      includeCustom: true,
      sortBy: 'popularity',
    });
  }, []);

  return {
    filters,
    filteredArchetypes,
    updateFilters,
    resetFilters,
    resultCount: filteredArchetypes.length,
  };
}

// ============================================================================
// Blending Hook
// ============================================================================

export interface BlendState {
  sources: { archetype: CharacterArchetype; weight: number }[];
  result: BlendResult | null;
}

export function useArchetypeBlending() {
  const [blendState, setBlendState] = useState<BlendState>({
    sources: [],
    result: null,
  });

  const addSource = useCallback((archetype: CharacterArchetype, weight: number = 0.5) => {
    setBlendState(prev => {
      // Max 3 sources
      if (prev.sources.length >= 3) {
        return prev;
      }

      // Don't add duplicates
      if (prev.sources.some(s => s.archetype.id === archetype.id)) {
        return prev;
      }

      return {
        ...prev,
        sources: [...prev.sources, { archetype, weight }],
        result: null,
      };
    });
  }, []);

  const removeSource = useCallback((archetypeId: string) => {
    setBlendState(prev => ({
      ...prev,
      sources: prev.sources.filter(s => s.archetype.id !== archetypeId),
      result: null,
    }));
  }, []);

  const updateWeight = useCallback((archetypeId: string, weight: number) => {
    setBlendState(prev => ({
      ...prev,
      sources: prev.sources.map(s =>
        s.archetype.id === archetypeId ? { ...s, weight: Math.max(0.1, Math.min(1, weight)) } : s
      ),
      result: null,
    }));
  }, []);

  const performBlend = useCallback(() => {
    if (blendState.sources.length < 2) {
      return null;
    }

    const result = blendArchetypes(blendState.sources);
    setBlendState(prev => ({ ...prev, result }));
    return result;
  }, [blendState.sources]);

  const clearBlend = useCallback(() => {
    setBlendState({ sources: [], result: null });
  }, []);

  const getSuggestions = useCallback(
    (archetype: CharacterArchetype) => suggestBlendCombinations(archetype),
    []
  );

  return {
    blendState,
    addSource,
    removeSource,
    updateWeight,
    performBlend,
    clearBlend,
    getSuggestions,
    canBlend: blendState.sources.length >= 2,
  };
}

// ============================================================================
// Variation Hook
// ============================================================================

export function useArchetypeVariations(archetype: CharacterArchetype | null) {
  const [variations, setVariations] = useState<CharacterArchetype[]>([]);
  const [options, setOptions] = useState<VariationOptions>({
    variationStrength: 'moderate',
    allowGenderSwap: false,
    allowAgeShift: false,
  });

  const generate = useCallback(
    (count: number = 5) => {
      if (!archetype) return [];

      const newVariations = generateVariations(archetype, count, options);
      setVariations(newVariations);
      return newVariations;
    },
    [archetype, options]
  );

  const updateOptions = useCallback((updates: Partial<VariationOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const clearVariations = useCallback(() => {
    setVariations([]);
  }, []);

  return {
    variations,
    options,
    generate,
    updateOptions,
    clearVariations,
  };
}

// ============================================================================
// Compatibility Hook
// ============================================================================

export function useArchetypeCompatibility(existingCast: CharacterArchetype[]) {
  const [compatibilityCache, setCompatibilityCache] = useState<
    Map<string, CompatibilityScore>
  >(new Map());

  const getCompatibility = useCallback(
    (candidate: CharacterArchetype): CompatibilityScore => {
      const cached = compatibilityCache.get(candidate.id);
      if (cached) return cached;

      const score = calculateCompatibility(candidate, existingCast);
      setCompatibilityCache(prev => new Map(prev).set(candidate.id, score));
      return score;
    },
    [existingCast, compatibilityCache]
  );

  const rankCandidates = useCallback(
    (candidates: CharacterArchetype[]) => rankByCompatibility(candidates, existingCast),
    [existingCast]
  );

  // Clear cache when cast changes
  const clearCache = useCallback(() => {
    setCompatibilityCache(new Map());
  }, []);

  return {
    getCompatibility,
    rankCandidates,
    clearCache,
  };
}

// ============================================================================
// Override Tracking Hook
// ============================================================================

export function useOverrideTracking(initialMask?: OverrideMask) {
  const [mask, setMask] = useState<OverrideMask>(
    initialMask || createDefaultOverrideMask()
  );

  const markOverridden = useCallback((field: string, subField?: string) => {
    setMask(prev => {
      const newMask = { ...prev };

      if (field === 'face' && subField) {
        newMask.face = { ...newMask.face, [subField]: true };
      } else if (field === 'clothing' && subField) {
        newMask.clothing = { ...newMask.clothing, [subField]: true };
      } else if (field in newMask) {
        (newMask as Record<string, unknown>)[field] = true;
      }

      return newMask;
    });
  }, []);

  const markInherited = useCallback((field: string, subField?: string) => {
    setMask(prev => {
      const newMask = { ...prev };

      if (field === 'face' && subField) {
        newMask.face = { ...newMask.face, [subField]: false };
      } else if (field === 'clothing' && subField) {
        newMask.clothing = { ...newMask.clothing, [subField]: false };
      } else if (field in newMask) {
        (newMask as Record<string, unknown>)[field] = false;
      }

      return newMask;
    });
  }, []);

  const isOverridden = useCallback(
    (field: string, subField?: string): boolean => {
      if (field === 'face' && subField) {
        return mask.face[subField as keyof typeof mask.face] || false;
      }
      if (field === 'clothing' && subField) {
        return mask.clothing[subField as keyof typeof mask.clothing] || false;
      }
      if (field in mask) {
        const value = mask[field as keyof OverrideMask];
        return typeof value === 'boolean' ? value : false;
      }
      return false;
    },
    [mask]
  );

  const resetMask = useCallback(() => {
    setMask(createDefaultOverrideMask());
  }, []);

  const overrideCount = useMemo(() => countOverrides(mask), [mask]);

  const serialize = useCallback(() => serializeOverrideMask(mask), [mask]);

  const deserialize = useCallback((serialized: string) => {
    setMask(deserializeOverrideMask(serialized));
  }, []);

  return {
    mask,
    markOverridden,
    markInherited,
    isOverridden,
    resetMask,
    overrideCount,
    serialize,
    deserialize,
  };
}

// ============================================================================
// Custom Archetype Creation Hook
// ============================================================================

export function useCustomArchetypeCreation(userId: string) {
  const { saveArchetype, isSaving } = useArchetypes(userId);

  const createFromCharacter = useCallback(
    (
      character: {
        id: string;
        name: string;
        appearance: Appearance;
        backstory?: string;
        motivations?: string;
        personality?: string;
        type?: string;
      },
      customizations?: Partial<CreateCustomArchetypeInput>
    ) => {
      const extracted = extractArchetypeFromCharacter(character);
      const input: CreateCustomArchetypeInput = {
        name: customizations?.name || extracted.name || `${character.name} Archetype`,
        category: customizations?.category || extracted.category || 'Hero',
        appearance: customizations?.appearance || extracted.appearance || character.appearance,
        backstory: customizations?.backstory || extracted.backstory || '',
        motivations: customizations?.motivations || extracted.motivations || '',
        personality: customizations?.personality || extracted.personality || '',
        tags: customizations?.tags || extracted.tags || [],
        genres: customizations?.genres || extracted.genres || ['all'],
        basedOnId: customizations?.basedOnId,
      };

      const archetype = createCustomArchetype(input, userId, character.id);
      saveArchetype(archetype);
      return archetype;
    },
    [userId, saveArchetype]
  );

  const createFromScratch = useCallback(
    (input: CreateCustomArchetypeInput) => {
      const archetype = createCustomArchetype(input, userId);
      saveArchetype(archetype);
      return archetype;
    },
    [userId, saveArchetype]
  );

  return {
    createFromCharacter,
    createFromScratch,
    isSaving,
  };
}
