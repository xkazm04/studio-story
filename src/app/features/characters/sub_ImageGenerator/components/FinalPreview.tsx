/**
 * FinalPreview - Final image display with save action
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Image, Download, Plus, Sparkles } from 'lucide-react';
import { GeneratedImage } from '../../hooks/useImageGenerator';

interface FinalPreviewProps {
  finalImage: GeneratedImage | null;
  selectedSketch: GeneratedImage | null;
  isGenerating: boolean;
  onGenerate: () => void;
  onAddToGallery: (image: GeneratedImage) => void;
  canGenerate: boolean;
}

const FinalPreview: React.FC<FinalPreviewProps> = ({
  finalImage,
  selectedSketch,
  isGenerating,
  onGenerate,
  onAddToGallery,
  canGenerate,
}) => {
  // Loading state
  if (isGenerating) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            generating_final
          </h3>
        </div>
        <div className="aspect-[3/4] rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500/50 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs text-slate-400">
              enhancing_to_final_quality...
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              768x1024
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Final image display
  if (finalImage) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              final_image
            </h3>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            high_quality
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="aspect-[3/4] rounded-lg overflow-hidden border border-slate-700/50 shadow-lg">
            <img
              src={finalImage.url}
              alt="Final character"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onAddToGallery(finalImage)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-wide
                         bg-cyan-600 hover:bg-cyan-500 text-white
                         transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
              add_to_gallery
            </button>
            <a
              href={finalImage.url}
              download={`character-${Date.now()}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-mono text-xs uppercase tracking-wide
                         bg-slate-700 hover:bg-slate-600 text-slate-200
                         transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Ready to generate state
  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-4 h-4 text-slate-500" />
        <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
          final_image
        </h3>
      </div>

      <div className="aspect-[3/4] rounded-lg bg-slate-800/30 border border-dashed border-slate-700/50 flex flex-col items-center justify-center gap-3">
        {selectedSketch ? (
          <>
            <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-600 opacity-60">
              <img
                src={selectedSketch.url}
                alt="Selected sketch"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-mono text-xs text-slate-400 text-center px-4">
              ready to enhance selected sketch
            </span>
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wide
                         bg-amber-600 hover:bg-amber-500 text-white
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              generate_final
            </button>
          </>
        ) : (
          <>
            <Image className="w-10 h-10 text-slate-600" />
            <span className="font-mono text-xs text-slate-500 text-center px-4">
              // select_a_sketch_first
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default FinalPreview;
