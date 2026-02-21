/**
 * CurrentAvatar - Current avatar display with set action
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { GeneratedAvatar } from '../../hooks/useAvatarGenerator';

interface CurrentAvatarProps {
  currentAvatarUrl?: string;
  selectedAvatar: GeneratedAvatar | null;
  onSetAsAvatar: () => void;
  isUpdating?: boolean;
}

const CurrentAvatar: React.FC<CurrentAvatarProps> = ({
  currentAvatarUrl,
  selectedAvatar,
  onSetAsAvatar,
  isUpdating = false,
}) => {
  const hasSelection = !!selectedAvatar;
  const hasCurrent = !!currentAvatarUrl;

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-4 h-4 text-cyan-400" />
        <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
          character_avatar
        </h3>
      </div>

      <div className="flex items-center gap-4">
        {/* Current Avatar */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500 uppercase">current</span>
          <div className={cn(
            'w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0',
            hasCurrent ? 'border-slate-600' : 'border-dashed border-slate-700/50'
          )}>
            {hasCurrent ? (
              <img
                src={currentAvatarUrl}
                alt="Current avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                <User className="w-8 h-8 text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0"
          >
            <ArrowRight className="w-5 h-5 text-cyan-500" />
          </motion.div>
        )}

        {/* Selected Avatar */}
        {hasSelection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="font-mono text-[10px] text-cyan-400 uppercase">new</span>
            <div className="w-20 h-20 rounded-lg border-2 border-cyan-500/50 overflow-hidden shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <img
                src={selectedAvatar.url}
                alt="Selected avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Set Button */}
        <div className="flex-1 flex justify-end">
          {hasSelection ? (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onSetAsAvatar}
              disabled={isUpdating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wide
                         bg-cyan-600 hover:bg-cyan-500 text-white
                         transition-all duration-200 shadow-lg hover:shadow-cyan-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  set_as_avatar
                </>
              )}
            </motion.button>
          ) : (
            <div className="text-right">
              <p className="font-mono text-xs text-slate-500">
                // select_an_avatar
              </p>
              <p className="font-mono text-[10px] text-slate-600">
                generate and choose from options
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentAvatar;
