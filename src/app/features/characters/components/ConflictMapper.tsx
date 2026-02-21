/**
 * ConflictMapper - Internal conflict visualization and management
 * Design: Clean Manuscript style with cyan accents
 *
 * Visualizes and manages internal character conflicts:
 * - Conflict cards with severity indicators
 * - Motivation linkage visualization
 * - Resolution tracking
 * - Story impact analysis
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Flame,
  Link,
  Check,
  X,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Save,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  InternalConflict,
  ConflictSeverity,
  Motivation,
} from '@/lib/psychology/PsychologyEngine';
import { generateConflictId } from '@/lib/psychology/PsychologyEngine';

// ============================================================================
// Types
// ============================================================================

export interface ConflictMapperProps {
  conflicts: InternalConflict[];
  motivations: Motivation[];
  onConflictsChange: (conflicts: InternalConflict[]) => void;
  readOnly?: boolean;
  compact?: boolean;
}

interface ConflictCardProps {
  conflict: InternalConflict;
  motivationA?: Motivation;
  motivationB?: Motivation;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (conflict: InternalConflict) => void;
  onDelete: (conflictId: string) => void;
  onResolve: (conflictId: string) => void;
  readOnly?: boolean;
}

interface ConflictEditorProps {
  conflict?: Partial<InternalConflict>;
  motivations: Motivation[];
  onSave: (conflict: Omit<InternalConflict, 'id'>) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_CONFIG: Record<ConflictSeverity, {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  minor: {
    label: 'Minor',
    icon: <AlertCircle size={14} />,
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
    description: 'Small tension, rarely affects decisions',
  },
  moderate: {
    label: 'Moderate',
    icon: <AlertTriangle size={14} />,
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    description: 'Noticeable tension, occasionally causes hesitation',
  },
  major: {
    label: 'Major',
    icon: <AlertOctagon size={14} />,
    color: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    description: 'Significant conflict, frequently affects behavior',
  },
  defining: {
    label: 'Defining',
    icon: <Flame size={14} />,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    description: 'Core to the character, shapes their entire arc',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function flattenMotivations(motivations: Motivation[]): Motivation[] {
  const result: Motivation[] = [];

  function traverse(m: Motivation) {
    result.push(m);
    if (m.children) {
      m.children.forEach(traverse);
    }
  }

  motivations.forEach(traverse);
  return result;
}

// ============================================================================
// Subcomponents
// ============================================================================

const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  motivationA,
  motivationB,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onResolve,
  readOnly = false,
}) => {
  const severityConfig = SEVERITY_CONFIG[conflict.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border transition-all overflow-hidden',
        'bg-slate-800/40',
        conflict.isResolved
          ? 'border-green-500/30 opacity-60'
          : 'border-slate-700/50 hover:border-slate-600'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        {/* Severity badge */}
        <span className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border',
          severityConfig.color
        )}>
          {severityConfig.icon}
          <span>{severityConfig.label}</span>
        </span>

        {/* Name */}
        <h4 className={cn(
          'flex-1 font-mono text-sm truncate',
          conflict.isResolved ? 'text-slate-500 line-through' : 'text-slate-200'
        )}>
          {conflict.name}
        </h4>

        {/* Resolved indicator */}
        {conflict.isResolved && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-[10px] font-mono text-green-400">
            <Check size={10} />
            <span>Resolved</span>
          </span>
        )}

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="p-1 rounded hover:bg-slate-700/50 text-slate-500 transition-colors"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Motivation link */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <Link size={10} className="text-slate-600" />
        <span className="font-mono text-[10px] text-cyan-400/70">
          {motivationA?.label || 'Unknown'}
        </span>
        <ArrowRight size={10} className="text-slate-600" />
        <span className="font-mono text-[10px] text-purple-400/70">
          {motivationB?.label || 'Unknown'}
        </span>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/50 overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* Description */}
              <div>
                <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                  description
                </span>
                <p className="font-mono text-xs text-slate-400">
                  {conflict.description}
                </p>
              </div>

              {/* Manifestations */}
              {conflict.manifestations.length > 0 && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    manifestations
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {conflict.manifestations.map((m, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-700/50 rounded text-[10px] font-mono text-slate-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Story impact */}
              {conflict.storyImpact && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    story_impact
                  </span>
                  <p className="font-mono text-xs text-slate-500 italic">
                    {conflict.storyImpact}
                  </p>
                </div>
              )}

              {/* Resolution path */}
              {conflict.resolutionPath && (
                <div>
                  <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                    resolution_path
                  </span>
                  <p className="font-mono text-xs text-green-400/70">
                    {conflict.resolutionPath}
                  </p>
                </div>
              )}

              {/* Resolved in scene */}
              {conflict.resolvedInScene && (
                <div className="flex items-center gap-2">
                  <MapPin size={10} className="text-slate-500" />
                  <span className="font-mono text-[10px] text-slate-500">
                    Resolved in: {conflict.resolvedInScene}
                  </span>
                </div>
              )}

              {/* Actions */}
              {!readOnly && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                  {!conflict.isResolved && (
                    <button
                      onClick={() => onResolve(conflict.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded
                                 bg-green-500/10 hover:bg-green-500/20 text-green-400
                                 font-mono text-[10px] transition-colors"
                    >
                      <Check size={12} />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(conflict)}
                    className="flex items-center gap-1 px-2 py-1 rounded
                               bg-slate-700/40 hover:bg-slate-700/60 text-slate-400
                               font-mono text-[10px] transition-colors"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDelete(conflict.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded
                               bg-red-500/10 hover:bg-red-500/20 text-red-400
                               font-mono text-[10px] transition-colors"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ConflictEditor: React.FC<ConflictEditorProps> = ({
  conflict,
  motivations,
  onSave,
  onCancel,
}) => {
  const flatMotivations = useMemo(() => flattenMotivations(motivations), [motivations]);

  const [name, setName] = useState(conflict?.name || '');
  const [description, setDescription] = useState(conflict?.description || '');
  const [motivationA, setMotivationA] = useState(conflict?.motivationA || '');
  const [motivationB, setMotivationB] = useState(conflict?.motivationB || '');
  const [severity, setSeverity] = useState<ConflictSeverity>(conflict?.severity || 'moderate');
  const [manifestations, setManifestations] = useState(conflict?.manifestations?.join(', ') || '');
  const [storyImpact, setStoryImpact] = useState(conflict?.storyImpact || '');
  const [resolutionPath, setResolutionPath] = useState(conflict?.resolutionPath || '');

  const handleSave = () => {
    if (!name.trim() || !motivationA || !motivationB) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      motivationA,
      motivationB,
      severity,
      manifestations: manifestations.split(',').map((m) => m.trim()).filter(Boolean),
      storyImpact: storyImpact.trim(),
      resolutionPath: resolutionPath.trim() || undefined,
      isResolved: conflict?.isResolved || false,
      resolvedInScene: conflict?.resolvedInScene,
    });
  };

  return (
    <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs uppercase tracking-wide text-slate-300">
          {conflict ? 'edit_conflict' : 'new_conflict'}
        </h4>
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-slate-700/50 text-slate-500"
        >
          <X size={14} />
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Conflict Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Duty vs. Desire"
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-sm text-slate-200 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the nature of this internal conflict..."
          rows={2}
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
        />
      </div>

      {/* Linked motivations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            Motivation A *
          </label>
          <select
            value={motivationA}
            onChange={(e) => setMotivationA(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="">Select motivation...</option>
            {flatMotivations.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.level})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            Motivation B *
          </label>
          <select
            value={motivationB}
            onChange={(e) => setMotivationB(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="">Select motivation...</option>
            {flatMotivations.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({m.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Severity
        </label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSeverity(key as ConflictSeverity)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-colors',
                severity === key
                  ? config.color
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
              )}
              title={config.description}
            >
              {config.icon}
              <span className="font-mono text-[10px]">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manifestations */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Manifestations (comma-separated)
        </label>
        <input
          type="text"
          value={manifestations}
          onChange={(e) => setManifestations(e.target.value)}
          placeholder="Hesitation, internal arguments, mood swings"
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      {/* Story impact */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Story Impact
        </label>
        <textarea
          value={storyImpact}
          onChange={(e) => setStoryImpact(e.target.value)}
          placeholder="How does this conflict drive the story forward?"
          rows={2}
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
        />
      </div>

      {/* Resolution path */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Resolution Path (optional)
        </label>
        <textarea
          value={resolutionPath}
          onChange={(e) => setResolutionPath(e.target.value)}
          placeholder="How might this conflict be resolved?"
          rows={2}
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/50">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-slate-800/40 text-slate-400
                     hover:bg-slate-700/60 font-mono text-xs transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !motivationA || !motivationB}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors',
            name.trim() && motivationA && motivationB
              ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400'
              : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
          )}
        >
          <Save size={12} />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ConflictMapper: React.FC<ConflictMapperProps> = ({
  conflicts,
  motivations,
  onConflictsChange,
  readOnly = false,
  compact = false,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingConflict, setEditingConflict] = useState<InternalConflict | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<ConflictSeverity | 'all'>('all');
  const [showResolved, setShowResolved] = useState(true);

  // Flatten motivations for lookup
  const flatMotivations = useMemo(() => flattenMotivations(motivations), [motivations]);

  // Filter conflicts
  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
      if (!showResolved && c.isResolved) return false;
      return true;
    });
  }, [conflicts, filterSeverity, showResolved]);

  // Stats
  const stats = useMemo(() => {
    const bySeverity: Record<ConflictSeverity, number> = {
      minor: 0,
      moderate: 0,
      major: 0,
      defining: 0,
    };

    let resolved = 0;
    conflicts.forEach((c) => {
      bySeverity[c.severity]++;
      if (c.isResolved) resolved++;
    });

    return { total: conflicts.length, resolved, bySeverity };
  }, [conflicts]);

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Delete conflict
  const handleDelete = useCallback((conflictId: string) => {
    onConflictsChange(conflicts.filter((c) => c.id !== conflictId));
  }, [conflicts, onConflictsChange]);

  // Resolve conflict
  const handleResolve = useCallback((conflictId: string) => {
    onConflictsChange(
      conflicts.map((c) =>
        c.id === conflictId ? { ...c, isResolved: true } : c
      )
    );
  }, [conflicts, onConflictsChange]);

  // Save conflict
  const handleSaveConflict = useCallback((conflictData: Omit<InternalConflict, 'id'>) => {
    if (editingConflict) {
      // Update existing
      onConflictsChange(
        conflicts.map((c) =>
          c.id === editingConflict.id ? { ...c, ...conflictData } : c
        )
      );
    } else {
      // Add new
      const newConflict: InternalConflict = {
        ...conflictData,
        id: generateConflictId(),
      };
      onConflictsChange([...conflicts, newConflict]);
    }

    setShowEditor(false);
    setEditingConflict(null);
  }, [conflicts, onConflictsChange, editingConflict]);

  // Get motivation by ID
  const getMotivation = useCallback((id: string) => {
    return flatMotivations.find((m) => m.id === id);
  }, [flatMotivations]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              internal_conflicts
            </h3>
            <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
              {stats.total} ({stats.resolved} resolved)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => (
            <div
              key={severity}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800/40 rounded"
            >
              <span className={cn('flex items-center', config.color.split(' ')[0])}>
                {config.icon}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {config.label}: {stats.bySeverity[severity as ConflictSeverity]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              internal_conflicts
            </h3>
            <span className="px-2 py-0.5 bg-slate-800/60 rounded text-xs font-mono text-slate-500">
              {filteredConflicts.length} / {stats.total}
            </span>
          </div>

          {!readOnly && !showEditor && (
            <button
              onClick={() => {
                setEditingConflict(null);
                setShowEditor(true);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded
                         bg-orange-500/20 hover:bg-orange-500/30 text-orange-400
                         font-mono text-xs transition-colors"
            >
              <Plus size={12} />
              <span>add_conflict</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity filter */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-500">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as ConflictSeverity | 'all')}
              className="px-2 py-1 bg-slate-800/40 border border-slate-700/50 rounded
                         font-mono text-xs text-slate-300
                         focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            >
              <option value="all">All</option>
              {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Show resolved toggle */}
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] transition-colors',
              showResolved
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-800/40 text-slate-500'
            )}
          >
            <Check size={10} />
            <span>Show Resolved</span>
          </button>

          {/* Stats */}
          <div className="flex items-center gap-3 ml-auto">
            {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => (
              <div key={severity} className="flex items-center gap-1" title={config.description}>
                <span className={cn('flex items-center', config.color.split(' ')[0])}>
                  {config.icon}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {stats.bySeverity[severity as ConflictSeverity]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ConflictEditor
              conflict={editingConflict || undefined}
              motivations={motivations}
              onSave={handleSaveConflict}
              onCancel={() => {
                setShowEditor(false);
                setEditingConflict(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflict list */}
      <div className="space-y-3">
        {filteredConflicts.length > 0 ? (
          filteredConflicts.map((conflict) => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              motivationA={getMotivation(conflict.motivationA)}
              motivationB={getMotivation(conflict.motivationB)}
              isExpanded={expandedIds.has(conflict.id)}
              onToggleExpand={() => toggleExpand(conflict.id)}
              onEdit={(c) => {
                setEditingConflict(c);
                setShowEditor(true);
              }}
              onDelete={handleDelete}
              onResolve={handleResolve}
              readOnly={readOnly}
            />
          ))
        ) : (
          <div className="p-8 bg-slate-900/60 rounded-lg border border-slate-800/50 text-center">
            <Zap size={32} className="mx-auto mb-3 text-slate-600 opacity-50" />
            <p className="font-mono text-sm text-slate-500 mb-1">No conflicts found</p>
            <p className="font-mono text-xs text-slate-600">
              {conflicts.length > 0
                ? 'Try adjusting your filters'
                : 'Add internal conflicts to create tension in your character'}
            </p>
            {!readOnly && conflicts.length === 0 && (
              <button
                onClick={() => {
                  setEditingConflict(null);
                  setShowEditor(true);
                }}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg mx-auto
                           bg-orange-500/20 hover:bg-orange-500/30 text-orange-400
                           font-mono text-xs transition-colors"
              >
                <Plus size={14} />
                <span>Add First Conflict</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConflictMapper;
