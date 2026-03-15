'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Save } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import {
  PanelEmptyState,
  PanelErrorState,
  PanelSaveStateBadge,
  PanelSectionTitle,
  PanelSkeletonList,
} from '../shared/PanelPrimitives';
import type { BasePrimitiveProps, DetailSection, DetailField } from './types';
import { SPACING } from '@/workspace/theme/tokens';

interface DetailViewProps extends BasePrimitiveProps {
  data: Record<string, unknown> | null;
  sections: DetailSection[];
  onSave?: (updates: Record<string, unknown>) => Promise<void>;
}

function formatValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

export default function DetailView({
  title,
  icon,
  headerAccent,
  onClose,
  actions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  data,
  sections,
  onSave,
  density,
}: DetailViewProps) {
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');

  // Reset edits when data changes
  useEffect(() => {
    setEdits({});
    setSaveState('idle');
  }, [data]);

  // Auto-clear saved/error state
  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const timer = setTimeout(() => setSaveState('idle'), 1800);
    return () => clearTimeout(timer);
  }, [saveState]);

  const isDirty = Object.keys(edits).length > 0;

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      setEdits((prev) => ({ ...prev, [key]: value }));
      setSaveState('dirty');
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!onSave || !isDirty) return;
    setSaveState('saving');
    try {
      await onSave(edits);
      setEdits({});
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [onSave, edits, isDirty]);

  const resolvedValue = (key: string): unknown => {
    if (key in edits) return edits[key];
    return data?.[key];
  };

  return (
    <PanelFrame
      title={title}
      icon={icon}
      headerAccent={headerAccent}
      onClose={onClose}
      density={density}
      actions={
        <div className="flex items-center gap-1">
          {actions}
          <PanelSaveStateBadge state={isDirty ? 'dirty' : saveState} />
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === 'saving' || !isDirty}
              className="rounded px-2 py-0.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/12 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              title="Save changes"
            >
              <span className="inline-flex items-center gap-1">
                <Save className="h-3 w-3" />
                Save
              </span>
            </button>
          )}
        </div>
      }
    >
      {isLoading ? (
        <PanelSkeletonList rows={6} />
      ) : isError ? (
        <PanelErrorState message={errorMessage} onRetry={onRetry} />
      ) : !data ? (
        <PanelEmptyState
          icon={emptyIcon}
          title={emptyTitle ?? 'No data'}
          description={emptyDescription}
        />
      ) : (
        <div className="space-y-2 @xs:space-y-3 p-2 @xs:p-3">
          {sections.map((section, sectionIndex) => (
            <div
              key={section.title}
              className={cn(
                sectionIndex > 0 && 'border-t border-slate-800/50 pt-2',
              )}
            >
              <PanelSectionTitle
                title={section.title}
                subtitle={section.subtitle}
                className="mb-1.5"
              />
              <div className="space-y-1.5">
                {section.fields.map((field) => (
                  <FieldRow
                    key={field.key}
                    field={field}
                    value={resolvedValue(field.key)}
                    onChange={handleFieldChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: DetailField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  const displayValue = formatValue(value);

  if (field.editable && field.type === 'textarea') {
    return (
      <div>
        <label className="mb-1 block text-sm text-slate-400">{field.label}</label>
        <textarea
          value={displayValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={3}
          className="w-full rounded border border-slate-800/50 bg-slate-900/60 px-2 py-1.5 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500/40 resize-y"
        />
      </div>
    );
  }

  if (field.editable && field.type === 'text') {
    return (
      <div>
        <label className="mb-1 block text-sm text-slate-400">{field.label}</label>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded border border-slate-800/50 bg-slate-900/60 px-2 py-1.5 text-sm text-slate-200 outline-none transition-colors focus:border-cyan-500/40"
        />
      </div>
    );
  }

  // Readonly / date display
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{field.label}</span>
      <span className="text-sm text-slate-400 font-mono">
        {field.type === 'date' && displayValue
          ? new Date(displayValue).toLocaleDateString()
          : displayValue || 'N/A'}
      </span>
    </div>
  );
}
