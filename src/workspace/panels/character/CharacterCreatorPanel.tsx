'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paintbrush, Search, User, Sparkles, Users, Image, Scissors, Eye,
  CircleDot, Smile, Palette, Flame, Crown, Droplet, Clock, Sun,
  Loader2, AlertCircle, UserCircle, Maximize, Grid3X3, Minus, Plus,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';

// Creator stores + constants
import { useCreatorUIStore } from '../../creator/store/creatorUIStore';
import {
  useCreatorCharacterStore,
  selectActiveSelectionCount,
  selectComposedPrompt,
} from '../../creator/store/creatorCharacterStore';
import { CATEGORIES, CATEGORY_GROUPS, getCategoryById } from '../../creator/constants/categories';
import type { Category, CategoryId } from '../../creator/types';

// Creator sub-components
import { CategoryHeader } from '../../creator/components/options/CategoryHeader';
import { OptionsList } from '../../creator/components/options/OptionsList';
import { PromptEditor } from '../../creator/components/prompt/PromptEditor';
import ImageGenerationView from '../../creator/components/ImageGenerationView';
import { useCreatorImageStore } from '../../creator/store/creatorImageStore';

// ─── Icon Map ─────────────────────────────────────────────

const ICONS: Record<string, React.ElementType> = {
  User, Sparkles, Users, Image, Scissors, Eye, CircleDot,
  Smile, Palette, Flame, Crown, Droplet, Clock, Sun,
};

// ─── Types ────────────────────────────────────────────────

interface CliAppearanceUpdate {
  [categoryId: string]: { optionId?: number; customPrompt?: string };
}

interface CharacterCreatorPanelProps {
  characterId?: string;
  cliAppearanceUpdate?: CliAppearanceUpdate;
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

// ─── Left Category Menu (icon + label, grouped) ──────────

function LeftCategoryMenu() {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const setActiveCategory = useCreatorUIStore((s) => s.setActiveCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);

  const hasSelection = (catId: CategoryId) => {
    const sel = selections[catId];
    return sel && (sel.optionId !== null || sel.isCustom);
  };

  const categoriesByGroup = CATEGORY_GROUPS.reduce((acc, group) => {
    acc[group.id] = CATEGORIES.filter((c) => c.group === group.id);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <nav className="w-35 shrink-0 border-r border-slate-800/40 overflow-y-auto py-2">
      {CATEGORY_GROUPS.map((group) => (
        <div key={group.id} className="mb-1.5">
          <div className="px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-medium">
              {group.label}
            </span>
          </div>
          <div className="px-1.5 space-y-0.5">
            {categoriesByGroup[group.id]?.map((cat) => {
              const Icon = ICONS[cat.icon] || User;
              const isActive = activeCategory === cat.id;
              const selected = hasSelection(cat.id);

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-xs',
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-left truncate">{cat.label}</span>
                  {selected && (
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ─── Character Viewport (center, tabs + image) ───────────

function CharacterViewport() {
  const viewportTab = useCreatorUIStore((s) => s.viewportTab);
  const setViewportTab = useCreatorUIStore((s) => s.setViewportTab);
  const generatedImageUrl = useCreatorUIStore((s) => s.generatedImageUrl);
  const isGenerating = useCreatorUIStore((s) => s.isGenerating);
  const generationError = useCreatorUIStore((s) => s.generationError);
  const setGenerationError = useCreatorUIStore((s) => s.setGenerationError);
  const viewMode = useCreatorImageStore((s) => s.viewMode);
  const setViewMode = useCreatorImageStore((s) => s.setViewMode);

  const handleImageSaved = useCallback((imageUrls: string[]) => {
    if (imageUrls.length > 0) {
      useCreatorUIStore.getState().setGeneratedImage(imageUrls[0]);
    }
  }, []);

  const isMultiView = viewMode !== 'single';

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 h-8 border-b border-slate-800/40 shrink-0">
        <button
          onClick={() => setViewportTab('avatar')}
          disabled={isMultiView}
          className={cn(
            'px-2.5 py-1 rounded text-[10px] font-medium transition-all',
            viewportTab === 'avatar'
              ? 'bg-amber-500/15 text-amber-400'
              : 'text-slate-500 hover:text-slate-300',
            isMultiView && 'opacity-50 cursor-not-allowed'
          )}
        >
          Avatar (1:1)
        </button>
        <button
          onClick={() => setViewportTab('fullbody')}
          disabled={isMultiView}
          className={cn(
            'px-2.5 py-1 rounded text-[10px] font-medium transition-all',
            viewportTab === 'fullbody'
              ? 'bg-amber-500/15 text-amber-400'
              : 'text-slate-500 hover:text-slate-300',
            isMultiView && 'opacity-50 cursor-not-allowed'
          )}
        >
          Full Body (3:4)
        </button>

        {isMultiView && (
          <button
            onClick={() => {
              useCreatorImageStore.getState().clearImages();
              setViewMode('single');
            }}
            className="ml-auto px-2 py-0.5 rounded text-[10px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Viewport area */}
      {isMultiView ? (
        <ImageGenerationView tab={viewportTab} onImageSaved={handleImageSaved} />
      ) : (
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-linear-to-b from-slate-950 to-slate-900/50">
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Corner markers */}
          <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-amber-500/30 rounded-tl" />
          <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-amber-500/30 rounded-tr" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-amber-500/30 rounded-bl" />
          <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-amber-500/30 rounded-br" />

          {/* Content */}
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900/60 border border-amber-500/20 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
              </div>
              <p className="text-xs text-slate-400">Generating character...</p>
            </div>
          ) : generationError ? (
            <div className="flex max-w-70 flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-900/60 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-xs text-red-400">{generationError}</p>
              <button
                onClick={() => setGenerationError(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ) : generatedImageUrl ? (
            <div className={cn(
              'relative rounded-xl overflow-hidden border border-slate-800/50 shadow-2xl',
              viewportTab === 'avatar' ? 'aspect-square' : 'aspect-3/4',
              'max-h-[90%] max-w-[90%]'
            )}>
              <img
                src={generatedImageUrl}
                alt="Generated character"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-800/50 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-slate-600" />
                </div>
                <div className="absolute inset-0 w-16 h-16 rounded-2xl border border-amber-500/10 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Character Preview</p>
                <p className="text-[10px] text-slate-600">Select options & generate</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Generate Button ──────────────────────────────────────

function GenerateButton() {
  const composedPrompt = useCreatorCharacterStore(selectComposedPrompt);
  const selectionCount = useCreatorCharacterStore(selectActiveSelectionCount);
  const isGenerating = useCreatorUIStore((s) => s.isGenerating);
  const viewportTab = useCreatorUIStore((s) => s.viewportTab);
  const startGeneration = useCreatorUIStore((s) => s.startGeneration);
  const finishGeneration = useCreatorUIStore((s) => s.finishGeneration);
  const setGeneratedImage = useCreatorUIStore((s) => s.setGeneratedImage);
  const setGenerationError = useCreatorUIStore((s) => s.setGenerationError);
  const abortRef = useRef<AbortController | null>(null);

  const imageCount = useCreatorImageStore((s) => s.imageCount);
  const setImageCount = useCreatorImageStore((s) => s.setImageCount);
  const viewMode = useCreatorImageStore((s) => s.viewMode);
  const setViewMode = useCreatorImageStore((s) => s.setViewMode);
  const isMultiGenerating = useCreatorImageStore((s) => s.isGenerating);
  const [showMulti, setShowMulti] = useState(false);

  const handleQuickGenerate = useCallback(async () => {
    if (isGenerating || selectionCount === 0) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    startGeneration();
    setGenerationError(null);

    try {
      const aspectRatio = viewportTab === 'avatar' ? '1:1' : '3:4';
      const res = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: composedPrompt, aspectRatio }),
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        setGenerationError(data.error || 'Generation failed');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setGenerationError(err instanceof Error ? err.message : 'Network error');
    } finally {
      finishGeneration();
    }
  }, [isGenerating, selectionCount, composedPrompt, viewportTab, startGeneration, finishGeneration, setGeneratedImage, setGenerationError]);

  const handleMultiGenerate = useCallback(() => {
    if (selectionCount === 0 || isMultiGenerating) return;
    setViewMode('multi-generate');
  }, [selectionCount, isMultiGenerating, setViewMode]);

  const disabled = selectionCount === 0;
  const busy = isGenerating || isMultiGenerating;
  const isMultiView = viewMode !== 'single';

  return (
    <div className="space-y-1.5">
      {/* Multi-generate toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowMulti((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 text-[10px] transition-colors',
            showMulti ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          <Grid3X3 className="w-3 h-3" />
          Multi-generate
        </button>
        {showMulti && (
          <span className="text-[10px] text-slate-600">{imageCount} images</span>
        )}
      </div>

      {/* Count input (expandable) */}
      {showMulti && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/40 rounded-lg border border-slate-800/30">
          <button
            onClick={() => setImageCount(imageCount - 1)}
            disabled={imageCount <= 1}
            className="p-0.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="range"
            min={1}
            max={12}
            value={imageCount}
            onChange={(e) => setImageCount(Number(e.target.value))}
            className="flex-1 h-1 accent-amber-500 cursor-pointer"
          />
          <button
            onClick={() => setImageCount(imageCount + 1)}
            disabled={imageCount >= 12}
            className="p-0.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <input
            type="number"
            min={1}
            max={12}
            value={imageCount}
            onChange={(e) => setImageCount(Number(e.target.value))}
            className="w-8 bg-slate-800/60 text-center text-[10px] text-slate-300 rounded border border-slate-700/50 outline-none"
          />
        </div>
      )}

      {/* Buttons */}
      {showMulti && !isMultiView ? (
        <div className="flex gap-1.5">
          <button
            onClick={handleQuickGenerate}
            disabled={busy || disabled}
            className={cn(
              'flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all',
              busy || disabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600/80'
            )}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Quick
          </button>
          <button
            onClick={handleMultiGenerate}
            disabled={busy || disabled}
            className={cn(
              'flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all',
              busy || disabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-linear-to-r from-amber-600/90 to-orange-600/90 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/20'
            )}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Generate {imageCount}
          </button>
        </div>
      ) : !isMultiView ? (
        <button
          onClick={handleQuickGenerate}
          disabled={busy || disabled}
          className={cn(
            'w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-all',
            busy || disabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-linear-to-r from-amber-600/90 to-orange-600/90 text-white hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-900/20'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Character
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

// ─── Options Panel (right side) ───────────────────────────

function OptionsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selectionCount = useCreatorCharacterStore(selectActiveSelectionCount);
  const composedPrompt = useCreatorCharacterStore(selectComposedPrompt);

  const category = activeCategory ? getCategoryById(activeCategory) : null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(composedPrompt);
  };

  return (
    <div className="flex min-h-0 w-65 shrink-0 flex-col border-l border-slate-800/40">
      {/* Search header */}
      <div className="px-3 py-2 border-b border-slate-800/40 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-200">
            {category?.label ?? 'Select Category'}
          </span>
          <span className="text-[10px] text-slate-600">
            {selectionCount} defined
          </span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900/60 border border-slate-800/50">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter options..."
            className="flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder-slate-600"
          />
        </div>
      </div>

      {/* Category header */}
      <CategoryHeader />

      {/* Options grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <OptionsList searchQuery={searchQuery} />
      </div>

      {/* Custom prompt editor */}
      <div className="shrink-0 px-3 py-2 border-t border-slate-800/40">
        <PromptEditor />
      </div>

      {/* Composed prompt + copy */}
      <div className="shrink-0 border-t border-slate-800/40 px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            Composed Prompt
          </span>
          <button
            onClick={handleCopyPrompt}
            className="text-[9px] px-1.5 py-0.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
          >
            Copy
          </button>
        </div>
        <div className="p-2 bg-slate-900/40 rounded border border-slate-800/30 max-h-16 overflow-y-auto">
          <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap">
            {composedPrompt}
          </p>
        </div>
      </div>

      {/* Generate button */}
      <div className="shrink-0 px-3 pb-2">
        <GenerateButton />
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────

export default function CharacterCreatorPanel({
  characterId,
  cliAppearanceUpdate,
  onClose,
  onTriggerSkill,
}: CharacterCreatorPanelProps) {
  const selectionCount = useCreatorCharacterStore(selectActiveSelectionCount);
  const setCharacterName = useCreatorCharacterStore((s) => s.setCharacterName);
  const [loadedCharId, setLoadedCharId] = useState<string | undefined>();

  const lastUpdateRef = useRef<CliAppearanceUpdate | undefined>(undefined);

  // Load character name when characterId changes
  useEffect(() => {
    if (!characterId || characterId === loadedCharId) return;
    setLoadedCharId(characterId);

    fetch(`/api/characters/${characterId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) setCharacterName(data.name);
      })
      .catch(() => {});
  }, [characterId, loadedCharId, setCharacterName]);

  // Apply CLI appearance updates
  useEffect(() => {
    if (cliAppearanceUpdate && cliAppearanceUpdate !== lastUpdateRef.current) {
      lastUpdateRef.current = cliAppearanceUpdate;
      useCreatorCharacterStore.getState().applyCliUpdate(cliAppearanceUpdate);
    }
  }, [cliAppearanceUpdate]);

  return (
    <PanelFrame
      title="Character Creator"
      icon={Paintbrush}
      onClose={onClose}
      headerAccent="cyan"
      actions={
        <div className="flex items-center gap-1">
          {onTriggerSkill && (
            <button
              onClick={() => onTriggerSkill('character-appearance', characterId ? { characterId } : undefined)}
              className="text-[9px] px-1.5 py-0.5 text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
            >
              AI Design
            </button>
          )}
          <span className="text-[9px] text-slate-600">
            {selectionCount}/14
          </span>
        </div>
      }
    >
      <div className="flex h-full">
        <LeftCategoryMenu />
        <CharacterViewport />
        <OptionsPanel />
      </div>
    </PanelFrame>
  );
}
