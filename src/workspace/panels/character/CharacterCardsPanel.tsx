'use client';

import React, { useState } from 'react';
import { Users, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../../store/workspaceStore';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState } from '../shared/PanelPrimitives';

interface CharacterCardsPanelProps {
  sceneId?: string;
  projectId?: string;
  compact?: boolean;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  onClose?: () => void;
}

export default function CharacterCardsPanel({
  projectId: propProjectId,
  onTriggerSkill,
  onClose,
}: CharacterCardsPanelProps) {
  const { selectedProject } = useProjectStore();
  const resolvedProjectId = propProjectId || selectedProject?.id || '';
  const { data: characters = [] } = characterApi.useProjectCharacters(
    resolvedProjectId,
    !!resolvedProjectId
  );

  const [search, setSearch] = useState('');
  const creatorPanel = useWorkspaceStore((s) => s.getPanelByType('character-creator'));
  const updatePanelProps = useWorkspaceStore((s) => s.updatePanelProps);

  const handleCharacterClick = (charId: string) => {
    // If character-creator panel is open, push characterId to it
    if (creatorPanel) {
      updatePanelProps(creatorPanel.id, { characterId: charId });
    }
    onTriggerSkill?.('character-backstory', { characterId: charId });
  };

  const filtered = search
    ? characters.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : characters;

  return (
    <PanelFrame
      title={`Characters (${characters.length})`}
      icon={Users}
      onClose={onClose}
      headerAccent="cyan"
    >
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="border-b border-slate-800/50 px-3 py-2">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">
            <Search className="w-3 h-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search characters..."
              className="flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder-slate-600"
            />
          </div>
        </div>

        {/* Character grid */}
        <div className="flex-1 overflow-auto p-3">
          {filtered.length === 0 ? (
            <PanelEmptyState
              icon={User}
              title={characters.length === 0 ? 'No characters yet' : 'No matching characters'}
              description={characters.length === 0 ? 'Create or import characters to populate this panel.' : 'Try a different search query.'}
            />
          ) : (
            <div className="grid gap-2.5">
              <AnimatePresence mode="popLayout">
                {filtered.map((char) => (
                  <motion.button
                    key={char.id}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={() => handleCharacterClick(char.id)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2 text-left',
                      'bg-slate-900/40 border border-slate-800/40',
                      'transition-colors hover:border-slate-700/60 hover:bg-slate-800/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40'
                    )}
                  >
                    {char.avatar_url ? (
                      <img
                        src={char.avatar_url}
                        alt={char.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700/50"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{char.name}</p>
                      {char.type && (
                        <p className="text-[10px] text-slate-500 truncate">{char.type}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  );
}
