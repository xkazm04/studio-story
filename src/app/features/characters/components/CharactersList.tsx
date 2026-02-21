/**
 * CharactersList - Grid display of character cards
 * Design: Clean Manuscript style with faction filtering
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Character } from '@/app/types/Character';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { factionApi } from '@/app/api/factions';
import CharacterCard from './CharacterCard';
import CharacterCreateForm from './CharacterCreateForm';

interface CharactersListProps {
  characters: Character[];
  isLoading?: boolean;
}

const CharactersList: React.FC<CharactersListProps> = ({ characters }) => {
  const { selectedProject } = useProjectStore();
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { data: factions = [] } = factionApi.useFactions(
    selectedProject?.id || '',
    !!selectedProject
  );

  // Group characters by faction
  const organizedCharacters = React.useMemo(() => {
    const grouped: Record<string, Character[]> = { independent: [] };

    factions.forEach((faction) => {
      grouped[faction.id] = [];
    });

    characters.forEach((char) => {
      if (char.faction_id && grouped[char.faction_id]) {
        grouped[char.faction_id].push(char);
      } else {
        grouped.independent.push(char);
      }
    });

    return grouped;
  }, [characters, factions]);

  const displayedCharacters = selectedFaction
    ? organizedCharacters[selectedFaction] || []
    : characters;

  return (
    <div className="space-y-4 pt-2">
      {/* Header with Faction Filters and Create Button */}
      <div className="flex justify-between items-center gap-3">
        {/* Faction Filters */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedFaction(null)}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wide transition-all duration-200',
              selectedFaction === null
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            all ({characters.length})
          </button>
          {factions.map((faction) => (
            <button
              key={faction.id}
              onClick={() => setSelectedFaction(faction.id)}
              className={cn(
                'px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wide transition-all duration-200',
                selectedFaction === faction.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {faction.name.toLowerCase()} ({organizedCharacters[faction.id]?.length || 0})
            </button>
          ))}
          <button
            onClick={() => setSelectedFaction('independent')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wide transition-all duration-200',
              selectedFaction === 'independent'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            independent ({organizedCharacters.independent?.length || 0})
          </button>
        </div>

        {/* Create Button */}
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs
                     bg-cyan-600 hover:bg-cyan-500 text-white
                     transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wide">new_character</span>
        </button>
      </div>

      {/* Create Character Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative bg-slate-900/80 rounded-lg border border-cyan-500/30 p-6 backdrop-blur-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/50 via-cyan-400/30 to-cyan-500/50" />
            <CharacterCreateForm onClose={() => setIsCreating(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {displayedCharacters.map((character, index) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.35,
                delay: index * 0.04,
                ease: [0.4, 0, 0.2, 1],
              }}
              whileHover={{
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
            >
              <CharacterCard character={character} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {displayedCharacters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users className="w-10 h-10 text-slate-600" />
          <span className="font-mono text-xs text-slate-500">// no_characters_found</span>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono hover:underline"
          >
            create_first_character
          </button>
        </div>
      )}
    </div>
  );
};

export default CharactersList;
