/**
 * CharactersFeature - Main character management module
 * Design: Clean Manuscript style - monospace accents with cyan theme
 */

'use client';

import React, { useState } from 'react';
import { Users, Shield, Network, FileText, Lightbulb, Terminal } from 'lucide-react';
import { EmptyState } from '@/app/components/UI';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useCharacterStore } from '@/app/store/slices/characterSlice';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import CharactersList from './components/CharactersList';
import DynamicComponentLoader from '@/app/components/UI/DynamicComponentLoader';
import SkeletonLoader from '@/app/components/UI/SkeletonLoader';
import { CharacterCardSkeletonGrid } from './components/CharacterCardSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { useCharacterRecommendations } from '@/app/hooks/useRecommendations';
import { RecommendationPanel } from '@/app/components/recommendations/RecommendationPanel';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import InlineTerminal from '@/cli/InlineTerminal';

const CharactersFeature: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);
  const [activeTab, setActiveTab] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showCLI, setShowCLI] = useState(false);

  // CLI integration for character skills
  const cli = useCLIFeature({
    featureId: 'characters',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['character-backstory', 'character-traits', 'character-names', 'character-dialogue'],
  });
  const { data: characters = [], isLoading: charactersLoading } = characterApi.useProjectCharacters(
    selectedProject?.id || '',
    !!selectedProject
  );

  // Recommendations
  const {
    recommendations,
    isLoading: recsLoading,
    accept: acceptRec,
    dismiss: dismissRec,
    expand: expandRec,
  } = useCharacterRecommendations(selectedProject?.id ?? '', selectedCharacter ?? undefined);

  const tabs = [
    {
      id: 'characters',
      label: 'characters',
      icon: Users,
      content: charactersLoading ? (
        <CharacterCardSkeletonGrid count={8} />
      ) : (
        <CharactersList characters={characters} isLoading={charactersLoading} />
      ),
    },
    {
      id: 'factions',
      label: 'factions',
      icon: Shield,
      content: (
        <DynamicComponentLoader
          importFn={() => import('./sub_CharFactions/FactionsList')}
          componentProps={{}}
          moduleName="FactionsList"
          preloadOnHover
          loadingComponent={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              <SkeletonLoader variant="card" color="blue" count={6} />
            </div>
          }
        />
      ),
    },
    {
      id: 'relationship-map',
      label: 'relationships',
      icon: Network,
      content: selectedProject ? (
        <div className="h-[calc(100vh-200px)]">
          <DynamicComponentLoader
            importFn={() => import('@/app/features/relationships/RelationshipMap')}
            componentProps={{ projectId: selectedProject.id }}
            moduleName="RelationshipMap"
            preloadOnHover
            loadingHeight="h-full"
            loadingComponent={
              <div className="h-full flex items-center justify-center font-mono text-xs text-slate-500">
                loading_relationship_map...
              </div>
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<Network />}
          title="Select a Project"
          monoLabel="// select_project_to_view"
          variant="compact"
          iconSize="sm"
        />
      ),
    },
    {
      id: 'details',
      label: 'details',
      icon: FileText,
      content: selectedCharacter ? (
        <DynamicComponentLoader
          importFn={() => import('./components/CharacterDetails')}
          componentProps={{ characterId: selectedCharacter }}
          moduleName="CharacterDetails"
          preloadOnHover
          loadingComponent={<SkeletonLoader variant="details" color="blue" />}
        />
      ) : (
        <EmptyState
          icon={<FileText />}
          title="Select a Character"
          monoLabel="// select_character_to_view"
          subtitle="select a character to view details, generate images, or create avatars"
          variant="compact"
          iconSize="sm"
        />
      ),
    },
  ];

  return (
    <div className="h-full w-full flex flex-col ms-surface">
      {/* Tab Navigation - Clean Manuscript style */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-800/50 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 mr-2">
            // module
          </span>
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === index;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 font-mono text-xs',
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                )}
                data-testid={`character-tab-${tab.id}`}
              >
                <Icon className={cn('w-4 h-4', isActive && 'text-cyan-400')} />
                <span className="uppercase tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* CLI Toggle */}
        <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowCLI(!showCLI)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all',
            showCLI
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
          )}
          title="Toggle CLI Terminal"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wide">cli</span>
          {cli.isRunning && (
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          )}
        </button>

        {/* Recommendations Toggle */}
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className={cn(
            'relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all',
            showRecommendations
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
          )}
          title="Toggle Suggestions"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span className="uppercase tracking-wide">suggest</span>
          {recommendations.length > 0 && !showRecommendations && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">
              {recommendations.length}
            </span>
          )}
        </button>
        </div>
      </div>

      {/* Content Area with Recommendations Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto px-4 py-4 text-sm text-slate-200 ms-scrollbar">
          {tabs.length > 0 && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {tabs[activeTab]?.content || (
                <div className="font-mono text-xs text-slate-500 italic">// no_content_available</div>
              )}
            </motion.div>
          )}
        </div>

        {/* Recommendations Panel */}
        <AnimatePresence>
          {showRecommendations && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full border-l border-slate-800 overflow-hidden shrink-0"
            >
              <RecommendationPanel
                recommendations={recommendations}
                isLoading={recsLoading}
                title="Character Suggestions"
                subtitle="Relationships & connections"
                variant="inline"
                maxHeight="100%"
                showFilters={true}
                onAccept={acceptRec}
                onDismiss={dismissRec}
                onExpand={expandRec}
                onClose={() => setShowRecommendations(false)}
                className="h-full rounded-none border-0"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* CLI Terminal Panel */}
        <AnimatePresence>
          {showCLI && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-full border-l border-slate-800 overflow-hidden shrink-0"
            >
              <InlineTerminal
                {...cli.terminalProps}
                height="100%"
                outputFormat="json"
                className="h-full rounded-none border-0"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CharactersFeature;
