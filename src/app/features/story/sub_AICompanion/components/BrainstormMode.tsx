/**
 * BrainstormMode Component
 *
 * Main UI for the AI brainstorming partner mode.
 * Integrates idea generation, what-if scenarios, and creative exploration.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  Sparkles,
  RefreshCw,
  Loader2,
  Filter,
  BookmarkCheck,
  Trash2,
  Zap,
  MessageSquare,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { IdeaCard } from './IdeaCard';
import { ScenarioExplorer } from './ScenarioExplorer';
import {
  ideaGenerator,
  type GeneratedIdea,
  type IdeaType,
  type BrainstormSession,
  type StoryContext,
  type WhatIfScenario,
  type ConflictEscalation,
  type PlotTwist,
} from '@/lib/brainstorm';

// ============================================================================
// Types
// ============================================================================

interface BrainstormModeProps {
  projectId: string;
  currentSceneId?: string | null;
  storyContext?: StoryContext | null;
  isGenerating?: boolean;
  disabled?: boolean;
  onIdeaApply?: (idea: GeneratedIdea) => void;
  onScenarioApply?: (scenario: WhatIfScenario | ConflictEscalation | PlotTwist) => void;
}

type BrainstormTab = 'ideas' | 'scenarios' | 'saved';

// ============================================================================
// Constants
// ============================================================================

const TAB_CONFIG: Record<BrainstormTab, { label: string; icon: React.ReactNode }> = {
  ideas: { label: 'Ideas', icon: <Lightbulb className="w-3.5 h-3.5" /> },
  scenarios: { label: 'Scenarios', icon: <GitBranch className="w-3.5 h-3.5" /> },
  saved: { label: 'Saved', icon: <BookmarkCheck className="w-3.5 h-3.5" /> },
};

const IDEA_TYPE_FILTERS: Array<{ type: IdeaType | 'all'; label: string }> = [
  { type: 'all', label: 'All' },
  { type: 'plot-direction', label: 'Plot' },
  { type: 'character-decision', label: 'Character' },
  { type: 'conflict-escalation', label: 'Conflict' },
  { type: 'twist', label: 'Twist' },
  { type: 'what-if', label: 'What If' },
  { type: 'theme-exploration', label: 'Theme' },
];

// ============================================================================
// Main Component
// ============================================================================

export function BrainstormMode({
  projectId,
  currentSceneId,
  storyContext,
  isGenerating: externalGenerating = false,
  disabled = false,
  onIdeaApply,
  onScenarioApply,
}: BrainstormModeProps) {
  const [activeTab, setActiveTab] = useState<BrainstormTab>('ideas');
  const [session, setSession] = useState<BrainstormSession | null>(null);
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [scenarios, setScenarios] = useState<WhatIfScenario[]>([]);
  const [escalations, setEscalations] = useState<ConflictEscalation[]>([]);
  const [twists, setTwists] = useState<PlotTwist[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [typeFilter, setTypeFilter] = useState<IdeaType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize or resume session
  useEffect(() => {
    if (projectId) {
      // Try to find existing session by project name or create new one
      const allSessions = ideaGenerator.getAllSessions();
      let existingSession = allSessions.find(s => s.name === projectId);

      if (!existingSession) {
        existingSession = ideaGenerator.createSession(projectId, storyContext || {});
      }

      setSession(existingSession);
      setIdeas(existingSession.ideas);
      setScenarios(existingSession.scenarios);
      setEscalations(existingSession.escalations);
      setTwists(existingSession.twists);
    }
  }, [projectId, storyContext]);

  // Generate new ideas
  const handleGenerateIdeas = useCallback(async () => {
    if (!session) return;

    setIsGenerating(true);
    try {
      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newIdeas = ideaGenerator.generateIdeas(session.id, {
        count: 5,
        types: typeFilter === 'all' ? undefined : [typeFilter],
      });
      setIdeas((prev) => [...newIdeas, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  }, [session, typeFilter]);

  // Save/unsave idea
  const handleSaveIdea = useCallback(
    (ideaId: string) => {
      if (!session) return;
      ideaGenerator.saveIdea(session.id, ideaId);
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, saved: true } : idea))
      );
    },
    [session]
  );

  const handleUnsaveIdea = useCallback(
    (ideaId: string) => {
      if (!session) return;
      ideaGenerator.unsaveIdea(session.id, ideaId);
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, saved: false } : idea))
      );
    },
    [session]
  );

  // Rate idea
  const handleRateIdea = useCallback(
    (ideaId: string, rating: 1 | 2 | 3 | 4 | 5) => {
      if (!session) return;
      ideaGenerator.rateIdea(session.id, ideaId, rating);
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, rating } : idea))
      );
    },
    [session]
  );

  // Explore idea (mark as explored and optionally apply)
  const handleExploreIdea = useCallback(
    (ideaId: string) => {
      if (!session) return;
      ideaGenerator.markIdeaExplored(session.id, ideaId);
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? { ...idea, explored: true } : idea))
      );

      const idea = ideas.find((i) => i.id === ideaId);
      if (idea && onIdeaApply) {
        onIdeaApply(idea);
      }
    },
    [session, ideas, onIdeaApply]
  );

  // Clear all ideas
  const handleClearIdeas = useCallback(() => {
    if (!session) return;
    // Clear ideas from local state (session persists in storage)
    setIdeas([]);
  }, [session]);

  // Scenario callbacks
  const handleScenarioCreate = useCallback((scenario: WhatIfScenario) => {
    setScenarios((prev) => [...prev, scenario]);
  }, []);

  const handleEscalationCreate = useCallback((escalation: ConflictEscalation) => {
    setEscalations((prev) => [...prev, escalation]);
  }, []);

  const handleTwistCreate = useCallback((twist: PlotTwist) => {
    setTwists((prev) => [...prev, twist]);
  }, []);

  // Filter ideas based on type and tab
  const filteredIdeas = ideas.filter((idea) => {
    if (activeTab === 'saved' && !idea.saved) return false;
    if (typeFilter !== 'all' && idea.type !== typeFilter) return false;
    return true;
  });

  const savedCount = ideas.filter((i) => i.saved).length;
  const generating = isGenerating || externalGenerating;

  // No context state
  if (!storyContext) {
    return (
      <div className="text-center py-8">
        <Brain className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Select a scene to start brainstorming</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
        {(Object.keys(TAB_CONFIG) as BrainstormTab[]).map((tab) => {
          const config = TAB_CONFIG[tab];
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              disabled={disabled}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all',
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {config.icon}
              <span>{config.label}</span>
              {tab === 'saved' && savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-amber-500/20 text-amber-400 rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'ideas' && (
          <motion.div
            key="ideas"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateIdeas}
                  disabled={generating || disabled}
                  size="sm"
                  className="gap-1.5"
                >
                  {generating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Generate Ideas
                </Button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    showFilters
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>

              {ideas.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handleClearIdeas}
                    className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                    title="Clear all ideas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Type Filters */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800"
              >
                {IDEA_TYPE_FILTERS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'px-2 py-1 text-[10px] font-medium rounded-md transition-colors',
                      typeFilter === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* Ideas List */}
            {generating && ideas.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 text-purple-500/50 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-slate-500">Generating creative ideas...</p>
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-2">
                  {ideas.length === 0
                    ? 'No ideas yet. Click "Generate Ideas" to get started!'
                    : 'No ideas match your filter.'}
                </p>
                {ideas.length === 0 && (
                  <p className="text-xs text-slate-600">
                    Ideas will be generated based on your current story context
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onSave={handleSaveIdea}
                    onUnsave={handleUnsaveIdea}
                    onExplore={handleExploreIdea}
                    onRate={handleRateIdea}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'scenarios' && (
          <motion.div
            key="scenarios"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <ScenarioExplorer
              sessionId={session?.id || ''}
              scenarios={scenarios}
              escalations={escalations}
              twists={twists}
              onScenarioCreate={handleScenarioCreate}
              onEscalationCreate={handleEscalationCreate}
              onTwistCreate={handleTwistCreate}
              disabled={disabled || generating}
            />
          </motion.div>
        )}

        {activeTab === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {savedCount === 0 ? (
              <div className="text-center py-8">
                <BookmarkCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No saved ideas yet</p>
                <p className="text-xs text-slate-600 mt-1">
                  Click the bookmark icon on any idea to save it for later
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">
                    {savedCount} saved idea{savedCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {ideas
                  .filter((i) => i.saved)
                  .map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      onSave={handleSaveIdea}
                      onUnsave={handleUnsaveIdea}
                      onExplore={handleExploreIdea}
                      onRate={handleRateIdea}
                    />
                  ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Info */}
      {session && (
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <span>Session: {session.id.slice(0, 8)}...</span>
            <span>{ideas.length} total ideas generated</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainstormMode;
