'use client';

/**
 * StoryLeftPanel - Context-aware left panel for Story feature
 * Shows story overview, parent scenes, and selected scene details with navigation
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Image, FileText, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, ArrowLeft, Palette, ChevronRight, CornerLeftUp
} from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { cn } from '@/lib/utils';

interface SceneStats {
  total: number;
  missingContent: number;
  missingImages: number;
  orphaned: number;
  deadEnds: number;
}

export default function StoryLeftPanel() {
  const { selectedProject } = useProjectStore();
  const {
    scenes,
    choices,
    currentScene,
    currentSceneId,
    firstSceneId,
    getChoicesForScene,
    setCurrentSceneId
  } = useSceneEditor();

  // Calculate scene statistics
  const stats = useMemo<SceneStats>(() => {
    const total = scenes.length;
    const missingContent = scenes.filter(s => !s.content || s.content.trim().length === 0).length;
    const missingImages = scenes.filter(s => !s.image_url).length;

    // Build incoming connections map
    const incomingMap = new Map<string, number>();
    scenes.forEach(s => incomingMap.set(s.id, 0));
    choices.forEach(c => {
      if (c.target_scene_id) {
        incomingMap.set(c.target_scene_id, (incomingMap.get(c.target_scene_id) || 0) + 1);
      }
    });

    // Count orphaned (no incoming except first scene)
    const orphaned = scenes.filter(s =>
      s.id !== firstSceneId && (incomingMap.get(s.id) || 0) === 0
    ).length;

    // Count dead ends (no outgoing choices)
    const outgoingMap = new Map<string, number>();
    scenes.forEach(s => outgoingMap.set(s.id, 0));
    choices.forEach(c => {
      outgoingMap.set(c.scene_id, (outgoingMap.get(c.scene_id) || 0) + 1);
    });
    const deadEnds = scenes.filter(s => (outgoingMap.get(s.id) || 0) === 0).length;

    return { total, missingContent, missingImages, orphaned, deadEnds };
  }, [scenes, choices, firstSceneId]);

  // Get current scene's choices (outgoing)
  const currentChoices = useMemo(() => {
    if (!currentSceneId) return [];
    return getChoicesForScene(currentSceneId);
  }, [currentSceneId, getChoicesForScene]);

  // Get parent scenes (scenes that have choices leading to current scene)
  const parentScenes = useMemo(() => {
    if (!currentSceneId) return [];

    // Find all choices that target the current scene
    const incomingChoices = choices.filter(c => c.target_scene_id === currentSceneId);

    // Get unique parent scene IDs
    const parentIds = [...new Set(incomingChoices.map(c => c.scene_id))];

    // Return parent scene info with the choice label
    return parentIds.map(parentId => {
      const parentScene = scenes.find(s => s.id === parentId);
      const choiceToHere = incomingChoices.find(c => c.scene_id === parentId);
      return {
        id: parentId,
        name: parentScene?.name || 'Unknown',
        choiceLabel: choiceToHere?.label || 'Navigate',
      };
    });
  }, [currentSceneId, choices, scenes]);

  // Get scene by ID
  const getScene = useCallback((id: string | null) => {
    if (!id) return null;
    return scenes.find(s => s.id === id) || null;
  }, [scenes]);

  // Navigate to scene
  const handleNavigateToScene = useCallback((sceneId: string) => {
    setCurrentSceneId(sceneId);
  }, [setCurrentSceneId]);

  // Find target scene name for a choice
  const getTargetSceneName = (targetId: string | null) => {
    if (!targetId) return 'Not linked';
    const scene = scenes.find(s => s.id === targetId);
    return scene?.name || 'Unknown';
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/95 text-slate-100">
      {/* Story Overview Section */}
      <div className="p-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-cyan-600/20">
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {selectedProject?.name || 'Story'}
            </h3>
            <p className="text-[10px] text-slate-500">Story Overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard
            label="Scenes"
            value={stats.total}
            icon={<FileText className="w-3 h-3" />}
            color="cyan"
          />
          <StatCard
            label="Missing Content"
            value={stats.missingContent}
            icon={stats.missingContent > 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
            color={stats.missingContent > 0 ? 'amber' : 'emerald'}
          />
          <StatCard
            label="Missing Images"
            value={stats.missingImages}
            icon={<Image className="w-3 h-3" />}
            color={stats.missingImages > 0 ? 'amber' : 'emerald'}
          />
          <StatCard
            label="Issues"
            value={stats.orphaned + stats.deadEnds}
            icon={stats.orphaned + stats.deadEnds > 0 ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
            color={stats.orphaned + stats.deadEnds > 0 ? 'red' : 'emerald'}
          />
        </div>

        {/* Art Style Row */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/70">
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] text-slate-400">Art Style:</span>
          <span className="text-[11px] text-slate-200 font-medium">Adventure Journal</span>
        </div>
      </div>

      {/* Selected Scene Section */}
      <AnimatePresence mode="wait">
        {currentScene ? (
          <motion.div
            key="scene-details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {/* Scene Header */}
            <div className="p-3 border-b border-slate-800/70">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  currentScene.id === firstSceneId ? 'bg-cyan-500' : 'bg-emerald-500'
                )} />
                <h4 className="text-xs font-medium text-slate-200 truncate flex-1">
                  {currentScene.name}
                </h4>
                {currentScene.id === firstSceneId && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600/20 text-cyan-400 uppercase tracking-wider">
                    Start
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                {currentScene.description || currentScene.content?.slice(0, 100) || 'No description'}
              </p>
            </div>

            {/* Parent Scenes (Coming From) */}
            {parentScenes.length > 0 && (
              <div className="p-3 border-b border-slate-800/70">
                <div className="flex items-center gap-1.5 mb-2">
                  <CornerLeftUp className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Coming From</span>
                </div>
                <div className="space-y-1">
                  {parentScenes.map((parent) => (
                    <button
                      key={parent.id}
                      onClick={() => handleNavigateToScene(parent.id)}
                      className="w-full group p-2 rounded-lg bg-slate-900/40 border border-slate-800/50 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowLeft className="w-3 h-3 text-purple-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-300 truncate font-medium">{parent.name}</p>
                          <p className="text-[9px] text-slate-500 truncate">via: {parent.choiceLabel}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scene Choices (Going To) */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Choices</span>
                <span className="text-[10px] text-slate-600 ml-auto">{currentChoices.length}</span>
              </div>

              {currentChoices.length > 0 ? (
                <div className="space-y-1.5">
                  {currentChoices.map((choice, idx) => (
                    <button
                      key={choice.id}
                      onClick={() => choice.target_scene_id && handleNavigateToScene(choice.target_scene_id)}
                      disabled={!choice.target_scene_id}
                      className={cn(
                        "w-full group p-2 rounded-lg border transition-all text-left",
                        choice.target_scene_id
                          ? "bg-slate-900/40 border-slate-800/50 hover:border-cyan-500/50 hover:bg-cyan-900/10 cursor-pointer"
                          : "bg-slate-900/20 border-slate-800/30 cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] text-slate-600 font-mono mt-0.5 shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-300 line-clamp-2">{choice.label}</p>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span className="truncate">{getTargetSceneName(choice.target_scene_id)}</span>
                          </div>
                        </div>
                        {choice.target_scene_id && (
                          <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <XCircle className="w-6 h-6 text-slate-700 mb-2" />
                  <p className="text-[11px] text-slate-500">No choices defined</p>
                  <p className="text-[10px] text-red-400/70 mt-1">Dead end scene</p>
                </div>
              )}
            </div>

            {/* Scene Validation */}
            <div className="p-3 border-t border-slate-800/70 bg-slate-900/30">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Content</span>
                <span className={currentScene.content ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentScene.content ? 'Complete' : 'Missing'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="text-slate-500">Image</span>
                <span className={currentScene.image_url ? 'text-emerald-400' : 'text-amber-400'}>
                  {currentScene.image_url ? 'Set' : 'Missing'}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-4"
          >
            <div className="text-center">
              <FileText className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Select a scene to view details</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
function StatCard({
  label,
  value,
  icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'cyan' | 'amber' | 'emerald' | 'red';
}) {
  const colorStyles = {
    cyan: 'text-cyan-400 bg-cyan-600/10 border-cyan-500/20',
    amber: 'text-amber-400 bg-amber-600/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-600/10 border-emerald-500/20',
    red: 'text-red-400 bg-red-600/10 border-red-500/20',
  };

  return (
    <div className={cn(
      'p-2 rounded-lg border',
      colorStyles[color]
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-lg font-semibold">{value}</span>
      </div>
      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
