/**
 * ReferenceSelector - Optional reference image picker
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Image, X, Link2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface ReferenceSelectorProps {
  referenceImage: string | null;
  onSetReference: (url: string | null) => void;
  currentAvatarUrl?: string;
  disabled?: boolean;
}

const ReferenceSelector: React.FC<ReferenceSelectorProps> = ({
  referenceImage,
  onSetReference,
  currentAvatarUrl,
  disabled = false,
}) => {
  const hasReference = !!referenceImage;

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-slate-500" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            reference_image
          </h3>
          <span className="font-mono text-[10px] text-slate-600 uppercase">optional</span>
        </div>

        {hasReference && (
          <button
            onClick={() => onSetReference(null)}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] uppercase tracking-wide
                       text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <X className="w-3 h-3" />
            clear
          </button>
        )}
      </div>

      <div className="flex gap-3">
        {/* Reference preview */}
        <div className={cn(
          'w-20 h-20 rounded-lg border-2 border-dashed flex-shrink-0 overflow-hidden',
          hasReference ? 'border-cyan-500/40' : 'border-slate-700/50'
        )}>
          {hasReference ? (
            <img
              src={referenceImage}
              alt="Reference"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-6 h-6 text-slate-600" />
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex-1 space-y-2">
          <p className="font-mono text-[10px] text-slate-500 leading-relaxed">
            use a reference image to influence avatar style and features
          </p>

          {currentAvatarUrl && !hasReference && (
            <motion.button
              onClick={() => onSetReference(currentAvatarUrl)}
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-wide
                         bg-slate-800/60 border border-slate-700/50 text-slate-400
                         hover:text-cyan-400 hover:border-cyan-500/30
                         transition-all duration-200 disabled:opacity-50"
            >
              <Image className="w-3 h-3" />
              use_current_avatar
            </motion.button>
          )}

          {hasReference && (
            <span className="inline-block font-mono text-[10px] text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              reference_active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceSelector;
