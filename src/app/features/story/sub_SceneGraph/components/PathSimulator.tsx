/**
 * PathSimulator Component
 * Interactive walkthrough simulation for testing narrative paths
 *
 * Features:
 * - Step-by-step scene navigation
 * - Variable state tracking and display
 * - Path history with backtrack capability
 * - Visual highlighting on graph
 * - Coverage tracking
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  ChevronRight,
  MapPin,
  GitBranch,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Footprints,
  Variable,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';
import { variableManager, type VariableDefinition, type VariableValue } from '@/lib/branching';

// ============================================================================
// Types
// ============================================================================

interface PathStep {
  sceneId: string;
  sceneName: string;
  choiceId?: string;
  choiceLabel?: string;
  timestamp: number;
  variables: Map<string, VariableValue>;
}

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentSceneId: string | null;
  path: PathStep[];
  visitedScenes: Set<string>;
  variables: Map<string, VariableValue>;
  startTime: number | null;
}

interface PathSimulatorProps {
  scenes: Scene[];
  choices: SceneChoice[];
  firstSceneId: string | null;
  onSceneHighlight?: (sceneId: string | null) => void;
  onPathHighlight?: (sceneIds: string[]) => void;
  className?: string;
}

// ============================================================================
// Initial State
// ============================================================================

const createInitialState = (): SimulationState => ({
  isRunning: false,
  isPaused: false,
  currentSceneId: null,
  path: [],
  visitedScenes: new Set(),
  variables: new Map(),
  startTime: null,
});

// ============================================================================
// Component
// ============================================================================

export function PathSimulator({
  scenes,
  choices,
  firstSceneId,
  onSceneHighlight,
  onPathHighlight,
  className,
}: PathSimulatorProps) {
  const [state, setState] = useState<SimulationState>(createInitialState);
  const [showVariables, setShowVariables] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(2000);

  // Build scene and choice indices
  const sceneMap = useMemo(() => new Map(scenes.map(s => [s.id, s])), [scenes]);
  const choicesByScene = useMemo(() => {
    const map = new Map<string, SceneChoice[]>();
    choices.forEach(choice => {
      if (!map.has(choice.scene_id)) {
        map.set(choice.scene_id, []);
      }
      map.get(choice.scene_id)!.push(choice);
    });
    return map;
  }, [choices]);

  // Get current scene and available choices
  const currentScene = state.currentSceneId ? sceneMap.get(state.currentSceneId) : null;
  const availableChoices = state.currentSceneId ? (choicesByScene.get(state.currentSceneId) ?? []) : [];

  // Coverage statistics
  const coverage = useMemo(() => {
    const totalScenes = scenes.length;
    const visitedCount = state.visitedScenes.size;
    const percentage = totalScenes > 0 ? Math.round((visitedCount / totalScenes) * 100) : 0;
    return { total: totalScenes, visited: visitedCount, percentage };
  }, [scenes.length, state.visitedScenes]);

  // Is simulation at a dead end?
  const isDeadEnd = state.isRunning && availableChoices.length === 0 && state.currentSceneId !== null;

  // Update path highlight when path changes
  useEffect(() => {
    if (onPathHighlight) {
      onPathHighlight(state.path.map(step => step.sceneId));
    }
  }, [state.path, onPathHighlight]);

  // Update scene highlight when current scene changes
  useEffect(() => {
    if (onSceneHighlight) {
      onSceneHighlight(state.currentSceneId);
    }
  }, [state.currentSceneId, onSceneHighlight]);

  // Auto-advance timer
  useEffect(() => {
    if (!autoAdvance || !state.isRunning || state.isPaused || availableChoices.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      // Random choice for auto-advance
      const randomChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
      if (randomChoice.target_scene_id) {
        handleSelectChoice(randomChoice);
      }
    }, autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, [autoAdvance, state.isRunning, state.isPaused, state.currentSceneId, autoAdvanceDelay]);

  // Start simulation
  const handleStart = useCallback(() => {
    if (!firstSceneId) return;

    const firstScene = sceneMap.get(firstSceneId);
    const initialVariables = new Map<string, VariableValue>();

    // Initialize variables from variable manager
    variableManager.getAllVariables().forEach(v => {
      initialVariables.set(v.id, v.defaultValue);
    });

    const firstStep: PathStep = {
      sceneId: firstSceneId,
      sceneName: firstScene?.name ?? 'Unknown',
      timestamp: Date.now(),
      variables: new Map(initialVariables),
    };

    setState({
      isRunning: true,
      isPaused: false,
      currentSceneId: firstSceneId,
      path: [firstStep],
      visitedScenes: new Set([firstSceneId]),
      variables: initialVariables,
      startTime: Date.now(),
    });
  }, [firstSceneId, sceneMap]);

  // Reset simulation
  const handleReset = useCallback(() => {
    setState(createInitialState());
    onSceneHighlight?.(null);
    onPathHighlight?.([]);
  }, [onSceneHighlight, onPathHighlight]);

  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  // Select a choice and advance
  const handleSelectChoice = useCallback((choice: SceneChoice) => {
    if (!choice.target_scene_id) return;

    const targetScene = sceneMap.get(choice.target_scene_id);

    // Apply any variable changes from the choice (if condition system supports it)
    const newVariables = new Map(state.variables);

    const newStep: PathStep = {
      sceneId: choice.target_scene_id,
      sceneName: targetScene?.name ?? 'Unknown',
      choiceId: choice.id,
      choiceLabel: choice.label,
      timestamp: Date.now(),
      variables: new Map(newVariables),
    };

    setState(prev => ({
      ...prev,
      currentSceneId: choice.target_scene_id!,
      path: [...prev.path, newStep],
      visitedScenes: new Set([...prev.visitedScenes, choice.target_scene_id!]),
      variables: newVariables,
    }));
  }, [sceneMap, state.variables]);

  // Go back one step
  const handleStepBack = useCallback(() => {
    if (state.path.length <= 1) return;

    const newPath = state.path.slice(0, -1);
    const lastStep = newPath[newPath.length - 1];

    setState(prev => ({
      ...prev,
      currentSceneId: lastStep.sceneId,
      path: newPath,
      variables: new Map(lastStep.variables),
    }));
  }, [state.path]);

  // Jump to specific step in path
  const handleJumpToStep = useCallback((index: number) => {
    if (index < 0 || index >= state.path.length) return;

    const targetStep = state.path[index];
    const newPath = state.path.slice(0, index + 1);

    setState(prev => ({
      ...prev,
      currentSceneId: targetStep.sceneId,
      path: newPath,
      variables: new Map(targetStep.variables),
    }));
  }, [state.path]);

  // Elapsed time
  const elapsedTime = useMemo(() => {
    if (!state.startTime) return '0:00';
    const seconds = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [state.startTime, state.path.length]); // Re-render on path changes

  return (
    <div className={cn('bg-slate-900/95 rounded-lg border border-slate-700/70', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-medium text-slate-200 uppercase tracking-wide">
              // path_simulator
            </h3>
          </div>

          {state.isRunning && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{elapsedTime}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <Target className="w-3 h-3" />
                <span>{coverage.percentage}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Controls */}
        <div className="flex items-center gap-2">
          {!state.isRunning ? (
            <button
              onClick={handleStart}
              disabled={!firstSceneId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                firstSceneId
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResume}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  state.isPaused
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30'
                )}
              >
                {state.isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </>
                )}
              </button>

              <button
                onClick={handleStepBack}
                disabled={state.path.length <= 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Step back"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                title="Reset simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Auto-advance toggle */}
          <label className="flex items-center gap-2 ml-auto cursor-pointer">
            <span className="text-[10px] text-slate-500 uppercase">Auto</span>
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="w-3 h-3 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500/20"
            />
          </label>
        </div>

        {/* Current Scene */}
        {state.isRunning && currentScene && (
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">
                  {currentScene.name}
                </h4>
                {currentScene.description && (
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {currentScene.description}
                  </p>
                )}
              </div>
            </div>

            {/* Dead End Indicator */}
            {isDeadEnd && (
              <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                <span>Dead end reached - no more choices</span>
              </div>
            )}
          </div>
        )}

        {/* Choices */}
        {state.isRunning && availableChoices.length > 0 && !state.isPaused && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase">
              <GitBranch className="w-3 h-3" />
              <span>Available choices ({availableChoices.length})</span>
            </div>

            <div className="space-y-1">
              {availableChoices.map((choice) => {
                const isVisited = choice.target_scene_id
                  ? state.visitedScenes.has(choice.target_scene_id)
                  : false;

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice)}
                    disabled={!choice.target_scene_id}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all',
                      'border border-slate-700/50 bg-slate-800/30',
                      choice.target_scene_id
                        ? 'hover:border-cyan-500/50 hover:bg-cyan-500/5'
                        : 'opacity-50 cursor-not-allowed',
                      isVisited && 'border-amber-500/30 bg-amber-500/5'
                    )}
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="flex-1 text-xs text-slate-200 truncate">
                      {choice.label}
                    </span>
                    {isVisited && (
                      <span className="text-[9px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                        visited
                      </span>
                    )}
                    {!choice.target_scene_id && (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Path History */}
        {state.path.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="flex items-center gap-2 text-[10px] text-slate-500 uppercase hover:text-slate-400"
            >
              <Eye className="w-3 h-3" />
              <span>Path history ({state.path.length} steps)</span>
              {showVariables ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {showVariables && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {state.path.map((step, index) => (
                      <button
                        key={`${step.sceneId}-${index}`}
                        onClick={() => handleJumpToStep(index)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors',
                          index === state.path.length - 1
                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                            : 'hover:bg-slate-800/50'
                        )}
                      >
                        <span className="text-[10px] text-slate-500 w-4">{index + 1}</span>
                        <span className="flex-1 text-[10px] text-slate-300 truncate">
                          {step.sceneName}
                        </span>
                        {index === state.path.length - 1 && (
                          <span className="text-[9px] text-cyan-400">current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Coverage Bar */}
        {state.isRunning && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500 uppercase">Coverage</span>
              <span className="text-slate-400">
                {coverage.visited}/{coverage.total} scenes
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${coverage.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!state.isRunning && (
          <div className="py-6 text-center">
            <Footprints className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Click Start to begin walkthrough simulation
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              Navigate through your story and track coverage
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PathSimulator;
