/**
 * ScenarioExplorer Component
 *
 * Interactive what-if scenario exploration with branching paths
 * and outcome visualization.
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Sparkles,
  Users,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';
import {
  ideaGenerator,
  type WhatIfScenario,
  type ConflictEscalation,
  type PlotTwist,
} from '@/lib/brainstorm';

// ============================================================================
// Types
// ============================================================================

interface ScenarioExplorerProps {
  sessionId: string;
  scenarios: WhatIfScenario[];
  escalations: ConflictEscalation[];
  twists: PlotTwist[];
  onScenarioCreate?: (scenario: WhatIfScenario) => void;
  onScenarioExplore?: (scenarioId: string) => void;
  onEscalationCreate?: (escalation: ConflictEscalation) => void;
  onTwistCreate?: (twist: PlotTwist) => void;
  disabled?: boolean;
}

type ExplorerTab = 'what-if' | 'escalation' | 'twist';

// ============================================================================
// Sub-Components
// ============================================================================

interface ScenarioCardProps {
  scenario: WhatIfScenario;
  depth?: number;
  onExploreDeeper: (id: string) => void;
  disabled?: boolean;
}

function ScenarioCard({ scenario, depth = 0, onExploreDeeper, disabled }: ScenarioCardProps) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);

  const likelihoodColors = {
    likely: 'text-emerald-400 bg-emerald-500/20',
    possible: 'text-amber-400 bg-amber-500/20',
    unlikely: 'text-red-400 bg-red-500/20',
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all',
        depth === 0 ? 'border-slate-700 bg-slate-800/50' : 'border-slate-700/50 bg-slate-800/30'
      )}
      style={{ marginLeft: depth > 0 ? `${depth * 16}px` : 0 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-2 p-3 text-left"
      >
        <span className="text-slate-500 mt-0.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-slate-200">{scenario.premise}</h4>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{scenario.description}</p>
        </div>
        <span className="text-[9px] text-slate-600 shrink-0">Depth {scenario.explorationDepth}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
              {/* Possible Outcomes */}
              <div className="pt-3">
                <h5 className="text-[10px] font-medium text-slate-400 mb-2">Possible Outcomes</h5>
                <div className="space-y-1.5">
                  {scenario.possibleOutcomes.map((outcome, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded bg-slate-900/50"
                    >
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[8px] rounded shrink-0',
                          likelihoodColors[outcome.likelihood]
                        )}
                      >
                        {outcome.likelihood}
                      </span>
                      <span className="text-[10px] text-slate-400">{outcome.outcome}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Characters */}
              {scenario.affectedCharacters.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Affected Characters
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {scenario.affectedCharacters.map((char, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[9px] rounded bg-slate-700 text-slate-300"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Implications */}
              <div>
                <h5 className="text-[10px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Implications
                </h5>
                <ul className="space-y-0.5">
                  {scenario.storyImplications.map((impl, i) => (
                    <li key={i} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                      <ArrowRight className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                      {impl}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explore Deeper */}
              <button
                onClick={() => onExploreDeeper(scenario.id)}
                disabled={disabled || scenario.explorationDepth >= 3}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 py-2 rounded text-xs font-medium',
                  'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Explore Deeper
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface EscalationCardProps {
  escalation: ConflictEscalation;
}

function EscalationCard({ escalation }: EscalationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const levelColors = {
    1: 'bg-slate-500',
    2: 'bg-blue-500',
    3: 'bg-amber-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-2 p-3 text-left"
      >
        <div className="flex gap-0.5 shrink-0 mt-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'w-2 h-2 rounded-full',
                level <= escalation.escalationLevel ? levelColors[escalation.escalationLevel] : 'bg-slate-700'
              )}
            />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-slate-200 truncate">{escalation.originalConflict}</h4>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{escalation.escalatedDescription}</p>
        </div>
        <span className="text-slate-500 shrink-0">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
              {/* New Stakes */}
              <div className="pt-3">
                <h5 className="text-[10px] font-medium text-slate-400 mb-1.5">New Stakes</h5>
                <ul className="space-y-1">
                  {escalation.newStakes.map((stake, i) => (
                    <li key={i} className="text-[10px] text-red-400/80 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                      {stake}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Character Reactions */}
              <div>
                <h5 className="text-[10px] font-medium text-slate-400 mb-1.5">Character Reactions</h5>
                <div className="space-y-1.5">
                  {escalation.characterReactions.map((reaction, i) => (
                    <div key={i} className="p-2 rounded bg-slate-900/50">
                      <span className="text-[9px] font-medium text-amber-400">{reaction.characterName}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{reaction.reaction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential Resolutions */}
              <div>
                <h5 className="text-[10px] font-medium text-slate-400 mb-1.5">Possible Resolutions</h5>
                <ul className="space-y-1">
                  {escalation.potentialResolutions.map((resolution, i) => (
                    <li key={i} className="text-[10px] text-emerald-400/80 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      {resolution}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TwistCardProps {
  twist: PlotTwist;
}

function TwistCard({ twist }: TwistCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeColors: Record<PlotTwist['twistType'], string> = {
    revelation: 'text-cyan-400 bg-cyan-500/20',
    betrayal: 'text-red-400 bg-red-500/20',
    reversal: 'text-amber-400 bg-amber-500/20',
    discovery: 'text-emerald-400 bg-emerald-500/20',
    arrival: 'text-blue-400 bg-blue-500/20',
    departure: 'text-purple-400 bg-purple-500/20',
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-2 p-3 text-left"
      >
        <span className={cn('px-1.5 py-0.5 text-[9px] rounded shrink-0 capitalize', typeColors[twist.twistType])}>
          {twist.twistType}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-slate-200 truncate">{twist.title}</h4>
          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{twist.description}</p>
        </div>
        <span className="text-slate-500 shrink-0">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-slate-700/50">
              {/* Setup & Payoff */}
              <div className="pt-3 grid grid-cols-2 gap-2">
                <div>
                  <h5 className="text-[10px] font-medium text-slate-400 mb-1">Setup</h5>
                  <p className="text-[10px] text-slate-500">{twist.setup}</p>
                </div>
                <div>
                  <h5 className="text-[10px] font-medium text-slate-400 mb-1">Payoff</h5>
                  <p className="text-[10px] text-slate-500">{twist.payoff}</p>
                </div>
              </div>

              {/* Foreshadowing */}
              <div>
                <h5 className="text-[10px] font-medium text-slate-400 mb-1.5">Foreshadowing Hints</h5>
                <ul className="space-y-1">
                  {twist.foreshadowingHints.map((hint, i) => (
                    <li key={i} className="text-[10px] text-purple-400/80 flex items-start gap-1.5">
                      <Sparkles className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Affected Characters */}
              {twist.affectedCharacters.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {twist.affectedCharacters.map((char, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-[9px] rounded bg-slate-700 text-slate-300"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ScenarioExplorer({
  sessionId,
  scenarios,
  escalations,
  twists,
  onScenarioCreate,
  onScenarioExplore,
  onEscalationCreate,
  onTwistCreate,
  disabled = false,
}: ScenarioExplorerProps) {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('what-if');
  const [newPremise, setNewPremise] = useState('');
  const [newConflict, setNewConflict] = useState('');
  const [escalationLevel, setEscalationLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [twistType, setTwistType] = useState<PlotTwist['twistType']>('revelation');

  const handleCreateScenario = () => {
    if (!newPremise.trim()) return;
    const scenario = ideaGenerator.generateWhatIfScenario(sessionId, newPremise);
    onScenarioCreate?.(scenario);
    setNewPremise('');
  };

  const handleExploreDeeper = (scenarioId: string) => {
    const childScenarios = ideaGenerator.exploreScenarioDeeper(sessionId, scenarioId);
    childScenarios.forEach(s => onScenarioCreate?.(s));
    onScenarioExplore?.(scenarioId);
  };

  const handleCreateEscalation = () => {
    if (!newConflict.trim()) return;
    const escalation = ideaGenerator.escalateConflict(sessionId, newConflict, escalationLevel);
    onEscalationCreate?.(escalation);
    setNewConflict('');
  };

  const handleCreateTwist = () => {
    const twist = ideaGenerator.generateTwist(sessionId, twistType);
    onTwistCreate?.(twist);
  };

  // Organize scenarios by depth
  const rootScenarios = useMemo(() => {
    return scenarios.filter(s => !s.parentScenarioId);
  }, [scenarios]);

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
        {[
          { id: 'what-if' as const, label: 'What If', count: scenarios.length },
          { id: 'escalation' as const, label: 'Escalate', count: escalations.length },
          { id: 'twist' as const, label: 'Twists', count: twists.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors',
              activeTab === tab.id
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-slate-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* What-If Tab */}
      {activeTab === 'what-if' && (
        <div className="space-y-3">
          {/* New Scenario Input */}
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700">
            <Label className="text-xs text-slate-400 mb-2 block">
              What if...
            </Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPremise}
                onChange={(e) => setNewPremise(e.target.value)}
                placeholder="...the protagonist had made a different choice?"
                disabled={disabled}
                className={cn(
                  'flex-1 px-3 py-2 text-xs rounded-md',
                  'bg-slate-900/50 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-600',
                  'focus:outline-none focus:ring-1 focus:ring-purple-500/50',
                  'disabled:opacity-50'
                )}
              />
              <Button
                onClick={handleCreateScenario}
                disabled={disabled || !newPremise.trim()}
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Explore
              </Button>
            </div>
          </div>

          {/* Scenarios List */}
          <div className="space-y-2">
            {rootScenarios.length === 0 ? (
              <div className="text-center py-6">
                <GitBranch className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Start exploring what-if scenarios
                </p>
              </div>
            ) : (
              rootScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onExploreDeeper={handleExploreDeeper}
                  disabled={disabled}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Escalation Tab */}
      {activeTab === 'escalation' && (
        <div className="space-y-3">
          {/* New Escalation Input */}
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 space-y-3">
            <div>
              <Label className="text-xs text-slate-400 mb-2 block">
                Conflict to Escalate
              </Label>
              <input
                type="text"
                value={newConflict}
                onChange={(e) => setNewConflict(e.target.value)}
                placeholder="Enter the current conflict..."
                disabled={disabled}
                className={cn(
                  'w-full px-3 py-2 text-xs rounded-md',
                  'bg-slate-900/50 border border-slate-700',
                  'text-slate-200 placeholder:text-slate-600',
                  'focus:outline-none focus:ring-1 focus:ring-purple-500/50',
                  'disabled:opacity-50'
                )}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-2 block">
                Escalation Level
              </Label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEscalationLevel(level)}
                    disabled={disabled}
                    className={cn(
                      'flex-1 py-2 text-xs font-medium rounded-md transition-colors',
                      escalationLevel === level
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateEscalation}
              disabled={disabled || !newConflict.trim()}
              className="w-full"
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Escalate Conflict
            </Button>
          </div>

          {/* Escalations List */}
          <div className="space-y-2">
            {escalations.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  No conflicts escalated yet
                </p>
              </div>
            ) : (
              escalations.map((escalation) => (
                <EscalationCard key={escalation.id} escalation={escalation} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Twist Tab */}
      {activeTab === 'twist' && (
        <div className="space-y-3">
          {/* New Twist Generator */}
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 space-y-3">
            <div>
              <Label className="text-xs text-slate-400 mb-2 block">
                Twist Type
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['revelation', 'betrayal', 'reversal', 'discovery', 'arrival', 'departure'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTwistType(type)}
                    disabled={disabled}
                    className={cn(
                      'py-1.5 text-[10px] font-medium rounded capitalize transition-colors',
                      twistType === type
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateTwist}
              disabled={disabled}
              className="w-full"
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Generate Twist
            </Button>
          </div>

          {/* Twists List */}
          <div className="space-y-2">
            {twists.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  No twists generated yet
                </p>
              </div>
            ) : (
              twists.map((twist) => (
                <TwistCard key={twist.id} twist={twist} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
