import { create } from 'zustand';
import { Character } from '../../types/Character';

export const CHARACTER_TYPES = ["Key", "Major", "Minor", "Other"] as const;

/**
 * Character Store State Interface
 *
 * Manages character domain state including:
 * - Character selection for details view
 * - Project characters cache (synced with React Query)
 * - UI filters (type, faction)
 */
export interface CharacterState {
  // Selection State
  selectedCharacter: string | null;
  setSelectedCharacter: (id: string | null) => void;

  // Character Cache (managed by React Query hooks)
  projectCharacters: Character[];
  setProjectCharacters: (characters: Character[]) => void;

  // UI Filter State
  activeType: string;
  setActiveType: (type: string) => void;
  factionId: string | undefined;
  setFactionId: (id: string | undefined) => void;

  // Utility Actions
  clearCharacterState: () => void;
  resetFilters: () => void;
}

/**
 * Character Store Implementation
 *
 * Uses Zustand for lightweight state management with proper immutability patterns.
 * Components should use selectors to prevent unnecessary re-renders:
 *
 * @example
 * // Good - only re-renders when selectedCharacter changes
 * const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);
 *
 * // Bad - re-renders on any state change
 * const { selectedCharacter } = useCharacterStore();
 */
export const useCharacterStore = create<CharacterState>((set) => ({
  // Selection State
  selectedCharacter: null,
  setSelectedCharacter: (id) => set({ selectedCharacter: id }),

  // Character Cache
  projectCharacters: [],
  setProjectCharacters: (characters) => set({ projectCharacters: characters }),

  // UI Filter State
  activeType: "Main",
  setActiveType: (type) => set({ activeType: type }),
  factionId: undefined,
  setFactionId: (id) => set({ factionId: id }),

  // Utility Actions
  clearCharacterState: () => set({
    selectedCharacter: null,
    projectCharacters: [],
    activeType: "Main",
    factionId: undefined,
  }),

  resetFilters: () => set({
    activeType: "Main",
    factionId: undefined,
  }),
}));

// Selector Helpers for Common Use Cases
// Use these to prevent unnecessary re-renders in components

/**
 * Selector: Get only the selected character ID
 * Use when you only need to know which character is selected
 */
export const selectSelectedCharacterId = (state: CharacterState) => state.selectedCharacter;

/**
 * Selector: Get only the setter function
 * Use when you only need to update selection without reading current value
 */
export const selectSetSelectedCharacter = (state: CharacterState) => state.setSelectedCharacter;

/**
 * Selector: Get project characters
 * Use when displaying character lists
 */
export const selectProjectCharacters = (state: CharacterState) => state.projectCharacters;

/**
 * Selector: Get active filters
 * Use when you need current filter state
 */
export const selectFilters = (state: CharacterState) => ({
  activeType: state.activeType,
  factionId: state.factionId,
});
