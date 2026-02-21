/**
 * PromptPreview - Shows composed prompt with project art style
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface PromptPreviewProps {
  prompt: string | null;
  artStyle?: string;
  isComposing: boolean;
  onRecompose: () => void;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({
  prompt,
  artStyle,
  isComposing,
  onRecompose,
}) => {
  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            composed_prompt
          </h3>
        </div>
        {prompt && (
          <button
            onClick={onRecompose}
            disabled={isComposing}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wide
                       text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10
                       transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3 h-3', isComposing && 'animate-spin')} />
            recompose
          </button>
        )}
      </div>

      {/* Art Style Badge */}
      {artStyle && (
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="font-mono text-[10px] uppercase tracking-wide text-amber-400/80">
            project_style:
          </span>
          <span className="font-mono text-xs text-slate-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {artStyle.length > 50 ? artStyle.substring(0, 50) + '...' : artStyle}
          </span>
        </div>
      )}

      {/* Prompt Display */}
      {isComposing ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 py-4"
        >
          <div className="w-4 h-4 border-2 border-cyan-500/50 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-slate-500">composing_prompt...</span>
        </motion.div>
      ) : prompt ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <div className="p-3 bg-slate-800/50 rounded-md border border-slate-700/30">
            <p className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
              {prompt}
            </p>
          </div>
          <div className="absolute bottom-2 right-2 font-mono text-[9px] text-slate-600">
            {prompt.length}/1500
          </div>
        </motion.div>
      ) : (
        <div className="py-4 text-center">
          <span className="font-mono text-xs text-slate-500">
            // select_options_to_compose_prompt
          </span>
        </div>
      )}
    </div>
  );
};

export default PromptPreview;
