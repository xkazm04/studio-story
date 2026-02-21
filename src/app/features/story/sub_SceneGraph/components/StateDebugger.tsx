'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  History,
  Variable,
  Camera,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  variableManager,
  conditionEngine,
  type VariableDefinition,
  type VariableChange,
  type StateSnapshot,
  type Condition,
} from '@/lib/branching';

interface StateDebuggerProps {
  currentSceneId?: string;
  onNavigateToScene?: (sceneId: string) => void;
  className?: string;
}

type FilterScope = 'all' | 'global' | 'scene' | 'character';

/**
 * StateDebugger - Variable inspection and debugging tool
 */
export const StateDebugger: React.FC<StateDebuggerProps> = ({
  currentSceneId,
  onNavigateToScene,
  className,
}) => {
  // State
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'variables' | 'history' | 'snapshots'>('variables');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get variables and state from manager
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [history, setHistory] = useState<VariableChange[]>([]);
  const [snapshots, setSnapshots] = useState<StateSnapshot[]>([]);

  // Refresh data from variable manager
  const refreshData = useCallback(() => {
    setVariables(variableManager.getAllVariables());
    setHistory(variableManager.getHistory(50));
    setSnapshots(variableManager.getAllSnapshots());
  }, []);

  // Subscribe to changes
  useEffect(() => {
    refreshData();
    const unsubscribe = variableManager.subscribeAll(() => {
      refreshData();
    });
    return unsubscribe;
  }, [refreshData]);

  // Filtered variables
  const filteredVariables = useMemo(() => {
    let result = variables;

    // Filter by scope
    if (filterScope !== 'all') {
      result = result.filter(v => v.scope === filterScope);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
      );
    }

    // Filter only changed
    if (showOnlyChanged) {
      const changedIds = new Set(history.map(h => h.variableId));
      result = result.filter(v => changedIds.has(v.id));
    }

    return result;
  }, [variables, filterScope, searchQuery, showOnlyChanged, history]);

  // Get current value for a variable
  const getCurrentValue = useCallback((variableId: string) => {
    return variableManager.getValue(variableId);
  }, []);

  // Handle value change
  const handleValueChange = useCallback((variableId: string, value: string) => {
    const variable = variableManager.getVariable(variableId);
    if (!variable) return;

    let parsedValue: import('@/lib/branching').VariableValue = value;
    if (variable.type === 'number') {
      parsedValue = parseFloat(value) || 0;
    } else if (variable.type === 'boolean') {
      parsedValue = value === 'true';
    }

    variableManager.setValue(variableId, parsedValue, 'user', currentSceneId);
  }, [currentSceneId]);

  // Create snapshot
  const handleCreateSnapshot = useCallback(() => {
    if (currentSceneId) {
      variableManager.createSnapshot(currentSceneId);
      refreshData();
    }
  }, [currentSceneId, refreshData]);

  // Restore snapshot
  const handleRestoreSnapshot = useCallback((snapshotId: string) => {
    variableManager.restoreSnapshot(snapshotId);
    refreshData();
  }, [refreshData]);

  // Delete snapshot
  const handleDeleteSnapshot = useCallback((snapshotId: string) => {
    variableManager.deleteSnapshot(snapshotId);
    refreshData();
  }, [refreshData]);

  // Undo last change
  const handleUndo = useCallback(() => {
    variableManager.undo();
    refreshData();
  }, [refreshData]);

  // Reset all variables
  const handleReset = useCallback(() => {
    variableManager.resetAllVariables();
    refreshData();
  }, [refreshData]);

  // Export state
  const handleExport = useCallback(() => {
    const json = variableManager.exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Format value for display
  const formatValue = (value: import('@/lib/branching').VariableValue): string => {
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Render variable row
  const renderVariableRow = (variable: VariableDefinition) => {
    const currentValue = getCurrentValue(variable.id);
    const lastChange = history.find(h => h.variableId === variable.id);

    return (
      <div
        key={variable.id}
        className="flex items-center gap-2 p-2 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
      >
        {/* Name & Type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Variable className="w-3 h-3 text-cyan-400" />
            <span className="text-xs font-medium text-slate-200 truncate">{variable.name}</span>
            <span className={cn(
              'px-1 py-0.5 text-[9px] rounded',
              variable.scope === 'global' && 'bg-blue-500/20 text-blue-300',
              variable.scope === 'scene' && 'bg-green-500/20 text-green-300',
              variable.scope === 'character' && 'bg-purple-500/20 text-purple-300'
            )}>
              {variable.scope}
            </span>
          </div>
          {variable.description && (
            <div className="text-[10px] text-slate-500 truncate mt-0.5">{variable.description}</div>
          )}
        </div>

        {/* Value Editor */}
        <div className="w-24">
          {variable.type === 'boolean' ? (
            <select
              value={String(currentValue)}
              onChange={(e) => handleValueChange(variable.id, e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={variable.type === 'number' ? 'number' : 'text'}
              value={formatValue(currentValue ?? variable.defaultValue)}
              onChange={(e) => handleValueChange(variable.id, e.target.value)}
              className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-200 focus:outline-none focus:border-cyan-500/50"
            />
          )}
        </div>

        {/* Last changed indicator */}
        {lastChange && (
          <div className="text-[9px] text-slate-500" title={`Changed at ${formatTime(lastChange.timestamp)}`}>
            <Clock className="w-3 h-3" />
          </div>
        )}
      </div>
    );
  };

  // Render history entry
  const renderHistoryEntry = (change: VariableChange, index: number) => {
    const variable = variableManager.getVariable(change.variableId);

    return (
      <motion.div
        key={`${change.variableId}-${change.timestamp}-${index}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className="flex items-center gap-2 p-2 bg-slate-900/30 border border-slate-800 rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-300">{variable?.name ?? 'Unknown'}</span>
            <span className="text-[10px] text-slate-500">
              {formatValue(change.oldValue)} → {formatValue(change.newValue)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-slate-500 mt-0.5">
            <span>{formatTime(change.timestamp)}</span>
            {change.sceneId && <span>@ {change.sceneId}</span>}
            <span className="px-1 py-0.5 bg-slate-800 rounded">{change.source}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render snapshot card
  const renderSnapshotCard = (snapshot: StateSnapshot) => (
    <div
      key={snapshot.id}
      className="p-2 bg-slate-900/30 border border-slate-800 rounded-lg"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-medium text-slate-200">{snapshot.label}</div>
          <div className="text-[10px] text-slate-500">
            {formatTime(snapshot.timestamp)} • {snapshot.state.size} variables
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleRestoreSnapshot(snapshot.id)}
            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Restore"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteSnapshot(snapshot.id)}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="shrink-0 p-3 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">State Debugger</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="xs"
              variant="ghost"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="h-6 px-1.5"
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={handleCreateSnapshot}
              disabled={!currentSceneId}
              className="h-6 px-1.5"
              title="Create Snapshot"
            >
              <Camera className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={handleExport}
              className="h-6 px-1.5"
              title="Export State"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900/50 rounded-lg">
          {(['variables', 'history', 'snapshots'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 px-2 py-1 text-[10px] font-medium rounded transition-colors',
                activeTab === tab
                  ? 'bg-slate-800 text-slate-200'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              {tab === 'variables' && <Variable className="w-3 h-3 inline mr-1" />}
              {tab === 'history' && <History className="w-3 h-3 inline mr-1" />}
              {tab === 'snapshots' && <Camera className="w-3 h-3 inline mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'variables' && ` (${filteredVariables.length})`}
              {tab === 'history' && ` (${history.length})`}
              {tab === 'snapshots' && ` (${snapshots.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Variables Tab */}
          {activeTab === 'variables' && (
            <motion.div
              key="variables"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-3"
            >
              {/* Filters */}
              <div className="space-y-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search variables..."
                    className="w-full pl-7 pr-2 py-1.5 bg-slate-900/50 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Scope Filter */}
                <div className="flex items-center gap-1">
                  {(['all', 'global', 'scene', 'character'] as const).map(scope => (
                    <button
                      key={scope}
                      onClick={() => setFilterScope(scope)}
                      className={cn(
                        'px-2 py-1 text-[10px] rounded transition-colors',
                        filterScope === scope
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-300'
                      )}
                    >
                      {scope === 'all' ? 'All' : scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-700 mx-1" />
                  <button
                    onClick={() => setShowOnlyChanged(!showOnlyChanged)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors',
                      showOnlyChanged
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-transparent hover:text-slate-300'
                    )}
                  >
                    {showOnlyChanged ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    Changed
                  </button>
                </div>
              </div>

              {/* Variables List */}
              {filteredVariables.length === 0 ? (
                <div className="text-center py-8">
                  <Variable className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No variables found</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredVariables.map(v => renderVariableRow(v))}
                </div>
              )}

              {/* Reset Button */}
              <Button
                size="xs"
                variant="ghost"
                onClick={handleReset}
                className="w-full h-7 text-slate-500 hover:text-red-400"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset All to Defaults
              </Button>
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-1.5"
            >
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No changes recorded</p>
                </div>
              ) : (
                history.map((change, index) => renderHistoryEntry(change, index))
              )}
            </motion.div>
          )}

          {/* Snapshots Tab */}
          {activeTab === 'snapshots' && (
            <motion.div
              key="snapshots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 space-y-2"
            >
              {/* Create Snapshot */}
              <Button
                size="xs"
                variant="secondary"
                onClick={handleCreateSnapshot}
                disabled={!currentSceneId}
                className="w-full h-8"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Create Snapshot
              </Button>

              {/* Snapshots List */}
              {snapshots.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No snapshots saved</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {snapshots.map(s => renderSnapshotCard(s))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - Current Scene */}
      {currentSceneId && (
        <div className="shrink-0 px-3 py-2 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Current Scene:</span>
            <span className="text-slate-300 font-medium truncate ml-2">{currentSceneId}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateDebugger;
