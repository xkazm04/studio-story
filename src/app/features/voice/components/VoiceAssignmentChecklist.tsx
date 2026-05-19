/**
 * VoiceAssignmentChecklist — Pre-flight checklist for voice assignments
 *
 * Shows characters without voice assignments before narration generation.
 * Each character row has an "Assign Voice" button. When all characters
 * are assigned, shows an "All Assigned" generate button.
 */

'use client';

import { AlertTriangle, CheckCircle2, Mic2, SkipForward } from 'lucide-react';

interface VoiceAssignmentChecklistProps {
  unassignedCharacters: string[];
  onAssign: (character: string) => void;
  onSkip: () => void;
}

export function VoiceAssignmentChecklist({
  unassignedCharacters,
  onAssign,
  onSkip,
}: VoiceAssignmentChecklistProps) {
  const hasUnassigned = unassignedCharacters.length > 0;

  if (!hasUnassigned) {
    return (
      <div className="rounded-lg border border-voice-primary/50 bg-slate-800/80 p-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-voice-primary" />
          <span className="text-sm font-medium text-voice-primary/80">Voice Assignments Complete</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          All characters have voices assigned. Ready to generate narration.
        </p>
        <button
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium
            bg-voice-primary/80 text-white hover:bg-voice-primary
            transition-all"
        >
          <Mic2 className="w-3.5 h-3.5" />
          All Assigned -- Generate
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/50 bg-slate-800/80 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-300">
          {unassignedCharacters.length} Character{unassignedCharacters.length !== 1 ? 's' : ''} Need Voice Assignment
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Assign voices before generating narration, or skip to use the narrator voice as fallback.
      </p>

      <div className="space-y-1.5 mb-3">
        {unassignedCharacters.map((character) => (
          <div
            key={character}
            className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-900/50"
          >
            <span className="text-sm text-slate-200 font-mono">{character}</span>
            <button
              onClick={() => onAssign(character)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium
                bg-amber-600/80 text-white hover:bg-amber-500 transition-colors"
            >
              <Mic2 className="w-3 h-3" />
              Assign Voice
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium
          text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700
          transition-all"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Skip -- Use Narrator
      </button>
    </div>
  );
}
