'use client';

/**
 * Character Appearance with Archetype Integration
 * Wrapper component that adds archetype library support to the stepped appearance form
 */

import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { SectionWrapper } from '@/app/components/UI';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { SteppedAppearanceForm } from './components';
import ArchetypeSelector from '../components/ArchetypeSelector';
import { CharacterArchetype } from '@/app/types/Archetype';

interface CharacterAppearanceWithArchetypesProps {
  characterId: string;
  onArchetypeApplied?: (archetype: CharacterArchetype) => void;
}

/**
 * Enhanced Character Appearance Form with Archetype Library
 * Uses stepped form for focused section editing
 */
const CharacterAppearanceWithArchetypes: React.FC<CharacterAppearanceWithArchetypesProps> = ({
  characterId,
  onArchetypeApplied,
}) => {
  const { selectedProject } = useProjectStore();
  const [showArchetypeSelector, setShowArchetypeSelector] = useState(false);

  const handleArchetypeSelect = (archetype: CharacterArchetype) => {
    if (onArchetypeApplied) {
      onArchetypeApplied(archetype);
    }
    setShowArchetypeSelector(false);
  };

  return (
    <div className="space-y-6">
      {/* Archetype Library Section */}
      <SectionWrapper borderColor="blue" padding="md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-semibold text-white mb-1">Archetype Library</h4>
            <p className="text-xs text-gray-400">
              Choose a pre-built character template to instantly populate all fields
            </p>
          </div>
          <button
            onClick={() => setShowArchetypeSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            title="Browse character archetypes"
            data-testid="open-archetype-library-btn"
          >
            <Wand2 size={16} />
            Browse Archetypes
          </button>
        </div>
        <p className="text-sm text-gray-300">
          Select from curated character templates including heroes, villains, mentors, and more.
          Each archetype comes with complete appearance, backstory, and AI-generated prompts.
        </p>
      </SectionWrapper>

      {/* Stepped Appearance Form */}
      <SteppedAppearanceForm characterId={characterId} />

      {/* Archetype Selector Modal */}
      {showArchetypeSelector && (
        <ArchetypeSelector
          onSelect={handleArchetypeSelect}
          onClose={() => setShowArchetypeSelector(false)}
          currentGenre={(selectedProject as any)?.genre}
        />
      )}
    </div>
  );
};

export default CharacterAppearanceWithArchetypes;
