'use client';

import { useState, useMemo, useCallback } from 'react';
import { GripVertical, Play, Loader2, Library } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  DRUM_MACHINES, getSampleUrl, groupByCategory,
  CATEGORY_ORDER, CATEGORY_LABELS,
  type DrumMachine, type DrumMachineSample,
} from '../../data/drumCatalog';

interface SampleBrowserProps {
  onPreviewSample: (url: string) => void;
}

function SampleRow({
  sample,
  machineId,
  onPreview,
  isLoadingPreview,
}: {
  sample: DrumMachineSample;
  machineId: string;
  onPreview: (url: string) => void;
  isLoadingPreview: boolean;
}) {
  const url = getSampleUrl(machineId, sample.path);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/x-drum-sample',
      JSON.stringify({
        machineId,
        path: sample.path,
        name: sample.name,
        category: sample.category,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  }, [machineId, sample]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800/30 transition-all cursor-grab active:cursor-grabbing group/row"
    >
      <GripVertical className="w-3 h-3 text-slate-700 group-hover/row:text-slate-400 shrink-0 transition-colors" />
      <span className="flex-1 text-[11px] text-slate-300 truncate">{sample.name}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(url); }}
        disabled={isLoadingPreview}
        className="opacity-0 group-hover/row:opacity-100 text-slate-500 hover:text-amber-400 transition-all shrink-0 p-0.5 rounded hover:bg-amber-500/10"
        title="Preview"
      >
        {isLoadingPreview ? (
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
        ) : (
          <Play className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}

export default function SampleBrowser({ onPreviewSample }: SampleBrowserProps) {
  const [selectedKit, setSelectedKit] = useState<DrumMachine>(DRUM_MACHINES[0]!);
  const [previewingUrl, setPreviewingUrl] = useState<string | null>(null);

  const grouped = useMemo(
    () => groupByCategory(selectedKit.samples),
    [selectedKit]
  );

  // Sort categories by defined order
  const sortedCategories = useMemo(() => {
    const cats = Array.from(grouped.keys());
    return cats.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [grouped]);

  const handlePreview = useCallback((url: string) => {
    setPreviewingUrl(url);
    onPreviewSample(url);
    // Reset loading state after a short delay (actual preview is fire-and-forget)
    setTimeout(() => setPreviewingUrl(null), 800);
  }, [onPreviewSample]);

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)' }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-3 py-2 border-b border-emerald-500/10 relative overflow-hidden"
      >
        <div
          className="absolute -top-6 -right-6 w-20 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)' }}
        />
        <div className="flex items-center gap-2 relative">
          <div
            className="p-1 rounded border border-emerald-500/25"
            style={{ background: 'rgba(16, 185, 129, 0.08)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.08)' }}
          >
            <Library className="w-3 h-3 text-emerald-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 tracking-wide">Sample Browser</span>
        </div>
      </div>

      {/* Kit selector */}
      <div className="shrink-0 px-2 py-2 border-b border-slate-800/15">
        <select
          value={selectedKit.id}
          onChange={(e) => {
            const kit = DRUM_MACHINES.find((m) => m.id === e.target.value);
            if (kit) setSelectedKit(kit);
          }}
          className="w-full px-2 py-1 bg-slate-950/60 border border-slate-700/30 rounded-md text-xs text-slate-200 backdrop-blur-sm
            focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all"
        >
          {DRUM_MACHINES.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.samples.length})</option>
          ))}
        </select>
      </div>

      {/* Sample list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {sortedCategories.map((category) => {
          const samples = grouped.get(category)!;
          const label = CATEGORY_LABELS[category] ?? category;
          return (
            <div key={category} className="mb-1">
              {/* Category header */}
              <div className="px-2 py-1 relative">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {label}
                </span>
                <div
                  className="absolute bottom-0 left-2 right-2 h-px"
                  style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), transparent)' }}
                />
              </div>
              {/* Sample rows */}
              {samples.map((sample) => (
                <SampleRow
                  key={sample.path}
                  sample={sample}
                  machineId={selectedKit.id}
                  onPreview={handlePreview}
                  isLoadingPreview={previewingUrl === getSampleUrl(selectedKit.id, sample.path)}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 px-3 py-1.5 relative">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.15), transparent)' }}
        />
        <p className="text-[9px] text-slate-600">
          Drag samples to instrument rack. CC0 license.
        </p>
      </div>
    </div>
  );
}
