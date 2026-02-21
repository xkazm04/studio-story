/**
 * PsychologyProfile - Comprehensive character psychology dashboard
 * Design: Clean Manuscript style with cyan accents
 *
 * Main interface for character psychological analysis:
 * - Motivation tree visualization
 * - Internal conflict mapping
 * - Fear and desire tracking
 * - Psychological archetype display
 * - AI-powered psychology generation
 * - Behavior prediction
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Target,
  Zap,
  Heart,
  Shield,
  Eye,
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  ChevronDown,
  AlertTriangle,
  Lightbulb,
  User,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';
import MotivationTreeBuilder from './MotivationTreeBuilder';
import ConflictMapper from './ConflictMapper';
import {
  PsychologyEngine,
  PsychologyProfile as PsychologyProfileType,
  MotivationTree,
  InternalConflict,
  Fear,
  Desire,
  Wound,
  DefenseMechanism,
  PsychologicalArchetypes,
  ENNEAGRAM_TYPES,
  JUNGIAN_ARCHETYPES,
  DEFENSE_MECHANISMS,
  generatePsychologyId,
  PSYCHOLOGY_GENERATION_PROMPT,
} from '@/lib/psychology/PsychologyEngine';
import type { EnneagramType, JungianArchetype, DefenseMechanismType } from '@/lib/psychology/PsychologyEngine';

// ============================================================================
// Types
// ============================================================================

export interface PsychologyProfileProps {
  characterId: string;
  characterName: string;
  characterType?: string;
  existingTraits?: string[];
  background?: string;
  onProfileChange?: (profile: PsychologyProfileType) => void;
}

type TabId = 'overview' | 'motivations' | 'conflicts' | 'fears' | 'archetypes' | 'predict';

// ============================================================================
// Subcomponents
// ============================================================================

interface ArchetypeCardProps {
  type: 'enneagram' | 'jungian';
  value: EnneagramType | JungianArchetype;
  wing?: EnneagramType;
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({ type, value, wing }) => {
  if (type === 'enneagram') {
    const ennea = ENNEAGRAM_TYPES[value as EnneagramType];
    return (
      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <span className="font-mono text-sm text-purple-400">{value}</span>
          </div>
          <div>
            <h4 className="font-mono text-sm text-slate-200">{ennea.name}</h4>
            {wing && (
              <span className="font-mono text-[10px] text-slate-500">
                Wing: {wing}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div>
            <span className="text-slate-500">Core Motivation:</span>
            <p className="text-slate-400 mt-0.5">{ennea.coreMotivation}</p>
          </div>
          <div>
            <span className="text-slate-500">Core Fear:</span>
            <p className="text-slate-400 mt-0.5">{ennea.coreFear}</p>
          </div>
          <div>
            <span className="text-slate-500">Desires:</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {ennea.desires.map((d, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-green-500/10 text-green-400/70 rounded text-[10px]">
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Weaknesses:</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {ennea.weaknesses.map((w, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-red-500/10 text-red-400/70 rounded text-[10px]">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const jung = JUNGIAN_ARCHETYPES[value as JungianArchetype];
  return (
    <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <User size={14} className="text-cyan-400" />
        </div>
        <h4 className="font-mono text-sm text-slate-200">{jung.label}</h4>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div>
          <span className="text-slate-500">Core Motivation:</span>
          <p className="text-slate-400 mt-0.5">{jung.coreMotivation}</p>
        </div>
        <div>
          <span className="text-slate-500">Fears:</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {jung.fears.map((f, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400/70 rounded text-[10px]">
                {f}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Strengths:</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {jung.strengths.map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-green-500/10 text-green-400/70 rounded text-[10px]">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Shadow Aspects:</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {jung.shadows.map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-red-500/10 text-red-400/70 rounded text-[10px]">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface FearDesireListProps {
  fears: Fear[];
  desires: Desire[];
  onFearsChange: (fears: Fear[]) => void;
  onDesiresChange: (desires: Desire[]) => void;
  readOnly?: boolean;
}

const FearDesireList: React.FC<FearDesireListProps> = ({
  fears,
  desires,
  onFearsChange,
  onDesiresChange,
  readOnly = false,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Fears */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={14} className="text-red-400" />
          <h4 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            fears
          </h4>
          <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
            {fears.length}
          </span>
        </div>

        {fears.length > 0 ? (
          <div className="space-y-2">
            {fears.map((fear) => (
              <div
                key={fear.id}
                className="p-3 bg-red-500/5 rounded-lg border border-red-500/20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-slate-200">{fear.label}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${fear.intensity}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{fear.intensity}</span>
                  </div>
                </div>
                {fear.description && (
                  <p className="font-mono text-[10px] text-slate-500">{fear.description}</p>
                )}
                {fear.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fear.triggers.map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-800/40 rounded text-[10px] font-mono text-slate-500">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-800/20 rounded-lg border border-slate-800/30 text-center">
            <p className="font-mono text-xs text-slate-600">No fears defined</p>
          </div>
        )}
      </div>

      {/* Desires */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={14} className="text-green-400" />
          <h4 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            desires
          </h4>
          <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
            {desires.length}
          </span>
        </div>

        {desires.length > 0 ? (
          <div className="space-y-2">
            {desires.map((desire) => (
              <div
                key={desire.id}
                className={cn(
                  'p-3 rounded-lg border',
                  desire.type === 'need'
                    ? 'bg-purple-500/5 border-purple-500/20'
                    : 'bg-green-500/5 border-green-500/20'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-200">{desire.label}</span>
                    <span className={cn(
                      'px-1 py-0.5 rounded text-[9px] font-mono',
                      desire.type === 'need'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-green-500/20 text-green-400'
                    )}>
                      {desire.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          desire.type === 'need' ? 'bg-purple-400' : 'bg-green-400'
                        )}
                        style={{ width: `${desire.intensity}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">{desire.intensity}</span>
                  </div>
                </div>
                {desire.description && (
                  <p className="font-mono text-[10px] text-slate-500">{desire.description}</p>
                )}
                {desire.obstacles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {desire.obstacles.map((o, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-slate-800/40 rounded text-[10px] font-mono text-slate-500">
                        {o}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-800/20 rounded-lg border border-slate-800/30 text-center">
            <p className="font-mono text-xs text-slate-600">No desires defined</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface BehaviorPredictorProps {
  profile: PsychologyProfileType | null;
  onPredict: (situation: string) => void;
  prediction: string | null;
  isLoading: boolean;
}

const BehaviorPredictor: React.FC<BehaviorPredictorProps> = ({
  profile,
  onPredict,
  prediction,
  isLoading,
}) => {
  const [situation, setSituation] = useState('');

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={14} className="text-amber-400" />
          <h4 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            behavior_prediction
          </h4>
        </div>

        <div className="space-y-3">
          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="Describe a situation to predict how this character would respond..."
            rows={3}
            className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-sm text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
          />

          <button
            onClick={() => onPredict(situation)}
            disabled={!situation.trim() || !profile || isLoading}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs transition-colors',
              situation.trim() && profile && !isLoading
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Brain size={14} />
                <span>Predict Response</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prediction result */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-amber-400" />
            <span className="font-mono text-xs text-amber-400 uppercase">Predicted Behavior</span>
          </div>
          <p className="font-mono text-sm text-slate-300 whitespace-pre-wrap">{prediction}</p>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const PsychologyProfile: React.FC<PsychologyProfileProps> = ({
  characterId,
  characterName,
  characterType,
  existingTraits,
  background,
  onProfileChange,
}) => {
  const { selectedProject } = useProjectStore();
  const cli = useCLIFeature({
    featureId: 'char-psychology',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['character-traits'],
  });

  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [profile, setProfile] = useState<PsychologyProfileType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<'profile' | 'predict' | null>(null);

  // Create engine instance
  const engine = useMemo(() => new PsychologyEngine(), []);

  // Update profile and notify parent
  const updateProfile = useCallback((newProfile: PsychologyProfileType) => {
    setProfile(newProfile);
    onProfileChange?.(newProfile);
  }, [onProfileChange]);

  // Generate psychology profile with AI
  const handleGenerateProfile = useCallback(() => {
    setIsGenerating(true);
    setLastOperation('profile');

    const prompt = PSYCHOLOGY_GENERATION_PROMPT
      .replace('{{characterName}}', characterName)
      .replace('{{characterType}}', characterType || 'character')
      .replace('{{background}}', background || 'Unknown')
      .replace('{{existingTraits}}', existingTraits?.join(', ') || 'None');

    cli.executePrompt(prompt, 'Psychology Profile');
  }, [characterName, characterType, background, existingTraits, cli]);

  // Handle behavior prediction
  const handlePredict = useCallback((situation: string) => {
    if (!profile) return;

    setPrediction(null);
    setLastOperation('predict');

    const motivations = profile.motivationTree.rootMotivations.map((m) => m.label).join(', ');
    const fears = profile.fears.map((f) => f.label).join(', ') || 'Unknown';
    const conflicts = profile.internalConflicts.map((c) => c.name).join(', ') || 'None';
    const archetype = profile.archetypes.jungian.primary;

    const prompt = `You are a character behavior analyst. Based on psychological profiles, predict how characters would respond in given situations.

Based on this character's psychology:
- Primary motivations: ${motivations}
- Key fears: ${fears}
- Internal conflicts: ${conflicts}
- Archetype: ${archetype}

How would they respond to this situation: ${situation}`;

    cli.executePrompt(prompt, 'Behavior Prediction');
  }, [profile, cli]);

  // Handle CLI insert results — routes based on last operation
  const handleInsertResult = useCallback((text: string) => {
    if (lastOperation === 'profile') {
      try {
        const newProfile = engine.createProfile(characterId, characterName, {
          motivationTree: {
            characterId,
            rootMotivations: [
              {
                id: 'mot_initial',
                label: 'Primary Drive',
                description: text.slice(0, 200),
                level: 'primary',
                strength: 75,
                isAwareOf: true,
                relatedFears: [],
                relatedDesires: [],
                triggers: [],
              },
            ],
            totalMotivations: 1,
            maxDepth: 1,
            dominantLevel: 'primary',
          },
          fears: [],
          desires: [],
          wounds: [],
          defenseMechanisms: [],
          coreBeliefs: ['Placeholder belief'],
          values: ['Placeholder value'],
          blindSpots: [],
        });
        updateProfile(newProfile);
      } catch (error) {
        console.error('Failed to parse psychology profile:', error);
      } finally {
        setIsGenerating(false);
      }
    } else if (lastOperation === 'predict') {
      setPrediction(text.trim());
    }
    setLastOperation(null);
  }, [lastOperation, characterId, characterName, engine, updateProfile]);

  // Handle tree changes
  const handleMotivationTreeChange = useCallback((tree: MotivationTree) => {
    if (!profile) return;
    const updated = engine.updateProfile(profile.id, { motivationTree: tree });
    if (updated) updateProfile(updated);
  }, [profile, engine, updateProfile]);

  // Handle conflict changes
  const handleConflictsChange = useCallback((conflicts: InternalConflict[]) => {
    if (!profile) return;
    const updated = engine.updateProfile(profile.id, { internalConflicts: conflicts });
    if (updated) updateProfile(updated);
  }, [profile, engine, updateProfile]);

  // Tabs
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Brain size={14} /> },
    { id: 'motivations', label: 'Motivations', icon: <Target size={14} /> },
    { id: 'conflicts', label: 'Conflicts', icon: <Zap size={14} /> },
    { id: 'fears', label: 'Fears & Desires', icon: <Heart size={14} /> },
    { id: 'archetypes', label: 'Archetypes', icon: <User size={14} /> },
    { id: 'predict', label: 'Predict', icon: <Lightbulb size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              psychology_profile
            </h3>
            <span className="px-2 py-0.5 bg-slate-800/60 rounded text-xs font-mono text-slate-400">
              {characterName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateProfile}
              disabled={isGenerating || cli.isRunning}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors',
                isGenerating || cli.isRunning
                  ? 'bg-slate-700/40 text-slate-600 cursor-not-allowed'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs transition-all',
                activeTab === tab.id
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              {tab.icon}
              <span className="uppercase tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CLI Terminal */}
      <InlineTerminal {...cli.terminalProps} height={150} collapsible onInsert={handleInsertResult} />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {profile ? (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
                      <Target size={20} className="mx-auto mb-1 text-cyan-400" />
                      <div className="font-mono text-lg text-slate-200">
                        {profile.motivationTree.totalMotivations}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">Motivations</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
                      <Zap size={20} className="mx-auto mb-1 text-orange-400" />
                      <div className="font-mono text-lg text-slate-200">
                        {profile.internalConflicts.length}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">Conflicts</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
                      <AlertTriangle size={20} className="mx-auto mb-1 text-red-400" />
                      <div className="font-mono text-lg text-slate-200">
                        {profile.fears.length}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">Fears</div>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
                      <Heart size={20} className="mx-auto mb-1 text-green-400" />
                      <div className="font-mono text-lg text-slate-200">
                        {profile.desires.length}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">Desires</div>
                    </div>
                  </div>

                  {/* Compact views */}
                  <div className="grid grid-cols-2 gap-4">
                    <MotivationTreeBuilder
                      tree={profile.motivationTree}
                      onTreeChange={handleMotivationTreeChange}
                      compact
                    />
                    <ConflictMapper
                      conflicts={profile.internalConflicts}
                      motivations={profile.motivationTree.rootMotivations}
                      onConflictsChange={handleConflictsChange}
                      compact
                    />
                  </div>

                  {/* Archetype summary */}
                  <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={14} className="text-slate-400" />
                      <span className="font-mono text-xs text-slate-500 uppercase">Psychological Profile</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-mono text-[10px] text-slate-600">Enneagram</span>
                        <p className="font-mono text-sm text-purple-400">
                          Type {profile.archetypes.enneagram.type}: {ENNEAGRAM_TYPES[profile.archetypes.enneagram.type].name}
                        </p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-slate-600">Jungian</span>
                        <p className="font-mono text-sm text-cyan-400">
                          {JUNGIAN_ARCHETYPES[profile.archetypes.jungian.primary].label}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 bg-slate-900/60 rounded-lg border border-slate-800/50 text-center">
                  <Brain size={48} className="mx-auto mb-4 text-slate-600 opacity-50" />
                  <h4 className="font-mono text-sm text-slate-400 mb-2">No Psychology Profile</h4>
                  <p className="font-mono text-xs text-slate-600 mb-4">
                    Generate a psychology profile to explore your character's motivations, fears, and internal conflicts.
                  </p>
                  <button
                    onClick={handleGenerateProfile}
                    disabled={isGenerating || cli.isRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg mx-auto
                               bg-purple-500/20 hover:bg-purple-500/30 text-purple-400
                               font-mono text-xs transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Generate Psychology Profile</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Motivations */}
          {activeTab === 'motivations' && profile && (
            <MotivationTreeBuilder
              tree={profile.motivationTree}
              onTreeChange={handleMotivationTreeChange}
            />
          )}

          {/* Conflicts */}
          {activeTab === 'conflicts' && profile && (
            <ConflictMapper
              conflicts={profile.internalConflicts}
              motivations={profile.motivationTree.rootMotivations}
              onConflictsChange={handleConflictsChange}
            />
          )}

          {/* Fears & Desires */}
          {activeTab === 'fears' && profile && (
            <FearDesireList
              fears={profile.fears}
              desires={profile.desires}
              onFearsChange={(fears) => {
                const updated = engine.updateProfile(profile.id, { fears });
                if (updated) updateProfile(updated);
              }}
              onDesiresChange={(desires) => {
                const updated = engine.updateProfile(profile.id, { desires });
                if (updated) updateProfile(updated);
              }}
            />
          )}

          {/* Archetypes */}
          {activeTab === 'archetypes' && profile && (
            <div className="grid grid-cols-2 gap-4">
              <ArchetypeCard
                type="enneagram"
                value={profile.archetypes.enneagram.type}
                wing={profile.archetypes.enneagram.wing}
              />
              <ArchetypeCard
                type="jungian"
                value={profile.archetypes.jungian.primary}
              />
            </div>
          )}

          {/* Predict */}
          {activeTab === 'predict' && (
            <BehaviorPredictor
              profile={profile}
              onPredict={handlePredict}
              prediction={prediction}
              isLoading={cli.isRunning && lastOperation === 'predict'}
            />
          )}

          {/* Empty state for tabs when no profile */}
          {!profile && activeTab !== 'overview' && (
            <div className="p-8 bg-slate-900/60 rounded-lg border border-slate-800/50 text-center">
              <Brain size={32} className="mx-auto mb-3 text-slate-600 opacity-50" />
              <p className="font-mono text-sm text-slate-500">
                Generate a psychology profile first to access this feature.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PsychologyProfile;
