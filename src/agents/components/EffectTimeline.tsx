'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Clock, Bot, Sparkles, MessageSquare, Lightbulb, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useAgentStore } from '../store/agentStore';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import type { EffectRecord, EffectTriggerSource } from '../types';
import type { PanelDirective, WorkspaceLayout, WorkspacePanelType } from '@/workspace/types';

function triggerIcon(trigger: EffectTriggerSource) {
  switch (trigger.kind) {
    case 'tool_call': return <Bot className="w-3.5 h-3.5 text-cyan-400" />;
    case 'muse_insight': return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    case 'user_message': return <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />;
    case 'suggestion_accept': return <Lightbulb className="w-3.5 h-3.5 text-violet-400" />;
    case 'observer_snapshot': return <Eye className="w-3.5 h-3.5 text-slate-400" />;
  }
}

function triggerLabel(trigger: EffectTriggerSource): string {
  switch (trigger.kind) {
    case 'tool_call': return `Tool: ${trigger.toolName}`;
    case 'muse_insight': return `Muse: ${trigger.category}`;
    case 'user_message': return `Message: "${trigger.text.slice(0, 30)}${trigger.text.length > 30 ? '...' : ''}"`;
    case 'suggestion_accept': return `Suggestion accepted`;
    case 'observer_snapshot': return 'Observer';
  }
}

function panelDiff(effect: EffectRecord): { added: string[]; removed: string[] } {
  const beforeTypes = new Set(effect.before.panels.map((p) => p.type));
  const afterTypes = new Set(effect.after.panels.map((p) => p.type));
  const added = [...afterTypes].filter((t) => !beforeTypes.has(t));
  const removed = [...beforeTypes].filter((t) => !afterTypes.has(t));
  return { added, removed };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return formatTime(ts);
}

interface EffectTimelineProps {
  maxVisible?: number;
  className?: string;
}

export function EffectTimeline({ maxVisible = 5, className }: EffectTimelineProps) {
  const effectStack = useAgentStore((s) => s.effectStack);
  const undoLastEffect = useAgentStore((s) => s.undoLastEffect);
  const [expanded, setExpanded] = React.useState(false);

  const handleUndo = useCallback(() => {
    const effect = undoLastEffect();
    if (!effect) return;

    // Restore the workspace to the "before" state of the undone effect
    const store = useWorkspaceStore.getState();
    const directives: PanelDirective[] = effect.before.panels.map((p) => ({
      type: p.type as WorkspacePanelType,
      role: p.role as PanelDirective['role'],
      density: p.density as PanelDirective['density'],
    }));
    store.replaceAllPanels(directives, effect.before.layout as WorkspaceLayout);
  }, [undoLastEffect]);

  if (effectStack.length === 0) return null;

  const visibleEffects = expanded ? effectStack : effectStack.slice(0, maxVisible);
  const hasMore = effectStack.length > maxVisible;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Header with undo button */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Effect History ({effectStack.length})
        </span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded px-2 py-0.5 transition-colors"
          title="Undo last advisor action"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </button>
      </div>

      {/* Timeline entries */}
      <AnimatePresence mode="popLayout">
        {visibleEffects.map((effect, i) => (
          <EffectEntry key={effect.id} effect={effect} isLatest={i === 0} />
        ))}
      </AnimatePresence>

      {/* Show more/less toggle */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-400 px-1 py-0.5 transition-colors w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {effectStack.length - maxVisible} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

function EffectEntry({ effect, isLatest }: { effect: EffectRecord; isLatest: boolean }) {
  const { added, removed } = panelDiff(effect);
  const layoutChanged = effect.before.layout !== effect.after.layout;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.15 }}
      className={cn(
        'border rounded-lg px-2.5 py-1.5 space-y-1',
        isLatest
          ? 'border-cyan-500/25 bg-cyan-500/5'
          : 'border-slate-700/50 bg-slate-800/30'
      )}
    >
      {/* Trigger row */}
      <div className="flex items-center gap-1.5">
        {triggerIcon(effect.trigger)}
        <span className="text-xs text-slate-300 flex-1 truncate">
          {triggerLabel(effect.trigger)}
        </span>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelative(effect.timestamp)}
        </span>
      </div>

      {/* Reasoning (if present) */}
      {effect.reasoning && (
        <p className="text-xs text-slate-400 leading-snug line-clamp-2 italic">
          {effect.reasoning}
        </p>
      )}

      {/* Panel diff */}
      <div className="flex flex-wrap gap-1">
        {added.map((t) => (
          <span key={`+${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">
            +{t}
          </span>
        ))}
        {removed.map((t) => (
          <span key={`-${t}`} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-mono">
            -{t}
          </span>
        ))}
        {layoutChanged && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 font-mono">
            {effect.before.layout} &rarr; {effect.after.layout}
          </span>
        )}
        {added.length === 0 && removed.length === 0 && !layoutChanged && (
          <span className="text-[10px] text-slate-500">props/density changed</span>
        )}
      </div>
    </motion.div>
  );
}

/** Hook to get attribution for why a specific panel appeared */
export function useEffectAttribution(panelType: string): EffectRecord | undefined {
  return useAgentStore((s) => s.getEffectForPanel(panelType));
}
