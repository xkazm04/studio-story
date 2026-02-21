/**
 * CharRightPanel - Character selection sidebar
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, PlusIcon, Search } from 'lucide-react';
import { useProjectStore } from '@/app/store/projectStore';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { useCharacterStore } from '@/app/store/characterStore';
import type { Character } from '@/app/types/Character';
import { cn } from '@/app/lib/utils';

const CharRightPanel: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const { data: characters, isLoading } = characterApi.useProjectCharacters(selectedProject?.id || '');
  const { selectedCharacter, setSelectedCharacter } = useCharacterStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="w-5 h-5 border-2 border-cyan-500/50 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-slate-500">loading_characters...</span>
      </div>
    );
  }

  if (!characters || characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
        <Users className="w-10 h-10 text-slate-600" />
        <span className="font-mono text-xs text-slate-500">// no_characters_yet</span>
        <p className="text-[10px] text-slate-600 text-center">create in characters tab</p>
      </div>
    );
  }

  const filteredCharacters = characters.filter((char: Character) =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCharacterClick = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/50">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              characters ({filteredCharacters.length})
            </h2>
          </div>
          <button className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-md text-white transition-all duration-200">
            <PlusIcon size={14} />
          </button>
        </div>

        {/* Search */}
        {characters.length > 5 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="search_characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-md pl-8 pr-3 py-1.5
                         font-mono text-xs text-slate-100 placeholder-slate-500
                         focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                         transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* Characters List */}
      <div className="flex-1 overflow-y-auto p-2 ms-scrollbar">
        {filteredCharacters.length === 0 ? (
          <div className="text-center font-mono text-xs text-slate-500 mt-4">
            // no_matches_found
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCharacters.map((character: Character) => {
              const isSelected = character.id === selectedCharacter;

              return (
                <motion.button
                  key={character.id}
                  onClick={() => handleCharacterClick(character.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full p-2.5 rounded-md text-left transition-all duration-200 border',
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-slate-100'
                      : 'bg-slate-900/50 border-slate-800/50 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-md flex items-center justify-center text-xs font-mono font-medium',
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-slate-800/80 text-slate-400'
                      )}
                    >
                      {character.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Character Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">
                        {character.name}
                      </div>
                    </div>

                    {/* Type Badge */}
                    {character.type && (
                      <span
                        className={cn(
                          'font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded',
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800/80 text-slate-500'
                        )}
                      >
                        {character.type}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharRightPanel;
