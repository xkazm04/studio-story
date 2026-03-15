/**
 * BrainstormMode Component
 *
 * Main UI for the AI brainstorming partner mode.
 * Integrates idea generation, what-if scenarios, and creative exploration.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
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
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';
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

  // Session summary for footer
  const sessionSummary = useMemo(() => {
    if (!session) return null;
    const date = new Date(session.createdAt);
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const elapsed = Math.round((Date.now() - session.createdAt) / 60000);
    const duration = elapsed < 1 ? '<1 min' : `${elapsed} min`;
    return { date: formatted, total: ideas.length, saved: savedCount, duration };
  }, [session, ideas.length, savedCount]);

  // No context state
  if (!storyContext) {
    return (
      <div className="text-center py-8">
        <Brain className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className={TYPOGRAPHY.caption}>Select a scene to start brainstorming</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all',
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {config.icon}
              <span>{config.label}</span>
              {tab === 'saved' && savedCount > 0 && (
                <span className={cn('ml-1 px-1.5 py-0.5 text-sm rounded-full', SEMANTIC_COLORS.warning.bg, SEMANTIC_COLORS.warning.text)}>
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
            {...FM_VARIANTS.slideInLeft}
            transition={FM_TRANSITION.normal}
            className="space-y-6"
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
                    'relative p-2 rounded-md transition-colors',
                    showFilters
                      ? cn(SEMANTIC_COLORS.brand.bg, SEMANTIC_COLORS.brand.text)
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {typeFilter !== 'all' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-purple-500 text-white rounded-full">
                      1
                    </span>
                  )}
                </button>
              </div>

              {ideas.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handleClearIdeas}
                    className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    title="Clear all ideas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Type Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  {...FM_VARIANTS.collapse}
                  transition={FM_TRANSITION.slow}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
                    {IDEA_TYPE_FILTERS.map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={cn(
                          'px-2 py-1 text-sm font-medium rounded-md transition-colors',
                          typeFilter === type
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ideas List */}
            {generating && ideas.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className={cn('w-10 h-10 mx-auto mb-3 animate-spin', SEMANTIC_COLORS.brand.text, 'opacity-50')} />
                <p className={TYPOGRAPHY.caption}>Generating creative ideas...</p>
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className={cn(TYPOGRAPHY.caption, 'mb-2')}>
                  {ideas.length === 0
                    ? 'No ideas yet. Click "Generate Ideas" to get started!'
                    : 'No ideas match your filter.'}
                </p>
                {ideas.length === 0 && (
                  <p className={TYPOGRAPHY.caption}>
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
            {...FM_VARIANTS.slideInLeft}
            transition={FM_TRANSITION.normal}
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
            {...FM_VARIANTS.slideInLeft}
            transition={FM_TRANSITION.normal}
            className="space-y-3"
          >
            {savedCount === 0 ? (
              <div className="text-center py-8">
                <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className={TYPOGRAPHY.caption}>No saved ideas yet</p>
                <p className={cn(TYPOGRAPHY.caption, 'mt-1')}>
                  Click the bookmark icon on any idea to save it for later
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">
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

      {/* Session Summary */}
      {session && sessionSummary && (
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {sessionSummary.date}
            </span>
            <span className="text-slate-700">&middot;</span>
            <span>{sessionSummary.total} idea{sessionSummary.total !== 1 ? 's' : ''}</span>
            <span className="text-slate-700">&middot;</span>
            <span>{sessionSummary.saved} saved</span>
            <span className="text-slate-700">&middot;</span>
            <span>{sessionSummary.duration} active</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainstormMode;
