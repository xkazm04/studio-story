/**
 * ContextPinManager — CRUD interface for persistent context pins (story rules).
 *
 * Writers pin context elements (world rules, character constraints, tone directives,
 * plot boundaries) that auto-inject into every AI generation without manual re-selection.
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  Plus,
  Trash2,
  Globe,
  User,
  Theater,
  Shield,
  Palette,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
  Check,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY, SEMANTIC_COLORS, FM_VARIANTS, FM_TRANSITION } from '@/workspace/theme/tokens';
import { Button } from '@/app/components/UI/Button';
import { useContextPins, type CreatePinInput, type UpdatePinInput } from '@/app/hooks/useContextPins';
import type {
  ContextPin,
  ContextPinType,
  ContextPinScope,
} from '@/app/types/ContextPin';

// ============================================================================
// Constants
// ============================================================================

const PIN_TYPE_CONFIG: Record<ContextPinType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  world_rule: {
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
  },
  character_constraint: {
    icon: <User className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
  },
  tone_directive: {
    icon: <Palette className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/15',
  },
  plot_boundary: {
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
  },
};

const TYPE_LABELS: Record<ContextPinType, string> = {
  world_rule: 'World Rule',
  character_constraint: 'Character Constraint',
  tone_directive: 'Tone Directive',
  plot_boundary: 'Plot Boundary',
};

const SCOPE_LABELS: Record<ContextPinScope, string> = {
  project: 'Entire Project',
  act: 'Specific Act',
  character: 'Specific Character',
};

const SCOPE_ICONS: Record<ContextPinScope, React.ReactNode> = {
  project: <Globe className="w-3 h-3" />,
  act: <Theater className="w-3 h-3" />,
  character: <User className="w-3 h-3" />,
};

// ============================================================================
// Types
// ============================================================================

interface ContextPinManagerProps {
  projectId: string | undefined;
  className?: string;
}

interface PinFormData {
  pin_type: ContextPinType;
  label: string;
  content: string;
  scope: ContextPinScope;
  scope_target_id: string | null;
}

const DEFAULT_FORM: PinFormData = {
  pin_type: 'world_rule',
  label: '',
  content: '',
  scope: 'project',
  scope_target_id: null,
};

// ============================================================================
// Sub-Components
// ============================================================================

function PinCard({
  pin,
  onToggle,
  onDelete,
  onUpdate,
}: {
  pin: ContextPin;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<PinFormData>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(pin.label);
  const [editContent, setEditContent] = useState(pin.content);
  const config = PIN_TYPE_CONFIG[pin.pin_type];

  const handleSave = () => {
    onUpdate({ label: editLabel, content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(pin.label);
    setEditContent(pin.content);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      {...FM_VARIANTS.fadeIn}
      transition={FM_TRANSITION.normal}
      className={cn(
        'rounded-lg border transition-all',
        pin.enabled
          ? `border-slate-700 ${config.bgColor}`
          : 'border-slate-800 bg-slate-900/30 opacity-60'
      )}
    >
      <div className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-start gap-2">
          {/* Toggle */}
          <button
            onClick={onToggle}
            className="shrink-0 mt-0.5"
            title={pin.enabled ? 'Disable pin' : 'Enable pin'}
          >
            {pin.enabled ? (
              <ToggleRight className="w-5 h-5 text-emerald-400" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {/* Type badge */}
          <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-xs shrink-0', config.bgColor, config.color)}>
            {config.icon}
            {TYPE_LABELS[pin.pin_type]}
          </span>

          {/* Scope badge */}
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-slate-700/50 text-slate-400 shrink-0">
            {SCOPE_ICONS[pin.scope]}
            {SCOPE_LABELS[pin.scope]}
          </span>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500"
              placeholder="Label..."
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full px-2 py-1.5 text-sm rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-purple-500 resize-y"
              placeholder="Rule content..."
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" /> Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="h-7 text-xs bg-purple-600 hover:bg-purple-700">
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h4 className={cn(TYPOGRAPHY.h3, 'pl-7')}>{pin.label}</h4>
            <p className="text-sm text-slate-400 pl-7">{pin.content}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ContextPinManager({ projectId, className }: ContextPinManagerProps) {
  const { pins, enabledPins, isLoading, createPin, updatePin, deletePin, togglePin } = useContextPins(projectId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<PinFormData>(DEFAULT_FORM);
  const [filterType, setFilterType] = useState<ContextPinType | 'all'>('all');

  const handleCreate = useCallback(async () => {
    if (!projectId || !form.label.trim() || !form.content.trim()) return;

    createPin.mutate({
      project_id: projectId,
      pin_type: form.pin_type,
      label: form.label.trim(),
      content: form.content.trim(),
      scope: form.scope,
      scope_target_id: form.scope_target_id,
      sort_order: pins.length,
    });

    setForm(DEFAULT_FORM);
    setShowCreateForm(false);
  }, [projectId, form, pins.length, createPin]);

  const handleUpdate = useCallback((pin: ContextPin, updates: Partial<PinFormData>) => {
    const body: UpdatePinInput = { id: pin.id };
    if (updates.label !== undefined) body.label = updates.label;
    if (updates.content !== undefined) body.content = updates.content;
    if (updates.pin_type !== undefined) body.pin_type = updates.pin_type;
    if (updates.scope !== undefined) body.scope = updates.scope;
    if (updates.scope_target_id !== undefined) body.scope_target_id = updates.scope_target_id;
    updatePin.mutate(body);
  }, [updatePin]);

  const filteredPins = filterType === 'all'
    ? pins
    : pins.filter((p) => p.pin_type === filterType);

  if (!projectId) {
    return (
      <div className={cn('flex items-center justify-center h-full text-slate-400 text-sm', className)}>
        Select a project to manage context pins
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-slate-800 space-y-3">
        {/* Title + stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-emerald-400" />
            <span className={TYPOGRAPHY.h3}>Story Rules</span>
            <span className="text-xs text-slate-400">
              {enabledPins.length} active / {pins.length} total
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Rule
          </Button>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors',
              filterType === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            All ({pins.length})
          </button>
          {(Object.keys(PIN_TYPE_CONFIG) as ContextPinType[]).map((type) => {
            const count = pins.filter((p) => p.pin_type === type).length;
            const config = PIN_TYPE_CONFIG[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                  filterType === type
                    ? `${config.bgColor} ${config.color}`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {config.icon}
                {TYPE_LABELS[type]}
                {count > 0 && <span className="text-[10px]">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              {...FM_VARIANTS.collapse}
              transition={FM_TRANSITION.slow}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* Pin type */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Type</label>
                    <select
                      value={form.pin_type}
                      onChange={(e) => setForm((f) => ({ ...f, pin_type: e.target.value as ContextPinType }))}
                      className="w-full px-2 py-1.5 text-sm rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {(Object.keys(TYPE_LABELS) as ContextPinType[]).map((t) => (
                        <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  {/* Scope */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Scope</label>
                    <select
                      value={form.scope}
                      onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as ContextPinScope }))}
                      className="w-full px-2 py-1.5 text-sm rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {(Object.keys(SCOPE_LABELS) as ContextPinScope[]).map((s) => (
                        <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Label */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Label</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full px-2 py-1.5 text-sm rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="e.g., Magic has a cost"
                  />
                </div>
                {/* Content */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Rule Content</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={3}
                    className="w-full px-2 py-1.5 text-sm rounded bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-emerald-500 resize-y"
                    placeholder="e.g., Every use of magic in this world requires an equivalent physical sacrifice. The greater the spell, the greater the toll on the caster's body."
                  />
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowCreateForm(false); setForm(DEFAULT_FORM); }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreate}
                    disabled={!form.label.trim() || !form.content.trim() || createPin.isPending}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createPin.isPending ? 'Creating...' : 'Create Pin'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pins List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-slate-400">Loading pins...</div>
        ) : filteredPins.length === 0 ? (
          <div className="text-center py-8">
            <Pin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">
              {pins.length === 0
                ? 'No story rules yet. Add your first pin to ensure AI consistency.'
                : 'No pins match the current filter.'}
            </p>
            {pins.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Examples: &ldquo;This character never lies&rdquo;, &ldquo;Magic requires sacrifice&rdquo;, &ldquo;Maintain noir tone&rdquo;
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredPins.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                onToggle={() => togglePin.mutate(pin)}
                onDelete={() => deletePin.mutate(pin.id)}
                onUpdate={(updates) => handleUpdate(pin, updates)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer — active pin summary */}
      {enabledPins.length > 0 && (
        <div className="shrink-0 px-4 py-2 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">
              {enabledPins.length} rule{enabledPins.length !== 1 ? 's' : ''} active
            </span>
            <span className="text-slate-500">
              — auto-injected into every AI generation
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContextPinManager;
