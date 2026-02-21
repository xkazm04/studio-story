'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Film, Type, Settings2, Quote, AlignLeft, ListChecks,
  Trash2, Plus, Users,
} from 'lucide-react';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { beatApi } from '@/app/hooks/integration/useBeats';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/app/lib/utils';
import { useScriptContextStore } from '../../store/scriptContextStore';
import PanelFrame from '../shared/PanelFrame';
import { PanelEmptyState, PanelSaveStateBadge } from '../shared/PanelPrimitives';
import type { LucideIcon } from 'lucide-react';
import type { Character } from '@/app/types/Character';
import type { Beat } from '@/app/types/Beat';

// ─── Types ──────────────────────────────────────────────────

type BlockType = 'scene' | 'action' | 'dialogue' | 'direction' | 'content' | 'beat';

interface EditorBlock {
  id: string;
  type: BlockType;
  content: string;
  speaker?: string;    // dialogue blocks — character name
  beatRef?: string;    // beat blocks — beat name
}

// ─── ID Generator ───────────────────────────────────────────

let _c = 0;
function genId(): string {
  return `blk-${Date.now()}-${++_c}`;
}

// ─── Parse / Serialize ──────────────────────────────────────

const BLOCK_RE = /^@(scene|action|dialogue|direction|content|beat)(?:\[([^\]]*)\])?\s*$/m;

// Legacy compat: convert old @character + @dialogue pairs to @dialogue[NAME]
function normalizeLegacy(raw: string): string {
  return raw.replace(
    /@character\s*\n([^\n]+)\n\n@dialogue\s*\n/g,
    (_, name: string) => `@dialogue[${name.trim()}]\n`,
  );
}

function parseBlocks(raw: string): EditorBlock[] {
  if (!raw || !raw.trim()) return [];

  // Backward compat: no @markers → single action block
  if (!BLOCK_RE.test(raw)) {
    return [{ id: genId(), type: 'action', content: raw.trim() }];
  }

  const normalized = normalizeLegacy(raw);
  const segments = normalized.split(BLOCK_RE);
  const blocks: EditorBlock[] = [];

  // segments[0] = text before first marker (preamble)
  const preamble = segments[0].trim();
  if (preamble) {
    blocks.push({ id: genId(), type: 'action', content: preamble });
  }

  // Triplets: segments[i]=type, segments[i+1]=bracketParam, segments[i+2]=content
  for (let i = 1; i < segments.length; i += 3) {
    const type = segments[i] as BlockType;
    const bracketParam = (segments[i + 1] || '').trim();
    const content = (segments[i + 2] || '').trim();

    const block: EditorBlock = { id: genId(), type, content };

    if (type === 'dialogue' && bracketParam) {
      block.speaker = bracketParam;
    }
    if (type === 'beat' && bracketParam) {
      block.beatRef = bracketParam;
    }

    blocks.push(block);
  }

  return blocks;
}

function serializeBlocks(blocks: EditorBlock[]): string {
  return blocks.map((b) => {
    if (b.type === 'dialogue' && b.speaker) {
      return `@dialogue[${b.speaker}]\n${b.content}`;
    }
    if (b.type === 'beat' && b.beatRef) {
      return `@beat[${b.beatRef}]\n${b.content}`;
    }
    return `@${b.type}\n${b.content}`;
  }).join('\n\n');
}

// ─── Block Config ───────────────────────────────────────────

interface BlockConfig {
  label: string;
  icon: LucideIcon;
  borderColor: string;
  bgTint: string;
  textStyle: string;
  placeholder: string;
  menuColor: string;
}

const BLOCK_CONFIG: Record<BlockType, BlockConfig> = {
  scene: {
    label: 'SCENE',
    icon: Film,
    borderColor: 'border-l-amber-500/40',
    bgTint: 'bg-amber-500/[0.04]',
    textStyle: 'font-semibold uppercase tracking-wider text-amber-300 text-[13px]',
    placeholder: 'INT. LOCATION - TIME',
    menuColor: 'text-amber-400',
  },
  action: {
    label: 'ACTION',
    icon: Type,
    borderColor: 'border-l-slate-600/30',
    bgTint: 'bg-transparent',
    textStyle: 'text-slate-300 leading-relaxed text-[13px]',
    placeholder: 'Describe the action...',
    menuColor: 'text-slate-400',
  },
  dialogue: {
    label: 'DIALOGUE',
    icon: Quote,
    borderColor: 'border-l-violet-500/40',
    bgTint: 'bg-violet-500/[0.04]',
    textStyle: 'text-slate-200 text-[13px]',
    placeholder: 'Dialogue text...',
    menuColor: 'text-violet-400',
  },
  direction: {
    label: 'DIRECTION',
    icon: Settings2,
    borderColor: 'border-l-rose-500/40',
    bgTint: 'bg-rose-500/[0.04]',
    textStyle: 'italic text-rose-300/80 text-[13px]',
    placeholder: 'Stage direction...',
    menuColor: 'text-rose-400',
  },
  content: {
    label: 'CONTENT',
    icon: AlignLeft,
    borderColor: 'border-l-emerald-500/40',
    bgTint: 'bg-emerald-500/[0.04]',
    textStyle: 'text-slate-300 leading-relaxed text-[13px]',
    placeholder: 'Narrative content...',
    menuColor: 'text-emerald-400',
  },
  beat: {
    label: 'BEAT',
    icon: ListChecks,
    borderColor: 'border-l-indigo-500/40',
    bgTint: 'bg-indigo-500/[0.04]',
    textStyle: 'italic text-indigo-300/80 text-[13px]',
    placeholder: 'Beat description or notes...',
    menuColor: 'text-indigo-400',
  },
};

const MENU_ITEMS: { type: BlockType; label: string; icon: LucideIcon; color: string }[] = [
  { type: 'scene', label: 'Scene Header', icon: Film, color: 'text-amber-400' },
  { type: 'action', label: 'Action', icon: Type, color: 'text-slate-400' },
  { type: 'dialogue', label: 'Dialogue', icon: Quote, color: 'text-violet-400' },
  { type: 'direction', label: 'Direction', icon: Settings2, color: 'text-rose-400' },
  { type: 'content', label: 'Content', icon: AlignLeft, color: 'text-emerald-400' },
  { type: 'beat', label: 'Beat', icon: ListChecks, color: 'text-indigo-400' },
];

// ─── Speaker Select ─────────────────────────────────────────

interface SpeakerSelectProps {
  speaker: string;
  characters: Character[];
  onChange: (name: string) => void;
  selectRef?: React.Ref<HTMLSelectElement>;
}

function SpeakerSelect({ speaker, characters, onChange, selectRef }: SpeakerSelectProps) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <Users className="w-3 h-3 text-violet-400/60 shrink-0" />
      <select
        ref={selectRef}
        value={speaker}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'bg-slate-900/60 border border-slate-800/50 rounded px-1.5 py-0.5',
          'text-[10px] font-semibold uppercase tracking-wider text-violet-300',
          'outline-none focus:border-violet-500/40 cursor-pointer',
          !speaker && 'text-slate-600',
        )}
      >
        <option value="">Select speaker...</option>
        {characters.map((c) => (
          <option key={c.id} value={c.name}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Beat Select ────────────────────────────────────────────

interface BeatSelectProps {
  beatRef: string;
  beats: Beat[];
  onChange: (name: string) => void;
  selectRef?: React.Ref<HTMLSelectElement>;
}

function BeatSelect({ beatRef, beats, onChange, selectRef }: BeatSelectProps) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <ListChecks className="w-3 h-3 text-indigo-400/60 shrink-0" />
      <select
        ref={selectRef}
        value={beatRef}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'bg-slate-900/60 border border-slate-800/50 rounded px-1.5 py-0.5',
          'text-[10px] font-semibold uppercase tracking-wider text-indigo-300',
          'outline-none focus:border-indigo-500/40 cursor-pointer',
          !beatRef && 'text-slate-600',
        )}
      >
        <option value="">Select beat...</option>
        {beats.map((b) => (
          <option key={b.id} value={b.name}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Context Menu ───────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAdd: (type: BlockType) => void;
}

function ContextMenu({ x, y, onClose, onAdd }: ContextMenuProps) {
  useEffect(() => {
    const dismiss = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', dismiss);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', dismiss);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="fixed z-50 min-w-45 rounded-lg border border-slate-700/60 bg-slate-900 py-1 shadow-xl"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-800/50">
        Add Block
      </div>
      {MENU_ITEMS.map((item) => (
        <button
          key={item.type}
          onClick={() => {
            onAdd(item.type);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
        >
          <item.icon className={cn('w-3.5 h-3.5', item.color)} />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
}

// ─── Block Row ──────────────────────────────────────────────

interface BlockRowProps {
  block: EditorBlock;
  index: number;
  characters: Character[];
  beats: Beat[];
  onUpdate: (id: string, updates: Partial<EditorBlock>) => void;
  onDelete: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string, index: number) => void;
  registerRef: (id: string, el: HTMLTextAreaElement | null) => void;
  registerSelectRef: (id: string, el: HTMLSelectElement | null) => void;
}

function BlockRow({
  block, index, characters, beats,
  onUpdate, onDelete, onKeyDown, registerRef, registerSelectRef,
}: BlockRowProps) {
  const config = BLOCK_CONFIG[block.type];
  const localRef = useRef<HTMLTextAreaElement>(null);
  const localSelectRef = useRef<HTMLSelectElement>(null);

  const autoResize = useCallback(() => {
    const el = localRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [block.content, autoResize]);

  useEffect(() => {
    registerRef(block.id, localRef.current);
    return () => registerRef(block.id, null);
  }, [block.id, registerRef]);

  useEffect(() => {
    registerSelectRef(block.id, localSelectRef.current);
    return () => registerSelectRef(block.id, null);
  }, [block.id, registerSelectRef]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(block.id, { content: e.target.value });
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div
      data-block-index={index}
      className={cn(
        'group relative border-l-2 rounded-r-md transition-colors',
        config.borderColor,
        config.bgTint,
        'px-3 pt-1.5 pb-2',
      )}
    >
      {/* Type badge */}
      <span className="text-[9px] uppercase tracking-wider text-slate-600 select-none mb-0.5 block">
        {config.label}
        {block.type === 'dialogue' && block.speaker && (
          <span className="ml-1.5 text-violet-400/70">{block.speaker}</span>
        )}
        {block.type === 'beat' && block.beatRef && (
          <span className="ml-1.5 text-indigo-400/70">{block.beatRef}</span>
        )}
      </span>

      {/* Delete button */}
      <button
        onClick={() => onDelete(block.id)}
        className="absolute top-1.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-700 hover:text-red-400"
        title="Delete block"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>

      {/* Speaker selector for dialogue blocks */}
      {block.type === 'dialogue' && (
        <SpeakerSelect
          speaker={block.speaker || ''}
          characters={characters}
          onChange={(name) => onUpdate(block.id, { speaker: name })}
          selectRef={localSelectRef}
        />
      )}

      {/* Beat selector for beat blocks */}
      {block.type === 'beat' && (
        <BeatSelect
          beatRef={block.beatRef || ''}
          beats={beats}
          onChange={(name) => onUpdate(block.id, { beatRef: name })}
          selectRef={localSelectRef}
        />
      )}

      {/* Editable textarea */}
      <textarea
        ref={localRef}
        value={block.content}
        onChange={handleChange}
        onKeyDown={(e) => onKeyDown(e, block.id, index)}
        placeholder={config.placeholder}
        rows={1}
        spellCheck={false}
        className={cn(
          'w-full bg-transparent border-none outline-none resize-none',
          'placeholder:text-slate-700/60',
          config.textStyle,
        )}
      />
    </div>
  );
}

// ─── Empty Prompt ───────────────────────────────────────────

function EmptyPrompt({ onAddDefault }: { onAddDefault: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-12 h-12 rounded-xl bg-slate-900/60 border border-slate-800/40 flex items-center justify-center mb-4">
        <FileText className="w-5 h-5 text-slate-600" />
      </div>
      <p className="text-xs text-slate-400 mb-1">Right-click to add your first block</p>
      <p className="text-[10px] text-slate-600 mb-4">Or start with a scene header</p>
      <button
        type="button"
        onClick={onAddDefault}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-600/15 text-amber-400 border border-amber-500/25 hover:bg-amber-600/25 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add Scene Header
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface SceneEditorPanelProps {
  sceneId?: string;
  onClose?: () => void;
}

export default function SceneEditorPanel({
  sceneId: propSceneId,
  onClose,
}: SceneEditorPanelProps) {
  const { selectedProject, selectedScene, selectedAct } = useProjectStore();
  const projectId = selectedProject?.id || '';
  const actId = selectedAct?.id || '';
  const resolvedSceneId = propSceneId || selectedScene?.id || '';
  const { data: scene } = sceneApi.useScene(resolvedSceneId, !!resolvedSceneId);
  const { data: characters = [] } = characterApi.useProjectCharacters(projectId, !!projectId);
  const { data: beats = [] } = beatApi.useGetActBeats(actId, !!actId);
  const queryClient = useQueryClient();

  // Script context store
  const setReferences = useScriptContextStore((s) => s.setReferences);
  const pendingInsert = useScriptContextStore((s) => s.pendingInsert);
  const consumeInsert = useScriptContextStore((s) => s.consumeInsert);

  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    afterIndex: number;
  } | null>(null);

  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const selectRefs = useRef<Map<string, HTMLSelectElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const dialogueCount = blocks.filter((block) => block.type === 'dialogue').length;
  const beatCount = blocks.filter((block) => block.type === 'beat').length;

  // Register/unregister textarea refs
  const registerRef = useCallback((id: string, el: HTMLTextAreaElement | null) => {
    if (el) textareaRefs.current.set(id, el);
    else textareaRefs.current.delete(id);
  }, []);

  const registerSelectRef = useCallback((id: string, el: HTMLSelectElement | null) => {
    if (el) selectRefs.current.set(id, el);
    else selectRefs.current.delete(id);
  }, []);

  // Parse blocks when scene data arrives
  useEffect(() => {
    if (scene?.description !== undefined) {
      setBlocks(parseBlocks(scene.description || ''));
      setIsDirty(false);
      setSaveState('idle');
    }
  }, [scene?.description, resolvedSceneId]);

  // Reset on scene change
  useEffect(() => {
    setBlocks([]);
    setIsDirty(false);
    setSaveState('idle');
    setContextMenu(null);
  }, [resolvedSceneId]);

  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') return;
    const timer = setTimeout(() => setSaveState('idle'), 1800);
    return () => clearTimeout(timer);
  }, [saveState]);

  // Publish references to scriptContextStore
  useEffect(() => {
    const speakers = [...new Set(blocks.filter((b) => b.speaker).map((b) => b.speaker!))];
    const beatRefs = [...new Set(blocks.filter((b) => b.beatRef).map((b) => b.beatRef!))];
    setReferences(speakers, beatRefs);
  }, [blocks, setReferences]);

  // Consume sidebar insert requests
  useEffect(() => {
    if (!pendingInsert) return;
    const insert = consumeInsert();
    if (!insert) return;

    const newBlock: EditorBlock = {
      id: genId(),
      type: insert.type as BlockType,
      content: '',
      speaker: insert.speaker,
      beatRef: insert.beatRef,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setIsDirty(true);

    // Focus the new block's select or textarea
    requestAnimationFrame(() => {
      const sel = selectRefs.current.get(newBlock.id);
      if (sel) {
        sel.focus();
      } else {
        textareaRefs.current.get(newBlock.id)?.focus();
      }
    });
  }, [pendingInsert, consumeInsert]);

  // ─── Save ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!resolvedSceneId || !isDirty) return;
    setSaving(true);
    setSaveState('saving');
    try {
      const markdown = serializeBlocks(blocks);
      await sceneApi.updateScene(resolvedSceneId, { description: markdown });
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      setIsDirty(false);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  }, [resolvedSceneId, isDirty, blocks, queryClient]);

  // ─── Block operations ───────────────────────────────────
  const handleUpdateBlock = useCallback((id: string, updates: Partial<EditorBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    setIsDirty(true);
    setSaveState('dirty');
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setIsDirty(true);
    setSaveState('dirty');
  }, []);

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      const afterIdx = contextMenu?.afterIndex ?? blocks.length - 1;
      const newBlock: EditorBlock = { id: genId(), type, content: '' };
      setBlocks((prev) => {
        const next = [...prev];
        next.splice(afterIdx + 1, 0, newBlock);
        return next;
      });
      setIsDirty(true);
      setSaveState('dirty');
      setContextMenu(null);

      // For dialogue/beat, focus the select; otherwise focus textarea
      requestAnimationFrame(() => {
        if (type === 'dialogue' || type === 'beat') {
          const sel = selectRefs.current.get(newBlock.id);
          if (sel) {
            sel.focus();
            return;
          }
        }
        textareaRefs.current.get(newBlock.id)?.focus();
      });
    },
    [contextMenu, blocks.length],
  );

  const handleAddDefault = useCallback(() => {
    const newBlock: EditorBlock = { id: genId(), type: 'scene', content: '' };
    setBlocks([newBlock]);
    setIsDirty(true);
    setSaveState('dirty');
    requestAnimationFrame(() => {
      textareaRefs.current.get(newBlock.id)?.focus();
    });
  }, []);

  // ─── Context menu ───────────────────────────────────────
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const blockEl = target.closest('[data-block-index]');
      const afterIndex = blockEl
        ? parseInt(blockEl.getAttribute('data-block-index')!, 10)
        : blocks.length - 1;

      const MENU_W = 200;
      const MENU_H = 260;
      const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
      const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);

      setContextMenu({ x, y, afterIndex });
    },
    [blocks.length],
  );

  // ─── Keyboard ───────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string, blockIndex: number) => {
      // Cmd/Ctrl+S → save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Enter at end → new action block
      if (e.key === 'Enter' && !e.shiftKey) {
        const ta = e.currentTarget;
        if (ta.selectionStart === ta.value.length) {
          e.preventDefault();
          const newBlock: EditorBlock = { id: genId(), type: 'action', content: '' };
          setBlocks((prev) => {
            const next = [...prev];
            next.splice(blockIndex + 1, 0, newBlock);
            return next;
          });
          setIsDirty(true);
          requestAnimationFrame(() => {
            textareaRefs.current.get(newBlock.id)?.focus();
          });
          return;
        }
      }

      // Backspace on empty → delete, focus previous
      if (e.key === 'Backspace') {
        const ta = e.currentTarget;
        if (ta.value === '' && blocks.length > 1) {
          e.preventDefault();
          const prevBlock = blocks[blockIndex - 1];
          setBlocks((prev) => prev.filter((b) => b.id !== blockId));
          setIsDirty(true);
          if (prevBlock) {
            requestAnimationFrame(() => {
              const prevTa = textareaRefs.current.get(prevBlock.id);
              if (prevTa) {
                prevTa.focus();
                prevTa.selectionStart = prevTa.value.length;
                prevTa.selectionEnd = prevTa.value.length;
              }
            });
          }
        }
      }
    },
    [blocks, handleSave],
  );

  // ─── Render ─────────────────────────────────────────────
  return (
    <PanelFrame
      title={scene?.name || 'Scene Editor'}
      icon={FileText}
      onClose={onClose}
      headerAccent="amber"
      actions={
        <div className="flex items-center gap-1">
          <PanelSaveStateBadge state={isDirty ? 'dirty' : saveState} />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="rounded px-2 py-0.5 text-[10px] font-medium bg-amber-600/20 text-amber-300 transition-colors hover:bg-amber-600/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </div>
      }
    >
      {!resolvedSceneId ? (
        <PanelEmptyState
          icon={FileText}
          title="No scene selected"
          description="Select a scene in the project to start writing structured blocks."
        />
      ) : blocks.length === 0 && !isDirty ? (
        <div onContextMenu={handleContextMenu}>
          <EmptyPrompt onAddDefault={handleAddDefault} />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-800/40 bg-slate-900/35 px-3 py-1.5 text-[10px] text-slate-500">
            <span>{blocks.length} blocks</span>
            <span className="mx-1.5 text-slate-700">•</span>
            <span>{dialogueCount} dialogue</span>
            <span className="mx-1.5 text-slate-700">•</span>
            <span>{beatCount} beats</span>
            <span className="mx-2 text-slate-700">|</span>
            <span>Right-click to insert blocks</span>
          </div>

          <div
            ref={containerRef}
            className="h-full overflow-auto p-3 space-y-1.5"
            onContextMenu={handleContextMenu}
          >
            {blocks.map((block, i) => (
              <BlockRow
                key={block.id}
                block={block}
                index={i}
                characters={characters}
                beats={beats}
                onUpdate={handleUpdateBlock}
                onDelete={handleDeleteBlock}
                onKeyDown={handleKeyDown}
                registerRef={registerRef}
                registerSelectRef={registerSelectRef}
              />
            ))}
          </div>
        </div>
      )}

      {/* Context menu overlay */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onAdd={handleAddBlock}
          />
        )}
      </AnimatePresence>
    </PanelFrame>
  );
}
