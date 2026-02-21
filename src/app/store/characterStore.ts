/**
 * @deprecated This file is maintained for backward compatibility only.
 * Please import from '@/app/store/slices/characterSlice' instead.
 *
 * This re-export ensures existing imports continue to work during migration.
 * Will be removed in a future version.
 */

export {
  useCharacterStore,
  CHARACTER_TYPES,
  selectSelectedCharacterId,
  selectSetSelectedCharacter,
  selectProjectCharacters,
  selectFilters,
  type CharacterState,
} from './slices/characterSlice';
