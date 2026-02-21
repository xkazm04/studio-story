/**
 * AvatarGrid - 4-avatar selection grid
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User } from 'lucide-react';
import { GeneratedAvatar } from '../../hooks/useAvatarGenerator';
import { cn } from '@/app/lib/utils';

interface AvatarGridProps {
  avatars: GeneratedAvatar[];
  selectedAvatar: GeneratedAvatar | null;
  onSelectAvatar: (avatar: GeneratedAvatar) => void;
  isLoading: boolean;
}

const AvatarGrid: React.FC<AvatarGridProps> = ({
  avatars,
  selectedAvatar,
  onSelectAvatar,
  isLoading,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            generating_avatars
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-slate-800/50 border border-slate-700/50 animate-pulse flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-cyan-500/50 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[10px] text-slate-500">
                  avatar_{i + 1}...
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (avatars.length === 0) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            generated_avatars
          </h3>
        </div>
        <div className="py-8 text-center">
          <User className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <span className="font-mono text-xs text-slate-500">
            // generate_avatars_to_preview
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            select_avatar
          </h3>
        </div>
        <span className="font-mono text-[10px] text-slate-500 uppercase">
          click to select
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {avatars.map((avatar, index) => {
            const isSelected = selectedAvatar?.id === avatar.id;
            return (
              <motion.button
                key={avatar.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => onSelectAvatar(avatar)}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200',
                  isSelected
                    ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : 'border-slate-700/50 hover:border-slate-600'
                )}
              >
                <img
                  src={avatar.url}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}

                {/* Style badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="font-mono text-[10px] text-white uppercase tracking-wide">
                    {avatar.style}
                  </span>
                </div>

                {/* Hover overlay */}
                <div className={cn('absolute inset-0 bg-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity', isSelected && 'opacity-100')} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AvatarGrid;
