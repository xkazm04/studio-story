/**
 * SceneGraph Component
 * Main component for visualizing and navigating the story structure
 * Features: Diagnostics panel, OutlineSidebar, MiniMap, Quick Navigation, AI Companion, Analytics
 */

'use client';

import { useCallback, useMemo, useState, lazy, Suspense } from 'react';
import { Node, ReactFlowProvider, Panel } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { useSceneGraphStore } from '@/app/store/sceneGraphStore';
import { useSceneGraphData, SceneNodeData } from './hooks/useSceneGraphData';
import { usePathAncestry } from './hooks/usePathAncestry';
import { useBranchDepth, useGraphDepthStats } from './hooks/useBranchDepth';
import { useGraphValidation } from './hooks/useGraphValidation';
import { GraphCanvas } from './components/GraphCanvas';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  Info,
  Loader2,
  ListTree,
  XCircle,
  Keyboard,
  TrendingUp,
  Bug,
  Footprints,
} from 'lucide-react';
import { useContextMenu } from './components/GraphContextMenu';

// Lazy load heavy components for performance
const AICompanion = lazy(() => import('../sub_AICompanion/AICompanion'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const StateDebugger = lazy(() => import('./components/StateDebugger'));
const PathSimulator = lazy(() => import('./components/PathSimulator'));
const GraphContextMenu = lazy(() => import('./components/GraphContextMenu'));

interface StatsBarProps {
  totalScenes: number;
  orphanCount: number;
  deadEndCount: number;
  currentDepth: number;
  maxDepth: number;
}

function StatsBar({ totalScenes, orphanCount, deadEndCount, currentDepth, maxDepth }: StatsBarProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/70 text-xs font-mono">
      <div className="flex items-center gap-1.5 text-slate-300">
        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="uppercase tracking-wide">{totalScenes} scenes</span>
      </div>

      {orphanCount > 0 && (
        <div className="flex items-center gap-1 text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          <span>{orphanCount}</span>
        </div>
      )}

      {deadEndCount > 0 && (
        <div className="flex items-center gap-1 text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>{deadEndCount}</span>
        </div>
      )}

      {orphanCount === 0 && deadEndCount === 0 && totalScenes > 0 && (
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          <span className="uppercase tracking-wide">Valid</span>
        </div>
      )}

      <div className="h-3 w-px bg-slate-600" />

      <div className="flex items-center gap-1.5 text-slate-400">
        <span className="uppercase tracking-wide">Depth: {currentDepth}/{maxDepth}</span>
      </div>
    </div>
  );
}

interface DiagnosticsPanelProps {
  orphanedSceneIds: string[];
  deadEndSceneIds: string[];
  totalChoices: number;
  maxBranchingFactor: number;
  onNavigateToScene: (id: string) => void;
  sceneName: (id: string) => string;
}

function DiagnosticsPanel({
  orphanedSceneIds,
  deadEndSceneIds,
  totalChoices,
  maxBranchingFactor,
  onNavigateToScene,
  sceneName,
}: DiagnosticsPanelProps) {
  return (
    <div className="w-64 max-h-80 overflow-y-auto bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700/70 shadow-xl text-xs">
      <div className="px-3 py-2 border-b border-slate-700/70 sticky top-0 bg-slate-900/95">
        <h3 className="font-mono font-medium text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          // diagnostics
        </h3>
      </div>

      <div className="p-3 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="px-2 py-1.5 rounded-md bg-slate-800/80 text-center border border-slate-700/50">
            <div className="text-lg font-mono font-bold text-cyan-400">{totalChoices}</div>
            <div className="text-[10px] font-mono uppercase tracking-wide text-slate-500">Choices</div>
          </div>
          <div className="px-2 py-1.5 rounded-md bg-slate-800/80 text-center border border-slate-700/50">
            <div className="text-lg font-mono font-bold text-purple-400">{maxBranchingFactor}</div>
            <div className="text-[10px] font-mono uppercase tracking-wide text-slate-500">Max Branch</div>
          </div>
        </div>

        {/* Orphaned Scenes */}
        {orphanedSceneIds.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-amber-400 font-mono font-medium uppercase tracking-wide">
              <AlertTriangle className="w-3 h-3" />
              <span>Orphaned ({orphanedSceneIds.length})</span>
            </div>
            <div className="pl-4 space-y-1">
              {orphanedSceneIds.slice(0, 5).map(id => (
                <button
                  key={id}
                  onClick={() => onNavigateToScene(id)}
                  className="block w-full text-left text-slate-400 hover:text-amber-300 truncate"
                >
                  → {sceneName(id)}
                </button>
              ))}
              {orphanedSceneIds.length > 5 && (
                <span className="text-slate-500">+{orphanedSceneIds.length - 5} more</span>
              )}
            </div>
          </div>
        )}

        {/* Dead End Scenes */}
        {deadEndSceneIds.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-red-400 font-mono font-medium uppercase tracking-wide">
              <XCircle className="w-3 h-3" />
              <span>Dead Ends ({deadEndSceneIds.length})</span>
            </div>
            <div className="pl-4 space-y-1">
              {deadEndSceneIds.slice(0, 5).map(id => (
                <button
                  key={id}
                  onClick={() => onNavigateToScene(id)}
                  className="block w-full text-left text-slate-400 hover:text-red-300 truncate"
                >
                  → {sceneName(id)}
                </button>
              ))}
              {deadEndSceneIds.length > 5 && (
                <span className="text-slate-500">+{deadEndSceneIds.length - 5} more</span>
              )}
            </div>
          </div>
        )}

        {/* All Good */}
        {orphanedSceneIds.length === 0 && deadEndSceneIds.length === 0 && (
          <div className="flex items-center gap-2 text-emerald-400 py-2">
            <CheckCircle className="w-4 h-4" />
            <span>Story graph is valid!</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickNavPanel({
  onGoToStart,
  onShowKeyboardShortcuts,
}: {
  onGoToStart: () => void;
  onShowKeyboardShortcuts: () => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700/70 p-1">
      <button
        onClick={onGoToStart}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-md transition-colors uppercase tracking-wide"
        title="Go to first scene"
      >
        <Play className="w-3 h-3" />
        Start
      </button>
      <div className="w-px h-4 bg-slate-700/70" />
      <button
        onClick={onShowKeyboardShortcuts}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded-md transition-colors"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-3 h-3" />
      </button>
    </div>
  );
}

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: 'Ctrl+K', action: 'Command palette' },
    { key: 'G S', action: 'Go to start scene' },
    { key: '+/-', action: 'Zoom in/out' },
    { key: '0', action: 'Fit view' },
    { key: 'Arrow keys', action: 'Pan the graph' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-72 bg-slate-900/95 border border-slate-700/70 rounded-lg shadow-xl p-4 backdrop-blur-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-sm font-mono font-semibold text-slate-200 mb-3 flex items-center gap-2 uppercase tracking-wide">
          <Keyboard className="w-4 h-4 text-cyan-400" />
          // shortcuts
        </h3>
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{action}</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/50 rounded-md text-cyan-400 font-mono text-[10px]">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-1.5 text-xs font-mono font-medium text-slate-400 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-700 rounded-md border border-slate-700/50 transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}

function SceneGraphInner() {
  const {
    scenes,
    choices,
    currentSceneId,
    setCurrentSceneId,
    firstSceneId,
    collapsedNodes,
  } = useSceneEditor();

  // UI state from Zustand store
  const {
    showDiagnostics,
    toggleDiagnostics,
    showAIPanel,
    toggleAIPanel,
    showAnalytics,
    toggleAnalytics,
    showHeatmap,
    setShowHeatmap,
    showDebugger,
    toggleDebugger,
  } = useSceneGraphStore();
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showPathSimulator, setShowPathSimulator] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);

  // Context menu
  const { menuPosition, menuTarget, hideMenu, handleContextMenu } = useContextMenu();

  // Transform data to React Flow format
  const { nodes, edges, analysis } = useSceneGraphData({
    scenes,
    choices,
    firstSceneId,
    currentSceneId,
    collapsedNodes,
  });

  // Path ancestry for highlighting
  const { pathNodeIds, pathEdgeIds } = usePathAncestry(
    currentSceneId,
    firstSceneId,
    choices
  );

  // Depth tracking
  const branchDepth = useBranchDepth(currentSceneId, firstSceneId, analysis);
  const depthStats = useGraphDepthStats(analysis);

  // Validation
  const { validationResult } = useGraphValidation(scenes, choices, firstSceneId);

  // Compute diagnostics data
  const diagnosticsData = useMemo(() => {
    const targetSceneIds = new Set(choices.map(c => c.target_scene_id).filter(Boolean));
    const orphanedSceneIds = scenes
      .filter(s => s.id !== firstSceneId && !targetSceneIds.has(s.id))
      .map(s => s.id);

    const scenesWithChoices = new Set(choices.map(c => c.scene_id));
    const deadEndSceneIds = scenes
      .filter(s => !scenesWithChoices.has(s.id))
      .map(s => s.id);

    // Max branching factor
    const branchingCounts = new Map<string, number>();
    choices.forEach(c => {
      branchingCounts.set(c.scene_id, (branchingCounts.get(c.scene_id) || 0) + 1);
    });
    const maxBranchingFactor = Math.max(0, ...Array.from(branchingCounts.values()));

    return {
      orphanedSceneIds,
      deadEndSceneIds,
      totalChoices: choices.length,
      maxBranchingFactor,
    };
  }, [scenes, choices, firstSceneId]);

  const getSceneName = useCallback((id: string) => {
    const scene = scenes.find(s => s.id === id);
    return scene?.name || 'Unknown';
  }, [scenes]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<SceneNodeData>) => {
      setCurrentSceneId(node.id);
    },
    [setCurrentSceneId]
  );

  const handleGoToStart = useCallback(() => {
    if (firstSceneId) {
      setCurrentSceneId(firstSceneId);
    }
  }, [firstSceneId, setCurrentSceneId]);

  return (
    <div className="relative w-full h-full">
      {/* Graph Canvas */}
      <div className="w-full h-full relative">
        <GraphCanvas
          initialNodes={nodes}
          initialEdges={edges}
          onNodeClick={handleNodeClick}
          currentSceneId={currentSceneId}
          pathNodeIds={pathNodeIds}
          pathEdgeIds={pathEdgeIds}
        >
          {/* Stats Bar */}
          <Panel position="top-left" className="mt-2 ml-2">
            <StatsBar
              totalScenes={scenes.length}
              orphanCount={depthStats.orphanCount}
              deadEndCount={depthStats.deadEndCount}
              currentDepth={branchDepth.currentDepth}
              maxDepth={branchDepth.maxDepthInBranch}
            />
          </Panel>

          {/* Quick Navigation (top-right) */}
          <Panel position="top-right" className="mt-2 mr-2">
            <QuickNavPanel
              onGoToStart={handleGoToStart}
              onShowKeyboardShortcuts={() => setShowKeyboardShortcuts(true)}
            />
          </Panel>

          {/* Diagnostics & Analytics Toggle (bottom-left) */}
          <Panel position="bottom-left" className="mb-4 ml-2">
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={toggleDiagnostics}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'bg-slate-900/90 border border-slate-700',
                    showDiagnostics ? 'text-cyan-400 border-cyan-500/50' : 'text-slate-400 hover:text-cyan-400'
                  )}
                >
                  <ListTree className="w-3.5 h-3.5" />
                  Diagnostics
                  {showDiagnostics ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={toggleAnalytics}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'bg-slate-900/90 border border-slate-700',
                    showAnalytics ? 'text-emerald-400 border-emerald-500/50' : 'text-slate-400 hover:text-emerald-400'
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Analytics
                  {showAnalytics ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={toggleDebugger}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'bg-slate-900/90 border border-slate-700',
                    showDebugger ? 'text-amber-400 border-amber-500/50' : 'text-slate-400 hover:text-amber-400'
                  )}
                >
                  <Bug className="w-3.5 h-3.5" />
                  State
                  {showDebugger ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => setShowPathSimulator(!showPathSimulator)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    'bg-slate-900/90 border border-slate-700',
                    showPathSimulator ? 'text-cyan-400 border-cyan-500/50' : 'text-slate-400 hover:text-cyan-400'
                  )}
                >
                  <Footprints className="w-3.5 h-3.5" />
                  Simulate
                  {showPathSimulator ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showDiagnostics && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <DiagnosticsPanel
                      {...diagnosticsData}
                      onNavigateToScene={setCurrentSceneId}
                      sceneName={getSceneName}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showAnalytics && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-72 max-h-96 overflow-hidden bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700/70 shadow-xl"
                  >
                    <Suspense
                      fallback={
                        <div className="h-48 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-emerald-500/50" />
                        </div>
                      }
                    >
                      <AnalyticsDashboard
                        scenes={scenes}
                        choices={choices}
                        firstSceneId={firstSceneId}
                        onHeatmapToggle={setShowHeatmap}
                        onSelectScene={setCurrentSceneId}
                      />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showDebugger && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-72 max-h-96 overflow-hidden bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700/70 shadow-xl"
                  >
                    <Suspense
                      fallback={
                        <div className="h-48 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-500/50" />
                        </div>
                      }
                    >
                      <StateDebugger
                        currentSceneId={currentSceneId ?? undefined}
                        onNavigateToScene={setCurrentSceneId}
                      />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showPathSimulator && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="w-72 max-h-[28rem] overflow-hidden"
                  >
                    <Suspense
                      fallback={
                        <div className="h-48 flex items-center justify-center bg-slate-900/95 rounded-lg">
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-500/50" />
                        </div>
                      }
                    >
                      <PathSimulator
                        scenes={scenes}
                        choices={choices}
                        firstSceneId={firstSceneId}
                        onSceneHighlight={setCurrentSceneId}
                        onPathHighlight={setHighlightedPath}
                      />
                    </Suspense>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>

          {/* Progress Bar + AI Toggle (bottom-center) */}
          <Panel position="bottom-center" className="mb-4">
            <div className="flex flex-col items-center gap-2">
              {/* Progress */}
              {branchDepth.maxDepthInBranch > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${branchDepth.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {branchDepth.progressPercent}%
                  </span>
                </div>
              )}

              {/* AI Toggle */}
              <button
                onClick={toggleAIPanel}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  'bg-slate-900/90 border',
                  showAIPanel
                    ? 'text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                    : 'text-slate-400 hover:text-purple-400 border-slate-700'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Companion
                {showAIPanel ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </button>
            </div>
          </Panel>
        </GraphCanvas>

        {/* Keyboard Shortcuts Modal */}
        <AnimatePresence>
          {showKeyboardShortcuts && (
            <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcuts(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: AI Panel (expandable) */}
      <AnimatePresence>
        {showAIPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-20 border-t border-slate-700 overflow-hidden"
          >
            <Suspense
              fallback={
                <div className="h-full flex items-center justify-center bg-slate-950">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500/50" />
                </div>
              }
            >
              <AICompanion defaultExpanded={true} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SceneGraph() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      <ReactFlowProvider>
        <SceneGraphInner />
      </ReactFlowProvider>
    </div>
  );
}
