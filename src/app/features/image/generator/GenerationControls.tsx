'use client';

import React, { useState } from 'react';

interface GenerationParams {
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  num_images: number;
  provider: 'leonardo' | 'stability' | 'midjourney' | 'dalle' | 'local';
}

interface GenerationControlsProps {
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
}

type SizeCategory = 'all' | 'square' | 'landscape' | 'portrait';

const imageSizes = [
  { label: '512×512',   width: 512,  height: 512,  category: 'square'    as SizeCategory },
  { label: '768×768',   width: 768,  height: 768,  category: 'square'    as SizeCategory },
  { label: '1024×1024', width: 1024, height: 1024, category: 'square'    as SizeCategory },
  { label: '1024×768',  width: 1024, height: 768,  category: 'landscape' as SizeCategory },
  { label: '1536×1024', width: 1536, height: 1024, category: 'landscape' as SizeCategory },
  { label: '1152×896',  width: 1152, height: 896,  category: 'landscape' as SizeCategory },
  { label: '768×1024',  width: 768,  height: 1024, category: 'portrait'  as SizeCategory },
  { label: '1024×1536', width: 1024, height: 1536, category: 'portrait'  as SizeCategory },
  { label: '896×1152',  width: 896,  height: 1152, category: 'portrait'  as SizeCategory },
];

const SIZE_FILTERS: { value: SizeCategory; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'square',    label: 'Square' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'portrait',  label: 'Portrait' },
];

const MAX_DIM = 44;

function getBoxDimensions(width: number, height: number) {
  if (width >= height) {
    return { boxW: MAX_DIM, boxH: Math.round(MAX_DIM * (height / width)) };
  }
  return { boxW: Math.round(MAX_DIM * (width / height)), boxH: MAX_DIM };
}

const providers = [
  { value: 'leonardo' as const, label: 'Leonardo AI' },
  { value: 'stability' as const, label: 'Stability AI' },
  { value: 'dalle' as const, label: 'DALL-E' },
  { value: 'local' as const, label: 'Local (ComfyUI)' },
];

const GenerationControls: React.FC<GenerationControlsProps> = ({ params, onChange }) => {
  const [sizeFilter, setSizeFilter] = useState<SizeCategory>('all');

  const handleChange = (field: keyof GenerationParams, value: number | string) => {
    onChange({
      ...params,
      [field]: value,
    });
  };

  const filteredSizes = sizeFilter === 'all'
    ? imageSizes
    : imageSizes.filter((s) => s.category === sizeFilter);

  return (
    <div className="space-y-4">
      {/* Image Size */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Image Size
        </label>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-3">
          {SIZE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSizeFilter(f.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                sizeFilter === f.value
                  ? 'bg-slate-700 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Visual ratio grid */}
        <div className="grid grid-cols-3 gap-2">
          {filteredSizes.map((size) => {
            const isSelected = params.width === size.width && params.height === size.height;
            const { boxW, boxH } = getBoxDimensions(size.width, size.height);
            return (
              <button
                key={size.label}
                onClick={() => onChange({ ...params, width: size.width, height: size.height })}
                className={`flex flex-col items-center justify-end gap-1.5 py-2.5 px-1 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/10 border border-cyan-500/40'
                    : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-end justify-center" style={{ height: `${MAX_DIM}px` }}>
                  <div
                    style={{ width: boxW, height: boxH }}
                    className={`rounded-sm border ${
                      isSelected
                        ? 'border-cyan-500/60 bg-cyan-500/15'
                        : 'border-slate-600 bg-slate-700/40'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${
                  isSelected ? 'text-cyan-300' : 'text-slate-400'
                }`}>
                  {size.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Provider
        </label>
        <select
          value={params.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {providers.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Steps: {params.steps}
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={params.steps}
          onChange={(e) => handleChange('steps', parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-sm text-slate-400 mt-1">
          <span>Faster</span>
          <span>Better Quality</span>
        </div>
      </div>

      {/* CFG Scale */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          CFG Scale: {params.cfg_scale}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="0.5"
          value={params.cfg_scale}
          onChange={(e) => handleChange('cfg_scale', parseFloat(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-sm text-slate-400 mt-1">
          <span>Creative</span>
          <span>Strict</span>
        </div>
      </div>

      {/* Number of Images */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Number of Images: {params.num_images}
        </label>
        <input
          type="range"
          min="1"
          max="8"
          step="1"
          value={params.num_images}
          onChange={(e) => handleChange('num_images', parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>
    </div>
  );
};

export default GenerationControls;
