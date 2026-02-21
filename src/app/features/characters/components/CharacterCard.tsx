/**
 * CharacterCard - Individual character display card
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Character } from '@/app/types/Character';
import { useCharacterStore } from '@/app/store/slices/characterSlice';
import { characterApi } from '@/app/api/characters';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useOptimisticMutation } from '@/app/hooks/useOptimisticMutation';

interface CharacterCardProps {
  character: Character;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);
  const setSelectedCharacter = useCharacterStore((state) => state.setSelectedCharacter);
  const { selectedProject } = useProjectStore();

  const isSelected = selectedCharacter === character.id;

  const { mutate: deleteCharacter, isLoading: isDeleting, rollbackError } = useOptimisticMutation<
    void,
    string
  >({
    mutationFn: characterApi.deleteCharacter,
    affectedQueryKeys: [
      ['characters', 'project', selectedProject?.id],
      ['relationships', selectedProject?.id],
    ],
    toastMessage: `Deleting ${character.name}...`,
    enableUndo: true,
    onError: (error) => {
      console.error('Failed to delete character:', error);
    },
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${character.name}?`)) return;
    await deleteCharacter(character.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDeleting ? 0.5 : 1,
        scale: isDeleting ? 0.97 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => !isDeleting && setSelectedCharacter(character.id)}
      tabIndex={0}
      role="button"
      aria-label={`Select character ${character.name}`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDeleting) {
          e.preventDefault();
          setSelectedCharacter(character.id);
        }
      }}
      data-testid={`character-card-${character.id}`}
      className={cn(
        'relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-200',
        'border backdrop-blur-sm',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950',
        isSelected
          ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
          : 'border-slate-700/50 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800/80',
        isDeleting && 'pointer-events-none'
      )}
    >
      {/* Deleting overlay */}
      {isDeleting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
        >
          <span className="font-mono text-xs text-red-400 animate-pulse">deleting...</span>
        </motion.div>
      )}

      {/* Character Avatar */}
      <div className="aspect-square relative bg-slate-800/50">
        {character.avatar_url ? (
          <Image
            src={character.avatar_url}
            alt={character.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-slate-600">
              {character.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="p-3">
        <h3 className="font-medium text-slate-100 text-sm truncate">{character.name}</h3>
        {character.type && (
          <span className="inline-block mt-1.5 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide
                         bg-slate-800/80 text-slate-400 border border-slate-700/50 rounded">
            {character.type}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDelete}
          data-testid={`character-delete-btn-${character.id}`}
          className="p-1.5 bg-red-600/80 hover:bg-red-500 disabled:opacity-50
                     text-white rounded-md transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-red-500/50"
          aria-label={`Delete character ${character.name}`}
          disabled={isDeleting}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Error display */}
      {rollbackError && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-900/90 text-red-200 font-mono text-[10px]">
          {rollbackError}
        </div>
      )}
    </motion.div>
  );
};

export default CharacterCard;
