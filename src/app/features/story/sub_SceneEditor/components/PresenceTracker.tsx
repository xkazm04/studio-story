'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  User,
  MessageCircle,
  ArrowRightCircle,
  ArrowLeftCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { presenceDetector, type CharacterPresence, type PresenceRole } from '@/lib/context';
import type { Character, CharRelationship } from '@/app/types/Character';

interface PresenceTrackerProps {
  content: string;
  characters: Character[];
  relationships?: CharRelationship[];
  onCharacterClick?: (characterId: string) => void;
  onAddCharacter?: (characterId: string) => void;
  className?: string;
}

const ROLE_ICONS: Record<PresenceRole, React.ReactNode> = {
  mentioned: <Eye className="w-3 h-3" />,
  speaking: <MessageCircle className="w-3 h-3" />,
  acting: <User className="w-3 h-3" />,
  observing: <Eye className="w-3 h-3" />,
  entering: <ArrowRightCircle className="w-3 h-3" />,
  leaving: <ArrowLeftCircle className="w-3 h-3" />,
};

const ROLE_COLORS: Record<PresenceRole, string> = {
  mentioned: 'text-slate-400',
  speaking: 'text-cyan-400',
  acting: 'text-amber-400',
  observing: 'text-slate-400',
  entering: 'text-green-400',
  leaving: 'text-red-400',
};

/**
 * PresenceTracker - Shows which characters are present in the current scene
 */
export const PresenceTracker: React.FC<PresenceTrackerProps> = ({
  content,
  characters,
  relationships = [],
  onCharacterClick,
  onAddCharacter,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Analyze character presence in content
  const presence = useMemo(() => {
    return presenceDetector.analyzePresence(content, characters);
  }, [content, characters]);

  // Get relationships between present characters
  const relevantRelationships = useMemo(() => {
    const presentIds = new Set(presence.presentCharacters.map(p => p.characterId));
    return relationships.filter(
      r => presentIds.has(r.character_a_id) && presentIds.has(r.character_b_id)
    );
  }, [presence.presentCharacters, relationships]);

  // Characters not in scene (for adding)
  const absentCharacters = useMemo(() => {
    const presentIds = new Set(presence.presentCharacters.map(p => p.characterId));
    return characters.filter(c => !presentIds.has(c.id));
  }, [characters, presence.presentCharacters]);

  // Filtered absent characters for search
  const filteredAbsent = useMemo(() => {
    if (!searchQuery) return absentCharacters;
    const query = searchQuery.toLowerCase();
    return absentCharacters.filter(c => c.name.toLowerCase().includes(query));
  }, [absentCharacters, searchQuery]);

  // Render confidence bar
  const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => (
    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          confidence >= 0.7 ? 'bg-green-500' :
          confidence >= 0.4 ? 'bg-amber-500' : 'bg-slate-600'
        )}
        style={{ width: `${confidence * 100}%` }}
      />
    </div>
  );

  // Render character presence item
  const renderCharacterPresence = (charPresence: CharacterPresence) => {
    const character = characters.find(c => c.id === charPresence.characterId);

    return (
      <motion.div
        key={charPresence.characterId}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
          'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
        )}
        onClick={() => onCharacterClick?.(charPresence.characterId)}
      >
        {/* Avatar or Initial */}
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {character?.avatar_url ? (
            <img
              src={character.avatar_url}
              alt={charPresence.characterName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-slate-400">
              {charPresence.characterName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-200 truncate">
              {charPresence.characterName}
            </span>
            {charPresence.isSpeaking && (
              <MessageCircle className="w-3 h-3 text-cyan-400" />
            )}
          </div>

          {/* Roles */}
          <div className="flex items-center gap-1 mt-0.5">
            {charPresence.roles.map(role => (
              <span
                key={role}
                className={cn('flex items-center gap-0.5 text-[9px]', ROLE_COLORS[role])}
                title={role}
              >
                {ROLE_ICONS[role]}
              </span>
            ))}
            <span className="text-[9px] text-slate-600 ml-1">
              {charPresence.mentionCount}x
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="shrink-0">
          <ConfidenceBar confidence={charPresence.confidence} />
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn('bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Character Presence</span>
          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
            {presence.presentCharacters.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* No characters message */}
              {presence.presentCharacters.length === 0 && (
                <div className="text-center py-4">
                  <User className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No characters detected</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Write character names to track presence
                  </p>
                </div>
              )}

              {/* Present characters list */}
              {presence.presentCharacters.length > 0 && (
                <div className="space-y-1.5">
                  {presence.presentCharacters
                    .sort((a, b) => b.confidence - a.confidence)
                    .map(renderCharacterPresence)}
                </div>
              )}

              {/* Dominant character highlight */}
              {presence.dominantCharacter && presence.presentCharacters.length > 1 && (
                <div className="px-2 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[10px] text-cyan-300">
                  <span className="font-medium">{presence.dominantCharacter.characterName}</span>
                  <span className="text-cyan-400/70"> is the focus of this scene</span>
                </div>
              )}

              {/* Relevant relationships */}
              {relevantRelationships.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                    Active Relationships
                  </div>
                  <div className="space-y-1">
                    {relevantRelationships.slice(0, 3).map(rel => {
                      const charA = characters.find(c => c.id === rel.character_a_id);
                      const charB = characters.find(c => c.id === rel.character_b_id);
                      return (
                        <div
                          key={rel.id}
                          className="text-[10px] text-slate-400 px-2 py-1 bg-slate-800/50 rounded"
                        >
                          <span className="text-slate-300">{charA?.name}</span>
                          <span className="text-slate-500"> ↔ </span>
                          <span className="text-slate-300">{charB?.name}</span>
                          {rel.relationship_type && (
                            <span className="text-slate-600 ml-1">({rel.relationship_type})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add character button */}
              <button
                onClick={() => setShowAddDialog(!showAddDialog)}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border border-dashed border-slate-700 rounded text-[10px] text-slate-500 hover:text-slate-400 hover:border-slate-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add character mention
              </button>

              {/* Add character dialog */}
              <AnimatePresence>
                {showAddDialog && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 space-y-2"
                  >
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search characters..."
                        className="w-full pl-7 pr-2 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                        autoFocus
                      />
                    </div>

                    {/* Character list */}
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {filteredAbsent.length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-2">
                          No characters available
                        </p>
                      ) : (
                        filteredAbsent.map(char => (
                          <button
                            key={char.id}
                            onClick={() => {
                              onAddCharacter?.(char.id);
                              setShowAddDialog(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700/50 transition-colors text-left"
                          >
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                              {char.avatar_url ? (
                                <img src={char.avatar_url} alt={char.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] text-slate-400">{char.name.charAt(0)}</span>
                              )}
                            </div>
                            <span className="text-xs text-slate-300">{char.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresenceTracker;
