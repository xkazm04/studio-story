/**
 * ChoiceList Component
 * Displays list of choices for a scene
 * Design: Clean Manuscript style with monospace accents
 */

'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { SceneChoice } from '@/app/types/SceneChoice';
import { Scene } from '@/app/types/Scene';
import { cn } from '@/lib/utils';
import { ArrowRight, Trash2, GripVertical, Link, Unlink } from 'lucide-react';

interface ChoiceListProps {
  choices: SceneChoice[];
  scenes: Scene[];
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10, transition: { duration: 0.15 } },
};

export function ChoiceList({ choices, scenes }: ChoiceListProps) {
  const { updateChoice, deleteChoice } = useSceneEditor();

  // Sort by order_index
  const sortedChoices = [...choices].sort((a, b) => a.order_index - b.order_index);

  const getTargetSceneName = useCallback(
    (targetId: string | null) => {
      if (!targetId) return 'No target';
      const scene = scenes.find(s => s.id === targetId);
      return scene?.name || 'Unknown scene';
    },
    [scenes]
  );

  const handleDelete = useCallback(
    async (choiceId: string) => {
      if (confirm('Delete this choice?')) {
        await deleteChoice(choiceId);
      }
    },
    [deleteChoice]
  );

  if (sortedChoices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sortedChoices.map((choice, index) => {
          const hasTarget = !!choice.target_scene_id;

          return (
            <motion.div
              key={choice.id}
              variants={item}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
              transition={{ delay: index * 0.05 }}
              className={cn(
                'group flex items-center gap-3 p-3 rounded-lg',
                'bg-slate-800/60 border border-slate-700/50',
                'hover:border-slate-600/80 hover:bg-slate-800',
                'transition-all duration-200'
              )}
            >
              {/* Drag Handle */}
              <div className="text-slate-600 cursor-grab hover:text-slate-400 transition-colors">
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Index Badge */}
              <div
                className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold',
                  'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                )}
              >
                {index + 1}
              </div>

              {/* Choice Label */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {choice.label || 'Untitled choice'}
                </p>
              </div>

              {/* Connection Indicator */}
              <div
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1 rounded-md',
                  hasTarget
                    ? 'bg-cyan-900/30 border border-cyan-500/30'
                    : 'bg-amber-900/30 border border-amber-500/30'
                )}
              >
                {hasTarget ? (
                  <Link className="w-3 h-3 text-cyan-400" />
                ) : (
                  <Unlink className="w-3 h-3 text-amber-400" />
                )}
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span
                  className={cn(
                    'text-xs font-mono font-medium truncate max-w-[120px]',
                    hasTarget ? 'text-cyan-400' : 'text-amber-400'
                  )}
                >
                  {getTargetSceneName(choice.target_scene_id)}
                </span>
              </div>

              {/* Delete Button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDelete(choice.id)}
                className={cn(
                  'p-1.5 rounded-md opacity-0 group-hover:opacity-100',
                  'text-slate-400 hover:text-red-400 hover:bg-red-900/30',
                  'transition-all duration-200'
                )}
                title="Delete choice"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
