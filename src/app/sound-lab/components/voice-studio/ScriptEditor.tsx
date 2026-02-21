'use client';

import { useState, useCallback } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Play, Loader2, Check, AlertCircle,
  Upload, Sparkles,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { EMOTIONS, DELIVERY_PRESETS } from '../../lib/voiceModifiers';
import { MOCK_CHARACTERS } from '../../data/mockAudioData';
import type { ScriptLine, MockCharacter, ScriptLineTake } from '../../types';

interface ScriptEditorProps {
  lines: ScriptLine[];
  onLinesChange: (lines: ScriptLine[]) => void;
  castings: Record<string, string>;
  onRegenerateLine?: (lineId: string) => void;
  onOpenTakes?: (lineId: string) => void;
}

function makeId(): string {
  return `sl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeDefaultLine(castings: Record<string, string>): ScriptLine {
  const firstChar = MOCK_CHARACTERS[0]!;
  return {
    id: makeId(),
    character: firstChar.name,
    voiceId: castings[firstChar.id] ?? '',
    text: '',
    emotion: 'neutral',
    delivery: 'narration',
    status: 'pending',
  };
}

const STATUS_STYLES: Record<ScriptLine['status'], { color: string; icon: typeof Check }> = {
  pending: { color: 'text-slate-500', icon: Check },
  generating: { color: 'text-orange-400', icon: Loader2 },
  done: { color: 'text-emerald-400', icon: Check },
  error: { color: 'text-red-400', icon: AlertCircle },
};

export default function ScriptEditor({
  lines,
  onLinesChange,
  castings,
  onRegenerateLine,
  onOpenTakes,
}: ScriptEditorProps) {
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const updateLine = useCallback((id: string, updates: Partial<ScriptLine>) => {
    onLinesChange(lines.map((l) => l.id === id ? { ...l, ...updates } : l));
  }, [lines, onLinesChange]);

  const addLine = useCallback(() => {
    onLinesChange([...lines, makeDefaultLine(castings)]);
  }, [lines, castings, onLinesChange]);

  const removeLine = useCallback((id: string) => {
    onLinesChange(lines.filter((l) => l.id !== id));
  }, [lines, onLinesChange]);

  const moveLine = useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= lines.length) return;
    const next = [...lines];
    [next[index], next[newIndex]] = [next[newIndex]!, next[index]!];
    onLinesChange(next);
  }, [lines, onLinesChange]);

  const handleCharacterChange = useCallback((lineId: string, charName: string) => {
    const char = MOCK_CHARACTERS.find((c) => c.name === charName);
    updateLine(lineId, {
      character: charName,
      voiceId: char ? (castings[char.id] ?? '') : '',
    });
  }, [castings, updateLine]);

  const handleBulkImport = useCallback(() => {
    const pattern = /^([A-Za-z\s]+):\s*"?(.+?)"?\s*$/gm;
    const parsed: ScriptLine[] = [];
    let match;

    while ((match = pattern.exec(bulkText)) !== null) {
      const charName = match[1]!.trim();
      const text = match[2]!.trim();
      const char = MOCK_CHARACTERS.find((c) =>
        c.name.toLowerCase().includes(charName.toLowerCase()) ||
        charName.toLowerCase().includes(c.name.split(' ')[0]!.toLowerCase())
      );

      parsed.push({
        id: makeId(),
        character: char?.name ?? charName,
        voiceId: char ? (castings[char.id] ?? '') : '',
        text,
        emotion: 'neutral',
        delivery: 'narration',
        status: 'pending',
      });
    }

    if (parsed.length > 0) {
      onLinesChange([...lines, ...parsed]);
      setBulkText('');
      setShowBulkImport(false);
    }
  }, [bulkText, castings, lines, onLinesChange]);

  const handlePlayLine = useCallback((line: ScriptLine) => {
    if (line.audioUrl) {
      const audio = new Audio(line.audioUrl);
      audio.play();
    }
  }, []);

  return (
    <div className="space-y-2">
      {/* Line List */}
      {lines.map((line, index) => {
        const statusStyle = STATUS_STYLES[line.status];
        const StatusIcon = statusStyle.icon;

        return (
          <div
            key={line.id}
            className="flex gap-1.5 items-start p-2 rounded-lg border border-slate-800/40 bg-slate-900/30"
          >
            {/* Line Number + Status */}
            <div className="flex flex-col items-center gap-1 pt-1 shrink-0 w-6">
              <span className="text-[11px] text-slate-500 font-mono">{index + 1}</span>
              <StatusIcon
                className={cn('w-3 h-3', statusStyle.color, line.status === 'generating' && 'animate-spin')}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Row 1: Character + Text */}
              <div className="flex gap-1.5">
                <select
                  value={line.character}
                  onChange={(e) => handleCharacterChange(line.id, e.target.value)}
                  className="w-28 shrink-0 px-1.5 py-1 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-300
                    focus:outline-none focus:border-orange-500/40"
                >
                  {MOCK_CHARACTERS.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={line.text}
                  onChange={(e) => updateLine(line.id, { text: e.target.value })}
                  placeholder="Enter dialogue line..."
                  className="flex-1 px-2 py-1 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-200
                    placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40"
                />
              </div>

              {/* Row 2: Emotion chips + Delivery (+ selected take indicator) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {line.selectedTakeIdx != null && line.selectedTakeIdx >= 0 && line.takes?.[line.selectedTakeIdx] && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium mr-1">
                    Take: {EMOTIONS.find((e) => e.type === line.takes![line.selectedTakeIdx!]!.emotion)?.label ?? line.takes[line.selectedTakeIdx].emotion}
                  </span>
                )}
                {EMOTIONS.map((emo) => (
                  <button
                    key={emo.type}
                    onClick={() => updateLine(line.id, { emotion: emo.type })}
                    className={cn(
                      'w-4 h-4 rounded-full border-2 transition-all',
                      emo.color,
                      line.emotion === emo.type
                        ? 'border-white/60 scale-125'
                        : 'border-transparent opacity-40 hover:opacity-70'
                    )}
                    title={emo.label}
                  />
                ))}
                <div className="w-px h-4 bg-slate-700/50 mx-0.5" />
                <select
                  value={line.delivery}
                  onChange={(e) => updateLine(line.id, { delivery: e.target.value })}
                  className="px-1.5 py-0.5 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-400
                    focus:outline-none focus:border-orange-500/40"
                >
                  {DELIVERY_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Error display */}
              {line.error && (
                <span className="text-[11px] text-red-400 block">{line.error}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <button
                onClick={() => moveLine(index, -1)}
                disabled={index === 0}
                className="p-0.5 text-slate-600 hover:text-slate-400 disabled:opacity-30 transition-colors"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => moveLine(index, 1)}
                disabled={index === lines.length - 1}
                className="p-0.5 text-slate-600 hover:text-slate-400 disabled:opacity-30 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {line.status === 'done' && line.audioUrl && (
                <button
                  onClick={() => handlePlayLine(line)}
                  className="p-0.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Play preview"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}

              {(line.status === 'done' || line.status === 'error') && onRegenerateLine && (
                <button
                  onClick={() => onRegenerateLine(line.id)}
                  className="p-0.5 text-orange-400 hover:text-orange-300 transition-colors"
                  title="Regenerate"
                >
                  <Loader2 className="w-3 h-3" />
                </button>
              )}

              {/* Gen Takes button */}
              {onOpenTakes && line.voiceId && line.text.trim() && (
                <button
                  onClick={() => onOpenTakes(line.id)}
                  className="p-0.5 text-amber-400 hover:text-amber-300 transition-colors"
                  title="Generate takes"
                >
                  <Sparkles className="w-3 h-3" />
                </button>
              )}

              {/* Takes badge */}
              {(line.takes?.length ?? 0) > 0 && (
                <button
                  onClick={() => onOpenTakes?.(line.id)}
                  className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium"
                  title={`${line.takes!.length} takes — click to manage`}
                >
                  {line.takes!.length}T
                </button>
              )}

              <button
                onClick={() => removeLine(line.id)}
                className="p-0.5 text-slate-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add / Import Buttons */}
      <div className="flex gap-2">
        <button
          onClick={addLine}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium
            bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Line
        </button>
        <button
          onClick={() => setShowBulkImport(!showBulkImport)}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors',
            showBulkImport
              ? 'bg-orange-500/10 text-orange-400'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          <Upload className="w-3 h-3" />
          Bulk Import
        </button>
      </div>

      {/* Bulk Import Panel */}
      {showBulkImport && (
        <div className="p-2.5 rounded-lg border border-slate-700/40 bg-slate-900/40 space-y-2">
          <span className="text-[11px] text-slate-400 block">
            Paste lines in format: <code className="text-orange-400">CHARACTER: &quot;Line text&quot;</code>
          </span>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={4}
            className="w-full px-2 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-200
              placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40 font-mono resize-none"
            placeholder={'Commander Voss: "We march at dawn."\nLyra Stormwind: "Not without me."'}
          />
          <button
            onClick={handleBulkImport}
            disabled={!bulkText.trim()}
            className={cn(
              'px-3 py-1.5 rounded text-[11px] font-medium transition-all',
              !bulkText.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-500'
            )}
          >
            Import Lines
          </button>
        </div>
      )}
    </div>
  );
}
