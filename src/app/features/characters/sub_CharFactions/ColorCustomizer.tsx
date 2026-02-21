'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Palette, AlertCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { FactionBranding } from '@/app/types/Faction';
import FactionCard from './FactionCard';
import { validateFactionBrandingColors } from '@/app/utils/colorValidation';

interface ColorCustomizerProps {
  currentBranding?: FactionBranding;
  onSave: (branding: Partial<FactionBranding>) => void;
  onReset: () => void;
  factionName: string;
  factionId: string;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#71717a',
];

const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  currentBranding,
  onSave,
  onReset,
  factionName,
  factionId,
}) => {
  const [primaryColor, setPrimaryColor] = useState(
    currentBranding?.primary_color || PRESET_COLORS[0]
  );
  const [secondaryColor, setSecondaryColor] = useState(
    currentBranding?.secondary_color || PRESET_COLORS[5]
  );
  const [accentColor, setAccentColor] = useState(
    currentBranding?.accent_color || PRESET_COLORS[10]
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentBranding) {
      setPrimaryColor(currentBranding.primary_color);
      setSecondaryColor(currentBranding.secondary_color);
      setAccentColor(currentBranding.accent_color);
    }
  }, [currentBranding]);

  const handleSave = () => {
    // Validate all colors before saving
    const validation = validateFactionBrandingColors({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Clear any previous errors
    setValidationErrors({});

    // Save with sanitized colors
    onSave({
      primary_color: validation.sanitized.primary_color,
      secondary_color: validation.sanitized.secondary_color,
      accent_color: validation.sanitized.accent_color,
    });
  };

  const handleReset = () => {
    setPrimaryColor(currentBranding?.primary_color || PRESET_COLORS[0]);
    setSecondaryColor(currentBranding?.secondary_color || PRESET_COLORS[5]);
    setAccentColor(currentBranding?.accent_color || PRESET_COLORS[10]);
    setValidationErrors({});
    onReset();
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent', value: string) => {
    // Clear error for this field when user changes it
    const newErrors = { ...validationErrors };
    delete newErrors[`${colorType}_color`];
    setValidationErrors(newErrors);

    switch (colorType) {
      case 'primary':
        setPrimaryColor(value);
        break;
      case 'secondary':
        setSecondaryColor(value);
        break;
      case 'accent':
        setAccentColor(value);
        break;
    }
  };

  // Create a preview faction object
  const previewFaction = {
    id: factionId,
    name: factionName,
    description: 'Live preview of your faction with selected colors',
    project_id: '',
    color: primaryColor,
    branding: {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      emblem_style: currentBranding?.emblem_style || ('shield' as const),
      banner_template: currentBranding?.banner_template || ('standard' as const),
      theme_tier: currentBranding?.theme_tier || ('free' as const),
    },
  };

  return (
    <div className="space-y-6">
      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg"
        >
          <div className="flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium mb-1">Color Validation Errors:</div>
              <ul className="list-disc list-inside text-xs space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Color Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Primary Color */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-300">Primary Color</label>
          </div>
          <div className="space-y-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => handleColorChange('primary', e.target.value)}
              className="w-full h-12 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
              data-testid="primary-color-input"
            />
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange('primary', color)}
                  className={cn('w-8 h-8 rounded-lg transition-all',
                    primaryColor === color
                      ? 'ring-2 ring-white scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  data-testid={`primary-preset-${color}`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 font-mono">{primaryColor}</div>
            {validationErrors.primary_color && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.primary_color}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Color */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-300">Secondary Color</label>
          </div>
          <div className="space-y-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => handleColorChange('secondary', e.target.value)}
              className="w-full h-12 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
              data-testid="secondary-color-input"
            />
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.slice(5, 15).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange('secondary', color)}
                  className={cn('w-8 h-8 rounded-lg transition-all',
                    secondaryColor === color
                      ? 'ring-2 ring-white scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  data-testid={`secondary-preset-${color}`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 font-mono">{secondaryColor}</div>
            {validationErrors.secondary_color && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.secondary_color}
              </div>
            )}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-300">Accent Color</label>
          </div>
          <div className="space-y-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => handleColorChange('accent', e.target.value)}
              className="w-full h-12 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
              data-testid="accent-color-input"
            />
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.slice(10, 20).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange('accent', color)}
                  className={cn('w-8 h-8 rounded-lg transition-all',
                    accentColor === color
                      ? 'ring-2 ring-white scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  data-testid={`accent-preset-${color}`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 font-mono">{accentColor}</div>
            {validationErrors.accent_color && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={12} />
                {validationErrors.accent_color}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live Preview
        </h4>
        <div className="max-w-sm mx-auto">
          <FactionCard
            faction={previewFaction}
            onSelect={() => {}}
            isNew={false}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          data-testid="reset-colors-btn"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          data-testid="save-colors-btn"
        >
          <Save size={16} />
          Save Colors
        </button>
      </div>
    </div>
  );
};

export default ColorCustomizer;
