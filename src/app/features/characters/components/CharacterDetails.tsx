'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, BookOpen, Palette, Heart, Shield, Image as ImageIcon, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { characterApi } from '@/app/api/characters';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import CharacterAbout from '../sub_CharacterTraits/CharacterAbout';
import CharacterRelationships from './CharacterRelationships';
import { CharacterAppearanceForm } from '../sub_CharacterCreator';
import CharacterConsistencyPanel from './CharacterConsistencyPanel';
import { ImageGenerator } from '../sub_ImageGenerator';
import { AvatarGenerator } from '../sub_AvatarGenerator';
import AppearanceTimeline from './AppearanceTimeline';
import ReferenceSheetExporter from './ReferenceSheetExporter';
import { defaultAppearance, Appearance } from '@/app/types/Character';
import { useAvatarTimeline } from '@/app/hooks/integration/useAvatarTimeline';
import { MilestoneManager } from '@/lib/evolution/MilestoneManager';

interface CharacterDetailsProps {
  characterId: string;
}

const CharacterDetails: React.FC<CharacterDetailsProps> = ({ characterId }) => {
  const { data: character, isLoading } = characterApi.useGetCharacter(characterId);
  const [activeTab, setActiveTab] = useState<'info' | 'about' | 'appearance' | 'relationships' | 'consistency' | 'image_gen' | 'avatar_gen' | 'timeline'>('info');
  const [showExporter, setShowExporter] = useState(false);

  // Fetch avatar timeline for the exporter
  const { timeline } = useAvatarTimeline(characterId);

  // Create milestone manager for exporter
  const milestones = useMemo(() => {
    const manager = new MilestoneManager();
    timeline.forEach((entry) => {
      const milestone = manager.fromAvatarHistoryEntry(entry);
      manager.createMilestone(characterId, milestone);
    });
    return manager.getSortedMilestones(characterId);
  }, [timeline, characterId]);

  // Fetch appearance data for image/avatar generation
  const { data: appearanceData } = useQuery<Appearance | null>({
    queryKey: ['character-appearance', characterId],
    queryFn: async () => {
      const response = await fetch(`/api/char-appearance?character_id=${characterId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data || defaultAppearance;
    },
    enabled: !!characterId,
  });

  const appearance = appearanceData || defaultAppearance;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Character not found
      </div>
    );
  }

  const tabs = [
    { id: 'info' as const, label: 'info', icon: <User size={14} /> },
    { id: 'about' as const, label: 'about', icon: <BookOpen size={14} /> },
    { id: 'appearance' as const, label: 'appearance', icon: <Palette size={14} /> },
    { id: 'timeline' as const, label: 'timeline', icon: <Clock size={14} /> },
    { id: 'relationships' as const, label: 'relations', icon: <Heart size={14} /> },
    { id: 'consistency' as const, label: 'consistency', icon: <Shield size={14} /> },
    { id: 'image_gen' as const, label: 'image_gen', icon: <ImageIcon size={14} /> },
    { id: 'avatar_gen' as const, label: 'avatar_gen', icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs Navigation - Clean Manuscript style */}
      <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all duration-200',
              activeTab === tab.id
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
            )}
            data-testid={`character-detail-tab-${tab.id}`}
          >
            {tab.icon}
            <span className="uppercase tracking-wide">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'info' && (
          <div className="relative bg-slate-900/60 rounded-lg border border-slate-800/50 p-6">
            <ColoredBorder color="blue" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300 mb-4">// character_information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-slate-500">name:</span>
                <span className="text-slate-200">{character.name}</span>
              </div>
              {character.type && (
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-slate-500">type:</span>
                  <span className="text-slate-200">{character.type}</span>
                </div>
              )}
              {character.voice && (
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-slate-500">voice:</span>
                  <span className="text-slate-200">{character.voice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="relative bg-slate-900/60 rounded-lg border border-slate-800/50 p-6">
            <ColoredBorder color="purple" />
            <CharacterAbout characterId={characterId} />
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="relative bg-slate-900/60 rounded-lg border border-slate-800/50 p-6">
            <ColoredBorder color="green" />
            <CharacterAppearanceForm characterId={characterId} />
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="relative bg-slate-900/60 rounded-lg border border-slate-800/50 p-6">
            <ColoredBorder color="pink" />
            <CharacterRelationships characterId={characterId} />
          </div>
        )}

        {activeTab === 'consistency' && (
          <div className="relative bg-slate-900/60 rounded-lg border border-slate-800/50 p-6">
            <ColoredBorder color="blue" />
            <CharacterConsistencyPanel characterId={characterId} characterName={character?.name || ''} />
          </div>
        )}

        {activeTab === 'image_gen' && (
          <ImageGenerator
            characterId={characterId}
            characterName={character?.name || ''}
            appearance={appearance}
          />
        )}

        {activeTab === 'avatar_gen' && (
          <AvatarGenerator
            characterId={characterId}
            characterName={character?.name || ''}
            appearance={appearance}
            currentAvatarUrl={character?.avatar_url}
          />
        )}

        {activeTab === 'timeline' && (
          <AppearanceTimeline
            characterId={characterId}
            characterName={character?.name || ''}
            onExportRequest={() => setShowExporter(true)}
          />
        )}
      </motion.div>

      {/* Reference Sheet Exporter Modal */}
      {showExporter && (
        <ReferenceSheetExporter
          characterId={characterId}
          characterName={character?.name || ''}
          milestones={milestones}
          onClose={() => setShowExporter(false)}
        />
      )}
    </div>
  );
};

export default CharacterDetails;
