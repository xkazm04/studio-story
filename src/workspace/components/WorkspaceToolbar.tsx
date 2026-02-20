'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useWorkspaceStore } from '../store/workspaceStore';
import { LAYOUT_TEMPLATES, LAYOUT_ORDER, getLayoutFitnesses } from '../engine/layoutEngine';
import { PANEL_REGISTRY } from '../engine/panelRegistry';
import type { WorkspacePanelType, WorkspaceLayout } from '../types';

function LayoutIcon({ variant, size = 16 }: { variant: WorkspaceLayout; size?: number }) {
  const s = size;
  const g = 1;
  const r = 1;
  const common = { rx: r, className: 'fill-current' } as const;

  switch (variant) {
    case 'single':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s} height={s} {...common} /></svg>);
    case 'split-2':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.58 - g / 2} height={s} {...common} /><rect x={s * 0.58 + g / 2} y={0} width={s * 0.42 - g / 2} height={s} {...common} /></svg>);
    case 'split-3':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.58 - g / 2} height={s} {...common} /><rect x={s * 0.58 + g / 2} y={0} width={s * 0.42 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={s * 0.58 + g / 2} y={s * 0.5 + g / 2} width={s * 0.42 - g / 2} height={s * 0.5 - g / 2} {...common} /></svg>);
    case 'grid-4':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={s * 0.5 + g / 2} y={0} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={0} y={s * 0.5 + g / 2} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /><rect x={s * 0.5 + g / 2} y={s * 0.5 + g / 2} width={s * 0.5 - g / 2} height={s * 0.5 - g / 2} {...common} /></svg>);
    case 'primary-sidebar':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.7 - g / 2} height={s} {...common} /><rect x={s * 0.7 + g / 2} y={0} width={s * 0.3 - g / 2} height={s} {...common} /></svg>);
    case 'triptych':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s * 0.25 - g / 2} height={s} {...common} /><rect x={s * 0.25 + g / 2} y={0} width={s * 0.5 - g} height={s} {...common} /><rect x={s * 0.75 + g / 2} y={0} width={s * 0.25 - g / 2} height={s} {...common} /></svg>);
    case 'studio':
      return (<svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={0} y={0} width={s} height={s * 0.15} {...common} /><rect x={0} y={s * 0.15 + g} width={s * 0.22} height={s * 0.63 - g} {...common} /><rect x={s * 0.22 + g} y={s * 0.15 + g} width={s * 0.56 - g * 2} height={s * 0.63 - g} {...common} /><rect x={s * 0.78 + g} y={s * 0.15 + g} width={s * 0.22 - g} height={s * 0.63 - g} {...common} /><rect x={0} y={s * 0.78 + g} width={s} height={s * 0.22 - g} {...common} /></svg>);
  }
}

export default function WorkspaceToolbar() {
  const layout = useWorkspaceStore((s) => s.layout);
  const panels = useWorkspaceStore((s) => s.panels);
  const setLayout = useWorkspaceStore((s) => s.setLayout);
  const showPanels = useWorkspaceStore((s) => s.showPanels);
  const clearPanels = useWorkspaceStore((s) => s.clearPanels);

  const existingTypes = new Set(panels.map((p) => p.type));

  const availablePanels = Object.values(PANEL_REGISTRY).filter(
    (entry) => entry.type !== 'empty-welcome' && !existingTypes.has(entry.type)
  );

  const handleAddPanel = (type: WorkspacePanelType) => {
    showPanels([{ type, role: PANEL_REGISTRY[type].defaultRole }]);
  };

  if (panels.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 border-b border-slate-800/40 bg-slate-950/60">
      {(() => {
        const fitnesses = getLayoutFitnesses(panels);
        return (
          <div className="flex items-center gap-0.5 bg-slate-900/50 rounded-md border border-slate-800/40 p-0.5">
            {LAYOUT_ORDER.map((variant) => {
              const tmpl = LAYOUT_TEMPLATES[variant];
              const isActive = layout === variant;
              const fitness = fitnesses[variant];
              const isGoodFit = fitness >= 50;
              const isPoorFit = fitness < 0;
              return (
                <button
                  key={variant}
                  onClick={() => setLayout(variant)}
                  title={`${tmpl.label}${isPoorFit ? ' (panels may not fit)' : ''}`}
                  className={cn(
                    'p-1 rounded transition-colors',
                    isActive
                      ? 'bg-slate-700/60 text-slate-200'
                      : isGoodFit
                        ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                        : isPoorFit
                          ? 'text-slate-800 opacity-40'
                          : 'text-slate-600 hover:text-slate-500'
                  )}
                >
                  <LayoutIcon variant={variant} size={14} />
                </button>
              );
            })}
          </div>
        );
      })()}

      <div className="flex-1" />

      <button
        onClick={clearPanels}
        className={cn(
          'flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium',
          'text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors'
        )}
        title="Clear workspace"
      >
        <X className="w-3 h-3" />
        <span>Clear</span>
      </button>

      <div className="flex-1" />

      {availablePanels.length > 0 && (
        <div className="relative group">
          <button
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium',
              'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors'
            )}
          >
            <Plus className="w-3 h-3" />
            <span>Add Panel</span>
          </button>

          <div className="absolute right-0 top-full mt-1 py-1 bg-slate-900 border border-slate-800/60 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[160px]">
            {availablePanels.map((entry) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.type}
                  onClick={() => handleAddPanel(entry.type)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] text-slate-300 hover:bg-slate-800/50 transition-colors"
                >
                  <Icon className="w-3 h-3 text-slate-500" />
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
