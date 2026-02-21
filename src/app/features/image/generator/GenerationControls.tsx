'use client';

import React from 'react';

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

const imageSizes = [
  { label: '512x512', width: 512, height: 512 },
  { label: '768x768', width: 768, height: 768 },
  { label: '1024x1024', width: 1024, height: 1024 },
  { label: '1024x768', width: 1024, height: 768 },
  { label: '768x1024', width: 768, height: 1024 },
];

const providers = [
  { value: 'leonardo' as const, label: 'Leonardo AI' },
  { value: 'stability' as const, label: 'Stability AI' },
  { value: 'dalle' as const, label: 'DALL-E' },
  { value: 'local' as const, label: 'Local (ComfyUI)' },
];

const GenerationControls: React.FC<GenerationControlsProps> = ({ params, onChange }) => {
  const handleChange = (field: keyof GenerationParams, value: number | string) => {
    onChange({
      ...params,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Image Size */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Image Size
        </label>
        <div className="grid grid-cols-3 gap-2">
          {imageSizes.map((size) => {
            const isSelected = params.width === size.width && params.height === size.height;
            return (
              <button
                key={size.label}
                onClick={() => {
                  handleChange('width', size.width);
                  handleChange('height', size.height);
                }}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Provider
        </label>
        <select
          value={params.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label className="block text-sm font-medium text-gray-300 mb-2">
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
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Faster</span>
          <span>Better Quality</span>
        </div>
      </div>

      {/* CFG Scale */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
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
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Creative</span>
          <span>Strict</span>
        </div>
      </div>

      {/* Number of Images */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
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
