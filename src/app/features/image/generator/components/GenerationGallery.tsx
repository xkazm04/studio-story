'use client';

import React from 'react';
import { Check, Loader2, RefreshCw } from 'lucide-react';

interface GenerationImage {
  id: string;
  url: string;
}

interface GenerationGalleryProps {
  images: GenerationImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  isConfirming: boolean;
  onRegenerate?: () => void;
}

/**
 * 2x2 grid of generated illustration alternatives.
 * User selects one, then confirms to persist as scene illustration.
 */
const GenerationGallery: React.FC<GenerationGalleryProps> = ({
  images,
  selectedId,
  onSelect,
  onConfirm,
  isConfirming,
  onRegenerate,
}) => {
  return (
    <div className="space-y-3">
      {/* 2x2 Image Grid */}
      <div className="grid grid-cols-2 gap-2">
        {images.map((image) => {
          const isSelected = image.id === selectedId;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelect(image.id)}
              className={`
                relative rounded-lg overflow-hidden border-2 transition-all duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
                ${
                  isSelected
                    ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                    : 'border-slate-700 hover:border-slate-500'
                }
              `}
            >
              <img
                src={image.url}
                alt={`Generated illustration ${image.id}`}
                className="w-full aspect-[4/3] object-cover"
              />
              {/* Selected check overlay */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!selectedId || isConfirming}
          className={`
            flex-1 py-2.5 rounded-lg font-medium text-sm
            flex items-center justify-center gap-2 transition-colors duration-200
            ${
              !selectedId || isConfirming
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-400'
            }
          `}
        >
          {isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Use this image'
          )}
        </button>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isConfirming}
            className="px-3 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GenerationGallery;
