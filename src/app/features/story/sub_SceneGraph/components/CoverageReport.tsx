'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  AlertCircle,
  Eye,
  EyeOff,
  MapPin,
  TrendingDown,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import type { CoverageReport as CoverageReportType, UnreachableScene, RarelyVisitedScene } from '@/lib/analytics';
import type { Scene } from '@/app/types/Scene';

interface CoverageReportProps {
  coverageData: CoverageReportType | null;
  scenes: Scene[];
  onSelectScene?: (sceneId: string) => void;
  onExport?: () => void;
  className?: string;
}

type FilterType = 'all' | 'unreachable' | 'rarely-visited' | 'never-visited';

export const CoverageReport: React.FC<CoverageReportProps> = ({
  coverageData,
  scenes,
  onSelectScene,
  onExport,
  className,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  // Get scene name by ID
  const getSceneName = (sceneId: string): string => {
    return scenes.find(s => s.id === sceneId)?.name ?? 'Unknown Scene';
  };

  // Filter and search scenes
  const filteredIssues = useMemo(() => {
    if (!coverageData) return [];

    let issues: Array<{
      sceneId: string;
      sceneName: string;
      type: 'unreachable' | 'rarely-visited' | 'never-visited';
      detail?: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    // Add unreachable scenes
    if (filter === 'all' || filter === 'unreachable') {
      coverageData.unreachableScenes.forEach(scene => {
        issues.push({
          sceneId: scene.sceneId,
          sceneName: scene.sceneName,
          type: 'unreachable',
          detail: `Reason: ${scene.reason}`,
          severity: 'high',
        });
      });
    }

    // Add rarely visited scenes
    if (filter === 'all' || filter === 'rarely-visited') {
      coverageData.rarelyVisitedScenes.forEach(scene => {
        issues.push({
          sceneId: scene.sceneId,
          sceneName: scene.sceneName,
          type: 'rarely-visited',
          detail: `Visit rate: ${(scene.visitRate * 100).toFixed(1)}% | Depth: ${scene.depth}`,
          severity: 'medium',
        });
      });
    }

    // Add never visited scenes
    if (filter === 'all' || filter === 'never-visited') {
      coverageData.neverVisitedScenes.forEach(sceneId => {
        issues.push({
          sceneId,
          sceneName: getSceneName(sceneId),
          type: 'never-visited',
          severity: 'low',
        });
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      issues = issues.filter(issue =>
        issue.sceneName.toLowerCase().includes(query) ||
        issue.sceneId.toLowerCase().includes(query)
      );
    }

    return issues;
  }, [coverageData, filter, searchQuery, scenes]);

  // Coverage percentage color
  const getCoverageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  // Severity badge
  const SeverityBadge: React.FC<{ severity: 'high' | 'medium' | 'low' }> = ({ severity }) => (
    <span
      className={cn(
        'px-1.5 py-0.5 text-[9px] font-medium rounded',
        severity === 'high' && 'bg-red-500/20 text-red-400',
        severity === 'medium' && 'bg-amber-500/20 text-amber-400',
        severity === 'low' && 'bg-slate-500/20 text-slate-400'
      )}
    >
      {severity.toUpperCase()}
    </span>
  );

  // Type badge
  const TypeBadge: React.FC<{ type: 'unreachable' | 'rarely-visited' | 'never-visited' }> = ({ type }) => {
    const config = {
      'unreachable': { label: 'Unreachable', icon: XCircle, color: 'text-red-400' },
      'rarely-visited': { label: 'Rarely Visited', icon: TrendingDown, color: 'text-amber-400' },
      'never-visited': { label: 'Never Visited', icon: EyeOff, color: 'text-slate-400' },
    };

    const { label, icon: Icon, color } = config[type];

    return (
      <div className={cn('flex items-center gap-1 text-[10px]', color)}>
        <Icon className="w-3 h-3" />
        {label}
      </div>
    );
  };

  // Section toggle
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!coverageData) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Layers className="w-10 h-10 text-slate-600 mb-3" />
        <p className="text-sm text-slate-400">No coverage data available</p>
        <p className="text-xs text-slate-600 mt-1">Run a simulation first</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Coverage Report</h3>
          </div>
          {onExport && (
            <Button size="xs" variant="ghost" onClick={onExport} className="h-6 px-2">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          )}
        </div>

        {/* Coverage Summary */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Narrative Coverage</span>
            <span className={cn('text-lg font-bold', getCoverageColor(coverageData.coveragePercentage))}>
              {coverageData.coveragePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverageData.coveragePercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                coverageData.coveragePercentage >= 90 && 'bg-gradient-to-r from-green-500 to-emerald-500',
                coverageData.coveragePercentage >= 70 && coverageData.coveragePercentage < 90 && 'bg-gradient-to-r from-yellow-500 to-amber-500',
                coverageData.coveragePercentage >= 50 && coverageData.coveragePercentage < 70 && 'bg-gradient-to-r from-orange-500 to-yellow-500',
                coverageData.coveragePercentage < 50 && 'bg-gradient-to-r from-red-500 to-orange-500'
              )}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-500">
            <span>{coverageData.visitedScenes} visited</span>
            <span>{coverageData.reachableScenes} reachable</span>
            <span>{coverageData.totalScenes} total</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/30 rounded-lg p-2 text-center">
            <div className="text-lg font-semibold text-red-400">
              {coverageData.unreachableScenes.length}
            </div>
            <div className="text-[9px] text-slate-500">Unreachable</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-2 text-center">
            <div className="text-lg font-semibold text-amber-400">
              {coverageData.rarelyVisitedScenes.length}
            </div>
            <div className="text-[9px] text-slate-500">Rarely Visited</div>
          </div>
          <div className="bg-slate-900/30 rounded-lg p-2 text-center">
            <div className="text-lg font-semibold text-slate-400">
              {coverageData.neverVisitedScenes.length}
            </div>
            <div className="text-[9px] text-slate-500">Never Visited</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scenes..."
              className="w-full pl-7 pr-2 py-1 bg-slate-900/50 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
        <div className="flex gap-1">
          {[
            { value: 'all', label: 'All Issues' },
            { value: 'unreachable', label: 'Unreachable' },
            { value: 'rarely-visited', label: 'Rarely Visited' },
            { value: 'never-visited', label: 'Never Visited' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as FilterType)}
              className={cn(
                'px-2 py-1 text-[10px] rounded transition-colors',
                filter === option.value
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Depth Distribution */}
        <div>
          <button
            onClick={() => toggleSection('depth')}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-800/30 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">Depth Distribution</span>
            </div>
            {expandedSection === 'depth' ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === 'depth' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 px-2">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-end gap-1 h-16 mb-2">
                      {Array.from(coverageData.depthDistribution.entries())
                        .sort((a, b) => a[0] - b[0])
                        .map(([depth, count]) => {
                          const maxCount = Math.max(...coverageData.depthDistribution.values());
                          const height = (count / maxCount) * 100;
                          return (
                            <div key={depth} className="flex-1 flex flex-col items-center">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ duration: 0.5, delay: depth * 0.05 }}
                                className="w-full bg-gradient-to-t from-cyan-500/60 to-cyan-500/20 rounded-t"
                                title={`Depth ${depth}: ${count} scenes`}
                              />
                            </div>
                          );
                        })}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Depth 0</span>
                      <span>Depth {Math.max(...coverageData.depthDistribution.keys())}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                      {Array.from(coverageData.depthDistribution.entries())
                        .sort((a, b) => a[0] - b[0])
                        .map(([depth, count]) => (
                          <div key={depth} className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Depth {depth}:</span>
                            <span className="text-slate-400">{count} scenes</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Issues List */}
        <div>
          <button
            onClick={() => toggleSection('issues')}
            className="w-full flex items-center justify-between p-2 hover:bg-slate-800/30 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Content Issues</span>
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
                {filteredIssues.length}
              </span>
            </div>
            {expandedSection === 'issues' ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
          <AnimatePresence>
            {expandedSection === 'issues' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-1.5">
                  {filteredIssues.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No issues found</p>
                    </div>
                  ) : (
                    filteredIssues.map((issue, index) => (
                      <motion.button
                        key={`${issue.sceneId}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => onSelectScene?.(issue.sceneId)}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-left hover:border-cyan-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs text-slate-300 truncate flex-1">
                            {issue.sceneName}
                          </span>
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        <div className="flex items-center justify-between">
                          <TypeBadge type={issue.type} />
                          {issue.detail && (
                            <span className="text-[9px] text-slate-600">{issue.detail}</span>
                          )}
                        </div>
                      </motion.button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recommendations */}
        {filteredIssues.length > 0 && (
          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-3 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">Recommendations</span>
            </div>
            <ul className="space-y-1.5 text-[10px] text-slate-500">
              {coverageData.unreachableScenes.length > 0 && (
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  Connect {coverageData.unreachableScenes.length} orphaned scene(s) to existing paths
                </li>
              )}
              {coverageData.rarelyVisitedScenes.length > 0 && (
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  Consider adding more paths to {coverageData.rarelyVisitedScenes.length} rarely visited scene(s)
                </li>
              )}
              {coverageData.neverVisitedScenes.length > 0 && (
                <li className="flex items-start gap-1.5">
                  <span className="text-slate-400 mt-0.5">•</span>
                  Review {coverageData.neverVisitedScenes.length} scene(s) that received no visits in simulation
                </li>
              )}
              {coverageData.coveragePercentage < 80 && (
                <li className="flex items-start gap-1.5">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  Consider rebalancing branch weights to improve overall coverage
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverageReport;
