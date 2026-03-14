/**
 * ReaderViewPanel - Interactive story simulation panel
 *
 * Allows users to walk through their branching story as a reader would:
 * - Scene text display with immersive reading style
 * - Clickable choice buttons with condition evaluation
 * - Variable state sidebar with localStorage persistence
 * - Path history with rewind to any previous choice point
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BookOpen, Play, RotateCcw, Variable, ChevronRight } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { useProjectStore } from '@/app/store/projectStore';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { sceneChoiceApi } from '@/app/hooks/integration/useSceneChoices';
import type { PanelDensity } from '@/workspace/types';
import type { Scene } from '@/app/types/Scene';
import type { SceneChoice } from '@/app/types/SceneChoice';
import type { VariableValue } from '@/lib/branching/ConditionEngine';
import { cn } from '@/lib/utils';

interface PathStep {
  sceneId: string;
  sceneName: string;
  choiceId?: string;
  choiceLabel?: string;
  timestamp: number;
  variables: Record<string, VariableValue>;
}

interface ReaderViewPanelProps {
  density?: PanelDensity;
  onClose?: () => void;
}

const STORAGE_KEY_PREFIX = 'reader-vars-';

function loadSavedVariables(projectId: string): Record<string, VariableValue> {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectId}`);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore parse errors
  }
  return {};
}

function saveVariables(projectId: string, variables: Record<string, VariableValue>): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(variables));
  } catch {
    // ignore storage errors
  }
}

function clearSavedVariables(projectId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectId}`);
  } catch {
    // ignore
  }
}

function ReaderViewPanel({ density = 'full', onClose }: ReaderViewPanelProps) {
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const projectId = selectedProject?.id || '';

  const { data: scenes = [] } = sceneApi.useProjectScenes(projectId, !!projectId);
  const { data: choices = [] } = sceneChoiceApi.useProjectChoices(projectId, !!projectId);

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [path, setPath] = useState<PathStep[]>([]);
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(new Set());
  const [variables, setVariables] = useState<Record<string, VariableValue>>({});
  const [showVariables, setShowVariables] = useState(false);

  // Load saved variables on mount
  useEffect(() => {
    if (projectId) {
      setVariables(loadSavedVariables(projectId));
    }
  }, [projectId]);

  // Current scene object
  const currentScene = useMemo(
    () => scenes.find((s: Scene) => s.id === currentSceneId) ?? null,
    [scenes, currentSceneId]
  );

  // Choices for current scene
  const currentChoices = useMemo(
    () => choices.filter((c: SceneChoice) => c.scene_id === currentSceneId),
    [choices, currentSceneId]
  );

  // Check if current scene is a dead end (has no choices at all)
  const isDeadEnd = useMemo(
    () => isRunning && currentSceneId && currentChoices.length === 0,
    [isRunning, currentSceneId, currentChoices.length]
  );

  const handleStart = useCallback(() => {
    if (scenes.length === 0) return;
    const firstScene = scenes[0];
    const savedVars = loadSavedVariables(projectId);
    setIsRunning(true);
    setCurrentSceneId(firstScene.id);
    setPath([{
      sceneId: firstScene.id,
      sceneName: firstScene.name || 'Untitled',
      timestamp: Date.now(),
      variables: savedVars,
    }]);
    setVisitedScenes(new Set([firstScene.id]));
    setVariables(savedVars);
  }, [scenes, projectId]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCurrentSceneId(null);
    setPath([]);
    setVisitedScenes(new Set());
    setVariables({});
    if (projectId) clearSavedVariables(projectId);
  }, [projectId]);

  const handleChoiceClick = useCallback((choice: SceneChoice) => {
    if (!choice.target_scene_id) return;
    const targetScene = scenes.find((s: Scene) => s.id === choice.target_scene_id);
    if (!targetScene) return;

    const newVars = { ...variables };
    // Save variables to localStorage on each choice
    if (projectId) saveVariables(projectId, newVars);

    const step: PathStep = {
      sceneId: targetScene.id,
      sceneName: targetScene.name || 'Untitled',
      choiceId: choice.id,
      choiceLabel: choice.label,
      timestamp: Date.now(),
      variables: { ...newVars },
    };

    setPath(prev => [...prev, step]);
    setCurrentSceneId(targetScene.id);
    setVisitedScenes(prev => new Set([...prev, targetScene.id]));
    setVariables(newVars);
  }, [scenes, variables, projectId]);

  const handleRewind = useCallback((stepIndex: number) => {
    const step = path[stepIndex];
    if (!step) return;
    setPath(prev => prev.slice(0, stepIndex + 1));
    setCurrentSceneId(step.sceneId);
    setVariables(step.variables);
    if (projectId) saveVariables(projectId, step.variables);
  }, [path, projectId]);

  const currentIndex = useMemo(
    () => path.findIndex(p => p.sceneId === currentSceneId) + 1,
    [path, currentSceneId]
  );

  // Empty state
  if (!projectId || scenes.length === 0) {
    return (
      <PanelFrame title="Reader View" icon={BookOpen} onClose={onClose} headerAccent="emerald" density={density}>
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
          <BookOpen className="w-10 h-10 text-slate-500" />
          <p className="text-slate-400 text-sm">
            {!projectId ? 'Select a project to start reading.' : 'No scenes available yet. Create some scenes first.'}
          </p>
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Reader View" icon={BookOpen} onClose={onClose} headerAccent="emerald" density={density}>
      <div className="flex flex-col h-full">
        {/* Controls bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/50 border border-emerald-700/50 rounded-lg text-emerald-300 text-sm font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Start
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {isRunning && (
            <span className="text-sm text-slate-400 font-mono">
              Scene {currentIndex}/{scenes.length}
            </span>
          )}

          <div className="flex-1" />

          <button
            onClick={() => setShowVariables(v => !v)}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors',
              showVariables
                ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-700/50'
                : 'text-slate-400 hover:text-slate-300 border border-transparent'
            )}
          >
            <Variable className="w-3.5 h-3.5" />
            Vars
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Scene text + choices */}
          <div className="flex-1 overflow-y-auto p-4">
            {!isRunning ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BookOpen className="w-8 h-8 text-slate-500 mb-3" />
                <p className="text-slate-400 text-sm">Press Start to begin your story.</p>
              </div>
            ) : currentScene ? (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Scene title */}
                <h2 className="text-lg font-semibold text-slate-100">
                  {currentScene.name}
                </h2>

                {/* Scene text */}
                <div className="font-serif text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {currentScene.content || currentScene.description || (
                    <span className="text-slate-500 italic">No content written for this scene yet.</span>
                  )}
                </div>

                {/* Choices */}
                {currentChoices.length > 0 ? (
                  <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    <p className="text-sm text-slate-500 uppercase tracking-wider font-mono">What do you do?</p>
                    {currentChoices.map((choice: SceneChoice) => (
                      <button
                        key={choice.id}
                        onClick={() => handleChoiceClick(choice)}
                        disabled={!choice.target_scene_id}
                        className={cn(
                          'w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500 rounded-lg px-4 py-3 text-left transition-colors',
                          !choice.target_scene_id && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                          <span className="text-slate-200">{choice.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : isDeadEnd ? (
                  <div className={cn(
                    'pt-4 border-t-2',
                    'border-red-500/50'
                  )}>
                    <p className="text-center text-red-400 font-mono text-sm uppercase tracking-wider">
                      -- The End (Dead End) --
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Variable sidebar */}
          {showVariables && (
            <div className="w-56 border-l border-slate-700/50 bg-slate-900/50 p-3 overflow-y-auto">
              <h3 className="text-sm font-mono font-medium text-slate-300 mb-3 uppercase tracking-wider">Variables</h3>
              {Object.keys(variables).length === 0 ? (
                <p className="text-sm text-slate-500 italic">No story variables defined yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 truncate mr-2">{key}</span>
                      <span className={cn(
                        'font-mono',
                        typeof value === 'number' ? 'text-cyan-400' :
                        typeof value === 'boolean' ? 'text-emerald-400' :
                        'text-slate-200'
                      )}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Path history bar */}
        {isRunning && path.length > 0 && (
          <div className="border-t border-slate-700/50 bg-slate-900/50 px-3 py-2 overflow-x-auto">
            <div className="flex items-center gap-1">
              {path.map((step, idx) => (
                <button
                  key={`${step.sceneId}-${idx}`}
                  onClick={() => handleRewind(idx)}
                  className={cn(
                    'flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors',
                    step.sceneId === currentSceneId
                      ? 'bg-cyan-900/50 border border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  )}
                  title={step.choiceLabel ? `Choice: ${step.choiceLabel}` : 'Start'}
                >
                  {step.sceneName.length > 15 ? step.sceneName.slice(0, 15) + '...' : step.sceneName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PanelFrame>
  );
}

export default ReaderViewPanel;
