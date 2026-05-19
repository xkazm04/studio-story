/**
 * ArchitectMode — "Story Architect" mode for AI Companion
 * Generates branching story trees from the current scene
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Network } from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { Label } from '@/app/components/UI/Label';

interface ArchitectModeProps {
  isGenerating: boolean;
  hasCurrentScene: boolean;
  onGenerate: (levels: number, choicesPerScene: number) => void;
}

export function ArchitectMode({
  isGenerating,
  hasCurrentScene,
  onGenerate,
}: ArchitectModeProps) {
  const [levels, setLevels] = useState(2);
  const [choicesPerScene, setChoicesPerScene] = useState(2);

  const calculateTotalScenes = () => {
    let total = 0;
    for (let i = 1; i <= levels; i++) {
      total += Math.pow(choicesPerScene, i);
    }
    return total;
  };

  const totalScenes = calculateTotalScenes();

  if (!hasCurrentScene) {
    return (
      <div className="text-center py-8">
        <Network className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Select a scene to branch from</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">Generate a branching tree from the current scene.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-400">Levels deep:</Label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setLevels(n)}
                disabled={isGenerating}
                className={cn(
                  'w-7 h-7 rounded-full text-sm font-bold transition-all',
                  'border-2 flex items-center justify-center',
                  levels === n
                    ? 'bg-purple-600 text-white border-purple-500 scale-110'
                    : cn('bg-transparent border-slate-700 text-slate-400', 'hover:border-purple-500/50'),
                  isGenerating && 'opacity-50 cursor-not-allowed'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-400">Choices per scene:</Label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setChoicesPerScene(n)}
                disabled={isGenerating}
                className={cn(
                  'w-7 h-7 rounded-full text-sm font-bold transition-all',
                  'border-2 flex items-center justify-center',
                  choicesPerScene === n
                    ? 'bg-purple-600 text-white border-purple-500 scale-110'
                    : 'bg-transparent border-slate-700 text-slate-400 hover:border-purple-500/50',
                  isGenerating && 'opacity-50 cursor-not-allowed'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-slate-400 py-2 border-t border-slate-800">
        Will generate <span className="font-semibold text-slate-300">{totalScenes}</span> new scenes
      </div>

      <Button onClick={() => onGenerate(levels, choicesPerScene)} disabled={isGenerating} className="w-full gap-2">
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating Tree...
          </>
        ) : (
          <>
            <Network className="w-4 h-4" />
            Generate Tree
          </>
        )}
      </Button>
    </div>
  );
}
