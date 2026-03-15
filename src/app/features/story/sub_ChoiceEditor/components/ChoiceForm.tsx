/**
 * ChoiceForm Component
 * Form for creating/editing a choice
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import { useState, useCallback } from 'react';
import { Scene } from '@/app/types/Scene';
import { cn } from '@/lib/utils';
import { TYPOGRAPHY } from '@/workspace/theme/tokens';
import { Check, X } from 'lucide-react';

interface ChoiceFormProps {
  availableTargets: Scene[];
  initialLabel?: string;
  initialTargetId?: string | null;
  onSubmit: (label: string, targetSceneId: string | null) => void;
  onCancel: () => void;
}

export function ChoiceForm({
  availableTargets,
  initialLabel = '',
  initialTargetId = null,
  onSubmit,
  onCancel,
}: ChoiceFormProps) {
  const [label, setLabel] = useState(initialLabel);
  const [targetSceneId, setTargetSceneId] = useState<string | null>(initialTargetId);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!label.trim()) return;
      onSubmit(label.trim(), targetSceneId);
    },
    [label, targetSceneId, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-lg space-y-6 backdrop-blur-sm"
    >
      {/* Label Input */}
      <div>
        <label className={cn('block mb-1.5 uppercase tracking-wide', TYPOGRAPHY.h3, 'font-mono')}>
          choice_label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter choice text..."
          autoFocus
          className={cn(
            'w-full px-3 py-2 rounded-md',
            'bg-slate-900/80 border border-slate-600/50',
            'text-slate-100 placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50'
          )}
        />
      </div>

      {/* Target Scene Select */}
      <div>
        <label className={cn('block mb-1.5 uppercase tracking-wide', TYPOGRAPHY.h3, 'font-mono')}>
          target_scene
        </label>
        <select
          value={targetSceneId || ''}
          onChange={(e) => setTargetSceneId(e.target.value || null)}
          className={cn(
            'w-full px-3 py-2 rounded-md',
            'bg-slate-900/80 border border-slate-600/50',
            'text-slate-100',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50'
          )}
        >
          <option value="">-- Select target scene --</option>
          {availableTargets.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name || 'Untitled scene'}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-slate-400 font-mono">
          // leave empty to set target later
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono font-medium',
            'bg-slate-700/80 hover:bg-slate-600 text-slate-300',
            'border border-slate-600/50 transition-colors'
          )}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={!label.trim()}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono font-medium uppercase tracking-wide',
            'bg-cyan-600 hover:bg-cyan-500 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors shadow-sm'
          )}
        >
          <Check className="w-4 h-4" />
          Add
        </button>
      </div>
    </form>
  );
}
