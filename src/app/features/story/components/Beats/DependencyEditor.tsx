/**
 * DependencyEditor
 * UI component for defining and managing beat prerequisites/dependencies
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Link2,
  Unlink,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  Plus,
  X,
  Info,
  Zap,
  Clock,
  Lock,
  Unlock,
  GitBranch,
} from 'lucide-react';
import {
  type Dependency,
  type DependencyType,
  type DependencyStrength,
  type ValidationError,
  DependencyManager,
} from '@/lib/beats/DependencyManager';

// Beat data structure (minimal for dependency purposes)
interface BeatSummary {
  id: string;
  title: string;
  order: number;
  type?: string;
  sceneId?: string;
  sceneName?: string;
}

interface DependencyEditorProps {
  beats: BeatSummary[];
  dependencies: Dependency[];
  onAddDependency: (dependency: Omit<Dependency, 'id'>) => void;
  onRemoveDependency: (dependencyId: string) => void;
  onUpdateDependency: (dependencyId: string, updates: Partial<Dependency>) => void;
  selectedBeatId?: string;
  readonly?: boolean;
}

// Dependency type descriptions
const DEPENDENCY_TYPES: Record<DependencyType, { label: string; description: string; icon: typeof Link2 }> = {
  sequential: {
    label: 'Sequential',
    description: 'Must occur in this order',
    icon: Lock,
  },
  parallel: {
    label: 'Parallel',
    description: 'Can happen simultaneously',
    icon: GitBranch,
  },
  causal: {
    label: 'Causal',
    description: 'Directly causes this beat to happen',
    icon: ArrowRight,
  },
};

// Strength levels
const STRENGTH_LEVELS: Record<DependencyStrength, { label: string; color: string }> = {
  required: { label: 'Required', color: '#ef4444' },
  suggested: { label: 'Suggested', color: '#f59e0b' },
  optional: { label: 'Optional', color: '#22c55e' },
};

// Individual dependency card
function DependencyCard({
  dependency,
  fromBeat,
  toBeat,
  onRemove,
  onUpdate,
  readonly,
  hasError,
}: {
  dependency: Dependency;
  fromBeat?: BeatSummary;
  toBeat?: BeatSummary;
  onRemove: () => void;
  onUpdate: (updates: Partial<Dependency>) => void;
  readonly?: boolean;
  hasError?: ValidationError;
}) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = DEPENDENCY_TYPES[dependency.type];
  const strengthInfo = STRENGTH_LEVELS[dependency.strength];
  const TypeIcon = typeInfo.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-slate-800/50 rounded-lg border overflow-hidden',
        hasError ? 'border-red-500/50' : 'border-slate-700/50'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/30 transition-colors',
          !readonly && 'cursor-pointer'
        )}
        onClick={() => !readonly && setExpanded(!expanded)}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${strengthInfo.color}20` }}
        >
          <TypeIcon className="w-4 h-4" style={{ color: strengthInfo.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-200 truncate">{fromBeat?.title || 'Unknown'}</span>
            <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
            <span className="text-cyan-400 truncate">{toBeat?.title || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{typeInfo.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{
              backgroundColor: `${strengthInfo.color}20`,
              color: strengthInfo.color,
            }}>
              {strengthInfo.label}
            </span>
          </div>
        </div>

        {hasError && (
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <AlertTriangle className="w-3 h-3" />
            <span>Error</span>
          </div>
        )}

        {!readonly && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            >
              <Unlink className="w-4 h-4" />
            </button>
            <ChevronDown className={cn(
              'w-4 h-4 text-slate-400 transition-transform',
              expanded && 'rotate-180'
            )} />
          </div>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && !readonly && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-3 space-y-3">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Dependency Type</label>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.entries(DEPENDENCY_TYPES) as [DependencyType, typeof DEPENDENCY_TYPES.sequential][]).map(([type, info]) => {
                    const Icon = info.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => onUpdate({ type })}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors',
                          dependency.type === type
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-700/30 text-slate-300 border border-transparent hover:bg-slate-700/50'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Strength selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Strength</label>
                <div className="flex gap-1">
                  {(Object.entries(STRENGTH_LEVELS) as [DependencyStrength, typeof STRENGTH_LEVELS.required][]).map(([strength, info]) => (
                    <button
                      key={strength}
                      onClick={() => onUpdate({ strength })}
                      className={cn(
                        'flex-1 px-2 py-1.5 rounded text-xs transition-colors border',
                        dependency.strength === strength
                          ? 'border-current'
                          : 'border-transparent bg-slate-700/30 hover:bg-slate-700/50'
                      )}
                      style={{
                        backgroundColor: dependency.strength === strength ? `${info.color}20` : undefined,
                        color: dependency.strength === strength ? info.color : '#94a3b8',
                      }}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Description (optional)</label>
                <textarea
                  value={dependency.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Why is this dependency needed?"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                    text-sm text-slate-200 placeholder-slate-500
                    focus:outline-none focus:border-cyan-500/50 resize-none"
                  rows={2}
                />
              </div>

              {/* Error display */}
              {hasError && (
                <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-300">
                    <span className="font-medium">{hasError.type.replace('_', ' ').toUpperCase()}:</span>
                    <span className="ml-1">{hasError.message}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Add dependency dialog
function AddDependencyDialog({
  beats,
  existingDependencies,
  targetBeatId,
  onAdd,
  onClose,
}: {
  beats: BeatSummary[];
  existingDependencies: Dependency[];
  targetBeatId?: string;
  onAdd: (dependency: Omit<Dependency, 'id'>) => void;
  onClose: () => void;
}) {
  const [sourceBeatId, setSourceBeatId] = useState('');
  const [targetBeat, setTargetBeat] = useState(targetBeatId || '');
  const [type, setType] = useState<DependencyType>('sequential');
  const [strength, setStrength] = useState<DependencyStrength>('required');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  // Create temporary manager to check for cycles
  const tempManager = useMemo(() => {
    const manager = new DependencyManager();
    // Initialize with beat nodes first
    const beatData = beats.map(b => ({ id: b.id, name: b.title, order: b.order }));
    manager.initializeFromBeats(beatData, []);
    // Then add existing dependencies
    existingDependencies.forEach(d => manager.addDependency(d));
    return manager;
  }, [existingDependencies, beats]);

  // Check if adding this dependency would create a cycle
  const wouldCreateCycle = useMemo(() => {
    if (!sourceBeatId || !targetBeat) return false;
    return tempManager.wouldCreateCycle(sourceBeatId, targetBeat);
  }, [tempManager, sourceBeatId, targetBeat]);

  // Filter beats for selection
  const filteredBeats = useMemo(() => {
    const query = search.toLowerCase();
    return beats.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.sceneName?.toLowerCase().includes(query)
    );
  }, [beats, search]);

  const handleAdd = () => {
    if (!sourceBeatId || !targetBeat || wouldCreateCycle) return;

    onAdd({
      sourceBeatId,
      targetBeatId: targetBeat,
      type,
      strength,
      description: description || undefined,
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-medium text-slate-100">Add Dependency</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search beats..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-sm text-slate-200 placeholder-slate-500
                focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Source beat (prerequisite) */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Source Beat (must happen first)
            </label>
            <select
              value={sourceBeatId}
              onChange={(e) => setSourceBeatId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select a beat...</option>
              {filteredBeats
                .filter(b => b.id !== targetBeat)
                .map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.order}. {beat.title} {beat.sceneName ? `(${beat.sceneName})` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Target beat (dependent) */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 flex items-center gap-1">
              <Unlock className="w-3 h-3" />
              Target Beat (depends on source)
            </label>
            <select
              value={targetBeat}
              onChange={(e) => setTargetBeat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Select a beat...</option>
              {filteredBeats
                .filter(b => b.id !== sourceBeatId)
                .map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.order}. {beat.title} {beat.sceneName ? `(${beat.sceneName})` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Cycle warning */}
          {wouldCreateCycle && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">
                This dependency would create a circular reference and cannot be added.
              </div>
            </div>
          )}

          {/* Type and strength */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DependencyType)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                  text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {Object.entries(DEPENDENCY_TYPES).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Strength</label>
              <select
                value={strength}
                onChange={(e) => setStrength(e.target.value as DependencyStrength)}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                  text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {Object.entries(STRENGTH_LEVELS).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this dependency needed?"
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-sm text-slate-200 placeholder-slate-500
                focus:outline-none focus:border-cyan-500/50 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!sourceBeatId || !targetBeat || wouldCreateCycle}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              !sourceBeatId || !targetBeat || wouldCreateCycle
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            )}
          >
            Add Dependency
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DependencyEditor({
  beats,
  dependencies,
  onAddDependency,
  onRemoveDependency,
  onUpdateDependency,
  selectedBeatId,
  readonly = false,
}: DependencyEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [typeFilter, setTypeFilter] = useState<DependencyType | 'all'>('all');

  // Create beat lookup map
  const beatMap = useMemo(() => {
    return new Map(beats.map(b => [b.id, b]));
  }, [beats]);

  // Create dependency manager for validation
  const manager = useMemo(() => {
    const m = new DependencyManager();
    const beatData = beats.map(b => ({ id: b.id, name: b.title, order: b.order }));
    m.initializeFromBeats(beatData, []);
    dependencies.forEach(d => m.addDependency(d));
    return m;
  }, [dependencies, beats]);

  // Get validation errors
  const validationErrors = useMemo(() => {
    const beatOrders = new Map(beats.map(b => [b.id, b.order]));
    return manager.validate(beatOrders);
  }, [manager, beats]);

  // Create error lookup by affected beats
  const errorLookup = useMemo(() => {
    const lookup = new Map<string, ValidationError>();
    validationErrors.forEach(error => {
      // Map errors to dependencies by affected beats
      error.affectedBeats.forEach(beatId => {
        const relatedDep = dependencies.find(d =>
          d.sourceBeatId === beatId || d.targetBeatId === beatId
        );
        if (relatedDep) {
          lookup.set(relatedDep.id, error);
        }
      });
    });
    return lookup;
  }, [validationErrors, dependencies]);

  // Filter dependencies
  const filteredDependencies = useMemo(() => {
    let filtered = dependencies;

    // Filter by selected beat
    if (selectedBeatId) {
      if (filter === 'incoming') {
        filtered = filtered.filter(d => d.targetBeatId === selectedBeatId);
      } else if (filter === 'outgoing') {
        filtered = filtered.filter(d => d.sourceBeatId === selectedBeatId);
      } else {
        filtered = filtered.filter(d =>
          d.sourceBeatId === selectedBeatId || d.targetBeatId === selectedBeatId
        );
      }
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(d => d.type === typeFilter);
    }

    return filtered;
  }, [dependencies, selectedBeatId, filter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const incoming = dependencies.filter(d => d.targetBeatId === selectedBeatId).length;
    const outgoing = dependencies.filter(d => d.sourceBeatId === selectedBeatId).length;
    const errors = validationErrors.length;
    return { incoming, outgoing, errors, total: dependencies.length };
  }, [dependencies, selectedBeatId, validationErrors]);

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-slate-200">Dependencies</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{stats.total} total</span>
            {stats.errors > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {stats.errors} issues
              </span>
            )}
          </div>
        </div>
        {!readonly && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
              bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Dependency
          </button>
        )}
      </div>

      {/* Filters */}
      {selectedBeatId && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex rounded-lg bg-slate-800/50 border border-slate-700/50 p-0.5">
            {(['all', 'incoming', 'outgoing'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium transition-colors capitalize',
                  filter === f
                    ? 'bg-slate-700 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {f}
                {f === 'incoming' && stats.incoming > 0 && (
                  <span className="ml-1 text-slate-500">({stats.incoming})</span>
                )}
                {f === 'outgoing' && stats.outgoing > 0 && (
                  <span className="ml-1 text-slate-500">({stats.outgoing})</span>
                )}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DependencyType | 'all')}
            className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg
              text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All types</option>
            {Object.entries(DEPENDENCY_TYPES).map(([key, info]) => (
              <option key={key} value={key}>{info.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Dependencies list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredDependencies.map((dependency) => (
            <DependencyCard
              key={dependency.id}
              dependency={dependency}
              fromBeat={beatMap.get(dependency.sourceBeatId)}
              toBeat={beatMap.get(dependency.targetBeatId)}
              onRemove={() => onRemoveDependency(dependency.id)}
              onUpdate={(updates) => onUpdateDependency(dependency.id, updates)}
              readonly={readonly}
              hasError={errorLookup.get(dependency.id)}
            />
          ))}
        </AnimatePresence>

        {filteredDependencies.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            {selectedBeatId ? (
              <p>No dependencies for this beat</p>
            ) : (
              <p>No dependencies defined yet</p>
            )}
            {!readonly && (
              <button
                onClick={() => setShowAddDialog(true)}
                className="mt-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Add your first dependency
              </button>
            )}
          </div>
        )}
      </div>

      {/* Validation summary */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Validation Issues ({validationErrors.length})
          </div>
          <ul className="space-y-1 text-xs text-red-300">
            {validationErrors.slice(0, 5).map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                {error.message}
              </li>
            ))}
            {validationErrors.length > 5 && (
              <li className="text-red-400">...and {validationErrors.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* No issues badge */}
      {validationErrors.length === 0 && dependencies.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-300">All dependencies valid</span>
        </div>
      )}

      {/* Add dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <AddDependencyDialog
            beats={beats}
            existingDependencies={dependencies}
            targetBeatId={selectedBeatId}
            onAdd={onAddDependency}
            onClose={() => setShowAddDialog(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for sidebar/cards
export function DependencyEditorCompact({
  dependencies,
  beatId,
  beatMap,
}: {
  dependencies: Dependency[];
  beatId: string;
  beatMap: Map<string, BeatSummary>;
}) {
  const related = dependencies.filter(d =>
    d.sourceBeatId === beatId || d.targetBeatId === beatId
  );

  if (related.length === 0) return null;

  const prerequisites = related.filter(d => d.targetBeatId === beatId);
  const dependents = related.filter(d => d.sourceBeatId === beatId);

  return (
    <div className="space-y-2">
      {prerequisites.length > 0 && (
        <div className="text-xs">
          <span className="text-slate-500">Requires: </span>
          {prerequisites.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ', '}
              <span className="text-amber-400">{beatMap.get(d.sourceBeatId)?.title || 'Unknown'}</span>
            </span>
          ))}
        </div>
      )}
      {dependents.length > 0 && (
        <div className="text-xs">
          <span className="text-slate-500">Enables: </span>
          {dependents.map((d, i) => (
            <span key={d.id}>
              {i > 0 && ', '}
              <span className="text-cyan-400">{beatMap.get(d.targetBeatId)?.title || 'Unknown'}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
