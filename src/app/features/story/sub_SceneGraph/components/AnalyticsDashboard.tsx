'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  Users,
  Map,
  Target,
  AlertTriangle,
  Play,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Compass,
  GitBranch,
  Layers,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  flowSimulator,
  type SimulationConfig,
  type FlowResult,
  type DecisionDistribution,
  type PathStatistics,
  type PlayerBehaviorModel,
} from '@/lib/analytics';
import type { Scene } from '@/app/types/Scene';
import type { SceneChoice } from '@/app/types/SceneChoice';

interface AnalyticsDashboardProps {
  scenes: Scene[];
  choices: SceneChoice[];
  firstSceneId: string | null;
  onHeatmapToggle?: (enabled: boolean) => void;
  onSelectScene?: (sceneId: string) => void;
  className?: string;
}

const BEHAVIOR_MODELS: { value: PlayerBehaviorModel['type']; label: string; description: string }[] = [
  { value: 'uniform', label: 'Random', description: 'Equal chance for all choices' },
  { value: 'exploration', label: 'Explorer', description: 'Prefers less obvious paths' },
  { value: 'optimal', label: 'Optimal', description: 'Always picks first option' },
  { value: 'weighted', label: 'Weighted', description: 'Based on appeal scores' },
];

const ITERATION_PRESETS = [100, 500, 1000, 5000, 10000];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  scenes,
  choices,
  firstSceneId,
  onHeatmapToggle,
  onSelectScene,
  className,
}) => {
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<FlowResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Config state
  const [iterations, setIterations] = useState(1000);
  const [behaviorType, setBehaviorType] = useState<PlayerBehaviorModel['type']>('uniform');
  const [explorationFactor, setExplorationFactor] = useState(0.5);

  // View state
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Run simulation
  const runSimulation = useCallback(async () => {
    setIsSimulating(true);

    // Use setTimeout to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 50));

    const config: SimulationConfig = {
      iterations,
      playerBehavior: {
        type: behaviorType,
        explorationFactor: behaviorType === 'exploration' ? explorationFactor : undefined,
      },
    };

    const result = flowSimulator.simulate(scenes, choices, firstSceneId, config);
    setSimulationResult(result);
    setIsSimulating(false);
  }, [scenes, choices, firstSceneId, iterations, behaviorType, explorationFactor]);

  // Computed analytics
  const decisionDistribution = useMemo(() => {
    if (!simulationResult) return [];
    return flowSimulator.calculateDecisionDistribution(scenes, choices, simulationResult);
  }, [scenes, choices, simulationResult]);

  const pathStats = useMemo(() => {
    if (!simulationResult) return null;
    return flowSimulator.calculatePathStatistics(simulationResult);
  }, [simulationResult]);

  const coverageReport = useMemo(() => {
    if (!simulationResult) return null;
    return flowSimulator.generateCoverageReport(scenes, choices, firstSceneId, simulationResult);
  }, [scenes, choices, firstSceneId, simulationResult]);

  // Toggle heatmap
  const handleHeatmapToggle = useCallback(() => {
    const newValue = !heatmapEnabled;
    setHeatmapEnabled(newValue);
    onHeatmapToggle?.(newValue);
  }, [heatmapEnabled, onHeatmapToggle]);

  // Section toggle
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Render stat card
  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
  }> = ({ icon, label, value, subValue, color = 'cyan' }) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-${color}-400`}>{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-lg font-semibold text-slate-200">{value}</div>
      {subValue && <div className="text-[10px] text-slate-500">{subValue}</div>}
    </div>
  );

  // Render section header
  const SectionHeader: React.FC<{
    id: string;
    icon: React.ReactNode;
    title: string;
    badge?: string | number;
  }> = ({ id, icon, title, badge }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-2 hover:bg-slate-800/30 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-cyan-400">{icon}</span>
        <span className="text-xs font-medium text-slate-300">{title}</span>
        {badge !== undefined && (
          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
            {badge}
          </span>
        )}
      </div>
      {expandedSection === id ? (
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
      )}
    </button>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Path Analytics</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant={heatmapEnabled ? 'primary' : 'secondary'}
              onClick={handleHeatmapToggle}
              disabled={!simulationResult}
              className="h-6 text-[10px]"
            >
              <Map className="w-3 h-3 mr-1" />
              Heatmap
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 px-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-3 space-y-3">
                {/* Iterations */}
                <div>
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5">Iterations</div>
                  <div className="flex gap-1">
                    {ITERATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setIterations(preset)}
                        className={cn(
                          'px-2 py-1 text-[10px] rounded transition-colors',
                          iterations === preset
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border border-transparent hover:text-slate-300'
                        )}
                      >
                        {preset >= 1000 ? `${preset / 1000}k` : preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Behavior Model */}
                <div>
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5">Player Behavior</div>
                  <div className="grid grid-cols-2 gap-1">
                    {BEHAVIOR_MODELS.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => setBehaviorType(model.value)}
                        className={cn(
                          'p-2 text-left rounded transition-colors',
                          behaviorType === model.value
                            ? 'bg-cyan-500/20 border border-cyan-500/30'
                            : 'bg-slate-800/50 border border-transparent hover:border-slate-700'
                        )}
                      >
                        <div className={cn(
                          'text-[10px] font-medium',
                          behaviorType === model.value ? 'text-cyan-300' : 'text-slate-300'
                        )}>
                          {model.label}
                        </div>
                        <div className="text-[9px] text-slate-500">{model.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exploration Factor */}
                {behaviorType === 'exploration' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-400">Exploration Factor</span>
                      <span className="text-[10px] text-cyan-400">{(explorationFactor * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={explorationFactor}
                      onChange={(e) => setExplorationFactor(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Run Button */}
        <Button
          size="sm"
          onClick={runSimulation}
          disabled={isSimulating || scenes.length === 0 || !firstSceneId}
          loading={isSimulating}
          className="w-full h-8"
        >
          {isSimulating ? (
            'Simulating...'
          ) : simulationResult ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Re-run Simulation
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Run Simulation ({iterations.toLocaleString()} iterations)
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!simulationResult ? (
          <div className="text-center py-8">
            <Compass className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No simulation data</p>
            <p className="text-xs text-slate-600 mt-1">
              Run a simulation to see player flow analytics
            </p>
          </div>
        ) : (
          <>
            {/* Overview Section */}
            <div>
              <SectionHeader id="overview" icon={<TrendingUp className="w-3.5 h-3.5" />} title="Overview" />
              <AnimatePresence>
                {expandedSection === 'overview' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <StatCard
                        icon={<Percent className="w-3.5 h-3.5" />}
                        label="Completion"
                        value={`${(simulationResult.completionRate * 100).toFixed(1)}%`}
                        subValue={`${Math.round(simulationResult.completionRate * iterations)} completions`}
                        color="green"
                      />
                      <StatCard
                        icon={<GitBranch className="w-3.5 h-3.5" />}
                        label="Avg Path"
                        value={simulationResult.averagePathLength.toFixed(1)}
                        subValue={`scenes per playthrough`}
                      />
                      <StatCard
                        icon={<Layers className="w-3.5 h-3.5" />}
                        label="Coverage"
                        value={`${coverageReport?.coveragePercentage.toFixed(0)}%`}
                        subValue={`${coverageReport?.visitedScenes}/${coverageReport?.totalScenes} scenes visited`}
                        color="amber"
                      />
                      <StatCard
                        icon={<Target className="w-3.5 h-3.5" />}
                        label="Bottlenecks"
                        value={simulationResult.bottlenecks.length}
                        subValue="required scenes"
                        color="red"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Critical Paths Section */}
            <div>
              <SectionHeader
                id="paths"
                icon={<Zap className="w-3.5 h-3.5" />}
                title="Critical Paths"
                badge={simulationResult.criticalPaths.length}
              />
              <AnimatePresence>
                {expandedSection === 'paths' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-1.5">
                      {simulationResult.criticalPaths.slice(0, 5).map((path, index) => {
                        const sceneNames = path.path
                          .slice(0, 3)
                          .map(id => scenes.find(s => s.id === id)?.name ?? 'Unknown')
                          .join(' → ');

                        return (
                          <div
                            key={index}
                            className="bg-slate-900/50 border border-slate-800 rounded-lg p-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-medium text-slate-400">
                                Path #{index + 1}
                              </span>
                              <span className="text-xs font-medium text-cyan-400">
                                {path.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {sceneNames}
                              {path.path.length > 3 && ` ... +${path.path.length - 3} more`}
                            </div>
                            <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                style={{ width: `${path.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottlenecks Section */}
            {simulationResult.bottlenecks.length > 0 && (
              <div>
                <SectionHeader
                  id="bottlenecks"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  title="Bottlenecks"
                  badge={simulationResult.bottlenecks.length}
                />
                <AnimatePresence>
                  {expandedSection === 'bottlenecks' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-1.5">
                        {simulationResult.bottlenecks.map((bottleneck) => (
                          <button
                            key={bottleneck.sceneId}
                            onClick={() => onSelectScene?.(bottleneck.sceneId)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-left hover:border-amber-500/30 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-300 truncate">
                                {bottleneck.sceneName}
                              </span>
                              <span className={cn(
                                'text-[10px] font-medium px-1.5 py-0.5 rounded',
                                bottleneck.isRequired
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              )}>
                                {(bottleneck.throughput * 100).toFixed(0)}%
                              </span>
                            </div>
                            {bottleneck.isRequired && (
                              <div className="text-[9px] text-red-400/70 mt-1">
                                Required for all paths
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Decision Distribution Section */}
            <div>
              <SectionHeader
                id="decisions"
                icon={<Users className="w-3.5 h-3.5" />}
                title="Decision Distribution"
                badge={decisionDistribution.length}
              />
              <AnimatePresence>
                {expandedSection === 'decisions' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-2">
                      {decisionDistribution
                        .filter(d => d.totalDecisions > 0)
                        .slice(0, 10)
                        .map((distribution) => (
                          <div
                            key={distribution.sceneId}
                            className="bg-slate-900/50 border border-slate-800 rounded-lg p-2"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => onSelectScene?.(distribution.sceneId)}
                                className="text-xs text-slate-300 truncate hover:text-cyan-400 transition-colors"
                              >
                                {distribution.sceneName}
                              </button>
                              <span className="text-[9px] text-slate-500">
                                Entropy: {distribution.entropy.toFixed(2)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {distribution.choices.map((choice) => (
                                <div key={choice.choiceId} className="flex items-center gap-2">
                                  <div className="flex-1 text-[10px] text-slate-400 truncate">
                                    {choice.label}
                                  </div>
                                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                      style={{ width: `${choice.percentage}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] text-slate-500 w-10 text-right">
                                    {choice.percentage.toFixed(0)}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Path Statistics Section */}
            {pathStats && (
              <div>
                <SectionHeader
                  id="stats"
                  icon={<BarChart2 className="w-3.5 h-3.5" />}
                  title="Path Statistics"
                />
                <AnimatePresence>
                  {expandedSection === 'stats' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2">
                            <div className="text-[10px] text-slate-500">Shortest</div>
                            <div className="text-sm font-medium text-slate-300">
                              {pathStats.shortestPath} scenes
                            </div>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2">
                            <div className="text-[10px] text-slate-500">Longest</div>
                            <div className="text-sm font-medium text-slate-300">
                              {pathStats.longestPath} scenes
                            </div>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2">
                            <div className="text-[10px] text-slate-500">Average</div>
                            <div className="text-sm font-medium text-slate-300">
                              {pathStats.averagePath.toFixed(1)} scenes
                            </div>
                          </div>
                          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2">
                            <div className="text-[10px] text-slate-500">Std Dev</div>
                            <div className="text-sm font-medium text-slate-300">
                              ±{pathStats.standardDeviation.toFixed(1)}
                            </div>
                          </div>
                        </div>

                        {/* Path Length Distribution */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2">
                          <div className="text-[10px] text-slate-500 mb-2">Length Distribution</div>
                          <div className="flex items-end gap-1 h-12">
                            {Array.from(pathStats.pathLengthDistribution.entries())
                              .sort((a, b) => a[0] - b[0])
                              .map(([length, count]) => {
                                const maxCount = Math.max(...pathStats.pathLengthDistribution.values());
                                const height = (count / maxCount) * 100;
                                return (
                                  <div
                                    key={length}
                                    className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-500/20 rounded-t"
                                    style={{ height: `${height}%` }}
                                    title={`${length} scenes: ${count} paths`}
                                  />
                                );
                              })}
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-slate-600">{pathStats.shortestPath}</span>
                            <span className="text-[9px] text-slate-600">{pathStats.longestPath}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
