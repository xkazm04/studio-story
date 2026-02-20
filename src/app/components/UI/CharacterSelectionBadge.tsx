'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X } from 'lucide-react';
import { useCharacterStore } from '@/app/store/slices/characterSlice';
import { characterApi } from '@/app/api/characters';
import { factionApi } from '@/app/api/factions';
import { useProjectStore } from '@/app/store/slices/projectSlice';

/**
 * CharacterSelectionBadge
 *
 * Displays the currently selected character in the app header with:
 * - Character name and avatar
 * - Faction color indicator
 * - Smooth entrance/exit animations
 * - Click to clear selection
 *
 * UI/UX Innovation: Provides persistent visual feedback of character selection
 * across all views, enhancing spatial awareness in the application.
 */
const CharacterSelectionBadge: React.FC = () => {
  const selectedCharacterId = useCharacterStore((state) => state.selectedCharacter);
  const setSelectedCharacter = useCharacterStore((state) => state.setSelectedCharacter);
  const { selectedProject } = useProjectStore();

  // Fetch character data
  const { data: character } = characterApi.useGetCharacter(
    selectedCharacterId || '',
    !!selectedCharacterId
  );

  // Fetch faction data for color
  const { data: faction } = factionApi.useFaction(
    character?.faction_id || '',
    !!character?.faction_id
  );

  // Don't render if no character selected
  if (!selectedCharacterId || !character) {
    return null;
  }

  // Get faction color or default to blue
  const factionColor = faction?.color || '#3B82F6';

  const handleClearSelection = () => {
    setSelectedCharacter(null);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={character.id}
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
        style={{
          boxShadow: `0 0 12px ${factionColor}33`,
        }}
      >
        {/* Faction Color Indicator */}
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: factionColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Character Avatar/Icon */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden"
          style={{
            backgroundColor: `${factionColor}22`,
            color: factionColor,
            border: `1px solid ${factionColor}44`,
          }}
        >
          {character.avatar_url ? (
            <Image
              src={character.avatar_url}
              alt={character.name}
              width={24}
              height={24}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={14} />
          )}
        </div>

        {/* Character Name */}
        <span className="text-sm font-medium text-gray-200 max-w-[150px] truncate">
          {character.name}
        </span>

        {/* Clear Button */}
        <button
          onClick={handleClearSelection}
          className="ml-1 p-0.5 rounded-full hover:bg-gray-700 transition-colors opacity-60 hover:opacity-100"
          title="Clear selection"
        >
          <X size={14} className="text-gray-400" />
        </button>

        {/* Border Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${factionColor}`,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.3, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default CharacterSelectionBadge;
