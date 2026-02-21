/**
 * MotivationTreeBuilder - Interactive motivation hierarchy visualization
 * Design: Clean Manuscript style with cyan accents
 *
 * Displays and allows editing of character motivation trees with:
 * - Multiple levels (primary, secondary, hidden, unconscious)
 * - Drag-and-drop hierarchy management
 * - Strength indicators
 * - Fear/desire linkages
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Heart,
  Zap,
  Star,
  Moon,
  Grip,
  X,
  Check,
  Save,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  Motivation,
  MotivationTree,
  MotivationLevel,
} from '@/lib/psychology/PsychologyEngine';
import { generateMotivationId } from '@/lib/psychology/PsychologyEngine';

// ============================================================================
// Types
// ============================================================================

export interface MotivationTreeBuilderProps {
  tree: MotivationTree;
  onTreeChange: (tree: MotivationTree) => void;
  readOnly?: boolean;
  compact?: boolean;
}

interface MotivationNodeProps {
  motivation: Motivation;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (motivation: Motivation) => void;
  onDelete: (motivationId: string) => void;
  onAddChild: (parentId: string) => void;
  readOnly?: boolean;
}

interface MotivationEditorProps {
  motivation?: Partial<Motivation>;
  parentId?: string;
  onSave: (motivation: Omit<Motivation, 'id'>) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const LEVEL_CONFIG: Record<MotivationLevel, {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  primary: {
    label: 'Primary',
    icon: <Star size={14} />,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    description: 'Conscious, driving motivations that guide daily decisions',
  },
  secondary: {
    label: 'Secondary',
    icon: <Target size={14} />,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    description: 'Supporting motivations that influence behavior',
  },
  hidden: {
    label: 'Hidden',
    icon: <EyeOff size={14} />,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    description: 'Motivations the character is unaware of or denies',
  },
  unconscious: {
    label: 'Unconscious',
    icon: <Moon size={14} />,
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
    description: 'Deep-seated motivations rooted in past experiences',
  },
};

// ============================================================================
// Subcomponents
// ============================================================================

const StrengthBar: React.FC<{ strength: number; onChange?: (value: number) => void }> = ({
  strength,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            strength > 75 ? 'bg-cyan-400' :
            strength > 50 ? 'bg-blue-400' :
            strength > 25 ? 'bg-amber-400' : 'bg-slate-500'
          )}
          style={{ width: `${strength}%` }}
        />
      </div>
      {onChange ? (
        <input
          type="number"
          min={0}
          max={100}
          value={strength}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-10 bg-transparent border border-slate-700 rounded px-1 text-[10px] font-mono text-slate-400"
        />
      ) : (
        <span className="text-[10px] font-mono text-slate-500 w-6">{strength}</span>
      )}
    </div>
  );
};

const MotivationNode: React.FC<MotivationNodeProps> = ({
  motivation,
  depth,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild,
  readOnly = false,
}) => {
  const hasChildren = motivation.children && motivation.children.length > 0;
  const levelConfig = LEVEL_CONFIG[motivation.level];
  const indentPx = depth * 24;

  return (
    <div className="group">
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg transition-colors',
          'hover:bg-slate-800/40',
          depth === 0 && 'bg-slate-800/20'
        )}
        style={{ paddingLeft: `${indentPx + 12}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className={cn(
            'w-5 h-5 flex items-center justify-center rounded transition-colors',
            hasChildren
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              : 'text-transparent cursor-default'
          )}
        >
          {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>

        {/* Drag handle */}
        {!readOnly && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
            <Grip size={12} className="text-slate-600" />
          </div>
        )}

        {/* Level indicator */}
        <span className={cn(
          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border',
          levelConfig.color
        )}>
          {levelConfig.icon}
        </span>

        {/* Label */}
        <span className="flex-1 font-mono text-sm text-slate-200 truncate">
          {motivation.label}
        </span>

        {/* Awareness indicator */}
        <span title={motivation.isAwareOf ? 'Character is aware' : 'Character is unaware'}>
          {motivation.isAwareOf ? (
            <Eye size={12} className="text-slate-500" />
          ) : (
            <EyeOff size={12} className="text-slate-600" />
          )}
        </span>

        {/* Strength bar */}
        <StrengthBar strength={motivation.strength} />

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAddChild(motivation.id)}
              className="p-1 rounded hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 transition-colors"
              title="Add child motivation"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => onEdit(motivation)}
              className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
              title="Edit motivation"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={() => onDelete(motivation.id)}
              className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
              title="Delete motivation"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Description on hover */}
      {motivation.description && (
        <div
          className="hidden group-hover:block px-3 py-1 text-[10px] font-mono text-slate-500 bg-slate-800/20"
          style={{ paddingLeft: `${indentPx + 48}px` }}
        >
          {motivation.description}
        </div>
      )}
    </div>
  );
};

const MotivationEditor: React.FC<MotivationEditorProps> = ({
  motivation,
  parentId,
  onSave,
  onCancel,
}) => {
  const [label, setLabel] = useState(motivation?.label || '');
  const [description, setDescription] = useState(motivation?.description || '');
  const [level, setLevel] = useState<MotivationLevel>(motivation?.level || 'primary');
  const [strength, setStrength] = useState(motivation?.strength || 50);
  const [isAwareOf, setIsAwareOf] = useState(motivation?.isAwareOf ?? true);
  const [source, setSource] = useState(motivation?.source || '');
  const [relatedFears, setRelatedFears] = useState(motivation?.relatedFears?.join(', ') || '');
  const [relatedDesires, setRelatedDesires] = useState(motivation?.relatedDesires?.join(', ') || '');

  const handleSave = () => {
    if (!label.trim()) return;

    onSave({
      label: label.trim(),
      description: description.trim(),
      level,
      strength,
      isAwareOf,
      source: source.trim() || undefined,
      parentId,
      relatedFears: relatedFears.split(',').map((f) => f.trim()).filter(Boolean),
      relatedDesires: relatedDesires.split(',').map((d) => d.trim()).filter(Boolean),
      triggers: [],
    });
  };

  return (
    <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs uppercase tracking-wide text-slate-300">
          {motivation ? 'edit_motivation' : 'new_motivation'}
        </h4>
        <button
          onClick={onCancel}
          className="p-1 rounded hover:bg-slate-700/50 text-slate-500"
        >
          <X size={14} />
        </button>
      </div>

      {/* Label */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Label *
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Protect family at all costs"
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
          placeholder="Why does this motivation exist? What drives it?"
          rows={2}
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
        />
      </div>

      {/* Level and Strength */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            Level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as MotivationLevel)}
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            {Object.entries(LEVEL_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            Strength
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={strength}
              onChange={(e) => setStrength(parseInt(e.target.value))}
              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-400 w-8">{strength}</span>
          </div>
        </div>
      </div>

      {/* Awareness toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block">
            Character Awareness
          </label>
          <p className="font-mono text-[10px] text-slate-600">
            Is the character aware of this motivation?
          </p>
        </div>
        <button
          onClick={() => setIsAwareOf(!isAwareOf)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors',
            isAwareOf
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
          )}
        >
          {isAwareOf ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{isAwareOf ? 'Aware' : 'Unaware'}</span>
        </button>
      </div>

      {/* Source */}
      <div>
        <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          Source/Origin
        </label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g., Childhood trauma, mentor's influence"
          className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      {/* Related fears and desires */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            Related Fears (comma-separated)
          </label>
          <input
            type="text"
            value={relatedFears}
            onChange={(e) => setRelatedFears(e.target.value)}
            placeholder="Loss, failure, betrayal"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
            Related Desires (comma-separated)
          </label>
          <input
            type="text"
            value={relatedDesires}
            onChange={(e) => setRelatedDesires(e.target.value)}
            placeholder="Safety, love, recognition"
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>
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
          disabled={!label.trim()}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-xs transition-colors',
            label.trim()
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

const MotivationTreeBuilder: React.FC<MotivationTreeBuilderProps> = ({
  tree,
  onTreeChange,
  readOnly = false,
  compact = false,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingMotivation, setEditingMotivation] = useState<Motivation | null>(null);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Toggle expand/collapse
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

  // Delete motivation
  const handleDelete = useCallback((motivationId: string) => {
    const deleteFromArray = (motivations: Motivation[]): Motivation[] => {
      return motivations
        .filter((m) => m.id !== motivationId)
        .map((m) => ({
          ...m,
          children: m.children ? deleteFromArray(m.children) : undefined,
        }));
    };

    const newTree: MotivationTree = {
      ...tree,
      rootMotivations: deleteFromArray(tree.rootMotivations),
    };

    onTreeChange(newTree);
  }, [tree, onTreeChange]);

  // Add or update motivation
  const handleSaveMotivation = useCallback((motivationData: Omit<Motivation, 'id'>) => {
    if (editingMotivation) {
      // Update existing
      const updateInArray = (motivations: Motivation[]): Motivation[] => {
        return motivations.map((m) => {
          if (m.id === editingMotivation.id) {
            return { ...m, ...motivationData };
          }
          if (m.children) {
            return { ...m, children: updateInArray(m.children) };
          }
          return m;
        });
      };

      const newTree: MotivationTree = {
        ...tree,
        rootMotivations: updateInArray(tree.rootMotivations),
      };

      onTreeChange(newTree);
    } else {
      // Add new
      const newMotivation: Motivation = {
        ...motivationData,
        id: generateMotivationId(),
      };

      if (addingToParentId) {
        // Add as child
        const addToParent = (motivations: Motivation[]): Motivation[] => {
          return motivations.map((m) => {
            if (m.id === addingToParentId) {
              return {
                ...m,
                children: [...(m.children || []), newMotivation],
              };
            }
            if (m.children) {
              return { ...m, children: addToParent(m.children) };
            }
            return m;
          });
        };

        const newTree: MotivationTree = {
          ...tree,
          rootMotivations: addToParent(tree.rootMotivations),
        };

        onTreeChange(newTree);
      } else {
        // Add as root
        const newTree: MotivationTree = {
          ...tree,
          rootMotivations: [...tree.rootMotivations, newMotivation],
        };

        onTreeChange(newTree);
      }
    }

    setShowEditor(false);
    setEditingMotivation(null);
    setAddingToParentId(null);
  }, [tree, onTreeChange, editingMotivation, addingToParentId]);

  // Render motivation tree recursively
  const renderMotivations = (motivations: Motivation[], depth: number = 0): React.ReactNode => {
    return motivations.map((motivation) => {
      const isExpanded = expandedIds.has(motivation.id);

      return (
        <React.Fragment key={motivation.id}>
          <MotivationNode
            motivation={motivation}
            depth={depth}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleExpand(motivation.id)}
            onEdit={(m) => {
              setEditingMotivation(m);
              setShowEditor(true);
            }}
            onDelete={handleDelete}
            onAddChild={(parentId) => {
              setAddingToParentId(parentId);
              setShowEditor(true);
            }}
            readOnly={readOnly}
          />
          <AnimatePresence>
            {isExpanded && motivation.children && motivation.children.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderMotivations(motivation.children, depth + 1)}
              </motion.div>
            )}
          </AnimatePresence>
        </React.Fragment>
      );
    });
  };

  // Stats
  const stats = useMemo(() => {
    let total = 0;
    let byLevel: Record<MotivationLevel, number> = {
      primary: 0,
      secondary: 0,
      hidden: 0,
      unconscious: 0,
    };

    const count = (motivations: Motivation[]) => {
      motivations.forEach((m) => {
        total++;
        byLevel[m.level]++;
        if (m.children) count(m.children);
      });
    };

    count(tree.rootMotivations);
    return { total, byLevel };
  }, [tree]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              motivation_tree
            </h3>
            <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
              {stats.total} motivations
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(LEVEL_CONFIG).map(([level, config]) => (
            <div
              key={level}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800/40 rounded"
            >
              <span className={cn('flex items-center', config.color.split(' ')[0])}>
                {config.icon}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {config.label}: {stats.byLevel[level as MotivationLevel]}
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
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              motivation_tree
            </h3>
            <span className="px-2 py-0.5 bg-slate-800/60 rounded text-xs font-mono text-slate-500">
              {stats.total} motivations
            </span>
          </div>

          {!readOnly && !showEditor && (
            <button
              onClick={() => {
                setAddingToParentId(null);
                setShowEditor(true);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded
                         bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400
                         font-mono text-xs transition-colors"
            >
              <Plus size={12} />
              <span>add_root</span>
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(LEVEL_CONFIG).map(([level, config]) => (
            <div
              key={level}
              className="flex items-center gap-2"
              title={config.description}
            >
              <span className={cn(
                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border',
                config.color
              )}>
                {config.icon}
                <span>{config.label}</span>
              </span>
              <span className="font-mono text-xs text-slate-500">
                {stats.byLevel[level as MotivationLevel]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor (when adding/editing) */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <MotivationEditor
              motivation={editingMotivation || undefined}
              parentId={addingToParentId || undefined}
              onSave={handleSaveMotivation}
              onCancel={() => {
                setShowEditor(false);
                setEditingMotivation(null);
                setAddingToParentId(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree */}
      <div className="bg-slate-900/60 rounded-lg border border-slate-800/50 overflow-hidden">
        {tree.rootMotivations.length > 0 ? (
          <div className="py-2">
            {renderMotivations(tree.rootMotivations)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Target size={32} className="mb-3 opacity-50" />
            <p className="font-mono text-sm mb-1">No motivations defined</p>
            <p className="font-mono text-xs text-slate-600">
              Add motivations to build the character's psychology
            </p>
            {!readOnly && (
              <button
                onClick={() => {
                  setAddingToParentId(null);
                  setShowEditor(true);
                }}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400
                           font-mono text-xs transition-colors"
              >
                <Plus size={14} />
                <span>Add First Motivation</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={12} className="text-slate-500" />
          <span className="font-mono text-[10px] text-slate-500 uppercase">Level Guide</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          {Object.entries(LEVEL_CONFIG).map(([level, config]) => (
            <div key={level} className="flex items-start gap-2">
              <span className={cn('flex-shrink-0 mt-0.5', config.color.split(' ')[0])}>
                {config.icon}
              </span>
              <div>
                <span className="text-slate-400">{config.label}:</span>
                <span className="text-slate-600 ml-1">{config.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MotivationTreeBuilder;
