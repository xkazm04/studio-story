'use client';

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { characterApi } from '@/app/api/characters';
import { factionApi } from '@/app/api/factions';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { CHARACTER_TYPES } from '@/app/store/slices/characterSlice';
import { useOptimisticMutation } from '@/app/hooks/useOptimisticMutation';
import { Character } from '@/app/types/Character';
import { SmartNameInput } from '@/app/components/UI/SmartNameInput';
import { NameSuggestion } from '@/app/types/NameSuggestion';

interface CharacterCreateFormProps {
  onClose: () => void;
}

const CharacterCreateForm: React.FC<CharacterCreateFormProps> = ({ onClose }) => {
  const { selectedProject } = useProjectStore();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [factionId, setFactionId] = useState('');

  const { data: factions = [] } = factionApi.useFactions(
    selectedProject?.id || '',
    !!selectedProject
  );

  const { data: existingCharacters = [] } = characterApi.useProjectCharacters(
    selectedProject?.id || '',
    !!selectedProject
  );

  // Build context for name suggestions
  const nameContext = useMemo(() => {
    const selectedFaction = factions.find(f => f.id === factionId);
    return {
      projectTitle: selectedProject?.name,
      projectDescription: selectedProject?.description,
      genre: (selectedProject as any)?.genre,
      existingCharacters: existingCharacters.map(c => ({ name: c.name, role: c.type })),
      characterRole: type,
      characterType: type,
      faction: selectedFaction?.name,
    };
  }, [selectedProject, factions, factionId, type, existingCharacters]);

  // Use optimistic mutation for character creation
  const { mutate: createCharacter, isLoading, rollbackError } = useOptimisticMutation<
    Character,
    {
      name: string;
      project_id: string;
      type?: string;
      faction_id?: string;
    }
  >({
    mutationFn: characterApi.createCharacter,
    affectedQueryKeys: [
      ['characters', 'project', selectedProject?.id],
      ['relationships', selectedProject?.id],
    ],
    toastMessage: 'Creating character...',
    enableUndo: true,
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create character:', error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedProject) return;

    await createCharacter({
      name: name.trim(),
      project_id: selectedProject.id,
      type: type || undefined,
      faction_id: factionId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Create New Character</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <SmartNameInput
        entityType="character"
        context={nameContext}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onSuggestionSelect={(suggestion: NameSuggestion) => {
          setName(suggestion.name);
        }}
        label="Character Name"
        placeholder="Enter character name or let AI suggest..."
        required
        enableSuggestions={true}
        data-testid="character-name-input"
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select type (optional)</option>
          {CHARACTER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Faction</label>
        <select
          value={factionId}
          onChange={(e) => setFactionId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Independent (no faction)</option>
          {factions.map((faction) => (
            <option key={faction.id} value={faction.id}>
              {faction.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Character'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Error display */}
      {rollbackError && (
        <div className="mt-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
          {rollbackError}
        </div>
      )}
    </form>
  );
};

export default CharacterCreateForm;
